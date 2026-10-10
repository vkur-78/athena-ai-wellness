from services.db import supabase

def get_memories(user_id):

    r = supabase.table("memories")\
        .select("category,value")\
        .eq("user_id", user_id)\
        .execute()

    return r.data

def save_memory(
    user_id,
    category,
    value
):

    supabase.table("memories").insert({

        "user_id": user_id,

        "category": category,

        "value": value

    }).execute()