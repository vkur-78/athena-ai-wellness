import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from services.db import get_supabase_client
from services.journal_service import list_entries
from services.studio_service import get_studio_sessions
from services.checkin_service import get_checkin_history
from services.conversation_service import list_conversations

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
WORLD_FILE = DATA_DIR / "world_progress.json"


def _ensure_data_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not WORLD_FILE.exists():
        with open(WORLD_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2)


def _load_world_cache() -> Dict[str, Any]:
    _ensure_data_file()
    try:
        with open(WORLD_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[World Cache Load Error]: {e}")
        return {}


def _save_world_cache(data: Dict[str, Any]):
    _ensure_data_file()
    try:
        with open(WORLD_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        print(f"[World Cache Save Error]: {e}")


def _get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_current_season() -> str:
    month = datetime.now().month
    if month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    elif month in [9, 10, 11]:
        return "autumn"
    else:
        return "winter"


def get_time_of_day(hour: Optional[int] = None) -> str:
    if hour is None:
        hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def get_ambient_description(time_of_day: str, season: str) -> str:
    descriptions = {
        "morning": f"Soft {season} morning light filters through quiet mist as birds gently stir.",
        "afternoon": f"Bright, clear {season} skies with gentle drifting clouds and warm breezes.",
        "evening": f"Amber twilight settles over the island as lantern light begins to glow.",
        "night": f"Peaceful stillness under the starlit canopy, accompanied by nocturnal calm."
    }
    return descriptions.get(time_of_day, f"A serene {season} moment in your sanctuary.")


UNLOCK_DEFINITIONS = {
    "lantern": {
        "title": "Lantern",
        "whisper": "A lantern found its place here.",
        "memory": "You welcomed this after writing your first reflection.",
        "source": "first_journal",
    },
    "wind_chime": {
        "title": "Wind Chime",
        "whisper": "The wind chime arrived after your first breathing practice.",
        "memory": "You welcomed this after taking time to breathe in stillness.",
        "source": "first_breath",
    },
    "garden": {
        "title": "Small Garden",
        "whisper": "A small garden blossomed by the shore.",
        "memory": "This quiet garden grew after taking time to move and stretch.",
        "source": "first_yoga",
    },
    "fireflies": {
        "title": "Fireflies",
        "whisper": "Fireflies gathered near the water.",
        "memory": "These fireflies gathered after you gently scanned and relaxed your body.",
        "source": "body_scan",
    },
    "soft_moonlight": {
        "title": "Softer Moonlight",
        "whisper": "The moonlight softened across the island.",
        "memory": "The moon softened after you prepared your mind for restful sleep.",
        "source": "sleep_sanctuary",
    },
    "stone_path": {
        "title": "Stone Path",
        "whisper": "A stone path formed through the grass.",
        "memory": "These stepping stones formed as conversations deepened.",
        "source": "conversation_milestone",
    },
    "aurora": {
        "title": "Aurora",
        "whisper": "An aurora appeared in the night sky.",
        "memory": "The sky danced with aurora after a full month of walking beside Athena.",
        "source": "first_month",
    },
    "more_stars": {
        "title": "Visible Stars",
        "whisper": "More stars revealed themselves above.",
        "memory": "These stars appeared as you returned for quiet evening wind-downs.",
        "source": "evening_recovery",
    },
}

CORE_OBJECT_MEMORIES = {
    "tree": {
        "title": "Sanctuary Tree",
        "memory": "The sanctuary tree stands steady, weathering seasons with quiet resilience.",
    },
    "lake": {
        "title": "Calm Lake",
        "memory": "Still waters mirroring the sky, resting whenever thoughts settle.",
    },
    "floating_island": {
        "title": "Floating Sanctuary",
        "memory": "Your emotional home—grounded, unhurried, and always here.",
    },
}


def evaluate_verified_unlocks(user_id: str) -> List[str]:
    """
    Evaluates verified user activity without artificial streaks or points:
    1. First journal -> lantern
    2. First breathing practice -> wind_chime
    3. First yoga session -> garden
    4. Body scan completed -> fireflies
    5. Sleep sanctuary completed -> soft_moonlight
    6. Meaningful conversation milestone -> stone_path
    7. First completed month -> aurora
    8. Consistent evening recovery pattern -> more_stars
    """
    unlocked: List[str] = []

    # 1. Journals
    try:
        journals = list_entries(user_id, limit=10)
        if len(journals) >= 1:
            unlocked.append("lantern")
    except Exception as e:
        print(f"[World Eval Journal Warning]: {e}")

    # 2. Studio Sessions
    try:
        sessions = get_studio_sessions(user_id, limit=50)
        practice_types = set()
        has_evening_session = False
        for s in sessions:
            p_type = (s.get("practice_type") or s.get("tool_name") or "").lower()
            practice_types.add(p_type)
            ts = s.get("created_at") or s.get("started_at") or ""
            if "T18:" in ts or "T19:" in ts or "T20:" in ts or "T21:" in ts or "T22:" in ts:
                has_evening_session = True

        if any(pt in practice_types for pt in ["breath", "breathe", "breathing"]):
            unlocked.append("wind_chime")

        if any(pt in practice_types for pt in ["yoga", "stretch"]):
            unlocked.append("garden")

        if any(pt in practice_types for pt in ["body_scan", "body scan", "bodyscan", "pmr"]):
            unlocked.append("fireflies")

        if any(pt in practice_types for pt in ["sleep", "wind_down", "sleep_wind_down"]):
            unlocked.append("soft_moonlight")

        if has_evening_session:
            unlocked.append("more_stars")
    except Exception as e:
        print(f"[World Eval Studio Warning]: {e}")

    # 3. Conversations
    try:
        convs = list_conversations(user_id)
        if len(convs) >= 2:
            unlocked.append("stone_path")
    except Exception as e:
        print(f"[World Eval Conversation Warning]: {e}")

    # 4. Checkins & Month Activity
    try:
        checkins = get_checkin_history(user_id, limit=35)
        if len(checkins) >= 10:
            unlocked.append("aurora")
    except Exception as e:
        print(f"[World Eval Checkin Warning]: {e}")

    return unlocked


def get_or_create_world_progress(user_id: str) -> Dict[str, Any]:
    """Retrieves world progress with dual persistence (Supabase + local cache)."""
    # 1. Supabase attempt
    try:
        client = get_supabase_client()
        res = client.table("world_progress").select("*").eq("user_id", user_id).limit(1).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        print(f"[Supabase World Fetch Fallback]: {e}")

    # 2. Local fallback
    cache = _load_world_cache()
    if user_id in cache:
        return cache[user_id]

    # Create initial progress
    initial_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "unlocked_objects": [],
        "acknowledged_unlocks": [],
        "season": get_current_season(),
        "world_seed": 42,
        "ambience_preferences": {
            "master": 0.5,
            "wind": 0.3,
            "birds": 0.2,
            "water": 0.2,
            "rain": 0.0,
            "crickets": 0.0,
            "muted": False,
        },
        "created_at": _get_utc_now(),
        "updated_at": _get_utc_now(),
    }

    try:
        client = get_supabase_client()
        client.table("world_progress").insert(initial_record).execute()
    except Exception as e:
        print(f"[Supabase World Insert Fallback]: {e}")

    cache[user_id] = initial_record
    _save_world_cache(cache)
    return initial_record


def get_world_state(user_id: str, client_hour: Optional[int] = None) -> Dict[str, Any]:
    """
    Computes real-time environment and evaluates verified unlocks.
    Generates single-time whispers for newly unlocked objects.
    """
    progress = get_or_create_world_progress(user_id)
    verified_unlocked = evaluate_verified_unlocks(user_id)

    current_unlocked = set(progress.get("unlocked_objects", []))
    acknowledged = set(progress.get("acknowledged_unlocks", []))

    # Add any newly verified unlocks
    newly_discovered: List[Dict[str, Any]] = []
    for item in verified_unlocked:
        if item not in current_unlocked:
            current_unlocked.add(item)
        if item not in acknowledged and item in UNLOCK_DEFINITIONS:
            defn = UNLOCK_DEFINITIONS[item]
            newly_discovered.append({
                "id": str(uuid.uuid4()),
                "object_type": item,
                "title": defn["title"],
                "whisper": defn["whisper"],
                "unlocked_at": _get_utc_now(),
                "source_event": defn["source"],
            })

    unlocked_list = sorted(list(current_unlocked))
    progress["unlocked_objects"] = unlocked_list
    progress["season"] = get_current_season()
    progress["updated_at"] = _get_utc_now()

    # Persist update
    try:
        client = get_supabase_client()
        client.table("world_progress").update({
            "unlocked_objects": unlocked_list,
            "season": progress["season"],
            "updated_at": progress["updated_at"],
        }).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"[Supabase World State Update Fallback]: {e}")

    cache = _load_world_cache()
    cache[user_id] = progress
    _save_world_cache(cache)

    hour = client_hour if client_hour is not None else datetime.now().hour

    return {
        "user_id": user_id,
        "unlocked_objects": unlocked_list,
        "new_whispers": newly_discovered,
        "season": progress["season"],
        "time_of_day": get_time_of_day(hour),
        "local_hour": hour,
        "world_seed": progress.get("world_seed", 42),
        "ambience_preferences": progress.get("ambience_preferences", {
            "master": 0.5,
            "wind": 0.3,
            "birds": 0.2,
            "water": 0.2,
            "rain": 0.0,
            "crickets": 0.0,
            "muted": False,
        }),
    }


