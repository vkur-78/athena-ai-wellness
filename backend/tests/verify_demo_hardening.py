import os
import sys
from datetime import date

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.demo_session_service import (
    create_demo_session,
    check_and_increment_demo_prompt,
    get_demo_session_status,
)
from services.demo_date_projector import (
    get_current_server_date_ist,
    get_demo_date_offset,
)
from services.checkin_service import get_checkin_history
from services.journal_service import list_entries
from services.studio_service import get_studio_sessions
from services.monthly_replay_service import synthesize_monthly_replay
from services.monthly_replay_pdf import build_monthly_replay_pdf
from services.living_replay_service import synthesize_living_replay, build_living_replay_pdf

def test_three_prompt_limit():
    print("\n--- TEST: 3-PROMPT LIMIT & EXPIRATION BOUNDARY ---")
    session = create_demo_session()
    token = session["token"]
    assert token.startswith("demo_session_"), f"Unexpected token prefix: {token}"
    print(f"Demo session created: {session['session_id']}")

    # Prompt 1
    ok1, rem1, err1 = check_and_increment_demo_prompt(token)
    print(f"Prompt 1 -> allowed: {ok1}, remaining: {rem1}")
    assert ok1 is True and rem1 == 2, "Prompt 1 failed"

    # Prompt 2
    ok2, rem2, err2 = check_and_increment_demo_prompt(token)
    print(f"Prompt 2 -> allowed: {ok2}, remaining: {rem2}")
    assert ok2 is True and rem2 == 1, "Prompt 2 failed"

    # Prompt 3
    ok3, rem3, err3 = check_and_increment_demo_prompt(token)
    print(f"Prompt 3 -> allowed: {ok3}, remaining: {rem3}")
    assert ok3 is True and rem3 == 0, "Prompt 3 failed"

    # Prompt 4 (Must be blocked)
    ok4, rem4, err4 = check_and_increment_demo_prompt(token)
    print(f"Prompt 4 (Attempted) -> allowed: {ok4}, remaining: {rem4}, error: {err4}")
    assert ok4 is False and rem4 == 0, "Prompt 4 should have been blocked"
    assert err4 == "Demo prompt limit reached", f"Unexpected error: {err4}"

    # Status check across page refresh simulation
    status = get_demo_session_status(token)
    print(f"Simulated Refresh Demo Status: {status['status']}, prompts_used: {status['prompts_used']}")
    assert status["status"] == "exhausted", "Session should be exhausted"
    assert status["prompts_used"] == 3, "Prompts used should be 3"
    assert status["remaining"] == 0, "Remaining should be 0"
    print("3-Prompt limit verification passed!")

def test_dynamic_date_projection():
    print("\n--- TEST: DYNAMIC DATE PROJECTION (SIMULATED FUTURE DATE) ---")
    os.environ["ATHENA_SIMULATED_DATE"] = "2027-06-15"

    today = get_current_server_date_ist()
    print(f"Simulated Today IST: {today}")
    assert today == date(2027, 6, 15), "Simulated date mismatch"

    offset = get_demo_date_offset()
    print(f"Timeline Shift Offset: {offset.days} days")
    assert offset.days in (251, 252), f"Offset should be 251 or 252 days, got {offset.days}"

    demo_id = "59327d2b-6e65-456e-ab5a-148602a4bd75"

    # Latest checkin
    checkins = get_checkin_history(demo_id, limit=5)
    latest_ci = checkins[0]["date"]
    print(f"Latest check-in date: {latest_ci}")
    assert latest_ci in ("2027-06-14", "2027-06-15"), f"Expected 2027-06-14 or 2027-06-15, got {latest_ci}"

    # 24-month horizon check
    all_checkins = get_checkin_history(demo_id, limit=600)
    earliest_ci = all_checkins[-1]["date"]
    print(f"Earliest check-in date: {earliest_ci} (Total records: {len(all_checkins)})")
    assert earliest_ci.startswith("2025-"), f"Expected 2025-, got {earliest_ci}"

    # Monthly Replay agrees on dynamic month
    replay = synthesize_monthly_replay(demo_id)
    print(f"Projected Monthly Replay: {replay['month']} ({replay['month_display']})")
    assert replay["month"] == "2027-06", f"Expected 2027-06, got {replay['month']}"
    assert replay["month_display"] == "June 2027"

    # Reset simulated date
    del os.environ["ATHENA_SIMULATED_DATE"]
    print("Dynamic date projection passed!")

def test_pdf_multilingual_artifacts():
    print("\n--- TEST: ATHENA BRANDED PDF ACROSS LANGUAGES ---")
    demo_id = "59327d2b-6e65-456e-ab5a-148602a4bd75"
    m_data = synthesize_monthly_replay(demo_id)
    m_data["is_demo"] = True

    w_data = synthesize_living_replay(demo_id, replay_type="weekly")
    w_data["is_demo"] = True

    for lang in ["en", "hi", "ta", "te", "mr", "gu"]:
        m_pdf = build_monthly_replay_pdf(m_data, lang=lang)
        w_pdf = build_living_replay_pdf(w_data, lang=lang)
        print(f"Language: {lang.upper()} -> Monthly PDF: {len(m_pdf):,} bytes | Weekly PDF: {len(w_pdf):,} bytes")
        assert len(m_pdf) > 5000, f"Monthly PDF too small for {lang}"
        assert len(w_pdf) > 3000, f"Weekly PDF too small for {lang}"

    print("Multilingual PDF generation passed!")

if __name__ == "__main__":
    test_three_prompt_limit()
    test_dynamic_date_projection()
    test_pdf_multilingual_artifacts()
    print("\n=======================================================")
    print("ALL FINAL DEMO HARDENING VERIFICATION TESTS PASSED!")
    print("=======================================================")
