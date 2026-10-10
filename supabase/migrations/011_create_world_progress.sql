-- 011_create_world_progress.sql
-- Athena Phase 5: Inner World Sanctuary Progress & Growth System

CREATE TABLE IF NOT EXISTS public.world_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    unlocked_objects JSONB NOT NULL DEFAULT '[]'::jsonb,
    acknowledged_unlocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    season TEXT NOT NULL DEFAULT 'spring',
    world_seed INTEGER NOT NULL DEFAULT 42,
    ambience_preferences JSONB NOT NULL DEFAULT '{"master": 0.5, "wind": 0.3, "birds": 0.2, "water": 0.2, "rain": 0.0, "crickets": 0.0, "muted": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.world_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own world progress"
    ON public.world_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for speedy user lookup
CREATE INDEX IF NOT EXISTS idx_world_progress_user ON public.world_progress(user_id);
