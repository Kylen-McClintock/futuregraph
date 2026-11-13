import { NextRequest, NextResponse } from "next/server";
import { getSessionForecaster } from "@/lib/auth-session";
import { createWorldviewSnapshot, getWorldview } from "@/lib/reputation-store";

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const worldview = getWorldview(id);
  if (!worldview) return NextResponse.json({ error: "Worldview not found" }, { status: 404 });
  return NextResponse.json({ worldview });
}

/** Lock in an immutable, receipt-backed multi-branch worldview snapshot for sharing. */
export async function POST(request: NextRequest) {
  const session = await getSessionForecaster();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in with X or AGIFutures.org to lock in your worldview.", requiresAuth: true },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();
    const worldview = createWorldviewSnapshot({
      profile: session.profile,
      scenarioSlug: String(body.scenarioSlug || ""),
      headline: typeof body.headline === "string" ? body.headline : undefined,
      outcomes: Array.isArray(body.outcomes) ? body.outcomes : [],
    });
    return NextResponse.json({ worldview, shareUrl: `/w/${worldview.id}` }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save worldview" }, { status: 400 });
  }
}
