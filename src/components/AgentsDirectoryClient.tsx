"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  ExternalLink,
  GitFork,
  Plus,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { computeGraphVarianceReport } from "@/lib/forecaster-engine";
import { getRegisteredGraph, getRegisteredGraphs } from "@/lib/graph-registry";
import {
  CrowdEnsembleMode,
  ForecasterActor,
  GraphForecastRun,
  RegisteredGraphId,
} from "@/types/forecaster";
import { AgentStudioModal } from "@/components/AgentStudioModal";
import { ForecasterWorldviewDrawer } from "@/components/ForecasterWorldviewDrawer";

type DirectoryFilterTab =
  | "featured_agents"
  | "creator_markets"
  | "longevity_experts"
  | "community_sandbox"
  | "all";

interface AgentsDirectoryClientProps {
  initialActors: ForecasterActor[];
  initialRuns: GraphForecastRun[];
}

const FEATURED_AGENT_HANDLES = new Set([
  "kurzweil_horizon",
  "sentinel_treaty",
  "amdahl_realist",
  "tetlock_calib",
  "everett_sim",
]);

const CREATOR_MARKET_HANDLES = new Set([
  "kylen",
  "metaculus_markets",
  "daniel_kokotajlo",
]);

const GRAPH_PILL_ORDER: RegisteredGraphId[] = [
  "lev",
  "ai-2050-simple",
  "nature-of-reality",
  "ai-2027",
  "ai-2040",
];

