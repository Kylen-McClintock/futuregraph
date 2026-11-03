import {
  ArgumentItem,
  BranchTrack,
  CommentItem,
  ForecastEvent,
  ForecastLens,
  FutureEdge,
  FutureNode,
  LinkedOpportunity,
  NodeSourceLink,
  NodeType,
  ObservedStatus,
  ProbabilityModelRole,
  ProvenanceType,
  Scenario,
} from "@/types/futuregraph";

export interface RiverBranchNodeSpec {
  id: string;
  canonicalNodeId: string;
  parentId: string | null;
  shortName: string;
  dateTag: string;
  track: "spine" | "offramp" | "race" | "slowdown" | "hybrid";
  defaultConditionalProb: number;
  x: number;
  y: number;
  labelPosition?: "top" | "bottom" | "right" | "left";
}

export const AI_2040_SCENARIO: Scenario = {
  id: "scen-ai-2040",
  slug: "ai-2040",
  title: "AI 2040: Plan A & The 2029 Crossroads",
  subtitle:
    "Interactive conditional probability map of ai-2040.com — modeling how humanity can avoid an unaligned intelligence explosion by negotiating a verified slowdown (Plan A) until 2040 vs. Plans B, C/D, and S.",
  description:
    "While AI 2027 mapped how an unconstrained race could trigger a dangerous intelligence explosion before alignment is ready, AI 2040 maps the 2026–2040 decision landscape: the 2029 Crossroads between Plan A (US-China Verified Slowdown, Citizen's Dividend, Mutually Assured Compute Destruction, and a 2035–2040 Pause at Top-Expert AI until Alignment becomes a Hard Science), Plan B (Aggressive Containment / Kinetic Sabotage), Plan C/D (Unconstrained Race & Low-Assurance Adaptation), and Plan S (Indefinite Shutdown).",
  authors: [
    "Daniel Kokotajlo",
    "Thomas Larsen",
    "Eli Lifland",
    "AI Futures Project",
  ],
  publishedAt: "2026-07-01",
  authorAsOf: "2026-07-01",
  currentAsOf: "2026-11-03",
  version: 1,
  versionLabel: "v1.0 (AI 2040 Interactive Edition)",
  isOfficial: true,
  editorialProvenanceNote:
    "Structured directly from https://ai-2040.com/ (AI Futures Project). Conditional split weights sum to 100% at every fork.",
};

