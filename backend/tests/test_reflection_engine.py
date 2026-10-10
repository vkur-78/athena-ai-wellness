import unittest
from fastapi.testclient import TestClient
from main import app
from services.reflection_engine import (
    get_or_generate_weekly,
    get_or_generate_monthly,
    build_luxury_keepsake_pdf,
    search_reflection_universe,
)


class TestReflectionIntelligenceEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_user_id = "test_reflection_engine_user"

    def test_home_reflection_preview_endpoint(self):
        """Test GET /api/reflection/home returns single preview card."""
        res = self.client.get("/api/reflection/home")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["title"], "This Week's Reflection")
        self.assertTrue(len(data["preview_sentence"]) > 10)
        self.assertIn("Continue Reading", data["action_label"])
        self.assertTrue(data["has_reflection"])

    def test_weekly_reflection_seven_sections(self):
        """Test GET /api/reflection/weekly/current returns all 7 required sections."""
        res = self.client.get("/api/reflection/weekly/current")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        content = data["content"]
        # Section 1: One Sentence
        self.assertIn("one_sentence", content)
        self.assertTrue(len(content["one_sentence"]) > 15)

        # Section 2: Story of Your Week (3 paragraphs)
        self.assertIn("story_of_week", content)
        self.assertGreaterEqual(len(content["story_of_week"]), 3)

        # Section 3: Moments That Mattered (Cards)
        self.assertIn("moments_that_mattered", content)
        self.assertIsInstance(content["moments_that_mattered"], list)
        if content["moments_that_mattered"]:
            m = content["moments_that_mattered"][0]
            self.assertIn("date", m)
            self.assertIn("title", m)
            self.assertIn("reflection", m)

        # Section 4: Quiet Patterns
        self.assertIn("quiet_patterns", content)

        # Section 5: What Helped
        self.assertIn("what_helped", content)

        # Section 6: One Gentle Invitation
        self.assertIn("one_invitation", content)
        self.assertTrue(content["one_invitation"].startswith("If") or content["one_invitation"].startswith("Perhaps"))

        # Section 7: Closing Letter
        self.assertIn("closing", content)
        self.assertIn("Athena", content["closing"])

        # Companion notes check
        self.assertIn("companion_notes", content)
        self.assertGreaterEqual(len(content["companion_notes"]), 2)

    def test_monthly_reflection_seven_sections(self):
        """Test GET /api/reflection/monthly/current synthesizes the 7 monthly intelligence sections."""
        res = self.client.get("/api/reflection/monthly/current")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        content = data["content"]
        # 1. Month Theme
        self.assertIn("month_theme", content)

        # 2. Your Journey (Beginning, Middle, Ending)
        self.assertIn("your_journey", content)
        self.assertGreaterEqual(len(content["your_journey"]), 3)

        # 3. Meaningful Moments (5-8 cards)
        self.assertIn("meaningful_moments", content)
        self.assertIsInstance(content["meaningful_moments"], list)

        # 4. What Changed
        self.assertIn("what_changed", content)

        # 5. Helpful Habits
        self.assertIn("helpful_habits", content)

        # 6. Areas That Deserve Gentleness
        self.assertIn("areas_deserve_gentleness", content)

        # 7. Looking Forward
        self.assertIn("looking_forward", content)

        # Closing
        self.assertIn("closing", content)
        self.assertIn("Thank you for letting me walk beside you this month", content["closing"])

    def test_luxury_pdf_keepsake_generation(self):
        """Test GET /api/reflection/monthly/pdf produces luxury 6-page vector PDF."""
        res = self.client.get("/api/reflection/monthly/pdf")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertIn("attachment; filename=", res.headers.get("content-disposition", ""))

        pdf_bytes = res.content
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 2000)

    def test_reflection_search_endpoint(self):
        """Test GET /api/reflection/search natural search across reflections, studio, and journal."""
        res = self.client.get("/api/reflection/search?q=quiet")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["query"], "quiet")
        self.assertIn("results", data)
        self.assertIsInstance(data["results"], list)

    def test_reflection_history_endpoint(self):
        """Test GET /api/reflection/history returns past reflections."""
        res = self.client.get("/api/reflection/history")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("weekly", data)
        self.assertIn("monthly", data)


if __name__ == "__main__":
    unittest.main()
