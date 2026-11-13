-- =============================================================================
-- FUTUREGRAPH — UNIFIED X + AGIFUTURES IDENTITY, VERIFIED REPUTATION & ORACLES
-- Shared Supabase Auth across agifutures.org and agifutures.org/futuregraph.
-- =============================================================================

-- 1. PROFILES: linked identities (AGIFutures SSO + verified X OAuth) & reputation rollups
alter table public.profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists x_user_id text unique,
  add column if not exists x_handle text unique,
  add column if not exists x_avatar_url text,
  add column if not exists x_verified_at timestamptz,
  add column if not exists agifutures_linked boolean not null default false,
  add column if not exists overall_rp integer not null default 1000,
  add column if not exists resolved_count integer not null default 0,
  add column if not exists is_verified_forecaster boolean not null default false;

-- System principal that signs question-resolution receipts.
insert into public.profiles (id, handle, display_name, role, participant_type, bio)
values (
  'prof-futuregraph-adjudication',
  'futuregraph_adjudication',
  'FutureGraph Editorial & Adjudication Committee',
  'admin',
  'organization',
  'Signs immutable question-resolution receipts (editorial adjudication and Polymarket / Metaculus oracle sync).'
)
on conflict (id) do nothing;

-- 2. NODES: scoring category
alter table public.nodes
  add column if not exists accuracy_category text not null default 'agi_capabilities'
    check (accuracy_category in (
      'agi_capabilities', 'ai_safety', 'governance_geopolitics',
      'economy_society', 'longevity_biotech', 'science_frontier', 'unscored_metaphysical'
    ));

-- 3. FORECAST QUESTIONS: external resolution oracles + anti-sniping window
alter table public.forecast_questions
  add column if not exists oracle_provider text not null default 'editorial'
    check (oracle_provider in ('editorial', 'polymarket', 'metaculus')),
  add column if not exists oracle_external_id text,
  add column if not exists oracle_url text,
  add column if not exists oracle_outcome_label text,
  add column if not exists oracle_last_price numeric check (oracle_last_price is null or (oracle_last_price >= 0 and oracle_last_price <= 1)),
  add column if not exists oracle_last_synced_at timestamptz,
  add column if not exists opened_at timestamptz not null default now(),
  add column if not exists resolution_evidence_url text,
  add column if not exists is_sandbox_drill boolean not null default false;

-- 4. FORECAST EVENTS: crowd snapshot + conviction wager sealed at lock-in (append-only rows)
alter table public.forecast_events
  add column if not exists crowd_prob_snapshot numeric check (crowd_prob_snapshot is null or (crowd_prob_snapshot >= 0 and crowd_prob_snapshot <= 1)),
  add column if not exists confidence_multiplier numeric not null default 1.0 check (confidence_multiplier >= 0.25 and confidence_multiplier <= 3.0),
  add column if not exists projected_rp_if_yes integer,
  add column if not exists projected_rp_if_no integer,
  add column if not exists accuracy_category text,
  add column if not exists auth_provider text check (auth_provider is null or auth_provider in ('x', 'agifutures', 'demo', 'agent_api', 'legacy_seed'));

-- 5. AUDIT RECEIPTS: new entity types
alter table public.audit_receipts drop constraint if exists audit_receipts_entity_type_check;
alter table public.audit_receipts
  add constraint audit_receipts_entity_type_check
  check (entity_type in ('forecast_event', 'argument', 'branch_proposal', 'scenario_fork', 'question_resolution', 'worldview_snapshot'));

-- 6. QUESTION RESOLUTIONS (immutable; one per question)
create table if not exists public.question_resolutions (
  id text primary key,
  question_node_id text not null unique,
  outcome smallint not null check (outcome in (0, 1)),
  source text not null check (source in ('editorial', 'polymarket', 'metaculus')),
  resolved_by text not null,
  evidence_url text,
  resolved_at timestamptz not null default now(),
  receipt_id text not null references public.audit_receipts(event_id)
);

