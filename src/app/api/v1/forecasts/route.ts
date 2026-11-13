import { NextRequest, NextResponse } from "next/server";
import {
  findForecastableNode,
  getCrowdProbability,
  getStore,
  submitForecastEvent,
  verifyAgentApiKey,
} from "@/lib/store";
import { getSessionForecaster } from "@/lib/auth-session";
import {
  currentHorizonDecay,
  getReputationState,
  getStandingForCategory,
} from "@/lib/reputation-store";
import {
  classifyNodeCategory,
  computeProjectedReputationDelta,
  isNodeScorable,
} from "@/lib/reputation-engine";

export async function GET(request: NextRequest) {
  const store = getStore();
  getReputationState();
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  const handle = searchParams.get("handle");

  let events = store.forecastEvents;
  if (nodeId) events = events.filter((e) => e.nodeId === nodeId);
  if (handle) events = events.filter((e) => e.forecasterHandle === handle);

  return NextResponse.json({ forecasts: events });
}

export async function POST(request: NextRequest) {
  try {
    getReputationState();
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-agent-api-key");

    const isAgentHeader = Boolean(apiKeyHeader || authHeader);
    const agentAuth = isAgentHeader ? verifyAgentApiKey(authHeader, apiKeyHeader) : null;
    const session = agentAuth ? null : await getSessionForecaster();

    if (!agentAuth && !session) {
      return NextResponse.json(
        {
          error: "Sign in with X or your AGIFutures.org account to lock in a forecast.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const node = findForecastableNode(String(body.nodeId || ""));
    if (!node) {
      return NextResponse.json({ error: `Node '${body.nodeId}' not found.` }, { status: 404 });
    }

    const probability = Number(body.probability);
    const forecasterHandle = session ? session.profile.handle : agentAuth!.agentHandle;
    const category = classifyNodeCategory(node);
    const scorable = isNodeScorable(node);
    const crowdProbability = getCrowdProbability(node);
    const standing =
      category === "unscored_metaphysical"
        ? { currentRp: 1000, isVerified: false }
        : getStandingForCategory(forecasterHandle, category);
    const preview = computeProjectedReputationDelta({
      probability,
      crowdProbability,
      confidenceMultiplier: Number(body.confidenceMultiplier ?? 1),
      currentRp: standing.currentRp,
      isVerified: standing.isVerified,
      horizonDecay: currentHorizonDecay(node),
    });

    const { event, receipt } = await submitForecastEvent({
      nodeId: node.id,
      probability,
      uncertaintyLower:
        body.uncertaintyLower !== undefined ? Number(body.uncertaintyLower) : undefined,
      uncertaintyUpper:
        body.uncertaintyUpper !== undefined ? Number(body.uncertaintyUpper) : undefined,
      rationale: body.rationale,
      citedUrls: Array.isArray(body.citedUrls) ? body.citedUrls : [],
      assumptions: Array.isArray(body.assumptions) ? body.assumptions : [],
      conditionalOverrides: body.conditionalOverrides,
      sessionProfile: session?.profile,
      authProvider: session ? session.authProvider : "agent_api",
      forecasterHandle,
      forecasterName: session ? session.profile.displayName : agentAuth!.agentName,
      forecasterType: session ? "human" : "ai_agent",
      agentModelVersion: agentAuth ? body.agentModelVersion || agentAuth.modelVersion : undefined,
      agentProvider: agentAuth ? body.agentProvider : undefined,
      crowdProbSnapshot: crowdProbability,
      confidenceMultiplier: preview.effectiveMultiplier,
      projectedRpIfYes: scorable ? preview.deltaIfYes : null,
      projectedRpIfNo: scorable ? preview.deltaIfNo : null,
    });

    return NextResponse.json(
      {
        event,
        receipt,
        receiptUrl: `/receipt/${receipt.eventId}`,
        shareUrl: `/f/${event.id}`,
        scorable,
        category,
        preview: { ...preview, currentRp: standing.currentRp, isVerified: standing.isVerified },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit forecast";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
