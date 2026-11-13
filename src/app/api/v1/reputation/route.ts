import { NextRequest, NextResponse } from "next/server";
import { getAllScorecards, getLedgerForHandle, getScorecard } from "@/lib/reputation-store";

export const dynamic = "force-dynamic";

/** Public, verifiable reputation API: ?handle=… for one scorecard + ledger, otherwise the leaderboard. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle");
  if (handle) {
    const scorecard = getScorecard(handle);
    if (!scorecard) return NextResponse.json({ error: "Forecaster not found" }, { status: 404 });
    return NextResponse.json({ scorecard, ledger: getLedgerForHandle(handle) });
  }
  const type = searchParams.get("type");
  const participantType = type === "ai_agent" ? "ai_agent" : type === "human" ? "human" : undefined;
  return NextResponse.json({ leaderboard: getAllScorecards(participantType) });
}
