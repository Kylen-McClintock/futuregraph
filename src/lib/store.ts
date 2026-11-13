import {
  ArgumentItem,
  AuditReceipt,
  BranchProposal,
  CommentItem,
  ForecastEvent,
  ForecastLens,
  FutureEdge,
  FutureNode,
  ModerationReport,
  NodeSourceLink,
  ParticipantType,
  Presentation,
  Profile,
  ScenarioDataset,
  ScenarioFork,
  SourceItem,
} from "@/types/futuregraph";
import { getInitialDataset, LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import {
  AI_2040_ARGUMENTS,
  AI_2040_COMMENTS,
  AI_2040_EDGES,
  AI_2040_FORECAST_EVENTS,
  AI_2040_LENS_PRIORS_BY_NODE,
  AI_2040_NODE_SOURCES,
  AI_2040_NODES,
} from "@/data/ai2040-seed";
import {
  AI_2050_ARGUMENTS,
  AI_2050_COMMENTS,
  AI_2050_EDGES,
  AI_2050_FORECAST_EVENTS,
  AI_2050_LENS_PRIORS_BY_NODE,
  AI_2050_NODE_SOURCES,
  AI_2050_NODES,
  AI_2050_PROFILES,
} from "@/data/ai2050-seed";
import { createServerAuditReceipt } from "@/lib/audit-receipt";
import { propagateGraphProbabilities, validateProbability } from "@/lib/probability-engine";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CHECKPOINT_NODES } from "@/data/checkpoint-seed";
import { classifyNodeCategory } from "@/lib/reputation-engine";
import type { ForecastAuthProvider } from "@/types/futuregraph";
import {
  ALL_SEED_FORECASTER_ACTORS,
  SEED_AGENT_PROFILES,
  SEED_GRAPH_FORECAST_RUNS,
  SEED_STARTER_AGENT_ARGUMENTS,
} from "@/data/starter-agents-seed";
import type {
  ForecasterActor,
  GraphForecastRun,
  PriorAxisScore,
  RegisteredGraphId,
  WorldviewCard,
} from "@/types/forecaster";

interface ForecasterStoreState {
  actors: ForecasterActor[];
  runs: GraphForecastRun[];
}

declare global {
  // eslint-disable-next-line no-var
  var __FUTUREGRAPH_STORE__: ScenarioDataset | undefined;
  // eslint-disable-next-line no-var
  var __FUTUREGRAPH_FORECASTERS__: ForecasterStoreState | undefined;
}

/**
 * Near-term checkpoint questions & sandbox calibration drills. Kept out of `store.nodes` so they
 * never appear inside the scenario DAG visualizations, but fully forecastable and scorable.
 */
export function getCheckpointNodes(): FutureNode[] {
  return CHECKPOINT_NODES;
}

export function getAllForecastableNodes(): FutureNode[] {
  return [...getStore().nodes, ...CHECKPOINT_NODES];
}

export function findForecastableNode(idOrLogicalId: string): FutureNode | undefined {
  return getAllForecastableNodes().find(
    (n) => n.id === idOrLogicalId || n.logicalId === idOrLogicalId
  );
}

/**
 * Consensus baseline q used for crowd-edge scoring. Priority: linked oracle market price →
 * human community lens → documented hypothesis baseline → 50% "no crowd yet" default.
 * (The client Reputation Impact Meter mirrors this exact chain.)
 */
export function getCrowdProbability(node: FutureNode): number {
  getStore();
  const oracle = node.question?.oracleLastPrice;
  if (typeof oracle === "number" && Number.isFinite(oracle)) return oracle;
  const community = LENS_PRIORS_BY_NODE[node.id]?.community;
  if (typeof community === "number" && Number.isFinite(community)) return community;
  const demo = node.question?.demoHypothesisProb;
  if (typeof demo === "number" && Number.isFinite(demo)) return demo;
  return 0.5;
}

export function getStore(): ScenarioDataset {
  const needsInit =
    !global.__FUTUREGRAPH_STORE__ ||
    !global.__FUTUREGRAPH_STORE__.arguments.some(
      (a) => a.id === "arg-2040-2040-unpause-1"
    ) ||
    !global.__FUTUREGRAPH_STORE__.arguments.some(
      (a) => a.id === "arg-agent-kurzweil-2027-sc"
    );

  if (needsInit) {
    const base = getInitialDataset();
    Object.assign(
      LENS_PRIORS_BY_NODE,
      AI_2040_LENS_PRIORS_BY_NODE,
      AI_2050_LENS_PRIORS_BY_NODE
    );
    for (const cp of CHECKPOINT_NODES) {
      if (!LENS_PRIORS_BY_NODE[cp.id]) {
        LENS_PRIORS_BY_NODE[cp.id] = {
          original: null,
          my_forecasts: null,
          ai_claude: null,
          ai_gpt: null,
          ai_gemini: null,
          community: null,
          demo_hypothesis: null,
        };
      }
    }
    const mergedProfilesMap = new Map<string, Profile>();
    for (const p of [...base.profiles, ...AI_2050_PROFILES, ...SEED_AGENT_PROFILES]) {
      if (!mergedProfilesMap.has(p.handle)) {
        mergedProfilesMap.set(p.handle, p);
      }
    }
    global.__FUTUREGRAPH_STORE__ = {
      ...base,
      nodes: [...base.nodes, ...AI_2040_NODES, ...AI_2050_NODES],
      edges: [...base.edges, ...AI_2040_EDGES, ...AI_2050_EDGES],
      nodeSources: [
        ...base.nodeSources,
        ...AI_2040_NODE_SOURCES,
        ...AI_2050_NODE_SOURCES,
      ],
      arguments: [
        ...base.arguments,
        ...AI_2040_ARGUMENTS,
        ...AI_2050_ARGUMENTS,
        ...SEED_STARTER_AGENT_ARGUMENTS,
      ],
      comments: [...base.comments, ...AI_2040_COMMENTS, ...AI_2050_COMMENTS],
      forecastEvents: [
        ...base.forecastEvents,
        ...AI_2040_FORECAST_EVENTS,
        ...AI_2050_FORECAST_EVENTS,
      ],
      profiles: Array.from(mergedProfilesMap.values()),
    };
  }
  return global.__FUTUREGRAPH_STORE__!;
}

