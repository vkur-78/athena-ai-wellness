import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from services.db import supabase
from ai.memory_manager import update_user_memory

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
PROFILE_CACHE_FILE = DATA_DIR / "user_profiles.json"

def _load_local_profiles() -> Dict[str, Any]:
    if not PROFILE_CACHE_FILE.exists():
        return {}
    try:
        with open(PROFILE_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Profile Cache Load Error] {e}")
        return {}

def _save_local_profiles(data: Dict[str, Any]):
    try:
        with open(PROFILE_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Profile Cache Save Error] {e}")

def _attach_authoritative_trial(p: Dict[str, Any]) -> Dict[str, Any]:
    """Compute authoritative 30-day trial from registration timestamp."""
    from services.demo_date_projector import get_current_server_datetime_ist
    from datetime import timezone, timedelta
    import math
    now_dt = get_current_server_datetime_ist()
    created_val = p.get("trial_started_at") or p.get("created_at")
    if isinstance(created_val, datetime):
        created_str = created_val.isoformat()
    elif isinstance(created_val, str) and created_val:
        created_str = created_val
    else:
        created_str = now_dt.isoformat()
        p["created_at"] = created_str

    # If user has been granted paid entitlement
    if p.get("is_paid") is True or p.get("entitlement_mode") == "ATHENA_PLUS":
        p["is_demo"] = False
        p["is_paid"] = True
        p["trial_active"] = False
        p["trial_days_remaining"] = 0
        p["entitlement_mode"] = "ATHENA_PLUS"
        p["trial_started_at"] = created_str
        return p

    try:
        c_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
        if c_dt.tzinfo is not None:
            elapsed_seconds = (now_dt.astimezone(timezone.utc) - c_dt.astimezone(timezone.utc)).total_seconds()
        else:
            elapsed_seconds = (now_dt.replace(tzinfo=None) - c_dt).total_seconds()

        elapsed_days = max(0.0, elapsed_seconds / 86400.0)
        remaining_seconds = (30 * 86400) - elapsed_seconds
        remaining_days = max(0, int(math.ceil(remaining_seconds / 86400.0))) if remaining_seconds > 0 else 0
        remaining_days = min(30, remaining_days)
        trial_end_dt = c_dt + timedelta(days=30)
        trial_ends_at = trial_end_dt.isoformat()
    except Exception:
        remaining_days = 30
        trial_ends_at = (now_dt + timedelta(days=30)).isoformat()

    p["is_demo"] = False
    p["is_paid"] = False
    p["trial_started_at"] = created_str
    p["trial_ends_at"] = trial_ends_at
    p["trial_active"] = remaining_days > 0
    p["trial_days_remaining"] = remaining_days
    p["entitlement_mode"] = "TRIAL_30_DAYS" if remaining_days > 0 else "ATHENA_FREE"
    return p


