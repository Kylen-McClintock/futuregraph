"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  EyeOff,
  Maximize2,
  Monitor,
  Play,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { SEED_NODES, SEED_PRESENTATIONS, LENS_PRIORS_BY_NODE, SEED_EDGES } from "@/data/ai2027-seed";
import { propagateGraphProbabilities } from "@/lib/probability-engine";

export default function PresentModePage({
  params,
}: {
  params: { presentationId: string };
}) {
  const [selectedDeckId, setSelectedDeckId] = useState(
    params.presentationId || SEED_PRESENTATIONS[0].id
  );
  const deck =
    SEED_PRESENTATIONS.find((p) => p.id === selectedDeckId) ||
    SEED_PRESENTATIONS[0];

  const [sceneIdx, setSceneIdx] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">(
    deck.aspectRatio
  );
  const [cleanMode, setCleanMode] = useState(false);

  const scene = deck.scenes[sceneIdx] || deck.scenes[0];
  const focusedNode =
    SEED_NODES.find((n) => n.id === scene.focusedNodeId) || SEED_NODES[0];

  // Keyboard navigation (Space, ArrowLeft, ArrowRight)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setSceneIdx((prev) => Math.min(deck.scenes.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSceneIdx((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deck.scenes.length]);

  // Compute propagated probabilities for current scene
  const basePriors: Record<string, number> = {};
  for (const n of SEED_NODES) {
    basePriors[n.id] =
      LENS_PRIORS_BY_NODE[n.id]?.[scene.selectedLens] ??
      n.question?.demoHypothesisProb ??
      0.5;
  }
  const overrides: Record<string, number> = {};
  if (scene.overrideNodeId && scene.overrideProbability !== undefined) {
    overrides[scene.overrideNodeId] = scene.overrideProbability;
  }
  const prop = propagateGraphProbabilities(
    SEED_NODES,
    SEED_EDGES,
    basePriors,
    overrides
  );

  const focusedProb =
    prop.results[focusedNode.id]?.marginalProbability ??
    focusedNode.question?.demoHypothesisProb ??
    0.5;
  const focusedDelta = prop.results[focusedNode.id]?.delta ?? null;

  const relatedChildren = SEED_EDGES.filter(
    (e) => e.sourceNodeId === focusedNode.id
  )
    .map((e) => SEED_NODES.find((n) => n.id === e.targetNodeId))
    .filter(Boolean);

  return (
    <div className="min-h-[calc(100vh-58px)] bg-[#060911] text-slate-100 p-4 sm:p-6 flex flex-col items-center">
      {/* Top Creator Toolbar (hidden when Clean Recording Mode is active) */}
      {!cleanMode ? (
        <div className="w-full max-w-[1400px] mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-300">
              Creator Present Mode
            </span>
            <select
              value={deck.id}
              onChange={(e) => {
                setSelectedDeckId(e.target.value);
                setSceneIdx(0);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-white"
            >
              {SEED_PRESENTATIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.aspectRatio})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Aspect Ratio Guide Switcher */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => setAspectRatio("16:9")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  aspectRatio === "16:9"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>16:9 YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("9:16")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  aspectRatio === "9:16"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>9:16 Shorts/Reels</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCleanMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Clean Capture Mode</span>
            </button>

            <a
              href={`/api/og?nodeId=${encodeURIComponent(
                focusedNode.id
              )}&myProb=${focusedProb}`}
              download={`futuregraph-scene-${scene.sceneOrder}.svg`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Scene SVG</span>
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCleanMode(false)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-900/90 border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-lg"
        >
          Exit Clean Capture Mode
        </button>
      )}

      {/* Framing Stage Container (16:9 Wide vs 9:16 Vertical) */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-[#0b1120] via-[#0f172a] to-[#1e1b4b] p-6 sm:p-10 shadow-2xl transition-all ${
          aspectRatio === "9:16"
            ? "w-full max-w-[430px] min-h-[760px]"
            : "w-full max-w-[1280px] min-h-[680px]"
        }`}
      >
        {/* Top Stage Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-mono font-bold text-amber-300">
              SCENE {scene.sceneOrder} OF {deck.scenes.length} •{" "}
              {focusedNode.dateLabel}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              FUTUREGRAPH.AI • AI 2027 AUDIT
            </span>
          </div>

          <h1
            className={`font-extrabold text-white tracking-tight balance-heading ${
              aspectRatio === "9:16" ? "text-2xl" : "text-3xl sm:text-4xl"
            }`}
          >
            {scene.headline}
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed pretty-copy">
            {scene.annotation}
          </p>
        </div>

        {/* Center Focused Node & Live Probability Card */}
        <div className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div
            className={`${
              aspectRatio === "9:16" ? "lg:col-span-12" : "lg:col-span-7"
            } rounded-2xl border border-slate-700/80 bg-slate-950/85 p-5 space-y-3`}
          >
            <div className="flex items-center justify-between text-xs font-mono text-sky-400">
              <span>
                {focusedNode.chapter} • Track:{" "}
                {focusedNode.branchTrack.toUpperCase()}
              </span>
              <span>Lens: {scene.selectedLens}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {focusedNode.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {focusedNode.summary}
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs font-mono text-amber-200">
              {prop.results[focusedNode.id]?.derivationFormula}
            </div>
          </div>

          <div
            className={`${
              aspectRatio === "9:16" ? "lg:col-span-12" : "lg:col-span-5"
            } flex flex-col justify-center rounded-2xl border-2 border-amber-500/50 bg-slate-950/90 p-6 text-center space-y-2`}
          >
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Implied Node Probability
            </span>
            <div className="text-5xl sm:text-6xl font-extrabold font-mono text-white tabular-nums">
              {(focusedProb * 100).toFixed(1)}%
            </div>
            {focusedDelta !== null && Math.abs(focusedDelta) > 0.0005 && (
              <div className="inline-block mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-mono font-bold text-emerald-300 tabular-nums">
                {focusedDelta > 0 ? "+" : ""}
                {(focusedDelta * 100).toFixed(1)} pts from Scene Override
              </div>
            )}
            {focusedNode.metricsSnapshot?.rdMultiplier && (
              <div className="text-xs font-mono text-sky-300 pt-1">
                R&amp;D Multiplier: {focusedNode.metricsSnapshot.rdMultiplier}
              </div>
            )}
          </div>
        </div>

        {/* Downstream Connected Branches Preview */}
        {relatedChildren.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Downstream Conditional Branches:
            </div>
            <div
              className={`grid gap-2.5 ${
                aspectRatio === "9:16"
                  ? "grid-cols-1"
                  : "grid-cols-1 sm:grid-cols-3"
              }`}
            >
              {relatedChildren.slice(0, 3).map((child) => {
                if (!child) return null;
                const cp =
                  prop.results[child.id]?.marginalProbability ??
                  child.question?.demoHypothesisProb ??
                  0.5;
                return (
                  <div
                    key={child.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/75 p-3 flex items-center justify-between gap-2"
                  >
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {child.title}
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-amber-400 tabular-nums">
                      {(cp * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Scene Playback Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={sceneIdx === 0}
              onClick={() => setSceneIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:border-amber-500 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Prev Scene</span>
            </button>

            <button
              type="button"
              disabled={sceneIdx === deck.scenes.length - 1}
              onClick={() =>
                setSceneIdx((i) => Math.min(deck.scenes.length - 1, i + 1))
              }
              className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
            >
              <span>Next Scene (Space / →)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {deck.scenes.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSceneIdx(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === sceneIdx
                    ? "w-8 bg-amber-400"
                    : "w-2.5 bg-slate-700 hover:bg-slate-500"
                }`}
                aria-label={`Jump to scene ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Teleprompter / Narration Notes below the capture frame */}
      {!cleanMode && (
        <div className="mt-4 w-full max-w-[1280px] rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
          <strong className="text-amber-300 uppercase font-mono mr-2">
            Speaker Narration Note:
          </strong>
          {scene.narrationNotes}
        </div>
      )}
    </div>
  );
}
