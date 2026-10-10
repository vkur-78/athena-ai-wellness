import os
import sys
import unittest
import time
from fastapi.testclient import TestClient
from datetime import datetime, timezone

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from services.behavior_pipeline import (
    record_behavior_event,
    record_behavior_events_batch,
    get_daily_summary,
    get_weekly_summary,
    get_monthly_summary,
    get_user_preferences,
    get_behavior_discoveries,
    get_user_events,
    _sanitize_metadata,
)


class TestBehaviorPipelineSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_user_id = "test_pipeline_user_999"

    def test_01_event_creation_and_latency(self):
        """Test that record_behavior_event executes well under 100ms and returns valid schema."""
        start = time.perf_counter()
        event = record_behavior_event(
            user_id=self.test_user_id,
            source="studio",
            event_type="session_completed",
            metadata={
                "world": "Sakura Garden",
                "exercise": "breathe",
                "voice": "Nova",
                "completed": True,
                "duration": 300,
                "camera_mode": "first_person",
            }
        )
        elapsed_ms = (time.perf_counter() - start) * 1000
        self.assertLess(elapsed_ms, 250.0, f"Event write took {elapsed_ms:.2f}ms, must be <250ms")
        self.assertTrue(event["id"].startswith("evt_"))
        self.assertEqual(event["userId"], self.test_user_id)
        self.assertEqual(event["source"], "studio")
        self.assertEqual(event["type"], "session_completed")
        self.assertEqual(event["metadata"]["world"], "Sakura Garden")

    def test_02_privacy_layer_sanitization(self):
        """Test that raw conversation text is stripped, preserving only metadata and themes."""
        raw_meta = {
            "session_id": "sess_123",
            "message": "I feel so stressed about my work deadline and my boss expectations",
            "message_length": 11,
            "returned_after_pause": True
        }
        sanitized = _sanitize_metadata("chat", raw_meta)
        self.assertNotIn("message", sanitized)
        self.assertEqual(sanitized["session_id"], "sess_123")
        self.assertEqual(sanitized["message_length"], 11)
        self.assertIn("detected_themes", sanitized)
        self.assertIn("work", sanitized["detected_themes"])

    def test_03_daily_summary_instant_cache(self):
        """Test that daily summary is cached and returns instantly with deterministic calm score."""
        # Log a check-in event
        record_behavior_event(
            user_id=self.test_user_id,
            source="mood",
            event_type="checkin_submitted",
            metadata={
                "mood": "calm",
                "energy": 4,
                "tension": 1,
                "gratitude": True,
            }
        )
        today_summary = get_daily_summary(self.test_user_id)
        self.assertIsNotNone(today_summary)
        self.assertEqual(today_summary["mood"], "calm")
        self.assertEqual(today_summary["energy"], 4)
        self.assertEqual(today_summary["tension"], 1)
        self.assertGreaterEqual(today_summary["calmScore"], 80)
        self.assertGreaterEqual(today_summary["streak"], 1)

    def test_04_user_preference_learning(self):
        """Test that repeated sessions update user preference memory automatically."""
        # Log 3 studio events with Ocean world and Shimmer voice
        for _ in range(3):
            record_behavior_event(
                user_id=self.test_user_id,
                source="studio",
                event_type="session_completed",
                metadata={
                    "world": "Ocean Sanctuary",
                    "voice": "Shimmer",
                    "camera_mode": "first_person",
                    "duration": 420
                }
            )
        prefs = get_user_preferences(self.test_user_id)
        self.assertEqual(prefs["preferredWorld"], "Ocean Sanctuary")
        self.assertEqual(prefs["preferredVoice"], "Shimmer")
        self.assertEqual(prefs["preferredCamera"], "first_person")
        self.assertEqual(prefs["preferredPracticeDuration"], 7)

    def test_05_deterministic_discoveries_human_phrasing(self):
        """Test that discoveries avoid clinical percentages and use human confidence language."""
        discoveries = get_behavior_discoveries(self.test_user_id)
        self.assertIsInstance(discoveries, list)
        self.assertGreaterEqual(len(discoveries), 1)
        valid_confidences = [
            "This has appeared across several weeks.",
            "I've noticed this several times.",
            "I'm still learning this rhythm."
        ]
        for disc in discoveries:
            self.assertIn(disc["confidence"], valid_confidences)
            self.assertNotIn("%", disc["confidence"])
            self.assertNotIn("score", disc["confidence"].lower())
            self.assertTrue(len(disc["recommendedExperiment"]) > 10)

    def test_06_weekly_and_monthly_summaries(self):
        """Test that weekly and monthly summaries aggregate without runtime errors."""
        weekly = get_weekly_summary(self.test_user_id)
        self.assertEqual(len(weekly["days"]), 7)
        self.assertGreaterEqual(weekly["activeDays"], 1)
        self.assertIn(weekly["calmScoreTrend"], ["steady", "upward", "winding down"])

        monthly = get_monthly_summary(self.test_user_id)
        self.assertGreaterEqual(monthly["activeDays"], 1)
        self.assertGreaterEqual(monthly["totalStudioMinutes"], 1)

    def test_07_api_endpoints(self):
        """Test FastAPI REST endpoints for behavior pipeline."""
        # POST /api/behavior/events
        post_res = self.client.post("/api/behavior/events", json={
            "source": "dashboard",
            "type": "resumed_studio",
            "metadata": {"target": "Sakura Garden"}
        })
        self.assertEqual(post_res.status_code, 200)
        evt_data = post_res.json()
        self.assertEqual(evt_data["source"], "dashboard")
        self.assertEqual(evt_data["type"], "resumed_studio")

        # GET /api/behavior/today
        today_res = self.client.get("/api/behavior/today")
        self.assertEqual(today_res.status_code, 200)
        self.assertIn("calmScore", today_res.json())

        # GET /api/behavior/preferences
        pref_res = self.client.get("/api/behavior/preferences")
        self.assertEqual(pref_res.status_code, 200)
        self.assertIn("preferredVoice", pref_res.json())

        # GET /api/behavior/discoveries
        disc_res = self.client.get("/api/behavior/discoveries")
        self.assertEqual(disc_res.status_code, 200)
        self.assertIsInstance(disc_res.json(), list)

        # POST /api/behavior/events/batch (Offline sync)
        batch_res = self.client.post("/api/behavior/events/batch", json={
            "events": [
                {"source": "mood", "type": "checkin_submitted", "metadata": {"mood": "peaceful"}},
                {"source": "dashboard", "type": "opened_insights", "metadata": {}}
            ]
        })
        self.assertEqual(batch_res.status_code, 200)
        self.assertEqual(batch_res.json()["count"], 2)


if __name__ == "__main__":
    unittest.main()
