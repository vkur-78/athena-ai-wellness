import os
import time
import logging
from typing import List, Dict, Any, Generator, Optional, Tuple
from openai import OpenAI, RateLimitError, APITimeoutError, APIConnectionError, InternalServerError, AuthenticationError

from config import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_BASE_URL
)

logger = logging.getLogger("athena.ai.provider")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [AI Provider] %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


class AIProviderError(Exception):
    def __init__(self, provider: str, category: str, message: str, status_code: Optional[int] = None):
        super().__init__(f"[{provider}] {category}: {message}")
        self.provider = provider
        self.category = category
        self.message = message
        self.status_code = status_code


class AllProvidersFailedError(Exception):
    def __init__(self, errors: List[AIProviderError]):
        super().__init__(f"All AI providers failed: {'; '.join(str(e) for e in errors)}")
        self.errors = errors


def classify_error(provider: str, exc: Exception) -> AIProviderError:
    """Classifies provider exceptions into distinct, actionable operational categories without leaking secrets."""
    err_str = str(exc).lower()
    status_code = getattr(exc, "status_code", None)

    if isinstance(exc, RateLimitError) or "429" in err_str:
        if any(term in err_str for term in ["insufficient_quota", "credit_balance_exhausted", "quota", "billing"]):
            return AIProviderError(provider, "QUOTA_EXHAUSTED", "Account quota or credits exhausted", status_code=429)
        return AIProviderError(provider, "RATE_LIMIT", "Rate limit exceeded; temporary backoff needed", status_code=429)

    if isinstance(exc, APITimeoutError) or "timeout" in err_str or "timed out" in err_str:
        return AIProviderError(provider, "TIMEOUT", "Request timed out", status_code=408)

    if isinstance(exc, APIConnectionError) or "connection" in err_str or "network" in err_str:
        return AIProviderError(provider, "NETWORK_ERROR", "Network connection error", status_code=503)

    if isinstance(exc, InternalServerError) or any(c in err_str for c in ["500", "502", "503", "504", "unavailable"]):
        return AIProviderError(provider, "SERVER_ERROR", "Provider internal server error", status_code=500)

    if isinstance(exc, AuthenticationError) or any(c in err_str for c in ["401", "unauthorized", "invalid_api_key", "forbidden", "403"]):
        return AIProviderError(provider, "CONFIG_ERROR", "Authentication or configuration rejected by provider", status_code=401)

    return AIProviderError(provider, "UNKNOWN_ERROR", f"Unclassified error: {type(exc).__name__}", status_code=status_code)


