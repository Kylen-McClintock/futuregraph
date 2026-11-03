import { NextRequest, NextResponse } from "next/server";
import { getBasePriorsForLens, getStore } from "@/lib/store";
import { propagateGraphProbabilities } from "@/lib/probability-engine";
import { ForecastLens } from "@/types/futuregraph";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = getStore();
    const lens: ForecastLens = body.lens || "demo_hypothesis";
    const overrides: Record<string, number> = body.overrides || {};

    const basePriors = getBasePriorsForLens(lens);
    const output = propagateGraphProbabilities(
      store.nodes,
      store.edges,
      basePriors,
      overrides
    );

    if (!output.valid) {
      return NextResponse.json(output, { status: 422 });
    }

    return NextResponse.json({
      lens,
      overrides,
      ...output,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Propagation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
