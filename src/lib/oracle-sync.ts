/**
 * External resolution oracles: Polymarket (Gamma API) and Metaculus (posts API), with Editorial
 * Admin adjudication as the fallback. Parsers are pure so they can be unit tested offline.
 */
import type { FutureNode, OracleProvider } from "@/types/futuregraph";
import { findForecastableNode, getAllForecastableNodes } from "@/lib/store";
import { settleResolvedQuestion } from "@/lib/reputation-store";

export interface OracleSnapshot {
  status: "open" | "resolved" | "annulled" | "unknown";
  /** Resolved outcome for THIS node (1 = node resolves YES). */
  outcome: 0 | 1 | null;
  /** Live market / community probability that this node resolves YES. */
  probability: number | null;
  title?: string;
}

type Json = Record<string, unknown>;

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

function clamp01(n: number | null): number | null {
  if (n === null) return null;
  return Math.min(1, Math.max(0, n));
}

// -----------------------------------------------------------------------------
// Polymarket (Gamma API)
// -----------------------------------------------------------------------------

export function parsePolymarketMarket(input: unknown, outcomeLabel?: string): OracleSnapshot {
  const market = (Array.isArray(input) ? input[0] : input) as Json | undefined;
  if (!market || typeof market !== "object") return { status: "unknown", outcome: null, probability: null };

  const outcomes = asArray(market.outcomes).map((o) => String(o));
  const prices = asArray(market.outcomePrices).map((p) => toNumber(p));
  const wanted = (outcomeLabel || "Yes").toLowerCase();
  let idx = outcomes.findIndex((o) => o.toLowerCase() === wanted);
  if (idx < 0) idx = 0;
  const price = clamp01(prices[idx] ?? null);

  const closed = market.closed === true;
  const umaStatus = typeof market.umaResolutionStatus === "string" ? market.umaResolutionStatus.toLowerCase() : "";
  const settledPrices = prices.length > 0 && prices.every((p) => p !== null && (p >= 0.99 || p <= 0.01));
  const resolved = closed && (umaStatus === "resolved" || settledPrices);

  let outcome: 0 | 1 | null = null;
  if (resolved && price !== null) {
    if (price >= 0.99) outcome = 1;
    else if (price <= 0.01) outcome = 0;
  }
  return {
    status: resolved ? (outcome === null ? "annulled" : "resolved") : closed ? "unknown" : "open",
    outcome,
    probability: price,
    title: typeof market.question === "string" ? market.question : undefined,
  };
}

// -----------------------------------------------------------------------------
// Metaculus (api/posts/{id}/, with legacy api2 fallback)
// -----------------------------------------------------------------------------

function metaculusLatestProbability(question: Json, outcomeLabel?: string): number | null {
  const aggregations = question.aggregations as Json | undefined;
  const rw = (aggregations?.recency_weighted as Json | undefined)?.latest as Json | undefined;
  if (rw) {
    const values = asArray(rw.forecast_values).map(toNumber);
    if (question.type === "multiple_choice" && outcomeLabel) {
      const options = asArray(question.options).map((o) => String(o).toLowerCase());
      const idx = options.indexOf(outcomeLabel.toLowerCase());
      if (idx >= 0) return clamp01(values[idx] ?? null);
    }
    const centers = asArray(rw.centers).map(toNumber);
    if (centers[0] !== null && centers[0] !== undefined) return clamp01(centers[0]);
    if (values.length === 2) return clamp01(values[1]);
  }
  const legacy = (question.community_prediction as Json | undefined)?.full as Json | undefined;
  return clamp01(toNumber(legacy?.q2));
}

function metaculusOutcome(question: Json, outcomeLabel?: string): { status: OracleSnapshot["status"]; outcome: 0 | 1 | null } {
  const raw = question.resolution;
  const status = String(question.status || "").toLowerCase();
  if (raw === null || raw === undefined || raw === "") {
    return { status: status === "resolved" ? "unknown" : status === "closed" ? "unknown" : "open", outcome: null };
  }
  if (typeof raw === "number") {
    if (raw === 1) return { status: "resolved", outcome: 1 };
    if (raw === 0) return { status: "resolved", outcome: 0 };
    return { status: "annulled", outcome: null };
  }
  const value = String(raw).toLowerCase();
  if (value === "annulled" || value === "ambiguous") return { status: "annulled", outcome: null };
  if (question.type === "multiple_choice" || (outcomeLabel && value !== "yes" && value !== "no")) {
    if (!outcomeLabel) return { status: "unknown", outcome: null };
    return { status: "resolved", outcome: value === outcomeLabel.toLowerCase() ? 1 : 0 };
  }
  if (value === "yes") return { status: "resolved", outcome: 1 };
  if (value === "no") return { status: "resolved", outcome: 0 };
  return { status: "unknown", outcome: null };
}

export function parseMetaculusPost(input: unknown, outcomeLabel?: string): OracleSnapshot {
  const post = input as Json | undefined;
  if (!post || typeof post !== "object") return { status: "unknown", outcome: null, probability: null };

  let question = post.question as Json | undefined;
  // Question groups: pick the sub-question whose label matches the mapped outcome.
  if (!question && post.group_of_questions && outcomeLabel) {
    const subs = asArray((post.group_of_questions as Json).questions) as Json[];
    question = subs.find((q) => String(q.label || q.title || "").toLowerCase() === outcomeLabel.toLowerCase());
    if (question) {
      const sub = metaculusOutcome(question);
      return { ...sub, probability: metaculusLatestProbability(question), title: String(post.title || "") };
    }
  }
  // Legacy api2 questions put the fields at the top level.
  if (!question) question = post;

  const { status, outcome } = metaculusOutcome(question, outcomeLabel);
  return {
    status,
    outcome,
    probability: metaculusLatestProbability(question, outcomeLabel),
    title: typeof post.title === "string" ? post.title : undefined,
  };
}

