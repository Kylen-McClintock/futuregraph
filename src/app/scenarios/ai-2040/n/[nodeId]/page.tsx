import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch, GitCompare } from "lucide-react";
import { getBasePriorsForLens, getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { propagateGraphProbabilities } from "@/lib/probability-engine";
import { NodeAuditPanel } from "@/components/NodeAuditPanel";

export const dynamic = "force-dynamic";

export default function AI2040StandaloneNodeAuditPage({
  params,
}: {
  params: { nodeId: string };
}) {
  const store = getStore();
  const node = store.nodes.find(
    (n) => n.id === params.nodeId || n.logicalId === params.nodeId
  );

  if (!node) {
    return notFound();
  }

  const basePriors = getBasePriorsForLens("demo_hypothesis");
  const prop = propagateGraphProbabilities(
    store.nodes,
    store.edges,
    basePriors,
    {}
  );
  const propHigh = propagateGraphProbabilities(
    store.nodes,
    store.edges,
    basePriors,
    { [node.id]: 0.8 }
  );
  const propLow = propagateGraphProbabilities(
    store.nodes,
    store.edges,
    basePriors,
    { [node.id]: 0.2 }
  );

  const downstreamImpacts = store.nodes
    .filter((n) => n.id !== node.id && n.scenarioId === node.scenarioId)
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

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/scenarios/ai-2040"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Full AI 2040 Branching Map</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/scenarios/ai-2027"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            <GitBranch className="h-3.5 w-3.5 text-amber-400" />
            <span>Switch to AI 2027 Map</span>
          </Link>
          <Link
            href="/scenarios/ai-2027/compare"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            <GitCompare className="h-3.5 w-3.5 text-sky-400" />
            <span>Compare Lenses</span>
          </Link>
        </div>
      </div>

      <NodeAuditPanel
        standalone
        node={node}
        propagation={prop.results[node.id] || null}
        lensPriors={
          LENS_PRIORS_BY_NODE[node.id] || {
            original: null,
            my_forecasts: 0.5,
            ai_claude: 0.5,
            ai_gpt: 0.5,
            ai_gemini: 0.5,
            community: 0.5,
            demo_hypothesis: 0.5,
          }
        }
        evidence={store.nodeSources.filter((ns) => ns.nodeId === node.id)}
        argumentsList={store.arguments.filter((a) => a.nodeId === node.id)}
        comments={store.comments.filter((c) => c.nodeId === node.id)}
        forecasts={store.forecastEvents.filter((fe) => fe.nodeId === node.id)}
        incomingEdges={store.edges.filter((e) => e.targetNodeId === node.id)}
        outgoingEdges={store.edges.filter((e) => e.sourceNodeId === node.id)}
        downstreamImpacts={downstreamImpacts}
      />
    </div>
  );
}
