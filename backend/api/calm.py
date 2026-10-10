from fastapi import APIRouter, Depends
from models.calm import CalmStartRequest, CalmStartResponse
from auth.verify import get_optional_user
from services.profile_service import get_profile

router = APIRouter()

@router.post("/calm/start", response_model=CalmStartResponse)
def post_calm_start(data: CalmStartRequest = None, user=Depends(get_optional_user)):
    """Generates personalized opening guidance for Panic Reset with instant response."""
    user_name = None
    if user and hasattr(user, "id"):
        profile = get_profile(user.id)
        if profile:
            user_name = profile.get("display_name")

    name_suffix = f", {user_name}" if user_name else ""

    return CalmStartResponse(
        opening_line=f"I'm here with you{name_suffix}.",
        pause_line="We don't need to solve everything right now.",
        question="What feels most supportive?",
        user_name=user_name,
        voice_guidance_intro=(
            f"I'm here with you{name_suffix}. Take a soft breath. "
            "We don't need to solve everything right now. "
            "There is nothing to get right, and we will take our time."
        )
    )
