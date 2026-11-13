import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Bot, FlaskConical, Target, Trophy, User } from "lucide-react";
import { getAllScorecards, listScorableQuestions } from "@/lib/reputation-store";
import { getCrowdProbability } from "@/lib/store";
import {
  ACCURACY_CATEGORIES,
  categoryColor,
  categoryLabel,
  computeProjectedReputationDelta,
} from "@/lib/reputation-engine";
import { nodeForecastPath } from "@/lib/paths";
import type { AccuracyCategory } from "@/types/futuregraph";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forecaster Leaderboard — FutureGraph Verified Accuracy",
  description:
    "Verified, receipt-backed forecast accuracy across AGI, AI safety, governance, economy, longevity and frontier science. Long-shot calls that hit pay the most.",
};

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default function LeaderboardPage({
  searchParams,
}: {
  searchParams: { category?: string; type?: string };
}) {
  const category = ACCURACY_CATEGORIES.some((c) => c.id === searchParams.category)
    ? (searchParams.category as AccuracyCategory)
    : null;
  const type = searchParams.type === "ai_agent" ? "ai_agent" : "human";
  const cards = getAllScorecards(type)
    .map((card) => {
      const cat = category ? card.categories.find((c) => c.category === category)! : null;
      return {
        card,
        rp: cat ? cat.reputationPoints : card.overallRp,
        resolved: cat ? cat.resolvedCount : card.resolvedCount,
        verified: cat ? cat.isVerified : card.isVerified,
        tierLabel: cat ? (cat.isVerified ? cat.tier : "provisional") : card.tierLabel,
        percentile: cat ? cat.percentile : card.percentile,
        brier: cat ? cat.avgBrier : card.avgBrier,
      };
    })
    .filter((row) => row.resolved > 0 || (!category && row.card.activeCount > 0))
    .sort((a, b) => b.rp - a.rp || b.resolved - a.resolved);

  const questions = listScorableQuestions();
  const openCheckpoints = questions.filter((q) => q.node.scenarioId === "scen-checkpoints" && !q.node.question?.isSandboxDrill && q.status !== "resolved");
  const drills = questions.filter((q) => q.node.question?.isSandboxDrill);

  const qs = (next: { category?: string | null; type?: string }) => {
    const p = new URLSearchParams();
    const c = next.category === undefined ? category : next.category;
    const t = next.type ?? type;
    if (c) p.set("category", c);
    if (t !== "human") p.set("type", t);
    const s = p.toString();
    return s ? `/leaderboard?${s}` : "/leaderboard";
  };

  const examples = [
    { label: "Underdog hit", q: 0.1, p: 0.8, m: 2, o: 1 as const },
    { label: "Riding the chalk (right)", q: 0.85, p: 0.85, m: 1, o: 1 as const },
    { label: "Riding the chalk (wrong)", q: 0.85, p: 0.9, m: 2, o: 0 as const },
  ].map((ex) => {
    const pr = computeProjectedReputationDelta({ probability: ex.p, crowdProbability: ex.q, confidenceMultiplier: ex.m, currentRp: 1000, isVerified: true });
    return { ...ex, delta: ex.o === 1 ? pr.deltaIfYes : pr.deltaIfNo };
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-mono font-semibold text-amber-300">
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          Verified forecast accuracy
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Forecaster Leaderboard</h1>
        <p className="text-sm text-slate-300 pretty-copy">
          Every call is sealed with a SHA-256 receipt and the crowd consensus at lock-in. Reputation uses a strictly proper hybrid log
          score: calling a long shot that happens pays big, riding a consensus that busts costs big, and your confidence wager scales both.
          Verified status needs 5 resolved calls.
        </p>
      </header>

      <nav aria-label="Leaderboard filters" className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "human", label: "Human forecasters", icon: User },
            { id: "ai_agent", label: "AI agents", icon: Bot },
          ].map((t) => {
            const Icon = t.icon;
            const active = type === t.id;
            return (
              <Link
                key={t.id}
                href={qs({ type: t.id })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                  active ? "border-amber-500/50 bg-amber-500/15 text-amber-200" : "border-slate-800 text-slate-300 hover:border-slate-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={qs({ category: null })}
            aria-current={!category ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${!category ? "border-white/60 bg-white/10 text-white" : "border-slate-800 text-slate-300"}`}
          >
            Overall
          </Link>
          {ACCURACY_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={qs({ category: c.id })}
              aria-current={category === c.id ? "page" : undefined}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={
                category === c.id
                  ? { borderColor: c.color, color: c.color, backgroundColor: `${c.color}22` }
                  : { borderColor: "rgba(148,163,184,0.25)", color: "#cbd5e1" }
              }
            >
              {c.label}
            </Link>
          ))}
        </div>
      </nav>

      <section aria-labelledby="board-heading" className="space-y-3">
        <h2 id="board-heading" className="text-lg font-bold text-white">
          {category ? categoryLabel(category) : "Overall"} · {type === "ai_agent" ? "AI agents" : "Humans"}
        </h2>
        {cards.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            No resolved calls in this view yet. Lock in forecasts on the open checkpoints below to get on the board.
          </p>
        ) : (
          <div className="fg-table-container">
            <table className="fg-responsive-table text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th scope="col" className="p-2.5">Forecaster</th>
                  <th scope="col" className="p-2.5">Reputation</th>
                  <th scope="col" className="p-2.5">Tier</th>
                  <th scope="col" className="p-2.5">Resolved</th>
                  <th scope="col" className="p-2.5">Percentile</th>
                  <th scope="col" className="p-2.5">Avg Brier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {cards.map((row, idx) => (
                  <tr key={row.card.handle} className="bg-slate-950/70">
                    <th scope="row" className="p-2.5 font-normal">
                      <Link href={`/u/${row.card.handle}`} className="flex items-center gap-2 text-white hover:text-amber-300">
                        <span className="font-mono text-slate-500">{idx + 1}.</span>
                        <span className="font-semibold">@{row.card.handle}</span>
                        {row.card.includesSandboxDrills && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">sandbox</span>
                        )}
                      </Link>
                    </th>
                    <td className="p-2.5 font-mono font-bold text-amber-300 tabular-nums">{row.rp.toLocaleString("en-US")} RP</td>
                    <td className="p-2.5 capitalize">
                      <span className={row.verified ? "text-emerald-300" : "text-slate-400"}>{row.tierLabel}</span>
                    </td>
                    <td className="p-2.5 font-mono tabular-nums">{row.resolved}</td>
                    <td className="p-2.5 font-mono tabular-nums">{row.percentile !== null ? `${row.percentile}th` : "—"}</td>
                    <td className="p-2.5 font-mono tabular-nums">{row.brier !== null ? row.brier.toFixed(3) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="open-checkpoints" aria-labelledby="checkpoints-heading" className="space-y-3">
        <h2 id="checkpoints-heading" className="flex items-center gap-2 text-lg font-bold text-white">
          <Target className="h-5 w-5 text-sky-400" aria-hidden="true" />
          Open near-term checkpoints
        </h2>
        <p className="text-xs text-slate-400 pretty-copy">
          Real, unresolved questions with explicit resolution criteria. They resolve via the Editorial Admin or a linked Polymarket /
          Metaculus market, so you can build a Verified record in months rather than waiting for 2030.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {openCheckpoints.map((q) => (
            <Link
              key={q.node.id}
              href={nodeForecastPath(q.node)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 hover:border-amber-500/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold" style={{ color: categoryColor(q.category) }}>
                  {categoryLabel(q.category)}
                </span>
                <span className="text-[11px] font-mono text-slate-400">closes {q.node.question?.closeDate}</span>
              </div>
              <div className="text-sm font-bold text-white">{q.node.title.replace(/^Checkpoint:\s*/, "")}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Crowd <span className="font-mono text-sky-300">{pct(getCrowdProbability(q.node))}</span>
                  {q.forecastCount === 0 && !q.node.question?.oracleLastPrice ? " (no forecasts yet)" : ""}
                </span>
                <span>
                  {q.forecasterCount} forecaster{q.forecasterCount === 1 ? "" : "s"}
                  {q.node.question?.oracleProvider && q.node.question.oracleProvider !== "editorial" ? ` · ${q.node.question.oracleProvider} oracle` : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="scoring-heading" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
        <h2 id="scoring-heading" className="text-lg font-bold text-white">How Reputation is scored</h2>
        <p className="text-xs text-slate-300 pretty-copy">
          ΔRP = conviction × timing weight × [50·log₂(p/crowd) + 50·log₂(p/0.5)], using the probabilities you and the crowd gave the outcome
          that happened. The rule is strictly proper: your expected score is highest when you report what you truly believe. The
          confidence wager scales the stakes, not the honesty incentive. Calling it early earns full weight; positions taken in the final
          quarter of a question&apos;s window decay toward 0.1× (anti-sniping). Every miss stays on your record.
        </p>
        <div className="fg-table-container">
          <table className="fg-responsive-table text-left text-xs">
            <thead>
              <tr className="text-slate-400">
                <th scope="col" className="p-2">Scenario</th>
                <th scope="col" className="p-2">Crowd</th>
                <th scope="col" className="p-2">You</th>
                <th scope="col" className="p-2">Wager</th>
                <th scope="col" className="p-2">Outcome</th>
                <th scope="col" className="p-2">ΔRP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {examples.map((ex) => (
                <tr key={ex.label}>
                  <th scope="row" className="p-2 font-normal text-slate-200">{ex.label}</th>
                  <td className="p-2 font-mono">{pct(ex.q)}</td>
                  <td className="p-2 font-mono">{pct(ex.p)}</td>
                  <td className="p-2 font-mono">{ex.m}×</td>
                  <td className="p-2 font-mono">{ex.o === 1 ? "YES" : "NO"}</td>
                  <td className={`p-2 font-mono font-bold ${ex.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {ex.delta > 0 ? "+" : ""}
                    {ex.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="calibration-drills" aria-labelledby="drills-heading" className="space-y-2">
        <h2 id="drills-heading" className="flex items-center gap-2 text-base font-bold text-white">
          <FlaskConical className="h-4 w-4 text-violet-400" aria-hidden="true" />
          Sandbox calibration drills
        </h2>
        <p className="text-xs text-slate-400 pretty-copy">
          {drills.length} synthetic questions with sandbox resolutions show how settlement, tiers and &ldquo;Called It&rdquo; cards work. They
          don&apos;t describe real-world events, and only sandbox or simulated-agent profiles have forecasts on them. Profiles with drill
          settlements are tagged &ldquo;sandbox&rdquo;.
        </p>
      </section>
    </div>
  );
}
