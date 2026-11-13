import { NextRequest, NextResponse } from "next/server";
import { getSessionForecaster } from "@/lib/auth-session";
import { attachSocialLink, getSocialLink } from "@/lib/reputation-store";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ link: getSocialLink(params.id) });
}

/** Attach the published X post URL to a forecast (owner only; verified X handle must match). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionForecaster();
  if (!session) {
    return NextResponse.json({ error: "Sign in to link your X post.", requiresAuth: true }, { status: 401 });
  }
  try {
    const body = await request.json();
    const link = attachSocialLink({ eventId: params.id, profile: session.profile, xPostUrl: String(body.xPostUrl || "") });
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not link post" }, { status: 400 });
  }
}
