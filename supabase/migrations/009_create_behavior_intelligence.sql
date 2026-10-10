-- Athena Phase 4.2: Behavior Intelligence System Migration
-- Tables for insight observations, adaptive experiments with learning feedback, and milestone library with Row Level Security (RLS)

-- 1. Insight Observations Table (with confidence column)
CREATE TABLE IF NOT EXISTS public.insight_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g. 'work', 'sleep', 'rest', 'evening', 'morning', 'stress', 'transitions'
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence TEXT NOT NULL DEFAULT 'emerging', -- internal confidence level: 'established' | 'emerging' | 'observing'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_insight_observations_user 
    ON public.insight_observations(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.insight_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own insight observations" ON public.insight_observations;
DROP POLICY IF EXISTS "Users can insert their own insight observations" ON public.insight_observations;
DROP POLICY IF EXISTS "Users can update their own insight observations" ON public.insight_observations;
DROP POLICY IF EXISTS "Users can delete their own insight observations" ON public.insight_observations;

CREATE POLICY "Users can view their own insight observations"
    ON public.insight_observations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insight observations"
    ON public.insight_observations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insight observations"
    ON public.insight_observations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insight observations"
    ON public.insight_observations FOR DELETE USING (auth.uid() = user_id);


-- 2. Adaptive Experiments Table (with user feedback loop)
CREATE TABLE IF NOT EXISTS public.adaptive_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    feedback TEXT, -- 'helped' | 'neutral' | 'not_helped'
    progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user experiments
CREATE INDEX IF NOT EXISTS idx_adaptive_experiments_user 
    ON public.adaptive_experiments(user_id, started_at DESC);

-- Enable RLS
ALTER TABLE public.adaptive_experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own adaptive experiments" ON public.adaptive_experiments;
DROP POLICY IF EXISTS "Users can insert their own adaptive experiments" ON public.adaptive_experiments;
DROP POLICY IF EXISTS "Users can update their own adaptive experiments" ON public.adaptive_experiments;
DROP POLICY IF EXISTS "Users can delete their own adaptive experiments" ON public.adaptive_experiments;

CREATE POLICY "Users can view their own adaptive experiments"
    ON public.adaptive_experiments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adaptive experiments"
    ON public.adaptive_experiments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adaptive experiments"
    ON public.adaptive_experiments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adaptive experiments"
    ON public.adaptive_experiments FOR DELETE USING (auth.uid() = user_id);


-- 3. Milestone Library Table (therapeutic memories)
CREATE TABLE IF NOT EXISTS public.milestone_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user milestones
CREATE INDEX IF NOT EXISTS idx_milestone_library_user 
    ON public.milestone_library(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.milestone_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own milestone library" ON public.milestone_library;
DROP POLICY IF EXISTS "Users can insert their own milestone library" ON public.milestone_library;
DROP POLICY IF EXISTS "Users can update their own milestone library" ON public.milestone_library;
DROP POLICY IF EXISTS "Users can delete their own milestone library" ON public.milestone_library;

CREATE POLICY "Users can view their own milestone library"
    ON public.milestone_library FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestone library"
    ON public.milestone_library FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestone library"
    ON public.milestone_library FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestone library"
    ON public.milestone_library FOR DELETE USING (auth.uid() = user_id);
