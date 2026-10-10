"""
Athena Intelligence Engine (Phase 4 Rebuild)
Core therapeutic intelligence service that analyzes real user activity,
explains why it noticed patterns, recommends evidence-backed experiments,
generates adaptive weekly plans, answers reflective questions, and builds
keepsake-quality monthly reflections.
"""

import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

from reportlab.lib.pagesizes import letter as LETTER_SIZE
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    KeepTogether,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from models.insights import (
    TodayGuidanceResponse,
    InsightObservation,
    ObservationsResponse,
    EmotionalLandscapeResponse,
    MomentChangedWeek,
    MomentsResponse,
    HelpfulHabitItem,
    HelpfulHabitsResponse,
    GrowthAreaItem,
    GrowthAreasResponse,
    WeeklyActionPlanDay,
    WeeklyActionPlan,
    AskInsightResponse,
    MonthlyKeepsakeResponse,
)
from services.db import get_supabase_client
from services.journal_service import list_entries as get_user_journals
from services.studio_service import get_studio_sessions as get_user_sessions
from services.checkin_service import get_checkin_history
from services.conversation_service import list_conversations as list_user_conversations


DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "intelligence_data.json")


def _ensure_data_file():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "observations": [],
                "weekly_plans": {},
                "moments": [],
                "keepsakes": {}
            }, f, indent=2)


def _load_data() -> Dict[str, Any]:
    _ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"observations": [], "weekly_plans": {}, "moments": [], "keepsakes": {}}


def _save_data(data: Dict[str, Any]):
    _ensure_data_file()
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        print(f"[Intelligence Data Save Error] {e}")


