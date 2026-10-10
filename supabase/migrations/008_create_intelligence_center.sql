-- Athena Phase 4: Intelligence Center Migration
-- Tables for insight observations and adaptive weekly plans with strict Row Level Security (RLS)

-- 1. Insight Observations Table
CREATE TABLE IF NOT EXISTS public.insight_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g. 'work', 'sleep', 'rest', 'evening', 'morning', 'stress', 'transitions'
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user chronological queries
CREATE INDEX IF NOT EXISTS idx_insight_observations_user 
    ON public.insight_observations(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.insight_observations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own insight observations" ON public.insight_observations;
DROP POLICY IF EXISTS "Users can insert their own insight observations" ON public.insight_observations;
DROP POLICY IF EXISTS "Users can update their own insight observations" ON public.insight_observations;
DROP POLICY IF EXISTS "Users can delete their own insight observations" ON public.insight_observations;

-- Strict user isolation policies
CREATE POLICY "Users can view their own insight observations"
    ON public.insight_observations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insight observations"
    ON public.insight_observations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insight observations"
    ON public.insight_observations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insight observations"
    ON public.insight_observations
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Weekly Action Plans Table
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user weekly plan queries
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user 
    ON public.weekly_plans(user_id, week_start DESC);

-- Enable RLS
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can insert their own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can update their own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can delete their own weekly plans" ON public.weekly_plans;

-- Strict user isolation policies
CREATE POLICY "Users can view their own weekly plans"
    ON public.weekly_plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans"
    ON public.weekly_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans"
    ON public.weekly_plans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans"
    ON public.weekly_plans
    FOR DELETE
    USING (auth.uid() = user_id);
