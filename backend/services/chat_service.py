import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from services.db import supabase

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
MESSAGES_FILE = DATA_DIR / "messages.json"

def _load_local_messages():
    if not MESSAGES_FILE.exists():
        return {}
    try:
        with open(MESSAGES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_local_messages(data):
    try:
        with open(MESSAGES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Save Local Messages Error] {e}")

def load_history(conversation_id: str):
    if not conversation_id:
        return []
        
    try:
        r = supabase.table("messages")\
            .select("id, conversation_id, role, content, created_at")\
            .eq("conversation_id", conversation_id)\
            .order("created_at")\
            .execute()
        if r.data and len(r.data) > 0:
            return r.data
    except Exception as e:
        print(f"[Supabase Load History Error] {e}")

    # Fallback to local cache
    local = _load_local_messages()
    return local.get(conversation_id, [])

def save_message(
    conversation_id: str,
    role: str,
    content: str
):
    if not conversation_id or not content:
        return None

    msg_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "id": msg_id,
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "created_at": now_iso
    }

    # Save to local cache first (guaranteed zero data loss)
    local = _load_local_messages()
    if conversation_id not in local:
        local[conversation_id] = []
    local[conversation_id].append(record)
    _save_local_messages(local)

    try:
        uuid.UUID(str(conversation_id))
        r = supabase.table("messages").insert({
            "conversation_id": str(conversation_id),
            "role": role,
            "content": content
        }).execute()
        return r.data[0] if r.data else record
    except ValueError:
        # Non-UUID conversation (e.g. demo session), safely preserved in local cache
        return record
    except Exception as e:
        print(f"[Supabase Save Message Error] {e}")
        return record