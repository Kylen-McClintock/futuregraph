import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    scenarios: [
      {
        ...store.scenario,
        nodeCount: store.nodes.length,
        edgeCount: store.edges.length,
        forecastCount: store.forecastEvents.length,
        forkCount: store.forks.length,
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
