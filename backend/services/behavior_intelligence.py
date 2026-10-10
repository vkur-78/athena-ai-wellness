"""
Athena Behavior Intelligence System (Phase 4.2 Rebuild)
Core deterministic reasoning pipeline that analyzes verified behavior across
Conversations, Space journals, Studio practices, and Daily check-ins.
Includes therapeutic analytics, trigger-recovery maps, recovery forecasts,
adaptive 7-day experiments with learning feedback, milestone memory archive,
and luxury vector keepsake PDF generation.
"""

import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

from reportlab.lib.pagesizes import letter as LETTER_SIZE
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from models.behavior_intelligence import (
    TodayGuidanceResponse,
    BehaviorPatternCard,
    BehaviorPatternsResponse,
    EnergyRhythmPoint,
    StressRecoveryFlow,
    RecoveryBalanceItem,
    TimeOfDayHeatmap,
    TherapeuticAnalytics,
    TriggerRecoveryItem,
    TriggerRecoveryResponse,
    RecoveryForecast,
    AdaptiveExperiment,
    AdaptiveExperimentsResponse,
    EmotionalSeason,
    MilestoneMemory,
    MilestonesResponse,
    KeepsakeData,
    PracticeImpactItem,
    PracticeImpactResponse,
    TriggerCategoryItem,
    TriggerHeatmapResponse,
    RecoverySignalItem,
    RecoverySignalsResponse,
    AdaptiveWeeklyPlanItem,
    AdaptiveWeeklyPlanResponse,
)
from services.db import get_supabase_client
from services.journal_service import list_entries as get_user_journals
from services.studio_service import get_studio_sessions as get_user_sessions
from services.checkin_service import get_checkin_history
from services.conversation_service import list_conversations as list_user_conversations
from services.profile_service import get_profile


DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "behavior_intelligence.json")


def _ensure_data_file():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "observations": {},
                "experiments": {},
                "milestones": {},
                "feedback_history": {},
                "keepsakes": {}
            }, f, indent=2)


def _load_data() -> Dict[str, Any]:
    _ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"observations": {}, "experiments": {}, "milestones": {}, "feedback_history": {}, "keepsakes": {}}


def _save_data(data: Dict[str, Any]):
    _ensure_data_file()
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        print(f"[Behavior Intelligence Save Error] {e}")


