from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional
from auth.verify import verify_user
from services.conversation_service import (
    list_conversations,
    create_conversation,
    delete_conversation,
    update_conversation_title,
    get_conversation,
    DEMO_USER_ID,
    _load_local_conversations,
)
from services.chat_service import load_history
from models.conversation import CreateConversationRequest, UpdateConversationTitleRequest

router = APIRouter()

@router.get("/conversations")
def get_conversations(request: Request, include_sample: bool = False, user=Depends(verify_user)):
    device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
    is_demo = getattr(user, "is_demo", False) or user.id == DEMO_USER_ID
    inc_sample = include_sample or request.headers.get("x-include-sample") == "true"
    return list_conversations(
        user.id,
        demo_session_id=getattr(user, "demo_session_id", None),
        device_id=device_id,
        is_demo=is_demo,
        include_sample=inc_sample,
    )

@router.get("/conversations/sample")
def get_sample_conversations(user=Depends(verify_user)):
    """Returns the preserved 24-month historical sample journey conversations for Aarav Sharma."""
    local = _load_local_conversations()
    sample_convs = [
        c for c in local.values()
        if c.get("user_id") == DEMO_USER_ID and not c.get("device_id") and not c.get("demo_session_id")
    ]
    sample_convs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return sample_convs

@router.post("/conversations")
def create_new_conversation(request: Request, data: Optional[CreateConversationRequest] = None, user=Depends(verify_user)):
    title = data.title if data and data.title else "New Conversation"
    device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
    demo_session_id = getattr(user, "demo_session_id", None)
    return create_conversation(
        user.id,
        title=title,
        demo_session_id=demo_session_id,
        device_id=device_id,
    )

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str, request: Request, user=Depends(verify_user)):
    device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
    conv = get_conversation(conversation_id, user.id, device_id=device_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return load_history(conversation_id)

@router.patch("/conversations/{conversation_id}/title")
@router.put("/conversations/{conversation_id}/title")
@router.patch("/conversations/{conversation_id}")
@router.put("/conversations/{conversation_id}")
def rename_conversation(conversation_id: str, data: UpdateConversationTitleRequest, request: Request, user=Depends(verify_user)):
    trimmed = data.title.strip() if data and data.title else ""
    if not trimmed:
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
    conv = get_conversation(conversation_id, user.id, device_id=device_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    res = update_conversation_title(conversation_id, user.id, trimmed, device_id=device_id)
    return res or {"id": conversation_id, "title": trimmed, "user_id": user.id}

@router.delete("/conversations/{conversation_id}")
def remove_conversation(conversation_id: str, request: Request, user=Depends(verify_user)):
    device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
    conv = get_conversation(conversation_id, user.id, device_id=device_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return delete_conversation(conversation_id, user.id, device_id=device_id)