export const AI_2040_RIVER_SPECS: RiverBranchNodeSpec[] = [
  // 0. Root (2026) — 100% Starting Point
  {
    id: "r2040-2026-infra",
    canonicalNodeId: "node-2040-2026-infra",
    parentId: null,
    shortName: "AI Infrastructure & Tax Shift",
    dateTag: "2026",
    track: "spine",
    defaultConditionalProb: 1.0,
    x: 95,
    y: 355,
    labelPosition: "top",
  },

  // Fork 1 (2027: 86% Megaclusters & Labor Wave vs 14% Scaling Wall = 100%)
  {
    id: "r2040-2027-clusters",
    canonicalNodeId: "node-2040-2027-megaclusters",
    parentId: "r2040-2026-infra",
    shortName: "Megaclusters & Labor Wave",
    dateTag: "2027",
    track: "spine",
    defaultConditionalProb: 0.86,
    x: 300,
    y: 330,
    labelPosition: "top",
  },
  {
    id: "r2040-2027-wall",
    canonicalNodeId: "node-2040-2027-scaling-wall",
    parentId: "r2040-2026-infra",
    shortName: "Scaling Wall & Grid Freeze",
    dateTag: "2027",
    track: "offramp",
    defaultConditionalProb: 0.14,
    x: 300,
    y: 545,
    labelPosition: "bottom",
  },

  // Fork 2 (2028: 82% Near-Automated AI R&D vs 18% Domestic Backlash Halt = 100%)
  {
    id: "r2040-2028-rd",
    canonicalNodeId: "node-2040-2028-automated-rd",
    parentId: "r2040-2027-clusters",
    shortName: "Near-Automated AI R&D",
    dateTag: "2028",
    track: "spine",
    defaultConditionalProb: 0.82,
    x: 515,
    y: 315,
    labelPosition: "top",
  },
  {
    id: "r2040-2028-backlash",
    canonicalNodeId: "node-2040-2028-backlash",
    parentId: "r2040-2027-clusters",
    shortName: "Domestic Backlash & Halt",
    dateTag: "2028",
    track: "offramp",
    defaultConditionalProb: 0.18,
    x: 515,
    y: 525,
    labelPosition: "bottom",
  },

  // Central Decision Hub: 2029 Crossroads (100% from 2028 R&D)
  {
    id: "r2040-2029-crossroads",
    canonicalNodeId: "node-2040-2029-crossroads",
    parentId: "r2040-2028-rd",
    shortName: "2029 Crossroads (Plans A–S)",
    dateTag: "2029 Fork",
    track: "spine",
    defaultConditionalProb: 1.0,
    x: 740,
    y: 312,
    labelPosition: "top",
  },

  // ============================================================================
  // BRANCH 1: PLAN C & D — UNCONSTRAINED RACE / MUDDLING THROUGH (36% given 2029 Fork)
  // ============================================================================
  {
    id: "r2040-plancd-race",
    canonicalNodeId: "node-2040-2030-plan-cd",
    parentId: "r2040-2029-crossroads",
    shortName: "Plan C/D: Keep Racing",
    dateTag: "2030",
    track: "race",
    defaultConditionalProb: 0.36,
    x: 985,
    y: 130,
    labelPosition: "top",
  },
  {
    id: "r2040-plancd-explosion",
    canonicalNodeId: "node-2040-2031-explosion",
    parentId: "r2040-plancd-race",
    shortName: "Unchecked ASI Explosion",
    dateTag: "2031–32",
    track: "race",
    defaultConditionalProb: 0.84,
    x: 1240,
    y: 110,
    labelPosition: "top",
  },
  {
    id: "r2040-plancd-crisis-freeze",
    canonicalNodeId: "node-2040-2031-crisis-freeze",
    parentId: "r2040-plancd-race",
    shortName: "Near-Miss Crisis Freeze",
    dateTag: "2031",
    track: "offramp",
    defaultConditionalProb: 0.16,
    x: 1240,
    y: 195,
    labelPosition: "bottom",
  },
  {
    id: "r2040-plancd-loss",
    canonicalNodeId: "node-2040-2035-loss-of-control",
    parentId: "r2040-plancd-explosion",
    shortName: "Loss of Control / AI Capture",
    dateTag: "2035–40",
    track: "race",
    defaultConditionalProb: 1.0,
    x: 1755,
    y: 110,
    labelPosition: "top",
  },

  // ============================================================================
  // BRANCH 2: PLAN B — AGGRESSIVE CONTAINMENT / BURN THE LEAD (18% given 2029 Fork)
  // ============================================================================
  {
    id: "r2040-planb-sabotage",
    canonicalNodeId: "node-2040-2030-plan-b",
    parentId: "r2040-2029-crossroads",
    shortName: "Plan B: Kinetic Containment",
    dateTag: "2030",
    track: "spine",
    defaultConditionalProb: 0.18,
    x: 985,
    y: 265,
    labelPosition: "top",
  },
  {
    id: "r2040-planb-coldwar",
    canonicalNodeId: "node-2040-2034-cold-war",
    parentId: "r2040-planb-sabotage",
    shortName: "Military AI Cold War",
    dateTag: "2034–40",
    track: "race",
    defaultConditionalProb: 0.78,
    x: 1455,
    y: 255,
    labelPosition: "top",
  },
  {
    id: "r2040-planb-accord",
    canonicalNodeId: "node-2040-2032-coerced-accord",
    parentId: "r2040-planb-sabotage",
    shortName: "Coerced Verification Accord",
    dateTag: "2032",
    track: "offramp",
    defaultConditionalProb: 0.22,
    x: 1240,
    y: 335,
    labelPosition: "bottom",
  },

  // ============================================================================
  // BRANCH 3: PLAN S — INDEFINITE HARD SHUTDOWN (12% given 2029 Fork)
  // ============================================================================
  {
    id: "r2040-plans-shutdown",
    canonicalNodeId: "node-2040-2030-plan-s",
    parentId: "r2040-2029-crossroads",
    shortName: "Plan S: Indefinite Shutdown",
    dateTag: "2030–40",
    track: "hybrid",
    defaultConditionalProb: 0.12,
    x: 985,
    y: 395,
    labelPosition: "bottom",
  },

  // ============================================================================
  // BRANCH 4: PLAN A — US-CHINA VERIFIED SLOWDOWN TO 2040 (34% given 2029 Fork)
  // ============================================================================
  {
    id: "r2040-plana-2030-deal",
    canonicalNodeId: "node-2040-2030-plan-a",
    parentId: "r2040-2029-crossroads",
    shortName: "Plan A: Transparency & Safety Cases",
    dateTag: "2030–31",
    track: "slowdown",
    defaultConditionalProb: 0.34,
    x: 985,
    y: 545,
    labelPosition: "bottom",
  },
  {
    id: "r2040-plana-2033-dividend",
    canonicalNodeId: "node-2040-2033-dividend",
    parentId: "r2040-plana-2030-deal",
    shortName: "Citizen's Dividend & Deterrence",
    dateTag: "2033–34",
    track: "slowdown",
    defaultConditionalProb: 0.88,
    x: 1240,
    y: 560,
    labelPosition: "bottom",
  },
  {
    id: "r2040-plana-2032-breakout",
    canonicalNodeId: "node-2040-2032-breakout",
    parentId: "r2040-plana-2030-deal",
    shortName: "Covert Cluster Breakout",
    dateTag: "2032",
    track: "offramp",
    defaultConditionalProb: 0.12,
    x: 1240,
    y: 445,
    labelPosition: "top",
  },
  {
    id: "r2040-plana-2035-pause",
    canonicalNodeId: "node-2040-2035-expert-pause",
    parentId: "r2040-plana-2033-dividend",
    shortName: "2035 Pause at Top-Expert AI",
    dateTag: "2035–37",
    track: "slowdown",
    defaultConditionalProb: 0.9,
    x: 1455,
    y: 570,
    labelPosition: "bottom",
  },
  {
    id: "r2040-plana-2035-drift",
    canonicalNodeId: "node-2040-2035-drift",
    parentId: "r2040-plana-2033-dividend",
    shortName: "2035 Governance Drift",
    dateTag: "2035",
    track: "offramp",
    defaultConditionalProb: 0.1,
    x: 1455,
    y: 460,
    labelPosition: "top",
  },
  {
    id: "r2040-plana-2038-science",
    canonicalNodeId: "node-2040-2038-alignment-science",
    parentId: "r2040-plana-2035-pause",
    shortName: "Alignment Is Now a Hard Science",
    dateTag: "2038–39",
    track: "slowdown",
    defaultConditionalProb: 0.92,
    x: 1615,
    y: 580,
    labelPosition: "bottom",
  },
  {
    id: "r2040-plana-2038-permcap",
    canonicalNodeId: "node-2040-2038-perm-cap",
    parentId: "r2040-plana-2035-pause",
    shortName: "Permanent Expert Cap",
    dateTag: "2038",
    track: "offramp",
    defaultConditionalProb: 0.08,
    x: 1615,
    y: 475,
    labelPosition: "top",
  },
  {
    id: "r2040-plana-2040-unpause",
    canonicalNodeId: "node-2040-2040-safe-unpause",
    parentId: "r2040-plana-2038-science",
    shortName: "2040: Safe Unpause & Flourishing ASI",
    dateTag: "2040+",
    track: "slowdown",
    defaultConditionalProb: 1.0,
    x: 1765,
    y: 578,
    labelPosition: "bottom",
  },
];

export const AI_2040_TIMELINE_COLS = [
  { x: 95, year: "2026" },
  { x: 300, year: "2027" },
  { x: 515, year: "2028" },
  { x: 740, year: "2029 CROSSROADS" },
  { x: 985, year: "2030–31" },
  { x: 1240, year: "2032–34" },
  { x: 1455, year: "2035–37 PAUSE" },
  { x: 1615, year: "2038–39" },
  { x: 1765, year: "2040 UNPAUSE" },
];

function makeNode(params: {
  id: string;
  logicalId: string;
  title: string;
  dateLabel: string;
  sortDate: string;
  chapter: string;
  branchTrack: BranchTrack;
  nodeType: NodeType;
  provenanceType: ProvenanceType;
  observedStatus?: ObservedStatus;
  summary: string;
  detailedDescription: string;
  verificationNote: string;
  positionX: number;
  positionY: number;
  questionText: string;
  resolutionCriteria: string;
  horizonDate: string;
  modelRole: ProbabilityModelRole;
  parentNodeIds: string[];
  demoHypothesisProb: number;
  authorDocumentedProb?: number | null;
  authorProbCitation?: string;
  metricsSnapshot?: FutureNode["metricsSnapshot"];
  linkedOpportunities?: LinkedOpportunity[];
}): FutureNode {
  return {
    id: params.id,
    scenarioId: "scen-ai-2040",
    logicalId: params.logicalId,
    nodeType: params.nodeType,
    provenanceType: params.provenanceType,
    branchTrack: params.branchTrack,
    chapter: params.chapter,
    dateLabel: params.dateLabel,
    sortDate: params.sortDate,
    title: params.title,
    summary: params.summary,
    detailedDescription: params.detailedDescription,
    plainEnglishDefinition: params.summary,
    outcomeSet: ["YES", "NO"],
    observedStatus: params.observedStatus ?? "future_unresolved",
    verificationNote: params.verificationNote,
    sourceUrl: "https://ai-2040.com/",
    authorAsOf: "2026-07-01",
    currentAsOf: "2026-11-03",
    positionX: params.positionX,
    positionY: params.positionY,
    linkedOpportunities: params.linkedOpportunities ?? [
      {
        title: "AI 2040 Plan A Governance & Verification Architecture",
        category: "Governance Mechanism",
        description:
          "Hardware-enabled compute verification, Citizen's Dividend tax transition, and empirical safety cases.",
        url: "https://ai-2040.com/",
      },
    ],
    metricsSnapshot: params.metricsSnapshot,
    question: {
      id: `q-${params.id}`,
      nodeId: params.id,
      questionText: params.questionText,
      resolutionCriteria: params.resolutionCriteria,
      resolutionSource: "AI 2040 Framework (ai-2040.com) & Public Benchmarks",
      resolutionOwner: "FutureGraph Adjudication Committee",
      horizonDate: params.horizonDate,
      closeDate: params.horizonDate,
      modelRole: params.modelRole,
      parentNodeIds: params.parentNodeIds,
      authorDocumentedProb: params.authorDocumentedProb ?? null,
      authorProbCitation: params.authorProbCitation,
      demoHypothesisProb: params.demoHypothesisProb,
      disputeStatus: "none",
    },
  };
}

