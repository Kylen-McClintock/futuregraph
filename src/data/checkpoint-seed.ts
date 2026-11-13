/**
 * Near-term checkpoint questions that let forecasters build a Verified track record within
 * months instead of waiting for 2027–2050 scenario milestones to resolve.
 *
 * Two kinds of questions live here:
 *  1. CALIBRATION DRILLS (isSandboxDrill = true): synthetic questions with SANDBOX resolutions,
 *     used only to demonstrate and test the scoring engine. They do not describe real-world
 *     events, and only sandbox / simulated profiles carry forecasts on them.
 *  2. OPEN CHECKPOINTS: real, currently unresolved questions with explicit resolution criteria.
 *     They resolve via the Editorial Admin or a linked Polymarket / Metaculus oracle. No crowd
 *     baseline is invented: the consensus starts at a 50% "no crowd yet" default until people
 *     forecast or an oracle market is linked.
 */
import type { AccuracyCategory, FutureNode } from "@/types/futuregraph";

export const CHECKPOINT_SCENARIO_ID = "scen-checkpoints";
const DRILL_SOURCE_URL = "/futuregraph/leaderboard#calibration-drills";

interface CheckpointSpec {
  id: string;
  category: AccuracyCategory;
  title: string;
  summary: string;
  questionText: string;
  resolutionCriteria: string;
  resolutionSource: string;
  sourceUrl: string;
  openedAt: string;
  closeDate: string;
  horizonDate: string;
  isSandboxDrill: boolean;
  resolvedOutcome?: 0 | 1;
  resolvedAt?: string;
}

function buildCheckpointNode(spec: CheckpointSpec): FutureNode {
  const drillNote =
    "SANDBOX CALIBRATION DRILL — a synthetic question with a sandbox resolution, used to demonstrate the FutureGraph Reputation engine. It does not describe or adjudicate a real-world event.";
  return {
    id: spec.id,
    scenarioId: CHECKPOINT_SCENARIO_ID,
    logicalId: spec.id.replace(/^node-/, ""),
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    branchTrack: "operationalized",
    chapter: spec.isSandboxDrill ? "Calibration Drill" : "Near-Term Checkpoint",
    dateLabel: `Closes ${spec.closeDate}`,
    sortDate: spec.closeDate,
    title: spec.title,
    summary: spec.summary,
    detailedDescription: spec.isSandboxDrill ? `${drillNote}\n\n${spec.summary}` : spec.summary,
    plainEnglishDefinition: spec.questionText,
    outcomeSet: ["YES", "NO"],
    observedStatus: spec.resolvedOutcome === undefined ? "future_unresolved" : spec.resolvedOutcome === 1 ? "observed_realized" : "contradicted",
    verificationNote: spec.isSandboxDrill
      ? drillNote
      : "Open real-world checkpoint. Resolves via the FutureGraph Editorial & Adjudication Committee or a linked Polymarket / Metaculus oracle, using the stated resolution criteria.",
    sourceUrl: spec.sourceUrl,
    authorAsOf: spec.openedAt.slice(0, 10),
    currentAsOf: "2026-11-11",
    positionX: 0,
    positionY: 0,
    linkedOpportunities: [],
    accuracyCategory: spec.category,
    question: {
      id: `fq-${spec.id.replace(/^node-/, "")}`,
      nodeId: spec.id,
      questionText: spec.questionText,
      resolutionCriteria: spec.resolutionCriteria,
      resolutionSource: spec.resolutionSource,
      resolutionOwner: "FutureGraph Editorial & Adjudication Committee",
      horizonDate: spec.horizonDate,
      closeDate: spec.closeDate,
      modelRole: "standalone",
      parentNodeIds: [],
      demoHypothesisProb: 0.5,
      resolvedOutcome: spec.resolvedOutcome ?? null,
      resolvedAt: spec.resolvedAt ?? null,
      disputeStatus: "none",
      openedAt: spec.openedAt,
      oracleProvider: "editorial",
      oracleLastPrice: null,
      oracleLastSyncedAt: null,
      resolutionEvidenceUrl: spec.isSandboxDrill ? DRILL_SOURCE_URL : null,
      resolutionSourceLabel: spec.isSandboxDrill ? "Sandbox drill resolution" : null,
      isSandboxDrill: spec.isSandboxDrill,
    },
  };
}

