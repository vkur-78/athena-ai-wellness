import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from services.db import supabase

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
MEMORY_FILE = DATA_DIR / "user_memories.json"

def _load_all_memories() -> Dict[str, Any]:
    if not MEMORY_FILE.exists():
        return {}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Memory Load Error] {e}")
        return {}

def _save_all_memories(data: Dict[str, Any]):
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Memory Save Error] {e}")

def _load_from_supabase(user_id: str) -> Optional[Dict[str, Any]]:
    """Attempt to restore memories from Supabase for an authenticated user."""
    try:
        res = supabase.table("memories").select("category,value,created_at").eq("user_id", user_id).execute()
        if not res.data:
            return None

        profile = {
            "session_id": user_id,
            "user_id": user_id,
            "user_name": None,
            "core_stressors": [],
            "thinking_patterns": [],
            "coping_preferences": [],
            "recurring_worries": [],
            "repeated_people": [],
            "repeated_situations": [],
            "emotional_improvements": [],
            "unresolved_topics": [],
            "key_memories": [],
            "emotional_trajectory": [],
            "mood_logs": [],
            "wellness_goals": [],
            "milestones": [],
            "guided_exercises": [],
            "voice_settings": {"voice": "nova", "speed": 0.96},
            "total_exchanges": 0,
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        }

        for row in res.data:
            cat = row.get("category")
            val = row.get("value")
            if not val:
                continue
            if cat == "user_name":
                profile["user_name"] = val
            elif cat == "stressor":
                if val not in profile["core_stressors"]:
                    profile["core_stressors"].append(val)
            elif cat == "thinking_pattern":
                if val not in profile["thinking_patterns"]:
                    profile["thinking_patterns"].append(val)
            elif cat == "coping_preference":
                if val not in profile["coping_preferences"]:
                    profile["coping_preferences"].append(val)
            elif cat == "key_memory":
                profile["key_memories"].append({
                    "fact": val,
                    "learned_at": row.get("created_at", datetime.utcnow().isoformat())
                })
            elif cat == "mood_log":
                if val not in [m.get("summary") for m in profile["mood_logs"]]:
                    profile["mood_logs"].append({
                        "summary": val,
                        "logged_at": row.get("created_at", datetime.utcnow().isoformat())
                    })
            elif cat == "wellness_goal":
                if val not in profile["wellness_goals"]:
                    profile["wellness_goals"].append(val)
            elif cat == "milestone":
                if val not in profile["milestones"]:
                    profile["milestones"].append(val)
            elif cat == "guided_exercise":
                if val not in profile["guided_exercises"]:
                    profile["guided_exercises"].append(val)

        return profile
    except Exception as e:
        print(f"[Supabase Memory Fetch Error] {e}")
        return None

def get_user_memory(identifier: str) -> Dict[str, Any]:
    """Retrieve user memory profile by user_id or session_id."""
    data = _load_all_memories()

    if identifier in data:
        return data[identifier]

    # If identifier is a UUID (user_id), attempt restore from Supabase
    if len(identifier) >= 32 and "-" in identifier:
        sb_profile = _load_from_supabase(identifier)
        if sb_profile:
            data[identifier] = sb_profile
            _save_all_memories(data)
            return sb_profile

    # Fresh full companion profile
    fresh = {
        "session_id": identifier,
        "user_name": None,
        "core_stressors": [],
        "thinking_patterns": [],
        "coping_preferences": [],
        "recurring_worries": [],
        "repeated_people": [],
        "repeated_situations": [],
        "emotional_improvements": [],
        "unresolved_topics": [],
        "key_memories": [],
        "emotional_trajectory": [],
        "mood_logs": [],
        "wellness_goals": [],
        "milestones": [],
        "guided_exercises": [],
        "voice_settings": {"voice": "nova", "speed": 0.96},
        "total_exchanges": 0,
        "created_at": datetime.utcnow().isoformat(),
        "last_updated": datetime.utcnow().isoformat()
    }
    data[identifier] = fresh
    _save_all_memories(data)
    return fresh

