from typing import Optional, List, Literal, Dict, Any, Union
from pydantic import BaseModel, Field

# Core Statuses: STARTED, COMPLETED, ABANDONED (or lowercase equivalents started, paused, completed, abandoned)
CompletionStatus = Literal["STARTED", "COMPLETED", "ABANDONED", "started", "paused", "completed", "abandoned"]
InstructionMode = Literal["TEXT", "VOICE", "BOTH"]


class ExerciseStep(BaseModel):
    id: str
    exercise_id: Optional[str] = None
    step_order: int
    order: Optional[int] = None
    instruction_text: str
    text: Optional[str] = None
    voice_text: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: int
    pause_after_seconds: int = 3
    instruction_type: Optional[str] = "guide"

    def model_post_init(self, __context: Any) -> None:
        if not self.text:
            self.text = self.instruction_text
        if not self.voice_text:
            self.voice_text = self.instruction_text
        if self.order is None:
            self.order = self.step_order


class ExerciseDefinition(BaseModel):
    id: str
    slug: str
    title: str
    category: str  # RESET | BREATHE | GROUND | FOCUS | WIND DOWN | REFLECT
    duration_seconds: int
    duration_minutes: int
    duration_label: str  # "2 min", "4 min"
    purpose: str
    description: str
    difficulty: str = "Gentle"
    active: bool = True
    caution: Optional[str] = None
    steps: List[ExerciseStep]
    default_pacing: Optional[Dict[str, int]] = None


class ExerciseListResponse(BaseModel):
    exercises: List[ExerciseDefinition]
    categories: List[str]


class StudioSessionStartRequest(BaseModel):
    exercise_id: str
    exercise_name: str
    exercise_category: str
    instruction_mode: Optional[str] = "VOICE"
    voice_used: Optional[bool] = True
    voice_enabled: Optional[bool] = True
    playback_speed: Optional[float] = 1.0
    total_steps: Optional[int] = 0
    planned_duration_seconds: Optional[int] = None


class StudioSessionUpdateRequest(BaseModel):
    steps_completed: Optional[int] = None
    last_step: Optional[int] = None
    duration_seconds: Optional[int] = None
    playback_speed: Optional[float] = None
    session_status: Optional[str] = None
    notes: Optional[str] = None
    before_mood: Optional[str] = None
    after_mood: Optional[str] = None
    pause_count: Optional[int] = None
    last_phase: Optional[Union[int, str]] = None
    last_position_seconds: Optional[int] = None


class StudioSessionCompleteRequest(BaseModel):
    duration_seconds: int
    steps_completed: Optional[int] = None
    total_steps: Optional[int] = None
    voice_used: Optional[bool] = None
    voice_enabled: Optional[bool] = None
    playback_speed: Optional[float] = None
    instruction_mode: Optional[str] = None
    before_mood: Optional[str] = None
    after_mood: Optional[str] = None
    notes: Optional[str] = None
    planned_duration_seconds: Optional[int] = None
    pause_count: Optional[int] = None
    last_phase: Optional[Union[int, str]] = None
    last_position_seconds: Optional[int] = None


class StudioSessionAbandonRequest(BaseModel):
    duration_seconds: int
    steps_completed: Optional[int] = None
    last_step: Optional[int] = None
    total_steps: Optional[int] = None
    reason: Optional[str] = "user_ended_early"
    planned_duration_seconds: Optional[int] = None
    pause_count: Optional[int] = None
    last_phase: Optional[Union[int, str]] = None
    last_position_seconds: Optional[int] = None
    session_status: Optional[str] = "abandoned"


