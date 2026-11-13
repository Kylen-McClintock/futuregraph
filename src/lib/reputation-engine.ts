/**
 * FutureGraph Reputation Engine (pure, dependency-free math).
 *
 * Scoring rule — Strictly Proper Hybrid Log Score × Conviction Wager × Horizon Decay:
 *
 *   BaseRP(p, q, o) = 50·log2(p_o / q_o) + 50·log2(p_o / 0.5)
 *   ΔRP            = round( M · τ(t) · BaseRP )
 *
 * where p is the forecaster's probability, q the community/market consensus snapshotted at
 * lock-in, o ∈ {0,1} the resolved outcome, p_o / q_o the probabilities assigned to the
 * realized outcome, M ∈ [0.25, 3] the conviction multiplier from the confidence slider, and
 * τ(t) ∈ [0.10, 1] the anti-sniping horizon decay.
 *
 * Because BaseRP is an affine transform of the logarithmic score in p (the q- and 0.5-terms are
 * constants with respect to p), and M·τ is a positive scalar, expected ΔRP is uniquely maximized
 * by reporting one's true belief. Conviction scales the stakes without rewarding exaggeration.
 */
import type {
  AccuracyCategory,
  CategoryScoreSummary,
  ForecasterScorecard,
  ForecasterTier,
  FutureNode,
  NodeScoringCategory,
  ParticipantType,
  ReputationLedgerEntry,
} from "@/types/futuregraph";

export const BASE_RP = 1000;
export const RP_FLOOR = 100;
export const PROB_MIN = 0.01;
export const PROB_MAX = 0.99;
export const CONFIDENCE_MIN = 0.25;
export const CONFIDENCE_MAX = 3.0;
export const CONFIDENCE_DEFAULT = 1.0;
/** Provisional (unverified) accounts cannot wager above this multiplier (anti-burner guardrail). */
export const PROVISIONAL_CONFIDENCE_CAP = 1.5;
export const VERIFIED_MIN_RESOLVED_OVERALL = 5;
export const VERIFIED_MIN_RESOLVED_CATEGORY = 3;
/** Final share of the forecasting window during which new positions decay toward HORIZON_DECAY_FLOOR. */
export const HORIZON_DECAY_WINDOW_SHARE = 0.25;
export const HORIZON_DECAY_FLOOR = 0.1;

export const ACCURACY_CATEGORIES: Array<{
  id: AccuracyCategory;
  label: string;
  shortLabel: string;
  color: string;
}> = [
  { id: "agi_capabilities", label: "AGI & Capabilities", shortLabel: "AGI", color: "#f59e0b" },
  { id: "ai_safety", label: "AI Safety & Alignment", shortLabel: "Safety", color: "#f43f5e" },
  { id: "governance_geopolitics", label: "Governance & Geopolitics", shortLabel: "Governance", color: "#38bdf8" },
  { id: "economy_society", label: "Economy & Society", shortLabel: "Economy", color: "#10b981" },
  { id: "longevity_biotech", label: "Longevity & Biotech", shortLabel: "Longevity", color: "#a855f7" },
  { id: "science_frontier", label: "Science & Frontier Tech", shortLabel: "Science", color: "#94a3b8" },
];

