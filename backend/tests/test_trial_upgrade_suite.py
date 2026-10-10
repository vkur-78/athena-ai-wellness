"""
Test Suite: 30-Day Free Trial, Expiry Access Control, Owner Upgrade & Login Security
Athena AI Wellness Sanctuary
"""

import os
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
from services.profile_service import (
    get_profile,
    save_onboarding_profile,
    update_profile,
    upgrade_user_entitlement,
    _load_local_profiles,
    _save_local_profiles,
)
from auth.verify import require_active_entitlement
from api.auth import _issue_application_token, _hash_password, _load_user_credentials, _save_user_credentials
from config import JWT_SECRET

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_test_profiles():
    """Ensure test users are cleaned up after tests."""
    yield
    local = _load_local_profiles()
    to_delete = [uid for uid, p in local.items() if p.get("email", "").endswith("@trialtest.athena.sanctuary")]
    if to_delete:
        for uid in to_delete:
            del local[uid]
        _save_local_profiles(local)

    creds = _load_user_credentials()
    to_delete_creds = [e for e in creds.keys() if e.endswith("@trialtest.athena.sanctuary")]
    if to_delete_creds:
        for e in to_delete_creds:
            del creds[e]
        _save_user_credentials(creds)


def test_part2_no_personal_office_credentials_in_data():
    """Verify that vijay.inhyma@gmail.com is not in user_credentials.json or user_profiles.json."""
    creds = _load_user_credentials()
    assert "vijay.inhyma@gmail.com" not in creds, "Office email must not exist in user_credentials.json"

    profiles = _load_local_profiles()
    for uid, prof in profiles.items():
        assert prof.get("email") != "vijay.inhyma@gmail.com", f"Office email must not exist in profile {uid}"


def test_part3_registration_starts_30_day_trial():
    """A newly registered account receives a 30-day trial with server-side timestamps."""
    reg_email = f"user_{datetime.now().timestamp()}@trialtest.athena.sanctuary"
    reg_payload = {
        "email": reg_email,
        "password": "SecurePassword123!",
        "display_name": "Trial Explorer"
    }

    res = client.post("/auth/register", json=reg_payload)
    assert res.status_code == 200, f"Registration failed: {res.text}"
    data = res.json()
    token = data["access_token"]
    user_id = data["user_id"]

    # Verify profile trial state
    prof = get_profile(user_id)
    assert prof is not None
    assert prof["trial_active"] is True
    assert prof["trial_days_remaining"] == 30
    assert prof["entitlement_mode"] == "TRIAL_30_DAYS"
    assert prof["is_paid"] is False
    assert prof["trial_started_at"] is not None
    assert prof["trial_ends_at"] is not None


