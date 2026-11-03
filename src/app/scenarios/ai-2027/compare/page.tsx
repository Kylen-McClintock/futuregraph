"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, GitCompare, Sparkles } from "lucide-react";
import { ForecastLens } from "@/types/futuregraph";

interface ComparisonRow {
  nodeId: string;
  title: string;
  dateLabel: string;
  branchTrack: string;
  probA: number;
  probB: number;
  absDiff: number;
  signedDiff: number;
  topSteelmanFor?: string;
  topSteelmanAgainst?: string;
}

const LENS_LABELS: Record<ForecastLens, string> = {
  community: "Human Forecaster Community",
  ai_gemini: "Sentinel-Bayes v2.4 (Gemini Agent)",
  ai_claude: "HardwareRealist v1.8 (Claude Agent)",
  ai_gpt: "GPT-4.5 / o3 Epistemic Harness",
  my_forecasts: "My Forecasts (@elena_vance)",
  demo_hypothesis: "Modeled Baseline (Default)",
  original: "Author Documented Supplements",
};

export default function CompareLensesPage() {
  const [lensA, setLensA] = useState<ForecastLens>("community");
  const [lensB, setLensB] = useState<ForecastLens>("ai_gemini");
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/futuregraph/api/v1/model/compare?lensA=${lensA}&lensB=${lensB}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.comparison || []);
        setLoading(false);
      });
  }, [lensA, lensB]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-400">
            <GitCompare className="h-3.5 w-3.5" />
            <span>Epistemic Divergence Analyzer</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
            Where We Disagree: Human vs. AI Agent Lenses
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Rank every AI 2027 milestone by absolute probability divergence
            ($|P_A - P_B|$) after full DAG conditional propagation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-sky-400">
              Lens A (Baseline)
            </label>
            <select
              value={lensA}
              onChange={(e) => setLensA(e.target.value as ForecastLens)}
              className="mt-0.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white"
            >
              {Object.entries(LENS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-slate-500">vs.</span>

          <div>
            <label className="block text-[10px] font-mono uppercase text-violet-400">
              Lens B (Comparison)
            </label>
            <select
              value={lensB}
              onChange={(e) => setLensB(e.target.value as ForecastLens)}
              className="mt-0.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white"
            >
              {Object.entries(LENS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table (Modern Web Guidance: responsive-table) */}
      <div className="fg-table-container bg-slate-950">
        <table className="fg-responsive-table text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/95 text-slate-300">
              <th className="p-3.5 min-w-[260px]">Scenario Node &amp; Date</th>
              <th className="p-3.5">Track</th>
              <th className="p-3.5 text-sky-300">{LENS_LABELS[lensA]}</th>
              <th className="p-3.5 text-violet-300">{LENS_LABELS[lensB]}</th>
              <th className="p-3.5">Divergence ($\Delta$)</th>
              <th className="p-3.5 min-w-[280px]">Core Crux / Steelman Thesis</th>
              <th className="p-3.5">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Computing propagated divergence across 29 nodes...
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.nodeId}
                  className="hover:bg-slate-900/60 transition-colors"
                >
                  <td className="p-3.5">
                    <div className="text-[11px] font-mono text-amber-300">
                      {row.dateLabel}
                    </div>
                    <div className="font-bold text-white mt-0.5">
                      {row.title}
                    </div>
                  </td>
                  <td className="p-3.5 uppercase font-mono text-[11px] text-slate-400">
                    {row.branchTrack}
                  </td>
                  <td className="p-3.5 font-mono text-sm font-bold text-sky-300 tabular-nums">
                    {(row.probA * 100).toFixed(1)}%
                  </td>
                  <td className="p-3.5 font-mono text-sm font-bold text-violet-300 tabular-nums">
                    {(row.probB * 100).toFixed(1)}%
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono font-bold tabular-nums ${
                          row.absDiff >= 0.08
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {row.signedDiff > 0 ? "+" : ""}
                        {(row.signedDiff * 100).toFixed(1)} pts
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-300">
                    {row.topSteelmanFor || row.topSteelmanAgainst ? (
                      <div className="space-y-1">
                        {row.topSteelmanFor && (
                          <div className="text-[11px] text-emerald-300">
                            <strong>For:</strong> {row.topSteelmanFor}
                          </div>
                        )}
                        {row.topSteelmanAgainst && (
                          <div className="text-[11px] text-rose-300">
                            <strong>Against:</strong> {row.topSteelmanAgainst}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        Propagated conditional difference from upstream parents
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Link
                      href={`/scenarios/ai-2027/n/${row.nodeId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-amber-300 hover:border-amber-500"
                    >
                      <span>Audit</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
