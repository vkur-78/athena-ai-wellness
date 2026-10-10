-- Athena Interactive Studio Sessions Migration (Phase 3 Final)
-- Table for tracking therapeutic studio practice sessions

CREATE TABLE IF NOT EXISTS public.studio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    practice_type TEXT NOT NULL, -- 'breathe', 'ground', 'sleep', 'quiet', 'yoga', 'body_scan', 'walk', 'pmr', 'self_compassion'
    routine TEXT,                -- e.g. 'Morning Reset', 'Desk Relief' (for yoga/routines)
    planned_duration INTEGER,    -- Duration selected in seconds (nullable)
    actual_duration INTEGER NOT NULL DEFAULT 0, -- Actual duration spent in seconds
    completed BOOLEAN DEFAULT FALSE,
    paused BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user timeline querying
CREATE INDEX IF NOT EXISTS idx_studio_sessions_user_started 
    ON public.studio_sessions(user_id, started_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.studio_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own studio sessions" ON public.studio_sessions;
DROP POLICY IF EXISTS "Users can insert their own studio sessions" ON public.studio_sessions;
DROP POLICY IF EXISTS "Users can update their own studio sessions" ON public.studio_sessions;
DROP POLICY IF EXISTS "Users can delete their own studio sessions" ON public.studio_sessions;

-- RLS Policies: Authenticated users can only access their own private studio sessions
CREATE POLICY "Users can view their own studio sessions"
    ON public.studio_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own studio sessions"
    ON public.studio_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own studio sessions"
    ON public.studio_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own studio sessions"
    ON public.studio_sessions
    FOR DELETE
    USING (auth.uid() = user_id);