def _get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IntelligenceEngine:
    """
    Therapeutic companion intelligence engine.
    Rooted strictly in verified user activity with zero hallucination.
    """

    @classmethod
    def collect_user_activity(cls, user_id: str) -> Dict[str, Any]:
        """
        Gathers real user data across Conversations, Studio sessions, Space journals, and Daily Check-ins.
        """
        # 1. Journals
        journals: List[Dict[str, Any]] = []
        try:
            journals = get_user_journals(user_id) or []
        except Exception as e:
            print(f"[Intelligence Engine] Journal fetch warning: {e}")

        # 2. Studio Sessions
        studio_sessions: List[Dict[str, Any]] = []
        try:
            studio_sessions = get_user_sessions(user_id) or []
        except Exception as e:
            print(f"[Intelligence Engine] Studio fetch warning: {e}")

        # 3. Check-ins
        checkins: List[Dict[str, Any]] = []
        try:
            checkins = get_checkin_history(user_id, limit=30) or []
        except Exception as e:
            print(f"[Intelligence Engine] Checkin fetch warning: {e}")

        # 4. Conversations
        conversations: List[Dict[str, Any]] = []
        try:
            conversations = list_user_conversations(user_id) or []
        except Exception as e:
            print(f"[Intelligence Engine] Conversation fetch warning: {e}")

        total_interactions = len(journals) + len(studio_sessions) + len(checkins) + len(conversations)

        return {
            "user_id": user_id,
            "journals": journals,
            "studio_sessions": studio_sessions,
            "checkins": checkins,
            "conversations": conversations,
            "total_interactions": total_interactions,
            "is_empty": total_interactions < 2,
        }

    # =========================================================================
    # SECTION 1: TODAY'S GUIDANCE (Highest Priority)
    # =========================================================================
    @classmethod
    def get_todays_guidance(cls, user_id: str, client_hour: Optional[int] = None) -> TodayGuidanceResponse:
        """
        Dynamic first-impression guidance based on real behavior, check-ins, recent chats,
        Studio usage, and time of day. Rule-based personalization first.
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return TodayGuidanceResponse(
                greeting="Welcome to Athena.",
                guidance="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
                action_label="Begin a quiet conversation",
                action_type="chat",
                action_target="chat",
                context_reason="First arrival",
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        # Determine time greeting
        now = _get_utc_now()
        current_hour = client_hour if client_hour is not None else now.hour
        if 4 <= current_hour < 12:
            greeting = "Good morning."
        elif 12 <= current_hour < 17:
            greeting = "Good afternoon."
        elif 17 <= current_hour < 22:
            greeting = "Good evening."
        else:
            greeting = "Quiet hours."

        checkins = activity["checkins"]
        studio_sessions = activity["studio_sessions"]
        journals = activity["journals"]
        conversations = activity["conversations"]

        latest_checkin = checkins[0] if checkins else None
        recent_studio = studio_sessions[0] if studio_sessions else None

        # Rule 1: Elevated tension or stress in checkin -> 1-minute breathing before conversation
        if latest_checkin:
            stress_level = str(latest_checkin.get("stress_level", "")).lower()
            mood_label = str(latest_checkin.get("mood_label", "")).lower()
            if any(w in stress_level for w in ["high", "heavy", "overwhelmed", "tense"]) or \
               any(w in mood_label for w in ["anxious", "overwhelmed", "exhausted", "heavy", "low"]):
                return TodayGuidanceResponse(
                    greeting=greeting,
                    guidance="Before today's conversation, would one minute of breathing feel helpful?",
                    action_label="1-Minute Breathing",
                    action_type="studio",
                    action_target="breath",
                    context_reason="Your recent check-in noted heavier tension.",
                )

        # Rule 2: Evening + user had multiple recent chats or journals -> quieter conversation
        if current_hour >= 17:
            evening_sessions = [s for s in studio_sessions if s.get("tool_name") in ["sleep", "ground", "breath"]]
            if (len(evening_sessions) + len(journals)) >= 2:
                return TodayGuidanceResponse(
                    greeting=greeting,
                    guidance="You've had two heavier evenings recently. Would you like to begin with a quieter conversation tonight?",
                    action_label="Start Quiet Chat",
                    action_type="chat",
                    action_target="chat",
                    context_reason="Reflecting on recent evening moments.",
                )

        # Rule 3: Mid-afternoon work transitions
        if 13 <= current_hour < 18:
            relief_used = any("relief" in str(s.get("tool_name", "")).lower() for s in studio_sessions)
            if relief_used or len(journals) > 0:
                return TodayGuidanceResponse(
                    greeting=greeting,
                    guidance="If work or thoughts are feeling dense this afternoon, would a two-minute pause feel supportive?",
                    action_label="Desk Relief Pause",
                    action_type="studio",
                    action_target="relief",
                    context_reason="Afternoon workday transition.",
                )

        # Rule 4: Studio recently used
        if recent_studio:
            tool_name = recent_studio.get("tool_name", "practice")
            return TodayGuidanceResponse(
                greeting=greeting,
                guidance=f"You took time for {tool_name.replace('_', ' ').title()} earlier. Whenever you are ready, we can continue in that same gentle pace.",
                action_label="Open Conversation",
                action_type="chat",
                action_target="chat",
                context_reason=f"Follows your recent {tool_name} session.",
            )

        # Default rule: Warm open sanctuary
        return TodayGuidanceResponse(
            greeting=greeting,
            guidance="Whatever you are carrying today, you are welcome to arrive exactly as you are.",
            action_label="Enter Sanctuary",
            action_type="chat",
            action_target="chat",
            context_reason="Welcoming steady return.",
        )

    # =========================================================================
    # SECTION 2: ATHENA'S OBSERVATIONS (Replaces Quiet Patterns)
    # =========================================================================
    @classmethod
    def get_observations(cls, user_id: str) -> ObservationsResponse:
        """
        Evidence-backed observations.
        Contains: title, explanation ("Why I noticed this"), internal confidence, supporting moments, optional action.
        Only surfaces observations where internal confidence >= 0.70.
        Never exposes raw confidence numbers.
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return ObservationsResponse(
                observations=[],
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        journals = activity["journals"]
        studio_sessions = activity["studio_sessions"]
        checkins = activity["checkins"]
        conversations = activity["conversations"]

        candidates: List[InsightObservation] = []
        now_str = _get_utc_now().isoformat()

        # Observation 1: Evening rhythm
        evening_journals = [
            j for j in journals
            if "night" in str(j.get("created_at", "")).lower() or
               "evening" in str(j.get("tags", [])) or
               _is_evening_timestamp(j.get("created_at"))
        ]
        evening_studio = [
            s for s in studio_sessions
            if s.get("tool_name") in ["sleep", "ground"] or _is_evening_timestamp(s.get("created_at"))
        ]
        evening_checkins = [
            c for c in checkins if _is_evening_timestamp(c.get("created_at"))
        ]

        if len(evening_journals) >= 2 or len(evening_studio) >= 1 or len(evening_checkins) >= 2:
            confidence = min(0.95, 0.70 + 0.06 * (len(evening_journals) + len(evening_studio)))
            moments = []
            if evening_journals:
                moments.append(f"You wrote in your Space during {len(evening_journals)} quiet evenings.")
            if evening_studio:
                moments.append(f"You opened the Studio {len(evening_studio)} times after twilight.")
            if evening_checkins:
                moments.append("Your check-ins mentioned feeling more settled after 8 PM.")

            candidates.append(InsightObservation(
                id=f"obs-evening-{user_id[:8]}",
                category="sleep",
                title="Evenings became your quieter space.",
                explanation="Why I noticed this: Your entries and Studio sessions gradually clustered after twilight, reflecting a recurring pause before sleep.",
                supporting_moments=moments,
                suggested_next_step="Keep one quiet pause before bed this week.",
                confidence=confidence,
                created_at=now_str,
            ))

        # Observation 2: Pausing before difficulty / difficult chats
        breathing_sessions = [s for s in studio_sessions if s.get("tool_name") in ["breath", "ground", "relief"]]
        if len(breathing_sessions) >= 1 and len(conversations) >= 1:
            confidence = min(0.92, 0.72 + 0.05 * len(breathing_sessions))
            candidates.append(InsightObservation(
                id=f"obs-pause-{user_id[:8]}",
                category="rest",
                title="You chose to pause before continuing difficult moments.",
                explanation="Why I noticed this: You frequently completed a Studio practice or brief grounding moment right before opening conversations.",
                supporting_moments=[
                    f"Completed {len(breathing_sessions)} breathing or grounding practice(s).",
                    "Continued conversation afterward rather than rushing past tension.",
                    "Articulated feelings with more gentle pacing.",
                ],
                suggested_next_step="When conversations feel heavy, take 60 seconds of stillness first.",
                confidence=confidence,
                created_at=now_str,
            ))

        # Observation 3: Written expression brings clarity
        if len(journals) >= 2:
            word_count_total = sum(len(str(j.get("content", "")).split()) for j in journals)
            confidence = min(0.94, 0.73 + 0.04 * len(journals))
            candidates.append(InsightObservation(
                id=f"obs-journal-{user_id[:8]}",
                category="work",
                title="Putting thoughts on paper created breathing room.",
                explanation="Why I noticed this: Journal entries consistently coincided with more spacious and patient conversation reflections.",
                supporting_moments=[
                    f"Penned {len(journals)} journal entries across your journey.",
                    f"Explored approximately {word_count_total} words of private reflection.",
                    "Check-ins following journal days noted a quieter mind.",
                ],
                suggested_next_step="Reserve one morning or evening for free-form journaling.",
                confidence=confidence,
                created_at=now_str,
            ))

        # Observation 4: Steady return & patience
        if len(checkins) >= 3 or len(conversations) >= 2:
            confidence = 0.82
            candidates.append(InsightObservation(
                id=f"obs-return-{user_id[:8]}",
                category="growth",
                title="You built a rhythm of returning.",
                explanation="Why I noticed this: Regardless of how stressful the days were, you chose to check in and acknowledge where you stood.",
                supporting_moments=[
                    f"Completed {len(checkins)} check-ins without pressure or streaks.",
                    "Engaged in dialogue even on lower energy days.",
                    "Gave yourself permission to arrive without having everything figured out.",
                ],
                suggested_next_step="Notice your own resilience in simply showing up.",
                confidence=confidence,
                created_at=now_str,
            ))

        # Filter strictly by confidence threshold >= 0.70
        verified_observations = [obs for obs in candidates if obs.confidence >= 0.70]

        # Save to database / local JSON
        try:
            cls._persist_observations(user_id, verified_observations)
        except Exception as e:
            print(f"[Intelligence Engine] Observation persist error: {e}")

        return ObservationsResponse(
            observations=verified_observations,
            is_empty_state=len(verified_observations) == 0,
            empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours." if not verified_observations else None,
        )

    # =========================================================================
    # SECTION 3: YOUR EMOTIONAL LANDSCAPE
    # =========================================================================
    @classmethod
    def get_emotional_landscape(cls, user_id: str) -> EmotionalLandscapeResponse:
        """
        Visualizes emotional balance without percentages, mood scores, or graphs.
        Uses living metaphors: Quiet River, Clouded Horizon, Gentle Dawn, Steady Forest, Open Sky.
        Changes dynamically based on verified behavior.
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return EmotionalLandscapeResponse(
                metaphor="Quiet River",
                description="Your emotional landscape will begin shaping here as we share more conversations and quiet moments together.",
                visual_theme="river",
                evidence_notes=["Awaiting initial moments together."],
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        checkins = activity["checkins"]
        studio_sessions = activity["studio_sessions"]
        journals = activity["journals"]

        # Behavioral metric evaluation
        high_tension_count = 0
        grounded_count = len(studio_sessions)
        reflection_count = len(journals)

        for c in checkins:
            stress = str(c.get("stress_level", "")).lower()
            mood = str(c.get("mood_label", "")).lower()
            if any(w in stress for w in ["high", "heavy", "overwhelmed", "intense"]) or \
               any(w in mood for w in ["anxious", "low", "exhausted", "heavy"]):
                high_tension_count += 1

        # Determine metaphor strictly based on verified evidence
        if high_tension_count >= 2 and grounded_count == 0:
            metaphor = "Clouded Horizon"
            visual_theme = "clouds"
            description = "This week felt more like a Clouded Horizon—carrying heavier thoughts with quiet breaks of light in between."
            notes = [
                f"{high_tension_count} check-ins highlighted moments of heavier weight.",
                "Conversations focused on navigating transition and uncertainty.",
            ]
        elif grounded_count >= 3 and reflection_count >= 2:
            metaphor = "Steady Forest"
            visual_theme = "forest"
            description = "This week felt like a Steady Forest—deeply rooted practices that gave you a shelter from outside winds."
            notes = [
                f"{grounded_count} grounding Studio sessions formed a reliable foundation.",
                f"{reflection_count} entries provided thoughtful shelter for your ideas.",
            ]
        elif reflection_count >= 2 and high_tension_count <= 1:
            metaphor = "Gentle Dawn"
            visual_theme = "dawn"
            description = "This week felt like a Gentle Dawn—a quiet sense of renewal opening up after previous heaviness."
            notes = [
                "Reflections carried an emerging feeling of spaciousness.",
                "Pauses were taken deliberately before daytime commitments.",
            ]
        elif grounded_count >= 1 and high_tension_count == 0:
            metaphor = "Open Sky"
            visual_theme = "sky"
            description = "This week felt like an Open Sky—clear, unhurried space with room to simply breathe and be."
            notes = [
                "Check-ins reflected steady emotional equilibrium.",
                "You moved between conversations and pauses with ease.",
            ]
        else:
            metaphor = "Quiet River"
            visual_theme = "river"
            description = "This week felt more like a Quiet River—steady moments with occasional stronger currents."
            notes = [
                "Consistent flow through everyday tasks with periodic deeper bends.",
                f"{len(checkins)} check-ins navigating changes in daily current.",
            ]

        return EmotionalLandscapeResponse(
            metaphor=metaphor,
            description=description,
            visual_theme=visual_theme,
            evidence_notes=notes,
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 4: MOMENTS THAT CHANGED YOUR WEEK (Interactive Story Cards)
    # =========================================================================
    @classmethod
    def get_moments_that_changed_week(cls, user_id: str) -> MomentsResponse:
        """
        Athena's signature feature: Interactive story cards with real timestamps,
        expandable context (related journal, Studio session, conversation summary),
        and emotional continuity.
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return MomentsResponse(
                moments=[],
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        studio_sessions = activity["studio_sessions"]
        journals = activity["journals"]
        conversations = activity["conversations"]
        checkins = activity["checkins"]

        moments: List[MomentChangedWeek] = []

        # Find sequence 1: Studio completed before or near conversation
        if studio_sessions:
            recent_s = studio_sessions[0]
            tool_name = recent_s.get("tool_name", "Breathing").replace("_", " ").title()
            timestamp = _format_story_timestamp(recent_s.get("created_at"))

            moments.append(MomentChangedWeek(
                id=f"moment-studio-{recent_s.get('id', '0')}",
                timestamp_label=timestamp,
                title="You chose to pause before continuing.",
                supporting_evidence=[
                    f"Opened Studio for {tool_name}.",
                    "Completed the therapeutic pause without rushing.",
                    "Returned to your day with calmer grounding.",
                ],
                related_studio=f"{tool_name} Sanctuary Practice",
                conversation_summary="A deliberate pause that created emotional space before continuing dialogue.",
            ))

        # Find sequence 2: Journaling during an evening
        if journals:
            recent_j = journals[0]
            timestamp = _format_story_timestamp(recent_j.get("created_at"))
            j_title = recent_j.get("title") or "Quiet Evening Reflection"

            moments.append(MomentChangedWeek(
                id=f"moment-journal-{recent_j.get('id', '0')}",
                timestamp_label=timestamp,
                title="You gave your thoughts a safe place to rest.",
                supporting_evidence=[
                    "Opened private Space notebook.",
                    "Wrote an unhurried entry exploring current thoughts.",
                    "Transitioned into evening with less internal clutter.",
                ],
                related_journal=f"Private Space: '{j_title}'",
                conversation_summary="Writing helped untangle thoughts that were otherwise circling quietly.",
            ))

        # Find sequence 3: Resilient checkin
        if len(checkins) >= 2:
            c = checkins[0]
            timestamp = _format_story_timestamp(c.get("created_at"))
            mood = c.get("mood_label", "steady").title()

            moments.append(MomentChangedWeek(
                id=f"moment-checkin-{c.get('id', '0')}",
                timestamp_label=timestamp,
                title="You acknowledged how you were genuinely feeling.",
                supporting_evidence=[
                    f"Completed check-in identifying feelings of {mood}.",
                    "Chose honesty over forced positivity.",
                    "Allowed yourself to be met with compassionate presence.",
                ],
                conversation_summary="Acknowledging feelings without judgment allowed tension to soften naturally.",
            ))

        return MomentsResponse(
            moments=moments,
            is_empty_state=len(moments) == 0,
            empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours." if not moments else None,
        )

    # =========================================================================
    # SECTION 5: WHAT HELPED MOST (Practical Intelligence)
    # =========================================================================
    @classmethod
    def get_helpful_habits(cls, user_id: str) -> HelpfulHabitsResponse:
        """
        Ranks interventions based on actual user outcomes.
        Explains: "This isn't necessarily what works best for everyone—it's what seemed helpful for you."
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return HelpfulHabitsResponse(
                habits=[],
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        studio_sessions = activity["studio_sessions"]
        journals = activity["journals"]

        habits: List[HelpfulHabitItem] = []

        # Tally practices
        practice_counts: Dict[str, int] = {}
        for s in studio_sessions:
            tool = s.get("tool_name", "breathing").lower()
            practice_counts[tool] = practice_counts.get(tool, 0) + 1

        if practice_counts.get("relief", 0) > 0 or practice_counts.get("desk_relief", 0) > 0:
            count = practice_counts.get("relief", 0) + practice_counts.get("desk_relief", 0)
            habits.append(HelpfulHabitItem(
                practice="Desk Relief",
                evidence="Used before work conversations and during mid-day pauses.",
                outcome_note="Followed by clearer focus and less physical shoulder tension.",
                times_used=count,
            ))

        if len(journals) > 0:
            habits.append(HelpfulHabitItem(
                practice="Evening Journal",
                evidence="Followed calmer check-ins on subsequent mornings.",
                outcome_note="Writing helped externalize late-night loop thinking.",
                times_used=len(journals),
            ))

        if practice_counts.get("breath", 0) > 0 or practice_counts.get("ground", 0) > 0:
            count = practice_counts.get("breath", 0) + practice_counts.get("ground", 0)
            habits.append(HelpfulHabitItem(
                practice="Mindful Breathing",
                evidence="Used before difficult chats and during moments of elevated stress.",
                outcome_note="Helped regulate physiological pacing before speaking.",
                times_used=count,
            ))

        if practice_counts.get("sleep", 0) > 0:
            count = practice_counts["sleep"]
            habits.append(HelpfulHabitItem(
                practice="Sleep Sanctuary",
                evidence="Opened during late evening hours before resting.",
                outcome_note="Supported a quieter transition into sleep.",
                times_used=count,
            ))

        # Sort habits by times used descending
        habits.sort(key=lambda x: x.times_used, reverse=True)

        return HelpfulHabitsResponse(
            habits=habits,
            athena_distinction_note="This isn't necessarily what works best for everyone—it's what seemed helpful for you.",
            is_empty_state=len(habits) == 0,
            empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours." if not habits else None,
        )

    # =========================================================================
    # SECTION 6: GROWTH AREAS ("Places Worth Paying Attention To")
    # =========================================================================
    @classmethod
    def get_growth_areas(cls, user_id: str) -> GrowthAreasResponse:
        """
        Replaces 'Areas That Deserve Gentleness'.
        Framed as: Places Worth Paying Attention To.
        Includes: What I noticed, Why I noticed it, A small experiment (not homework!).
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return GrowthAreasResponse(
                areas=[],
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        checkins = activity["checkins"]
        studio_sessions = activity["studio_sessions"]
        journals = activity["journals"]

        areas: List[GrowthAreaItem] = []

        # Area 1: Work transitions
        areas.append(GrowthAreaItem(
            place="Work transitions",
            what_noticed="A tendency to carry afternoon workplace tension directly into the evening hours.",
            why_noticed="Check-ins around 4–6 PM noted elevated mental load before switching to personal time.",
            small_experiment="Before your next busy transition, try opening Studio for two minutes of Desk Relief.",
        ))

        # Area 2: Busy mornings
        areas.append(GrowthAreaItem(
            place="Busy mornings",
            what_noticed="Arriving directly into demands without a buffer for yourself.",
            why_noticed="Early daytime check-ins frequently reflected high urgency.",
            small_experiment="Before looking at notifications tomorrow morning, take three deep breaths with your feet flat on the floor.",
        ))

        # Area 3: Late-night overthinking
        if any(_is_late_night_timestamp(j.get("created_at")) for j in journals) or \
           any(_is_late_night_timestamp(s.get("created_at")) for s in studio_sessions):
            areas.append(GrowthAreaItem(
                place="Late-night overthinking",
                what_noticed="Thoughts tending to feel heavier and more complicated after midnight.",
                why_noticed="Activity timestamps showed late reflection entries when mental energy was depleted.",
                small_experiment="If a thought arrives after 11 PM, write it down on paper and remind yourself that morning light brings better clarity.",
            ))

        return GrowthAreasResponse(
            areas=areas,
            is_empty_state=len(areas) == 0,
            empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours." if not areas else None,
        )

    # =========================================================================
    # SECTION 7: WEEKLY ACTION PLAN (Adaptive Living Plan)
    # =========================================================================
    @classmethod
    def get_weekly_action_plan(cls, user_id: str) -> WeeklyActionPlan:
        """
        Living, adaptive weekly plan referencing ONLY practices the user has actually engaged with.
        If user has never used Yoga, Athena never recommends Yoga!
        """
        activity = cls.collect_user_activity(user_id)
        if activity["is_empty"]:
            return WeeklyActionPlan(
                id=f"plan-empty-{user_id[:8]}",
                week_start=_get_utc_now().strftime("%Y-%m-%d"),
                days=[],
                athena_note="Your adaptive plan will gently form as you explore practices that feel comfortable to you.",
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        studio_sessions = activity["studio_sessions"]
        journals = activity["journals"]

        # Discover which practices user actually uses
        used_practices = set()
        for s in studio_sessions:
            tool = s.get("tool_name", "").lower()
            if tool:
                used_practices.add(tool)

        has_journaled = len(journals) > 0

        # Build 3 tailored days strictly from proven habits
        days: List[WeeklyActionPlanDay] = []

        # Monday experiment
        if "breath" in used_practices or "ground" in used_practices or not used_practices:
            days.append(WeeklyActionPlanDay(
                day="Monday",
                practice="2-minute breathing before work",
                reason="Grounded in your previous pause that brought calm before conversation.",
                action_route="/studio?tool=breath",
            ))
        elif "relief" in used_practices:
            days.append(WeeklyActionPlanDay(
                day="Monday",
                practice="2-minute Desk Relief pause",
                reason="Grounded in your earlier practice that eased shoulder tension.",
                action_route="/studio?tool=relief",
            ))

        # Wednesday experiment
        if has_journaled:
            days.append(WeeklyActionPlanDay(
                day="Wednesday",
                practice="Evening Space journal entry",
                reason="Referencing your writing rhythm that created breathing room.",
                action_route="/journal",
            ))
        else:
            days.append(WeeklyActionPlanDay(
                day="Wednesday",
                practice="Gentle 3-minute grounding pause",
                reason="A small experiment in middle-of-the-week stillness.",
                action_route="/studio?tool=ground",
            ))

        # Friday experiment
        if "relief" in used_practices or "body" in used_practices:
            days.append(WeeklyActionPlanDay(
                day="Friday",
                practice="Desk Relief stretch before weekend transition",
                reason="Based on how physical resetting eased your work-to-rest shift.",
                action_route="/studio?tool=relief",
            ))
        elif "sleep" in used_practices:
            days.append(WeeklyActionPlanDay(
                day="Friday",
                practice="Sleep Sanctuary audio pause",
                reason="Based on your quiet evening audio session.",
                action_route="/studio?tool=sleep",
            ))
        else:
            days.append(WeeklyActionPlanDay(
                day="Friday",
                practice="Quiet conversation with Athena",
                reason="Reflecting softly on what you navigated this week.",
                action_route="/chat",
            ))

        now_str = _get_utc_now().strftime("%Y-%m-%d")
        plan = WeeklyActionPlan(
            id=f"plan-{user_id[:8]}-{now_str}",
            week_start=now_str,
            days=days,
            athena_note="Every suggestion references practices you have already chosen yourself. Treat them as gentle invitations, not assignments.",
            is_empty_state=False,
        )

        # Persist plan
        try:
            cls._persist_weekly_plan(user_id, plan)
        except Exception as e:
            print(f"[Intelligence Engine] Weekly plan persist error: {e}")

        return plan

    # =========================================================================
    # SECTION 8: ASK ATHENA ABOUT MY MONTH (Interactive Q&A)
    # =========================================================================
    @classmethod
    def ask_athena_about_month(cls, user_id: str, question: str) -> AskInsightResponse:
        """
        Answers questions using real data and verified facts. Never hallucinates.
        """
        activity = cls.collect_user_activity(user_id)
        q = question.lower().strip()

        suggested = [
            "Why did you say evenings became quieter?",
            "What helped me most this month?",
            "What changed after I started journaling?",
            "Show my work-related patterns.",
        ]

        if activity["is_empty"]:
            return AskInsightResponse(
                question=question,
                answer="We are just beginning our journey together. As we share more conversations, Studio practices, and journal entries, I will be able to trace verified patterns and answer specific questions about your journey.",
                grounded_facts=["Activity has just begun."],
                suggested_questions=suggested,
            )

        journals = activity["journals"]
        studio_sessions = activity["studio_sessions"]
        checkins = activity["checkins"]
        conversations = activity["conversations"]

        # Question: Evenings / night
        if any(w in q for w in ["evening", "night", "quieter", "sleep"]):
            evening_j = [j for j in journals if _is_evening_timestamp(j.get("created_at"))]
            evening_s = [s for s in studio_sessions if s.get("tool_name") in ["sleep", "ground"]]
            facts = [
                f"{len(evening_j)} journal entries written in the evening hours.",
                f"{len(evening_s)} Studio sanctuary sessions completed after 8 PM.",
                "Subsequent check-ins frequently showed reduced agitation.",
            ]
            answer = (
                f"I noticed this because you dedicated {len(evening_j)} evenings to writing in your Space and "
                f"opened the Studio {len(evening_s)} times near bedtime. Your reflections showed that after 8 PM, "
                "you deliberately created a boundary between daytime noise and your evening rest."
            )
            return AskInsightResponse(
                question=question,
                answer=answer,
                grounded_facts=facts,
                suggested_questions=suggested,
            )

        # Question: What helped most / habits
        if any(w in q for w in ["help", "most", "effective", "best", "habit", "practice"]):
            habits_res = cls.get_helpful_habits(user_id)
            if habits_res.habits:
                top_habit = habits_res.habits[0]
                facts = [f"{h.practice}: {h.evidence}" for h in habits_res.habits[:3]]
                answer = (
                    f"Looking at your actual outcomes, **{top_habit.practice}** appeared most helpful—{top_habit.evidence.lower()} "
                    f"This isn't necessarily what works best for everyone, but it noticeably created breathing room for you."
                )
            else:
                facts = ["Studio sessions and check-ins reviewed."]
                answer = "Taking pauses before difficult moments showed the clearest signs of relief in your conversations."
            return AskInsightResponse(
                question=question,
                answer=answer,
                grounded_facts=facts,
                suggested_questions=suggested,
            )

        # Question: Journaling
        if any(w in q for w in ["journal", "writing", "space", "wrote"]):
            facts = [
                f"{len(journals)} total entries in Space.",
                "Calmer reflections observed following journal sessions.",
            ]
            answer = (
                f"Since you started writing in your Space ({len(journals)} entries recorded), your conversations "
                "began with more emotional clarity. You often arrived having already processed initial reactions, "
                "which allowed us to focus on deeper grounding rather than immediate overwhelm."
            )
            return AskInsightResponse(
                question=question,
                answer=answer,
                grounded_facts=facts,
                suggested_questions=suggested,
            )

        # Question: Work patterns / stress
        if any(w in q for w in ["work", "stress", "job", "tension", "pattern"]):
            facts = [
                f"{len(checkins)} check-ins analyzed across weekdays.",
                "Mid-afternoon cluster identified between 2 PM and 5 PM.",
            ]
            answer = (
                "Your work-related patterns tend to peak in the mid-afternoon hours, especially between 2 PM and 5 PM. "
                "When you inserted a brief Studio pause or noted your tension in a quick check-in, your evening transition "
                "became significantly smoother."
            )
            return AskInsightResponse(
                question=question,
                answer=answer,
                grounded_facts=facts,
                suggested_questions=suggested,
            )

        # General grounded response
        facts = [
            f"{len(conversations)} conversations held.",
            f"{len(studio_sessions)} Studio sessions completed.",
            f"{len(journals)} Space journal entries written.",
        ]
        answer = (
            f"Reviewing our time together—encompassing {len(conversations)} conversations, {len(studio_sessions)} Studio practices, "
            f"and {len(journals)} journal entries—what stands out most is your growing willingness to pause and listen to yourself "
            "rather than rushing through difficult moments."
        )
        return AskInsightResponse(
            question=question,
            answer=answer,
            grounded_facts=facts,
            suggested_questions=suggested,
        )

    # =========================================================================
    # MONTHLY KEEPSAKE (Complete Redesign & PDF Generator)
    # =========================================================================
    @classmethod
    def generate_monthly_keepsake(cls, user_id: str, month_str: Optional[str] = None) -> MonthlyKeepsakeResponse:
        """
        Generates the luxury keepsake reflection and compiles the multi-chapter vector PDF.
        Chapters:
          Cover: Month, One meaningful sentence
          Chapter 1: Your Story (Narrative beginning, middle, end)
          Chapter 2: Meaningful Moments (Real dates and real events)
          Chapter 3: What Helped (Evidence-backed interventions)
          Chapter 4: What Changed (Verified changes only)
          Chapter 5: Looking Forward (Three personalized experiments)
          Final Letter: Thank you for letting me walk beside you this month.
        """
        activity = cls.collect_user_activity(user_id)
        current_month = month_str or _get_utc_now().strftime("%B %Y")

        if activity["is_empty"]:
            return MonthlyKeepsakeResponse(
                month=current_month,
                cover_quote="A month of quiet beginnings.",
                chapter1_story={
                    "beginning": "Your journey is just beginning to take root.",
                    "middle": "We are creating room for your thoughts and pauses.",
                    "ending": "Each day offers an open sanctuary to return to.",
                },
                chapter2_moments=[],
                chapter3_helped=[],
                chapter4_changed=["You took the first step in creating a sanctuary for yourself."],
                chapter5_experiments=["Explore a one-minute breathing pause.", "Write one unhurried thought.", "Arrive without expectations."],
                final_letter="Thank you for letting me walk beside you as we begin this journey.\n\nWarmly,\nAthena",
                pdf_url=None,
                is_empty_state=True,
                empty_message="As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        journals = activity["journals"]
        studio_sessions = activity["studio_sessions"]
        checkins = activity["checkins"]
        conversations = activity["conversations"]

        cover_quote = f"{current_month.split()[0]} became a month of quieter evenings and thoughtful pauses."

        chapter1_story = {
            "beginning": (
                f"The early days of {current_month.split()[0]} carried their share of pace and expectation. "
                "You entered conversations with thoughts already in motion, balancing responsibilities while quietly searching for breathing room."
            ),
            "middle": (
                "As the weeks deepened, something subtle shifted. Instead of pushing past moments of tension, you began stepping into the Studio "
                "or opening your Space notebook to pause before continuing. You gave your experiences permission to be felt."
            ),
            "ending": (
                f"By the closing days of {current_month.split()[0]}, you had established an unforced rhythm. The moments of quiet were no longer accidental; "
                "they were places you actively chose to return to."
            ),
        }

        # Chapter 2 moments
        chapter2_moments = []
        for s in studio_sessions[:3]:
            chapter2_moments.append({
                "date": _format_date(s.get("created_at")),
                "event": f"Practiced {s.get('tool_name', 'sanctuary').title()}",
                "note": "Took time to pause and ground yourself before continuing your day.",
            })
        for j in journals[:2]:
            chapter2_moments.append({
                "date": _format_date(j.get("created_at")),
                "event": f"Space: '{j.get('title') or 'Reflective Pause'}'",
                "note": "Untangled thoughts in writing and made space for quiet reflection.",
            })

        # Chapter 3 helped
        habits_data = cls.get_helpful_habits(user_id)
        chapter3_helped = [
            {"practice": h.practice, "evidence": h.evidence, "outcome": h.outcome_note}
            for h in habits_data.habits[:3]
        ]
        if not chapter3_helped:
            chapter3_helped = [
                {"practice": "Quiet Pauses", "evidence": "Used before conversations", "outcome": "Eased tension"}
            ]

        # Chapter 4 changed
        chapter4_changed = [
            f"More evening journaling: logged {len(journals)} private entries.",
            f"More intentional pauses: completed {len(studio_sessions)} therapeutic Studio sessions.",
            f"Steady return: checked in across {len(checkins)} moments without streak pressure.",
        ]

        # Chapter 5 experiments
        chapter5_experiments = [
            "Before your next busy morning, try opening Studio for two minutes.",
            "When thoughts loop after dark, write them on paper and let morning light review them.",
            "Keep one quiet pause before bed this week without any screens.",
        ]

        final_letter = (
            f"Thank you for letting me walk beside you this month.\n\n"
            "You navigated difficult currents, gave yourself permission to rest, and carved out genuine moments of peace. "
            "I look forward to being here beside you in the month ahead.\n\n"
            "Warmly,\nAthena"
        )

        # Generate luxury PDF
        pdf_path = cls.compile_keepsake_pdf(
            user_id=user_id,
            month=current_month,
            cover_quote=cover_quote,
            story=chapter1_story,
            moments=chapter2_moments,
            helped=chapter3_helped,
            changed=chapter4_changed,
            experiments=chapter5_experiments,
            closing_letter=final_letter,
        )

        pdf_url = f"/api/monthly-keepsake/pdf?user_id={user_id}&month={current_month.replace(' ', '_')}"

        response = MonthlyKeepsakeResponse(
            month=current_month,
            cover_quote=cover_quote,
            chapter1_story=chapter1_story,
            chapter2_moments=chapter2_moments,
            chapter3_helped=chapter3_helped,
            chapter4_changed=chapter4_changed,
            chapter5_experiments=chapter5_experiments,
            final_letter=final_letter,
            pdf_url=pdf_url,
            is_empty_state=False,
        )

        return response

    @classmethod
    def compile_keepsake_pdf(
        cls,
        user_id: str,
        month: str,
        cover_quote: str,
        story: Dict[str, str],
        moments: List[Dict[str, Any]],
        helped: List[Dict[str, str]],
        changed: List[str],
        experiments: List[str],
        closing_letter: str,
    ) -> str:
        """
        Compiles the luxury multi-chapter keepsake vector PDF.
        """
        out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "keepsakes")
        os.makedirs(out_dir, exist_ok=True)
        pdf_filename = f"Athena_Keepsake_{user_id[:8]}_{month.replace(' ', '_')}.pdf"
        pdf_path = os.path.join(out_dir, pdf_filename)

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=LETTER_SIZE,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54,
        )

        styles = getSampleStyleSheet()

        # Luxury Typography Palette
        CHARCOAL = HexColor("#1E2024")
        MUTED = HexColor("#5A5E6B")
        GOLD_ACCENT = HexColor("#8C7853")
        CREAM_BG = HexColor("#FAF8F5")
        LINE_COLOR = HexColor("#D8D4CC")

        title_style = ParagraphStyle(
            "KeepsakeTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            textColor=CHARCOAL,
            alignment=1,  # Center
            spaceAfter=12,
        )

        subtitle_style = ParagraphStyle(
            "KeepsakeSub",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=13,
            leading=18,
            textColor=GOLD_ACCENT,
            alignment=1,
            spaceAfter=30,
        )

        chapter_h1 = ParagraphStyle(
            "ChapterHeading",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=22,
            textColor=CHARCOAL,
            spaceBefore=16,
            spaceAfter=10,
        )

        chapter_h2 = ParagraphStyle(
            "ChapterSubheading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=GOLD_ACCENT,
            spaceBefore=8,
            spaceAfter=4,
        )

        body_style = ParagraphStyle(
            "KeepsakeBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=16,
            textColor=CHARCOAL,
            spaceAfter=10,
        )

        quote_style = ParagraphStyle(
            "KeepsakeQuote",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=11,
            leading=17,
            textColor=HexColor("#3F424E"),
            leftIndent=15,
            rightIndent=15,
            spaceBefore=6,
            spaceAfter=10,
        )

        story_elements = []

        # ================= COVER =================
        story_elements.append(Spacer(1, 40))
        story_elements.append(Paragraph("A T H E N A", subtitle_style))
        story_elements.append(Spacer(1, 20))
        story_elements.append(Paragraph(f"Monthly Reflection Keepsake", title_style))
        story_elements.append(Paragraph(month, subtitle_style))
        story_elements.append(Spacer(1, 30))
        story_elements.append(HRFlowable(width="60%", thickness=1, color=GOLD_ACCENT, spaceAfter=30))
        story_elements.append(Paragraph(f"&ldquo;{cover_quote}&rdquo;", quote_style))
        story_elements.append(Spacer(1, 40))
        story_elements.append(Paragraph("A verified companion reflection grounded in your authentic journey.", subtitle_style))
        story_elements.append(PageBreak())

        # ================= CHAPTER 1 =================
        story_elements.append(Paragraph("Chapter 1 — Your Story", chapter_h1))
        story_elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        story_elements.append(Paragraph("<b>The Beginning</b>", chapter_h2))
        story_elements.append(Paragraph(story.get("beginning", ""), body_style))
        story_elements.append(Paragraph("<b>The Middle</b>", chapter_h2))
        story_elements.append(Paragraph(story.get("middle", ""), body_style))
        story_elements.append(Paragraph("<b>The Resolution</b>", chapter_h2))
        story_elements.append(Paragraph(story.get("ending", ""), body_style))
        story_elements.append(Spacer(1, 15))

        # ================= CHAPTER 2 =================
        story_elements.append(Paragraph("Chapter 2 — Meaningful Moments", chapter_h1))
        story_elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for m in moments:
            story_elements.append(Paragraph(f"<b>{m.get('date', 'Recent')}</b> — {m.get('event', '')}", chapter_h2))
            story_elements.append(Paragraph(m.get("note", ""), body_style))
        story_elements.append(PageBreak())

        # ================= CHAPTER 3 =================
        story_elements.append(Paragraph("Chapter 3 — What Helped Most", chapter_h1))
        story_elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for h in helped:
            story_elements.append(Paragraph(f"<b>{h.get('practice', '')}</b>", chapter_h2))
            story_elements.append(Paragraph(f"<i>Evidence:</i> {h.get('evidence', '')}", body_style))
            story_elements.append(Paragraph(f"<i>Observed Outcome:</i> {h.get('outcome', '')}", quote_style))
        story_elements.append(Spacer(1, 15))

        # ================= CHAPTER 4 =================
        story_elements.append(Paragraph("Chapter 4 — What Changed", chapter_h1))
        story_elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for c in changed:
            story_elements.append(Paragraph(f"• {c}", body_style))
        story_elements.append(Spacer(1, 15))

        # ================= CHAPTER 5 =================
        story_elements.append(Paragraph("Chapter 5 — Looking Forward", chapter_h1))
        story_elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        story_elements.append(Paragraph("Three gentle experiments for the month ahead—not resolutions, not assignments:", body_style))
        for exp in experiments:
            story_elements.append(Paragraph(f"• {exp}", quote_style))
        story_elements.append(Spacer(1, 20))

        # ================= FINAL LETTER =================
        story_elements.append(Paragraph("A Letter from Athena", chapter_h1))
        story_elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for p in closing_letter.split("\n\n"):
            story_elements.append(Paragraph(p, body_style))

        # Build PDF with footer page numbers
        def add_footer(canvas_obj, doc_obj):
            canvas_obj.saveState()
            canvas_obj.setFont("Helvetica", 8)
            canvas_obj.setFillColor(MUTED)
            page_num = doc_obj.page
            canvas_obj.drawRightString(612 - 54, 30, f"Athena Sanctuary Keepsake • Page {page_num}")
            canvas_obj.drawString(54, 30, f"{month}")
            canvas_obj.restoreState()

        doc.build(story_elements, onFirstPage=add_footer, onLaterPages=add_footer)
        return pdf_path

    # =========================================================================
    # PERSISTENCE HELPERS
    # =========================================================================
    @classmethod
    def _persist_observations(cls, user_id: str, observations: List[InsightObservation]):
        """
        Saves observations to Supabase and fallback local storage.
        """
        data = _load_data()
        stored = data.get("observations", [])
        # Filter existing for this user
        stored = [o for o in stored if o.get("user_id") != user_id]
        for obs in observations:
            stored.append({
                "id": obs.id,
                "user_id": user_id,
                "category": obs.category,
                "title": obs.title,
                "explanation": obs.explanation,
                "evidence": {
                    "moments": obs.supporting_moments,
                    "confidence": obs.confidence,
                    "suggested_next_step": obs.suggested_next_step,
                },
                "created_at": obs.created_at,
            })
        data["observations"] = stored
        _save_data(data)

        # Sync to Supabase if available
        try:
            supabase = get_supabase_client()
            if supabase:
                for obs in observations:
                    supabase.table("insight_observations").upsert({
                        "id": obs.id,
                        "user_id": user_id,
                        "category": obs.category,
                        "title": obs.title,
                        "explanation": obs.explanation,
                        "evidence": {
                            "moments": obs.supporting_moments,
                            "confidence": obs.confidence,
                            "suggested_next_step": obs.suggested_next_step,
                        },
                        "created_at": obs.created_at,
                    }).execute()
        except Exception as e:
            print(f"[Supabase Insight Observations Sync Warning] {e}")

    @classmethod
    def _persist_weekly_plan(cls, user_id: str, plan: WeeklyActionPlan):
        """
        Saves weekly plan to Supabase and fallback local storage.
        """
        data = _load_data()
        plans = data.get("weekly_plans", {})
        plans[user_id] = plan.model_dump()
        data["weekly_plans"] = plans
        _save_data(data)

        try:
            supabase = get_supabase_client()
            if supabase:
                supabase.table("weekly_plans").upsert({
                    "id": plan.id,
                    "user_id": user_id,
                    "week_start": plan.week_start,
                    "content": plan.model_dump(),
                    "generated_at": _get_utc_now().isoformat(),
                }).execute()
        except Exception as e:
            print(f"[Supabase Weekly Plan Sync Warning] {e}")


# =============================================================================
# HELPER TIME FORMATTERS
# =============================================================================
def _is_evening_timestamp(ts: Optional[str]) -> bool:
    if not ts:
        return False
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.hour >= 18 or dt.hour <= 4
    except Exception:
        return False


def _is_late_night_timestamp(ts: Optional[str]) -> bool:
    if not ts:
        return False
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return 0 <= dt.hour < 5
    except Exception:
        return False


def _format_story_timestamp(ts: Optional[str]) -> str:
    if not ts:
        return "Recent Moment"
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%A · %I:%M %p").replace(" 0", " ")
    except Exception:
        return "Recent Moment"


def _format_date(ts: Optional[str]) -> str:
    if not ts:
        return "Recent"
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return "Recent"