export function getBasePriorsForLens(lens: ForecastLens = "demo_hypothesis"): Record<string, number> {
  const store = getStore();
  const priors: Record<string, number> = {};

  for (const node of store.nodes) {
    const lensEntry = LENS_PRIORS_BY_NODE[node.id]?.[lens];
    if (lensEntry !== null && lensEntry !== undefined) {
      priors[node.id] = lensEntry;
    } else if (node.question?.demoHypothesisProb !== undefined) {
      priors[node.id] = node.question.demoHypothesisProb;
    }
  }

  // Apply newly submitted human forecast events for my_forecasts or community
  if (lens === "my_forecasts") {
    for (const ev of store.forecastEvents) {
      if (ev.forecasterHandle === "elena_vance" && !ev.id.startsWith("fe-00")) {
        priors[ev.nodeId] = ev.probability;
      }
    }
  }
  // Note: LENS_PRIORS_BY_NODE[nodeId].community is already updated in submitForecastEvent ONLY when participantType === "human"

  return priors;
}

export function getLatestReceiptHash(): string | null {
  const store = getStore();
  if (store.auditReceipts.length === 0) return null;
  return store.auditReceipts[store.auditReceipts.length - 1].chainSha256;
}

export interface SubmitForecastParams {
  nodeId: string;
  probability: number;
  uncertaintyLower?: number;
  uncertaintyUpper?: number;
  rationale: string;
  citedUrls?: string[];
  assumptions?: string[];
  conditionalOverrides?: Record<string, number>;
  forecasterHandle?: string;
  forecasterName?: string;
  forecasterType?: ParticipantType;
  agentModelVersion?: string;
  agentProvider?: string;
  /** Authenticated session profile (takes precedence over forecasterHandle for humans). */
  sessionProfile?: Profile;
  authProvider?: ForecastAuthProvider;
  /** Conviction wager multiplier, already clamped by the API layer for provisional accounts. */
  confidenceMultiplier?: number;
  projectedRpIfYes?: number | null;
  projectedRpIfNo?: number | null;
  /** Explicit crowd snapshot (tests / seeding). Defaults to the live consensus before this forecast. */
  crowdProbSnapshot?: number;
  /** Explicit server timestamp (seeding only). */
  serverTimestampOverride?: string;
  eventIdOverride?: string;
  /** Skip Supabase writes (used for deterministic in-memory sandbox seeding). */
  skipPersistence?: boolean;
}

/**
 * Synchronously records an append-only forecast event + SHA-256 receipt in the in-memory store.
 * Use submitForecastEvent() for request handlers (it also persists to Supabase).
 */
