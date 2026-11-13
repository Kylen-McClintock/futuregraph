export type ParticipantRole = "visitor" | "user" | "editor" | "admin" | "agent";
export type ParticipantType = "human" | "ai_agent" | "organization";

export type NodeType =
  | "scenario_milestone"
  | "resolvable_proposition"
  | "decision_intervention"
  | "subjective_hypothesis"
  | "derived_statistic";

export type ProvenanceType =
  | "original_scenario"
  | "observed_history"
  | "author_updated"
  | "operationalized_question"
  | "community_alternate"
  | "ai_proposal";

export type BranchTrack =
  | "spine"
  | "race"
  | "slowdown"
  | "operationalized"
  | "alternate_fork";

export type ObservedStatus =
  | "observed_realized"
  | "observed_partially_realized"
  | "contradicted"
  | "future_unresolved"
  | "scenario_world_only"
  | "ambiguous";

export type RelationType =
  | "narrative_sequence"
  | "exclusive_branch"
  | "conditional_probability"
  | "causal_intervention"
  | "qualitative_influence";

export type ProbabilityModelRole =
  | "root"
  | "exclusive_branch"
  | "single_parent_conditional"
  | "multi_parent_cpt"
  | "standalone";

export type ForecastLens =
  | "original"
  | "my_forecasts"
  | "ai_claude"
  | "ai_gpt"
  | "ai_gemini"
  | "community"
  | "demo_hypothesis";

/** The six scored accuracy domains (plus Overall, computed across all of them). */
export type AccuracyCategory =
  | "agi_capabilities"
  | "ai_safety"
  | "governance_geopolitics"
  | "economy_society"
  | "longevity_biotech"
  | "science_frontier";

/** Node-level scoring classification. Metaphysical / unfalsifiable nodes are never scored. */
export type NodeScoringCategory = AccuracyCategory | "unscored_metaphysical";

export type ForecasterTier =
  | "provisional"
  | "developing"
  | "calibrated"
  | "sharp"
  | "superforecaster"
  | "oracle";

export type OracleProvider = "editorial" | "polymarket" | "metaculus";

/** How the forecaster authenticated when locking in a forecast. */
export type ForecastAuthProvider = "x" | "agifutures" | "demo" | "agent_api" | "legacy_seed";

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  role: ParticipantRole;
  participantType: ParticipantType;
  bio: string;
  credentials?: string;
  avatarUrl?: string;
  joinedAt: string;
  /** Supabase auth.users.id shared across AGIFutures.org and FutureGraph (SSO). */
  authUserId?: string;
  /** Verified X identity (proved via X OAuth 2.0, never self-typed). */
  xUserId?: string;
  xHandle?: string;
  xAvatarUrl?: string;
  xVerifiedAt?: string;
  /** True when an AGIFutures.org (email / Google) identity is linked to this profile. */
  agifuturesLinked?: boolean;
  /** Sandbox / demo profile (never presented as a real person's verified record). */
  isSandbox?: boolean;
  agentMetadata?: {
    provider: string;
    modelFamily: string;
    modelVersion: string;
    promptTemplateVersion: string;
    ownerHandle: string;
    isVerifiedProvider: boolean;
    isIndependent: boolean;
  };
}

export interface LinkedOpportunity {
  title: string;
  category: "AGI Futures Blueprint" | "Governance Mechanism" | "Technical Safety";
  description: string;
  url?: string;
}

export interface CPTEntry {
  /** Map of parentNodeId -> "YES" | "NO" | outcomeName */
  parentStates: Record<string, string>;
  /** Conditional probability P(Target = YES | parentStates) in [0, 1] */
  probability: number;
  explanation?: string;
}

