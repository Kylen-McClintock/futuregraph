import React from "react";
import { getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { ScenarioGraphExplorer } from "@/components/ScenarioGraphExplorer";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI 2027 Conditional Probability Graph & Oversight Fork",
  description: "Interactive conditional probability graph modeling AI capability milestones from Mid 2025 through the October 2027 Oversight Fork into Race vs. Slowdown trajectories.",
  alternates: {
    canonical: "/futuregraph/scenarios/ai-2027",
  },
  openGraph: {
    title: "AI 2027 Conditional Probability Graph & Oversight Fork | FutureGraph",
    description: "Interactive conditional probability graph modeling AI capability milestones from Mid 2025 through the October 2027 Oversight Fork into Race vs. Slowdown trajectories.",
    url: "/futuregraph/scenarios/ai-2027",
  },
};

export default function AI2027ScenarioPage() {
  const store = getStore();

  return (
    <ScenarioGraphExplorer
      scenario={store.scenario}
      nodes={store.nodes}
      edges={store.edges}
      lensPriorsByNode={LENS_PRIORS_BY_NODE}
      nodeSources={store.nodeSources}
      argumentsList={store.arguments}
      comments={store.comments}
      forecastEvents={store.forecastEvents}
      initialSelectedNodeId={null}
    />
  );
}
