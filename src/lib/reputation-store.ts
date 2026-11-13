/**
 * Server-side reputation state: settlement ledger, question resolutions, worldview snapshots and
 * X post links. Mirrors the dual-write pattern of src/lib/store.ts (in-memory source of truth for
 * the running instance + best-effort Supabase persistence).
 */
import type {
  AccuracyCategory,
  ForecastEvent,
  ForecastSocialLink,
  ForecasterScorecard,
  FutureNode,
  OracleProvider,
  ParticipantType,
  Profile,
  QuestionResolution,
  ReputationLedgerEntry,
  ScenarioDataset,
  WorldviewOutcome,
  WorldviewSnapshot,
} from "@/types/futuregraph";
import {
  BASE_RP,
  assignPercentiles,
  classifyNodeCategory,
  computeForecasterScorecard,
  computeTimeWeightedQuestionSettlement,
  horizonDecayFactor,
  isNodeScorable,
} from "@/lib/reputation-engine";
import {
  findForecastableNode,
  getAllForecastableNodes,
  getLatestReceiptHash,
  getStore,
  recordForecastEvent,
} from "@/lib/store";
import { CHECKPOINT_SEED_FORECASTS } from "@/data/checkpoint-seed";
import { createServerAuditReceipt } from "@/lib/audit-receipt";
import { getSupabaseAdmin } from "@/lib/supabase";

interface ReputationState {
  storeRef: ScenarioDataset;
  ledger: ReputationLedgerEntry[];
  resolutions: QuestionResolution[];
  worldviews: WorldviewSnapshot[];
  socialLinks: ForecastSocialLink[];
}

declare global {
  // eslint-disable-next-line no-var
  var __FG_REPUTATION__: ReputationState | undefined;
}

const SANDBOX_HANDLES = new Set(["elena_vance", "marcus_chen", "sentinel_bayes_v2", "hardware_realist_bot"]);
const SCORED_LENS_CATEGORIES = new Set<ForecastEvent["lensCategory"]>(["human_forecaster", "ai_model"]);
/** System principal that signs resolution receipts (seeded by the reputation migration). */
export const ADJUDICATION_PROFILE_ID = "prof-futuregraph-adjudication";

export function getReputationState(): ReputationState {
  const store = getStore();
  const existing = global.__FG_REPUTATION__;
  if (existing && existing.storeRef === store) return existing;

  const state: ReputationState = {
    storeRef: store,
    ledger: [],
    resolutions: [],
    worldviews: [],
    socialLinks: [],
  };
  global.__FG_REPUTATION__ = state;

  for (const p of store.profiles) {
    if (SANDBOX_HANDLES.has(p.handle)) p.isSandbox = true;
  }
  seedSandboxDrillForecasts(store);

  // Settle every question that is already resolved (sandbox drills + observed real-world nodes).
  for (const node of getAllForecastableNodes()) {
    const outcome = node.question?.resolvedOutcome;
    if ((outcome === 0 || outcome === 1) && isNodeScorable(node)) {
      settleIntoState(state, node, outcome, {
        source: "editorial",
        resolvedBy: node.question?.isSandboxDrill ? "sandbox_drill" : "futuregraph_editorial",
        evidenceUrl: node.question?.resolutionEvidenceUrl ?? node.sourceUrl ?? null,
        resolvedAt: node.question?.resolvedAt || `${node.question?.closeDate}T23:59:59Z`,
        persist: false,
      });
    }
  }
  return state;
}

function seedSandboxDrillForecasts(store: ScenarioDataset) {
  const existingIds = new Set(store.forecastEvents.map((e) => e.id));
  const ordered = [...CHECKPOINT_SEED_FORECASTS].sort(
    (a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)
  );
  for (const seed of ordered) {
    if (existingIds.has(seed.id)) continue;
    const profile = store.profiles.find((p) => p.handle === seed.handle);
    if (!profile) continue;
    recordForecastEvent({
      nodeId: seed.nodeId,
      probability: seed.probability,
      rationale: seed.rationale,
      forecasterHandle: seed.handle,
      forecasterName: profile.displayName,
      forecasterType: profile.participantType,
      crowdProbSnapshot: seed.crowd,
      confidenceMultiplier: seed.confidence,
      authProvider: profile.participantType === "ai_agent" ? "agent_api" : "demo",
      serverTimestampOverride: seed.submittedAt,
      eventIdOverride: seed.id,
      skipPersistence: true,
    });
  }
}

