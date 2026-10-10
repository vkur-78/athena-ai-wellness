import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from auth.verify import verify_user
from ai.checkin_reflection import (
    generate_fallback_reflection,
    generate_checkin_reflection,
    ENERGY_LABELS,
    STRESS_LABELS
)
from services.checkin_service import (
    create_checkin,
    get_today_checkin,
    get_checkin_history,
    _load_local_checkins,
    _save_local_checkins
)

class MockUser:
    id = "test-user-uuid-1234"
    email = "testuser@athena.sanctuary"

def mock_verify_user():
    return MockUser()

class TestDailyWellnessCheckin(unittest.TestCase):
    def setUp(self):
        # Override verify_user dependency for testing
        app.dependency_overrides[verify_user] = mock_verify_user
        self.client = TestClient(app)
        self.test_user_id = "test-user-uuid-1234"
        self.test_date = "2026-09-10"

        # Clear test user records from local cache
        local = _load_local_checkins()
        if self.test_user_id in local:
            del local[self.test_user_id]
            _save_local_checkins(local)

    def tearDown(self):
        app.dependency_overrides.clear()
        # Clean up test user records
        local = _load_local_checkins()
        if self.test_user_id in local:
            del local[self.test_user_id]
            _save_local_checkins(local)

    def test_reflection_fallback_matrix(self):
        # Test low mood reflection
        low_ref = generate_fallback_reflection("Low", 2, 4, "Too much pressure at work")
        self.assertIn("carry", low_ref.lower())
        self.assertTrue(len(low_ref) > 20)

        # Test great mood reflection
        good_ref = generate_fallback_reflection("Great", 5, 1)
        self.assertIn("lighter", good_ref.lower())

        # Test steady mood reflection
        steady_ref = generate_fallback_reflection("Okay", 3, 2)
        self.assertIn("grounding", steady_ref.lower())

    def test_checkin_service_flow(self):
        # 1. Verify no checkin initially
        status = get_today_checkin(self.test_user_id, self.test_date)
        self.assertIsNone(status)

        # 2. Create checkin
        payload = {
            "mood": "Good",
            "energy_level": 4,
            "stress_level": 2,
            "reflection_text": "Went for a morning walk.",
            "date": self.test_date
        }
        record = create_checkin(self.test_user_id, payload, client_date=self.test_date)
        self.assertEqual(record["user_id"], self.test_user_id)
        self.assertEqual(record["date"], self.test_date)
        self.assertEqual(record["mood"], "Good")
        self.assertEqual(record["energy_level"], 4)
        self.assertEqual(record["stress_level"], 2)
        self.assertTrue(len(record["ai_reflection"]) > 10)

        # 3. Verify get_today_checkin returns it
        today = get_today_checkin(self.test_user_id, self.test_date)
        self.assertIsNotNone(today)
        self.assertEqual(today["mood"], "Good")

        # 4. Verify duplicate creation raises ValueError
        with self.assertRaises(ValueError):
            create_checkin(self.test_user_id, payload, client_date=self.test_date)

        # 5. Verify history returns the checkin
        history = get_checkin_history(self.test_user_id)
        self.assertGreaterEqual(len(history), 1)
        self.assertEqual(history[0]["date"], self.test_date)

    def test_api_endpoints_full_lifecycle(self):
        # 1. Check today status before submitting (should be false)
        res = self.client.get(f"/api/checkins/today?client_date={self.test_date}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["has_checkin"])
        self.assertIsNone(data["checkin"])

        # 2. Submit checkin via API
        post_payload = {
            "mood": "Great",
            "energy": 5,
            "stress": 1,
            "reflection": "Felt energized and clear-headed all morning.",
            "date": self.test_date
        }
        res_post = self.client.post("/api/checkins", json=post_payload)
        self.assertEqual(res_post.status_code, 200)
        created = res_post.json()
        self.assertEqual(created["mood"], "Great")
        self.assertEqual(created["energy_level"], 5)
        self.assertEqual(created["stress_level"], 1)
        self.assertIn("energized", created["reflection_text"])
        self.assertTrue(len(created["ai_reflection"]) > 10)

        # 3. Check today status after submitting (should be true)
        res_today = self.client.get(f"/api/checkins/today?client_date={self.test_date}")
        self.assertEqual(res_today.status_code, 200)
        today_data = res_today.json()
        self.assertTrue(today_data["has_checkin"])
        self.assertEqual(today_data["checkin"]["mood"], "Great")

        # 4. Duplicate submission should return 409 Conflict
        res_dup = self.client.post("/api/checkins", json=post_payload)
        self.assertEqual(res_dup.status_code, 409)

        # 5. History endpoint should return the entry
        res_hist = self.client.get("/api/checkins/history")
        self.assertEqual(res_hist.status_code, 200)
        hist_data = res_hist.json()
        self.assertIsInstance(hist_data, list)
        self.assertGreaterEqual(len(hist_data), 1)

if __name__ == "__main__":
    unittest.main()
