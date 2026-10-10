-- Athena Daily Wellness Check-in Table Migration (Phase 2, Module 2.1)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood TEXT NOT NULL,
    energy_level INT NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
    stress_level INT NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
    reflection_text TEXT,
    ai_reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_checkin UNIQUE (user_id, date)
);

-- Index for fast lookup by user and calendar date
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own checkins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can insert their own checkins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can update their own checkins" ON public.daily_checkins;

-- RLS Policies: Authenticated users can only read/write their own daily check-ins
CREATE POLICY "Users can view their own checkins"
    ON public.daily_checkins
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
    ON public.daily_checkins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
    ON public.daily_checkins
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_daily_checkins_updated_at ON public.daily_checkins;
CREATE TRIGGER set_daily_checkins_updated_at
    BEFORE UPDATE ON public.daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