// -----------------------------------------------------------------------------
// Fetch + sync
// -----------------------------------------------------------------------------

export function defaultOracleUrl(provider: OracleProvider, externalId: string): string | undefined {
  if (provider === "polymarket") {
    return /^\d+$/.test(externalId) ? undefined : `https://polymarket.com/event/${encodeURIComponent(externalId)}`;
  }
  if (provider === "metaculus") return `https://www.metaculus.com/questions/${encodeURIComponent(externalId)}/`;
  return undefined;
}

export async function fetchOracleSnapshot(
  provider: OracleProvider,
  externalId: string,
  outcomeLabel?: string,
  fetchImpl: typeof fetch = fetch
): Promise<OracleSnapshot> {
  if (provider === "polymarket") {
    const url = /^\d+$/.test(externalId)
      ? `https://gamma-api.polymarket.com/markets/${externalId}`
      : `https://gamma-api.polymarket.com/markets?slug=${encodeURIComponent(externalId)}`;
    const res = await fetchImpl(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`Polymarket responded ${res.status}`);
    return parsePolymarketMarket(await res.json(), outcomeLabel);
  }
  if (provider === "metaculus") {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.METACULUS_API_TOKEN) headers.Authorization = `Token ${process.env.METACULUS_API_TOKEN}`;
    const res = await fetchImpl(`https://www.metaculus.com/api/posts/${encodeURIComponent(externalId)}/`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Metaculus responded ${res.status}`);
    return parseMetaculusPost(await res.json(), outcomeLabel);
  }
  throw new Error("Editorial questions have no external oracle to fetch.");
}

export interface OracleSyncReport {
  nodeId: string;
  provider: OracleProvider;
  externalId: string;
  status: OracleSnapshot["status"] | "error" | "settled";
  probability: number | null;
  message: string;
}

export function linkOracle(params: {
  nodeId: string;
  provider: OracleProvider;
  externalId?: string;
  outcomeLabel?: string;
  url?: string;
}): FutureNode {
  const node = findForecastableNode(params.nodeId);
  if (!node?.question) throw new Error("Question not found.");
  if (params.provider === "editorial") {
    node.question.oracleProvider = "editorial";
    node.question.oracleExternalId = undefined;
    node.question.oracleUrl = undefined;
    node.question.oracleOutcomeLabel = undefined;
    node.question.oracleLastPrice = null;
    return node;
  }
  const externalId = (params.externalId || "").trim();
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(externalId)) throw new Error("Enter a valid market ID or slug.");
  node.question.oracleProvider = params.provider;
  node.question.oracleExternalId = externalId;
  node.question.oracleOutcomeLabel = params.outcomeLabel?.trim() || undefined;
  node.question.oracleUrl = params.url?.trim() || defaultOracleUrl(params.provider, externalId);
  return node;
}

export async function syncOracles(options: { nodeIds?: string[]; fetchImpl?: typeof fetch } = {}): Promise<OracleSyncReport[]> {
  const targets = getAllForecastableNodes().filter((n) => {
    const q = n.question;
    if (!q || !q.oracleExternalId || (q.oracleProvider !== "polymarket" && q.oracleProvider !== "metaculus")) return false;
    if (q.resolvedOutcome === 0 || q.resolvedOutcome === 1) return false;
    return !options.nodeIds || options.nodeIds.includes(n.id);
  });

  const reports: OracleSyncReport[] = [];
  for (const node of targets) {
    const q = node.question!;
    const provider = q.oracleProvider as OracleProvider;
    const externalId = q.oracleExternalId!;
    try {
      const snap = await fetchOracleSnapshot(provider, externalId, q.oracleOutcomeLabel, options.fetchImpl);
      q.oracleLastSyncedAt = new Date().toISOString();
      if (snap.probability !== null) q.oracleLastPrice = Number(snap.probability.toFixed(4));
      if (snap.status === "resolved" && snap.outcome !== null) {
        const { entries } = settleResolvedQuestion(node.id, snap.outcome, {
          source: provider,
          resolvedBy: `${provider}_oracle`,
          evidenceUrl: q.oracleUrl || defaultOracleUrl(provider, externalId) || null,
        });
        reports.push({
          nodeId: node.id,
          provider,
          externalId,
          status: "settled",
          probability: snap.probability,
          message: `Resolved ${snap.outcome === 1 ? "YES" : "NO"} via ${provider}; settled ${entries.length} forecaster(s).`,
        });
      } else {
        reports.push({
          nodeId: node.id,
          provider,
          externalId,
          status: snap.status,
          probability: snap.probability,
          message:
            snap.status === "annulled"
              ? "Market annulled/ambiguous — needs Editorial adjudication."
              : snap.status === "open"
              ? "Still open; consensus price updated."
              : "Closed but not yet final; will retry.",
        });
      }
    } catch (err) {
      reports.push({
        nodeId: node.id,
        provider,
        externalId,
        status: "error",
        probability: null,
        message: err instanceof Error ? err.message : "Oracle fetch failed",
      });
    }
  }
  return reports;
}