def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user profile from Supabase with local fallback."""
    if not user_id:
        return None

    local = _load_local_profiles()
    local_prof = local.get(user_id)

    from services.demo_date_projector import DEMO_USER_ID
    if user_id == DEMO_USER_ID:
        if local_prof:
            prof = dict(local_prof)
            prof["id"] = user_id
            prof["user_id"] = user_id
            prof["email"] = "demo@athena.sanctuary"
            prof["is_demo"] = True
            prof["trial_active"] = False
            prof["trial_days_remaining"] = 0
            prof["entitlement_mode"] = "DEMO"
            return prof
        return {
            "id": DEMO_USER_ID,
            "user_id": DEMO_USER_ID,
            "display_name": "Sanctuary Traveler",
            "full_name": "Sanctuary Traveler",
            "email": "demo@athena.sanctuary",
            "is_demo": True,
            "trial_active": False,
            "trial_days_remaining": 0,
            "entitlement_mode": "DEMO",
            "language": "en",
            "onboarding_completed": True,
        }

    # Try Supabase first (MED-03: schema uses 'id' as PK)
    try:
        res = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            sb_profile = res.data[0]
            profile = local_prof or {}
            profile.update(sb_profile)
            profile["id"] = user_id
            profile["user_id"] = user_id
            profile.setdefault("language", (local_prof or {}).get("language", "en"))
            _attach_authoritative_trial(profile)
            local[user_id] = profile
            _save_local_profiles(local)
            return profile
    except Exception as e:
        print(f"[Supabase Profile Fetch Fallback] {e}")

    # Fallback to local file store
    if local_prof:
        local_prof["id"] = user_id
        local_prof["user_id"] = user_id
        local_prof.setdefault("language", "en")
        _attach_authoritative_trial(local_prof)
        return local_prof
    return None

def save_onboarding_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Save complete onboarding intake profile and mark onboarding as completed."""
    now = datetime.utcnow().isoformat()
    local = _load_local_profiles()
    existing = local.get(user_id, {})

    existing_lang = existing.get("language")
    incoming_lang = data.get("language")
    # Never overwrite an existing saved language with default "en"
    if existing_lang and existing_lang != "en" and (not incoming_lang or incoming_lang == "en"):
        chosen_lang = existing_lang
    else:
        chosen_lang = incoming_lang or existing_lang or "en"

    record = {
        "id": user_id,
        "user_id": user_id,
        "display_name": data.get("display_name"),
        "age_range": data.get("age_range"),
        "life_stage": data.get("life_stage"),
        "routine": data.get("routine"),
        "sleep_hours": data.get("sleep_hours"),
        "sleep_pattern": data.get("sleep_pattern"),
        "energy_pattern": data.get("energy_pattern"),
        "current_focus": data.get("current_focus") or [],
        "emotional_patterns": data.get("emotional_patterns") or [],
        "support_style": data.get("support_style"),
        "sensitive_topics": data.get("sensitive_topics") or [],
        "coping_methods": data.get("coping_methods") or [],
        "social_support": data.get("social_support"),
        "communication_preference": data.get("communication_preference") or "Voice & Text",
        "wellness_goal": data.get("wellness_goal"),
        "onboarding_completed": True,
        "language": chosen_lang,
        "created_at": existing.get("created_at", now),
        "trial_started_at": existing.get("trial_started_at", existing.get("created_at", now)),
        "trial_ends_at": existing.get("trial_ends_at"),
        "is_paid": existing.get("is_paid", False),
        "entitlement_mode": existing.get("entitlement_mode", "TRIAL_30_DAYS"),
        "upgraded_at": existing.get("upgraded_at"),
        "upgrade_notes": existing.get("upgrade_notes"),
        "updated_at": now
    }
    _attach_authoritative_trial(record)

    # Generate compassionate AI welcome reflection
    try:
        from ai.onboarding_reflection import generate_onboarding_reflection
        record["onboarding_reflection"] = generate_onboarding_reflection(record, language=chosen_lang)
    except Exception as ai_err:
        print(f"[Onboarding Reflection Gen Warning] {ai_err}")
        record["onboarding_reflection"] = "Welcome to Athena. We are here to support your journey whenever you choose to begin."

    # Save to local file cache first (guarantees zero-data-loss)
    local[user_id] = record
    _save_local_profiles(local)

    # Sync key attributes to Living Memory so all companion memory systems stay unified
    insights = {}
    if record.get("display_name"):
        insights["user_name"] = record["display_name"]
    if record.get("wellness_goal"):
        insights["wellness_goal"] = record["wellness_goal"]
    if record.get("coping_methods"):
        insights["coping_preference"] = ", ".join(record["coping_methods"][:3])
    if record.get("current_focus"):
        insights["new_stressors"] = record["current_focus"]

    if insights:
        try:
            update_user_memory(
                identifier=user_id,
                new_insights=insights,
                user_message="[Completed Therapeutic Onboarding Intake]",
                emotion="calm",
                stage="intake",
                user_id=user_id
            )
        except Exception as e:
            print(f"[Memory Sync Warning] {e}")

    # Upsert to Supabase (MED-03: use id as PK and schema columns)
    try:
        sb_record = {
            "id": user_id,
            "display_name": record.get("display_name"),
            "preferred_style": record.get("support_style")
        }
        supabase.table("profiles").upsert(sb_record).execute()
    except Exception as e:
        print(f"[Supabase Profile Upsert Fallback] {e}")

    return record

