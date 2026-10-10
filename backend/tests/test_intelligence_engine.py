"""
Unit tests for Athena Intelligence Engine (Phase 4 Rebuild)
Validates therapeutic philosophy:
- Evidence-backed observations
- Confidence threshold filtering (>= 0.70)
- Real timestamps
- Adaptive weekly plan based only on prior user actions
- Grounded Q&A
- Multi-chapter keepsake PDF generation
- Honest empty state when insufficient data
"""

import os
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from services.intelligence_engine import IntelligenceEngine
from models.insights import (
    TodayGuidanceResponse,
    ObservationsResponse,
    EmotionalLandscapeResponse,
    MomentsResponse,
    HelpfulHabitsResponse,
    GrowthAreasResponse,
    WeeklyActionPlan,
    AskInsightResponse,
    MonthlyKeepsakeResponse,
)


class TestIntelligenceEngine(unittest.TestCase):

    def setUp(self):
        self.user_id = "test_user_intelligence_456"

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_empty_state_handling(self, mock_collect):
        """When user has little to no activity, Athena must NOT hallucinate or show generic cards."""
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [],
            "studio_sessions": [],
            "checkins": [],
            "conversations": [],
            "total_interactions": 0,
            "is_empty": True,
        }

        # Test Today's guidance empty state
        guidance = IntelligenceEngine.get_todays_guidance(self.user_id)
        self.assertTrue(guidance.is_empty_state)
        self.assertIn("Athena will begin noticing patterns", guidance.guidance)

        # Test Observations empty state
        obs = IntelligenceEngine.get_observations(self.user_id)
        self.assertTrue(obs.is_empty_state)
        self.assertEqual(len(obs.observations), 0)

        # Test Weekly plan empty state
        plan = IntelligenceEngine.get_weekly_action_plan(self.user_id)
        self.assertTrue(plan.is_empty_state)
        self.assertEqual(len(plan.days), 0)

        # Test Q&A empty state
        ans = IntelligenceEngine.ask_athena_about_month(self.user_id, "What helped most?")
        self.assertIn("beginning our journey", ans.answer)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_todays_guidance_rule_engine(self, mock_collect):
        """Tests rule-based personalization for Section 1."""
        # Case A: Elevated stress in checkin -> 1-minute breathing
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [],
            "studio_sessions": [],
            "checkins": [{"stress_level": "high", "mood_label": "tense", "created_at": "2026-09-12T10:00:00Z"}],
            "conversations": [{"id": "c1"}],
            "total_interactions": 2,
            "is_empty": False,
        }
        guidance = IntelligenceEngine.get_todays_guidance(self.user_id, client_hour=10)
        self.assertFalse(guidance.is_empty_state)
        self.assertIn("breathing", guidance.guidance.lower())
        self.assertEqual(guidance.action_target, "breath")

        # Case B: Evening with recent activity -> quieter conversation
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [{"title": "Evening thoughts", "created_at": "2026-09-12T20:00:00Z"}],
            "studio_sessions": [{"tool_name": "sleep", "created_at": "2026-09-12T21:00:00Z"}],
            "checkins": [],
            "conversations": [{"id": "c2"}],
            "total_interactions": 3,
            "is_empty": False,
        }
        guidance_evening = IntelligenceEngine.get_todays_guidance(self.user_id, client_hour=20)
        self.assertEqual(guidance_evening.greeting, "Good evening.")
        self.assertIn("quieter conversation", guidance_evening.guidance)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_observations_confidence_and_evidence(self, mock_collect):
        """Observations must have internal confidence >= 0.70 and explain 'Why I noticed this'."""
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [
                {"title": "Evening 1", "created_at": "2026-09-10T21:00:00Z", "content": "Calm"},
                {"title": "Evening 2", "created_at": "2026-09-11T20:30:00Z", "content": "Resting"},
            ],
            "studio_sessions": [
                {"tool_name": "sleep", "created_at": "2026-09-11T22:00:00Z"},
                {"tool_name": "breath", "created_at": "2026-09-12T14:00:00Z"},
            ],
            "checkins": [
                {"stress_level": "calm", "created_at": "2026-09-11T21:15:00Z"},
                {"stress_level": "steady", "created_at": "2026-09-12T21:00:00Z"},
            ],
            "conversations": [{"id": "c1"}],
            "total_interactions": 7,
            "is_empty": False,
        }

        obs_res = IntelligenceEngine.get_observations(self.user_id)
        self.assertFalse(obs_res.is_empty_state)
        self.assertGreater(len(obs_res.observations), 0)

        for obs in obs_res.observations:
            # Internal confidence must be >= 0.70
            self.assertGreaterEqual(obs.confidence, 0.70)
            # Explanation must start with "Why I noticed this"
            self.assertTrue(obs.explanation.startswith("Why I noticed this"))
            # Must include supporting moments
            self.assertGreater(len(obs.supporting_moments), 0)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_emotional_landscape_metaphor(self, mock_collect):
        """Emotional landscape must return one of the 5 poetic visual metaphors."""
        valid_metaphors = ["Quiet River", "Clouded Horizon", "Gentle Dawn", "Steady Forest", "Open Sky"]

        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [{"title": "Entry", "created_at": "2026-09-12T10:00:00Z"}],
            "studio_sessions": [{"tool_name": "breath", "created_at": "2026-09-12T11:00:00Z"}],
            "checkins": [{"stress_level": "mild", "mood_label": "steady"}],
            "conversations": [{"id": "c1"}],
            "total_interactions": 4,
            "is_empty": False,
        }

        landscape = IntelligenceEngine.get_emotional_landscape(self.user_id)
        self.assertIn(landscape.metaphor, valid_metaphors)
        self.assertIn(landscape.metaphor, landscape.description)
        self.assertGreater(len(landscape.evidence_notes), 0)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_what_helped_most_ranking(self, mock_collect):
        """Helpful habits must rank practices by actual outcomes and include the Athena distinction note."""
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [{"title": "Journal 1"}, {"title": "Journal 2"}],
            "studio_sessions": [
                {"tool_name": "relief"},
                {"tool_name": "relief"},
                {"tool_name": "breath"},
            ],
            "checkins": [],
            "conversations": [],
            "total_interactions": 5,
            "is_empty": False,
        }

        habits_res = IntelligenceEngine.get_helpful_habits(self.user_id)
        self.assertFalse(habits_res.is_empty_state)
        self.assertIn("isn't necessarily what works best for everyone", habits_res.athena_distinction_note)

        # Desk relief was used twice, so it should be ranked high
        practice_names = [h.practice for h in habits_res.habits]
        self.assertIn("Desk Relief", practice_names)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_weekly_action_plan_adaptation(self, mock_collect):
        """Weekly action plan must ONLY reference practices the user has actually engaged with."""
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [{"title": "Night writing", "created_at": "2026-09-12T20:00:00Z"}],
            "studio_sessions": [{"tool_name": "relief", "created_at": "2026-09-12T14:00:00Z"}],
            "checkins": [],
            "conversations": [],
            "total_interactions": 2,
            "is_empty": False,
        }

        plan = IntelligenceEngine.get_weekly_action_plan(self.user_id)
        self.assertFalse(plan.is_empty_state)
        self.assertGreater(len(plan.days), 0)

        # Ensure no un-practiced things like 'Yoga' are generated
        all_practices_text = " ".join([d.practice + " " + d.reason for d in plan.days]).lower()
        self.assertNotIn("yoga", all_practices_text)
        self.assertNotIn("aerobics", all_practices_text)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_ask_athena_about_month(self, mock_collect):
        """Q&A must cite real evidence and answer grounded questions without hallucinating."""
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [{"title": "Evening 1", "created_at": "2026-09-10T21:00:00Z"}],
            "studio_sessions": [{"tool_name": "sleep", "created_at": "2026-09-10T22:00:00Z"}],
            "checkins": [{"stress_level": "calm", "created_at": "2026-09-10T21:30:00Z"}],
            "conversations": [{"id": "c1"}],
            "total_interactions": 4,
            "is_empty": False,
        }

        ans = IntelligenceEngine.ask_athena_about_month(self.user_id, "Why did you say evenings became quieter?")
        self.assertIn("evening", ans.answer.lower())
        self.assertGreater(len(ans.grounded_facts), 0)

    @patch.object(IntelligenceEngine, "collect_user_activity")
    def test_monthly_keepsake_and_pdf_compilation(self, mock_collect):
        """Monthly keepsake must generate all chapters and compile a valid PDF."""
        mock_collect.return_value = {
            "user_id": self.user_id,
            "journals": [{"title": "Evening Reflection", "created_at": "2026-09-08T20:00:00Z"}],
            "studio_sessions": [{"tool_name": "breath", "created_at": "2026-09-09T15:00:00Z"}],
            "checkins": [{"mood_label": "gentle", "created_at": "2026-09-10T09:00:00Z"}],
            "conversations": [{"id": "c1"}],
            "total_interactions": 4,
            "is_empty": False,
        }

        keepsake = IntelligenceEngine.generate_monthly_keepsake(self.user_id, "September 2026")
        self.assertFalse(keepsake.is_empty_state)
        self.assertIn("beginning", keepsake.chapter1_story)
        self.assertIn("middle", keepsake.chapter1_story)
        self.assertIn("ending", keepsake.chapter1_story)
        self.assertGreater(len(keepsake.chapter4_changed), 0)
        self.assertEqual(len(keepsake.chapter5_experiments), 3)
        self.assertIn("Warmly", keepsake.final_letter)

        # Check compiled PDF on disk
        out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "keepsakes")
        pdf_filename = f"Athena_Keepsake_{self.user_id[:8]}_September_2026.pdf"
        pdf_path = os.path.join(out_dir, pdf_filename)
        self.assertTrue(os.path.exists(pdf_path))

        with open(pdf_path, "rb") as f:
            header = f.read(5)
            self.assertEqual(header, b"%PDF-")


if __name__ == "__main__":
    unittest.main()
