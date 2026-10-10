from pydantic import BaseModel, Field
from typing import Optional

class CalmStartRequest(BaseModel):
    source: Optional[str] = Field("direct", description="Where Panic Reset was triggered from ('home', 'chat', 'direct')")

class CalmStartResponse(BaseModel):
    opening_line: str = Field(..., description="First compassionate sentence")
    pause_line: str = Field(..., description="Reassuring grounding sentence")
    question: str = Field("What feels most supportive?", description="Gentle invitation question")
    user_name: Optional[str] = None
    voice_guidance_intro: Optional[str] = None
