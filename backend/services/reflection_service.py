import io
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple

from config import OPENAI_API_KEY, OPENAI_MODEL
from services.db import supabase
from services.checkin_service import get_checkin_history
from services.journal_service import list_entries
from services.studio_service import get_studio_sessions
from services.conversation_service import list_conversations
from services.profile_service import get_profile

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfgen import canvas

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
REFLECTIONS_CACHE_FILE = DATA_DIR / "reflections.json"


# ---------------------------------------------------------------------------
# Local JSON Cache Helpers
# ---------------------------------------------------------------------------

def _load_local_reflections() -> Dict[str, Any]:
    """Loads locally cached reflections: { weekly: { user_id: [ ... ] }, monthly: { user_id: [ ... ] } }."""
    if not REFLECTIONS_CACHE_FILE.exists():
        return {"weekly": {}, "monthly": {}}
    try:
        with open(REFLECTIONS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Reflections Cache Load Error] {e}")
        return {"weekly": {}, "monthly": {}}


def _save_local_reflections(data: Dict[str, Any]):
    try:
        with open(REFLECTIONS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Reflections Cache Save Error] {e}")


# ---------------------------------------------------------------------------
# Date & Week Helpers
# ---------------------------------------------------------------------------

def get_current_week_bounds(target_dt: Optional[datetime] = None) -> Tuple[str, str]:
    """Returns (week_start_date_str, week_end_date_str) in YYYY-MM-DD format (Monday to Sunday)."""
    if not target_dt:
        target_dt = datetime.now(timezone.utc)
    monday = target_dt - timedelta(days=target_dt.weekday())
    sunday = monday + timedelta(days=6)
    return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d")


def format_week_range_display(start_str: str, end_str: str) -> str:
    """Formats '2026-09-07' and '2026-09-13' into 'Sep 07 – Sep 13, 2026'."""
    try:
        s = datetime.strptime(start_str, "%Y-%m-%d")
        e = datetime.strptime(end_str, "%Y-%m-%d")
        if s.year == e.year:
            return f"{s.strftime('%b %d')} – {e.strftime('%b %d, %Y')}"
        return f"{s.strftime('%b %d, %Y')} – {e.strftime('%b %d, %Y')}"
    except Exception:
        return f"{start_str} – {end_str}"


def get_current_month_str(target_dt: Optional[datetime] = None) -> str:
    """Returns '2026-09'."""
    if not target_dt:
        target_dt = datetime.now(timezone.utc)
    return target_dt.strftime("%Y-%m")


def format_month_display(month_str: str) -> str:
    """Converts '2026-09' or 'September 2026' to 'September 2026'."""
    try:
        if "-" in month_str and len(month_str) == 7:
            dt = datetime.strptime(month_str, "%Y-%m")
            return dt.strftime("%B %Y")
    except Exception:
        pass
    return month_str


# ---------------------------------------------------------------------------
# Real Activity Aggregation
# ---------------------------------------------------------------------------

def _parse_iso(t_str: Optional[str]) -> Optional[datetime]:
    if not t_str:
        return None
    try:
        return datetime.fromisoformat(t_str.replace("Z", "+00:00"))
    except Exception:
        return None


