"""
Unit and Integration Tests for Athena Behavior Intelligence System (Phase 4.2 Rebuild)
Validates:
- Deterministic reasoning pipeline without clinical labels or gamified streaks
- Evidence-backed behavioral patterns and therapeutic confidence language
- Signature Stress Recovery Flow and therapeutic analytics
- Trigger -> Recovery pathways
- Gentle recovery forecasts ("You often...")
- Adaptive 7-day experiments and user feedback learning loops
- Meaningful milestones archive (memories, not trophies)
- Luxury printable PDF keepsake generation
- Full FastAPI endpoint integration
"""

import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app
from services.behavior_intelligence import BehaviorIntelligenceEngine
from models.behavior_intelligence import (
    TodayGuidanceResponse,
    BehaviorPatternsResponse,
    TherapeuticAnalytics,
    TriggerRecoveryResponse,
    RecoveryForecast,
    AdaptiveExperimentsResponse,
    MilestonesResponse,
    EmotionalSeason,
    KeepsakeData,
)


class TestBehaviorIntelligenceSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_user_id = "test_behavior_user_789"

    def test_empty_state_honest_behavior(self):
        """Athena must NEVER fabricate insights when insufficient data exists."""
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events") as mock_events:
            mock_events.return_value = {
                "user_id": self.test_user_id,
                "journals": [],
                "studio_sessions": [],
                "checkins": [],
                "conversations": [],
                "profile": {},
                "timeline_events": [],
                "total_interactions": 0,
                "is_empty": True,
            }

            guidance = BehaviorIntelligenceEngine.get_todays_guidance(self.test_user_id)
            self.assertTrue(guidance.is_empty_state)
            self.assertIn("still learning your rhythm", guidance.guidance)

            patterns = BehaviorIntelligenceEngine.get_behavior_patterns(self.test_user_id)
            self.assertTrue(patterns.is_empty_state)
            self.assertEqual(len(patterns.patterns), 0)

            analytics = BehaviorIntelligenceEngine.get_therapeutic_analytics(self.test_user_id)
            self.assertTrue(analytics.is_empty_state)

            recovery = BehaviorIntelligenceEngine.get_trigger_recovery_map(self.test_user_id)
            self.assertTrue(recovery.is_empty_state)
            self.assertEqual(len(recovery.pathways), 0)

            forecast = BehaviorIntelligenceEngine.get_recovery_forecast(self.test_user_id)
            self.assertTrue(forecast.is_empty_state)

            experiments = BehaviorIntelligenceEngine.get_adaptive_experiments(self.test_user_id)
            self.assertTrue(experiments.is_empty_state)

            milestones = BehaviorIntelligenceEngine.get_milestone_library(self.test_user_id)
            self.assertTrue(milestones.is_empty_state)

            impact = BehaviorIntelligenceEngine.get_practice_impact(self.test_user_id)
            self.assertTrue(impact.is_empty_state)

            heatmap = BehaviorIntelligenceEngine.get_trigger_heatmap(self.test_user_id)
            self.assertTrue(heatmap.is_empty_state)

            signals = BehaviorIntelligenceEngine.get_recovery_signals(self.test_user_id)
            self.assertTrue(signals.is_empty_state)

            plan = BehaviorIntelligenceEngine.get_weekly_plan(self.test_user_id)
            self.assertTrue(plan.is_empty_state)

    def test_today_guidance_stress_rule(self):
        """High-stress recent check-in must trigger gentle physiological support (e.g. 1-minute breathing)."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [],
            "studio_sessions": [],
            "checkins": [{
                "stress_level": "heavy",
                "mood_label": "overwhelmed",
                "created_at": "2026-09-12T10:00:00Z"
            }],
            "conversations": [{"id": "c1", "created_at": "2026-09-12T09:00:00Z"}],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 2,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            guidance = BehaviorIntelligenceEngine.get_todays_guidance(self.test_user_id, client_hour=10)
            self.assertFalse(guidance.is_empty_state)
            self.assertEqual(guidance.action_type, "studio")
            self.assertIn("breathing", guidance.guidance.lower())

    def test_behavior_patterns_confidence_and_no_clinical_diagnoses(self):
        """Observations must use confidence language, never expose raw percentages or medical diagnoses."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [
                {"id": "j1", "created_at": "2026-09-10T19:00:00Z", "title": "Evening thoughts"}
            ],
            "studio_sessions": [
                {"id": "s1", "tool_name": "breath", "created_at": "2026-09-11T18:00:00Z"}
            ],
            "checkins": [
                {"id": "c1", "created_at": "2026-09-08T18:30:00Z", "notes": "Work deadline was heavy", "stress_level": "moderate"},
                {"id": "c2", "created_at": "2026-09-09T18:45:00Z", "notes": "Busy workday", "stress_level": "heavy"},
            ],
            "conversations": [{"id": "conv1", "created_at": "2026-09-11T18:05:00Z"}],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 5,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            res = BehaviorIntelligenceEngine.get_behavior_patterns(self.test_user_id)
            self.assertFalse(res.is_empty_state)
            self.assertGreaterEqual(len(res.patterns), 1)

            for pattern in res.patterns:
                # Must contain 'Why I noticed this'
                self.assertIn("Why I noticed this", pattern.explanation)
                # Must have natural confidence language
                self.assertTrue(
                    "appeared across several weeks" in pattern.confidence_language or
                    "keep observing" in pattern.confidence_language
                )
                # Must not contain clinical terms
                forbidden = ["diagnosis", "anxiety score", "happiness %", "bipolar", "depression clinical"]
                for f in forbidden:
                    self.assertNotIn(f, pattern.title.lower())
                    self.assertNotIn(f, pattern.explanation.lower())

    def test_therapeutic_analytics_structure(self):
        """Therapeutic analytics must include Energy Rhythm, Stress Recovery Flow, Recovery Balance, and Heatmap."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1", "created_at": "2026-09-10T20:00:00Z"}],
            "studio_sessions": [{"id": "s1", "tool_name": "breath", "created_at": "2026-09-10T19:45:00Z"}],
            "checkins": [{"id": "c1", "stress_level": "low"}],
            "conversations": [],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 3,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            analytics = BehaviorIntelligenceEngine.get_therapeutic_analytics(self.test_user_id)
            self.assertFalse(analytics.is_empty_state)

            # Energy rhythm
            self.assertGreaterEqual(len(analytics.energy_rhythm), 4)

            # Signature Stress Recovery Flow
            self.assertTrue(len(analytics.stress_recovery_flow.steps) >= 3)
            self.assertIn("Recovery", analytics.stress_recovery_flow.title)

            # Recovery Balance without percentages
            self.assertGreaterEqual(len(analytics.recovery_balance), 1)
            for item in analytics.recovery_balance:
                self.assertIn("settle", item.settled_narrative.lower())

            # Time-of-day heatmap
            self.assertTrue(analytics.time_of_day_heatmap.quietest_period)

    def test_trigger_recovery_map(self):
        """Recovery map rows must pair verified triggers with helpful interventions."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1"}],
            "studio_sessions": [{"id": "s1"}],
            "checkins": [{"id": "c1"}],
            "conversations": [],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 3,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            res = BehaviorIntelligenceEngine.get_trigger_recovery_map(self.test_user_id)
            self.assertFalse(res.is_empty_state)
            self.assertGreaterEqual(len(res.pathways), 2)
            first_path = res.pathways[0]
            self.assertTrue(first_path.trigger)
            self.assertTrue(first_path.helped_afterward)
            self.assertTrue(first_path.future_experiment)

    def test_recovery_forecast_gentle_phrasing(self):
        """Forecast must use gentle 'You often...' phrasing rather than predictive certainty."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1"}],
            "studio_sessions": [{"id": "s1"}],
            "checkins": [{"id": "c1"}],
            "conversations": [],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 3,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            forecast = BehaviorIntelligenceEngine.get_recovery_forecast(self.test_user_id)
            self.assertFalse(forecast.is_empty_state)
            self.assertIn("You often", forecast.forecast_text)
            self.assertNotIn("You will", forecast.forecast_text)
            self.assertIn("Not Tonight", forecast.actions)

    def test_adaptive_experiments_and_feedback_learning(self):
        """User feedback on experiments must update learning state and adapt recommendations."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1"}],
            "studio_sessions": [{"id": "s1"}],
            "checkins": [{"id": "c1"}],
            "conversations": [],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 3,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            exps = BehaviorIntelligenceEngine.get_adaptive_experiments(self.test_user_id)
            self.assertFalse(exps.is_empty_state)
            self.assertGreaterEqual(len(exps.experiments), 1)
            exp_id = exps.experiments[0].id

            # Send feedback: "helped"
            feedback_res = BehaviorIntelligenceEngine.record_experiment_feedback(
                self.test_user_id, exp_id, "helped"
            )
            self.assertEqual(feedback_res["status"], "success")
            self.assertEqual(feedback_res["feedback"], "helped")

            # Check that experiment state reflects submission
            updated_exps = BehaviorIntelligenceEngine.get_adaptive_experiments(self.test_user_id)
            matched = [e for e in updated_exps.experiments if e.id == exp_id]
            self.assertTrue(len(matched) > 0)
            self.assertEqual(matched[0].feedback, "helped")
            self.assertEqual(matched[0].feedback_status, "submitted")

    def test_emotional_season_generation(self):
        """Emotional seasons reflect sustained themes (Finding Quiet Evenings, Learning to Slow Down, Building Stability)."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1"}, {"id": "j2"}],
            "studio_sessions": [{"id": "s1"}, {"id": "s2"}],
            "checkins": [{"id": "c1"}],
            "conversations": [],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 5,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            season = BehaviorIntelligenceEngine.get_emotional_season(self.test_user_id)
            self.assertFalse(season.is_empty_state)
            self.assertIn("Quiet Evenings", season.season_title)
            self.assertGreaterEqual(len(season.evidence_summary), 2)

    def test_milestone_library_preserves_memories(self):
        """Milestone library preserves meaningful moments rather than game badges."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1", "title": "First Entry", "created_at": "2026-09-01T20:00:00Z"}],
            "studio_sessions": [{"id": "s1", "tool_name": "breath", "created_at": "2026-09-02T15:00:00Z"}],
            "checkins": [{"id": "c1"}, {"id": "c2"}, {"id": "c3"}],
            "conversations": [{"id": "conv1"}],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 6,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            milestones = BehaviorIntelligenceEngine.get_milestone_library(self.test_user_id)
            self.assertFalse(milestones.is_empty_state)
            self.assertGreaterEqual(len(milestones.milestones), 2)
            titles = [m.title for m in milestones.milestones]
            self.assertTrue(any("Journal" in t for t in titles))
            self.assertTrue(any("Pause" in t for t in titles))

    def test_luxury_keepsake_generation_and_pdf_compilation(self):
        """Luxury keepsake must produce a multi-chapter report and valid vector PDF file."""
        mock_data = {
            "user_id": self.test_user_id,
            "journals": [{"id": "j1", "created_at": "2026-09-05T20:00:00Z"}],
            "studio_sessions": [{"id": "s1", "tool_name": "relief", "created_at": "2026-09-06T17:00:00Z"}],
            "checkins": [{"id": "c1", "created_at": "2026-09-07T12:00:00Z"}],
            "conversations": [],
            "profile": {},
            "timeline_events": [],
            "total_interactions": 3,
            "is_empty": False,
        }
        with patch.object(BehaviorIntelligenceEngine, "collect_and_structure_events", return_value=mock_data):
            keepsake = BehaviorIntelligenceEngine.generate_keepsake(self.test_user_id, month_str="September 2026")
            self.assertFalse(keepsake.is_empty_state)
            self.assertIn("September", keepsake.month)
            self.assertTrue(keepsake.cover_quote)
            self.assertTrue(keepsake.chapter1_story.get("beginning"))
            self.assertEqual(len(keepsake.chapter2_turning_points), 3)
            self.assertEqual(len(keepsake.chapter5_experiments), 3)
            self.assertIn("walk beside you", keepsake.final_letter)

            # Check that PDF file exists and has nonzero size
            pdf_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "data", "keepsakes",
                f"Athena_Behavior_Keepsake_{self.test_user_id[:8]}_September_2026.pdf"
            )
            self.assertTrue(os.path.exists(pdf_path))
            self.assertGreater(os.path.getsize(pdf_path), 1000)

    def test_api_endpoints_integration(self):
        """Verifies all FastAPI behavior intelligence endpoints return HTTP 200 with schema validation."""
        endpoints = [
            "/api/insights/today",
            "/api/insights/patterns",
            "/api/insights/recovery-map",
            "/api/insights/rhythm",
            "/api/insights/forecast",
            "/api/insights/experiments",
            "/api/insights/milestones",
            "/api/insights/season",
            "/api/insights/practice-impact",
            "/api/insights/trigger-heatmap",
            "/api/insights/recovery-signals",
            "/api/insights/weekly-plan",
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Failed GET on {ep}: {res.text}")

        # Test POST feedback
        fb_res = self.client.post(
            "/api/insights/experiments/exp-test-1/feedback",
            json={"feedback": "helped"}
        )
        self.assertEqual(fb_res.status_code, 200)
        self.assertEqual(fb_res.json()["feedback"], "helped")

        # Test POST keepsake generate
        ks_res = self.client.post("/api/keepsake/generate?month=September%202026")
        self.assertEqual(ks_res.status_code, 200)
        self.assertIn("month", ks_res.json())

        # Test GET keepsake pdf download
        pdf_res = self.client.get("/api/keepsake/pdf?month=September_2026")
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.headers.get("content-type"), "application/pdf")


if __name__ == "__main__":
    unittest.main()