class AIProviderService:
    """
    Server-side AI Provider Orchestration Service.
    Enforces automatic failover from primary (OpenAI) to secondary (Google Gemini)
    with bounded execution, error classification, secret-free logging, and streaming continuity.
    """

    def __init__(self):
        self._openai_client: Optional[OpenAI] = None
        self._gemini_client: Optional[OpenAI] = None
        self._openai_exhausted_until: float = 0.0
        self.init_clients()

    def init_clients(self):
        # Primary: OpenAI
        if OPENAI_API_KEY:
            try:
                self._openai_client = OpenAI(
                    api_key=OPENAI_API_KEY,
                    timeout=14.0
                )
            except Exception as e:
                logger.warning(f"OpenAI client initialization notice: {type(e).__name__}")
                self._openai_client = None
        else:
            self._openai_client = None

        # Secondary: Google Gemini (via official OpenAI-compatible endpoint)
        if GEMINI_API_KEY:
            try:
                self._gemini_client = OpenAI(
                    api_key=GEMINI_API_KEY,
                    base_url=GEMINI_BASE_URL or "https://generativelanguage.googleapis.com/v1beta/openai/",
                    timeout=45.0
                )
            except Exception as e:
                logger.warning(f"Gemini client initialization notice: {type(e).__name__}")
                self._gemini_client = None
        else:
            self._gemini_client = None

    def get_provider_status(self) -> Dict[str, Any]:
        """Returns structured provider configuration status without revealing secret keys."""
        circuit_open = time.time() < self._openai_exhausted_until
        return {
            "primary": {
                "name": "OpenAI",
                "configured": bool(OPENAI_API_KEY),
                "model": OPENAI_MODEL or "gpt-4o-mini",
                "circuit_status": "quota_paused_failover_active" if circuit_open else "active"
            },
            "secondary": {
                "name": "Google Gemini",
                "configured": bool(GEMINI_API_KEY),
                "model": GEMINI_MODEL or "gemini-3.1-flash-lite",
                "status": "ready"
            },
            "failover_ready": bool(GEMINI_API_KEY)
        }

    def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.75,
        max_tokens: int = 600,
        force_provider: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Executes completion with automatic failover.
        Returns: (reply_text, provider_used)
        Raises: AllProvidersFailedError if both providers fail.
        """
        errors: List[AIProviderError] = []

        skip_openai = (force_provider == "gemini")
        if not skip_openai and time.time() < self._openai_exhausted_until:
            skip_openai = True
            logger.info("OpenAI quota circuit-breaker active; routing directly to secondary provider to eliminate latency.")

        # 1. Try Primary (OpenAI) if not forced otherwise and circuit is closed
        if not skip_openai:
            if self._openai_client:
                start_time = time.time()
                try:
                    logger.info(f"Attempting completion with primary provider (OpenAI / {OPENAI_MODEL})")
                    resp = self._openai_client.chat.completions.create(
                        model=OPENAI_MODEL or "gpt-4o-mini",
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    content = resp.choices[0].message.content if resp.choices else ""
                    if content and content.strip():
                        duration = round(time.time() - start_time, 2)
                        logger.info(f"Primary provider (OpenAI) succeeded in {duration}s")
                        self._openai_exhausted_until = 0.0
                        return content.strip(), "openai"
                    else:
                        raise AIProviderError("openai", "INVALID_OUTPUT", "Primary provider returned empty output")
                except Exception as exc:
                    classified = classify_error("openai", exc)
                    errors.append(classified)
                    if classified.category == "QUOTA_EXHAUSTED":
                        # Open circuit for 10 minutes to save user from 3-4s latency penalty on every turn
                        self._openai_exhausted_until = time.time() + 600
                    logger.warning(
                        f"Primary provider (OpenAI) failed [{classified.category}]: {classified.message}. Initiating failover..."
                    )
            else:
                errors.append(AIProviderError("openai", "CONFIG_MISSING", "OpenAI API key not configured"))

        # 2. Failover to Secondary (Google Gemini)
        if self._gemini_client:
            start_time = time.time()
            try:
                target_model = GEMINI_MODEL or "gemini-3.1-flash-lite"
                logger.info(f"Attempting failover completion with secondary provider (Gemini / {target_model})")
                resp = self._gemini_client.chat.completions.create(
                    model=target_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=45.0
                )
                content = resp.choices[0].message.content if resp.choices else ""
                if content and content.strip():
                    duration = round(time.time() - start_time, 2)
                    logger.info(f"Secondary provider (Gemini) succeeded in {duration}s")
                    return content.strip(), "gemini"
                else:
                    raise AIProviderError("gemini", "INVALID_OUTPUT", "Gemini returned empty output")
            except Exception as exc:
                classified = classify_error("gemini", exc)
                errors.append(classified)
                logger.error(f"Secondary provider (Gemini) failed [{classified.category}]: {classified.message}")
        else:
            errors.append(AIProviderError("gemini", "CONFIG_MISSING", "Gemini API key not configured"))

        raise AllProvidersFailedError(errors)

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.75,
        max_tokens: int = 600,
        force_provider: Optional[str] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Streams completion tokens with automatic failover.
        Yields dictionaries:
          {"type": "token", "content": str, "provider": str}
          {"type": "failover", "from": str, "to": str, "reason": str}
          {"type": "error", "error": str}
        """
        errors: List[AIProviderError] = []

        skip_openai = (force_provider == "gemini")
        if not skip_openai and time.time() < self._openai_exhausted_until:
            skip_openai = True
            logger.info("OpenAI quota circuit-breaker active; streaming directly from secondary provider to eliminate latency.")

        # 1. Try Primary (OpenAI)
        if not skip_openai:
            if self._openai_client:
                start_time = time.time()
                streamed_any = False
                try:
                    logger.info(f"Attempting stream with primary provider (OpenAI / {OPENAI_MODEL})")
                    stream = self._openai_client.chat.completions.create(
                        model=OPENAI_MODEL or "gpt-4o-mini",
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True
                    )
                    for chunk in stream:
                        delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
                        if delta:
                            streamed_any = True
                            yield {"type": "token", "content": delta, "provider": "openai"}
                    logger.info("Primary provider (OpenAI) stream completed successfully")
                    self._openai_exhausted_until = 0.0
                    return
                except Exception as exc:
                    classified = classify_error("openai", exc)
                    errors.append(classified)
                    if classified.category == "QUOTA_EXHAUSTED":
                        self._openai_exhausted_until = time.time() + 600
                    logger.warning(f"Primary provider (OpenAI) stream failed [{classified.category}]: {classified.message}")
                    if streamed_any:
                        # If partial content was already delivered to client, do not silently restart from scratch
                        yield {
                            "type": "error",
                            "error": "The response was interrupted. Please send a quick follow-up to continue."
                        }
                        return
                    # Otherwise, notify of failover and attempt secondary
                    yield {"type": "failover", "from": "openai", "to": "gemini", "reason": classified.category}
            else:
                errors.append(AIProviderError("openai", "CONFIG_MISSING", "OpenAI API key not configured"))


        # 2. Failover to Secondary (Gemini)
        if self._gemini_client:
            try:
                target_model = GEMINI_MODEL or "gemini-3.1-flash-lite"
                logger.info(f"Attempting failover stream with secondary provider (Gemini / {target_model})")
                stream = self._gemini_client.chat.completions.create(
                    model=target_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                    timeout=45.0
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
                    if delta:
                        yield {"type": "token", "content": delta, "provider": "gemini"}
                logger.info("Secondary provider (Gemini) stream completed successfully")
                return
            except Exception as exc:
                classified = classify_error("gemini", exc)
                errors.append(classified)
                logger.error(f"Secondary provider (Gemini) stream failed [{classified.category}]: {classified.message}")
        else:
            errors.append(AIProviderError("gemini", "CONFIG_MISSING", "Gemini API key not configured"))

        # Both failed
        yield {
            "type": "error",
            "error": "I'm having a brief connection issue with my reflection engine. Your message is safe with me—please take a gentle breath and try sending it again in just a moment."
        }


# Global Provider Service Singleton
ai_provider_service = AIProviderService()
