"""
Athena Behavior Intelligence API Endpoints (Phase 4.2)
Exposes the deterministic reasoning pipeline, therapeutic analytics,
adaptive 7-day experiments with feedback loops, and luxury monthly keepsake.
"""

import os
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from typing import Optional

from models.behavior_intelligence import (
    TodayGuidanceResponse,
    BehaviorPatternsResponse,
    TherapeuticAnalytics,
    TriggerRecoveryResponse,
    RecoveryForecast,
    AdaptiveExperimentsResponse,
    ExperimentFeedbackPayload,
    EmotionalSeason,
    MilestonesResponse,
    KeepsakeData,
    PracticeImpactResponse,
    TriggerHeatmapResponse,
    RecoverySignalsResponse,
    AdaptiveWeeklyPlanResponse,
)
from services.behavior_intelligence import BehaviorIntelligenceEngine
from auth.verify import get_optional_user

router = APIRouter()


@router.get("/insights/today", response_model=TodayGuidanceResponse)
async def get_today_guidance(
    hour: Optional[int] = Query(None, ge=0, le=23, description="Client local hour 0-23"),
    user=Depends(get_optional_user),
):
    """Section 1: Live AI today's guidance."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_todays_guidance(user_id, client_hour=hour)
    except Exception as e:
        print(f"[Behavior Insights Today Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/patterns", response_model=BehaviorPatternsResponse)
async def get_behavior_patterns(user=Depends(get_optional_user)):
    """Section 2: Behavioral pattern intelligence cards."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_behavior_patterns(user_id)
    except Exception as e:
        print(f"[Behavior Insights Patterns Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/rhythm", response_model=TherapeuticAnalytics)
async def get_therapeutic_analytics(user=Depends(get_optional_user)):
    """Section 3: Therapeutic Analytics (Energy Rhythm, Stress Recovery Flow, Recovery Balance, Heatmap)."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_therapeutic_analytics(user_id)
    except Exception as e:
        print(f"[Behavior Insights Analytics Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/recovery-map", response_model=TriggerRecoveryResponse)
async def get_trigger_recovery_map(user=Depends(get_optional_user)):
    """Section 4: Trigger -> Recovery pathways."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_trigger_recovery_map(user_id)
    except Exception as e:
        print(f"[Behavior Insights Recovery Map Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/forecast", response_model=RecoveryForecast)
async def get_recovery_forecast(user=Depends(get_optional_user)):
    """Section 5: Recovery forecast (gentle prediction)."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_recovery_forecast(user_id)
    except Exception as e:
        print(f"[Behavior Insights Forecast Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/experiments", response_model=AdaptiveExperimentsResponse)
async def get_adaptive_experiments(user=Depends(get_optional_user)):
    """Section 6: 7-Day adaptive experiments with progress."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_adaptive_experiments(user_id)
    except Exception as e:
        print(f"[Behavior Insights Experiments Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights/experiments/{experiment_id}/feedback")
async def record_experiment_feedback(
    experiment_id: str,
    payload: ExperimentFeedbackPayload,
    user=Depends(get_optional_user),
):
    """Records user feedback (helped, neutral, not_helped) to update intelligence recommendations."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.record_experiment_feedback(user_id, experiment_id, payload.feedback)
    except Exception as e:
        print(f"[Behavior Insights Feedback Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/season", response_model=EmotionalSeason)
async def get_emotional_season(user=Depends(get_optional_user)):
    """Section 7: Emotional Seasons monthly theme."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_emotional_season(user_id)
    except Exception as e:
        print(f"[Behavior Insights Season Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/milestones", response_model=MilestonesResponse)
async def get_milestone_library(user=Depends(get_optional_user)):
    """Section 8: Milestone library memories."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_milestone_library(user_id)
    except Exception as e:
        print(f"[Behavior Insights Milestones Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/practice-impact", response_model=PracticeImpactResponse)
async def get_practice_impact(user=Depends(get_optional_user)):
    """Section 9: Practice Impact Dashboard."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_practice_impact(user_id)
    except Exception as e:
        print(f"[Behavior Insights Practice Impact Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/trigger-heatmap", response_model=TriggerHeatmapResponse)
async def get_trigger_heatmap(user=Depends(get_optional_user)):
    """Section 10: Calming Trigger Heatmap."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_trigger_heatmap(user_id)
    except Exception as e:
        print(f"[Behavior Insights Trigger Heatmap Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/recovery-signals", response_model=RecoverySignalsResponse)
async def get_recovery_signals(user=Depends(get_optional_user)):
    """Section 11: Evidence-based Recovery Signals."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_recovery_signals(user_id)
    except Exception as e:
        print(f"[Behavior Insights Recovery Signals Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/weekly-plan", response_model=AdaptiveWeeklyPlanResponse)
async def get_adaptive_weekly_plan(user=Depends(get_optional_user)):
    """Section 12: Adaptive Weekly Planner."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.get_weekly_plan(user_id)
    except Exception as e:
        print(f"[Behavior Insights Weekly Plan Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/keepsake/generate", response_model=KeepsakeData)
@router.post("/insights/keepsake/generate", response_model=KeepsakeData)
@router.post("/monthly-keepsake/generate", response_model=KeepsakeData)
async def generate_keepsake(
    month: Optional[str] = Query(None, description="Month label e.g. September 2026"),
    user=Depends(get_optional_user),
):
    """Generates monthly keepsake reflection and compiles luxury PDF."""
    try:
        user_id = user.id if user else "guest_sanctuary"
        return BehaviorIntelligenceEngine.generate_keepsake(user_id, month_str=month)
    except Exception as e:
        print(f"[Behavior Insights Keepsake Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/keepsake/pdf")
@router.get("/insights/keepsake/pdf")
@router.get("/monthly-keepsake/pdf")
async def download_keepsake_pdf(
    user_id: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    user=Depends(get_optional_user),
):
    """Streams the compiled luxury printable vector PDF with strict IDOR protections."""
    if user:
        if user_id and user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's keepsake.")
        target_uid = user.id
    else:
        if user_id and user_id != "guest_sanctuary":
            raise HTTPException(status_code=401, detail="Authentication required to access user keepsakes.")
        target_uid = "guest_sanctuary"

    target_month = month or "September_2026"
    safe_month = target_month.replace(" ", "_")

    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "keepsakes")
    pdf_filename = f"Athena_Behavior_Keepsake_{target_uid[:8]}_{safe_month}.pdf"
    pdf_path = os.path.join(out_dir, pdf_filename)

    if not os.path.exists(pdf_path):
        BehaviorIntelligenceEngine.generate_keepsake(target_uid, month_str=safe_month.replace("_", " "))

    if os.path.exists(pdf_path):
        return FileResponse(
            path=pdf_path,
            filename=pdf_filename,
            media_type="application/pdf",
        )
    raise HTTPException(status_code=404, detail="Keepsake PDF not found.")