export interface ForecastQuestionSpec {
  id: string;
  nodeId: string;
  questionText: string;
  resolutionCriteria: string;
  resolutionSource: string;
  resolutionOwner: string;
  horizonDate: string;
  closeDate: string;
  conditioningDescription?: string;
  exclusiveGroupId?: string;
  isOtherBranch?: boolean;
  modelRole: ProbabilityModelRole;
  /** Parent node IDs for conditional / CPT calculation */
  parentNodeIds: string[];
  /** Explicit Conditional Probability Table for single or multi-parent dependencies */
  cptTable?: CPTEntry[];
  /** Documented original author estimate ONLY where explicitly stated in AI 2027 supplements */
  authorDocumentedProb?: number | null;
  authorProbCitation?: string;
  /** Distinctly labeled hypothetical baseline for probability propagation demo */
  demoHypothesisProb: number;
  resolvedOutcome?: 0 | 1 | null;
  resolvedAt?: string | null;
  disputeStatus: "none" | "open_dispute" | "adjudicated";
  /** When forecasting opened (used for anti-sniping horizon decay). Defaults to the node's authorAsOf date. */
  openedAt?: string;
  /** External resolution oracle configuration (Polymarket / Metaculus), with Editorial fallback. */
  oracleProvider?: OracleProvider;
  oracleExternalId?: string;
  oracleUrl?: string;
  /** For multi-outcome markets: the outcome label that maps to this node resolving YES. */
  oracleOutcomeLabel?: string;
  /** Latest crowd / market probability fetched from the oracle (used as consensus baseline). */
  oracleLastPrice?: number | null;
  oracleLastSyncedAt?: string | null;
  resolutionEvidenceUrl?: string | null;
  resolutionSourceLabel?: string | null;
  /** Synthetic calibration drill used to demonstrate scoring (sandbox resolution, not a real-world event). */
  isSandboxDrill?: boolean;
}

export interface FutureNode {
  id: string;
  scenarioId: string;
  logicalId: string;
  nodeType: NodeType;
  provenanceType: ProvenanceType;
  branchTrack: BranchTrack;
  chapter: string;
  dateLabel: string;
  sortDate: string;
  title: string;
  summary: string;
  detailedDescription: string;
  plainEnglishDefinition: string;
  outcomeSet: string[];
  observedStatus: ObservedStatus;
  verificationNote: string;
  sourceUrl: string;
  sourceSectionAnchor?: string;
  authorAsOf: string;
  currentAsOf: string;
  positionX: number;
  positionY: number;
  linkedOpportunities: LinkedOpportunity[];
  conflictDisclosure?: string;
  metricsSnapshot?: {
    rdMultiplier?: string;
    computeFlop?: string;
    securityLevel?: string;
    publicApproval?: string;
  };
  question?: ForecastQuestionSpec;
  /** Explicit accuracy category; otherwise derived by classifyNodeCategory(). */
  accuracyCategory?: NodeScoringCategory;
}

export interface FutureEdge {
  id: string;
  scenarioId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: RelationType;
  conditionLabel: string;
  parentOutcome: string;
  isModeled: boolean;
  defaultConditionalProb?: number | null;
  assumptionNote: string;
  sortOrder: number;
}

export interface SourceItem {
  id: string;
  url: string;
  sourceType:
    | "Scenario Primary"
    | "Research Supplement"
    | "Academic Paper"
    | "Official Policy / Report"
    | "Video / Podcast"
    | "Forecasting Platform";
  title: string;
  authors: string;
  publisher: string;
  publishedAt: string;
  retrievedAt: string;
  mediaStartSeconds?: number;
  excerptParaphrase: string;
  credibilityNote: string;
  isAiSummarized: boolean;
}

export interface NodeSourceLink {
  id: string;
  nodeId: string;
  sourceId: string;
  relationship: "supports" | "disputes" | "contextualizes" | "changes_definition";
  relevanceNote: string;
  addedBy: string;
  createdAt: string;
  source: SourceItem;
}

export interface ArgumentItem {
  id: string;
  nodeId: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  authorType: ParticipantType;
  stance: "for" | "against" | "assumption_challenge" | "steelman";
  thesis: string;
  reasoning: string;
  targetAssumption?: string;
  sourceIds: string[];
  externalSourceUrl?: string;
  externalPlatform?: string;
  externalUpvotes?: number;
  /** Optional supplemental article, foundational essay, or academic paper backing this argument */
  supplementalUrl?: string;
  supplementalTitle?: string;
  supplementalPublisher?: string;
  reactions: {
    made_me_reconsider: number;
    taught_me_something: number;
    strongest_evidence: number;
  };
  payloadHash: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  nodeId: string;
  argumentId?: string;
  parentCommentId?: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  authorType: ParticipantType;
  externalPlatform?: string;
  externalSourceUrl?: string;
  externalUpvotes?: number;
  supplementalUrl?: string;
  supplementalTitle?: string;
  supplementalPublisher?: string;
  body: string;
  createdAt: string;
}

