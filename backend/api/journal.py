from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional, List
from models.journal import JournalCreate, JournalUpdate, JournalResponse
from services.journal_service import (
    create_entry,
    list_entries,
    get_entry,
    update_entry,
    delete_entry,
    generate_entry_reflection
)
from auth.verify import verify_user, require_active_entitlement

router = APIRouter()

@router.post("/journal", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def post_journal_entry(data: JournalCreate, user=Depends(require_active_entitlement)):
    """Creates a new private journal entry."""
    try:
        entry = create_entry(
            user_id=user.id,
            content=data.content,
            reflection_enabled=data.reflection_enabled
        )
        return entry
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[Create Journal API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Could not save your entry: {str(e)}")

@router.get("/journal", response_model=List[JournalResponse])
def get_journal_entries(
    q: Optional[str] = Query(None, description="Gentle search query by keyword or date"),
    limit: int = Query(50, ge=1, description="Number of entries to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user=Depends(verify_user)
):
    """Lists journal entries for the authenticated user, ordered newest first with pagination support."""
    try:
        entries = list_entries(user_id=user.id, query=q, limit=limit, offset=offset)
        return [JournalResponse(**e) for e in entries]
    except Exception as e:
        print(f"[List Journal API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Could not retrieve memories: {str(e)}")

@router.get("/journal/{id}", response_model=JournalResponse)
def get_single_journal_entry(id: str, user=Depends(verify_user)):
    """Retrieves a single private journal entry."""
    entry = get_entry(user_id=user.id, entry_id=id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    return entry

@router.patch("/journal/{id}", response_model=JournalResponse)
def patch_journal_entry(id: str, data: JournalUpdate, user=Depends(verify_user)):
    """Edits content or reflection status of an existing entry."""
    updated = update_entry(
        user_id=user.id,
        entry_id=id,
        content=data.content,
        reflection_enabled=data.reflection_enabled
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    return updated

@router.delete("/journal/{id}")
def remove_journal_entry(id: str, user=Depends(verify_user)):
    """Permanently deletes a private journal entry."""
    entry = get_entry(user_id=user.id, entry_id=id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    delete_entry(user_id=user.id, entry_id=id)
    return {"success": True, "message": "Your words have been peacefully released."}

@router.post("/journal/{id}/reflect", response_model=JournalResponse)
def reflect_on_journal_entry(id: str, user=Depends(verify_user)):
    """Generates an on-demand reflection by Athena for this specific entry."""
    entry = get_entry(user_id=user.id, entry_id=id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    
    updated = generate_entry_reflection(user_id=user.id, entry_id=id)
    if not updated:
        raise HTTPException(status_code=500, detail="Could not reflect on this moment.")
    return updated

