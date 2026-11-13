"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import type { ForecasterScorecard, SessionForecaster } from "@/types/futuregraph";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { X_OAUTH_SCOPES } from "@/lib/auth-config";
import { BASE_PATH, apiPath } from "@/lib/paths";
import { LIGHT_DISMISS_ATTRS, useLightDismissFallback } from "@/components/dialog-utils";

interface AuthConfig {
  supabaseConfigured: boolean;
  demoAuthEnabled: boolean;
}

interface OpenSignInOptions {
  reason?: string;
  /** Path (relative to basePath) to return to after an OAuth redirect. Defaults to the current page. */
  next?: string;
  /** Called after a no-redirect sign-in (demo) succeeds, e.g. to auto-submit a pending forecast. */
  onSuccess?: () => void;
}

interface AuthContextValue {
  loading: boolean;
  forecaster: SessionForecaster | null;
  scorecard: ForecasterScorecard | null;
  config: AuthConfig;
  refresh: () => Promise<void>;
  openSignIn: (opts?: OpenSignInOptions) => void;
  signOut: () => Promise<void>;
  linkX: () => Promise<void>;
  addEmail: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

function X_LOGO({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
export { X_LOGO as XLogo };

function currentPathWithSearch(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

function callbackUrl(next: string): string {
  return `${window.location.origin}${BASE_PATH}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [forecaster, setForecaster] = useState<SessionForecaster | null>(null);
  const [scorecard, setScorecard] = useState<ForecasterScorecard | null>(null);
  const [config, setConfig] = useState<AuthConfig>({ supabaseConfigured: false, demoAuthEnabled: false });

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useLightDismissFallback(dialogRef);
  const titleId = useId();
  const [reason, setReason] = useState<string | undefined>();
  const [nextPath, setNextPath] = useState<string>("/");
  const pendingSuccess = useRef<(() => void) | undefined>();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [demoHandle, setDemoHandle] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiPath("/auth/session"), { cache: "no-store" });
      const data = await res.json();
      setForecaster(data.forecaster ?? null);
      setScorecard(data.scorecard ?? null);
      if (data.config) setConfig(data.config);
    } catch {
      setForecaster(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const supabase = getSupabaseBrowserClient();
    const sub = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void refresh();
    });
    // Surface OAuth errors returned by /auth/callback.
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (authError) {
      setMessage({ tone: "error", text: authError });
      requestAnimationFrame(() => dialogRef.current?.showModal());
    }
    return () => sub?.data.subscription.unsubscribe();
  }, [refresh]);

  const openSignIn = useCallback((opts?: OpenSignInOptions) => {
    setReason(opts?.reason);
    setNextPath(opts?.next || currentPathWithSearch());
    pendingSuccess.current = opts?.onSuccess;
    setMessage(null);
    dialogRef.current?.showModal();
  }, []);

  const finishInlineSignIn = useCallback(async () => {
    await refresh();
    dialogRef.current?.close();
    const cb = pendingSuccess.current;
    pendingSuccess.current = undefined;
    cb?.();
  }, [refresh]);

  const signInWithProvider = async (provider: "x" | "google") => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(provider);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl(nextPath),
        ...(provider === "x" ? { scopes: X_OAUTH_SCOPES } : {}),
      },
    });
    if (error) {
      setBusy(null);
      setMessage({ tone: "error", text: error.message });
    }
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email) return;
    setBusy("email");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(nextPath) },
    });
    setBusy(null);
    setMessage(
      error
        ? { tone: "error", text: error.message }
        : { tone: "info", text: `Check ${email} for your AGIFutures.org sign-in link. Your draft is saved.` }
    );
  };

  const demoSignIn = async (provider: "x" | "agifutures", handleOverride?: string) => {
    const handle = (handleOverride || demoHandle).trim();
    if (handle.length < 2) {
      setMessage({ tone: "error", text: "Enter a demo handle (2+ characters)." });
      return;
    }
    setBusy(`demo-${provider}`);
    const res = await fetch(apiPath("/auth/demo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, provider }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ tone: "error", text: data.error || "Demo sign-in failed" });
      return;
    }
    await finishInlineSignIn();
  };

  const signOut = useCallback(async () => {
    await getSupabaseBrowserClient()?.auth.signOut().catch(() => undefined);
    await fetch(apiPath("/auth/demo"), { method: "DELETE" }).catch(() => undefined);
    await refresh();
  }, [refresh]);

  const linkX = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.linkIdentity({
      provider: "x",
      options: { redirectTo: callbackUrl(currentPathWithSearch()), scopes: X_OAUTH_SCOPES },
    });
    if (error) {
      setMessage({ tone: "error", text: `Couldn't link X: ${error.message}` });
      dialogRef.current?.showModal();
    }
  }, []);

  const addEmail = useCallback(async (newEmail: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return "Supabase auth isn't configured.";
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: callbackUrl(currentPathWithSearch()) }
    );
    return error ? error.message : `Confirmation sent to ${newEmail}. Click it to link your AGIFutures.org email.`;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, forecaster, scorecard, config, refresh, openSignIn, signOut, linkX, addEmail }),
    [loading, forecaster, scorecard, config, refresh, openSignIn, signOut, linkX, addEmail]
  );

  const oauthDisabled = !config.supabaseConfigured;

  return (
    <AuthContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...LIGHT_DISMISS_ATTRS}
        className="p-0"
        onClose={() => {
          setBusy(null);
          pendingSuccess.current = undefined;
        }}
      >
        <div className="p-5 sm:p-6 space-y-4 w-[min(92vw,460px)]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 id={titleId} className="text-lg font-extrabold text-white">
                Sign in to lock it in
              </h2>
              <p className="text-xs text-slate-400">
                {reason ||
                  "One account across AGIFutures.org and FutureGraph. Link X to put your verified accuracy score on your profile."}
              </p>
            </div>
            <form method="dialog">
              <button
                type="submit"
                aria-label="Close sign-in dialog"
                className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white"
              >
                Close
              </button>
            </form>
          </div>

          {message && (
            <div
              role={message.tone === "error" ? "alert" : "status"}
              className={`rounded-lg border p-2.5 text-xs ${
                message.tone === "error"
                  ? "border-rose-500/40 bg-rose-950/40 text-rose-200"
                  : "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="button"
            autoFocus
            disabled={oauthDisabled || busy !== null}
            onClick={() => signInWithProvider("x")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-50 keep-white"
          >
            {busy === "x" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X_LOGO />}
            <span className="text-slate-950">Continue with X</span>
          </button>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
            Read-only: we verify your @handle and avatar. We never post on your behalf.
          </p>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            <span>or your AGIFutures.org account</span>
            <span className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            disabled={oauthDisabled || busy !== null}
            onClick={() => signInWithProvider("google")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-amber-500/50 disabled:opacity-50"
          >
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span aria-hidden="true">G</span>}
            Continue with Google
          </button>

          <form onSubmit={signInWithEmail} className="flex gap-2">
            <label htmlFor={`${titleId}-email`} className="sr-only">
              Email address
            </label>
            <input
              id={`${titleId}-email`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={oauthDisabled}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={oauthDisabled || busy !== null}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-500/50 disabled:opacity-50"
            >
              {busy === "email" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Email link
            </button>
          </form>

          {oauthDisabled && (
            <p className="text-[11px] text-amber-300">
              Supabase auth isn&apos;t configured on this deployment, so X / AGIFutures sign-in is unavailable.
            </p>
          )}

          {config.demoAuthEnabled && (
            <div className="rounded-xl border border-dashed border-violet-500/40 bg-violet-950/20 p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
                Local demo sign-in · not real OAuth
              </div>
              <p className="text-[11px] text-slate-400">
                For local and sandbox testing only. Demo identities are labeled and never get a verified X badge.
              </p>
              <div className="flex gap-2">
                <label htmlFor={`${titleId}-demo`} className="sr-only">
                  Demo handle
                </label>
                <input
                  id={`${titleId}-demo`}
                  value={demoHandle}
                  onChange={(e) => setDemoHandle(e.target.value)}
                  placeholder="demo_handle"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => demoSignIn("x")}
                  disabled={busy !== null}
                  className="rounded-lg border border-violet-500/40 bg-violet-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-violet-200 hover:bg-violet-500/25"
                >
                  as X user
                </button>
                <button
                  type="button"
                  onClick={() => demoSignIn("agifutures")}
                  disabled={busy !== null}
                  className="rounded-lg border border-violet-500/40 bg-violet-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-violet-200 hover:bg-violet-500/25"
                >
                  as AGIFutures user
                </button>
              </div>
              <button
                type="button"
                onClick={() => demoSignIn("agifutures", "elena_vance")}
                disabled={busy !== null}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300 hover:underline"
              >
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Use sandbox editor @elena_vance (Verified, can resolve questions)
              </button>
            </div>
          )}
        </div>
      </dialog>
    </AuthContext.Provider>
  );
}
