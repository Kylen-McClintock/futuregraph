import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { BASE_PATH, safeRedirectPath } from "@/lib/paths";

/**
 * OAuth PKCE callback for X (OAuth 2.0), Google and email magic links — for both first sign-in
 * and supabase.auth.linkIdentity(). Redirects back to the sanitized `next` path.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const target = new URL(`${BASE_PATH}${next}`, url.origin);

  if (providerError) {
    target.searchParams.set("auth_error", providerError.slice(0, 200));
    return NextResponse.redirect(target);
  }

  if (code) {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      target.searchParams.set("auth_error", "Supabase auth is not configured on this deployment.");
      return NextResponse.redirect(target);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      target.searchParams.set("auth_error", error.message.slice(0, 200));
      return NextResponse.redirect(target);
    }
  }
  return NextResponse.redirect(target);
}
