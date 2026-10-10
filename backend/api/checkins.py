from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from models.checkin import CheckinCreate, CheckinResponse, TodayCheckinStatus
from services.checkin_service import (
    get_today_checkin,
    create_checkin,
    get_checkin_history
)
from auth.verify import verify_user, require_active_entitlement

router = APIRouter()

@router.post("/checkins", response_model=CheckinResponse)
def submit_checkin(data: CheckinCreate, user=Depends(require_active_entitlement)):
    """Submit daily wellness check-in and receive AI reflection."""
    try:
        checkin_dict = data.model_dump(by_alias=True)
        saved = create_checkin(user.id, checkin_dict, client_date=data.date)
        return saved
    except ValueError as ve:
        # Duplicate submission for today
        existing = get_today_checkin(user.id, data.date)
        if existing:
            raise HTTPException(
                status_code=409,
                detail="A check-in for today has already been completed.",
                headers={"X-Existing-Id": str(existing.get("id"))}
            )
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[Checkin API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit check-in: {str(e)}")

@router.get("/checkins/today", response_model=TodayCheckinStatus)
def get_today_status(
    client_date: Optional[str] = Query(None, description="Client local date in YYYY-MM-DD format"),
    user=Depends(verify_user)
):
    """Checks whether the authenticated user has already checked in for today."""
    try:
        checkin = get_today_checkin(user.id, client_date)
        if checkin:
            return TodayCheckinStatus(has_checkin=True, checkin=CheckinResponse(**checkin))
        return TodayCheckinStatus(has_checkin=False, checkin=None)
    except Exception as e:
        print(f"[Checkin Today Status Error]: {e}")
        return TodayCheckinStatus(has_checkin=False, checkin=None)

@router.get("/checkins/history", response_model=List[CheckinResponse])
def get_history(
    limit: int = Query(30, ge=1, description="Max check-ins to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user=Depends(verify_user)
):
    """Returns recent check-in history for the authenticated user with pagination support."""
    try:
        history = get_checkin_history(user.id, limit=limit, offset=offset)
        return [CheckinResponse(**item) for item in history]
    except Exception as e:
        print(f"[Checkin History Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")
