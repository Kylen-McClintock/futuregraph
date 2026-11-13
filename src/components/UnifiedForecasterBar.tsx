"use client";

import React, { useId } from "react";
import {
  Bot,
  GitBranch,
  Info,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { AgentStudioModal } from "@/components/AgentStudioModal";
import { ForecasterWorldviewDrawer } from "@/components/ForecasterWorldviewDrawer";
import { useGraphForecaster } from "@/hooks/useGraphForecaster";
import { CrowdEnsembleMode } from "@/types/forecaster";

export interface UnifiedForecasterBarProps {
  forecasterState: ReturnType<typeof useGraphForecaster>;
  defaultBaselineLabel?: string;
  focusedBranchNodeId?: string | null;
  focusedBranchLabel?: string | null;
  onFocusNode?: (nodeId: string, canonicalNodeId?: string) => void;
  compact?: boolean;
}

export function UnifiedForecasterBar({
  forecasterState,
  defaultBaselineLabel,
  focusedBranchNodeId,
  focusedBranchLabel,
  onFocusNode,
  compact = false,
}: UnifiedForecasterBarProps) {
  const selectId = useId();
  const {
    graphSpec,
    actors,
    runs,
    groupedActors,
    activeLensMode,
    crowdMode,
    selectedActor,
    selectedActorRun,
    showVarianceFromCrowd,
    crowdDistribution,
    varianceReport,
    selectDefaultBaseline,
    selectCrowdWisdom,
    selectIndividualActor,
    setCrowdMode,
    toggleVarianceFromCrowd,
    isWorldviewDrawerOpen,
    setIsWorldviewDrawerOpen,
    isAgentStudioOpen,
    setIsAgentStudioOpen,
    studioForkActor,
    studioInitialScope,
    studioBranchNodeId,
    openAgentStudio,
    registerLocalOrSavedRuns,
  } = forecasterState;

  const baselineLabel =
    defaultBaselineLabel ||
    graphSpec?.defaultBaselineLabel ||
    "Default Baseline";

  const showIndividualControls =
    activeLensMode === "individual_actor" ||
    (activeLensMode === "default_creator" &&
      Boolean(graphSpec?.defaultCreatorHandle));

  const drawerActor =
    activeLensMode === "individual_actor"
      ? selectedActor
      : actors.find((a) => a.handle === (graphSpec?.defaultCreatorHandle || "kylen"));

  const drawerRun =
    activeLensMode === "individual_actor"
      ? selectedActorRun
      : runs.find(
          (r) =>
            r.graphId === (graphSpec?.graphId || "ai-2027") &&
            r.actorHandle === (graphSpec?.defaultCreatorHandle || "kylen")
        );

  return (
    <>
      <div
        className={`rounded-xl bg-slate-900/90 border border-slate-800/90 px-2.5 sm:px-3 ${
          compact ? "py-1.5" : "py-2"
        } flex items-center justify-between gap-2 overflow-x-auto fg-no-scrollbar lg:flex-wrap lg:overflow-visible shadow-sm`}
      >
        {/* Left: Primary Lens Switcher + Forecaster Picker */}
        <div className="flex items-center gap-1.5 shrink-0 lg:flex-wrap lg:min-w-0">
          {/* 1. Default / Creator Baseline vs Crowd Wisdom */}
          <div
            className="inline-flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 shrink-0"
            role="group"
            aria-label="Forecast baseline mode"
          >
            <button
              type="button"
              onClick={selectDefaultBaseline}
              className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                activeLensMode === "default_creator"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {baselineLabel}
            </button>
            <button
              type="button"
              onClick={() => selectCrowdWisdom()}
              className={`inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                activeLensMode === "crowd_wisdom"
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              Crowd Wisdom
              <span className="hidden sm:inline text-[10px] font-mono opacity-80">
                ({crowdDistribution.contributorCount})
              </span>
            </button>
          </div>

          {/* Inline Crowd Composition Sub-Toggle (only when Crowd Wisdom or Δ vs. Crowd is active) */}
          {(activeLensMode === "crowd_wisdom" || showVarianceFromCrowd) && (
            <div
              className="inline-flex items-center rounded-lg bg-slate-950/90 p-0.5 border border-cyan-500/30 shrink-0"
              role="group"
              aria-label="Crowd Wisdom ensemble composition"
            >
              {(
                [
                  { id: "all_ensemble", label: "All" },
                  { id: "humans_markets", label: "Humans+Mkts" },
                  { id: "agents_only", label: "AI Agents" },
                ] as Array<{ id: CrowdEnsembleMode; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (activeLensMode === "crowd_wisdom") {
                      selectCrowdWisdom(opt.id);
                    } else {
                      setCrowdMode(opt.id);
                    }
                  }}
                  className={`min-h-[32px] px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                    crowdMode === opt.id
                      ? "bg-cyan-500/25 text-cyan-200 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* 2. Individual Person / Worldview Agent Picker */}
          <div className="relative flex items-center shrink-0">
            <label htmlFor={selectId} className="sr-only">
              View any individual person or worldview agent prediction
            </label>
            <select
              id={selectId}
              value={
                activeLensMode === "individual_actor" && selectedActor
                  ? selectedActor.handle
                  : ""
              }
              onChange={(e) => {
                if (e.target.value) {
                  selectIndividualActor(e.target.value);
                }
              }}
              className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors max-w-[195px] sm:max-w-[265px] cursor-pointer ${
                activeLensMode === "individual_actor"
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-200 font-semibold"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <option value="">
                Inspect Person or Worldview Agent...
              </option>
              {groupedActors.benchmarks.length > 0 && (
                <optgroup label="Creator & Calibrated Benchmarks">
                  {groupedActors.benchmarks.map((a) => (
                    <option key={a.handle} value={a.handle}>
                      {a.displayName} (@{a.handle})
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedActors.worldviewAgents.length > 0 && (
                <optgroup label="5 Transparent Worldview Agents">
                  {groupedActors.worldviewAgents.map((a) => (
                    <option key={a.handle} value={a.handle}>
                      🤖 {a.displayName} (@{a.handle})
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedActors.domainExperts.length > 0 && (
                <optgroup label="Published Domain Researchers">
                  {groupedActors.domainExperts.map((a) => (
                    <option key={a.handle} value={a.handle}>
                      {a.displayName} ({a.shortBadge})
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedActors.communitySandbox.length > 0 && (
                <optgroup label="Community Sandbox Submissions">
                  {groupedActors.communitySandbox.map((a) => (
                    <option key={a.handle} value={a.handle}>
                      🧪 {a.displayName} (@{a.handle})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Right: 1-Click Progressive Depth Controls */}
        <div className="flex items-center gap-1.5 shrink-0 lg:flex-wrap">
          {showIndividualControls && (
            <>
              <button
                type="button"
                onClick={toggleVarianceFromCrowd}
                aria-pressed={showVarianceFromCrowd}
                className={`inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors ${
                  showVarianceFromCrowd
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                    : "bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300"
                }`}
                title="Highlight signed variance from Crowd Wisdom across the graph"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Δ vs. Crowd
              </button>

              {drawerActor && (
                <button
                  type="button"
                  onClick={() => setIsWorldviewDrawerOpen(true)}
                  className="inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 whitespace-nowrap transition-colors"
                >
                  <Info
                    className="w-3.5 h-3.5 text-cyan-400"
                    aria-hidden="true"
                  />
                  <span className="hidden md:inline">Worldview &amp;</span> Why
                </button>
              )}
            </>
          )}

          {focusedBranchNodeId && !compact && (
            <button
              type="button"
              onClick={() =>
                openAgentStudio({
                  forkActor:
                    activeLensMode === "individual_actor"
                      ? selectedActor
                      : null,
                  scope: "branch",
                  branchNodeId: focusedBranchNodeId,
                })
              }
              className="hidden xl:inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 whitespace-nowrap transition-colors"
              title="Copy conditional branch prompt starting at the selected fork"
            >
              <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
              Copy Branch Prompt
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              openAgentStudio({
                forkActor:
                  activeLensMode === "individual_actor" ? selectedActor : null,
                scope: "graph",
                branchNodeId: focusedBranchNodeId,
              })
            }
            className="inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white keep-white whitespace-nowrap transition-colors shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" aria-hidden="true" />
            <Plus className="w-3 h-3 -ml-0.5" aria-hidden="true" />
            <span>Test Your Agent</span>
          </button>
        </div>
      </div>

      {/* Progressive Depth Modals (only open on click) */}
      <ForecasterWorldviewDrawer
        open={isWorldviewDrawerOpen}
        onClose={() => setIsWorldviewDrawerOpen(false)}
        graphId={graphSpec?.graphId || "ai-2027"}
        actor={drawerActor}
        run={drawerRun}
        varianceReport={varianceReport}
        crowdMode={crowdMode}
        onCrowdModeChange={setCrowdMode}
        onForkActor={(actorToFork) =>
          openAgentStudio({
            forkActor: actorToFork,
            scope: "graph",
            branchNodeId: focusedBranchNodeId,
          })
        }
        onFocusNode={onFocusNode}
      />

      <AgentStudioModal
        open={isAgentStudioOpen}
        onClose={() => setIsAgentStudioOpen(false)}
        graphId={graphSpec?.graphId || "ai-2027"}
        actors={actors}
        runs={runs}
        crowdMode={crowdMode}
        initialForkActor={studioForkActor}
        initialScope={studioInitialScope}
        focusedBranchNodeId={studioBranchNodeId || focusedBranchNodeId}
        focusedBranchLabel={focusedBranchLabel}
        onApplyRuns={registerLocalOrSavedRuns}
      />
    </>
  );
}
