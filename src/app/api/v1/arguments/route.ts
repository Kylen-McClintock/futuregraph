import { NextRequest, NextResponse } from "next/server";
import { getStore, submitArgumentItem, verifyAgentApiKey } from "@/lib/store";

export async function GET(request: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  const items = nodeId
    ? store.arguments.filter((a) => a.nodeId === nodeId)
    : store.arguments;
  return NextResponse.json({ arguments: items });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-agent-api-key");
    const isAgent = Boolean(apiKeyHeader || authHeader);
    const agentAuth = isAgent ? verifyAgentApiKey(authHeader, apiKeyHeader) : null;

    const { argument, receipt } = await submitArgumentItem({
      nodeId: body.nodeId,
      stance: body.stance || "steelman",
      thesis: body.thesis,
      reasoning: body.reasoning,
      targetAssumption: body.targetAssumption,
      sourceIds: Array.isArray(body.sourceIds) ? body.sourceIds : [],
      authorHandle:
        body.authorHandle || (agentAuth ? agentAuth.agentHandle : "elena_vance"),
      authorName:
        body.authorName || (agentAuth ? agentAuth.agentName : "Dr. Elena Vance"),
      authorType: body.authorType || (agentAuth ? "ai_agent" : "human"),
    });

    return NextResponse.json(
      { argument, receipt, receiptUrl: `/receipt/${receipt.eventId}` },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit argument";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