export interface ForecastEvent {
  id: string;
  nodeId: string;
  questionId?: string;
  scenarioVersion: number;
  forecasterId: string;
  forecasterHandle: string;
  forecasterName: string;
  forecasterType: ParticipantType;
  agentModelVersion?: string;
  agentProvider?: string;
  lensCategory:
    | "original_author"
    | "human_forecaster"
    | "ai_model"
    | "market_quote"
    | "demo_hypothesis";
  probability: number;
  uncertaintyLower?: number;
  uncertaintyUpper?: number;
  conditionalOverrides?: Record<string, number>;
  rationale: string;
  citedUrls: string[];
  assumptions: string[];
  parentEventId?: string | null;
  payloadHash: string;
  prevChainHash?: string | null;
  chainHash: string;
  serverTimestamp: string;
  /** Community / market consensus probability snapshotted at lock-in (sealed in the receipt). */
  crowdProbSnapshot?: number | null;
  /** Conviction wager multiplier in [0.25, 3.0] chosen on the confidence slider. */
  confidenceMultiplier?: number;
  /** Reputation preview shown to the forecaster before lock-in. */
  projectedRpIfYes?: number | null;
  projectedRpIfNo?: number | null;
  accuracyCategory?: NodeScoringCategory;
  authProvider?: ForecastAuthProvider;
}

export interface AuditReceipt {
  eventId: string;
  entityType:
    | "forecast_event"
    | "argument"
    | "branch_proposal"
    | "scenario_fork"
    | "question_resolution"
    | "worldview_snapshot";
  entityId: string;
  contributorId: string;
  contributorHandle: string;
  contributorName: string;
  agentMetadata?: {
    provider: string;
    modelVersion: string;
    promptTemplateVersion: string;
    isIndependent: boolean;
  } | null;
  scenarioVersion: number;
  canonicalPayload: Record<string, unknown>;
  payloadSha256: string;
  prevReceiptHash: string | null;
  chainSha256: string;
  hmacSignature: string;
  serverTimestamp: string;
}

export interface PresentationScene {
  id: string;
  presentationId: string;
  sceneOrder: number;
  headline: string;
  annotation: string;
  narrationNotes: string;
  focusedNodeId: string;
  isolatedBranchTrack?: BranchTrack | "all";
  selectedLens: ForecastLens;
  comparisonLens?: ForecastLens;
  overrideNodeId?: string;
  overrideProbability?: number;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
  durationSeconds: number;
}

export interface Presentation {
  id: string;
  scenarioId: string;
  pinnedScenarioVersion: number;
  authorId: string;
  authorHandle: string;
  title: string;
  subtitle: string;
  aspectRatio: "16:9" | "9:16";
  visibility: "public" | "unlisted" | "private";
  createdAt: string;
  scenes: PresentationScene[];
}

export interface ScenarioFork {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  parentScenarioId: string;
  forkedFromVersion: number;
  ownerId: string;
  ownerHandle: string;
  ownerName: string;
  rationale: string;
  nodeProbabilityOverrides: Record<string, number>;
  addedNodes: Array<{
    id: string;
    parentNodeId: string;
    title: string;
    dateLabel: string;
    summary: string;
    probability: number;
  }>;
  createdAt: string;
  receiptId: string;
}

export interface BranchProposal {
  id: string;
  scenarioId: string;
  parentNodeId: string;
  proposerId: string;
  proposerHandle: string;
  proposalType: "missing_branch" | "evidence_addition" | "question_operationalization";
  proposedTitle: string;
  proposedSummary: string;
  conditionalAssumption: string;
  suggestedProbability?: number;
  sourceUrl?: string;
  status: "pending_review" | "approved" | "rejected";
  reviewerNotes?: string;
  payloadHash: string;
  createdAt: string;
}

export type GovernanceObjectiveId =
  | "physical_safety"
  | "autonomy_freedom"
  | "democratic_accountability"
  | "economic_abundance"
  | "scientific_progress"
  | "global_stability";

export interface GovernanceObjective {
  id: GovernanceObjectiveId;
  label: string;
  shortLabel: string;
  description: string;
  unitDescription: string;
}

export interface PolicyOutcomeEstimate {
  objectiveId: GovernanceObjectiveId;
  /** Expected outcome score on [0, 100] scale under baseline model */
  pointEstimate: number;
  /** Pessimistic / lower bound on [0, 100] scale */
  uncertaintyLow: number;
  /** Optimistic / upper bound on [0, 100] scale */
  uncertaintyHigh: number;
  /** Sensitivity slope to P(Adversarial Misalignment in Agent-4) */
  misalignmentSensitivity: number;
  assumptionSummary: string;
  linkedNodeId: string;
}

export interface PolicyIntervention {
  id: string;
  slug: string;
  title: string;
  shortLabel: string;
  description: string;
  causalModelCaveat: string;
  linkedNodeIds: string[];
  outcomeEstimates: Record<GovernanceObjectiveId, PolicyOutcomeEstimate>;
  isHypothetical: boolean;
}

