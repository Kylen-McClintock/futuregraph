/**
 * Maps a Supabase auth user (with linked X and/or AGIFutures email/Google identities) onto a
 * FutureGraph profile. X handles come only from the OAuth identity payload, never from user input.
 */
import type { Profile } from "@/types/futuregraph";

export interface AuthIdentityLike {
  provider: string;
  identity_data?: Record<string, unknown> | null;
  created_at?: string | null;
}

export interface AuthUserLike {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown> | null;
  identities?: AuthIdentityLike[] | null;
}

export interface DerivedIdentity {
  authUserId: string;
  email: string | null;
  displayName: string;
  baseHandle: string;
  xUserId?: string;
  xHandle?: string;
  xAvatarUrl?: string;
  xVerifiedAt?: string;
  avatarUrl?: string;
  linkedProviders: Array<"x" | "agifutures">;
  primaryProvider: "x" | "agifutures";
}

const X_PROVIDERS = new Set(["x", "twitter"]);

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function sanitizeHandle(raw: string): string {
  const cleaned = raw.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return (cleaned || "forecaster").slice(0, 24);
}

/** X avatars come back as _normal (48px); request the 400×400 variant for cards. */
export function upgradeXAvatar(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/_normal(\.[a-z]+)$/i, "_400x400$1");
}

export function deriveIdentityFromAuthUser(user: AuthUserLike): DerivedIdentity {
  const identities = user.identities || [];
  const xIdentity = identities.find((i) => X_PROVIDERS.has(i.provider));
  const otherIdentities = identities.filter((i) => !X_PROVIDERS.has(i.provider));
  const meta = user.user_metadata || {};
  const xData = (xIdentity?.identity_data || {}) as Record<string, unknown>;

  const xHandle = xIdentity
    ? str(xData.user_name) || str(xData.preferred_username) || str(xData.screen_name)
    : undefined;
  const xUserId = xIdentity ? str(xData.provider_id) || str(xData.sub) || str(xData.id) : undefined;
  const xAvatarUrl = xIdentity ? upgradeXAvatar(str(xData.avatar_url) || str(xData.picture)) : undefined;

  const email = user.email || null;
  const displayName =
    (xIdentity && (str(xData.name) || str(xData.full_name))) ||
    str(meta.full_name) ||
    str(meta.name) ||
    (xHandle ? `@${xHandle}` : undefined) ||
    (email ? email.split("@")[0] : undefined) ||
    "FutureGraph Forecaster";

  const baseHandle = sanitizeHandle(
    xHandle || str(meta.user_name) || str(meta.preferred_username) || (email ? email.split("@")[0] : "") || `forecaster_${user.id.slice(0, 6)}`
  );

  const linkedProviders: Array<"x" | "agifutures"> = [];
  if (xIdentity) linkedProviders.push("x");
  if (otherIdentities.length > 0 || (!xIdentity && email)) linkedProviders.push("agifutures");

  return {
    authUserId: user.id,
    email,
    displayName,
    baseHandle,
    xUserId,
    xHandle,
    xAvatarUrl,
    xVerifiedAt: xIdentity ? str(xIdentity.created_at) || new Date().toISOString() : undefined,
    avatarUrl: xAvatarUrl || str(meta.avatar_url) || str(meta.picture),
    linkedProviders,
    primaryProvider: xIdentity ? "x" : "agifutures",
  };
}

/**
 * Builds (or refreshes) the FutureGraph profile for an authenticated user. Handles are unique:
 * if the derived handle belongs to a different principal, a short suffix is appended.
 */
export function buildProfileForIdentity(identity: DerivedIdentity, existingProfiles: Profile[]): Profile {
  const existing = existingProfiles.find((p) => p.authUserId === identity.authUserId);
  let handle = existing?.handle || identity.baseHandle;
  if (!existing) {
    const taken = (h: string) => existingProfiles.some((p) => p.handle.toLowerCase() === h.toLowerCase());
    if (taken(handle)) handle = `${identity.baseHandle.slice(0, 17)}_${identity.authUserId.replace(/-/g, "").slice(0, 6)}`;
  }
  return {
    ...(existing || {}),
    id: existing?.id || `prof-${identity.authUserId}`,
    handle,
    displayName: identity.displayName,
    role: existing?.role || "user",
    participantType: "human",
    bio: existing?.bio || "FutureGraph forecaster",
    joinedAt: existing?.joinedAt || new Date().toISOString(),
    authUserId: identity.authUserId,
    xUserId: identity.xUserId,
    xHandle: identity.xHandle,
    xAvatarUrl: identity.xAvatarUrl,
    xVerifiedAt: identity.xHandle ? existing?.xVerifiedAt || identity.xVerifiedAt : undefined,
    avatarUrl: identity.avatarUrl,
    agifuturesLinked: identity.linkedProviders.includes("agifutures"),
    isSandbox: false,
  };
}

/** True only for X identities proved through real X OAuth (not local demo sessions). */
export function hasVerifiedX(profile: Pick<Profile, "xHandle" | "xUserId" | "isSandbox">): boolean {
  return Boolean(profile.xHandle && profile.xUserId && !profile.xUserId.startsWith("demo-") && !profile.isSandbox);
}