-- 7. REPUTATION LEDGER (append-only settlement per question × forecaster)
create table if not exists public.reputation_ledger (
  id text primary key,
  question_node_id text not null,
  category text not null check (category in (
    'agi_capabilities', 'ai_safety', 'governance_geopolitics',
    'economy_society', 'longevity_biotech', 'science_frontier'
  )),
  forecaster_handle text not null,
  outcome smallint not null check (outcome in (0, 1)),
  rp_delta integer not null,
  time_weighted_brier numeric not null,
  original_event_id text not null,
  original_probability numeric not null,
  original_crowd_prob numeric not null,
  original_confidence numeric not null,
  effective_multiplier numeric not null,
  revision_count integer not null default 1,
  is_contrarian_hit boolean not null default false,
  resolution_receipt_id text not null,
  resolved_at timestamptz not null,
  unique (question_node_id, forecaster_handle)
);
create index if not exists reputation_ledger_handle_idx on public.reputation_ledger (forecaster_handle);

-- 8. PER-CATEGORY SCORE ROLLUPS (materialized for fast leaderboards)
create table if not exists public.forecaster_category_scores (
  profile_id text not null references public.profiles(id) on delete cascade,
  category text not null,
  reputation_points integer not null default 1000,
  resolved_count integer not null default 0,
  active_count integer not null default 0,
  avg_brier numeric,
  best_call_event_id text,
  percentile_rank integer,
  updated_at timestamptz not null default now(),
  primary key (profile_id, category)
);

-- 9. WORLDVIEW SNAPSHOTS (immutable multi-branch path cards)
create table if not exists public.worldview_snapshots (
  id text primary key,
  scenario_slug text not null check (scenario_slug in ('ai-2027', 'ai-2040', 'ai-2050', 'lev', 'nature-of-reality')),
  headline text not null,
  outcomes jsonb not null,
  owner_handle text not null,
  receipt_id text not null,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

-- 10. FORECAST ↔ X POST LINKS (companion rows so forecast_events stay append-only)
create table if not exists public.forecast_social_links (
  event_id text primary key references public.forecast_events(id) on delete cascade,
  forecaster_handle text not null,
  x_post_url text not null check (x_post_url ~ '^https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]+$'),
  attached_at timestamptz not null default now()
);

-- Immutability for resolutions & settlements
drop trigger if exists trg_question_resolutions_immutable on public.question_resolutions;
create trigger trg_question_resolutions_immutable
before update or delete on public.question_resolutions
for each row execute function public.prevent_append_only_mutation();

drop trigger if exists trg_reputation_ledger_immutable on public.reputation_ledger;
create trigger trg_reputation_ledger_immutable
before update or delete on public.reputation_ledger
for each row execute function public.prevent_append_only_mutation();

drop trigger if exists trg_worldview_snapshots_immutable on public.worldview_snapshots;
create trigger trg_worldview_snapshots_immutable
before update or delete on public.worldview_snapshots
for each row execute function public.prevent_append_only_mutation();

-- =============================================================================
-- ROW LEVEL SECURITY
-- Public read for verifiability; all writes go through the server (service role),
-- which authenticates the Supabase session and enforces ownership.
-- =============================================================================
alter table public.question_resolutions enable row level security;
alter table public.reputation_ledger enable row level security;
alter table public.forecaster_category_scores enable row level security;
alter table public.worldview_snapshots enable row level security;
alter table public.forecast_social_links enable row level security;

create policy "Public read question resolutions" on public.question_resolutions for select using (true);
create policy "Public read reputation ledger" on public.reputation_ledger for select using (true);
create policy "Public read category scores" on public.forecaster_category_scores for select using (true);
create policy "Public read worldview snapshots" on public.worldview_snapshots for select using (true);
create policy "Public read social links" on public.forecast_social_links for select using (true);

-- Authenticated users may read their own linked-identity columns via the profiles policy (already public read).
-- Writes from the browser are intentionally not granted.
