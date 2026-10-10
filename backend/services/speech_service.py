"""
Athena Studio — Speech Service & Swappable TTS Provider Architecture

Architecture:
Studio
  ↓
SpeechService
  ↓
Provider Adapter
  ↓
TTS Provider (Edge TTS / OpenAI TTS / Future Extensible)
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
import io
import hashlib
import asyncio
import aiohttp
import edge_tts
from openai import OpenAI
from config import OPENAI_API_KEY

# ============================================================================
# 1. STUDIO VOICE BASELINE (FROZEN COMPARISON REFERENCE)
# ============================================================================
# Frozen baseline configuration. Do not modify or destroy this mapping.
STUDIO_VOICE_BASELINE = {
    "provider": "edge",
    "voices": {
        "en": "en-IN-NeerjaExpressiveNeural",
        "hi": "hi-IN-SwaraNeural",
        "ta": "ta-IN-PallaviNeural",
        "te": "te-IN-ShrutiNeural",
        "mr": "mr-IN-AarohiNeural",
        "gu": "gu-IN-DhwaniNeural",
    },
    "locales": {
        "en": "en-IN",
        "hi": "hi-IN",
        "ta": "ta-IN",
        "te": "te-IN",
        "mr": "mr-IN",
        "gu": "gu-IN",
    },
    "speeds": {
        "en": 0.96,
        "hi": 0.96,
        "ta": 0.95,
        "te": 0.95,
        "mr": 0.95,
        "gu": 0.95,
    },
    "personas": {
        "en": "Neerja (Calm, warm, grounded mindfulness instructor, unhurried presence)",
        "hi": "Swara (Conversational, warm, natural Devanagari elocution, non-theatrical)",
        "ta": "Pallavi (Natural spoken modern Tamil guide, authentic retroflex)",
        "te": "Shruti (Peaceful, warm Telugu mindfulness guide with gentle vowel cadence)",
        "mr": "Aarohi (Warm, comforting Maharashtrian presence with soothing speech rhythm)",
        "gu": "Dhwani (Grounded, reassuring Gujarati presence with clear phonetics & calm rhythm)",
    }
}

# ============================================================================
# 2. CANDIDATE VOICE ALTERNATIVES FOR A/B EVALUATION
# ============================================================================
CANDIDATE_VOICE_ALTERNATIVES = {
    "en": {
        "baseline": {
            "label": "Current Athena Voice",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "en-IN-NeerjaExpressiveNeural",
            "speed": 0.96,
            "description": "Frozen Baseline: Indian English Expressive Neural"
        },
        "alt_a": {
            "label": "Alternative Voice A",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "nova",
            "speed": 0.92,
            "description": "OpenAI Nova HD (Warm, conversational, natural micro-intonation)"
        },
        "alt_b": {
            "label": "Alternative Voice B",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "shimmer",
            "speed": 0.92,
            "description": "OpenAI Shimmer HD (Soft, gentle therapeutic presence)"
        },
        "alt_c": {
            "label": "Alternative Voice C",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "en-US-AvaMultilingualNeural",
            "speed": 0.94,
            "description": "Edge Ava Multilingual Neural (Modern global conversational)"
        },
    },
    "hi": {
        "baseline": {
            "label": "Current Athena Voice",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "hi-IN-SwaraNeural",
            "speed": 0.96,
            "description": "Frozen Baseline: Swara Neural"
        },
        "alt_a": {
            "label": "Alternative Voice A",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "hi-IN-MadhurNeural",
            "speed": 0.95,
            "description": "Edge Madhur Neural (Male counterpart, warm grounded cadence)"
        },
        "alt_b": {
            "label": "Alternative Voice B",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "nova",
            "speed": 0.90,
            "description": "OpenAI Nova HD (Multilingual Hindi synthesis)"
        },
        "alt_c": {
            "label": "Alternative Voice C",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "shimmer",
            "speed": 0.90,
            "description": "OpenAI Shimmer HD (Multilingual Hindi synthesis)"
        },
    },
    "ta": {
        "baseline": {
            "label": "Current Athena Voice",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "ta-IN-PallaviNeural",
            "speed": 0.95,
            "description": "Frozen Baseline: Pallavi Neural"
        },
        "alt_a": {
            "label": "Alternative Voice A",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "ta-IN-ValluvarNeural",
            "speed": 0.94,
            "description": "Edge Valluvar Neural (Male counterpart, formal articulation)"
        },
        "alt_b": {
            "label": "Alternative Voice B",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "nova",
            "speed": 0.88,
            "description": "OpenAI Nova HD (Multilingual Tamil synthesis test)"
        },
        "alt_c": {
            "label": "Alternative Voice C",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "shimmer",
            "speed": 0.88,
            "description": "OpenAI Shimmer HD (Multilingual Tamil synthesis test)"
        },
    },
    "te": {
        "baseline": {
            "label": "Current Athena Voice",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "te-IN-ShrutiNeural",
            "speed": 0.95,
            "description": "Frozen Baseline: Shruti Neural"
        },
        "alt_a": {
            "label": "Alternative Voice A",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "te-IN-MohanNeural",
            "speed": 0.94,
            "description": "Edge Mohan Neural (Male counterpart)"
        },
        "alt_b": {
            "label": "Alternative Voice B",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "nova",
            "speed": 0.90,
            "description": "OpenAI Nova HD (Multilingual Telugu synthesis test)"
        },
        "alt_c": {
            "label": "Alternative Voice C",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "shimmer",
            "speed": 0.90,
            "description": "OpenAI Shimmer HD (Multilingual Telugu synthesis test)"
        },
    },
    "mr": {
        "baseline": {
            "label": "Current Athena Voice",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "mr-IN-AarohiNeural",
            "speed": 0.95,
            "description": "Frozen Baseline: Aarohi Neural"
        },
        "alt_a": {
            "label": "Alternative Voice A",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "mr-IN-ManoharNeural",
            "speed": 0.94,
            "description": "Edge Manohar Neural (Male counterpart)"
        },
        "alt_b": {
            "label": "Alternative Voice B",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "nova",
            "speed": 0.90,
            "description": "OpenAI Nova HD (Multilingual Marathi synthesis test)"
        },
        "alt_c": {
            "label": "Alternative Voice C",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "shimmer",
            "speed": 0.90,
            "description": "OpenAI Shimmer HD (Multilingual Marathi synthesis test)"
        },
    },
    "gu": {
        "baseline": {
            "label": "Current Athena Voice",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "gu-IN-DhwaniNeural",
            "speed": 0.95,
            "description": "Frozen Baseline: Dhwani Neural"
        },
        "alt_a": {
            "label": "Alternative Voice A",
            "provider": "edge",
            "model": "edge-neural",
            "voice": "gu-IN-NiranjanNeural",
            "speed": 0.94,
            "description": "Edge Niranjan Neural (Male counterpart)"
        },
        "alt_b": {
            "label": "Alternative Voice B",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "nova",
            "speed": 0.90,
            "description": "OpenAI Nova HD (Multilingual Gujarati synthesis test)"
        },
        "alt_c": {
            "label": "Alternative Voice C",
            "provider": "openai",
            "model": "tts-1-hd",
            "voice": "shimmer",
            "speed": 0.90,
            "description": "OpenAI Shimmer HD (Multilingual Gujarati synthesis test)"
        },
    },
}

# ============================================================================
# 3. NATIVE CALM SCRIPTS (AUTHENTIC NON-TRANSLATED HUMAN INSTRUCTION)
# ============================================================================
NATIVE_EVALUATION_SCRIPTS = {
    "en": """Take a slow breath in.