def test_part3_trial_dates_deterministic_fixtures():
    """Verify deterministic trial remaining days calculation for 7 days, 3 days, 1 day, and expired."""
    now_utc = datetime.now(timezone.utc)
    local = _load_local_profiles()

    # 1. Test 7 days remaining (23 days elapsed)
    uid_7 = f"test_7_days_{datetime.now().timestamp()}"
    started_7 = (now_utc - timedelta(days=23)).isoformat()
    local[uid_7] = {
        "id": uid_7,
        "user_id": uid_7,
        "email": f"{uid_7}@trialtest.athena.sanctuary",
        "created_at": started_7,
        "trial_started_at": started_7,
        "is_paid": False
    }

    # 2. Test 3 days remaining (27 days elapsed)
    uid_3 = f"test_3_days_{datetime.now().timestamp()}"
    started_3 = (now_utc - timedelta(days=27)).isoformat()
    local[uid_3] = {
        "id": uid_3,
        "user_id": uid_3,
        "email": f"{uid_3}@trialtest.athena.sanctuary",
        "created_at": started_3,
        "trial_started_at": started_3,
        "is_paid": False
    }

    # 3. Test final day remaining (29.5 days elapsed)
    uid_1 = f"test_1_day_{datetime.now().timestamp()}"
    started_1 = (now_utc - timedelta(days=29.5)).isoformat()
    local[uid_1] = {
        "id": uid_1,
        "user_id": uid_1,
        "email": f"{uid_1}@trialtest.athena.sanctuary",
        "created_at": started_1,
        "trial_started_at": started_1,
        "is_paid": False
    }

    # 4. Test expired trial (31 days elapsed)
    uid_exp = f"test_expired_{datetime.now().timestamp()}"
    started_exp = (now_utc - timedelta(days=31)).isoformat()
    local[uid_exp] = {
        "id": uid_exp,
        "user_id": uid_exp,
        "email": f"{uid_exp}@trialtest.athena.sanctuary",
        "created_at": started_exp,
        "trial_started_at": started_exp,
        "is_paid": False
    }

    _save_local_profiles(local)

    # Assert 7 days remaining
    prof_7 = get_profile(uid_7)
    assert prof_7["trial_active"] is True
    assert prof_7["trial_days_remaining"] == 7
    assert prof_7["entitlement_mode"] == "TRIAL_30_DAYS"

    # Assert 3 days remaining
    prof_3 = get_profile(uid_3)
    assert prof_3["trial_active"] is True
    assert prof_3["trial_days_remaining"] == 3
    assert prof_3["entitlement_mode"] == "TRIAL_30_DAYS"

    # Assert 1 day (final day) remaining
    prof_1 = get_profile(uid_1)
    assert prof_1["trial_active"] is True
    assert prof_1["trial_days_remaining"] == 1
    assert prof_1["entitlement_mode"] == "TRIAL_30_DAYS"

    # Assert expired
    prof_exp = get_profile(uid_exp)
    assert prof_exp["trial_active"] is False
    assert prof_exp["trial_days_remaining"] == 0
    assert prof_exp["entitlement_mode"] == "ATHENA_FREE"


def test_part3_expired_user_backend_access_control():
    """An expired user is blocked from active creation (POST /chat, POST /checkins) with HTTP 403 and contact info."""
    now_utc = datetime.now(timezone.utc)
    uid_exp = f"test_acc_ctrl_{datetime.now().timestamp()}"
    email_exp = f"{uid_exp}@trialtest.athena.sanctuary"
    started_exp = (now_utc - timedelta(days=32)).isoformat()

    local = _load_local_profiles()
    local[uid_exp] = {
        "id": uid_exp,
        "user_id": uid_exp,
        "email": email_exp,
        "created_at": started_exp,
        "trial_started_at": started_exp,
        "is_paid": False,
        "onboarding_completed": True
    }
    _save_local_profiles(local)

    token = _issue_application_token(uid_exp, email_exp)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. POST /chat should be rejected with HTTP 403 and owner contact info
    chat_res = client.post("/chat", json={"message": "Hello Athena"}, headers=headers)
    assert chat_res.status_code == 403
    assert "vp701049@gmail.com" in chat_res.text or "8879302705" in chat_res.text

    # 2. POST /checkins should be rejected with HTTP 403
    checkin_res = client.post("/checkins", json={"valence": 4, "energy": 3}, headers=headers)
    assert checkin_res.status_code == 403

    # 3. GET /profile must remain accessible
    profile_res = client.get("/profile", headers=headers)
    assert profile_res.status_code == 200
    p_data = profile_res.json()
    assert p_data["trial_active"] is False
    assert p_data["trial_days_remaining"] == 0
    assert p_data["entitlement_mode"] == "ATHENA_FREE"

    # 4. GET /checkins/history must remain accessible (data preservation)
    hist_res = client.get("/checkins/history", headers=headers)
    assert hist_res.status_code == 200


