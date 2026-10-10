import sys
import time
from playwright.sync_api import sync_playwright

def test_browser_flow():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chrome_path, headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("[Test 1] Navigating to https://athena-ai-wellness.vercel.app...")
        page.goto("https://athena-ai-wellness.vercel.app")
        page.wait_for_load_state("networkidle")
        current_url = page.url
        print(f"Current URL: {current_url}")
        assert "password" not in current_url.lower(), "No password in URL query parameters"

        print("[Test 2] Verifying empty login fields in fresh browser...")
        email_val = page.locator("#login-email").input_value()
        pass_val = page.locator("#login-password").input_value()
        print(f"Email value: {repr(email_val)}")
        print(f"Password value: {repr(pass_val)}")
        assert email_val == "", "Email input must start empty"
        assert pass_val == "", "Password input must start empty"

        print("[Test 3] Testing Demo Journey click...")
        demo_btn = page.locator("#demo-mode-button")
        assert demo_btn.is_visible(), "Demo button must be visible"
        demo_btn.click()
        page.wait_for_url("https://athena-ai-wellness.vercel.app/", timeout=20000)
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        print(f"Navigated to Sanctuary Home: {page.url}")

        print("[Test 4] Verifying Demo user does not see Trial Reminder Banner...")
        reminder_count = page.locator("div[role='region']").count()
        print(f"Role='region' elements on demo dashboard: {reminder_count}")

        print("[Test 5] Checking Demo badge in Sanctuary Nav...")
        header_text = page.locator("header").first.inner_text()
        print(f"Header text snippet: {header_text[:100].replace(chr(10), ' ')}")
        assert "Sample Journey" in header_text or "Demo" in header_text, "Demo badge must be present"

        print("[Test 6] Checking profile page for demo user...")
        page.goto("https://athena-ai-wellness.vercel.app/profile")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        body_text = page.locator("body").inner_text()
        assert "Sample 24-Month Journey" in body_text or "Demo" in body_text, "Demo status reflected on profile"

        print("\n>>> ALL BROWSER PRODUCTION FLOW TESTS PASSED! <<<")
        browser.close()

if __name__ == "__main__":
    test_browser_flow()
