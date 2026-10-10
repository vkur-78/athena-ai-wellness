"""Tests for Guided Voice Studio (Phase 4.3).
Verifies:
- Script generation for all 9 studio practices in Quick, Guided, and Quiet modes
- Adaptive tone modulation (gentle vs practical)
- Yoga Instructor Mode posture cues and somatic checks
- Voice API endpoints (/api/voice/session-script, /api/voice/personas)
- Session intelligence persistence (/api/studio/sessions and /api/studio/session)
"""
import unittest
from fastapi.testclient import TestClient
from main import app
from services.guided_session_service import generate_guided_script, SCRIPT_GENERATORS
from services.voice_session_orchestrator import get_available_personas, get_persona_by_id, adjust_script_pacing
from services.studio_service import save_studio_session, get_studio_sessions


from auth.verify import verify_user

class MockVoiceUser:
    id = "test_guided_studio_user_403"
    email = "voice@athena.sanctuary"

class TestGuidedVoiceStudio(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[verify_user] = lambda: MockVoiceUser()
        cls.client = TestClient(app)
        cls.test_user_id = "test_guided_studio_user_403"

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_all_nine_practices_script_generation(self):
        """Verify all 9 practices generate valid scripts in guided mode with cues."""
        practices = [
            "breathe", "ground", "yoga", "body_scan", "walk",
            "pmr", "self_compassion", "quiet", "sleep"
        ]
        for p in practices:
            script = generate_guided_script(practice_type=p, mode="guided", tone_preference="gentle")
            self.assertEqual(script.practice_type, p)
            self.assertGreater(len(script.cues), 0, f"Practice {p} should have voice cues")
            self.assertGreater(script.estimated_duration_seconds, 0)
            # Verify each cue has required fields
            for cue in script.cues:
                self.assertIsNotNone(cue.id)
                self.assertTrue(len(cue.text) > 0)
                self.assertGreater(cue.duration_seconds, 0)
                self.assertGreaterEqual(cue.pause_after_seconds, 0)

    def test_modes_quick_guided_quiet(self):
        """Verify Quick, Guided, and Quiet modes generate appropriate cue sets."""
        # Breathing practice modes
        quick_script = generate_guided_script("breathe", mode="quick")
        guided_script = generate_guided_script("breathe", mode="guided")
        quiet_script = generate_guided_script("breathe", mode="quiet")

        self.assertEqual(quick_script.mode, "quick")
        self.assertEqual(guided_script.mode, "guided")
        self.assertEqual(quiet_script.mode, "quiet")

        # Guided has more cues than quiet
        self.assertGreater(len(guided_script.cues), len(quiet_script.cues))
        self.assertGreater(guided_script.estimated_duration_seconds, quick_script.estimated_duration_seconds)

    def test_adaptive_tone_modulation(self):
        """Verify gentle tone uses soothing phrasing while practical uses physiological framing."""
        gentle_script = generate_guided_script("breathe", mode="guided", tone_preference="gentle")
        practical_script = generate_guided_script("breathe", mode="guided", tone_preference="practical")

        gentle_texts = " ".join([c.text for c in gentle_script.cues]).lower()
        practical_texts = " ".join([c.text for c in practical_script.cues]).lower()

        self.assertTrue("ease" in gentle_texts or "softly" in gentle_texts or "gentle" in gentle_texts)
        self.assertTrue("diaphragm" in practical_texts or "vagal" in practical_texts or "cadence" in practical_texts)

    def test_yoga_instructor_mode(self):
        """Verify Yoga Instructor Mode produces posture cues with somatic check-ins."""
        script = generate_guided_script("yoga", routine_id="desk_relief", mode="guided")
        self.assertEqual(script.practice_type, "yoga")

        has_somatic_check = any(c.phase == "somatic_check" for c in script.cues)
        has_pose_entry = any(c.phase == "pose_entry" for c in script.cues)

        self.assertTrue(has_pose_entry, "Yoga script should contain pose_entry cues")
        self.assertTrue(has_somatic_check, "Yoga script should contain somatic_check cues")

        # Verify pause length during posture hold is natural (>= 10s)
        pose_cues = [c for c in script.cues if c.phase == "pose_entry"]
        for pc in pose_cues:
            self.assertGreaterEqual(pc.pause_after_seconds, 10.0)

    def test_voice_persona_catalog(self):
        """Verify Future Premium Voice catalog contains all 6 personas."""
        personas = get_available_personas()
        self.assertEqual(len(personas), 6)

        persona_ids = {p.id for p in personas}
        self.assertIn("nova", persona_ids)
        self.assertIn("echo", persona_ids)
        self.assertIn("shimmer", persona_ids)
        self.assertIn("onyx", persona_ids)
        self.assertIn("alloy", persona_ids)
        self.assertIn("fable", persona_ids)

        # All unlocked for preview
        for p in personas:
            self.assertTrue(p.is_unlocked)

    def test_speed_pacing_adjustment(self):
        """Verify adjust_script_pacing calculates duration changes based on speed."""
        base_script = generate_guided_script("breathe", mode="quick")
        slower_script = adjust_script_pacing(base_script, speed=0.8)

        # At 0.8x, spoken duration per cue should increase
        self.assertGreater(slower_script.cues[0].duration_seconds, base_script.cues[0].duration_seconds)
        self.assertGreater(slower_script.estimated_duration_seconds, base_script.estimated_duration_seconds)

    def test_api_session_script_post_and_get(self):
        """Verify POST /api/voice/session-script and GET /api/voice/session-script endpoints."""
        # Test POST
        payload = {
            "practice_type": "ground",
            "mode": "guided",
            "tone_preference": "gentle",
            "voice_style": "nova",
        }
        post_res = self.client.post("/api/voice/session-script", json=payload)
        self.assertEqual(post_res.status_code, 200)
        data = post_res.json()
        self.assertIn("script", data)
        self.assertIn("available_personas", data)
        self.assertEqual(data["script"]["practice_type"], "ground")
        self.assertGreater(len(data["script"]["cues"]), 0)

        # Test GET
        get_res = self.client.get("/api/voice/session-script?practice_type=sleep&mode=guided")
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.json()
        self.assertEqual(get_data["script"]["practice_type"], "sleep")

    def test_api_voice_personas_endpoint(self):
        """Verify GET /api/voice/personas returns available personas."""
        res = self.client.get("/api/voice/personas")
        self.assertEqual(res.status_code, 200)
        personas = res.json().get("personas", [])
        self.assertGreaterEqual(len(personas), 6)

    def test_rich_session_intelligence_persistence(self):
        """Verify studio session recording with all Phase 4.3 intelligence fields."""
        payload = {
            "practice_type": "yoga",
            "routine": "Desk Relief",
            "planned_duration": 420,
            "actual_duration": 415,
            "completed": True,
            "paused": True,
            "pauses_count": 2,
            "resumed": True,
            "voice_used": True,
            "completion_status": "full",
            "exit_reason": "completed",
            "practice_mode": "guided",
            "voice_style": "echo",
        }

        # Test primary endpoint /api/studio/sessions
        res = self.client.post("/api/studio/sessions", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["practice_type"], "yoga")
        self.assertEqual(data["pauses_count"], 2)
        self.assertTrue(data["resumed"])
        self.assertTrue(data["voice_used"])
        self.assertEqual(data["practice_mode"], "guided")
        self.assertEqual(data["voice_style"], "echo")

        # Test route alias /api/studio/session
        res_alias = self.client.post("/api/studio/session", json=payload)
        self.assertEqual(res_alias.status_code, 200)
        data_alias = res_alias.json()
        self.assertEqual(data_alias["practice_type"], "yoga")
        self.assertEqual(data_alias["completion_status"], "full")


if __name__ == "__main__":
    unittest.main()
