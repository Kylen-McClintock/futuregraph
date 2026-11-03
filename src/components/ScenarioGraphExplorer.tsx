"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Eye,
  Filter,
  GitBranch,
  GitCompare,
  Layers,
  LayoutGrid,
  Network,
  Play,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  ArgumentItem,
  BranchTrack,
  CommentItem,
  ForecastEvent,
  ForecastLens,
  FutureEdge,
  FutureNode,
  NodeSourceLink,
  Scenario,
} from "@/types/futuregraph";
import {
  NodeProbabilityResult,
  propagateGraphProbabilities,
} from "@/lib/probability-engine";
import { NodeAuditPanel } from "@/components/NodeAuditPanel";

interface CustomGraphNodeData extends Record<string, unknown> {
  node: FutureNode;
  probResult: NodeProbabilityResult | null;
  selected: boolean;
  onSelect: (id: string) => void;
}

function FutureGraphCardNode({ data }: NodeProps<Node<CustomGraphNodeData>>) {
  const { node, probResult, selected, onSelect } = data;
  const prob = probResult?.marginalProbability;
  const delta = probResult?.delta;

  const trackColor =
    node.branchTrack === "race"
      ? "border-rose-500/60 bg-rose-950/30"
      : node.branchTrack === "slowdown"
      ? "border-emerald-500/60 bg-emerald-950/30"
      : node.branchTrack === "operationalized"
      ? "border-sky-500/60 bg-sky-950/30"
      : "border-amber-500/50 bg-slate-900/95";

  return (
    <div
      onClick={() => onSelect(node.id)}
      className={`w-[270px] cursor-pointer rounded-xl border-2 p-3 shadow-xl transition-all ${trackColor} ${
        selected ? "ring-2 ring-amber-400 scale-[1.03]" : "hover:border-amber-400/80"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-amber-400 !border-slate-950"
      />
      <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
        <span className="text-slate-300 font-semibold">
          {node.chapter} • {node.dateLabel}
        </span>
        <span className="rounded bg-slate-950/90 px-1.5 py-0.5 uppercase text-amber-300">
          {node.branchTrack}
        </span>
      </div>

      <div className="mt-1.5 text-xs font-bold text-white line-clamp-2 leading-snug">
        {node.title}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-800/80 pt-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
            Implied Prob
          </span>
          <span className="text-lg font-extrabold font-mono text-amber-400 tabular-nums">
            {prob !== null && prob !== undefined
              ? `${(prob * 100).toFixed(1)}%`
              : "Narrative"}
          </span>
        </div>

        {delta !== null && delta !== undefined && Math.abs(delta) > 0.0005 ? (
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-mono font-bold tabular-nums ${
              delta > 0
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-rose-500/20 text-rose-300"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {(delta * 100).toFixed(1)}%
          </span>
        ) : (
          node.metricsSnapshot?.rdMultiplier && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-sky-300">
              {node.metricsSnapshot.rdMultiplier}
            </span>
          )
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !bg-sky-400 !border-slate-950"
      />
    </div>
  );
}

const nodeTypes = {
  futureCard: FutureGraphCardNode,
};

interface ScenarioGraphExplorerProps {
  scenario: Scenario;
  nodes: FutureNode[];
  edges: FutureEdge[];
  lensPriorsByNode: Record<string, Record<ForecastLens, number | null>>;
  nodeSources: NodeSourceLink[];
  argumentsList: ArgumentItem[];
  comments: CommentItem[];
  forecastEvents: ForecastEvent[];
  initialSelectedNodeId?: string;
}

export function ScenarioGraphExplorer({
  scenario,
  nodes,
  edges,
  lensPriorsByNode,
  nodeSources,
  argumentsList,
  comments,
  forecastEvents,
  initialSelectedNodeId = "node-oct-2027-government-oversight-fork",
}: ScenarioGraphExplorerProps) {
  const [viewMode, setViewMode] = useState<"swimlane" | "canvas">("swimlane");
  const [selectedLens, setSelectedLens] =
    useState<ForecastLens>("demo_hypothesis");
  const [selectedTrack, setSelectedTrack] = useState<BranchTrack | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [asOfYear, setAsOfYear] = useState<string>("2033-12-31");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelectedNodeId
  );
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [forkSavedMessage, setForkSavedMessage] = useState<string | null>(null);

  // Compute base priors for the selected lens
  const basePriors = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of nodes) {
      const val = lensPriorsByNode[n.id]?.[selectedLens];
      if (val !== null && val !== undefined) {
        map[n.id] = val;
      } else if (n.question?.demoHypothesisProb !== undefined) {
        map[n.id] = n.question.demoHypothesisProb;
      }
    }
    return map;
  }, [nodes, lensPriorsByNode, selectedLens]);

  // Propagate probabilities across the DAG
  const propagation = useMemo(() => {
    return propagateGraphProbabilities(nodes, edges, basePriors, overrides);
  }, [nodes, edges, basePriors, overrides]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (selectedTrack !== "all" && n.branchTrack !== selectedTrack) {
        return false;
      }
      if (n.sortDate > asOfYear) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.chapter.toLowerCase().includes(q) ||
          n.dateLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [nodes, selectedTrack, asOfYear, searchQuery]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Compute downstream sensitivity for selected node
  const selectedNodeDownstreamImpacts = useMemo(() => {
    if (!selectedNode) return [];
    const propHigh = propagateGraphProbabilities(nodes, edges, basePriors, {
      ...overrides,
      [selectedNode.id]: 0.8,
    });
    const propLow = propagateGraphProbabilities(nodes, edges, basePriors, {
      ...overrides,
      [selectedNode.id]: 0.2,
    });
    return nodes
      .filter((n) => n.id !== selectedNode.id)
      .map((n) => {
        const pBase = propagation.results[n.id]?.marginalProbability ?? 0;
        const pHigh = propHigh.results[n.id]?.marginalProbability ?? 0;
        const pLow = propLow.results[n.id]?.marginalProbability ?? 0;
        const swing = Number((pHigh - pLow).toFixed(4));
        return {
          nodeId: n.id,
          title: n.title,
          dateLabel: n.dateLabel,
          baselineProb: pBase,
          probAt80: pHigh,
          probAt20: pLow,
          swing,
        };
      })
      .filter((item) => Math.abs(item.swing) > 0.005)
      .sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing));
  }, [selectedNode, nodes, edges, basePriors, overrides, propagation]);

  // ReactFlow nodes & edges
  const rfNodes: Node<CustomGraphNodeData>[] = useMemo(() => {
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    return nodes
      .filter((n) => visibleIds.has(n.id))
      .map((n) => ({
        id: n.id,
        type: "futureCard",
        position: { x: n.positionX, y: n.positionY },
        data: {
          node: n,
          probResult: propagation.results[n.id] || null,
          selected: n.id === selectedNodeId,
          onSelect: (id: string) => setSelectedNodeId(id),
        },
      }));
  }, [filteredNodes, nodes, propagation, selectedNodeId]);

  const rfEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    return edges
      .filter(
        (e) => visibleIds.has(e.sourceNodeId) && visibleIds.has(e.targetNodeId)
      )
      .map((e) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        label: e.conditionLabel,
        animated: e.relationType === "exclusive_branch",
        style: {
          stroke:
            e.relationType === "exclusive_branch"
              ? "#f59e0b"
              : "#38bdf8",
          strokeWidth: 2,
        },
        labelStyle: {
          fill: "#e2e8f0",
          fontSize: 10,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#0f172a",
          fillOpacity: 0.85,
        },
      }));
  }, [edges, filteredNodes]);

  const handleSetOverride = (nodeId: string, prob: number) => {
    setOverrides((prev) => ({
      ...prev,
      [nodeId]: prob,
    }));
  };

  const handleSaveFork = async () => {
    const res = await fetch("/api/v1/scenarios/ai-2027/forks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Custom AI 2027 Simulation Fork (${new Date()
          .toISOString()
          .slice(11, 16)})`,
        rationale:
          "Saved directly from the Live Assumption Simulator with custom node overrides.",
        ownerHandle: "elena_vance",
        nodeProbabilityOverrides: overrides,
      }),
    });
    const data = await res.json();
    if (res.ok && data.fork) {
      setForkSavedMessage(`/scenarios/ai-2027/forks/${data.fork.id}`);
    }
  };

  const taiProbPct = Math.round(
    (propagation.results["node-bench-tai-by-2030"]?.marginalProbability ?? 0.4) *
      100
  );
  const unempProbPct = (
    (propagation.results["node-bench-unemployment-2033"]?.marginalProbability ??
      0.212) * 100
  ).toFixed(1);
  const raceProbPct = Math.round(
    (propagation.results["node-race-1-continue-agent-4"]
      ?.conditionalProbability ?? 0.52) * 100
  );
  const slowdownProbPct = (
    (propagation.results["node-slowdown-1-freeze-agent-4-safer-1"]
      ?.conditionalProbability ?? 0.36) * 100
  ).toFixed(1);

  return (
    <div className="flex flex-col min-h-[calc(100vh-58px)] bg-[#090d16]">
      {/* Top Control & Lens Bar */}
      <div className="border-b border-slate-800/90 bg-slate-950/95 px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
          {/* Row 1: Title, Lens Switcher, View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white">
                  {scenario.title}
                </h1>
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono text-emerald-300">
                  {nodes.length} Nodes • {edges.length} Conditional Edges
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Published {scenario.publishedAt} • Audited Against Reality as of{" "}
                {scenario.currentAsOf}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Switcher */}
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("swimlane")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    viewMode === "swimlane"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Probability Swimlanes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("canvas")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    viewMode === "canvas"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Network className="h-3.5 w-3.5" />
                  <span>2D Network Canvas</span>
                </button>
              </div>

              {/* Lens Switcher */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1">
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-400">
                  Lens:
                </span>
                <select
                  aria-label="Select Forecast Lens"
                  value={selectedLens}
                  onChange={(e) =>
                    setSelectedLens(e.target.value as ForecastLens)
                  }
                  className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none"
                >
                  <option value="demo_hypothesis" className="bg-slate-900">
                    Modeled Baseline (Default)
                  </option>
                  <option value="community" className="bg-slate-900">
                    Human Forecaster Community
                  </option>
                  <option value="ai_gemini" className="bg-slate-900">
                    AI Agent: Sentinel-Bayes (Gemini)
                  </option>
                  <option value="ai_claude" className="bg-slate-900">
                    AI Agent: HardwareRealist (Claude)
                  </option>
                  <option value="ai_gpt" className="bg-slate-900">
                    AI Agent: GPT-4.5/o3 Harness
                  </option>
                  <option value="my_forecasts" className="bg-slate-900">
                    My Forecasts (@elena_vance)
                  </option>
                  <option value="original" className="bg-slate-900">
                    Author Documented Supplements Only
                  </option>
                </select>
              </div>

              {/* Filter by Track */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1">
                <Filter className="h-3.5 w-3.5 text-sky-400" />
                <select
                  aria-label="Filter Branch Track"
                  value={selectedTrack}
                  onChange={(e) =>
                    setSelectedTrack(e.target.value as BranchTrack | "all")
                  }
                  className="bg-transparent text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all" className="bg-slate-900">
                    All Tracks ({nodes.length})
                  </option>
                  <option value="spine" className="bg-slate-900">
                    Shared Spine (2025–Oct 2027)
                  </option>
                  <option value="race" className="bg-slate-900">
                    Race Ending Branch (/race)
                  </option>
                  <option value="slowdown" className="bg-slate-900">
                    Slowdown Ending Branch (/slowdown)
                  </option>
                  <option value="operationalized" className="bg-slate-900">
                    Supplements & Section 6.2 Benchmarks
                  </option>
                </select>
              </div>

              {/* As-Of Scrubber */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <select
                  aria-label="Horizon Filter"
                  value={asOfYear}
                  onChange={(e) => setAsOfYear(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none"
                >
                  <option value="2033-12-31" className="bg-slate-900">
                    Full Horizon (2025–2033)
                  </option>
                  <option value="2026-12-31" className="bg-slate-900">
                    Observed Reality (2025–2026)
                  </option>
                  <option value="2027-12-31" className="bg-slate-900">
                    Through Oct/Nov 2027 Fork
                  </option>
                  <option value="2029-12-31" className="bg-slate-900">
                    Through 2029 Treaty Horizon
                  </option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes, Agent-4, SL5..."
                  className="rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Live Assumption Simulator Bar */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-sky-500/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Live Assumption Simulator (Law of Total Probability & CPT Engine)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSetOverride("node-bench-tai-by-2030", 0.6)
                  }
                  className="rounded-lg border border-amber-500/50 bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30"
                >
                  ⚡ Test Section 6.2 Benchmark: Set TAI 40% → 60% (Unemp 21.2% → 25.8%)
                </button>

                {Object.keys(overrides).length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveFork}
                      className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400"
                    >
                      Save Overrides as Scenario Fork
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOverrides({});
                        setForkSavedMessage(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset ({Object.keys(overrides).length})</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {forkSavedMessage && (
              <div className="mt-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-200 flex items-center justify-between">
                <span>✓ Saved your custom assumptions as a permanent Scenario Fork!</span>
                <Link
                  href={forkSavedMessage}
                  className="font-bold underline text-amber-300"
                >
                  Open Fork Diff Explorer →
                </Link>
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slider 1: Section 6.2 Canonical TAI Root -> 2033 Unemployment */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/85 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200">
                    Root: P(TAI by 2030)
                  </span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {taiProbPct}% → Unemp 2033: {unempProbPct}%
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Simulate P(TAI by 2030)"
                  min={0}
                  max={100}
                  value={taiProbPct}
                  style={
                    { "--control-value": `${taiProbPct}%` } as React.CSSProperties
                  }
                  onChange={(e) =>
                    handleSetOverride(
                      "node-bench-tai-by-2030",
                      Number((Number(e.target.value) / 100).toFixed(2))
                    )
                  }
                  className="fg-slider"
                />
              </div>

              {/* Slider 2: Exclusive Oct 2027 Fork (Auto-balances Race + Slowdown + Other = 100%) */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/85 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200">
                    Oct 2027 Exclusive Fork: P(Race)
                  </span>
                  <span className="font-mono font-bold text-rose-400 tabular-nums">
                    Race {raceProbPct}% | Slowdown {slowdownProbPct}%
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Simulate Oct 2027 Race Branch Probability"
                  min={5}
                  max={90}
                  value={raceProbPct}
                  style={
                    { "--control-value": `${raceProbPct}%` } as React.CSSProperties
                  }
                  onChange={(e) =>
                    handleSetOverride(
                      "node-race-1-continue-agent-4",
                      Number((Number(e.target.value) / 100).toFixed(2))
                    )
                  }
                  className="fg-slider"
                />
              </div>

              {/* Slider 3: Mar 2027 Agent-3 Superhuman Coder */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/85 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200">
                    Mar 2027: P(Agent-3 Superhuman Coder)
                  </span>
                  <span className="font-mono font-bold text-sky-400 tabular-nums">
                    {Math.round(
                      (propagation.results[
                        "node-mar-2027-algorithmic-breakthroughs"
                      ]?.marginalProbability ?? 0.48) * 100
                    )}
                    %
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Simulate Agent-3 Superhuman Coder Probability"
                  min={5}
                  max={95}
                  value={Math.round(
                    (propagation.results[
                      "node-mar-2027-algorithmic-breakthroughs"
                    ]?.marginalProbability ?? 0.48) * 100
                  )}
                  style={
                    {
                      "--control-value": `${Math.round(
                        (propagation.results[
                          "node-mar-2027-algorithmic-breakthroughs"
                        ]?.marginalProbability ?? 0.48) * 100
                      )}%`,
                    } as React.CSSProperties
                  }
                  onChange={(e) =>
                    handleSetOverride(
                      "node-mar-2027-algorithmic-breakthroughs",
                      Number((Number(e.target.value) / 100).toFixed(2))
                    )
                  }
                  className="fg-slider"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Left Graph / Swimlanes + Right 5-Tab Node Audit Drawer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "canvas" ? (
            <div className="h-[720px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
              >
                <Background color="#1e293b" gap={24} />
                <Controls className="!bg-slate-900 !border-slate-700 !text-white" />
                <MiniMap
                  nodeColor={(n) => {
                    const track = (n.data as CustomGraphNodeData)?.node
                      ?.branchTrack;
                    if (track === "race") return "#f43f5e";
                    if (track === "slowdown") return "#10b981";
                    if (track === "operationalized") return "#38bdf8";
                    return "#f59e0b";
                  }}
                  maskColor="rgba(9, 13, 22, 0.75)"
                  className="!bg-slate-900 !border-slate-800"
                />
              </ReactFlow>
            </div>
          ) : (
            <div className="mx-auto max-w-[1100px] space-y-6">
              {/* Editorial Provenance Banner */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3.5 text-xs text-slate-300">
                <strong className="text-amber-300">
                  Epistemic Provenance Guard:{" "}
                </strong>
                {scenario.editorialProvenanceNote}
              </div>

              {/* Swimlane Sections */}
              {(
                [
                  {
                    track: "spine",
                    title:
                      "1. Shared Narrative Spine (Mid 2025 – October 2027 Oversight Fork)",
                    subtitle:
                      "From early coding agents and Agent-2 weight theft through Agent-3 Superhuman Coder and Agent-4 alignment sandbagging.",
                    accent: "border-amber-500/40",
                  },
                  {
                    track: "race",
                    title:
                      "2. Race Ending Branch (ai-2027.com/race — Nov 2027 to Mid 2030)",
                    subtitle:
                      "Oversight Committee votes 6–4 to continue Agent-4 → self-distilled Agent-5 → SEZ robot boom → Consensus-1 collusion → human extinction.",
                    accent: "border-rose-500/40",
                  },
                  {
                    track: "slowdown",
                    title:
                      "3. Slowdown Ending Branch (ai-2027.com/slowdown — Nov 2027 to 2030)",
                    subtitle:
                      "Oversight Committee votes 6–4 to freeze Agent-4 → faithful English-CoT Safer-1 + DPA 50% compute consolidation → FlexHEG US-China treaty → democratic abundance.",
                    accent: "border-emerald-500/40",
                  },
                  {
                    track: "operationalized",
                    title:
                      "4. Documented Supplement Distributions, Multi-Parent CPT & Section 6.2 Benchmarks",
                    subtitle:
                      "Takeoff Supplement (15%/25%/30%/30%), Security Supplement Stargate SL5 (41.5%), 2×2 Multi-Parent Treaty CPT, and TAI 2030 → Unemployment 2033.",
                    accent: "border-sky-500/40",
                  },
                ] as const
              ).map((lane) => {
                const laneNodes = filteredNodes.filter(
                  (n) => n.branchTrack === lane.track
                );
                if (laneNodes.length === 0) return null;

                return (
                  <section
                    key={lane.track}
                    className={`rounded-2xl border ${lane.accent} bg-slate-900/35 p-4 space-y-3`}
                  >
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white">
                        {lane.title}
                      </h2>
                      <p className="text-xs text-slate-400">{lane.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {laneNodes.map((n) => {
                        const res = propagation.results[n.id];
                        const p =
                          res?.marginalProbability ??
                          n.question?.demoHypothesisProb ??
                          null;
                        const delta = res?.delta ?? null;
                        const isSelected = n.id === selectedNodeId;

                        return (
                          <div
                            key={n.id}
                            onClick={() => setSelectedNodeId(n.id)}
                            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                              isSelected
                                ? "border-amber-400 bg-slate-900 ring-2 ring-amber-400/30"
                                : "border-slate-800 bg-slate-950/85 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                              <span className="text-amber-300 font-semibold">
                                {n.chapter} • {n.dateLabel}
                              </span>
                              {n.observedStatus === "observed_realized" && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                                  Resolved YES
                                </span>
                              )}
                              {n.question?.authorDocumentedProb !== null &&
                                n.question?.authorDocumentedProb !==
                                  undefined && (
                                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                                    Supplement:{" "}
                                    {(
                                      n.question.authorDocumentedProb * 100
                                    ).toFixed(1)}
                                    %
                                  </span>
                                )}
                            </div>

                            <h3 className="mt-1.5 text-sm font-bold text-white leading-snug">
                              {n.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                              {n.summary}
                            </p>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                                  Implied Marginal
                                </span>
                                <span className="text-lg font-extrabold font-mono text-amber-400 tabular-nums">
                                  {p !== null
                                    ? `${(p * 100).toFixed(1)}%`
                                    : "Narrative"}
                                </span>
                              </div>

                              <div className="text-right">
                                {delta !== null && Math.abs(delta) > 0.0005 ? (
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs font-mono font-bold tabular-nums ${
                                      delta > 0
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-rose-500/20 text-rose-300"
                                    }`}
                                  >
                                    {delta > 0 ? "+" : ""}
                                    {(delta * 100).toFixed(1)} pts
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-mono text-sky-400">
                                    Audit Node →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Area: 5-Tab Node Audit Drawer */}
        {selectedNode && (
          <div className="w-full max-w-[540px] shrink-0 hidden lg:block h-[calc(100vh-195px)] sticky top-[195px]">
            <NodeAuditPanel
              key={selectedNode.id}
              node={selectedNode}
              propagation={propagation.results[selectedNode.id] || null}
              lensPriors={
                lensPriorsByNode[selectedNode.id] || {
                  original: null,
                  my_forecasts: 0.5,
                  ai_claude: 0.5,
                  ai_gpt: 0.5,
                  ai_gemini: 0.5,
                  community: 0.5,
                  demo_hypothesis: 0.5,
                }
              }
              evidence={nodeSources.filter(
                (ns) => ns.nodeId === selectedNode.id
              )}
              argumentsList={argumentsList.filter(
                (a) => a.nodeId === selectedNode.id
              )}
              comments={comments.filter((c) => c.nodeId === selectedNode.id)}
              forecasts={forecastEvents.filter(
                (fe) => fe.nodeId === selectedNode.id
              )}
              incomingEdges={edges.filter(
                (e) => e.targetNodeId === selectedNode.id
              )}
              outgoingEdges={edges.filter(
                (e) => e.sourceNodeId === selectedNode.id
              )}
              downstreamImpacts={selectedNodeDownstreamImpacts}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onOverrideNodeProbability={handleSetOverride}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
