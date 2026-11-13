import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { findForecastableNode, getCrowdProbability, getStore } from "@/lib/store";
import { getReputationState } from "@/lib/reputation-store";
import { NodeAuditPanel } from "@/components/NodeAuditPanel";
import { absoluteUrl, nodeForecastPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { nodeId: string } }): Metadata {
  const node = findForecastableNode(params.nodeId);
  if (!node) return { title: "Question not found — FutureGraph" };
  const crowd = Math.round(getCrowdProbability(node) * 100);
  const title = `${node.title} — put a probability on it`;
  const description = `Crowd: ${crowd}%. Lock in your forecast, wager reputation, and earn a verified accuracy score on FutureGraph.`;
  const image = absoluteUrl(`/api/og?nodeId=${encodeURIComponent(node.id)}&aspect=16x9`);
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function ForecastQuestionPage({ params }: { params: { nodeId: string } }) {
  getReputationState();
  const store = getStore();
  const node = findForecastableNode(params.nodeId);
  if (!node) return notFound();
  if (node.scenarioId !== "scen-checkpoints") {
    // Graph milestones keep their canonical scenario deep-link pages.
    const canonical = nodeForecastPath(node);
    return (
      <div className="mx-auto max-w-[800px] px-4 py-10 text-sm text-slate-300">
        This node lives in a scenario graph.{" "}
        <Link href={canonical} className="text-amber-300 underline">
          Open it in context
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/leaderboard#open-checkpoints"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>All checkpoint questions</span>
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          <span>Leaderboard</span>
        </Link>
      </div>
      <NodeAuditPanel
        standalone
        node={node}
        propagation={null}
        lensPriors={
          LENS_PRIORS_BY_NODE[node.id] || {
            original: null,
            my_forecasts: null,
            ai_claude: null,
            ai_gpt: null,
            ai_gemini: null,
            community: null,
            demo_hypothesis: null,
          }
        }
        evidence={store.nodeSources.filter((ns) => ns.nodeId === node.id)}
        argumentsList={store.arguments.filter((a) => a.nodeId === node.id)}
        comments={store.comments.filter((c) => c.nodeId === node.id)}
        forecasts={store.forecastEvents.filter((fe) => fe.nodeId === node.id)}
        incomingEdges={[]}
        outgoingEdges={[]}
        downstreamImpacts={[]}
      />
    </div>
  );
}
