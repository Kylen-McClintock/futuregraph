import { NextRequest, NextResponse } from "next/server";
import { computeLevDashboard, ConservativeUpdateMode } from "@/lib/lev-engine";
import {
  COHORT_PACE_PROFILES,
  LEV_EXPERT_PREDICTIONS,
  LEV_PREDICTION_MARKETS,
  LEVL_TRAJECTORY_REFERENCE,
} from "@/data/lev-seed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const updateMode: ConservativeUpdateMode =
    searchParams.get("mode") === "moderate" ? "moderate" : "conservative";
  const ageParam = Number(searchParams.get("age") || "35");
  const currentAge = Number.isFinite(ageParam)
    ? Math.max(18, Math.min(90, ageParam))
    : 35;

  const computation = computeLevDashboard({
    referenceDate: new Date(),
    updateMode,
    currentChronologicalAge: currentAge,
  });

  return NextResponse.json(
    {
      status: "ok",
      computation,
      predictionMarkets: LEV_PREDICTION_MARKETS,
      expertPredictions: LEV_EXPERT_PREDICTIONS,
      cohortProfiles: COHORT_PACE_PROFILES,
      levlReference: LEVL_TRAJECTORY_REFERENCE,
      embeds: {
        interactiveIframeUrl: `${origin}/embed/lev?theme=dark&view=all&age=${currentAge}&mode=${updateMode}`,
        scriptEmbedUrl: `${origin}/api/embed/lev-script`,
        newsletterSvgFullDark: `${origin}/api/embed/lev-card?theme=dark&variant=full&age=${currentAge}&mode=${updateMode}`,
        newsletterSvgFullLight: `${origin}/api/embed/lev-card?theme=light&variant=full&age=${currentAge}&mode=${updateMode}`,
        newsletterSvgPaceDark: `${origin}/api/embed/lev-card?theme=dark&variant=pace&age=${currentAge}&mode=${updateMode}`,
        newsletterSvgPaceLight: `${origin}/api/embed/lev-card?theme=light&variant=pace&age=${currentAge}&mode=${updateMode}`,
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    }
  );
}
