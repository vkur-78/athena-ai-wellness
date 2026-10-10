from fastapi import APIRouter, HTTPException, Depends, Query, Response
from typing import Optional, Dict, Any
from models.reflection import (
    HomeReflectionPreview,
    WeeklyReflectionResponse,
    MonthlyReflectionResponse,
    GenerateReflectionRequest,
    ReflectionHistoryResponse,
    ReflectionSearchResponse,
)
from services.reflection_engine import (
    get_home_reflection_preview,
    get_or_generate_weekly,
    get_or_generate_monthly,
    build_luxury_keepsake_pdf,
    search_reflection_universe,
    get_reflection_history,
    _get_user_display_name,
)
from auth.verify import get_optional_user

router = APIRouter()


@router.get("/reflection/home", response_model=HomeReflectionPreview)
async def fetch_home_reflection_preview(user=Depends(get_optional_user)):
    """
    Returns single, unhurried preview for the Home page:
    - Title: "This Week's Reflection"
    - Preview sentence synthesized from real events
    - Action button: "Continue Reading ->"
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        preview = get_home_reflection_preview(user_id)
        return preview
    except Exception as e:
        print(f"[Home Reflection Preview Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load home reflection preview: {str(e)}")


@router.get("/reflection/weekly/current", response_model=WeeklyReflectionResponse)
async def fetch_current_weekly_reflection(user=Depends(get_optional_user)):
    """
    Retrieves the current week's 600-900 word therapist reflection with:
    1. Your Week in One Sentence
    2. The Story of Your Week (3 paragraphs)
    3. Moments That Mattered (Cards with verified dates)
    4. Quiet Patterns
    5. What Helped
    6. One Gentle Invitation
    7. Closing Letter
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        rec = get_or_generate_weekly(user_id, force=False)
        return rec
    except Exception as e:
        print(f"[Weekly Reflection API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load weekly reflection: {str(e)}")


@router.get("/reflection/monthly/current", response_model=MonthlyReflectionResponse)
async def fetch_current_monthly_reflection(
    month: Optional[str] = Query(None, description="Optional YYYY-MM override"),
    user=Depends(get_optional_user)
):
    """
    Retrieves Athena's signature Monthly Keepsake Report synthesizing the entire month:
    1. Month Theme
    2. Your Journey (Beginning, Middle, Ending)
    3. Meaningful Moments (5-8 genuine moments)
    4. What Changed
    5. Helpful Habits
    6. Areas That Deserve Gentleness
    7. Looking Forward
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        rec = get_or_generate_monthly(user_id, force=False, month_str=month)
        return rec
    except Exception as e:
        print(f"[Monthly Reflection API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load monthly reflection: {str(e)}")


@router.get("/reflection/history", response_model=ReflectionHistoryResponse)
async def fetch_reflection_history_endpoint(user=Depends(get_optional_user)):
    """
    Retrieves past weekly and monthly reflections in reverse chronological order.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        history = get_reflection_history(user_id)
        return history
    except Exception as e:
        print(f"[Reflection History API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load reflection history: {str(e)}")


@router.post("/reflection/generate-weekly", response_model=WeeklyReflectionResponse)
async def generate_weekly_reflection_endpoint(
    req: GenerateReflectionRequest = GenerateReflectionRequest(),
    user=Depends(get_optional_user)
):
    """
    Generates or refreshes the weekly reflection with duplicate prevention.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        rec = get_or_generate_weekly(user_id, force=bool(req.force))
        return rec
    except Exception as e:
        print(f"[Generate Weekly Reflection Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate weekly reflection: {str(e)}")


@router.post("/reflection/generate-monthly", response_model=MonthlyReflectionResponse)
async def generate_monthly_reflection_endpoint(
    req: GenerateReflectionRequest = GenerateReflectionRequest(),
    user=Depends(get_optional_user)
):
    """
    Generates or refreshes the monthly keepsake reflection with duplicate prevention.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        rec = get_or_generate_monthly(user_id, force=bool(req.force), month_str=req.target_date)
        return rec
    except Exception as e:
        print(f"[Generate Monthly Reflection Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate monthly reflection: {str(e)}")


@router.get("/reflection/monthly/pdf")
async def download_monthly_pdf(
    month: Optional[str] = Query(None, description="Optional month string YYYY-MM"),
    user=Depends(get_optional_user)
):
    """
    Builds and streams the luxury 6-page vector PDF keepsake report.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        monthly = get_or_generate_monthly(user_id, force=False, month_str=month)
        user_name = _get_user_display_name(user_id)

        content = monthly.get("content", {})
        if isinstance(content, str):
            try:
                content = json.loads(content)
            except Exception:
                content = {}
        pdf_bytes = build_luxury_keepsake_pdf(user_name, content)

        month_clean = content.get("month", "Monthly").replace(" ", "_")
        filename = f"Athena_{month_clean}_Keepsake.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        print(f"[Monthly Keepsake PDF Download Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate keepsake PDF: {str(e)}")


@router.get("/reflection/search", response_model=ReflectionSearchResponse)
async def search_reflection_universe_endpoint(
    q: str = Query(..., description="Query to search across reflections, journals, studio, and chats"),
    user=Depends(get_optional_user)
):
    """
    Allows natural search across Conversations, Space (Journal), Studio, and past Reflections.
    """
    try:
        user_id = user.id if user else "guest_sanctuary"
        results = search_reflection_universe(user_id, q)
        return {
            "query": q,
            "total": len(results),
            "results": results
        }
    except Exception as e:
        print(f"[Reflection Search API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search reflection universe: {str(e)}")
