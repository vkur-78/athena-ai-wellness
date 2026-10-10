-- Athena Clean Exercise History Model Migration
-- Preserves existing stored studio_sessions while adding clean, data-first fields

ALTER TABLE IF EXISTS public.studio_sessions 
    ADD COLUMN IF NOT EXISTS exercise_id TEXT,
    ADD COLUMN IF NOT EXISTS exercise_name TEXT,
    ADD COLUMN IF NOT EXISTS exercise_category TEXT,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'COMPLETED',
    ADD COLUMN IF NOT EXISTS instruction_mode TEXT DEFAULT 'TEXT',
    ADD COLUMN IF NOT EXISTS before_mood TEXT,
    ADD COLUMN IF NOT EXISTS after_mood TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS early_exit BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completion_percentage NUMERIC;

-- Backfill existing legacy records so data is seamlessly unified
UPDATE public.studio_sessions 
SET 
    exercise_id = COALESCE(exercise_id, practice_type),
    exercise_name = COALESCE(exercise_name, routine, practice_type),
    exercise_category = COALESCE(exercise_category, practice_type),
    duration_seconds = COALESCE(duration_seconds, actual_duration, 0),
    completed_at = COALESCE(completed_at, ended_at),
    completion_status = CASE 
        WHEN completed = TRUE THEN 'COMPLETED'
        ELSE 'ABANDONED'
    END
WHERE exercise_id IS NULL;

-- Index for user completion queries
CREATE INDEX IF NOT EXISTS idx_studio_sessions_user_status 
    ON public.studio_sessions(user_id, completion_status, completed_at DESC);