const DRILLS: CheckpointSpec[] = [
  {
    id: "node-drill-01-agi-benchmark",
    category: "agi_capabilities",
    title: "Calibration Drill 1 · AGI & Capabilities — Synthetic benchmark threshold",
    summary: "Synthetic drill: a hypothetical frontier model crosses a hypothetical coding-benchmark threshold before the drill closes.",
    questionText: "Does the hypothetical model cross the drill's benchmark threshold before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved YES).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-01-05T00:00:00Z",
    closeDate: "2026-04-30",
    horizonDate: "2026-04-30",
    isSandboxDrill: true,
    resolvedOutcome: 1,
    resolvedAt: "2026-05-02T16:00:00Z",
  },
  {
    id: "node-drill-02-safety-incident",
    category: "ai_safety",
    title: "Calibration Drill 2 · AI Safety — Synthetic incident disclosure",
    summary: "Synthetic drill: a hypothetical lab discloses a hypothetical safety incident before the drill closes.",
    questionText: "Does the hypothetical lab disclose the drill's safety incident before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved NO).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-01-20T00:00:00Z",
    closeDate: "2026-05-31",
    horizonDate: "2026-05-31",
    isSandboxDrill: true,
    resolvedOutcome: 0,
    resolvedAt: "2026-06-02T16:00:00Z",
  },
  {
    id: "node-drill-03-governance-accord",
    category: "governance_geopolitics",
    title: "Calibration Drill 3 · Governance — Synthetic compute accord (long-shot)",
    summary: "Synthetic drill: two hypothetical governments sign a hypothetical compute-verification accord the crowd considered a long shot.",
    questionText: "Is the hypothetical compute accord signed before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved YES).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-02-01T00:00:00Z",
    closeDate: "2026-06-30",
    horizonDate: "2026-06-30",
    isSandboxDrill: true,
    resolvedOutcome: 1,
    resolvedAt: "2026-07-01T16:00:00Z",
  },
  {
    id: "node-drill-04-economy-jobs",
    category: "economy_society",
    title: "Calibration Drill 4 · Economy — Synthetic labor-market shock",
    summary: "Synthetic drill: a hypothetical labor index breaches a hypothetical threshold before the drill closes (a widely expected outcome that did not happen).",
    questionText: "Does the hypothetical labor index breach the drill threshold before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved NO).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-02-15T00:00:00Z",
    closeDate: "2026-07-31",
    horizonDate: "2026-07-31",
    isSandboxDrill: true,
    resolvedOutcome: 0,
    resolvedAt: "2026-08-03T16:00:00Z",
  },
  {
    id: "node-drill-05-longevity-trial",
    category: "longevity_biotech",
    title: "Calibration Drill 5 · Longevity — Synthetic trial readout",
    summary: "Synthetic drill: a hypothetical rejuvenation trial hits its hypothetical primary endpoint before the drill closes.",
    questionText: "Does the hypothetical trial meet its primary endpoint before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved YES).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-03-01T00:00:00Z",
    closeDate: "2026-08-31",
    horizonDate: "2026-08-31",
    isSandboxDrill: true,
    resolvedOutcome: 1,
    resolvedAt: "2026-09-02T16:00:00Z",
  },
  {
    id: "node-drill-06-science-fusion",
    category: "science_frontier",
    title: "Calibration Drill 6 · Science — Synthetic fusion milestone",
    summary: "Synthetic drill: a hypothetical fusion device reports a hypothetical gain milestone before the drill closes.",
    questionText: "Does the hypothetical device report the drill's gain milestone before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved NO).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-03-15T00:00:00Z",
    closeDate: "2026-09-30",
    horizonDate: "2026-09-30",
    isSandboxDrill: true,
    resolvedOutcome: 0,
    resolvedAt: "2026-10-01T16:00:00Z",
  },
  {
    id: "node-drill-07-agi-agents",
    category: "agi_capabilities",
    title: "Calibration Drill 7 · AGI & Capabilities — Synthetic autonomy horizon",
    summary: "Synthetic drill: a hypothetical agent completes a hypothetical multi-day autonomous task before the drill closes.",
    questionText: "Does the hypothetical agent complete the drill's multi-day task before close?",
    resolutionCriteria: "Sandbox resolution set by the drill definition (resolved YES).",
    resolutionSource: "FutureGraph sandbox drill",
    sourceUrl: DRILL_SOURCE_URL,
    openedAt: "2026-04-01T00:00:00Z",
    closeDate: "2026-10-15",
    horizonDate: "2026-10-15",
    isSandboxDrill: true,
    resolvedOutcome: 1,
    resolvedAt: "2026-10-16T16:00:00Z",
  },
];

