from pydantic import BaseModel, Field
from typing import Optional

class JournalCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Private journal entry text")
    reflection_enabled: bool = Field(False, description="Whether Athena reflection was requested upon saving")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "content": "Today felt quieter than I expected. Pausing between meetings helped me breathe a little deeper.",
                "reflection_enabled": False
            }
        }

class JournalUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, description="Updated journal content")
    reflection_enabled: Optional[bool] = Field(None, description="Updated reflection status")

    class Config:
        populate_by_name = True

class JournalResponse(BaseModel):
    id: str
    user_id: str
    content: str
    ai_reflection: Optional[str] = None
    reflection_enabled: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True
        from_attributes = True