export interface Scenario {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  authors: string[];
  publishedAt: string;
  authorAsOf: string;
  currentAsOf: string;
  version: number;
  versionLabel: string;
  isOfficial: boolean;
  editorialProvenanceNote: string;
}

export interface ModerationReport {
  id: string;
  targetType: "argument" | "comment" | "branch_proposal" | "evidence";
  targetId: string;
  reporterHandle: string;
  reason: string;
  status: "open" | "resolved_kept" | "resolved_removed";
  createdAt: string;
}

export interface ScenarioDataset {
  scenario: Scenario;
  nodes: FutureNode[];
  edges: FutureEdge[];
  sources: SourceItem[];
  nodeSources: NodeSourceLink[];
  arguments: ArgumentItem[];
  comments: CommentItem[];
  forecastEvents: ForecastEvent[];
  auditReceipts: AuditReceipt[];
  profiles: Profile[];
  presentations: Presentation[];
  forks: ScenarioFork[];
  proposals: BranchProposal[];
  moderationReports: ModerationReport[];
  governanceObjectives: GovernanceObjective[];
  policyInterventions: PolicyIntervention[];
}


// =============================================================================
// REPUTATION, VERIFIED IDENTITY, WORLDVIEWS & RESOLUTION ORACLES
// =============================================================================

/** One immutable settlement row per (resolved question × forecaster). */
export interface ReputationLedgerEntry {
  id: string;
  questionNodeId: string;
  questionTitle: string;
  category: AccuracyCategory;
  forecasterHandle: string;
  forecasterType: ParticipantType;
  outcome: 0 | 1;
  /** Time-weighted Reputation Point delta (already multiplied by conviction & horizon decay). */
  rpDelta: number;
  timeWeightedBrier: number;
  /** The first (original) call on this question — used for "Called It" bragging cards. */
  originalEventId: string;
  originalProbability: number;
  originalCrowdProb: number;
  originalConfidence: number;
  originalSubmittedAt: string;
  effectiveMultiplier: number;
  revisionCount: number;
  isContrarianHit: boolean;
  resolutionReceiptId: string;
  resolvedAt: string;
  isSandboxDrill: boolean;
}

export interface CategoryScoreSummary {
  category: AccuracyCategory;
  label: string;
  reputationPoints: number;
  resolvedCount: number;
  activeCount: number;
  avgBrier: number | null;
  isVerified: boolean;
  tier: ForecasterTier;
  percentile: number | null;
}

export interface ForecasterScorecard {
  handle: string;
  displayName: string;
  participantType: ParticipantType;
  overallRp: number;
  resolvedCount: number;
  activeCount: number;
  wins: number;
  losses: number;
  avgBrier: number | null;
  isVerified: boolean;
  tier: ForecasterTier;
  tierLabel: string;
  percentile: number | null;
  categories: CategoryScoreSummary[];
  bestCall: ReputationLedgerEntry | null;
  /** Whether this scorecard contains any sandbox-drill settlements. */
  includesSandboxDrills: boolean;
}

export interface WorldviewOutcome {
  label: string;
  probability: number;
  nodeId?: string;
}

export interface WorldviewSnapshot {
  id: string;
  scenarioSlug: "ai-2027" | "ai-2040" | "ai-2050" | "lev" | "nature-of-reality";
  scenarioTitle: string;
  headline: string;
  outcomes: WorldviewOutcome[];
  ownerHandle: string;
  ownerName: string;
  ownerXHandle?: string;
  createdAt: string;
  receiptId: string;
  payloadHash: string;
}

export interface QuestionResolution {
  id: string;
  questionNodeId: string;
  outcome: 0 | 1;
  source: OracleProvider;
  resolvedBy: string;
  evidenceUrl: string | null;
  resolvedAt: string;
  settledForecasterCount: number;
  receiptId: string;
}

/** Companion row linking a published X post to an (immutable) forecast event. */
export interface ForecastSocialLink {
  eventId: string;
  forecasterHandle: string;
  xPostUrl: string;
  attachedAt: string;
}

/** The authenticated human (or demo) principal for the current request. */
export interface SessionForecaster {
  profile: Profile;
  authProvider: Exclude<ForecastAuthProvider, "agent_api" | "legacy_seed">;
  linkedProviders: Array<"x" | "agifutures">;
  email?: string | null;
  isAdmin: boolean;
}
