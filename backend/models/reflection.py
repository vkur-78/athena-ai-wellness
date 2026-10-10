from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class MomentThatMattered(BaseModel):
    date: str
    title: str
    reflection: str
    category: Optional[str] = None


class QuietPatternItem(BaseModel):
    observation: str
    category: str
    internal_confidence: float = 0.85


class WeeklyReflectionSections(BaseModel):
    one_sentence: str
    story_of_week: List[str] = Field(default_factory=list)
    moments_that_mattered: List[MomentThatMattered] = Field(default_factory=list)
    quiet_patterns: List[str] = Field(default_factory=list)
    what_helped: List[str] = Field(default_factory=list)
    one_invitation: str
    closing: str
    insight_categories: List[str] = Field(default_factory=list)
    companion_notes: List[str] = Field(default_factory=list)
    is_empty_state: bool = False
    empty_state_notice: Optional[str] = None
    full_text: Optional[str] = None


class WeeklyReflectionResponse(BaseModel):
    id: str
    user_id: str
    week_start: str
    week_end: str
    formatted_dates: str
    content: WeeklyReflectionSections
    generated_at: str


class MonthlyReflectionSections(BaseModel):
    month: str
    month_theme: str
    your_journey: List[str] = Field(default_factory=list)
    meaningful_moments: List[MomentThatMattered] = Field(default_factory=list)
    what_changed: List[str] = Field(default_factory=list)
    helpful_habits: List[str] = Field(default_factory=list)
    areas_deserve_gentleness: List[str] = Field(default_factory=list)
    looking_forward: str
    closing: str
    is_empty_state: bool = False
    full_text: Optional[str] = None


class MonthlyReflectionResponse(BaseModel):
    id: str
    user_id: str
    month: str
    content: MonthlyReflectionSections
    pdf_url: Optional[str] = None
    generated_at: str


class HomeReflectionPreview(BaseModel):
    title: str = "This Week's Reflection"
    preview_sentence: str
    week_label: str
    has_reflection: bool = True
    reflection_id: Optional[str] = None
    action_label: str = "Continue Reading ->"


class ReflectionSearchResultItem(BaseModel):
    source: str  # 'conversation' | 'journal' | 'studio' | 'reflection'
    title: str
    date: str
    snippet: str
    link: str


class ReflectionSearchResponse(BaseModel):
    query: str
    total: int
    results: List[ReflectionSearchResultItem] = Field(default_factory=list)


class ReflectionHistoryItem(BaseModel):
    id: str
    type: str  # 'weekly' | 'monthly'
    title: str
    date_label: str
    preview_sentence: str
    created_at: str


class ReflectionHistoryResponse(BaseModel):
    weekly: List[ReflectionHistoryItem] = Field(default_factory=list)
    monthly: List[ReflectionHistoryItem] = Field(default_factory=list)


class GenerateReflectionRequest(BaseModel):
    force: Optional[bool] = False
    target_date: Optional[str] = None
