"""
Owner-controlled upgrade script for Athena Sanctuary
Usage:
    python -m scripts.upgrade_user --email <user_email> [--notes "Upgrade details"]
    python -m scripts.upgrade_user --user-id <user_id> [--notes "Upgrade details"]
"""

import sys
import argparse
from pathlib import Path

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.profile_service import upgrade_user_entitlement, get_profile


def main():
    parser = argparse.ArgumentParser(description="Authorize and activate Athena Plus upgrade for a user.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--email", type=str, help="Email of the user to upgrade")
    group.add_argument("--user-id", type=str, help="UUID / user_id of the user to upgrade")
    parser.add_argument("--notes", type=str, default="Upgraded to Athena Plus by owner vkur-78", help="Audit notes for this upgrade")

    args = parser.parse_args()
    identifier = args.email or args.user_id

    print(f"[Athena Admin] Upgrading entitlement for identifier: '{identifier}'...")
    upgraded = upgrade_user_entitlement(identifier, admin_notes=args.notes)

    if not upgraded:
        print(f"[Athena Admin Error] No profile found matching identifier '{identifier}'.")
        sys.exit(1)

    print("[Athena Admin Success] Entitlement updated successfully:")
    print(f"  User ID: {upgraded.get('user_id') or upgraded.get('id')}")
    print(f"  Email: {upgraded.get('email')}")
    print(f"  Entitlement Mode: {upgraded.get('entitlement_mode')}")
    print(f"  Is Paid: {upgraded.get('is_paid')}")
    print(f"  Upgraded At: {upgraded.get('upgraded_at')}")
    print(f"  Audit Notes: {upgraded.get('upgrade_notes')}")


if __name__ == "__main__":
    main()
