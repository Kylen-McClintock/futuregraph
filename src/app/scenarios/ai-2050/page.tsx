import React from "react";
import { getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { AI_2050_SCENARIO } from "@/data/ai2050-seed";
import { ScenarioGraphExplorer } from "@/components/ScenarioGraphExplorer";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI 2050 Long-Horizon Superintelligence & Abundance Scenarios",
  description: "Stress-test long-horizon 2050 civilizational outcomes across superintelligence alignment, longevity escape velocity, space industrialization, and human flourishing.",
  alternates: {
    canonical: "/futuregraph/scenarios/ai-2050",
  },
  openGraph: {
    title: "AI 2050 Long-Horizon Superintelligence & Abundance Scenarios | FutureGraph",
    description: "Stress-test long-horizon 2050 civilizational outcomes across superintelligence alignment, longevity escape velocity, space industrialization, and human flourishing.",
    url: "/futuregraph/scenarios/ai-2050",
  },
};

export default function AI2050ScenarioPage() {
  const store = getStore();

  return (
    <ScenarioGraphExplorer
      scenario={AI_2050_SCENARIO}
      nodes={store.nodes}
      edges={store.edges}
      lensPriorsByNode={LENS_PRIORS_BY_NODE}
      nodeSources={store.nodeSources}
      argumentsList={store.arguments}
      comments={store.comments}
      forecastEvents={store.forecastEvents}
      initialSelectedNodeId={null}
      initialScenarioSlug="ai-2050"
    />
  );
}
