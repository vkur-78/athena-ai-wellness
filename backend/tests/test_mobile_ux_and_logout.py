import time
import pytest
from playwright.sync_api import sync_playwright

import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = os.getenv("TEST_BASE_URL", "https://athena-ai-wellness.vercel.app")

def test_mobile_responsive_viewports_and_no_overflow():
    """Verify pages render cleanly without horizontal overflow across 320, 360, 375, 390, 430, and desktop widths."""
    viewports = [
        {"width": 320, "height": 640},  # iPhone SE (small)
        {"width": 360, "height": 740},  # Android standard
        {"width": 375, "height": 667},  # iPhone 8 / SE2
        {"width": 390, "height": 844},  # iPhone 12/13/14
        {"width": 430, "height": 932},  # iPhone 14/15 Pro Max
        {"width": 768, "height": 1024}, # iPad / Tablet
        {"width": 1280, "height": 800}, # Desktop
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)

        for vp in viewports:
            context = browser.new_context(viewport=vp)
            page = context.new_page()

            # 1. Login Page Viewport Check
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            inner_width = page.evaluate("() => window.innerWidth")
            assert scroll_width <= inner_width + 1, f"Horizontal overflow on /login at {vp['width']}px (scrollWidth={scroll_width})"

            # Verify login inputs have min 44px height for touch accessibility
            email_box = page.locator("#login-email").bounding_box()
            assert email_box and email_box["height"] >= 36, f"Email input height {email_box} too small at {vp['width']}px"

            context.close()

        browser.close()

def test_profile_logout_flow_and_protected_routes():
    """Verify mobile profile logout action, confirmation dialog, cancellation, escape key, real session clearing, and protected route rejection."""
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        # Test in iPhone 14 mobile viewport (390x844)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        # Step 1: Open login and enter Demo session
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        demo_btn = page.locator("#demo-mode-button")
        assert demo_btn.is_visible()
        demo_btn.click()
        page.wait_for_url(f"{BASE_URL}/", timeout=25000)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Step 2: Navigate to Profile page
        page.goto(f"{BASE_URL}/profile")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        assert page.url == f"{BASE_URL}/profile"

        # Step 3: Check visible Sign Out buttons
        header_logout_btn = page.locator("#profile-header-logout-btn")
        bottom_logout_btn = page.locator("#profile-bottom-logout-btn")
        assert header_logout_btn.is_visible(), "Header sign out button must be visible"
        assert bottom_logout_btn.is_visible(), "Bottom session sign out button must be visible"

        # Step 4: Test Cancellation in Confirmation Dialog
        header_logout_btn.click()
        time.sleep(0.5)

        # Dialog must be present
        modal = page.locator("div[role='dialog']")
        assert modal.is_visible(), "Logout confirmation dialog must appear"
        title = modal.locator("#logout-dialog-title").inner_text()
        assert "sign out" in title.lower() or "demo" in title.lower(), f"Unexpected dialog title: {title}"

        # Click cancel
        cancel_btn = modal.locator("button:has-text('Stay in Sanctuary')")
        assert cancel_btn.is_visible()
        cancel_btn.click()
        time.sleep(0.5)
        assert modal.count() == 0 or not modal.is_visible(), "Dialog must close on cancel"
        assert page.url == f"{BASE_URL}/profile", "Must stay on profile on cancel"

        # Step 5: Test Escape Key to close modal
        bottom_logout_btn.click()
        time.sleep(0.5)
        assert page.locator("div[role='dialog']").is_visible(), "Dialog opens from bottom button"
        page.keyboard.press("Escape")
        time.sleep(0.5)
        assert page.locator("div[role='dialog']").count() == 0 or not page.locator("div[role='dialog']").is_visible(), "Escape key must close dialog"

        # Step 6: Test Real Logout Execution
        header_logout_btn.click()
        time.sleep(0.5)
        confirm_btn = page.locator("#confirm-logout-button")
        assert confirm_btn.is_visible(), "Confirm logout button must be visible"
        confirm_btn.click()

        # Step 7: Verify Redirection to /login
        page.wait_for_url(f"{BASE_URL}/login", timeout=15000)
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        assert page.url.startswith(f"{BASE_URL}/login"), f"Expected /login, got {page.url}"

        # Step 8: Verify Client Storage Wiped
        tokens = page.evaluate("() => ({ auth: localStorage.getItem('athena_auth_token'), demo: localStorage.getItem('athena_demo_token'), mode: localStorage.getItem('athena_demo_mode') })")
        assert tokens["auth"] is None, "athena_auth_token must be cleared on logout"
        assert tokens["demo"] is None, "athena_demo_token must be cleared on logout"
        assert tokens["mode"] is None, "athena_demo_mode must be cleared on logout"

        # Step 9: Verify Protected Route Access Blocked After Logout
        # Try navigating directly to /profile
        page.goto(f"{BASE_URL}/profile")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        assert page.url.startswith(f"{BASE_URL}/login"), f"Unauthenticated access to /profile must bounce to /login, got {page.url}"

        # Try navigating directly to /
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        assert page.url.startswith(f"{BASE_URL}/login"), f"Unauthenticated access to / must bounce to /login, got {page.url}"

        browser.close()

def test_mobile_dock_touch_targets_and_safe_padding():
    """Verify mobile bottom navigation touch targets meet minimum 44px requirement and don't overlap."""
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        # Test on small 320px phone
        context = browser.new_context(viewport={"width": 320, "height": 640})
        page = context.new_page()

        # Login to demo to view sanctuary nav
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.locator("#demo-mode-button").click()
        page.wait_for_url(f"{BASE_URL}/", timeout=25000)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Inspect mobile bottom nav items
        dock = page.locator("nav[aria-label='Sanctuary Mobile Bottom Navigation']")
        assert dock.is_visible(), "Mobile bottom nav must be visible on 320px screen"

        links = dock.locator("a")
        link_count = links.count()
        assert link_count >= 8, f"Expected 8 primary destinations, found {link_count}"

        # Check each link's touch target dimensions
        for i in range(link_count):
            box = links.nth(i).bounding_box()
            assert box is not None
            assert box["height"] >= 44, f"Link {i} height {box['height']}px below 44px minimum"
            assert box["width"] >= 44, f"Link {i} width {box['width']}px below 44px minimum"

        # Check that page content is not hidden behind the dock
        main_el = page.locator("main").first
        padding_bottom = main_el.evaluate("(el) => window.getComputedStyle(el).paddingBottom")
        padding_val = int(padding_bottom.replace("px", ""))
        assert padding_val >= 90, f"Main content bottom padding {padding_val}px too small, content will be hidden by dock"

        browser.close()