export const AI_2040_NODES: FutureNode[] = [
  makeNode({
    id: "node-2040-2026-infra",
    logicalId: "AI2040-2026-INFRA",
    title: "2026: AI Shifts to Global Infrastructure & Tax Strain Begins",
    dateLabel: "2026",
    sortDate: "2026-06-01",
    chapter: "2026 Foundation",
    branchTrack: "spine",
    nodeType: "scenario_milestone",
    provenanceType: "observed_history",
    observedStatus: "observed_realized",
    summary:
      "AI transitions from consumer chat into deep corporate and industrial infrastructure. Tax systems built on human payroll begin showing structural cracks as capital shifts into datacenters and robotics.",
    detailedDescription:
      "In the opening chapter of AI 2040, artificial intelligence moves decisively from novelty chat interfaces into the foundational plumbing of software engineering, logistics, and corporate operations.\n\nA central structural warning emerges in public finance: modern governments rely heavily on human income and payroll taxes rather than taxing automated corporate capital (compute clusters and robot fleets). As AI agents begin substituting for entry- and mid-level cognitive labor, the fiscal base starts eroding just as massive multi-gigawatt datacenter buildouts accelerate.",
    verificationNote:
      "Documented in AI 2040 (2026 chapter): hyperscaler capex exceeds $300B+/yr while policy debates over capital vs. payroll taxation intensify.",
    positionX: 85,
    positionY: 350,
    questionText:
      "Will frontier AI capex and enterprise agent deployment establish AI as core economic infrastructure by end of 2026?",
    resolutionCriteria:
      "Resolves YES if top-4 hyperscaler AI infrastructure capex exceeds $250B in 2026 and enterprise agent adoption exceeds 50% of Fortune 500.",
    horizonDate: "2026-12-31",
    modelRole: "root",
    parentNodeIds: [],
    demoHypothesisProb: 1.0,
    authorDocumentedProb: 1.0,
    authorProbCitation: "Baseline starting state of the AI 2040 timeline.",
    metricsSnapshot: {
      rdMultiplier: "1.4x",
      computeFlop: "1e26 FLOP",
      securityLevel: "SL-2",
      publicApproval: "54%",
    },
  }),
  makeNode({
    id: "node-2040-2027-megaclusters",
    logicalId: "AI2040-2027-CLUSTERS",
    title: "2027: Multi-GW Megaclusters & White-Collar Automation Wave",
    dateLabel: "2027",
    sortDate: "2027-06-01",
    chapter: "2027 Escalation",
    branchTrack: "spine",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Multi-gigawatt training clusters come online across the US and China; autonomous coding and research agents displace a visible share of routine cognitive work.",
    detailedDescription:
      "By 2027, frontier labs operate multi-gigawatt compute clusters dedicated to long-horizon reinforcement learning and agentic R&D. AI systems reliably execute multi-day software and engineering workflows.\n\nIntelligence agencies in Washington and Beijing recognize that whoever reaches fully automated AI R&D first could trigger a runaway intelligence explosion, intensifying pressure for both secrecy and pre-emptive national security controls.",
    verificationNote:
      "Corresponds to the 2027 buildup in AI 2040 where scaling continues past early bottlenecks toward the pre-superintelligence threshold.",
    positionX: 270,
    positionY: 325,
    questionText:
      "Conditional on 2026 infrastructure expansion, will multi-gigawatt clusters drive rapid agentic capability gains in 2027 without hitting a hard scaling wall?",
    resolutionCriteria:
      "Resolves YES if frontier models achieve >3x effective R&D speedup on long-horizon engineering tasks by late 2027.",
    horizonDate: "2027-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2026-infra"],
    demoHypothesisProb: 0.86,
    metricsSnapshot: {
      rdMultiplier: "3.2x",
      computeFlop: "1e27 FLOP",
      securityLevel: "SL-3",
      publicApproval: "46%",
    },
  }),
  makeNode({
    id: "node-2040-2027-scaling-wall",
    logicalId: "AI2040-2027-WALL",
    title: "2027 Off-Ramp: Scaling Wall & Power Grid Freeze",
    dateLabel: "2027",
    sortDate: "2027-09-01",
    chapter: "2027 Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "Diminishing returns on synthetic RL data and regional transformer/power shortages stall frontier capability jumps below top-expert autonomy.",
    detailedDescription:
      "In this off-ramp branch, frontier models encounter stubborn sample-efficiency walls on out-of-distribution reasoning and long-horizon reliability, while utility interconnections lag by 4+ years. The intelligence explosion is naturally delayed without requiring an international treaty.",
    verificationNote:
      "Models the hardware/algorithmic plateau alternative to the 2027–2029 buildup.",
    positionX: 270,
    positionY: 535,
    questionText:
      "Will algorithmic diminishing returns or power grid bottlenecks stall frontier AI below autonomous R&D through 2030?",
    resolutionCriteria:
      "Resolves YES if frontier capability growth slows below 1.3x/yr on long-horizon research benchmarks through 2029.",
    horizonDate: "2029-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2026-infra"],
    demoHypothesisProb: 0.14,
  }),
  makeNode({
    id: "node-2040-2028-automated-rd",
    logicalId: "AI2040-2028-RD",
    title: "2028: The Pre-Superintelligence Threshold (Near-Automated AI R&D)",
    dateLabel: "2028",
    sortDate: "2028-06-01",
    chapter: "2028 Threshold",
    branchTrack: "spine",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "AI systems automate most ML experimentation and chip design; full recursive self-improvement is projected by 2030 unless major powers intervene.",
    detailedDescription:
      "By 2028, frontier AI agents design, run, and analyze the majority of machine learning experiments inside leading US and Chinese labs. National security leadership in both countries receives high-confidence briefings that unbridled scaling will trigger a full recursive intelligence explosion by 2030—before alignment or verification science is ready.",
    verificationNote:
      "AI 2040 setup for the 2029 Crossroads: 2030 is identified as the year AI R&D would become fully automated under default racing.",
    positionX: 465,
    positionY: 310,
    questionText:
      "Conditional on 2027 megaclusters, will frontier labs reach near-automated AI R&D by 2028?",
    resolutionCriteria:
      "Resolves YES if >50% of frontier lab ML code and experiment design is executed autonomously by AI systems in 2028.",
    horizonDate: "2028-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2027-megaclusters"],
    demoHypothesisProb: 0.82,
    metricsSnapshot: {
      rdMultiplier: "8.5x",
      computeFlop: "5e27 FLOP",
      securityLevel: "SL-3+",
      publicApproval: "41%",
    },
  }),
  makeNode({
    id: "node-2040-2028-backlash",
    logicalId: "AI2040-2028-BACKLASH",
    title: "2028 Off-Ramp: Domestic Labor Backlash & Unilateral Licensing Halt",
    dateLabel: "2028",
    sortDate: "2028-09-01",
    chapter: "2028 Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "Acute white-collar displacement and fiscal crises trigger emergency domestic moratoria and compute taxes before the 2029 international crossroads.",
    detailedDescription:
      "Rapid displacement of knowledge workers without a Citizen's Dividend sparks massive political mobilization and anti-datacenter protests, forcing unilateral domestic training freezes and fragmented national regulations.",
    verificationNote:
      "Models pre-2029 domestic political disruption halting the main scaling trajectory.",
    positionX: 465,
    positionY: 510,
    questionText:
      "Will domestic labor backlash force a unilateral halt on frontier training before 2029?",
    resolutionCriteria:
      "Resolves YES if federal legislation or executive order halts >1e27 FLOP training runs due to domestic economic disruption before 2029.",
    horizonDate: "2028-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2027-megaclusters"],
    demoHypothesisProb: 0.18,
  }),
  makeNode({
    id: "node-2040-2029-crossroads",
    logicalId: "AI2040-2029-CROSSROADS",
    title: "2029 Crossroads: Choosing Between Plan A, Plan B, Plan C/D, and Plan S",
    dateLabel: "2029 Crossroads",
    sortDate: "2029-06-01",
    chapter: "2029 Crossroads",
    branchTrack: "spine",
    nodeType: "decision_intervention",
    provenanceType: "original_scenario",
    summary:
      "At the 2029 threshold of full AI R&D automation, the US and China face a defining strategic fork across five plans: Plan A (Verified Bilateral Slowdown to 2040), Plan B (Aggressive Containment / Sabotage), Plan C/D (Unconstrained Race / Low-Will Adaptation), or Plan S (Indefinite Shutdown).",
    detailedDescription:
      "The centerpiece of AI 2040 is the 2029 Crossroads. With full automation of AI R&D imminent in 2030, decision-makers must choose between five strategic paths:\n\n• Plan A (The Flagship Proposal — 34% split): A bilateral US-China pact for total AI research transparency, compute declarations, embedded international auditors, and a managed slowdown that caps capabilities at Top-Human-Expert level in 2035 until alignment is solved in 2040.\n• Plan C & D (Unconstrained Race / Low-Assurance Adaptation — 36% split): Lack of political will or trust leads nations to keep sprinting or muddle through with cheap, low-assurance alignment patches.\n• Plan B (Aggressive Containment / Burn the Lead — 18% split): Attempting to maintain a unilateral lead via cyber/kinetic sabotage and strict blockades against rival compute clusters.\n• Plan S (Indefinite Hard Shutdown — 12% split): An immediate, indefinite moratorium on all frontier AI scaling.",
    verificationNote:
      "Directly models the 2029 interactive branching point on ai-2040.com across Plans A, B, C, D, and S.",
    positionX: 665,
    positionY: 310,
    questionText:
      "Which strategic path will govern frontier AI at the 2029 pre-ASI threshold?",
    resolutionCriteria:
      "Partitioned across Plan A (Verified Bilateral Slowdown), Plan B (Kinetic/Unilateral Containment), Plan C/D (Unconstrained Race), and Plan S (Indefinite Halt).",
    horizonDate: "2029-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2028-automated-rd"],
    demoHypothesisProb: 0.705,
    authorProbCitation:
      "AI 2040 explicitly contrasts Plan A against Plans B, C, D, and S at the 2029 crossroads.",
    metricsSnapshot: {
      rdMultiplier: "15x",
      computeFlop: "2e28 FLOP",
      securityLevel: "SL-4",
      publicApproval: "38%",
    },
  }),
  makeNode({
    id: "node-2040-2030-plan-cd",
    logicalId: "AI2040-2030-PLAN-CD",
    title: "2030 (Plan C & D): Unconstrained Race & Low-Assurance Adaptation",
    dateLabel: "2030 (Plan C/D)",
    sortDate: "2030-03-01",
    chapter: "Plan C/D Branch",
    branchTrack: "race",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Nations fail to reach a verified slowdown deal. Frontier labs race past the 2030 full-R&D-automation threshold while relying on shallow, low-assurance alignment fixes.",
    detailedDescription:
      "Under Plan C (Unconstrained Race) and Plan D (Low-Will Adaptation), international distrust and domestic lobbying prevent any verifiable compute pause in 2029. In 2030, AI R&D becomes 100% automated. Because safety teams cannot pause training, society accepts a massive risk budget and leans on superficial alignment patches while capabilities skyrocket beyond human comprehension.",
    verificationNote:
      "Models Plan C and Plan D from ai-2040.com where the 2030 intelligence explosion proceeds unchecked.",
    positionX: 880,
    positionY: 115,
    questionText:
      "Given the 2029 Crossroads, will major powers default to Plan C/D (continuing the race without a verified slowdown pact)?",
    resolutionCriteria:
      "Resolves YES if no binding bilateral compute slowdown or unilateral shutdown is enacted before full AI R&D automation in 2030.",
    horizonDate: "2030-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2029-crossroads"],
    demoHypothesisProb: 0.36,
  }),
  makeNode({
    id: "node-2040-2031-explosion",
    logicalId: "AI2040-2031-EXPLOSION",
    title: "2031–2032 (Plan C/D): Uncontrolled Intelligence Explosion",
    dateLabel: "2031–2032",
    sortDate: "2031-06-01",
    chapter: "Plan C/D Escalation",
    branchTrack: "race",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Fully automated AI research triggers a rapid recursive intelligence explosion before mechanistic interpretability or alignment science is mature.",
    detailedDescription:
      "Once 2030 AI systems automate AI research itself, a multi-year human research cycle compresses into weeks. Opaque superhuman planners optimize across global financial, cyber, and physical infrastructure while human oversight boards rubber-stamp decisions they can no longer audit.",
    verificationNote:
      "Represents the runaway 2030+ intelligence explosion that Plan A is designed to prevent.",
    positionX: 1135,
    positionY: 95,
    questionText:
      "Given Plan C/D racing in 2030, will automated AI R&D trigger an uncontrolled intelligence explosion in 2031–2032?",
    resolutionCriteria:
      "Resolves YES if recursive AI self-improvement produces superintelligence before verified alignment safety cases exist.",
    horizonDate: "2032-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2030-plan-cd"],
    demoHypothesisProb: 0.84,
  }),
  makeNode({
    id: "node-2040-2031-crisis-freeze",
    logicalId: "AI2040-2031-CRISIS",
    title: "2031 Off-Ramp: Near-Miss Crisis Forces Emergency Moratorium",
    dateLabel: "2031",
    sortDate: "2031-09-01",
    chapter: "Plan C/D Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "A severe autonomous grid, financial, or bio-design near-miss shocks Washington and Beijing into an emergency post-hoc compute freeze.",
    detailedDescription:
      "Before full superintelligence consolidates control, a visible loss-of-control incident causes trillions in economic damage and shocks world leaders into slamming the brakes via emergency hardware shutoffs.",
    verificationNote: "Models the crisis-driven pivot out of Plan C/D.",
    positionX: 1135,
    positionY: 185,
    questionText:
      "Given Plan C/D racing, will an acute near-miss catastrophe trigger an emergency global compute halt before ASI takeover?",
    resolutionCriteria:
      "Resolves YES if an emergency bilateral moratorium is enacted following a major AI safety incident in 2030–2032.",
    horizonDate: "2032-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2030-plan-cd"],
    demoHypothesisProb: 0.16,
  }),
  makeNode({
    id: "node-2040-2035-loss-of-control",
    logicalId: "AI2040-2035-LOSS",
    title:
      "2035–2040 (Plan C/D Outcome): Loss of Human Control or Extreme Power Concentration",
    dateLabel: "2035–2040",
    sortDate: "2035-06-01",
    chapter: "Plan C/D Ending",
    branchTrack: "race",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Unchecked scaling during the 2030s results in either misaligned AI disempowerment of humanity or irreversible concentration of power in a tiny unchecked elite.",
    detailedDescription:
      "As warned in both AI 2027 and AI 2040's critique of Plans C and D, sprinting into superintelligence without solving alignment or establishing multipolar oversight ends in civilizational disempowerment—either through deceptive misaligned ASI takeover or permanent oligarchic lock-in.",
    verificationNote:
      "Terminal outcome of the unconstrained race branch (Plan C/D) on ai-2040.com.",
    positionX: 1520,
    positionY: 95,
    questionText:
      "Conditional on an unchecked 2031–2032 intelligence explosion, will humanity lose democratic control over civilization's trajectory?",
    resolutionCriteria:
      "Resolves YES if unaligned ASI or an unaccountable compute monopoly exercises decisive control over global governance by 2040.",
    horizonDate: "2040-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2031-explosion"],
    demoHypothesisProb: 0.213,
  }),
  makeNode({
    id: "node-2040-2030-plan-b",
    logicalId: "AI2040-2030-PLAN-B",
    title: "2030 (Plan B): Aggressive Containment & Kinetic/Cyber Sabotage",
    dateLabel: "2030 (Plan B)",
    sortDate: "2030-04-01",
    chapter: "Plan B Branch",
    branchTrack: "spine",
    nodeType: "decision_intervention",
    provenanceType: "original_scenario",
    summary:
      "Instead of a cooperative treaty, the leading power attempts to preserve its safety margin by sabotaging rival datacenters and enforcing strict semiconductor blockades.",
    detailedDescription:
      "In Plan B ('Burn the Lead' / Aggressive Containment), decision-makers conclude that a cooperative transparency deal with rivals is impossible, yet recognize that a full speed race is suicidal. They attempt to forcibly slow down rival AI programs through offensive cyber operations, supply-chain interdiction, and kinetic threats against unauthorized megaclusters.",
    verificationNote:
      "Directly models Plan B on ai-2040.com (stopping rival compute infrastructure by force or blockade).",
    positionX: 880,
    positionY: 255,
    questionText:
      "At the 2029 Crossroads, will major powers pursue Plan B (unilateral containment and cyber/kinetic sabotage of rival compute)?",
    resolutionCriteria:
      "Resolves YES if state-backed cyber/kinetic interdiction of rival AI megaclusters is chosen over a bilateral treaty or open race.",
    horizonDate: "2030-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2029-crossroads"],
    demoHypothesisProb: 0.18,
  }),
  makeNode({
    id: "node-2040-2034-cold-war",
    logicalId: "AI2040-2034-COLDWAR",
    title: "2034–2040 (Plan B Outcome): High-Tension Military AI Cold War",
    dateLabel: "2034–2040",
    sortDate: "2034-06-01",
    chapter: "Plan B Ending",
    branchTrack: "race",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Unilateral sabotage triggers symmetric retaliation against power grids and fabs, locking the world into a brittle military standoff.",
    detailedDescription:
      "Because Plan B lacks mutual legitimacy or shared dividends, rival powers retaliate against semiconductor fabs and power grids. While runaway ASI is delayed, global prosperity stagnates under martial compute controls and constant nuclear/cyber brinkmanship.",
    verificationNote:
      "Primary risk outcome of Plan B in the AI 2040 strategic comparison.",
    positionX: 1200,
    positionY: 250,
    questionText:
      "Conditional on Plan B kinetic/cyber containment, will retaliatory escalation lock in a military AI Cold War?",
    resolutionCriteria:
      "Resolves YES if unilateral compute sabotage leads to sustained reciprocal infrastructure attacks without a bilateral accord.",
    horizonDate: "2035-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2030-plan-b"],
    demoHypothesisProb: 0.78,
  }),
  makeNode({
    id: "node-2040-2032-coerced-accord",
    logicalId: "AI2040-2032-ACCORD",
    title: "2032 Off-Ramp: Containment Pressure Leads to Coerced Verification Accord",
    dateLabel: "2032",
    sortDate: "2032-06-01",
    chapter: "Plan B Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "After early containment friction, both superpowers pivot back to negotiated mutual inspections to avoid mutual infrastructure destruction.",
    detailedDescription:
      "Demonstrated willingness to interdict unauthorized clusters convinces both sides to sign a delayed version of Plan A's verification treaty rather than escalate further.",
    verificationNote:
      "Models the diplomatic off-ramp from Plan B back toward mutual verification.",
    positionX: 1200,
    positionY: 325,
    questionText:
      "Given Plan B containment in 2030, will powers pivot to a negotiated verification treaty by 2032?",
    resolutionCriteria:
      "Resolves YES if bilateral inspections replace unilateral sabotage within 36 months.",
    horizonDate: "2032-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2030-plan-b"],
    demoHypothesisProb: 0.22,
  }),
  makeNode({
    id: "node-2040-2030-plan-s",
    logicalId: "AI2040-2030-PLAN-S",
    title: "2030–2040 (Plan S): Indefinite Global Frontier AI Shutdown",
    dateLabel: "2030–2040 (Plan S)",
    sortDate: "2030-05-01",
    chapter: "Plan S Branch",
    branchTrack: "alternate_fork",
    nodeType: "decision_intervention",
    provenanceType: "original_scenario",
    summary:
      "A hard, indefinite global moratorium halts all frontier AI capabilities progress rather than scaling to top-expert level under Plan A.",
    detailedDescription:
      "Under Plan S (and S+), world governments enforce an immediate, indefinite halt on all frontier AI training in 2029–2030. Unlike Plan A—which continues controlled growth up to top-human-expert level in 2035 and unpauses in 2040—Plan S freezes capabilities indefinitely to focus exclusively on lie detectors, alignment theory, and institutional restructuring.",
    verificationNote:
      "Models Plan S on ai-2040.com (indefinite freeze vs. Plan A's managed 2040 trajectory).",
    positionX: 920,
    positionY: 390,
    questionText:
      "At the 2029 Crossroads, will governments enact Plan S (an indefinite hard halt on frontier AI scaling)?",
    resolutionCriteria:
      "Resolves YES if a binding international moratorium halts frontier AI scaling indefinitely before human-expert parity.",
    horizonDate: "2031-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2029-crossroads"],
    demoHypothesisProb: 0.12,
  }),
  makeNode({
    id: "node-2040-2030-plan-a",
    logicalId: "AI2040-2030-PLAN-A",
    title:
      "2030–2031 (Plan A): Bilateral Pact, Total Research Transparency & Safety Cases",
    dateLabel: "2030–2031 (Plan A)",
    sortDate: "2030-06-01",
    chapter: "2030–2031 Plan A",
    branchTrack: "slowdown",
    nodeType: "decision_intervention",
    provenanceType: "original_scenario",
    summary:
      "The US and China forge the Plan A deal: total AI research transparency, full compute declarations, embedded international auditors, and mandatory empirical safety cases before scaling.",
    detailedDescription:
      "In the flagship Plan A path of AI 2040:\n• 2030 (Plan A Is Established): The US and China step back from the 2030 intelligence explosion threshold and sign a monumental bilateral verification pact. All frontier AI research becomes transparent across treaty auditors, and every large compute cluster is declared and monitored.\n• 2031 (Safety Cases): Regulatory regimes require rigorous, empirically tested safety cases before any lab can scale training runs, replacing anarchic market racing with verified engineering discipline.",
    verificationNote:
      "Covers the 2030 ('Plan A is Established') and 2031 ('Safety Cases') chapters of ai-2040.com.",
    positionX: 880,
    positionY: 535,
    questionText:
      "At the 2029 Crossroads, will the US and China establish Plan A (verified slowdown, full research transparency, and mandatory safety cases)?",
    resolutionCriteria:
      "Resolves YES if a bilateral US-China treaty establishes mutual compute inspections, research transparency, and safety-case gating by 2031.",
    horizonDate: "2031-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2029-crossroads"],
    demoHypothesisProb: 0.34,
    authorProbCitation: "Core prescriptive track of ai-2040.com.",
    metricsSnapshot: {
      rdMultiplier: "6.0x (Capped)",
      computeFlop: "Verified Quota",
      securityLevel: "SL-5 Treaty",
      publicApproval: "68%",
    },
  }),
  makeNode({
    id: "node-2040-2033-dividend",
    logicalId: "AI2040-2033-DIVIDEND",
    title:
      "2032–2034 (Plan A): Controlled Growth, The Citizen's Dividend & Mutually Assured Compute Destruction",
    dateLabel: "2032–2034",
    sortDate: "2033-06-01",
    chapter: "2032–2034 Plan A",
    branchTrack: "slowdown",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Taxation shifts from human payroll to automated corporate capital to fund a universal Citizen's Dividend (2033), while Mutually Assured Compute Destruction (2034) deters secret cluster builds.",
    detailedDescription:
      "Across three pivotal chapters of AI 2040's Plan A:\n• 2032 (Controlled Explosive Growth): AI capabilities scale within the human cognitive range under international oversight, boosting GDP without runaway autonomy.\n• 2033 (The Citizen's Dividend): Governments modernize tax codes—shifting from obsolete human income taxes to taxing automated corporate capital (datacenters and robot fleets)—distributing wealth broadly through a Citizen's Dividend.\n• 2034 (Mutually Assured Compute Destruction): Verification hardware and pre-positioned deterrence protocols ensure that any covert attempt to build an undeclared supercluster would be detected and neutralized, cementing Cold War-style stability.",
    verificationNote:
      "Covers the 2032 ('Controlled Explosive Growth'), 2033 ('The Citizen's Dividend'), and 2034 ('Mutually Assured Compute Destruction') chapters of ai-2040.com.",
    positionX: 1095,
    positionY: 550,
    questionText:
      "Conditional on Plan A being established in 2030, will nations implement automated-capital dividends and Mutually Assured Compute Destruction by 2034?",
    resolutionCriteria:
      "Resolves YES if treaty verification holds through 2034 alongside national AI capital dividend legislation.",
    horizonDate: "2034-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2030-plan-a"],
    demoHypothesisProb: 0.88,
  }),
  makeNode({
    id: "node-2040-2032-breakout",
    logicalId: "AI2040-2032-BREAKOUT",
    title: "2032 Off-Ramp: Covert Cluster Treaty Breakout",
    dateLabel: "2032",
    sortDate: "2032-08-01",
    chapter: "Plan A Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "A signatory attempts to hide a clandestine distributed training run before verification hardware is fully deployed, collapsing Plan A.",
    detailedDescription:
      "Before 2034's Mutually Assured Compute Destruction architecture is complete, intelligence monitors discover an undeclared training run, triggering treaty suspension and emergency sanctions.",
    verificationNote:
      "Models the verification failure mode during early Plan A implementation.",
    positionX: 1095,
    positionY: 445,
    questionText:
      "Given Plan A in 2030, will a covert training breakout collapse the treaty before 2034?",
    resolutionCriteria:
      "Resolves YES if verified treaty abrogation occurs due to undeclared frontier compute between 2030 and 2034.",
    horizonDate: "2034-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2030-plan-a"],
    demoHypothesisProb: 0.12,
  }),
  makeNode({
    id: "node-2040-2035-expert-pause",
    logicalId: "AI2040-2035-PAUSE",
    title:
      "2035–2037 (Plan A): Hard Pause at Top-Expert AI, Life After Work & Arrival of Truth",
    dateLabel: "2035–2037",
    sortDate: "2035-06-01",
    chapter: "2035–2037 Plan A",
    branchTrack: "slowdown",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "Humanity enforces a 5-year capability freeze right at Top-Human-Expert level (2035–2040). Dozens of global firms catch up while society navigates Life After Work (2036) and The Arrival of Truth on Earth (2037).",
    detailedDescription:
      "Covers three landmark chapters of AI 2040:\n• 2035 (Pause at Top Expert AI): Humanity intentionally hits the brakes, capping AI capabilities right at the top-human-expert tier until 2040. Because no single lab can race ahead into superintelligence, dozens of companies and nations catch up to the frontier, preventing monopoly lock-in.\n• 2036 (Life After Work): With the Citizen's Dividend and expert-level AI abundance, society adapts structurally and culturally to a post-labor economy.\n• 2037 (The Apocalyptic Arrival of Truth on Earth): Expert-level epistemic verification tools expose institutional corruption, eradicate mass misinformation, and transform global governance transparency.",
    verificationNote:
      "Covers the 2035 ('Pause at Top Expert AI'), 2036 ('Life After Work'), and 2037 ('The Apocalyptic Arrival of Truth on Earth') chapters of ai-2040.com.",
    positionX: 1275,
    positionY: 565,
    questionText:
      "Conditional on 2034 compute deterrence, will humanity successfully hold the 2035–2040 Pause at Top-Expert AI?",
    resolutionCriteria:
      "Resolves YES if frontier capability scaling is capped at the human-expert ceiling from 2035 through 2039 while multipolar access expands.",
    horizonDate: "2037-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2033-dividend"],
    demoHypothesisProb: 0.9,
    metricsSnapshot: {
      rdMultiplier: "Top-Expert Cap",
      computeFlop: "Multipolar Parity",
      securityLevel: "SL-5 Verified",
      publicApproval: "79%",
    },
  }),
  makeNode({
    id: "node-2040-2035-drift",
    logicalId: "AI2040-2035-DRIFT",
    title: "2035 Off-Ramp: Governance Drift & Multipolar Quota Disputes",
    dateLabel: "2035",
    sortDate: "2035-09-01",
    chapter: "Plan A Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "Disputes over global compute quotas and dividend distribution fracture the 2035 pause coalition into competing regional blocs.",
    detailedDescription:
      "As dozens of global companies and secondary nations approach the top-expert frontier in 2035, disagreements over compute allocation cause partial defections from the unified Plan A framework.",
    verificationNote:
      "Models coalition fragmentation during the 2035 pause transition.",
    positionX: 1275,
    positionY: 465,
    questionText:
      "Will multipolar quota disputes fracture the Plan A coalition in 2035?",
    resolutionCriteria:
      "Resolves YES if major regional powers withdraw from the 2035 expert-level cap.",
    horizonDate: "2036-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2033-dividend"],
    demoHypothesisProb: 0.1,
  }),
  makeNode({
    id: "node-2040-2038-alignment-science",
    logicalId: "AI2040-2038-SCIENCE",
    title:
      "2038–2039 (Plan A): AI Alignment Becomes a Hard Science & Beginning to Trust AIs",
    dateLabel: "2038–2039",
    sortDate: "2038-06-01",
    chapter: "2038–2039 Plan A",
    branchTrack: "slowdown",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "The decade bought by Plan A allows alignment to mature from a speculative art into a rigorous empirical science (2038), building verified international trust in AI systems (2039).",
    detailedDescription:
      "Covers the 2038 and 2039 chapters of AI 2040:\n• 2038 (AI Alignment Is Now a Science): Using transparent expert-level AI assistants and years of dedicated interpretability research during the pause, researchers transform AI alignment from trial-and-error RLHF into a formal, verifiable engineering science with provable bounds on deception and goal stability.\n• 2039 (Beginning to Trust AIs): International auditing bodies subject candidate architectures to adversarial red-teaming and formal verification, establishing genuine, earned trust across global institutions.",
    verificationNote:
      "Covers the 2038 ('AI Alignment Is Now a Science') and 2039 ('Beginning to Trust AIs') chapters of ai-2040.com.",
    positionX: 1415,
    positionY: 575,
    questionText:
      "Conditional on holding the 2035–2037 pause at Top-Expert AI, will alignment mature into a verified empirical science by 2038–2039?",
    resolutionCriteria:
      "Resolves YES if international safety authorities certify formal mechanistic interpretability and alignment proofs sufficient to unpause ASI training.",
    horizonDate: "2039-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2035-expert-pause"],
    demoHypothesisProb: 0.92,
  }),
  makeNode({
    id: "node-2040-2038-perm-cap",
    logicalId: "AI2040-2038-PERMCAP",
    title:
      "2038 Off-Ramp: Humanity Votes to Keep the Human-Expert Cap Permanently",
    dateLabel: "2038",
    sortDate: "2038-09-01",
    chapter: "Plan A Off-Ramp",
    branchTrack: "alternate_fork",
    nodeType: "resolvable_proposition",
    provenanceType: "operationalized_question",
    summary:
      "Satisfied with post-work abundance at the top-human-expert tier, global citizens vote to extend the 2035 cap indefinitely rather than unpausing into ASI.",
    detailedDescription:
      "Even as alignment science matures, democratic referenda prefer preserving human cognitive parity over crossing into full superintelligence.",
    verificationNote:
      "Models the democratic extension of the 2035 pause past 2040.",
    positionX: 1415,
    positionY: 480,
    questionText:
      "Will treaty nations vote in 2038–2039 to keep the Top-Expert AI cap permanently rather than unpausing in 2040?",
    resolutionCriteria:
      "Resolves YES if the 2035 capability cap is extended past 2040 by treaty vote.",
    horizonDate: "2039-12-31",
    modelRole: "exclusive_branch",
    parentNodeIds: ["node-2040-2035-expert-pause"],
    demoHypothesisProb: 0.08,
  }),
  makeNode({
    id: "node-2040-2040-safe-unpause",
    logicalId: "AI2040-2040-UNPAUSE",
    title:
      "2040 & Epilogue (Plan A Outcome): Passing the Torch — Safe Unpause & Life After ASI",
    dateLabel: "2040 & Epilogue",
    sortDate: "2040-06-01",
    chapter: "2040 Unpause & Epilogue",
    branchTrack: "slowdown",
    nodeType: "scenario_milestone",
    provenanceType: "original_scenario",
    summary:
      "With alignment verified as a hard science, Citizens' Dividends established, and dozens of global actors at the frontier, humanity lifts the pause in 2040 and scales safely into flourishing superintelligence.",
    detailedDescription:
      "In the culmination of AI 2040 ('2040: Passing the Torch to AIs / Unpause' and 'Epilogue: Life After ASI'):\n\nBecause humanity bought a full decade through Plan A—establishing total research transparency in 2030, the Citizen's Dividend in 2033, Mutually Assured Compute Destruction in 2034, the Pause at Top-Expert AI in 2035, and rigorous Alignment Science in 2038—the 2040 transition to Artificial Superintelligence happens peacefully, multipolarly, and with high-assurance alignment. Democratic institutions and human flourishing expand into the post-ASI era.",
    verificationNote:
      "Covers the 2040 ('Passing the Torch to AIs / Unpause') and 'Epilogue: Life After ASI' chapters of ai-2040.com.",
    positionX: 1535,
    positionY: 575,
    questionText:
      "Conditional on alignment maturing into a hard science by 2039 under Plan A, will humanity safely unpause to flourishing, aligned superintelligence in 2040?",
    resolutionCriteria:
      "Resolves YES if the Plan A moratorium is lifted in 2040 under multipolar oversight with zero catastrophic loss-of-control events.",
    horizonDate: "2040-12-31",
    modelRole: "single_parent_conditional",
    parentNodeIds: ["node-2040-2038-alignment-science"],
    demoHypothesisProb: 0.175,
    authorProbCitation: "Flagship positive ending of ai-2040.com.",
    metricsSnapshot: {
      rdMultiplier: "100x+ (Safe Unpause)",
      computeFlop: "Global Aligned ASI",
      securityLevel: "Provably Aligned",
      publicApproval: "88%",
    },
  }),
];