export function categoryLabel(category: NodeScoringCategory): string {
  if (category === "unscored_metaphysical") return "Unscored (Metaphysical)";
  return ACCURACY_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export function categoryColor(category: NodeScoringCategory): string {
  return ACCURACY_CATEGORIES.find((c) => c.id === category)?.color ?? "#64748b";
}

// -----------------------------------------------------------------------------
// Core scoring primitives
// -----------------------------------------------------------------------------

export function clampProbability(p: number): number {
  if (!Number.isFinite(p)) return 0.5;
  return Math.min(PROB_MAX, Math.max(PROB_MIN, p));
}

/** Probability that the forecast assigned to the outcome that actually occurred. */
export function probabilityOfOutcome(p: number, outcome: 0 | 1): number {
  const c = clampProbability(p);
  return outcome === 1 ? c : 1 - c;
}

/** Unscaled Hybrid Log Score (50% crowd-edge + 50% absolute calibration), in Reputation Points. */
export function computeBaseRp(probability: number, crowdProbability: number, outcome: 0 | 1): number {
  const pO = probabilityOfOutcome(probability, outcome);
  const qO = probabilityOfOutcome(crowdProbability, outcome);
  return 50 * Math.log2(pO / qO) + 50 * Math.log2(pO / 0.5);
}

export function clampConfidence(multiplier: number, isVerified: boolean): number {
  const cap = isVerified ? CONFIDENCE_MAX : PROVISIONAL_CONFIDENCE_CAP;
  if (!Number.isFinite(multiplier)) return CONFIDENCE_DEFAULT;
  return Math.min(cap, Math.max(CONFIDENCE_MIN, multiplier));
}

export function confidenceLabel(multiplier: number): string {
  if (multiplier < 0.75) return "Exploratory";
  if (multiplier < 1.25) return "Standard";
  if (multiplier < 1.75) return "Confident";
  if (multiplier < 2.5) return "High Conviction";
  return "Signature Call";
}

/**
 * Anti-sniping horizon decay τ(t): full weight until the final 25% of the forecasting window,
 * then linear decay down to 0.10× at the close date. Forecasts after close are ineligible (0).
 */
export function horizonDecayFactor(params: {
  submittedAtIso: string;
  openedAtIso: string;
  closeAtIso: string;
}): number {
  const t = Date.parse(params.submittedAtIso);
  const open = Date.parse(params.openedAtIso);
  const close = Date.parse(params.closeAtIso);
  if (!Number.isFinite(t) || !Number.isFinite(close)) return 1;
  if (t > close) return 0;
  const span = Number.isFinite(open) && close > open ? close - open : 0;
  if (span <= 0) return 1;
  const remaining = close - t;
  const raw = remaining / (HORIZON_DECAY_WINDOW_SHARE * span);
  return Math.max(HORIZON_DECAY_FLOOR, Math.min(1, raw));
}

export function applyRpFloor(rp: number): number {
  return Math.max(RP_FLOOR, Math.round(rp));
}

export interface ReputationPreview {
  /** Multiplier actually applied after the provisional cap. */
  effectiveMultiplier: number;
  multiplierWasCapped: boolean;
  horizonDecay: number;
  deltaIfYes: number;
  deltaIfNo: number;
  newRpIfYes: number;
  newRpIfNo: number;
  /** The outcome this forecast leans toward (YES when p ≥ 0.5). */
  favoredOutcome: "YES" | "NO";
  /** How many times more likely than the crowd you think YES is (p / q). */
  contrarianMultiple: number;
  /** Signed probability-point gap between the forecaster and the crowd. */
  edgeVsCrowd: number;
}

/** Live preview powering the dual-slider Reputation Impact Meter before lock-in. */
export function computeProjectedReputationDelta(params: {
  probability: number;
  crowdProbability: number;
  confidenceMultiplier: number;
  currentRp: number;
  isVerified: boolean;
  horizonDecay?: number;
}): ReputationPreview {
  const p = clampProbability(params.probability);
  const q = clampProbability(params.crowdProbability);
  const effectiveMultiplier = clampConfidence(params.confidenceMultiplier, params.isVerified);
  const tau = params.horizonDecay === undefined ? 1 : Math.max(0, Math.min(1, params.horizonDecay));
  const scale = effectiveMultiplier * tau;
  const deltaIfYes = Math.round(scale * computeBaseRp(p, q, 1));
  const deltaIfNo = Math.round(scale * computeBaseRp(p, q, 0));
  return {
    effectiveMultiplier,
    multiplierWasCapped: effectiveMultiplier < params.confidenceMultiplier - 1e-9,
    horizonDecay: tau,
    deltaIfYes,
    deltaIfNo,
    newRpIfYes: applyRpFloor(params.currentRp + deltaIfYes),
    newRpIfNo: applyRpFloor(params.currentRp + deltaIfNo),
    favoredOutcome: p >= 0.5 ? "YES" : "NO",
    contrarianMultiple: Number((p / q).toFixed(2)),
    edgeVsCrowd: Number((p - q).toFixed(4)),
  };
}

// -----------------------------------------------------------------------------
// Time-weighted settlement across append-only revisions
// -----------------------------------------------------------------------------

export interface SettlementForecastInput {
  eventId: string;
  probability: number;
  crowdProbSnapshot: number;
  confidenceMultiplier: number;
  submittedAtIso: string;
}

export interface QuestionSettlement {
  eligible: boolean;
  rpDelta: number;
  timeWeightedBrier: number;
  effectiveMultiplier: number;
  revisionCount: number;
  original: SettlementForecastInput | null;
  segments: Array<{
    eventId: string;
    weight: number;
    horizonDecay: number;
    baseRp: number;
    contribution: number;
  }>;
  isContrarianHit: boolean;
}

/**
 * Integrates a forecaster's append-only revisions on one question. Each revision holds from its
 * timestamp until the next revision (or the close date) and is weighted by that duration share
 * and by its own entry horizon decay τ(t_k). Calling it early and holding earns full weight;
 * late updates only affect the remaining sliver of the window.
 */
export function computeTimeWeightedQuestionSettlement(params: {
  events: SettlementForecastInput[];
  outcome: 0 | 1;
  openedAtIso: string;
  closeAtIso: string;
}): QuestionSettlement {
  const closeMs = Date.parse(params.closeAtIso);
  const eligible = params.events
    .filter((e) => Number.isFinite(Date.parse(e.submittedAtIso)))
    .filter((e) => !Number.isFinite(closeMs) || Date.parse(e.submittedAtIso) <= closeMs)
    .sort((a, b) => Date.parse(a.submittedAtIso) - Date.parse(b.submittedAtIso));

  if (eligible.length === 0) {
    return {
      eligible: false,
      rpDelta: 0,
      timeWeightedBrier: 0,
      effectiveMultiplier: 0,
      revisionCount: 0,
      original: null,
      segments: [],
      isContrarianHit: false,
    };
  }

  const firstMs = Date.parse(eligible[0].submittedAtIso);
  const endMs = Number.isFinite(closeMs) ? closeMs : Date.parse(eligible[eligible.length - 1].submittedAtIso);
  const totalSpan = Math.max(0, endMs - firstMs);

  let rpDelta = 0;
  let brier = 0;
  let effMult = 0;
  const segments: QuestionSettlement["segments"] = [];

  eligible.forEach((ev, idx) => {
    const startMs = Date.parse(ev.submittedAtIso);
    const nextMs = idx + 1 < eligible.length ? Date.parse(eligible[idx + 1].submittedAtIso) : endMs;
    const weight =
      totalSpan > 0
        ? Math.max(0, nextMs - startMs) / totalSpan
        : idx === eligible.length - 1
        ? 1
        : 0;
    const tau = horizonDecayFactor({
      submittedAtIso: ev.submittedAtIso,
      openedAtIso: params.openedAtIso,
      closeAtIso: params.closeAtIso,
    });
    const mult = Math.min(CONFIDENCE_MAX, Math.max(CONFIDENCE_MIN, ev.confidenceMultiplier || 1));
    const baseRp = computeBaseRp(ev.probability, ev.crowdProbSnapshot, params.outcome);
    const contribution = weight * mult * tau * baseRp;
    rpDelta += contribution;
    brier += weight * Math.pow(clampProbability(ev.probability) - params.outcome, 2);
    effMult += weight * mult * tau;
    segments.push({ eventId: ev.eventId, weight, horizonDecay: tau, baseRp, contribution });
  });

  const original = eligible[0];
  const crowdOnRealized = probabilityOfOutcome(original.crowdProbSnapshot, params.outcome);
  const forecasterOnRealized = probabilityOfOutcome(original.probability, params.outcome);
  const roundedDelta = Math.round(rpDelta);

  return {
    eligible: true,
    rpDelta: roundedDelta,
    timeWeightedBrier: Number(brier.toFixed(4)),
    effectiveMultiplier: Number(effMult.toFixed(3)),
    revisionCount: eligible.length,
    original,
    segments,
    isContrarianHit:
      roundedDelta > 0 && crowdOnRealized < 0.5 && forecasterOnRealized - crowdOnRealized >= 0.15,
  };
}

// -----------------------------------------------------------------------------
// Tiers, verification & scorecards
// -----------------------------------------------------------------------------

export function tierForRp(rp: number, isVerified: boolean): ForecasterTier {
  if (!isVerified) return "provisional";
  if (rp >= 1600) return "oracle";
  if (rp >= 1350) return "superforecaster";
  if (rp >= 1150) return "sharp";
  if (rp >= 1000) return "calibrated";
  return "developing";
}

export function tierLabel(tier: ForecasterTier): string {
  switch (tier) {
    case "oracle":
      return "Oracle";
    case "superforecaster":
      return "Superforecaster";
    case "sharp":
      return "Sharp";
    case "calibrated":
      return "Calibrated";
    case "developing":
      return "Developing";
    default:
      return "Provisional";
  }
}

/** Percent of the population strictly below `value`, plus half of ties (mid-rank percentile). */
export function percentileRank(value: number, population: number[]): number | null {
  if (population.length < 2) return null;
  let below = 0;
  let equal = 0;
  for (const v of population) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  return Math.round(((below + 0.5 * equal) / population.length) * 100);
}

export function computeForecasterScorecard(params: {
  handle: string;
  displayName: string;
  participantType: ParticipantType;
  ledgerEntries: ReputationLedgerEntry[];
  activeByCategory?: Partial<Record<AccuracyCategory, number>>;
}): ForecasterScorecard {
  const entries = params.ledgerEntries.filter((e) => e.forecasterHandle === params.handle);
  const resolvedCount = entries.length;
  const isVerified = resolvedCount >= VERIFIED_MIN_RESOLVED_OVERALL;
  const overallRp = applyRpFloor(BASE_RP + entries.reduce((s, e) => s + e.rpDelta, 0));
  const activeByCategory = params.activeByCategory || {};
  const activeCount = Object.values(activeByCategory).reduce((s, n) => s + (n || 0), 0);

  const categories: CategoryScoreSummary[] = ACCURACY_CATEGORIES.map((cat) => {
    const catEntries = entries.filter((e) => e.category === cat.id);
    const rp = applyRpFloor(BASE_RP + catEntries.reduce((s, e) => s + e.rpDelta, 0));
    const catVerified = catEntries.length >= VERIFIED_MIN_RESOLVED_CATEGORY;
    return {
      category: cat.id,
      label: cat.label,
      reputationPoints: rp,
      resolvedCount: catEntries.length,
      activeCount: activeByCategory[cat.id] || 0,
      avgBrier:
        catEntries.length > 0
          ? Number((catEntries.reduce((s, e) => s + e.timeWeightedBrier, 0) / catEntries.length).toFixed(4))
          : null,
      isVerified: catVerified,
      tier: tierForRp(rp, catVerified),
      percentile: null,
    };
  });

  const bestCall =
    [...entries]
      .filter((e) => e.rpDelta > 0)
      .sort((a, b) => Number(b.isContrarianHit) - Number(a.isContrarianHit) || b.rpDelta - a.rpDelta)[0] ?? null;

  const tier = tierForRp(overallRp, isVerified);
  return {
    handle: params.handle,
    displayName: params.displayName,
    participantType: params.participantType,
    overallRp,
    resolvedCount,
    activeCount,
    wins: entries.filter((e) => e.rpDelta > 0).length,
    losses: entries.filter((e) => e.rpDelta < 0).length,
    avgBrier:
      resolvedCount > 0
        ? Number((entries.reduce((s, e) => s + e.timeWeightedBrier, 0) / resolvedCount).toFixed(4))
        : null,
    isVerified,
    tier,
    tierLabel: tierLabel(tier),
    percentile: null,
    categories,
    bestCall,
    includesSandboxDrills: entries.some((e) => e.isSandboxDrill),
  };
}

/** Fills overall + per-category percentiles across a population of scorecards (same participant type). */
export function assignPercentiles(cards: ForecasterScorecard[]): ForecasterScorecard[] {
  const ranked = cards.filter((c) => c.resolvedCount > 0);
  const overallPop = ranked.map((c) => c.overallRp);
  return cards.map((card) => {
    if (card.resolvedCount === 0) return card;
    return {
      ...card,
      percentile: percentileRank(card.overallRp, overallPop),
      categories: card.categories.map((cat) => {
        if (cat.resolvedCount === 0) return cat;
        const pop = ranked
          .map((c) => c.categories.find((x) => x.category === cat.category))
          .filter((x): x is CategoryScoreSummary => !!x && x.resolvedCount > 0)
          .map((x) => x.reputationPoints);
        return { ...cat, percentile: percentileRank(cat.reputationPoints, pop) };
      }),
    };
  });
}

// -----------------------------------------------------------------------------
// Category classification
// -----------------------------------------------------------------------------

/** Explicit overrides for seeded nodes where keyword heuristics would misfire. */
const NODE_CATEGORY_OVERRIDES: Record<string, NodeScoringCategory> = {
  "node-mid-2025-stumbling-agents": "agi_capabilities",
  "node-early-2026-coding-automation": "agi_capabilities",
  "node-mar-2027-algorithmic-breakthroughs": "agi_capabilities",
  "node-sep-2027-agent-4-superhuman-ai-researcher": "agi_capabilities",
  "node-supp-takeoff-sc-to-sar-case1": "agi_capabilities",
  "node-bench-tai-by-2030": "agi_capabilities",
  "node-supp-security-sl5-stargate": "governance_geopolitics",
  "node-feb-2027-china-steals-agent-2": "governance_geopolitics",
  "node-may-2027-national-security": "governance_geopolitics",
  "node-multi-parent-us-china-treaty-2029": "governance_geopolitics",
  "node-oct-2027-government-oversight-fork": "governance_geopolitics",
  "node-slowdown-3-hem-verified-us-china-treaty": "governance_geopolitics",
  "node-2040-2030-plan-a": "governance_geopolitics",
  "node-2040-2030-plan-b": "governance_geopolitics",
  "node-2040-2038-perm-cap": "governance_geopolitics",
  "node-bench-unemployment-2033": "economy_society",
  "node-2050-q1-fizzle": "agi_capabilities",
  "node-2050-q2-civ-continue": "ai_safety",
  "node-2050-q3a-civ-good": "economy_society",
  "node-2050-q3b-singularity-good": "ai_safety",
};

const CATEGORY_KEYWORDS: Array<[NodeScoringCategory, RegExp]> = [
  ["longevity_biotech", /\blongevity|\baging\b|\bageing\b|lifespan|healthspan|rejuvenat|biotech|epigenetic|clinical trial|\bLEV\b/i],
  ["ai_safety", /align|misalign|safety|interpretab|loss of (human )?control|scheming|schemer|sycophan|bioweapon|extinction|paperclip|takeover|disempower|exfiltrat/i],
  ["governance_geopolitics", /treaty|govern|oversight|regulat|statute|legislat|china|national security|geopolit|weights? (theft|steal)|steals|whistleblow|moratorium|licens|pact|containment|sabotage|cold war|shutdown|pause|military|accord|executive order/i],
  ["economy_society", /unemploy|labor|labour|jobs?\b|econom|gdp|abundance|dividend|\btax|workers?|feudal|wage|market cap|stock/i],
  ["science_frontier", /fusion|physics|energy|robot|space|quantum|materials?|semiconductor fab/i],
];

export function classifyNodeCategory(node: Pick<FutureNode, "id" | "title" | "summary"> & {
  accuracyCategory?: NodeScoringCategory;
  scenarioId?: string;
}): NodeScoringCategory {
  if (node.accuracyCategory) return node.accuracyCategory;
  const override = NODE_CATEGORY_OVERRIDES[node.id];
  if (override) return override;
  if (node.scenarioId === "scen-nature-of-reality") return "unscored_metaphysical";
  const text = `${node.title} ${node.summary || ""}`;
  for (const [cat, re] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return "agi_capabilities";
}

/** Whether a node can ever move Reputation (authored milestones & metaphysical hypotheses never do). */
export function isNodeScorable(node: Pick<FutureNode, "nodeType" | "id" | "title" | "summary"> & {
  accuracyCategory?: NodeScoringCategory;
  scenarioId?: string;
  question?: unknown;
}): boolean {
  if (node.nodeType === "scenario_milestone" || node.nodeType === "subjective_hypothesis") return false;
  if (!node.question) return false;
  return classifyNodeCategory(node) !== "unscored_metaphysical";
}

export function formatSignedRp(delta: number): string {
  const rounded = Math.round(delta);
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${Math.abs(rounded).toLocaleString("en-US")} RP`;
}