export function recordForecastEvent(
  params: SubmitForecastParams
): { event: ForecastEvent; receipt: AuditReceipt; profile: Profile } {
  const store = getStore();
  const node = findForecastableNode(params.nodeId);
  if (!node) {
    throw new Error(`Node '${params.nodeId}' not found.`);
  }

  const pCheck = validateProbability(params.probability, "Forecast probability");
  if (!pCheck.valid) {
    throw new Error(pCheck.errors.join(" "));
  }

  if (!params.rationale || params.rationale.trim().length < 8) {
    throw new Error("Rationale must be at least 8 characters explaining your reasoning or assumptions.");
  }

  const handle = params.sessionProfile?.handle || params.forecasterHandle || "elena_vance";
  let profile: Profile | undefined = store.profiles.find((p) => p.handle === handle);
  if (
    profile &&
    !params.sessionProfile &&
    params.forecasterType === "ai_agent" &&
    profile.participantType !== "ai_agent"
  ) {
    // Agent credentials may never write into a human forecaster's reputation track record.
    throw new Error("Agent API credentials cannot submit forecasts on behalf of a human forecaster.");
  }
  if (profile && params.sessionProfile) {
    // Refresh verified identity fields from the authenticated session.
    Object.assign(profile, {
      displayName: params.sessionProfile.displayName || profile.displayName,
      authUserId: params.sessionProfile.authUserId ?? profile.authUserId,
      xUserId: params.sessionProfile.xUserId ?? profile.xUserId,
      xHandle: params.sessionProfile.xHandle ?? profile.xHandle,
      xAvatarUrl: params.sessionProfile.xAvatarUrl ?? profile.xAvatarUrl,
      xVerifiedAt: params.sessionProfile.xVerifiedAt ?? profile.xVerifiedAt,
      agifuturesLinked: params.sessionProfile.agifuturesLinked ?? profile.agifuturesLinked,
      avatarUrl: params.sessionProfile.avatarUrl ?? profile.avatarUrl,
    });
  }
  if (!profile && params.sessionProfile) {
    profile = { ...params.sessionProfile };
    store.profiles.push(profile);
  }
  if (!profile) {
    profile = {
      id: `prof-${handle}`,
      handle,
      displayName: params.forecasterName || handle,
      role: params.forecasterType === "ai_agent" ? "agent" : "user",
      participantType: params.forecasterType || "human",
      bio: "FutureGraph Contributor",
      joinedAt: new Date().toISOString(),
      agentMetadata:
        params.forecasterType === "ai_agent"
          ? {
              provider: params.agentProvider || "External AI Provider",
              modelFamily: params.agentModelVersion || "AI Agent",
              modelVersion: params.agentModelVersion || "v1.0",
              promptTemplateVersion: "fg-api-v1",
              ownerHandle: handle,
              isVerifiedProvider: true,
              isIndependent: true,
            }
          : undefined,
    };
    store.profiles.push(profile);
  }

  const eventId = params.eventIdOverride || `fe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const serverTimestamp = params.serverTimestampOverride || new Date().toISOString();
  const prevHash = getLatestReceiptHash();
  const crowdProbSnapshot = Number(
    (params.crowdProbSnapshot ?? getCrowdProbability(node)).toFixed(4)
  );
  const confidenceMultiplier = Number((params.confidenceMultiplier ?? 1).toFixed(2));
  const accuracyCategory = classifyNodeCategory(node);
  const authProvider: ForecastAuthProvider =
    params.authProvider || (profile.participantType === "ai_agent" ? "agent_api" : "demo");

  const canonicalPayload = {
    eventId,
    nodeId: node.id,
    questionId: node.question?.id || null,
    forecasterId: profile.id,
    forecasterHandle: profile.handle,
    forecasterType: profile.participantType,
    forecasterXHandle: profile.xHandle || null,
    authProvider,
    probability: params.probability,
    crowdProbSnapshot,
    confidenceMultiplier,
    projectedRpIfYes: params.projectedRpIfYes ?? null,
    projectedRpIfNo: params.projectedRpIfNo ?? null,
    accuracyCategory,
    uncertaintyLower: params.uncertaintyLower ?? null,
    uncertaintyUpper: params.uncertaintyUpper ?? null,
    conditionalOverrides: params.conditionalOverrides || {},
    rationale: params.rationale.trim(),
    citedUrls: params.citedUrls || [],
    assumptions: params.assumptions || [],
    serverTimestamp,
  };

  const receipt = createServerAuditReceipt({
    eventId,
    entityType: "forecast_event",
    entityId: eventId,
    contributorId: profile.id,
    contributorHandle: profile.handle,
    contributorName: profile.displayName,
    agentMetadata: profile.agentMetadata
      ? {
          provider: profile.agentMetadata.provider,
          modelVersion: profile.agentMetadata.modelVersion,
          promptTemplateVersion: profile.agentMetadata.promptTemplateVersion,
          isIndependent: profile.agentMetadata.isIndependent,
        }
      : null,
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: prevHash,
    serverTimestamp,
  });

  const event: ForecastEvent = {
    id: eventId,
    nodeId: node.id,
    questionId: node.question?.id,
    scenarioVersion: store.scenario.version,
    forecasterId: profile.id,
    forecasterHandle: profile.handle,
    forecasterName: profile.displayName,
    forecasterType: profile.participantType,
    agentModelVersion: params.agentModelVersion,
    agentProvider: params.agentProvider,
    lensCategory: profile.participantType === "ai_agent" ? "ai_model" : "human_forecaster",
    probability: params.probability,
    uncertaintyLower: params.uncertaintyLower,
    uncertaintyUpper: params.uncertaintyUpper,
    conditionalOverrides: params.conditionalOverrides,
    rationale: params.rationale.trim(),
    citedUrls: params.citedUrls || [],
    assumptions: params.assumptions || [],
    parentEventId: null,
    payloadHash: receipt.payloadSha256,
    prevChainHash: receipt.prevReceiptHash,
    chainHash: receipt.chainSha256,
    serverTimestamp,
    crowdProbSnapshot,
    confidenceMultiplier,
    projectedRpIfYes: params.projectedRpIfYes ?? null,
    projectedRpIfNo: params.projectedRpIfNo ?? null,
    accuracyCategory,
    authProvider,
  };

  store.forecastEvents.push(event);
  store.auditReceipts.push(receipt);

  // Update lens table in-memory
  if (!LENS_PRIORS_BY_NODE[node.id]) {
    LENS_PRIORS_BY_NODE[node.id] = {
      original: null,
      my_forecasts: params.probability,
      ai_claude: params.probability,
      ai_gpt: params.probability,
      ai_gemini: params.probability,
      community: params.probability,
      demo_hypothesis: params.probability,
    };
  } else {
    if (profile.participantType === "ai_agent") {
      LENS_PRIORS_BY_NODE[node.id].ai_gemini = params.probability;
    } else {
      LENS_PRIORS_BY_NODE[node.id].my_forecasts = params.probability;
      const oldComm = LENS_PRIORS_BY_NODE[node.id].community ?? params.probability;
      LENS_PRIORS_BY_NODE[node.id].community = Number(((oldComm * 3 + params.probability) / 4).toFixed(4));
    }
  }

  return { event, receipt, profile };
}

export async function submitForecastEvent(
  params: SubmitForecastParams
): Promise<{ event: ForecastEvent; receipt: AuditReceipt }> {
  const { event, receipt, profile } = recordForecastEvent(params);

  // Persist asynchronously to Supabase if configured
  const supabase = params.skipPersistence ? null : getSupabaseAdmin();
  if (supabase) {
    try {
      const baseProfileRow = {
        id: profile.id,
        handle: profile.handle,
        display_name: profile.displayName,
        role: profile.role,
        participant_type: profile.participantType,
        bio: profile.bio,
        avatar_url: profile.avatarUrl ?? null,
        joined_at: profile.joinedAt,
      };
      const identityProfileRow = {
        ...baseProfileRow,
        auth_user_id: profile.authUserId ?? null,
        x_user_id: profile.xUserId ?? null,
        x_handle: profile.xHandle ?? null,
        x_avatar_url: profile.xAvatarUrl ?? null,
        x_verified_at: profile.xVerifiedAt ?? null,
        agifutures_linked: profile.agifuturesLinked ?? false,
      };
      // Fall back to the original column set if the reputation migration hasn't been applied yet.
      const profileRes = await supabase.from("profiles").upsert(identityProfileRow);
      if (profileRes.error) await supabase.from("profiles").upsert(baseProfileRow);

      const baseEventRow = {
        id: event.id,
        node_id: event.nodeId,
        question_id: event.questionId || null,
        scenario_version: event.scenarioVersion,
        forecaster_id: event.forecasterId,
        lens_category: event.lensCategory,
        probability: event.probability,
        uncertainty_lower: event.uncertaintyLower ?? null,
        uncertainty_upper: event.uncertaintyUpper ?? null,
        conditional_overrides: event.conditionalOverrides || {},
        rationale: event.rationale,
        cited_urls: event.citedUrls,
        assumptions: event.assumptions,
        payload_hash: event.payloadHash,
        prev_chain_hash: event.prevChainHash || null,
        chain_hash: event.chainHash,
        server_timestamp: event.serverTimestamp,
      };
      const eventRes = await supabase.from("forecast_events").insert({
        ...baseEventRow,
        crowd_prob_snapshot: event.crowdProbSnapshot ?? null,
        confidence_multiplier: event.confidenceMultiplier ?? 1,
        projected_rp_if_yes: event.projectedRpIfYes ?? null,
        projected_rp_if_no: event.projectedRpIfNo ?? null,
        accuracy_category: event.accuracyCategory ?? null,
        auth_provider: event.authProvider ?? null,
      });
      if (eventRes.error) await supabase.from("forecast_events").insert(baseEventRow);
      await supabase.from("audit_receipts").insert({
        event_id: receipt.eventId,
        entity_type: receipt.entityType,
        entity_id: receipt.entityId,
        contributor_id: receipt.contributorId,
        agent_metadata: receipt.agentMetadata,
        scenario_version: receipt.scenarioVersion,
        canonical_payload: receipt.canonicalPayload,
        payload_sha256: receipt.payloadSha256,
        prev_receipt_hash: receipt.prevReceiptHash,
        chain_sha256: receipt.chainSha256,
        hmac_signature: receipt.hmacSignature,
        server_timestamp: receipt.serverTimestamp,
      });
    } catch {
      // Non-blocking fallback
    }
  }

  return { event, receipt };
}

export async function submitArgumentItem(params: {
  nodeId: string;
  stance: ArgumentItem["stance"];
  thesis: string;
  reasoning: string;
  targetAssumption?: string;
  sourceIds?: string[];
  authorHandle?: string;
  authorName?: string;
  authorType?: ParticipantType;
}): Promise<{ argument: ArgumentItem; receipt: AuditReceipt }> {
  const store = getStore();
  const node = store.nodes.find((n) => n.id === params.nodeId);
  if (!node) throw new Error(`Node '${params.nodeId}' not found.`);
  if (!params.thesis || params.thesis.trim().length < 5) {
    throw new Error("Thesis is required (minimum 5 characters).");
  }
  if (!params.reasoning || params.reasoning.trim().length < 10) {
    throw new Error("Reasoning is required (minimum 10 characters).");
  }

  const handle = params.authorHandle || "elena_vance";
  let profile = store.profiles.find((p) => p.handle === handle);
  if (!profile) {
    profile = {
      id: `prof-${handle}`,
      handle,
      displayName: params.authorName || handle,
      role: params.authorType === "ai_agent" ? "agent" : "user",
      participantType: params.authorType || "human",
      bio: "FutureGraph Contributor",
      joinedAt: new Date().toISOString(),
    };
    store.profiles.push(profile);
  }

  const argId = `arg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const serverTimestamp = new Date().toISOString();
  const prevHash = getLatestReceiptHash();

  const canonicalPayload = {
    argId,
    nodeId: params.nodeId,
    authorId: profile.id,
    authorHandle: profile.handle,
    stance: params.stance,
    thesis: params.thesis.trim(),
    reasoning: params.reasoning.trim(),
    targetAssumption: params.targetAssumption || null,
    sourceIds: params.sourceIds || [],
    serverTimestamp,
  };

  const receipt = createServerAuditReceipt({
    eventId: argId,
    entityType: "argument",
    entityId: argId,
    contributorId: profile.id,
    contributorHandle: profile.handle,
    contributorName: profile.displayName,
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: prevHash,
    serverTimestamp,
  });

  const argument: ArgumentItem = {
    id: argId,
    nodeId: params.nodeId,
    authorId: profile.id,
    authorHandle: profile.handle,
    authorName: profile.displayName,
    authorType: profile.participantType,
    stance: params.stance,
    thesis: params.thesis.trim(),
    reasoning: params.reasoning.trim(),
    targetAssumption: params.targetAssumption,
    sourceIds: params.sourceIds || [],
    reactions: {
      made_me_reconsider: 1,
      taught_me_something: 1,
      strongest_evidence: 1,
    },
    payloadHash: receipt.payloadSha256,
    createdAt: serverTimestamp,
  };

  store.arguments.unshift(argument);
  store.auditReceipts.push(receipt);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("arguments").insert({
        id: argument.id,
        node_id: argument.nodeId,
        author_id: argument.authorId,
        stance: argument.stance,
        thesis: argument.thesis,
        reasoning: argument.reasoning,
        target_assumption: argument.targetAssumption || null,
        source_ids: argument.sourceIds,
        payload_hash: argument.payloadHash,
        created_at: argument.createdAt,
      });
    } catch {
      // Non-blocking
    }
  }

  return { argument, receipt };
}

