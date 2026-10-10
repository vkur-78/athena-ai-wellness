-- Athena Reflection Dashboard & Monthly Report System Migration (Phase 4.1)
-- Tables for weekly reflections and monthly keepsake reflections

-- 1. Weekly Reflections Table
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user chronological queries
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user 
    ON public.weekly_reflections(user_id, week_start DESC);

-- Enable RLS
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own weekly reflections" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can insert their own weekly reflections" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can update their own weekly reflections" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can delete their own weekly reflections" ON public.weekly_reflections;

-- Strict user isolation policies
CREATE POLICY "Users can view their own weekly reflections"
    ON public.weekly_reflections
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly reflections"
    ON public.weekly_reflections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly reflections"
    ON public.weekly_reflections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly reflections"
    ON public.weekly_reflections
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Monthly Reflections Table
CREATE TABLE IF NOT EXISTS public.monthly_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- e.g. '2026-09'
    content TEXT NOT NULL,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user monthly queries
CREATE INDEX IF NOT EXISTS idx_monthly_reflections_user 
    ON public.monthly_reflections(user_id, month DESC);

-- Enable RLS
ALTER TABLE public.monthly_reflections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own monthly reflections" ON public.monthly_reflections;
DROP POLICY IF EXISTS "Users can insert their own monthly reflections" ON public.monthly_reflections;
DROP POLICY IF EXISTS "Users can update their own monthly reflections" ON public.monthly_reflections;
DROP POLICY IF EXISTS "Users can delete their own monthly reflections" ON public.monthly_reflections;

-- Strict user isolation policies
CREATE POLICY "Users can view their own monthly reflections"
    ON public.monthly_reflections
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly reflections"
    ON public.monthly_reflections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly reflections"
    ON public.monthly_reflections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly reflections"
    ON public.monthly_reflections
    FOR DELETE
    USING (auth.uid() = user_id);
