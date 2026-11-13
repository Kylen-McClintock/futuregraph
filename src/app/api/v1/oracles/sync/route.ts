import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth-session";
import { syncOracles } from "@/lib/oracle-sync";

export const dynamic = "force-dynamic";

async function run(request: NextRequest, nodeIds?: string[]) {
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Admin session, admin secret, or CRON_SECRET bearer token required." }, { status: 403 });
  }
  const reports = await syncOracles({ nodeIds });
  return NextResponse.json({ syncedAt: new Date().toISOString(), actor: auth.actor, reports });
}

/** Vercel Cron entry point (Authorization: Bearer $CRON_SECRET). */
export async function GET(request: NextRequest) {
  return run(request);
}

/** Manual "Sync Oracle Resolutions Now" from the Editorial Admin. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return run(request, Array.isArray(body.nodeIds) ? body.nodeIds.map(String) : undefined);
}
