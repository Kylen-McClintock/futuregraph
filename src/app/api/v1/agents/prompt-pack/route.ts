import { NextRequest, NextResponse } from "next/server";
import {
  generatePromptPack,
  PromptPackOutputMode,
  PromptPackScope,
} from "@/lib/prompt-pack";
import { getForecasterActor } from "@/lib/store";
import { RegisteredGraphId } from "@/types/forecaster";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const graphId =
    (searchParams.get("graphId") as RegisteredGraphId | null) || "ai-2027";
  const scope =
    (searchParams.get("scope") as PromptPackScope | null) || "graph";
  const branchNodeId = searchParams.get("branchNodeId");
  const outputMode =
    (searchParams.get("outputMode") as PromptPackOutputMode | null) ||
    "standard";
  const handle = searchParams.get("handle") || undefined;

  const matchedActor = handle ? getForecasterActor(handle) : undefined;

  const pack = generatePromptPack({
    graphId,
    scope,
    branchNodeId,
    outputMode,
    actorHandle: matchedActor?.handle || handle || "custom_agent",
    actorDisplayName: matchedActor?.displayName || "Custom Worldview Agent",
    actorType: matchedActor?.actorType || "ai_agent",
    worldview: matchedActor?.worldview,
    baseOrigin: origin,
  });

  return NextResponse.json(pack);
}
