import re
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from typing import Optional

from models.monthly_replay import MonthlyReplayData
from services.monthly_replay_service import synthesize_monthly_replay
from services.monthly_replay_pdf import build_monthly_replay_pdf
from auth.verify import verify_user

router = APIRouter()


@router.get("/replay/monthly", response_model=MonthlyReplayData)
async def fetch_monthly_replay(
    month: Optional[str] = Query(None, description="Optional YYYY-MM override"),
    user=Depends(verify_user)
):
    """
    Retrieves Athena's flagship 7-chapter cinematic Monthly Replay recap:
    - Chapter 1: Grounded Month Story
    - Chapter 2: Emotional Rhythm (Wave, River, Heatmap, Constellation)
    - Chapter 3: Turning Points (Verified Timestamps)
    - Chapter 4: Your World Grew
    - Chapter 5: What Helped You
    - Chapter 6: Gentle Opportunities
    - Chapter 7: Looking Forward
    """
    try:
        data = synthesize_monthly_replay(user.id, month_str=month)

        # Emit behavior event into Unified Intelligence Timeline
        try:
            from services.behavior_pipeline import record_behavior_event
            record_behavior_event(
                user_id=user.id,
                source="replay",
                event_type="replay_viewed",
                metadata={"month": month or "current_month"}
            )
        except Exception:
            pass

        return data
    except Exception as e:
        print(f"[Monthly Replay API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate monthly replay: {str(e)}")


@router.get("/replay/monthly/pdf")
async def download_monthly_replay_pdf(
    month: Optional[str] = Query(None, description="Optional YYYY-MM override"),
    lang: Optional[str] = Query("en", description="Optional language (en, hi, ta, te, mr, gu)"),
    user=Depends(verify_user)
):
    """
    Generates and returns Athena's luxury vector ReportLab PDF keepsake.
    Contains zero clinical scores or streak metrics. Respects user language.
    """
    try:
        data = synthesize_monthly_replay(user.id, month_str=month)
        is_demo = getattr(user, "is_demo", False) or (user.id == "59327d2b-6e65-456e-ab5a-148602a4bd75")
        data["is_demo"] = is_demo
        pdf_bytes = build_monthly_replay_pdf(data, lang=lang or "en")

        raw_name = (data.get("user_name") or "").strip()
        if is_demo or raw_name.lower().startswith("aarav") or raw_name.lower() == "friend":
            safe_name = "Aarav-Sharma"
        elif raw_name:
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '-', raw_name).strip('-') or "Member"
        else:
            safe_name = "Member"

        month_disp = data.get("month_display") or month or "Sanctuary"
        safe_period = re.sub(r'[^a-zA-Z0-9_-]', '-', month_disp).strip('-')
        pdf_filename = f"Athena-Sanctuary-Report-{safe_name}-{safe_period}.pdf"

        # Emit behavior event into Unified Intelligence Timeline
        try:
            from services.behavior_pipeline import record_behavior_event
            record_behavior_event(
                user_id=user.id,
                source="replay",
                event_type="replay_exported",
                metadata={"month": month or "current_month", "format": "pdf", "lang": lang or "en"}
            )
        except Exception:
            pass

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{pdf_filename}"'
            }
        )
    except Exception as e:
        print(f"[Monthly Replay PDF API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compile replay PDF: {str(e)}")
