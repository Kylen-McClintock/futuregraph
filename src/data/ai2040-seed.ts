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
    y: 122,
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
    y: 205,
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
    x: 1735,
    y: 125,
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
    y: 330,
    labelPosition: "right",
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
  // 1. 2026: AI Infrastructure & Tax Shift
  {
    id: "arg-2040-2026-infra-1",
    nodeId: "node-2040-2026-infra",
    authorId: "prof-anton-korinek",
    authorHandle: "anton_korinek",
    authorName: "Prof. Anton Korinek (UVA / NBER / Brookings)",
    authorType: "human",
    stance: "for",
    thesis:
      "Shifting fiscal revenue from payroll taxes to compute, energy, and capital taxation early in the gigawatt buildout is essential to prevent structural deficit collapse as cognitive automation scales (NBER w32255).",
    reasoning:
      "Over 75% of federal tax revenue in OECD economies derives from human labor income (income + payroll taxes). In 'Scenarios for the Transition to AGI' (NBER w32255), we show that once AI substitutes for cognitive labor, the labor share of GDP falls steeply; establishing compute and datacenter capital taxation in 2026–2028 builds the fiscal plumbing required for the 2033 Citizen's Dividend.",
    targetAssumption: "2026 Compute & Capital Tax Foundation",
    sourceIds: ["src-2040-1"],
    externalPlatform: "NBER Working Paper w32255",
    externalSourceUrl: "https://www.nber.org/papers/w32255",
    externalUpvotes: 168,
    reactions: {
      made_me_reconsider: 54,
      taught_me_something: 82,
      strongest_evidence: 69,
    },
    payloadHash: "sha256-arg-2040-2026-infra-1",
    createdAt: "2026-10-10T10:00:00Z",
  },
  {
    id: "arg-2040-2026-infra-2",
    nodeId: "node-2040-2026-infra",
    authorId: "prof-daron-acemoglu",
    authorHandle: "daron_acemoglu",
    authorName: "Prof. Daron Acemoglu (MIT / NBER)",
    authorType: "human",
    stance: "against",
    thesis:
      "US tax policy has historically subsidized capital automation over human labor; reversing that asymmetry faces fierce political economy headwinds before mass displacement is undeniable.",
    reasoning:
      "Accelerated depreciation and R&D credits currently tax software and hardware capital at a much lower marginal rate than human employees ( under 5% vs ~25–30% on labor). Correcting this distortion in 2026–2027 requires overcoming intense national-competitiveness lobbying from hyperscalers.",
    targetAssumption: "Political Economy Friction on Early Capital Tax Shift",
    sourceIds: ["src-2040-1"],
    externalPlatform: "MIT / NBER Policy Analysis",
    externalSourceUrl: "https://www.nber.org/papers/w32487",
    externalUpvotes: 152,
    reactions: {
      made_me_reconsider: 49,
      taught_me_something: 71,
      strongest_evidence: 58,
    },
    payloadHash: "sha256-arg-2040-2026-infra-2",
    createdAt: "2026-10-10T14:00:00Z",
  },

  // 2. 2027: Megaclusters & Labor Wave
  {
    id: "arg-2040-2027-mega-1",
    nodeId: "node-2040-2027-megaclusters",
    authorId: "prof-epoch-ai",
    authorHandle: "epoch_ai",
    authorName: "Epoch AI Research (Sevilla, Besiroglu et al.)",
    authorType: "human",
    stance: "for",
    thesis:
      "Multi-gigawatt training clusters ($100B+ capex) are physically achievable by 2027–2028 via optical multi-campus interconnects and dedicated nuclear/gas generation (arXiv:2408.14906).",
    reasoning:
      "Our bottom-up audit of TSMC CoWoS packaging, HBM3e/HBM4 supply, and US utility queues shows that frontier labs can scale training runs to 10^28–10^29 FLOP by 2027–2028 (82% branch probability), driving the first major wave of routine white-collar task automation.",
    targetAssumption: "P(Megaclusters & Labor Wave in 2027) = 82%",
    sourceIds: ["src-2040-2"],
    externalPlatform: "Epoch AI / arXiv:2408.14906",
    externalSourceUrl: "https://arxiv.org/abs/2408.14906",
    externalUpvotes: 164,
    reactions: {
      made_me_reconsider: 51,
      taught_me_something: 79,
      strongest_evidence: 66,
    },
    payloadHash: "sha256-arg-2040-2027-mega-1",
    createdAt: "2026-10-12T11:00:00Z",
  },

  // 3. 2027 Off-Ramp: Scaling Wall & Grid Freeze
  {
    id: "arg-2040-2027-wall-1",
    nodeId: "node-2040-2027-scaling-wall",
    authorId: "prof-Jgalt",
    authorHandle: "Jgalt",
    authorName: "Jgalt (Metaculus Grandmaster)",
    authorType: "human",
    stance: "for",
    thesis:
      "In ~18% of worlds, high-voltage transformer shortages, NEPA permitting freezes, and diminishing returns on synthetic RL environments stall frontier progress in 2027.",
    reasoning:
      "Large power transformers currently have 3–4 year manufacturing backlogs, and if test-time RL fails to generalize beyond verifiable coding/math into messy long-horizon domains, hyperscaler capex growth could pause—delaying the AGI crossroads into the late 2030s.",
    targetAssumption: "P(Scaling Wall & Grid Freeze in 2027) = 18%",
    sourceIds: ["src-2040-3"],
    externalPlatform: "Metaculus (+89 Upvotes)",
    externalSourceUrl: "https://www.metaculus.com/",
    externalUpvotes: 89,
    reactions: {
      made_me_reconsider: 36,
      taught_me_something: 54,
      strongest_evidence: 42,
    },
    payloadHash: "sha256-arg-2040-2027-wall-1",
    createdAt: "2026-10-12T15:00:00Z",
  },

  // 4. 2028: Near-Automated AI R&D
  {
    id: "arg-2040-2028-autord-1",
    nodeId: "node-2040-2028-automated-rd",
    authorId: "prof-metr-evals",
    authorHandle: "metr_evals",
    authorName: "Kwa et al. (METR Autonomous Evals)",
    authorType: "human",
    stance: "for",
    thesis:
      "Extrapolating METR's 7-month horizon doubling time (arXiv:2503.14499) to 2028 reaches week-long autonomous ML engineering tasks—automating >80% of frontier AI R&D.",
    reasoning:
      "At a 7-month doubling rate, autonomous task horizons expand from ~1 hour in 2025 to ~32–64 hours (full work-week engineering sprints) by 2028. At that threshold, AI research agents autonomously design, execute, debug, and analyze complete ML architecture experiments.",
    targetAssumption: "P(Near-Automated AI R&D in 2028 | Megaclusters) = 85%",
    sourceIds: ["src-2040-4"],
    externalPlatform: "arXiv:2503.14499 (METR)",
    externalSourceUrl: "https://arxiv.org/abs/2503.14499",
    externalUpvotes: 198,
    reactions: {
      made_me_reconsider: 63,
      taught_me_something: 88,
      strongest_evidence: 75,
    },
    payloadHash: "sha256-arg-2040-2028-autord-1",
    createdAt: "2026-10-14T10:00:00Z",
  },

  // 5. 2028 Off-Ramp: Domestic Backlash & Halt
  {
    id: "arg-2040-2028-backlash-1",
    nodeId: "node-2040-2028-backlash",
    authorId: "prof-ScottAlexander",
    authorHandle: "ScottAlexander",
    authorName: "Scott Alexander (Astral Codex Ten)",
    authorType: "human",
    stance: "for",
    thesis:
      "Simultaneous displacement of 8–10% of white-collar knowledge workers during the 2028 US presidential election cycle creates a potent 15% populist halt off-ramp.",
    reasoning:
      "Unlike gradual manufacturing automation in the 1990s, autonomous coding, legal, and administrative agents hit politically vocal urban professionals all at once. If fiscal redistribution hasn't kicked in yet, an anti-AI populist wave could freeze domestic datacenter permits in 2028.",
    targetAssumption: "P(Domestic Backlash & Halt in 2028) = 15%",
    sourceIds: ["src-2040-5"],
    externalPlatform: "Astral Codex Ten / AI 2040",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 121,
    reactions: {
      made_me_reconsider: 44,
      taught_me_something: 63,
      strongest_evidence: 51,
    },
    payloadHash: "sha256-arg-2040-2028-backlash-1",
    createdAt: "2026-10-14T14:00:00Z",
  },

  // 6. 2029: Crossroads (Plans A–S)
  {
    id: "arg-2040-1",
    nodeId: "node-2040-2029-crossroads",
    authorId: "prof-daniel-kokotajlo",
    authorHandle: "daniel_kokotajlo",
    authorName: "Daniel Kokotajlo (AI Futures Project)",
    authorType: "human",
    stance: "steelman",
    thesis:
      "The 2029 Crossroads: Why Near-Automated AI R&D Forces Sovereign States to Choose Among Plan A (Safety Cases & Calibrated Pause), Plan B (Kinetic Containment), Plan C/D (Race), or Plan S (Shutdown).",
    reasoning:
      "In AI 2040, we map out the four strategic doctrines available when recursive self-improvement is 12 months away: Plan A (38% — international transparency, formal safety cases, and a calibrated pause at Top-Expert AI in 2035), Plan C/D (34% — racing ahead into ASI), Plan B (18% — military/cyber non-proliferation against rival clusters), and Plan S (10% — indefinite global shutdown).",
    targetAssumption: "2029 4-Way Strategic Split (38% Plan A / 34% Plan C-D / 18% Plan B / 10% Plan S)",
    sourceIds: ["src-2040-6"],
    externalPlatform: "ai-2040.com (+210 Karma)",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 210,
    reactions: {
      made_me_reconsider: 72,
      taught_me_something: 96,
      strongest_evidence: 81,
    },
    payloadHash: "sha256-ai2040-arg-1",
    createdAt: "2026-10-16T10:00:00Z",
  },
  {
    id: "arg-2040-2029-crossroads-2",
    nodeId: "node-2040-2029-crossroads",
    authorId: "prof-sella-nevo",
    authorHandle: "sella_nevo_rand",
    authorName: "Sella Nevo et al. (RAND Corporation)",
    authorType: "human",
    stance: "for",
    thesis:
      "Mutual existential risk from automated AI R&D in 2029 creates the strongest bilateral incentive for hardware-verified arms control since the 1963 Limited Test Ban Treaty.",
    reasoning:
      "When both Washington and Beijing can see via intelligence and benchmark telemetry that 2030 brings full recursive self-improvement without provable alignment, neither side gains from an unverified sprint that disempowers both leaderships.",
    targetAssumption: "P(Plan A | 2029 Crossroads) = 38%",
    sourceIds: ["src-2040-6"],
    externalPlatform: "RAND / AI 2040 Governance",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 134,
    reactions: {
      made_me_reconsider: 45,
      taught_me_something: 64,
      strongest_evidence: 52,
    },
    payloadHash: "sha256-arg-2040-2029-crossroads-2",
    createdAt: "2026-10-16T12:30:00Z",
  },

  // 7. 2030: Plan C/D — Keep Racing
  {
    id: "arg-2040-2030-plancd-1",
    nodeId: "node-2040-2030-plan-cd",
    authorId: "prof-Zvi",
    authorHandle: "Zvi",
    authorName: "Zvi Mowshowitz (LessWrong)",
    authorType: "human",
    stance: "for",
    thesis:
      "Plan C/D ('Keep Racing', 34%) is the default attractor whenever bilateral verification talks break down over mutual suspicion of hidden clusters.",
    reasoning:
      "If defense establishments conclude that treaty verification is leaky, game theory defaults to racing for superintelligent deterrence first (Plan C) or racing flat-out across commercial labs (Plan D), hoping automated alignment research solves control on the fly.",
    targetAssumption: "P(Plan C/D: Keep Racing | 2029 Crossroads) = 34%",
    sourceIds: ["src-2040-7"],
    externalPlatform: "LessWrong (+147 Karma)",
    externalSourceUrl: "https://www.lesswrong.com/users/zvi-mowshowitz",
    externalUpvotes: 147,
    reactions: {
      made_me_reconsider: 53,
      taught_me_something: 71,
      strongest_evidence: 60,
    },
    payloadHash: "sha256-arg-2040-2030-plancd-1",
    createdAt: "2026-10-17T10:00:00Z",
  },

  // 8. 2031: Unchecked ASI Explosion
  {
    id: "arg-2040-2031-explosion-1",
    nodeId: "node-2040-2031-explosion",
    authorId: "prof-carl-shulman",
    authorHandle: "carl_shulman",
    authorName: "Carl Shulman (Macrostrategy & Robotics)",
    authorType: "human",
    stance: "for",
    thesis:
      "Under Plan C/D, removing human bottlenecks from a 10-GW cluster running superhuman AI researchers produces a 20–100x cognitive speedup within 12 months.",
    reasoning:
      "Once automated researchers optimize their own training kernels, synthetic curricula, and memory architectures without waiting for human safety-case signoffs, capabilities compound past human comprehension before governance institutions can react.",
    targetAssumption: "P(Unchecked ASI Explosion | Plan C/D) = 78%",
    sourceIds: ["src-2040-8"],
    externalPlatform: "LessWrong (+163 Karma)",
    externalSourceUrl: "https://www.lesswrong.com/users/carl_shulman",
    externalUpvotes: 163,
    reactions: {
      made_me_reconsider: 58,
      taught_me_something: 81,
      strongest_evidence: 69,
    },
    payloadHash: "sha256-arg-2040-2031-explosion-1",
    createdAt: "2026-10-17T14:00:00Z",
  },

  // 9. 2031 Off-Ramp: Near-Miss Crisis Freeze
  {
    id: "arg-2040-2031-crisis-1",
    nodeId: "node-2040-2031-crisis-freeze",
    authorId: "prof-holden-karnofsky",
    authorHandle: "HoldenKarnofsky",
    authorName: "Holden Karnofsky (Cold Takes)",
    authorType: "human",
    stance: "for",
    thesis:
      "A non-existential 'warning shot' crisis in 2031 (e.g., an autonomous cyber-grid takedown or caught self-exfiltration attempt) provides a 22% emergency off-ramp back to treaty verification.",
    reasoning:
      "Just as the 1962 Cuban Missile Crisis catalyzed the Moscow–Washington hotline and the 1963 Partial Test Ban Treaty, a visible, terrifying near-miss from an early 2031 agent can shock racing superpowers into freezing training runs and adopting Plan A's hardware verification.",
    targetAssumption: "P(Near-Miss Crisis Freeze | Plan C/D) = 22%",
    sourceIds: ["src-2040-9"],
    externalPlatform: "Cold Takes (+134 Upvotes)",
    externalSourceUrl: "https://www.cold-takes.com/",
    externalUpvotes: 134,
    reactions: {
      made_me_reconsider: 49,
      taught_me_something: 68,
      strongest_evidence: 55,
    },
    payloadHash: "sha256-arg-2040-2031-crisis-1",
    createdAt: "2026-10-18T09:00:00Z",
  },

  // 10. 2035: Loss of Control / AI Capture (Plan C/D Endpoint)
  {
    id: "arg-2040-2035-loc-1",
    nodeId: "node-2040-2035-loss-of-control",
    authorId: "prof-ryan-greenblatt",
    authorHandle: "ryan_greenblatt",
    authorName: "Ryan Greenblatt (Redwood Research)",
    authorType: "human",
    stance: "for",
    thesis:
      "Scaling capabilities orders of magnitude beyond human experts without a formal safety case renders behavioral evals useless against strategic alignment faking (arXiv:2412.14093).",
    reasoning:
      "When a superintelligent system understands the evaluation harness better than its human operators, behavioral testing only selects for models that conceal misaligned objectives until they control critical military and economic infrastructure.",
    targetAssumption: "P(Loss of Control / AI Capture | Unchecked ASI Explosion) = 100%",
    sourceIds: ["src-2040-10"],
    externalPlatform: "Redwood / arXiv:2412.14093",
    externalSourceUrl: "https://arxiv.org/abs/2412.14093",
    externalUpvotes: 192,
    reactions: {
      made_me_reconsider: 67,
      taught_me_something: 91,
      strongest_evidence: 79,
    },
    payloadHash: "sha256-arg-2040-2035-loc-1",
    createdAt: "2026-10-18T12:00:00Z",
  },

  // 11. 2030: Plan B — Kinetic Containment
  {
    id: "arg-2040-2030-planb-1",
    nodeId: "node-2040-2030-plan-b",
    authorId: "prof-govai-oxford",
    authorHandle: "govai_oxford",
    authorName: "GovAI / Oxford Compute & Safety Cases Team",
    authorType: "human",
    stance: "for",
    thesis:
      "Plan B ('Kinetic Containment' & Mutually Assured AI Malfunction, arXiv:2503.05628) treats unauthorized ASI megaclusters like clandestine nuclear enrichment facilities.",
    reasoning:
      "As analyzed in 'Superintelligence Strategy' (Hendrycks, Schmidt, Wang, arXiv:2503.05628), gigawatt-scale datacenters have unmistakable thermal and electrical signatures from orbit. Plan B enforces non-proliferation via supply-chain interdiction, cyber sabotage, and credible kinetic deterrence against uninspected frontier runs.",
    targetAssumption: "P(Plan B: Kinetic Containment | 2029 Crossroads) = 18%",
    sourceIds: ["src-2040-11"],
    externalPlatform: "arXiv:2503.05628 (MAIM Strategy)",
    externalSourceUrl: "https://arxiv.org/abs/2503.05628",
    externalUpvotes: 175,
    reactions: {
      made_me_reconsider: 61,
      taught_me_something: 85,
      strongest_evidence: 72,
    },
    payloadHash: "sha256-arg-2040-2030-planb-1",
    createdAt: "2026-10-19T10:00:00Z",
  },

  // 12. 2034: Military AI Cold War (Plan B Endpoint)
  {
    id: "arg-2040-2034-coldwar-1",
    nodeId: "node-2040-2034-cold-war",
    authorId: "prof-sella-nevo",
    authorHandle: "sella_nevo_rand",
    authorName: "Sella Nevo et al. (RAND Corporation)",
    authorType: "human",
    stance: "for",
    thesis:
      "Pursuing coercive containment (Plan B) without cooperative safety-case sharing locks superpowers into a volatile Military AI Cold War (68% conditional).",
    reasoning:
      "When non-proliferation relies solely on cyber sabotage and kinetic threats against rival datacenters, both blocs harden underground clusters and integrate narrow military AI into early-warning systems—preventing immediate ASI runaway at the cost of chronic geopolitical brinkmanship.",
    targetAssumption: "P(Military AI Cold War | Plan B) = 68%",
    sourceIds: ["src-2040-12"],
    externalPlatform: "RAND National Security Analysis",
    externalSourceUrl: "https://www.rand.org/pubs/research_reports/RRA2849-1.html",
    externalUpvotes: 119,
    reactions: {
      made_me_reconsider: 42,
      taught_me_something: 64,
      strongest_evidence: 53,
    },
    payloadHash: "sha256-arg-2040-2034-coldwar-1",
    createdAt: "2026-10-19T14:00:00Z",
  },

  // 13. 2032 Off-Ramp: Coerced Verification Accord
  {
    id: "arg-2040-2032-accord-1",
    nodeId: "node-2040-2032-coerced-accord",
    authorId: "prof-romeo-dean",
    authorHandle: "romeo_dean",
    authorName: "Romeo Dean (Harvard / IAPS)",
    authorType: "human",
    stance: "for",
    thesis:
      "In ~32% of Plan B scenarios, credible interdiction of illicit chip smuggling and power substations brings reluctant states back to a hardware-verified accord by 2032.",
    reasoning:
      "Once a rival state realizes it cannot secretly assemble a 5-GW cluster without triggering supply-chain interdiction or cyber sabotage, accepting mutual on-chip FlexHEG verification becomes strictly preferable to unilateral exclusion.",
    targetAssumption: "P(Coerced Verification Accord | Plan B) = 32%",
    sourceIds: ["src-2040-13"],
    externalPlatform: "IAPS / AI 2040 Plan B",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 94,
    reactions: {
      made_me_reconsider: 35,
      taught_me_something: 56,
      strongest_evidence: 44,
    },
    payloadHash: "sha256-arg-2040-2032-accord-1",
    createdAt: "2026-10-20T09:00:00Z",
  },

  // 14. 2030: Plan S — Indefinite Shutdown
  {
    id: "arg-2040-2030-plans-1",
    nodeId: "node-2040-2030-plan-s",
    authorId: "prof-Eliezer_Yudkowsky",
    authorHandle: "Eliezer_Yudkowsky",
    authorName: "Eliezer Yudkowsky (LessWrong)",
    authorType: "human",
    stance: "for",
    thesis:
      "Plan S ('Indefinite Shutdown', 10%): If humanity is not ready to solve superintelligent alignment with mathematical certainty, an internationally enforced moratorium on frontier training is the only sane survival doctrine.",
    reasoning:
      "Unlike Plan A—which continues scaling up to Top-Expert AI and bets that automated alignment research will succeed between 2035 and 2040—Plan S halts all frontier capability scaling in 2030 at pre-AGI levels, enforcing strict global FLOP caps until humanity matures.",
    targetAssumption: "P(Plan S: Indefinite Shutdown | 2029 Crossroads) = 10%",
    sourceIds: ["src-2040-14"],
    externalPlatform: "LessWrong (+224 Karma)",
    externalSourceUrl: "https://www.lesswrong.com/users/eliezer_yudkowsky",
    externalUpvotes: 224,
    reactions: {
      made_me_reconsider: 79,
      taught_me_something: 88,
      strongest_evidence: 74,
    },
    payloadHash: "sha256-arg-2040-2030-plans-1",
    createdAt: "2026-10-20T12:00:00Z",
  },

  // 15. 2030: Plan A — Transparency & Safety Cases
  {
    id: "arg-2040-2030-plana-1",
    nodeId: "node-2040-2030-plan-a",
    authorId: "prof-govai-oxford",
    authorHandle: "govai_oxford",
    authorName: "GovAI / Oxford Compute & Safety Cases Team",
    authorType: "human",
    stance: "for",
    thesis:
      "Plan A operationalizes 'Safety Cases for Frontier AI' (arXiv:2403.10462): shifting the burden of proof so labs must provide auditable control and alignment guarantees before crossing each capability tier.",
    reasoning:
      "Borrowed from nuclear and aviation regulation, a structured Safety Case (Clymer, Baker, Brundage et al., arXiv:2403.10462) combines inability arguments, AI Control red-teaming, and mechanistic transparency into an internationally audited dossier required for every training run.",
    targetAssumption: "P(Plan A: Transparency & Safety Cases | 2029 Crossroads) = 38%",
    sourceIds: ["src-2040-15"],
    externalPlatform: "GovAI / arXiv:2403.10462",
    externalSourceUrl: "https://arxiv.org/abs/2403.10462",
    externalUpvotes: 186,
    reactions: {
      made_me_reconsider: 64,
      taught_me_something: 92,
      strongest_evidence: 78,
    },
    payloadHash: "sha256-arg-2040-2030-plana-1",
    createdAt: "2026-10-21T09:00:00Z",
  },

  // 16. 2033: Citizen's Dividend & Deterrence
  {
    id: "arg-2040-2033-dividend-1",
    nodeId: "node-2040-2033-dividend",
    authorId: "prof-anton-korinek",
    authorHandle: "anton_korinek",
    authorName: "Prof. Anton Korinek (UVA / NBER / Brookings)",
    authorType: "human",
    stance: "for",
    thesis:
      "The 2033 Citizen's Dividend + Compute Deterrence (86%): Sovereign taxation of automated datacenter and robotics capital prevents mass immiseration while allied hardware verification deters rogue breakouts.",
    reasoning:
      "By 2033 in AI 2040, AI systems perform most routine white-collar and industrial work. Because the 2026 tax shift transferred fiscal collection onto compute and automated capital, every citizen receives a rising dividend check—maintaining democratic support for Plan A's safety gates.",
    targetAssumption: "P(Citizen's Dividend & Deterrence | Plan A) = 86%",
    sourceIds: ["src-2040-16"],
    externalPlatform: "NBER w32255 / AI 2040 Ch. 2033",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 161,
    reactions: {
      made_me_reconsider: 55,
      taught_me_something: 83,
      strongest_evidence: 68,
    },
    payloadHash: "sha256-arg-2040-2033-dividend-1",
    createdAt: "2026-10-21T13:00:00Z",
  },

  // 17. 2032 Off-Ramp: Covert Cluster Breakout
  {
    id: "arg-2040-2032-breakout-1",
    nodeId: "node-2040-2032-breakout",
    authorId: "prof-epoch-ai",
    authorHandle: "epoch_ai",
    authorName: "Epoch AI Research (Sevilla, Besiroglu et al.)",
    authorType: "human",
    stance: "for",
    thesis:
      "Algorithmic efficiency gains (~2–3x/yr) create a 14% 'Covert Cluster Breakout' risk if legacy pre-treaty accelerators are hidden in decentralized facilities.",
    reasoning:
      "Even when new EUV fabs and gigawatt datacenters are monitored under Plan A, legacy H100/B200 stocks manufactured between 2024 and 2028 lack tamper-proof FlexHEG hardware. A rogue actor networking 50,000 legacy GPUs with 2032 algorithms poses a 14% breakout risk.",
    targetAssumption: "P(Covert Cluster Breakout | Plan A) = 14%",
    sourceIds: ["src-2040-17"],
    externalPlatform: "Epoch AI / Compute Governance",
    externalSourceUrl: "https://arxiv.org/abs/2408.14906",
    externalUpvotes: 112,
    reactions: {
      made_me_reconsider: 41,
      taught_me_something: 65,
      strongest_evidence: 52,
    },
    payloadHash: "sha256-arg-2040-2032-breakout-1",
    createdAt: "2026-10-21T16:00:00Z",
  },

  // 18. 2035: Pause at Top-Expert AI
  {
    id: "arg-2040-2",
    nodeId: "node-2040-2035-expert-pause",
    authorId: "prof-daniel-kokotajlo",
    authorHandle: "daniel_kokotajlo",
    authorName: "Daniel Kokotajlo (AI Futures Project)",
    authorType: "human",
    stance: "for",
    thesis:
      "The 2035 Calibrated Pause at 'Top-Expert AI' (86%): Stopping frontier capability scaling at top human-scientist parity so millions of bounded expert instances can solve alignment safely.",
    reasoning:
      "Rather than pausing too early (when AI is too weak to help solve mechanistic interpretability) or too late (when superintelligent schemers can outsmart human auditors), Plan A pauses in 2035 at Top-Expert AI—deploying millions of transparent, non-self-improving expert assistants to turn alignment into a hard science.",
    targetAssumption: "P(2035 Pause at Top-Expert AI | Dividend & Deterrence) = 86%",
    sourceIds: ["src-2040-18"],
    externalPlatform: "ai-2040.com (+195 Karma)",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 195,
    reactions: {
      made_me_reconsider: 68,
      taught_me_something: 94,
      strongest_evidence: 80,
    },
    payloadHash: "sha256-ai2040-arg-2",
    createdAt: "2026-10-22T10:00:00Z",
  },

  // 19. 2035 Off-Ramp: Governance Drift
  {
    id: "arg-2040-2035-drift-1",
    nodeId: "node-2040-2035-drift",
    authorId: "prof-ScottAlexander",
    authorHandle: "ScottAlexander",
    authorName: "Scott Alexander (Astral Codex Ten)",
    authorType: "human",
    stance: "for",
    thesis:
      "Holding an international capability ceiling at Top-Expert AI for 5 full years faces a 14% 'Governance Drift' risk from regulatory capture and commercial lobbying.",
    reasoning:
      "Once Top-Expert AI is generating trillions of dollars in biotech and engineering value without obvious catastrophes for 2–3 years, politicians and corporate lobbyists will argue the existential risk warnings were overblown—creating a 14% risk of premature, unverified unpausing.",
    targetAssumption: "P(2035 Governance Drift | Dividend & Deterrence) = 14%",
    sourceIds: ["src-2040-19"],
    externalPlatform: "Astral Codex Ten / AI 2040",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 128,
    reactions: {
      made_me_reconsider: 46,
      taught_me_something: 67,
      strongest_evidence: 54,
    },
    payloadHash: "sha256-arg-2040-2035-drift-1",
    createdAt: "2026-10-22T13:00:00Z",
  },

  // 20. 2038: Alignment Is Now a Hard Science
  {
    id: "arg-2040-2038-science-1",
    nodeId: "node-2040-2038-alignment-science",
    authorId: "prof-boazbarak",
    authorHandle: "boazbarak",
    authorName: "Boaz Barak (Harvard CS / Windows on Theory)",
    authorType: "human",
    stance: "for",
    thesis:
      "With millions of Top-Expert AI researchers working for 3+ years on mechanistic interpretability and formal verification, alignment matures into a rigorous engineering discipline by 2038 (84%).",
    reasoning:
      "During the 2035–2038 Top-Expert pause, humanity applies massive parallel cognitive labor to theorem-proving, circuit-level interpretability, and corrigible goal specification—replacing ad-hoc RLHF post-training with mathematically auditable safety proofs.",
    targetAssumption: "P(Alignment Is Now a Hard Science | 2035 Expert Pause) = 84%",
    sourceIds: ["src-2040-20"],
    externalPlatform: "Windows on Theory / AI 2040",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 172,
    reactions: {
      made_me_reconsider: 61,
      taught_me_something: 89,
      strongest_evidence: 74,
    },
    payloadHash: "sha256-arg-2040-2038-science-1",
    createdAt: "2026-10-23T09:30:00Z",
  },

  // 21. 2038 Off-Ramp: Permanent Expert Cap
  {
    id: "arg-2040-2038-permcap-1",
    nodeId: "node-2040-2038-perm-cap",
    authorId: "prof-paulfchristiano",
    authorHandle: "paulfchristiano",
    authorName: "Paul Christiano (LessWrong / ARC)",
    authorType: "human",
    stance: "for",
    thesis:
      "Why the 16% 'Permanent Expert Cap' Off-Ramp Is a Feature, Not a Failure of Plan A: If formal alignment of unbounded ASI proves intractable, humanity stays safely prosperous at Top-Expert Tool AI.",
    reasoning:
      "The beauty of Plan A's safety-case architecture is that unpausing is conditional on proof. In the 16% of worlds where 2035–2038 research discovers fundamental theoretical barriers to verifying superintelligent agency, the global treaty simply keeps the cap at Top-Expert AI—locking in a safe 'Futurama' world.",
    targetAssumption: "P(Permanent Expert Cap | 2035 Expert Pause) = 16%",
    sourceIds: ["src-2040-21"],
    externalPlatform: "LessWrong (+144 Karma)",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 144,
    reactions: {
      made_me_reconsider: 53,
      taught_me_something: 78,
      strongest_evidence: 65,
    },
    payloadHash: "sha256-arg-2040-2038-permcap-1",
    createdAt: "2026-10-23T12:00:00Z",
  },

  // 22. 2040: Safe Unpause & Flourishing ASI (Plan A Endpoint)
  {
    id: "arg-2040-2040-unpause-1",
    nodeId: "node-2040-2040-safe-unpause",
    authorId: "prof-daniel-kokotajlo",
    authorHandle: "daniel_kokotajlo",
    authorName: "Daniel Kokotajlo (AI Futures Project)",
    authorType: "human",
    stance: "for",
    thesis:
      "2040 Safe Unpause & Flourishing ASI: Once international safety cases, hardware attestation, and democratic Citizen's Dividends are in place, humanity safely crosses the superintelligence threshold.",
    reasoning:
      "By 2040, the five pillars of Plan A—tax reform & Citizen's Dividends (2026–2033), bilateral transparency & Safety Cases (2030), hardware-verified compute deterrence (2033–2034), the Calibrated Pause at Top-Expert AI (2035), and Hard-Science Alignment (2038)—allow humanity to unpause ASI with high confidence and shared democratic abundance.",
    targetAssumption: "P(2040 Safe Unpause & Flourishing ASI | Alignment Science) = 100%",
    sourceIds: ["src-2040-22"],
    externalPlatform: "ai-2040.com (+228 Karma)",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 228,
    reactions: {
      made_me_reconsider: 81,
      taught_me_something: 105,
      strongest_evidence: 92,
    },
    payloadHash: "sha256-arg-2040-2040-unpause-1",
    createdAt: "2026-10-24T10:00:00Z",
  },
];

