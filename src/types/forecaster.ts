export type RegisteredGraphId =
  | "ai-2027"
  | "ai-2040"
  | "ai-2050-simple"
  | "ai-2050-comprehensive"
  | "nature-of-reality"
  | "lev"
  | (string & {});

export type GraphTopologyKind =
  | "river_tree"
  | "sankey_flow"
  | "trajectory_quantiles";

export type CrowdEnsembleMode = "all_ensemble" | "humans_markets" | "agents_only";

export type ActiveLensMode =
  | "default_creator"
  | "crowd_wisdom"
  | "individual_actor";

export interface PriorAxisScore {
  id:
    | "compute_scaling"
    | "alignment_tractability"
    | "institutional_coordination"
    | "biotech_longevity_velocity"
    | "post_physical_simulation";
  label: string;
  shortLabel: string;
  /** Score from 0 (strong skeptic/conservative) to 100 (strong optimist/high credence) */
  score: number;
  lowLabel: string;
  highLabel: string;
}

export interface WorldviewGroundingLink {
  title: string;
  publisher?: string;
  url: string;
}

export interface WorldviewCard {
  /** 1-2 sentence concise worldview thesis shown on the surface */
  coreThesis: string;
  /** Short badge indicating model or human status (e.g. "Claude Sonnet 4.6", "Gemini 3.1 Pro", "Human Creator") */
  modelBadge: string;
  /** Hex accent color for badges and curves */
  accentColor: string;
  /** 5 compact epistemic prior axes */
  priorAxes: PriorAxisScore[];
  /** Explicit load-bearing axioms (1 click away in details/drawer) */
  explicitAxioms: string[];
  /** Primary papers, markets, or essays tuning this worldview */
  groundingLinks: WorldviewGroundingLink[];
  /** Exact system prompt / instructions used to elicit or tune this agent */
  systemPrompt: string;
  /** Handle of parent agent if forked */
  forkedFromHandle?: string | null;
}

export interface ForecasterActor {
  id: string;
  handle: string;
  displayName: string;
  shortBadge: string;
  actorType: "human" | "ai_agent" | "market_baseline";
  roleLabel: string;
  avatarInitials: string;
  /** Verified actors contribute to global Crowd Wisdom; unverified user submissions appear in Community Sandbox */
  isVerifiedEnsemble: boolean;
  /** Marks canonical creator / default authors */
  isCreatorBaseline?: boolean;
  provider?: string;
  modelFamily?: string;
  modelVersion?: string;
  ownerHandle?: string;
  createdAt: string;
  worldview: WorldviewCard;
}

export interface ForkRationaleEntry {
  rationale: string;
  keyAssumption?: string;
}

export interface LevActorForecast {
  /** 99th-percentile (Top 1% protocol optimizer) LEV intercept calendar year (decimal, e.g. 2036.8) */
  p99Year: number;
  /** 25th percentile fast-bound for 99th-percentile cohort */
  p99Low: number;
  /** 75th percentile slow-bound for 99th-percentile cohort */
  p99High: number;
  /** 80th-percentile (Top 20% proactive health) LEV intercept year */
  p80Year: number;
  /** 50th-percentile (Status Quo population) LEV intercept year */
  p50Year: number;
  /** Assumed 2026 baseline intrinsic Pace of Aging for 99th percentile (yr/yr) */
  intrinsicPoAP99: number;
  /** Relative biotech rejuvenation S-curve multiplier (1.0 = LEVL baseline, >1 = faster, <1 = slower) */
  velocityMultiplier: number;
  /** Concise causal rationale for this longevity trajectory */
  mechanismSummary: string;
  /** Key biological / clinical load-bearing assumption */
  keyAssumption?: string;
}

export interface GraphForecastRun {
  id: string;
  graphId: RegisteredGraphId;
  actorHandle: string;
  actorDisplayName: string;
  actorType: ForecasterActor["actorType"];
  /** Root / Column-0 priors where applicable (e.g. Nature of Reality Column 0 summing to 1.0) */
  rootPriors?: Record<string, number>;
  /**
   * Conditional split probabilities summing to 1.0 per parent fork:
   * - For river_tree graphs: keyed by child river node ID (e.g. "river-race-1-continue": 0.52)
   * - For sankey_flow graphs: keyed by "${sourceId}->${targetId}" (e.g. "nor-c0-multiverse->nor-c1-eternal-inflation": 0.58)
   */
  conditionalSplits: Record<string, number>;
  /** Per-fork or per-node 1-2 sentence rationale & key assumption */
  forkRationales: Record<string, ForkRationaleEntry>;
  /** Structured LEV trajectory parameters when graphId === "lev" */
  levForecast?: LevActorForecast;
  /** Top-level 1-sentence summary of what this run predicts on this graph */
  headlineSummary: string;
  receiptId?: string;
  submittedAt: string;
}

export interface ConditionalForkOptionSpec {
  /** Split key used in conditionalSplits (child node ID for river_tree, "source->target" for sankey_flow) */
  splitKey: string;
  targetNodeId: string;
  canonicalNodeId?: string;
  label: string;
  dateOrEpochTag?: string;
  defaultConditionalProb: number;
}

export interface ConditionalForkGroupSpec {
  forkId: string;
  parentNodeId: string | null;
  parentCanonicalNodeId?: string;
  forkTitle: string;
  forkQuestion: string;
  epochOrDateLabel: string;
  /** True when this group represents root priors (e.g. Column 0 of Nature of Reality) */
  isRootPartition?: boolean;
  options: ConditionalForkOptionSpec[];
}

export interface RegisteredGraphNodeMeta {
  id: string;
  canonicalNodeId?: string;
  label: string;
  epochOrDateLabel: string;
  isTerminalOutcome: boolean;
}

export interface RegisteredGraphSpec {
  graphId: RegisteredGraphId;
  slug: string;
  routeHref: string;
  title: string;
  shortTitle: string;
  domainBadge: string;
  accentColor: string;
  topologyKind: GraphTopologyKind;
  defaultBaselineLabel: string;
  defaultCreatorHandle?: string;
  description: string;
  forks: ConditionalForkGroupSpec[];
  nodes: RegisteredGraphNodeMeta[];
}

export interface NodeVarianceDelta {
  nodeId: string;
  canonicalNodeId?: string;
  label: string;
  epochOrDateLabel: string;
  isTerminalOutcome: boolean;
  actorProb: number;
  crowdProb: number;
  /** Signed difference: actorProb - crowdProb */
  signedDelta: number;
  absDelta: number;
  rationale?: string;
  keyAssumption?: string;
}

export interface GraphVarianceReport {
  graphId: RegisteredGraphId;
  actorHandle: string;
  crowdMode: CrowdEnsembleMode;
  meanAbsDivergence: number;
  maxAbsDivergence: number;
  /** Ranked by absDelta descending */
  rankedDivergences: NodeVarianceDelta[];
  /** Lookup map by nodeId (and canonicalNodeId where present) */
  byNodeId: Record<string, NodeVarianceDelta>;
  /** LEV-specific year variance when graphId === "lev" */
  levVariance?: {
    actorP99Year: number;
    crowdP99Year: number;
    /** Signed year delta: actorP99Year - crowdP99Year (negative = earlier LEV than crowd) */
    p99YearDelta: number;
    actorP80Year: number;
    crowdP80Year: number;
    p80YearDelta: number;
    actorP50Year: number;
    crowdP50Year: number;
    p50YearDelta: number;
    actorPoAP99: number;
    crowdPoAP99: number;
    mechanismSummary: string;
  };
}
