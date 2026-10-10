from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse
from typing import Optional
from models.chat import ChatRequest
from ai.orchestrator import (
    chat,
    chat_stream,
    list_active_sessions,
    get_session_history,
    clear_session
)
from ai.memory_manager import get_memory_summary, clear_user_memory
from auth.verify import verify_user, require_active_entitlement

router = APIRouter()

def _record_chat_event_safe(user_id: str, session_id: str, message: str):
    try:
        from services.behavior_pipeline import record_behavior_event
        # Extract privacy-safe theme keywords without storing message text
        msg_lower = message.lower()
        themes = []
        if any(w in msg_lower for w in ["work", "career", "job", "deadline"]): themes.append("work")
        if any(w in msg_lower for w in ["sleep", "rest", "tired", "exhaust"]): themes.append("sleep")
        if any(w in msg_lower for w in ["relationship", "friend", "family", "partner"]): themes.append("relationships")
        if any(w in msg_lower for w in ["stress", "anxious", "overwhelm", "pressure"]): themes.append("stress")

        record_behavior_event(
            user_id=user_id,
            source="chat",
            event_type="message_sent",
            metadata={
                "session_id": session_id,
                "message_length": len(message.split()),
                "detected_themes": themes or ["mindful conversation"],
                "returned_after_pause": False
            }
        )
    except Exception as e:
        print(f"[Chat Behavior Event Warning] {e}")

@router.post("/chat")
def chat_api(data: ChatRequest, request: Request, user=Depends(require_active_entitlement)):
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Enforce atomic 3-prompt limit for demo sessions
    is_demo = getattr(user, "is_demo", False)
    if is_demo:
        from services.demo_session_service import check_and_increment_demo_prompt
        device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
        token = getattr(user, "demo_token", None) or getattr(user, "demo_session_id", None) or device_id or "demo_access_token"
        allowed, remaining, err_reason = check_and_increment_demo_prompt(token, device_id=device_id)
        if not allowed:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "demo_limit_reached",
                    "code": "DEMO_LIMIT_REACHED",
                    "message": "Your Athena demo is complete. You've experienced a sample of Athena's conversational experience.",
                    "prompts_used": 3,
                    "prompt_limit": 3,
                    "remaining": 0
                }
            )

    session_id = data.session_id or "default"
    _record_chat_event_safe(user.id, session_id, data.message.strip())

    resp = chat(
        session_id=session_id,
        message=data.message.strip(),
        user_id=user.id,
        internal_context=data.internal_context,
        conversation_language=data.conversation_language
    )
    if is_demo:
        if isinstance(resp, dict):
            resp["demo_prompts_remaining"] = remaining
    return resp

@router.post("/chat/stream")
async def chat_stream_api(data: ChatRequest, request: Request, user=Depends(require_active_entitlement)):
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    import json
    is_demo = getattr(user, "is_demo", False)
    remaining_prompts = None

    if is_demo:
        from services.demo_session_service import check_and_increment_demo_prompt
        device_id = request.headers.get("x-demo-device-id") or request.headers.get("x-device-id")
        token = getattr(user, "demo_token", None) or getattr(user, "demo_session_id", None) or device_id or "demo_access_token"
        allowed, remaining, err_reason = check_and_increment_demo_prompt(token, device_id=device_id)
        if not allowed:
            async def limit_event_generator():
                limit_payload = json.dumps({
                    "error": "demo_limit_reached",
                    "code": "DEMO_LIMIT_REACHED",
                    "message": "Your Athena demo is complete. You've experienced a sample of Athena's conversational experience.",
                    "prompts_used": 3,
                    "prompt_limit": 3,
                    "remaining": 0
                })
                yield f"event: demo_limit_reached\ndata: {limit_payload}\n\n"
                yield f"event: done\ndata: {limit_payload}\n\n"

            return StreamingResponse(
                limit_event_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Demo-Prompts-Remaining": "0"
                }
            )
        remaining_prompts = remaining

    session_id = data.session_id or "default"
    _record_chat_event_safe(user.id, session_id, data.message.strip())

    async def event_generator():
        try:
            for event_chunk in chat_stream(
                session_id=session_id,
                message=data.message.strip(),
                user_id=user.id,
                internal_context=data.internal_context,
                conversation_language=data.conversation_language
            ):
                if await request.is_disconnected():
                    break
                yield event_chunk
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    response_headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    }
    if remaining_prompts is not None:
        response_headers["X-Demo-Prompts-Remaining"] = str(remaining_prompts)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=response_headers
    )

@router.get("/health")
def health_check():
    from ai.provider_service import ai_provider_service
    return {
        "status": "healthy",
        "service": "Athena AI Backend",
        "timestamp": "ok",
        "ai_providers": ai_provider_service.get_provider_status()
    }


@router.get("/sessions")
def get_sessions(user=Depends(verify_user)):
    return list_active_sessions(user.id)

@router.get("/sessions/{session_id}/history")
def get_history(session_id: str, user=Depends(verify_user)):
    return {
        "session_id": session_id,
        "history": get_session_history(session_id, user.id)
    }

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user=Depends(verify_user)):
    return clear_session(session_id, user.id)

@router.get("/memory")
def get_memory(
    session_id: Optional[str] = Query(None),
    user=Depends(verify_user)
):
    return {
        "identifier": user.id,
        "memory": get_memory_summary(user.id)
    }

@router.delete("/memory")
def clear_memory(
    session_id: Optional[str] = Query(None),
    user=Depends(verify_user)
):
    cleared = clear_user_memory(user.id, user_id=user.id)
    return {
        "status": "cleared",
        "identifier": user.id,
        "success": cleared
    }
