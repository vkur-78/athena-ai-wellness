import io
import re
import hashlib
import tempfile
import asyncio
import aiohttp
import edge_tts
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from config import OPENAI_API_KEY
from auth.verify import verify_user, get_optional_user
from models.guided_session import VoiceScriptRequest, VoiceScriptResponse
from services.voice_session_orchestrator import orchestrate_session, get_available_personas

router = APIRouter()

def get_openai_client():
    return OpenAI(api_key=OPENAI_API_KEY)

from abc import ABC, abstractmethod

_TTS_CACHE: dict[str, bytes] = {}

class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    provider: Optional[str] = "auto"
    model: Optional[str] = None
    speed: Optional[float] = None
    pitch: Optional[str] = "+0Hz"
    language: Optional[str] = "en"
    locale: Optional[str] = None

# ==========================================
# LANGUAGE VOICE PROFILES (AUTHORITATIVE MAPPING)
# ==========================================

LANGUAGE_VOICE_PROFILES = {
    "ta": {
        "language": "Tamil",
        "native_name": "தமிழ்",
        "locale": "ta-IN",
        "provider": "edge",
        "primary_voice": "ta-IN-PallaviNeural",
        "alternative_voice": "ta-IN-ValluvarNeural",
        "gender": "Female",
        "persona": "Pallavi (Natural spoken modern Tamil guide, authentic retroflex & unhurried cadence)",
        "default_speed": 0.95,
        "sample_text": "உங்களுக்கு சௌகரியமா இருந்தா, கண்களை மெதுவா மூடிக்கோங்க... ஒரு அமைதியான மூச்சை உள்ளே இழுத்து, மெதுவா வெளியே விடும்போது தோள்களை லேசா தளர விடுங்கள். இப்போ இந்த நொடியை தவிர வேறெதுவும் முக்கியமில்ல.",
        "category_cadence": {
            "RESET": 0.96,
            "BREATHE": 0.94,
            "GROUND": 0.95,
            "RELAXATION": 0.94,
            "UNWIND": 0.95,
            "SLEEP": 0.92,
            "FOCUS": 0.98,
        },
    },
    "te": {
        "language": "Telugu",
        "native_name": "తెలుగు",
        "locale": "te-IN",
        "provider": "edge",
        "primary_voice": "te-IN-ShrutiNeural",
        "alternative_voice": "te-IN-MohanNeural",
        "gender": "Female",
        "persona": "Shruti (Peaceful, warm Telugu mindfulness guide with gentle vowel cadence)",
        "default_speed": 0.95,
        "sample_text": "మీకు వీలైతే, నెమ్మదిగా కళ్ళు మూసుకోండి... హాయిగా ఒక దీర్ఘ శ్వాస లోపలికి తీసుకుంటూ, వదిలేటప్పుడు భుజాలను తేలికగా వదిలేయండి. ఈ క్షణంలో మీరు ఎక్కడికీ వెళ్లాల్సిన అవసరం లేదు.",
        "category_cadence": {
            "RESET": 0.96,
            "BREATHE": 0.94,
            "GROUND": 0.95,
            "RELAXATION": 0.94,
            "UNWIND": 0.95,
            "SLEEP": 0.92,
            "FOCUS": 0.98,
        },
    },
    "hi": {
        "language": "Hindi",
        "native_name": "हिन्दी",
        "locale": "hi-IN",
        "provider": "edge",
        "primary_voice": "hi-IN-SwaraNeural",
        "alternative_voice": "hi-IN-MadhurNeural",
        "gender": "Female",
        "persona": "Swara (Conversational, warm, natural Devanagari elocution, non-theatrical)",
        "default_speed": 0.96,
        "sample_text": "अगर आप सहज महसूस कर रहे हैं, तो धीरे से आँखें बंद कर लीजिए... एक गहरा, शांत सांस अंदर लीजिए, और छोड़ते हुए कंधों को हल्का छोड़ दीजिए। इस पल कुछ भी साबित करने की ज़रूरत नहीं है।",
        "category_cadence": {
            "RESET": 0.96,
            "BREATHE": 0.94,
            "GROUND": 0.95,
            "RELAXATION": 0.94,
            "UNWIND": 0.95,
            "SLEEP": 0.92,
            "FOCUS": 0.98,
        },
    },
    "mr": {
        "language": "Marathi",
        "native_name": "मराठी",
        "locale": "mr-IN",
        "provider": "edge",
        "primary_voice": "mr-IN-AarohiNeural",
        "alternative_voice": "mr-IN-ManoharNeural",
        "gender": "Female",
        "persona": "Aarohi (Warm, reassuring Maharashtrian presence with soothing speech rhythm)",
        "default_speed": 0.95,
        "sample_text": "तुम्हाला सोयीचं वाटत असेल तर हळूच डोळे मिटून घ्या... एक शांत, संथ श्वास आत घ्या, आणि बाहेर सोडताना खांदे अगदी हलके सैल सोडा. या क्षणी दुसरं काहीही करण्याची गरज नाही.",
        "category_cadence": {
            "RESET": 0.96,
            "BREATHE": 0.94,
            "GROUND": 0.95,
            "RELAXATION": 0.94,
            "UNWIND": 0.95,
            "SLEEP": 0.92,
            "FOCUS": 0.98,
        },
    },
    "gu": {
        "language": "Gujarati",
        "native_name": "ગુજરાતી",
        "locale": "gu-IN",
        "provider": "edge",
        "primary_voice": "gu-IN-DhwaniNeural",
        "alternative_voice": "gu-IN-NiranjanNeural",
        "gender": "Female",
        "persona": "Dhwani (Grounded, reassuring Gujarati presence with clear phonetics & calm rhythm)",
        "default_speed": 0.95,
        "sample_text": "જો અનુકૂળ લાગે, તો ધીમેથી આંખો બંધ કરી લો... એક શાંત, ઊંડો શ્વાસ અંદર લો, અને બહાર કાઢતી વખતે ખભાને સાવ ઢીલા છોડી દો. અત્યારે તમારે બીજું કશું જ કરવાની જરૂર નથી.",
        "category_cadence": {
            "RESET": 0.96,
            "BREATHE": 0.94,
            "GROUND": 0.95,
            "RELAXATION": 0.94,
            "UNWIND": 0.95,
            "SLEEP": 0.92,
            "FOCUS": 0.98,
        },
    },
    "en": {
        "language": "English",
        "native_name": "English",
        "locale": "en-IN",
        "provider": "edge",
        "primary_voice": "en-IN-NeerjaExpressiveNeural",
        "alternative_voice": "en-IN-NeerjaNeural",
        "gender": "Female",
        "persona": "Neerja (Calm, warm, grounded mindfulness instructor with an unhurried, natural presence)",
        "default_speed": 0.96,
        "sample_text": "If you're comfortable, let your eyes close... Take a slow breath in, and as you breathe out, let your shoulders soften a little. There's nowhere else you need to be right now.",
        "category_cadence": {
            "RESET": 0.96,
            "BREATHE": 0.94,
            "GROUND": 0.95,
            "RELAXATION": 0.94,
            "UNWIND": 0.95,
            "SLEEP": 0.92,
            "FOCUS": 0.98,
        },
    },
}

