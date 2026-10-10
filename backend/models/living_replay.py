from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class OpeningSceneData(BaseModel):
    greeting: str
    season_title: str
    period_display: str
    quote: str
    ambient_theme: str = "quiet_sanctuary"


class MoodJourneyFlowPoint(BaseModel):
    day_label: str  # "Mon", "Tue", etc.
    date: str       # "YYYY-MM-DD"
    mood: str       # "overwhelmed" | "steady" | "reflective" | "calmer" | "peaceful"
    energy: int     # 1-5
    tension: int    # 1-5
    calm_level: int # 1-100
    reflection_snippet: Optional[str] = None


class RecoveryMomentCard(BaseModel):
    id: str
    title: str
    date: str
    category: str  # "Studio Practice", "Space Journal", "Sanctuary Pause", "Mindful Conversation"
    why_it_mattered: str
    icon_type: str = "feather"  # "feather" | "wind" | "heart" | "sparkles"


class SanctuaryWorldData(BaseModel):
    favorite_world: str
    total_minutes: int
    sessions_count: int
    preferred_voice: str
    preferred_camera: str
    completion_rate_narrative: str
    world_ambience_note: str


class QuietVictoryCard(BaseModel):
    id: str
    title: str
    description: str
    significance: str
    date: Optional[str] = None


class EmotionalRhythmData(BaseModel):
    pattern_title: str
    rhythm_narrative: str
    why_noticed: str
    evidence: str
    confidence_wording: str  # "This has appeared across several weeks." | "I've noticed this several times." | "I'm still learning this rhythm."


class GrowthReflectionData(BaseModel):
    headline: str
    narrative: str
    key_takeaway: str


class NextChapterItem(BaseModel):
    id: str
    title: str
    suggestion: str
    action_route: str  # "/studio" | "/journal" | "/chat"
    action_label: str


class HighlightsGrid(BaseModel):
    favorite_sanctuary: str
    longest_calm_streak: str
    reflection_day: str
    quiet_victory: str


class LivingReplayData(BaseModel):
    replay_id: str
    replay_type: str  # "weekly" | "monthly"
    time_period: str  # "2026-W37" or "2026-09"
    period_display: str  # "Week of September 14, 2026" or "September 2026"
    user_name: str
    opening_scene: OpeningSceneData
    mood_journey: List[MoodJourneyFlowPoint]
    recovery_moments: List[RecoveryMomentCard]
    sanctuary_world: SanctuaryWorldData
    quiet_victories: List[QuietVictoryCard]
    emotional_rhythm: EmotionalRhythmData
    growth_reflection: GrowthReflectionData
    next_chapter: List[NextChapterItem]
    highlights_grid: HighlightsGrid
    pdf_export_url: Optional[str] = None
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class ReplayArchiveItem(BaseModel):
    id: str
    type: str  # "weekly" | "monthly"
    title: str
    season_title: str
    period_display: str
    dominant_mood: str
    active_days: int
    total_studio_minutes: int
    created_at: str
