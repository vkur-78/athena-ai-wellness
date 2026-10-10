import re
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from typing import Optional, List

from models.living_replay import LivingReplayData, ReplayArchiveItem
from services.living_replay_service import (
    synthesize_living_replay,
    get_replay_archive,
    build_living_replay_pdf,
)
from auth.verify import get_optional_user

router = APIRouter()


@router.get("/replay/living", response_model=LivingReplayData)
async def fetch_living_replay(
    type: str = Query("weekly", description="'weekly' or 'monthly'"),
    period: Optional[str] = Query(None, description="Optional YYYY-Www or YYYY-MM override"),
    user=Depends(get_optional_user),
):
    """
    Retrieves Athena's 8-Chapter Living Replay:
    1. Opening Scene (Time-aware greeting)
    2. Mood Journey (Flowing emotional ribbon)
    3. Recovery Moments (Verified stored events)
    4. Sanctuary Worlds (Favorite world, voice, camera)
    5. Quiet Victories (Meaningful presence memories)
    6. Emotional Rhythm (Strongest verified correlation)
    7. Growth Reflection (Grounded therapist narrative)
    8. Gentle Next Chapter (3 adaptive invitations)
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        replay = synthesize_living_replay(user_id, replay_type=type, period_str=period)
        return replay
    except Exception as e:
        print(f"[Living Replay API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate living replay: {str(e)}")


@router.get("/replay/archive", response_model=List[ReplayArchiveItem])
async def fetch_replay_archive(user=Depends(get_optional_user)):
    """
    Returns dedicated replay archive list for past weeks and months.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        archive = get_replay_archive(user_id)
        return archive
    except Exception as e:
        print(f"[Replay Archive API Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to load replay archive.")


@router.get("/replay/pdf")
async def download_replay_pdf(
    type: str = Query("weekly", description="'weekly' or 'monthly'"),
    period: Optional[str] = Query(None, description="Optional YYYY-Www or YYYY-MM override"),
    lang: Optional[str] = Query("en", description="Optional language (en, hi, ta, te, mr, gu)"),
    user=Depends(get_optional_user),
):
    """
    Generates and returns Athena's luxury vector ReportLab PDF keepsake.
    Zero clinical scores or streak metrics. Respects user language.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        replay = synthesize_living_replay(user_id, replay_type=type, period_str=period)
        is_demo = getattr(user, "is_demo", False) or (user_id == "59327d2b-6e65-456e-ab5a-148602a4bd75")
        replay["is_demo"] = is_demo
        pdf_bytes = build_living_replay_pdf(replay, lang=lang or "en")

        raw_name = (replay.get("user_name") or "").strip()
        if is_demo or raw_name.lower().startswith("aarav") or raw_name.lower() == "friend":
            safe_name = "Aarav-Sharma"
        elif raw_name:
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '-', raw_name).strip('-') or "Member"
        else:
            safe_name = "Member"

        time_period_slug = re.sub(r'[^a-zA-Z0-9_-]', '-', replay.get("time_period", "current")).strip('-')
        pdf_filename = f"Athena-Sanctuary-Report-{type.title()}-{safe_name}-{time_period_slug}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{pdf_filename}"'
            }
        )
    except Exception as e:
        print(f"[Living Replay PDF API Error]: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate replay PDF keepsake.")
