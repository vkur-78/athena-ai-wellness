import time
import os
import pytest
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = os.getenv("TEST_BASE_URL", "https://athena-ai-wellness.vercel.app")

def test_fresh_public_root_does_not_auto_login_to_demo():
    """Verify that clicking the Live link (visiting root /) in a clean browser session displays the public login experience and NEVER auto-logs into demo."""
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Step 1: Navigate to root /
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Step 2: Must redirect to /login and present public login experience
        assert page.url.startswith(f"{BASE_URL}/login"), f"Expected /login, got {page.url}"
        
        # Step 3: Check visible public controls
        title_el = page.locator("h1")
        assert "welcome" in title_el.inner_text().lower() or "athena" in title_el.inner_text().lower()
        
        email_input = page.locator("#login-email")
        password_input = page.locator("#login-password")
        login_btn = page.locator("#login-submit")
        demo_btn = page.locator("#demo-mode-button")
        
        assert email_input.is_visible(), "Email input must be visible on public login"
        assert password_input.is_visible(), "Password input must be visible on public login"
        assert login_btn.is_visible(), "Login submit button must be visible"
        assert demo_btn.is_visible(), "Explore Demo button must be available for explicit user action"

        # Step 4: Verify NO demo session tokens exist in storage
        tokens = page.evaluate("() => ({ auth: localStorage.getItem('athena_auth_token'), demo: localStorage.getItem('athena_demo_token'), mode: sessionStorage.getItem('athena_demo_mode') })")
        assert tokens["auth"] is None, "athena_auth_token must NOT exist for fresh visitor"
        assert tokens["demo"] is None, "athena_demo_token must NOT exist for fresh visitor"
        assert tokens["mode"] is None, "sessionStorage athena_demo_mode must NOT exist for fresh visitor"

        browser.close()

def test_new_tab_and_external_link_does_not_leak_demo():
    """Verify that even after a user enters demo in Tab 1, opening a new tab or revisiting root does NOT auto-login to demo."""
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        # Tab 1: user enters demo
        context1 = browser.new_context()
        page1 = context1.new_page()
        page1.goto(f"{BASE_URL}/login")
        page1.wait_for_load_state("networkidle")
        page1.locator("#demo-mode-button").click()
        page1.wait_for_url(f"{BASE_URL}/", timeout=25000)
        page1.wait_for_load_state("networkidle")
        time.sleep(1)
        assert page1.url == f"{BASE_URL}/"

        # Tab 2 / Fresh Context (simulates opening a new tab or clicking GitHub link again):
        context2 = browser.new_context()
        page2 = context2.new_page()
        page2.goto(f"{BASE_URL}/")
        page2.wait_for_load_state("networkidle")
        time.sleep(1)

        # Tab 2 MUST redirect to /login and NOT auto-login to demo
        assert page2.url.startswith(f"{BASE_URL}/login"), f"Fresh tab must bounce to /login, got {page2.url}"
        assert page2.locator("#demo-mode-button").is_visible(), "Public login must be presented"

        browser.close()

def test_intentionally_supported_direct_demo_urls():
    """Verify supported direct demo routes (/demo and /login?demo=true) explicitly initialize demo session."""
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)

        # 1. Test /demo
        context1 = browser.new_context()
        page1 = context1.new_page()
        page1.goto(f"{BASE_URL}/demo")
        page1.wait_for_url(f"{BASE_URL}/", timeout=25000)
        page1.wait_for_load_state("networkidle")
        time.sleep(1)
        assert page1.url == f"{BASE_URL}/", f"Direct /demo should navigate to dashboard, got {page1.url}"
        context1.close()

        # 2. Test /login?demo=true
        context2 = browser.new_context()
        page2 = context2.new_page()
        page2.goto(f"{BASE_URL}/login?demo=true")
        page2.wait_for_url(f"{BASE_URL}/", timeout=25000)
        page2.wait_for_load_state("networkidle")
        time.sleep(1)
        assert page2.url == f"{BASE_URL}/", f"/login?demo=true should navigate to dashboard, got {page2.url}"
        context2.close()

        browser.close()

def test_signup_page_is_public_and_clean():
    """Verify signup page /signup displays clean registration without auto-demo."""
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(f"{BASE_URL}/signup")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        assert page.url.startswith(f"{BASE_URL}/signup")
        assert page.locator("input[type='email']").is_visible()
        assert page.locator("input[type='password']").is_visible()

        browser.close()
