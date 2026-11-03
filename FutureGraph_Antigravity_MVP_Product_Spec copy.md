# FUTUREGRAPH — MVP PRODUCT & IMPLEMENTATION SPECIFICATION

**Working title:** FutureGraph (brand and trademark clearance pending)  
**First flagship:** *AI 2027: An Auditable Map of Possible Futures*  
**Document version:** 1.0  
**Prepared:** November 2, 2026  
**Audience:** Antigravity autonomous development agent, product/design collaborators, technical reviewers  
**Status:** Build specification. Open questions are deliberately resolved with reasonable MVP defaults; do not stall implementation waiting for clarification.

> **Instructions to Antigravity:** Treat this as the source-of-truth specification for a polished, actually functioning web MVP—not a wireframe and not a generic forecasting dashboard. Preserve the *what* and *why* while exercising design and engineering judgment on the *how*. Prioritize a delightful cinematic graph, mathematical integrity, per-node auditability, trustworthy provenance, human and AI participation, and a presentation workflow usable for real videos. Deliver running software, real persistence, seeded source-linked content, tests, and a usable administrator/editor interface. Do not fabricate historical probabilities, live market prices, quotes, or evidence.

---

## 1. Executive summary

FutureGraph is a **beautiful, open, AI-native probability network** where humans and AI agents map possible futures as branching conditional forecasts; inspect and debate the evidence for each branch; submit timestamped, attributable beliefs; and see how changing one assumption shifts downstream possibilities.

