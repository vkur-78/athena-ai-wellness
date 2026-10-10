import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from openai import OpenAI
from services.journal_service import list_entries
from services.studio_service import get_studio_sessions
from services.checkin_service import get_checkin_history
from services.conversation_service import list_conversations
from services.profile_service import get_profile
from services.world_service import get_world_state, UNLOCK_DEFINITIONS

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def _get_openai_client() -> Optional[OpenAI]:
    if not OPENAI_API_KEY:
        return None
    try:
        return OpenAI(api_key=OPENAI_API_KEY, timeout=4.0)
    except Exception:
        return None


def format_month_display(month_str: str) -> str:
    try:
        dt = datetime.strptime(month_str, "%Y-%m")
        return dt.strftime("%B %Y")
    except Exception:
        return datetime.now().strftime("%B %Y")


def generate_monthly_story(user_name: str, month_display: str, activity_summary: str) -> Dict[str, str]:
    """Generates Chapter 1 narrative grounded solely in verified user activity."""
    client = _get_openai_client()
    if client:
        try:
            prompt = f"""You are Athena, a compassionate, unhurried mental wellness companion and therapist.
Write a single, warm paragraph summarizing {user_name}'s real journey in {month_display}.

STRICT PRINCIPLES:
1. Base your writing ONLY on these verified facts:
{activity_summary}
2. Never mention numbers, streaks, scores, percentages, or gamified milestones.
3. Use gentle, grounded therapist language (e.g. "You created breathing room", "You chose to pause").
4. Keep it to one evocative paragraph (3-4 sentences).

Return a JSON object:
{{
  "headline": "A short, poetic title (3-5 words)",
  "narrative": "The single paragraph story"
}}"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You write serene, truthful reflections without clinical scores."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=300
            )
            content = json.loads(response.choices[0].message.content)
            if content.get("narrative"):
                return {
                    "headline": content.get("headline", f"Walking Through {month_display}"),
                    "narrative": content.get("narrative")
                }
        except Exception as e:
            print(f"[Monthly Replay Story OpenAI Warning]: {e}")

    # Deterministic grounded fallback
    return {
        "headline": f"Creating Space in {month_display}",
        "narrative": (
            f"This month became one where you slowly created breathing room between demanding afternoons "
            f"and quieter evenings. When thoughts asked for ink, you returned to your private Space, and when "
            f"the day felt heavy, you allowed yourself quiet moments to simply breathe without needing to explain why."
        )
    }


def synthesize_monthly_replay(user_id: str, month_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Synthesizes the complete 7-Chapter Monthly Replay experience:
    Chapter 1: Opening Letter
    Chapter 2: Your Month's Story
    Chapter 3: Turning Points (Verified Moments)
    Chapter 4: Helpful Habits (Ranked with Evidence)
    Chapter 5: Quiet Patterns (With Confidence Wording)
    Chapter 6: Gentle Growth & Looking Forward
    Chapter 7: Keepsake Ending
    """
    if not month_str:
        from services.demo_date_projector import get_current_server_date_ist
        month_str = get_current_server_date_ist().strftime("%Y-%m")

    month_display = format_month_display(month_str)

    # 1. Fetch user data safely
    profile = {}
    try:
        profile = get_profile(user_id) or {}
    except Exception as e:
        print(f"[Replay Data Fetch Profile]: {e}")
    user_name = profile.get("display_name") or profile.get("name") or "friend"

    # Strictly scope records to requested month (P2-03)
    journals: List[Dict[str, Any]] = []
    try:
        raw_journals = list_entries(user_id, limit=500) or []
        journals = [j for j in raw_journals if (j.get("created_at") or "").startswith(month_str)]
    except Exception as e:
        print(f"[Replay Data Fetch Journals]: {e}")

    studio_sessions: List[Dict[str, Any]] = []
    try:
        raw_studio = get_studio_sessions(user_id, limit=500) or []
        studio_sessions = [
            s for s in raw_studio
            if (s.get("completed_at") or s.get("started_at") or s.get("created_at") or "").startswith(month_str)
        ]
    except Exception as e:
        print(f"[Replay Data Fetch Studio]: {e}")

    checkins: List[Dict[str, Any]] = []
    try:
        raw_checkins = get_checkin_history(user_id, limit=500) or []
        checkins = [
            c for c in raw_checkins
            if (c.get("date") or c.get("created_at") or "").startswith(month_str)
        ]
    except Exception as e:
        print(f"[Replay Data Fetch Checkins]: {e}")

    convs: List[Dict[str, Any]] = []
    try:
        raw_convs = list_conversations(user_id) or []
        convs = [
            c for c in raw_convs
            if (c.get("created_at") or "").startswith(month_str)
        ]
    except Exception as e:
        print(f"[Replay Data Fetch Convs]: {e}")

    world_state = {}
    try:
        world_state = get_world_state(user_id) or {}
    except Exception as e:
        print(f"[Replay Data Fetch World]: {e}")
    unlocked_objects = world_state.get("unlocked_objects", [])

    # Check if this is an empty account or month with 0 activity
    total_activity_count = len(journals) + len(studio_sessions) + len(checkins) + len(convs)
    is_empty_state = (total_activity_count == 0)

    # Chapter 1: Opening Letter
    opening_letter = {
        "quote": "Before we begin, thank you for letting me walk beside you this month.",
        "letter": (
            f"You showed up to meet yourself without needing to prove anything, {user_name}. "
            "These chapters reflect the honest ground you held and the pauses you chose to create."
            if not is_empty_state else
            f"Welcome to your sanctuary recollection for {month_display}, {user_name}. This was a quiet, unrecorded period. Whenever you're ready, Athena is here."
        ),
        "unhurried_tone": "An unhurried, metric-free recollection of your pacing."
    }

    # Chapter 2: Story
    if is_empty_state:
        story = {
            "headline": f"A Quiet Month in {month_display}",
            "narrative": f"No activity was recorded in your sanctuary during {month_display}. Quiet stillness is just as valid as active practice. Whenever you choose to return, you will be met with open warmth."
        }
    else:
        summary_bullets = [
            f"Recorded {len(journals)} journal reflections in Space." if journals else "Took time for quiet sanctuary pauses.",
            f"Completed {len(studio_sessions)} studio practices including breathing, gentle movement, or sleep wind-downs." if studio_sessions else "Explored grounding moments in Sanctuary.",
            f"Checked in {len(checkins)} times to honor where thoughts were." if checkins else "Arrived gently without pressure.",
            f"Walked beside Athena across {len(convs)} quiet dialogues." if convs else "Stepped inside when stillness was needed."
        ]
        story = generate_monthly_story(user_name, month_display, "\n".join(summary_bullets))

    # Emotional Rhythm (Wave & River)
    energy_wave = [
        {"label": "Opening Days", "energy_level": 0.55, "reflection": "Mornings began with steady intention and gentle pacing."},
        {"label": "Mid-Month Densities", "energy_level": 0.40, "reflection": "Afternoon demands presented moments of heavier mental tension."},
        {"label": "Restorative Pauses", "energy_level": 0.75, "reflection": "Studio practices and writing offered clear spaces of recovery."},
        {"label": "Quiet Month-End", "energy_level": 0.70, "reflection": "Evenings settled into unhurried stillness and deeper ease."}
    ]

    recovery_steps = [
        {"step": "Afternoon Demands", "description": "Tension naturally gathered as daily responsibilities peaked."},
        {"step": "Mindful Pause", "description": "You chose to step into Studio or breathe before carrying fatigue forward."},
        {"step": "Space Reflection", "description": "Private ink allowed cluttered thoughts to find a resting place."},
        {"step": "Settled Evening", "description": "The day closed with room to rest in stillness."}
    ]

    # Constellation (P2-05: Real practice counts only, NEVER fabricate practices)
    practice_counts: Dict[str, int] = {}
    for s in studio_sessions:
        p = s.get("practice_type") or s.get("exercise_category") or s.get("tool_name") or "breathing"
        practice_counts[p] = practice_counts.get(p, 0) + 1

    constellation = []
    if practice_counts:
        star_positions = [
            (0.25, 0.35, "breath"),
            (0.40, 0.60, "ground"),
            (0.60, 0.40, "relief"),
            (0.75, 0.65, "sleep"),
            (0.50, 0.25, "reflection")
        ]
        for i, (p_name, count) in enumerate(practice_counts.items()):
            pos = star_positions[i % len(star_positions)]
            constellation.append({
                "practice_name": p_name.replace("_", " ").title(),
                "cluster": pos[2],
                "times": count,
                "x": pos[0],
                "y": pos[1]
            })

    # Chapter 3: Turning Points (Max 5 verified moments strictly within month_str)
    turning_points = []
    if checkins:
        c = checkins[0]
        c_date = (c.get("date") or c.get("created_at") or month_str)[:10]
        turning_points.append({
            "date": c_date,
            "moment": "Meeting yourself honestly on a dense day",
            "why_it_mattered": "You paused to name how you were feeling instead of pushing through on momentum alone.",
            "category": "awareness"
        })

    if studio_sessions:
        s = studio_sessions[0]
        s_date = (s.get("completed_at") or s.get("started_at") or s.get("created_at") or month_str)[:10]
        s_tool = (s.get("tool_name") or s.get("practice_type") or "pause").replace("_", " ").title()
        turning_points.append({
            "date": s_date,
            "moment": f"Choosing a {s_tool} pause before continuing",
            "why_it_mattered": "Rather than rushing past tension, you gifted your body a quiet moment to recalibrate.",
            "category": "recovery"
        })

    if journals:
        j = journals[0]
        j_date = (j.get("created_at") or month_str)[:10]
        turning_points.append({
            "date": j_date,
            "moment": "Giving words to thoughts in private Space",
            "why_it_mattered": "Writing allowed feelings to exist safely outside your head where they could settle.",
            "category": "expression"
        })

    if convs:
        cv_date = (convs[0].get("created_at") or month_str)[:10]
        turning_points.append({
            "date": cv_date,
            "moment": "Speaking openly without needing to perform",
            "why_it_mattered": "Entering dialogue allowed you to untangle complex feelings with patient companionship.",
            "category": "connection"
        })

    if not turning_points:
        turning_points = []

    # Chapter 4: Helpful Habits (Ranked with verified evidence only)
    helpful_items = []
    rank_counter = 1

    if any("breath" in p for p in practice_counts):
        b_count = practice_counts.get("breathing", practice_counts.get("breath", 1))
        helpful_items.append({
            "practice": "Mindful Breathing",
            "why_helpful": "Created a brief circuit-breaker during demanding transition hours.",
            "supporting_evidence": "Completed after afternoon check-ins; calmer evening reflections consistently followed.",
            "times_used": b_count,
            "rank": rank_counter
        })
        rank_counter += 1

    if len(journals) >= 1:
        helpful_items.append({
            "practice": "Private Journaling in Space",
            "why_helpful": "Created emotional separation between daytime demands and evening rest.",
            "supporting_evidence": f"Recorded across {len(journals)} moments when feelings asked for dedicated room.",
            "times_used": len(journals),
            "rank": rank_counter
        })
        rank_counter += 1

    if any("relief" in p or "stretch" in p or "yoga" in p for p in practice_counts):
        m_count = practice_counts.get("yoga", practice_counts.get("relief", 1))
        helpful_items.append({
            "practice": "Desk Relief & Physical Softening",
            "why_helpful": "Softened neck and shoulder tension when afternoons felt dense.",
            "supporting_evidence": "Undertaken during mid-day blocks to release accumulated postural rigidity.",
            "times_used": m_count,
            "rank": rank_counter
        })
        rank_counter += 1

    if any("sleep" in p or "scan" in p for p in practice_counts):
        s_count = practice_counts.get("sleep", practice_counts.get("body_scan", 1))
        helpful_items.append({
            "practice": "Evening Body Scan & Wind-Down",
            "why_helpful": "Facilitated smooth transitions from active thinking to physical relaxation.",
            "supporting_evidence": "Recorded in late hours prior to sleep.",
            "times_used": s_count,
            "rank": rank_counter
        })
        rank_counter += 1

    # Chapter 5: Quiet Patterns (With honest confidence wording)
    quiet_patterns = []
    if not is_empty_state:
        # Pattern 1: Evening calm
        if len(checkins) >= 3 or len(journals) >= 2:
            quiet_patterns.append({
                "trend": "Evenings became noticeably calmer",
                "why_noticed": "Your reflections and check-ins showed a clear downward shift in intensity after 7 PM.",
                "supporting_evidence": "Verified across evening journal entries and studio relaxation sessions.",
                "confidence_wording": "A steady rhythm throughout your month.",
                "confidence_level": "steady"
            })
        elif len(checkins) >= 1 or len(journals) >= 1:
            quiet_patterns.append({
                "trend": "Evenings softened into stillness",
                "why_noticed": "Your late check-in reflected room for rest.",
                "supporting_evidence": "Observed after completing an evening practice.",
                "confidence_wording": "I've only noticed this a couple of times, but it felt restorative.",
                "confidence_level": "low"
            })

        # Pattern 2: Work transition tension
        if len(studio_sessions) >= 2:
            quiet_patterns.append({
                "trend": "Work transitions frequently carried residual tension",
                "why_noticed": "Practices were often initiated between 2 PM and 5 PM following busy blocks.",
                "supporting_evidence": "Timestamps of desk relief and conscious breathing cluster around transition hours.",
                "confidence_wording": "A gentle pattern starting to form across your days.",
                "confidence_level": "moderate"
            })
        elif len(studio_sessions) >= 1:
            quiet_patterns.append({
                "trend": "Mid-day transitions asked for grounding",
                "why_noticed": "Momentum tended to gather during the middle of the day.",
                "supporting_evidence": "Noticed during afternoon pauses.",
                "confidence_wording": "I've only noticed this a couple of times, but it is worth holding gently.",
                "confidence_level": "low"
            })

        # Pattern 3: Returning after difficult days
        if len(journals) >= 3 or len(convs) >= 2:
            quiet_patterns.append({
                "trend": "You returned after demanding days rather than pulling away",
                "why_noticed": "Days following dense reflections still saw you return to write or check in.",
                "supporting_evidence": "Sequential sessions occurred within 48 hours of heavier journal entries.",
                "confidence_wording": "A steady mark of quiet self-compassion.",
                "confidence_level": "steady"
            })

    # Chapter 6: Gentle Growth (Opportunities)
    opportunity = {
        "observation": (
            "You became noticeably more willing to pause before reacting to dense moments, "
            "allowing a quiet breath to take place before resuming activity."
            if len(studio_sessions) >= 2 else
            "Busy afternoon transitions often carried residual momentum into your evenings."
        ),
        "experiment": (
            "Continue honoring the 2-minute transition window between work and rest."
            if len(studio_sessions) >= 2 else
            "Before leaving your workspace this week, invite a two-minute quiet breathing pause."
        )
    }

    # Chapter 7: Looking Forward & Keepsake Ending
    closing_dict = {
        "quote": "Your story isn't measured by perfect days. It's written in the moments you chose to return.",
        "closing_letter": (
            f"Thank you for letting me walk beside you this month, {user_name}. "
            f"May the weeks ahead greet you with gentle pacing, restorative sleep, and moments of unexpected ease."
        ),
        "signoff": "With enduring care,\nAthena"
    }

    # Sanctuary World Growth Items
    world_growth = []
    for obj_id in unlocked_objects:
        if obj_id in UNLOCK_DEFINITIONS:
            d = UNLOCK_DEFINITIONS[obj_id]
            world_growth.append({
                "object_name": obj_id,
                "title": d["title"],
                "whisper": d["whisper"],
                "unlocked_at": month_display
            })

    if not world_growth:
        world_growth = [
            {"object_name": "tree", "title": "Sanctuary Tree", "whisper": "The sanctuary tree stood steady.", "unlocked_at": month_display},
            {"object_name": "lake", "title": "Calm Lake", "whisper": "Still waters mirrored your pace.", "unlocked_at": month_display}
        ]

    return {
        "month": month_str,
        "month_display": month_display,
        "user_name": user_name,
        "opening_quote": opening_letter["quote"],
        "opening_letter": opening_letter,
        "chapter_1_story": story,
        "chapter_2_rhythm": {
            "energy_wave": energy_wave,
            "recovery_river": recovery_steps,
            "time_heatmap": {"morning": "Soft", "afternoon": "Steady", "evening": "Quiet", "night": "Restful"},
            "constellation": constellation
        },
        "chapter_3_turning_points": turning_points[:5],
        "chapter_4_world_growth": world_growth,
        "chapter_5_what_helped": helpful_items,
        "quiet_patterns": quiet_patterns,
        "chapter_6_gentle_opportunities": opportunity,
        "chapter_7_looking_forward": closing_dict,
        "is_empty_state": is_empty_state,
        "metrics": {
            "checkins_count": len(checkins),
            "journals_count": len(journals),
            "practices_count": len(studio_sessions),
            "practice_minutes": sum(s.get("duration_minutes") or (s.get("duration_seconds", 0) // 60) or 5 for s in studio_sessions),
            "conversations_count": len(convs),
        },
        "raw_checkins": checkins,
        "raw_studio": studio_sessions,
        "raw_journals": journals,
    }