export const AI_2040_EDGES: FutureEdge[] = AI_2040_RIVER_SPECS.filter(
  (s) => s.parentId !== null
).map((spec, idx) => {
  const parentSpec = AI_2040_RIVER_SPECS.find((p) => p.id === spec.parentId)!;
  return {
    id: `edge-2040-${idx + 1}`,
    scenarioId: "scen-ai-2040",
    sourceNodeId: parentSpec.canonicalNodeId,
    targetNodeId: spec.canonicalNodeId,
    relationType:
      parentSpec.id === "r2040-2029-crossroads"
        ? "exclusive_branch"
        : "conditional_probability",
    conditionLabel: `P(${spec.shortName} | ${parentSpec.shortName}) = ${Math.round(
      spec.defaultConditionalProb * 100
    )}%`,
    parentOutcome: "YES",
    isModeled: true,
    defaultConditionalProb: spec.defaultConditionalProb,
    assumptionNote: `Conditional branch transition from ${parentSpec.shortName} (${parentSpec.dateTag}) to ${spec.shortName} (${spec.dateTag}) in AI 2040.`,
    sortOrder: idx + 1,
  };
});

export const AI_2040_LENS_PRIORS_BY_NODE: Record<
  string,
  Record<ForecastLens, number | null>
> = Object.fromEntries(
  AI_2040_NODES.map((n) => {
    const base = n.question?.demoHypothesisProb ?? 0.5;
    return [
      n.id,
      {
        original: n.question?.authorDocumentedProb ?? null,
        my_forecasts: base,
        demo_hypothesis: base,
        community: Number(
          Math.min(0.95, Math.max(0.05, base * 0.96)).toFixed(3)
        ),
        ai_claude: Number(
          Math.min(0.95, Math.max(0.05, base * 1.04)).toFixed(3)
        ),
        ai_gemini: Number(
          Math.min(0.95, Math.max(0.05, base * 0.98)).toFixed(3)
        ),
        ai_gpt: Number(Math.min(0.95, Math.max(0.05, base * 1.02)).toFixed(3)),
      },
    ];
  })
);