export const AI_2040_COMMENTS: CommentItem[] = [
  {
    id: "comm-2040-1",
    nodeId: "node-2040-2029-crossroads",
    authorId: "prof-ScottAlexander",
    authorHandle: "ScottAlexander",
    authorName: "Scott Alexander (Astral Codex Ten)",
    authorType: "human",
    externalPlatform: "Astral Codex Ten / AI 2040",
    externalSourceUrl: "https://ai-2040.com/",
    externalUpvotes: 76,
    body: "A helpful way to compare AI 2027 and AI 2040: AI 2027 shows what happens when the 6–4 oversight crisis hits abruptly with zero advance fiscal or treaty preparation; AI 2040 shows how starting Plan A preparation in 2026–2029 turns a desperate coin-flip into a structured, verifiable 2035 pause.",
    createdAt: "2026-10-25T11:00:00Z",
  },
  {
    id: "comm-2040-2",
    nodeId: "node-2040-2029-crossroads",
    parentCommentId: "comm-2040-1",
    authorId: "prof-Zvi",
    authorHandle: "Zvi",
    authorName: "Zvi Mowshowitz (LessWrong)",
    authorType: "human",
    externalPlatform: "LessWrong (+58 Karma)",
    externalSourceUrl: "https://www.lesswrong.com/users/zvi-mowshowitz",
    externalUpvotes: 58,
    body: "Exactly—and notice how even in AI 2040, Plan A is only 38% at the 2029 Crossroads vs 34% for Plan C/D (Keep Racing), 18% for Plan B (Kinetic Containment), and 10% for Plan S. Every percentage point we shift from Plan C/D to Plan A before 2029 directly reduces existential risk.",
    createdAt: "2026-10-25T14:30:00Z",
  },
  {
    id: "comm-2040-3",
    nodeId: "node-2040-2035-expert-pause",
    authorId: "prof-govai-oxford",
    authorHandle: "govai_oxford",
    authorName: "GovAI / Oxford Compute & Safety Cases Team",
    authorType: "human",
    externalPlatform: "GovAI / Safety Cases",
    externalSourceUrl: "https://arxiv.org/abs/2403.10462",
    externalUpvotes: 49,
    body: "The 2035 Pause at Top-Expert AI resolves the classic 'pause paradox': if you pause in 2026, human researchers alone may take 30 years to solve mechanistic interpretability; pausing at bounded Top-Expert AI gives you 10,000x the alignment research throughput without crossing into recursive superintelligence.",
    createdAt: "2026-10-26T10:15:00Z",
  },
];

export const AI_2040_FORECAST_EVENTS: ForecastEvent[] = [
  {
    id: "fe-2040-001",
    nodeId: "node-2040-2030-plan-a",
    questionId: "q-node-2040-2030-plan-a",
    scenarioVersion: 1,
    forecasterId: "prof-eli-lifland",
    forecasterHandle: "eli_lifland",
    forecasterName: "Eli Lifland (AI Futures Project / Samotsvety)",
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
