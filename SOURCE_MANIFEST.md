# FutureGraph AI 2027 Source Manifest & Epistemic Provenance Ledger

## 1. Editorial Honesty Commitment

FutureGraph enforces strict epistemic separation across four provenance categories (`ProvenanceType`):

1. **`authored_narrative`**: Concrete chronological events written in the primary [AI 2027](https://ai-2027.com/) scenario narrative (published April 3, 2025 by Daniel Kokotajlo, Scott Alexander, Thomas Larsen, Eli Lifland, and Romeo Dean).
2. **`research_supplement`**: Quantitative probability distributions, parameter estimates, or explicit survey medians published in the official AI 2027 research supplements (`timelines-forecast`, `takeoff-forecast`, `security-forecast`, `ai-goals-forecast`).
3. **`reality_marker`**: Observed empirical reality from April 2025 through **November 2026**, explicitly contrasting where real-world AI deployment, compute buildout, and benchmarks tracked, exceeded, or lagged the original 2025 scenario narrative.
4. **`demo_prior`**: Clearly labeled baseline demonstration priors (`demoHypothesisProb`) used to initialize the interactive DAG simulator where the narrative text itself did not assign a single point probability.

> **Non-Fabrication Rule**: Where the AI 2027 narrative states a plot event without an explicit numerical probability, `originalAuthorProb` is stored as `null` ("Unstated in narrative text") and never fabricated as an author probability.

---

## 2. Primary & Empirical Source Registry (`src/data/ai2027-seed.ts`)

| Source ID | Title | URL | Publisher | Date | Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src-ai2027-main` | **AI 2027: Main Scenario Narrative** | `https://ai-2027.com/` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-summary` | **AI 2027: Executive Summary & Methodology** | `https://ai-2027.com/summary` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-race` | **AI 2027: The Race Ending** | `https://ai-2027.com/race` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-slowdown` | **AI 2027: The Slowdown Ending** | `https://ai-2027.com/slowdown` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-timelines` | **AI 2027 Supplement: Timelines Forecast (Superhuman Coder)** | `https://ai-2027.com/research/timelines-forecast` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-takeoff` | **AI 2027 Supplement: Takeoff Speeds & AI R&D Multiplier** | `https://ai-2027.com/research/takeoff-forecast` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-security` | **AI 2027 Supplement: Security & Weight Exfiltration Forecast** | `https://ai-2027.com/research/security-forecast` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-ai2027-goals` | **AI 2027 Supplement: AI Goals & Alignment Forecast** | `https://ai-2027.com/research/ai-goals-forecast` | AI Futures Project | 2025-04-03 | `tier_1_primary` |
| `src-metr-horizons` | **METR Autonomous Software Engineering Task Horizons (2025–2026)** | `https://metr.org/` | METR | 2026-06-15 | `tier_2_empirical` |
| `src-semi-packaging` | **Global CoWoS Packaging, HBM4 Supply & Datacenter Power Constraints (2026 Assessment)** | `https://www.iea.org/reports/electricity-2026` | IEA / Semiconductor Supply Chain | 2026-09-01 | `tier_2_empirical` |

---

## 3. Authored Narrative vs. Observed Reality (Mid–Late 2026 Audit)

Because AI 2027 was published in **April 2025** and our current operational date is **November 2026**, FutureGraph includes dedicated reality-check annotations across all 2025–2026 nodes and a dedicated node **`node-2026-q4-reality` ("Late 2026 Empirical Reality Check: Coding Agents vs. Compute Bottlenecks")**:

- **What Tracked or Accelerated**:
  - Autonomous coding and research agents (Claude Code, Gemini CLI, OpenAI Codex/o-series agents) became standard workflow multipliers across software engineering in 2025–2026, validating the directional shift from chatbots to long-horizon tool-using agents (`node-2025-mid-agents`, `node-2026-early-rd`).
  - Frontier labs actively deployed AI assistants to accelerate kernel optimization, synthetic data filtering, and RL environment design.
- **What Diverged or Faced Friction by Late 2026**:
  - Single-site $10^{28}$ FLOP monolithic training clusters (`node-2025-late-compute`) encountered real-world electrical grid interconnect delays and multi-site optical interconnect constraints, pushing labs toward distributed training and heavier test-time RL compute budgets.
  - While coding agents achieved dramatic productivity gains on bounded software tasks, end-to-end autonomous ML architecture invention still required human researcher oversight in late 2026, motivating the divergence between the **Demo Hypothesis Lens** and the **Hardware-Realist / Claude Lens** on `node-2027-mar-sc` (Superhuman Coder by March 2027).
