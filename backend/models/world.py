from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class AmbiencePreferences(BaseModel):
    master: float = Field(0.5, ge=0.0, le=1.0)
    wind: float = Field(0.3, ge=0.0, le=1.0)
    birds: float = Field(0.2, ge=0.0, le=1.0)
    water: float = Field(0.2, ge=0.0, le=1.0)
    rain: float = Field(0.0, ge=0.0, le=1.0)
    crickets: float = Field(0.0, ge=0.0, le=1.0)
    muted: bool = False


class WorldUnlock(BaseModel):
    id: str
    object_type: str
    title: str
    whisper: str
    unlocked_at: str
    source_event: str


class WorldStateResponse(BaseModel):
    user_id: str
    unlocked_objects: List[str]
    new_whispers: List[WorldUnlock] = []
    season: str = "spring"
    time_of_day: str = "afternoon"
    local_hour: int = 14
    world_seed: int = 42
    ambience_preferences: AmbiencePreferences


class WorldEnvironmentResponse(BaseModel):
    time_of_day: str
    season: str
    weather: str = "clear"
    ambient_description: str
    local_hour: int


class WorldMemory(BaseModel):
    object_id: str
    title: str
    memory_text: str
    unlocked_at: Optional[str] = None


class AcknowledgeUnlockRequest(BaseModel):
    unlock_ids: List[str]
