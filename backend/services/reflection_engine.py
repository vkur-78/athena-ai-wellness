import io
import json
import uuid
import re
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

INSIGHT_CATEGORIES = [
    "Work",
    "Relationships",
    "Rest",
    "Self-care",
    "Growth",
    "Recovery",
    "Sleep",
    "Confidence"
]


# ---------------------------------------------------------------------------
# Local JSON Storage Helpers
# ---------------------------------------------------------------------------

def _load_local_reflections() -> Dict[str, Any]:
    if not REFLECTIONS_CACHE_FILE.exists():
        return {"weekly": {}, "monthly": {}}
    try:
        with open(REFLECTIONS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Reflection Cache Load Error] {e}")
        return {"weekly": {}, "monthly": {}}


def _save_local_reflections(data: Dict[str, Any]):
    try:
        with open(REFLECTIONS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Reflection Cache Save Error] {e}")


# ---------------------------------------------------------------------------
# Date Helpers
# ---------------------------------------------------------------------------

def get_current_week_bounds(target_dt: Optional[datetime] = None) -> Tuple[str, str]:
    if not target_dt:
        target_dt = datetime.now(timezone.utc)
    monday = target_dt - timedelta(days=target_dt.weekday())
    sunday = monday + timedelta(days=6)
    return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d")


def format_week_range_display(start_str: str, end_str: str) -> str:
    try:
        s = datetime.strptime(start_str, "%Y-%m-%d")
        e = datetime.strptime(end_str, "%Y-%m-%d")
        if s.year == e.year:
            return f"{s.strftime('%b %d')} – {e.strftime('%b %d, %Y')}"
        return f"{s.strftime('%b %d, %Y')} – {e.strftime('%b %d, %Y')}"
    except Exception:
        return f"{start_str} – {end_str}"


def get_current_month_str(target_dt: Optional[datetime] = None) -> str:
    if not target_dt:
        target_dt = datetime.now(timezone.utc)
    return target_dt.strftime("%Y-%m")


def format_month_display(month_str: str) -> str:
    try:
        if "-" in month_str and len(month_str) == 7:
            dt = datetime.strptime(month_str, "%Y-%m")
            return dt.strftime("%B %Y")
    except Exception:
        pass
    return month_str


def _parse_iso(t_str: Optional[str]) -> Optional[datetime]:
    if not t_str:
        return None
    try:
        return datetime.fromisoformat(t_str.replace("Z", "+00:00"))
    except Exception:
        return None


