from pydantic import BaseModel
from typing import Optional

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    user_id: Optional[str] = None

class UpdateConversationTitleRequest(BaseModel):
    title: str

class ConversationModel(BaseModel):
    id: str
    title: str
    user_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class MessageModel(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    timestamp: Optional[str] = None

