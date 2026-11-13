import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthCookieOptions, getSupabasePublicConfig } from "@/lib/auth-config";

/** Cookie-aware Supabase client for Server Components, Route Handlers and Server Actions. */
export function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const cookieStore = cookies();
  return createServerClient(config.url, config.anonKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: middleware refreshes the session cookies instead.
        }
      },
    },
  });
}
