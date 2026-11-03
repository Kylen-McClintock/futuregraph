import { NextRequest, NextResponse } from "next/server";
import { getBasePriorsForLens, getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { propagateGraphProbabilities } from "@/lib/probability-engine";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const node = store.nodes.find(
    (n) => n.id === params.id || n.logicalId === params.id
  );
  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const basePriors = getBasePriorsForLens("demo_hypothesis");
  const prop = propagateGraphProbabilities(store.nodes, store.edges, basePriors, {});

  // Compute sensitivity impact: what happens when this node is set to 0.80 vs 0.20?
  const propHigh = propagateGraphProbabilities(store.nodes, store.edges, basePriors, {
    [node.id]: 0.8,
  });
  const propLow = propagateGraphProbabilities(store.nodes, store.edges, basePriors, {
    [node.id]: 0.2,
  });

  const downstreamImpacts = store.nodes
    .filter((n) => n.id !== node.id)
    .map((n) => {
      const pBase = prop.results[n.id]?.marginalProbability ?? 0;
      const pHigh = propHigh.results[n.id]?.marginalProbability ?? 0;
      const pLow = propLow.results[n.id]?.marginalProbability ?? 0;
      const swing = Number((pHigh - pLow).toFixed(4));
      return {
        nodeId: n.id,
        title: n.title,
        dateLabel: n.dateLabel,
        baselineProb: pBase,
        probAt80: pHigh,
        probAt20: pLow,
        swing,
      };
    })
    .filter((item) => Math.abs(item.swing) > 0.005)
    .sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing));

  return NextResponse.json({
    node,
    propagation: prop.results[node.id] || null,
    lensPriors: LENS_PRIORS_BY_NODE[node.id] || {},
    evidence: store.nodeSources.filter((ns) => ns.nodeId === node.id),
    arguments: store.arguments.filter((a) => a.nodeId === node.id),
    comments: store.comments.filter((c) => c.nodeId === node.id),
    forecasts: store.forecastEvents.filter((fe) => fe.nodeId === node.id),
    incomingEdges: store.edges.filter((e) => e.targetNodeId === node.id),
    outgoingEdges: store.edges.filter((e) => e.sourceNodeId === node.id),
    downstreamImpacts,
  });
}