class StudioSessionCreate(BaseModel):
    # Clean core exercise identifiers
    exercise_id: Optional[str] = Field(None, description="Unique identifier for the exercise, e.g. 'box_breathing'")
    exercise_name: Optional[str] = Field(None, description="Display name, e.g. 'Box Breathing'")
    exercise_category: Optional[str] = Field(None, description="Category: RESET, BREATHE, GROUND, FOCUS, WIND DOWN, REFLECT")

    # Timing & Completion
    started_at: Optional[str] = Field(None, description="ISO timestamp when exercise started")
    completed_at: Optional[str] = Field(None, description="ISO timestamp when exercise was completed")
    duration_seconds: Optional[int] = Field(0, description="Duration in seconds spent in practice")
    completion_status: Optional[str] = Field("COMPLETED", description="STARTED | COMPLETED | ABANDONED")
    session_status: Optional[str] = Field("started", description="started | paused | completed | abandoned")

    # Optional fields
    voice_used: Optional[bool] = Field(False, description="Whether voice audio coaching was active")
    voice_enabled: Optional[bool] = Field(False, description="Whether voice was toggled on")
    playback_speed: Optional[float] = Field(1.0, description="Playback speed (0.75, 1.0, 1.25)")
    instruction_mode: Optional[str] = Field("TEXT", description="TEXT | VOICE | BOTH")
    session_id: Optional[str] = Field(None, description="Client session UUID")
    before_mood: Optional[str] = Field(None, description="Pre-exercise mood rating/text")
    after_mood: Optional[str] = Field(None, description="Post-exercise mood rating/text")
    notes: Optional[str] = Field(None, description="User reflection notes")
    early_exit: Optional[bool] = Field(False, description="Whether user exited early")
    completion_percentage: Optional[float] = Field(None, description="Percentage of exercise completed (0-100)")
    steps_completed: Optional[int] = Field(0, description="Steps completed")
    last_step: Optional[int] = Field(1, description="Last visited step index")
    total_steps: Optional[int] = Field(0, description="Total steps in exercise")

    # Legacy fields for backwards compatibility
    practice_type: Optional[str] = Field(None, description="Legacy practice_type identifier")
    routine: Optional[str] = Field(None, description="Legacy routine name")
    planned_duration: Optional[int] = Field(None, description="Target duration in seconds")
    actual_duration: Optional[int] = Field(None, description="Legacy actual duration in seconds")
    completed: Optional[bool] = Field(None, description="Legacy completed boolean flag")
    paused: Optional[bool] = Field(False, description="Whether pause was utilized")
    pause_count: Optional[int] = Field(0, description="Number of pauses")
    pauses_count: Optional[int] = Field(0, description="Number of pauses")
    resumed: Optional[bool] = Field(False, description="Whether resumed after pause")
    language: Optional[str] = Field("en", description="Selected language: en | hi | mr")
    selected_language: Optional[str] = Field("en", description="Selected language: en | hi | mr")
    pace: Optional[str] = Field("balanced", description="gentle | balanced | slow")
    repeated_instruction: Optional[int] = Field(0, description="Repeated instruction count")
    exited_early: Optional[bool] = Field(False, description="Legacy exited early flag")
    camera_mode: Optional[str] = Field("first_person", description="Legacy camera mode")
    practice_mode: Optional[str] = Field("guided", description="Legacy practice mode")
    voice_style: Optional[str] = Field("nova", description="Legacy voice style")
    exit_reason: Optional[str] = Field("completed", description="Legacy exit reason")
    ended_at: Optional[str] = Field(None, description="Legacy ended_at timestamp")


class StudioSessionResponse(BaseModel):
    id: str
    user_id: str
    exercise_id: str
    exercise_name: str
    exercise_category: str
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: int
    completion_status: str
    session_status: Optional[str] = "started"
    voice_used: bool = False
    voice_enabled: bool = False
    playback_speed: Optional[float] = 1.0
    instruction_mode: str = "TEXT"
    steps_completed: int = 0
    last_step: Optional[int] = 1
    total_steps: int = 0
    before_mood: Optional[str] = None
    after_mood: Optional[str] = None
    notes: Optional[str] = None
    early_exit: bool = False
    exited_early: Optional[bool] = False
    completed: bool = False
    planned_duration_seconds: Optional[int] = None
    pause_count: Optional[int] = 0
    last_phase: Optional[int] = 1
    last_position_seconds: Optional[int] = 0
    practice_type: Optional[str] = None
    routine: Optional[str] = None
    actual_duration: Optional[int] = None
    planned_duration: Optional[int] = None
    paused: Optional[bool] = False
    pauses_count: Optional[int] = 0
    resumed: Optional[bool] = False
    pace: Optional[str] = "balanced"
    practice_mode: Optional[str] = "guided"
    voice_style: Optional[str] = "nova"
    exit_reason: Optional[str] = "completed"
    repeated_instruction: Optional[int] = 0


class StudioHistoryItem(BaseModel):
    id: str
    user_id: str
    exercise_id: str
    exercise_name: str
    exercise_category: str
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: int
    completion_status: str
    session_status: Optional[str] = "completed"
    instruction_mode: str = "VOICE"
    steps_completed: int = 0
    last_step: Optional[int] = 1
    total_steps: int = 0
    voice_enabled: bool = True
    playback_speed: Optional[float] = 1.0
    before_mood: Optional[str] = None
    after_mood: Optional[str] = None
    notes: Optional[str] = None
    display_date: str
    planned_duration_seconds: Optional[int] = None
    pause_count: Optional[int] = 0
    last_phase: Optional[int] = 1
    last_position_seconds: Optional[int] = 0


class StudioHistoryResponse(BaseModel):
    sessions: List[StudioHistoryItem]
    total_completed: int
    total_minutes: int
    today_completed_count: int = 0
    today_activity_label: str = "Nothing practiced yet today."
    recommended_exercise: Optional[Dict[str, Any]] = None


class StudioRecentMoment(BaseModel):
    id: str
    exercise_id: str
    exercise_name: str
    exercise_category: str
    moment_text: str
    completed: bool
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: int
    completion_status: str


class StudioRecentMomentsResponse(BaseModel):
    moments: List[StudioRecentMoment]


class StudioReflectionRequest(BaseModel):
    practice_type: str
    routine: Optional[str] = None
    completed: bool = True


class StudioReflectionResponse(BaseModel):
    gentle_sentence: str