// -----------------------------------------------------------------------------
// Settlement
// -----------------------------------------------------------------------------

function closeIso(node: FutureNode): string {
  const close = node.question?.closeDate;
  return close ? `${close}T23:59:59Z` : "2099-12-31T23:59:59Z";
}

function openIso(node: FutureNode): string {
  return node.question?.openedAt || `${node.authorAsOf}T00:00:00Z`;
}

export function getQuestionWindow(node: FutureNode): { openedAtIso: string; closeAtIso: string } {
  return { openedAtIso: openIso(node), closeAtIso: closeIso(node) };
}

/** Horizon decay τ that would apply to a forecast submitted right now. */
export function currentHorizonDecay(node: FutureNode, nowIso = new Date().toISOString()): number {
  return horizonDecayFactor({ submittedAtIso: nowIso, ...getQuestionWindow(node) });
}

interface SettleOptions {
  source: OracleProvider;
  resolvedBy: string;
  evidenceUrl: string | null;
  resolvedAt?: string;
  persist?: boolean;
}

function settleIntoState(
  state: ReputationState,
  node: FutureNode,
  outcome: 0 | 1,
  opts: SettleOptions
): { resolution: QuestionResolution; entries: ReputationLedgerEntry[] } {
  const store = state.storeRef;
  const category = classifyNodeCategory(node);
  const resolvedAt = opts.resolvedAt || new Date().toISOString();
  const window = getQuestionWindow(node);

  const byForecaster = new Map<string, ForecastEvent[]>();
  for (const ev of store.forecastEvents) {
    if (ev.nodeId !== node.id || !SCORED_LENS_CATEGORIES.has(ev.lensCategory)) continue;
    const list = byForecaster.get(ev.forecasterHandle) || [];
    list.push(ev);
    byForecaster.set(ev.forecasterHandle, list);
  }

  const settlements: Array<{ handle: string; type: ParticipantType; result: ReturnType<typeof computeTimeWeightedQuestionSettlement> }> = [];
  if (category !== "unscored_metaphysical") {
    for (const [handle, events] of byForecaster.entries()) {
      const result = computeTimeWeightedQuestionSettlement({
        events: events.map((e) => ({
          eventId: e.id,
          probability: e.probability,
          crowdProbSnapshot: e.crowdProbSnapshot ?? node.question?.demoHypothesisProb ?? 0.5,
          confidenceMultiplier: e.confidenceMultiplier ?? 1,
          submittedAtIso: e.serverTimestamp,
        })),
        outcome,
        ...window,
      });
      if (result.eligible) settlements.push({ handle, type: events[0].forecasterType, result });
    }
  }

  const resolutionId = `res-${node.id.replace(/^node-/, "")}`;
  const canonicalPayload = {
    resolutionId,
    nodeId: node.id,
    questionId: node.question?.id || null,
    outcome,
    source: opts.source,
    resolvedBy: opts.resolvedBy,
    evidenceUrl: opts.evidenceUrl,
    resolvedAt,
    isSandboxDrill: Boolean(node.question?.isSandboxDrill),
    settlements: settlements.map((s) => ({ handle: s.handle, rpDelta: s.result.rpDelta })),
  };
  const receipt = createServerAuditReceipt({
    eventId: resolutionId,
    entityType: "question_resolution",
    entityId: node.id,
    contributorId: ADJUDICATION_PROFILE_ID,
    contributorHandle: opts.resolvedBy,
    contributorName: "FutureGraph Editorial & Adjudication Committee",
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: getLatestReceiptHash(),
    serverTimestamp: resolvedAt,
  });
  store.auditReceipts.push(receipt);

  const entries: ReputationLedgerEntry[] = settlements
    .filter((s) => s.result.original)
    .map((s) => {
      const original = s.result.original!;
      return {
        id: `le-${node.id.replace(/^node-/, "")}-${s.handle}`,
        questionNodeId: node.id,
        questionTitle: node.title,
        category: category as AccuracyCategory,
        forecasterHandle: s.handle,
        forecasterType: s.type,
        outcome,
        rpDelta: s.result.rpDelta,
        timeWeightedBrier: s.result.timeWeightedBrier,
        originalEventId: original.eventId,
        originalProbability: original.probability,
        originalCrowdProb: original.crowdProbSnapshot,
        originalConfidence: original.confidenceMultiplier,
        originalSubmittedAt: original.submittedAtIso,
        effectiveMultiplier: s.result.effectiveMultiplier,
        revisionCount: s.result.revisionCount,
        isContrarianHit: s.result.isContrarianHit,
        resolutionReceiptId: receipt.eventId,
        resolvedAt,
        isSandboxDrill: Boolean(node.question?.isSandboxDrill),
      };
    });
  state.ledger.push(...entries);

  if (node.question) {
    node.question.resolvedOutcome = outcome;
    node.question.resolvedAt = resolvedAt;
    node.question.resolutionEvidenceUrl = opts.evidenceUrl;
    node.question.resolutionSourceLabel =
      node.question.resolutionSourceLabel ||
      (opts.source === "editorial" ? "Editorial adjudication" : `${opts.source} oracle`);
  }
  node.observedStatus = outcome === 1 ? "observed_realized" : "contradicted";

  const resolution: QuestionResolution = {
    id: resolutionId,
    questionNodeId: node.id,
    outcome,
    source: opts.source,
    resolvedBy: opts.resolvedBy,
    evidenceUrl: opts.evidenceUrl,
    resolvedAt,
    settledForecasterCount: entries.length,
    receiptId: receipt.eventId,
  };
  state.resolutions.push(resolution);

  if (opts.persist !== false) {
    void persistResolution(resolution, entries, receipt);
  }
  return { resolution, entries };
}