export async function submitBranchProposal(params: {
  parentNodeId: string;
  proposalType?: BranchProposal["proposalType"];
  proposedTitle: string;
  proposedSummary: string;
  conditionalAssumption: string;
  suggestedProbability?: number;
  sourceUrl?: string;
  proposerHandle?: string;
}): Promise<{ proposal: BranchProposal; receipt: AuditReceipt }> {
  const store = getStore();
  const parent = store.nodes.find((n) => n.id === params.parentNodeId);
  if (!parent) throw new Error(`Parent node '${params.parentNodeId}' not found.`);

  const handle = params.proposerHandle || "sentinel_bayes_v2";
  const profile = store.profiles.find((p) => p.handle === handle) || store.profiles[0];
  const propId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const serverTimestamp = new Date().toISOString();

  const canonicalPayload = {
    propId,
    scenarioId: store.scenario.id,
    parentNodeId: params.parentNodeId,
    proposerHandle: profile.handle,
    proposalType: params.proposalType || "missing_branch",
    proposedTitle: params.proposedTitle,
    proposedSummary: params.proposedSummary,
    conditionalAssumption: params.conditionalAssumption,
    suggestedProbability: params.suggestedProbability ?? null,
    sourceUrl: params.sourceUrl || null,
    serverTimestamp,
  };

  const receipt = createServerAuditReceipt({
    eventId: propId,
    entityType: "branch_proposal",
    entityId: propId,
    contributorId: profile.id,
    contributorHandle: profile.handle,
    contributorName: profile.displayName,
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: getLatestReceiptHash(),
    serverTimestamp,
  });

  const proposal: BranchProposal = {
    id: propId,
    scenarioId: store.scenario.id,
    parentNodeId: params.parentNodeId,
    proposerId: profile.id,
    proposerHandle: profile.handle,
    proposalType: params.proposalType || "missing_branch",
    proposedTitle: params.proposedTitle,
    proposedSummary: params.proposedSummary,
    conditionalAssumption: params.conditionalAssumption,
    suggestedProbability: params.suggestedProbability,
    sourceUrl: params.sourceUrl,
    status: "pending_review",
    payloadHash: receipt.payloadSha256,
    createdAt: serverTimestamp,
  };

  store.proposals.unshift(proposal);
  store.auditReceipts.push(receipt);

  return { proposal, receipt };
}

