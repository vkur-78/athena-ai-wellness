import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from services.checkin_service import get_checkin_history
from services.journal_service import list_entries
from services.studio_service import get_studio_sessions
from services.conversation_service import list_conversations


# The 5 signature emotional seasons
SEASONS = {
    "gentle_dawn": {
        "season_name": "Gentle Dawn",
        "theme": "Calm & Grounded",
        "narrative": "A quiet, steady clarity where each moment feels unhurried.",
        "reflection": "Your days have carried a quiet stillness, with moments of ease gently unfolding.",
        "palette": "dawn",
        "icon": "sun",
    },
    "warm_sunrise": {
        "season_name": "Warm Sunrise",
        "theme": "Hopeful & Renewing",
        "narrative": "A subtle warmth returning to your thoughts and steps.",
        "reflection": "There seemed to be a gentle lifting of weight, making space for quiet hope and curiosity.",
        "palette": "sunrise",
        "icon": "sunrise",
    },
    "quiet_rain": {
        "season_name": "Quiet Rain",
        "theme": "Reflective & Contemplative",
        "narrative": "A softer, contemplative atmosphere where writing and stillness feel comforting.",
        "reflection": "This week felt quieter than usual, with moments where writing seemed to create a little more breathing room.",
        "palette": "rain",
        "icon": "rain",
    },
    "clouded_evening": {
        "season_name": "Clouded Evening",
        "theme": "Heavy & Tender",
        "narrative": "An emotional twilight asking for extra gentleness and zero expectations.",
        "reflection": "Your evenings seemed to ask a little more from you lately. There is no rush to fix anything.",
        "palette": "evening",
        "icon": "cloud",
    },
    "clearing_horizon": {
        "season_name": "Clearing Horizon",
        "theme": "Recovering & Lightening",
        "narrative": "The clouds gently parting, revealing steady ground beneath your feet.",
        "reflection": "After holding so much, there seemed to be small pockets of release opening up for you.",
        "palette": "horizon",
        "icon": "horizon",
    },
}


def _safe_parse_datetime(dt_str: Optional[str]) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def determine_emotional_season(user_id: str) -> Dict[str, Any]:
    """
    Evaluates recent check-ins, journal entries, and practices over the last 14 days
    to map the user's emotional climate into one of Athena's 5 signature seasons.
    Strictly avoids clinical diagnoses or predictive certainty.
    """
    checkins = get_checkin_history(user_id, limit=14)
    sessions = get_studio_sessions(user_id, limit=14)
    journals = list_entries(user_id, limit=14)

    now = datetime.now(timezone.utc)
    one_week_ago = now - timedelta(days=7)

    # Analyze moods and stress from recent checkins
    recent_moods = [c.get("mood", "").lower() for c in checkins if _safe_parse_datetime(c.get("created_at")) >= one_week_ago]
    stress_scores = [c.get("stress_level", 3) for c in checkins if isinstance(c.get("stress_level"), (int, float))]
    avg_stress = (sum(stress_scores) / len(stress_scores)) if stress_scores else 3.0

    # Count evening practices
    evening_practices = 0
    sleep_practices = 0
    for s in sessions:
        dt = _safe_parse_datetime(s.get("started_at"))
        if dt.hour >= 18:
            evening_practices += 1
        if s.get("practice_type") == "sleep":
            sleep_practices += 1

    # Heuristic mapping based on gentle emotional weather
    heavy_count = sum(1 for m in recent_moods if m in ["heavy", "low", "overwhelmed", "anxious"])
    calm_count = sum(1 for m in recent_moods if m in ["calm", "peaceful", "steady", "grounded"])
    hopeful_count = sum(1 for m in recent_moods if m in ["good", "great", "hopeful", "inspired", "light"])

    # Determine season
    if heavy_count >= 2 or avg_stress >= 3.8:
        # Check if they are practicing release or recovering
        if len(sessions) >= 3 or len(journals) >= 2:
            season_key = "clearing_horizon"
        else:
            season_key = "clouded_evening"
    elif hopeful_count >= 2 and avg_stress <= 2.5:
        season_key = "warm_sunrise"
    elif len(journals) >= 3:
        season_key = "quiet_rain"
    elif calm_count >= 2 or avg_stress <= 2.8:
        season_key = "gentle_dawn"
    else:
        # Default gentle baseline
        season_key = "gentle_dawn"

    return SEASONS.get(season_key, SEASONS["gentle_dawn"])


