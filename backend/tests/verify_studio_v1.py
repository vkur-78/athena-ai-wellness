import urllib.request
import json

BASE_BACKEND = "http://127.0.0.1:8001/api"
BASE_FRONTEND = "http://localhost:3000"

EXPECTED_EXERCISES = [
    "two_minute_reset",
    "box_breathing",
    "extended_exhale",
    "five_minute_grounding",
    "evening_wind_down",
    "mindful_focus_reset",
    "body_scan",
]

EXPECTED_CATEGORIES = [
    "ALL",
    "RESET",
    "BREATHE",
    "GROUND",
    "UNWIND",
    "FOCUS",
    "RELAXATION",
]

def run_tests():
    print("=== STARTING FULL STUDIO PRODUCTION SUITE VERIFICATION ===")

    # 1. Frontend SSR Content Check
    req = urllib.request.Request(f"{BASE_FRONTEND}/studio")
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        assert "Studio" in html, "Missing Studio heading"
        assert "A few minutes for yourself." in html, "Missing tagline"
        print("[Pass 1] Frontend SSR: /studio rendered successfully with correct Sanctuary headers.")

    # 2. Exercise Library API Check
    req2 = urllib.request.Request(f"{BASE_BACKEND}/studio/exercises")
    with urllib.request.urlopen(req2) as resp2:
        data = json.loads(resp2.read().decode("utf-8"))
        exercises = data["exercises"]
        categories = data["categories"]

        assert len(exercises) >= 7, f"Expected at least 7 exercises, got {len(exercises)}"
        for cat in ["RESET", "BREATHE", "GROUND", "FOCUS", "UNWIND", "RELAXATION"]:
            assert cat in categories, f"Missing category: {cat}"

        loaded_ids = [ex["id"] for ex in exercises]
        for exp_id in EXPECTED_EXERCISES:
            assert exp_id in loaded_ids, f"Missing expected exercise: {exp_id}"

        # Verify structured steps & phase durations
        for ex in exercises:
            assert ex["title"], f"Exercise {ex['id']} missing title"
            assert ex["category"], f"Exercise {ex['id']} missing category"
            assert ex["duration_minutes"] > 0, f"Exercise {ex['id']} invalid duration"
            assert len(ex["steps"]) >= 4, f"Exercise {ex['id']} has too few steps"
            for step in ex["steps"]:
                assert step["instruction_text"], f"Step in {ex['id']} missing instruction_text"
                assert step["duration_seconds"] > 0, f"Step in {ex['id']} invalid duration"

        # Check Box Breathing special requirements
        box_ex = next(e for e in exercises if e["id"] == "box_breathing")
        assert box_ex["caution"], "Box Breathing missing caution note"
        assert "uncomfortable" in box_ex["caution"].lower(), "Caution note missing comfort guidance"
        assert box_ex["default_pacing"] == {"inhale": 4, "hold1": 4, "exhale": 4, "hold2": 4}

        print("[Pass 2] Exercise Library: All exercises validated with structured phases and pacing.")

    # 3. Individual Exercise Retrieval Endpoint
    req_single = urllib.request.Request(f"{BASE_BACKEND}/studio/exercises/two_minute_reset")
    with urllib.request.urlopen(req_single) as resp_single:
        single_ex = json.loads(resp_single.read().decode("utf-8"))
        assert single_ex["id"] == "two_minute_reset"
        assert len(single_ex["steps"]) == 6
        print("[Pass 3] Exercise Retrieval: /studio/exercises/{id} returned structured exercise details.")

    # 4. Lifecycle: Start Session
    start_body = json.dumps({
        "exercise_id": "two_minute_reset",
        "exercise_name": "2-Minute Reset",
        "exercise_category": "RESET",
        "instruction_mode": "BOTH",
        "voice_used": True,
        "voice_enabled": True,
        "total_steps": 6,
        "planned_duration_seconds": 120,
    }).encode("utf-8")
    req3 = urllib.request.Request(
        f"{BASE_BACKEND}/studio/sessions/start",
        data=start_body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req3) as resp3:
        s_data = json.loads(resp3.read().decode("utf-8"))
        session_id = s_data["id"]
        assert s_data["completion_status"] == "STARTED"
        assert s_data["completed"] is False
        print(f"[Pass 4] Lifecycle Start: Session {session_id} initialized with status=STARTED.")

    # 5. Lifecycle: Progress Update
    update_body = json.dumps({
        "steps_completed": 3,
        "duration_seconds": 60,
        "pause_count": 1,
        "last_phase": 3,
        "last_position_seconds": 60,
    }).encode("utf-8")
    req_up = urllib.request.Request(
        f"{BASE_BACKEND}/studio/sessions/{session_id}",
        data=update_body,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    with urllib.request.urlopen(req_up) as resp_up:
        u_data = json.loads(resp_up.read().decode("utf-8"))
        assert u_data["steps_completed"] == 3
        print(f"[Pass 5] Lifecycle Update: Session progress updated to 3 steps, 60 seconds.")

    # 6. Lifecycle: Complete Session
    comp_body = json.dumps({
        "duration_seconds": 120,
        "steps_completed": 6,
        "total_steps": 6,
        "voice_used": True,
        "voice_enabled": True,
        "instruction_mode": "BOTH",
        "after_mood": "Calmer",
        "planned_duration_seconds": 120,
        "pause_count": 1,
        "last_phase": 6,
        "last_position_seconds": 120,
    }).encode("utf-8")
    req4 = urllib.request.Request(
        f"{BASE_BACKEND}/studio/sessions/{session_id}/complete",
        data=comp_body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req4) as resp4:
        c_data = json.loads(resp4.read().decode("utf-8"))
        assert c_data["completion_status"] == "COMPLETED"
        assert c_data["completed"] is True
        print(f"[Pass 6] Lifecycle Complete: Session marked COMPLETED.")

    # 7. Lifecycle: Abandon Session
    start_body2 = json.dumps({
        "exercise_id": "box_breathing",
        "exercise_name": "Box Breathing",
        "exercise_category": "BREATHE",
        "instruction_mode": "BOTH",
        "planned_duration_seconds": 240,
    }).encode("utf-8")
    req5 = urllib.request.Request(
        f"{BASE_BACKEND}/studio/sessions/start",
        data=start_body2,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req5) as resp5:
        s_data2 = json.loads(resp5.read().decode("utf-8"))
        session_id2 = s_data2["id"]

    ab_body = json.dumps({
        "duration_seconds": 45,
        "steps_completed": 2,
        "last_step": 3,
        "total_steps": 14,
        "reason": "user_ended_early",
        "pause_count": 0,
        "last_phase": 3,
        "last_position_seconds": 45,
    }).encode("utf-8")
    req6 = urllib.request.Request(
        f"{BASE_BACKEND}/studio/sessions/{session_id2}/abandon",
        data=ab_body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req6) as resp6:
        ab_data = json.loads(resp6.read().decode("utf-8"))
        assert ab_data["completion_status"] == "ABANDONED"
        assert ab_data["completed"] is False
        print(f"[Pass 7] Lifecycle Abandon: Early exit stored as ABANDONED (not completed).")

    # 8. User Practice History (Strictly Real Records Only)
    req7 = urllib.request.Request(f"{BASE_BACKEND}/studio/history?limit=10")
    with urllib.request.urlopen(req7) as resp7:
        h_data = json.loads(resp7.read().decode("utf-8"))
        assert "sessions" in h_data
        assert "total_completed" in h_data
        assert "today_activity_label" in h_data
        assert len(h_data["sessions"]) > 0
        print(f"[Pass 8] User Practice History: Retrieved {len(h_data['sessions'])} verified stored records.")

    print("\n==================================================")
    print("ALL PRODUCTION STUDIO REBUILD VERIFICATIONS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_tests()
