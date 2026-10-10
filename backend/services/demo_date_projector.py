"""
Athena Dynamic Demo Date Projection Engine
Preserves the full 24-month journey distribution and real behavioral patterns
while dynamically projecting demo timeline dates so the latest activity aligns
deterministically with the current server date in Asia/Kolkata (IST).

Underlying datasets on disk remain completely unmodified.
"""

import os
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional

try:
    from zoneinfo import ZoneInfo
    IST_TZ = ZoneInfo("Asia/Kolkata")
except Exception:
    IST_TZ = timezone(timedelta(hours=5, minutes=30), name="Asia/Kolkata")

# Authoritative latest date present in the static demo dataset
DEMO_DATASET_LATEST_DATE = date(2026, 10, 6)
DEMO_USER_ID = "59327d2b-6e65-456e-ab5a-148602a4bd75"


def get_current_server_date_ist() -> date:
    """
    Returns current date in Asia/Kolkata.
    Supports ATHENA_SIMULATED_DATE environment variable for portfolio/demo testing (e.g. 2027-06-15).
    """
    simulated = os.getenv("ATHENA_SIMULATED_DATE")
    if simulated:
        try:
            return datetime.strptime(simulated.strip(), "%Y-%m-%d").date()
        except Exception:
            pass
    return datetime.now(IST_TZ).date()


def get_current_server_datetime_ist() -> datetime:
    """Returns current datetime in Asia/Kolkata."""
    simulated = os.getenv("ATHENA_SIMULATED_DATE")
    if simulated:
        try:
            d = datetime.strptime(simulated.strip(), "%Y-%m-%d").date()
            now_time = datetime.now(IST_TZ).timetz()
            return datetime.combine(d, now_time)
        except Exception:
            pass
    return datetime.now(IST_TZ)


def get_demo_date_offset() -> timedelta:
    """
    Calculates dateOffset = currentDate - demoDatasetLatestDate
    """
    curr = get_current_server_date_ist()
    return curr - DEMO_DATASET_LATEST_DATE


def shift_date_str(date_str: str, offset: timedelta) -> str:
    """Shifts 'YYYY-MM-DD' by offset."""
    if not date_str or offset.days == 0:
        return date_str
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d").date()
        shifted = dt + offset
        return shifted.isoformat()
    except Exception:
        return date_str


def shift_iso_str(iso_str: str, offset: timedelta) -> str:
    """Shifts ISO datetime string preserving time and timezone."""
    if not iso_str or offset.days == 0:
        return iso_str
    try:
        clean_iso = iso_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_iso)
        shifted = dt + offset
        # Return format matching original Z if original ended with Z
        if iso_str.endswith("Z"):
            return shifted.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        return shifted.isoformat()
    except Exception:
        # Fallback date only
        try:
            date_part = shift_date_str(iso_str[:10], offset)
            return date_part + iso_str[10:]
        except Exception:
            return iso_str


def shift_month_key(month_key: str, offset: timedelta) -> str:
    """Shifts 'YYYY-MM' by offset days based on mid-month anchoring."""
    if not month_key or offset.days == 0:
        return month_key
    try:
        dt = datetime.strptime(f"{month_key[:7]}-15", "%Y-%m-%d").date()
        shifted = dt + offset
        return shifted.strftime("%Y-%m")
    except Exception:
        return month_key


def project_checkin(checkin: Dict[str, Any], offset: timedelta) -> Dict[str, Any]:
    """Applies projection to a checkin record."""
    if offset.days == 0:
        return checkin
    c = dict(checkin)
    if "date" in c and c["date"]:
        c["date"] = shift_date_str(c["date"], offset)
    if "created_at" in c and c["created_at"]:
        c["created_at"] = shift_iso_str(c["created_at"], offset)
    if "updated_at" in c and c["updated_at"]:
        c["updated_at"] = shift_iso_str(c["updated_at"], offset)
    return c


def project_journal(journal: Dict[str, Any], offset: timedelta) -> Dict[str, Any]:
    """Applies projection to a journal record."""
    if offset.days == 0:
        return journal
    j = dict(journal)
    if "date" in j and j["date"]:
        j["date"] = shift_date_str(j["date"], offset)
    if "created_at" in j and j["created_at"]:
        j["created_at"] = shift_iso_str(j["created_at"], offset)
    if "updated_at" in j and j["updated_at"]:
        j["updated_at"] = shift_iso_str(j["updated_at"], offset)
    return j


def project_studio_session(session: Dict[str, Any], offset: timedelta) -> Dict[str, Any]:
    """Applies projection to a studio session record."""
    if offset.days == 0:
        return session
    s = dict(session)
    for k in ["created_at", "started_at", "completed_at"]:
        if k in s and s[k]:
            s[k] = shift_iso_str(s[k], offset)
    return s


def project_behavior_event(event: Dict[str, Any], offset: timedelta) -> Dict[str, Any]:
    """Applies projection to a behavior timeline event."""
    if offset.days == 0:
        return event
    e = dict(event)
    if "timestamp" in e and e["timestamp"]:
        e["timestamp"] = shift_iso_str(e["timestamp"], offset)
    if "created_at" in e and e["created_at"]:
        e["created_at"] = shift_iso_str(e["created_at"], offset)
    return e


def project_reflection(refl: Dict[str, Any], offset: timedelta) -> Dict[str, Any]:
    """Applies projection to a reflection record and its content month titles."""
    if offset.days == 0:
        return refl
    r = dict(refl)
    orig_month_key = r.get("month", "2026-10")
    new_month_key = shift_month_key(orig_month_key, offset)
    r["month"] = new_month_key

    if "generated_at" in r and r["generated_at"]:
        r["generated_at"] = shift_iso_str(r["generated_at"], offset)

    # Shift content month labels if present
    content = r.get("content")
    if isinstance(content, str):
        try:
            import json
            c_dict = json.loads(content)
            # Calculate month names
            old_dt = datetime.strptime(f"{orig_month_key[:7]}-01", "%Y-%m-%d")
            new_dt = datetime.strptime(f"{new_month_key[:7]}-01", "%Y-%m-%d")
            old_name = old_dt.strftime("%B %Y")
            new_name = new_dt.strftime("%B %Y")

            content = content.replace(old_name, new_name)
            content = content.replace(orig_month_key, new_month_key)
            r["content"] = content
        except Exception:
            pass

    return r