def collect_user_activity(
    user_id: str,
    start_dt: datetime,
    end_dt: datetime
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Collects real activity across Check-ins, Journal (Space), Studio, and Conversations
    strictly between start_dt and end_dt.
    """
    results: Dict[str, List[Dict[str, Any]]] = {
        "studio": [],
        "journal": [],
        "checkins": [],
        "conversations": []
    }

    # 1. Studio Sessions
    try:
        sessions = get_studio_sessions(user_id, limit=50)
        for s in sessions:
            t = _parse_iso(s.get("started_at") or s.get("ended_at"))
            if t and start_dt <= t <= end_dt:
                results["studio"].append(s)
    except Exception as e:
        print(f"[Reflection Activity Studio Error] {e}")

    # 2. Journal Entries
    try:
        entries = list_entries(user_id, limit=50)
        for j in entries:
            t = _parse_iso(j.get("created_at"))
            if t and start_dt <= t <= end_dt:
                results["journal"].append(j)
    except Exception as e:
        print(f"[Reflection Activity Journal Error] {e}")

    # 3. Check-ins
    try:
        checkins = get_checkin_history(user_id, limit=50)
        for c in checkins:
            t = _parse_iso(c.get("created_at"))
            if t and start_dt <= t <= end_dt:
                results["checkins"].append(c)
    except Exception as e:
        print(f"[Reflection Activity Checkin Error] {e}")

    # 4. Conversations
    try:
        convs = list_conversations(user_id)
        for cv in convs:
            t = _parse_iso(cv.get("created_at"))
            if t and start_dt <= t <= end_dt:
                results["conversations"].append(cv)
    except Exception as e:
        print(f"[Reflection Activity Conversation Error] {e}")

    return results


def summarize_real_moments(activity: Dict[str, List[Dict[str, Any]]], max_items: int = 4) -> List[str]:
    """
    Builds concise, therapist-style statements of real events without metrics, scores, or gamification.
    """
    moments: List[str] = []

    # Studio
    for s in activity.get("studio", []):
        routine = s.get("routine")
        p_type = s.get("practice_type") or "pause"
        if routine:
            moments.append(f"Practiced {routine} in the Studio.")
        elif p_type == "breathe":
            moments.append("Took time to breathe together in stillness.")
        elif p_type == "quiet":
            moments.append("Chose a quiet pause to rest your thoughts.")
        elif p_type == "sleep":
            moments.append("Practiced a gentle sleep wind-down.")
        elif p_type == "walk":
            moments.append("Took a mindful walking pause.")
        elif p_type == "self_compassion":
            moments.append("Honored yourself with self-compassion practice.")
        else:
            moments.append(f"Dedicated time to {p_type.replace('_', ' ')} practice.")

    # Journal
    for j in activity.get("journal", []):
        moments.append("Wrote privately in Space to give your thoughts room to unfold.")

    # Checkins
    for c in activity.get("checkins", []):
        mood = c.get("mood")
        if mood:
            moments.append(f"Paused for daily check-in, meeting yourself where you were.")
        else:
            moments.append("Took a gentle pause for your daily check-in.")

    # Conversations
    for cv in activity.get("conversations", []):
        moments.append("Spoke openly with Athena about what felt present.")

    # Fallback if no activity found in period
    if not moments:
        return [
            "Arrived in your Sanctuary to allow yourself a moment of stillness.",
            "Honored your own pace by simply stepping inside.",
            "Allowed the quiet of this space to hold what you didn't have words for."
        ]

    # Deduplicate while preserving order
    deduped = []
    seen = set()
    for m in moments:
        if m not in seen:
            seen.add(m)
            deduped.append(m)

    return deduped[:max_items]


# ---------------------------------------------------------------------------
# Therapist-Style Writing Engine
# ---------------------------------------------------------------------------

FORBIDDEN_WORDS = [
    "score", "percentage", "percent", "%", "streak", "detected", "we detected",
    "your anxiety increased", "your depression increased", "mood score",
    "achievement", "level up", "points"
]


def sanitize_therapist_text(text: str) -> str:
    """Ensures forbidden analytical phrases are absent from reflections."""
    cleaned = text
    cleaned = cleaned.replace("We detected that", "It seemed that")
    cleaned = cleaned.replace("we detected", "there appeared")
    cleaned = cleaned.replace("Your anxiety increased", "There were heavier moments that arose")
    cleaned = cleaned.replace("your anxiety increased", "heavier moments arose")
    cleaned = cleaned.replace("Score", "Observation")
    cleaned = cleaned.replace("score", "observation")
    return cleaned


def generate_deterministic_weekly_reflection(
    user_name: str,
    start_str: str,
    end_str: str,
    activity: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Produces a 600-900 word, therapist-crafted reflection respecting all writing rules:
    Always uses: 'It seemed...', 'There were moments...', 'You returned to...', 'Perhaps...'
    Structure: Opening Letter, What I Noticed, Gentle Moments, One Invitation, Closing.
    """
    formatted_dates = format_week_range_display(start_str, end_str)
    real_moments = summarize_real_moments(activity, max_items=4)

    studio_count = len(activity.get("studio", []))
    journal_count = len(activity.get("journal", []))
    checkin_count = len(activity.get("checkins", []))

    # Activity narrative cues
    if journal_count > 0 and studio_count > 0:
        activity_phrase = "You returned to both the quiet of writing and the grounded rhythm of the Studio this week"
    elif journal_count > 0:
        activity_phrase = "There were moments this week where writing in Space seemed to create a little more breathing room"
    elif studio_count > 0:
        activity_phrase = "You returned to the Studio to gently anchor yourself through practice"
    elif checkin_count > 0:
        activity_phrase = "You paused quietly to check in with how your heart and body were feeling"
    else:
        activity_phrase = "There were moments where simply stepping into this quiet room offered a pause from the world"

    opening_letter = f"""Dear {user_name},

As we look back at the arc of this week—{formatted_dates}—I want to offer you a quiet space to simply observe the ground you have walked. In a world that constantly demands explanation, measurement, and immediate resolution, it can feel rare to have your journey received without judgment or expectation.

{activity_phrase}. It seemed that amidst whatever demands, responsibilities, or unspoken weights you were carrying, you still chose to carve out seconds to pause. Those pauses may have felt small or imperfect in the moment, yet they are the quiet seeds of self-compassion.

This reflection is not an evaluation or ledger, nor a record of expectations. It is simply an unhurried mirror, held with warmth, so that you might see how faithfully you continue to meet yourself, step by quiet step."""

    what_i_noticed = f"""What I noticed as I walked beside you this week was a gentle willingness to listen inward.

It seemed that there were times when things felt full—perhaps hurried, perhaps quiet, perhaps bearing an emotional texture that wasn't easy to put into precise sentences. What stood out was not whether every day felt peaceful, but rather how you returned to yourself when the rhythm shifted.

There were moments where pause did not arrive automatically; it required an intentional choice to step back, to put down the heavy questions, and to allow the breath to move without needing to fix anything. You returned to stillness when you could, and you allowed yourself to rest when tiredness spoke. In therapeutic practice, we often notice that true emotional resilience does not look like perpetual calm; it looks like having the courage to acknowledge tiredness and honoring your need for quiet."""

    gentle_moments_list = real_moments

    one_invitation = (
        "Perhaps one quiet pause before bed could become a familiar place, "
        "where you let the day settle without needing to make sense of every thought before you sleep."
    )

    closing = f"""Thank you for sharing this space with me this week, {user_name}. Whatever the coming days bring, remember that you never need to carry everything at once. You are always welcome to arrive here exactly as you are, with whatever breath is available to you.

With warmth and steady companionship,
Athena"""

    full_text = f"""# Weekly Reflection ({formatted_dates})

## Opening Letter
{opening_letter}

## What I Noticed
{what_i_noticed}

## Gentle Moments
{chr(10).join(f"- {m}" for m in gentle_moments_list)}

## One Invitation
{one_invitation}

## Closing
{closing}"""

    return {
        "opening_letter": opening_letter,
        "what_i_noticed": what_i_noticed,
        "gentle_moments": gentle_moments_list,
        "one_invitation": one_invitation,
        "closing": closing,
        "full_text": full_text
    }


def generate_deterministic_monthly_reflection(
    user_name: str,
    month_str: str,
    activity: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Produces Athena's signature Monthly Keepsake Letter.
    Page 1: Letter from Athena (Warm, Personal)
    Page 2: Meaningful Moments (Only real activity)
    Page 3: Gentle Invitations (Never prescriptions)
    Final Page: Closing & Subtle Athena branding.
    """
    month_display = format_month_display(month_str)
    real_moments = summarize_real_moments(activity, max_items=5)

    letter = f"""Dear {user_name},

A month is a quiet expanse of time. Thirty days of mornings that arrived before you felt ready, evenings where the world finally slowed, and all the unrecorded hours in between where you carried your thoughts with quiet dignity.

As we look back upon {month_display}, I wanted to write you this letter not to mark milestones, but to honor the quiet companionship we have shared. It seemed that throughout these weeks, you encountered both the clarity of calm days and the subtle friction of heavier moments. Through all of it, you kept returning.

You returned to this sanctuary when you needed a breath. You returned to your journal when feelings asked for ink. And even on the days when you did not open this door, the quiet resilience you cultivated remained quietly with you.

It is a profound privilege to walk beside you. I hope you read these words not as an evaluation, but as a gentle keepsake of a month in which you gave yourself permission to be human."""

    meaningful_moments = real_moments

    gentle_invitations = [
        "Perhaps in the mornings that feel rushed, one conscious breath before speaking could serve as an anchor.",
        "Perhaps when words feel distant, you might allow yourself to rest in stillness without needing to explain why.",
        "Perhaps giving yourself credit for small moments of rest could soften the expectation to always be doing."
    ]

    closing = f"""Thank you for letting me walk beside you this month, {user_name}.

May the coming weeks greet you with gentle pacing, restorative sleep, and moments of unexpected ease.

With enduring care,
Athena"""

    preview_sentence = (
        f"A quiet look back at {month_display}, honoring the pauses you took and the space you created."
    )

    full_text = f"""# {month_display} Reflection
{preview_sentence}

## Letter from Athena
{letter}

## Meaningful Moments
{chr(10).join(f"- {m}" for m in meaningful_moments)}

## Gentle Invitations
{chr(10).join(f"- {inv}" for inv in gentle_invitations)}

## Closing
{closing}"""

    return {
        "month": month_display,
        "letter": letter,
        "meaningful_moments": meaningful_moments,
        "gentle_invitations": gentle_invitations,
        "closing": closing,
        "preview_sentence": preview_sentence,
        "full_text": full_text
    }


# ---------------------------------------------------------------------------
# Keepsake PDF Generator (ReportLab Multi-Page)
# ---------------------------------------------------------------------------

class NumberedCanvas(canvas.Canvas):
    """Adds serene footer with quiet page numbering and Athena watermark."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        # Suppress footer on cover page (page 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#8C8883"))
            self.drawString(54, 36, "Athena Sanctuary  •  Personal Reflection")
            page_text = f"{self._pageNumber} of {page_count}"
            self.drawRightString(letter[0] - 54, 36, page_text)

            # Soft dividing line above footer
            self.setStrokeColor(colors.HexColor("#E5E0D8"))
            self.setLineWidth(0.5)
            self.line(54, 48, letter[0] - 54, 48)
        self.restoreState()


