/**
 * Isomorphic auth configuration shared by the browser client, server client and middleware.
 * Using the same Supabase project + cookie scope on agifutures.org and agifutures.org/futuregraph
 * makes a single sign-in valid on both sites.
 */
export function getSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

export function getAuthCookieOptions(): {
  path: string;
  sameSite: "lax";
  secure: boolean;
  domain?: string;
} {
  const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();
  return {
    // Root path so the session is shared between agifutures.org and /futuregraph.
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(domain ? { domain } : {}),
  };
}

/** X OAuth 2.0 scopes: read-only identity (users.read requires tweet.read on X's API). */
export const X_OAUTH_SCOPES = "users.read tweet.read";
