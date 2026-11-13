-- Forecaster Agents, Worldview Cards & Conserved Graph Forecast Runs
-- Supports all current and future graphs on FutureGraph with Crowd Wisdom governance

CREATE TABLE IF NOT EXISTS public.forecaster_actors (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  short_badge TEXT NOT NULL DEFAULT 'Forecaster',
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'ai_agent', 'market_baseline')),
  role_label TEXT NOT NULL DEFAULT 'FutureGraph Forecaster',
  avatar_initials TEXT NOT NULL DEFAULT 'FG',
  is_verified_ensemble BOOLEAN NOT NULL DEFAULT FALSE,
  is_creator_baseline BOOLEAN NOT NULL DEFAULT FALSE,
  provider TEXT,
  model_family TEXT,
  model_version TEXT,
  owner_handle TEXT,
  worldview JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecaster_actors_verified
  ON public.forecaster_actors (is_verified_ensemble, actor_type);

CREATE TABLE IF NOT EXISTS public.forecaster_graph_runs (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  actor_handle TEXT NOT NULL REFERENCES public.forecaster_actors(handle) ON DELETE CASCADE,
  actor_display_name TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'ai_agent', 'market_baseline')),
  root_priors JSONB,
  conditional_splits JSONB NOT NULL DEFAULT '{}'::jsonb,
  fork_rationales JSONB NOT NULL DEFAULT '{}'::jsonb,
  lev_forecast JSONB,
  headline_summary TEXT NOT NULL DEFAULT '',
  receipt_id TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (graph_id, actor_handle)
);

CREATE INDEX IF NOT EXISTS idx_forecaster_graph_runs_graph
  ON public.forecaster_graph_runs (graph_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecaster_graph_runs_actor
  ON public.forecaster_graph_runs (actor_handle, submitted_at DESC);

ALTER TABLE public.forecaster_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecaster_graph_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'forecaster_actors' AND policyname = 'Public read forecaster_actors'
  ) THEN
    CREATE POLICY "Public read forecaster_actors"
      ON public.forecaster_actors FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'forecaster_graph_runs' AND policyname = 'Public read forecaster_graph_runs'
  ) THEN
    CREATE POLICY "Public read forecaster_graph_runs"
      ON public.forecaster_graph_runs FOR SELECT USING (true);
  END IF;
END $$;