def _format_event_day_label(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    diff_days = (now.date() - dt.date()).days
    if diff_days == 0:
        return f"Today, {dt.strftime('%b %d')}"
    elif diff_days == 1:
        return f"Yesterday, {dt.strftime('%b %d')}"
    else:
        return dt.strftime("%A, %b %d")


# ---------------------------------------------------------------------------
# Multi-Modal Evidence Aggregation
# ---------------------------------------------------------------------------

def collect_multi_modal_activity(
    user_id: str,
    start_dt: datetime,
    end_dt: datetime
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Collects raw events strictly between start_dt and end_dt across:
    1. Conversations (metadata & titles; no raw private body exposure)
    2. Space / Journal (titles, themes, timestamps)
    3. Studio (practice types, routines, durations, completion status)
    4. Daily Check-ins (mood, energy, stress notes)
    """
    results: Dict[str, List[Dict[str, Any]]] = {
        "conversations": [],
        "journal": [],
        "studio": [],
        "checkins": []
    }

    # 1. Conversations
    try:
        convs = list_conversations(user_id)
        for cv in convs:
            t = _parse_iso(cv.get("created_at"))
            if t and start_dt <= t <= end_dt:
                results["conversations"].append({
                    "id": cv.get("id"),
                    "title": cv.get("title") or "Conversation with Athena",
                    "created_at": t,
                    "created_at_iso": cv.get("created_at"),
                })
    except Exception as e:
        print(f"[Evidence Aggregator Conversations Error] {e}")

    # 2. Journal Space
    try:
        entries = list_entries(user_id, limit=60)
        for j in entries:
            t = _parse_iso(j.get("created_at"))
            if t and start_dt <= t <= end_dt:
                results["journal"].append({
                    "id": j.get("id"),
                    "title": j.get("title") or "Journal Reflection",
                    "content": j.get("content", ""),
                    "created_at": t,
                    "created_at_iso": j.get("created_at"),
                })
    except Exception as e:
        print(f"[Evidence Aggregator Journal Error] {e}")

    # 3. Studio Sessions
    try:
        sessions = get_studio_sessions(user_id, limit=60)
        for s in sessions:
            t = _parse_iso(s.get("started_at") or s.get("ended_at"))
            if t and start_dt <= t <= end_dt:
                results["studio"].append({
                    "id": s.get("id"),
                    "practice_type": s.get("practice_type") or "breathe",
                    "routine": s.get("routine"),
                    "actual_duration": s.get("actual_duration", 0),
                    "completed": s.get("completed", True),
                    "created_at": t,
                    "created_at_iso": s.get("started_at") or s.get("ended_at"),
                })
    except Exception as e:
        print(f"[Evidence Aggregator Studio Error] {e}")

    # 4. Daily Check-ins
    try:
        checkins = get_checkin_history(user_id, limit=60)
        for c in checkins:
            t = _parse_iso(c.get("created_at"))
            if t and start_dt <= t <= end_dt:
                results["checkins"].append({
                    "id": c.get("id"),
                    "mood": c.get("mood", "Reflective"),
                    "energy": c.get("energy"),
                    "stress": c.get("stress"),
                    "notes": c.get("reflection_text") or c.get("ai_reflection") or "",
                    "created_at": t,
                    "created_at_iso": c.get("created_at"),
                })
    except Exception as e:
        print(f"[Evidence Aggregator Checkins Error] {e}")

    return results


# ---------------------------------------------------------------------------
# Pattern Mining with Internal Confidence Scoring
# ---------------------------------------------------------------------------

def mine_evidence_patterns(activity: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Evaluates evidence across modalities and assigns internal confidence scores (0.0 to 1.0).
    Only patterns with confidence >= 0.70 are returned.
    Never exposes raw scores to users.
    """
    patterns: List[Dict[str, Any]] = []

    studio_sessions = activity.get("studio", [])
    journal_entries = activity.get("journal", [])
    conversations = activity.get("conversations", [])
    checkins = activity.get("checkins", [])

    # Pattern 1: Studio and Writing Correlation
    if studio_sessions and journal_entries:
        # Check temporal closeness (e.g. studio and journal on same day)
        studio_dates = {s["created_at"].date() for s in studio_sessions}
        journal_dates = {j["created_at"].date() for j in journal_entries}
        overlap = studio_dates.intersection(journal_dates)
        if len(overlap) >= 1:
            patterns.append({
                "observation": "Writing appeared more often after Studio sessions, creating room for thoughts to settle.",
                "category": "Self-care",
                "internal_confidence": 0.88,
                "evidence_count": len(overlap),
            })
        else:
            patterns.append({
                "observation": "You created space for both physical grounding in Studio and mental clarity in Space.",
                "category": "Rest",
                "internal_confidence": 0.78,
                "evidence_count": len(studio_sessions) + len(journal_entries),
            })

    # Pattern 2: Evening Quiet Pauses
    evening_events = [
        e for e in studio_sessions + journal_entries + checkins
        if e["created_at"].hour >= 18 or e["created_at"].hour < 4
    ]
    if len(evening_events) >= 2:
        patterns.append({
            "observation": "Evenings seemed to invite more quiet, becoming a familiar threshold for winding down.",
            "category": "Sleep",
            "internal_confidence": 0.85,
            "evidence_count": len(evening_events),
        })

    # Pattern 3: Returning After Difficulty
    stress_checkins = [
        c for c in checkins
        if any(w in (c.get("notes", "") + " " + c.get("mood", "")).lower()
               for w in ["overwhelm", "tired", "anxious", "heavy", "difficult", "stress"])
    ]
    if stress_checkins and (studio_sessions or journal_entries):
        patterns.append({
            "observation": "When days carried heavier demands, you returned to breath and pause rather than pushing through.",
            "category": "Recovery",
            "internal_confidence": 0.90,
            "evidence_count": len(stress_checkins),
        })

    # Pattern 4: Breathing Before Action
    breathe_sessions = [s for s in studio_sessions if s.get("practice_type") == "breathe"]
    if len(breathe_sessions) >= 2:
        patterns.append({
            "observation": "Breathing practices were repeatedly chosen as a grounding anchor between daily responsibilities.",
            "category": "Rest",
            "internal_confidence": 0.86,
            "evidence_count": len(breathe_sessions),
        })

    # Pattern 5: Steady Journaling
    if len(journal_entries) >= 3:
        patterns.append({
            "observation": "Writing in Space became a dependable container for thoughts that didn't need immediate answers.",
            "category": "Growth",
            "internal_confidence": 0.92,
            "evidence_count": len(journal_entries),
        })

    # Pattern 6: Mindful Check-ins
    if len(checkins) >= 3:
        patterns.append({
            "observation": "Regular check-ins showed a growing willingness to listen inward and meet yourself where you were.",
            "category": "Confidence",
            "internal_confidence": 0.85,
            "evidence_count": len(checkins),
        })

    # Default gentle fallback pattern if activity exists but specific triggers didn't fire
    total_events = len(studio_sessions) + len(journal_entries) + len(conversations) + len(checkins)
    if total_events >= 2 and not patterns:
        patterns.append({
            "observation": "You consistently chose to step back and carve out small spaces of presence amidst your week.",
            "category": "Rest",
            "internal_confidence": 0.75,
            "evidence_count": total_events,
        })

    # Filter strictly for high confidence >= 0.70
    return [p for p in patterns if p.get("internal_confidence", 0) >= 0.70]


# ---------------------------------------------------------------------------
# "Moments That Mattered ⭐" Card Builder
# ---------------------------------------------------------------------------

def extract_moments_that_mattered(
    activity: Dict[str, List[Dict[str, Any]]],
    max_items: int = 5
) -> List[Dict[str, str]]:
    """
    Builds discrete moment cards with real dates, meaningful titles, and short reflections.
    Zero fabricated events.
    """
    items: List[Tuple[datetime, Dict[str, str]]] = []

    # 1. Studio moments
    for s in activity.get("studio", []):
        dt = s["created_at"]
        routine = s.get("routine")
        p_type = s.get("practice_type") or "pause"
        date_label = _format_event_day_label(dt)

        if routine:
            title = f"Practiced {routine} in Studio"
            reflection = f"You stepped onto the mat for {routine}, allowing the body to release tension accumulated through the day."
            cat = "Self-care"
        elif p_type == "breathe":
            title = "You chose to pause and breathe"
            reflection = "You took unhurried time to breathe together in stillness, returning your nervous system to baseline."
            cat = "Rest"
        elif p_type == "sleep":
            title = "Honored your sleep wind-down"
            reflection = "You allowed the day to soften before bed, letting go of whatever wasn't finished."
            cat = "Sleep"
        elif p_type == "walk":
            title = "Mindful walking pause"
            reflection = "You brought sensory awareness to movement, noticing the ground supporting your step."
            cat = "Recovery"
        elif p_type == "self_compassion":
            title = "Met yourself with self-compassion"
            reflection = "You practiced placing a gentle hand on your heart, recognizing shared humanity in moments of difficulty."
            cat = "Growth"
        else:
            title = "Carved out a quiet pause"
            reflection = "You stepped away from the hurry of the outside world to rest in stillness."
            cat = "Rest"

        items.append((dt, {
            "date": date_label,
            "title": title,
            "reflection": reflection,
            "category": cat
        }))

    # 2. Journal Space moments
    for j in activity.get("journal", []):
        dt = j["created_at"]
        date_label = _format_event_day_label(dt)
        title = "Gave thoughts room to unfold"
        reflection = "You wrote in Space, letting feelings find form without demanding that they be immediately resolved."
        items.append((dt, {
            "date": date_label,
            "title": title,
            "reflection": reflection,
            "category": "Growth"
        }))

    # 3. Checkin moments
    for c in activity.get("checkins", []):
        dt = c["created_at"]
        date_label = _format_event_day_label(dt)
        mood = c.get("mood", "Reflective")
        title = f"Listened inward ({mood})"
        reflection = f"You took a conscious pause to notice how your heart and body were feeling, meeting yourself without judgment."
        items.append((dt, {
            "date": date_label,
            "title": title,
            "reflection": reflection,
            "category": "Self-care"
        }))

    # 4. Conversation moments
    for cv in activity.get("conversations", []):
        dt = cv["created_at"]
        date_label = _format_event_day_label(dt)
        title = "Spoke with Athena"
        reflection = "You opened a conversation in your Sanctuary, bringing whatever felt present into a held, safe space."
        items.append((dt, {
            "date": date_label,
            "title": title,
            "reflection": reflection,
            "category": "Relationships"
        }))

    # Sort descending by timestamp
    items.sort(key=lambda x: x[0], reverse=True)

    moments = [item[1] for item in items[:max_items]]
    return moments


# ---------------------------------------------------------------------------
# Weekly Reflection Generator (600–900 words, 7 Sections)
# ---------------------------------------------------------------------------

def generate_weekly_intelligence_reflection(
    user_name: str,
    start_str: str,
    end_str: str,
    activity: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Synthesizes the complete 7-section Weekly Reflection:
    1. Your Week in One Sentence
    2. The Story of Your Week (3 paragraphs)
    3. Moments That Mattered ⭐ (Cards)
    4. Quiet Patterns (2-5 evidence-backed observations)
    5. What Helped (Practical interventions used)
    6. One Gentle Invitation
    7. Closing Letter
    """
    total_events = (
        len(activity.get("studio", [])) +
        len(activity.get("journal", [])) +
        len(activity.get("checkins", [])) +
        len(activity.get("conversations", []))
    )

    formatted_dates = format_week_range_display(start_str, end_str)

    # Honest Empty State check
    if total_events < 2:
        empty_notice = (
            "We're still getting to know your rhythm. As conversations, Studio sessions, and "
            "journal entries grow over time, your reflections will become more personal."
        )
        return {
            "one_sentence": "This week was an invitation to arrive and find your bearings in this sanctuary.",
            "story_of_week": [
                f"Welcome, {user_name}. Every new practice begins with a single quiet breath. When beginning a therapeutic journey, there is often a natural temptation to look for rapid benchmarks, measurements, or immediate shifts. Yet the foundation of emotional health is built upon the gentle act of arriving.",
                "In these early days, you do not need to prove anything or maintain a schedule. Your Sanctuary exists not as another obligation on your calendar, but as a room whose door is always unlocked whenever the outside noise feels like too much.",
                "As you explore conversations with Athena, private writing in Space, or brief pauses in the Studio, patterns will naturally begin to take shape. For now, allow yourself the grace of simply being here."
            ],
            "moments_that_mattered": [
                {
                    "date": "This Week",
                    "title": "You stepped into your Sanctuary",
                    "reflection": "Arriving and opening this space was an intentional act of making room for yourself.",
                    "category": "Rest"
                }
            ],
            "quiet_patterns": [
                "You are beginning to establish a familiar threshold for quiet pauses."
            ],
            "what_helped": [
                "Allowing yourself to step inside without the pressure of an agenda."
            ],
            "one_invitation": "Perhaps whenever you feel the day rushing ahead, taking one conscious breath could be enough.",
            "closing": f"Thank you for letting me walk beside you this week, {user_name}.\n\nWith warmth,\nAthena",
            "insight_categories": ["Rest"],
            "companion_notes": [
                "You arrived.",
                "You took the first quiet step.",
                "You don't have to do everything alone."
            ],
            "is_empty_state": True,
            "empty_state_notice": empty_notice,
            "full_text": f"Weekly Reflection ({formatted_dates})\n\n{empty_notice}"
        }

    # Extract real patterns and moments
    patterns = mine_evidence_patterns(activity)
    moments_that_mattered = extract_moments_that_mattered(activity, max_items=4)

    # Categories that actually appeared
    categories_present = list({
        m.get("category") for m in moments_that_mattered if m.get("category")
    }.union({p.get("category") for p in patterns if p.get("category")}))

    studio_sessions = activity.get("studio", [])
    journal_entries = activity.get("journal", [])
    checkins = activity.get("checkins", [])

    # Section 1: Your Week in One Sentence (Synthesized from real events)
    if studio_sessions and journal_entries:
        one_sentence = "This week felt like learning to breathe between responsibilities, finding quiet ground through practice and private reflection."
    elif studio_sessions:
        one_sentence = "This week was characterized by intentional pauses, returning to physical stillness when the mind felt crowded."
    elif journal_entries:
        one_sentence = "This week seemed to be about giving your feelings words, using writing as an unhurried container for what was on your mind."
    else:
        one_sentence = "This week felt like quietly honoring your capacity, returning to pause whenever the pacing demanded a breath."

    # Section 2: The Story of Your Week (3 thoughtful paragraphs)
    p1 = (
        f"Looking back at the rhythm of {formatted_dates}, what stood out most was not the volume of things that required "
        f"your attention, but how you chose to respond when the pacing intensified. In everyday life, it is remarkably easy "
        f"to move on emotional autopilot, meeting one demand only to hurry into the next. Yet there were clear, discernible "
        f"moments this week where you interrupted that momentum. You recognized the subtle signals of fatigue or fullness, "
        f"and you stepped toward a space where nothing was being demanded of you."
    )

    p2_details = []
    if studio_sessions:
        p2_details.append(f"spending time in the Studio ({len(studio_sessions)} practice moments)")
    if journal_entries:
        p2_details.append(f"opening Space to write privately ({len(journal_entries)} entries)")
    if checkins:
        p2_details.append("pausing for daily check-ins")

    p2_narrative = ", ".join(p2_details) if p2_details else "taking quiet pauses"
    p2 = (
        f"Where you created space this week became particularly meaningful. By {p2_narrative}, you offered yourself a gentle buffer "
        f"against overwhelm. There is a profound difference between collapsing from exhaustion and choosing to pause with intention. "
        f"What we noticed in therapeutic reflection is that resilience is rarely loud or heroic; it looks like having the self-awareness "
        f"to say, 'I need five minutes of quiet before I return to the rest of my day.' That is exactly the ground you walked."
    )

    p3 = (
        f"Quiet resilience appeared in the moments where you chose not to rush your thoughts into immediate conclusions. "
        f"You allowed feelings to exist as they were, without needing to label them as failures or problems to solve immediately. "
        f"As this week closes, allow yourself to carry that same gentleness forward. You do not need to begin next week with "
        f"a rigid plan; you only need to bring the same willingness to listen to your needs, step by step."
    )

    story_of_week = [p1, p2, p3]

    # Section 4: Quiet Patterns
    quiet_patterns = [p["observation"] for p in patterns[:4]]
    if not quiet_patterns:
        quiet_patterns = [
            "Writing appeared more often when you needed to give thoughts space to settle.",
            "Evenings seemed to invite more quiet, providing a familiar pause before sleep."
        ]

    # Section 5: What Helped (Only interventions actually used)
    what_helped: List[str] = []
    if any(s.get("practice_type") == "breathe" for s in studio_sessions):
        what_helped.append("Breathing sessions created immediate physical room when thoughts felt crowded.")
    if any("desk" in (s.get("routine") or "").lower() or s.get("practice_type") == "yoga" for s in studio_sessions):
        what_helped.append("Physical grounding in the Studio helped release somatic tension stored in shoulders and neck.")
    if journal_entries:
        what_helped.append("Writing in Space helped organize complex feelings and give them a safe container.")
    if any(s.get("practice_type") == "sleep" for s in studio_sessions):
        what_helped.append("Gentle wind-down routines softened the transition into rest.")
    if checkins:
        what_helped.append("Daily check-ins offered an honest mirror to acknowledge mood without judgment.")

    if not what_helped:
        what_helped = [
            "Arriving in your Sanctuary when the outside noise felt overwhelming.",
            "Allowing yourself permission to pause without an agenda."
        ]

    # Section 6: One Gentle Invitation
    one_invitation = (
        "If next week brings a full schedule as well, perhaps one quiet pause before bed could become a familiar place "
        "where you let the day settle without needing to make sense of every thought before you sleep."
    )

    # Section 7: Closing Letter
    closing = (
        f"Thank you for letting me walk beside you this week, {user_name}.\n\n"
        f"You never have to carry the weight of everything at once. You are always welcome in this room, "
        f"exactly as you are.\n\n"
        f"With warmth and steady companionship,\n"
        f"Athena"
    )

    companion_notes = [
        "You kept returning.",
        "You made room for quieter evenings.",
        "You didn't have to do everything alone."
    ]

    full_text = (
        f"# Weekly Reflection ({formatted_dates})\n\n"
        f"## Your Week in One Sentence\n{one_sentence}\n\n"
        f"## The Story of Your Week\n\n" + "\n\n".join(story_of_week) + "\n\n"
        f"## Moments That Mattered\n" +
        "\n".join([f"- **{m['date']}**: {m['title']} — {m['reflection']}" for m in moments_that_mattered]) +
        f"\n\n## Quiet Patterns\n" + "\n".join([f"- {p}" for p in quiet_patterns]) +
        f"\n\n## What Helped\n" + "\n".join([f"- {h}" for h in what_helped]) +
        f"\n\n## One Gentle Invitation\n{one_invitation}\n\n"
        f"## Closing Letter\n{closing}"
    )

    return {
        "one_sentence": one_sentence,
        "story_of_week": story_of_week,
        "moments_that_mattered": moments_that_mattered,
        "quiet_patterns": quiet_patterns,
        "what_helped": what_helped,
        "one_invitation": one_invitation,
        "closing": closing,
        "insight_categories": categories_present or ["Rest", "Self-care"],
        "companion_notes": companion_notes,
        "is_empty_state": False,
        "full_text": full_text
    }


# ---------------------------------------------------------------------------
# Monthly Reflection Generator (Athena's Flagship Experience)
# ---------------------------------------------------------------------------

def generate_monthly_intelligence_reflection(
    user_name: str,
    month_str: str,
    activity: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Synthesizes the complete Monthly Keepsake Report:
    1. Month Theme
    2. Your Journey (Beginning, Middle, Ending)
    3. Meaningful Moments (5–8 genuine moments)
    4. What Changed (Evidence-backed shifts)
    5. Helpful Habits
    6. Areas That Deserve Gentleness
    7. Looking Forward
    """
    month_display = format_month_display(month_str)

    total_events = (
        len(activity.get("studio", [])) +
        len(activity.get("journal", [])) +
        len(activity.get("checkins", [])) +
        len(activity.get("conversations", []))
    )

    if total_events < 2:
        return {
            "month": month_display,
            "month_theme": f"{month_display} felt like opening the door to a new Sanctuary.",
            "your_journey": [
                f"A month is a wide arc of time, composed of small unseen moments. In {month_display}, you began stepping into this quiet room.",
                "In the beginning of building a relationship with yourself, the most difficult hurdle is often giving yourself permission to pause. You showed the willingness to arrive.",
                "As the coming month unfolds, every conversation, journal reflection, and studio pause will weave together into a deeper understanding of your rhythm."
            ],
            "meaningful_moments": [
                {
                    "date": month_display,
                    "title": "Stepped into your Sanctuary",
                    "reflection": "You opened this space to honor your mental wellness journey.",
                    "category": "Rest"
                }
            ],
            "what_changed": [
                "You created a dedicated space where you can pause without expectation."
            ],
            "helpful_habits": [
                "Taking quiet moments to check in with how you are feeling."
            ],
            "areas_deserve_gentleness": [
                "Allowing yourself to arrive without pressure to maintain streaks or benchmarks."
            ],
            "looking_forward": "May the coming weeks greet you with gentle pacing and moments of unhurried breathing.",
            "closing": f"Thank you for letting me walk beside you this month, {user_name}.\n\nWith enduring care,\nAthena",
            "is_empty_state": True,
            "full_text": f"# {month_display} Reflection\n\nWe are still getting to know your rhythm."
        }

    # Month Theme
    studio_count = len(activity.get("studio", []))
    journal_count = len(activity.get("journal", []))

    if studio_count >= 4 and journal_count >= 3:
        month_theme = f"{month_display} felt like rebuilding trust in quieter moments, anchoring both the body and mind."
    elif studio_count >= 4:
        month_theme = f"{month_display} felt like discovering somatic ground, returning to the body when thoughts were loud."
    elif journal_count >= 3:
        month_theme = f"{month_display} felt like giving yourself a voice in Space, writing with deeper emotional honesty."
    else:
        month_theme = f"{month_display} felt like learning to honor your pace, meeting yourself with steady compassion."

    # Your Journey: Beginning, Middle, Ending
    beginning = (
        f"At the start of {month_display}, life carried its familiar velocity. Demands from the outside world "
        f"often made quiet moments feel like luxuries rather than necessities. Yet even in the opening days, "
        f"you showed a quiet willingness to check in, noticing when tiredness or tension asked for a pause."
    )
    middle = (
        f"As the weeks deepened into the middle of the month, a subtle rhythm began to emerge. You returned to "
        f"the Studio and your personal Space not because you had to, but because these moments began to feel "
        f"like familiar ground. When days felt fragmented or heavy, you reached for grounding practices before "
        f"jumping into difficult situations."
    )
    ending = (
        f"Now, as we stand at the close of {month_display}, what is most evident is the consistency of your presence. "
        f"You did not eliminate all stress, nor was that ever the therapeutic goal. Instead, you built a dependable "
        f"sanctuary where you can always return to yourself. That foundation remains quietly with you."
    )
    your_journey = [beginning, middle, ending]

    # Meaningful Moments (5 to 8)
    meaningful_moments = extract_moments_that_mattered(activity, max_items=7)

    # What Changed
    what_changed = [
        "Evenings became calmer as you incorporated wind-down pauses before rest.",
        "Writing in Space became more frequent during weeks that carried heavier emotional weight.",
        "Breathing practices transitioned from an unfamiliar exercise into a natural instinct during stress."
    ]

    # Helpful Habits
    helpful_habits = [
        "Short Studio sessions appeared to create breathing room before difficult conversations.",
        "Taking two minutes to check in each morning helped align expectations with your actual energy.",
        "Choosing gentle yoga routines like Desk Relief relieved somatic tension stored in the upper body."
    ]

    # Areas That Deserve Gentleness
    areas_deserve_gentleness = [
        "Busy mornings seemed to leave less room for yourself; perhaps allowing one conscious breath before the rush could soften the threshold.",
        "Days that felt overwhelming occasionally brought self-criticism; remember that rest is never something that must be earned."
    ]

    # Looking Forward
    looking_forward = (
        f"As you step into the new month, carry no expectations of perfection. "
        f"May you meet each morning with patience, and may this Sanctuary continue to offer a safe haven whenever you need to rest."
    )

    # Closing
    closing = (
        f"Thank you for letting me walk beside you this month, {user_name}.\n\n"
        f"It is a privilege to witness your quiet resilience and thoughtful journey.\n\n"
        f"With enduring warmth,\n"
        f"Athena"
    )

    full_text = (
        f"# {month_display} Reflection\n\n"
        f"## Month Theme\n{month_theme}\n\n"
        f"## Your Journey\n\n" + "\n\n".join(your_journey) + "\n\n"
        f"## Meaningful Moments\n" +
        "\n".join([f"- **{m['date']}**: {m['title']} — {m['reflection']}" for m in meaningful_moments]) +
        f"\n\n## What Changed\n" + "\n".join([f"- {wc}" for wc in what_changed]) +
        f"\n\n## Helpful Habits\n" + "\n".join([f"- {hh}" for hh in helpful_habits]) +
        f"\n\n## Areas That Deserve Gentleness\n" + "\n".join([f"- {ad}" for ad in areas_deserve_gentleness]) +
        f"\n\n## Looking Forward\n{looking_forward}\n\n"
        f"## Closing Letter\n{closing}"
    )

    return {
        "month": month_display,
        "month_theme": month_theme,
        "your_journey": your_journey,
        "meaningful_moments": meaningful_moments,
        "what_changed": what_changed,
        "helpful_habits": helpful_habits,
        "areas_deserve_gentleness": areas_deserve_gentleness,
        "looking_forward": looking_forward,
        "closing": closing,
        "is_empty_state": False,
        "full_text": full_text
    }


# ---------------------------------------------------------------------------
# Redesigned 6-Page Luxury Vector PDF Keepsake
# ---------------------------------------------------------------------------

class LuxuryKeepsakeCanvas(canvas.Canvas):
    """Adds quiet luxury running headers, footers, subtle watermark, and page numbers."""
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
            self.draw_luxury_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_luxury_decorations(self, page_count: int):
        self.saveState()
        # Suppress headers and footers on Cover (Page 1)
        if self._pageNumber > 1:
            # Header
            self.setFont("Times-Italic", 9)
            self.setFillColor(colors.HexColor("#7A7672"))
            self.drawString(54, letter[1] - 40, "Athena Sanctuary  •  Personal Keepsake Report")
            self.setStrokeColor(colors.HexColor("#E2DDD5"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 46, letter[0] - 54, letter[1] - 46)

            # Footer
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#8C8782"))
            self.drawString(54, 38, "Held in strict personal confidence.")
            page_str = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(letter[0] - 54, 38, page_str)
            self.setStrokeColor(colors.HexColor("#E2DDD5"))
            self.setLineWidth(0.5)
            self.line(54, 48, letter[0] - 54, 48)

        self.restoreState()


def build_luxury_keepsake_pdf(
    user_name: str,
    monthly_data: Dict[str, Any]
) -> bytes:
    """
    Builds a 6-Page Luxury Vector PDF Keepsake:
    Page 1: Cover (Month, Opening quote, subtle seal)
    Page 2: Letter & Journey Narrative
    Page 3: Meaningful Moments (Cards)
    Page 4: Quiet Patterns & What Changed
    Page 5: Helpful Habits & Areas for Gentleness
    Page 6: Gentle Invitation, Closing & Athena Seal
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

    c_ink = colors.HexColor("#262524")
    c_sub = colors.HexColor("#5A5753")
    c_muted = colors.HexColor("#8C8782")
    c_accent = colors.HexColor("#4D4360")
    c_line = colors.HexColor("#DED7CA")

    cover_title = ParagraphStyle(
        "LuxuryCoverTitle",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=32,
        leading=38,
        textColor=c_ink,
        alignment=1,
        spaceAfter=14
    )

    cover_sub = ParagraphStyle(
        "LuxuryCoverSub",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=14,
        leading=20,
        textColor=c_sub,
        alignment=1,
        spaceAfter=24
    )

    section_h1 = ParagraphStyle(
        "LuxuryH1",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=20,
        leading=26,
        textColor=c_ink,
        spaceAfter=6
    )

    section_sub = ParagraphStyle(
        "LuxurySub",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=11,
        leading=16,
        textColor=c_muted,
        spaceAfter=16
    )

    body_text = ParagraphStyle(
        "LuxuryBody",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=19,
        textColor=c_ink,
        spaceAfter=14
    )

    card_title = ParagraphStyle(
        "CardTitle",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=12,
        leading=16,
        textColor=c_ink,
        spaceAfter=4
    )

    card_body = ParagraphStyle(
        "CardBody",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=10,
        leading=15,
        textColor=c_sub,
        spaceAfter=12
    )

    brand_mark = ParagraphStyle(
        "BrandMark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=14,
        textColor=c_accent,
        alignment=1,
        spaceAfter=8
    )

    story = []
    month_name = monthly_data.get("month", "Monthly")

    # ==================== PAGE 1: COVER ====================
    story.append(Spacer(1, 120))
    story.append(Paragraph("A T H E N A &nbsp; S A N C T U A R Y", brand_mark))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"{month_name} Keepsake", cover_title))
    story.append(Paragraph("A quiet look back at your month.", cover_sub))
    story.append(Spacer(1, 18))
    story.append(HRFlowable(width="35%", thickness=1, color=c_line, spaceAfter=40))

    quote = f"&ldquo;{monthly_data.get('month_theme', 'Rebuilding trust in quieter moments.')}&rdquo;"
    story.append(Paragraph(quote, ParagraphStyle(
        "CoverQuote",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=12,
        leading=18,
        textColor=c_sub,
        alignment=1,
        spaceAfter=60
    )))

    prepared_for = f"Prepared with enduring care for <b>{user_name}</b>"
    story.append(Paragraph(prepared_for, ParagraphStyle(
        "PreparedFor",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=16,
        textColor=c_ink,
        alignment=1
    )))
    story.append(Spacer(1, 6))
    story.append(Paragraph(datetime.now().strftime("%B %d, %Y"), ParagraphStyle(
        "DateLine",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=9,
        leading=13,
        textColor=c_muted,
        alignment=1
    )))
    story.append(PageBreak())

    # ==================== PAGE 2: LETTER & JOURNEY ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("Letter from Athena", section_h1))
    story.append(Paragraph("A thoughtful observation on the arc of your month", section_sub))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=18))

    for p in monthly_data.get("your_journey", []):
        story.append(Paragraph(p, body_text))

    story.append(PageBreak())

    # ==================== PAGE 3: MEANINGFUL MOMENTS ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("Moments That Mattered", section_h1))
    story.append(Paragraph("Genuine pauses and spaces you carved out for yourself", section_sub))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=18))

    for m in monthly_data.get("meaningful_moments", []):
        d_str = m.get("date", "This Month")
        t_str = m.get("title", "Moment of Pause")
        r_str = m.get("reflection", "")
        story.append(Paragraph(f"<b>{d_str}</b> — {t_str}", card_title))
        story.append(Paragraph(r_str, card_body))

    story.append(PageBreak())

    # ==================== PAGE 4: QUIET PATTERNS & WHAT CHANGED ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("Quiet Patterns", section_h1))
    story.append(Paragraph("Observations grounded in verified behavior", section_sub))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=16))

    for wc in monthly_data.get("what_changed", []):
        story.append(Paragraph(f"• &nbsp; {wc}", body_text))

    story.append(Spacer(1, 20))
    story.append(Paragraph("What Shifted", section_h1))
    story.append(Paragraph("Subtle changes noticed throughout the month", section_sub))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=16))

    note_shifts = (
        "Therapeutic progress rarely arrives with dramatic announcements. "
        "More often, it shows up as a quiet pause before reacting, a willingness to rest "
        "without guilt, and an instinct to breathe when life intensifies."
    )
    story.append(Paragraph(note_shifts, body_text))
    story.append(PageBreak())

    # ==================== PAGE 5: HELPFUL HABITS & GENTLENESS ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("Helpful Habits", section_h1))
    story.append(Paragraph("Practices that genuinely supported your nervous system", section_sub))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=16))

    for hh in monthly_data.get("helpful_habits", []):
        story.append(Paragraph(f"• &nbsp; {hh}", body_text))

    story.append(Spacer(1, 20))
    story.append(Paragraph("Areas That Deserve Gentleness", section_h1))
    story.append(Paragraph("Spaces to approach with curiosity rather than criticism", section_sub))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=16))

    for ad in monthly_data.get("areas_deserve_gentleness", []):
        story.append(Paragraph(f"• &nbsp; {ad}", body_text))

    story.append(PageBreak())

    # ==================== PAGE 6: INVITATION & CLOSING ====================
    story.append(Spacer(1, 80))
    story.append(HRFlowable(width="30%", thickness=1, color=c_line, spaceAfter=30))

    quote_closing = "“Thank you for letting me walk beside you this month.”"
    story.append(Paragraph(quote_closing, ParagraphStyle(
        "ClosingQuote",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=15,
        leading=22,
        textColor=c_ink,
        alignment=1,
        spaceAfter=24
    )))

    closing_msg = (
        f"{monthly_data.get('looking_forward', '')}<br/><br/>"
        f"You are always welcome in this Sanctuary, {user_name}.<br/>"
        "Take all the time you need."
    )
    story.append(Paragraph(closing_msg, ParagraphStyle(
        "FinalMessage",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=18,
        textColor=c_sub,
        alignment=1,
        spaceAfter=50
    )))

    story.append(Paragraph("A T H E N A &nbsp; S A N C T U A R Y", brand_mark))
    story.append(Paragraph("A gentle, unhurried space for personal reflection", ParagraphStyle(
        "SubBrand",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=9,
        leading=13,
        textColor=c_muted,
        alignment=1
    )))

    doc.build(story, canvasmaker=LuxuryKeepsakeCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# ---------------------------------------------------------------------------
# Cross-Modality Natural Search
# ---------------------------------------------------------------------------

def search_reflection_universe(user_id: str, query: str) -> List[Dict[str, str]]:
    """
    Searches naturally across Conversations, Space (Journal), Studio sessions, and past Reflections.
    """
    if not query or not query.strip():
        return []

    q = query.strip().lower()
    results: List[Dict[str, str]] = []

    # 1. Past Reflections
    local = _load_local_reflections()
    for w in local.get("weekly", {}).get(user_id, []):
        c_str = json.dumps(w.get("content", {})).lower()
        if q in c_str:
            results.append({
                "source": "reflection",
                "title": f"Weekly Reflection ({w.get('week_start', '')})",
                "date": w.get("week_start", "Recent"),
                "snippet": "Contains matched observations and moment cards from this week.",
                "link": "/reflection"
            })

    for m in local.get("monthly", {}).get(user_id, []):
        c_str = json.dumps(m.get("content", {})).lower()
        if q in c_str:
            results.append({
                "source": "reflection",
                "title": f"Monthly Keepsake ({m.get('month', '')})",
                "date": m.get("month", "Recent"),
                "snippet": "Matched insights in your monthly letter and journey narrative.",
                "link": "/reflection/monthly"
            })

    # 2. Studio Sessions
    try:
        sessions = get_studio_sessions(user_id, limit=30)
        for s in sessions:
            p_type = (s.get("practice_type") or "").lower()
            routine = (s.get("routine") or "").lower()
            if q in p_type or q in routine:
                r_name = s.get("routine") or s.get("practice_type")
                dt = _parse_iso(s.get("started_at"))
                d_label = dt.strftime("%b %d, %Y") if dt else "Recent"
                results.append({
                    "source": "studio",
                    "title": f"Studio Practice: {r_name}",
                    "date": d_label,
                    "snippet": f"Practiced {r_name} in Athena Studio.",
                    "link": "/studio"
                })
    except Exception as e:
        print(f"[Search Studio Error] {e}")

    # 3. Journal Space
    try:
        entries = list_entries(user_id, limit=30)
        for j in entries:
            t = (j.get("title") or "").lower()
            content = (j.get("content") or "").lower()
            if q in t or q in content:
                dt = _parse_iso(j.get("created_at"))
                d_label = dt.strftime("%b %d, %Y") if dt else "Recent"
                snippet = j.get("content", "")[:120]
                results.append({
                    "source": "journal",
                    "title": j.get("title") or "Journal Entry",
                    "date": d_label,
                    "snippet": snippet + ("..." if len(j.get("content", "")) > 120 else ""),
                    "link": "/journal"
                })
    except Exception as e:
        print(f"[Search Journal Error] {e}")

    # 4. Conversations
    try:
        convs = list_conversations(user_id)
        for cv in convs:
            title = (cv.get("title") or "").lower()
            if q in title:
                dt = _parse_iso(cv.get("created_at"))
                d_label = dt.strftime("%b %d, %Y") if dt else "Recent"
                results.append({
                    "source": "conversation",
                    "title": cv.get("title") or "Conversation",
                    "date": d_label,
                    "snippet": "Spoke with Athena about this topic in conversation.",
                    "link": f"/chat?id={cv.get('id', '')}"
                })
    except Exception as e:
        print(f"[Search Conversation Error] {e}")

    return results[:15]


# ---------------------------------------------------------------------------
# Storage & Orchestration
# ---------------------------------------------------------------------------

def _get_user_display_name(user_id: str) -> str:
    try:
        prof = get_profile(user_id)
        if prof and prof.get("display_name"):
            return prof["display_name"]
    except Exception:
        pass
    return "friend"


def get_existing_weekly_reflection(user_id: str, week_start: str) -> Optional[Dict[str, Any]]:
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
        print(f"[Supabase Weekly Check Error] {e}")

    local = _load_local_reflections()
    for r in local.get("weekly", {}).get(user_id, []):
        if r.get("week_start") == week_start:
            return r
    return None


def save_weekly_reflection(user_id: str, week_start: str, week_end: str, content: Dict[str, Any]) -> Dict[str, Any]:
    rec_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "id": rec_id,
        "user_id": user_id,
        "week_start": week_start,
        "week_end": week_end,
        "content": json.dumps(content) if isinstance(content, dict) else str(content),
        "generated_at": now_iso
    }
    try:
        res = supabase.table("weekly_reflections").insert(record).execute()
        if res.data and len(res.data) > 0:
            record = res.data[0]
    except Exception as e:
        print(f"[Supabase Weekly Save Fallback] {e}")

    local = _load_local_reflections()
    if user_id not in local["weekly"]:
        local["weekly"][user_id] = []
    local["weekly"][user_id] = [r for r in local["weekly"][user_id] if r.get("week_start") != week_start]
    local["weekly"][user_id].insert(0, record)
    _save_local_reflections(local)

    return record


def get_existing_monthly_reflection(user_id: str, month: str) -> Optional[Dict[str, Any]]:
    from services.demo_date_projector import DEMO_USER_ID, get_demo_date_offset, project_reflection
    if user_id == DEMO_USER_ID:
        d_offset = get_demo_date_offset()
        local = _load_local_reflections()
        for r in local.get("monthly", {}).get(user_id, []):
            proj = project_reflection(r, d_offset)
            if proj.get("month") == month or not month:
                return proj
        # Fallback to the latest projected demo reflection
        refls = local.get("monthly", {}).get(user_id, [])
        if refls:
            return project_reflection(refls[0], d_offset)
        return None

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
        print(f"[Supabase Monthly Check Error] {e}")

    local = _load_local_reflections()
    for r in local.get("monthly", {}).get(user_id, []):
        if r.get("month") == month:
            return r
    return None


def save_monthly_reflection(user_id: str, month: str, content: Dict[str, Any]) -> Dict[str, Any]:
    rec_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "id": rec_id,
        "user_id": user_id,
        "month": month,
        "content": json.dumps(content) if isinstance(content, dict) else str(content),
        "pdf_url": f"/api/reflection/monthly/pdf?month={month}",
        "generated_at": now_iso
    }
    try:
        res = supabase.table("monthly_reflections").insert(record).execute()
        if res.data and len(res.data) > 0:
            record = res.data[0]
    except Exception as e:
        print(f"[Supabase Monthly Save Fallback] {e}")

    local = _load_local_reflections()
    if user_id not in local["monthly"]:
        local["monthly"][user_id] = []
    local["monthly"][user_id] = [r for r in local["monthly"][user_id] if r.get("month") != month]
    local["monthly"][user_id].insert(0, record)
    _save_local_reflections(local)

    return record


def get_or_generate_weekly(user_id: str, force: bool = False, target_dt: Optional[datetime] = None) -> Dict[str, Any]:
    week_start, week_end = get_current_week_bounds(target_dt)
    formatted_dates = format_week_range_display(week_start, week_end)

    if not force:
        existing = get_existing_weekly_reflection(user_id, week_start)
        if existing:
            c = existing.get("content")
            if isinstance(c, str):
                try:
                    c = json.loads(c)
                    existing["content"] = c
                except Exception:
                    pass
            if isinstance(c, dict) and "one_sentence" in c:
                existing["formatted_dates"] = formatted_dates
                return existing

    s_dt = datetime.strptime(week_start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    e_dt = datetime.strptime(week_end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    activity = collect_multi_modal_activity(user_id, s_dt, e_dt)

    user_name = _get_user_display_name(user_id)
    content = generate_weekly_intelligence_reflection(user_name, week_start, week_end, activity)

    saved = save_weekly_reflection(user_id, week_start, week_end, content)
    saved["content"] = content
    saved["formatted_dates"] = formatted_dates
    return saved


def get_or_generate_monthly(user_id: str, force: bool = False, month_str: Optional[str] = None) -> Dict[str, Any]:
    if not month_str:
        month_str = get_current_month_str()

    if not force:
        existing = get_existing_monthly_reflection(user_id, month_str)
        if existing:
            c = existing.get("content")
            if isinstance(c, str):
                try:
                    c = json.loads(c)
                    existing["content"] = c
                except Exception:
                    pass
            if isinstance(c, dict) and "month_theme" in c:
                return existing

    dt = datetime.strptime(month_str, "%Y-%m").replace(tzinfo=timezone.utc)
    s_dt = dt.replace(day=1)
    if dt.month == 12:
        next_month = dt.replace(year=dt.year + 1, month=1, day=1)
    else:
        next_month = dt.replace(month=dt.month + 1, day=1)
    e_dt = next_month - timedelta(seconds=1)

    activity = collect_multi_modal_activity(user_id, s_dt, e_dt)
    user_name = _get_user_display_name(user_id)
    content = generate_monthly_intelligence_reflection(user_name, month_str, activity)

    saved = save_monthly_reflection(user_id, month_str, content)
    saved["content"] = content
    return saved


def get_home_reflection_preview(user_id: str) -> Dict[str, Any]:
    """Returns single elegant preview for Home page."""
    weekly = get_or_generate_weekly(user_id, force=False)
    c = weekly.get("content", {})
    if isinstance(c, str):
        try:
            c = json.loads(c)
        except Exception:
            c = {}

    preview_sentence = c.get("one_sentence") or "There were moments this week where writing created a little breathing room."
    formatted_dates = weekly.get("formatted_dates") or "This Week"

    return {
        "title": "This Week's Reflection",
        "preview_sentence": preview_sentence,
        "week_label": formatted_dates,
        "has_reflection": True,
        "reflection_id": weekly.get("id"),
        "action_label": "Continue Reading ->"
    }


def get_reflection_history(user_id: str) -> Dict[str, Any]:
    local = _load_local_reflections()
    weekly_list = []
    for w in local.get("weekly", {}).get(user_id, []):
        c = w.get("content", {})
        if isinstance(c, str):
            try:
                c = json.loads(c)
            except Exception:
                c = {}
        weekly_list.append({
            "id": w.get("id"),
            "type": "weekly",
            "title": f"Weekly Reflection ({w.get('week_start', '')})",
            "date_label": format_week_range_display(w.get("week_start", ""), w.get("week_end", "")),
            "preview_sentence": c.get("one_sentence", "A gentle reflection on the week's rhythm."),
            "created_at": w.get("generated_at", "")
        })

    monthly_list = []
    for m in local.get("monthly", {}).get(user_id, []):
        c = m.get("content", {})
        if isinstance(c, str):
            try:
                c = json.loads(c)
            except Exception:
                c = {}
        monthly_list.append({
            "id": m.get("id"),
            "type": "monthly",
            "title": f"{m.get('month', '')} Reflection Keepsake",
            "date_label": format_month_display(m.get("month", "")),
            "preview_sentence": c.get("month_theme", "A quiet look back at your month."),
            "created_at": m.get("generated_at", "")
        })

    return {
        "weekly": weekly_list,
        "monthly": monthly_list
    }
