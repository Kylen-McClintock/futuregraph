import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth-session";
import { settleResolvedQuestion } from "@/lib/reputation-store";

/** Editorial Admin adjudication (fallback when no oracle applies or a market is annulled). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Editor or admin access required to resolve questions." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const outcome = body.outcome === 1 || body.outcome === "YES" ? 1 : body.outcome === 0 || body.outcome === "NO" ? 0 : null;
    if (outcome === null) {
      return NextResponse.json({ error: "Outcome must be YES (1) or NO (0)." }, { status: 400 });
    }
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
    if (!/^https?:\/\//i.test(evidenceUrl)) {
      return NextResponse.json({ error: "A primary-source evidence URL (https://…) is required." }, { status: 400 });
    }
    const { resolution, entries } = settleResolvedQuestion(params.id, outcome, {
      source: "editorial",
      resolvedBy: auth.actor,
      evidenceUrl,
    });
    return NextResponse.json({ resolution, settlements: entries }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Resolution failed" }, { status: 400 });
  }
}
