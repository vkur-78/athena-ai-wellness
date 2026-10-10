import os
import json
import uuid
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DEMO_SESSIONS_FILE = DATA_DIR / "demo_sessions.json"

DEMO_USER_ID = "59327d2b-6e65-456e-ab5a-148602a4bd75"
DEMO_PROMPT_LIMIT = 3
DEMO_SESSION_DURATION_HOURS = 24

_lock = threading.RLock()


def _load_sessions() -> Dict[str, Dict[str, Any]]:
    if not DEMO_SESSIONS_FILE.exists():
        return {}
    try:
        with open(DEMO_SESSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Demo Sessions Load Error]: {e}")
        return {}


def _save_sessions(sessions: Dict[str, Dict[str, Any]]):
    try:
        with open(DEMO_SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(sessions, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Demo Sessions Save Error]: {e}")


def create_demo_session(access_token: Optional[str] = None, device_id: Optional[str] = None) -> Dict[str, Any]:
    with _lock:
        sessions = _load_sessions()
        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(hours=DEMO_SESSION_DURATION_HOURS)).isoformat()

        # If this device already has recorded demo usage, retain its count and session
        existing_session = sessions.get(device_id) if device_id else None
        existing_prompts = existing_session.get("prompts_used", 0) if existing_session else 0
        session_id = existing_session.get("session_id") if existing_session else str(uuid.uuid4())
        active_conversation_id = existing_session.get("active_conversation_id") if existing_session else None

        token = access_token or f"demo_session_{uuid.uuid4().hex}"

        session_record = {
            "session_id": session_id,
            "token": token,
            "device_id": device_id,
            "user_id": DEMO_USER_ID,
            "created_at": existing_session.get("created_at") if existing_session else now.isoformat(),
            "expires_at": expires_at,
            "prompts_used": existing_prompts,
            "prompt_limit": DEMO_PROMPT_LIMIT,
            "active_conversation_id": active_conversation_id,
            "status": "exhausted" if existing_prompts >= DEMO_PROMPT_LIMIT else "active",
        }

        sessions[token] = session_record
        sessions[session_id] = session_record
        if device_id:
            sessions[device_id] = session_record
        if access_token:
            sessions[access_token] = session_record
        _save_sessions(sessions)
        return session_record