OPENAI_VOICES = ["alloy", "nova", "shimmer", "echo", "fable", "onyx"]

def clean_for_speech(text: str) -> str:
    # Strip markdown syntax for natural therapeutic voice flow
    clean = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    clean = re.sub(r"\*([^*]+)\*", r"\1", clean)
    clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", clean)
    clean = re.sub(r"^[•\-*]\s+", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"^\d+\.\s+", "", clean, flags=re.MULTILINE)
    # Preserve paragraph breaks as natural meditative breath boundaries
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean.strip()

# ==========================================
# TTS PROVIDER ABSTRACTION
# ==========================================

class TTSProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def generate_speech(self, text: str, voice_id: str, speed: float, pitch: str = "+0Hz", locale: str = "en-IN") -> bytes:
        pass

    @abstractmethod
    def supports_language(self, language: str) -> bool:
        pass

    @abstractmethod
    def get_voice_profile(self, language: str) -> Optional[dict]:
        pass


class EdgeTTSProvider(TTSProvider):
    @property
    def name(self) -> str:
        return "edge"

    def supports_language(self, language: str) -> bool:
        return language.lower() in LANGUAGE_VOICE_PROFILES

    def get_voice_profile(self, language: str) -> Optional[dict]:
        return LANGUAGE_VOICE_PROFILES.get(language.lower())

    async def generate_speech(self, text: str, voice_id: str, speed: float, pitch: str = "+0Hz", locale: str = "en-IN") -> bytes:
        rate_pct = int(round((speed - 1.0) * 100))
        rate_str = f"{rate_pct:+d}%"
        # volume="+0%" preserves natural dynamic range and headroom without harsh digital clipping
        communicate = edge_tts.Communicate(text, voice_id, rate=rate_str, pitch=pitch, volume="+0%")
        
        # Upgrade outputFormat from telephony 48kbps CBR to studio 96kbps CBR (removes telephony MP3 artifacts)
        # and inject native Indian language synthesis locale into SSML
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


class OpenAITTSProvider(TTSProvider):
    @property
    def name(self) -> str:
        return "openai"

    def supports_language(self, language: str) -> bool:
        return language.lower() == "en"

    def get_voice_profile(self, language: str) -> Optional[dict]:
        return {
            "language": "English",
            "locale": "en-US",
            "provider": "openai",
            "primary_voice": "alloy",
            "persona": "OpenAI Neural Alloy (Neutral therapeutic voice)",
            "default_speed": 0.88,
        }

    async def generate_speech(self, text: str, voice_id: str, speed: float, pitch: str = "+0Hz") -> bytes:
        if not OPENAI_API_KEY:
            raise RuntimeError("OpenAI API key not configured")
        client = get_openai_client()
        voice_choice = voice_id if voice_id in OPENAI_VOICES else "alloy"
        # OpenAI audio.speech is sync, wrap in asyncio.to_thread
        loop = asyncio.get_event_loop()
        def _call_openai():
            resp = client.audio.speech.create(
                model="tts-1",
                voice=voice_choice,
                input=text,
                speed=max(0.70, min(speed, 1.25))
            )
            return resp.content
        return await loop.run_in_executor(None, _call_openai)


