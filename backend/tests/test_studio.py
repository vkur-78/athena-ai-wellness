import unittest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
from services.studio_service import (
    save_studio_session,
    get_recent_moments,
    get_gentle_reflection,
    _format_relative_time_narrative,
)


from auth.verify import verify_user

class MockStudioUser:
    id = "test_user_studio_123"
    email = "studio@athena.sanctuary"

class TestStudioEcosystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[verify_user] = lambda: MockStudioUser()
        cls.client = TestClient(app)
        cls.test_user_id = "test_user_studio_123"

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_record_studio_session(self):
        """Test recording a session via API endpoint."""
        payload = {
            "practice_type": "yoga",
            "routine": "Desk Relief",
            "planned_duration": 420,
            "actual_duration": 420,
            "completed": True,
            "paused": False,
            "pace": "slow",
            "repeated_instruction": 2,
            "exited_early": False,
        }
        res = self.client.post("/api/studio/sessions", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["practice_type"], "yoga")
        self.assertEqual(data["routine"], "Desk Relief")
        self.assertEqual(data["actual_duration"], 420)
        self.assertEqual(data["pace"], "slow")
        self.assertEqual(data["repeated_instruction"], 2)
        self.assertEqual(data["exited_early"], False)
        self.assertTrue(data["completed"])
        self.assertIn("id", data)

    def test_recent_moments_formatting(self):
        """Test humanized narrative formatting without metrics or streaks."""
        now = datetime.now(timezone.utc)
        yesterday_iso = (now - timedelta(days=1)).isoformat()

        narrative = _format_relative_time_narrative(yesterday_iso, "yoga", "Desk Relief")
        self.assertIn("Desk Relief", narrative)
        self.assertIn("yesterday", narrative.lower())

        # Test breathing narrative
        narrative_breathe = _format_relative_time_narrative(yesterday_iso, "breathe")
        self.assertIn("Breathed together", narrative_breathe)

        # Test quiet narrative
        narrative_quiet = _format_relative_time_narrative(yesterday_iso, "quiet")
        self.assertIn("Quiet Pause", narrative_quiet)

    def test_fetch_recent_moments_endpoint(self):
        """Test GET /api/studio/recent returns non-gamified moments list."""
        # Record a test session first
        payload = {
            "practice_type": "breathe",
            "actual_duration": 120,
            "completed": True,
        }
        self.client.post("/api/studio/sessions", json=payload)

        res = self.client.get("/api/studio/recent?limit=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("moments", data)
        self.assertIsInstance(data["moments"], list)
        if len(data["moments"]) > 0:
            first = data["moments"][0]
            self.assertIn("moment_text", first)
            self.assertNotIn("streak", first)
            self.assertNotIn("score", first)
            self.assertNotIn("points", first)

    def test_gentle_reflections_for_practices(self):
        """Test Athena offers single gentle sentence for each practice without toxic positivity."""
        practices = [
            ("breathe", None, "Thank you for making space for yourself."),
            ("ground", None, "You are right here, steady and safe in this moment."),
            ("sleep", None, "There's nothing else you need to carry into tonight."),
            ("quiet", None, "Stillness is always here whenever you feel ready to return."),
            ("yoga", "Desk Relief", "Notice if your neck and back feel a little more at ease."),
            ("yoga", "Morning Reset", "Begin your day softly. There is no rush."),
            ("body_scan", None, "Carry this softness with you into whatever comes next."),
            ("walk", None, "Thank you for moving with presence and ease today."),
            ("pmr", None, "Let your muscles remain heavy, grounded, and at rest."),
            ("self_compassion", None, "You don't need to earn kindness today. You are worthy of it as you are."),
        ]

        for p_type, routine, expected_substr in practices:
            res = self.client.post(
                "/api/studio/reflection",
                json={"practice_type": p_type, "routine": routine, "completed": True},
            )
            self.assertEqual(res.status_code, 200)
            sentence = res.json().get("gentle_sentence", "")
            self.assertIn(expected_substr, sentence)

    def test_clean_exercise_history_model(self):
        """Test recording session with clean data model fields."""
        payload = {
            "exercise_id": "box_breathing",
            "exercise_name": "Box Breathing",
            "exercise_category": "breathing",
            "duration_seconds": 240,
            "completion_status": "COMPLETED",
            "instruction_mode": "TEXT",
            "voice_used": False,
            "started_at": "2026-09-29T10:31:00+00:00",
            "completed_at": "2026-09-29T10:35:00+00:00",
        }
        res = self.client.post("/api/studio/sessions", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["exercise_id"], "box_breathing")
        self.assertEqual(data["exercise_name"], "Box Breathing")
        self.assertEqual(data["exercise_category"], "breathing")
        self.assertEqual(data["completion_status"], "COMPLETED")
        self.assertEqual(data["duration_seconds"], 240)
        self.assertTrue(data["completed"])

    def test_exercise_status_filtering(self):
        """Test that STARTED or ABANDONED exercises are never counted in completed recent moments."""
        # 1. Record an ABANDONED session
        abandoned_payload = {
            "exercise_id": "mindful_walk",
            "exercise_name": "Mindful Walk",
            "exercise_category": "walk",
            "duration_seconds": 30,
            "completion_status": "ABANDONED",
            "early_exit": True,
        }
        self.client.post("/api/studio/sessions", json=abandoned_payload)

        # 2. Record a STARTED session
        started_payload = {
            "exercise_id": "body_scan",
            "exercise_name": "Body Scan",
            "exercise_category": "body_scan",
            "duration_seconds": 15,
            "completion_status": "STARTED",
        }
        self.client.post("/api/studio/sessions", json=started_payload)

        # 3. Fetch recent moments
        res = self.client.get("/api/studio/recent?limit=20")
        self.assertEqual(res.status_code, 200)
        moments = res.json()["moments"]

        # Assert no moment has completion_status != COMPLETED
        for m in moments:
            self.assertEqual(m.get("completion_status"), "COMPLETED")
            self.assertTrue(m.get("completed"))

    def test_studio_v1_library_and_lifecycle(self):
        """Test Studio V1 exercise catalog and complete lifecycle (start -> update -> complete/abandon -> history)."""
        # 1. Test GET /api/studio/exercises
        res = self.client.get("/api/studio/exercises")
        self.assertEqual(res.status_code, 200)
        catalog = res.json()
        self.assertEqual(len(catalog["exercises"]), 8)
        self.assertIn("RESET", catalog["categories"])
        self.assertIn("BREATHE", catalog["categories"])
        self.assertIn("GROUND", catalog["categories"])
        self.assertIn("FOCUS", catalog["categories"])
        self.assertIn("WIND DOWN", catalog["categories"])
        self.assertIn("REFLECT", catalog["categories"])

        # 2. Test GET single exercise
        res_ex = self.client.get("/api/studio/exercises/two_minute_reset")
        self.assertEqual(res_ex.status_code, 200)
        ex_data = res_ex.json()
        self.assertEqual(ex_data["title"], "2-Minute Reset")
        self.assertEqual(len(ex_data["steps"]), 6)
        self.assertEqual(ex_data["steps"][0]["text"], "Pause where you are.")

        # 3. Start a session
        start_payload = {
            "exercise_id": "box_breathing",
            "exercise_name": "Box Breathing",
            "exercise_category": "BREATHE",
            "instruction_mode": "BOTH",
            "voice_used": True,
            "total_steps": 14,
        }
        res_start = self.client.post("/api/studio/sessions/start", json=start_payload)
        self.assertEqual(res_start.status_code, 200)
        session_obj = res_start.json()
        session_id = session_obj["id"]
        self.assertEqual(session_obj["completion_status"], "STARTED")

        # 4. Update session progress
        res_update = self.client.patch(
            f"/api/studio/sessions/{session_id}",
            json={"steps_completed": 7, "duration_seconds": 60}
        )
        self.assertEqual(res_update.status_code, 200)

        # 5. Complete session
        complete_payload = {
            "duration_seconds": 120,
            "steps_completed": 14,
            "total_steps": 14,
            "notes": "Felt grounded and steady.",
        }
        res_complete = self.client.post(
            f"/api/studio/sessions/{session_id}/complete",
            json=complete_payload
        )
        self.assertEqual(res_complete.status_code, 200)
        self.assertEqual(res_complete.json()["completion_status"], "COMPLETED")
        self.assertIsNotNone(res_complete.json()["completed_at"])

        # 6. Test Early Exit / Abandon lifecycle on another session
        res_abandon_start = self.client.post("/api/studio/sessions/start", json=start_payload)
        ab_id = res_abandon_start.json()["id"]
        res_abandon = self.client.post(
            f"/api/studio/sessions/{ab_id}/abandon",
            json={"duration_seconds": 35, "steps_completed": 3, "reason": "interrupted"}
        )
        self.assertEqual(res_abandon.status_code, 200)
        self.assertEqual(res_abandon.json()["completion_status"], "ABANDONED")

        # 7. Check user practice history
        res_hist = self.client.get("/api/studio/history")
        self.assertEqual(res_hist.status_code, 200)
        history = res_hist.json()
        self.assertGreaterEqual(history["total_completed"], 1)
        self.assertGreaterEqual(len(history["sessions"]), 2)
        # Verify display_date is formatted (e.g. 'Today')
        self.assertIn("display_date", history["sessions"][0])


if __name__ == "__main__":
    unittest.main()


