from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class CheckinCreate(BaseModel):
    mood: str = Field(..., description="Overall feeling for the day: Great, Good, Okay, Low, Very Difficult")
    energy_level: int = Field(..., ge=1, le=5, alias="energy", description="Energy level from 1 (Running on empty) to 5 (Full of energy)")
    stress_level: int = Field(..., ge=1, le=5, alias="stress", description="Stress level from 1 (Very light) to 5 (Overwhelming)")
    reflection_text: Optional[str] = Field(None, alias="reflection", description="Optional user personal thought")
    date: Optional[str] = Field(None, description="Client calendar date in YYYY-MM-DD format")
    language: Optional[str] = Field("en", description="Target language code for AI reflection (en, hi, ta, te, mr, gu)")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "mood": "Good",
                "energy_level": 3,
                "stress_level": 2,
                "reflection_text": "Had a busy morning, but felt peaceful in the afternoon.",
                "date": "2026-09-10"
            }
        }

class CheckinResponse(BaseModel):
    id: str
    user_id: str
    date: str
    mood: str
    energy_level: int = 3
    stress_level: int = 3
    energy: Optional[int] = None
    stress: Optional[int] = None
    reflection_text: Optional[str] = None
    reflection: Optional[str] = None
    ai_reflection: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True
        from_attributes = True

    def model_post_init(self, __context):
        if self.energy is not None and "energy_level" not in self.__pydantic_fields_set__:
            self.energy_level = self.energy
        elif self.energy is None:
            self.energy = self.energy_level

        if self.stress is not None and "stress_level" not in self.__pydantic_fields_set__:
            self.stress_level = self.stress
        elif self.stress is None:
            self.stress = self.stress_level

        if self.reflection is None and self.reflection_text is not None:
            self.reflection = self.reflection_text
        elif self.reflection_text is None and self.reflection is not None:
            self.reflection_text = self.reflection

class TodayCheckinStatus(BaseModel):
    has_checkin: bool
    checkin: Optional[CheckinResponse] = None
