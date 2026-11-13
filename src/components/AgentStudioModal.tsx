"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Sparkles,
  Terminal,
  UploadCloud,
  X,
} from "lucide-react";
import {
  computeGraphVarianceReport,
  encodePortableForecastBundle,
} from "@/lib/forecaster-engine";
import { getRegisteredGraph } from "@/lib/graph-registry";
import {
  generatePromptPack,
  parseAndValidateAgentResponse,
  PromptPackOutputMode,
  PromptPackScope,
} from "@/lib/prompt-pack";
import {
  CrowdEnsembleMode,
  ForecasterActor,
  GraphForecastRun,
  PriorAxisScore,
  RegisteredGraphId,
  WorldviewCard,
} from "@/types/forecaster";

export interface AgentStudioModalProps {
  open: boolean;
  onClose: () => void;
  graphId: RegisteredGraphId;
  actors: ForecasterActor[];
  runs: GraphForecastRun[];
  crowdMode: CrowdEnsembleMode;
  initialForkActor?: ForecasterActor | null;
  initialScope?: PromptPackScope;
  focusedBranchNodeId?: string | null;
  focusedBranchLabel?: string | null;
  onApplyRuns: (actor: ForecasterActor, runs: GraphForecastRun[]) => void;
}

const DEFAULT_AXES: PriorAxisScore[] = [
  {
    id: "compute_scaling",
    label: "Compute & Algorithmic Scaling Velocity",
    shortLabel: "Scaling Velocity",
    score: 70,
    lowLabel: "Hard Walls",
    highLabel: "Fast Takeoff",
  },
  {
    id: "alignment_tractability",
    label: "Alignment & Control Tractability",
    shortLabel: "Alignment Ease",
    score: 55,
    lowLabel: "Deceptive Default",
    highLabel: "Tractable",
  },
  {
    id: "institutional_coordination",
    label: "Institutional & Treaty Coordination",
    shortLabel: "Treaty / Gov",
    score: 50,
    lowLabel: "Multipolar Race",
    highLabel: "Verified Treaty",
  },
  {
    id: "biotech_longevity_velocity",
    label: "Biotech & Longevity Escape Velocity",
    shortLabel: "Bio / LEV Speed",
    score: 68,
    lowLabel: "Slow Trials",
    highLabel: "2030s LEV",
  },
  {
    id: "post_physical_simulation",
    label: "Non-Physicalist / Simulation Openness",
    shortLabel: "Sim / Multiverse",
    score: 50,
    lowLabel: "Strict ΛCDM",
    highLabel: "Computational",
  },
];