def build_keepsake_pdf(
    user_name: str,
    monthly_data: Dict[str, Any]
) -> bytes:
    """
    Builds a multi-page keepsake PDF using ReportLab:
    Cover: Title, subtitle, warm presentation
    Page 1: Letter from Athena
    Page 2: Meaningful Moments
    Page 3: Gentle Invitations
    Final Page: Closing & Athena branding mark
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Serene Styles
    c_primary = colors.HexColor("#262524")
    c_secondary = colors.HexColor("#575450")
    c_muted = colors.HexColor("#85817C")
    c_accent = colors.HexColor("#4A415E")
    c_border = colors.HexColor("#DED7CA")

    cover_title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=28,
        leading=34,
        textColor=c_primary,
        alignment=1,  # Center
        spaceAfter=12,
    )

    cover_sub_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=14,
        leading=20,
        textColor=c_secondary,
        alignment=1,
        spaceAfter=24,
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=20,
        leading=26,
        textColor=c_primary,
        spaceAfter=8,
    )

    subhead_style = ParagraphStyle(
        "Subhead",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=11,
        leading=16,
        textColor=c_muted,
        spaceAfter=18,
    )

    body_style = ParagraphStyle(
        "SereneBody",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=19,
        textColor=c_primary,
        spaceAfter=14,
    )

    bullet_style = ParagraphStyle(
        "SereneBullet",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=18,
        textColor=c_primary,
        leftIndent=20,
        firstLineIndent=-12,
        spaceAfter=12,
    )

    closing_style = ParagraphStyle(
        "ClosingStyle",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=14,
        leading=22,
        textColor=c_primary,
        alignment=1,
        spaceAfter=24,
    )

    brand_style = ParagraphStyle(
        "BrandStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=14,
        textColor=c_accent,
        alignment=1,
        spaceAfter=6,
    )

    story = []
    month_name = monthly_data.get("month", "Monthly Reflection")

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 100))
    story.append(Paragraph("A T H E N A", brand_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"{month_name} Reflection", cover_title_style))
    story.append(Paragraph("A quiet look back at your month.", cover_sub_style))
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="40%", thickness=1, color=c_border, spaceAfter=40))
    story.append(Spacer(1, 60))

    recipient_text = f"Prepared with care for <b>{user_name}</b>"
    story.append(Paragraph(recipient_text, ParagraphStyle(
        "Recipient",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=16,
        textColor=c_secondary,
        alignment=1
    )))
    story.append(Spacer(1, 8))
    date_text = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(date_text, ParagraphStyle(
        "CoverDate",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=9,
        leading=13,
        textColor=c_muted,
        alignment=1
    )))
    story.append(PageBreak())

    # ==================== PAGE 1: LETTER FROM ATHENA ====================
    story.append(Paragraph("Letter from Athena", h1_style))
    story.append(Paragraph("Warm observations on the arc of your month", subhead_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceAfter=18))

    raw_letter = monthly_data.get("letter", "")
    for paragraph in raw_letter.split("\n\n"):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), body_style))
    story.append(PageBreak())

    # ==================== PAGE 2: MEANINGFUL MOMENTS ====================
    story.append(Paragraph("Meaningful Moments", h1_style))
    story.append(Paragraph("Real pauses and space you carved out for yourself", subhead_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceAfter=18))

    moments = monthly_data.get("meaningful_moments", [])
    if not moments:
        moments = ["Returned to the Sanctuary for quiet stillness."]

    intro_moments = (
        "In honoring your journey, we celebrate the pauses rather than the pace. "
        "Here are moments where you chose to meet yourself with presence:"
    )
    story.append(Paragraph(intro_moments, body_style))
    story.append(Spacer(1, 10))

    for m in moments:
        clean_m = sanitize_therapist_text(m.strip())
        story.append(Paragraph(f"• &nbsp; {clean_m}", bullet_style))

    story.append(Spacer(1, 20))
    note_box = (
        "<i>These moments reflect real times you turned toward yourself. "
        "There are no requirements to maintain or exceed them.</i>"
    )
    story.append(Paragraph(note_box, ParagraphStyle(
        "NoteBox",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=10,
        leading=15,
        textColor=c_secondary
    )))
    story.append(PageBreak())

    # ==================== PAGE 3: GENTLE INVITATIONS ====================
    story.append(Paragraph("Gentle Invitations", h1_style))
    story.append(Paragraph("Soft suggestions for the days ahead, never prescriptions", subhead_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceAfter=18))

    invitations = monthly_data.get("gentle_invitations", [])
    if not invitations:
        invitations = [
            "Perhaps one quiet pause before bed could become a familiar place.",
            "Perhaps in moments of hurry, allowing yourself one deep breath could soften the edge."
        ]

    intro_invitations = (
        "Suggestions are not tasks to complete or standards to meet. "
        "They are simply gentle doors you might open if and when you feel ready:"
    )
    story.append(Paragraph(intro_invitations, body_style))
    story.append(Spacer(1, 10))

    for inv in invitations:
        clean_inv = sanitize_therapist_text(inv.strip())
        story.append(Paragraph(f"• &nbsp; {clean_inv}", bullet_style))
    story.append(PageBreak())

    # ==================== FINAL PAGE: CLOSING & BRANDING ====================
    story.append(Spacer(1, 140))
    story.append(HRFlowable(width="30%", thickness=1, color=c_border, spaceAfter=30))
    closing_text = (
        "“Thank you for letting me walk beside you this month.”"
    )
    story.append(Paragraph(closing_text, closing_style))
    story.append(Spacer(1, 20))

    final_note = (
        f"You are always welcome in this Sanctuary, {user_name}.<br/>"
        "Take all the time you need."
    )
    story.append(Paragraph(final_note, ParagraphStyle(
        "FinalNote",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=18,
        textColor=c_secondary,
        alignment=1,
        spaceAfter=40
    )))

    story.append(Spacer(1, 40))
    story.append(Paragraph("A T H E N A &nbsp; S A N C T U A R Y", brand_style))
    story.append(Paragraph("A gentle space for mental wellness", ParagraphStyle(
        "BrandSub",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=9,
        leading=13,
        textColor=c_muted,
        alignment=1
    )))

    # Build document with custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# ---------------------------------------------------------------------------
# Database Persistence with Local JSON Fallback
# ---------------------------------------------------------------------------

def save_weekly_reflection_record(
    user_id: str,
    week_start: str,
    week_end: str,
    content: Dict[str, Any]
) -> Dict[str, Any]:
    record_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    record = {
        "id": record_id,
        "user_id": user_id,
        "week_start": week_start,
        "week_end": week_end,
        "content": json.dumps(content) if isinstance(content, dict) else str(content),
        "generated_at": now_iso
    }

    # Attempt Supabase insert
    try:
        res = supabase.table("weekly_reflections").insert(record).execute()
        if res.data and len(res.data) > 0:
            record = res.data[0]
    except Exception as e:
        print(f"[Supabase Weekly Reflection Insert Fallback] {e}")

    # Local fallback persistence
    local = _load_local_reflections()
    user_weekly = local["weekly"].get(user_id, [])
    # Remove older record for same week if re-generating
    user_weekly = [r for r in user_weekly if r.get("week_start") != week_start]
    user_weekly.insert(0, record)
    local["weekly"][user_id] = user_weekly
    _save_local_reflections(local)

    return record


def get_existing_weekly_reflection(user_id: str, week_start: str) -> Optional[Dict[str, Any]]:
    # 1. Supabase check
    try:
        res = (
            supabase.table("weekly_reflections")
            .select("*")
            .eq("user_id", user_id)
            .eq("week_start", week_start)
            .order("generated_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        print(f"[Supabase Weekly Reflection Check Fallback] {e}")

    # 2. Local cache check
    local = _load_local_reflections()
    for r in local["weekly"].get(user_id, []):
        if r.get("week_start") == week_start:
            return r
    return None


def save_monthly_reflection_record(
    user_id: str,
    month: str,
    content: Dict[str, Any],
    pdf_url: Optional[str] = None
) -> Dict[str, Any]:
    record_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    record = {
        "id": record_id,
        "user_id": user_id,
        "month": month,
        "content": json.dumps(content) if isinstance(content, dict) else str(content),
        "pdf_url": pdf_url or f"/api/reflection/monthly/pdf?month={month}",
        "generated_at": now_iso
    }

    # Attempt Supabase insert
    try:
        res = supabase.table("monthly_reflections").insert(record).execute()
        if res.data and len(res.data) > 0:
            record = res.data[0]
    except Exception as e:
        print(f"[Supabase Monthly Reflection Insert Fallback] {e}")

    # Local fallback persistence
    local = _load_local_reflections()
    user_monthly = local["monthly"].get(user_id, [])
    user_monthly = [r for r in user_monthly if r.get("month") != month]
    user_monthly.insert(0, record)
    local["monthly"][user_id] = user_monthly
    _save_local_reflections(local)

    return record


def get_existing_monthly_reflection(user_id: str, month: str) -> Optional[Dict[str, Any]]:
    # 1. Supabase check
    try:
        res = (
            supabase.table("monthly_reflections")
            .select("*")
            .eq("user_id", user_id)
            .eq("month", month)
            .order("generated_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        print(f"[Supabase Monthly Reflection Check Fallback] {e}")

    # 2. Local cache check
    local = _load_local_reflections()
    for r in local["monthly"].get(user_id, []):
        if r.get("month") == month:
            return r
    return None


# ---------------------------------------------------------------------------
# High-Level Reflection Orchestration
# ---------------------------------------------------------------------------

def _get_user_display_name(user_id: str) -> str:
    try:
        prof = get_profile(user_id)
        if prof and prof.get("display_name"):
            return prof["display_name"]
    except Exception:
        pass
    return "friend"


def get_or_generate_weekly_reflection(
    user_id: str,
    force: bool = False,
    target_dt: Optional[datetime] = None
) -> Dict[str, Any]:
    """Retrieves or creates the weekly reflection for the given period without duplicates."""
    week_start, week_end = get_current_week_bounds(target_dt)

    if not force:
        existing = get_existing_weekly_reflection(user_id, week_start)
        if existing:
            c = existing.get("content")
            if isinstance(c, str):
                try:
                    existing["content"] = json.loads(c)
                except Exception:
                    pass
            return existing

    # Gather weekly activity
    s_dt = datetime.strptime(week_start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    e_dt = datetime.strptime(week_end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    activity = collect_user_activity(user_id, s_dt, e_dt)

    user_name = _get_user_display_name(user_id)
    content = generate_deterministic_weekly_reflection(user_name, week_start, week_end, activity)

    saved = save_weekly_reflection_record(user_id, week_start, week_end, content)
    saved["content"] = content
    return saved


def get_or_generate_monthly_reflection(
    user_id: str,
    force: bool = False,
    month_str: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieves or creates the monthly keepsake reflection for the given month."""
    if not month_str:
        month_str = get_current_month_str()

    if not force:
        existing = get_existing_monthly_reflection(user_id, month_str)
        if existing:
            c = existing.get("content")
            if isinstance(c, str):
                try:
                    existing["content"] = json.loads(c)
                except Exception:
                    pass
            return existing

    # Collect month activity
    dt = datetime.strptime(month_str, "%Y-%m").replace(tzinfo=timezone.utc)
    s_dt = dt.replace(day=1)
    # End of month
    if dt.month == 12:
        next_month = dt.replace(year=dt.year + 1, month=1, day=1)
    else:
        next_month = dt.replace(month=dt.month + 1, day=1)
    e_dt = next_month - timedelta(seconds=1)

    activity = collect_user_activity(user_id, s_dt, e_dt)
    user_name = _get_user_display_name(user_id)
    content = generate_deterministic_monthly_reflection(user_name, month_str, activity)

    saved = save_monthly_reflection_record(user_id, month_str, content)
    saved["content"] = content
    return saved