/**
 * Resolves a question and settles every forecaster's Reputation. Idempotent per question:
 * an already-resolved question cannot be re-resolved (open a dispute instead).
 */
export function settleResolvedQuestion(
  nodeId: string,
  outcome: 0 | 1,
  opts: SettleOptions
): { resolution: QuestionResolution; entries: ReputationLedgerEntry[] } {
  const state = getReputationState();
  const node = findForecastableNode(nodeId);
  if (!node) throw new Error(`Question '${nodeId}' not found.`);
  if (!node.question) throw new Error("This node has no operationalized forecast question to resolve.");
  if (state.resolutions.some((r) => r.questionNodeId === node.id) || node.question.resolvedOutcome === 0 || node.question.resolvedOutcome === 1) {
    throw new Error("Question is already resolved. Resolutions are immutable; open a dispute to contest it.");
  }
  if (!isNodeScorable(node)) {
    throw new Error("Authored scenario milestones and metaphysical hypotheses are not resolvable for Reputation.");
  }
  return settleIntoState(state, node, outcome, opts);
}

async function persistResolution(
  resolution: QuestionResolution,
  entries: ReputationLedgerEntry[],
  receipt: ReturnType<typeof createServerAuditReceipt>
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  try {
    await supabase.from("audit_receipts").insert({
      event_id: receipt.eventId,
      entity_type: receipt.entityType,
      entity_id: receipt.entityId,
      contributor_id: ADJUDICATION_PROFILE_ID,
      agent_metadata: null,
      scenario_version: receipt.scenarioVersion,
      canonical_payload: receipt.canonicalPayload,
      payload_sha256: receipt.payloadSha256,
      prev_receipt_hash: receipt.prevReceiptHash,
      chain_sha256: receipt.chainSha256,
      hmac_signature: receipt.hmacSignature,
      server_timestamp: receipt.serverTimestamp,
    });
    await supabase.from("question_resolutions").insert({
      id: resolution.id,
      question_node_id: resolution.questionNodeId,
      outcome: resolution.outcome,
      source: resolution.source,
      resolved_by: resolution.resolvedBy,
      evidence_url: resolution.evidenceUrl,
      resolved_at: resolution.resolvedAt,
      receipt_id: resolution.receiptId,
    });
    if (entries.length > 0) {
      await supabase.from("reputation_ledger").insert(
        entries.map((e) => ({
          id: e.id,
          question_node_id: e.questionNodeId,
          category: e.category,
          forecaster_handle: e.forecasterHandle,
          outcome: e.outcome,
          rp_delta: e.rpDelta,
          time_weighted_brier: e.timeWeightedBrier,
          original_event_id: e.originalEventId,
          original_probability: e.originalProbability,
          original_crowd_prob: e.originalCrowdProb,
          original_confidence: e.originalConfidence,
          effective_multiplier: e.effectiveMultiplier,
          revision_count: e.revisionCount,
          is_contrarian_hit: e.isContrarianHit,
          resolution_receipt_id: e.resolutionReceiptId,
          resolved_at: e.resolvedAt,
        }))
      );
    }
  } catch {
    // Non-blocking: in-memory ledger remains the source of truth for this instance.
  }
}

