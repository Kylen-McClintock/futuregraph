"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, RefreshCw, Scale } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { apiPath } from "@/lib/paths";
import { categoryColor, categoryLabel } from "@/lib/reputation-engine";
import type { AccuracyCategory, OracleProvider } from "@/types/futuregraph";

interface QuestionRow {
  nodeId: string;
  title: string;
  category: AccuracyCategory;
  closeDate: string | null;
  status: "open" | "closed_pending" | "resolved";
  isSandboxDrill: boolean;
  crowdProbability: number;
  forecastCount: number;
  forecasterCount: number;
  resolvedOutcome: 0 | 1 | null;
  oracle: {
    provider: OracleProvider;
    externalId: string | null;
    outcomeLabel: string | null;
    url: string | null;
    lastPrice: number | null;
    lastSyncedAt: string | null;
  };
  path: string;
}

interface Settlement {
  forecasterHandle: string;
  rpDelta: number;
}

function QuestionAdminRow({ q, onChanged }: { q: QuestionRow; onChanged: (msg: string) => void }) {
  const [provider, setProvider] = useState<OracleProvider>(q.oracle.provider);
  const [externalId, setExternalId] = useState(q.oracle.externalId || "");
  const [outcomeLabel, setOutcomeLabel] = useState(q.oracle.outcomeLabel || "");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);

  const linkOracle = async () => {
    setBusy("oracle");
    setError(null);
    const res = await fetch(apiPath(`/v1/questions/${encodeURIComponent(q.nodeId)}/oracle`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, externalId, outcomeLabel: outcomeLabel || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) setError(data.error || "Failed");
    else onChanged(provider === "editorial" ? `Unlinked oracle for ${q.nodeId}` : `Linked ${provider} ${externalId} → ${q.nodeId}`);
  };

  const resolve = async (outcome: 0 | 1) => {
    if (!window.confirm(`Resolve "${q.title.slice(0, 80)}" as ${outcome === 1 ? "YES" : "NO"}? Resolutions are immutable.`)) return;
    setBusy(`resolve-${outcome}`);
    setError(null);
    const res = await fetch(apiPath(`/v1/questions/${encodeURIComponent(q.nodeId)}/resolve`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, evidenceUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setSettlements(data.settlements || []);
    onChanged(`Resolved ${q.nodeId} ${outcome === 1 ? "YES" : "NO"} · settled ${(data.settlements || []).length} forecaster(s)`);
  };

  const resolved = q.status === "resolved";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold" style={{ color: categoryColor(q.category) }}>
              {categoryLabel(q.category)}
            </span>
            <span className="text-slate-500">closes {q.closeDate}</span>
            {q.isSandboxDrill && <span className="rounded bg-slate-800 px-1.5 text-slate-400">sandbox drill</span>}
            <span
              className={`rounded px-1.5 font-semibold ${
                resolved ? "bg-emerald-500/20 text-emerald-300" : q.status === "closed_pending" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/15 text-sky-300"
              }`}
            >
              {resolved ? `resolved ${q.resolvedOutcome === 1 ? "YES" : "NO"}` : q.status === "closed_pending" ? "closed · needs resolution" : "open"}
            </span>
          </div>
          <Link href={q.path} className="text-sm font-bold text-white hover:text-amber-300">
            {q.title}
          </Link>
          <div className="text-[11px] text-slate-400 tabular-nums">
            Crowd {Math.round(q.crowdProbability * 100)}% · {q.forecastCount} forecasts / {q.forecasterCount} forecasters
            {q.oracle.lastSyncedAt && ` · oracle synced ${q.oracle.lastSyncedAt.slice(0, 16).replace("T", " ")}`}
          </div>
        </div>
      </div>

      {!resolved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <fieldset className="rounded-lg border border-slate-800 p-2.5 space-y-2">
            <legend className="px-1 text-[11px] font-semibold text-slate-300">Resolution oracle</legend>
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor={`prov-${q.nodeId}`}>
                Provider
              </label>
              <select
                id={`prov-${q.nodeId}`}
                value={provider}
                onChange={(e) => setProvider(e.target.value as OracleProvider)}
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
              >
                <option value="editorial">Editorial only</option>
                <option value="polymarket">Polymarket</option>
                <option value="metaculus">Metaculus</option>
              </select>
              {provider !== "editorial" && (
                <>
                  <label className="sr-only" htmlFor={`ext-${q.nodeId}`}>
                    Market ID or slug
                  </label>
                  <input
                    id={`ext-${q.nodeId}`}
                    value={externalId}
                    onChange={(e) => setExternalId(e.target.value)}
                    placeholder={provider === "polymarket" ? "market id or slug" : "post id"}
                    className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  />
                  <label className="sr-only" htmlFor={`lbl-${q.nodeId}`}>
                    Outcome label (multi-outcome markets)
                  </label>
                  <input
                    id={`lbl-${q.nodeId}`}
                    value={outcomeLabel}
                    onChange={(e) => setOutcomeLabel(e.target.value)}
                    placeholder="outcome label (opt.)"
                    className="w-36 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  />
                </>
              )}
              <button
                type="button"
                onClick={linkOracle}
                disabled={busy !== null}
                className="rounded-md border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                {busy === "oracle" ? "Saving…" : "Save"}
              </button>
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-slate-800 p-2.5 space-y-2">
            <legend className="px-1 text-[11px] font-semibold text-slate-300">Editorial adjudication</legend>
            <label className="sr-only" htmlFor={`ev-${q.nodeId}`}>
              Primary-source evidence URL
            </label>
            <input
              id={`ev-${q.nodeId}`}
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https:// primary-source evidence (required)"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => resolve(1)}
                disabled={busy !== null || !evidenceUrl}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white keep-white hover:bg-emerald-500 disabled:opacity-40"
              >
                Resolve YES
              </button>
              <button
                type="button"
                onClick={() => resolve(0)}
                disabled={busy !== null || !evidenceUrl}
                className="rounded-md bg-rose-600 px-3 py-1 text-xs font-bold text-white keep-white hover:bg-rose-500 disabled:opacity-40"
              >
                Resolve NO
              </button>
            </div>
          </fieldset>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
      {settlements && (
        <ul className="flex flex-wrap gap-2 text-[11px]">
          {settlements.map((s) => (
            <li key={s.forecasterHandle} className={`rounded px-2 py-0.5 font-mono ${s.rpDelta >= 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
              @{s.forecasterHandle} {s.rpDelta >= 0 ? "+" : ""}
              {s.rpDelta} RP
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResolutionsAdminPanel() {
  const { forecaster, openSignIn } = useAuth();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"actionable" | "open" | "resolved" | "all">("actionable");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(apiPath("/v1/questions"), { cache: "no-store" });
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const syncNow = async () => {
    setSyncing(true);
    const res = await fetch(apiPath("/v1/oracles/sync"), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) {
      setBanner(data.error || "Sync failed");
      return;
    }
    const reports = (data.reports || []) as Array<{ nodeId: string; status: string; message: string }>;
    setBanner(reports.length === 0 ? "No questions have a linked Polymarket / Metaculus oracle yet." : reports.map((r) => `${r.nodeId}: ${r.message}`).join(" · "));
    void load();
  };

  const visible = questions.filter((q) => {
    if (filter === "all") return true;
    if (filter === "resolved") return q.status === "resolved";
    if (filter === "open") return q.status !== "resolved";
    return q.status !== "resolved" && (q.status === "closed_pending" || q.nodeId.startsWith("node-cp-") || q.oracle.provider !== "editorial");
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Scale className="h-5 w-5 text-amber-400" aria-hidden="true" />
            Resolutions &amp; Oracles
          </h2>
          <p className="text-xs text-slate-400">
            Link Polymarket / Metaculus markets for automatic resolution (daily cron), or adjudicate with a primary-source citation. Each
            resolution is immutable, signs a SHA-256 receipt, and settles every forecaster&apos;s Reputation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!forecaster?.isAdmin && (
            <button type="button" onClick={() => openSignIn({ reason: "Editors and admins can resolve questions." })} className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs text-amber-200">
              Sign in as editor
            </button>
          )}
          <button
            type="button"
            onClick={syncNow}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync oracle resolutions now
          </button>
        </div>
      </div>
      {banner && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{banner}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter questions">
        {(["actionable", "open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${filter === f ? "border-amber-500/60 bg-amber-500/15 text-amber-200" : "border-slate-800 text-slate-300"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-xs text-slate-400">Loading questions…</p>
      ) : (
        <div className="space-y-3">
          {visible.map((q) => (
            <QuestionAdminRow
              key={q.nodeId}
              q={q}
              onChanged={(msg) => {
                setBanner(msg);
                void load();
              }}
            />
          ))}
          {visible.length === 0 && <p className="text-xs text-slate-400">Nothing here.</p>}
        </div>
      )}
    </div>
  );
}