def analyze_patterns(user_id: str) -> List[Dict[str, Any]]:
    """
    Analyzes multi-source data to generate therapist-style gentle observations.
    Zero scores, zero percentages, zero diagnoses.
    """
    observations: List[Dict[str, Any]] = []

    checkins = get_checkin_history(user_id, limit=20)
    sessions = get_studio_sessions(user_id, limit=20)
    journals = list_entries(user_id, limit=20)
    convs = list_conversations(user_id)

    # 1. Evening rhythm observation
    evening_sessions = [
        s for s in sessions
        if _safe_parse_datetime(s.get("started_at")).hour >= 18
    ]
    if len(evening_sessions) >= 2:
        observations.append({
            "id": "pat_evening_space",
            "observation": "You often made space to soften in the evenings when the day asked a lot from you.",
            "category": "rhythm",
        })

    # 2. Breathing / Studio before conversation or reflection
    breathe_sessions = [s for s in sessions if s.get("practice_type") in ["breathe", "ground"]]
    if len(breathe_sessions) >= 2:
        observations.append({
            "id": "pat_breathe_pause",
            "observation": "You often chose a grounding breath before stepping into full conversations or writing.",
            "category": "grounding",
        })

    # 3. Journal writing cadence
    if len(journals) >= 3:
        observations.append({
            "id": "pat_journal_refuge",
            "observation": "Writing in Space seemed to offer a steady room to untangle complex thoughts at your own pace.",
            "category": "reflection",
        })

    # 4. Checkin pattern
    low_to_okay = False
    if len(checkins) >= 2:
        first_mood = (checkins[-1].get("mood") or "").lower()
        recent_mood = (checkins[0].get("mood") or "").lower()
        if first_mood in ["heavy", "low"] and recent_mood in ["okay", "calm", "good"]:
            low_to_okay = True

    if low_to_okay:
        observations.append({
            "id": "pat_gentle_shift",
            "observation": "Notice how patience with difficult moments seemed to create space for a softer mood to return.",
            "category": "balance",
        })

    # 5. Mindful pauses
    if len(sessions) >= 4:
        observations.append({
            "id": "pat_pause_habit",
            "observation": "You gave yourself permission to pause several times this week instead of pushing through.",
            "category": "rhythm",
        })

    # Fallback gentle observations if new user
    if not observations:
        observations = [
            {
                "id": "pat_default_1",
                "observation": "You made space for yourself today. There is no rush to notice patterns; they will unfold naturally.",
                "category": "rhythm",
            },
            {
                "id": "pat_default_2",
                "observation": "Taking a pause before reacting is a quiet kindness you offered to yourself.",
                "category": "balance",
            },
        ]

    return observations[:4]


def get_gentle_milestones(user_id: str) -> List[Dict[str, Any]]:
    """
    Generates non-gamified, human narrative milestones.
    Zero trophies, zero points, zero streaks.
    """
    milestones: List[Dict[str, Any]] = []

    checkins = get_checkin_history(user_id, limit=30)
    sessions = get_studio_sessions(user_id, limit=30)
    journals = list_entries(user_id, limit=30)

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    recent_sessions = [s for s in sessions if _safe_parse_datetime(s.get("started_at")) >= seven_days_ago]
    recent_journals = [j for j in journals if _safe_parse_datetime(j.get("created_at")) >= seven_days_ago]
    recent_checkins = [c for c in checkins if _safe_parse_datetime(c.get("created_at")) >= seven_days_ago]

    total_pauses = len(recent_sessions) + len(recent_journals) + len(recent_checkins)

    if total_pauses >= 5:
        milestones.append({
            "id": "ms_frequent_return",
            "phrase": f"You returned to yourself {total_pauses} times this week.",
            "context": "A steady rhythm of listening inwards.",
            "recorded_at": now.isoformat(),
        })
    elif total_pauses >= 2:
        milestones.append({
            "id": "ms_gentle_pause",
            "phrase": "You made space to pause several times this week.",
            "context": "Small moments of quiet presence.",
            "recorded_at": now.isoformat(),
        })

    if len(recent_journals) >= 2:
        milestones.append({
            "id": "ms_writing_space",
            "phrase": "You made space to write when your mind needed room.",
            "context": "Honoring your inner voice in Space.",
            "recorded_at": now.isoformat(),
        })

    evening_studio = [s for s in recent_sessions if _safe_parse_datetime(s.get("started_at")).hour >= 18]
    if len(evening_studio) >= 2:
        milestones.append({
            "id": "ms_evening_care",
            "phrase": "You've been making space for quieter evenings lately.",
            "context": "Allowing the day to settle softly.",
            "recorded_at": now.isoformat(),
        })

    if not milestones:
        milestones.append({
            "id": "ms_welcomed",
            "phrase": "You began exploring gentle moments for yourself.",
            "context": "Every quiet pause counts.",
            "recorded_at": now.isoformat(),
        })

    return milestones[:3]
