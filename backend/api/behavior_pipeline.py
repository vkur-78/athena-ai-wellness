from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List

from models.behavior_pipeline import (
    BehaviorEvent,
    BehaviorEventCreate,
    BehaviorEventBatch,
    DailySummary,
    WeeklySummary,
    MonthlyBehaviorSummary,
    UserPreferences,
    BehaviorDiscovery,
)
from services.behavior_pipeline import (
    record_behavior_event,
    record_behavior_events_batch,
    get_daily_summary,
    get_weekly_summary,
    get_monthly_summary,
    get_user_preferences,
    get_behavior_discoveries,
    get_user_events,
)
from auth.verify import get_optional_user

router = APIRouter()


@router.post("/behavior/events", response_model=BehaviorEvent)
async def create_event(data: BehaviorEventCreate, user=Depends(get_optional_user)):
    """
    Sub-100ms Event Collector endpoint.
    Appends to unified behavior_events timeline and incrementally updates summaries.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        event = record_behavior_event(
            user_id=user_id,
            source=data.source,
            event_type=data.type,
            metadata=data.metadata or {},
            timestamp=data.timestamp,
        )
        return event
    except Exception as e:
        print(f"[Behavior Event Collector Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record behavior event: {str(e)}")


@router.post("/behavior/events/batch")
async def create_events_batch(data: BehaviorEventBatch, user=Depends(get_optional_user)):
    """
    Offline resilience sync endpoint.
    Writes batched queued events from localStorage.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        events_dicts = [e.model_dump() for e in data.events]
        synced_count = record_behavior_events_batch(user_id, events_dicts)
        return {"status": "synced", "count": synced_count}
    except Exception as e:
        print(f"[Behavior Event Batch Sync Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync batch events: {str(e)}")


@router.get("/behavior/today", response_model=DailySummary)
async def fetch_today_summary(
    date: Optional[str] = Query(None, description="Optional YYYY-MM-DD override"),
    user=Depends(get_optional_user)
):
    """
    Instant cached daily summary for dashboard and quick stats.
    Eliminates on-the-fly recalculations.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        summary = get_daily_summary(user_id, date_str=date)
        return summary
    except Exception as e:
        print(f"[Behavior Today Summary Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve daily summary.")


@router.get("/behavior/week", response_model=WeeklySummary)
async def fetch_weekly_summary(user=Depends(get_optional_user)):
    """
    Weekly aggregation of consistency, active days, studio minutes, and themes.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        weekly = get_weekly_summary(user_id)
        return weekly
    except Exception as e:
        print(f"[Behavior Weekly Summary Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve weekly summary.")


@router.get("/behavior/month", response_model=MonthlyBehaviorSummary)
async def fetch_monthly_summary(
    month: Optional[str] = Query(None, description="Optional YYYY-MM override"),
    user=Depends(get_optional_user)
):
    """
    Monthly behavior summary for Replay and reflection without runtime overhead.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        monthly = get_monthly_summary(user_id, month_str=month)
        return monthly
    except Exception as e:
        print(f"[Behavior Monthly Summary Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve monthly summary.")


@router.get("/behavior/preferences", response_model=UserPreferences)
async def fetch_user_preferences(user=Depends(get_optional_user)):
    """
    Returns automatically learned user preferences: voice, world, camera, timing.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        prefs = get_user_preferences(user_id)
        return prefs
    except Exception as e:
        print(f"[Behavior Preferences Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user preferences.")


@router.get("/behavior/discoveries", response_model=List[BehaviorDiscovery])
async def fetch_behavior_discoveries(user=Depends(get_optional_user)):
    """
    Deterministic correlations with human confidence phrasing (no clinical percentages).
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        discoveries = get_behavior_discoveries(user_id)
        return discoveries
    except Exception as e:
        print(f"[Behavior Discoveries Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve behavior discoveries.")


@router.get("/behavior/timeline", response_model=List[BehaviorEvent])
async def fetch_behavior_timeline(
    limit: int = Query(50, ge=1, le=200),
    source: Optional[str] = Query(None),
    user=Depends(get_optional_user)
):
    """
    Unified timeline events stream for activity feeds and audit logs.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        events = get_user_events(user_id, limit=limit, source=source)
        return events
    except Exception as e:
        print(f"[Behavior Timeline Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve timeline events.")