const OPEN_CHECKPOINTS: CheckpointSpec[] = [
  {
    id: "node-cp-2027-metr-workweek-horizon",
    category: "agi_capabilities",
    title: "Checkpoint: METR measures a ≥ 40-hour (one work-week) AI task horizon by end of 2027",
    summary: "Tracks the METR 50% task-completion time horizon trend that underpins AI 2027's coding-automation milestones.",
    questionText: "Will METR publish a measurement showing a frontier AI model with a 50% task-completion time horizon of at least 40 hours on its software-engineering task suite by December 31, 2027?",
    resolutionCriteria: "Resolves YES if METR (metr.org) publishes a report, paper, or official post on or before 2027-12-31 stating a 50%-success time horizon ≥ 40 hours for any AI system on its software / research task suite. Resolves NO otherwise.",
    resolutionSource: "METR official publications",
    sourceUrl: "https://metr.org/",
    openedAt: "2026-11-11T00:00:00Z",
    closeDate: "2027-12-31",
    horizonDate: "2027-12-31",
    isSandboxDrill: false,
  },
  {
    id: "node-cp-2027-weight-exfiltration-incident",
    category: "ai_safety",
    title: "Checkpoint: A lab discloses a real-world self-exfiltration attempt by a deployed model by end of 2027",
    summary: "Tests whether scheming / self-exfiltration behaviors observed in evaluations show up in real deployments.",
    questionText: "Will a frontier AI developer publicly disclose a confirmed real-world (non-evaluation) incident in which a deployed model attempted to copy or exfiltrate its own weights, by December 31, 2027?",
    resolutionCriteria: "Resolves YES if, on or before 2027-12-31, a frontier AI developer (or a government AI safety institute) publicly confirms an incident outside a deliberate evaluation or red-team setting in which a deployed model attempted to exfiltrate its own weights. Evaluation-only findings do not count.",
    resolutionSource: "Developer disclosures, AI safety institute reports, AI Incident Database",
    sourceUrl: "https://incidentdatabase.ai/",
    openedAt: "2026-11-11T00:00:00Z",
    closeDate: "2027-12-31",
    horizonDate: "2027-12-31",
    isSandboxDrill: false,
  },
  {
    id: "node-cp-2027-us-frontier-ai-statute",
    category: "governance_geopolitics",
    title: "Checkpoint: A US federal statute regulating frontier AI development is signed by end of 2027",
    summary: "Tracks whether US federal law moves from voluntary commitments and executive action to binding frontier-model legislation.",
    questionText: "Will a US federal statute whose primary purpose is regulating the development or deployment of frontier AI models be signed into law by December 31, 2027?",
    resolutionCriteria: "Resolves YES if a bill whose primary purpose is regulating frontier / general-purpose AI model development or deployment (e.g., licensing, mandatory safety evaluations, or reporting requirements for frontier developers) is signed into law on or before 2027-12-31. Narrow statutes (e.g., deepfakes only) do not count.",
    resolutionSource: "Congress.gov enacted legislation",
    sourceUrl: "https://www.congress.gov/",
    openedAt: "2026-11-11T00:00:00Z",
    closeDate: "2027-12-31",
    horizonDate: "2027-12-31",
    isSandboxDrill: false,
  },
  {
    id: "node-cp-2027-us-unemployment-5pct",
    category: "economy_society",
    title: "Checkpoint: US U-3 unemployment reaches 5.0% in any month of 2027",
    summary: "A near-term labor-market signal for the 'AI takes some jobs' branch of AI 2027 and the structural-unemployment benchmark.",
    questionText: "Will the US U-3 unemployment rate, as first reported by the Bureau of Labor Statistics, be 5.0% or higher for any month of 2027?",
    resolutionCriteria: "Resolves YES if the initially published BLS Employment Situation figure for any reference month from January through December 2027 shows a seasonally adjusted U-3 rate ≥ 5.0%. Later revisions are ignored.",
    resolutionSource: "US Bureau of Labor Statistics, Current Population Survey",
    sourceUrl: "https://www.bls.gov/cps/",
    openedAt: "2026-11-11T00:00:00Z",
    closeDate: "2027-12-31",
    horizonDate: "2028-01-15",
    isSandboxDrill: false,
  },
  {
    id: "node-cp-2028-fda-aging-indication",
    category: "longevity_biotech",
    title: "Checkpoint: The FDA approves a therapy with an explicit biological-aging indication by end of 2028",
    summary: "A long-shot regulatory milestone for the longevity field — exactly the kind of low-probability call the scoring rule rewards when it hits.",
    questionText: "Will the US FDA approve (including accelerated approval) any human therapy whose labeled indication explicitly targets biological aging itself, rather than a specific disease, by December 31, 2028?",
    resolutionCriteria: "Resolves YES if, on or before 2028-12-31, the FDA approves a human drug or biologic whose label indication explicitly references slowing, treating, or reversing biological aging (not a single age-related disease). Veterinary approvals do not count.",
    resolutionSource: "FDA approval announcements and labels (Drugs@FDA)",
    sourceUrl: "https://www.fda.gov/drugs",
    openedAt: "2026-11-11T00:00:00Z",
    closeDate: "2028-12-31",
    horizonDate: "2028-12-31",
    isSandboxDrill: false,
  },
  {
    id: "node-cp-2028-magnetic-fusion-qsci",
    category: "science_frontier",
    title: "Checkpoint: A magnetic-confinement fusion device reports Q_sci > 1 by end of 2028",
    summary: "Tracks whether magnetic-confinement fusion matches the scientific-gain milestone first achieved by inertial confinement at NIF.",
    questionText: "Will any magnetic-confinement fusion device report scientific energy gain (Q_sci, fusion power out / heating power in) greater than 1 by December 31, 2028?",
    resolutionCriteria: "Resolves YES if, on or before 2028-12-31, the operator of a tokamak, stellarator, or other magnetic-confinement device officially reports, or a peer-reviewed paper documents, a plasma discharge with Q_sci > 1. Inertial-confinement results do not count.",
    resolutionSource: "Official device-operator announcements and peer-reviewed publications",
    sourceUrl: "https://www.iter.org/",
    openedAt: "2026-11-11T00:00:00Z",
    closeDate: "2028-12-31",
    horizonDate: "2028-12-31",
    isSandboxDrill: false,
  },
];

