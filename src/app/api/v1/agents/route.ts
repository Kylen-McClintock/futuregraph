import { NextRequest, NextResponse } from "next/server";
import {
  getAllForecasterRuns,
  getForecasterActors,
  getRunsForGraph,
} from "@/lib/store";
import { computeCrowdDistribution } from "@/lib/forecaster-engine";
import { getRegisteredGraphs } from "@/lib/graph-registry";
import { CrowdEnsembleMode, RegisteredGraphId } from "@/types/forecaster";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const graphId = searchParams.get("graphId") as RegisteredGraphId | null;
  const crowdMode =
    (searchParams.get("crowdMode") as CrowdEnsembleMode | null) ||
    "all_ensemble";

  const actors = getForecasterActors();
  const runs = graphId ? getRunsForGraph(graphId) : getAllForecasterRuns();
  const allRuns = getAllForecasterRuns();

  const crowd = graphId
    ? computeCrowdDistribution(graphId, crowdMode, actors, allRuns)
    : undefined;

  return NextResponse.json({
    graphs: getRegisteredGraphs().map((g) => ({
      graphId: g.graphId,
      slug: g.slug,
      routeHref: g.routeHref,
      title: g.title,
      shortTitle: g.shortTitle,
      domainBadge: g.domainBadge,
      topologyKind: g.topologyKind,
      defaultBaselineLabel: g.defaultBaselineLabel,
      forkCount: g.forks.length,
      nodeCount: g.nodes.length,
    })),
    actors,
    runs,
    crowd,
  });
}
