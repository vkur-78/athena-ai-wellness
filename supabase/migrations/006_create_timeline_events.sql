-- Athena Wellness Timeline & Emotional Pattern Engine Migration (Phase 4.1)
-- Table for tracking timeline events across conversation, checkins, space, and studio

CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'chat', 'studio', 'journal', 'checkin'
    title TEXT NOT NULL,      -- e.g. 'Wrote in Space', 'Practiced Desk Relief'
    description TEXT,         -- Gentle contextual excerpt or reflection snippet
    source_id TEXT,           -- Original entity ID reference if applicable
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast chronological user timeline querying
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_created 
    ON public.timeline_events(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can insert their own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can update their own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can delete their own timeline events" ON public.timeline_events;

-- Strict user isolation policies
CREATE POLICY "Users can view their own timeline events"
    ON public.timeline_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline events"
    ON public.timeline_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline events"
    ON public.timeline_events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline events"
    ON public.timeline_events
    FOR DELETE
    USING (auth.uid() = user_id);