And when you're ready,
let it go gently.

You don't need to change anything right now.

Just stay here for a moment.""",

    "hi": """एक गहरा, धीमा सांस अंदर लीजिए...

और जब आप तैयार हों,
तो इसे धीरे से बाहर छोड़ दीजिए।

इस समय आपको कुछ भी बदलने की ज़रूरत नहीं है।

बस थोड़ी देर यहीं बने रहिए।""",

    "ta": """மெதுவா ஒரு ஆழ்ந்த மூச்சை உள்ளே இழுங்க...

உங்களுக்கு தோணும்போது,
அப்படியே மெதுவா வெளியே விடுங்க.

இப்போதைக்கு நீங்க எதையும் மாத்த தேவையில்லை.

கொஞ்ச நேரம் அமைதியா அப்படியே இருங்க.""",

    "te": """ఒక్కసారి నెమ్మదిగా శ్వాస లోపలికి తీసుకోండి...

మీకు వీలైనప్పుడు,
శాంతంగా దాన్ని బయటకు వదిలేయండి.

ఈ సమయంలో మీరు ఏమీ మార్చాల్సిన పనిలేదు.

కాసేపు ప్రశాంతంగా ఇలాగే ఉండండి.""",

    "mr": """हळूच एक संथ श्वास आत घ्या...

आणि जेव्हा तुमची तयारी असेल,
तेव्हा अलगदपणे तो बाहेर सोडा.

या क्षणी तुम्हाला काहीही बदलण्याची गरज नाही.

