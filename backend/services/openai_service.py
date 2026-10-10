from typing import Optional, List, Dict, Any, Generator
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL

def get_openai_client() -> Optional[OpenAI]:
    if not OPENAI_API_KEY:
        return None
    return OpenAI(api_key=OPENAI_API_KEY)

def generate_chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.75,
    max_tokens: int = 600
) -> str:
    client = get_openai_client()
    if not client:
        return "I hear the weight of what you're carrying, and I want you to know you are not alone. I'm right here with you."

    try:
        response = client.chat.completions.create(
            model=model or OPENAI_MODEL or "gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"[OpenAI Service Completion Error] {e}")
        return "I hear the weight of what you're carrying, and I want to acknowledge how much courage it takes to put these feelings into words. I'm right here with you. Take whatever time you need."

def generate_chat_stream(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.75,
    max_tokens: int = 600
) -> Generator[str, None, None]:
    client = get_openai_client()
    if not client:
        fallback_msg = "I hear the weight of what you're carrying, and I want you to know you are not alone. I'm right here with you. Take whatever time you need."
        for word in fallback_msg.split(" "):
            yield word + " "
        return

    try:
        stream_resp = client.chat.completions.create(
            model=model or OPENAI_MODEL or "gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        for chunk in stream_resp:
            delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
            if delta:
                yield delta
    except Exception as e:
        print(f"[OpenAI Service Stream Error] {e}")
        fallback_msg = "I hear the weight of what you're carrying, and I want you to know you are not alone. I'm right here with you."
        for word in fallback_msg.split(" "):
            yield word + " "
