import unittest
from services.checkin_service import create_checkin, _load_local_checkins, _save_local_checkins
from services.conversation_service import create_conversation
from services.journal_service import create_entry
from services.studio_service import save_studio_session, get_user_studio_history, _load_local_sessions, _save_local_sessions

class TestDashboardBIMetrics(unittest.TestCase):
    USER_ID = "test_user_bi_validation"

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    def _cleanup(self):
        local_c = _load_local_checkins()
        if self.USER_ID in local_c:
            del local_c[self.USER_ID]
            _save_local_checkins(local_c)

        local_s = _load_local_sessions()
        if self.USER_ID in local_s:
            del local_s[self.USER_ID]
            _save_local_sessions(local_s)

    def test_dashboard_scenario_calculation(self):
        user_id = self.USER_ID

        # Record Monday activity
        checkin_mon = {"mood": "Calm", "energy_level": 4, "stress_level": 2}
        create_checkin(user_id, checkin_mon, client_date="2026-09-28")

        create_conversation(user_id, "Monday Reflection")

        # Record Tuesday activity
        checkin_tue = {"mood": "Good", "energy_level": 3, "stress_level": 2}
        create_checkin(user_id, checkin_tue, client_date="2026-09-29")

        create_entry(user_id, "Taking a peaceful moment for myself today.")

        studio_tue = {
            "id": "bi_session_1",
            "exercise_id": "box_breathing",
            "exercise_name": "Box Breathing",
            "exercise_category": "BREATHE",
            "duration_seconds": 300,
            "completed": True,
            "completion_status": "COMPLETED",
            "started_at": "2026-09-29T10:00:00+05:30",
            "completed_at": "2026-09-29T10:05:00+05:30",
        }
        s1 = save_studio_session(user_id, studio_tue)

        # 1. Verify Initial State: 1 session, 5 minutes
        history = get_user_studio_history(user_id)
        self.assertGreaterEqual(history["total_completed"], 1)
        self.assertGreaterEqual(history["total_minutes"], 5)

        # 2. Add second Studio session (3 min = 180s)
        studio_tue_2 = {
            "id": "bi_session_2",
            "exercise_id": "two_minute_reset",
            "exercise_name": "2-Minute Reset",
            "exercise_category": "RESET",
            "duration_seconds": 180,
            "completed": True,
            "completion_status": "COMPLETED",
            "started_at": "2026-09-29T14:00:00+05:30",
            "completed_at": "2026-09-29T14:03:00+05:30",
        }
        s2 = save_studio_session(user_id, studio_tue_2)

        history2 = get_user_studio_history(user_id)
        self.assertEqual(history2["total_completed"], history["total_completed"] + 1)
        self.assertEqual(history2["total_minutes"], history["total_minutes"] + 3)

        # 3. Delete / remove the second session and verify update
        local = _load_local_sessions()
        if user_id in local:
            local[user_id] = [s for s in local[user_id] if s.get("id") != "bi_session_2"]
            _save_local_sessions(local)

        history3 = get_user_studio_history(user_id)
        self.assertEqual(history3["total_completed"], history["total_completed"])
        self.assertEqual(history3["total_minutes"], history["total_minutes"])


if __name__ == "__main__":
    unittest.main()
