import json
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from services.db import supabase

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
STUDIO_SESSIONS_FILE = DATA_DIR / "studio_sessions.json"


def _safe_int(val: Any, default: int = 0) -> int:
    """Safely converts a value to integer, guarding against None or invalid strings."""
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _safe_float(val: Any, default: float = 1.0) -> float:
    """Safely converts a value to float, guarding against None or invalid strings."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _load_local_sessions() -> Dict[str, List[Dict[str, Any]]]:
    """Loads locally cached studio sessions: { user_id: [ session_dict, ... ] }."""
    if not STUDIO_SESSIONS_FILE.exists():
        return {}
    try:
        with open(STUDIO_SESSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Studio Sessions Cache Load Error] {e}")
        return {}


def _save_local_sessions(data: Dict[str, List[Dict[str, Any]]]):
    try:
        with open(STUDIO_SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Studio Sessions Cache Save Error] {e}")


_supabase_studio_missing = False

def _can_use_supabase() -> bool:
    return not _supabase_studio_missing


def _format_relative_time_narrative(iso_str: str, practice_type: str, routine: Optional[str] = None) -> str:
    """
    Transforms a timestamp and practice into a warm, gentle sentence.
    Zero scores, zero percentages, zero gamification.
    """
    now = datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    except Exception:
        dt = now

    diff = now - dt
    days_ago = diff.days
    hour = dt.hour

    if hour < 12:
        part_of_day = "this morning"
        time_desc = "morning"
    elif hour < 17:
        part_of_day = "this afternoon"
        time_desc = "afternoon"
    elif hour < 21:
        part_of_day = "this evening"
        time_desc = "evening"
    else:
        part_of_day = "tonight"
        time_desc = "night"

    if days_ago == 0:
        time_phrase = part_of_day
    elif days_ago == 1:
        time_phrase = "yesterday" if time_desc not in ["evening", "night"] else "last night"
    elif days_ago < 7:
        weekday = dt.strftime("%A")
        time_phrase = f"{weekday} {time_desc}"
    else:
        time_phrase = dt.strftime("%B %d")

    p_lower = (practice_type or "").lower()
    if p_lower == "yoga":
        r_name = routine if routine else "Yoga Sanctuary"
        return f"Practiced {r_name} {time_phrase}."
    elif p_lower == "breathe":
        return f"Breathed together {time_phrase}."
    elif p_lower == "ground":
        return f"Grounded with 5-4-3-2-1 {time_phrase}."
    elif p_lower == "sleep":
        return f"Rested with Sleep Sanctuary {time_phrase}."
    elif p_lower == "quiet":
        return f"Took a Quiet Pause {time_phrase}."
    elif p_lower == "body_scan":
        return f"Practiced Body Scan Relaxation {time_phrase}."
    elif p_lower == "walk":
        return f"Took a Mindful Walk {time_phrase}."
    elif p_lower == "pmr":
        return f"Practiced Muscle Relaxation {time_phrase}."
    elif p_lower == "self_compassion":
        return f"Paused with Self-Compassion {time_phrase}."
    else:
        label = routine or practice_type.replace("_", " ").title()
        return f"Took a moment for {label} {time_phrase}."


def save_studio_session(user_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
    """Persists an exercise practice session to Supabase with local JSON fallback.
    Guarantees clean exercise history fields and backwards compatibility."""
    now_iso = datetime.now(timezone.utc).isoformat()
    session_id = session_data.get("id") or str(uuid.uuid4())

    # 1. Clean exercise metadata normalization
    ex_id = session_data.get("exercise_id") or session_data.get("routine") or session_data.get("practice_type") or "exercise"
    ex_category = session_data.get("exercise_category") or session_data.get("practice_type") or "mindfulness"
    ex_name = session_data.get("exercise_name") or session_data.get("routine") or ex_category.replace("_", " ").title()

    # 2. Timing normalization
    started_at = session_data.get("started_at") or now_iso
    duration_sec = _safe_int(session_data.get("duration_seconds") or session_data.get("actual_duration"))

    # 3. Status determination: STARTED | COMPLETED | ABANDONED (and lowercase equivalents)
    raw_status = session_data.get("completion_status") or session_data.get("session_status")
    if raw_status in ["STARTED", "COMPLETED", "ABANDONED"]:
        completion_status = raw_status
    elif raw_status in ["started", "completed", "abandoned", "paused"]:
        completion_status = raw_status.upper()
    elif raw_status in ["full", "partial", "early_exit"]:
        completion_status = raw_status
    elif session_data.get("completed") is True:
        completion_status = "COMPLETED"
    elif session_data.get("exited_early") is True or session_data.get("early_exit") is True:
        completion_status = "ABANDONED"
    else:
        completion_status = "COMPLETED" if session_data.get("completed", False) else "STARTED"

    session_status = session_data.get("session_status") or completion_status.lower()

    is_completed = (completion_status in ["COMPLETED", "full"]) and not session_data.get("exited_early", False) and not session_data.get("early_exit", False)
    completed_at = session_data.get("completed_at") or (now_iso if is_completed else None)

    playback_speed = _safe_float(session_data.get("playback_speed"), default=1.0)
    last_step = _safe_int(session_data.get("last_step") or session_data.get("steps_completed") or 1, default=1)

    record = {
        "id": session_id,
        "user_id": user_id,
        # Clean Model Fields
        "exercise_id": ex_id,
        "exercise_name": ex_name,
        "exercise_category": ex_category,
        "started_at": started_at,
        "completed_at": completed_at,
        "duration_seconds": duration_sec,
        "completion_status": completion_status,
        "session_status": session_status,
        "voice_used": bool(session_data.get("voice_used", False)),
        "voice_enabled": bool(session_data.get("voice_enabled", session_data.get("voice_used", False))),
        "playback_speed": playback_speed,
        "instruction_mode": str(session_data.get("instruction_mode", "TEXT")),
        "session_id": session_data.get("session_id"),
        "before_mood": session_data.get("before_mood"),
        "after_mood": session_data.get("after_mood"),
        "notes": session_data.get("notes"),
        "early_exit": bool(session_data.get("early_exit") or session_data.get("exited_early", False)),
        "completion_percentage": session_data.get("completion_percentage"),
        "steps_completed": _safe_int(session_data.get("steps_completed")),
        "last_step": last_step,
        "total_steps": _safe_int(session_data.get("total_steps")),
        "planned_duration_seconds": _safe_int(session_data.get("planned_duration_seconds") or session_data.get("planned_duration")),
        "pause_count": _safe_int(session_data.get("pause_count") or session_data.get("pauses_count")),
        "last_phase": _safe_int(session_data.get("last_phase") or session_data.get("last_step") or 1, default=1),
        "last_position_seconds": _safe_int(session_data.get("last_position_seconds") or duration_sec),
        "language": str(session_data.get("language") or session_data.get("selected_language") or "en"),
        "selected_language": str(session_data.get("selected_language") or session_data.get("language") or "en"),
        # Legacy Fields for full backwards compatibility
        "practice_type": session_data.get("practice_type") or ex_category,
        "routine": session_data.get("routine") or ex_name,
        "planned_duration": session_data.get("planned_duration"),
        "actual_duration": duration_sec,
        "completed": is_completed,
        "paused": bool(session_data.get("paused", False)),
        "pauses_count": _safe_int(session_data.get("pause_count") or session_data.get("pauses_count")),
        "resumed": bool(session_data.get("resumed", False)),
        "pace": str(session_data.get("pace", "balanced")),
        "repeated_instruction": _safe_int(session_data.get("repeated_instruction")),
        "exited_early": bool(session_data.get("exited_early") or session_data.get("early_exit", False)),
        "camera_mode": str(session_data.get("camera_mode", "first_person")),
        "practice_mode": str(session_data.get("practice_mode", "guided")),
        "voice_style": str(session_data.get("voice_style", "nova")),
        "exit_reason": str(session_data.get("exit_reason", "completed")),
        "ended_at": completed_at or now_iso,
    }

    # Attempt Supabase insert into studio_sessions
    try:
        res = supabase.table("studio_sessions").insert(record).execute()
        if res.data and len(res.data) > 0:
            record = res.data[0]
    except Exception as e:
        print(f"[Supabase Studio Session Insert Fallback] {e}")

    # Also persist to dedicated exercise_sessions table
    try:
        supabase.table("exercise_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "exercise_id": ex_id,
            "exercise_name": ex_name,
            "category": ex_category,
            "started_at": started_at,
            "completed_at": completed_at,
            "duration_seconds": duration_sec,
            "language": record.get("language", "en"),
            "completed": is_completed,
            "completion_percentage": session_data.get("completion_percentage") or (100 if is_completed else 0),
            "mood_before": session_data.get("before_mood"),
            "mood_after": session_data.get("after_mood"),
        }).execute()
    except Exception:
        pass

    # Always persist locally to cache (preserves data across rebuilds)
    local = _load_local_sessions()
    if user_id not in local:
        local[user_id] = []
    # Avoid duplicate ID in local
    local[user_id] = [s for s in local[user_id] if s.get("id") != session_id]
    local[user_id].insert(0, record)
    _save_local_sessions(local)

    # Emit behavior event into Unified Intelligence Timeline
    try:
        from services.behavior_pipeline import record_behavior_event
        event_type = "session_completed" if is_completed else "session_exited_early"
        record_behavior_event(
            user_id=user_id,
            source="studio",
            event_type=event_type,
            metadata={
                "session_id": session_id,
                "exercise_id": ex_id,
                "exercise_name": ex_name,
                "exercise_category": ex_category,
                "duration_seconds": duration_sec,
                "completion_status": completion_status,
                "completed": is_completed,
                "voice_used": bool(record.get("voice_used", False)),
                "instruction_mode": record.get("instruction_mode", "TEXT"),
            },
            timestamp=started_at
        )
    except Exception as be_err:
        print(f"[Studio Behavior Event Warning] {be_err}")

    return record


def get_studio_sessions(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves user's practice sessions sorted latest first."""
    if not user_id:
        return []

    # Handle Demo Mode with Dynamic Date Projection & instant retrieval
    from services.demo_date_projector import DEMO_USER_ID, get_demo_date_offset, project_studio_session
    if user_id == DEMO_USER_ID:
        d_offset = get_demo_date_offset()
        local = _load_local_sessions().get(user_id, [])
        projected = [project_studio_session(s, d_offset) for s in local]
        projected_sorted = sorted(projected, key=lambda x: x.get("started_at", "") or x.get("created_at", ""), reverse=True)
        return projected_sorted[:limit]

    global _supabase_studio_missing
    if _can_use_supabase():
        try:
            res = (
                supabase.table("studio_sessions")
                .select("*")
                .eq("user_id", user_id)
                .order("started_at", desc=True)
                .limit(limit)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return res.data
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_studio_missing = True
            print(f"[Supabase Studio Session List Fallback] {e}")

    local = _load_local_sessions().get(user_id, [])
    local_sorted = sorted(local, key=lambda x: x.get("started_at", ""), reverse=True)
    return local_sorted[:limit]


def get_session_by_id(user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single session by id for the given user."""
    global _supabase_studio_missing
    if _can_use_supabase():
        try:
            res = (
                supabase.table("studio_sessions")
                .select("*")
                .eq("user_id", user_id)
                .eq("id", session_id)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            if "PGRST205" in str(e) or "schema cache" in str(e):
                _supabase_studio_missing = True
            print(f"[Supabase Studio Session Get Fallback] {e}")

    local = _load_local_sessions().get(user_id, [])
    for s in local:
        if s.get("id") == session_id:
            return s
    return None


def start_studio_session(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Initializes a new exercise session with STARTED status."""
    session_id = data.get("session_id") or str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()
    
    session_payload = {
        **data,
        "id": session_id,
        "session_id": session_id,
        "started_at": started_at,
        "completion_status": "STARTED",
        "completed": False,
        "duration_seconds": 0,
        "early_exit": False,
        "steps_completed": 0,
    }
    return save_studio_session(user_id, session_payload)


def update_studio_session(user_id: str, session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates progress (e.g. steps completed or duration) on an existing session."""
    existing = get_session_by_id(user_id, session_id) or {}
    updated = {**existing, **data, "id": session_id}
    return save_studio_session(user_id, updated)


def complete_studio_session(user_id: str, session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Marks a session as COMPLETED with completion timestamp and actual duration."""
    now_iso = datetime.now(timezone.utc).isoformat()
    existing = get_session_by_id(user_id, session_id) or {}
    
    completed_payload = {
        **existing,
        **data,
        "id": session_id,
        "completion_status": "COMPLETED",
        "completed": True,
        "completed_at": now_iso,
        "ended_at": now_iso,
        "early_exit": False,
        "exited_early": False,
    }
    return save_studio_session(user_id, completed_payload)


def abandon_studio_session(user_id: str, session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Marks an exercise session as ABANDONED when user exits early. Does NOT count as completed."""
    now_iso = datetime.now(timezone.utc).isoformat()
    existing = get_session_by_id(user_id, session_id) or {}
    
    abandoned_payload = {
        **existing,
        **data,
        "id": session_id,
        "completion_status": "ABANDONED",
        "completed": False,
        "ended_at": now_iso,
        "early_exit": True,
        "exited_early": True,
        "exit_reason": data.get("reason", "user_ended_early"),
    }
    return save_studio_session(user_id, abandoned_payload)


IST = timezone(timedelta(hours=5, minutes=30))


def _format_ist_display_date(iso_str: str) -> str:
    """Formats an ISO timestamp into user-friendly IST relative display date."""
    try:
        dt_utc = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        dt_ist = dt_utc.astimezone(IST)
        now_ist = datetime.now(timezone.utc).astimezone(IST)
        
        diff_days = (now_ist.date() - dt_ist.date()).days
        if diff_days == 0:
            return "Today"
        elif diff_days == 1:
            return "Yesterday"
        elif diff_days < 7:
            return dt_ist.strftime("%A")
        elif dt_ist.year == now_ist.year:
            return dt_ist.strftime("%b %d")
        else:
            return dt_ist.strftime("%b %d, %Y")
    except Exception:
        return "Recent"


def get_user_studio_history(user_id: str, limit: int = 50) -> Dict[str, Any]:
    """
    Returns verified stored practice history for the authenticated user.
    Strictly uses real data; never fabricates records or statistics.
    """
    sessions = get_studio_sessions(user_id, limit=limit)
    items = []
    total_completed = 0
    today_completed_count = 0
    total_duration_sec = 0

    for s in sessions:
        status = s.get("completion_status") or ("COMPLETED" if s.get("completed") else "STARTED")
        # Only COMPLETED counts as completed
        is_completed = (status in ["COMPLETED", "full"]) and not s.get("early_exit") and not s.get("exited_early")
        
        dur = int(s.get("duration_seconds") or s.get("actual_duration") or 0)
        iso_time = s.get("completed_at") or s.get("started_at") or datetime.now(timezone.utc).isoformat()
        display_date = _format_ist_display_date(iso_time)

        if is_completed:
            total_completed += 1
            total_duration_sec += dur
            if display_date == "Today":
                today_completed_count += 1

        items.append({
            "id": s.get("id", str(uuid.uuid4())),
            "user_id": user_id,
            "exercise_id": s.get("exercise_id") or s.get("practice_type") or "exercise",
            "exercise_name": s.get("exercise_name") or s.get("routine") or "Exercise",
            "exercise_category": (s.get("exercise_category") or s.get("practice_type") or "RESET").upper(),
            "started_at": s.get("started_at") or iso_time,
            "completed_at": s.get("completed_at"),
            "duration_seconds": dur,
            "completion_status": status,
            "session_status": s.get("session_status") or status.lower(),
            "instruction_mode": s.get("instruction_mode", "VOICE"),
            "steps_completed": _safe_int(s.get("steps_completed")),
            "last_step": _safe_int(s.get("last_step") or s.get("steps_completed") or 1, default=1),
            "total_steps": _safe_int(s.get("total_steps")),
            "voice_enabled": bool(s.get("voice_enabled") or s.get("voice_used", False)),
            "playback_speed": _safe_float(s.get("playback_speed"), default=1.0),
            "before_mood": s.get("before_mood"),
            "after_mood": s.get("after_mood"),
            "notes": s.get("notes"),
            "display_date": display_date,
            "planned_duration_seconds": _safe_int(s.get("planned_duration_seconds") or s.get("planned_duration")),
            "pause_count": _safe_int(s.get("pause_count") or s.get("pauses_count")),
            "last_phase": _safe_int(s.get("last_phase") or s.get("last_step") or 1, default=1),
            "last_position_seconds": _safe_int(s.get("last_position_seconds") or dur),
        })

    # Section 11: Real Today's Activity Label
    if today_completed_count == 0:
        today_activity_label = "Nothing practiced yet today."
    elif today_completed_count == 1:
        today_activity_label = "1 practice completed today."
    else:
        today_activity_label = f"{today_completed_count} practices completed today."

    # Section 2 & 16: Recommended for you (Based only on real user data)
    from services.studio_exercises import get_exercise_by_id
    if total_completed < 2:
        rec_ex = get_exercise_by_id("two_minute_reset")
        recommended = {
            "exercise": rec_ex,
            "reason": "Start with a short reset.",
        } if rec_ex else None
    else:
        # Determine based on last completed category
        last_completed = next((s for s in items if s["completion_status"] == "COMPLETED"), None)
        last_cat = (last_completed["exercise_category"] if last_completed else "RESET").upper()
        # Recommend complementary practice
        rec_slug = "box_breathing" if last_cat == "RESET" else "grounding_reset"
        rec_ex = get_exercise_by_id(rec_slug) or get_exercise_by_id("two_minute_reset")
        recommended = {
            "exercise": rec_ex,
            "reason": f"Continuing your gentle rhythm in {rec_ex.get('category', 'Mindfulness').title()}.",
        } if rec_ex else None

    return {
        "sessions": items,
        "total_completed": total_completed,
        "total_minutes": round(total_duration_sec / 60),
        "today_completed_count": today_completed_count,
        "today_activity_label": today_activity_label,
        "recommended_exercise": recommended,
    }


def get_recent_moments(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Formats recent practices into compassionate, un-gamified narrative moments.
    Guarantees:
    1. Only strictly COMPLETED exercises are included (STARTED or ABANDONED are never counted).
    2. No duplicate rendering of the same practice event.
    3. No fabricated analytics or streaks."""
    sessions = get_studio_sessions(user_id, limit=50)
    moments = []
    seen_narratives = set()
    seen_ids = set()

    for s in sessions:
        # Check completion status: Only COMPLETED (or legacy 'full') counts!
        status = s.get("completion_status")
        if status:
            if status not in ["COMPLETED", "full"]:
                continue
        else:
            # Legacy record: check completed flag
            if not s.get("completed", False):
                continue

        session_id = s.get("id")
        if session_id and session_id in seen_ids:
            continue

        iso_time = s.get("started_at") or s.get("completed_at") or datetime.now(timezone.utc).isoformat()
        p_type = s.get("exercise_category") or s.get("practice_type", "")
        routine = s.get("exercise_name") or s.get("routine")
        narrative = _format_relative_time_narrative(iso_time, p_type, routine)

        # Do not repeat identical narrative lines
        if narrative in seen_narratives:
            continue

        if session_id:
            seen_ids.add(session_id)
        seen_narratives.add(narrative)

        moments.append({
            "id": session_id or str(uuid.uuid4()),
            "exercise_id": s.get("exercise_id") or p_type,
            "exercise_name": routine or p_type.replace("_", " ").title(),
            "exercise_category": p_type,
            "practice_type": p_type,
            "routine": routine,
            "moment_text": narrative,
            "completed": True,
            "started_at": iso_time,
            "completed_at": s.get("completed_at") or s.get("ended_at") or iso_time,
            "duration_seconds": int(s.get("duration_seconds") or s.get("actual_duration") or 0),
            "completion_status": "COMPLETED",
        })

        if len(moments) >= limit:
            break

    return moments


def get_gentle_reflection(practice_type: Optional[str] = None, routine: Optional[str] = None, completed: bool = True) -> str:
    """Returns Athena's single post-practice gentle sentence. Never over-praises or gamifies."""
    p = (practice_type or "").lower()

    if not completed:
        return "Whatever time you took was enough. You are allowed to stop whenever you need."

    reflections = {
        "breathe": "Thank you for making space for yourself.",
        "ground": "You are right here, steady and safe in this moment.",
        "sleep": "There's nothing else you need to carry into tonight.",
        "quiet": "Stillness is always here whenever you feel ready to return.",
        "yoga": "Notice if anything in your body feels a little lighter.",
        "body_scan": "Carry this softness with you into whatever comes next.",
        "walk": "Thank you for moving with presence and ease today.",
        "pmr": "Let your muscles remain heavy, grounded, and at rest.",
        "self_compassion": "You don't need to earn kindness today. You are worthy of it as you are.",
    }

    if p == "yoga" and routine:
        r_lower = routine.lower()
        if "morning" in r_lower:
            return "Begin your day softly. There is no rush."
        elif "desk" in r_lower:
            return "Notice if your neck and back feel a little more at ease."
        elif "anxiety" in r_lower:
            return "Whatever was tense, you gave it permission to soften."
        elif "evening" in r_lower:
            return "Let today's movements settle into quiet rest."

    return reflections.get(p, "Thank you for honoring your pace today.")


def format_studio_practice_context(user_id: str) -> str:
    """
    Constructs a compassionate, structured context of the user's practice history.
    Used exclusively as internal context for Athena's long-term memory.
    Strictly avoids clinical or diagnostic claims.
    """
    if not user_id:
        return ""

    sessions = get_studio_sessions(user_id, limit=30)
    if not sessions:
        return ""

    completed_sessions = [
        s for s in sessions
        if (s.get("completion_status") in ["COMPLETED", "full"] or s.get("completed"))
        and not s.get("early_exit") and not s.get("exited_early")
    ]

    if not completed_sessions:
        return ""

    cat_counts = {}
    total_dur = 0
    voice_count = 0
    for s in completed_sessions:
        cat = (s.get("exercise_category") or s.get("practice_type") or "RESET").upper()
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        dur = int(s.get("duration_seconds") or s.get("actual_duration") or 0)
        total_dur += dur
        if s.get("voice_enabled") or s.get("voice_used"):
            voice_count += 1

    top_cats = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
    cat_str = ", ".join([f"{c[0].title()} ({c[1]}x)" for c in top_cats[:3]])
    avg_mins = max(1, round(total_dur / (len(completed_sessions) * 60))) if completed_sessions else 2

    latest = completed_sessions[0]
    latest_name = latest.get("exercise_name") or latest.get("routine") or "Guided Practice"
    latest_time = latest.get("completed_at") or latest.get("started_at") or ""
    latest_date_str = _format_ist_display_date(latest_time) if latest_time else "recently"
    latest_dur_mins = max(1, round(int(latest.get("duration_seconds") or 0) / 60))

    voice_pref = "Prefers guided voice narration" if voice_count > len(completed_sessions) / 2 else "Uses both voice and silent text modes"

    return f"""User Studio Practice Routine:
- Completed Sessions: {len(completed_sessions)} practices recorded.
- Familiar Practice Categories: {cat_str}.
- Average Session Length: ~{avg_mins} minutes.
- Guidance Preference: {voice_pref}.
- Most Recent Practice: {latest_name} ({latest_dur_mins} min, {latest_date_str}).
Therapeutic Context Guidance:
- Embody this understanding gently and warmly when relevant (e.g. noticing they returned to a breathing practice or took time to ground).
- Do not make clinical conclusions or diagnostic judgments from exercise data. Never say things like 'You practice breathing because you have anxiety'.
- Silence and personal pace are always respected."""

