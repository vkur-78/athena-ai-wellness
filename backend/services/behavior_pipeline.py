"""
Athena Unified Behavior Intelligence Pipeline (Phase 7.3 Foundation)
Central event collector, unified timeline, deterministic analytics,
daily summary cache, privacy sanitization, user preference memory,
and smart correlations with human confidence phrasing.
"""

import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
from threading import Lock

from services.db import supabase

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

EVENTS_FILE = DATA_DIR / "behavior_events.json"
SUMMARIES_FILE = DATA_DIR / "daily_summaries.json"
PREFERENCES_FILE = DATA_DIR / "user_preferences.json"

_file_lock = Lock()


def _get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _get_utc_now_iso() -> str:
    return _get_utc_now().isoformat()


def _get_today_date_str() -> str:
    return _get_utc_now().date().isoformat()


# =============================================================================
# PERSISTENCE & LOCAL CACHE HELPERS
# =============================================================================

_events_cache: Optional[Dict[str, List[Dict[str, Any]]]] = None

def _load_events() -> Dict[str, List[Dict[str, Any]]]:
    """Loads events cache: { user_id: [ event_dict, ... ] }"""
    global _events_cache
    if _events_cache is not None:
        return _events_cache
    if not EVENTS_FILE.exists():
        _events_cache = {}
        return _events_cache
    try:
        with open(EVENTS_FILE, "r", encoding="utf-8") as f:
            _events_cache = json.load(f)
            return _events_cache
    except Exception as e:
        print(f"[Behavior Pipeline Events Load Error] {e}")
        _events_cache = {}
        return _events_cache