def test_part3_demo_isolation_from_registered_trial():
    """Demo users are completely isolated and not constrained by registered user trial expiry."""
    # 1. Initialize demo session
    res = client.post("/auth/demo-session", json={"device_id": "test_device_isolation_42"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_demo"] is True
    assert data["prompt_limit"] == 3
    token = data["access_token"]

    # 2. Check demo profile
    demo_prof = get_profile("59327d2b-6e65-456e-ab5a-148602a4bd75")
    assert demo_prof is not None
    assert demo_prof["is_demo"] is True
    assert demo_prof["trial_active"] is False
    assert demo_prof["entitlement_mode"] == "DEMO"

    # 3. Demo access through require_active_entitlement does not raise 403 trial expired
    demo_headers = {"Authorization": f"Bearer {token}", "X-Demo-Device-Id": "test_device_isolation_42"}
    status_res = client.get("/auth/demo-status", headers=demo_headers)
    assert status_res.status_code == 200
    assert status_res.json()["prompt_limit"] == 3


def test_part3_owner_authorized_upgrade_flow():
    """Owner can upgrade a user's entitlement via script/service, restoring active access with audit logging."""
    now_utc = datetime.now(timezone.utc)
    uid = f"test_upgrade_{datetime.now().timestamp()}"
    email = f"{uid}@trialtest.athena.sanctuary"
    started = (now_utc - timedelta(days=35)).isoformat()

    local = _load_local_profiles()
    local[uid] = {
        "id": uid,
        "user_id": uid,
        "email": email,
        "created_at": started,
        "trial_started_at": started,
        "is_paid": False,
        "onboarding_completed": True
    }
    _save_local_profiles(local)

    # Confirm user is expired before upgrade
    prof_before = get_profile(uid)
    assert prof_before["trial_active"] is False
    assert prof_before["entitlement_mode"] == "ATHENA_FREE"

    # Upgrade via owner service
    upgraded = upgrade_user_entitlement(email, admin_notes="Paid lifetime tier confirmed with vkur-78")
    assert upgraded is not None
    assert upgraded["is_paid"] is True
    assert upgraded["entitlement_mode"] == "ATHENA_PLUS"
    assert "vkur-78" in upgraded["upgrade_notes"]
    assert upgraded["upgraded_at"] is not None

    # Verify profile now reflects ATHENA_PLUS
    prof_after = get_profile(uid)
    assert prof_after["is_paid"] is True
    assert prof_after["entitlement_mode"] == "ATHENA_PLUS"


def test_part3_admin_upgrade_endpoint():
    """Owner upgrade endpoint requires admin key and updates user entitlement."""
    now_utc = datetime.now(timezone.utc)
    uid = f"test_admin_ep_{datetime.now().timestamp()}"
    email = f"{uid}@trialtest.athena.sanctuary"
    started = (now_utc - timedelta(days=33)).isoformat()

    local = _load_local_profiles()
    local[uid] = {
        "id": uid,
        "user_id": uid,
        "email": email,
        "created_at": started,
        "trial_started_at": started,
        "is_paid": False
    }
    _save_local_profiles(local)

    # 1. Reject without admin key
    res_bad = client.post("/admin/upgrade-user", json={"identifier": email})
    assert res_bad.status_code == 401

    # 2. Accept with valid admin key
    res_good = client.post(
        "/admin/upgrade-user",
        json={"identifier": email, "notes": "Authorized by owner vkur-78"},
        headers={"X-Admin-Key": JWT_SECRET}
    )
    assert res_good.status_code == 200
    data = res_good.json()
    assert data["success"] is True
    assert data["profile"]["is_paid"] is True
    assert data["profile"]["entitlement_mode"] == "ATHENA_PLUS"


def test_part3_anti_tampering_client_cannot_self_upgrade():
    """Client PATCH /profile cannot alter is_paid, trial_active, or trial_started_at."""
    reg_email = f"user_tamper_{datetime.now().timestamp()}@trialtest.athena.sanctuary"
    res = client.post("/auth/register", json={
        "email": reg_email,
        "password": "Password123!",
        "display_name": "Tamper Test"
    })
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]

    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to tamper with entitlement fields
    patch_res = client.patch("/profile", json={
        "display_name": "New Name",
        "is_paid": True,
        "trial_active": True,
        "trial_days_remaining": 999,
        "entitlement_mode": "ATHENA_PLUS"
    }, headers=headers)

    assert patch_res.status_code == 200
    prof = get_profile(user_id)
    assert prof["display_name"] == "New Name"
    # Entitlement must remain unchanged
    assert prof["is_paid"] is False
    assert prof["entitlement_mode"] == "TRIAL_30_DAYS"
    assert prof["trial_days_remaining"] == 30