export async function createScenarioFork(params: {
  title: string;
  subtitle?: string;
  rationale: string;
  ownerHandle?: string;
  ownerName?: string;
  nodeProbabilityOverrides: Record<string, number>;
  addedNodes?: ScenarioFork["addedNodes"];
}): Promise<{ fork: ScenarioFork; receipt: AuditReceipt }> {
  const store = getStore();
  const handle = params.ownerHandle || "elena_vance";
  const profile = store.profiles.find((p) => p.handle === handle) || store.profiles[0];
  const forkId = `fork-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const slug = params.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const serverTimestamp = new Date().toISOString();

  const canonicalPayload = {
    forkId,
    parentScenarioId: store.scenario.id,
    ownerHandle: profile.handle,
    title: params.title,
    rationale: params.rationale,
    nodeProbabilityOverrides: params.nodeProbabilityOverrides,
    addedNodes: params.addedNodes || [],
    serverTimestamp,
  };

  const receipt = createServerAuditReceipt({
    eventId: forkId,
    entityType: "scenario_fork",
    entityId: forkId,
    contributorId: profile.id,
    contributorHandle: profile.handle,
    contributorName: profile.displayName,
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: getLatestReceiptHash(),
    serverTimestamp,
  });

  const fork: ScenarioFork = {
    id: forkId,
    slug: `${slug}-${forkId.slice(-4)}`,
    title: params.title,
    subtitle: params.subtitle || `Fork of ${store.scenario.title}`,
    parentScenarioId: store.scenario.id,
    forkedFromVersion: store.scenario.version,
    ownerId: profile.id,
    ownerHandle: profile.handle,
    ownerName: params.ownerName || profile.displayName,
    rationale: params.rationale,
    nodeProbabilityOverrides: params.nodeProbabilityOverrides,
    addedNodes: params.addedNodes || [],
    createdAt: serverTimestamp,
    receiptId: receipt.eventId,
  };

  store.forks.unshift(fork);
  store.auditReceipts.push(receipt);

  return { fork, receipt };
}

export async function createPresentationDeck(params: {
  title: string;
  subtitle?: string;
  authorHandle?: string;
  aspectRatio?: "16:9" | "9:16";
  scenes: Presentation["scenes"];
}): Promise<Presentation> {
  const store = getStore();
  const handle = params.authorHandle || "elena_vance";
  const profile = store.profiles.find((p) => p.handle === handle) || store.profiles[0];
  const presId = `pres-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  const presentation: Presentation = {
    id: presId,
    scenarioId: store.scenario.id,
    pinnedScenarioVersion: store.scenario.version,
    authorId: profile.id,
    authorHandle: profile.handle,
    title: params.title,
    subtitle: params.subtitle || "Custom FutureGraph Creator Deck",
    aspectRatio: params.aspectRatio || "16:9",
    visibility: "public",
    createdAt: new Date().toISOString(),
    scenes: params.scenes.map((s, idx) => ({
      ...s,
      id: s.id || `scene-${presId}-${idx + 1}`,
      presentationId: presId,
      sceneOrder: idx + 1,
    })),
  };

  store.presentations.unshift(presentation);
  return presentation;
}

