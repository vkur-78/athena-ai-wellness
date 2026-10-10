-- Athena Studio V1 Audio Guidance & Synchronized Exercise System Migration
-- Adds structured exercise catalog and steps tables, plus session tracking enhancements

CREATE TABLE IF NOT EXISTS public.exercises (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    duration_seconds INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'Gentle',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercise_steps (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    instruction_text TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER NOT NULL,
    pause_after_seconds INTEGER DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_exercise_steps_order 
    ON public.exercise_steps(exercise_id, step_order ASC);

-- Enhance studio_sessions with exact fields required for playback and history
ALTER TABLE IF EXISTS public.studio_sessions 
    ADD COLUMN IF NOT EXISTS last_step INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS playback_speed NUMERIC DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'started';

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active exercises" ON public.exercises;
CREATE POLICY "Public can view active exercises"
    ON public.exercises FOR SELECT
    USING (active = TRUE);

DROP POLICY IF EXISTS "Public can view exercise steps" ON public.exercise_steps;
CREATE POLICY "Public can view exercise steps"
    ON public.exercise_steps FOR SELECT
    USING (TRUE);
