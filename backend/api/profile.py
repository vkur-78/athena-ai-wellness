from fastapi import APIRouter, HTTPException, Depends
from models.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from services.profile_service import (
    get_profile,
    save_onboarding_profile,
    update_profile
)
from auth.verify import verify_user

router = APIRouter()

@router.post("/profile/onboarding", response_model=ProfileResponse)
def submit_onboarding(data: ProfileCreate, user=Depends(verify_user)):
    """Save user onboarding intake session and mark onboarding as complete."""
    try:
        profile_dict = data.model_dump()
        saved = save_onboarding_profile(user.id, profile_dict)
        return saved
    except Exception as e:
        print(f"[Onboarding API Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")

@router.get("/profile", response_model=ProfileResponse)
def get_user_profile(user=Depends(verify_user)):
    """Get the authenticated user's current baseline profile and onboarding status."""
    profile = get_profile(user.id)
    if not profile:
        from services.demo_date_projector import get_current_server_datetime_ist
        user_c = getattr(user, "created_at", None)
        if hasattr(user_c, "isoformat"):
            now_iso = user_c.isoformat()
        elif isinstance(user_c, str) and user_c:
            now_iso = user_c
        else:
            now_iso = get_current_server_datetime_ist().isoformat()

        # Return default empty profile indicating onboarding is not completed with 30-day trial
        return {
            "user_id": user.id,
            "onboarding_completed": False,
            "created_at": now_iso,
            "is_demo": False,
            "trial_active": True,
            "trial_days_remaining": 30,
            "entitlement_mode": "TRIAL_30_DAYS",
            "trial_started_at": now_iso,
            "language": "en",
            "current_focus": [],
            "emotional_patterns": [],
            "sensitive_topics": [],
            "coping_methods": []
        }

    for k in ["created_at", "trial_started_at", "trial_ends_at", "updated_at"]:
        if hasattr(profile.get(k), "isoformat"):
            profile[k] = profile[k].isoformat()
    profile.setdefault("language", "en")
    return profile

@router.patch("/profile", response_model=ProfileResponse)
def patch_user_profile(data: ProfileUpdate, user=Depends(verify_user)):
    """Update specific attributes of the user profile."""
    try:
        updates = data.model_dump(exclude_unset=True)
        updated = update_profile(user.id, updates)
        return updated
    except Exception as e:
        print(f"[Profile Patch Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")