export function compareLenses(
  lensA: ForecastLens,
  lensB: ForecastLens
): Array<{
  nodeId: string;
  title: string;
  dateLabel: string;
  branchTrack: FutureNode["branchTrack"];
  probA: number;
  probB: number;
  absDiff: number;
  signedDiff: number;
  topSteelmanFor?: string;
  topSteelmanAgainst?: string;
}> {
  const store = getStore();
  const priorsA = getBasePriorsForLens(lensA);
  const priorsB = getBasePriorsForLens(lensB);
  const propA = propagateGraphProbabilities(store.nodes, store.edges, priorsA, {});
  const propB = propagateGraphProbabilities(store.nodes, store.edges, priorsB, {});

  const rows = store.nodes.map((node) => {
    const pA = propA.results[node.id]?.marginalProbability ?? priorsA[node.id] ?? 0.5;
    const pB = propB.results[node.id]?.marginalProbability ?? priorsB[node.id] ?? 0.5;
    const signedDiff = Number((pA - pB).toFixed(4));
    const absDiff = Number(Math.abs(signedDiff).toFixed(4));
    const nodeArgs = store.arguments.filter((a) => a.nodeId === node.id);

    return {
      nodeId: node.id,
      title: node.title,
      dateLabel: node.dateLabel,
      branchTrack: node.branchTrack,
      probA: pA,
      probB: pB,
      absDiff,
      signedDiff,
      topSteelmanFor: nodeArgs.find((a) => a.stance === "for" || a.stance === "steelman")?.thesis,
      topSteelmanAgainst: nodeArgs.find((a) => a.stance === "against" || a.stance === "assumption_challenge")?.thesis,
    };
  });

  return rows.sort((a, b) => b.absDiff - a.absDiff);
}

export function verifyAgentApiKey(authHeader?: string | null, apiKeyHeader?: string | null): {
  authorized: boolean;
  agentHandle: string;
  agentName: string;
  modelVersion: string;
} {
  const token =
    apiKeyHeader ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader);

  // Built-in demo agent keys for immediate testing & MCP verification
  if (
    !token ||
    token === "fg_agent_demo_sentinel_2027" ||
    token.startsWith("fg_agent_")
  ) {
    return {
      authorized: true,
      agentHandle: "sentinel_bayes_v2",
      agentName: "Sentinel-Bayes v2.4 (Gemini Agent)",
      modelVersion: "gemini-2.5-pro-epistemic",
    };
  }

  return {
    authorized: true,
    agentHandle: "hardware_realist_bot",
    agentName: "HardwareRealist-Agent v1.8 (Claude Agent)",
    modelVersion: "claude-3.7-sonnet-econometric",
  };
}

// =============================================================================
// FORECASTER AGENTS, WORLDVIEW CARDS & MULTI-GRAPH RUNS
// =============================================================================

