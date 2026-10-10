import os
from fastapi import APIRouter, HTTPException, Depends, Query, Response
from fastapi.responses import FileResponse
from typing import Optional

from models.insights import (
    TodayGuidanceResponse,
    ObservationsResponse,
    EmotionalLandscapeResponse,
    MomentsResponse,
    HelpfulHabitsResponse,
    GrowthAreasResponse,
    WeeklyActionPlan,
    AskInsightRequest,
    AskInsightResponse,
    MonthlyKeepsakeResponse,
)
from services.intelligence_engine import IntelligenceEngine
from auth.verify import get_optional_user

router = APIRouter()


@router.get("/insights/today", response_model=TodayGuidanceResponse)
async def get_today_guidance(
    hour: Optional[int] = Query(None, ge=0, le=23, description="Client local hour 0-23"),
    user=Depends(get_optional_user),
):
    """
    Section 1: Dynamic first-impression guidance based on real behavior, check-ins,
    recent chats, Studio usage, and time of day.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_todays_guidance(user_id, client_hour=hour)
    except Exception as e:
        print(f"[Insights API Today Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/observations", response_model=ObservationsResponse)
async def get_observations(user=Depends(get_optional_user)):
    """
    Section 2: Evidence-backed observations.
    Filtered by internal confidence >= 0.70 with 'Why I noticed this' breakdown.
    Never exposes raw confidence numbers.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_observations(user_id)
    except Exception as e:
        print(f"[Insights API Observations Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/landscape", response_model=EmotionalLandscapeResponse)
async def get_emotional_landscape(user=Depends(get_optional_user)):
    """
    Section 3: Emotional landscape visualization (Quiet River, Clouded Horizon,
    Gentle Dawn, Steady Forest, Open Sky) with real behavioral evidence.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_emotional_landscape(user_id)
    except Exception as e:
        print(f"[Insights API Landscape Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/moments", response_model=MomentsResponse)
async def get_moments_that_changed_week(user=Depends(get_optional_user)):
    """
    Section 4: Moments That Changed Your Week.
    Interactive story cards with real timestamps and expandable context.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_moments_that_changed_week(user_id)
    except Exception as e:
        print(f"[Insights API Moments Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/helpful-habits", response_model=HelpfulHabitsResponse)
async def get_helpful_habits(user=Depends(get_optional_user)):
    """
    Section 5: Outcome-ranked interventions based on verified user activity.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_helpful_habits(user_id)
    except Exception as e:
        print(f"[Insights API Helpful Habits Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/growth-areas", response_model=GrowthAreasResponse)
async def get_growth_areas(user=Depends(get_optional_user)):
    """
    Section 6: Places Worth Paying Attention To (What noticed, Why noticed, Small experiment).
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_growth_areas(user_id)
    except Exception as e:
        print(f"[Insights API Growth Areas Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/weekly-plan", response_model=WeeklyActionPlan)
async def get_weekly_action_plan(user=Depends(get_optional_user)):
    """
    Section 7: Living adaptive weekly plan strictly referencing prior user practices.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.get_weekly_action_plan(user_id)
    except Exception as e:
        print(f"[Insights API Weekly Plan Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights/ask", response_model=AskInsightResponse)
async def ask_athena_about_month(
    payload: AskInsightRequest,
    user=Depends(get_optional_user),
):
    """
    Section 8: Interactive Q&A answering questions using verified user data without hallucinating.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.ask_athena_about_month(user_id, payload.question)
    except Exception as e:
        print(f"[Insights API Ask Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/monthly-keepsake/generate", response_model=MonthlyKeepsakeResponse)
async def generate_monthly_keepsake(
    month: Optional[str] = Query(None, description="Month label e.g. September 2026"),
    user=Depends(get_optional_user),
):
    """
    Redesigned multi-chapter monthly keepsake reflection & PDF compilation.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        return IntelligenceEngine.generate_monthly_keepsake(user_id, month_str=month)
    except Exception as e:
        print(f"[Insights API Keepsake Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monthly-keepsake/pdf")
async def download_monthly_keepsake_pdf(
    user_id: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    user=Depends(get_optional_user),
):
    """
    Streams the generated luxury printable PDF.
    """
    if user:
        if user_id and user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's keepsake.")
        target_uid = user.id
    else:
        target_uid = "guest_sanctuary"
    target_month = month or "September_2026"
    safe_month = target_month.replace(" ", "_")

    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "keepsakes")
    pdf_filename = f"Athena_Keepsake_{target_uid[:8]}_{safe_month}.pdf"
    pdf_path = os.path.join(out_dir, pdf_filename)

    if not os.path.exists(pdf_path):
        # Generate on the fly if needed
        IntelligenceEngine.generate_monthly_keepsake(target_uid, month_str=safe_month.replace("_", " "))

    if os.path.exists(pdf_path):
        return FileResponse(
            path=pdf_path,
            filename=pdf_filename,
            media_type="application/pdf",
        )
    raise HTTPException(status_code=404, detail="Keepsake PDF not found.")
