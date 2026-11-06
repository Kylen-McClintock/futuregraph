import { NextRequest, NextResponse } from "next/server";
import {
  addLevWeeklyPulse,
  computeLevDashboard,
  ConservativeUpdateMode,
  getLevWeeklyPulses,
} from "@/lib/lev-engine";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const updateMode: ConservativeUpdateMode =
    searchParams.get("mode") === "moderate" ? "moderate" : "conservative";
  const ageParam = Number(searchParams.get("age") || "35");
  const currentAge = Number.isFinite(ageParam)
    ? Math.max(18, Math.min(90, ageParam))
    : 35;

  const pulses = getLevWeeklyPulses();
  const computation = computeLevDashboard({
    referenceDate: new Date(),
    updateMode,
    currentChronologicalAge: currentAge,
  });

  return NextResponse.json(
    {
      status: "ok",
      latestPulse: pulses[0],
      pulses,
      computation,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const weekOf =
      typeof body.weekOf === "string" && body.weekOf.trim()
        ? body.weekOf.trim()
        : new Date().toISOString().slice(0, 10);
    const newsletterTitle =
      typeof body.newsletterTitle === "string" && body.newsletterTitle.trim()
        ? body.newsletterTitle.trim()
        : `Weekly Longevity & LEV Update (${weekOf})`;

    const predictionMarketsSummary =
      typeof body.predictionMarketsSummary === "string" &&
      body.predictionMarketsSummary.trim()
        ? body.predictionMarketsSummary.trim()
        : "Prediction markets held steady within conservative Bayesian tolerance bands this week.";

    const expertConsensusSummary =
      typeof body.expertConsensusSummary === "string" &&
      body.expertConsensusSummary.trim()
        ? body.expertConsensusSummary.trim()
        : "Expert translational timelines maintained consensus around mid-to-late 2030s for 99th-percentile early adopters.";

    const breakthroughsSummary =
      typeof body.breakthroughsSummary === "string" &&
      body.breakthroughsSummary.trim()
        ? body.breakthroughsSummary.trim()
        : "Continued longitudinal validation of multi-omic Pace-of-Aging biomarkers and rejuvenation protocols.";

    const pulse = addLevWeeklyPulse({
      id: body.id,
      weekOf,
      issueLabel: body.issueLabel,
      newsletterTitle,
      newsletterUrl: body.newsletterUrl,
      authorOrSource: body.authorOrSource,
      predictionMarketsSummary,
      expertConsensusSummary,
      breakthroughsSummary,
      breakthroughs: Array.isArray(body.breakthroughs) ? body.breakthroughs : [],
      netWeeklyDelta: body.netWeeklyDelta,
    });

    const computation = computeLevDashboard({
      referenceDate: new Date(),
      updateMode: body.mode === "moderate" ? "moderate" : "conservative",
      currentChronologicalAge: Number(body.age) || 35,
    });

    return NextResponse.json(
      {
        status: "ok",
        message:
          "Weekly Newsletter Pulse synced to FutureGraph LEV Observatory and applied to conservative Bayesian trajectory.",
        pulse,
        computation,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Invalid JSON body for weekly pulse sync.",
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
