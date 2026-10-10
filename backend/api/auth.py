import hashlib
import json
import secrets
import time
from pathlib import Path
from typing import Optional, Dict, Any
import uuid
import jwt
from fastapi import APIRouter, HTTPException, status, Request, Header
from pydantic import BaseModel, EmailStr
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
from services.profile_service import (
    save_onboarding_profile,
    _load_local_profiles,
    _save_local_profiles,
    upgrade_user_entitlement
)

router = APIRouter(prefix="", tags=["Authentication"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
CREDENTIALS_FILE = DATA_DIR / "user_credentials.json"


def _load_user_credentials() -> Dict[str, Any]:
    if not CREDENTIALS_FILE.exists():
        return {}
    try:
        with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[User Credentials Load Error]: {e}")
        return {}


def _save_user_credentials(data: Dict[str, Any]):
    try:
        with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[User Credentials Save Error]: {e}")


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"


def _verify_password(stored_hash: str, password: str) -> bool:
    try:
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        algo, salt, key_hex = parts
        computed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(computed.hex(), key_hex)
    except Exception:
        return False


def _issue_application_token(user_id: str, email: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "iss": "athena-sanctuary-auth",
        "iat": now,
        "exp": now + 30 * 86400  # 30-day session
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def get_admin_client():
    """
    Returns a Supabase client with service_role header if configured.
    """
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    if SUPABASE_SERVICE_KEY:
        client.auth.admin._headers["Authorization"] = f"Bearer {SUPABASE_SERVICE_KEY}"
    return client


def get_auth_client():
    """
    Returns a fresh ephemeral client for user credential verification and token generation.
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    user_id: str
    email: str
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    refresh_token: str = ""
    is_guest: bool = False


@router.post("/auth/register")
async def register_user(body: AuthRequest):
    """
    Registers a new user, hashes credentials with PBKDF2-HMAC-SHA256,
    initializes their profile with an active 30-day trial, and issues an
    authenticated session token for immediate sanctuary access.
    """
    email_clean = body.email.strip().lower()
    password_clean = body.password.strip()

    if len(password_clean) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Check for existing accounts across credentials and local profile store
    creds = _load_user_credentials()
    if email_clean in creds:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in."
        )

    local_profiles = _load_local_profiles()
    if any(p.get("email", "").lower() == email_clean for p in local_profiles.values()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in."
        )

    user_id = None
    access_token = None
    refresh_token = None

    # Attempt Supabase Admin creation if a real service role JWT is provided (>100 chars)
    if SUPABASE_SERVICE_KEY and len(SUPABASE_SERVICE_KEY) > 100:
        try:
            admin_client = get_admin_client()
            create_res = admin_client.auth.admin.create_user({
                "email": email_clean,
                "password": password_clean,
                "email_confirm": True
            })
            if create_res and create_res.user:
                user_id = create_res.user.id
                login_client = get_auth_client()
                login_res = login_client.auth.sign_in_with_password({
                    "email": email_clean,
                    "password": password_clean
                })
                if login_res and login_res.session:
                    access_token = login_res.session.access_token
                    refresh_token = login_res.session.refresh_token
        except Exception as create_err:
            err_str = str(create_err).lower()
            if any(term in err_str for term in ["already", "unique", "exists", "registered", "conflict"]):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists. Please sign in."
                )

    # Standard authenticated registration
    if not user_id:
        user_id = str(uuid.uuid4())
        hashed = _hash_password(password_clean)
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        creds[email_clean] = {
            "user_id": user_id,
            "email": email_clean,
            "password_hash": hashed,
            "created_at": now_iso
        }
        _save_user_credentials(creds)

        # Initialize profile record
        local_profiles[user_id] = {
            "id": user_id,
            "user_id": user_id,
            "email": email_clean,
            "display_name": body.display_name or email_clean.split("@")[0].capitalize(),
            "onboarding_completed": False,
            "created_at": now_iso,
            "updated_at": now_iso,
            "trial_active": True,
            "trial_days_remaining": 30,
            "entitlement_mode": "TRIAL_30_DAYS",
            "current_focus": [],
            "emotional_patterns": [],
            "sensitive_topics": [],
            "coping_methods": []
        }
        _save_local_profiles(local_profiles)

        access_token = _issue_application_token(user_id, email_clean)
        refresh_token = access_token

    return {
        "success": True,
        "user_id": user_id,
        "email": email_clean,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "message": "Account created and logged in successfully."
    }


@router.post("/auth/login")
async def login_user(body: AuthRequest):
    """
    Signs in a user and returns an authenticated Bearer token.
    Supports both Supabase authentication and application credentials.
    """
    email_clean = body.email.strip().lower()
    password_clean = body.password.strip()

    # 1. First attempt Supabase authentication (e.g. Aarav Sharma or Supabase accounts)
    try:
        login_client = get_auth_client()
        login_res = login_client.auth.sign_in_with_password({
            "email": email_clean,
            "password": password_clean
        })
        if login_res and login_res.session:
            return {
                "success": True,
                "user_id": login_res.user.id,
                "email": login_res.user.email,
                "access_token": login_res.session.access_token,
                "refresh_token": login_res.session.refresh_token,
                "token_type": "bearer"
            }
    except Exception:
        pass

    # 2. Check local authenticated user credentials
    creds = _load_user_credentials()
    user_cred = creds.get(email_clean)
    if user_cred and _verify_password(user_cred.get("password_hash", ""), password_clean):
        user_id = user_cred["user_id"]
        token = _issue_application_token(user_id, email_clean)
        return {
            "success": True,
            "user_id": user_id,
            "email": email_clean,
            "access_token": token,
            "refresh_token": token,
            "token_type": "bearer"
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password. Please double-check your credentials."
    )



@router.post("/auth/demo-session")
async def create_demo_session_endpoint(request: Request):
    """
    Initiates a restricted portfolio Demo Mode session without exposing credentials.
    Authenticates Aarav Sharma securely on the backend and returns the authenticated session
    with a server-side 3-prompt limit and session boundary.
    Enforces a strict 3-message limit per device across browser refresh and multiple demo sessions.
    """
    from services.db import supabase
    from services.demo_session_service import create_demo_session, DEMO_USER_ID

    device_id = request.headers.get("x-device-id") or request.headers.get("x-demo-device-id")
    if not device_id:
        try:
            body = await request.json()
            if isinstance(body, dict):
                device_id = body.get("device_id")
        except Exception:
            pass

    access_token = None
    refresh_token = None
    user_id = DEMO_USER_ID

    try:
        login_res = supabase.auth.sign_in_with_password({
            "email": "aarav.sharma.demo@athena.sanctuary",
            "password": "Athena#Sanctuary2026!Demo"
        })
        if login_res and login_res.session:
            access_token = login_res.session.access_token
            refresh_token = login_res.session.refresh_token
            user_id = login_res.user.id
    except Exception as e:
        print(f"[Demo Session Backend Sign-in Fallback]: {e}")

    session = create_demo_session(access_token=access_token, device_id=device_id)
    final_token = access_token or session["token"]

    return {
        "success": True,
        "user_id": user_id,
        "email": "aarav.sharma.demo@athena.sanctuary",
        "access_token": final_token,
        "refresh_token": refresh_token or final_token,
        "token_type": "bearer",
        "session_id": session["session_id"],
        "active_conversation_id": session.get("active_conversation_id"),
        "device_id": device_id,
        "expires_at": session["expires_at"],
        "prompts_used": session["prompts_used"],
        "prompt_limit": session["prompt_limit"],
        "remaining": max(0, session["prompt_limit"] - session["prompts_used"]),
        "remaining_prompts": max(0, session["prompt_limit"] - session["prompts_used"]),
        "is_demo": True,
        "message": "Demo session initialized. Welcome to the Athena sample journey."
    }


@router.get("/auth/demo-status")
async def get_demo_status_endpoint(request: Request, token: Optional[str] = None, device_id: Optional[str] = None):
    """
    Returns the authoritative server-side prompt count and remaining allowance per device/session.
    """
    from services.demo_session_service import get_demo_session_status
    dev_id = device_id or request.headers.get("x-device-id") or request.headers.get("x-demo-device-id")
    target_key = dev_id or token or "demo_default"
    return get_demo_session_status(target_key, device_id=dev_id)


class AdminUpgradeRequest(BaseModel):
    identifier: str
    notes: Optional[str] = "Owner upgrade activated"


@router.post("/admin/upgrade-user")
def admin_upgrade_user(body: AdminUpgradeRequest, x_admin_key: Optional[str] = Header(None)):
    """
    Owner-authorized endpoint to upgrade a user's entitlement to Athena Plus.
    Secured by administrative authorization header.
    """
    valid_keys = [k for k in [JWT_SECRET, SUPABASE_SERVICE_KEY] if k and len(k) >= 10]
    if not x_admin_key or x_admin_key not in valid_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing owner administration key."
        )

    upgraded = upgrade_user_entitlement(body.identifier, admin_notes=body.notes)
    if not upgraded:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{body.identifier}' not found."
        )

    return {
        "success": True,
        "message": "User successfully upgraded to Athena Plus",
        "profile": upgraded
    }


