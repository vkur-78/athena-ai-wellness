from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import Optional, List, Dict, Any
from models.studio import (
    StudioSessionCreate,
    StudioSessionResponse,
    StudioRecentMomentsResponse,
    StudioReflectionRequest,
    StudioReflectionResponse,
    ExerciseListResponse,
    ExerciseDefinition,
    StudioSessionStartRequest,
    StudioSessionUpdateRequest,
    StudioSessionCompleteRequest,
    StudioSessionAbandonRequest,
    StudioHistoryResponse,
)
from services.studio_exercises import (
    get_all_exercises,
    get_exercise_by_id,
    STUDIO_CATEGORIES,
)
from services.studio_service import (
    save_studio_session,
    start_studio_session,
    update_studio_session,
    complete_studio_session,
    abandon_studio_session,
    get_recent_moments,
    get_gentle_reflection,
    get_user_studio_history,
)
from auth.verify import verify_user, get_optional_user

router = APIRouter()


# ============================================================================
# EXERCISE DEFINITIONS LIBRARY (REAL SEEDED EXERCISES, ZERO FAKE STATS)
# ============================================================================

@router.get("/studio/exercises", response_model=ExerciseListResponse)
async def list_exercises():
    """
    Returns the initial library of 8 evidence-informed, calm exercises
    along with the available categories.
    """
    exercises = get_all_exercises()
    return {
        "exercises": exercises,
        "categories": STUDIO_CATEGORIES,
    }


@router.get("/studio/exercises/{exercise_id}", response_model=ExerciseDefinition)
async def get_exercise(exercise_id: str = Path(..., description="Unique exercise identifier")):
    """
    Retrieves a single guided exercise definition with its full structured steps.
    """
    exercise = get_exercise_by_id(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail=f"Exercise '{exercise_id}' not found.")
    return exercise


# ============================================================================
# EXERCISE SESSION LIFECYCLE (START, UPDATE, COMPLETE, ABANDON)
# ============================================================================

@router.post("/studio/sessions/start", response_model=StudioSessionResponse)
async def start_session(data: StudioSessionStartRequest, user=Depends(verify_user)):
    """
    Initializes a new exercise session with 'STARTED' status.
    Does NOT count as completed until all steps are finished.
    """
    try:
        user_id = user.id
        saved = start_studio_session(user_id, data.model_dump())
        return saved
    except Exception as e:
        print(f"[Studio Start Session Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start exercise session: {str(e)}")


@router.patch("/studio/sessions/{session_id}", response_model=StudioSessionResponse)
async def update_session(
    session_id: str,
    data: StudioSessionUpdateRequest,
    user=Depends(verify_user)
):
    """
    Updates in-progress metrics (such as steps completed or elapsed duration).
    """
    try:
        user_id = user.id
        updated = update_studio_session(user_id, session_id, data.model_dump(exclude_unset=True))
        return updated
    except Exception as e:
        print(f"[Studio Update Session Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")


@router.post("/studio/sessions/{session_id}/complete", response_model=StudioSessionResponse)
async def complete_session(
    session_id: str,
    data: StudioSessionCompleteRequest,
    user=Depends(verify_user)
):
    """
    Marks the session as 'COMPLETED' with the actual timestamp and duration.
    Only completed sessions count toward user statistics and recent practices.
    """
    try:
        user_id = user.id
        completed = complete_studio_session(user_id, session_id, data.model_dump())
        return completed
    except Exception as e:
        print(f"[Studio Complete Session Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to complete session: {str(e)}")


@router.post("/studio/sessions/{session_id}/abandon", response_model=StudioSessionResponse)
async def abandon_session(
    session_id: str,
    data: StudioSessionAbandonRequest,
    user=Depends(verify_user)
):
    """
    Marks an exercise session as 'ABANDONED' when a user leaves early.
    Strictly NOT counted as a completed practice.
    """
    try:
        user_id = user.id
        abandoned = abandon_studio_session(user_id, session_id, data.model_dump())
        return abandoned
    except Exception as e:
        print(f"[Studio Abandon Session Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to abandon session: {str(e)}")


# ============================================================================
# USER PRACTICE HISTORY (REAL STORED DATA ONLY)
# ============================================================================

@router.get("/studio/history", response_model=StudioHistoryResponse)
async def fetch_user_history(
    limit: int = Query(50, ge=1, le=1000),
    user=Depends(verify_user)
):
    """
    Returns verified stored practice history for the authenticated user.
    Grouped by IST relative display dates ('Today', 'Yesterday', 'Sep 28').
    Zero fake records, zero fabricated analytics.
    """
    try:
        user_id = user.id
        history = get_user_studio_history(user_id, limit=limit)
        return history
    except Exception as e:
        print(f"[Studio History API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load practice history: {str(e)}")


# ============================================================================
# LEGACY & COMPATIBILITY ENDPOINTS (PRESERVED)
# ============================================================================

@router.post("/studio/sessions", response_model=StudioSessionResponse)
@router.post("/studio/session", response_model=StudioSessionResponse)
async def record_session(data: StudioSessionCreate, user=Depends(verify_user)):
    """
    Saves a completed or in-progress studio practice session.
    Requires authenticated user.
    """
    try:
        user_id = user.id
        session_dict = data.model_dump()
        saved = save_studio_session(user_id, session_dict)
        return saved
    except Exception as e:
        print(f"[Studio Session API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record practice session: {str(e)}")


@router.get("/studio/recent", response_model=StudioRecentMomentsResponse)
async def fetch_recent_moments(
    limit: int = Query(5, ge=1, le=20),
    user=Depends(verify_user)
):
    """
    Retrieves humanized, non-gamified recent practice moments.
    No streaks, no percentages, no scores.
    """
    try:
        user_id = user.id
        moments = get_recent_moments(user_id, limit=limit)
        return {"moments": moments}
    except Exception as e:
        print(f"[Studio Recent Moments API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load recent moments: {str(e)}")


@router.post("/studio/reflection", response_model=StudioReflectionResponse)
async def fetch_gentle_reflection(data: StudioReflectionRequest):
    """
    Returns Athena's single post-practice gentle sentence.
    Never over-praises, never gamifies.
    """
    try:
        sentence = get_gentle_reflection(
            practice_type=data.practice_type,
            routine=data.routine,
            completed=data.completed,
        )
        return {"gentle_sentence": sentence}
    except Exception as e:
        print(f"[Studio Reflection API Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reflection sentence.")
