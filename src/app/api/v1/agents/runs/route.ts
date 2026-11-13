import { NextRequest, NextResponse } from "next/server";
import { parseAndValidateAgentResponse } from "@/lib/prompt-pack";
import { encodePortableForecastBundle } from "@/lib/forecaster-engine";
import { getRegisteredGraph } from "@/lib/graph-registry";
import {
  getAllForecasterRuns,
  getForecasterActors,
  getRunsForActor,
  getRunsForGraph,
  submitForecasterGraphRuns,
} from "@/lib/store";
import { RegisteredGraphId, WorldviewCard } from "@/types/forecaster";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const graphId = searchParams.get("graphId") as RegisteredGraphId | null;
  const handle = searchParams.get("handle");

  const runs = handle
    ? getRunsForActor(handle)
    : graphId
    ? getRunsForGraph(graphId)
    : getAllForecasterRuns();

  return NextResponse.json({
    actors: getForecasterActors(),
    runs,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { origin } = new URL(request.url);
    const body = await request.json();

    const defaultGraphId: RegisteredGraphId =
      typeof body?.graphId === "string" ? body.graphId : "ai-2027";

    const parsed = parseAndValidateAgentResponse({
      rawText: typeof body?.rawText === "string" ? body.rawText : undefined,
      parsedJson: typeof body?.rawText === "string" ? undefined : body,
      defaultGraphId,
      fallbackHandle: body?.handle || body?.actor?.handle,
      fallbackDisplayName: body?.displayName || body?.actor?.displayName,
      fallbackActorType: body?.actorType || body?.actor?.actorType,
    });

    if (!parsed.ok) {
      return NextResponse.json(
        {
          ok: false,
          errors: parsed.errors,
          warnings: parsed.warnings,
        },
        { status: 400 }
      );
    }

    const explicitWorldview: Partial<WorldviewCard> | undefined =
      body?.worldview && typeof body.worldview === "object"
        ? body.worldview
        : parsed.actorPatch?.worldview;

    const saved = await submitForecasterGraphRuns({
      handle:
        body?.handle || parsed.actorPatch?.handle || "community_agent",
      displayName:
        body?.displayName ||
        parsed.actorPatch?.displayName ||
        "Community Worldview Agent",
      actorType:
        body?.actorType || parsed.actorPatch?.actorType || "ai_agent",
      roleLabel: body?.roleLabel || parsed.actorPatch?.roleLabel,
      worldview: explicitWorldview,
      forkedFromHandle: body?.forkedFromHandle ?? null,
      runs: parsed.runs,
    });

    const shareUrls: Record<string, string> = {};
    for (const run of saved.runs) {
      const spec = getRegisteredGraph(run.graphId);
      const routeHref = spec?.routeHref || "/scenarios/ai-2027";
      const portable = encodePortableForecastBundle({
        v: 1,
        actor: {
          handle: saved.actor.handle,
          displayName: saved.actor.displayName,
          actorType: saved.actor.actorType,
          roleLabel: saved.actor.roleLabel,
          worldview: saved.actor.worldview,
        },
        run,
      });
      // Keep URL short when server-saved, with portable fallback parameter for short graphs
      const includePortable = portable.length < 3600;
      shareUrls[run.graphId] = `${origin}/futuregraph${routeHref}?forecaster=${encodeURIComponent(
        saved.actor.handle
      )}&variance=1${
        includePortable ? `&agentRun=${encodeURIComponent(portable)}` : ""
      }`;
    }

    return NextResponse.json({
      ok: true,
      warnings: parsed.warnings,
      actor: saved.actor,
      runs: saved.runs,
      receipt: saved.receipt,
      profileUrl: `${origin}/futuregraph/u/${encodeURIComponent(
        saved.actor.handle
      )}`,
      shareUrls,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          err instanceof Error
            ? err.message
            : "Failed to save agent forecast run.",
        ],
      },
      { status: 400 }
    );
  }
}
