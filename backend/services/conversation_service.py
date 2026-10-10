import json
from pathlib import Path
from services.db import supabase
import uuid

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
CONVERSATIONS_FILE = DATA_DIR / "conversations.json"

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

DEMO_USER_ID = "59327d2b-6e65-456e-ab5a-148602a4bd75"

def _load_local_conversations() -> Dict[str, Dict[str, Any]]:
    if not CONVERSATIONS_FILE.exists():
        return {}
    try:
        with open(CONVERSATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_local_conversations(data: Dict[str, Dict[str, Any]]):
    try:
        with open(CONVERSATIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Save Local Conversations Error] {e}")

def get_conversation(conversation_id: str, user_id: str, device_id: Optional[str] = None):
    """Verifies that conversation exists and belongs to the authenticated user and device."""
    if not conversation_id or not user_id:
        return None

    # Try Supabase first
    try:
        r = supabase.table("conversations").select("*").eq("id", conversation_id).execute()
        if r.data and len(r.data) > 0:
            conv = r.data[0]
            if conv.get("user_id") == user_id:
                if user_id == DEMO_USER_ID and device_id and conv.get("device_id"):
                    if conv.get("device_id") != device_id:
                        return None
                return conv
            return None
    except Exception as e:
        print(f"[Get Conversation Supabase Fallback] {e}")

    # Fallback to local cache
    local = _load_local_conversations()
    conv = local.get(conversation_id)
    if conv and conv.get("user_id") == user_id:
        if user_id == DEMO_USER_ID and device_id and conv.get("device_id"):
            if conv.get("device_id") != device_id:
                return None
        return conv
    return None

def create_conversation(
    user_id: str,
    title: str = "New Conversation",
    demo_session_id: Optional[str] = None,
    device_id: Optional[str] = None
):
    conv_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "id": conv_id,
        "title": title,
        "user_id": user_id,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    if demo_session_id:
        record["demo_session_id"] = demo_session_id
    if device_id:
        record["device_id"] = device_id

    # Save to local cache first
    local = _load_local_conversations()
    local[conv_id] = record
    _save_local_conversations(local)

    # If demo session, update active_conversation_id in demo_sessions
    if device_id or demo_session_id:
        try:
            from services.demo_session_service import update_demo_active_conversation
            update_demo_active_conversation(conv_id, device_id=device_id, demo_session_id=demo_session_id)
        except Exception as e:
            print(f"[Update Demo Active Conv Warning] {e}")

    try:
        r = supabase.table("conversations").insert({
            "id": conv_id,
            "user_id": user_id,
            "title": title
        }).execute()
        if r.data and len(r.data) > 0:
            local[conv_id].update(r.data[0])
            _save_local_conversations(local)
            return local[conv_id]
    except Exception as e:
        print(f"[Create Conversation Supabase Fallback] {e}")

    return record

def list_conversations(
    user_id: str,
    demo_session_id: Optional[str] = None,
    device_id: Optional[str] = None,
    is_demo: bool = False,
    include_sample: bool = False
) -> List[Dict[str, Any]]:
    local = _load_local_conversations()

    # 1. Non-Demo / Real Authenticated User
    if not is_demo and user_id != DEMO_USER_ID:
        try:
            r = supabase.table("conversations").select("*").eq(
                "user_id", user_id
            ).order(
                "created_at", desc=True
            ).execute()
            if r.data and len(r.data) > 0:
                return r.data
        except Exception as e:
            print(f"[List Conversations Supabase Fallback] {e}")

        # Local fallback for this user only
        user_convs = [c for c in local.values() if c.get("user_id") == user_id]
        user_convs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return user_convs

    # 2. Demo User / Demo Session
    # If explicitly requested with include_sample=True (e.g. for weekly replay or dashboard metrics)
    if include_sample:
        demo_all = [c for c in local.values() if c.get("user_id") == DEMO_USER_ID]
        demo_all.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return demo_all

    # Filter conversations scoped to this active demo session / device
    scoped_convs = []
    for c in local.values():
        if c.get("user_id") == DEMO_USER_ID:
            c_dev = c.get("device_id")
            c_sess = c.get("demo_session_id")
            if (device_id and c_dev == device_id) or (demo_session_id and c_sess == demo_session_id):
                scoped_convs.append(c)

    # If no conversation exists yet for this demo visitor, auto-create their initial conversation
    if not scoped_convs:
        initial_conv = create_conversation(
            user_id=DEMO_USER_ID,
            title="New Conversation",
            demo_session_id=demo_session_id,
            device_id=device_id
        )
        return [initial_conv]

    scoped_convs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return scoped_convs

def delete_conversation(conversation_id: str, user_id: str, device_id: Optional[str] = None):
    # Verify ownership before deleting anything
    conv = get_conversation(conversation_id, user_id, device_id=device_id)
    if not conv:
        return None

    # First delete associated messages
    try:
        supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()
    except Exception as e:
        print(f"[Delete Messages Error] {e}")

    # Delete conversation from local cache
    local = _load_local_conversations()
    if conversation_id in local:
        del local[conversation_id]
        _save_local_conversations(local)

    from services.chat_service import _load_local_messages, _save_local_messages
    msgs = _load_local_messages()
    if conversation_id in msgs:
        del msgs[conversation_id]
        _save_local_messages(msgs)

    try:
        r = supabase.table("conversations").delete().eq(
            "id", conversation_id
        ).eq(
            "user_id", user_id
        ).execute()
        return r.data or [conv]
    except Exception as e:
        print(f"[Delete Conversation Error] {e}")
        return [conv]

def update_conversation_title(conversation_id: str, user_id: str, title: str, device_id: Optional[str] = None):
    conv = get_conversation(conversation_id, user_id, device_id=device_id)
    if not conv:
        return None

    local = _load_local_conversations()
    if conversation_id in local:
        local[conversation_id]["title"] = title
        local[conversation_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_local_conversations(local)

    try:
        r = supabase.table("conversations").update({
            "title": title
        }).eq("id", conversation_id).eq("user_id", user_id).execute()
        return r.data[0] if r.data else {"id": conversation_id, "title": title, "user_id": user_id}
    except Exception as e:
        print(f"[Update Title Error] {e}")
        return {"id": conversation_id, "title": title, "user_id": user_id}