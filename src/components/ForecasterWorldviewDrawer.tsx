"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  Copy,
  ExternalLink,
  GitFork,
  Share2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { encodePortableForecastBundle } from "@/lib/forecaster-engine";
import { getRegisteredGraph } from "@/lib/graph-registry";
import {
  CrowdEnsembleMode,
  ForecasterActor,
  GraphForecastRun,
  GraphVarianceReport,
  RegisteredGraphId,
} from "@/types/forecaster";

export interface ForecasterWorldviewDrawerProps {
  open: boolean;
  onClose: () => void;
  graphId: RegisteredGraphId;
  actor?: ForecasterActor;
  run?: GraphForecastRun;
  varianceReport: GraphVarianceReport | null;
  crowdMode: CrowdEnsembleMode;
  onCrowdModeChange: (mode: CrowdEnsembleMode) => void;
  onForkActor: (actor: ForecasterActor) => void;
  onFocusNode?: (nodeId: string, canonicalNodeId?: string) => void;
}

const CROWD_MODE_LABELS: Record<CrowdEnsembleMode, string> = {
  all_ensemble: "All Ensemble",
  humans_markets: "Humans & Markets",
  agents_only: "AI Agents Only",
};

export function ForecasterWorldviewDrawer({
  open,
  onClose,
  graphId,
  actor,
  run,
  varianceReport,
  crowdMode,
  onCrowdModeChange,
  onForkActor,
  onFocusNode,
}: ForecasterWorldviewDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [promptCopyMsg, setPromptCopyMsg] = useState("");
  const [shareCopyMsg, setShareCopyMsg] = useState("");
  const promptRepeatRef = useRef(false);
  const shareRepeatRef = useRef(false);
  const promptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync open state with native <dialog>.showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Native close handler + Safari closedby="any" light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      // Modern Web Guidance (dialog): read & reset returnValue on close
      const _rv = dialog.returnValue;
      void _rv;
      dialog.returnValue = "";
      onClose();
    };

    dialog.addEventListener("close", handleClose);

    // Modern Web Guidance (light-dismiss-a-dialog): Safari fallback when closedBy is unsupported
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = e.target === dialog && isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && e.target === dialog && isOutside(e)) {
        dialog.close("backdrop");
      }
      pressedOutside = false;
    };

    const needsLightDismissFallback = !(
      "closedBy" in HTMLDialogElement.prototype
    );
    if (needsLightDismissFallback) {
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (needsLightDismissFallback) {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      }
    };
  }, [onClose]);

  const handleCopyPrompt = async () => {
    if (!actor) return;
    try {
      await navigator.clipboard.writeText(actor.worldview.systemPrompt);
      promptRepeatRef.current = !promptRepeatRef.current;
      setPromptCopyMsg(
        promptRepeatRef.current ? "Copied prompt\u00A0" : "Copied prompt"
      );
    } catch {
      setPromptCopyMsg("Copy failed");
    }
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = setTimeout(() => setPromptCopyMsg(""), 2200);
  };

  const handleCopyShareLink = async () => {
    if (!actor || typeof window === "undefined") return;
    try {
      const spec = getRegisteredGraph(graphId);
      const routeHref = spec?.routeHref || "/scenarios/ai-2027";
      let shareUrl = `${window.location.origin}/futuregraph${routeHref}?forecaster=${encodeURIComponent(
        actor.handle
      )}&variance=1`;

      if (!actor.isVerifiedEnsemble && run) {
        const token = encodePortableForecastBundle({
          v: 1,
          actor: {
            handle: actor.handle,
            displayName: actor.displayName,
            actorType: actor.actorType,
            roleLabel: actor.roleLabel,
            worldview: actor.worldview,
          },
          run,
        });
        if (token.length < 3600) {
          shareUrl += `&agentRun=${encodeURIComponent(token)}`;
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      shareRepeatRef.current = !shareRepeatRef.current;
      setShareCopyMsg(
        shareRepeatRef.current ? "Share link copied\u00A0" : "Share link copied"
      );
    } catch {
      setShareCopyMsg("Copy failed");
    }
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareCopyMsg(""), 2400);
  };

  const isLev = graphId === "lev";
  const topDivergences = varianceReport?.rankedDivergences.slice(0, 6) || [];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fg-dialog-wide w-full p-0 text-slate-100"
      {...({ closedby: "any" } as Record<string, string>)}
    >
      {actor ? (
        <div className="flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border"
                style={{
                  backgroundColor: `${actor.worldview.accentColor}20`,
                  borderColor: `${actor.worldview.accentColor}66`,
                  color: actor.worldview.accentColor,
                }}
                aria-hidden="true"
              >
                {actor.avatarInitials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id={titleId}
                    className="text-base sm:text-lg font-bold text-white truncate"
                  >
                    {actor.displayName}
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    @{actor.handle}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200">
                    {actor.actorType === "ai_agent" ? (
                      <Bot className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                    ) : (
                      <User
                        className="w-3 h-3 text-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                    {actor.worldview.modelBadge}
                  </span>
                  {actor.isVerifiedEnsemble ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Verified Ensemble
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Community Sandbox
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {actor.roleLabel}
                  {actor.worldview.forkedFromHandle && (
                    <span className="ml-2 text-cyan-400 font-mono">
                      • Forked from @{actor.worldview.forkedFromHandle}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/u/${actor.handle}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Full Profile
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => dialogRef.current?.close("close")}
                aria-label="Close worldview inspector"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto p-5 space-y-5">
            {/* Core Worldview Thesis */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Core Worldview & Tuning Thesis
              </div>
              <p className="text-sm text-slate-100 leading-relaxed">
                {actor.worldview.coreThesis}
              </p>
              {run?.headlineSummary && (
                <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-cyan-300">
                  On this graph: {run.headlineSummary}
                </div>
              )}
            </div>

            {/* 5 Calibrated Epistemic Prior Axes */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                5 Epistemic Prior Axes (0 = Skeptic / Conservative • 100 = High Credence)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {actor.worldview.priorAxes.map((axis) => (
                  <div
                    key={axis.id}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/90 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">
                        {axis.shortLabel}
                      </span>
                      <span className="font-mono font-bold text-slate-100 tabular-nums">
                        {axis.score}/100
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(4, Math.min(100, axis.score))}%`,
                          backgroundColor: actor.worldview.accentColor,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{axis.lowLabel}</span>
                      <span>{axis.highLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Variance from Crowd Wisdom */}
            {varianceReport && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles
                        className="w-3.5 h-3.5 text-amber-400"
                        aria-hidden="true"
                      />
                      Variance from Crowd Wisdom (Δ vs. Crowd)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Largest disagreements between @{actor.handle} and{" "}
                      {CROWD_MODE_LABELS[crowdMode]}.
                    </p>
                  </div>
                  <div
                    className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800"
                    role="group"
                    aria-label="Crowd baseline comparison mode"
                  >
                    {(
                      [
                        "all_ensemble",
                        "humans_markets",
                        "agents_only",
                      ] as CrowdEnsembleMode[]
                    ).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onCrowdModeChange(m)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          crowdMode === m
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {CROWD_MODE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-800/70">
                  {topDivergences.map((delta) => {
                    const isPositive = delta.signedDelta > 0;
                    const formattedActor = isLev
                      ? `${delta.actorProb.toFixed(1)}`
                      : `${(delta.actorProb * 100).toFixed(1)}%`;
                    const formattedCrowd = isLev
                      ? `${delta.crowdProb.toFixed(1)}`
                      : `${(delta.crowdProb * 100).toFixed(1)}%`;
                    const formattedDelta = isLev
                      ? `${delta.signedDelta > 0 ? "+" : ""}${delta.signedDelta.toFixed(
                          1
                        )} yrs`
                      : `${delta.signedDelta > 0 ? "+" : ""}${(
                          delta.signedDelta * 100
                        ).toFixed(1)}%`;

                    // For LEV, negative years = earlier LEV (optimistic/emerald); for probabilities, positive = higher credence (emerald)
                    const highlightEmerald = isLev ? !isPositive : isPositive;

                    return (
                      <div
                        key={delta.nodeId}
                        className="py-2.5 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (onFocusNode) {
                                onFocusNode(delta.nodeId, delta.canonicalNodeId);
                                dialogRef.current?.close("focus-node");
                              }
                            }}
                            className="text-left text-xs font-semibold text-slate-100 hover:text-cyan-300 transition-colors"
                          >
                            {delta.label}{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({delta.epochOrDateLabel})
                            </span>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 tabular-nums text-xs font-mono">
                            <span className="text-slate-300">
                              {formattedActor}{" "}
                              <span className="text-slate-500">
                                vs {formattedCrowd}
                              </span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                Math.abs(delta.signedDelta) < 0.005
                                  ? "bg-slate-800 text-slate-300 border-slate-700"
                                  : highlightEmerald
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {formattedDelta}
                            </span>
                          </div>
                        </div>
                        {delta.rationale && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {delta.rationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progressive Disclosure 1: System Prompt & Tuning Instructions */}
            <details className="group rounded-xl border border-slate-800 bg-slate-900/50 open:bg-slate-900/80">
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-200 select-none">
                <span>Exact System Prompt & Tuning Instructions</span>
                <span className="text-[11px] font-mono text-cyan-400 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-4 pb-4 space-y-2.5 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Copy this system prompt into any LLM or fork it in Agent Studio:
                  </span>
                  <div className="inline-flex items-center gap-2">
                    <span
                      role="status"
                      className="fg-copy-status text-[11px] font-mono text-emerald-400"
                    >
                      {promptCopyMsg}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
                    >
                      {promptCopyMsg ? (
                        <Check
                          className="w-3.5 h-3.5 text-emerald-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      Copy Prompt
                    </button>
                  </div>
                </div>
                <pre
                  role="region"
                  aria-label="Forecaster system prompt"
                  tabIndex={0}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-200 whitespace-pre-wrap overflow-x-auto max-h-48"
                >
                  <code>{actor.worldview.systemPrompt}</code>
                </pre>
              </div>
            </details>

            {/* Progressive Disclosure 2: Explicit Axioms & Grounding Sources */}
            <details className="group rounded-xl border border-slate-800 bg-slate-900/50 open:bg-slate-900/80">
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-200 select-none">
                <span>
                  Explicit Load-Bearing Axioms ({actor.worldview.explicitAxioms.length}) &
                  Sources ({actor.worldview.groundingLinks.length})
                </span>
                <span className="text-[11px] font-mono text-cyan-400 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-4 pb-4 space-y-3 border-t border-slate-800/80 pt-3">
                <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-300">
                  {actor.worldview.explicitAxioms.map((ax, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {ax}
                    </li>
                  ))}
                </ul>
                {actor.worldview.groundingLinks.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase text-slate-400">
                      Grounding Benchmarks & Papers
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {actor.worldview.groundingLinks.map((lnk, idx) => (
                        <a
                          key={idx}
                          href={lnk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-300 hover:border-cyan-500/40"
                        >
                          <span>{lnk.title}</span>
                          <ExternalLink
                            className="w-3 h-3 shrink-0"
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Action Footer */}
          <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                dialogRef.current?.close("fork");
                onForkActor(actor);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white keep-white text-xs font-semibold transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" aria-hidden="true" />
              Fork & Tune Worldview in Agent Studio
            </button>

            <div className="inline-flex items-center gap-2">
              <span
                role="status"
                className="fg-copy-status text-xs font-mono text-emerald-400"
              >
                {shareCopyMsg}
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                Copy Share Link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
