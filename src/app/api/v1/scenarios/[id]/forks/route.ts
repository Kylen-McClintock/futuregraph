import { NextRequest, NextResponse } from "next/server";
import { createScenarioFork, getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({ forks: store.forks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fork, receipt } = await createScenarioFork({
      title: body.title || "Community AI 2027 Fork",
      subtitle: body.subtitle,
      rationale: body.rationale || "Custom assumption fork exploring alternative AI 2027 branch weights.",
      ownerHandle: body.ownerHandle || "elena_vance",
      ownerName: body.ownerName,
      nodeProbabilityOverrides: body.nodeProbabilityOverrides || {},
      addedNodes: body.addedNodes || [],
    });
    return NextResponse.json({ fork, receipt }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create scenario fork";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