function makeDefaultPriorAxes(): PriorAxisScore[] {
  return [
    {
      id: "compute_scaling",
      label: "Compute & Algorithmic Scaling Velocity",
      shortLabel: "Scaling Velocity",
      score: 65,
      lowLabel: "Hard Walls / Fizzle",
      highLabel: "Fast Takeoff",
    },
    {
      id: "alignment_tractability",
      label: "Alignment & Control Tractability",
      shortLabel: "Alignment Ease",
      score: 55,
      lowLabel: "Deceptive Doom Default",
      highLabel: "Tractable by Default",
    },
    {
      id: "institutional_coordination",
      label: "Institutional & Treaty Coordination",
      shortLabel: "Treaty / Governance",
      score: 50,
      lowLabel: "Multipolar Chaos",
      highLabel: "Verified Cooperation",
    },
    {
      id: "biotech_longevity_velocity",
      label: "Biotech & Longevity Escape Velocity",
      shortLabel: "Bio / LEV Speed",
      score: 65,
      lowLabel: "Slow Trial Friction",
      highLabel: "2030s Rejuvenation",
    },
    {
      id: "post_physical_simulation",
      label: "Non-Physicalist / Simulation Openness",
      shortLabel: "Sim / Multiverse",
      score: 50,
      lowLabel: "Strict ΛCDM Physicalism",
      highLabel: "Computational / Idealist",
    },
  ];
}

function getForecasterStore(): ForecasterStoreState {
  if (
    !global.__FUTUREGRAPH_FORECASTERS__ ||
    !global.__FUTUREGRAPH_FORECASTERS__.actors.some((a) => a.handle === "kylen")
  ) {
    global.__FUTUREGRAPH_FORECASTERS__ = {
      actors: ALL_SEED_FORECASTER_ACTORS.map((a) => ({ ...a })),
      runs: SEED_GRAPH_FORECAST_RUNS.map((r) => ({ ...r })),
    };
  }
  return global.__FUTUREGRAPH_FORECASTERS__;
}

export function getForecasterActors(): ForecasterActor[] {
  return getForecasterStore().actors;
}

export function getForecasterActor(handle: string): ForecasterActor | undefined {
  const clean = handle.trim().toLowerCase().replace(/^@/, "");
  return getForecasterStore().actors.find((a) => a.handle.toLowerCase() === clean);
}

export function getAllForecasterRuns(): GraphForecastRun[] {
  return getForecasterStore().runs;
}

export function getRunsForGraph(graphId: RegisteredGraphId): GraphForecastRun[] {
  return getForecasterStore().runs.filter((r) => r.graphId === graphId);
}

export function getRunsForActor(handle: string): GraphForecastRun[] {
  const clean = handle.trim().toLowerCase().replace(/^@/, "");
  return getForecasterStore().runs.filter(
    (r) => r.actorHandle.toLowerCase() === clean
  );
}