def get_demo_session(token_or_id: str, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    with _lock:
        sessions = _load_sessions()
        # Prefer session matching device_id if provided
        session = None
        if device_id and device_id in sessions:
            session = sessions[device_id]
        if not session:
            session = sessions.get(token_or_id)

        if not session:
            # Check legacy fixed demo tokens or initialize anonymous demo device
            now = datetime.now(timezone.utc)
            session = {
                "session_id": f"dev-{token_or_id}",
                "token": token_or_id,
                "device_id": device_id,
                "user_id": DEMO_USER_ID,
                "created_at": now.isoformat(),
                "expires_at": (now + timedelta(days=30)).isoformat(),
                "prompts_used": 0,
                "prompt_limit": DEMO_PROMPT_LIMIT,
                "status": "active",
            }
            sessions[token_or_id] = session
            if device_id:
                sessions[device_id] = session
            _save_sessions(sessions)
            return session

        # Check expiration
        expires_at_str = session.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > expires_at:
                    session["status"] = "expired"
                    _save_sessions(sessions)
            except Exception:
                pass
        return session


def check_and_increment_demo_prompt(token_or_id: str, device_id: Optional[str] = None) -> Tuple[bool, int, Optional[str]]:
    """
    Atomically verifies session validity and prompt allowance, increments prompts_used,
    and returns (allowed, remaining_prompts, error_reason).
    Device-based quota is strictly enforced across page refreshes and new tabs.
    """
    with _lock:
        sessions = _load_sessions()
        session = None
        if device_id and device_id in sessions:
            session = sessions[device_id]
        if not session:
            session = sessions.get(token_or_id)

        if not session:
            now = datetime.now(timezone.utc)
            session = {
                "session_id": f"dev-{token_or_id}",
                "token": token_or_id,
                "device_id": device_id,
                "user_id": DEMO_USER_ID,
                "created_at": now.isoformat(),
                "expires_at": (now + timedelta(days=30)).isoformat(),
                "prompts_used": 0,
                "prompt_limit": DEMO_PROMPT_LIMIT,
                "status": "active",
            }
            sessions[token_or_id] = session
            if device_id:
                sessions[device_id] = session
            _save_sessions(sessions)

        # Check expiration
        expires_at_str = session.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > expires_at:
                    session["status"] = "expired"
                    _save_sessions(sessions)
                    return False, 0, "Demo session expired"
            except Exception:
                pass

        prompts_used = session.get("prompts_used", 0)
        limit = session.get("prompt_limit", DEMO_PROMPT_LIMIT)

        if prompts_used >= limit:
            session["status"] = "exhausted"
            _save_sessions(sessions)
            return False, 0, "Demo prompt limit reached"

        # Atomically increment
        new_count = prompts_used + 1
        session["prompts_used"] = new_count
        if new_count >= limit:
            session["status"] = "exhausted"

        # Sync across all index keys: token, session_id, and device_id
        token = session.get("token")
        sess_id = session.get("session_id")
        dev_id = session.get("device_id") or device_id

        if token and token in sessions:
            sessions[token] = session
        if sess_id and sess_id in sessions:
            sessions[sess_id] = session
        if dev_id:
            sessions[dev_id] = session

        _save_sessions(sessions)
        remaining = max(0, limit - new_count)
        return True, remaining, None


def get_demo_session_status(token_or_id: str, device_id: Optional[str] = None) -> Dict[str, Any]:
    with _lock:
        session = get_demo_session(token_or_id, device_id=device_id)
        if not session:
            return {
                "exists": False,
                "status": "not_found",
                "remaining": 0,
                "prompts_used": DEMO_PROMPT_LIMIT,
                "prompt_limit": DEMO_PROMPT_LIMIT,
            }

        prompts_used = session.get("prompts_used", 0)
        limit = session.get("prompt_limit", DEMO_PROMPT_LIMIT)
        is_expired = session.get("status") == "expired"
        is_exhausted = prompts_used >= limit or session.get("status") == "exhausted"

        return {
            "exists": True,
            "session_id": session.get("session_id"),
            "status": session.get("status", "active"),
            "prompts_used": prompts_used,
            "prompt_limit": limit,
            "remaining": max(0, limit - prompts_used),
            "remaining_prompts": max(0, limit - prompts_used),
            "is_exhausted": is_exhausted,
            "is_expired": is_expired,
            "expires_at": session.get("expires_at"),
            "active_conversation_id": session.get("active_conversation_id"),
        }


def update_demo_active_conversation(
    conversation_id: str,
    device_id: Optional[str] = None,
    demo_session_id: Optional[str] = None
) -> None:
    """Updates active_conversation_id across all references in demo sessions."""
    with _lock:
        sessions = _load_sessions()
        target = None
        if device_id and device_id in sessions:
            target = sessions[device_id]
        elif demo_session_id and demo_session_id in sessions:
            target = sessions[demo_session_id]

        if target:
            target["active_conversation_id"] = conversation_id
            dev_id = target.get("device_id") or device_id
            sess_id = target.get("session_id") or demo_session_id
            token = target.get("token")
            if dev_id and dev_id in sessions:
                sessions[dev_id]["active_conversation_id"] = conversation_id
            if sess_id and sess_id in sessions:
                sessions[sess_id]["active_conversation_id"] = conversation_id
            if token and token in sessions:
                sessions[token]["active_conversation_id"] = conversation_id
            _save_sessions(sessions)


# Convenient alias
increment_demo_prompt = check_and_increment_demo_prompt

