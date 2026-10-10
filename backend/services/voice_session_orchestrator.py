"""Voice Session Orchestrator.
Manages the Future Premium Voice Persona catalog, pacing speed calculations,
and session script orchestration for live guided studio practices.
"""
from typing import List, Optional
from models.guided_session import (
    VoicePersona,
    GuidedSessionScript,
    VoiceScriptRequest,
    VoiceScriptResponse,
)
from services.guided_session_service import generate_guided_script

# Therapist Voice Persona Catalog (Architected now, unlocked for preview)
VOICE_PERSONAS: List[VoicePersona] = [
    VoicePersona(
        id="nova",
        name="Athena Warm",
        role="Compassionate Therapist",
        description="Warm, empathetic, and gently encouraging presence designed for soothing anxiety and self-compassion.",
        gender="female",
        openai_voice="nova",
        tier="standard",
        is_unlocked=True,
        tags=["warm", "empathetic", "grounding"],
        preview_text="I am here with you. Take a slow, gentle breath and let your shoulders soften.",
    ),
    VoicePersona(
        id="echo",
        name="Sol Calm",
        role="Grounded Anchor",
        description="Deep, steady, and stabilizing voice suited for somatic grounding, box breathing, and outdoor presence.",
        gender="male",
        openai_voice="echo",
        tier="standard",
        is_unlocked=True,
        tags=["grounded", "calm", "steady"],
        preview_text="Steady and supported. Feel the solid earth beneath you right now.",
    ),
    VoicePersona(
        id="shimmer",
        name="Zephyr Gentle",
        role="Whisper Somatic",
        description="Whisper-soft, ethereal pacing ideal for Sleep Sanctuary and late-night quiet wind-downs.",
        gender="female",
        openai_voice="shimmer",
        tier="premium",
        is_unlocked=True,
        tags=["whisper", "meditative", "sleep"],
        preview_text="Softly releasing every expectation into the quiet of the night.",
    ),
    VoicePersona(
        id="onyx",
        name="Sage Steady",
        role="Resonant Guide",
        description="Deep resonant cadence with calm authority, perfect for muscle relaxation and focus realignment.",
        gender="male",
        openai_voice="onyx",
        tier="premium",
        is_unlocked=True,
        tags=["deep", "resonant", "focus"],
        preview_text="Deep, unhurried space to let your thoughts settle naturally.",
    ),
    VoicePersona(
        id="alloy",
        name="Aura Light",
        role="Balanced & Clear",
        description="Crisp, modern, and neutral clarity great for midday desk relief and practical biofeedback.",
        gender="female",
        openai_voice="alloy",
        tier="standard",
        is_unlocked=True,
        tags=["clear", "modern", "practical"],
        preview_text="Present, clear, and attentive to this very moment.",
    ),
    VoicePersona(
        id="fable",
        name="Fable Curious",
        role="Mindful Narrator",
        description="Expressive and gently melodic voice designed for mindful walks and compassionate reframing.",
        gender="neutral",
        openai_voice="fable",
        tier="premium",
        is_unlocked=True,
        tags=["melodic", "story", "gentle"],
        preview_text="Notice what arises when we pause and make room for ourselves.",
    ),
]


def get_available_personas() -> List[VoicePersona]:
    """Returns the full therapist voice catalog."""
    return VOICE_PERSONAS


def get_persona_by_id(persona_id: str) -> VoicePersona:
    """Finds a persona by ID or falls back to Athena Warm (nova)."""
    p_id = (persona_id or "nova").lower()
    for p in VOICE_PERSONAS:
        if p.id == p_id or p.openai_voice == p_id:
            return p
    return VOICE_PERSONAS[0]


def adjust_script_pacing(
    script: GuidedSessionScript,
    speed: float = 1.0,
) -> GuidedSessionScript:
    """
    Adjusts speaking durations and silence pauses based on speed multiplier.
    Speed range is strictly bounded between 0.8x and 1.2x.
    """
    clamped_speed = max(0.8, min(speed, 1.2))
    # Slower speed (0.8x) means speech takes 1/0.8 = 1.25x as long
    duration_factor = 1.0 / clamped_speed

    new_cues = []
    total_sec = 0.0

    for cue in script.cues:
        adjusted_duration = round(cue.duration_seconds * duration_factor, 1)
        adjusted_pause = round(cue.pause_after_seconds * (1.1 if clamped_speed < 1.0 else 1.0), 1)
        total_sec += adjusted_duration + adjusted_pause

        new_cues.append(
            cue.model_copy(
                update={
                    "duration_seconds": adjusted_duration,
                    "pause_after_seconds": adjusted_pause,
                }
            )
        )

    # Scale the overall estimated duration consistently
    new_est_duration = max(int(total_sec), int(round(script.estimated_duration_seconds * duration_factor)))

    return script.model_copy(
        update={
            "cues": new_cues,
            "estimated_duration_seconds": new_est_duration,
        }
    )


def orchestrate_session(request: VoiceScriptRequest) -> VoiceScriptResponse:
    """
    Master orchestration pipeline: generates tailored script and returns with available personas.
    """
    script = generate_guided_script(
        practice_type=request.practice_type,
        routine_id=request.routine_id,
        mode=request.mode or "guided",
        tone_preference=request.tone_preference or "gentle",
        voice_style=request.voice_style or "nova",
        custom_seconds=request.custom_seconds,
    )

    personas = get_available_personas()

    return VoiceScriptResponse(
        script=script,
        available_personas=personas,
    )
