import unittest
from fastapi.testclient import TestClient
from main import app
from services.monthly_replay_service import synthesize_monthly_replay
from services.monthly_replay_pdf import build_monthly_replay_pdf


from auth.verify import verify_user

class MockUser:
    id = "test_user_replay_001"
    email = "replay@athena.sanctuary"

class TestMonthlyReplayServiceAndEndpoints(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[verify_user] = lambda: MockUser()
        self.client = TestClient(app)
        self.test_user_id = "test_user_replay_001"
        from services.studio_service import save_studio_session
        save_studio_session(self.test_user_id, {
            "exercise_id": "box_breathing",
            "exercise_name": "Box Breathing",
            "exercise_category": "breathing",
            "duration_seconds": 240,
            "completion_status": "COMPLETED",
            "completed": True,
            "completed_at": "2026-09-15T10:00:00+00:00"
        })

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_synthesize_monthly_replay(self):
        replay = synthesize_monthly_replay(self.test_user_id, month_str="2026-09")
        self.assertEqual(replay["month"], "2026-09")
        self.assertIn("September", replay["month_display"])
        self.assertTrue(len(replay["opening_quote"]) > 0)

        # Opening Letter (Chapter 1)
        self.assertIn("opening_letter", replay)
        self.assertTrue(len(replay["opening_letter"]["quote"]) > 0)
        self.assertTrue(len(replay["opening_letter"]["letter"]) > 0)

        # Chapter 1 Story (Chapter 2 in sequence)
        self.assertTrue(len(replay["chapter_1_story"]["headline"]) > 0)
        self.assertTrue(len(replay["chapter_1_story"]["narrative"]) > 0)

        # Chapter 2 Rhythm
        self.assertTrue(len(replay["chapter_2_rhythm"]["energy_wave"]) > 0)
        self.assertTrue(len(replay["chapter_2_rhythm"]["recovery_river"]) > 0)
        self.assertIn("morning", replay["chapter_2_rhythm"]["time_heatmap"])
        self.assertTrue(len(replay["chapter_2_rhythm"]["constellation"]) > 0)

        # Chapter 3 Turning Points
        self.assertTrue(len(replay["chapter_3_turning_points"]) > 0)
        self.assertTrue(len(replay["chapter_3_turning_points"]) <= 5)

        # Chapter 4 World Growth
        self.assertIsInstance(replay["chapter_4_world_growth"], list)

        # Chapter 5 Helpful Habits (Ranked with evidence)
        self.assertTrue(len(replay["chapter_5_what_helped"]) > 0)
        for h in replay["chapter_5_what_helped"]:
            self.assertIn("practice", h)
            self.assertIn("why_helpful", h)
            self.assertIn("supporting_evidence", h)

        # Quiet Patterns
        self.assertTrue(len(replay["quiet_patterns"]) > 0)
        for p in replay["quiet_patterns"]:
            self.assertIn("trend", p)
            self.assertIn("why_noticed", p)
            self.assertIn("supporting_evidence", p)
            self.assertIn("confidence_wording", p)

        # Chapter 6 Gentle Growth & Opportunities
        self.assertTrue(len(replay["chapter_6_gentle_opportunities"]["observation"]) > 0)
        self.assertTrue(len(replay["chapter_6_gentle_opportunities"]["experiment"]) > 0)

        # Chapter 7 Looking Forward & Keepsake
        self.assertIn("closing_letter", replay["chapter_7_looking_forward"])

        # Empty state flag check
        self.assertIn("is_empty_state", replay)
        self.assertIsInstance(replay["is_empty_state"], bool)

    def test_build_monthly_replay_pdf(self):
        replay = synthesize_monthly_replay(self.test_user_id, month_str="2026-09")
        pdf_bytes = build_monthly_replay_pdf(replay)

        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(len(pdf_bytes) > 500)
        # Standard PDF magic header check
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))

    def test_monthly_replay_api_endpoints(self):
        # GET /api/replay/monthly
        res = self.client.get(f"/api/replay/monthly?month=2026-09")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["month"], "2026-09")
        self.assertIn("chapter_1_story", data)
        self.assertIn("chapter_2_rhythm", data)
        self.assertIn("quiet_patterns", data)

        # Test unauthenticated access returns 401 (HIGH-04)
        app.dependency_overrides.clear()
        unauth_res = self.client.get(f"/api/replay/monthly?month=2026-09")
        self.assertEqual(unauth_res.status_code, 401)
        unauth_pdf = self.client.get(f"/api/replay/monthly/pdf?month=2026-09")
        self.assertEqual(unauth_pdf.status_code, 401)


if __name__ == "__main__":
    unittest.main()