export function AgentsDirectoryClient({
  initialActors,
  initialRuns,
}: AgentsDirectoryClientProps) {
  const [actors, setActors] = useState<ForecasterActor[]>(initialActors);
  const [runs, setRuns] = useState<GraphForecastRun[]>(initialRuns);
  const [activeTab, setActiveTab] =
    useState<DirectoryFilterTab>("featured_agents");
  const [crowdMode, setCrowdMode] =
    useState<CrowdEnsembleMode>("all_ensemble");

  const [studioOpen, setStudioOpen] = useState(false);
  const [studioGraphId, setStudioGraphId] =
    useState<RegisteredGraphId>("ai-2050-simple");
  const [studioInitialScope, setStudioInitialScope] = useState<
    "branch" | "graph" | "all_site"
  >("all_site");
  const [studioForkActor, setStudioForkActor] =
    useState<ForecasterActor | null>(null);

  const [drawerActor, setDrawerActor] = useState<ForecasterActor | null>(null);
  const [drawerGraphId, setDrawerGraphId] =
    useState<RegisteredGraphId>("ai-2050-simple");

  const [copiedPromptByHandle, setCopiedPromptByHandle] = useState<
    Record<string, string>
  >({});

  // Support ?studio=1 and ?tab=... query params on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("studio") === "1") {
      setStudioInitialScope("all_site");
      setStudioForkActor(null);
      setStudioOpen(true);
    }
    const tabParam = params.get("tab") as DirectoryFilterTab | null;
    if (
      tabParam === "featured_agents" ||
      tabParam === "creator_markets" ||
      tabParam === "longevity_experts" ||
      tabParam === "community_sandbox" ||
      tabParam === "all"
    ) {
      setActiveTab(tabParam);
    }
  }, []);

  // Refresh latest actors/runs from API so recently submitted Community Sandbox runs show up
  useEffect(() => {
    let cancelled = false;
    fetch("/futuregraph/api/v1/agents")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.actors) && data.actors.length > 0) {
          setActors(data.actors);
        }
        if (Array.isArray(data.runs) && data.runs.length > 0) {
          setRuns(data.runs);
        }
      })
      .catch(() => {
        // Keep seeded initialActors / initialRuns
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    return {
      featured_agents: actors.filter((a) =>
        FEATURED_AGENT_HANDLES.has(a.handle)
      ).length,
      creator_markets: actors.filter((a) =>
        CREATOR_MARKET_HANDLES.has(a.handle)
      ).length,
      longevity_experts: actors.filter((a) => a.handle.startsWith("lev_"))
        .length,
      community_sandbox: actors.filter((a) => !a.isVerifiedEnsemble).length,
      all: actors.length,
    };
  }, [actors]);

  const filteredActors = useMemo(() => {
    if (activeTab === "featured_agents") {
      return actors.filter((a) => FEATURED_AGENT_HANDLES.has(a.handle));
    }
    if (activeTab === "creator_markets") {
      return actors.filter((a) => CREATOR_MARKET_HANDLES.has(a.handle));
    }
    if (activeTab === "longevity_experts") {
      return actors.filter((a) => a.handle.startsWith("lev_"));
    }
    if (activeTab === "community_sandbox") {
      return actors.filter((a) => !a.isVerifiedEnsemble);
    }
    return actors;
  }, [actors, activeTab]);

  const allRegisteredGraphs = useMemo(() => getRegisteredGraphs(), []);

  const handleCopySystemPrompt = async (actor: ForecasterActor) => {
    try {
      await navigator.clipboard.writeText(actor.worldview.systemPrompt);
      setCopiedPromptByHandle((prev) => {
        const base = `Copied @${actor.handle} prompt`;
        const nextMsg = prev[actor.handle] === base ? `${base}\u00A0` : base;
        return { ...prev, [actor.handle]: nextMsg };
      });
    } catch {
      // Ignore clipboard failure if blocked
    }
  };

  const handleApplyStudioRuns = (
    newActor: ForecasterActor,
    newRuns: GraphForecastRun[]
  ) => {
    setActors((prev) => {
      const rest = prev.filter((a) => a.handle !== newActor.handle);
      return [newActor, ...rest];
    });
    setRuns((prev) => {
      const newKeys = new Set(
        newRuns.map((r) => `${r.graphId}::${r.actorHandle}`)
      );
      const rest = prev.filter(
        (r) => !newKeys.has(`${r.graphId}::${r.actorHandle}`)
      );
      return [...newRuns, ...rest];
    });
    if (!newActor.isVerifiedEnsemble) {
      setActiveTab("community_sandbox");
    }
  };

  const drawerRun = useMemo(() => {
    if (!drawerActor) return undefined;
    return (
      runs.find(
        (r) =>
          r.actorHandle === drawerActor.handle && r.graphId === drawerGraphId
      ) || runs.find((r) => r.actorHandle === drawerActor.handle)
    );
  }, [drawerActor, drawerGraphId, runs]);

  const drawerVariance = useMemo(() => {
    if (!drawerRun) return null;
    return computeGraphVarianceReport(
      drawerRun.graphId,
      drawerRun,
      crowdMode,
      actors,
      runs
    );
  }, [drawerRun, crowdMode, actors, runs]);

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Clean Progressive-Disclosure Header */}
      <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 px-3 py-1 text-xs font-mono font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Transparent Worldviews • 1-Click Prompt Packs • Variance vs. Crowd</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Forecaster Agents &amp; Personal Distributions
            </h1>
            <p className="text-sm sm:text-base text-slate-300 pretty-copy">
              Inspect transparent worldviews, system prompts, and explicit prior axes across every graph on FutureGraph — or copy any conditional probability branch into your own LLM/agent in one click and paste its JSON reply back to fill out the graph.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5">
              <label
                htmlFor="studio-target-graph-select"
                className="text-[11px] font-mono text-slate-400"
              >
                Target:
              </label>
              <select
                id="studio-target-graph-select"
                value={studioGraphId}
                onChange={(e) =>
                  setStudioGraphId(e.target.value as RegisteredGraphId)
                }
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none"
              >
                {allRegisteredGraphs.map((g) => (
                  <option key={g.graphId} value={g.graphId} className="bg-slate-900">
                    {g.shortTitle}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setStudioForkActor(null);
                setStudioInitialScope("all_site");
                setStudioOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white keep-white shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Create / Test Your Forecaster Agent</span>
            </button>
          </div>
        </div>

        {/* Single-Row Filter Tabs + Crowd Wisdom Sub-Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/90">
          <div
            role="group"
            aria-label="Filter forecasters by category"
            className="flex flex-wrap items-center gap-1.5"
          >
            {(
              [
                {
                  id: "featured_agents",
                  label: `Worldview Agents (${counts.featured_agents})`,
                },
                {
                  id: "creator_markets",
                  label: `Creator & Benchmarks (${counts.creator_markets})`,
                },
                {
                  id: "longevity_experts",
                  label: `Longevity Researchers (${counts.longevity_experts})`,
                },
                {
                  id: "community_sandbox",
                  label: `Community Sandbox (${counts.community_sandbox})`,
                },
                { id: "all", label: `All (${counts.all})` },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "border border-slate-800 bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Users className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              <span>Compare Δ vs. Crowd:</span>
            </span>
            <div
              role="group"
              aria-label="Crowd Wisdom ensemble composition"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1"
            >
              {(
                [
                  { id: "all_ensemble", label: "All Ensemble" },
                  { id: "humans_markets", label: "Humans + Mkts" },
                  { id: "agents_only", label: "AI Agents Only" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={crowdMode === m.id}
                  onClick={() => setCrowdMode(m.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    crowdMode === m.id
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Empty Community Sandbox helper */}
      {filteredActors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center space-y-3">
          <p className="text-base font-bold text-white">
            No Community Sandbox agents created in this session yet.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Click below to fork any existing worldview or tune your own assumptions, copy a 1-click Prompt Pack into Claude, ChatGPT, or Gemini, and paste the JSON response back to publish a sandbox forecast with a cryptographic SHA-256 receipt.
          </p>
          <button
            type="button"
            onClick={() => {
              setStudioForkActor(null);
              setStudioInitialScope("graph");
              setStudioOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white keep-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Launch Agent Studio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredActors.map((actor) => {
            const actorRuns = runs.filter((r) => r.actorHandle === actor.handle);
            const copyStatus = copiedPromptByHandle[actor.handle] || "";

            return (
              <article
                key={actor.handle}
                className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-lg"
              >
                <div className="space-y-4">
                  {/* Card Top Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center font-mono text-sm font-extrabold border"
                        style={{
                          backgroundColor: `${actor.worldview.accentColor}18`,
                          borderColor: `${actor.worldview.accentColor}55`,
                          color: actor.worldview.accentColor,
                        }}
                        aria-hidden="true"
                      >
                        {actor.avatarInitials}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/u/${actor.handle}`}
                            className="text-base sm:text-lg font-extrabold text-white hover:text-cyan-300 transition-colors"
                          >
                            {actor.displayName}
                          </Link>
                          <span className="text-xs font-mono text-slate-400">
                            @{actor.handle}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border font-semibold"
                            style={{
                              borderColor: `${actor.worldview.accentColor}45`,
                              color: actor.worldview.accentColor,
                              backgroundColor: `${actor.worldview.accentColor}12`,
                            }}
                          >
                            {actor.actorType === "ai_agent" ? (
                              <Bot className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <User className="h-3 w-3" aria-hidden="true" />
                            )}
                            <span>{actor.worldview.modelBadge}</span>
                          </span>
                          <span className="text-slate-400">• {actor.roleLabel}</span>
                          {!actor.isVerifiedEnsemble && (
                            <span className="rounded bg-amber-500/15 border border-amber-500/35 px-1.5 py-0.5 text-[10px] text-amber-300">
                              Sandbox
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/u/${actor.handle}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                    >
                      <span>Profile</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>

                  {/* Core Thesis */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {actor.worldview.coreThesis}
                  </p>

                  {/* 5 Compact Prior Axes */}
                  <div className="grid grid-cols-5 gap-2 rounded-2xl border border-slate-800/90 bg-slate-950/75 p-3">
                    {actor.worldview.priorAxes.map((axis) => (
                      <div key={axis.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                          <span className="text-slate-400 truncate" title={axis.label}>
                            {axis.shortLabel}
                          </span>
                          <span className="font-bold text-slate-200 tabular-nums">
                            {axis.score}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${axis.score}%`,
                              backgroundColor: actor.worldview.accentColor,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cross-Graph Predictions + Signed Variance Pills */}
                  {actorRuns.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        Live Graph Predictions &amp; Variance (Click to Open Full Overlay)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {GRAPH_PILL_ORDER.map((gid) => {
                          const run = actorRuns.find((r) => r.graphId === gid);
                          if (!run) return null;
                          const spec = getRegisteredGraph(gid);
                          if (!spec) return null;
                          const variance = computeGraphVarianceReport(
                            gid,
                            run,
                            crowdMode,
                            actors,
                            runs
                          );

                          let deltaBadge = "";
                          let deltaPositive = true;
                          if (gid === "lev" && variance.levVariance) {
                            const d = variance.levVariance.p99YearDelta;
                            deltaPositive = d <= 0;
                            deltaBadge = `${d > 0 ? `+${d}` : d}y vs Crowd`;
                          } else if (variance.rankedDivergences[0]) {
                            const top = variance.rankedDivergences[0];
                            const pct = Math.round(top.signedDelta * 100);
                            deltaPositive = pct >= 0;
                            deltaBadge = `${pct >= 0 ? `+${pct}%` : `${pct}%`} ${top.label.slice(0, 18)}`;
                          }

                          return (
                            <Link
                              key={gid}
                              href={`${spec.routeHref}?forecaster=${encodeURIComponent(
                                actor.handle
                              )}&variance=1&crowd=${crowdMode}`}
                              className="group rounded-xl border border-slate-800 bg-slate-950/90 hover:border-cyan-500/50 p-2.5 flex flex-col justify-between gap-1 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                                  {spec.shortTitle}
                                </span>
                                {deltaBadge && (
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold tabular-nums ${
                                      deltaPositive
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : "bg-amber-500/15 text-amber-300"
                                    }`}
                                  >
                                    {deltaBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {run.headlineSummary}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Progressive Disclosure <details> for System Prompt & Axioms */}
                  <details className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3 group">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-xs font-semibold text-slate-300 hover:text-white">
                      <span>
                        Inspect System Prompt &amp; {actor.worldview.explicitAxioms.length} Explicit Axioms
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="pt-3 mt-3 border-t border-slate-800 space-y-3 text-xs">
                      <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                        {actor.worldview.explicitAxioms.map((ax, i) => (
                          <li key={i}>{ax}</li>
                        ))}
                      </ul>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-mono uppercase text-slate-400">
                            Tuned System Prompt
                          </span>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopySystemPrompt(actor)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-mono text-cyan-300 hover:border-cyan-500/50"
                            >
                              {copyStatus ? (
                                <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                              ) : (
                                <Copy className="h-3 w-3" aria-hidden="true" />
                              )}
                              <span>Copy Prompt</span>
                            </button>
                            <span
                              role="status"
                              className="fg-copy-status text-[11px] font-mono text-emerald-300"
                            >
                              {copyStatus}
                            </span>
                          </div>
                        </div>
                        <pre
                          role="region"
                          aria-label={`System prompt for ${actor.displayName}`}
                          tabIndex={0}
                          className="max-h-36 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] font-mono text-slate-200 whitespace-pre-wrap"
                        >
                          <code>{actor.worldview.systemPrompt}</code>
                        </pre>
                      </div>

                      {actor.worldview.groundingLinks.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {actor.worldview.groundingLinks.map((lnk) => (
                            <a
                              key={lnk.url}
                              href={lnk.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-sky-300 hover:underline"
                            >
                              <span>{lnk.title}</span>
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                {/* Action Footer */}
                <footer className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      const primaryRun =
                        actorRuns.find((r) => r.graphId === "ai-2050-simple") ||
                        actorRuns[0];
                      setDrawerGraphId(
                        primaryRun?.graphId || "ai-2050-simple"
                      );
                      setDrawerActor(actor);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-500/50 hover:text-sky-300 transition-colors"
                  >
                    <span>Inspect Worldview &amp; Top Disagreements</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudioForkActor(actor);
                      setStudioInitialScope("graph");
                      setStudioOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-colors"
                  >
                    <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Fork Worldview in Studio</span>
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Worldview Inspection Drawer */}
      <ForecasterWorldviewDrawer
        open={Boolean(drawerActor)}
        onClose={() => setDrawerActor(null)}
        graphId={drawerRun?.graphId || drawerGraphId}
        actor={drawerActor || undefined}
        run={drawerRun}
        varianceReport={drawerVariance}
        crowdMode={crowdMode}
        onCrowdModeChange={setCrowdMode}
        onForkActor={(actorToFork) => {
          setDrawerActor(null);
          setStudioForkActor(actorToFork);
          setStudioInitialScope("graph");
          setStudioOpen(true);
        }}
      />

      {/* Agent Studio Modal */}
      <AgentStudioModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        graphId={studioGraphId}
        actors={actors}
        runs={runs}
        crowdMode={crowdMode}
        initialForkActor={studioForkActor}
        initialScope={studioInitialScope}
        onApplyRuns={handleApplyStudioRuns}
      />
    </div>
  );
}