export function AgentStudioModal({
  open,
  onClose,
  graphId,
  actors,
  runs,
  crowdMode,
  initialForkActor,
  initialScope = "graph",
  focusedBranchNodeId,
  focusedBranchLabel,
  onApplyRuns,
}: AgentStudioModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const nameInputId = useId();
  const handleInputId = useId();
  const modelBadgeInputId = useId();
  const thesisInputId = useId();
  const sysPromptInputId = useId();
  const axiomsInputId = useId();
  const pasteInputId = useId();

  const [step, setStep] = useState<1 | 2>(1);
  const [scope, setScope] = useState<PromptPackScope>(initialScope);
  const [outputMode, setOutputMode] =
    useState<PromptPackOutputMode>("standard");

  const [displayName, setDisplayName] = useState("My Worldview Agent");
  const [handle, setHandle] = useState("my_worldview_agent");
  const [actorType, setActorType] =
    useState<ForecasterActor["actorType"]>("ai_agent");
  const [modelBadge, setModelBadge] = useState("Custom LLM Agent");
  const [coreThesis, setCoreThesis] = useState(
    "Applies calibrated outside-view base rates while weighting verifiable compute and biomarker trends."
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "Commit to coherent conditional probabilities across every fork. Justify sharp departures from baseline priors using concrete causal bottlenecks or scaling mechanisms."
  );
  const [axiomsText, setAxiomsText] = useState(
    "Sibling branch probabilities at every fork must sum strictly to 100%.\nWeight empirical benchmarks and physical bottlenecks over pure hype."
  );
  const [priorAxes, setPriorAxes] = useState<PriorAxisScore[]>(DEFAULT_AXES);
  const [forkedFromHandle, setForkedFromHandle] = useState<string | null>(null);

  const [pastedResponse, setPastedResponse] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedShareUrl, setPublishedShareUrl] = useState<string | null>(
    null
  );
  const [publishError, setPublishError] = useState<string | null>(null);

  const [packCopyMsg, setPackCopyMsg] = useState("");
  const [curlCopyMsg, setCurlCopyMsg] = useState("");
  const [shareCopyMsg, setShareCopyMsg] = useState("");
  const packRepeatRef = useRef(false);
  const curlRepeatRef = useRef(false);
  const shareRepeatRef = useRef(false);

  // Sync fork preset & initial scope whenever opened
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPublishedShareUrl(null);
    setPublishError(null);
    setScope(
      initialScope === "branch" && !focusedBranchNodeId ? "graph" : initialScope
    );

    if (initialForkActor) {
      const suffix = Math.random().toString(36).slice(2, 5);
      setDisplayName(`${initialForkActor.displayName} (Fork)`);
      setHandle(`${initialForkActor.handle.slice(0, 22)}_fork_${suffix}`);
      setActorType(
        initialForkActor.actorType === "market_baseline"
          ? "ai_agent"
          : initialForkActor.actorType
      );
      setModelBadge(initialForkActor.worldview.modelBadge);
      setCoreThesis(initialForkActor.worldview.coreThesis);
      setSystemPrompt(initialForkActor.worldview.systemPrompt);
      setAxiomsText(initialForkActor.worldview.explicitAxioms.join("\n"));
      setPriorAxes(
        initialForkActor.worldview.priorAxes.map((ax) => ({ ...ax }))
      );
      setForkedFromHandle(initialForkActor.handle);
    }
  }, [open, initialForkActor, initialScope, focusedBranchNodeId]);

  // Open/close native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Native close listener + Safari light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const _rv = dialog.returnValue;
      void _rv;
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);

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

    const needsFallback = !("closedBy" in HTMLDialogElement.prototype);
    if (needsFallback) {
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
    }
    return () => {
      dialog.removeEventListener("close", handleClose);
      if (needsFallback) {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      }
    };
  }, [onClose]);

  const draftWorldview: WorldviewCard = useMemo(
    () => ({
      coreThesis: coreThesis.trim(),
      modelBadge: modelBadge.trim() || "Custom Agent",
      accentColor: "#06b6d4",
      priorAxes,
      explicitAxioms: axiomsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      groundingLinks: [],
      systemPrompt: systemPrompt.trim(),
      forkedFromHandle,
    }),
    [
      axiomsText,
      coreThesis,
      forkedFromHandle,
      modelBadge,
      priorAxes,
      systemPrompt,
    ]
  );

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://agifutures.co";

  const generatedPack = useMemo(
    () =>
      generatePromptPack({
        graphId,
        scope,
        branchNodeId: scope === "branch" ? focusedBranchNodeId : null,
        outputMode,
        actorHandle: handle,
        actorDisplayName: displayName,
        actorType,
        worldview: draftWorldview,
        baseOrigin: origin,
      }),
    [
      actorType,
      displayName,
      draftWorldview,
      focusedBranchNodeId,
      graphId,
      handle,
      origin,
      outputMode,
      scope,
    ]
  );

  const parsedPreview = useMemo(() => {
    if (!pastedResponse.trim()) return null;
    return parseAndValidateAgentResponse({
      rawText: pastedResponse,
      defaultGraphId: graphId,
      fallbackHandle: handle,
      fallbackDisplayName: displayName,
      fallbackActorType: actorType,
    });
  }, [actorType, displayName, graphId, handle, pastedResponse]);

  const previewVariance = useMemo(() => {
    if (!parsedPreview?.ok || parsedPreview.runs.length === 0) return null;
    const matchRun =
      parsedPreview.runs.find((r) => r.graphId === graphId) ||
      parsedPreview.runs[0];
    return computeGraphVarianceReport(
      matchRun.graphId,
      matchRun,
      crowdMode,
      actors,
      runs
    );
  }, [actors, crowdMode, graphId, parsedPreview, runs]);

  const handleLoadStarterPreset = (presetActor: ForecasterActor) => {
    const suffix = Math.random().toString(36).slice(2, 5);
    setDisplayName(`${presetActor.displayName} (Fork)`);
    setHandle(`${presetActor.handle.slice(0, 22)}_fork_${suffix}`);
    setModelBadge(presetActor.worldview.modelBadge);
    setCoreThesis(presetActor.worldview.coreThesis);
    setSystemPrompt(presetActor.worldview.systemPrompt);
    setAxiomsText(presetActor.worldview.explicitAxioms.join("\n"));
    setPriorAxes(presetActor.worldview.priorAxes.map((a) => ({ ...a })));
    setForkedFromHandle(presetActor.handle);
  };

  const copyPromptPack = async () => {
    try {
      await navigator.clipboard.writeText(generatedPack.promptText);
      packRepeatRef.current = !packRepeatRef.current;
      setPackCopyMsg(
        packRepeatRef.current
          ? "Prompt Pack copied!\u00A0"
          : "Prompt Pack copied!"
      );
      setTimeout(() => setPackCopyMsg(""), 2500);
    } catch {
      setPackCopyMsg("Clipboard blocked");
    }
  };

  const copyCurlCommand = async () => {
    try {
      await navigator.clipboard.writeText(generatedPack.curlExampleCommand);
      curlRepeatRef.current = !curlRepeatRef.current;
      setCurlCopyMsg(
        curlRepeatRef.current ? "cURL copied!\u00A0" : "cURL copied!"
      );
      setTimeout(() => setCurlCopyMsg(""), 2400);
    } catch {
      setCurlCopyMsg("Copy failed");
    }
  };

  const buildLocalActorObject = (cleanHandle: string): ForecasterActor => ({
    id: `actor-${cleanHandle}`,
    handle: cleanHandle,
    displayName: displayName.trim() || cleanHandle,
    shortBadge: actorType === "human" ? "Personal" : "Custom Agent",
    actorType,
    roleLabel:
      actorType === "human"
        ? "Personal Forecaster Distribution"
        : "Community Sandbox Worldview Agent",
    avatarInitials: (displayName.trim() || "CA").slice(0, 2).toUpperCase(),
    isVerifiedEnsemble: false,
    createdAt: new Date().toISOString(),
    worldview: draftWorldview,
  });

  const handleApplyLocally = () => {
    if (!parsedPreview?.ok) return;
    const cleanHandle =
      parsedPreview.actorPatch?.handle ||
      handle.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const localActor = buildLocalActorObject(cleanHandle);
    const finalizedRuns = parsedPreview.runs.map((r) => ({
      ...r,
      actorHandle: localActor.handle,
      actorDisplayName: localActor.displayName,
      actorType: localActor.actorType,
    }));
    onApplyRuns(localActor, finalizedRuns);
    dialogRef.current?.close("applied");
  };

  const handlePublishAndShare = async () => {
    if (!parsedPreview?.ok) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch("/futuregraph/api/v1/agents/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: pastedResponse,
          graphId,
          handle,
          displayName,
          actorType,
          worldview: draftWorldview,
          forkedFromHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          Array.isArray(data?.errors)
            ? data.errors.join(" ")
            : "Failed to publish forecast run."
        );
      }

      onApplyRuns(data.actor, data.runs);
      const urlForCurrentGraph =
        data.shareUrls?.[graphId] ||
        (data.shareUrls ? (Object.values(data.shareUrls)[0] as string) : null) ||
        data.profileUrl;

      setPublishedShareUrl(urlForCurrentGraph);
      if (urlForCurrentGraph) {
        await navigator.clipboard.writeText(urlForCurrentGraph);
        shareRepeatRef.current = !shareRepeatRef.current;
        setShareCopyMsg(
          shareRepeatRef.current
            ? "Published & share URL copied!\u00A0"
            : "Published & share URL copied!"
        );
      }
    } catch (err) {
      // Fallback to portable URL even if offline
      const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const localActor = buildLocalActorObject(cleanHandle);
      onApplyRuns(localActor, parsedPreview.runs);
      const spec = getRegisteredGraph(graphId);
      const token = encodePortableForecastBundle({
        v: 1,
        actor: {
          handle: localActor.handle,
          displayName: localActor.displayName,
          actorType: localActor.actorType,
          roleLabel: localActor.roleLabel,
          worldview: localActor.worldview,
        },
        run: parsedPreview.runs[0],
      });
      const fallbackUrl = `${origin}/futuregraph${
        spec?.routeHref || "/scenarios/ai-2027"
      }?forecaster=${encodeURIComponent(
        localActor.handle
      )}&variance=1&agentRun=${encodeURIComponent(token)}`;
      setPublishedShareUrl(fallbackUrl);
      setPublishError(
        err instanceof Error
          ? `${err.message} (Generated portable share URL instead.)`
          : null
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const graphSpec = getRegisteredGraph(graphId);
  const starterForkCandidates = actors.filter((a) =>
    [
      "kylen",
      "kurzweil_horizon",
      "sentinel_treaty",
      "amdahl_realist",
      "tetlock_calib",
      "everett_sim",
    ].includes(a.handle)
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fg-dialog-wide w-full p-0 text-slate-100"
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/95">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
              <Bot className="w-3.5 h-3.5" aria-hidden="true" />
              Forecaster Agent & Personal Distribution Studio
            </div>
            <h2 id={titleId} className="text-base sm:text-lg font-bold text-white">
              Copy Conditional Branch Prompt → Fill Out Graph → Share Worldview
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close("close")}
            aria-label="Close Agent Studio"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* 2-Step Switcher */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                step === 1
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              1. Tune Worldview & Copy Prompt Pack
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                step === 2
                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              2. Paste Agent Reply & Share
            </button>
          </div>
          <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
            Target: {graphSpec?.shortTitle || graphId} ({generatedPack.forkCount}{" "}
            {generatedPack.forkCount === 1 ? "fork" : "forks"})
          </span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {step === 1 ? (
            <>
              {/* Quick Fork Bar */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  Optional: Start by Forking an Existing Worldview
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {starterForkCandidates.map((cand) => (
                    <button
                      key={cand.handle}
                      type="button"
                      onClick={() => handleLoadStarterPreset(cand)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                        forkedFromHandle === cand.handle
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-semibold"
                          : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                      }`}
                    >
                      Fork @{cand.handle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Essential Surface Identity & Thesis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Agent or Forecaster Name
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor={handleInputId}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Shareable Handle
                  </label>
                  <input
                    id={handleInputId}
                    type="text"
                    value={handle}
                    onChange={(e) =>
                      setHandle(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "_")
                      )
                    }
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor={modelBadgeInputId}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Model / Human Label
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id={modelBadgeInputId}
                      type="text"
                      value={modelBadge}
                      onChange={(e) => setModelBadge(e.target.value)}
                      placeholder="e.g. Claude Sonnet 4.6"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActorType((t) =>
                          t === "ai_agent" ? "human" : "ai_agent"
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 shrink-0"
                    >
                      {actorType === "ai_agent" ? "AI" : "Human"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor={thesisInputId}
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Core Worldview Thesis (shared on your Worldview Card)
                </label>
                <textarea
                  id={thesisInputId}
                  rows={2}
                  value={coreThesis}
                  onChange={(e) => setCoreThesis(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-xs text-slate-100"
                />
              </div>

              {/* Scope & Verbosity Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-200">
                    Copy-Paste Branch Scope
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {focusedBranchNodeId && (
                      <button
                        type="button"
                        onClick={() => setScope("branch")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          scope === "branch"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Focused Branch
                        {focusedBranchLabel ? `: ${focusedBranchLabel}` : ""}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setScope("graph")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        scope === "graph"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Current Graph ({graphSpec?.shortTitle})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope("all_site")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        scope === "all_site"
                          ? "bg-violet-500/20 border-violet-500/50 text-violet-200"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      All-Site Sweep (All 6 Graphs)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-200">
                    Agent Output Detail
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOutputMode("standard")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        outputMode === "standard"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      Probabilities + Per-Fork Rationales
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputMode("quick_pct")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        outputMode === "quick_pct"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      Quick (% Splits Only)
                    </button>
                  </div>
                </div>
              </div>

              {/* Primary Copy CTA Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/50 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">
                    Ready: {generatedPack.forkCount}{" "}
                    {generatedPack.forkCount === 1
                      ? "Conditional Fork"
                      : "Conditional Forks"}{" "}
                    ({generatedPack.optionCount} outcomes)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Copy in 1 click, paste into ChatGPT, Claude, Gemini, or Grok,
                    then paste its JSON reply into Step 2.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span
                    role="status"
                    className="fg-copy-status text-xs font-mono text-emerald-400"
                  >
                    {packCopyMsg}
                  </span>
                  <button
                    type="button"
                    onClick={copyPromptPack}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white keep-white font-semibold text-xs transition-colors shadow"
                  >
                    {packCopyMsg ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    )}
                    Copy 1-Click Prompt Pack
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-xs transition-colors"
                  >
                    Next: Paste Reply →
                  </button>
                </div>
              </div>

              {/* Progressive Disclosure: Fine-tune Priors, Prompt & Direct CLI Push */}
              <details className="group rounded-xl border border-slate-800 bg-slate-900/40">
                <summary className="cursor-pointer list-none px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 select-none">
                  <span>
                    Advanced Tuning: System Prompt, 5 Prior Sliders & Explicit Axioms
                  </span>
                  <span className="text-cyan-400 font-mono group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-3 border-t border-slate-800 space-y-3">
                  <div>
                    <label
                      htmlFor={sysPromptInputId}
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Exact System Prompt / Instructions Embedded in Prompt Pack
                    </label>
                    <textarea
                      id={sysPromptInputId}
                      rows={3}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-xs font-mono text-cyan-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={axiomsInputId}
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Explicit Load-Bearing Axioms (one per line)
                    </label>
                    <textarea
                      id={axiomsInputId}
                      rows={3}
                      value={axiomsText}
                      onChange={(e) => setAxiomsText(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-xs text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {priorAxes.map((ax, idx) => (
                      <div
                        key={ax.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                      >
                        <div className="flex justify-between text-xs">
                          <label
                            htmlFor={`axis-${ax.id}`}
                            className="text-slate-300 font-medium"
                          >
                            {ax.shortLabel}
                          </label>
                          <span className="font-mono text-cyan-300 tabular-nums">
                            {ax.score}/100
                          </span>
                        </div>
                        <input
                          id={`axis-${ax.id}`}
                          type="range"
                          min={0}
                          max={100}
                          value={ax.score}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPriorAxes((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, score: val } : item
                              )
                            );
                          }}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/40">
                <summary className="cursor-pointer list-none px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 select-none">
                  <span className="inline-flex items-center gap-1.5">
                    <Terminal
                      className="w-3.5 h-3.5 text-cyan-400"
                      aria-hidden="true"
                    />
                    Inspect Raw Prompt Pack or Direct CLI / Claude Code Push Command
                  </span>
                  <span className="text-cyan-400 font-mono group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Coding agents (Claude Code, Antigravity, Cursor) can POST directly:
                    </span>
                    <div className="inline-flex items-center gap-2">
                      <span
                        role="status"
                        className="fg-copy-status text-[11px] font-mono text-emerald-400"
                      >
                        {curlCopyMsg}
                      </span>
                      <button
                        type="button"
                        onClick={copyCurlCommand}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                      >
                        <Copy className="w-3 h-3" aria-hidden="true" />
                        Copy cURL Push
                      </button>
                    </div>
                  </div>
                  <pre
                    role="region"
                    aria-label="Generated Prompt Pack preview"
                    tabIndex={0}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-44 overflow-auto whitespace-pre-wrap"
                  >
                    <code>{generatedPack.promptText}</code>
                  </pre>
                </div>
              </details>
            </>
          ) : (
            /* STEP 2: PASTE, VALIDATE, PREVIEW VARIANCE & PUBLISH */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={pasteInputId}
                    className="text-xs font-semibold text-slate-200"
                  >
                    Paste Your Agent&apos;s Response (JSON or Markdown Code Block)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPastedResponse(
                        JSON.stringify(generatedPack.jsonSchemaTemplate, null, 2)
                      )
                    }
                    className="text-[11px] font-mono text-cyan-400 hover:underline"
                  >
                    Load Editable Template JSON
                  </button>
                </div>
                <textarea
                  id={pasteInputId}
                  rows={9}
                  value={pastedResponse}
                  onChange={(e) => setPastedResponse(e.target.value)}
                  placeholder='Paste the JSON block returned by Claude, ChatGPT, Gemini, or Grok here...'
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 font-mono text-xs text-emerald-200"
                />
              </div>

              {parsedPreview && !parsedPreview.ok && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    Could not validate JSON response
                  </div>
                  {parsedPreview.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}

              {parsedPreview?.ok && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      Validated {parsedPreview.runs.length}{" "}
                      {parsedPreview.runs.length === 1
                        ? "Graph Distribution"
                        : "Graph Distributions"}{" "}
                      (100% Conserved per Fork)
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      @{parsedPreview.actorPatch?.handle || handle}
                    </span>
                  </div>

                  {parsedPreview.warnings.length > 0 && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 space-y-0.5">
                      {parsedPreview.warnings.map((w, idx) => (
                        <div key={idx}>• {w}</div>
                      ))}
                    </div>
                  )}

                  {previewVariance &&
                    previewVariance.rankedDivergences.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                          <Sparkles
                            className="w-3 h-3 text-amber-400"
                            aria-hidden="true"
                          />
                          Top Previewed Variance vs. Crowd Wisdom
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {previewVariance.rankedDivergences
                            .slice(0, 3)
                            .map((d) => {
                              const isLevGraph =
                                previewVariance.graphId === "lev";
                              const deltaLabel = isLevGraph
                                ? `${d.signedDelta > 0 ? "+" : ""}${d.signedDelta.toFixed(
                                    1
                                  )} yrs`
                                : `${d.signedDelta > 0 ? "+" : ""}${(
                                    d.signedDelta * 100
                                  ).toFixed(1)}%`;
                              return (
                                <div
                                  key={d.nodeId}
                                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                                >
                                  <div className="font-medium text-slate-200 truncate">
                                    {d.label}
                                  </div>
                                  <div className="font-mono text-[11px] text-cyan-300 mt-0.5 tabular-nums">
                                    {isLevGraph
                                      ? d.actorProb.toFixed(1)
                                      : `${(d.actorProb * 100).toFixed(1)}%`}{" "}
                                    ({deltaLabel} vs Crowd)
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {publishedShareUrl && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="text-xs font-bold text-emerald-300">
                    Published to Community Sandbox with SHA-256 Audit Receipt!
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      aria-label="Shareable forecast URL"
                      value={publishedShareUrl}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-cyan-200"
                    />
                  </div>
                  {publishError && (
                    <p className="text-[11px] text-amber-300">{publishError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          {step === 2 ? (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
              >
                ← Back to Prompt Pack
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  role="status"
                  className="fg-copy-status text-xs font-mono text-emerald-400"
                >
                  {shareCopyMsg}
                </span>
                <button
                  type="button"
                  onClick={handleApplyLocally}
                  disabled={!parsedPreview?.ok}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-100 border border-slate-700"
                >
                  Preview on Graph Only
                </button>
                <button
                  type="button"
                  onClick={handlePublishAndShare}
                  disabled={!parsedPreview?.ok || isPublishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white keep-white text-xs font-semibold shadow"
                >
                  <UploadCloud className="w-4 h-4" aria-hidden="true" />
                  {isPublishing
                    ? "Publishing..."
                    : "Publish & Copy Share Link"}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-400">
                Governance: Visitor runs appear in{" "}
                <strong className="text-slate-200">Community Sandbox</strong>{" "}
                until verified, keeping Crowd Wisdom Sybil-resistant.
              </span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white keep-white text-xs font-semibold"
              >
                Have JSON? Paste & Preview →
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
