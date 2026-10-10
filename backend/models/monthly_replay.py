from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class OpeningLetter(BaseModel):
    quote: str = "Before we begin, thank you for letting me walk beside you this month."
    letter: str = "Your journey is not measured by perfect days. It is honored in the moments you chose to return."
    unhurried_tone: str = "Unhurried, compassionate observation without metrics or pressure."


class Chapter1Story(BaseModel):
    headline: str
    narrative: str


class EmotionalWavePoint(BaseModel):
    label: str
    energy_level: float
    reflection: str


class RecoveryRiverStep(BaseModel):
    step: str
    description: str


class StudioStar(BaseModel):
    practice_name: str
    cluster: str
    times: int
    x: float
    y: float


class Chapter2Rhythm(BaseModel):
    energy_wave: List[EmotionalWavePoint] = []
    recovery_river: List[RecoveryRiverStep] = []
    time_heatmap: Dict[str, str] = {}
    constellation: List[StudioStar] = []


class TurningPointCard(BaseModel):
    date: str
    moment: str
    why_it_mattered: str
    category: str = "growth"


class WorldGrowthItem(BaseModel):
    object_name: str
    title: str
    whisper: str
    unlocked_at: str


class HelpfulPracticeItem(BaseModel):
    practice: str
    why_helpful: str
    supporting_evidence: str = ""
    times_used: int = 1
    rank: int = 1


class QuietPattern(BaseModel):
    trend: str
    why_noticed: str
    supporting_evidence: str
    confidence_wording: str
    confidence_level: str = "moderate"


class GentleOpportunity(BaseModel):
    observation: str
    experiment: str


class MonthlyReplayData(BaseModel):
    month: str
    month_display: str
    user_name: str
    opening_quote: str
    opening_letter: Optional[OpeningLetter] = None
    chapter_1_story: Chapter1Story
    chapter_2_rhythm: Chapter2Rhythm
    chapter_3_turning_points: List[TurningPointCard] = []
    chapter_4_world_growth: List[WorldGrowthItem] = []
    chapter_5_what_helped: List[HelpfulPracticeItem] = []
    quiet_patterns: List[QuietPattern] = []
    chapter_6_gentle_opportunities: GentleOpportunity
    chapter_7_looking_forward: Dict[str, str] = {}
    is_empty_state: bool = False
