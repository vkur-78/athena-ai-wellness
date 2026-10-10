import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.profile_service import _load_local_profiles, _save_local_profiles
from api.auth import _load_user_credentials, _save_user_credentials, _hash_password
from playwright.sync_api import sync_playwright

def run_test():
    test_email = "expired_test_account@sanctuary.com"
    test_pass = "Password123!"
    now_utc = datetime.now(timezone.utc)
    started = (now_utc - timedelta(days=32)).isoformat()
    uid = "exp_user_e2e_test_id"

    # Add credentials
    creds = _load_user_credentials()
    creds[test_email] = {
        "user_id": uid,
        "email": test_email,
        "password_hash": _hash_password(test_pass),
        "created_at": started,
    }
    _save_user_credentials(creds)

    # Add profile
    profiles = _load_local_profiles()
    profiles[uid] = {
        "id": uid,
        "user_id": uid,
        "email": test_email,
        "display_name": "Expired Journey User",
        "created_at": started,
        "trial_started_at": started,
        "is_paid": False,
        "onboarding_completed": True,
    }
    _save_local_profiles(profiles)

    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=chrome_path, headless=True)
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            page = context.new_page()

            # 1. Login with user credentials
            print("[Step 1] Logging into http://localhost:3000/login...")
            page.goto("http://localhost:3000/login")
            page.wait_for_load_state("networkidle")
            page.fill("#login-email", test_email)
            page.fill("#login-password", test_pass)
            page.click("#login-submit")
            page.wait_for_url("http://localhost:3000/", timeout=20000)
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            print("Successfully logged in, current URL:", page.url)

            # 2. Check Trial Reminder Banner on home
            banner = page.locator("div[role='region']").first
            assert banner.is_visible(), "Expired trial reminder banner must be visible"
            banner_text = banner.inner_text()
            print("Home Banner Text:", banner_text.replace("\n", " "))
            assert "ended" in banner_text.lower(), "Banner must state trial has ended"

            # 3. Check Sanctuary Nav badge on home
            header_text = page.locator("header").first.inner_text()
            print("Header Text:", header_text.replace("\n", " "))
            assert "Trial Ended" in header_text, "Nav badge must display Trial Ended"

            # 4. Check Chat page displays TrialExpiredView
            print("[Step 2] Navigating to http://localhost:3000/chat...")
            page.goto("http://localhost:3000/chat")
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            chat_text = page.locator("body").inner_text()
            assert "Continue Your Athena Journey" in chat_text, "Title must be present"
            assert "30-day free trial has ended" in chat_text, "Subtitle must explain 30-day trial ended"
            assert "vp701049@gmail.com" in chat_text, "Verified business email must be present"
            assert "8879302705" in chat_text, "Verified business phone must be present"
            print("Chat Page successfully rendered TrialExpiredView with verified contact details!")

            # 5. Check Profile page
            print("[Step 3] Navigating to http://localhost:3000/profile...")
            page.goto("http://localhost:3000/profile")
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            profile_text = page.locator("body").inner_text()
            assert "30-Day Free Trial Ended" in profile_text, "Profile membership section must display trial ended"
            print("Profile Page displays 30-Day Free Trial Ended!")

            print("\n>>> ALL EXPIRED USER REAL AUTH & UI FLOWS PASSED! <<<")
            browser.close()
    finally:
        # Clean up test user
        creds = _load_user_credentials()
        if test_email in creds:
            del creds[test_email]
            _save_user_credentials(creds)
        profiles = _load_local_profiles()
        if uid in profiles:
            del profiles[uid]
            _save_local_profiles(profiles)

if __name__ == "__main__":
    run_test()
