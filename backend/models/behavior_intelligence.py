"""
Pydantic models for Athena Phase 4.2: Behavior Intelligence System
Therapeutic companion models with natural language analytics, deterministic reasoning structures,
and zero clinical or gamified metrics.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TodayGuidanceResponse(BaseModel):
    greeting: str
    guidance: str
    action_label: Optional[str] = None
    action_type: Optional[str] = None  # "studio" | "chat" | "journal"
    action_target: Optional[str] = None
    context_reason: Optional[str] = None
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class BehaviorPatternCard(BaseModel):
    id: str
    category: str
    title: str
    explanation: str
    confidence_language: str  # "This pattern has appeared across several weeks." | "I've noticed this only a couple of times, so I'll keep observing."
    supporting_moments: List[str] = Field(default_factory=list)
    suggested_experiment: str
    created_at: str


class BehaviorPatternsResponse(BaseModel):
    patterns: List[BehaviorPatternCard] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class EnergyRhythmPoint(BaseModel):
    period: str  # "Morning", "Afternoon", "Evening", "Night"
    level: str   # "Lighter", "Steady", "Heavier"
    narrative: str


class StressRecoveryFlow(BaseModel):
    title: str
    steps: List[str] = Field(default_factory=list)
    timestamp_context: str
    outcome_narrative: str


class RecoveryBalanceItem(BaseModel):
    practice: str
    settled_narrative: str  # e.g. "Writing became one of the places where your mind seemed to settle."
    times_used: int
    weight: float


class TimeOfDayHeatmap(BaseModel):
    morning: str
    afternoon: str
    evening: str
    night: str
    quietest_period: str
    narrative: str


class TherapeuticAnalytics(BaseModel):
    energy_rhythm: List[EnergyRhythmPoint] = Field(default_factory=list)
    stress_recovery_flow: StressRecoveryFlow
    recovery_balance: List[RecoveryBalanceItem] = Field(default_factory=list)
    time_of_day_heatmap: TimeOfDayHeatmap
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class TriggerRecoveryItem(BaseModel):
    id: str
    trigger: str          # e.g. "Busy afternoon"
    helped_afterward: str # e.g. "Desk Relief"
    supporting_moments: List[str] = Field(default_factory=list)
    recovery_pattern: str
    future_experiment: str


class TriggerRecoveryResponse(BaseModel):
    pathways: List[TriggerRecoveryItem] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class RecoveryForecast(BaseModel):
    forecast_text: str  # "You often choose quieter activities on Sunday evenings."
    actions: List[str] = Field(default_factory=list)
    context_reason: str
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class AdaptiveExperiment(BaseModel):
    id: str
    title: str
    why_this_experiment: str
    progress: Dict[str, str] = Field(default_factory=dict)  # {"Monday": "completed", ...}
    feedback: Optional[str] = None  # "helped" | "neutral" | "not_helped"
    feedback_status: str = "pending"  # "pending" | "submitted"


class AdaptiveExperimentsResponse(BaseModel):
    experiments: List[AdaptiveExperiment] = Field(default_factory=list)
    athena_learning_note: str = (
        "Athena updates future recommendations based on what actually felt helpful for you."
    )
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class ExperimentFeedbackPayload(BaseModel):
    feedback: str  # "helped" | "neutral" | "not_helped"


class EmotionalSeason(BaseModel):
    season_title: str
    why_this_season: str
    evidence_summary: List[str] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class MilestoneMemory(BaseModel):
    id: str
    title: str
    description: str
    created_at: str
    memory_type: str  # "first_pause" | "breakthrough" | "resilience" | "consistency"


class MilestonesResponse(BaseModel):
    milestones: List[MilestoneMemory] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class KeepsakeData(BaseModel):
    month: str
    cover_quote: str
    chapter1_story: Dict[str, str] = Field(default_factory=dict)
    chapter2_turning_points: List[Dict[str, str]] = Field(default_factory=list)
    chapter3_recovery_map: List[Dict[str, str]] = Field(default_factory=list)
    chapter4_helpful_habits: List[str] = Field(default_factory=list)
    chapter5_experiments: List[str] = Field(default_factory=list)
    final_letter: str
    pdf_url: Optional[str] = None
    is_empty_state: bool = False
    empty_message: Optional[str] = None


# =============================================================================
# PHASE 7.2: FLAGSHIP BEHAVIOR INTELLIGENCE MODELS
# =============================================================================

class PracticeImpactItem(BaseModel):
    practice_id: str
    practice_name: str
    sessions_completed: int
    average_duration: str
    completion_rate: str
    observed_recovery_trend: str


class PracticeImpactResponse(BaseModel):
    practices: List[PracticeImpactItem] = Field(default_factory=list)
    summary_sentence: str
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class TriggerCategoryItem(BaseModel):
    id: str
    category: str  # "Work" | "Sleep" | "Relationships" | "Health" | "Family" | "Self-pressure"
    intensity_level: int  # 1 (light) to 4 (pronounced)
    intensity_label: str
    supporting_moments: List[str] = Field(default_factory=list)
    journal_excerpts: List[str] = Field(default_factory=list)
    helpful_practices: List[Dict[str, str]] = Field(default_factory=list)


class TriggerHeatmapResponse(BaseModel):
    categories: List[TriggerCategoryItem] = Field(default_factory=list)
    calming_summary: str
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class RecoverySignalItem(BaseModel):
    id: str
    signal_text: str
    evidence: str
    confidence: str  # "High" | "Medium" | "Low"
    confidence_language: str
    supporting_moments: List[str] = Field(default_factory=list)


class RecoverySignalsResponse(BaseModel):
    signals: List[RecoverySignalItem] = Field(default_factory=list)
    learning_note: str = "Athena updates future recommendations based on what actually felt helpful for you."
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class AdaptiveWeeklyPlanItem(BaseModel):
    id: str
    day: str
    title: str
    description: str
    action_type: str  # "studio" | "journal" | "chat"
    action_target: str
    is_completed: bool = False


class AdaptiveWeeklyPlanResponse(BaseModel):
    plan_items: List[AdaptiveWeeklyPlanItem] = Field(default_factory=list)
    planner_note: str
    is_empty_state: bool = False
    empty_message: Optional[str] = None