फक्त थोडा वेळ इथेच शांत राहा.""",

    "gu": """ધીમેથી એક ઊંડો શ્વાસ અંદર લો...

અને જ્યારે તમે તૈયાર હો,
ત્યારે હળવેથી તેને બહાર નીકળવા દો.

અત્યારે તમારે કશુંય બદલવાની જરૂર નથી.

બસ થોડી ક્ષણ અહીં શાંતિથી રહો."""
}

# ============================================================================
# 4. PROVIDER ADAPTER PATTERN
# ============================================================================
class TTSProviderAdapter(ABC):
    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique provider identifier (e.g. 'edge', 'openai')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider name."""
        pass

    @property
    @abstractmethod
    def available_models(self) -> List[str]:
        """List of supported models for this provider."""
        pass

    @abstractmethod
    def supports_language(self, language: str) -> bool:
        """Whether this provider can generate speech for the given language code."""
        pass

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice: str,
        model: Optional[str] = None,
        speed: float = 1.0,
        pitch: str = "+0Hz",
        locale: str = "en-IN"
    ) -> bytes:
        """Generates raw speech audio bytes."""
        pass


class EdgeTTSAdapter(TTSProviderAdapter):
    @property
    def provider_id(self) -> str:
        return "edge"

    @property
    def display_name(self) -> str:
        return "Microsoft Edge Neural TTS"

    @property
    def available_models(self) -> List[str]:
        return ["edge-neural"]

    def supports_language(self, language: str) -> bool:
        return language.lower() in STUDIO_VOICE_BASELINE["voices"]

    async def synthesize(
        self,
        text: str,
        voice: str,
        model: Optional[str] = None,
        speed: float = 1.0,
        pitch: str = "+0Hz",
        locale: str = "en-IN"
    ) -> bytes:
        rate_pct = int(round((speed - 1.0) * 100))
        rate_str = f"{rate_pct:+d}%"

        # Edge TTS Communicate instance with rate, pitch, and neutral volume
        communicate = edge_tts.Communicate(text, voice, rate=rate_str, pitch=pitch, volume="+0%")

        # Upgrade outputFormat to 96kbps CBR and correct synthesis locale in SSML
        orig_send_str = aiohttp.ClientWebSocketResponse.send_str
        async def studio_fidelity_send_str(ws_self, data, *args, **kwargs):
            if isinstance(data, str):
                if "outputFormat" in data:
                    data = data.replace(
                        '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"',
                        '"outputFormat":"audio-24khz-96kbitrate-mono-mp3"'
                    )
                if "xml:lang='en-US'" in data:
                    data = data.replace("xml:lang='en-US'", f"xml:lang='{locale}'")
            return await orig_send_str(ws_self, data, *args, **kwargs)

        audio_data = b""
        aiohttp.ClientWebSocketResponse.send_str = studio_fidelity_send_str
        try:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
        finally:
            aiohttp.ClientWebSocketResponse.send_str = orig_send_str

        return audio_data


class OpenAITTSAdapter(TTSProviderAdapter):
    def __init__(self):
        self._client: Optional[OpenAI] = None

    def _get_client(self) -> OpenAI:
        if not self._client:
            if not OPENAI_API_KEY:
                raise RuntimeError("OpenAI API key not configured")
            self._client = OpenAI(api_key=OPENAI_API_KEY)
        return self._client

    @property
    def provider_id(self) -> str:
        return "openai"

    @property
    def display_name(self) -> str:
        return "OpenAI Neural TTS"

    @property
    def available_models(self) -> List[str]:
        return ["tts-1", "tts-1-hd"]

    def supports_language(self, language: str) -> bool:
        # OpenAI TTS supports multi-lingual text generation across scripts
        return True

    async def synthesize(
        self,
        text: str,
        voice: str,
        model: Optional[str] = None,
        speed: float = 1.0,
        pitch: str = "+0Hz",
        locale: str = "en-IN"
    ) -> bytes:
        client = self._get_client()
        selected_model = model if model in ["tts-1", "tts-1-hd"] else "tts-1-hd"
        selected_voice = voice if voice in ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] else "nova"
        clamped_speed = max(0.70, min(speed, 1.25))

        loop = asyncio.get_event_loop()
        def _call_api():
            resp = client.audio.speech.create(
                model=selected_model,
                voice=selected_voice,
                input=text,
                speed=clamped_speed
            )
            return resp.content

        return await loop.run_in_executor(None, _call_api)


