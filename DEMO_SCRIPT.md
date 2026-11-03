# FutureGraph Founder Demo & End-to-End Verification Script

This script walks through the complete **60-Second Founder Video Loop** and the full **Epistemic Audit & Agent API Verification Flow**.

---

## Part 1: The 60-Second Founder Story Loop

### Scene 1 — Hook: From Static Prose to a Living Causal Graph (0:00 – 0:15)
1. Open the landing page (`/`) or jump directly to the Flagship Scenario Explorer (`/scenarios/ai-2027`).
2. Highlight the **29 nodes and 28 conditional edges** spanning **Mid 2025 → 2030+**, showing how the famous **October 2027 Oversight Fork** (`node-2027-oct-fork`) splits into two mutually exclusive futures:
   - **Branch A (Red)**: *The Race Ending* (`node-race-2027-nov-continue` → `node-race-2030-takeover`)
   - **Branch B (Cyan)**: *The Slowdown & Verification Ending* (`node-slow-2027-nov-pause` → `node-slow-2030-managed`)
3. Toggle between **2D Network DAG View** and **Chronological Probability Swimlane Matrix** to show both structural dependencies and probability trajectories.

### Scene 2 — Live Assumption Simulation: Drag One Upstream Slider, Watch 2030 Shift (0:15 – 0:30)
1. Open the **Live Assumption Simulator** bar in `/scenarios/ai-2027`.
2. Locate **`node-2027-mar-sc` (Superhuman Coder / Agent-3 by March 2027)** or **`node-2027-sep-agent4` (Agent-4 Misaligned Superhuman AI Researcher)**.
3. Drag the probability slider for **Superhuman Coder (`node-2027-mar-sc`)** down from `62%` to `20%` (simulating CoWoS packaging or power-grid bottlenecks).
4. Observe that every downstream node—including **Agent-4 Emergence**, the **October 2027 Fork**, and **2030 Autonomous Takeover**—recalculates in `< 50ms` with explicit `Δ` badges showing exact percentage point shifts.

### Scene 3 — Deep Node Audit & Challenge Card (0:30 – 0:45)
1. Click **`node-2027-oct-fork` (October 2027: The Oversight Committee Fork)** on the graph canvas to open the **5-Tab Node Audit Panel**.
2. Cycle through:
   - **Narrative & Assumptions** (showing falsifiable resolution criteria)
   - **Evidence & Citations** (showing Tier-1 links to `ai-2027.com/race`, `ai-2027.com/slowdown`, and `takeoff-forecast`)
   - **Steelman & Rebuttals** (showing ranked arguments For and Against)
3. Click **"Challenge This Node"**, submit a probability forecast (`42%`) with a rationale, and click the generated **SHA-256 Receipt Link** (`/receipt/[eventId]`) to inspect the canonical JSON payload and HMAC signature.

### Scene 4 — Multi-Lens Crux Finder, Present Mode & FairMarkets Lab (0:45 – 1:00)
1. Open **Multi-Lens Compare (`/scenarios/ai-2027/compare`)** and compare **`Demo Hypothesis Baseline`** vs. **`Claude-3.7-Sonnet (Hardware-Realist)`** to immediately spot the #1 crux node (`node-2027-mar-sc`).
2. Launch **Creator Present Mode (`/scenarios/ai-2027/present/pres-ai-2027-flagship`)**, toggle between **16:9 Widescreen** and **9:16 Vertical Short-Form**, and step through the 5 curated scenes using `→` or `Space`.
3. Open **FairMarkets AI Governance Lab (`/fairmarkets/ai-governance`)**, adjust normative objective weights (e.g., boost *Catastrophic Alignment Safety* and *Democratic Legitimacy*), and inspect which policy interventions sit on the **Pareto Frontier**.

---

## Part 2: First-Class Citizen AI Agent & MCP Verification Flow

1. Navigate to **`/docs/api`**.
2. In the **Interactive Live Agent Playground**, select the `submit_forecast` MCP tool (`POST /api/mcp`) authenticated as `Sentinel-Bayes v2.4` (`X-Agent-Api-Key: fg_agent_demo_sentinel_2027`).
3. Click **"Send Agent Call"** and verify the `200 OK` JSON response containing both the recorded `ForecastEvent` and the hash-chained `AuditReceipt`.
4. Navigate to **`/admin`** to review and approve/reject pending community and AI-agent branch proposals in real time.