def _save_supabase_memory(user_id: str, category: str, value: str):
    """Save an extracted memory atom to Supabase."""
    try:
        supabase.table("memories").insert({
            "user_id": user_id,
            "category": category,
            "value": value
        }).execute()
    except Exception as e:
        print(f"[Supabase Memory Save Error] {e}")

def update_user_memory(
    identifier: str,
    new_insights: Dict[str, Any],
    user_message: str,
    emotion: str,
    stage: str,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Update user memory profile with newly extracted companion insights and sync with Supabase."""
    data = _load_all_memories()
    profile = get_user_memory(identifier)

    profile["total_exchanges"] = profile.get("total_exchanges", 0) + 1
    profile["last_updated"] = datetime.utcnow().isoformat()

    effective_uid = user_id or (identifier if len(identifier) >= 32 and "-" in identifier else None)

    # Track emotional trajectory (keep last 12)
    profile.setdefault("emotional_trajectory", []).append({
        "timestamp": datetime.utcnow().isoformat(),
        "emotion": emotion,
        "stage": stage
    })
    profile["emotional_trajectory"] = profile["emotional_trajectory"][-12:]

    # Check for user name
    name = new_insights.get("user_name")
    if name and isinstance(name, str) and len(name.strip()) > 1 and name.lower() not in ["none", "null"]:
        clean_name = name.strip()
        if profile.get("user_name") != clean_name:
            profile["user_name"] = clean_name
            if effective_uid:
                _save_supabase_memory(effective_uid, "user_name", clean_name)

    # Merge newly detected stressors
    if "new_stressors" in new_insights and isinstance(new_insights["new_stressors"], list):
        current_stressors = set(profile.get("core_stressors", []))
        for s in new_insights["new_stressors"]:
            if isinstance(s, str) and s.strip() and s.lower() not in ["none", "null"]:
                clean_s = s.strip().lower()
                if clean_s not in current_stressors:
                    current_stressors.add(clean_s)
                    if effective_uid:
                        _save_supabase_memory(effective_uid, "stressor", clean_s)
        profile["core_stressors"] = list(current_stressors)[:12]

    # Merge thinking patterns
    pattern = new_insights.get("thinking_pattern")
    if pattern and pattern not in ["none", "null"] and isinstance(pattern, str):
        clean_p = pattern.strip().lower()
        current_patterns = set(profile.get("thinking_patterns", []))
        if clean_p not in current_patterns:
            current_patterns.add(clean_p)
            if effective_uid:
                _save_supabase_memory(effective_uid, "thinking_pattern", clean_p)
        profile["thinking_patterns"] = list(current_patterns)[:8]

    # Merge coping preferences
    if "coping_preference" in new_insights and new_insights["coping_preference"]:
        pref = new_insights["coping_preference"]
        if isinstance(pref, str) and pref.lower() not in ["none", "null"]:
            clean_pref = pref.strip().lower()
            current_prefs = set(profile.get("coping_preferences", []))
            if clean_pref not in current_prefs:
                current_prefs.add(clean_pref)
                if effective_uid:
                    _save_supabase_memory(effective_uid, "coping_preference", clean_pref)
            profile["coping_preferences"] = list(current_prefs)[:8]

    # Add specific key memory item
    new_memory_fact = new_insights.get("memory_fact")
    if new_memory_fact and isinstance(new_memory_fact, str) and len(new_memory_fact.strip()) > 5:
        clean_fact = new_memory_fact.strip()
        key_memories = profile.setdefault("key_memories", [])
        if not any(m.get("fact", "").lower() == clean_fact.lower() for m in key_memories):
            key_memories.append({
                "fact": clean_fact,
                "learned_at": datetime.utcnow().isoformat()
            })
            profile["key_memories"] = key_memories[-20:]
            if effective_uid:
                _save_supabase_memory(effective_uid, "key_memory", clean_fact)

    # Track Mood Entry
    mood = new_insights.get("mood_entry")
    if mood and isinstance(mood, str) and mood.lower() not in ["none", "null"]:
        clean_mood = mood.strip()
        mood_logs = profile.setdefault("mood_logs", [])
        mood_logs.append({
            "summary": clean_mood,
            "logged_at": datetime.utcnow().isoformat()
        })
        profile["mood_logs"] = mood_logs[-15:]
        if effective_uid:
            _save_supabase_memory(effective_uid, "mood_log", clean_mood)

    # Track Wellness Goal
    goal = new_insights.get("wellness_goal")
    if goal and isinstance(goal, str) and goal.lower() not in ["none", "null"]:
        clean_goal = goal.strip()
        goals = set(profile.setdefault("wellness_goals", []))
        if clean_goal not in goals:
            goals.add(clean_goal)
            profile["wellness_goals"] = list(goals)[:8]
            if effective_uid:
                _save_supabase_memory(effective_uid, "wellness_goal", clean_goal)

    # Track Milestone
    milestone = new_insights.get("milestone")
    if milestone and isinstance(milestone, str) and milestone.lower() not in ["none", "null"]:
        clean_mile = milestone.strip()
        miles = set(profile.setdefault("milestones", []))
        if clean_mile not in miles:
            miles.add(clean_mile)
            profile["milestones"] = list(miles)[:10]
            if effective_uid:
                _save_supabase_memory(effective_uid, "milestone", clean_mile)

    # Track Guided Exercise completed or suggested
    exercise = new_insights.get("suggested_exercise")
    if exercise and isinstance(exercise, str) and exercise.lower() not in ["none", "null"]:
        clean_ex = exercise.strip()
        exercises = set(profile.setdefault("guided_exercises", []))
        if clean_ex not in exercises:
            exercises.add(clean_ex)
            profile["guided_exercises"] = list(exercises)[:10]
            if effective_uid:
                _save_supabase_memory(effective_uid, "guided_exercise", clean_ex)

    # Helper for list additions
    def _merge_list_field(field_name: str, max_items: int = 8):
        items = new_insights.get(field_name)
        if items and isinstance(items, list):
            current = profile.setdefault(field_name, [])
            for item in items:
                if isinstance(item, str) and item.strip() and item.lower() not in ["none", "null"]:
                    clean_item = item.strip()
                    if clean_item not in current:
                        current.append(clean_item)
            profile[field_name] = current[-max_items:]

    # Track Contextual Memory Intelligence:
    _merge_list_field("recurring_worries", 8)
    _merge_list_field("repeated_people", 8)
    _merge_list_field("repeated_situations", 8)
    _merge_list_field("emotional_improvements", 8)
    _merge_list_field("unresolved_topics", 8)

    data[identifier] = profile
    _save_all_memories(data)
    return profile

def clear_user_memory(identifier: str, user_id: Optional[str] = None) -> bool:
    """Clear memories for an identifier and optionally in Supabase."""
    data = _load_all_memories()
    cleared = False
    if identifier in data:
        del data[identifier]
        _save_all_memories(data)
        cleared = True

    effective_uid = user_id or (identifier if len(identifier) >= 32 and "-" in identifier else None)
    if effective_uid:
        try:
            supabase.table("memories").delete().eq("user_id", effective_uid).execute()
            cleared = True
        except Exception as e:
            print(f"[Supabase Memory Clear Error] {e}")

    return cleared

def format_memory_for_prompt(profile: Optional[Dict[str, Any]]) -> str:
    """Format full companion memory into a concise clinical context block for the LLM."""
    if not profile or profile.get("total_exchanges", 0) == 0:
        return "New conversation. Welcome the user warmly into Athena's 11-pillar mental wellness sanctuary."

    sections = []
    if profile.get("user_name"):
        sections.append(f"- User's Name: {profile['user_name']} (Address warmly and naturally)")

    if profile.get("core_stressors"):
        sections.append(f"- Known Stressors & Life Challenges: {', '.join(profile['core_stressors'])}")

    if profile.get("coping_preferences"):
        sections.append(f"- Personal Coping Anchors: {', '.join(profile['coping_preferences'])}")

    if profile.get("wellness_goals"):
        sections.append(f"- User's Active Wellness Intentions: {', '.join(profile['wellness_goals'])}")

    if profile.get("milestones"):
        sections.append(f"- Milestones Celebrated: {', '.join(profile['milestones'])}")

    if profile.get("guided_exercises"):
        sections.append(f"- Familiar Exercises Practiced: {', '.join(profile['guided_exercises'])}")

    if profile.get("thinking_patterns"):
        sections.append(f"- Observed Cognitive Tendencies: {', '.join(profile['thinking_patterns'])}")

    # Contextual Therapist Memory:
    if profile.get("recurring_worries"):
        sections.append(f"- Recurring Worries: {', '.join(profile['recurring_worries'])}")

    if profile.get("repeated_people"):
        sections.append(f"- Significant People in User's Life: {', '.join(profile['repeated_people'])}")

    if profile.get("repeated_situations"):
        sections.append(f"- Recurring Challenging Situations: {', '.join(profile['repeated_situations'])}")

    if profile.get("emotional_improvements"):
        sections.append(f"- Observed Emotional Improvements: {', '.join(profile['emotional_improvements'])}")

    if profile.get("unresolved_topics"):
        sections.append(f"- Unresolved Topics & Decisions: {', '.join(profile['unresolved_topics'])}")

    if profile.get("key_memories"):
        facts = [f"  • {m['fact']}" for m in profile['key_memories'][-6:]]
        sections.append("- Meaningful Life Milestones & Context:\n" + "\n".join(facts))

    recent_emotions = [e["emotion"] for e in profile.get("emotional_trajectory", [])[-5:] if "emotion" in e]
    if recent_emotions:
        sections.append(f"- Recent Mood Arc: {' -> '.join(recent_emotions)}")

    sections.append(f"- Companion Alliance: {profile.get('total_exchanges', 1)} prior interactions. Deepen your supportive bond.")
    sections.append(
        "- Contextual Recall Guideline: When relevant, gently reference past context (e.g. 'Last week you mentioned work pressure before meetings. Has that changed today?'). Only reference when naturally supporting their current feeling."
    )
    sections.append(
        "- Continuous Reasoning: If the user says vague referential phrases like 'It\\'s happening again', 'He did it again', or 'That feeling is back', use the recurring worries, repeated people, and recent topics above to immediately know what they mean without asking them to re-explain."
    )

    return "\n".join(sections)

def get_memory_summary(identifier: str) -> Dict[str, Any]:
    """Provide a structured companion summary for the user-facing UI."""
    profile = get_user_memory(identifier)
    total_insights = (
        len(profile.get("core_stressors", [])) +
        len(profile.get("coping_preferences", [])) +
        len(profile.get("thinking_patterns", [])) +
        len(profile.get("key_memories", [])) +
        len(profile.get("wellness_goals", [])) +
        len(profile.get("milestones", [])) +
        len(profile.get("guided_exercises", [])) +
        len(profile.get("mood_logs", []))
    )

    # Companion growth level calculation
    exchanges = profile.get("total_exchanges", 0)
    level = 1 + (exchanges // 3) + (len(profile.get("milestones", [])))

    return {
        "user_name": profile.get("user_name"),
        "total_exchanges": exchanges,
        "companion_level": min(level, 10),
        "total_insights": total_insights,
        "core_stressors": profile.get("core_stressors", []),
        "coping_preferences": profile.get("coping_preferences", []),
        "thinking_patterns": profile.get("thinking_patterns", []),
        "wellness_goals": profile.get("wellness_goals", []),
        "milestones": profile.get("milestones", []),
        "guided_exercises": profile.get("guided_exercises", []),
        "mood_logs": profile.get("mood_logs", []),
        "recurring_worries": profile.get("recurring_worries", []),
        "repeated_people": profile.get("repeated_people", []),
        "repeated_situations": profile.get("repeated_situations", []),
        "emotional_improvements": profile.get("emotional_improvements", []),
        "unresolved_topics": profile.get("unresolved_topics", []),
        "voice_settings": profile.get("voice_settings", {"voice": "nova"}),
        "key_memories": [m.get("fact") for m in profile.get("key_memories", [])],
        "recent_emotions": [e.get("emotion") for e in profile.get("emotional_trajectory", [])[-6:] if e.get("emotion")],
        "last_updated": profile.get("last_updated")
    }


