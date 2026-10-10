import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from services.db import supabase
from services.profile_service import get_profile
from ai.journal_reflection import generate_journal_reflection

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
JOURNAL_CACHE_FILE = DATA_DIR / "journal_entries.json"

def _load_local_journal() -> Dict[str, Dict[str, Any]]:
    """Loads locally cached entries: { user_id: { entry_id: entry_dict } }."""
    if not JOURNAL_CACHE_FILE.exists():
        return {}
    try:
        with open(JOURNAL_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Journal Cache Load Error] {e}")
        return {}

def _save_local_journal(data: Dict[str, Dict[str, Any]]):
    try:
        with open(JOURNAL_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Journal Cache Save Error] {e}")

_supabase_journal_missing = False

def _can_use_supabase() -> bool:
    return not _supabase_journal_missing

def create_entry(user_id: str, content: str, reflection_enabled: bool = False) -> Dict[str, Any]:
    """Creates a private journal entry with optional on-demand reflection."""
    if not content or not content.strip():
        raise ValueError("Journal content cannot be empty.")

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    ai_reflection = None

    if reflection_enabled:
        user_profile = get_profile(user_id)
        ai_reflection = generate_journal_reflection(content, user_profile)

    record = {
        "id": entry_id,
        "user_id": user_id,
        "content": content.strip(),
        "ai_reflection": ai_reflection,
        "reflection_enabled": reflection_enabled,
        "created_at": now,
        "updated_at": now
    }

    # Save to local file cache first (guarantees zero-data loss)
    local = _load_local_journal()
    if user_id not in local:
        local[user_id] = {}
    local[user_id][entry_id] = record
    _save_local_journal(local)

    # Emit behavior event into Unified Intelligence Timeline
    try:
        from services.behavior_pipeline import record_behavior_event
        word_count = len(content.strip().split())
        record_behavior_event(
            user_id=user_id,
            source="journal",
            event_type="entry_created",
            metadata={
                "entry_id": entry_id,
                "writing_length": word_count,
                "writing_duration": max(1, round(word_count / 25)),
                "writing_hour": datetime.now(timezone.utc).hour,
                "content": content[:300],  # Used only to extract themes, never saved raw
            },
            timestamp=now
        )
    except Exception as be_err:
        print(f"[Journal Behavior Event Warning] {be_err}")

    # Upsert to Supabase
    global _supabase_journal_missing
    if _can_use_supabase():
        try:
            res = supabase.table("journal_entries").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_journal_missing = True
            print(f"[Supabase Journal Insert Fallback] {e}")

    return record

