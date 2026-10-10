"""Guided Voice Studio Models.
Pydantic schemas for voice coaching cues, guided scripts, and voice personas.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class VoiceCue(BaseModel):
    """An individual guided voice cue with natural pause pacing and visual cue sync."""
    id: str
    text: str
    phase: Optional[str] = None  # e.g., "opening", "inhale", "hold", "exhale", "pose", "checkin", "closing"
    duration_seconds: float = 3.5  # Estimated vocal speaking time
    pause_after_seconds: float = 2.0  # Natural breathing / silence gap after speaking
    visual_cue: Optional[str] = None  # Animation instruction for UI: "expand", "contract", "highlight", etc.
    region_highlight: Optional[str] = None  # Anatomical target for Body Scan or PMR
    subtitle: Optional[str] = None  # Display text if different from spoken text
    tone_variant: Optional[str] = None  # "gentle" or "practical"


class GuidedSessionScript(BaseModel):
    """A complete structured script for a guided studio session."""
    practice_type: str  # "breathe" | "ground" | "yoga" | "body_scan" | "walk" | "pmr" | "self_compassion" | "quiet" | "sleep"
    routine_id: Optional[str] = None
    title: str
    mode: str = "guided"  # "quick" | "guided" | "quiet"
    estimated_duration_seconds: int = 300
    tone_preference: str = "gentle"  # "gentle" | "practical"
    voice_style: str = "nova"
    cues: List[VoiceCue] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VoicePersona(BaseModel):
    """Voice persona definition for the therapist coach."""
    id: str
    name: str
    role: str
    description: str
    gender: str
    openai_voice: str  # e.g. "nova", "shimmer", "echo", "alloy", "onyx", "fable"
    tier: str = "standard"  # "standard" | "premium"
    is_unlocked: bool = True  # Architectural placeholder for future premium unlocks (always True for now)
    tags: List[str] = Field(default_factory=list)
    preview_text: str = "I am here with you. Take a slow, gentle breath."


class VoiceScriptRequest(BaseModel):
    """Request payload to fetch or generate a tailored guided script."""
    practice_type: str
    routine_id: Optional[str] = None
    mode: Optional[str] = "guided"  # "quick", "guided", "quiet"
    tone_preference: Optional[str] = "gentle"  # "gentle", "practical"
    voice_style: Optional[str] = "nova"
    custom_seconds: Optional[int] = None


class VoiceScriptResponse(BaseModel):
    """Response containing the orchestrated script and available personas."""
    script: GuidedSessionScript
    available_personas: List[VoicePersona]
