-- Athena Phase 5: Mind Maps Database Migration
-- Creates tables for mind maps, floating thought nodes, and cross-branch connections.

CREATE TABLE IF NOT EXISTS public.mind_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    camera_zoom FLOAT DEFAULT 1.0,
    camera_x FLOAT DEFAULT 0.0,
    camera_y FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mind_map_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.mind_map_nodes(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    x FLOAT NOT NULL DEFAULT 0.0,
    y FLOAT NOT NULL DEFAULT 0.0,
    color TEXT DEFAULT 'teal',
    collapsed BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mind_map_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
    from_node UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
    to_node UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
    strength INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_updated
    ON public.mind_maps(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_map_parent
    ON public.mind_map_nodes(map_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_mind_map_connections_map
    ON public.mind_map_connections(map_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own mind maps" ON public.mind_maps;
DROP POLICY IF EXISTS "Users can insert their own mind maps" ON public.mind_maps;
DROP POLICY IF EXISTS "Users can update their own mind maps" ON public.mind_maps;
DROP POLICY IF EXISTS "Users can delete their own mind maps" ON public.mind_maps;

DROP POLICY IF EXISTS "Users can view nodes of their own maps" ON public.mind_map_nodes;
DROP POLICY IF EXISTS "Users can insert nodes into their own maps" ON public.mind_map_nodes;
DROP POLICY IF EXISTS "Users can update nodes of their own maps" ON public.mind_map_nodes;
DROP POLICY IF EXISTS "Users can delete nodes of their own maps" ON public.mind_map_nodes;

DROP POLICY IF EXISTS "Users can view connections of their own maps" ON public.mind_map_connections;
DROP POLICY IF EXISTS "Users can insert connections into their own maps" ON public.mind_map_connections;
DROP POLICY IF EXISTS "Users can update connections of their own maps" ON public.mind_map_connections;
DROP POLICY IF EXISTS "Users can delete connections of their own maps" ON public.mind_map_connections;

-- RLS for mind_maps
CREATE POLICY "Users can view their own mind maps"
    ON public.mind_maps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mind maps"
    ON public.mind_maps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind maps"
    ON public.mind_maps FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mind maps"
    ON public.mind_maps FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for mind_map_nodes
CREATE POLICY "Users can view nodes of their own maps"
    ON public.mind_map_nodes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_nodes.map_id
        AND mind_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert nodes into their own maps"
    ON public.mind_map_nodes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_nodes.map_id
        AND mind_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can update nodes of their own maps"
    ON public.mind_map_nodes FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_nodes.map_id
        AND mind_maps.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_nodes.map_id
        AND mind_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete nodes of their own maps"
    ON public.mind_map_nodes FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_nodes.map_id
        AND mind_maps.user_id = auth.uid()
    ));

-- RLS for mind_map_connections
CREATE POLICY "Users can view connections of their own maps"
    ON public.mind_map_connections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_connections.map_id
        AND mind_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert connections into their own maps"
    ON public.mind_map_connections FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_connections.map_id
        AND mind_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can update connections of their own maps"
    ON public.mind_map_connections FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_connections.map_id
        AND mind_maps.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_connections.map_id
        AND mind_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete connections of their own maps"
    ON public.mind_map_connections FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.mind_maps
        WHERE mind_maps.id = mind_map_connections.map_id
        AND mind_maps.user_id = auth.uid()
    ));
