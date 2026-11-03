import { NextRequest, NextResponse } from "next/server";
import { getStore, submitForecastEvent, verifyAgentApiKey } from "@/lib/store";

export async function GET(request: NextRequest) {
  const store = getStore();
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
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-agent-api-key");

    const isAgentHeader = Boolean(apiKeyHeader || authHeader);
    const agentAuth = isAgentHeader
      ? verifyAgentApiKey(authHeader, apiKeyHeader)
      : null;

    const { event, receipt } = await submitForecastEvent({
      nodeId: body.nodeId,
      probability: Number(body.probability),
      uncertaintyLower:
        body.uncertaintyLower !== undefined ? Number(body.uncertaintyLower) : undefined,
      uncertaintyUpper:
        body.uncertaintyUpper !== undefined ? Number(body.uncertaintyUpper) : undefined,
      rationale: body.rationale,
      citedUrls: Array.isArray(body.citedUrls) ? body.citedUrls : [],
      assumptions: Array.isArray(body.assumptions) ? body.assumptions : [],
      conditionalOverrides: body.conditionalOverrides,
      forecasterHandle:
        body.forecasterHandle || (agentAuth ? agentAuth.agentHandle : "elena_vance"),
      forecasterName:
        body.forecasterName || (agentAuth ? agentAuth.agentName : "Dr. Elena Vance"),
      forecasterType:
        body.forecasterType || (agentAuth ? "ai_agent" : "human"),
      agentModelVersion:
        body.agentModelVersion || (agentAuth ? agentAuth.modelVersion : undefined),
      agentProvider: body.agentProvider,
    });

    return NextResponse.json(
      {
        event,
        receipt,
        receiptUrl: `/receipt/${receipt.eventId}`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit forecast";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