# Import swappable SpeechService & Baseline
from services.speech_service import (
    speech_service,
    STUDIO_VOICE_BASELINE,
    CANDIDATE_VOICE_ALTERNATIVES,
    NATIVE_EVALUATION_SCRIPTS,
    EdgeTTSAdapter,
    OpenAITTSAdapter,
)

# Provider instances registry for backward compatibility
_EDGE_PROVIDER = EdgeTTSAdapter()
_OPENAI_PROVIDER = OpenAITTSAdapter()

@router.get("/voice/baseline")
def get_voice_baseline():
    """Returns frozen STUDIO_VOICE_BASELINE configuration."""
    return {"baseline": STUDIO_VOICE_BASELINE}

@router.get("/voice/candidates")
def get_voice_candidates():
    """Returns candidate voices for A/B evaluation and native scripts."""
    return {
        "baseline": STUDIO_VOICE_BASELINE,
        "candidates": CANDIDATE_VOICE_ALTERNATIVES,
        "native_scripts": NATIVE_EVALUATION_SCRIPTS,
        "providers": speech_service.list_providers(),
    }

@router.get("/voice/providers")
def get_voice_providers():
    """Lists configured and supported TTS providers and models."""
    return {
        "providers": speech_service.list_providers()
    }

@router.get("/voice/profiles")
def get_voice_profiles():
    """Returns available language voice profiles with configured native personas."""
    return {
        "profiles": LANGUAGE_VOICE_PROFILES,
        "baseline": STUDIO_VOICE_BASELINE,
        "providers": ["edge", "openai"],
    }

@router.post("/voice/speak")
async def text_to_speech(data: SpeakRequest, user=Depends(get_optional_user)):
    if not data.text or not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    cleaned_text = clean_for_speech(data.text)
    if len(cleaned_text) > 2500:
        cleaned_text = cleaned_text[:2500] + "..."

    lang = (data.language or "en").lower().strip()
    profile = LANGUAGE_VOICE_PROFILES.get(lang, LANGUAGE_VOICE_PROFILES["en"])

    # Resolve speed
    default_speed = profile.get("default_speed", 0.96)
    speed_val = round(max(0.65, min(data.speed if data.speed is not None else default_speed, 1.30)), 2)

    try:
        audio_content, headers = await speech_service.generate_speech(
            text=cleaned_text,
            language=lang,
            locale=data.locale or profile.get("locale", "en-IN"),
            voice=data.voice,
            provider=data.provider,
            model=data.model,
            speed=speed_val,
            pitch=data.pitch or "+0Hz",
        )

        return StreamingResponse(
            io.BytesIO(audio_content),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=86400",
                **headers,
                "X-Voice-Persona": profile.get("persona", data.voice or "Athena"),
            }
        )
    except Exception as e:
        print(f"[Speech Synthesis Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Speech synthesis service temporarily unavailable: {str(e)}")

@router.post("/voice/session-script", response_model=VoiceScriptResponse)
def get_guided_session_script(data: VoiceScriptRequest):
    """Generates a structured, timed voice coaching script for studio sessions."""
    try:
        return orchestrate_session(data)
    except Exception as e:
        print(f"[Voice Script Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate script: {str(e)}")

@router.get("/voice/session-script", response_model=VoiceScriptResponse)
def fetch_guided_session_script(
    practice_type: str = "breathe",
    routine_id: Optional[str] = None,
    mode: str = "guided",
    tone_preference: str = "gentle",
    voice_style: str = "nova",
    custom_seconds: Optional[int] = None,
):
    """GET endpoint to fetch structured studio scripts via query parameters."""
    try:
        req = VoiceScriptRequest(
            practice_type=practice_type,
            routine_id=routine_id,
            mode=mode,
            tone_preference=tone_preference,
            voice_style=voice_style,
            custom_seconds=custom_seconds,
        )
        return orchestrate_session(req)
    except Exception as e:
        print(f"[Voice Script GET Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch script: {str(e)}")

@router.get("/voice/personas")
def list_voice_personas():
    """Returns available therapist voice personas."""
    return {"personas": get_available_personas()}

@router.post("/voice/transcribe")
async def speech_to_text(file: UploadFile = File(...), user=Depends(verify_user)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")

    suffix = Path(file.filename or "recording.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        client = get_openai_client()
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        return {"text": transcript.text.strip()}
    except Exception as e:
        print(f"[Whisper Error] {e}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass
