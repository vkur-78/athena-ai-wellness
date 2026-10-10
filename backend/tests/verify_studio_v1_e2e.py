import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8001"

def http_get(path, headers=None):
    req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers or {})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def http_post(path, data, headers=None):
    payload = json.dumps(data).encode("utf-8")
    h = {"Content-Type": "application/json", **(headers or {})}
    req = urllib.request.Request(f"{BASE_URL}{path}", data=payload, headers=h, method="POST")
    with urllib.request.urlopen(req) as resp:
        content_type = resp.headers.get("content-type", "")
        body = resp.read()
        if "application/json" in content_type:
            return resp.status, json.loads(body.decode("utf-8")), resp.headers
        return resp.status, body, resp.headers

def http_patch(path, data, headers=None):
    payload = json.dumps(data).encode("utf-8")
    h = {"Content-Type": "application/json", **(headers or {})}
    req = urllib.request.Request(f"{BASE_URL}{path}", data=payload, headers=h, method="PATCH")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def test_studio_system():
    print("[1] Testing GET /studio/exercises...")
    status, data = http_get("/studio/exercises")
    assert status == 200, f"Expected 200, got {status}"
    exercises = data.get("exercises", [])
    categories = data.get("categories", [])
    print(f"  Found {len(exercises)} exercises across categories: {categories}")
    assert len(exercises) >= 11, f"Expected at least 11 exercises, got {len(exercises)}"
    
    # Verify 2-Minute Reset
    two_min = next((e for e in exercises if e["id"] == "two_minute_reset"), None)
    assert two_min is not None, "2-Minute Reset not found"
    assert two_min["duration_seconds"] == 120
    assert len(two_min["steps"]) == 6
    assert two_min["steps"][0]["pause_after_seconds"] >= 0
    print("  2-Minute Reset verified with 6 steps and pause_after_seconds.")

    print("\n[2] Testing GET /studio/exercises/box_breathing...")
    status, box_ex = http_get("/studio/exercises/box_breathing")
    assert status == 200
    assert box_ex["id"] == "box_breathing"
    assert box_ex["category"] == "BREATHE"
    print(f"  Box breathing verified: {box_ex['title']}, {len(box_ex['steps'])} steps.")

    print("\n[3] Testing POST /studio/sessions/start...")
    test_user_headers = {"X-User-Id": "test_e2e_studio_user"}
    start_payload = {
        "exercise_id": "two_minute_reset",
        "exercise_name": "2-Minute Reset",
        "exercise_category": "RESET",
        "instruction_mode": "BOTH",
        "voice_used": True,
        "voice_enabled": True,
        "playback_speed": 1.0,
        "total_steps": 6
    }
    status, session, _ = http_post("/studio/sessions/start", start_payload, headers=test_user_headers)
    assert status == 200
    session_id = session.get("id") or session.get("session_id")
    print(f"  Session started: ID={session_id}, status={session.get('session_status') or session.get('completion_status')}")

    print("\n[4] Testing PATCH /studio/sessions/{id} progress...")
    update_payload = {
        "steps_completed": 3,
        "last_step": 3,
        "duration_seconds": 45,
        "playback_speed": 1.0,
        "session_status": "started"
    }
    status, updated = http_patch(f"/studio/sessions/{session_id}", update_payload, headers=test_user_headers)
    assert status == 200
    assert updated.get("steps_completed") == 3
    print(f"  Session progress updated: steps_completed={updated.get('steps_completed')}")

    print("\n[5] Testing POST /studio/sessions/{id}/complete...")
    complete_payload = {
        "duration_seconds": 122,
        "steps_completed": 6,
        "total_steps": 6,
        "voice_used": True,
        "voice_enabled": True,
        "playback_speed": 1.0,
        "instruction_mode": "BOTH",
        "session_status": "completed",
        "after_mood": "A little lighter"
    }
    status, completed, _ = http_post(f"/studio/sessions/{session_id}/complete", complete_payload, headers=test_user_headers)
    assert status == 200
    assert completed.get("completed") is True
    print(f"  Session completed successfully: duration={completed.get('duration_seconds')}s")

    print("\n[6] Testing GET /studio/history...")
    status, history = http_get("/studio/history?limit=10", headers=test_user_headers)
    assert status == 200
    sessions = history.get("sessions", [])
    today_count = history.get("today_completed_count")
    label = history.get("today_activity_label")
    rec = history.get("recommended_exercise")
    print(f"  History sessions count: {len(sessions)}")
    print(f"  Today completed count: {today_count}")
    print(f"  Today activity label: '{label}'")
    print(f"  Recommended exercise: {rec.get('exercise', {}).get('title')} ({rec.get('reason')})")
    assert today_count >= 1, "Expected at least 1 practice completed today"
    assert "completed today" in label

    print("\n[7] Testing POST /api/voice/speak...")
    voice_payload = {
        "text": "Pause where you are. Take a slow, comfortable breath.",
        "voice": "nova",
        "speed": 0.95
    }
    status, audio_body, headers = http_post("/api/voice/speak", voice_payload)
    assert status == 200
    audio_bytes = len(audio_body)
    content_type = headers.get("content-type", "")
    print(f"  Voice synthesized: {audio_bytes} bytes, content-type={content_type}")
    assert audio_bytes > 1000, "Audio response was empty or too small"

    print("\n==================================================")
    print("ALL E2E STUDIO V1 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    try:
        test_studio_system()
    except Exception as e:
        print(f"\n[TEST FAILED]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