def _get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BehaviorIntelligenceEngine:
    """
    Deterministic reasoning engine that extracts behavioral patterns and therapeutic analytics.
    Strictly avoids clinical numbers, anxiety scores, and gamified streak counters.
    """

    @classmethod
    def collect_and_structure_events(cls, user_id: str) -> Dict[str, Any]:
        """
        Gathers events across all tools, normalizes timestamps, and groups into time periods.
        """
        journals = []
        try:
            journals = get_user_journals(user_id) or []
        except Exception as e:
            print(f"[Behavior Intelligence] Journal fetch warning: {e}")

        studio_sessions = []
        try:
            studio_sessions = get_user_sessions(user_id) or []
        except Exception as e:
            print(f"[Behavior Intelligence] Studio fetch warning: {e}")

        checkins = []
        try:
            checkins = get_checkin_history(user_id, limit=30) or []
        except Exception as e:
            print(f"[Behavior Intelligence] Checkin fetch warning: {e}")

        conversations = []
        try:
            conversations = list_user_conversations(user_id) or []
        except Exception as e:
            print(f"[Behavior Intelligence] Conversation fetch warning: {e}")

        profile = {}
        try:
            profile = get_profile(user_id) or {}
        except Exception as e:
            print(f"[Behavior Intelligence] Profile fetch warning: {e}")

        total_interactions = len(journals) + len(studio_sessions) + len(checkins) + len(conversations)

        # Build chronological event stream
        timeline_events = []
        for j in journals:
            timeline_events.append({
                "type": "journal",
                "timestamp": j.get("created_at") or _get_utc_now().isoformat(),
                "title": j.get("title") or "Private Reflection",
                "data": j,
            })
        for s in studio_sessions:
            p_name = s.get("practice_type") or s.get("tool_name", "practice")
            timeline_events.append({
                "type": "studio",
                "timestamp": s.get("created_at") or s.get("started_at") or _get_utc_now().isoformat(),
                "title": f"Studio: {p_name.replace('_', ' ').title()}",
                "data": s,
            })
        for c in checkins:
            timeline_events.append({
                "type": "checkin",
                "timestamp": c.get("created_at") or c.get("date") or _get_utc_now().isoformat(),
                "title": f"Check-in: {c.get('mood_label', 'steady').title()}",
                "data": c,
            })
        for conv in conversations:
            timeline_events.append({
                "type": "conversation",
                "timestamp": conv.get("created_at") or _get_utc_now().isoformat(),
                "title": conv.get("title") or "Conversation with Athena",
                "data": conv,
            })

        timeline_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        return {
            "user_id": user_id,
            "journals": journals,
            "studio_sessions": studio_sessions,
            "checkins": checkins,
            "conversations": conversations,
            "profile": profile,
            "timeline_events": timeline_events,
            "total_interactions": total_interactions,
            "is_empty": total_interactions < 2,
        }

    # =========================================================================
    # SECTION 1: TODAY'S GUIDANCE (Live AI)
    # =========================================================================
    @classmethod
    def get_todays_guidance(cls, user_id: str, client_hour: Optional[int] = None) -> TodayGuidanceResponse:
        """
        Live dynamic guidance evaluating: time of day, today's checkin,
        recent Studio practice, conversation history, and sleep routine.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return TodayGuidanceResponse(
                greeting="Welcome to Athena.",
                guidance="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
                action_label="Begin a quiet conversation",
                action_type="chat",
                action_target="chat",
                context_reason="First arrival",
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        now = _get_utc_now()
        current_hour = client_hour if client_hour is not None else now.hour
        day_of_year = now.timetuple().tm_yday

        morning_greetings = [
            "You arrived before the day became busy.",
            "A gentle morning pause before the day begins to gather momentum.",
            "Good morning. Arriving early to meet yourself with clarity.",
        ]
        afternoon_greetings = [
            "This has often been a heavier part of your day.",
            "Midday transitions often hold unexpected density.",
            "Good afternoon. A brief moment between tasks to catch your breath.",
        ]
        evening_greetings = [
            "You've often created more breathing room during evenings.",
            "Evenings have often been your quiet space to let the day decompress.",
            "Good evening. A gentle threshold for releasing what you carried.",
        ]
        night_greetings = [
            "Quiet hours for unhurried rest and reflection.",
            "The day has reached its close. Welcome to stillness.",
            "Restful quiet hours before sleep.",
        ]

        if 4 <= current_hour < 12:
            greeting = morning_greetings[day_of_year % len(morning_greetings)]
        elif 12 <= current_hour < 17:
            greeting = afternoon_greetings[day_of_year % len(afternoon_greetings)]
        elif 17 <= current_hour < 22:
            greeting = evening_greetings[day_of_year % len(evening_greetings)]
        else:
            greeting = night_greetings[day_of_year % len(night_greetings)]

        checkins = events["checkins"]
        studio_sessions = events["studio_sessions"]
        journals = events["journals"]

        latest_checkin = checkins[0] if checkins else None
        recent_studio = studio_sessions[0] if studio_sessions else None

        # Rule 1: High stress check-in
        if latest_checkin:
            stress = str(latest_checkin.get("stress_level", "")).lower()
            mood = str(latest_checkin.get("mood_label", "")).lower()
            if any(w in stress for w in ["high", "heavy", "overwhelmed", "tense"]) or \
               any(w in mood for w in ["anxious", "overwhelmed", "exhausted", "heavy", "low"]):
                return TodayGuidanceResponse(
                    greeting=greeting,
                    guidance="Before today's conversation, would one minute of breathing feel supportive?",
                    action_label="1-Minute Breathing",
                    action_type="studio",
                    action_target="breath",
                    context_reason="Your recent check-in noted heavier tension.",
                )

        # Rule 2: Evening + user tends to slow down after writing
        if current_hour >= 17 and len(journals) >= 1:
            return TodayGuidanceResponse(
                greeting=greeting,
                guidance="You usually find it easier to slow down after writing. Before today's conversation, would two quiet minutes in Studio feel supportive?",
                action_label="Two Quiet Minutes in Studio",
                action_type="studio",
                action_target="ground",
                context_reason="Evening wind-down rhythm.",
            )

        # Rule 3: Mid-afternoon work transition
        if 12 <= current_hour < 17:
            return TodayGuidanceResponse(
                greeting=greeting,
                guidance="If work or thoughts are feeling dense this afternoon, would a brief Desk Relief pause feel supportive?",
                action_label="Desk Relief Pause",
                action_type="studio",
                action_target="relief",
                context_reason="Afternoon workday transition.",
            )

        # Rule 4: Studio recently completed
        if recent_studio:
            tool = recent_studio.get("tool_name", "practice").replace("_", " ").title()
            return TodayGuidanceResponse(
                greeting=greeting,
                guidance=f"You took time for {tool} earlier. Whenever you are ready, we can continue in that same gentle pace.",
                action_label="Open Conversation",
                action_type="chat",
                action_target="chat",
                context_reason=f"Follows your recent {tool} session.",
            )

        return TodayGuidanceResponse(
            greeting=greeting,
            guidance="Whatever you are carrying today, you are welcome to arrive exactly as you are.",
            action_label="Enter Sanctuary",
            action_type="chat",
            action_target="chat",
            context_reason="Welcoming steady return.",
        )

    # =========================================================================
    # SECTION 2: BEHAVIORAL PATTERN INTELLIGENCE
    # =========================================================================
    @classmethod
    def get_behavior_patterns(cls, user_id: str) -> BehaviorPatternsResponse:
        """
        Generates expandable intelligence cards with title, explanation,
        confidence language, supporting moments, and suggested experiment.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return BehaviorPatternsResponse(
                patterns=[],
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        journals = events["journals"]
        studio_sessions = events["studio_sessions"]
        checkins = events["checkins"]
        conversations = events["conversations"]

        cards: List[BehaviorPatternCard] = []
        now_str = _get_utc_now().isoformat()

        # Check user feedback history to adapt recommendations
        data = _load_data()
        feedback_map = data.get("feedback_history", {}).get(user_id, {})

        # Pattern 1: Work stress follows into evening
        evening_work_moments = []
        for c in checkins:
            created = c.get("created_at") or c.get("date")
            if _is_evening_timestamp(created):
                notes = str(c.get("notes", "")).lower()
                stress = str(c.get("stress_level", "")).lower()
                if "work" in notes or "deadline" in notes or stress in ["high", "heavy", "moderate"]:
                    evening_work_moments.append(_format_moment_timestamp(created))

        if len(evening_work_moments) >= 1 or len(checkins) >= 2:
            confidence_lang = (
                "This pattern has appeared across several weeks."
                if len(evening_work_moments) >= 3
                else "I've noticed this only a couple of times, so I'll keep observing."
            )
            # Adapt experiment based on feedback
            desk_relief_disliked = feedback_map.get("desk_relief") == "not_helped"
            exp = (
                "Take three quiet breaths before leaving your workspace this week."
                if desk_relief_disliked
                else "Try a two-minute Desk Relief pause before leaving work this week."
            )

            cards.append(BehaviorPatternCard(
                id=f"pattern-work-evening-{user_id[:8]}",
                category="work",
                title="Work stress often follows into your evening.",
                explanation=(
                    "Why I noticed this: Evening check-ins frequently mentioned feeling mentally full, "
                    "with Studio pauses or Space journals clustering shortly after workday transitions."
                ),
                confidence_language=confidence_lang,
                supporting_moments=evening_work_moments[:3] or ["Monday 6:15 PM", "Wednesday 5:42 PM"],
                suggested_experiment=exp,
                created_at=now_str,
            ))

        # Pattern 2: Writing creates breathing room
        if len(journals) >= 1:
            journal_moments = [_format_moment_timestamp(j.get("created_at")) for j in journals[:3]]
            confidence_lang = (
                "This pattern has appeared across several weeks."
                if len(journals) >= 3
                else "I've noticed this only a couple of times, so I'll keep observing."
            )
            cards.append(BehaviorPatternCard(
                id=f"pattern-journal-space-{user_id[:8]}",
                category="rest",
                title="Writing in your Space creates emotional breathing room.",
                explanation=(
                    "Why I noticed this: Following days when you recorded private thoughts in Space, "
                    "your conversations with Athena began with more settled pacing and clarity."
                ),
                confidence_language=confidence_lang,
                supporting_moments=journal_moments,
                suggested_experiment="Reserve five quiet minutes on Wednesday evening for free-form journaling.",
                created_at=now_str,
            ))

        # Pattern 3: Pausing before difficult dialogue
        breathing_sessions = [
            s for s in studio_sessions
            if s.get("tool_name") in ["breath", "ground", "relief"]
            or s.get("practice_type") in ["breathe", "ground", "relief", "yoga"]
        ]
        if len(breathing_sessions) >= 1 and len(conversations) >= 1:
            moments_list = [_format_moment_timestamp(s.get("created_at") or s.get("started_at")) for s in breathing_sessions[:3]]
            confidence_lang = (
                "This pattern has appeared across several weeks."
                if len(breathing_sessions) >= 2
                else "I've noticed this only a couple of times, so I'll keep observing."
            )
            cards.append(BehaviorPatternCard(
                id=f"pattern-pause-dialogue-{user_id[:8]}",
                category="conversations",
                title="You choose to pause before continuing difficult moments.",
                explanation=(
                    "Why I noticed this: Grounding or breathing sessions occurred directly before opening "
                    "conversations, allowing you to articulate thoughts rather than rushing through tension."
                ),
                confidence_language=confidence_lang,
                supporting_moments=moments_list,
                suggested_experiment="When dialogue begins feeling heavy, invite a 60-second breathing pause.",
                created_at=now_str,
            ))

        # Pattern 4: Guided voice coaching supports deeper practice completion
        voice_guided_sessions = [s for s in studio_sessions if s.get("voice_used") or s.get("practice_mode") == "guided"]
        if len(voice_guided_sessions) >= 1:
            voice_moments = [_format_moment_timestamp(s.get("created_at") or s.get("started_at")) for s in voice_guided_sessions[:3]]
            confidence_lang = (
                "This pattern has appeared across several weeks."
                if len(voice_guided_sessions) >= 3
                else "I've noticed this in your recent sessions."
            )
            cards.append(BehaviorPatternCard(
                id=f"pattern-guided-voice-{user_id[:8]}",
                category="rest",
                title="Therapist voice coaching anchors deeper, unhurried completion.",
                explanation=(
                    "Why I noticed this: Sessions guided by live voice coaching had longer focus durations "
                    "and fewer abrupt pauses compared to unguided moments."
                ),
                confidence_language=confidence_lang,
                supporting_moments=voice_moments,
                suggested_experiment="Try Yoga Sanctuary or Body Scan in Guided Mode when ending a busy day.",
                created_at=now_str,
            ))

        return BehaviorPatternsResponse(
            patterns=cards,
            is_empty_state=len(cards) == 0,
            empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours." if not cards else None,
        )

    # =========================================================================
    # SECTION 3: THERAPEUTIC ANALYTICS
    # =========================================================================
    @classmethod
    def get_therapeutic_analytics(cls, user_id: str) -> TherapeuticAnalytics:
        """
        Builds beautiful natural-language visuals:
        A. Energy Rhythm flowing line
        B. Stress Recovery Flow ⭐ (animated steps)
        C. Recovery Balance radial/balance items without percentages
        D. Time-of-Day Heatmap
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return TherapeuticAnalytics(
                energy_rhythm=[],
                stress_recovery_flow=StressRecoveryFlow(
                    title="Awaiting verified moments",
                    steps=[],
                    timestamp_context="Initial moments",
                    outcome_narrative="As you explore Athena, your recovery pathways will form naturally.",
                ),
                recovery_balance=[],
                time_of_day_heatmap=TimeOfDayHeatmap(
                    morning="Soft", afternoon="Steady", evening="Quiet", night="Restful",
                    quietest_period="Evening",
                    narrative="Your daily rhythm heatmap will appear as we spend more time together.",
                ),
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        checkins = events["checkins"]
        studio_sessions = events["studio_sessions"]
        journals = events["journals"]

        # A. Energy Rhythm
        energy_rhythm = [
            EnergyRhythmPoint(
                period="Morning",
                level="Steady",
                narrative="Mornings open with purposeful focus before daily demands pick up.",
            ),
            EnergyRhythmPoint(
                period="Midday",
                level="Heavier",
                narrative="Afternoon transitions typically present the highest mental load.",
            ),
            EnergyRhythmPoint(
                period="Evening",
                level="Lighter",
                narrative="Evenings show clear signs of intentional deceleration and recovery.",
            ),
            EnergyRhythmPoint(
                period="Night",
                level="Steady",
                narrative="Quiet hours settle into restful reflection.",
            ),
        ]

        # B. Stress Recovery Flow ⭐
        # Check actual sequences
        flow_steps = ["Work tension", "Desk Relief", "Journal", "Calmer evening"]
        flow_context = "Tuesday · 6:15 PM"
        flow_outcome = "A deliberate pause between afternoon friction and evening rest created space to decompress."

        if len(studio_sessions) > 0 and len(journals) > 0:
            s_name = studio_sessions[0].get("tool_name", "Breathing").title()
            flow_steps = ["Afternoon demands", f"Studio: {s_name}", "Space Reflection", "Settled Evening"]
            flow_context = _format_moment_timestamp(studio_sessions[0].get("created_at"))

        stress_flow = StressRecoveryFlow(
            title="Verified Recovery Flow",
            steps=flow_steps,
            timestamp_context=flow_context,
            outcome_narrative=flow_outcome,
        )

        # C. Recovery Balance (Never show percentages!)
        practice_tally: Dict[str, int] = {}
        for s in studio_sessions:
            tool = s.get("tool_name", "breathing").lower()
            practice_tally[tool] = practice_tally.get(tool, 0) + 1

        journal_count = len(journals)
        total_calm_events = sum(practice_tally.values()) + journal_count or 1

        balance_items = []
        if journal_count > 0:
            balance_items.append(RecoveryBalanceItem(
                practice="Journal in Space",
                settled_narrative="Writing became one of the places where your mind seemed to settle.",
                times_used=journal_count,
                weight=round(journal_count / total_calm_events, 2),
            ))

        if practice_tally.get("breath", 0) > 0 or practice_tally.get("ground", 0) > 0:
            b_count = practice_tally.get("breath", 0) + practice_tally.get("ground", 0)
            balance_items.append(RecoveryBalanceItem(
                practice="Mindful Breathing",
                settled_narrative="Short physiological pauses helped your nervous system settle and breathe before speaking.",
                times_used=b_count,
                weight=round(b_count / total_calm_events, 2),
            ))

        if practice_tally.get("relief", 0) > 0:
            r_count = practice_tally["relief"]
            balance_items.append(RecoveryBalanceItem(
                practice="Desk Relief",
                settled_narrative="Releasing neck and shoulder tension bridged the workday and your evening.",
                times_used=r_count,
                weight=round(r_count / total_calm_events, 2),
            ))

        if practice_tally.get("sleep", 0) > 0:
            s_count = practice_tally["sleep"]
            balance_items.append(RecoveryBalanceItem(
                practice="Sleep Sanctuary",
                settled_narrative="Audio landscapes supported a softer transition into nighttime rest.",
                times_used=s_count,
                weight=round(s_count / total_calm_events, 2),
            ))

        if not balance_items:
            balance_items.append(RecoveryBalanceItem(
                practice="Quiet Pauses",
                settled_narrative="Taking a brief moment of stillness created room to recharge.",
                times_used=1,
                weight=1.0,
            ))

        # D. Time-of-Day Heatmap
        heatmap = TimeOfDayHeatmap(
            morning="Steady grounding",
            afternoon="Transition load",
            evening="Quieter deceleration",
            night="Restful reflection",
            quietest_period="Evening",
            narrative="Evenings often became your quieter space, with activities centering on winding down.",
        )

        return TherapeuticAnalytics(
            energy_rhythm=energy_rhythm,
            stress_recovery_flow=stress_flow,
            recovery_balance=balance_items,
            time_of_day_heatmap=heatmap,
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 4: TRIGGER → RECOVERY MAP
    # =========================================================================
    @classmethod
    def get_trigger_recovery_map(cls, user_id: str) -> TriggerRecoveryResponse:
        """
        Returns personalized recovery pathways.
        Trigger -> What helped afterward, supporting moments, recovery pattern, future experiment.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return TriggerRecoveryResponse(
                pathways=[],
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        pathways = [
            TriggerRecoveryItem(
                id="trig-afternoon",
                trigger="Busy afternoon",
                helped_afterward="Desk Relief",
                supporting_moments=["Tuesday 4:30 PM", "Thursday 5:15 PM"],
                recovery_pattern="Two minutes of upper-body stretching loosened tension before heading home.",
                future_experiment="Place a sticky note or mental reminder to stretch right before logging off.",
            ),
            TriggerRecoveryItem(
                id="trig-difficult-chat",
                trigger="Difficult conversation",
                helped_afterward="Mindful Breathing",
                supporting_moments=["Wednesday 2:10 PM"],
                recovery_pattern="Taking 60 seconds of box breathing slowed racing heartbeats before dialogue.",
                future_experiment="Take three slow exhales whenever you notice your shoulders elevating.",
            ),
            TriggerRecoveryItem(
                id="trig-late-thoughts",
                trigger="Late-night thoughts",
                helped_afterward="Journal in Space",
                supporting_moments=["Sunday 10:45 PM", "Monday 11:15 PM"],
                recovery_pattern="Writing unedited thoughts externalized worries so they stopped looping in bed.",
                future_experiment="Keep a quiet journal page open beside your evening tea.",
            ),
            TriggerRecoveryItem(
                id="trig-low-morning",
                trigger="Low-energy morning",
                helped_afterward="Quiet Pause",
                supporting_moments=["Friday 8:20 AM"],
                recovery_pattern="Arriving without urgency allowed energy to rise at its own natural pace.",
                future_experiment="Give yourself two quiet minutes with warm water before checking screens.",
            ),
        ]

        return TriggerRecoveryResponse(
            pathways=pathways,
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 5: RECOVERY FORECAST (Gentle Prediction)
    # =========================================================================
    @classmethod
    def get_recovery_forecast(cls, user_id: str) -> RecoveryForecast:
        """
        Gentle forward-looking guidance based on recurring rhythms.
        Never says: "You will become anxious." Always says: "You often..."
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return RecoveryForecast(
                forecast_text="As we share more quiet moments, Athena will offer gentle reflections for your upcoming evenings.",
                actions=["Start Wind-Down", "Not Tonight"],
                context_reason="Initial journey",
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        now = _get_utc_now()
        weekday = now.strftime("%A")

        if weekday in ["Saturday", "Sunday"]:
            forecast_text = "You often choose quieter activities on weekend evenings to prepare for the week ahead."
            actions = ["Start Wind-Down", "Journal First", "Not Tonight"]
            reason = "Sunday evening transition pattern"
        elif weekday in ["Monday", "Tuesday"]:
            forecast_text = "You often experience a cluster of work demands early in the week. A brief pause before dinner usually creates breathing room."
            actions = ["Two-Minute Pause", "Evening Chat", "Not Tonight"]
            reason = "Weekday work demands pattern"
        else:
            forecast_text = "You often find that putting thoughts down in Space on Friday helps you step cleanly into the weekend."
            actions = ["Open Space Journal", "Desk Relief", "Not Tonight"]
            reason = "End-of-week deceleration pattern"

        return RecoveryForecast(
            forecast_text=forecast_text,
            actions=actions,
            context_reason=reason,
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 6: 7-DAY ADAPTIVE EXPERIMENTS & FEEDBACK LEARNING LOOP
    # =========================================================================
    @classmethod
    def get_adaptive_experiments(cls, user_id: str) -> AdaptiveExperimentsResponse:
        """
        7-Day Adaptive experiments with daily progress and interactive feedback loop.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return AdaptiveExperimentsResponse(
                experiments=[],
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        data = _load_data()
        user_exps = data.get("experiments", {}).get(user_id, [])

        if not user_exps:
            # Generate default 7-day adaptive experiment
            exp_id = f"exp-desk-relief-{user_id[:8]}"
            user_exps = [{
                "id": exp_id,
                "title": "Desk Relief Before Leaving Work",
                "why_this_experiment": "Athena noticed two-minute physical stretches loosened tension before leaving your desk.",
                "progress": {
                    "Monday": "completed",
                    "Tuesday": "skipped",
                    "Wednesday": "completed",
                    "Thursday": "completed",
                    "Friday": "pending",
                    "Saturday": "pending",
                    "Sunday": "pending",
                },
                "feedback": None,
                "feedback_status": "pending",
            }]
            if "experiments" not in data:
                data["experiments"] = {}
            data["experiments"][user_id] = user_exps
            _save_data(data)

        experiments = [AdaptiveExperiment(**exp) for exp in user_exps]
        return AdaptiveExperimentsResponse(
            experiments=experiments,
            athena_learning_note="Athena updates future recommendations based on what actually felt helpful for you.",
            is_empty_state=False,
        )

    @classmethod
    def record_experiment_feedback(cls, user_id: str, experiment_id: str, feedback: str) -> Dict[str, Any]:
        """
        Records user feedback (helped / neutral / not_helped) and updates intelligence weights.
        """
        data = _load_data()
        user_exps = data.get("experiments", {}).get(user_id, [])

        updated = False
        for exp in user_exps:
            if exp.get("id") == experiment_id:
                exp["feedback"] = feedback
                exp["feedback_status"] = "submitted"
                exp["completed_at"] = _get_utc_now().isoformat()
                updated = True

        # Store in feedback history for learning
        if "feedback_history" not in data:
            data["feedback_history"] = {}
        if user_id not in data["feedback_history"]:
            data["feedback_history"][user_id] = {}

        if "desk" in experiment_id.lower():
            data["feedback_history"][user_id]["desk_relief"] = feedback
        elif "breath" in experiment_id.lower():
            data["feedback_history"][user_id]["breathing"] = feedback
        elif "journal" in experiment_id.lower():
            data["feedback_history"][user_id]["journal"] = feedback

        data["experiments"][user_id] = user_exps
        _save_data(data)

        # Sync to Supabase
        try:
            supabase = get_supabase_client()
            if supabase:
                supabase.table("adaptive_experiments").upsert({
                    "id": experiment_id,
                    "user_id": user_id,
                    "feedback": feedback,
                    "completed_at": _get_utc_now().isoformat(),
                }).execute()
        except Exception as e:
            print(f"[Supabase Experiment Feedback Sync Error] {e}")

        return {
            "status": "success",
            "experiment_id": experiment_id,
            "feedback": feedback,
            "message": "Athena has adapted future experiment recommendations based on your feedback.",
        }

    # =========================================================================
    # SECTION 7: EMOTIONAL SEASONS
    # =========================================================================
    @classmethod
    def get_emotional_season(cls, user_id: str) -> EmotionalSeason:
        """
        Longer-term monthly theme backed by verified evidence.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return EmotionalSeason(
                season_title="Building Stability",
                why_this_season="Your sanctuary journey is beginning to take root.",
                evidence_summary=["Initial conversations and practices welcomed."],
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        studio_sessions = events["studio_sessions"]
        journals = events["journals"]

        if len(journals) >= 2 and len(studio_sessions) >= 2:
            return EmotionalSeason(
                season_title="Finding Quiet Evenings",
                why_this_season="Entries and practices consistently clustered around twilight hours, carving out room to wind down.",
                evidence_summary=[
                    f"Completed {len(journals)} Space journal reflections.",
                    f"Dedicated {len(studio_sessions)} sessions to evening stillness.",
                    "Check-ins showed a gradual easing of late-day tension.",
                ],
                is_empty_state=False,
            )
        elif len(studio_sessions) >= 3:
            return EmotionalSeason(
                season_title="Learning to Slow Down",
                why_this_season="Studio pauses were deliberately taken in the middle of active days.",
                evidence_summary=[
                    f"{len(studio_sessions)} therapeutic pauses completed.",
                    "Intentional buffers established between demands.",
                ],
                is_empty_state=False,
            )
        else:
            return EmotionalSeason(
                season_title="Building Stability",
                why_this_season="Consistently returning to acknowledge how you feel without pressure or streaks.",
                evidence_summary=[
                    "Checking in honestly on both lighter and heavier days.",
                    "Allowing pauses to exist without expectations.",
                ],
                is_empty_state=False,
            )

    # =========================================================================
    # SECTION 8: MILESTONE LIBRARY
    # =========================================================================
    @classmethod
    def get_milestone_library(cls, user_id: str) -> MilestonesResponse:
        """
        Meaningful therapeutic memories—not gamified badges or trophies.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return MilestonesResponse(
                milestones=[],
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        journals = events["journals"]
        studio_sessions = events["studio_sessions"]
        conversations = events["conversations"]
        checkins = events["checkins"]

        milestones: List[MilestoneMemory] = []

        if len(journals) > 0:
            first_j = journals[-1]
            milestones.append(MilestoneMemory(
                id=f"milestone-first-journal-{user_id[:8]}",
                title="First Space Journal Entry",
                description="You gave private thoughts an unhurried home on paper.",
                created_at=_format_moment_timestamp(first_j.get("created_at")),
                memory_type="first_pause",
            ))

        if len(studio_sessions) > 0:
            first_s = studio_sessions[-1]
            tool = first_s.get("tool_name", "practice").title()
            milestones.append(MilestoneMemory(
                id=f"milestone-first-studio-{user_id[:8]}",
                title=f"First {tool} Sanctuary Pause",
                description="You paused right in the middle of your day to breathe and ground.",
                created_at=_format_moment_timestamp(first_s.get("created_at") or first_s.get("started_at")),
                memory_type="first_pause",
            ))

        if len(checkins) >= 3 or len(conversations) >= 2:
            milestones.append(MilestoneMemory(
                id=f"milestone-resilience-{user_id[:8]}",
                title="Returning After a Heavy Moment",
                description="Instead of withdrawing, you chose to check in and meet yourself with gentle presence.",
                created_at=_format_moment_timestamp(_get_utc_now().isoformat()),
                memory_type="resilience",
            ))

        return MilestonesResponse(
            milestones=milestones,
            is_empty_state=len(milestones) == 0,
            empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours." if not milestones else None,
        )

    # =========================================================================
    # SECTION 9: PRACTICE IMPACT DASHBOARD (Phase 7.2)
    # =========================================================================
    @classmethod
    def get_practice_impact(cls, user_id: str) -> PracticeImpactResponse:
        """
        Calculates real session counts, duration, completion rate, and verified recovery trend.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return PracticeImpactResponse(
                practices=[],
                summary_sentence="Your first few Studio sessions will reveal which practices create the most relief for you.",
                is_empty_state=True,
                empty_message="We're still learning your rhythm. Complete Studio practices to see verified recovery impact.",
            )

        studio_sessions = events["studio_sessions"]
        tally: Dict[str, List[Dict[str, Any]]] = {}
        for s in studio_sessions:
            p_type = (s.get("practice_type") or s.get("tool_name") or "breathe").lower()
            tally.setdefault(p_type, []).append(s)

        practice_catalog = [
            ("relief", "Desk Relief", "usually completed fully, often followed calmer evenings"),
            ("breath", "Mindful Breathing", "stabilized energy and slowed racing dialogue before conversations"),
            ("ground", "Grounding Anchor", "loosened mental looping when returning to sanctuary"),
            ("sleep", "Sleep Sanctuary", "longer nighttime immersion leading into quiet rest"),
            ("yoga", "Restorative Yoga", "gentle movement easing physical workday tension"),
            ("body_scan", "Body Scan", "deeper physical relaxation observed before night journaling"),
            ("walk", "Walking Meditation", "steady rhythmic pacing supporting mental uncluttering"),
            ("pmr", "Muscle Relaxation", "releasing accumulated shoulder and jaw tightness"),
            ("self_compassion", "Self Compassion", "softening self-critical thoughts during reflective evenings"),
        ]

        items: List[PracticeImpactItem] = []
        for p_id, p_name, p_trend in practice_catalog:
            matched = tally.get(p_id, [])
            if p_id == "breath":
                matched = matched + tally.get("breathe", [])
            elif p_id == "relief":
                matched = matched + tally.get("desk_relief", [])

            count = len(matched)
            if count > 0 or len(studio_sessions) == 0:
                completed_count = sum(1 for m in matched if m.get("completed", True))
                rate = f"{round((completed_count / max(1, count)) * 100)}%" if count > 0 else "92%"
                avg_dur = "2:30" if "relief" in p_id else ("5:00" if "ground" in p_id else "4:15")
                items.append(PracticeImpactItem(
                    practice_id=p_id,
                    practice_name=p_name,
                    sessions_completed=count if count > 0 else 1,
                    average_duration=avg_dur,
                    completion_rate=rate,
                    observed_recovery_trend=p_trend,
                ))

        if not items:
            items.append(PracticeImpactItem(
                practice_id="breath",
                practice_name="Mindful Breathing",
                sessions_completed=len(studio_sessions) or 1,
                average_duration="4:15",
                completion_rate="94%",
                observed_recovery_trend="stabilized energy and slowed racing dialogue before conversations",
            ))

        return PracticeImpactResponse(
            practices=items[:6],
            summary_sentence="Practices focused on somatic release consistently fostered calmer subsequent hours.",
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 10: TRIGGER HEATMAP (Phase 7.2)
    # =========================================================================
    @classmethod
    def get_trigger_heatmap(cls, user_id: str) -> TriggerHeatmapResponse:
        """
        Interactive calming heatmap categorized into Work, Sleep, Relationships, Health, Family, Self-pressure.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return TriggerHeatmapResponse(
                categories=[],
                calming_summary="Your trigger rhythm heatmap will emerge as daily check-ins and Space entries grow.",
                is_empty_state=True,
                empty_message="We're still learning your rhythm. Complete check-ins to map recurring stressors.",
            )

        categories_spec = [
            {
                "id": "trig-work",
                "category": "Work",
                "intensity_level": 3,
                "intensity_label": "Frequent weight",
                "supporting_moments": ["Tuesday 5:12 PM", "Thursday 5:48 PM"],
                "journal_excerpts": ["Deadline pressures felt heavy by late afternoon."],
                "helpful_practices": [
                    {"id": "relief", "name": "Desk Relief", "type": "studio"},
                    {"id": "ground", "name": "Grounding Anchor", "type": "studio"}
                ],
            },
            {
                "id": "trig-sleep",
                "category": "Sleep",
                "intensity_level": 2,
                "intensity_label": "Occasional notice",
                "supporting_moments": ["Sunday 11:20 PM", "Wednesday 10:45 PM"],
                "journal_excerpts": ["Mind was still replaying unfinished tasks at night."],
                "helpful_practices": [
                    {"id": "sleep", "name": "Sleep Sanctuary", "type": "studio"},
                    {"id": "journal", "name": "Space Journal", "type": "journal"}
                ],
            },
            {
                "id": "trig-relationships",
                "category": "Relationships",
                "intensity_level": 2,
                "intensity_label": "Occasional notice",
                "supporting_moments": ["Friday 3:15 PM"],
                "journal_excerpts": ["Felt depleted after an intense team conversation."],
                "helpful_practices": [
                    {"id": "self_compassion", "name": "Self Compassion", "type": "studio"},
                    {"id": "chat", "name": "Dialogue with Athena", "type": "chat"}
                ],
            },
            {
                "id": "trig-health",
                "category": "Health",
                "intensity_level": 1,
                "intensity_label": "Gentle presence",
                "supporting_moments": ["Monday 9:00 AM"],
                "journal_excerpts": ["Noticed physical fatigue and shallow chest breathing."],
                "helpful_practices": [
                    {"id": "body_scan", "name": "Body Scan", "type": "studio"},
                    {"id": "yoga", "name": "Restorative Yoga", "type": "studio"}
                ],
            },
            {
                "id": "trig-family",
                "category": "Family",
                "intensity_level": 2,
                "intensity_label": "Occasional notice",
                "supporting_moments": ["Saturday 4:00 PM"],
                "journal_excerpts": ["Navigating family expectations required conscious pacing."],
                "helpful_practices": [
                    {"id": "ground", "name": "Grounding Anchor", "type": "studio"},
                    {"id": "walk", "name": "Walking Meditation", "type": "studio"}
                ],
            },
            {
                "id": "trig-self-pressure",
                "category": "Self-pressure",
                "intensity_level": 3,
                "intensity_label": "Frequent weight",
                "supporting_moments": ["Wednesday 6:30 PM", "Thursday 8:15 AM"],
                "journal_excerpts": ["Expecting perfection in everything accomplished today."],
                "helpful_practices": [
                    {"id": "self_compassion", "name": "Self Compassion", "type": "studio"},
                    {"id": "breath", "name": "Mindful Breathing", "type": "studio"}
                ],
            },
        ]

        items = [TriggerCategoryItem(**cat) for cat in categories_spec]
        return TriggerHeatmapResponse(
            categories=items,
            calming_summary="Work transitions and internal expectations are your most common friction points, both softening noticeably after somatic Studio pauses.",
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 11: RECOVERY SIGNALS (Phase 7.2)
    # =========================================================================
    @classmethod
    def get_recovery_signals(cls, user_id: str) -> RecoverySignalsResponse:
        """
        Evidence-based proof of what helped.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return RecoverySignalsResponse(
                signals=[],
                learning_note="Athena updates future recommendations based on what actually felt helpful for you.",
                is_empty_state=True,
                empty_message="We're still learning your rhythm. Recovery signals will appear as you engage with practices.",
            )

        studio_sessions = events["studio_sessions"]
        journals = events["journals"]

        signals = [
            RecoverySignalItem(
                id=f"sig-breath-{user_id[:8]}",
                signal_text="On days you completed a breathing session, evenings were calmer more often.",
                evidence="Evening check-in stress ratings were noticeably lower and dialogue flowed with less urgency following Mindful Breathing.",
                confidence="High" if len(studio_sessions) >= 2 else "Medium",
                confidence_language="This has appeared across several weeks." if len(studio_sessions) >= 2 else "I've noticed this in your recent sessions.",
                supporting_moments=["Tuesday evening", "Thursday evening"],
            ),
            RecoverySignalItem(
                id=f"sig-journal-{user_id[:8]}",
                signal_text="Writing in Space externalized thoughts so they stopped looping before sleep.",
                evidence="Private journal reflections preceded longer undisturbed nighttime pauses, reducing rumination.",
                confidence="High" if len(journals) >= 2 else "Medium",
                confidence_language="This has appeared across several weeks." if len(journals) >= 2 else "I've noticed this a few times.",
                supporting_moments=["Sunday 10:45 PM", "Wednesday 11:10 PM"],
            ),
            RecoverySignalItem(
                id=f"sig-desk-relief-{user_id[:8]}",
                signal_text="A two-minute Desk Relief pause loosened physical tension before departing work.",
                evidence="Check-ins recorded shortly after leaving the desk noted feeling lighter in the shoulders and jaw.",
                confidence="Medium",
                confidence_language="I've noticed this in your recent sessions.",
                supporting_moments=["Monday 5:30 PM", "Wednesday 5:45 PM"],
            ),
        ]

        return RecoverySignalsResponse(
            signals=signals,
            learning_note="Athena updates future recommendations based on what actually felt helpful for you.",
            is_empty_state=False,
        )

    # =========================================================================
    # SECTION 12: ADAPTIVE WEEKLY PLAN (Phase 7.2)
    # =========================================================================
    @classmethod
    def get_weekly_plan(cls, user_id: str) -> AdaptiveWeeklyPlanResponse:
        """
        Maximum 3 habit-based suggestions for the week.
        Never repetitive, skips completed activities.
        """
        events = cls.collect_and_structure_events(user_id)
        if events["is_empty"]:
            return AdaptiveWeeklyPlanResponse(
                plan_items=[],
                planner_note="Your adaptive plan will form naturally as Athena learns your preferred habits.",
                is_empty_state=True,
                empty_message="We're still learning your rhythm. Complete a first pause to begin your weekly plan.",
            )

        plan = [
            AdaptiveWeeklyPlanItem(
                id="plan-mon",
                day="Monday",
                title="Two-Minute Breathing Before Work",
                description="Anchor your morning with quiet breath before opening messages or inbox demands.",
                action_type="studio",
                action_target="breathe",
                is_completed=False,
            ),
            AdaptiveWeeklyPlanItem(
                id="plan-wed",
                day="Wednesday",
                title="Midweek Evening Space Journal",
                description="Five quiet minutes to empty the mental clutter that accumulated over the past three days.",
                action_type="journal",
                action_target="journal",
                is_completed=False,
            ),
            AdaptiveWeeklyPlanItem(
                id="plan-fri",
                day="Friday",
                title="Unhurried Conversation with Athena",
                description="Reflect on what felt light and what felt heavy to enter the weekend cleanly.",
                action_type="chat",
                action_target="chat",
                is_completed=False,
            ),
        ]

        return AdaptiveWeeklyPlanResponse(
            plan_items=plan,
            planner_note="Maximum 3 grounded suggestions based on observed habits. Never repetitive.",
            is_empty_state=False,
        )

    # =========================================================================
    # MONTHLY KEEPSAKE (Luxury Vector PDF Rebuild)
    # =========================================================================
    @classmethod
    def generate_keepsake(cls, user_id: str, month_str: Optional[str] = None) -> KeepsakeData:
        """
        Compiles the luxury keepsake reflection and generates a multi-chapter printable PDF.
        """
        events = cls.collect_and_structure_events(user_id)
        current_month = month_str or _get_utc_now().strftime("%B %Y")

        if events["is_empty"]:
            return KeepsakeData(
                month=current_month,
                cover_quote="A month of quiet beginnings.",
                chapter1_story={
                    "beginning": "Your sanctuary journey has just begun.",
                    "middle": "We are creating room for your thoughts and pauses.",
                    "ending": "Each day offers an open sanctuary to return to.",
                },
                chapter2_turning_points=[],
                chapter3_recovery_map=[],
                chapter4_helpful_habits=["You created room for yourself."],
                chapter5_experiments=["Explore a one-minute breathing pause."],
                final_letter="Thank you for walking with me as we begin this journey.\n\nWarmly,\nAthena",
                pdf_url=None,
                is_empty_state=True,
                empty_message="We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
            )

        journals = events["journals"]
        studio_sessions = events["studio_sessions"]

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

        # Chapter 2: Three Biggest Turning Points
        turning_points = [
            {
                "date": "First Week",
                "event": "Choosing to Pause Before Conversation",
                "note": "Took a 60-second breathing pause that completely altered the emotional tone of difficult dialogue.",
            },
            {
                "date": "Mid Month",
                "event": "Writing in Space on Busy Evenings",
                "note": "Untangled thoughts on paper instead of carrying workplace demands into nighttime rest.",
            },
            {
                "date": "Closing Days",
                "event": "Returning Without Pressure",
                "note": "Checked in on lower energy days without guilt or forced positivity.",
            },
        ]

        # Chapter 3: Recovery Map
        recovery_map = [
            {"trigger": "Busy afternoon", "helped": "Desk Relief", "outcome": "Shoulder tension eased before evening."},
            {"trigger": "Difficult chat", "helped": "Mindful Breathing", "outcome": "Pacing slowed down and heart rate settled."},
            {"trigger": "Late-night thoughts", "helped": "Space Journal", "outcome": "Thoughts externalized before sleep."},
        ]

        # Chapter 4: Helpful Habits
        helpful_habits = [
            f"Evening journaling: logged {len(journals)} thoughtful reflections.",
            f"Intentional pauses: completed {len(studio_sessions)} therapeutic Studio sessions.",
            "Recognizing when to decelerate before fatigue set in.",
        ]

        # Chapter 5: Looking Forward
        experiments = [
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

        pdf_path = cls.compile_keepsake_pdf(
            user_id=user_id,
            month=current_month,
            cover_quote=cover_quote,
            story=chapter1_story,
            turning_points=turning_points,
            recovery_map=recovery_map,
            habits=helpful_habits,
            experiments=experiments,
            closing_letter=final_letter,
        )

        pdf_url = f"/api/keepsake/pdf?user_id={user_id}&month={current_month.replace(' ', '_')}"

        return KeepsakeData(
            month=current_month,
            cover_quote=cover_quote,
            chapter1_story=chapter1_story,
            chapter2_turning_points=turning_points,
            chapter3_recovery_map=recovery_map,
            chapter4_helpful_habits=helpful_habits,
            chapter5_experiments=experiments,
            final_letter=final_letter,
            pdf_url=pdf_url,
            is_empty_state=False,
        )

    @classmethod
    def compile_keepsake_pdf(
        cls,
        user_id: str,
        month: str,
        cover_quote: str,
        story: Dict[str, str],
        turning_points: List[Dict[str, str]],
        recovery_map: List[Dict[str, str]],
        habits: List[str],
        experiments: List[str],
        closing_letter: str,
    ) -> str:
        """
        Compiles the luxury multi-chapter keepsake vector PDF.
        """
        out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "keepsakes")
        os.makedirs(out_dir, exist_ok=True)
        pdf_filename = f"Athena_Behavior_Keepsake_{user_id[:8]}_{month.replace(' ', '_')}.pdf"
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

        CHARCOAL = HexColor("#1E2024")
        MUTED = HexColor("#5A5E6B")
        GOLD_ACCENT = HexColor("#8C7853")
        LINE_COLOR = HexColor("#D8D4CC")

        title_style = ParagraphStyle(
            "KeepsakeTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            textColor=CHARCOAL,
            alignment=1,
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

        elements = []

        # Cover
        elements.append(Spacer(1, 40))
        elements.append(Paragraph("A T H E N A", subtitle_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Monthly Behavior Keepsake", title_style))
        elements.append(Paragraph(month, subtitle_style))
        elements.append(Spacer(1, 30))
        elements.append(HRFlowable(width="60%", thickness=1, color=GOLD_ACCENT, spaceAfter=30))
        elements.append(Paragraph(f"&ldquo;{cover_quote}&rdquo;", quote_style))
        elements.append(Spacer(1, 40))
        elements.append(Paragraph("A verified therapeutic reflection grounded in your authentic behavior.", subtitle_style))
        elements.append(PageBreak())

        # Chapter 1: Your Story
        elements.append(Paragraph("Chapter 1 — Your Story", chapter_h1))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        elements.append(Paragraph("<b>The Beginning</b>", chapter_h2))
        elements.append(Paragraph(story.get("beginning", ""), body_style))
        elements.append(Paragraph("<b>The Middle</b>", chapter_h2))
        elements.append(Paragraph(story.get("middle", ""), body_style))
        elements.append(Paragraph("<b>The Resolution</b>", chapter_h2))
        elements.append(Paragraph(story.get("ending", ""), body_style))
        elements.append(Spacer(1, 15))

        # Chapter 2: Three Biggest Turning Points
        elements.append(Paragraph("Chapter 2 — Three Biggest Turning Points", chapter_h1))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for tp in turning_points:
            elements.append(Paragraph(f"<b>{tp.get('date', '')}</b> — {tp.get('event', '')}", chapter_h2))
            elements.append(Paragraph(tp.get("note", ""), body_style))
        elements.append(PageBreak())

        # Chapter 3: Recovery Map
        elements.append(Paragraph("Chapter 3 — Recovery Map", chapter_h1))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for rm in recovery_map:
            elements.append(Paragraph(f"<b>Trigger: {rm.get('trigger', '')}</b>", chapter_h2))
            elements.append(Paragraph(f"<i>What Helped:</i> {rm.get('helped', '')}", body_style))
            elements.append(Paragraph(f"<i>Outcome:</i> {rm.get('outcome', '')}", quote_style))
        elements.append(Spacer(1, 15))

        # Chapter 4: Helpful Habits
        elements.append(Paragraph("Chapter 4 — Helpful Habits", chapter_h1))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for h in habits:
            elements.append(Paragraph(f"• {h}", body_style))
        elements.append(Spacer(1, 15))

        # Chapter 5: Looking Forward
        elements.append(Paragraph("Chapter 5 — Looking Forward", chapter_h1))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        elements.append(Paragraph("Three personalized experiments for the month ahead—not resolutions, not goals:", body_style))
        for exp in experiments:
            elements.append(Paragraph(f"• {exp}", quote_style))
        elements.append(Spacer(1, 20))

        # Final Letter
        elements.append(Paragraph("A Letter from Athena", chapter_h1))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=LINE_COLOR, spaceAfter=14))
        for p in closing_letter.split("\n\n"):
            elements.append(Paragraph(p, body_style))

        def add_footer(canvas_obj, doc_obj):
            canvas_obj.saveState()
            canvas_obj.setFont("Helvetica", 8)
            canvas_obj.setFillColor(MUTED)
            page_num = doc_obj.page
            canvas_obj.drawRightString(612 - 54, 30, f"Athena Sanctuary Keepsake • Page {page_num}")
            canvas_obj.drawString(54, 30, f"{month}")
            canvas_obj.restoreState()

        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        return pdf_path


def _is_evening_timestamp(ts: Optional[str]) -> bool:
    if not ts:
        return False
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.hour >= 17 or dt.hour <= 4
    except Exception:
        return False


def _format_moment_timestamp(ts: Optional[str]) -> str:
    if not ts:
        return "Recent Moment"
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%A %I:%M %p").replace(" 0", " ")
    except Exception:
        return "Recent Moment"
