from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class TodayGuidanceResponse(BaseModel):
    greeting: str
    guidance: str
    action_label: Optional[str] = None
    action_type: Optional[str] = None  # "studio" | "chat" | "journal"
    action_target: Optional[str] = None  # tool id or subroute
    context_reason: Optional[str] = None
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class InsightObservation(BaseModel):
    id: str
    category: str
    title: str
    explanation: str
    supporting_moments: List[str] = Field(default_factory=list)
    suggested_next_step: Optional[str] = None
    confidence: float = Field(default=0.85)  # Internal confidence only (>= 0.70)
    created_at: str


class ObservationsResponse(BaseModel):
    observations: List[InsightObservation] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class EmotionalLandscapeResponse(BaseModel):
    metaphor: str  # "Quiet River" | "Clouded Horizon" | "Gentle Dawn" | "Steady Forest" | "Open Sky"
    description: str
    visual_theme: str  # "river" | "clouds" | "dawn" | "forest" | "sky"
    evidence_notes: List[str] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class MomentChangedWeek(BaseModel):
    id: str
    timestamp_label: str  # e.g., "Tuesday · 8:12 PM"
    title: str  # e.g., "You chose to pause before continuing."
    supporting_evidence: List[str] = Field(default_factory=list)
    related_journal: Optional[str] = None
    related_studio: Optional[str] = None
    conversation_summary: Optional[str] = None


class MomentsResponse(BaseModel):
    moments: List[MomentChangedWeek] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class HelpfulHabitItem(BaseModel):
    practice: str
    evidence: str
    outcome_note: str
    times_used: int = 1


class HelpfulHabitsResponse(BaseModel):
    habits: List[HelpfulHabitItem] = Field(default_factory=list)
    athena_distinction_note: str = (
        "This isn't necessarily what works best for everyone—it's what seemed helpful for you."
    )
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class GrowthAreaItem(BaseModel):
    place: str
    what_noticed: str
    why_noticed: str
    small_experiment: str


class GrowthAreasResponse(BaseModel):
    areas: List[GrowthAreaItem] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class WeeklyActionPlanDay(BaseModel):
    day: str  # "Monday", "Wednesday", "Friday"
    practice: str
    reason: str
    action_route: str
    completed: bool = False


class WeeklyActionPlan(BaseModel):
    id: str
    week_start: str
    days: List[WeeklyActionPlanDay] = Field(default_factory=list)
    athena_note: str
    is_empty_state: bool = False
    empty_message: Optional[str] = None


class AskInsightRequest(BaseModel):
    question: str


class AskInsightResponse(BaseModel):
    question: str
    answer: str
    grounded_facts: List[str] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)


class MonthlyKeepsakeResponse(BaseModel):
    month: str
    cover_quote: str
    chapter1_story: Dict[str, str] = Field(default_factory=dict)
    chapter2_moments: List[Dict[str, Any]] = Field(default_factory=list)
    chapter3_helped: List[Dict[str, str]] = Field(default_factory=list)
    chapter4_changed: List[str] = Field(default_factory=list)
    chapter5_experiments: List[str] = Field(default_factory=list)
    final_letter: str
    pdf_url: Optional[str] = None
    is_empty_state: bool = False
    empty_message: Optional[str] = None
