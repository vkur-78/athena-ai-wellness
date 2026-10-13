from supabase import create_client

from config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)

supabase_target_url = SUPABASE_URL if (isinstance(SUPABASE_URL, str) and SUPABASE_URL.startswith("http")) else "https://mock-athena.supabase.co"
supabase_target_key = SUPABASE_SERVICE_KEY or "mock-service-key"

supabase = create_client(
    supabase_target_url,
    supabase_target_key
)


def get_supabase_client():
    return supabase