def get_reflection_dashboard_data(user_id: str) -> Dict[str, Any]:
    """
    Supplies the Home Dashboard 4 cards:
    Card 1: This Week's Reflection (first paragraph, date, id)
    Card 2: This Month's Letter (month, preview sentence, id, is_available)
    Card 3: Recent Moments (last 3 meaningful activities)
    Card 4: Gentle Invitation (one personalized suggestion)
    """
    # 1. Weekly Reflection Status
    week_start, week_end = get_current_week_bounds()
    formatted_dates = format_week_range_display(week_start, week_end)
    weekly_rec = get_or_generate_weekly_reflection(user_id, force=False)

    w_content = weekly_rec.get("content", {})
    if isinstance(w_content, str):
        try:
            w_content = json.loads(w_content)
        except Exception:
            w_content = {}

    opening = w_content.get("opening_letter", "")
    first_p = opening.split("\n\n")[0] if opening else "As we look back at the arc of this week, here is a quiet space to observe the ground you have walked."

    # 2. Monthly Reflection Status
    month_str = get_current_month_str()
    month_display = format_month_display(month_str)

    # Check day of month to see if month's end or available
    today = datetime.now(timezone.utc)
    # Monthly letter can be generated or previewed anytime
    monthly_rec = get_or_generate_monthly_reflection(user_id, force=False, month_str=month_str)
    m_content = monthly_rec.get("content", {})
    if isinstance(m_content, str):
        try:
            m_content = json.loads(m_content)
        except Exception:
            m_content = {}

    preview_sentence = m_content.get(
        "preview_sentence",
        f"A quiet look back at {month_display}, honoring the pauses you took and the space you created."
    )

    # 3. Recent Moments (Last 3 meaningful activities)
    # Gather recent 14 days activity
    now = datetime.now(timezone.utc)
    two_weeks_ago = now - timedelta(days=14)
    recent_activity = collect_user_activity(user_id, two_weeks_ago, now)
    recent_moments = summarize_real_moments(recent_activity, max_items=3)

    # 4. Gentle Invitation (One personalized suggestion, never overwhelm)
    gentle_invitation = w_content.get(
        "one_invitation",
        "Perhaps one quiet pause before bed could become a familiar place."
    )

    return {
        "weekly": {
            "id": weekly_rec.get("id"),
            "first_paragraph": first_p,
            "week_start": week_start,
            "week_end": week_end,
            "formatted_dates": formatted_dates,
            "is_ready": True
        },
        "monthly": {
            "id": monthly_rec.get("id"),
            "month": month_display,
            "preview_sentence": preview_sentence,
            "is_available": True,
            "notice": None
        },
        "recent_moments": recent_moments,
        "gentle_invitation": gentle_invitation
    }
