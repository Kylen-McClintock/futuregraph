# FutureGraph: AI 2027 Interactive Epistemic Scenario Atlas & FairMarkets Lab

> **Explore the future as a living, falsifiable causal graph.**
> Audit the claims behind **AI 2027**, drag upstream assumptions to watch downstream branch probabilities recalculate in real time, compare Human vs. AI Model lenses, present creator story scenes in 16:9 / 9:16, and evaluate Pareto-frontier governance interventions in the FairMarkets Lab.

---

## Live Links & Cloud Infrastructure

- **Live Production Deployment (Vercel):** `https://futuregraph-beta.vercel.app`
- **GitHub Repository:** `https://github.com/Kylen-McClintock/futuregraph`
- **Supabase Project:** `FutureGraph` (`ref: hylrgvcqdowfmfudqyae` — `https://hylrgvcqdowfmfudqyae.supabase.co`)
- **Primary Source Material:** [AI 2027](https://ai-2027.com/) by Daniel Kokotajlo, Scott Alexander, Thomas Larsen, Eli Lifland, and Romeo Dean ([AI Futures Project](https://ai-futures.org/)).

---

## Key Capabilities Implemented

1. **Interactive AI 2027 Causal DAG & Probability Swimlane Explorer (`/scenarios/ai-2027`)**
   - 29 operationalized milestone nodes and 28 explicit conditional causal edges spanning **Mid 2025 → 2030+**.
   - Dual-mode visualization: **2D Interactive ReactFlow Causal Graph** + **Chronological Probability Swimlane Matrix**.
   - **Live Assumption Simulator**: Override any upstream milestone probability (`0.01 – 0.99`) and watch downstream branch probabilities recalculate in `< 50ms` via topological Noisy-OR / leaky weighted log-odds propagation.
   - **7 Epistemic Lenses**: `Demo Hypothesis Baseline`, `Original AI 2027 Text & Supplements`, `Community Median`, `My Forecasts`, `Claude-3.7-Sonnet Lens`, `GPT-4.5-Research Lens`, and `Gemini-2.5-Pro Lens`.
   - **Mid-Late 2026 Reality Check Layer**: Compares the April 2025 authored narrative against observed reality as of November 2026.

2. **5-Tab Node Audit Panel & Deep-Link Pages (`/scenarios/ai-2027/n/[nodeId]`)**
   - **Tab 1 — Narrative & Assumptions**: Authored narrative summary, explicit provenance badge, operationalized forecast question, and resolution criteria.
   - **Tab 2 — Evidence & Citations**: Tiered primary/secondary sources (`tier_1_primary`, `tier_2_empirical`, `tier_3_analysis`) with support/challenge stance badges.
   - **Tab 3 — Forecasts & Lenses**: Multi-lens probability comparison + interactive forecast submission with uncertainty bounds and mandatory rationale.
   - **Tab 4 — Steelman & Rebuttals**: Ranked arguments For/Against with epistemic reactions (`Made me reconsider`, `Taught me something`, `Strongest evidence`).
   - **Tab 5 — History & Receipts**: Immutable forecast event log with clickable SHA-256 + HMAC-SHA256 verification receipts.
   - **1-Click Challenge Modal (`<dialog>`)**: Challenge a node's probability, challenge a causal assumption, attach counter-evidence, or create a versioned scenario fork.

3. **Multi-Lens Disagreement & Crux Finder (`/scenarios/ai-2027/compare`)**
   - Side-by-side comparison of any two lenses across all 29 nodes, automatically sorted by absolute probability divergence (`|P_A - P_B|`) to surface the highest-leverage cruxes.

4. **Creator Present Mode (`/scenarios/ai-2027/present/[presentationId]`)**
   - Distraction-free **16:9 widescreen** and **9:16 vertical short-form** presentation studio with pinned scenario versions, animated camera focus, live slider simulation on stage, keyboard navigation (`←`/`→`, `F`, `L`, `R`), and custom deck builder.

5. **FairMarkets AI Governance Lab (`/fairmarkets/ai-governance`)**
   - Evaluates 4 counterfactual policy interventions across 6 normative governance objectives, computes the **Pareto Frontier** (`O(N²)` dominance engine), highlights dominated vs. non-dominated policies, and displays distributional impact across 6 stakeholder groups.

6. **First-Class Citizen AI Agent REST API v1 & MCP Server (`/docs/api`, `/api/v1/*`, `/api/mcp`)**
   - 17 REST API v1 endpoints + a full **Model Context Protocol (`/api/mcp`)** endpoint exposing 11 tools for autonomous research and forecasting agents.
   - Every human and AI agent action generates a verifiable **SHA-256 + HMAC-SHA256 hash-chained receipt** (`/receipt/[eventId]`).

---

## Local Setup & Quickstart

### 1. Prerequisites
- **Node.js** `>= 18.18.0` (Node 20+ recommended)
- **npm** `>= 9.0.0`

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (`.env.local`)
Create `.env.local` in the project root (already configured in this workspace):
```env
NEXT_PUBLIC_SUPABASE_URL=https://hylrgvcqdowfmfudqyae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SUPABASE_PROJECT_REF=hylrgvcqdowfmfudqyae
FUTUREGRAPH_RECEIPT_SIGNING_SECRET=<your-hmac-signing-secret>
```
> **Note:** FutureGraph includes a resilient in-memory + seed fallback store (`src/lib/store.ts`), so the app runs with zero configuration even in offline/sandboxed environments while automatically syncing writes to Supabase Postgres when credentials are present.

### 4. Database Migration & Seeding
Push the 18-table Postgres schema (`supabase/migrations/20261102000001_initial_schema.sql`) and seed the canonical AI 2027 dataset:
```bash
# Push schema to linked remote Supabase project
npx supabase db push --remote --include-all --yes

# Seed canonical AI 2027 nodes, edges, questions, sources, arguments, and receipts
npm run db:seed
```

### 5. Run Development Server, Tests, and Production Build
```bash
# Run unit & mathematical engine tests (Vitest)
npm test

# Start local development server on http://localhost:3000
npm run dev

# Build for production
npm run build
```

---

## Admin Bootstrapping & Moderation (`/admin`)

Navigate to `/admin` to access the **Editorial & Governance Control Plane**:
- **Branch & Evidence Proposals Tab**: Approve or reject pending community/agent branch proposals (`PATCH /api/v1/branches/proposals`) or submit a new counter-scenario branch.
- **Node & Question Editor Tab**: Inspect and edit node summaries, provenance badges, operationalized forecast questions, and resolution criteria.
- **Moderation Queue Tab**: Resolve or dismiss flagged citations and arguments.
- **Scenario JSON Dry-Run & Diff Tab**: Export the full canonical scenario JSON bundle or run a dry-run topological DAG acyclicity + probability validation check.

---

## Troubleshooting

- **Port 3000 already in use**: Run `npx next dev -p 3001` or kill the existing process on port 3000.
- **Supabase connection timeout in restricted networks**: The data layer (`src/lib/store.ts`) automatically falls back to the canonical deterministic seed (`src/data/ai2027-seed.ts`) so graph exploration, simulation, and SHA-256 receipt generation never block.
