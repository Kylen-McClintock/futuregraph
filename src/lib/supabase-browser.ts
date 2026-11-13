import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthCookieOptions } from "@/lib/auth-config";

let browserClient: SupabaseClient | null = null;

/** Singleton browser client sharing the root-path auth cookie with AGIFutures.org. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  browserClient = createBrowserClient(url, anonKey, { cookieOptions: getAuthCookieOptions() });
  return browserClient;
}
