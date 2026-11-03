import { NextRequest, NextResponse } from "next/server";
import { getStore, submitBranchProposal } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({ proposals: store.proposals });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposal, receipt } = await submitBranchProposal({
      parentNodeId: body.parentNodeId,
      proposalType: body.proposalType || "missing_branch",
      proposedTitle: body.proposedTitle,
      proposedSummary: body.proposedSummary,
      conditionalAssumption:
        body.conditionalAssumption || "Conditional on parent node outcome",
      suggestedProbability:
        body.suggestedProbability !== undefined
          ? Number(body.suggestedProbability)
          : undefined,
      sourceUrl: body.sourceUrl,
      proposerHandle: body.proposerHandle || "sentinel_bayes_v2",
    });
    return NextResponse.json(
      { proposal, receipt, receiptUrl: `/receipt/${receipt.eventId}` },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit branch proposal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const store = getStore();
    const prop = store.proposals.find((p) => p.id === body.proposalId);
    if (!prop) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    prop.status = body.status || "approved";
    prop.reviewerNotes = body.reviewerNotes || "Reviewed by Editorial Committee";
    return NextResponse.json({ proposal: prop });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update proposal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
