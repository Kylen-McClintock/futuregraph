import { NextRequest, NextResponse } from "next/server";
import { getStore, submitBranchProposal } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = getStore();
    const node = store.nodes.find((n) => n.id === body.nodeId);
    if (!node) {
      return NextResponse.json({ error: "Target node not found" }, { status: 404 });
    }

    const sourceId = `src-${Date.now()}`;
    const newSource = {
      id: sourceId,
      url: body.url || "https://ai-2027.com/",
      sourceType: body.sourceType || ("Research Supplement" as const),
      title: body.title || "Proposed Evidence Source",
      authors: body.authors || "FutureGraph Contributor",
      publisher: body.publisher || "External Citation",
      publishedAt: body.publishedAt || "2026-11-02",
      retrievedAt: "2026-11-02",
      mediaStartSeconds: body.mediaStartSeconds ? Number(body.mediaStartSeconds) : undefined,
      excerptParaphrase: body.excerptParaphrase || body.relevanceNote || "Primary evidence excerpt.",
      credibilityNote: "Community / Agent proposed source.",
      isAiSummarized: Boolean(body.isAiSummarized),
    };

    store.sources.push(newSource);
    const link = {
      id: `ns-${Date.now()}`,
      nodeId: node.id,
      sourceId,
      relationship: body.relationship || ("supports" as const),
      relevanceNote: body.relevanceNote || newSource.excerptParaphrase,
      addedBy: body.proposerHandle || "elena_vance",
      createdAt: new Date().toISOString(),
      source: newSource,
    };
    store.nodeSources.push(link);

    const { proposal, receipt } = await submitBranchProposal({
      parentNodeId: node.id,
      proposalType: "evidence_addition",
      proposedTitle: `Evidence: ${newSource.title}`,
      proposedSummary: newSource.excerptParaphrase,
      conditionalAssumption: `Relationship: ${link.relationship}`,
      sourceUrl: newSource.url,
      proposerHandle: body.proposerHandle || "elena_vance",
    });

    return NextResponse.json(
      { source: newSource, evidenceLink: link, proposal, receipt },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to propose evidence";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