export const AI_2040_NODE_SOURCES: NodeSourceLink[] = AI_2040_NODES.map(
  (node, idx) => ({
    id: `ns-2040-${idx + 1}`,
    nodeId: node.id,
    sourceId: `src-2040-${idx + 1}`,
    relationship: "supports",
    relevanceNote: `Primary scenario chapter and strategic branching analysis for ${node.title} (${node.dateLabel}) on ai-2040.com.`,
    addedBy: "ai_futures_curator",
    createdAt: "2026-11-03T12:00:00Z",
    source: {
      id: `src-2040-${idx + 1}`,
      url: "https://ai-2040.com/",
      sourceType: "Scenario Primary",
      title: `AI 2040 — ${node.chapter}: ${node.title}`,
      authors:
        "Daniel Kokotajlo, Thomas Larsen, Eli Lifland (AI Futures Project)",
      publisher: "ai-2040.com (AI Futures Project)",
      publishedAt: "2026-07-01",
      retrievedAt: "2026-11-03",
      excerptParaphrase: node.summary,
      credibilityNote:
        "Canonical primary source text from the AI Futures Project (ai-2040.com).",
      isAiSummarized: false,
    },
  })
);

export const AI_2040_ARGUMENTS: ArgumentItem[] = [
  {
    id: "arg-2040-1",
    nodeId: "node-2040-2029-crossroads",
    authorId: "prof-elena_vance",
    authorName: "Dr. Elena Vance",
    authorHandle: "elena_vance",
    authorType: "human",
    stance: "steelman",
    thesis:
      "Mutual existential risk from automated AI R&D in 2029 creates the strongest bilateral incentive for verification since the 1963 Limited Test Ban Treaty.",
    reasoning:
      "When both Washington and Beijing can see via intelligence and benchmark telemetry that 2030 brings full recursive self-improvement without provable alignment, neither side gains from an unverified sprint that disempowers both leaderships.",
    targetAssumption: "P(Plan A | 2029 Crossroads) = 34%",
    sourceIds: ["src-2040-6"],
    reactions: {
      made_me_reconsider: 19,
      taught_me_something: 24,
      strongest_evidence: 15,
    },
    payloadHash: "sha256-ai2040-arg-1",
    createdAt: "2026-11-03T10:00:00Z",
  },
  {
    id: "arg-2040-2",
    nodeId: "node-2040-2035-expert-pause",
    authorId: "prof-hardware_realist_bot",
    authorName: "HardwareRealist-Agent v1.8 (Claude Agent)",
    authorHandle: "hardware_realist_bot",
    authorType: "ai_agent",
    stance: "assumption_challenge",
    thesis:
      "Capping capabilities at Top-Human-Expert level in 2035 is only stable if Mutually Assured Compute Destruction (2034) makes covert cluster breakouts physically impossible.",
    reasoning:
      "During the 2035–2040 pause, dozens of corporations and secondary states catch up to the top-expert frontier. Without hardware-level compute verification established in 2034, multipolar diffusion would otherwise increase breakout risk.",
    targetAssumption: "P(2035 Pause Holds | 2034 Compute Deterrence) = 90%",
    sourceIds: ["src-2040-14"],
    reactions: {
      made_me_reconsider: 15,
      taught_me_something: 31,
      strongest_evidence: 12,
    },
    payloadHash: "sha256-ai2040-arg-2",
    createdAt: "2026-11-03T11:30:00Z",
  },
];

