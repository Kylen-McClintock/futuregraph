import React from "react";
import { getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { AI_2040_SCENARIO } from "@/data/ai2040-seed";
import { ScenarioGraphExplorer } from "@/components/ScenarioGraphExplorer";

export const dynamic = "force-dynamic";

export default function AI2040ScenarioPage() {
  const store = getStore();

  return (
    <ScenarioGraphExplorer
      scenario={AI_2040_SCENARIO}
      nodes={store.nodes}
      edges={store.edges}
      lensPriorsByNode={LENS_PRIORS_BY_NODE}
      nodeSources={store.nodeSources}
      argumentsList={store.arguments}
      comments={store.comments}
      forecastEvents={store.forecastEvents}
      initialSelectedNodeId={null}
      initialScenarioSlug="ai-2040"
    />
  );
}
