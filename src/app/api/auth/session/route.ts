import { NextResponse } from "next/server";
import { getSessionForecaster, isDemoAuthEnabled } from "@/lib/auth-session";
import { isSupabaseConfigured } from "@/lib/auth-config";
import { emptyScorecard, getScorecard } from "@/lib/reputation-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const forecaster = await getSessionForecaster();
  const scorecard = forecaster
    ? getScorecard(forecaster.profile.handle) ||
      emptyScorecard(forecaster.profile.handle, forecaster.profile.displayName)
    : null;
  return NextResponse.json(
    {
      forecaster,
      scorecard,
      config: {
        supabaseConfigured: isSupabaseConfigured(),
        demoAuthEnabled: isDemoAuthEnabled(),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