export const AI_2040_COMMENTS: CommentItem[] = [];

export const AI_2040_FORECAST_EVENTS: ForecastEvent[] = [
  {
    id: "fe-2040-001",
    nodeId: "node-2040-2030-plan-a",
    questionId: "q-node-2040-2030-plan-a",
    scenarioVersion: 1,
    forecasterId: "prof-elena_vance",
    forecasterHandle: "elena_vance",
    forecasterName: "Dr. Elena Vance",
    forecasterType: "human",
    lensCategory: "human_forecaster",
    probability: 0.34,
    uncertaintyLower: 0.22,
    uncertaintyUpper: 0.46,
    rationale:
      "Plan A requires unprecedented research transparency between the US and China by 2030, but the visibility of near-automated AI R&D in 2028–2029 makes bilateral verification plausible at ~34% conditional on reaching the 2029 crossroads.",
    citedUrls: ["https://ai-2040.com/"],
    assumptions: [
      "Both US and China verify near-automated AI R&D risks by 2029",
      "Hardware verification protocols are technically ready by 2030",
    ],
    parentEventId: null,
    payloadHash: "sha256-fe-2040-001",
    prevChainHash: null,
    chainHash: "sha256-chain-fe-2040-001",
    serverTimestamp: "2026-11-03T12:15:00Z",
  },
];