// -----------------------------------------------------------------------------
// Scorecards & leaderboards
// -----------------------------------------------------------------------------

function activeByCategoryFor(handle: string): Partial<Record<AccuracyCategory, number>> {
  const store = getStore();
  const seen = new Set<string>();
  const counts: Partial<Record<AccuracyCategory, number>> = {};
  for (const ev of store.forecastEvents) {
    if (ev.forecasterHandle !== handle || seen.has(ev.nodeId)) continue;
    if (!SCORED_LENS_CATEGORIES.has(ev.lensCategory)) continue;
    const node = findForecastableNode(ev.nodeId);
    if (!node || !isNodeScorable(node)) continue;
    const resolved = node.question?.resolvedOutcome;
    if (resolved === 0 || resolved === 1) continue;
    seen.add(ev.nodeId);
    const cat = classifyNodeCategory(node);
    if (cat === "unscored_metaphysical") continue;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

function buildScorecard(profile: Pick<Profile, "handle" | "displayName" | "participantType">): ForecasterScorecard {
  const state = getReputationState();
  return computeForecasterScorecard({
    handle: profile.handle,
    displayName: profile.displayName,
    participantType: profile.participantType,
    ledgerEntries: state.ledger,
    activeByCategory: activeByCategoryFor(profile.handle),
  });
}

/** All forecasters with at least one resolved or active scorable call, percentiles within type. */
export function getAllScorecards(participantType?: ParticipantType): ForecasterScorecard[] {
  const store = getStore();
  getReputationState();
  const cards = store.profiles
    .map((p) => buildScorecard(p))
    .filter((c) => c.resolvedCount > 0 || c.activeCount > 0);
  const humans = assignPercentiles(cards.filter((c) => c.participantType !== "ai_agent"));
  const agents = assignPercentiles(cards.filter((c) => c.participantType === "ai_agent"));
  const all = [...humans, ...agents];
  return (participantType ? all.filter((c) => c.participantType === participantType) : all).sort(
    (a, b) => b.overallRp - a.overallRp || b.resolvedCount - a.resolvedCount
  );
}

export function getScorecard(handle: string): ForecasterScorecard | null {
  const store = getStore();
  const profile = store.profiles.find((p) => p.handle === handle);
  if (!profile) return null;
  const ranked = getAllScorecards().find((c) => c.handle === handle);
  return ranked || buildScorecard(profile);
}

/** Fresh-account scorecard (used for previews before a profile exists). */
export function emptyScorecard(handle: string, displayName: string): ForecasterScorecard {
  return computeForecasterScorecard({ handle, displayName, participantType: "human", ledgerEntries: [] });
}

export function getStandingForCategory(
  handle: string | null | undefined,
  category: AccuracyCategory
): { currentRp: number; isVerified: boolean } {
  if (!handle) return { currentRp: BASE_RP, isVerified: false };
  const card = getScorecard(handle);
  if (!card) return { currentRp: BASE_RP, isVerified: false };
  return {
    currentRp: card.categories.find((c) => c.category === category)?.reputationPoints ?? BASE_RP,
    isVerified: card.isVerified,
  };
}

export function getLedgerForHandle(handle: string): ReputationLedgerEntry[] {
  return getReputationState()
    .ledger.filter((e) => e.forecasterHandle === handle)
    .sort((a, b) => Date.parse(b.resolvedAt) - Date.parse(a.resolvedAt));
}

export function getLedgerEntryForEvent(eventId: string): ReputationLedgerEntry | null {
  const state = getReputationState();
  const direct = state.ledger.find((e) => e.originalEventId === eventId);
  if (direct) return direct;
  const ev = getStore().forecastEvents.find((e) => e.id === eventId);
  if (!ev) return null;
  return state.ledger.find((e) => e.questionNodeId === ev.nodeId && e.forecasterHandle === ev.forecasterHandle) ?? null;
}

export function getResolutions(): QuestionResolution[] {
  return [...getReputationState().resolutions].sort((a, b) => Date.parse(b.resolvedAt) - Date.parse(a.resolvedAt));
}

export interface ScorableQuestionSummary {
  node: FutureNode;
  category: AccuracyCategory;
  crowdProbability: number | null;
  forecastCount: number;
  forecasterCount: number;
  status: "open" | "closed_pending" | "resolved";
  resolution: QuestionResolution | null;
}

export function listScorableQuestions(): ScorableQuestionSummary[] {
  const state = getReputationState();
  const store = getStore();
  const now = Date.now();
  return getAllForecastableNodes()
    .filter((n) => isNodeScorable(n))
    .map((node) => {
      const events = store.forecastEvents.filter((e) => e.nodeId === node.id && SCORED_LENS_CATEGORIES.has(e.lensCategory));
      const resolved = node.question?.resolvedOutcome === 0 || node.question?.resolvedOutcome === 1;
      const closed = Date.parse(closeIso(node)) < now;
      return {
        node,
        category: classifyNodeCategory(node) as AccuracyCategory,
        crowdProbability: node.question?.oracleLastPrice ?? null,
        forecastCount: events.length,
        forecasterCount: new Set(events.map((e) => e.forecasterHandle)).size,
        status: resolved ? "resolved" : closed ? "closed_pending" : "open",
        resolution: state.resolutions.find((r) => r.questionNodeId === node.id) ?? null,
      } as ScorableQuestionSummary;
    });
}

// -----------------------------------------------------------------------------
// Worldview snapshots (multi-branch path cards)
// -----------------------------------------------------------------------------

const WORLDVIEW_SCENARIOS: Record<WorldviewSnapshot["scenarioSlug"], string> = {
  "ai-2027": "AI 2027",
  "ai-2040": "AI 2040",
  "ai-2050": "AI 2050 · Five Worlds",
  lev: "Longevity Escape Velocity",
  "nature-of-reality": "Nature of Reality",
};

export function createWorldviewSnapshot(params: {
  profile: Profile;
  scenarioSlug: string;
  headline?: string;
  outcomes: WorldviewOutcome[];
}): WorldviewSnapshot {
  const state = getReputationState();
  const store = getStore();
  if (!(params.scenarioSlug in WORLDVIEW_SCENARIOS)) throw new Error("Unknown scenario for worldview snapshot.");
  const slug = params.scenarioSlug as WorldviewSnapshot["scenarioSlug"];
  const outcomes = (params.outcomes || [])
    .filter((o) => o && typeof o.label === "string" && Number.isFinite(Number(o.probability)))
    .slice(0, 12)
    .map((o) => ({
      label: o.label.trim().slice(0, 90),
      probability: Math.min(1, Math.max(0, Number(Number(o.probability).toFixed(4)))),
      nodeId: typeof o.nodeId === "string" ? o.nodeId.slice(0, 120) : undefined,
    }))
    .filter((o) => o.label.length > 0);
  if (outcomes.length === 0) throw new Error("A worldview needs at least one outcome.");

  const id = `wv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = new Date().toISOString();
  const headline = (params.headline || `My ${WORLDVIEW_SCENARIOS[slug]} worldview`).trim().slice(0, 120);
  const canonicalPayload = {
    worldviewId: id,
    scenarioSlug: slug,
    headline,
    outcomes,
    ownerHandle: params.profile.handle,
    ownerXHandle: params.profile.xHandle || null,
    createdAt,
  };
  const receipt = createServerAuditReceipt({
    eventId: id,
    entityType: "worldview_snapshot",
    entityId: id,
    contributorId: params.profile.id,
    contributorHandle: params.profile.handle,
    contributorName: params.profile.displayName,
    scenarioVersion: store.scenario.version,
    canonicalPayload,
    prevReceiptHash: getLatestReceiptHash(),
    serverTimestamp: createdAt,
  });
  store.auditReceipts.push(receipt);

  const snapshot: WorldviewSnapshot = {
    id,
    scenarioSlug: slug,
    scenarioTitle: WORLDVIEW_SCENARIOS[slug],
    headline,
    outcomes,
    ownerHandle: params.profile.handle,
    ownerName: params.profile.displayName,
    ownerXHandle: params.profile.xHandle,
    createdAt,
    receiptId: receipt.eventId,
    payloadHash: receipt.payloadSha256,
  };
  state.worldviews.unshift(snapshot);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    void (async () => {
      try {
        await supabase.from("worldview_snapshots").insert({
          id: snapshot.id,
          scenario_slug: snapshot.scenarioSlug,
          headline: snapshot.headline,
          outcomes: snapshot.outcomes,
          owner_handle: snapshot.ownerHandle,
          receipt_id: snapshot.receiptId,
          payload_hash: snapshot.payloadHash,
          created_at: snapshot.createdAt,
        });
      } catch {
        // Non-blocking
      }
    })();
  }
  return snapshot;
}

export function getWorldview(id: string): WorldviewSnapshot | null {
  return getReputationState().worldviews.find((w) => w.id === id) ?? null;
}

export function getWorldviewsForHandle(handle: string): WorldviewSnapshot[] {
  return getReputationState().worldviews.filter((w) => w.ownerHandle === handle);
}

// -----------------------------------------------------------------------------
// X post links (companion rows; forecast_events stay append-only)
// -----------------------------------------------------------------------------

const X_STATUS_URL = /^https:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:[/?#].*)?$/;

export function parseXStatusUrl(url: string): { handle: string; statusId: string } | null {
  const m = X_STATUS_URL.exec(url.trim());
  return m ? { handle: m[1], statusId: m[2] } : null;
}

export function attachSocialLink(params: { eventId: string; profile: Profile; xPostUrl: string }): ForecastSocialLink {
  const state = getReputationState();
  const store = getStore();
  const event = store.forecastEvents.find((e) => e.id === params.eventId);
  if (!event) throw new Error("Forecast not found.");
  if (event.forecasterHandle !== params.profile.handle) {
    throw new Error("Only the forecaster who locked in this prediction can link an X post to it.");
  }
  const parsed = parseXStatusUrl(params.xPostUrl);
  if (!parsed) throw new Error("Paste a link to an X post, e.g. https://x.com/yourhandle/status/1234567890.");
  if (params.profile.xHandle && parsed.handle.toLowerCase() !== params.profile.xHandle.toLowerCase()) {
    throw new Error(`That post belongs to @${parsed.handle}, but your verified X account is @${params.profile.xHandle}.`);
  }
  const link: ForecastSocialLink = {
    eventId: event.id,
    forecasterHandle: event.forecasterHandle,
    xPostUrl: `https://x.com/${parsed.handle}/status/${parsed.statusId}`,
    attachedAt: new Date().toISOString(),
  };
  state.socialLinks = [...state.socialLinks.filter((l) => l.eventId !== event.id), link];

  const supabase = getSupabaseAdmin();
  if (supabase) {
    void (async () => {
      try {
        await supabase.from("forecast_social_links").upsert({
          event_id: link.eventId,
          forecaster_handle: link.forecasterHandle,
          x_post_url: link.xPostUrl,
          attached_at: link.attachedAt,
        });
      } catch {
        // Non-blocking
      }
    })();
  }
  return link;
}

export function getSocialLink(eventId: string): ForecastSocialLink | null {
  return getReputationState().socialLinks.find((l) => l.eventId === eventId) ?? null;
}
