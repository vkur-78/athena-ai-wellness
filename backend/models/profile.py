from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime

class ProfileCreate(BaseModel):
    display_name: Optional[str] = None
    age_range: Optional[str] = None
    life_stage: Optional[str] = None
    routine: Optional[str] = None
    sleep_hours: Optional[float] = None
    sleep_pattern: Optional[str] = None
    energy_pattern: Optional[str] = None
    current_focus: Optional[List[str]] = []
    emotional_patterns: Optional[List[str]] = []
    support_style: Optional[str] = None
    sensitive_topics: Optional[List[str]] = []
    coping_methods: Optional[List[str]] = []
    social_support: Optional[str] = None
    communication_preference: Optional[str] = "Voice & Text"
    wellness_goal: Optional[str] = None
    onboarding_completed: Optional[bool] = True
    language: Optional[str] = None

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    age_range: Optional[str] = None
    life_stage: Optional[str] = None
    routine: Optional[str] = None
    sleep_hours: Optional[float] = None
    sleep_pattern: Optional[str] = None
    energy_pattern: Optional[str] = None
    current_focus: Optional[List[str]] = None
    emotional_patterns: Optional[List[str]] = None
    support_style: Optional[str] = None
    sensitive_topics: Optional[List[str]] = None
    coping_methods: Optional[List[str]] = None
    social_support: Optional[str] = None
    communication_preference: Optional[str] = None
    wellness_goal: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    language: Optional[str] = None

class ProfileResponse(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    age_range: Optional[str] = None
    life_stage: Optional[str] = None
    routine: Optional[str] = None
    sleep_hours: Optional[float] = None
    sleep_pattern: Optional[str] = None
    energy_pattern: Optional[str] = None
    current_focus: List[str] = []
    emotional_patterns: List[str] = []
    support_style: Optional[str] = None
    sensitive_topics: List[str] = []
    coping_methods: List[str] = []
    social_support: Optional[str] = None
    communication_preference: Optional[str] = "Voice & Text"
    wellness_goal: Optional[str] = None
    language: Optional[str] = "en"
    onboarding_completed: bool = False
    onboarding_reflection: Optional[str] = None
    created_at: Optional[Union[str, datetime]] = None
    updated_at: Optional[Union[str, datetime]] = None
    is_demo: Optional[bool] = False
    trial_active: Optional[bool] = True
    trial_days_remaining: Optional[int] = 30
    entitlement_mode: Optional[str] = "TRIAL_30_DAYS"
    trial_started_at: Optional[Union[str, datetime]] = None
    trial_ends_at: Optional[Union[str, datetime]] = None
