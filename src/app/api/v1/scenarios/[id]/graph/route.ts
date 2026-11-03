import { NextRequest, NextResponse } from "next/server";
import { getBasePriorsForLens, getStore } from "@/lib/store";
import { propagateGraphProbabilities } from "@/lib/probability-engine";
import { ForecastLens } from "@/types/futuregraph";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const lens = (searchParams.get("lens") as ForecastLens) || "demo_hypothesis";
  const asOf = searchParams.get("asOf");

  const fork = store.forks.find(
    (f) => f.id === params.id || f.slug === params.id
  );

  const basePriors = getBasePriorsForLens(lens);
  const overrides = fork ? fork.nodeProbabilityOverrides : {};
  const propagation = propagateGraphProbabilities(
    store.nodes,
    store.edges,
    basePriors,
    overrides
  );

  const filteredNodes = asOf
    ? store.nodes.filter((n) => n.sortDate <= asOf)
    : store.nodes;

  return NextResponse.json({
    scenario: fork
      ? {
          ...store.scenario,
          id: fork.id,
          slug: fork.slug,
          title: fork.title,
          subtitle: fork.subtitle,
          isOfficial: false,
          forkMetadata: fork,
        }
      : store.scenario,
    lens,
    asOf: asOf || store.scenario.currentAsOf,
    nodes: filteredNodes.map((n) => ({
      ...n,
      propagation: propagation.results[n.id] || null,
    })),
    edges: store.edges,
    propagation,
  });
}
