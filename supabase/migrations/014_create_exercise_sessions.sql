-- Athena Production Exercise Sessions Migration
-- Creates the exercise_sessions table for clean production practice tracking
-- Supports RLS for strict user-level data isolation

CREATE TABLE IF NOT EXISTS public.exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT,
    category TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    language TEXT DEFAULT 'en',
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage NUMERIC DEFAULT 0,
    mood_before TEXT,
    mood_after TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user_completed 
    ON public.exercise_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user_started 
    ON public.exercise_sessions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_category 
    ON public.exercise_sessions(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own exercise sessions" ON public.exercise_sessions;
DROP POLICY IF EXISTS "Users can insert their own exercise sessions" ON public.exercise_sessions;
DROP POLICY IF EXISTS "Users can update their own exercise sessions" ON public.exercise_sessions;
DROP POLICY IF EXISTS "Users can delete their own exercise sessions" ON public.exercise_sessions;

-- RLS Policies: Authenticated users can only access their own private exercise sessions
CREATE POLICY "Users can view their own exercise sessions"
    ON public.exercise_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise sessions"
    ON public.exercise_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise sessions"
    ON public.exercise_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise sessions"
    ON public.exercise_sessions
    FOR DELETE
    USING (auth.uid() = user_id);
