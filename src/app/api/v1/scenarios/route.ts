import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { AI_2040_EDGES, AI_2040_NODES, AI_2040_SCENARIO } from "@/data/ai2040-seed";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    scenarios: [
      {
        ...store.scenario,
        nodeCount: store.nodes.filter((n) => n.scenarioId !== "scen-ai-2040").length,
        edgeCount: store.edges.filter((e) => e.scenarioId !== "scen-ai-2040").length,
        forecastCount: store.forecastEvents.length,
        forkCount: store.forks.length,
      },
      {
        ...AI_2040_SCENARIO,
        nodeCount: AI_2040_NODES.length,
        edgeCount: AI_2040_EDGES.length,
        forecastCount: store.forecastEvents.filter((f) =>
          f.nodeId.startsWith("node-2040-")
        ).length,
        forkCount: 0,
      },
      ...store.forks.map((f) => ({
        id: f.id,
        slug: f.slug,
        title: f.title,
        subtitle: f.subtitle,
        parentScenarioId: f.parentScenarioId,
        forkedFromVersion: f.forkedFromVersion,
        ownerHandle: f.ownerHandle,
        ownerName: f.ownerName,
        isOfficial: false,
        createdAt: f.createdAt,
      })),
    ],
  });
}