def list_entries(user_id: str, query: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieves journal entries sorted by newest first, with search performed across all user entries before pagination."""
    if not user_id:
        return []

    # Handle Demo Mode with Dynamic Date Projection & instant retrieval
    from services.demo_date_projector import DEMO_USER_ID, get_demo_date_offset, project_journal
    if user_id == DEMO_USER_ID:
        d_offset = get_demo_date_offset()
        local = _load_local_journal()
        user_records = local.get(user_id, {})
        all_entries = [project_journal(j, d_offset) for j in user_records.values()]
        all_entries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        if query and query.strip():
            q_clean = query.strip().lower()
            all_entries = [
                e for e in all_entries
                if q_clean in (e.get("content") or "").lower()
                or q_clean in (e.get("created_at") or "").lower()
            ]
        return all_entries[offset : offset + limit]

    entries: List[Dict[str, Any]] = []

    # Try Supabase first
    global _supabase_journal_missing
    if _can_use_supabase():
        try:
            sb_query = (
                supabase.table("journal_entries")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
            )
            if query and query.strip():
                sb_query = sb_query.ilike("content", f"%{query.strip()}%")
            
            sb_query = sb_query.range(offset, offset + limit - 1)
            res = sb_query.execute()
            if res.data is not None and len(res.data) > 0:
                return res.data
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_journal_missing = True
            print(f"[Supabase Journal List Fallback] {e}")

    # Fallback to local cache: get ALL entries for user first
    local = _load_local_journal()
    user_records = local.get(user_id, {})
    all_entries = list(user_records.values())
    all_entries.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # In-memory search filter across complete user dataset before pagination
    if query and query.strip():
        q_clean = query.strip().lower()
        all_entries = [
            e for e in all_entries
            if q_clean in (e.get("content") or "").lower()
            or q_clean in (e.get("created_at") or "").lower()
        ]

    # Apply pagination on the complete or filtered dataset
    return all_entries[offset : offset + limit]

def get_entry(user_id: str, entry_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single entry by ID for the authenticated user."""
    if not user_id or not entry_id:
        return None

    global _supabase_journal_missing
    if _can_use_supabase():
        try:
            res = (
                supabase.table("journal_entries")
                .select("*")
                .eq("id", entry_id)
                .eq("user_id", user_id)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_journal_missing = True
            print(f"[Supabase Journal Get Fallback] {e}")

    local = _load_local_journal()
    return local.get(user_id, {}).get(entry_id)

def update_entry(user_id: str, entry_id: str, content: Optional[str] = None, reflection_enabled: Optional[bool] = None) -> Optional[Dict[str, Any]]:
    """Updates the content or reflection flag of an existing entry."""
    entry = get_entry(user_id, entry_id)
    if not entry:
        return None

    now = datetime.now(timezone.utc).isoformat()
    if content is not None:
        entry["content"] = content.strip()
    if reflection_enabled is not None:
        entry["reflection_enabled"] = reflection_enabled
    entry["updated_at"] = now

    # Update local cache
    local = _load_local_journal()
    if user_id not in local:
        local[user_id] = {}
    local[user_id][entry_id] = entry
    _save_local_journal(local)

    # Emit behavior event into Unified Intelligence Timeline
    try:
        from services.behavior_pipeline import record_behavior_event
        word_count = len((content or entry.get("content", "")).strip().split())
        record_behavior_event(
            user_id=user_id,
            source="journal",
            event_type="entry_edited",
            metadata={
                "entry_id": entry_id,
                "writing_length": word_count,
                "writing_hour": datetime.now(timezone.utc).hour,
            },
            timestamp=now
        )
    except Exception as be_err:
        print(f"[Journal Edit Event Warning] {be_err}")

    # Update in Supabase
    try:
        supabase.table("journal_entries").update(entry).eq("id", entry_id).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"[Supabase Journal Update Fallback] {e}")

    return entry

def delete_entry(user_id: str, entry_id: str) -> bool:
    """Deletes an entry for the authenticated user."""
    # Remove from local cache
    local = _load_local_journal()
    if user_id in local and entry_id in local[user_id]:
        del local[user_id][entry_id]
        _save_local_journal(local)

    # Emit behavior event into Unified Intelligence Timeline
    try:
        from services.behavior_pipeline import record_behavior_event
        record_behavior_event(
            user_id=user_id,
            source="journal",
            event_type="entry_deleted",
            metadata={"entry_id": entry_id},
        )
    except Exception as be_err:
        print(f"[Journal Delete Event Warning] {be_err}")

    # Delete from Supabase
    try:
        supabase.table("journal_entries").delete().eq("id", entry_id).eq("user_id", user_id).execute()
        return True
    except Exception as e:
        print(f"[Supabase Journal Delete Fallback] {e}")
        return True

def generate_entry_reflection(user_id: str, entry_id: str) -> Optional[Dict[str, Any]]:
    """Generates an on-demand reflection for an existing journal entry."""
    entry = get_entry(user_id, entry_id)
    if not entry:
        return None

    user_profile = get_profile(user_id)
    ai_reflection = generate_journal_reflection(entry["content"], user_profile)

    entry["ai_reflection"] = ai_reflection
    entry["reflection_enabled"] = True
    entry["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Save to local cache
    local = _load_local_journal()
    if user_id not in local:
        local[user_id] = {}
    local[user_id][entry_id] = entry
    _save_local_journal(local)

    # Save to Supabase
    try:
        supabase.table("journal_entries").update({
            "ai_reflection": ai_reflection,
            "reflection_enabled": True,
            "updated_at": entry["updated_at"]
        }).eq("id", entry_id).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"[Supabase Journal Reflection Update Fallback] {e}")

    return entry
