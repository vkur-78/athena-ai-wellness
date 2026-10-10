from fastapi import Header, HTTPException, Depends
from typing import Optional
import jwt
from config import JWT_SECRET
from services.db import supabase
from services.demo_session_service import get_demo_session, DEMO_USER_ID


class DemoUser:
    def __init__(self, session_id: Optional[str] = None, token: Optional[str] = None):
        self.id = DEMO_USER_ID
        self.email = "demo@athena.sanctuary"
        self.is_demo = True
        self.demo_session_id = session_id
        self.demo_token = token


class ApplicationUser:
    def __init__(self, user_id: str, email: str, created_at: Optional[str] = None):
        self.id = user_id
        self.email = email
        self.created_at = created_at
        self.is_demo = False
        self.demo_token = None
        self.demo_session_id = None
        self.role = "authenticated"
        self.aud = "authenticated"

    def __getattr__(self, name):
        return None


class AuthenticatedUser:
    def __init__(self, user, is_demo: bool = False, token: Optional[str] = None):
        self._user = user
        self.id = user.id
        self.email = getattr(user, "email", "")
        self.created_at = getattr(user, "created_at", None)
        self.is_demo = is_demo
        self.demo_token = token
        self.demo_session_id = token

    def __getattr__(self, name):
        return getattr(self._user, name)


async def verify_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header malformed")

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Authorization header malformed")

    token = parts[1]

    # 1. Check dedicated demo session tokens or legacy demo tokens
    if token.startswith("demo_session_") or token in ["demo_access_token", "test-token-aarav", "demo_refresh_token"]:
        session = get_demo_session(token)
        if session:
            if session.get("status") == "expired":
                raise HTTPException(
                    status_code=401,
                    detail="Your demo session has ended. Create an Athena account to continue your journey."
                )
            return DemoUser(session_id=session.get("session_id"), token=token)
        return DemoUser(session_id=token, token=token)

    # 2. Check signed Application JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        sub = payload.get("sub") or payload.get("user_id")
        if sub:
            return ApplicationUser(
                user_id=sub,
                email=payload.get("email", ""),
                created_at=payload.get("created_at")
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Authentication token has expired")
    except jwt.PyJWTError:
        pass

    # 3. Check Supabase Auth JWT
    try:
        res = supabase.auth.get_user(token)
        if res and res.user:
            user = res.user
            is_demo = user.id == DEMO_USER_ID or "aarav.sharma.demo" in getattr(user, "email", "")
            return AuthenticatedUser(user, is_demo=is_demo, token=token if is_demo else None)
    except Exception as e:
        pass

    raise HTTPException(status_code=401, detail="Invalid authentication token")


async def get_optional_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        return None

    token = parts[1]

    if token.startswith("demo_session_") or token in ["demo_access_token", "test-token-aarav", "demo_refresh_token"]:
        session = get_demo_session(token)
        if session and session.get("status") != "expired":
            return DemoUser(session_id=session.get("session_id"), token=token)
        return DemoUser(session_id=token, token=token)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        sub = payload.get("sub") or payload.get("user_id")
        if sub:
            return ApplicationUser(
                user_id=sub,
                email=payload.get("email", ""),
                created_at=payload.get("created_at")
            )
    except Exception:
        pass


    try:
        res = supabase.auth.get_user(token)
        if res and res.user:
            user = res.user
            is_demo = user.id == DEMO_USER_ID or "aarav.sharma.demo" in getattr(user, "email", "")
            return AuthenticatedUser(user, is_demo=is_demo, token=token if is_demo else None)
        return None
    except Exception:
        return None


async def require_active_entitlement(user=Depends(verify_user)):
    """
    Enforces active entitlement on the backend:
    - Demo users have demo access (bounded by their separate demo chat limit).
    - Registered users must have an active 30-day trial or an owner-activated upgrade (is_paid / ATHENA_PLUS).
    - When expired and not paid, raises HTTP 403 with actionable owner contact details.
    """
    if getattr(user, "is_demo", False):
        return user

    from services.profile_service import get_profile
    profile = get_profile(user.id)
    if not profile:
        return user

    if profile.get("is_paid") or profile.get("entitlement_mode") == "ATHENA_PLUS":
        return user

    if profile.get("trial_active") and profile.get("trial_days_remaining", 0) > 0:
        return user

    # Trial has ended and account is not upgraded
    raise HTTPException(
        status_code=403,
        detail="Your 30-day free trial has ended. We'd be happy to help you explore the available upgrade options and continue your journey with Athena. Please contact the owner at vp701049@gmail.com or 8879302705.",
        headers={"X-Athena-Entitlement": "EXPIRED"}
    )
