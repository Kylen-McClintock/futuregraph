"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Scale,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  SEED_GOVERNANCE_OBJECTIVES,
  SEED_POLICY_INTERVENTIONS,
} from "@/data/ai2027-seed";
import { evaluateFairMarketsPolicies } from "@/lib/pareto-engine";
import { GovernanceObjectiveId } from "@/types/futuregraph";

const DEFAULT_COMMUNITY_WEIGHTS: Record<GovernanceObjectiveId, number> = {
  physical_safety: 85,
  autonomy_freedom: 70,
  democratic_accountability: 75,
  economic_abundance: 65,
  scientific_progress: 65,
  global_stability: 80,
};

export default function FairMarketsGovernanceLabPage() {
  const [userWeights, setUserWeights] = useState<
    Record<GovernanceObjectiveId, number>
  >({
    physical_safety: 90,
    autonomy_freedom: 75,
    democratic_accountability: 80,
    economic_abundance: 70,
    scientific_progress: 65,
    global_stability: 85,
  });

  const [activeObjectives, setActiveObjectives] = useState<
    GovernanceObjectiveId[]
  >(SEED_GOVERNANCE_OBJECTIVES.map((o) => o.id));

  const [uncertaintyMode, setUncertaintyMode] = useState<
    "point" | "pessimistic" | "optimistic"
  >("point");
  const [misalignmentDelta, setMisalignmentDelta] = useState<number>(0);

  // 2D chart axis selectors
  const [xAxisObj, setXAxisObj] =
    useState<GovernanceObjectiveId>("scientific_progress");
  const [yAxisObj, setYAxisObj] =
    useState<GovernanceObjectiveId>("physical_safety");

  const analysis = useMemo(() => {
    return evaluateFairMarketsPolicies({
      interventions: SEED_POLICY_INTERVENTIONS,
      activeObjectives,
      userWeights,
      communityWeights: DEFAULT_COMMUNITY_WEIGHTS,
      uncertaintyMode,
      misalignmentProbDelta: misalignmentDelta,
    });
  }, [activeObjectives, userWeights, uncertaintyMode, misalignmentDelta]);

  const toggleObjective = (id: GovernanceObjectiveId) => {
    setActiveObjectives((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((x) => x !== id)
          : prev
        : [...prev, id]
    );
  };

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/75 p-6 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-mono font-bold text-emerald-300">
            <Scale className="h-3.5 w-3.5" />
            <span>FAIRMARKETS AI GOVERNANCE LAB • COUNTERFACTUAL do(policy)</span>
          </span>
          <span className="text-xs font-mono text-amber-300">
            Epistemic Firewall: Normative Value Sliders Never Mutate Objective
            Outcome Forecasts
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Multidimensional Pareto Frontier &amp; Policy Tradeoff Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 pretty-copy">
          Evaluate four counterfactual October 2027 governance interventions (
          <code>do(Policy)</code>) across six civilizational objectives. Adjust
          your normative value weights on the left to rank policies by personal
          utility while inspecting objective Pareto dominance on the right.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Normative Value Sliders + Epistemic Sensitivity Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Normative Value Sliders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sliders className="h-4 w-4" />
                <span>1. Your Normative Value Weights (0–100)</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                Affects Utility Score Only
              </span>
            </div>

            <div className="space-y-3.5">
              {SEED_GOVERNANCE_OBJECTIVES.map((obj) => {
                const w = userWeights[obj.id];
                const isActive = activeObjectives.includes(obj.id);
                return (
                  <div
                    key={obj.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isActive
                        ? "border-slate-800 bg-slate-950/90"
                        : "border-slate-900 bg-slate-950/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleObjective(obj.id)}
                          className="rounded border-slate-700 text-amber-500"
                        />
                        <span>{obj.label}</span>
                      </label>
                      <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                        Weight: {w}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">
                      {obj.description}
                    </p>
                    <input
                      type="range"
                      aria-label={`Weight for ${obj.label}`}
                      min={0}
                      max={100}
                      value={w}
                      style={
                        { "--control-value": `${w}%` } as React.CSSProperties
                      }
                      onChange={(e) =>
                        setUserWeights((prev) => ({
                          ...prev,
                          [obj.id]: Number(e.target.value),
                        }))
                      }
                      className="fg-slider"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Epistemic Belief / Uncertainty Sensitivity Controls */}
          <div className="rounded-2xl border border-sky-500/30 bg-slate-900/70 p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sky-400">
              2. Epistemic Model Sensitivity (Beliefs &amp; Uncertainty)
            </h2>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Outcome Uncertainty Bound:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["point", "pessimistic", "optimistic"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setUncertaintyMode(m)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${
                      uncertaintyMode === m
                        ? "border-sky-400 bg-sky-500/20 text-sky-200"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">
                  Shift in P(Agent-4 Adversarial Misalignment):
                </span>
                <span className="font-mono font-bold text-sky-300 tabular-nums">
                  {misalignmentDelta >= 0 ? "+" : ""}
                  {Math.round(misalignmentDelta * 100)} pts
                </span>
              </div>
              <input
                type="range"
                aria-label="Misalignment probability delta"
                min={-30}
                max={30}
                value={Math.round(misalignmentDelta * 100)}
                style={
                  {
                    "--control-value": `${
                      ((misalignmentDelta + 0.3) / 0.6) * 100
                    }%`,
                  } as React.CSSProperties
                }
                onChange={(e) =>
                  setMisalignmentDelta(Number(e.target.value) / 100)
                }
                className="fg-slider"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-300">
              <strong className="text-amber-300">Pareto Stability Check: </strong>
              {analysis.uncertaintyReversalNote}
            </div>
          </div>
        </div>

        {/* Right Column: 2D Pareto Frontier Chart + Multidimensional Dominance Table */}
        <div className="lg:col-span-7 space-y-5">
          {/* 2D SVG Pareto Tradeoff Plot */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                2D Pareto Frontier Projection &amp; Non-Dominated Set
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">X:</span>
                <select
                  value={xAxisObj}
                  onChange={(e) =>
                    setXAxisObj(e.target.value as GovernanceObjectiveId)
                  }
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                >
                  {SEED_GOVERNANCE_OBJECTIVES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.shortLabel}
                    </option>
                  ))}
                </select>
                <span className="text-slate-400">Y:</span>
                <select
                  value={yAxisObj}
                  onChange={(e) =>
                    setYAxisObj(e.target.value as GovernanceObjectiveId)
                  }
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                >
                  {SEED_GOVERNANCE_OBJECTIVES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
              <svg
                viewBox="0 0 600 320"
                className="w-full h-auto"
                role="img"
                aria-label="2D Pareto Frontier Chart"
              >
                {/* Grid lines */}
                {[20, 40, 60, 80].map((v) => {
                  const y = 270 - (v / 100) * 230;
                  const x = 60 + (v / 100) * 500;
                  return (
                    <g key={v}>
                      <line
                        x1={60}
                        y1={y}
                        x2={560}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={48}
                        y={y + 4}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                      >
                        {v}
                      </text>
                      <line
                        x1={x}
                        y1={40}
                        x2={x}
                        y2={270}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={x}
                        y={288}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}
                {/* Axes */}
                <line
                  x1={60}
                  y1={270}
                  x2={560}
                  y2={270}
                  stroke="#475569"
                  strokeWidth="2"
                />
                <line
                  x1={60}
                  y1={40}
                  x2={60}
                  y2={270}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* Plot each intervention */}
                {analysis.evaluatedPolicies.map((ep) => {
                  const sx = ep.objectiveScores[xAxisObj] ?? 50;
                  const sy = ep.objectiveScores[yAxisObj] ?? 50;
                  const cx = 60 + (sx / 100) * 500;
                  const cy = 270 - (sy / 100) * 230;
                  const color = ep.isParetoOptimal ? "#10b981" : "#f43f5e";

                  return (
                    <g key={ep.intervention.id}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={ep.isParetoOptimal ? 9 : 7}
                        fill={color}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      <text
                        x={cx + 12}
                        y={cy + 4}
                        fill={ep.isParetoOptimal ? "#a7f3d0" : "#fecdd3"}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {ep.intervention.shortLabel} ({sx}, {sy})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Ranked Policy Cards & Objective Matrix */}
          <div className="space-y-3">
            {analysis.evaluatedPolicies
              .slice()
              .sort((a, b) => b.userWeightedScore - a.userWeightedScore)
              .map((ep) => (
                <div
                  key={ep.intervention.id}
                  className={`rounded-2xl border p-5 space-y-3 ${
                    ep.isParetoOptimal
                      ? "border-emerald-500/40 bg-slate-900/80"
                      : "border-rose-500/30 bg-slate-950/75"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {ep.isParetoOptimal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>PARETO OPTIMAL (NON-DOMINATED)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>STRICTLY DOMINATED</span>
                        </span>
                      )}
                      <Link
                        href={`/scenarios/ai-2027/n/${ep.intervention.linkedNodeIds[0]}`}
                        className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Linked Scenario Node</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                      <div>
                        <span className="text-slate-400 mr-1">
                          Your Utility:
                        </span>
                        <span className="text-base font-extrabold text-amber-400">
                          {ep.userWeightedScore.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 mr-1">Community:</span>
                        <span className="text-sm font-bold text-sky-300">
                          {ep.communityWeightedScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {ep.intervention.title}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {ep.intervention.description}
                  </p>
                  <p className="text-xs font-mono text-slate-400">
                    {ep.paretoExplanation}
                  </p>

                  {/* Objective Score Pills (Independent of user value sliders!) */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
                    {SEED_GOVERNANCE_OBJECTIVES.map((obj) => (
                      <div
                        key={obj.id}
                        className="rounded-lg bg-slate-950/90 border border-slate-800 p-2 text-center"
                      >
                        <div className="text-[10px] text-slate-400 truncate">
                          {obj.shortLabel}
                        </div>
                        <div className="text-sm font-mono font-bold text-white tabular-nums">
                          {ep.objectiveScores[obj.id]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
