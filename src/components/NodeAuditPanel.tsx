"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  History,
  MessageSquare,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Video,
  X,
} from "lucide-react";
import {
  ArgumentItem,
  AuditReceipt,
  CommentItem,
  ForecastEvent,
  ForecastLens,
  FutureEdge,
  FutureNode,
  NodeSourceLink,
} from "@/types/futuregraph";
import { NodeProbabilityResult, computeBrierScore } from "@/lib/probability-engine";

interface NodeAuditPanelProps {
  node: FutureNode;
  propagation: NodeProbabilityResult | null;
  lensPriors: Record<ForecastLens, number | null>;
  evidence: NodeSourceLink[];
  argumentsList: ArgumentItem[];
  comments: CommentItem[];
  forecasts: ForecastEvent[];
  incomingEdges: FutureEdge[];
  outgoingEdges: FutureEdge[];
  downstreamImpacts: Array<{
    nodeId: string;
    title: string;
    dateLabel: string;
    baselineProb: number;
    probAt80: number;
    probAt20: number;
    swing: number;
  }>;
  onSelectNode?: (nodeId: string) => void;
  onOverrideNodeProbability?: (nodeId: string, probability: number) => void;
  onClose?: () => void;
  standalone?: boolean;
}

export function NodeAuditPanel({
  node,
  propagation,
  lensPriors,
  evidence: initialEvidence,
  argumentsList: initialArguments,
  comments,
  forecasts: initialForecasts,
  incomingEdges,
  outgoingEdges,
  downstreamImpacts,
  onSelectNode,
  onOverrideNodeProbability,
  onClose,
  standalone = false,
}: NodeAuditPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "forecast" | "evidence" | "debate" | "history" | "impact"
  >("forecast");

  // Forecast submission state
  const currentMarginal =
    propagation?.marginalProbability ?? node.question?.demoHypothesisProb ?? 0.5;
  const [myProbPct, setMyProbPct] = useState<number>(
    Math.round(currentMarginal * 100)
  );
  const [rationale, setRationale] = useState("");
  const [citedUrl, setCitedUrl] = useState("");
  const [handleInput, setHandleInput] = useState("elena_vance");
  const [submittingForecast, setSubmittingForecast] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<AuditReceipt | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<ForecastEvent[]>(initialForecasts);

  // Evidence state
  const [evidence, setEvidence] = useState<NodeSourceLink[]>(initialEvidence);
  const [evTitle, setEvTitle] = useState("");
  const [evUrl, setEvUrl] = useState("");
  const [evNote, setEvNote] = useState("");
  const [evRelation, setEvRelation] = useState<"supports" | "disputes" | "contextualizes">("supports");
  const [activeYoutubeEmbed, setActiveYoutubeEmbed] = useState<number | null>(null);

  // Argument state
  const [args, setArgs] = useState<ArgumentItem[]>(initialArguments);
  const [argStance, setArgStance] = useState<ArgumentItem["stance"]>("steelman");
  const [argThesis, setArgThesis] = useState("");
  const [argReasoning, setArgReasoning] = useState("");
  const [argAssumption, setArgAssumption] = useState("");

  // Branch proposal state
  const [propTitle, setPropTitle] = useState("");
  const [propSummary, setPropSummary] = useState("");
  const [propProb, setPropProb] = useState(25);
  const [propSubmitted, setPropSubmitted] = useState(false);

  // Native <dialog> Challenge modal
  const challengeDialogRef = useRef<HTMLDialogElement | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);

  const openChallengeDialog = () => {
    challengeDialogRef.current?.showModal();
  };

  const closeChallengeDialog = () => {
    challengeDialogRef.current?.close();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === challengeDialogRef.current) {
      closeChallengeDialog();
    }
  };

  const handleForecastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForecastError(null);
    setSubmittingForecast(true);
    try {
      const probDecimal = Number((myProbPct / 100).toFixed(4));
      const res = await fetch("/futuregraph/api/v1/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          probability: probDecimal,
          uncertaintyLower: Math.max(0, Number((probDecimal - 0.12).toFixed(2))),
          uncertaintyUpper: Math.min(1, Number((probDecimal + 0.12).toFixed(2))),
          rationale,
          citedUrls: citedUrl ? [citedUrl] : [node.sourceUrl],
          forecasterHandle: handleInput || "elena_vance",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit forecast");
      setForecasts((prev) => [data.event, ...prev]);
      setLatestReceipt(data.receipt);
      setRationale("");
      if (onOverrideNodeProbability) {
        onOverrideNodeProbability(node.id, probDecimal);
      }
    } catch (err: unknown) {
      setForecastError(err instanceof Error ? err.message : "Submission error");
    } finally {
      setSubmittingForecast(false);
    }
  };

  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle || !evUrl || !evNote) return;
    const res = await fetch("/futuregraph/api/v1/evidence/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId: node.id,
        title: evTitle,
        url: evUrl,
        relevanceNote: evNote,
        relationship: evRelation,
        proposerHandle: handleInput || "elena_vance",
      }),
    });
    const data = await res.json();
    if (res.ok && data.evidenceLink) {
      setEvidence((prev) => [data.evidenceLink, ...prev]);
      setEvTitle("");
      setEvUrl("");
      setEvNote("");
    }
  };

  const handleArgumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argThesis || !argReasoning) return;
    const res = await fetch("/futuregraph/api/v1/arguments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId: node.id,
        stance: argStance,
        thesis: argThesis,
        reasoning: argReasoning,
        targetAssumption: argAssumption || undefined,
        authorHandle: handleInput || "elena_vance",
      }),
    });
    const data = await res.json();
    if (res.ok && data.argument) {
      setArgs((prev) => [data.argument, ...prev]);
      setArgThesis("");
      setArgReasoning("");
      setArgAssumption("");
      setLatestReceipt(data.receipt);
    }
  };

  const handleBranchProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle || !propSummary) return;
    const res = await fetch("/futuregraph/api/v1/branches/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentNodeId: node.id,
        proposedTitle: propTitle,
        proposedSummary: propSummary,
        conditionalAssumption: `P(Branch | ${node.logicalId}) = ${propProb}%`,
        suggestedProbability: Number((propProb / 100).toFixed(2)),
        proposerHandle: handleInput || "elena_vance",
      }),
    });
    if (res.ok) {
      setPropSubmitted(true);
      setPropTitle("");
      setPropSummary("");
    }
  };

  const handleReaction = (argId: string, key: keyof ArgumentItem["reactions"]) => {
    setArgs((prev) =>
      prev.map((a) =>
        a.id === argId
          ? { ...a, reactions: { ...a.reactions, [key]: a.reactions[key] + 1 } }
          : a
      )
    );
  };

  const provenanceBadgeColor =
    node.provenanceType === "observed_history"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : node.question?.authorDocumentedProb !== null &&
        node.question?.authorDocumentedProb !== undefined
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : node.provenanceType === "operationalized_question"
      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
      : "bg-violet-500/15 text-violet-300 border-violet-500/30";

  const provenanceLabel =
    node.provenanceType === "observed_history"
      ? "Observed Reality (as of Nov 2026)"
      : node.question?.authorDocumentedProb !== null &&
        node.question?.authorDocumentedProb !== undefined
      ? `Documented Supplement Prob (${(node.question.authorDocumentedProb * 100).toFixed(1)}%)`
      : node.provenanceType === "operationalized_question"
      ? "Operationalized Benchmark Question"
      : "Original AI 2027 Scenario Milestone";

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 ${
        standalone
          ? "rounded-2xl border border-slate-800 shadow-2xl"
          : "h-full border-l border-slate-800"
      }`}
    >
      {/* Top Header */}
      <div className="border-b border-slate-800/90 bg-slate-900/70 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-mono font-semibold text-amber-300">
              {node.chapter} • {node.dateLabel}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${provenanceBadgeColor}`}
            >
              {provenanceLabel}
            </span>
            <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[11px] uppercase tracking-wider text-slate-300">
              Track: {node.branchTrack}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!standalone && (
              <Link
                href={`/scenarios/ai-2027/n/${node.id}`}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
                title="Open standalone deep-link page"
              >
                <span>Deep Link</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={openChallengeDialog}
              className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Challenge</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close audit panel"
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <h2 className="mt-2.5 text-lg sm:text-xl font-bold text-white balance-heading">
          {node.title}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300 pretty-copy">
          {node.summary}
        </p>

        {/* Key Probability Readout Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-slate-800 bg-slate-950/90 p-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Implied Marginal
            </div>
            <div className="mt-0.5 text-xl font-extrabold font-mono text-amber-400 tabular-nums">
              {((propagation?.marginalProbability ?? currentMarginal) * 100).toFixed(1)}%
            </div>
            {propagation?.delta !== null &&
              propagation?.delta !== undefined &&
              Math.abs(propagation.delta) > 0.0005 && (
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    propagation.delta > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {propagation.delta > 0 ? "+" : ""}
                  {(propagation.delta * 100).toFixed(1)} pts vs baseline
                </span>
              )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Human Community
            </div>
            <div className="mt-0.5 text-lg font-bold font-mono text-sky-400 tabular-nums">
              {((lensPriors.community ?? currentMarginal) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Gemini Agent
            </div>
            <div className="mt-0.5 text-lg font-bold font-mono text-violet-400 tabular-nums">
              {((lensPriors.ai_gemini ?? currentMarginal) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Claude Agent
            </div>
            <div className="mt-0.5 text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {((lensPriors.ai_claude ?? currentMarginal) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 5-Tab Navigation */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1">
          {[
            { id: "forecast", label: "1. Forecast", icon: TrendingUp },
            { id: "evidence", label: `2. Evidence (${evidence.length})`, icon: BookOpen },
            { id: "debate", label: `3. Debate (${args.length})`, icon: MessageSquare },
            { id: "history", label: `4. History (${forecasts.length})`, icon: History },
            { id: "impact", label: "5. Impact & CPT", icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* TAB 1: FORECAST & RESOLUTION SPEC */}
        {activeTab === "forecast" && (
          <div className="space-y-5">
            {/* Detailed Scenario & Observed Reality Context */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Scenario & Reality Verification
                </span>
                <a
                  href={node.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-sky-400 hover:underline"
                >
                  <span>Primary Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed pretty-copy">
                {node.detailedDescription}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs text-slate-300">
                <strong className="text-amber-300">Verification Note: </strong>
                {node.verificationNote}
              </div>
            </div>

            {/* Operationalized Forecast Question Specification */}
            {node.question && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Operationalized Forecast Question ({node.question.modelRole})
                  </span>
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-mono text-sky-300">
                    Horizon: {node.question.horizonDate}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {node.question.questionText}
                </p>
                <p className="text-xs text-slate-300">
                  <strong>Resolution Criteria:</strong> {node.question.resolutionCriteria}
                </p>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                  <span>Source: {node.question.resolutionSource}</span>
                  <span>•</span>
                  <span>Adjudicator: {node.question.resolutionOwner}</span>
                </div>
                {node.question.authorProbCitation && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                    <strong>Documented Author Supplement Probability: </strong>
                    {node.question.authorProbCitation}
                  </div>
                )}
              </div>
            )}

            {/* Put a Probability on It — Interactive Submission Form */}
            <form
              onSubmit={handleForecastSubmit}
              className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Put a Probability on It (SHA-256 Auditable Forecast)</span>
                </h3>
                <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                  {myProbPct}%
                </span>
              </div>

              <div>
                <label
                  htmlFor={`prob-slider-${node.id}`}
                  className="block text-xs text-slate-400 mb-1.5"
                >
                  Drag slider to set your probability estimate (0% – 100%)
                </label>
                <input
                  id={`prob-slider-${node.id}`}
                  type="range"
                  min={1}
                  max={99}
                  value={myProbPct}
                  style={
                    { "--control-value": `${myProbPct}%` } as React.CSSProperties
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMyProbPct(val);
                  }}
                  className="fg-slider"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>1% (Very Unlikely)</span>
                  <span>50% (Maximum Uncertainty)</span>
                  <span>99% (Nearly Certain)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Forecaster Handle
                  </label>
                  <input
                    type="text"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    placeholder="elena_vance"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Supporting Citation URL (optional)
                  </label>
                  <input
                    type="url"
                    value={citedUrl}
                    onChange={(e) => setCitedUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    placeholder="https://ai-2027.com/research/takeoff-forecast"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Reasoning & Key Assumptions (required for audit receipt)
                </label>
                <textarea
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Explain why your probability differs from the baseline or what conditioning assumption drives your view..."
                />
              </div>

              {forecastError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                  {forecastError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="submit"
                  disabled={submittingForecast}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {submittingForecast
                    ? "Signing SHA-256 Receipt..."
                    : `Submit ${myProbPct}% Forecast & Generate Receipt`}
                </button>
                {onOverrideNodeProbability && (
                  <button
                    type="button"
                    onClick={() =>
                      onOverrideNodeProbability(
                        node.id,
                        Number((myProbPct / 100).toFixed(2))
                      )
                    }
                    className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
                  >
                    Simulate {myProbPct}% Across Graph Now
                  </button>
                )}
              </div>

              {latestReceipt && (
                <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Tamper-Evident SHA-256 Receipt Generated!</span>
                    </span>
                    <Link
                      href={`/receipt/${latestReceipt.eventId}`}
                      className="text-xs font-semibold text-amber-300 underline hover:text-amber-200"
                    >
                      Verify Receipt →
                    </Link>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 break-all">
                    Chain Hash: {latestReceipt.chainSha256}
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: EVIDENCE & MEDIA */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            {evidence.map((item) => {
              const isYoutube = item.source.url.includes("youtube.com") || item.source.url.includes("youtu.be");
              const startSec = item.source.mediaStartSeconds || 142;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.relationship === "supports"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : item.relationship === "disputes"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {item.relationship}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.source.sourceType} • {item.source.publishedAt}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {item.source.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {item.source.authors} ({item.source.publisher})
                  </p>
                  <blockquote className="border-l-2 border-amber-500/60 pl-3 text-xs text-slate-200 italic">
                    &ldquo;{item.source.excerptParaphrase}&rdquo;
                  </blockquote>
                  <p className="text-xs text-slate-300">
                    <strong>Relevance:</strong> {item.relevanceNote}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={
                        isYoutube
                          ? `${item.source.url}&t=${startSec}s`
                          : item.source.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-sky-300 hover:border-sky-500"
                    >
                      <span>Open Source URL</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    {isYoutube && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveYoutubeEmbed(
                            activeYoutubeEmbed === startSec ? null : startSec
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                      >
                        <Play className="h-3 w-3" />
                        <span>
                          {activeYoutubeEmbed === startSec
                            ? "Hide Video Player"
                            : `Play Timecode (${Math.floor(startSec / 60)}:${String(
                                startSec % 60
                              ).padStart(2, "0")})`}
                        </span>
                      </button>
                    )}
                  </div>

                  {isYoutube && activeYoutubeEmbed === startSec && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-700 aspect-video">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/5KVDDfAkRgc?start=${startSec}&autoplay=1`}
                        title={item.source.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Propose Evidence Form */}
            <form
              onSubmit={handleEvidenceSubmit}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                <span>Attach Primary Source or Video Timecode</span>
              </h4>
              <input
                type="text"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Source Title (e.g., METR 2026 Developer Uplift Study)"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="url"
                  value={evUrl}
                  onChange={(e) => setEvUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
                <select
                  value={evRelation}
                  onChange={(e) =>
                    setEvRelation(e.target.value as typeof evRelation)
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                >
                  <option value="supports">Supports Node</option>
                  <option value="disputes">Disputes Node</option>
                  <option value="contextualizes">Contextualizes Node</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={evNote}
                onChange={(e) => setEvNote(e.target.value)}
                placeholder="Quote excerpt or paraphrase explaining how this evidence updates the probability..."
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                Attach Evidence Link
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: STEELMAN DEBATE & REACTIONS */}
        {activeTab === "debate" && (
          <div className="space-y-4">
            {args.map((arg) => (
              <div
                key={arg.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        arg.stance === "for"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : arg.stance === "against"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {arg.stance.replace("_", " ")}
                    </span>
                    <Link
                      href={`/u/${arg.authorHandle}`}
                      className="text-xs font-semibold text-sky-300 hover:underline"
                    >
                      {arg.authorName} (@{arg.authorHandle})
                    </Link>
                    {arg.authorType === "ai_agent" && (
                      <span className="rounded bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[10px] font-mono text-violet-300">
                        AI AGENT
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {arg.createdAt.slice(0, 10)}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{arg.thesis}</h4>
                <p className="text-xs text-slate-300 leading-relaxed pretty-copy">
                  {arg.reasoning}
                </p>

                {arg.targetAssumption && (
                  <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 text-[11px] font-mono text-amber-300">
                    Target Assumption: {arg.targetAssumption}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleReaction(arg.id, "made_me_reconsider")
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:border-amber-500/50 tabular-nums"
                  >
                    🤔 Made me reconsider ({arg.reactions.made_me_reconsider})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleReaction(arg.id, "taught_me_something")
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:border-sky-500/50 tabular-nums"
                  >
                    💡 Taught me something ({arg.reactions.taught_me_something})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(arg.id, "strongest_evidence")}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:border-emerald-500/50 tabular-nums"
                  >
                    📚 Strongest evidence ({arg.reactions.strongest_evidence})
                  </button>
                </div>
              </div>
            ))}

            {/* Threaded Comments */}
            {comments.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Threaded Discussion ({comments.length})
                </div>
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5 text-xs ${
                      c.parentCommentId ? "ml-5 border-l-2 border-l-sky-500/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-200">
                        {c.authorName} (@{c.authorHandle})
                      </span>
                      <span>{c.createdAt.slice(0, 10)}</span>
                    </div>
                    <p className="text-slate-300">{c.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Steelman Argument Form */}
            <form
              onSubmit={handleArgumentSubmit}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Contribute Steelman Argument or Assumption Challenge
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={argStance}
                  onChange={(e) =>
                    setArgStance(e.target.value as ArgumentItem["stance"])
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                >
                  <option value="steelman">Steelman Synthesis</option>
                  <option value="for">Case For (Bullish)</option>
                  <option value="against">Case Against (Bearish)</option>
                  <option value="assumption_challenge">Assumption Challenge</option>
                </select>
                <input
                  type="text"
                  value={argAssumption}
                  onChange={(e) => setArgAssumption(e.target.value)}
                  placeholder="Target assumption (e.g. P(Y|Parent)=72%)"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <input
                type="text"
                value={argThesis}
                onChange={(e) => setArgThesis(e.target.value)}
                placeholder="One-line thesis headline..."
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
              <textarea
                rows={3}
                value={argReasoning}
                onChange={(e) => setArgReasoning(e.target.value)}
                placeholder="Articulate the strongest evidence-backed argument..."
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Publish Argument & Sign Receipt
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: IMMUTABLE HISTORY & BRIER SCORING */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
              All forecast events are stored in an append-only Postgres table protected by immutability triggers (`prevent_append_only_mutation`) and chained with SHA-256 hashes.
            </div>

            {forecasts.map((fe) => {
              const brierInfo = computeBrierScore({
                probability: fe.probability,
                outcome: node.question?.resolvedOutcome ?? null,
                submittedAtIso: fe.serverTimestamp,
                cutoffAtIso: node.question?.closeDate
                  ? `${node.question.closeDate}T23:59:59Z`
                  : "2035-12-31T23:59:59Z",
                nodeType: node.nodeType,
              });

              return (
                <div
                  key={fe.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold font-mono text-amber-400 tabular-nums">
                        {(fe.probability * 100).toFixed(1)}%
                      </span>
                      <Link
                        href={`/u/${fe.forecasterHandle}`}
                        className="text-xs font-semibold text-white hover:underline"
                      >
                        {fe.forecasterName}
                      </Link>
                      {fe.forecasterType === "ai_agent" && (
                        <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-mono text-violet-300">
                          AI AGENT
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/receipt/${fe.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>Receipt {fe.id}</span>
                    </Link>
                  </div>

                  <p className="text-xs text-slate-300">{fe.rationale}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-400">
                    <span>Timestamp: {fe.serverTimestamp.slice(0, 19)}Z</span>
                    {brierInfo.brierScore !== null ? (
                      <span className="text-emerald-400 font-bold tabular-nums">
                        Brier Score: {brierInfo.brierScore.toFixed(4)} (Resolved YES)
                      </span>
                    ) : (
                      <span>{brierInfo.explanation}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: CAUSAL IMPACT & CPT INSPECTOR */}
        {activeTab === "impact" && (
          <div className="space-y-4">
            {/* Derivation Formula */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Mathematical Derivation Trace
              </div>
              <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-sky-300 break-words">
                {propagation?.derivationFormula ||
                  "Root / standalone node prior."}
              </div>
              {propagation?.fixedAssumptions &&
                propagation.fixedAssumptions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-semibold text-slate-400">
                      Fixed Conditional Parameters:
                    </div>
                    {propagation.fixedAssumptions.map((fa, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono text-slate-300"
                      >
                        • {fa}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Multi-Parent or Single-Parent CPT Table */}
            {node.question?.cptTable && node.question.cptTable.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Explicit Conditional Probability Table (CPT)
                </div>
                <div className="fg-table-container">
                  <table className="fg-responsive-table text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                        <th className="p-2.5">Parent Conditioning State(s)</th>
                        <th className="p-2.5">P(Target = YES | Parents)</th>
                        <th className="p-2.5">Mechanism Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {node.question.cptTable.map((row, idx) => (
                        <tr key={idx} className="bg-slate-950/70">
                          <td className="p-2.5 font-mono text-amber-300">
                            {Object.entries(row.parentStates)
                              .map(([pid, st]) => `${pid.replace("node-", "")}=${st}`)
                              .join(" AND ")}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-white tabular-nums">
                            {(row.probability * 100).toFixed(1)}%
                          </td>
                          <td className="p-2.5 text-slate-300">
                            {row.explanation || "Fixed conditional parameter"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Downstream Sensitivity Tornado */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Downstream Causal Sensitivity (Swing when Node moves 20% → 80%)
              </div>
              {downstreamImpacts.length === 0 ? (
                <p className="text-xs text-slate-400">
                  This is a terminal outcome node with no downstream children.
                </p>
              ) : (
                <div className="space-y-2">
                  {downstreamImpacts.slice(0, 6).map((imp) => (
                    <div
                      key={imp.nodeId}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectNode && onSelectNode(imp.nodeId)}
                        className="text-left font-medium text-slate-200 hover:text-amber-300"
                      >
                        <span className="text-[11px] font-mono text-slate-400 mr-1.5">
                          [{imp.dateLabel}]
                        </span>
                        {imp.title}
                      </button>
                      <div className="shrink-0 font-mono text-right tabular-nums">
                        <span className="text-slate-400 mr-2">
                          {(imp.probAt20 * 100).toFixed(1)}% →{" "}
                          {(imp.probAt80 * 100).toFixed(1)}%
                        </span>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-bold">
                          +{Math.abs(imp.swing * 100).toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Propose Missing Branch Form */}
            <form
              onSubmit={handleBranchProposalSubmit}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Propose Missing Conditional Branch From This Node
              </h4>
              <input
                type="text"
                value={propTitle}
                onChange={(e) => setPropTitle(e.target.value)}
                placeholder="Proposed Branch Title (e.g., Sovereign Open-Weight Counterweight)"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
              <textarea
                rows={2}
                value={propSummary}
                onChange={(e) => setPropSummary(e.target.value)}
                placeholder="Describe the causal mechanism and resolution criteria..."
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Suggested Conditional P(Branch | Parent): {propProb}%
                </span>
                <button
                  type="submit"
                  className="rounded-lg bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-violet-400"
                >
                  Submit to Editorial Queue
                </button>
              </div>
              {propSubmitted && (
                <div className="text-xs text-emerald-400">
                  ✓ Branch proposal queued in Editorial Admin (/admin) with SHA-256 receipt!
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Native <dialog> Challenge Card Modal (Modern Web Guidance: dialog) */}
      <dialog
        ref={challengeDialogRef}
        onClick={handleBackdropClick}
        className="p-0"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-amber-300">
                Put a Probability on It — Challenge Card
              </h3>
              <p className="text-xs text-slate-400">
                Share your auditable forecast card for {node.dateLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={closeChallengeDialog}
              className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/og?nodeId=${encodeURIComponent(
                node.id
              )}&myProb=${encodeURIComponent((myProbPct / 100).toFixed(2))}`}
              alt="Challenge Forecast Social Card"
              className="w-full h-auto"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/scenarios/ai-2027/n/${node.id}?challengeProb=${myProbPct}`;
                navigator.clipboard.writeText(url);
                setCopiedChallenge(true);
                setTimeout(() => setCopiedChallenge(false), 2500);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>
                {copiedChallenge ? "Copied Challenge URL!" : "Copy Challenge Link"}
              </span>
            </button>
            <button
              type="button"
              onClick={closeChallengeDialog}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
