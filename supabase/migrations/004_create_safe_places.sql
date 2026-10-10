-- DEPRECATED: Phase 3 Final Refactor (Healing Studio)
-- This migration is deprecated. Active runtime dependencies have been removed.
-- Retained solely for historical migration ledger tracking.

CREATE TABLE IF NOT EXISTS public.safe_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_name TEXT NOT NULL,
    description TEXT,
    theme TEXT DEFAULT 'sanctuary',
    remembered BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user retrieval
CREATE INDEX IF NOT EXISTS idx_safe_places_user_id ON public.safe_places(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.safe_places ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own safe places" ON public.safe_places;
DROP POLICY IF EXISTS "Users can insert their own safe places" ON public.safe_places;
DROP POLICY IF EXISTS "Users can update their own safe places" ON public.safe_places;
DROP POLICY IF EXISTS "Users can delete their own safe places" ON public.safe_places;

-- RLS Policies: Authenticated users can only view, insert, update, or delete their own safe places
CREATE POLICY "Users can view their own safe places"
    ON public.safe_places
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own safe places"
    ON public.safe_places
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own safe places"
    ON public.safe_places
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own safe places"
    ON public.safe_places
    FOR DELETE
    USING (auth.uid() = user_id);

-- Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep updated_at in sync
DROP TRIGGER IF EXISTS set_safe_places_updated_at ON public.safe_places;
CREATE TRIGGER set_safe_places_updated_at
    BEFORE UPDATE ON public.safe_places
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