def update_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Partial update of existing user profile."""
    current = get_profile(user_id) or {"id": user_id, "user_id": user_id, "onboarding_completed": False, "language": "en"}
    updates["updated_at"] = datetime.utcnow().isoformat()
    if "language" in updates:
        lang_val = updates.get("language")
        if lang_val in {"en", "hi", "ta", "te", "mr", "gu"}:
            current["language"] = lang_val
    current.update({k: v for k, v in updates.items() if v is not None})
    current["id"] = user_id
    current["user_id"] = user_id
    current.setdefault("language", "en")

    # Save to local cache
    local = _load_local_profiles()
    local[user_id] = current
    _save_local_profiles(local)

    # Update in Supabase (MED-03: use id as PK)
    try:
        sb_record = {"id": user_id}
        if "display_name" in current:
            sb_record["display_name"] = current["display_name"]
        if "support_style" in current:
            sb_record["preferred_style"] = current["support_style"]
        supabase.table("profiles").upsert(sb_record).execute()
    except Exception as e:
        print(f"[Supabase Profile Update Fallback] {e}")

    return current

def format_user_context_engine(profile: Optional[Dict[str, Any]]) -> str:
    """
    Formats the deep emotional baseline from onboarding into an empathetic clinical context
    block for LLM reasoning and therapist generation.
    """
    if not profile or not profile.get("onboarding_completed"):
        return "User Context Engine: [Baseline Intake Not Yet Completed - Interacting as Gentle Welcoming Companion]"

    name = profile.get("display_name") or "Friend"
    life_stage = profile.get("life_stage") or "Unspecified"
    routine = profile.get("routine") or "Unspecified"
    sleep_h = profile.get("sleep_hours")
    sleep_p = profile.get("sleep_pattern") or "Unspecified"
    sleep_str = f"{sleep_h} hrs ({sleep_p})" if sleep_h is not None else sleep_p
    energy = profile.get("energy_pattern") or "Varies"
    focus = ", ".join(profile.get("current_focus") or ["General wellbeing"])
    emotions = ", ".join(profile.get("emotional_patterns") or ["Sensitive to stress"])
    style = profile.get("support_style") or "Balanced compassionate support"
    sensitive = ", ".join(profile.get("sensitive_topics") or ["None stated"])
    coping = ", ".join(profile.get("coping_methods") or ["Open to suggestions"])
    social = profile.get("social_support") or "Self-reliant"
    goal = profile.get("wellness_goal") or "Emotional balance and steady progress"

    return f"""=== USER CONTEXT ENGINE (EMOTIONAL BASELINE INTAKE) ===
User Preferred Name: {name}
Life Stage: {life_stage}
Recent Daily Rhythm: {routine}
Sleep Baseline: {sleep_str}
Peak Energy Time: {energy}
Top-of-Mind Focus: {focus}
Emotional Stress Tendencies: {emotions}
Preferred Support Style: {style}
Sensitive Boundaries (Tread with Gentle Care): {sensitive}
Established Coping Outlets: {coping}
Circle of Support: {social}
Long-term Anchor Goal: {goal}
===========================================================
CRITICAL CLINICAL RULES FOR APPLYING USER CONTEXT:
1. NEVER regurgitate this profile mechanically (e.g. NEVER say "As a student who sleeps 5 hours and has racing thoughts...").
2. Subtly adopt the requested support style:
   - If 'Practical advice': Offer grounded, concrete, bite-sized actionable steps. Avoid over-elaborate existential questions.
   - If 'Someone who mostly listens': Offer deep reflective empathy, silence holding, and warm presence without unsolicited directives.
   - If 'Gentle encouragement': Highlight their courage, resilience, and inner kindness.
3. If sensitive boundaries ({sensitive}) are touched, do not pry or force disclosure.
4. Align suggestions with their natural coping habits ({coping}) rather than giving generic foreign tasks."""


def upgrade_user_entitlement(identifier: str, admin_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Owner-authorized upgrade to activate Athena Plus.
    Locates user by user_id or email, marks is_paid=True, entitlement_mode="ATHENA_PLUS",
    and records an audit trail.
    """
    from datetime import datetime, timezone
    local = _load_local_profiles()
    target_id = None

    if identifier in local:
        target_id = identifier
    else:
        ident_lower = identifier.strip().lower()
        for uid, p in local.items():
            if p.get("email", "").strip().lower() == ident_lower:
                target_id = uid
                break

    now_iso = datetime.now(timezone.utc).isoformat()
    note = admin_notes or "Upgraded to Athena Plus by owner vkur-78"

    if target_id and target_id in local:
        prof = local[target_id]
        prof["is_paid"] = True
        prof["entitlement_mode"] = "ATHENA_PLUS"
        prof["trial_active"] = False
        prof["trial_days_remaining"] = 0
        prof["upgraded_at"] = now_iso
        prof["upgrade_notes"] = note
        prof["updated_at"] = now_iso
        _save_local_profiles(local)

        # Upsert to Supabase if available
        try:
            supabase.table("profiles").upsert({
                "id": target_id,
                "is_paid": True,
                "entitlement_mode": "ATHENA_PLUS"
            }).execute()
        except Exception:
            pass

        return prof

    return None
