"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Loader2, LogOut, Mail, Trophy, UserRound } from "lucide-react";
import { useAuth, XLogo } from "@/components/AuthContext";

export function AuthNavButton() {
  const { loading, forecaster, scorecard, config, openSignIn, signOut, linkX, addEmail } = useAuth();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (detailsRef.current?.open && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (loading) {
    return (
      <span className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading account</span>
      </span>
    );
  }

  if (!forecaster) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-950 hover:bg-slate-200 keep-white"
      >
        <XLogo className="h-3.5 w-3.5" />
        <span className="text-slate-950">Sign in</span>
        <span className="hidden lg:inline font-normal text-slate-600">· X / AGIFutures</span>
      </button>
    );
  }

  const p = forecaster.profile;
  const hasX = forecaster.linkedProviders.includes("x");
  const hasAgi = forecaster.linkedProviders.includes("agifutures");
  const isDemo = forecaster.authProvider === "demo";

  return (
    <details ref={detailsRef} className="relative">
      <summary className="list-none cursor-pointer flex h-8 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-100 hover:border-amber-500/50">
        {p.xAvatarUrl || p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.xAvatarUrl || p.avatarUrl} alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
        ) : (
          <UserRound className="h-4 w-4 text-sky-400" aria-hidden="true" />
        )}
        <span className="font-semibold">@{p.xHandle || p.handle}</span>
        {scorecard && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono tabular-nums ${
              scorecard.isVerified ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {scorecard.overallRp.toLocaleString("en-US")} RP
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-1.5 w-72 rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-2xl space-y-3">
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-white">{p.displayName}</div>
          <div className="text-[11px] text-slate-400">
            {scorecard?.isVerified
              ? `Verified · ${scorecard.tierLabel}${scorecard.percentile !== null ? ` · top ${Math.max(1, 100 - scorecard.percentile)}%` : ""}`
              : `Provisional · ${scorecard?.resolvedCount ?? 0}/5 resolved calls`}
            {isDemo && " · demo session"}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Link href={`/u/${p.handle}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800">
            <UserRound className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            My Verified Forecaster Passport
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800">
            <Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Leaderboard & open checkpoints
          </Link>
        </div>
        <div className="rounded-lg border border-slate-800 p-2.5 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Linked accounts</div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-200">
              <XLogo className="h-3 w-3" /> X
            </span>
            {hasX ? (
              <span className="text-emerald-300">{isDemo ? "demo" : `@${p.xHandle}`}</span>
            ) : config.supabaseConfigured && !isDemo ? (
              <button type="button" onClick={() => void linkX()} className="font-semibold text-sky-300 hover:underline">
                Connect X
              </button>
            ) : (
              <span className="text-slate-500">not linked</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Mail className="h-3 w-3" aria-hidden="true" /> AGIFutures.org
            </span>
            <span className={hasAgi ? "text-emerald-300" : "text-slate-500"}>{hasAgi ? forecaster.email || "linked" : "not linked"}</span>
          </div>
          {!hasAgi && config.supabaseConfigured && !isDemo && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setEmailMsg(await addEmail(email));
              }}
              className="flex gap-1.5"
            >
              <label htmlFor="fg-link-email" className="sr-only">
                Email to link
              </label>
              <input
                id="fg-link-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add email"
                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-white"
              />
              <button type="submit" className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-amber-500/50">
                Link
              </button>
            </form>
          )}
          {emailMsg && (
            <p role="status" className="text-[11px] text-slate-300">
              {emailMsg}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 px-2 py-1.5 text-xs text-slate-300 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </details>
  );
}
