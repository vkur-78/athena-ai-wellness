from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any

from models.world import (
    WorldStateResponse,
    WorldEnvironmentResponse,
    WorldMemory,
    AmbiencePreferences,
    AcknowledgeUnlockRequest,
)
from services.world_service import (
    get_world_state,
    acknowledge_unlocks,
    get_world_memories,
    update_ambience_preferences,
    get_current_season,
    get_time_of_day,
    get_ambient_description,
)
from auth.verify import get_optional_user

router = APIRouter()


@router.get("/world/state", response_model=WorldStateResponse)
async def fetch_world_state(
    hour: Optional[int] = Query(None, description="Optional local hour override (0-23)"),
    user=Depends(get_optional_user)
):
    """
    Retrieves the living sanctuary state for the current user:
    - Unlocked objects through verified behavior
    - Single-time gentle whispers for newly unlocked items
    - Local time of day and season
    - Ambient procedural sound preferences
    """
    user_id = user.id if user else "guest_sanctuary"
    state = get_world_state(user_id, client_hour=hour)
    return state


@router.post("/world/acknowledge")
@router.post("/world/unlock-acknowledged")
async def post_acknowledge_unlock(
    payload: AcknowledgeUnlockRequest,
    user=Depends(get_optional_user)
):
    """Marks whispers as experienced so they only animate once."""
    user_id = user.id if user else "guest_sanctuary"
    acknowledge_unlocks(user_id, payload.unlock_ids)
    return {"status": "ok", "acknowledged": payload.unlock_ids}


@router.get("/world/memories", response_model=List[WorldMemory])
async def fetch_world_memories(user=Depends(get_optional_user)):
    """
    Returns calm memories explaining why each sanctuary object arrived.
    Contains zero clinical scores or streaks.
    """
    user_id = user.id if user else "guest_sanctuary"
    return get_world_memories(user_id)


@router.get("/world/environment", response_model=WorldEnvironmentResponse)
async def fetch_world_environment(
    hour: Optional[int] = Query(None, description="Optional local hour (0-23)"),
):
    """Returns real-time celestial lighting and soft seasonal backdrop."""
    season = get_current_season()
    tod = get_time_of_day(hour)
    desc = get_ambient_description(tod, season)
    return {
        "time_of_day": tod,
        "season": season,
        "weather": "clear",
        "ambient_description": desc,
        "local_hour": hour if hour is not None else 14,
    }


@router.post("/world/ambience", response_model=AmbiencePreferences)
async def save_ambience_preferences(
    payload: AmbiencePreferences,
    user=Depends(get_optional_user)
):
    """Persists volume sliders for procedural Web Audio sound generators."""
    user_id = user.id if user else "guest_sanctuary"
    saved = update_ambience_preferences(user_id, payload.model_dump())
    return saved