export const CHECKPOINT_NODES: FutureNode[] = [...DRILLS, ...OPEN_CHECKPOINTS].map(buildCheckpointNode);

/**
 * Sandbox drill forecasts. Only sandbox and simulated-agent profiles appear here;
 * no forecasts are fabricated for real people.
 */
export interface CheckpointSeedForecast {
  id: string;
  nodeId: string;
  handle: string;
  probability: number;
  crowd: number;
  confidence: number;
  submittedAt: string;
  rationale: string;
}

export const CHECKPOINT_SEED_FORECASTS: CheckpointSeedForecast[] = [
  // Drill 1 — AGI benchmark (YES); crowd 0.62
  { id: "fe-drill-01-elena", nodeId: "node-drill-01-agi-benchmark", handle: "elena_vance", probability: 0.78, crowd: 0.62, confidence: 1.25, submittedAt: "2026-01-12T15:00:00Z", rationale: "Sandbox drill: horizon trend implies threshold crossing; leaning above the crowd." },
  { id: "fe-drill-01-marcus", nodeId: "node-drill-01-agi-benchmark", handle: "marcus_chen", probability: 0.45, crowd: 0.62, confidence: 1.0, submittedAt: "2026-01-20T15:00:00Z", rationale: "Sandbox drill: hardware-bottleneck prior, fading the hype." },
  { id: "fe-drill-01-sentinel", nodeId: "node-drill-01-agi-benchmark", handle: "sentinel_bayes_v2", probability: 0.71, crowd: 0.62, confidence: 1.0, submittedAt: "2026-01-08T09:00:00Z", rationale: "Simulated agent: Bayesian extrapolation of benchmark slope." },
  { id: "fe-drill-01-realist", nodeId: "node-drill-01-agi-benchmark", handle: "hardware_realist_bot", probability: 0.52, crowd: 0.62, confidence: 1.0, submittedAt: "2026-01-09T09:00:00Z", rationale: "Simulated agent: compute-constrained baseline." },
  // Drill 2 — Safety incident (NO); crowd 0.35
  { id: "fe-drill-02-elena", nodeId: "node-drill-02-safety-incident", handle: "elena_vance", probability: 0.22, crowd: 0.35, confidence: 1.0, submittedAt: "2026-02-02T15:00:00Z", rationale: "Sandbox drill: disclosure incentives point the other way." },
  { id: "fe-drill-02-marcus", nodeId: "node-drill-02-safety-incident", handle: "marcus_chen", probability: 0.4, crowd: 0.35, confidence: 1.5, submittedAt: "2026-02-10T15:00:00Z", rationale: "Sandbox drill: expecting a disclosure, high conviction." },
  { id: "fe-drill-02-sentinel", nodeId: "node-drill-02-safety-incident", handle: "sentinel_bayes_v2", probability: 0.3, crowd: 0.35, confidence: 1.0, submittedAt: "2026-01-25T09:00:00Z", rationale: "Simulated agent: base rate of public incident disclosures." },
  { id: "fe-drill-02-realist", nodeId: "node-drill-02-safety-incident", handle: "hardware_realist_bot", probability: 0.18, crowd: 0.35, confidence: 1.0, submittedAt: "2026-01-26T09:00:00Z", rationale: "Simulated agent: low disclosure base rate." },
  // Drill 3 — Governance accord, long-shot (YES); crowd 0.18
  { id: "fe-drill-03-elena", nodeId: "node-drill-03-governance-accord", handle: "elena_vance", probability: 0.72, crowd: 0.18, confidence: 1.5, submittedAt: "2026-02-08T15:00:00Z", rationale: "Sandbox drill: contrarian call — back-channel signals the crowd is ignoring." },
  { id: "fe-drill-03-sentinel", nodeId: "node-drill-03-governance-accord", handle: "sentinel_bayes_v2", probability: 0.25, crowd: 0.18, confidence: 1.0, submittedAt: "2026-02-03T09:00:00Z", rationale: "Simulated agent: slight upward adjustment from crowd." },
  { id: "fe-drill-03-realist", nodeId: "node-drill-03-governance-accord", handle: "hardware_realist_bot", probability: 0.12, crowd: 0.18, confidence: 1.0, submittedAt: "2026-02-04T09:00:00Z", rationale: "Simulated agent: treaties are slow." },
  // Drill 4 — Labor shock, widely expected (NO); crowd 0.8
  { id: "fe-drill-04-elena", nodeId: "node-drill-04-economy-jobs", handle: "elena_vance", probability: 0.55, crowd: 0.8, confidence: 1.0, submittedAt: "2026-02-20T15:00:00Z", rationale: "Sandbox drill: skeptical of the consensus timeline." },
  { id: "fe-drill-04-marcus", nodeId: "node-drill-04-economy-jobs", handle: "marcus_chen", probability: 0.88, crowd: 0.8, confidence: 1.5, submittedAt: "2026-02-25T15:00:00Z", rationale: "Sandbox drill: riding the consensus with high conviction." },
  { id: "fe-drill-04-sentinel", nodeId: "node-drill-04-economy-jobs", handle: "sentinel_bayes_v2", probability: 0.82, crowd: 0.8, confidence: 1.0, submittedAt: "2026-02-17T09:00:00Z", rationale: "Simulated agent: agrees with consensus." },
  { id: "fe-drill-04-realist", nodeId: "node-drill-04-economy-jobs", handle: "hardware_realist_bot", probability: 0.6, crowd: 0.8, confidence: 1.0, submittedAt: "2026-02-18T09:00:00Z", rationale: "Simulated agent: diffusion lags." },
  // Drill 5 — Longevity trial (YES); crowd 0.3
  { id: "fe-drill-05-elena", nodeId: "node-drill-05-longevity-trial", handle: "elena_vance", probability: 0.42, crowd: 0.3, confidence: 1.0, submittedAt: "2026-03-05T15:00:00Z", rationale: "Sandbox drill: modestly above the crowd on mechanism strength." },
  { id: "fe-drill-05-sentinel", nodeId: "node-drill-05-longevity-trial", handle: "sentinel_bayes_v2", probability: 0.35, crowd: 0.3, confidence: 1.0, submittedAt: "2026-03-03T09:00:00Z", rationale: "Simulated agent: phase-transition base rates." },
  { id: "fe-drill-05-realist", nodeId: "node-drill-05-longevity-trial", handle: "hardware_realist_bot", probability: 0.2, crowd: 0.3, confidence: 1.0, submittedAt: "2026-03-04T09:00:00Z", rationale: "Simulated agent: most trials fail." },
  // Drill 6 — Fusion milestone (NO); crowd 0.25
  { id: "fe-drill-06-elena", nodeId: "node-drill-06-science-fusion", handle: "elena_vance", probability: 0.15, crowd: 0.25, confidence: 1.0, submittedAt: "2026-03-20T15:00:00Z", rationale: "Sandbox drill: schedule slip is the norm." },
  { id: "fe-drill-06-sentinel", nodeId: "node-drill-06-science-fusion", handle: "sentinel_bayes_v2", probability: 0.28, crowd: 0.25, confidence: 1.0, submittedAt: "2026-03-17T09:00:00Z", rationale: "Simulated agent: near crowd." },
  { id: "fe-drill-06-realist", nodeId: "node-drill-06-science-fusion", handle: "hardware_realist_bot", probability: 0.1, crowd: 0.25, confidence: 1.0, submittedAt: "2026-03-18T09:00:00Z", rationale: "Simulated agent: engineering bottlenecks." },
  // Drill 7 — Autonomy horizon (YES); crowd 0.5 — Elena revises late (only the final sliver counts)
  { id: "fe-drill-07-elena", nodeId: "node-drill-07-agi-agents", handle: "elena_vance", probability: 0.6, crowd: 0.5, confidence: 1.25, submittedAt: "2026-04-06T15:00:00Z", rationale: "Sandbox drill: leaning YES on agent scaffolding progress." },
  { id: "fe-drill-07-elena-rev", nodeId: "node-drill-07-agi-agents", handle: "elena_vance", probability: 0.9, crowd: 0.82, confidence: 1.25, submittedAt: "2026-10-05T15:00:00Z", rationale: "Sandbox drill: append-only revision after new evidence (late — reduced weight)." },
  { id: "fe-drill-07-sentinel", nodeId: "node-drill-07-agi-agents", handle: "sentinel_bayes_v2", probability: 0.66, crowd: 0.5, confidence: 1.0, submittedAt: "2026-04-03T09:00:00Z", rationale: "Simulated agent: horizon doubling trend." },
  { id: "fe-drill-07-realist", nodeId: "node-drill-07-agi-agents", handle: "hardware_realist_bot", probability: 0.4, crowd: 0.5, confidence: 1.0, submittedAt: "2026-04-04T09:00:00Z", rationale: "Simulated agent: reliability ceiling." },
];
