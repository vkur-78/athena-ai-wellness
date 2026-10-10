import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from services.db import supabase
from services.profile_service import get_profile
from ai.checkin_reflection import generate_checkin_reflection
from ai.memory_manager import update_user_memory

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
CHECKINS_CACHE_FILE = DATA_DIR / "daily_checkins.json"

def _load_local_checkins() -> Dict[str, Dict[str, Any]]:
    """Loads locally cached check-ins: { user_id: { date_str: checkin_dict } }."""
    if not CHECKINS_CACHE_FILE.exists():
        return {}
    try:
        with open(CHECKINS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Checkin Cache Load Error] {e}")
        return {}

def _save_local_checkins(data: Dict[str, Dict[str, Any]]):
    try:
        with open(CHECKINS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Checkin Cache Save Error] {e}")

_supabase_checkins_missing = False

def _can_use_supabase() -> bool:
    return not _supabase_checkins_missing

def get_today_checkin(user_id: str, client_date: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves check-in for the target calendar date (defaults to UTC today or IST today)."""
    if not user_id:
        return None

    # Handle Demo Mode with Dynamic Date Projection & instant zero-latency retrieval
    from services.demo_date_projector import DEMO_USER_ID, get_demo_date_offset, project_checkin, get_current_server_date_ist
    if user_id == DEMO_USER_ID:
        d_offset = get_demo_date_offset()
        target_date = client_date or get_current_server_date_ist().isoformat()
        local = _load_local_checkins()
        user_records = local.get(user_id, {})
        for orig_date, checkin in user_records.items():
            proj = project_checkin(checkin, d_offset)
            if proj.get("date") == target_date:
                return proj
        return None

    target_date = client_date or datetime.utcnow().date().isoformat()

    # Try Supabase first
    global _supabase_checkins_missing
    if _can_use_supabase():
        try:
            res = (
                supabase.table("daily_checkins")
                .select("*")
                .eq("user_id", user_id)
                .eq("date", target_date)
                .execute()
            )
            if res.data and len(res.data) > 0:
                checkin = res.data[0]
                # Update local cache
                local = _load_local_checkins()
                if user_id not in local:
                    local[user_id] = {}
                local[user_id][target_date] = checkin
                _save_local_checkins(local)
                return checkin
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_checkins_missing = True
            print(f"[Supabase Checkin Fetch Fallback] {e}")

    # Fallback to local cache
    local = _load_local_checkins()
    user_records = local.get(user_id, {})
    return user_records.get(target_date)

def create_checkin(user_id: str, data: Dict[str, Any], client_date: Optional[str] = None) -> Dict[str, Any]:
    """Creates a new daily check-in with AI reflection and living memory sync."""
    target_date = data.get("date") or client_date or datetime.utcnow().date().isoformat()
    today_utc = datetime.utcnow().date().isoformat()
    if target_date > today_utc:
        raise ValueError("Check-in date cannot be in the future.")

    # Check for existing check-in on this date
    existing = get_today_checkin(user_id, target_date)
    if existing:
        raise ValueError(f"A check-in for {target_date} has already been submitted.")

    mood = data.get("mood", "Okay")
    energy_level = int(data.get("energy_level") or data.get("energy") or 3)
    stress_level = int(data.get("stress_level") or data.get("stress") or 3)
    reflection_text = data.get("reflection_text") or data.get("reflection")

    # Fetch user intake baseline context
    user_profile = get_profile(user_id)

    # Generate personalized 2-3 sentence AI reflection in user's language
    lang = data.get("language") or (user_profile.get("preferred_language") if user_profile else "en") or "en"
    ai_reflection = generate_checkin_reflection(
        mood=mood,
        energy_level=energy_level,
        stress_level=stress_level,
        reflection_text=reflection_text,
        user_profile=user_profile,
        language=lang
    )

    now = datetime.utcnow().isoformat()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "date": target_date,
        "mood": mood,
        "energy_level": energy_level,
        "stress_level": stress_level,
        "reflection_text": reflection_text.strip() if reflection_text else None,
        "ai_reflection": ai_reflection,
        "created_at": now,
        "updated_at": now
    }

    # Save to local file cache first (guarantees zero-data-loss)
    local = _load_local_checkins()
    if user_id not in local:
        local[user_id] = {}
    local[user_id][target_date] = record
    _save_local_checkins(local)

    # Sync latest emotional pulse into Living Memory
    try:
        memory_insights = {
            "daily_mood": mood,
            "daily_energy": f"{energy_level}/5",
            "daily_stress": f"{stress_level}/5",
            "last_checkin_date": target_date
        }
        if reflection_text:
            memory_insights["recent_reflection"] = reflection_text.strip()[:120]

        intensity = "high" if stress_level >= 4 else "moderate" if stress_level >= 3 else "low"
        update_user_memory(
            identifier=user_id,
            new_insights=memory_insights,
            user_message=f"[Daily Wellness Check-in: Mood '{mood}', Energy {energy_level}/5, Stress {stress_level}/5]",
            emotion=mood.lower(),
            stage="checkin",
            user_id=user_id
        )
    except Exception as mem_err:
        print(f"[Checkin Memory Sync Warning] {mem_err}")

    # Emit behavior event into Unified Intelligence Timeline
    try:
        from services.behavior_pipeline import record_behavior_event
        is_grateful = any(w in (reflection_text or "").lower() for w in ["grateful", "thank", "bless", "appreciat"])
        record_behavior_event(
            user_id=user_id,
            source="mood",
            event_type="checkin_submitted",
            metadata={
                "mood": mood,
                "energy": energy_level,
                "tension": stress_level,
                "gratitude": is_grateful,
                "weekday": datetime.utcnow().strftime("%A"),
                "check_in_time": now,
            },
            timestamp=now
        )
    except Exception as be_err:
        print(f"[Checkin Behavior Event Warning] {be_err}")

    # Upsert to Supabase
    global _supabase_checkins_missing
    if _can_use_supabase():
        try:
            res = supabase.table("daily_checkins").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as db_err:
            if "PGRST205" in str(db_err) or "schema cache" in str(db_err):
                _supabase_checkins_missing = True
            print(f"[Supabase Checkin Insert Fallback] {db_err}")

    return record

def get_checkin_history(user_id: str, limit: int = 30, offset: int = 0) -> List[Dict[str, Any]]:
    """Fetches user check-in history sorted by date descending with pagination support."""
    if not user_id:
        return []

    # Handle Demo Mode with Dynamic Date Projection & instant retrieval
    from services.demo_date_projector import DEMO_USER_ID, get_demo_date_offset, project_checkin
    if user_id == DEMO_USER_ID:
        d_offset = get_demo_date_offset()
        local = _load_local_checkins()
        user_records = local.get(user_id, {})
        history = [project_checkin(c, d_offset) for c in user_records.values()]
        history.sort(key=lambda x: x.get("date", ""), reverse=True)
        return history[offset : offset + limit]

    global _supabase_checkins_missing
    if _can_use_supabase():
        try:
            res = (
                supabase.table("daily_checkins")
                .select("*")
                .eq("user_id", user_id)
                .order("date", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            if res.data is not None and len(res.data) > 0:
                return res.data
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_checkins_missing = True
            print(f"[Supabase Checkin History Fallback] {e}")

    local = _load_local_checkins()
    user_records = local.get(user_id, {})
    history = list(user_records.values())
    history.sort(key=lambda x: x.get("date", ""), reverse=True)
    return history[offset : offset + limit]


def get_latest_checkin(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves the most recent daily check-in for the user."""
    if not user_id:
        return None
    history = get_checkin_history(user_id, limit=1)
    return history[0] if history else None


def format_recent_checkin_context(user_id: str) -> str:
    """Formats the latest daily check-in as concise background context for the LLM prompt."""
    if not user_id:
        return ""
    try:
        latest = get_latest_checkin(user_id)
        if not latest:
            return ""
        mood = latest.get("mood") or "unspecified"
        energy = latest.get("energy")
        anxiety = latest.get("anxiety")
        notes = latest.get("notes") or ""
        date_str = latest.get("date") or ""

        parts = [f"Recent Daily Check-in ({date_str}):"]
        parts.append(f"- Logged Mood: {mood}")
        if energy is not None:
            parts.append(f"- Energy Level: {energy}/5")
        if anxiety is not None:
            parts.append(f"- Anxiety / Tension Level: {anxiety}/5")
        if notes and isinstance(notes, str) and notes.strip():
            clean_notes = notes.strip()[:100]
            parts.append(f"- User Note: \"{clean_notes}\"")
        parts.append("(Use this recent check-in as subtle background only if relevant. Do not mechanically recite or assume it overrides the user's latest statement.)")
        return "\n".join(parts)
    except Exception as e:
        print(f"[Format Checkin Context Warning] {e}")
        return ""

