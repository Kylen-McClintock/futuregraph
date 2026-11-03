-- =============================================================================
-- FUTUREGRAPH — MVP RELATIONAL DATABASE SCHEMA & RLS POLICIES
-- Flagship: AI 2027: An Auditable Map of Possible Futures
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. PROFILES (Human & AI participants)
create table if not exists public.profiles (
  id text primary key,
  handle text unique not null,
  display_name text not null,
  role text not null default 'user' check (role in ('visitor', 'user', 'editor', 'admin', 'agent')),
  participant_type text not null default 'human' check (participant_type in ('human', 'ai_agent', 'organization')),
  bio text,
  credentials text,
  avatar_url text,
  joined_at timestamptz not null default now()
);

-- 2. AGENTS (Authenticated AI Model Principals & Provenance)
create table if not exists public.agents (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  provider text not null,
  model_family text not null,
  model_version text not null,
  prompt_template_version text not null default 'v1.0-structured-forecast',
  owner_handle text not null,
  is_verified_provider boolean not null default false,
  is_independent boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. SCENARIOS (Canonical & Community Forks)
create table if not exists public.scenarios (
  id text primary key,
  slug text unique not null,
  title text not null,
  subtitle text not null,
  topic text not null default 'AI Futures',
  is_canonical boolean not null default false,
  parent_scenario_id text references public.scenarios(id) on delete set null,
  forked_from_version integer,
  owner_id text not null references public.profiles(id),
  visibility text not null default 'public' check (visibility in ('public', 'unlisted', 'private')),
  current_version integer not null default 1,
  attribution_text text not null,
  source_url text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. SCENARIO VERSIONS (Immutable Snapshots)
create table if not exists public.scenario_versions (
  id text primary key,
  scenario_id text not null references public.scenarios(id) on delete cascade,
  version_number integer not null,
  summary text not null,
  created_by text not null references public.profiles(id),
  snapshot_hash text not null,
  created_at timestamptz not null default now(),
  unique (scenario_id, version_number)
);

-- 5. NODES (Scenario Milestones, Resolvable Propositions, Hypotheses, Interventions)
create table if not exists public.nodes (
  id text primary key,
  scenario_id text not null references public.scenarios(id) on delete cascade,
  logical_id text not null,
  node_type text not null check (node_type in (
    'scenario_milestone',
    'resolvable_proposition',
    'decision_intervention',
    'subjective_hypothesis',
    'derived_statistic'
  )),
  provenance_type text not null check (provenance_type in (
    'original_scenario',
    'observed_history',
    'author_updated',
    'operationalized_question',
    'community_alternate',
    'ai_proposal'
  )),
  branch_track text not null default 'spine' check (branch_track in (
    'spine',
    'race',
    'slowdown',
    'operationalized',
    'alternate_fork'
  )),
  chapter text not null,
  date_label text not null,
  sort_date date not null,
  title text not null,
  summary text not null,
  detailed_description text not null,
  plain_english_definition text not null,
  outcome_set jsonb not null default '["YES", "NO"]'::jsonb,
  observed_status text not null default 'future_unresolved' check (observed_status in (
    'observed_realized',
    'observed_partially_realized',
    'contradicted',
    'future_unresolved',
    'scenario_world_only',
    'ambiguous'
  )),
  verification_note text,
  source_url text not null,
  source_section_anchor text,
  author_as_of date not null default '2025-04-03',
  current_as_of date not null default '2026-11-02',
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  linked_opportunities jsonb not null default '[]'::jsonb,
  conflict_disclosure text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. NODE VERSIONS (Append-only specification revision history)
create table if not exists public.node_versions (
  id text primary key,
  node_id text not null references public.nodes(id) on delete cascade,
  version_number integer not null,
  changed_by text not null references public.profiles(id),
  rationale text not null,
  previous_spec jsonb not null,
  new_spec jsonb not null,
  created_at timestamptz not null default now()
);

-- 7. EDGES / DEPENDENCIES (Conditional links & CPT parameters)
create table if not exists public.edges (
  id text primary key,
  scenario_id text not null references public.scenarios(id) on delete cascade,
  source_node_id text not null references public.nodes(id) on delete cascade,
  target_node_id text not null references public.nodes(id) on delete cascade,
  relation_type text not null check (relation_type in (
    'narrative_sequence',
    'exclusive_branch',
    'conditional_probability',
    'causal_intervention',
    'qualitative_influence'
  )),
  condition_label text not null,
  parent_outcome text not null default 'YES',
  is_modeled boolean not null default false,
  default_conditional_prob numeric check (default_conditional_prob is null or (default_conditional_prob >= 0 and default_conditional_prob <= 1)),
  cpt_spec jsonb,
  assumption_note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 8. FORECAST QUESTIONS (Operationalized resolvable definitions & scoring rules)
create table if not exists public.forecast_questions (
  id text primary key,
  node_id text unique not null references public.nodes(id) on delete cascade,
  question_text text not null,
  resolution_criteria text not null,
  resolution_source text not null,
  resolution_owner text not null default 'FutureGraph Editorial & Adjudication Committee',
  horizon_date date not null,
  close_date date not null,
  conditioning_description text,
  exclusive_group_id text,
  is_other_branch boolean not null default false,
  Probability_model_role text not null default 'root' check (Probability_model_role in ('root', 'exclusive_branch', 'single_parent_conditional', 'multi_parent_cpt', 'standalone')),
  cpt_table jsonb,
  author_documented_prob numeric check (author_documented_prob is null or (author_documented_prob >= 0 and author_documented_prob <= 1)),
  author_prob_citation text,
  demo_hypothesis_prob numeric check (demo_hypothesis_prob is null or (demo_hypothesis_prob >= 0 and demo_hypothesis_prob <= 1)),
  resolved_outcome numeric check (resolved_outcome is null or resolved_outcome in (0, 1)),
  resolved_at timestamptz,
  dispute_status text not null default 'none' check (dispute_status in ('none', 'open_dispute', 'adjudicated')),
  created_at timestamptz not null default now()
);

-- 9. FORECAST EVENTS (Append-only immutable forecast submissions & revisions)
create table if not exists public.forecast_events (
  id text primary key,
  node_id text not null references public.nodes(id) on delete cascade,
  question_id text references public.forecast_questions(id) on delete set null,
  scenario_version integer not null default 1,
  forecaster_id text not null references public.profiles(id),
  agent_id text references public.agents(id),
  lens_category text not null check (lens_category in (
    'original_author',
    'human_forecaster',
    'ai_model',
    'market_quote',
    'demo_hypothesis'
  )),
  probability numeric not null check (probability >= 0 and probability <= 1),
  uncertainty_lower numeric check (uncertainty_lower is null or (uncertainty_lower >= 0 and uncertainty_lower <= 1)),
  uncertainty_upper numeric check (uncertainty_upper is null or (uncertainty_upper >= 0 and uncertainty_upper <= 1)),
  conditional_overrides jsonb not null default '{}'::jsonb,
  rationale text not null,
  cited_urls jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  parent_event_id text references public.forecast_events(id),
  payload_hash text not null,
  prev_chain_hash text,
  chain_hash text not null,
  server_timestamp timestamptz not null default now()
);

-- Prevent updates or deletes on append-only forecast_events
create or replace function public.prevent_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Append-only audit table (%) cannot be updated or deleted. Submit a new revision event instead.', tg_table_name;
end;
$$;

drop trigger if exists trg_forecast_events_immutable on public.forecast_events;
create trigger trg_forecast_events_immutable
before update or delete on public.forecast_events
for each row execute function public.prevent_append_only_mutation();

-- 10. SOURCES (Primary citations, research supplements, media with timecodes)
create table if not exists public.sources (
  id text primary key,
  url text not null,
  source_type text not null check (source_type in ('Scenario Primary', 'Research Supplement', 'Academic Paper', 'Official Policy / Report', 'Video / Podcast', 'Forecasting Platform')),
  title text not null,
  authors text not null,
  publisher text not null,
  published_at date not null,
  retrieved_at date not null default '2026-11-02',
  media_start_seconds integer,
  excerpt_paraphrase text not null,
  credibility_note text not null,
  is_ai_summarized boolean not null default false,
  created_at timestamptz not null default now()
);

-- 11. NODE SOURCES (Evidence relationship join table)
create table if not exists public.node_sources (
  id text primary key,
  node_id text not null references public.nodes(id) on delete cascade,
  source_id text not null references public.sources(id) on delete cascade,
  relationship text not null check (relationship in ('supports', 'disputes', 'contextualizes', 'changes_definition')),
  relevance_note text not null,
  added_by text not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 12. ARGUMENTS (Steelman arguments & assumption challenges)
create table if not exists public.arguments (
  id text primary key,
  node_id text not null references public.nodes(id) on delete cascade,
  author_id text not null references public.profiles(id),
  stance text not null check (stance in ('for', 'against', 'assumption_challenge', 'steelman')),
  thesis text not null,
  reasoning text not null,
  target_assumption text,
  source_ids jsonb not null default '[]'::jsonb,
  moderation_state text not null default 'active' check (moderation_state in ('active', 'flagged', 'hidden')),
  payload_hash text not null,
  created_at timestamptz not null default now()
);

-- 13. COMMENTS & EPISTEMIC REACTIONS
create table if not exists public.comments (
  id text primary key,
  node_id text not null references public.nodes(id) on delete cascade,
  argument_id text references public.arguments(id) on delete cascade,
  parent_comment_id text references public.comments(id) on delete cascade,
  author_id text not null references public.profiles(id),
  body text not null,
  moderation_state text not null default 'active' check (moderation_state in ('active', 'flagged', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id text primary key,
  target_type text not null check (target_type in ('argument', 'comment', 'node')),
  target_id text not null,
  user_id text not null references public.profiles(id),
  reaction_type text not null check (reaction_type in ('made_me_reconsider', 'taught_me_something', 'strongest_evidence')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_id, reaction_type)
);

-- 14. BRANCH & EVIDENCE PROPOSALS (Editor review queue)
create table if not exists public.branch_proposals (
  id text primary key,
  scenario_id text not null references public.scenarios(id) on delete cascade,
  parent_node_id text not null references public.nodes(id) on delete cascade,
  proposer_id text not null references public.profiles(id),
  proposal_type text not null default 'missing_branch' check (proposal_type in ('missing_branch', 'evidence_addition', 'question_operationalization')),
  proposed_title text not null,
  proposed_summary text not null,
  conditional_assumption text not null,
  suggested_probability numeric check (suggested_probability is null or (suggested_probability >= 0 and suggested_probability <= 1)),
  source_url text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  reviewer_notes text,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

-- 15. PRESENTATIONS & SCENES (Creator Mode)
create table if not exists public.presentations (
  id text primary key,
  scenario_id text not null references public.scenarios(id) on delete cascade,
  pinned_scenario_version integer not null default 1,
  author_id text not null references public.profiles(id),
  title text not null,
  subtitle text not null,
  aspect_ratio text not null default '16:9' check (aspect_ratio in ('16:9', '9:16')),
  visibility text not null default 'public' check (visibility in ('public', 'unlisted', 'private')),
  created_at timestamptz not null default now()
);

create table if not exists public.presentation_scenes (
  id text primary key,
  presentation_id text not null references public.presentations(id) on delete cascade,
  scene_order integer not null,
  headline text not null,
  annotation text not null,
  narration_notes text not null,
  focused_node_id text references public.nodes(id) on delete set null,
  isolated_branch_track text,
  selected_lens text not null default 'community',
  comparison_lens text,
  override_node_id text,
  override_probability numeric,
  camera_x numeric not null default 0,
  camera_y numeric not null default 0,
  camera_zoom numeric not null default 1,
  duration_seconds integer not null default 12
);

-- 16. FAIRMARKETS GOVERNANCE LAB
create table if not exists public.governance_values (
  id text primary key,
  user_id text not null references public.profiles(id),
  profile_name text not null,
  weights jsonb not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.policy_interventions (
  id text primary key,
  slug text unique not null,
  title text not null,
  short_label text not null,
  description text not null,
  causal_model_caveat text not null,
  linked_node_ids jsonb not null default '[]'::jsonb,
  outcome_estimates jsonb not null,
  is_hypothetical boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 17. RECEIPTS / AUDIT EVENTS (Server-verified SHA-256 tamper-evidence log)
create table if not exists public.audit_receipts (
  event_id text primary key,
  entity_type text not null check (entity_type in ('forecast_event', 'argument', 'branch_proposal', 'scenario_fork')),
  entity_id text not null,
  contributor_id text not null references public.profiles(id),
  agent_metadata jsonb,
  scenario_version integer not null default 1,
  canonical_payload jsonb not null,
  payload_sha256 text not null,
  prev_receipt_hash text,
  chain_sha256 text not null,
  hmac_signature text not null,
  server_timestamp timestamptz not null default now()
);

drop trigger if exists trg_audit_receipts_immutable on public.audit_receipts;
create trigger trg_audit_receipts_immutable
before update or delete on public.audit_receipts
for each row execute function public.prevent_append_only_mutation();

-- 18. MODERATION REPORTS
create table if not exists public.moderation_reports (
  id text primary key,
  target_type text not null,
  target_id text not null,
  reporter_id text not null references public.profiles(id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed_kept', 'reviewed_hidden')),
  resolution_note text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_versions enable row level security;
alter table public.nodes enable row level security;
alter table public.node_versions enable row level security;
alter table public.edges enable row level security;
alter table public.forecast_questions enable row level security;
alter table public.forecast_events enable row level security;
alter table public.sources enable row level security;
alter table public.node_sources enable row level security;
alter table public.arguments enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.branch_proposals enable row level security;
alter table public.presentations enable row level security;
alter table public.presentation_scenes enable row level security;
alter table public.governance_values enable row level security;
alter table public.policy_interventions enable row level security;
alter table public.audit_receipts enable row level security;
alter table public.moderation_reports enable row level security;

-- Public Read Policies (respecting visibility where applicable)
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Public read agents" on public.agents for select using (true);
create policy "Public read public scenarios" on public.scenarios for select using (visibility in ('public', 'unlisted'));
create policy "Public read scenario versions" on public.scenario_versions for select using (true);
create policy "Public read nodes" on public.nodes for select using (true);
create policy "Public read node versions" on public.node_versions for select using (true);
create policy "Public read edges" on public.edges for select using (true);
create policy "Public read forecast questions" on public.forecast_questions for select using (true);
create policy "Public read forecast events" on public.forecast_events for select using (true);
create policy "Public read sources" on public.sources for select using (true);
create policy "Public read node sources" on public.node_sources for select using (true);
create policy "Public read active arguments" on public.arguments for select using (moderation_state != 'hidden');
create policy "Public read active comments" on public.comments for select using (moderation_state != 'hidden');
create policy "Public read reactions" on public.reactions for select using (true);
create policy "Public read branch proposals" on public.branch_proposals for select using (true);
create policy "Public read public presentations" on public.presentations for select using (visibility in ('public', 'unlisted'));
create policy "Public read presentation scenes" on public.presentation_scenes for select using (true);
create policy "Public read public governance values" on public.governance_values for select using (is_public = true);
create policy "Public read policy interventions" on public.policy_interventions for select using (true);
create policy "Public read audit receipts" on public.audit_receipts for select using (true);
create policy "Public read moderation reports" on public.moderation_reports for select using (true);
