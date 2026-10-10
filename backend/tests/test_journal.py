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
from auth.verify import verify_user
from ai.journal_reflection import (
    generate_fallback_journal_reflection,
    generate_journal_reflection
)
from services.journal_service import (
    create_entry,
    list_entries,
    get_entry,
    update_entry,
    delete_entry,
    generate_entry_reflection,
    _load_local_journal,
    _save_local_journal
)

class MockUserA:
    id = "user-alpha-1111"
    email = "alpha@athena.sanctuary"

class MockUserB:
    id = "user-beta-2222"
    email = "beta@athena.sanctuary"

current_mock_user = MockUserA()

def mock_verify_user():
    return current_mock_user

class TestTherapeuticJournal(unittest.TestCase):
    def setUp(self):
        global current_mock_user
        current_mock_user = MockUserA()
        app.dependency_overrides[verify_user] = mock_verify_user
        self.client = TestClient(app)
        self.user_a_id = "user-alpha-1111"
        self.user_b_id = "user-beta-2222"

        # Clear test users from local cache
        local = _load_local_journal()
        if self.user_a_id in local:
            del local[self.user_a_id]
        if self.user_b_id in local:
            del local[self.user_b_id]
        _save_local_journal(local)

    def tearDown(self):
        app.dependency_overrides.clear()
        local = _load_local_journal()
        if self.user_a_id in local:
            del local[self.user_a_id]
        if self.user_b_id in local:
            del local[self.user_b_id]
        _save_local_journal(local)

    def test_reflection_fallback_matrix(self):
        # Heavy/worry text
        worry_ref = generate_fallback_journal_reflection("I couldn't stop worrying about tomorrow and all the tasks.")
        self.assertIn("untangle", worry_ref.lower())
        self.assertTrue(len(worry_ref) > 20)

        # Peaceful text
        peace_ref = generate_fallback_journal_reflection("Today I felt calm and grateful for the quiet moments.")
        self.assertIn("peace", peace_ref.lower())

        # General reflective text
        gen_ref = generate_fallback_journal_reflection("Just writing down thoughts as they come.")
        self.assertIn("thoughts", gen_ref.lower())

    def test_journal_service_crud_and_long_writing(self):
        # 1. Create long writing entry without reflection
        long_content = (
            "Today felt quieter than I expected. Pausing helped me breathe.\n\n"
            + "I spent the morning walking through the park without my phone. The trees were beginning to turn golden. " * 5
            + "\n\nIt feels good to have this quiet space where I don't need to perform or have perfect words."
        )
        entry = create_entry(
            user_id=self.user_a_id,
            content=long_content,
            reflection_enabled=False
        )
        self.assertEqual(entry["user_id"], self.user_a_id)
        self.assertIn("quieter", entry["content"])
        self.assertIsNone(entry["ai_reflection"])
        self.assertFalse(entry["reflection_enabled"])
        entry_id = entry["id"]

        # 2. Retrieve entry by id
        fetched = get_entry(self.user_a_id, entry_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["id"], entry_id)
        self.assertEqual(fetched["content"], long_content)

        # 3. List entries
        entries = list_entries(self.user_a_id)
        self.assertEqual(len(entries), 1)

        # 4. Search query filter
        matching = list_entries(self.user_a_id, query="breathe")
        self.assertEqual(len(matching), 1)
        non_matching = list_entries(self.user_a_id, query="nonexistent keyword")
        self.assertEqual(len(non_matching), 0)

        # 5. On-demand AI reflection
        reflected = generate_entry_reflection(self.user_a_id, entry_id)
        self.assertIsNotNone(reflected)
        self.assertTrue(reflected["reflection_enabled"])
        self.assertIsNotNone(reflected["ai_reflection"])
        self.assertTrue(len(reflected["ai_reflection"]) > 15)

        # 6. Update entry
        updated = update_entry(self.user_a_id, entry_id, content="Updated reflection note.")
        self.assertEqual(updated["content"], "Updated reflection note.")

        # 7. Delete entry
        deleted = delete_entry(self.user_a_id, entry_id)
        self.assertTrue(deleted)
        self.assertIsNone(get_entry(self.user_a_id, entry_id))

    def test_api_endpoints_lifecycle(self):
        # 1. POST /api/journal (Create private entry without reflection)
        res_post = self.client.post("/api/journal", json={
            "content": "Night writing: looking back at the week and finding small moments of clarity.",
            "reflection_enabled": False
        })
        self.assertEqual(res_post.status_code, 201)
        data = res_post.json()
        entry_id = data["id"]
        self.assertFalse(data["reflection_enabled"])
        self.assertIsNone(data["ai_reflection"])

        # 2. GET /api/journal (List)
        res_list = self.client.get("/api/journal")
        self.assertEqual(res_list.status_code, 200)
        items = res_list.json()
        self.assertGreaterEqual(len(items), 1)

        # 3. GET /api/journal with query
        res_search = self.client.get("/api/journal?q=clarity")
        self.assertEqual(res_search.status_code, 200)
        self.assertEqual(len(res_search.json()), 1)

        # 4. GET /api/journal/{id}
        res_single = self.client.get(f"/api/journal/{entry_id}")
        self.assertEqual(res_single.status_code, 200)
        self.assertEqual(res_single.json()["id"], entry_id)

        # 5. POST /api/journal/{id}/reflect (On-demand reflection)
        res_reflect = self.client.post(f"/api/journal/{entry_id}/reflect")
        self.assertEqual(res_reflect.status_code, 200)
        reflected_data = res_reflect.json()
        self.assertTrue(reflected_data["reflection_enabled"])
        self.assertIsNotNone(reflected_data["ai_reflection"])

        # 6. PATCH /api/journal/{id}
        res_patch = self.client.patch(f"/api/journal/{entry_id}", json={
            "content": "Edited night writing: finding even more clarity."
        })
        self.assertEqual(res_patch.status_code, 200)
        self.assertIn("even more clarity", res_patch.json()["content"])

        # 7. DELETE /api/journal/{id}
        res_del = self.client.delete(f"/api/journal/{entry_id}")
        self.assertEqual(res_del.status_code, 200)
        self.assertTrue(res_del.json()["success"])

        # 8. Verify 404 after delete
        res_after = self.client.get(f"/api/journal/{entry_id}")
        self.assertEqual(res_after.status_code, 404)

    def test_multi_user_security_isolation(self):
        """Validates that User B cannot view, edit, reflect upon, or delete User A's private entries."""
        global current_mock_user

        # User A creates a sacred journal entry
        current_mock_user = MockUserA()
        res_a = self.client.post("/api/journal", json={
            "content": "User A private thought: deep reflection only for my own eyes.",
            "reflection_enabled": False
        })
        self.assertEqual(res_a.status_code, 201)
        entry_a_id = res_a.json()["id"]

        # Switch context to User B
        current_mock_user = MockUserB()

        # 1. User B lists entries: User A's entry must NOT appear
        res_b_list = self.client.get("/api/journal")
        self.assertEqual(res_b_list.status_code, 200)
        b_entry_ids = [e["id"] for e in res_b_list.json()]
        self.assertNotIn(entry_a_id, b_entry_ids)

        # 2. User B tries to directly fetch User A's entry: must return 404
        res_b_get = self.client.get(f"/api/journal/{entry_a_id}")
        self.assertEqual(res_b_get.status_code, 404)

        # 3. User B tries to patch User A's entry: must return 404
        res_b_patch = self.client.patch(f"/api/journal/{entry_a_id}", json={"content": "Malicious edit"})
        self.assertEqual(res_b_patch.status_code, 404)

        # 4. User B tries to trigger reflection on User A's entry: must return 404
        res_b_reflect = self.client.post(f"/api/journal/{entry_a_id}/reflect")
        self.assertEqual(res_b_reflect.status_code, 404)

        # 5. User B tries to delete User A's entry: must return 404
        res_b_del = self.client.delete(f"/api/journal/{entry_a_id}")
        self.assertEqual(res_b_del.status_code, 404)

        # Switch back to User A: entry is still intact
        current_mock_user = MockUserA()
        res_a_verify = self.client.get(f"/api/journal/{entry_a_id}")
        self.assertEqual(res_a_verify.status_code, 200)
        self.assertEqual(res_a_verify.json()["content"], "User A private thought: deep reflection only for my own eyes.")

if __name__ == "__main__":
    unittest.main()
