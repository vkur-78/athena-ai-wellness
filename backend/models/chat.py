from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    session_id: Optional[str] = "demo"
    message: str
    user_id: Optional[str] = None
    internal_context: Optional[str] = None
    source: Optional[str] = None
    conversation_language: Optional[str] = None

class ChatMetadata(BaseModel):
    risk: Optional[str] = "none"
    emotion: Optional[str] = "reflective"
    secondary_emotion: Optional[str] = None
    intensity: Optional[str] = "moderate"
    stage: Optional[str] = "exploration"
    thinking_pattern: Optional[str] = "none"
    focus: Optional[str] = "wellness"
    therapy_approach: Optional[str] = "holding space"
    suggested_replies: Optional[List[str]] = []

class MemorySummary(BaseModel):
    user_name: Optional[str] = None
    total_exchanges: Optional[int] = 0
    companion_level: Optional[int] = 1
    total_insights: Optional[int] = 0
    core_stressors: Optional[List[str]] = []
    coping_preferences: Optional[List[str]] = []
    thinking_patterns: Optional[List[str]] = []
    wellness_goals: Optional[List[str]] = []
    milestones: Optional[List[str]] = []
    guided_exercises: Optional[List[str]] = []
    mood_logs: Optional[List[Dict[str, Any]]] = []
    voice_settings: Optional[Dict[str, Any]] = {"voice": "nova"}
    key_memories: Optional[List[str]] = []
    recent_emotions: Optional[List[str]] = []
    last_updated: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    metadata: Optional[ChatMetadata] = None
    memory: Optional[MemorySummary] = None
