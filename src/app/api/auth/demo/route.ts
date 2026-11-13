import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  demoCookieOptions,
  isDemoAuthEnabled,
  signDemoSession,
} from "@/lib/auth-session";
import { sanitizeHandle } from "@/lib/identity";

/** Local demo sign-in (development / offline sandboxes only — disabled in production by default). */
export async function POST(request: NextRequest) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: "Demo sign-in is disabled on this deployment." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const handle = sanitizeHandle(String(body.handle || "").slice(0, 24));
  if (handle.length < 2) {
    return NextResponse.json({ error: "Choose a handle with at least 2 characters." }, { status: 400 });
  }
  const provider = body.provider === "agifutures" ? "agifutures" : "x";
  const displayName = String(body.displayName || handle).slice(0, 60);
  const res = NextResponse.json({ ok: true, handle });
  res.cookies.set(DEMO_SESSION_COOKIE, signDemoSession({ handle, displayName, provider }), demoCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_SESSION_COOKIE, "", { ...demoCookieOptions(), maxAge: 0 });
  return res;
}
