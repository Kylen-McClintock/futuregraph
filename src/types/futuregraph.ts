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
}

export interface AuditReceipt {
  eventId: string;
  entityType: "forecast_event" | "argument" | "branch_proposal" | "scenario_fork";
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