# ============================================================================
# 5. SPEECH SERVICE (CENTRAL ORCHESTRATOR)
# ============================================================================
class SpeechService:
    """
    Central speech orchestration service.
    Decouples Athena Studio from specific underlying TTS vendors.
    """
    def __init__(self):
        self._adapters: Dict[str, TTSProviderAdapter] = {
            "edge": EdgeTTSAdapter(),
            "openai": OpenAITTSAdapter(),
        }
        self._cache: Dict[str, bytes] = {}

    def get_adapter(self, provider_id: str) -> Optional[TTSProviderAdapter]:
        return self._adapters.get(provider_id.lower())

    def list_providers(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": adapter.provider_id,
                "name": adapter.display_name,
                "models": adapter.available_models,
                "is_configured": True if adapter.provider_id == "edge" or bool(OPENAI_API_KEY) else False,
            }
            for adapter in self._adapters.values()
        ]

    async def generate_speech(
        self,
        text: str,
        language: str = "en",
        locale: Optional[str] = None,
        voice: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        speed: Optional[float] = None,
        pitch: Optional[str] = "+0Hz",
    ) -> tuple[bytes, Dict[str, str]]:
        """
        Unified internal interface:
        generateSpeech({ text, language, locale, voice, model, speed })
        """
        lang = (language or "en").lower().strip()
        if lang not in STUDIO_VOICE_BASELINE["voices"]:
            lang = "en"

        # Determine target provider & voice defaults
        chosen_provider = (provider or "").lower().strip()
        req_voice = (voice or "").strip()

        # If provider not explicitly given, infer from voice ID or default to baseline
        if not chosen_provider or chosen_provider == "auto":
            if req_voice in ["nova", "shimmer", "alloy", "echo", "fable", "onyx"]:
                chosen_provider = "openai"
            else:
                chosen_provider = "edge"

        adapter = self.get_adapter(chosen_provider)
        if not adapter:
            # Fallback to Edge baseline adapter
            chosen_provider = "edge"
            adapter = self.get_adapter("edge")

        # Determine voice choice
        if not req_voice:
            if chosen_provider == "openai":
                req_voice = "nova"
            else:
                req_voice = STUDIO_VOICE_BASELINE["voices"].get(lang, "en-IN-NeerjaExpressiveNeural")

        # Determine speed
        if speed is None:
            speed_val = STUDIO_VOICE_BASELINE["speeds"].get(lang, 0.96)
        else:
            speed_val = round(max(0.65, min(speed, 1.30)), 2)

        # Determine model
        if not model:
            model = "tts-1-hd" if chosen_provider == "openai" else "edge-neural"

        loc_str = locale or STUDIO_VOICE_BASELINE["locales"].get(lang, "en-IN")
        pitch_val = pitch or "+0Hz"

        # Check Cache
        cache_key = f"{chosen_provider}:{model}:{req_voice}:{speed_val}:{pitch_val}:{hashlib.sha256(text.encode('utf-8')).hexdigest()}"
        if cache_key in self._cache:
            audio_bytes = self._cache[cache_key]
        else:
            try:
                audio_bytes = await adapter.synthesize(
                    text=text,
                    voice=req_voice,
                    model=model,
                    speed=speed_val,
                    pitch=pitch_val,
                    locale=loc_str
                )
                if audio_bytes and len(audio_bytes) > 100:
                    self._cache[cache_key] = audio_bytes
            except Exception as e:
                print(f"[SpeechService Error] Provider {chosen_provider} failed: {e}. Trying fallback...")
                # If OpenAI fails or key missing, fallback to Edge
                if chosen_provider != "edge":
                    edge_adapter = self.get_adapter("edge")
                    fallback_voice = STUDIO_VOICE_BASELINE["voices"].get(lang, "en-IN-NeerjaExpressiveNeural")
                    audio_bytes = await edge_adapter.synthesize(
                        text=text,
                        voice=fallback_voice,
                        model="edge-neural",
                        speed=speed_val,
                        pitch=pitch_val,
                        locale=loc_str
                    )
                    chosen_provider = "edge"
                    req_voice = fallback_voice
                    model = "edge-neural"
                else:
                    raise

        headers = {
            "Content-Length": str(len(audio_bytes)),
            "X-Voice-Provider": chosen_provider,
            "X-Voice-Model": model or "default",
            "X-Voice-Id": req_voice,
            "X-Voice-Locale": loc_str,
            "X-Voice-Language": lang,
            "X-Voice-Speed": str(speed_val),
            "X-Audio-Codec": "audio/mpeg",
        }
        return audio_bytes, headers


# Global Singleton Service
speech_service = SpeechService()