The **MVP is an excellent AI 2027 interactive experience**, not a general-purpose social network. It takes the influential [AI 2027 scenario](https://ai-2027.com/) as a carefully attributed editorial starting point, clearly differentiates the authors' original narrative from actual history and the community's alternative forecasts, and invites people to branch off wherever they disagree. Its signature experience is a luminous, animated, zoomable future timeline whose every node opens an auditable evidence/argument/forecast panel. It also includes a compact **FairMarkets policy laboratory** testing how public values and forecasts of different AGI-era governance choices interact.

### One-liner

**Explore possible futures, challenge the probabilities, and show your work—together with humans and AI.**

### North-star product loop

1. **Discover** a cinematic, source-linked AI 2027 branching scenario.
2. **Inspect** a compelling decision or prediction node and the strongest arguments for and against it.
3. **Forecast** a probability or revise one conditional assumption, seeing resulting downstream changes.
4. **Compare** your reasoning with other human forecasters and clearly identified AI model forecasts.
5. **Share** a deep link, a personalized disagreement/challenge card, or a visually polished video story.
6. **Return** to see new evidence, changed forecasts, replies, and eventual resolution.

### What this is not

- Not a real-money prediction exchange.
- Not an assertion that prediction markets or an AI consensus equal truth.
- Not a generalized X/Twitter replacement, moderation platform, or universal reputation score.
- Not a recreation or unattributed republication of AI 2027 copyrighted material.
- Not an excuse to display invented precise probabilities as though sourced from the AI 2027 authors.
- Not a fully causal simulator of AGI's effects; causal assumptions require explicit labeling and scrutiny.

---

## 2. Mission, positioning, and ecosystem architecture

**Mission:** Make complex uncertainty visible, inspectable, contestable, and actionable, improving the quality of human and AI models of reality and of the decisions those models inform.

**Brand:** Keep FutureGraph independent of the rest of the portfolio, with tasteful acknowledgement of the HyperAbundance ecosystem. The underlying forecasting infrastructure should be reusable by multiple distinct products:

| Ecosystem property | Initial or future application |
|---|---|
| **AGI Futures** | Launch partner and primary audience; AI timelines, AGI scenario forecasting, linking specific startup blueprints to the future branches that make them compelling; articles and shareable videos. |
| **FairMarkets** | Value elicitation, competing policy interventions, predicted consequences, multidimensional Pareto-frontier exploration; initial governance mini-lab. |
| **ToBeHuman** | Philosophical questions and nature-of-reality models; preserve distinctions between subjective credence and empirically resolvable outcomes. Future expansion, not MVP flagship. |
| **LEVL** | Scientific hypothesis graphs, translational research probabilities, evidence quality and clinical-outcome forecasts; never treat surrogate biological outcomes as demonstrated longevity effects. Later. |
| **HyperAbundance** | Unifying home for exploring preferred futures and coordinating human agency, without editorially controlling the forecasting network. |
| **Investing / venture creation** | Assumption mapping, scenario-specific opportunity discovery, and prospective thesis tracking; conflicts of interest transparently disclosed where relevant. |

**Product positioning:** A *shared knowledge and forecasting network*, not merely a personal whiteboard or forecast assistant. Questions are stable and individually addressable; a participant's beliefs remain separately attributed; competing scenarios can be forked without overwriting a canonical graph.

**Neutrality principle:** The interface may explore controversial claims, but must not imply that all claims have equal evidentiary support or that an aggregated price is ground truth. Prefer evidence transparency, rigorous definitions, uncertainty ranges, and verifiable prediction history over artificial both-sides symmetry.

---

## 3. MVP target users and jobs-to-be-done

### Primary users

1. **AGI-focused thinkers and forecasters:** Need to see complex AI futures, understand assumptions and counterarguments, contribute alternative probabilities and branches.
2. **Content creators / narrators (starting with the founder):** Need a screen-recording-ready beautiful map to explain multistep reasoning in engaging short and long videos.
3. **Curious sophisticated readers:** Need accessible exploration without an account, including a quick understanding of what is a forecast, what is fiction, and what has happened.
4. **AI agents / researchers:** Need well-structured, authenticated read/write access to questions, conditional links, sources, forecasts, and proposed changes.

### Secondary users

Policy and governance researchers, academic experts, forecasting-community members, traders seeking conditional reasoning, and AGI Futures founders evaluating startup blueprints. Do not compromise the initial experience to satisfy all secondary personas.

### MVP user stories

- As a visitor, I can open the AI 2027 map and understand the original scenario versus branches proposed by others within 30 seconds.
- As a visitor, I can click any node to read **what exactly it asserts**, **what it assumes**, **who asserted it**, **how it could resolve**, and **why people disagree**.
- As a user, I can enter a probability and observe the modeled downstream impact with the difference explained.
- As a user, I can publicly challenge a specific premise, with a permalink to that challenge.
- As a contributor, I can attach a source, video/podcast with timestamp, or a steelman argument to a specific node.
- As a forecaster, I can revisit all my submissions and their unaltered creation times, revisions, and rationales.
- As a narrator, I can create 3–8 saved presentation scenes and move between them without UI clutter.
- As an AI agent with permission, I can read a graph, submit a forecast, and propose a new branch without silently editing canonical history.
- As a FairMarkets participant, I can rank my values, inspect several governance policies, and see where differing values and disputed policy-effect estimates create different recommendations.

---

## 4. Design principles (non-negotiable)

1. **Cinema with rigor:** The graph should be gorgeous enough to star in videos, but visual encodings must be semantically correct. Never confuse *conditional* versus *unconditional* probabilities.
2. **Readable in three seconds, inspectable for thirty minutes:** Default graph is elegant and legible, with progressively disclosed technical detail.
3. **Provenance everywhere:** Source, contributor, as-of date, model/version, and original vs inferred vs estimated status should be easy to inspect.
4. **The forecast is the social object:** Follow, discuss, challenge, and share *specific nodes, arguments, and scenario forks*, rather than a generic infinite feed.
5. **Human and AI forecasts coexist but are distinct:** Clearly identified individual humans, model/version-specific AI entries, market quotes, and user-generated aggregate forecasts. Never attribute an opinion to a prominent person unless explicitly verified.
6. **Privacy, integrity, and consent:** Authenticated publishing, permissions, moderation, exportability, accessible history, minimal personal data.
7. **Extensible schema over overbuilt product:** Build the reusable structured data model now; add broader domain modules later.
8. **Publication-quality defaults:** Thoughtful typography, fluid motion, beautiful empty states, loading, microinteractions, responsive layouts, and export-first composition.
9. **Truth over virality:** No fabricated citations, misattributed forecasts, misleading odds, or engagement mechanics that predictably reward misinformation.
10. **Meaningful accessibility:** Keyboard navigation, reduced motion, readable contrast, alternate list/text view for graph content, accessible dialogs.

---

## 5. The flagship AI 2027 experience

### 5.1 Editorial framing and content ethics

Source of truth for narrative structure: [AI 2027](https://ai-2027.com/), including [race ending](https://ai-2027.com/race) and [slowdown ending](https://ai-2027.com/slowdown). Research the official timelines, supplements, and later author updates rather than rely on third-party summaries. The AI Futures Project's scenario is *a forecast narrative*, not verified reality. It includes **race** and **slowdown** paths, and its authors have noted that the original 2027 date was a modal scenario date rather than a certainty. Check for newer forecasts and show their as-of dates.

**Editorial safeguards:**
- Use brief original paraphrases of milestones and link to exact relevant source pages/sections. Avoid bulk reproducing copyrighted narrative or art; request permission if extensive reproduction is desired.
- Label **Original AI 2027 scenario**, **Observed as of [UTC date]**, **Author-updated forecast**, **Community alternate**, and **AI-generated proposal** as separate provenance types.
- As-of-current information must have sourced timestamps. An event that was predicted for 2026 and is already past in November 2026 must not be presented as future; mark observed, contradicted, unresolved/ambiguous, or not independently verified.
- No invented numbers. Source probabilities only where the authors actually estimated them. For other nodes, display **Not yet forecast** until a user/model enters a forecast or an editor explicitly marks a value as a **hypothetical example**.
- Fictional scenario-specific actors (e.g., a fictional AI lab) should be treated as scenario-world elements, not as directly resolvable real-world questions. Where needed, create a parallel real-world measurable operationalization.

### 5.2 Suggested initial graph structure

Seed **about 20–30 curated nodes** with source-linked summaries; refine exact dates/titles from official source. A first set of scenario *themes* (not direct verbatim text or guaranteed exact chronology):

- Early AI agents / tool reliability and adoption.
- Coding automation increases.
- AI-assisted research and feedback loops.
- Frontier competition, security, and model theft concerns.
- Rapid autonomous AI research capability milestones.
- Concentration of capability and governance oversight.
- Evidence of alignment/control problems.
- Key race-versus-slowdown intervention/decision.
- Race-path consequences.
- Slowdown-path consequences.
- Public trust, economic, strategic, and institutional consequences.
- Clearly marked alternative branches: slower development, pause/no-pause, open/closed proliferation, successful international coordination, unexpected technical bottlenecks.

**Important:** Do not depict the narrative as though every milestone has a known assigned probability. Build a visual *narrative spine* with forecastable, precisely defined real-world questions linked into it. The two can be visually related without implying that a fictional author's narrative is a priced market.

### 5.3 Three primary modes

#### A. Explore — cinematic branching probability map

- Full-screen pan/zoom; date axis and contextual chapter markers; smooth animated transitions.
- Distinct scenario layers (original narrative, real-world operationalized forecasts, alternate community forks).
- Luminous flows and thoughtful branch colors, not a cluttered node-link spaghetti diagram.
- Depth-based zoom: chapters at far zoom, major nodes at medium, details at close zoom.
- Toggle between **Timeline** and **Probability Flow** views if graph structure makes one view misleading.
- Side-by-side or toggle lenses: Original / My forecasts / Selected AI / Community / Market (when available).
- Expand/collapse alternate scenarios; direct deep-link to node; search and jump-to-node.
- Timeline scrubber and **as-of date** selector showing the graph/forecasts as understood at a historical moment (if data exists).
- Small probability labels and explanatory tooltip: *P(event | selected conditions)* versus *P(full scenario path)*.
- Clickable outbound source badge on any scenario milestone.
- No account needed to browse, manipulate *locally unsaved* assumptions, or watch a presentation.

#### B. Investigate — the node audit panel

For any selected node, open a striking, well-designed panel/drawer with tabs:

1. **Forecast:** Precise proposition, definition of YES/NO or mutually exclusive outcome set, horizon, conditioning event(s), resolution criteria, probability type, contributors and time-series chart; adjustable personal estimate.
2. **Evidence:** Primary-source links, dated papers, excerpts/brief paraphrases, credibility context, evidence supporting and contradicting the claim, freshness and citation provenance.
3. **Debate:** Strongest arguments for and against, steelman summaries, threaded comments, challenges to assumptions, evidence-backed replies, user-curated ratings *for clarity or new insight*, not popularity-as-truth.
4. **History:** Original author/source, graph and forecast revision log, timestamp, model/version, reason for changes, before/after comparisons, eventual resolution/scoring.
5. **Impact:** Direct dependents and downstream consequences; how changing this node affects the model under chosen assumptions, with a short explanation; linked AGI Futures opportunities and relevant policy interventions.

Every tab should be useful with real seed content. Empty states should invite the right contribution without fake engagement data.

#### C. Present — creator-first narrative mode

- A saved presentation is a sequence of graph **scenes** (viewport, highlighted node/path, selected forecast lens, displayed panels, headline/annotation, order, optional narration notes).
- Fluid transitions between scenes and adjustable pacing; next/previous keyboard controls, spacebar play/pause for a saved walk-through.
- One-click **Clean Mode** hides product chrome, cursors, dialogs and irrelevant details.
- Native 16:9 and vertical 9:16 framing guides, with safe zones for short-form overlays.
- Emphasize a node, animate its outgoing probability flows, temporarily isolate a path, and display a before-versus-after probability comparison.
- Export stills in high-resolution PNG and vector SVG where feasible; save a stable shareable presentation URL.
- Support full-screen deterministic playback to screen-record. Native MP4 export is optional, not a blocker for v1.
- Presentation scenes should persist and remain robust if other participants edit the underlying graph; pin them to a graph version and gracefully indicate updates.
- Offer tasteful optional attribution/link watermark, not forced intrusive branding.

### 5.4 Visual art direction

**Feeling:** Elegant, warm-futurist scientific instrument; intellectually serious and optimistic without techno-hype. High-budget editorial/planetarium quality—not gamer neon, not corporate SaaS template.

- Default near-black / deep navy background with subtle atmospheric gradients and restrained indigo, cyan, violet, gold accents.
- Thin, glowing probability rivers with animated particles only when meaningful; deliberate hierarchy and whitespace.
- Large crisp headings and large enough graph labels for video recording; typography suited to sophisticated editorial content.
- Distinct states for fact/observation, fictional narrative, forecast, hypothesis, intervention, uncertainty, and resolved node.
- Avoid excessive fake glassmorphism, busy grids, gradient-on-everything, animations that distract, or unreadable miniature labels.
- Smooth 60fps interaction on common desktops; fall back appropriately on low-power/mobile/reduced-motion environments.
- Meaningful dark-mode accessible contrast. Consider a light/export theme after dark UI is excellent.
- Provide hand-designed sample screenshots in 16:9 and 9:16 as part of QA.

### 5.5 Mobile

Mobile must provide a useful overview, simple node-to-node navigation, and node audit panels. It may use a stacked path/card traversal and simplified layout instead of trying to display the entire desktop graph at phone size. Responsive content remains interactive and shareable.

---

## 6. Forecasting and conditional probability engine

This is the most important correctness section. **Do not treat a graph of arrows as automatically a valid probabilistic model.**

### 6.1 Represent different kinds of entities

- **Proposition / event:** A verifiable YES/NO claim with a clear cutoff, or a mutually exclusive categorical outcome set.
- **Scenario milestone:** An element in the AI 2027 authored narrative, which can be linked to operationalized real-world forecast events but is not itself automatically a priced forecast.
- **Hypothesis:** A subjective belief that may be difficult or impossible to resolve (for future ToBeHuman usage).
- **Conditional relationship:** A forecast P(B | A, context), with explicit meaning and assumptions.
- **Intervention:** A counterfactual policy/action, not equivalent to merely observing that it occurred.
- **Evidence:** A cited supporting or countervailing source, including publication date and excerpt context.
- **Argument:** A thesis supporting/opposing/challenging a particular proposition or dependency.

### 6.2 Probability math — initial supported scope

**First version supports:**
- Root binary or categorical questions.
- Strictly specified *exclusive and exhaustive* branch sets (outcomes sum to 100%, with ability to include an explicit **Other/Unknown** branch).
- Conditional probability for a child given a *defined path* of ancestor outcomes.
- Propagation for a **well-defined directed acyclic graph**, with one coherent probability model and no silent double-counting.
- Scenario/path probability = product of valid conditional probabilities along that path.
- Marginalization over disjoint paths using the law of total probability.
- Validation to prohibit invalid/out-of-range inputs and flag inconsistent joint/marginal estimates.
- Sensitivity/delta view showing which outputs changed and why.

**Hard constraint:** A node with multiple correlated parent events needs an explicit conditional probability table or other modeled dependency. NEVER naively multiply independent-looking numbers. In v1, either fully parameterize the small dependency set or block/label unresolved edges as qualitative until modeled.

**Example, hypothetical only:**
- P(transformative AI by 2030) = 0.40.
- P(high unemployment by 2033 | transformative AI by 2030) = 0.35.
- P(high unemployment by 2033 | no transformative AI by 2030) = 0.12.
- Then P(high unemployment) = 0.40 × 0.35 + 0.60 × 0.12 = 0.212 = **21.2%**.

If the user changes the 0.40 prior to 0.60, the downstream estimate updates to 25.8% (holding conditionals fixed). Clearly display which quantities are fixed assumptions; the UI must not imply mathematical rigor establishes empirical truth.

**Other key distinctions:**
- P(B | A) is **not** P(B | do(A)). FairMarkets causal policy scenarios require intervention models and documented causal assumptions, not ordinary observed correlations.
- A user's forecast difference from a market price is *a disagreement signal*, not guaranteed mispricing or investment advice.
- Separate precision of stored probability from apparent confidence; support optional uncertainty bounds where feasible.
- Separate interval/range forecasts from point forecasts; where range propagation isn't implemented, do not silently treat a range as a point estimate.
- When a graph has many branches, apply threshold/collapse treatments that preserve total probability mass (including low-probability Other).

### 6.3 Forecast lenses and comparisons

Display independently recorded estimates by:
- Original source estimate **only where documented**;
- My latest forecast;
- Specific AI agent/model/version;
- Community distribution/aggregate (label method and sample size; no misleading population-representative language);
- Real-money or other public market quote, if added later with price, contract text, source, timestamp, and liquidity context;
- Editor-specified demo hypothesis distinctly labeled.

The **comparison experience** highlights meaningful disagreements in nodes and in downstream implications, including the driving assumptions. An AI explanatory summary must cite the actual stored input numbers rather than hallucinate sources.

### 6.4 AI forecast generation

- AI agents must receive identical structured questions/definitions for fair comparison.
- Their outputs must include probability, short rationale, source links if relied upon, assumptions, model ID/version, time, provider, prompt version, and any provider response ID/metadata available.
- Display AI model forecasts **only after they were actually generated and persisted**; never seed made-up AI opinions.
- Have at least one provider-backed model adapter working for genuine test submissions if credentials are available; otherwise present clearly labeled fixture/demo mode and real API hooks with configuration instructions. Do not claim live AI comparisons in fixture mode.
- Consider independent submissions to reduce social anchoring; if agents can see others' forecasts, label the forecast as influenced rather than independent.
- Human and AI entries must remain independently traceable over time.

### 6.5 Forecast scoring and resolution

The MVP should **store the necessary information** to score forecasts when a qualifying real-world question resolves, even if the full leaderboards wait:
- Resolution owner, criteria, eligible sources, deadline, outcome, adjudication timestamp, dispute window/status.
- Binary Brier score = (p − o)^2 for p and outcome o in {0,1}.
- Only score qualifying pre-resolution forecasts, according to a transparent cutoff and published policy; no retrospectively editing the originals.
- Unresolved metaphysical hypotheses and authored fictional scenario milestones are **not scored** as real-world prediction accuracy.
- A conditional branch whose conditioning event does not occur may remain unscored; don't falsely count it wrong.
- Over time, use precommitted scoring rules and multiple forecast windows to avoid rewarding opportunistic late revisions.

---

## 7. Social and knowledge-contribution layer

**Social identity attaches primarily to forecasts, evidence, arguments, and branches**, not to an infinite-post feed.

### Included in MVP

- Public viewable profiles (display name, handle/pseudonym, avatar optional, bio, human or AI type, joined date, public contributions).
- Guest browsing; sign-in to persist forecasts, submit arguments, create forks, or save presentations.
- **Node-specific threaded discussions** with replies and timestamps.
- Contributor labels on every argument, edit, source, and probability.
- **Steelman** contributions: structured *argument for*, *argument against*, or *important assumption/missing alternative*. Encourage evidence/citations.
- Qualitative reactions like **Made me reconsider**, **Taught me something**, **Strongest evidence**, with anti-spam controls. These are not truth/accuracy scores.
- Node follow/subscribe and notifications for direct responses and relevant forecast/source updates (an in-app notification stream is sufficient; digest emails optional).
- **Propose a missing branch** with rationale and suggested assumptions; proposals go through editor review before modifying canonical graph.
- **Fork a scenario**; preserve parent lineage, author, timestamp, and ability to compare against original.
- Public links to an individual node, evidence item, argument, forecast receipt, fork, and scene/presentation.
- Moderation: report content; editor hide/restore; rate limits; basic abuse control; transparent edit notices; no silent deletion of forecast history.

### Not required in MVP

General-purpose social feed, DMs, follower graph, universal truthworthiness score, wallet integrations, real-money bets, crypto tokens, mandatory KYC, permissionless canonical editing, monetized engagement, complex cross-platform reputation, or financial-account linking.

### Virality built into the product

**Core hook: “Put a probability on it.”**

- From a social post or a written claim, an AI drafts a falsifiable question and reasonable condition tree; user must review definitions and approve the generated question.
- Publish a beautifully rendered **Claim → Forecast → Branch → Challenge** card or public scene.
- Make an attractive **Where we disagree** visual comparing the contributor's forecast and a named AI or community forecast, showing the one assumption with the largest downstream influence.
- Share links retain the selected node, lens, camera view, as-of date, and attribution.
- People challenged may respond at the precise branch and publish their revised view; responses become contributions to the same living graph.
- Do not auto-attribute a forecast to an influential person based solely on AI interpretation of their post. Distinguish **AI interpretation of statement** from **person-verified forecast**.
- Make share images legible on social media, using a server-rendered or equivalent stable OG preview for important URLs.

---

## 8. Every node must be auditable

### 8.1 Node audit requirements

For each node include as appropriate:

- ID and stable canonical URL.
- Title, concise summary, detailed description.
- Type: scenario milestone, resolvable proposition, subjective hypothesis, decision/intervention, derived statistic.
- Plain-English definition; binary/categorical outcome names.
- Timing (start, question horizon, close, expected/actual resolution).
- Conditional context and parent references.
- Original scenario source URL and section/anchor where possible.
- Author/source as-of and current as-of.
- Observed status / verification status.
- The latest forecasts and full history by forecaster.
- Supporting and opposing evidence and steelman arguments.
- Outgoing consequences and the assumptions by which probabilities propagate.
- Revision history of the node specification itself (separate from revisions to individuals' probabilities).
- Conflict disclosures when materially relevant, not forced or unverified allegations.

### 8.2 Source library and media

Support URL source type and metadata:
- Scholarly papers, articles, official reports, social posts, YouTube, podcasts, other audio/video.
- User-supplied **timecode** deep links (e.g. YouTube `t=` or an embedded player that can seek appropriately) and notes describing relevance.
- Title, author/publisher, date, URL, date retrieved, connection to relevant claim, short excerpt/paraphrase (copyright-respecting).
- Evidence relationship **supports / disputes / contextualizes / changes-definition**.
- AI-generated excerpt/summaries reviewed or visibly labeled.
- Broken links gracefully handled; don't fabricate transcripts or quote timestamps.
- Embed only when allowed; always provide fallback outbound link.
- Avoid indiscriminate scraping of copyrighted content; respect provider APIs, robots/terms and attribution.

### 8.3 Audit receipt and verifiable timestamps

**Yes: implement server-verified timestamps from day one.**

For every submitted forecast/argument/proposal and every revision:
- Generate UTC timestamp on trusted server/database, not user browser.
- Assign immutable unique event ID and authenticated contributor ID or durable pseudonym/agent identity.
- Persist canonical content payload, parent/revision reference, graph version, timestamp and SHA-256 payload hash.
- Optionally build per-entity **hash chain** for tamper-evident history and a signed receipt the user can share/verify.
- Prohibit ordinary client updates/deletions of append-only forecast events; RLS/database policy and mutation service enforce this.
- Store later corrections as new events, preserving the original submission.
- Provide public verification page: event ID, original content, server creation time, hash, revisions, source, status.
- Document limitations: the server controls the initial timestamp and hash commitment; stronger independent third-party timestamping or periodic transparency-log anchoring could follow. Do **not** claim a local database hash alone is externally independently proven immutable.
- If models are participating, store model/provider/version/prompt-template, parameters when available, and submitted-by agent identity; distinguish independent autonomous agent forecasts from a human pressing an AI-assist button.

---

## 9. FairMarkets Governance Lab — deliberately contained pilot

**Purpose:** Show how the same forecast graph can support values-sensitive decision making and reveal policies that appear to improve multiple priorities, without imposing an ideology or making unsupported causal claims.

### MVP example

**Decision point:** Should a frontier AI development organization/government continue an aggressive capabilities race, require stronger evaluations before advancing, or pursue an internationally coordinated development framework?

This is an illustrative governance sandbox, not direct historical voting on the fictional AI 2027 scenario.

### Three distinct layers

1. **Values:** People express relative importance of outcomes (e.g., physical safety, autonomy/freedom, democratic accountability, economic abundance, global access, scientific progress, ecological sustainability). Show individual preferences as subjective value inputs; avoid claiming participants are a representative sample of the public.
2. **Beliefs:** Forecast/model estimates of what each intervention would do to those outcomes, with uncertainty and opposing assumptions. Values must never silently alter forecast probabilities.
3. **Decision comparison:** A visual comparison of governance options against predicted multidimensional outcomes; identify the non-dominated **Pareto set**, plus examples of tradeoffs where no choice dominates.

### MVP interactions

- Sliders or pairwise choices for ~5 core objectives, with clear definition and opt-out; users can save/share a values profile.
- 3 clearly defined policy interventions, explicitly labeled as counterfactual modeled alternatives.
- A structured table of illustrative outcomes and uncertain policy-effect assumptions, editable by admins; seeded numbers must be marked **hypothetical** until defensible sourced forecasts exist.
- A clean Pareto-frontier visualization (2D adjustable objective axes plus multidimensional non-dominance analysis). Explain why one option may or may not dominate another.
- Compare **my values** against aggregated participant preferences without conflating those with representative public opinion.
- Link each intervention and predicted effect to relevant probability nodes and evidence tabs.
- Share one slide/scene: **“Different values, same preferred governance action?”** or **“Where the tradeoff really lies.”**

### Correctness and neutrality

- A forecast P(outcome | policy chosen) can differ from the causal intervention forecast P(outcome | do(policy)); make the modeling assumption explicit.
- Pareto dominance is relative to selected objectives, evidence, time horizon, and point estimates or distributions; do not pronounce universal policy superiority.
- Provide uncertainty/sensitivity toggles; if dominance reverses under plausible model uncertainty, call that out.
- Keep hypothetical demo data unmistakably labeled and avoid converting values survey responses into scientific causal evidence.
- Make governance discussions constructive and reportable; separate normative preferences from factual disagreements.

### Scope limit

This is one small demo lab tied into the flagship, not a delegated-democracy platform, representative national poll, civic voting system, or government recommendation engine.

---

## 10. Information architecture and navigation

### Public routes / main screens

- `/` — cinematic landing page, immediately featuring the flagship graph and clear call to explore.
- `/scenarios/ai-2027` — main graph explore experience.
- `/scenarios/ai-2027/n/:nodeId` — deep-linkable node/side panel.
- `/scenarios/ai-2027/compare` — human vs AI / personal vs public forecast views.
- `/scenarios/ai-2027/present/:presentationId` — public or private presentation playback.
- `/scenarios/ai-2027/forks/:forkId` — a forked scenario with comparison to canonical model.
- `/fairmarkets/ai-governance` — contained governance decision lab.
- `/u/:handle` — contributor / forecaster profile, forecast history, public posts, credentials if self-disclosed.
- `/receipt/:eventId` — tamper-evidence / timestamp receipt viewer.
- `/admin` — authenticated scenario editing, source ingestion, review queue, submissions, user/report moderation, presentation editor.
- `/docs/api` — agent-readable public API, schemas, example calls and integration instructions.

### Landing-page structure

1. Clear headline and a living animated example of the graph.
2. Small succinct explanation: **What might happen? Why? What changes if we're wrong?**
3. Primary CTA: **Explore AI 2027**; secondary: **Watch a guided scenario**.
4. Real, not fabricated, forecasts and supporting source counts.
5. A compelling comparison/challenge visual.
6. AI-human collaboration and verifiable forecast provenance.
7. Brief mention of AGI Futures, FairMarkets, HyperAbundance ecosystem context, with independence maintained.

### Navigation

Within main graph: search, scenario lens, zoom controls, time range, graph navigation breadcrumbs, saved personal view, present button, share, quick FAQ defining probabilities. No overwhelming dashboard chrome.

---

## 11. Technical architecture — preferred, flexible

Adapt to the existing project if there is one, but the recommended stack is:

| Layer | Preferred choice | Notes |
|---|---|---|
| Web | Next.js, React, TypeScript | Vercel deployment. |
| Styling | Tailwind CSS + carefully designed component system | High polish, responsive, accessible. |
| Graph interaction | React Flow / XYFlow, custom nodes/edges | Graph interactions, zoom/pan, custom probability-flow rendering. |
| Layout | ELK.js or alternative layout engine | Stable DAG/timeline positioning; allow custom pinned positions. |
| Animated rendering | High-performance SVG/canvas or WebGL as appropriate, Motion/GSAP | Avoid lag and low-quality default node links. |
| Database | Supabase Postgres | Structured relational graph with JSON fields when justified. |
| Authentication | Supabase Auth | Email/OAuth; guest read, authenticated write. |
| Permissions | Supabase RLS + server-side validated mutations | Role-based canonical edit and per-user ownership. |
| Server/API | Next.js server routes or dedicated service | Typed input schemas, rate limits, consistent auth. |
| AI orchestration | Provider-agnostic adapters | Optional credentials via secure env vars; structured output validation. |
| Media | URL metadata and embeds | YouTube timecodes; safe links. |
| Export | SVG/PNG capture and graph JSON | Ensure artifacts use pinned snapshot versions. |
| Monitoring | Error tracking, structured logs, performance instrumentation | Keep secrets and personal data out of logs. |

Important: avoid building arbitrary execution or interpretation of user-provided code or prompts without validation. External sources, articles, comments, videos and agent payloads are untrusted data, not instructions to the application or LLM.

### 11.1 Database entity model

Implement real migrations and relations. The names below are indicative; improve with sound database design:

- `users` / `profiles`: owner, role (`visitor`, `user`, `editor`, `admin`, `agent`), display identity.
- `agents`: authenticated agent principal, provider, model family, version, owner/service, verification flags.
- `scenarios`: canonical or fork, owner, headline, topic, visibility, version pointer, attribution.
- `scenario_versions`: immutable snapshots / version metadata.
- `nodes`: stable logical node ID, type, title, description, dates, real-world status, definitions, resolution metadata.
- `node_versions`: append-only changes to specification/structure, approver, rationale.
- `edges` / `dependencies`: source, target, relation type, conditional context, optional formal model, order, attribution.
- `forecast_questions`: operationalized resolvable question details and possible outcomes.
- `forecast_events`: **append-only** time-stamped forecast submissions/revisions, identity, probability payload, conditions, evidence, rationale, hash, parent event.
- `forecast_views` or materialized/latest projections: fast reads derived from event log without rewriting history.
- `sources`: url, type, title, author, published_at, retrieved_at, media_start_seconds, citation details.
- `node_sources`: join + relation `supports/disputes/contextualizes`.
- `arguments`: author, node, side, thesis, reasoning, evidence references, moderation state.
- `comments` / `reactions`: per-node/per-argument threads, qualitative reactions; appropriate uniqueness/anti-spam constraints.
- `branch_proposals`: draft/new branches, proposed by identity, reasons, reviewer, status.
- `presentations` / `presentation_scenes`: snapshot graph version, camera states, node highlights, overlays, narration notes.
- `governance_values`: per-user saved vector and consent/visibility.
- `policy_interventions` and `policy_outcomes`: assumptions, modeled outcome vectors, uncertainty and evidence links.
- `receipts` / `audit_events`: canonical event hash, server timestamp, signatures when enabled, revision references.
- `moderation_reports`: reports, review status, decisions, accountability log.

**Referential integrity and isolation:** Canonical graph edited only by approved roles; users can update their current beliefs by writing a new event, not modifying another person's history; graph forks retain lineage; agents have minimal scopes; exports exclude private data; changes to shared node definitions require version control.

### 11.2 API requirements

Use documented typed REST endpoints initially. Provide stable IDs and schema versions. Recommended:

**Public read**
- `GET /api/v1/scenarios`
- `GET /api/v1/scenarios/:id/graph?version=...`
- `GET /api/v1/nodes/:id`
- `GET /api/v1/nodes/:id/forecasts?lens=...&asOf=...`
- `GET /api/v1/nodes/:id/evidence`
- `GET /api/v1/nodes/:id/arguments`
- `GET /api/v1/scenarios/:id/diff?from=...&to=...`

**Authenticated write / agent**
- `POST /api/v1/forecasts` (creates immutable event and receipt)
- `POST /api/v1/branches/proposals`
- `POST /api/v1/arguments`
- `POST /api/v1/evidence/proposals`
- `POST /api/v1/scenarios/:id/forks`
- `POST /api/v1/presentations`
- `POST /api/v1/model/propagate` (validate a supplied or referenced version + lens and return mathematically sound deltas)
- `POST /api/v1/model/compare` (show divergences between forecast lenses)

**Integrity/read**
- `GET /api/v1/receipts/:id`
- `GET /api/v1/schema` and a versioned OpenAPI document.

### 11.3 AI-native / MCP

Expose a compact MCP server (or implement after REST is fully operational but within MVP scope) with tools:

- `list_scenarios`, `read_graph`, `get_node`, `get_forecast_history`
- `submit_forecast`, `propose_branch`, `propose_evidence`, `add_argument`
- `simulate_graph`, `compare_forecasters`, `fork_scenario`

The agent cannot overwrite canonical source content or another contributor's record. Scope permissions, quotas, audit logs, and structured schemas. Every agent submission has explicit agent identity and model provenance. Do not claim agent attribution can prove an underlying proprietary model's identity without provider-level verification.

### 11.4 Data import and export

- Export full graph JSON with schema version, definitions, conditional model, attributed source references, and forecast lens data subject to privacy.
- Import carefully validated JSON and offer dry-run preview/diff.
- Allow manual or AI-assisted seed editor import, with source review and admin approval.
- Stable share/deep links and OG images for public pages.
- Optional CSV of a user's own forecast events.

---

## 12. Security, integrity, moderation and rights

**Security requirements:**
- All write endpoints authenticated and authorized server-side; RLS tests.
- Use server-controlled time, canonical serialization for hashes, append-only persistence for auditable events.
- Input validation, payload size limits, rate limiting, anti-spam constraints, URL validation, XSS-safe rendering, escaping and sanitization.
- Separate public and secret environment variables. No service role keys in client bundles.
- Private draft visibility respected by API, graph view, share links, export and search previews.
- Secure OAuth if used; basic account deletion/data export; avoid unnecessary location/identity collection.
- Validate agent/provider webhooks and prevent prompt injection from linked content (external content is untrusted data).
- Abuse/report mechanisms with editor review and explanation; block impersonation or unsupported claims of endorsement.

**Legal/content requirements:**
- AI 2027 remains attributed to original authors and pages. Prefer original paraphrased summaries plus deep links; seek permission before reproducing extensive textual/visual content.
- Respect media embed and copyright restrictions; do not redistribute full podcast/transcript content without rights.
- Label policy preferences, future hypotheses and forecasts appropriately; do not represent a speculative graph as certified science or financial advice.
- No exchange operations or real-money betting. If later adding external booking/trading links, review laws/provider integration rules.
- Be transparent that market probability quotes have bid/ask/fees and liquidity considerations; a price is not an oracle.

---

## 13. Scope tiers / build order

Antigravity can implement aggressively, but quality is not to be diluted. The **must-ship** complete loop matters more than feature count.

### Phase A — Foundational flagship (shipable minimum)

1. Production-quality visual system and responsive landing.
2. 20–30 curated AI 2027 source-linked nodes; explicit original-vs-current state, race/slowdown paths, a few alternate forks.
3. Smooth zoomable graph with working deep links and source badges.
4. Full five-tab audit panel, with genuine sourced seed evidence/arguments and proper empty states.
5. Typed probability model, live assumption adjustment, tested propagation for supported dependency shapes.
6. Auth, human submissions and revision receipts, server timestamps, append-only history.
7. Shareable public node page + polished OG cards.
8. Creator-focused Present Mode with saved scenes, clean mode, framing guides, screenshot exports.
9. Editor dashboard to maintain graph without hand-editing code.

### Phase B — Complete MVP ambition

10. AI agent read/write API and MCP integration with permission scopes.
11. Independent, real model forecast submissions with provenance; side-by-side human/AI comparison.
12. Threaded comments, steelman arguments, evidence and branch proposals, review queue, qualitative reactions.
13. Fork and diff personal/community scenario variants.
14. FairMarkets pilot with value sliders, 3 policy interventions, causal-model caveats, robust Pareto visualization.
15. In-app notifications, shareable challenge snapshots and optional narrated presentation presets.

### Explicitly not part of MVP

Real-money exchange, trading order routing, wallets/crypto, comprehensive scraping/social APIs, universal trust scoring, representative public polling, autonomous governance advice, full course platform, sophisticated forecasting tournaments, multi-tenant enterprise billing, native render farm, third-party timestamp blockchain, dozens of topic graphs.

---

## 14. Critical acceptance criteria

Do not declare MVP finished with a pretty static mockup. Tests below must pass.

### Product / visual

- [ ] New visitor can understand scenario source, timeline, original/alternate status, and the first consequential fork in under 30 seconds.
- [ ] Canonical graph loads on common desktop and mobile sizes without overlapping unusable nodes; pan/zoom and keyboard navigation work.
- [ ] The Race and Slowdown paths are clearly distinguished without asserting quantified odds unless backed by a forecast.
- [ ] Clicking a node opens all five audit tabs with proper data and sensible empty states.
- [ ] YouTube/podcast timecode link takes user to the relevant point or shows a usable fallback link.
- [ ] Selected node deep-link and shared screenshot correctly preserve source/forecast lens context.
- [ ] Present Mode can save, reopen, play through scenes, and export clean readable 16:9 and 9:16 images.
- [ ] Reduced-motion setting works; contrast/keyboard checks pass.

### Forecast math

- [ ] Exclusive outcomes sum to 100%, with explicit Other/Unknown where necessary.
- [ ] Conditional and unconditional numbers remain clearly distinct across UI, exports and explanations.
- [ ] Test: root 40%, conditionals 35% and 12% ⇒ marginal 21.2%.
- [ ] Test: changing root to 60% ⇒ marginal 25.8% with unchanged conditionals.
- [ ] Test: invalid probability (e.g. -5% or 150%) is rejected.
- [ ] Test: ambiguous multiple-parent dependency is blocked or flagged until modeled, not silently multiplied.
- [ ] Test: prohibited cycles are rejected unless explicitly supported by a separately designed inference model.
- [ ] Test: forecast edits cannot mutate other users' data or corrupt canonical question definitions.
- [ ] Clearly label uncertainty, source, and update timestamp for every probability.

### Auditing and provenance

- [ ] Submitting a forecast creates an authenticated, server-timestamped, append-only event with stable public receipt and hash.
- [ ] Submitting a revision creates a new event and never erases the original.
- [ ] Receipt page can verify stored hash and display scope/limitations of verification.
- [ ] AI-submitted probability has model/provider/version metadata and a separate AI identity from the human who started the run.
- [ ] No fabricated live or historical AI forecasts, market probabilities, video debate links, or AI 2027 author estimates.
- [ ] Original authored scenario, hindsight observation, source-updated forecasts, and user conjecture are unmistakably distinguishable.
- [ ] A fork does not change canonical graph; lineage and diff are recoverable.

### Governance

- [ ] Values and forecast-beliefs stored separately.
- [ ] Policy effect rows identify hypothetical vs sourced inputs and causal assumptions.
- [ ] Dominated vs non-dominated policies computed correctly in a simple deterministic test dataset.
- [ ] Changing value weights does not silently change the model's objective outcome forecasts.

### Engineering / quality

- [ ] Database migration, seed script, environment sample, setup and deployment instructions.
- [ ] Real persistent data and working admin review controls; not fixture-only production UI.
- [ ] Auth/RLS and API integration tests; public/private permission checks.
- [ ] Unit tests for probability propagation, graph validation, forecast scoring definitions, Pareto dominance and audit hashes.
- [ ] End-to-end smoke test: visit → explore → sign in → forecast → verify receipt → comment → share → present.
- [ ] API schema documented with at least one real agent end-to-end read/write example.
- [ ] Deployment on Vercel/Supabase with no secrets exposed.

---

## 15. Seed content and editorial QA plan

**Priority:** Accuracy of the inaugural AI 2027 graph matters as much as product polish. A visually impressive map containing invented dates, quotations, probabilities or misleading statements would damage trust immediately.

**Content workflow:**

1. Review original AI 2027 pages, race and slowdown endings and supplements. Create a source manifest with URLs/section anchors and timestamps.
2. Identify 20–30 milestones for the published narrative, choosing descriptions that are short, original and accurately sourced.
3. Identify 8–12 questions that can be operationalized into *real-world*, objectively resolvable forecasts; rigorously define thresholds, dates, source and edge cases. Avoid treating fictional entities as real.
4. Construct several explicit conditional branch points and a **small** mathematically coherent probability model. Use honest placeholders until verified forecasters submit input, rather than silently inventing numbers.
5. Curate at least two meaningful evidence pieces and at least one thoughtful disagreement per major branch, citing actual research/author positions. No fake quotes or dummy URLs presented as real.
6. Add select YouTube/podcast debate links only after checking that exact content/timecode addresses the node claim. Admin may add more later.
7. Mark developments after the April 2025 original publication with their actual as-of verification status at launch in November 2026.
8. Have an editorial review pass that asks: What is a forecast? What is an authored story detail? What is an observation? Is an argument straw-manned? Has a real AI/person verified its forecast attribution?

**Starter source URLs:**
- https://ai-2027.com/
- https://ai-2027.com/race
- https://ai-2027.com/slowdown
- https://radiant.metaculus.com/docs/agents/mcp (competitive/technical reference; do not copy implementation/UI)
- https://www.metaculus.com/ (external forecasting comparison)

No hard-coded claim that any particular milestone is already realized without dated primary or otherwise strong corroboration.

---

## 16. Delivery expectations to Antigravity

Deliver, in working state:

1. **Deployed application URL** and local project source.
2. **README** with setup, environment, migrations, seeding, deployments, admin bootstrapping and troubleshooting.
3. **Architecture notes**: high-level components, graph probability assumptions, database schema, versioning, agent API permissions.
4. **Visual references / screenshots**: landing, flagship full-screen graph, node audit, multi-lens comparison, Present Mode 16:9 & 9:16, FairMarkets lab.
5. **End-to-end demo script**: exact steps to reproduce the full user loop and a short founder video story.
6. **Unit/integration/e2e test results**, plus known limitations/unfinished items and severity.
7. **Source manifest** with citations for seeded claims/links and notes on authored narrative vs verified observed reality.
8. **Security and rights review notes** including timestamp limitations and content permissions to revisit before launch.

### Demo narrative to optimize around

> “AI 2027 proposed a specific route to superintelligence and a pivotal choice between racing and slowing down. Here is the original scenario. Here is what has changed since publication. Here is the assumption I dispute. When I reduce its probability, these two downstream outcomes change sharply—but this third one does not. Here are the strongest arguments and source-linked debates on both sides, including where AI models and human forecasters disagree. Now let's examine which governance policies might improve our shared objectives under those assumptions.”

The software should make that story feel effortless, intellectually rigorous, and spectacular on screen.

---

## 17. Product success measures and release guardrails

**Instrumentation to implement, with privacy-respecting aggregate analytics:**
- Landing → opened flagship graph conversion.
- Percentage interacting with at least one node audit.
- Percentage reading evidence or steelman debate.
- Percentage changing a probability.
- Authenticated forecast submissions per active participant.
- Percentage of shared graph/node/challenge links that bring new participants.
- Forks or missing-branch proposals per week.
- Presentation scenes produced and exported; repeat creator use.
- Return to revised forecasts and evidence following updates.
- API/MCP agent usage; valid vs rejected writes.
- Source corrections, moderation reports, model validation failures (trust metrics).

**Do not use popularity alone as evidence of epistemic quality.** Forecast accuracy/calibration, percentage of well-defined resolved predictions, and the quality of source corrections become core metrics as the corpus matures.

### Release guardrails

- No public claim of independent timestamp notarization until that has been implemented.
- No statements implying official endorsement or partnership with the AI 2027 authors absent permission.
- No public AI forecast attributed to Claude/GPT/Gemini without actual provider-identified submission details.
- No "consensus probability" on unresolvable metaphysics presented as objective truth.
- No fake market lines, fake user engagement, fake citations, or unreviewed model-generated scenario events in the canonical graph.
- No financial or policy advice framed as mathematically proven by speculative conditional associations.

---

## 18. Final product mandate

**Build the most beautiful and auditable interactive map of AI's possible future—not a generic probability dashboard.**

Everything should reinforce one exceptional use case: a person can **see** an AGI scenario unfold, **understand** the evidence and reasoning behind each branching point, **challenge** a probability, **compare** human and AI perspectives, and **tell a compelling story** with the result. The database and agent API should make the same capability reusable for FairMarkets, ToBeHuman, LEVL, and future graphs.

The product earns its right to become a broader collective-intelligence network by being unmistakably useful, trustworthy and visually stunning for the AI 2027 flagship first.

**Working product tagline:** *Map possible futures. Show your reasoning. Shape what comes next.*