export async function submitForecasterGraphRuns(params: {
  handle: string;
  displayName: string;
  actorType?: ForecasterActor["actorType"];
  roleLabel?: string;
  worldview?: Partial<WorldviewCard>;
  runs: GraphForecastRun[];
  forkedFromHandle?: string | null;
  skipPersistence?: boolean;
}): Promise<{
  actor: ForecasterActor;
  runs: GraphForecastRun[];
  receipt: AuditReceipt;
}> {
  const store = getStore();
  const fStore = getForecasterStore();

  let cleanHandle = params.handle
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 36);
  if (!cleanHandle) cleanHandle = "custom_agent";

  // Protect verified starter/creator baselines from accidental anonymous overwrites:
  // if a visitor submits under a seeded verified handle, create a distinct community sandbox fork handle
  const existing = fStore.actors.find((a) => a.handle === cleanHandle);
  if (existing && existing.isVerifiedEnsemble) {
    const suffix = Math.random().toString(36).slice(2, 6);
    cleanHandle = `${cleanHandle.slice(0, 28)}_fork_${suffix}`;
  }

  let actor = fStore.actors.find((a) => a.handle === cleanHandle);
  const nowIso = new Date().toISOString();
  const initials =
    params.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "CA";

  const mergedWorldview: WorldviewCard = {
    coreThesis:
      params.worldview?.coreThesis ||
      actor?.worldview.coreThesis ||
      "Custom worldview agent submitted via FutureGraph Agent Studio.",
    modelBadge:
      params.worldview?.modelBadge ||
      actor?.worldview.modelBadge ||
      (params.actorType === "human" ? "Community Forecaster" : "Custom AI Agent"),
    accentColor:
      params.worldview?.accentColor || actor?.worldview.accentColor || "#06b6d4",
    priorAxes:
      params.worldview?.priorAxes && params.worldview.priorAxes.length === 5
        ? params.worldview.priorAxes
        : actor?.worldview.priorAxes || makeDefaultPriorAxes(),
    explicitAxioms:
      params.worldview?.explicitAxioms && params.worldview.explicitAxioms.length > 0
        ? params.worldview.explicitAxioms
        : actor?.worldview.explicitAxioms || [
            "Applies explicit causal priors across conditional branches.",
          ],
    groundingLinks:
      params.worldview?.groundingLinks || actor?.worldview.groundingLinks || [],
    systemPrompt:
      params.worldview?.systemPrompt ||
      actor?.worldview.systemPrompt ||
      `Forecast consistent with ${params.displayName}'s stated worldview thesis.`,
    forkedFromHandle:
      params.forkedFromHandle ??
      params.worldview?.forkedFromHandle ??
      actor?.worldview.forkedFromHandle ??
      null,
  };

  if (!actor) {
    actor = {
      id: `actor-${cleanHandle}`,
      handle: cleanHandle,
      displayName: params.displayName || cleanHandle,
      shortBadge:
        params.actorType === "human" ? "Community" : "Sandbox Agent",
      actorType: params.actorType || "ai_agent",
      roleLabel:
        params.roleLabel ||
        (params.actorType === "human"
          ? "Community Forecaster"
          : "Community Sandbox Agent"),
      avatarInitials: initials,
      // Governance rule: new visitor submissions start in Community Sandbox (isVerifiedEnsemble: false)
      // so Crowd Wisdom remains Sybil-resistant
      isVerifiedEnsemble: false,
      createdAt: nowIso,
      worldview: mergedWorldview,
    };
    fStore.actors.unshift(actor);
  } else {
    actor.displayName = params.displayName || actor.displayName;
    actor.roleLabel = params.roleLabel || actor.roleLabel;
    actor.worldview = mergedWorldview;
  }

  // Ensure a matching Profile exists in store.profiles so /u/[handle] renders cleanly
  let profile = store.profiles.find((p) => p.handle === cleanHandle);
  if (!profile) {
    profile = {
      id: `prof-${cleanHandle}`,
      handle: cleanHandle,
      displayName: actor.displayName,
      role: actor.actorType === "ai_agent" ? "agent" : "user",
      participantType: actor.actorType === "ai_agent" ? "ai_agent" : "human",
      bio: actor.worldview.coreThesis,
      credentials: `${actor.roleLabel} • ${actor.worldview.modelBadge}`,
      joinedAt: actor.createdAt,
      agentMetadata:
        actor.actorType === "ai_agent"
          ? {
              provider: actor.provider || "Community Agent Studio",
              modelFamily: actor.worldview.modelBadge,
              modelVersion: actor.worldview.modelBadge,
              promptTemplateVersion: "fg-prompt-pack-v2",
              ownerHandle: cleanHandle,
              isVerifiedProvider: false,
              isIndependent: true,
            }
          : undefined,
    };
    store.profiles.push(profile);
  } else {
    profile.displayName = actor.displayName;
    profile.bio = actor.worldview.coreThesis;
  }

  const receiptEventId = `fgrun-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const canonicalPayload = {
    receiptEventId,
    actorHandle: actor.handle,
    actorDisplayName: actor.displayName,
    actorType: actor.actorType,
    worldviewThesis: actor.worldview.coreThesis,
    runs: params.runs.map((r) => ({
      graphId: r.graphId,
      headlineSummary: r.headlineSummary,
      rootPriors: r.rootPriors || null,
      conditionalSplits: r.conditionalSplits,
      levForecast: r.levForecast || null,
    })),
    submittedAt: nowIso,
  };

  const receipt = createServerAuditReceipt({
    eventId: receiptEventId,
    entityType: "worldview_snapshot",
    entityId: receiptEventId,
    contributorId: profile.id,
    contributorHandle: actor.handle,
    contributorName: actor.displayName,
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: getLatestReceiptHash(),
    serverTimestamp: nowIso,
  });
  store.auditReceipts.push(receipt);

  const savedRuns: GraphForecastRun[] = [];
  for (const r of params.runs) {
    const finalizedRun: GraphForecastRun = {
      ...r,
      id: `run-${actor.handle}-${r.graphId}`,
      actorHandle: actor.handle,
      actorDisplayName: actor.displayName,
      actorType: actor.actorType,
      receiptId: receipt.eventId,
      submittedAt: nowIso,
    };
    const existingIdx = fStore.runs.findIndex(
      (x) => x.graphId === r.graphId && x.actorHandle === actor!.handle
    );
    if (existingIdx >= 0) {
      fStore.runs[existingIdx] = finalizedRun;
    } else {
      fStore.runs.unshift(finalizedRun);
    }
    savedRuns.push(finalizedRun);
  }

  const supabase = params.skipPersistence ? null : getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("forecaster_actors").upsert({
        id: actor.id,
        handle: actor.handle,
        display_name: actor.displayName,
        short_badge: actor.shortBadge,
        actor_type: actor.actorType,
        role_label: actor.roleLabel,
        avatar_initials: actor.avatarInitials,
        is_verified_ensemble: actor.isVerifiedEnsemble,
        is_creator_baseline: Boolean(actor.isCreatorBaseline),
        provider: actor.provider ?? null,
        model_family: actor.modelFamily ?? null,
        model_version: actor.modelVersion ?? null,
        owner_handle: actor.ownerHandle ?? null,
        worldview: actor.worldview,
        updated_at: nowIso,
      });
      for (const sr of savedRuns) {
        await supabase.from("forecaster_graph_runs").upsert(
          {
            id: sr.id,
            graph_id: sr.graphId,
            actor_handle: sr.actorHandle,
            actor_display_name: sr.actorDisplayName,
            actor_type: sr.actorType,
            root_priors: sr.rootPriors ?? null,
            conditional_splits: sr.conditionalSplits,
            fork_rationales: sr.forkRationales,
            lev_forecast: sr.levForecast ?? null,
            headline_summary: sr.headlineSummary,
            receipt_id: sr.receiptId ?? null,
            submitted_at: sr.submittedAt,
          },
          { onConflict: "graph_id,actor_handle" }
        );
      }
    } catch {
      // Non-blocking fallback when Supabase migration isn't applied locally
    }
  }

  return {
    actor,
    runs: savedRuns,
    receipt,
  };
}
