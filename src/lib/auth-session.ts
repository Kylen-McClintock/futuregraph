import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Profile, SessionForecaster } from "@/types/futuregraph";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/auth-config";
import { buildProfileForIdentity, deriveIdentityFromAuthUser, sanitizeHandle } from "@/lib/identity";
import { getStore } from "@/lib/store";
import { getReputationState } from "@/lib/reputation-store";

export const DEMO_SESSION_COOKIE = "fg_demo_session";
const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

/**
 * Local demo sign-in for development and offline sandboxes, where real X OAuth can't complete.
 * Enabled by default outside production; production requires FUTUREGRAPH_DEMO_AUTH=true.
 * Demo identities are always labeled as such and never shown with a verified X badge.
 */
export function isDemoAuthEnabled(): boolean {
  if (process.env.FUTUREGRAPH_DEMO_AUTH === "true") return true;
  if (process.env.FUTUREGRAPH_DEMO_AUTH === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function demoSecret(): string {
  return (
    process.env.FUTUREGRAPH_SESSION_SECRET ||
    process.env.FUTUREGRAPH_RECEIPT_SIGNING_SECRET ||
    "futuregraph-dev-demo-session-secret"
  );
}

interface DemoSessionPayload {
  handle: string;
  displayName: string;
  provider: "x" | "agifutures";
  issuedAt: number;
}

export function signDemoSession(payload: Omit<DemoSessionPayload, "issuedAt">): string {
  const body = Buffer.from(JSON.stringify({ ...payload, issuedAt: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", demoSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyDemoSession(token: string | undefined): DemoSessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", demoSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as DemoSessionPayload;
    if (Date.now() - payload.issuedAt > DEMO_SESSION_MAX_AGE_SECONDS * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function demoCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  };
}

function listEnv(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function isAdminProfile(profile: Profile, email: string | null | undefined, isDemo: boolean): boolean {
  if (isDemo) return profile.role === "admin" || profile.role === "editor";
  if (email && listEnv("FUTUREGRAPH_ADMIN_EMAILS").includes(email.toLowerCase())) return true;
  if (profile.xHandle && listEnv("FUTUREGRAPH_ADMIN_X_HANDLES").includes(profile.xHandle.toLowerCase())) return true;
  return false;
}

function upsertStoreProfile(profile: Profile): Profile {
  const store = getStore();
  const idx = store.profiles.findIndex((p) => p.id === profile.id || (profile.authUserId && p.authUserId === profile.authUserId));
  if (idx >= 0) {
    store.profiles[idx] = { ...store.profiles[idx], ...profile };
    return store.profiles[idx];
  }
  store.profiles.push(profile);
  return profile;
}

function sessionFromDemo(payload: DemoSessionPayload): SessionForecaster {
  getReputationState(); // ensures sandbox profiles are flagged before we look them up
  const store = getStore();
  let handle = sanitizeHandle(payload.handle);
  let existing = store.profiles.find((p) => p.handle.toLowerCase() === handle.toLowerCase() && p.participantType === "human");
  // Demo sessions may only reuse sandbox or demo-created profiles — never a seeded real person's.
  if (existing && !existing.isSandbox && !existing.id.startsWith("prof-demo-")) {
    handle = sanitizeHandle(`${handle}_demo`);
    existing = store.profiles.find((p) => p.handle.toLowerCase() === handle.toLowerCase());
  }
  const base: Profile = existing || {
    id: `prof-demo-${handle.toLowerCase()}`,
    handle,
    displayName: payload.displayName || handle,
    role: "user",
    participantType: "human",
    bio: "Local demo session (not a verified account)",
    joinedAt: new Date().toISOString(),
  };
  const profile = upsertStoreProfile({
    ...base,
    isSandbox: true,
    ...(payload.provider === "x" && !base.xHandle
      ? { xHandle: handle, xUserId: `demo-${handle.toLowerCase()}` }
      : {}),
    agifuturesLinked: base.agifuturesLinked || payload.provider === "agifutures",
  });
  return {
    profile,
    authProvider: "demo",
    linkedProviders: [payload.provider],
    email: null,
    isAdmin: isAdminProfile(profile, null, true),
  };
}

/** Resolves the authenticated human forecaster for this request (Supabase SSO → demo session). */
export async function getSessionForecaster(): Promise<SessionForecaster | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data } = (await supabase?.auth.getUser()) || { data: { user: null } };
      if (data.user) {
        const identity = deriveIdentityFromAuthUser(data.user);
        const profile = upsertStoreProfile(buildProfileForIdentity(identity, getStore().profiles));
        return {
          profile,
          authProvider: identity.primaryProvider,
          linkedProviders: identity.linkedProviders,
          email: identity.email,
          isAdmin: isAdminProfile(profile, identity.email, false),
        };
      }
    } catch {
      // Supabase unreachable — fall through to demo session if enabled.
    }
  }
  if (isDemoAuthEnabled()) {
    const payload = verifyDemoSession(cookies().get(DEMO_SESSION_COOKIE)?.value);
    if (payload) return sessionFromDemo(payload);
  }
  return null;
}

/**
 * Admin / automation authorization: an admin session, the FUTUREGRAPH_ADMIN_SECRET header, or a
 * Vercel Cron bearer token (CRON_SECRET).
 */
export async function authorizeAdmin(request: NextRequest): Promise<{ ok: boolean; actor: string }> {
  const adminSecret = process.env.FUTUREGRAPH_ADMIN_SECRET;
  const headerSecret = request.headers.get("x-futuregraph-admin-secret");
  if (adminSecret && headerSecret && safeEqual(adminSecret, headerSecret)) return { ok: true, actor: "admin_secret" };
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return { ok: true, actor: "cron" };
  const session = await getSessionForecaster();
  if (session?.isAdmin) return { ok: true, actor: session.profile.handle };
  return { ok: false, actor: session?.profile.handle || "anonymous" };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
