import { NextRequest, NextResponse } from "next/server";
import { compareLenses } from "@/lib/store";
import { ForecastLens } from "@/types/futuregraph";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lensA = (searchParams.get("lensA") as ForecastLens) || "community";
  const lensB = (searchParams.get("lensB") as ForecastLens) || "ai_gemini";

  const comparison = compareLenses(lensA, lensB);
  return NextResponse.json({ lensA, lensB, comparison });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lensA: ForecastLens = body.lensA || "community";
    const lensB: ForecastLens = body.lensB || "ai_gemini";
    const comparison = compareLenses(lensA, lensB);
    return NextResponse.json({ lensA, lensB, comparison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Comparison error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
