import unittest
from fastapi.testclient import TestClient
from main import app
from services.world_service import (
    get_world_state,
    acknowledge_unlocks,
    get_world_memories,
    update_ambience_preferences,
    get_current_season,
    get_time_of_day,
    get_ambient_description,
)
from models.world import AmbiencePreferences


class TestWorldServiceAndEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_user_id = "test_user_world_001"

    def test_world_environment_calculation(self):
        # Morning test
        tod_morning = get_time_of_day(hour=7)
        self.assertEqual(tod_morning, "morning")

        # Afternoon test
        tod_afternoon = get_time_of_day(hour=14)
        self.assertEqual(tod_afternoon, "afternoon")

        # Evening test
        tod_evening = get_time_of_day(hour=19)
        self.assertEqual(tod_evening, "evening")

        # Night test
        tod_night = get_time_of_day(hour=23)
        self.assertEqual(tod_night, "night")

        season = get_current_season()
        self.assertIn(season, ["spring", "summer", "autumn", "winter"])

        desc = get_ambient_description(tod_afternoon, season)
        self.assertTrue(len(desc) > 0)

    def test_world_state_and_memories(self):
        # Initial state
        state = get_world_state(self.test_user_id, client_hour=14)
        self.assertEqual(state["user_id"], self.test_user_id)
        self.assertEqual(state["time_of_day"], "afternoon")
        self.assertIsInstance(state["unlocked_objects"], list)

        # Test Acknowledge unlocks
        ack_res = acknowledge_unlocks(self.test_user_id, ["test_unlock_id"])
        self.assertTrue(ack_res)

        # Memories retrieval
        memories = get_world_memories(self.test_user_id)
        self.assertIsInstance(memories, list)

    def test_ambience_preferences_persistence(self):
        new_prefs = {
            "master": 0.75,
            "wind": 0.4,
            "birds": 0.6,
            "water": 0.1,
            "rain": 0.5,
            "crickets": 0.2,
            "muted": False,
        }
        saved = update_ambience_preferences(self.test_user_id, new_prefs)
        self.assertAlmostEqual(saved["master"], 0.75)
        self.assertAlmostEqual(saved["birds"], 0.6)

        state = get_world_state(self.test_user_id)
        self.assertAlmostEqual(state["ambience_preferences"]["master"], 0.75)

    def test_world_api_endpoints(self):
        # GET /api/world/environment
        res = self.client.get("/api/world/environment?hour=9")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["time_of_day"], "morning")

        # GET /api/world/state
        res = self.client.get(f"/api/world/state?hour=15")
        self.assertEqual(res.status_code, 200)
        state_data = res.json()
        self.assertEqual(state_data["time_of_day"], "afternoon")

        # POST /api/world/acknowledge
        res = self.client.post(
            "/api/world/acknowledge",
            json={"unlock_ids": ["dummy_id"]},
        )
        self.assertEqual(res.status_code, 200)

        # POST /api/world/unlock-acknowledged
        res_alias = self.client.post(
            "/api/world/unlock-acknowledged",
            json={"unlock_ids": ["dummy_id"]},
        )
        self.assertEqual(res_alias.status_code, 200)

        # GET /api/world/memories
        res = self.client.get("/api/world/memories")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        # POST /api/world/ambience
        res = self.client.post(
            "/api/world/ambience",
            json={
                "master": 0.8,
                "wind": 0.2,
                "birds": 0.3,
                "water": 0.4,
                "rain": 0.1,
                "crickets": 0.0,
                "muted": True,
            },
        )
        self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
