import os
import sys
import unittest

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from auth.verify import verify_user, get_optional_user

class MockUser:
    id = "user-calm-1234"
    email = "calm@athena.sanctuary"

mock_user = MockUser()

def mock_get_optional_user():
    return mock_user

class TestCalmMode(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_calm_start_unauthenticated(self):
        # Guest or unauthenticated user triggers Panic Reset
        res = self.client.post("/api/calm/start", json={"source": "direct"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("I'm here with you", data["opening_line"])
        self.assertEqual(data["pause_line"], "We don't need to solve everything right now.")
        self.assertEqual(data["question"], "What feels most supportive?")
        self.assertNotIn("Emergency Mode Activated", data["opening_line"])
        self.assertNotIn("Exercise Complete", data["pause_line"])

    def test_calm_start_authenticated(self):
        app.dependency_overrides[get_optional_user] = mock_get_optional_user
        try:
            res = self.client.post("/api/calm/start", json={"source": "home"})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("I'm here with you", data["opening_line"])
            self.assertIn("solve everything", data["pause_line"])
            self.assertIn("supportive", data["question"])
            self.assertIn("voice_guidance_intro", data)
            # Emotional writing validation
            for forbidden in ["Emergency Mode Activated", "Exercise Complete", "Level Finished", "Session Complete"]:
                self.assertNotIn(forbidden, data["opening_line"])
                self.assertNotIn(forbidden, data["pause_line"])
                self.assertNotIn(forbidden, data.get("voice_guidance_intro", ""))
        finally:
            app.dependency_overrides.clear()

    def test_chat_with_calm_internal_context(self):
        def mock_verify_user():
            return mock_user

        app.dependency_overrides[verify_user] = mock_verify_user
        try:
            res = self.client.post("/api/chat", json={
                "session_id": "test-calm-session",
                "message": "I'm having a really hard time right now.",
                "internal_context": "User entered Panic Reset. Current state: Overwhelmed. Respond with slower pacing. Avoid problem-solving immediately.",
                "source": "panic_reset"
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("reply", data)
            self.assertIn("metadata", data)
            # Metadata should reflect gentle holding space or grounding presence
            approach = data["metadata"].get("therapy_approach", "")
            self.assertTrue(
                "grounding" in approach or "holding space" in approach or "pacing" in approach or "relief" in approach
            )
        finally:
            app.dependency_overrides.clear()

if __name__ == "__main__":
    unittest.main()
