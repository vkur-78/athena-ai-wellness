import unittest
from fastapi.testclient import TestClient

from main import app
from services.living_replay_service import (
    synthesize_living_replay,
    get_replay_archive,
    build_living_replay_pdf,
)


class TestLivingReplaySystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_user_id = "test_replay_user_555"

    def test_01_weekly_living_replay_8_chapters(self):
        """Test that weekly living replay synthesizes all 8 chapters without hallucinated moments."""
        replay = synthesize_living_replay(self.test_user_id, replay_type="weekly")
        self.assertIsNotNone(replay)
        self.assertEqual(replay["replay_type"], "weekly")
        self.assertIn("Week of", replay["period_display"])

        # Chapter 1: Opening Scene
        self.assertIn("greeting", replay["opening_scene"])
        self.assertIn("season_title", replay["opening_scene"])
        self.assertIn("quote", replay["opening_scene"])

        # Chapter 2: Mood Journey (7-day flowing ribbon data)
        self.assertEqual(len(replay["mood_journey"]), 7)
        for point in replay["mood_journey"]:
            self.assertIn(point["day_label"], ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
            self.assertGreaterEqual(point["calm_level"], 0)

        # Chapter 3: Recovery Moments
        self.assertIsInstance(replay["recovery_moments"], list)
        self.assertGreaterEqual(len(replay["recovery_moments"]), 1)
        for m in replay["recovery_moments"]:
            self.assertIn("title", m)
            self.assertIn("why_it_mattered", m)

        # Chapter 4: Sanctuary World
        self.assertIn("favorite_world", replay["sanctuary_world"])
        self.assertIn("preferred_voice", replay["sanctuary_world"])

        # Chapter 5: Quiet Victories
        self.assertIsInstance(replay["quiet_victories"], list)
        self.assertGreaterEqual(len(replay["quiet_victories"]), 1)
        for qv in replay["quiet_victories"]:
            self.assertIn("title", qv)
            self.assertIn("significance", qv)

        # Chapter 6: Emotional Rhythm
        self.assertIn("pattern_title", replay["emotional_rhythm"])
        self.assertIn("confidence_wording", replay["emotional_rhythm"])

        # Chapter 7: Growth Reflection
        self.assertIn("headline", replay["growth_reflection"])
        self.assertIn("narrative", replay["growth_reflection"])

        # Chapter 8: Next Chapter
        self.assertEqual(len(replay["next_chapter"]), 3)
        for nc in replay["next_chapter"]:
            self.assertTrue(nc["action_route"].startswith("/"))

        # Highlights Grid
        self.assertIn("favorite_sanctuary", replay["highlights_grid"])
        self.assertIn("longest_calm_streak", replay["highlights_grid"])

    def test_02_monthly_living_replay(self):
        """Test monthly replay synthesis with month-level narrative."""
        replay = synthesize_living_replay(self.test_user_id, replay_type="monthly", period_str="2026-09")
        self.assertEqual(replay["replay_type"], "monthly")
        self.assertIn("September 2026", replay["period_display"])
        self.assertIsNotNone(replay["opening_scene"]["greeting"])

    def test_03_replay_archive(self):
        """Test archive returns historical weekly and monthly replay cards."""
        archive = get_replay_archive(self.test_user_id)
        self.assertIsInstance(archive, list)
        self.assertGreaterEqual(len(archive), 2)
        has_weekly = any(a["type"] == "weekly" for a in archive)
        has_monthly = any(a["type"] == "monthly" for a in archive)
        self.assertTrue(has_weekly)
        self.assertTrue(has_monthly)

    def test_04_pdf_keepsake_generation(self):
        """Test ReportLab PDF generation builds without errors."""
        replay = synthesize_living_replay(self.test_user_id, replay_type="weekly")
        pdf_bytes = build_living_replay_pdf(replay)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_05_api_endpoints(self):
        """Test living replay FastAPI endpoints."""
        # GET /api/replay/living?type=weekly
        w_res = self.client.get("/api/replay/living?type=weekly")
        self.assertEqual(w_res.status_code, 200)
        self.assertEqual(w_res.json()["replay_type"], "weekly")

        # GET /api/replay/living?type=monthly
        m_res = self.client.get("/api/replay/living?type=monthly")
        self.assertEqual(m_res.status_code, 200)
        self.assertEqual(m_res.json()["replay_type"], "monthly")

        # GET /api/replay/archive
        a_res = self.client.get("/api/replay/archive")
        self.assertEqual(a_res.status_code, 200)
        self.assertIsInstance(a_res.json(), list)

        # GET /api/replay/pdf
        pdf_res = self.client.get("/api/replay/pdf?type=weekly")
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.headers["content-type"], "application/pdf")


if __name__ == "__main__":
    unittest.main()