def acknowledge_unlocks(user_id: str, unlock_types: List[str]) -> bool:
    """Marks whispers as seen so they only animate once."""
    progress = get_or_create_world_progress(user_id)
    acknowledged = set(progress.get("acknowledged_unlocks", []))
    for ut in unlock_types:
        acknowledged.add(ut)

    ack_list = list(acknowledged)
    progress["acknowledged_unlocks"] = ack_list
    progress["updated_at"] = _get_utc_now()

    try:
        client = get_supabase_client()
        client.table("world_progress").update({
            "acknowledged_unlocks": ack_list,
            "updated_at": progress["updated_at"],
        }).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"[Supabase World Ack Fallback]: {e}")

    cache = _load_world_cache()
    cache[user_id] = progress
    _save_world_cache(cache)
    return True


def get_world_memories(user_id: str) -> List[Dict[str, Any]]:
    """Returns warm memories for all currently available and core objects."""
    state = get_world_state(user_id)
    unlocked = set(state.get("unlocked_objects", []))

    memories: List[Dict[str, Any]] = []

    # 1. Core items (always present)
    for obj_id, info in CORE_OBJECT_MEMORIES.items():
        memories.append({
            "object_id": obj_id,
            "title": info["title"],
            "memory_text": info["memory"],
            "unlocked_at": None,
        })

    # 2. Unlocked items
    for obj_id in unlocked:
        if obj_id in UNLOCK_DEFINITIONS:
            defn = UNLOCK_DEFINITIONS[obj_id]
            memories.append({
                "object_id": obj_id,
                "title": defn["title"],
                "memory_text": defn["memory"],
                "unlocked_at": None,
            })

    return memories


def update_ambience_preferences(user_id: str, prefs: Dict[str, Any]) -> Dict[str, Any]:
    """Persists volume and sound preferences."""
    progress = get_or_create_world_progress(user_id)
    current_prefs = progress.get("ambience_preferences", {})
    current_prefs.update(prefs)
    progress["ambience_preferences"] = current_prefs
    progress["updated_at"] = _get_utc_now()

    try:
        client = get_supabase_client()
        client.table("world_progress").update({
            "ambience_preferences": current_prefs,
            "updated_at": progress["updated_at"],
        }).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"[Supabase World Ambience Fallback]: {e}")

    cache = _load_world_cache()
    cache[user_id] = progress
    _save_world_cache(cache)
    return current_prefs
