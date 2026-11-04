import React from "react";
import { getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { AI_2050_SCENARIO } from "@/data/ai2050-seed";
import { ScenarioGraphExplorer } from "@/components/ScenarioGraphExplorer";

export const dynamic = "force-dynamic";

export default function NatureOfRealityScenarioPage() {
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
      initialScenarioSlug="nature-of-reality"
    />
  );
}