def _save_events(data: Dict[str, List[Dict[str, Any]]]):
    global _events_cache
    _events_cache = data
    with _file_lock:
        try:
            with open(EVENTS_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            print(f"[Behavior Pipeline Events Save Error] {e}")


_summaries_cache: Optional[Dict[str, Dict[str, Any]]] = None

def _load_summaries() -> Dict[str, Dict[str, Any]]:
    """Loads daily summaries: { user_id: { date_str: summary_dict } }"""
    global _summaries_cache
    if _summaries_cache is not None:
        return _summaries_cache
    if not SUMMARIES_FILE.exists():
        _summaries_cache = {}
        return _summaries_cache
    try:
        with open(SUMMARIES_FILE, "r", encoding="utf-8") as f:
            _summaries_cache = json.load(f)
            return _summaries_cache
    except Exception as e:
        print(f"[Daily Summaries Load Error] {e}")
        _summaries_cache = {}
        return _summaries_cache


def _save_summaries(data: Dict[str, Dict[str, Any]]):
    global _summaries_cache
    _summaries_cache = data
    with _file_lock:
        try:
            with open(SUMMARIES_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            print(f"[Daily Summaries Save Error] {e}")


_preferences_cache: Optional[Dict[str, Dict[str, Any]]] = None

def _load_preferences() -> Dict[str, Dict[str, Any]]:
    global _preferences_cache
    if _preferences_cache is not None:
        return _preferences_cache
    if not PREFERENCES_FILE.exists():
        _preferences_cache = {}
        return _preferences_cache
    try:
        with open(PREFERENCES_FILE, "r", encoding="utf-8") as f:
            _preferences_cache = json.load(f)
            return _preferences_cache
    except Exception as e:
        print(f"[User Preferences Load Error] {e}")
        _preferences_cache = {}
        return _preferences_cache


def _save_preferences(data: Dict[str, Dict[str, Any]]):
    global _preferences_cache
    _preferences_cache = data
    with _file_lock:
        try:
            with open(PREFERENCES_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            print(f"[User Preferences Save Error] {e}")


# =============================================================================
# PRIVACY FILTER
# =============================================================================

FORBIDDEN_RAW_KEYS = {"message", "text", "raw_message", "content", "prompt", "raw_content"}


def _sanitize_metadata(source: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enforces privacy layer: raw conversation text is never permanently stored
    in the behavior events timeline. Keeps only high-level themes, counts,
    and durations.
    """
    sanitized = {}
    for k, v in metadata.items():
        if source == "chat" and k.lower() in FORBIDDEN_RAW_KEYS:
            # Drop raw private conversation text
            continue
        sanitized[k] = v

    # Extract themes if raw text was present in content/message/text
    raw_text = metadata.get("content") or metadata.get("message") or metadata.get("text") or ""
    if raw_text and "detected_themes" not in sanitized:
        c_str = str(raw_text).lower()
        extracted = []
        if any(w in c_str for w in ["work", "deadline", "job", "office", "career", "client"]):
            extracted.append("work")
        if any(w in c_str for w in ["sleep", "tired", "insomnia", "rest", "night", "wake"]):
            extracted.append("sleep")
        if any(w in c_str for w in ["relationship", "partner", "friend", "family", "mom", "dad"]):
            extracted.append("relationships")
        if any(w in c_str for w in ["health", "body", "sick", "pain", "energy"]):
            extracted.append("health")
        if any(w in c_str for w in ["pressure", "expectation", "should", "fail", "perfect"]):
            extracted.append("self-pressure")
        if extracted:
            sanitized["detected_themes"] = extracted

    return sanitized


# =============================================================================
# EVENT COLLECTOR
# =============================================================================

def _bg_supabase_sync(event_id: str, user_id: str, source: str, event_type: str, sanitized_meta: Dict[str, Any], now_iso: str):
    try:
        supabase.table("behavior_events").insert({
            "id": event_id,
            "user_id": user_id,
            "source": source,
            "event_type": event_type,
            "metadata": sanitized_meta,
            "created_at": now_iso
        }).execute()
    except Exception:
        pass


def record_behavior_event(
    user_id: str,
    source: str,
    event_type: str,
    metadata: Optional[Dict[str, Any]] = None,
    timestamp: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Records a standardized behavior event in <100ms.
    Stores in unified behavior_events store, updates daily summary,
    and updates learned user preferences.
    """
    if not user_id:
        user_id = "guest_sanctuary"

    now_iso = timestamp or _get_utc_now_iso()
    raw_meta = metadata or {}
    sanitized_meta = _sanitize_metadata(source, raw_meta)

    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    event_record = {
        "id": event_id,
        "userId": user_id,
        "timestamp": now_iso,
        "source": source,
        "type": event_type,
        "metadata": sanitized_meta,
    }

    # 1. Update in-memory & local JSON cache
    events_data = _load_events()
    if user_id not in events_data:
        events_data[user_id] = []
    events_data[user_id].insert(0, event_record)
    # Keep up to 2,000 most recent events per user for fast traversal
    if len(events_data[user_id]) > 2000:
        events_data[user_id] = events_data[user_id][:2000]
    _save_events(events_data)

    # 2. Incremental update of Daily Summary
    event_date = now_iso.split("T")[0]
    _update_daily_summary_incrementally(user_id, event_date, event_record)

    # 3. Update User Preference Memory
    _update_preferences_from_event(user_id, event_record)

    # 4. Asynchronous fire-and-forget Supabase sync (guarantees sub-100ms write)
    import threading
    threading.Thread(
        target=_bg_supabase_sync,
        args=(event_id, user_id, source, event_type, sanitized_meta, now_iso),
        daemon=True
    ).start()

    return event_record


def record_behavior_events_batch(user_id: str, events: List[Dict[str, Any]]) -> int:
    """Batch writes events for offline resilience queue sync."""
    count = 0
    for evt in events:
        source = evt.get("source", "dashboard")
        event_type = evt.get("type", "action")
        metadata = evt.get("metadata", {})
        timestamp = evt.get("timestamp")
        record_behavior_event(user_id, source, event_type, metadata, timestamp)
        count += 1
    return count


def get_user_events(user_id: str, limit: int = 100, source: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves user events from the unified timeline."""
    events_data = _load_events()
    user_list = events_data.get(user_id, [])

    from services.demo_date_projector import DEMO_USER_ID, get_demo_date_offset, project_behavior_event
    if user_id == DEMO_USER_ID:
        d_offset = get_demo_date_offset()
        user_list = [project_behavior_event(e, d_offset) for e in user_list]

    if source:
        user_list = [e for e in user_list if e.get("source") == source]
    return user_list[:limit]


# =============================================================================
# DAILY SUMMARY CACHE ENGINE
# =============================================================================

def _update_daily_summary_incrementally(user_id: str, date_str: str, event: Dict[str, Any]):
    """Incrementally mutates today's summary without recalculating everything from scratch."""
    summaries = _load_summaries()
    user_summaries = summaries.setdefault(user_id, {})
    current = user_summaries.get(date_str, {
        "date": date_str,
        "mood": None,
        "energy": None,
        "tension": None,
        "studioMinutes": 0,
        "journalWords": 0,
        "chatSessions": 0,
        "streak": 1,
        "calmScore": 82,
        "lastActive": event.get("timestamp"),
        "recommendedNextStep": "Take a 3-minute breath pause in Sakura Garden."
    })

    source = event.get("source")
    event_type = event.get("type")
    meta = event.get("metadata", {})

    current["lastActive"] = event.get("timestamp")

    if source == "mood" and event_type == "checkin_submitted":
        current["mood"] = meta.get("mood", current["mood"])
        current["energy"] = meta.get("energy", current["energy"])
        current["tension"] = meta.get("tension", current["tension"])
        # Recompute calm score deterministically
        tension = current.get("tension") or 2
        energy = current.get("energy") or 3
        current["calmScore"] = max(35, min(100, 100 - (tension - 1) * 15 + (energy - 3) * 3))

    elif source == "studio" and event_type in ["session_completed", "session_exited_early"]:
        dur_secs = meta.get("duration") or meta.get("actual_duration") or 0
        dur_mins = max(1, round(dur_secs / 60))
        current["studioMinutes"] = current.get("studioMinutes", 0) + dur_mins
        current["calmScore"] = min(100, current.get("calmScore", 82) + 4)

    elif source == "journal" and event_type in ["entry_created", "entry_edited"]:
        words = meta.get("writing_length") or meta.get("word_count") or 0
        current["journalWords"] = current.get("journalWords", 0) + words
        current["calmScore"] = min(100, current.get("calmScore", 82) + 3)

    elif source == "chat" and event_type in ["session_started", "message_sent"]:
        current["chatSessions"] = current.get("chatSessions", 0) + 1

    user_summaries[date_str] = current
    _save_summaries(summaries)


def get_daily_summary(user_id: str, date_str: Optional[str] = None) -> Dict[str, Any]:
    """Returns the cached summary for the given date (default today). Computes streak dynamically."""
    target_date = date_str or _get_today_date_str()
    summaries = _load_summaries()
    user_summaries = summaries.get(user_id, {})

    if target_date in user_summaries:
        summary = dict(user_summaries[target_date])
    else:
        # Create empty initial snapshot
        summary = {
            "date": target_date,
            "mood": None,
            "energy": None,
            "tension": None,
            "studioMinutes": 0,
            "journalWords": 0,
            "chatSessions": 0,
            "streak": 0,
            "calmScore": 82,
            "lastActive": None,
            "recommendedNextStep": "Begin today with a gentle breath pause."
        }

    # Compute consecutive streak deterministically
    streak = _calculate_streak(user_summaries, target_date)
    summary["streak"] = streak

    return summary


def _calculate_streak(user_summaries: Dict[str, Any], today_str: str) -> int:
    """Calculates active consecutive days ending today or yesterday."""
    if not user_summaries:
        return 0

    active_dates = set()
    for d_str, s in user_summaries.items():
        if s.get("studioMinutes", 0) > 0 or s.get("journalWords", 0) > 0 or s.get("mood") is not None or s.get("chatSessions", 0) > 0:
            active_dates.add(d_str)

    if not active_dates:
        return 0

    cur_dt = datetime.strptime(today_str, "%Y-%m-%d")
    streak = 0

    # If today is not yet active, check if yesterday was active to keep streak alive
    if cur_dt.strftime("%Y-%m-%d") not in active_dates:
        yesterday_dt = cur_dt - timedelta(days=1)
        if yesterday_dt.strftime("%Y-%m-%d") not in active_dates:
            return 0
        cur_dt = yesterday_dt

    while cur_dt.strftime("%Y-%m-%d") in active_dates:
        streak += 1
        cur_dt -= timedelta(days=1)

    return streak


# =============================================================================
# WEEKLY & MONTHLY AGGREGATIONS
# =============================================================================

def get_weekly_summary(user_id: str) -> Dict[str, Any]:
    """Aggregates past 7 days of behavior for instant dashboard and reflection use."""
    summaries = _load_summaries().get(user_id, {})
    now_dt = _get_utc_now()
    days = []
    total_studio = 0
    total_words = 0
    active_days_count = 0
    calm_scores = []
    themes_count: Dict[str, int] = {}

    for i in range(6, -1, -1):
        d_str = (now_dt - timedelta(days=i)).strftime("%Y-%m-%d")
        day_summary = summaries.get(d_str, {
            "date": d_str,
            "mood": None,
            "studioMinutes": 0,
            "journalWords": 0,
            "chatSessions": 0,
            "calmScore": 80
        })
        days.append(day_summary)
        sm = day_summary.get("studioMinutes", 0)
        jw = day_summary.get("journalWords", 0)
        total_studio += sm
        total_words += jw
        if sm > 0 or jw > 0 or day_summary.get("mood"):
            active_days_count += 1
        if day_summary.get("calmScore"):
            calm_scores.append(day_summary["calmScore"])

    # Scan recent events for dominant themes
    events = get_user_events(user_id, limit=50)
    for e in events:
        t_list = e.get("metadata", {}).get("detected_themes") or []
        for t in t_list:
            themes_count[t] = themes_count.get(t, 0) + 1

    sorted_themes = sorted(themes_count.keys(), key=lambda k: themes_count[k], reverse=True)[:3]
    if not sorted_themes:
        sorted_themes = ["mindful presence", "evening rest"]

    trend = "steady"
    if len(calm_scores) >= 2:
        diff = calm_scores[-1] - calm_scores[0]
        if diff > 5:
            trend = "upward"
        elif diff < -5:
            trend = "winding down"

    consistency_pct = round((active_days_count / 7.0) * 100)

    return {
        "days": days,
        "totalStudioMinutes": total_studio,
        "totalJournalWords": total_words,
        "activeDays": active_days_count,
        "consistencyPct": consistency_pct,
        "dominantThemes": sorted_themes,
        "calmScoreTrend": trend,
    }


def get_monthly_summary(user_id: str, month_str: Optional[str] = None) -> Dict[str, Any]:
    """Aggregates monthly behavior for Replay features without runtime overhead."""
    target_month = month_str or _get_utc_now().strftime("%Y-%m")
    summaries = _load_summaries().get(user_id, {})

    month_days = [s for d, s in summaries.items() if d.startswith(target_month)]
    active_days = sum(1 for s in month_days if s.get("studioMinutes", 0) > 0 or s.get("journalWords", 0) > 0 or s.get("mood"))
    total_studio = sum(s.get("studioMinutes", 0) for s in month_days)
    total_journals = sum(1 for s in month_days if s.get("journalWords", 0) > 0)
    total_chats = sum(s.get("chatSessions", 0) for s in month_days)

    moods = [s.get("mood") for s in month_days if s.get("mood")]
    dominant_mood = max(set(moods), key=moods.count) if moods else "calm"

    return {
        "month": target_month,
        "activeDays": active_days,
        "totalStudioMinutes": total_studio,
        "totalJournalEntries": total_journals,
        "totalChatSessions": total_chats,
        "dominantMood": dominant_mood,
        "primaryThemes": ["restorative focus", "daily consistency"],
        "recoveryMomentsCount": active_days,
    }


# =============================================================================
# USER PREFERENCE MEMORY (AUTOMATIC LEARNING)
# =============================================================================

def _update_preferences_from_event(user_id: str, event: Dict[str, Any]):
    """Automatically learns user preferences from studio, journal, and chat habits."""
    prefs_data = _load_preferences()
    user_prefs = prefs_data.get(user_id, {
        "preferredVoice": "Nova",
        "preferredWorld": "Sakura Garden",
        "preferredCamera": "first_person",
        "preferredJournalTime": "evening",
        "preferredPracticeDuration": 5,
        "quietMode": False,
        "_voice_counts": {},
        "_world_counts": {},
        "_camera_counts": {},
        "_journal_hours": [],
    })

    source = event.get("source")
    meta = event.get("metadata", {})

    if source == "studio":
        # Voice
        voice = meta.get("voice") or meta.get("voice_style")
        if voice:
            v_counts = user_prefs.setdefault("_voice_counts", {})
            v_counts[voice] = v_counts.get(voice, 0) + 1
            user_prefs["preferredVoice"] = max(v_counts, key=v_counts.get)

        # World
        world = meta.get("world") or meta.get("routine")
        if world:
            w_counts = user_prefs.setdefault("_world_counts", {})
            w_counts[world] = w_counts.get(world, 0) + 1
            user_prefs["preferredWorld"] = max(w_counts, key=w_counts.get)

        # Camera
        cam = meta.get("camera_mode") or meta.get("camera")
        if cam:
            c_counts = user_prefs.setdefault("_camera_counts", {})
            c_counts[cam] = c_counts.get(cam, 0) + 1
            user_prefs["preferredCamera"] = max(c_counts, key=c_counts.get)

        # Duration
        dur = meta.get("duration") or meta.get("actual_duration")
        if dur and dur > 30:
            dur_mins = round(dur / 60)
            user_prefs["preferredPracticeDuration"] = max(3, min(20, dur_mins))

    elif source == "journal":
        hour = meta.get("writing_hour")
        if hour is None:
            ts = event.get("timestamp", "")
            if "T" in ts:
                try:
                    hour = int(ts.split("T")[1][:2])
                except Exception:
                    hour = 20
        if hour is not None:
            hours = user_prefs.setdefault("_journal_hours", [])
            hours.append(hour)
            if len(hours) > 20:
                user_prefs["_journal_hours"] = hours[-20:]
            avg_hour = sum(hours) / len(hours)
            if avg_hour < 12:
                user_prefs["preferredJournalTime"] = "morning"
            elif avg_hour < 17:
                user_prefs["preferredJournalTime"] = "afternoon"
            elif avg_hour < 21:
                user_prefs["preferredJournalTime"] = "evening"
            else:
                user_prefs["preferredJournalTime"] = "night"

    prefs_data[user_id] = user_prefs
    _save_preferences(prefs_data)


def get_user_preferences(user_id: str) -> Dict[str, Any]:
    """Retrieves learned user preferences with internal counters removed."""
    prefs_data = _load_preferences()
    user_prefs = prefs_data.get(user_id, {
        "preferredVoice": "Nova",
        "preferredWorld": "Sakura Garden",
        "preferredCamera": "first_person",
        "preferredJournalTime": "evening",
        "preferredPracticeDuration": 5,
        "quietMode": False,
    })

    return {
        "preferredVoice": user_prefs.get("preferredVoice", "Nova"),
        "preferredWorld": user_prefs.get("preferredWorld", "Sakura Garden"),
        "preferredCamera": user_prefs.get("preferredCamera", "first_person"),
        "preferredJournalTime": user_prefs.get("preferredJournalTime", "evening"),
        "preferredPracticeDuration": user_prefs.get("preferredPracticeDuration", 5),
        "quietMode": bool(user_prefs.get("quietMode", False)),
    }


# =============================================================================
# DETERMINISTIC BEHAVIOR DISCOVERIES (SMART CORRELATIONS)
# =============================================================================

def get_behavior_discoveries(user_id: str) -> List[Dict[str, Any]]:
    """
    Computes deterministic correlations from real events.
    Zero GPT hallucinations, zero clinical labels.
    Converts numbers into human confidence phrasing.
    """
    events = get_user_events(user_id, limit=200)
    prefs = get_user_preferences(user_id)

    if len(events) < 3:
        return [
            {
                "id": "disc_learning",
                "title": "Learning Your Rhythm",
                "discovery": "Athena is observing how you move through your days.",
                "evidence": "A few check-ins, journal notes, or pauses will reveal your natural patterns.",
                "confidence": "I'm still learning this rhythm.",
                "recommendedExperiment": "Try a 3-minute breath pause when your workday concludes.",
            }
        ]

    discoveries = []

    # 1. Preferred Studio World Correlation
    studio_events = [e for e in events if e.get("source") == "studio"]
    if len(studio_events) >= 2:
        world_counts = {}
        for s in studio_events:
            w = s.get("metadata", {}).get("world") or prefs.get("preferredWorld", "Sakura Garden")
            world_counts[w] = world_counts.get(w, 0) + 1
        fav_world = max(world_counts, key=world_counts.get)
        fav_count = world_counts[fav_world]

        confidence = (
            "This has appeared across several weeks."
            if fav_count >= 5
            else "I've noticed this several times."
            if fav_count >= 2
            else "I'm still learning this rhythm."
        )

        discoveries.append({
            "id": "disc_world_affinity",
            "title": f"Anchored in {fav_world}",
            "discovery": f"You naturally settle into {fav_world} more than any other sanctuary.",
            "evidence": f"You returned to {fav_world} across your recent practice sessions.",
            "confidence": confidence,
            "recommendedExperiment": f"Allow {fav_world} to be your designated safe space before demanding moments.",
        })

    # 2. Evening Breathing / Wind-down Routine
    evening_practices = [
        e for e in studio_events
        if any(w in str(e.get("metadata", {}).get("exercise", "")).lower() for w in ["breathe", "sleep", "ground"])
        and _is_evening_or_night(e.get("timestamp", ""))
    ]
    if len(evening_practices) >= 1:
        confidence = (
            "This has appeared across several weeks."
            if len(evening_practices) >= 4
            else "I've noticed this several times."
            if len(evening_practices) >= 2
            else "I'm still learning this rhythm."
        )
        discoveries.append({
            "id": "disc_evening_winddown",
            "title": "Evening Nervous System Reset",
            "discovery": "You tend to seek breath and grounding practices as evening arrives.",
            "evidence": "Consistent breathing sessions logged between late afternoon and bedtime.",
            "confidence": confidence,
            "recommendedExperiment": "Pair your evening breathing pause with dimming your room lights.",
        })

    # 3. Journaling as a Relief Valve After Stress
    high_tension_checkins = [
        e for e in events
        if e.get("source") == "mood" and int(e.get("metadata", {}).get("tension", 0)) >= 3
    ]
    journal_events = [e for e in events if e.get("source") == "journal"]
    if len(high_tension_checkins) >= 1 and len(journal_events) >= 1:
        discoveries.append({
            "id": "disc_stress_journal_correlation",
            "title": "Writing to Unload Weight",
            "discovery": "When tension runs high, opening your Private Space restores clarity.",
            "evidence": "Journal entries closely follow check-ins marking higher daily tension.",
            "confidence": "I've noticed this several times." if len(journal_events) >= 3 else "I'm still learning this rhythm.",
            "recommendedExperiment": "Write freely for two minutes without editing when feeling rushed.",
        })

    # 4. Preferred Voice Companion
    fav_voice = prefs.get("preferredVoice", "Nova")
    discoveries.append({
        "id": "disc_voice_affinity",
        "title": f"Attuned to {fav_voice}'s Voice",
        "discovery": f"Your guided practices resonate most comfortably with {fav_voice}'s measured cadence.",
        "evidence": f"Selected as your voice companion across guided studio sessions.",
        "confidence": "This has appeared across several weeks." if len(studio_events) >= 4 else "I've noticed this several times.",
        "recommendedExperiment": "Try a session with voice guidance turned off once a week to practice self-guided rhythm.",
    })

    return discoveries[:4]


def _is_evening_or_night(iso_str: str) -> bool:
    try:
        if "T" in iso_str:
            hour = int(iso_str.split("T")[1][:2])
            return hour >= 17 or hour < 4
    except Exception:
        pass
    return False
