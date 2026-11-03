import { NextRequest, NextResponse } from "next/server";
import { getBasePriorsForLens, getStore } from "@/lib/store";
import { propagateGraphProbabilities } from "@/lib/probability-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const forkId = searchParams.get("forkId") || params.id;

  const fork =
    store.forks.find((f) => f.id === forkId || f.slug === forkId) ||
    store.forks[0];

  if (!fork) {
    return NextResponse.json({ error: "Scenario fork not found" }, { status: 404 });
  }

  const basePriors = getBasePriorsForLens("demo_hypothesis");
  const canonicalProp = propagateGraphProbabilities(
    store.nodes,
    store.edges,
    basePriors,
    {}
  );
  const forkProp = propagateGraphProbabilities(
    store.nodes,
    store.edges,
    basePriors,
    fork.nodeProbabilityOverrides
  );

  const nodeDiffs = store.nodes
    .map((node) => {
      const canonicalP = canonicalProp.results[node.id]?.marginalProbability ?? 0;
      const forkP = forkProp.results[node.id]?.marginalProbability ?? 0;
      const delta = Number((forkP - canonicalP).toFixed(4));
      const isDirectlyOverridden = node.id in fork.nodeProbabilityOverrides;
      return {
        nodeId: node.id,
        title: node.title,
        dateLabel: node.dateLabel,
        branchTrack: node.branchTrack,
        canonicalProbability: canonicalP,
        forkProbability: forkP,
        delta,
        isDirectlyOverridden,
      };
    })
    .filter((d) => Math.abs(d.delta) > 0.0001 || d.isDirectlyOverridden);

  return NextResponse.json({
    canonicalScenario: {
      id: store.scenario.id,
      title: store.scenario.title,
      version: store.scenario.version,
    },
    fork,
    nodeDiffs,
    addedNodes: fork.addedNodes,
  });
}
