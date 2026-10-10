import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

def build_compact_activity_summary(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Tier 3: Compact structured wellness activity summary for the AI context.
    Avoids sending complete raw database rows to save tokens.
    """
    if not user_id:
        return {
            "recent_checkins": 0,
            "recent_studio_sessions": 0,
            "recent_journal_entries": 0,
            "recent_practice_minutes": 0
        }

    try:
        from services.checkin_service import _load_local_checkins
        from services.studio_service import _load_local_sessions
        from services.journal_service import _load_local_entries

        # Count check-ins in last 7 days
        checkins_data = _load_local_checkins().get(user_id, {})
        recent_checkins_count = len(checkins_data)

        # Count studio sessions and minutes
        sessions_data = _load_local_sessions().get(user_id, [])
        recent_studio_count = len(sessions_data)
        recent_practice_minutes = sum(
            round((s.get("duration_seconds", 0)) / 60) for s in sessions_data
        )

        # Count journal entries
        entries_data = _load_local_entries().get(user_id, [])
        recent_journal_count = len(entries_data)

        return {
            "recent_checkins": recent_checkins_count,
            "recent_studio_sessions": recent_studio_count,
            "recent_journal_entries": recent_journal_count,
            "recent_practice_minutes": recent_practice_minutes
        }
    except Exception as e:
        return {
            "recent_checkins": 0,
            "recent_studio_sessions": 0,
            "recent_journal_entries": 0,
            "recent_practice_minutes": 0
        }

def filter_relevant_memory(user_memory: Optional[Dict[str, Any]], current_message: str) -> Dict[str, Any]:
    """
    Tier 2: Selects only relevant memory fragments based on lexical/semantic overlap,
    rather than dumping all historical facts into the prompt.
    """
    if not user_memory:
        return {}

    msg_lower = current_message.lower()
    relevant: Dict[str, Any] = {}

    if user_memory.get("user_name"):
        relevant["user_name"] = user_memory["user_name"]

    # Check recurring worries (strictly require actual topic match from current message)
    worries = user_memory.get("recurring_worries", [])
    matched_worries = [
        w for w in worries
        if any(word in msg_lower for word in w.lower().split() if len(word) > 3 and word not in ["exam", "test", "work"])
    ]
    if matched_worries:
        relevant["matched_worries"] = matched_worries[:2]

    # Check repeated people
    people = user_memory.get("repeated_people", [])
    matched_people = [p for p in people if p.lower() in msg_lower and len(p) > 2]
    if matched_people:
        relevant["people_mentioned"] = matched_people[:2]

    # Check coping preferences
    if user_memory.get("coping_preference"):
        relevant["coping_preference"] = user_memory["coping_preference"]

    # Check wellness goal
    if user_memory.get("wellness_goal"):
        relevant["wellness_goal"] = user_memory["wellness_goal"]

    return relevant

def assemble_ai_context(
    session_id: str,
    message: str,
    history: List[Dict[str, Any]],
    user_memory: Optional[Dict[str, Any]] = None,
    user_profile: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    internal_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Multi-tier token-efficient context assembly layer.
    Tier 1: Current conversation window (last 6 messages max)
    Tier 2: Relevant memory fragments (strictly filtered to active message topic)
    Tier 3: Compact structured wellness activity summary & latest daily check-in
    Tier 4: Long-term conversation summary (if conversation is long)
    """
    # Tier 1: Current conversation window (6-8 messages max)
    recent_messages = history[-6:] if history else []

    # Tier 2: Relevant memory only
    relevant_memory = filter_relevant_memory(user_memory, message)

    # Tier 3: Compact activity summary & latest daily check-in
    activity_summary = build_compact_activity_summary(user_id)
    latest_checkin = None
    if user_id:
        try:
            from services.checkin_service import get_latest_checkin
            latest_checkin = get_latest_checkin(user_id)
        except Exception as e:
            print(f"[Latest Checkin Fetch Warning] {e}")

    # Tier 4: Compact historical summary if history was truncated
    historical_summary = None
    if len(history) > 6:
        prior_messages = history[:-6]
        user_topics = [
            m.get("content", "")[:60]
            for m in prior_messages
            if m.get("role") == "user"
        ]
        if user_topics:
            historical_summary = "Earlier themes: " + "; ".join(user_topics[-3:])

    # Clean profile context
    profile_summary = {}
    if user_profile and user_profile.get("onboarding_completed"):
        if user_profile.get("display_name"):
            profile_summary["name"] = user_profile["display_name"]
        if user_profile.get("wellness_goal"):
            profile_summary["goal"] = user_profile["wellness_goal"]
        if user_profile.get("support_style"):
            profile_summary["support_style"] = user_profile["support_style"]
        if user_profile.get("current_focus"):
            profile_summary["focus"] = user_profile["current_focus"]

    return {
        "recent_messages": recent_messages,
        "relevant_memory": relevant_memory,
        "activity_summary": activity_summary,
        "latest_checkin": latest_checkin,
        "historical_summary": historical_summary,
        "profile_summary": profile_summary,
        "internal_context": internal_context
    }
