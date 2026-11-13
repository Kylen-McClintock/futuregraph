import { NextResponse } from "next/server";
import { listScorableQuestions } from "@/lib/reputation-store";
import { getCrowdProbability } from "@/lib/store";
import { nodeForecastPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

/** Catalog of every Reputation-scorable question with status, consensus and oracle config. */
export async function GET() {
  const questions = listScorableQuestions().map((q) => ({
    nodeId: q.node.id,
    title: q.node.title,
    category: q.category,
    scenarioId: q.node.scenarioId,
    closeDate: q.node.question?.closeDate ?? null,
    status: q.status,
    isSandboxDrill: Boolean(q.node.question?.isSandboxDrill),
    crowdProbability: getCrowdProbability(q.node),
    forecastCount: q.forecastCount,
    forecasterCount: q.forecasterCount,
    resolvedOutcome: q.node.question?.resolvedOutcome ?? null,
    resolution: q.resolution,
    oracle: {
      provider: q.node.question?.oracleProvider ?? "editorial",
      externalId: q.node.question?.oracleExternalId ?? null,
      outcomeLabel: q.node.question?.oracleOutcomeLabel ?? null,
      url: q.node.question?.oracleUrl ?? null,
      lastPrice: q.node.question?.oracleLastPrice ?? null,
      lastSyncedAt: q.node.question?.oracleLastSyncedAt ?? null,
    },
    path: nodeForecastPath(q.node),
  }));
  return NextResponse.json({ questions });
}
