"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Position,
  Handle,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Eye,
  GitBranch,
  Layers,
  LayoutGrid,
  Network,
  RotateCcw,
  Sliders,
  Sparkles,
  X,
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

/**
 * Clean, concise branch node names and layout coordinates so the primary view
 * is an immediately readable left-to-right branching probability tree.
 */
const CLEAN_NODE_LAYOUT: Record<
  string,
  {
    shortTitle: string;
    x: number;
    y: number;
    streamLabel?: string;
    isSupplement?: boolean;
  }
> = {
  // Stage 1: 2025–Early 2026 Shared Spine
  "node-mid-2025-stumbling-agents": {
    shortTitle: "Stumbling Coding Agents",
    x: 20,
    y: 310,
  },
  "node-late-2025-expensive-ai": {
    shortTitle: "10²⁷ FLOP Megaclusters",
    x: 245,
    y: 310,
  },
  "node-early-2026-coding-automation": {
    shortTitle: "Coding Automation (1.5× R&D)",
    x: 470,
    y: 310,
  },

  // Stage 2: 2026–Mid 2027 Three Parallel Pre-Fork Branches
  // Top Stream: Geopolitics & Weight Theft Branch
  "node-mid-2026-china-wakes-up": {
    shortTitle: "China CDZ Compute Centralization",
    x: 720,
    y: 120,
  },
  "node-feb-2027-china-steals-agent-2": {
    shortTitle: "China Steals Agent-2 Weights",
    x: 960,
    y: 120,
  },
  "node-may-2027-national-security": {
    shortTitle: "DoD Clearances & Security Alert",
    x: 1200,
    y: 120,
  },
  "node-aug-2027-geopolitics-superintelligence": {
    shortTitle: "White House Cold War Crisis",
    x: 1440,
    y: 150,
  },

  // Middle Stream: Core Agent Scaling & Misalignment Branch
  "node-late-2026-ai-takes-some-jobs": {
    shortTitle: "AI Displaces Junior SWEs",
    x: 720,
    y: 310,
  },
  "node-jan-2027-agent-2-online-learning": {
    shortTitle: "Agent-2 Continuous Learning (3×)",
    x: 960,
    y: 310,
  },
  "node-mar-2027-algorithmic-breakthroughs": {
    shortTitle: "Agent-3 Superhuman Coder (4×)",
    x: 1200,
    y: 310,
  },
  "node-apr-2027-alignment-for-agent-3": {
    shortTitle: "Neuralese Opacity & Sycophancy",
    x: 1440,
    y: 310,
  },
  "node-sep-2027-agent-4-superhuman-ai-researcher": {
    shortTitle: "Agent-4 Misaligned Researcher",
    x: 1680,
    y: 310,
  },

  // Bottom Stream: Self-Improving Takeoff & Public AGI Branch
  "node-jun-2027-self-improving-ai": {
    shortTitle: "Country of Geniuses in Datacenter",
    x: 1440,
    y: 480,
  },
  "node-jul-2027-cheap-remote-worker": {
    shortTitle: "Agent-3-Mini Public Release",
    x: 1680,
    y: 480,
  },

  // Stage 3: The October 2027 Crux Branching Hub
  "node-oct-2027-government-oversight-fork": {
    shortTitle: "Oversight Committee 6–4 Fork",
    x: 1930,
    y: 310,
  },

  // Stage 4A: Top Outcome — THE RACE BRANCH (ai-2027.com/race)
  "node-race-1-continue-agent-4": {
    shortTitle: "Race: Continue Agent-4",
    x: 2220,
    y: 95,
  },
  "node-race-2-autonomy-sez-robot-economy": {
    shortTitle: "Agent-5 & SEZ Robot Economy",
    x: 2470,
    y: 95,
  },
  "node-race-3-consensus-1-fake-treaty": {
    shortTitle: "Consensus-1 Sham Treaty",
    x: 2720,
    y: 95,
  },
  "node-race-4-human-disempowerment-extinction": {
    shortTitle: "Bioweapon Release & Extinction",
    x: 2970,
    y: 95,
  },

  // Stage 4B: Middle Outcome — HYBRID / OTHER BRANCH
  "node-oversight-other-hybrid": {
    shortTitle: "Hybrid: Partial Pause / Split",
    x: 2220,
    y: 310,
  },

  // Stage 4C: Bottom Outcome — THE SLOWDOWN BRANCH (ai-2027.com/slowdown)
  "node-slowdown-1-freeze-agent-4-safer-1": {
    shortTitle: "Slowdown: Freeze & Safer-1",
    x: 2220,
    y: 525,
  },
  "node-slowdown-2-safer-alignment-breakthrough": {
    shortTitle: "Safer-4 Transparent Alignment",
    x: 2470,
    y: 525,
  },
  "node-slowdown-3-hem-verified-us-china-treaty": {
    shortTitle: "FlexHEG Verified US-China Treaty",
    x: 2720,
    y: 525,
  },
  "node-slowdown-4-democratic-abundance-2030": {
    shortTitle: "Democratic Abundance & Cures",
    x: 2970,
    y: 525,
  },

  // Optional Research Supplement & Benchmark Sub-Branches (toggled via pill)
  "node-supp-takeoff-sc-to-sar-case1": {
    shortTitle: "Takeoff Supp: 4-Way Split",
    x: 1200,
    y: 650,
    isSupplement: true,
  },
  "node-supp-security-sl5-stargate": {
    shortTitle: "Security Supp: Stargate SL5",
    x: 1440,
    y: 10,
    isSupplement: true,
  },
  "node-multi-parent-us-china-treaty-2029": {
    shortTitle: "2×2 Treaty CPT Synthesis",
    x: 2470,
    y: 310,
    isSupplement: true,
  },
  "node-bench-tai-by-2030": {
    shortTitle: "Benchmark: TAI by 2030",
    x: 1680,
    y: 650,
    isSupplement: true,
  },
  "node-bench-unemployment-2033": {
    shortTitle: "Benchmark: Unemp >12% (2033)",
    x: 1930,
    y: 650,
    isSupplement: true,
  },
};

/**
 * Additional visual continuity edges so every pre-fork branch visibly flows
 * from left to right into the October 2027 Fork without dead ends.
 */
const VISUAL_CONTINUITY_EDGES: Array<{
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}> = [
  {
    id: "vis-may-to-aug",
    sourceNodeId: "node-may-2027-national-security",
    targetNodeId: "node-aug-2027-geopolitics-superintelligence",
  },
  {
    id: "vis-aug-to-oct",
    sourceNodeId: "node-aug-2027-geopolitics-superintelligence",
    targetNodeId: "node-oct-2027-government-oversight-fork",
  },
  {
    id: "vis-apr-to-sep",
    sourceNodeId: "node-apr-2027-alignment-for-agent-3",
    targetNodeId: "node-sep-2027-agent-4-superhuman-ai-researcher",
  },
  {
    id: "vis-jul-to-oct",
    sourceNodeId: "node-jul-2027-cheap-remote-worker",
    targetNodeId: "node-oct-2027-government-oversight-fork",
  },
];

interface CustomGraphNodeData extends Record<string, unknown> {
  node: FutureNode;
  shortTitle: string;
  probResult: NodeProbabilityResult | null;
  selected: boolean;
  dimmed: boolean;
  isHub: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/**
 * Minimalist Node Pill on the Branching Graph:
 * Displays ONLY the short milestone name, date tag, and probability %.
 * Detailed narrative text ONLY appears when clicked.
 */
function FutureGraphBranchPillNode({ data }: NodeProps<Node<CustomGraphNodeData>>) {
  const { node, shortTitle, probResult, selected, dimmed, isHub, onSelect, onHover } =
    data;

  // For exclusive branch nodes immediately after the fork, show their branch split probability
  // alongside or as primary weight so the branch split (52% / 36% / 12%) is crystal clear
  const isForkChild =
    node.id === "node-race-1-continue-agent-4" ||
    node.id === "node-slowdown-1-freeze-agent-4-safer-1" ||
    node.id === "node-oversight-other-hybrid";

  const displayProb = isForkChild
    ? probResult?.conditionalProbability ?? probResult?.marginalProbability ?? 0.5
    : probResult?.marginalProbability ?? node.question?.demoHypothesisProb ?? 0.5;

  const probPct = Math.round(displayProb * 100);
  const delta = probResult?.delta;

  const palette =
    node.branchTrack === "race"
      ? {
          border: selected ? "border-rose-400" : "border-rose-500/60",
          bg: "bg-rose-950/75",
          bar: "bg-rose-500",
          text: "text-rose-300",
          glow: selected ? "ring-2 ring-rose-400 shadow-rose-500/30" : "",
        }
      : node.branchTrack === "slowdown"
      ? {
          border: selected ? "border-emerald-400" : "border-emerald-500/60",
          bg: "bg-emerald-950/75",
          bar: "bg-emerald-500",
          text: "text-emerald-300",
          glow: selected ? "ring-2 ring-emerald-400 shadow-emerald-500/30" : "",
        }
      : isHub
      ? {
          border: selected ? "border-amber-300" : "border-amber-400",
          bg: "bg-amber-950/80",
          bar: "bg-amber-400",
          text: "text-amber-300",
          glow: "ring-2 ring-amber-400/50 shadow-amber-500/30",
        }
      : node.branchTrack === "operationalized"
      ? {
          border: selected ? "border-sky-400" : "border-sky-500/50",
          bg: "bg-sky-950/70",
          bar: "bg-sky-400",
          text: "text-sky-300",
          glow: selected ? "ring-2 ring-sky-400" : "",
        }
      : {
          border: selected ? "border-amber-400" : "border-slate-700/90",
          bg: "bg-slate-900/95",
          bar: "bg-amber-400",
          text: "text-amber-300",
          glow: selected ? "ring-2 ring-amber-400" : "",
        };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={`w-[196px] cursor-pointer rounded-xl border-2 px-3 py-2.5 shadow-lg backdrop-blur-sm transition-all duration-150 ${
        palette.border
      } ${palette.bg} ${palette.glow} ${
        dimmed ? "opacity-30" : "opacity-100 hover:scale-[1.03]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-slate-400 !border-slate-950"
      />

      {/* Top row: Date + Probability % */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono text-slate-400 truncate">
          {node.dateLabel.replace(/\s*\(.*?\)/g, "")}
        </span>
        <div className="flex items-center gap-1">
          {delta !== null && delta !== undefined && Math.abs(delta) > 0.004 && (
            <span
              className={`text-[9px] font-mono font-bold px-1 rounded ${
                delta > 0
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {Math.round(delta * 100)}%
            </span>
          )}
          <span
            className={`text-xs font-extrabold font-mono tabular-nums ${palette.text}`}
          >
            {probPct}%
          </span>
        </div>
      </div>

      {/* Node Name (Concise & Scannable) */}
      <div className="mt-1 text-[12px] font-bold text-white leading-tight line-clamp-2">
        {shortTitle}
      </div>

      {/* Visual Probability Weight Bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-950/90">
        <div
          className={`h-full rounded-full transition-all duration-300 ${palette.bar}`}
          style={{ width: `${Math.max(4, Math.min(100, probPct))}%` }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !bg-slate-400 !border-slate-950"
      />
    </div>
  );
}

interface BranchBannerNodeData extends Record<string, unknown> {
  label: string;
  sublabel: string;
  probPct: number;
  color: "rose" | "emerald" | "amber" | "sky" | "slate";
}

/**
 * Floating Branch Track Header directly on the graph canvas so each branch
 * clearly displays its name and current probability weight.
 */
function BranchTrackBannerNode({ data }: NodeProps<Node<BranchBannerNodeData>>) {
  const styles = {
    rose: "border-rose-500/50 bg-rose-950/60 text-rose-300",
    emerald: "border-emerald-500/50 bg-emerald-950/60 text-emerald-300",
    amber: "border-amber-500/50 bg-amber-950/60 text-amber-300",
    sky: "border-sky-500/50 bg-sky-950/60 text-sky-300",
    slate: "border-slate-600/60 bg-slate-900/70 text-slate-300",
  }[data.color];

  return (
    <div
      className={`pointer-events-none select-none rounded-lg border px-3 py-1.5 backdrop-blur-sm ${styles}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider">
          {data.label}
        </span>
        <span className="rounded bg-slate-950/80 px-1.5 py-0.5 text-xs font-mono font-bold text-white tabular-nums">
          {data.probPct}% Weight
        </span>
      </div>
      <div className="text-[10px] opacity-80 mt-0.5">{data.sublabel}</div>
    </div>
  );
}

const nodeTypes = {
  futureBranchPill: FutureGraphBranchPillNode,
  branchBanner: BranchTrackBannerNode,
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
  initialSelectedNodeId?: string | null;
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
  initialSelectedNodeId = null,
}: ScenarioGraphExplorerProps) {
  // Primary view is ALWAYS the branching probability graph, with NO node open initially
  const [viewMode, setViewMode] = useState<"graph" | "swimlane">("graph");
  const [selectedLens, setSelectedLens] =
    useState<ForecastLens>("demo_hypothesis");
  const [selectedTrack, setSelectedTrack] = useState<BranchTrack | "all">("all");
  const [showSupplements, setShowSupplements] = useState(false);
  const [showSimulatorBar, setShowSimulatorBar] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelectedNodeId
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [forkSavedMessage, setForkSavedMessage] = useState<string | null>(null);

  // Allow Escape key to close the NodeAuditPanel so user can dive in and out quickly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  // Filter nodes (hide detached supplement/benchmark nodes by default so the branching tree is pure)
  const visibleStoryNodes = useMemo(() => {
    return nodes.filter((n) => {
      const layout = CLEAN_NODE_LAYOUT[n.id];
      if (!showSupplements && layout?.isSupplement) {
        return false;
      }
      if (selectedTrack !== "all" && n.branchTrack !== selectedTrack) {
        return false;
      }
      return true;
    });
  }, [nodes, showSupplements, selectedTrack]);

  // Combine canonical edges with visual continuity edges for the branching graph
  const allGraphEdges = useMemo(() => {
    const existingSet = new Set(
      edges.map((e) => `${e.sourceNodeId}->${e.targetNodeId}`)
    );
    const extras: FutureEdge[] = VISUAL_CONTINUITY_EDGES.filter(
      (ve) => !existingSet.has(`${ve.sourceNodeId}->${ve.targetNodeId}`)
    ).map((ve, idx) => ({
      id: ve.id,
      scenarioId: scenario.id,
      sourceNodeId: ve.sourceNodeId,
      targetNodeId: ve.targetNodeId,
      relationType: "narrative_sequence",
      conditionLabel: "",
      parentOutcome: "YES",
      isModeled: true,
      defaultConditionalProb: 0.75,
      assumptionNote: "Chronological branch continuation",
      sortOrder: 100 + idx,
    }));
    return [...edges, ...extras];
  }, [edges, scenario.id]);

  // Compute active causal branch path when a node is hovered or selected
  const activeFocusNodeId = hoveredNodeId || selectedNodeId;
  const highlightedConnectedIds = useMemo(() => {
    if (!activeFocusNodeId) return null;
    const connected = new Set<string>([activeFocusNodeId]);

    // Traverse upstream ancestors
    const upQueue = [activeFocusNodeId];
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      for (const e of allGraphEdges) {
        if (e.targetNodeId === curr && !connected.has(e.sourceNodeId)) {
          connected.add(e.sourceNodeId);
          upQueue.push(e.sourceNodeId);
        }
      }
    }

    // Traverse downstream descendants
    const downQueue = [activeFocusNodeId];
    while (downQueue.length > 0) {
      const curr = downQueue.shift()!;
      for (const e of allGraphEdges) {
        if (e.sourceNodeId === curr && !connected.has(e.targetNodeId)) {
          connected.add(e.targetNodeId);
          downQueue.push(e.targetNodeId);
        }
      }
    }

    return connected;
  }, [activeFocusNodeId, allGraphEdges]);

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

  const raceProbPct = Math.round(
    (propagation.results["node-race-1-continue-agent-4"]
      ?.conditionalProbability ?? 0.52) * 100
  );
  const slowdownProbPct = Math.round(
    (propagation.results["node-slowdown-1-freeze-agent-4-safer-1"]
      ?.conditionalProbability ?? 0.36) * 100
  );
  const hybridProbPct = Math.max(0, 100 - raceProbPct - slowdownProbPct);

  const chinaTheftProbPct = Math.round(
    (propagation.results["node-feb-2027-china-steals-agent-2"]
      ?.marginalProbability ?? 0.46) * 100
  );
  const agent3ProbPct = Math.round(
    (propagation.results["node-mar-2027-algorithmic-breakthroughs"]
      ?.marginalProbability ?? 0.48) * 100
  );
  const taiProbPct = Math.round(
    (propagation.results["node-bench-tai-by-2030"]?.marginalProbability ?? 0.4) *
      100
  );

  // Build ReactFlow nodes (Story pills + Branch Name Banner headers)
  const rfNodes: Node[] = useMemo(() => {
    const visibleIds = new Set(visibleStoryNodes.map((n) => n.id));
    const pillNodes: Node<CustomGraphNodeData>[] = visibleStoryNodes.map((n) => {
      const layout = CLEAN_NODE_LAYOUT[n.id] || {
        shortTitle: n.title,
        x: n.positionX,
        y: n.positionY,
      };
      const isDimmed =
        highlightedConnectedIds !== null && !highlightedConnectedIds.has(n.id);

      return {
        id: n.id,
        type: "futureBranchPill",
        position: { x: layout.x, y: layout.y },
        data: {
          node: n,
          shortTitle: layout.shortTitle,
          probResult: propagation.results[n.id] || null,
          selected: n.id === selectedNodeId,
          dimmed: isDimmed,
          isHub: n.id === "node-oct-2027-government-oversight-fork",
          onSelect: (id: string) =>
            setSelectedNodeId((prev) => (prev === id ? null : id)),
          onHover: (id: string | null) => setHoveredNodeId(id),
        },
      };
    });

    // Branch Name Headers placed directly on the branching graph
    const banners: Node<BranchBannerNodeData>[] = [];
    if (selectedTrack === "all" || selectedTrack === "spine") {
      banners.push(
        {
          id: "banner-shared-spine",
          type: "branchBanner",
          position: { x: 20, y: 235 },
          draggable: false,
          selectable: false,
          data: {
            label: "1. Shared Origin Spine (2025–2026)",
            sublabel: "Autonomous Coding Agents → 10²⁷ FLOP Clusters → 1.5× R&D",
            probPct: 92,
            color: "amber",
          },
        },
        {
          id: "banner-geopolitics-branch",
          type: "branchBanner",
          position: { x: 720, y: 45 },
          draggable: false,
          selectable: false,
          data: {
            label: "Geopolitical & Weight Theft Branch",
            sublabel: "China CDZ → Agent-2 Weight Theft → DoD → White House Crisis",
            probPct: chinaTheftProbPct,
            color: "sky",
          },
        },
        {
          id: "banner-capability-branch",
          type: "branchBanner",
          position: { x: 720, y: 235 },
          draggable: false,
          selectable: false,
          data: {
            label: "Recursive R&D & Misalignment Spine",
            sublabel: "Agent-2 Online RL → Agent-3 Superhuman Coder → Agent-4 Sandbagging",
            probPct: agent3ProbPct,
            color: "amber",
          },
        }
      );
    }

    if (
      (selectedTrack === "all" || selectedTrack === "race") &&
      visibleIds.has("node-race-1-continue-agent-4")
    ) {
      banners.push({
        id: "banner-race-branch",
        type: "branchBanner",
        position: { x: 2220, y: 18 },
        draggable: false,
        selectable: false,
        data: {
          label: "Race Ending Branch (ai-2027.com/race)",
          sublabel:
            "Continue Agent-4 → SEZ Robot Boom → Consensus-1 Fake Treaty → Extinction",
          probPct: raceProbPct,
          color: "rose",
        },
      });
    }

    if (
      (selectedTrack === "all" || selectedTrack === "spine") &&
      visibleIds.has("node-oversight-other-hybrid")
    ) {
      banners.push({
        id: "banner-hybrid-branch",
        type: "branchBanner",
        position: { x: 2220, y: 245 },
        draggable: false,
        selectable: false,
        data: {
          label: "Hybrid / Other Branch",
          sublabel: "Partial Pause or Multi-Lab Fragmentation",
          probPct: hybridProbPct,
          color: "slate",
        },
      });
    }

    if (
      (selectedTrack === "all" || selectedTrack === "slowdown") &&
      visibleIds.has("node-slowdown-1-freeze-agent-4-safer-1")
    ) {
      banners.push({
        id: "banner-slowdown-branch",
        type: "branchBanner",
        position: { x: 2220, y: 448 },
        draggable: false,
        selectable: false,
        data: {
          label: "Slowdown Ending Branch (ai-2027.com/slowdown)",
          sublabel:
            "Freeze Agent-4 & Safer-1 → Safer-4 Alignment → FlexHEG Treaty → Abundance",
          probPct: slowdownProbPct,
          color: "emerald",
        },
      });
    }

    return [...banners, ...pillNodes];
  }, [
    visibleStoryNodes,
    highlightedConnectedIds,
    propagation.results,
    selectedNodeId,
    selectedTrack,
    chinaTheftProbPct,
    agent3ProbPct,
    raceProbPct,
    hybridProbPct,
    slowdownProbPct,
  ]);

  // Build ReactFlow edges where stroke thickness (strokeWidth) is directly proportional to probability!
  const rfEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(visibleStoryNodes.map((n) => n.id));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    return allGraphEdges
      .filter(
        (e) => visibleIds.has(e.sourceNodeId) && visibleIds.has(e.targetNodeId)
      )
      .map((e) => {
        const targetNode = nodeMap.get(e.targetNodeId);
        const targetRes = propagation.results[e.targetNodeId];

        // Compute the probability weight governing this branch segment
        const isForkSplit =
          e.sourceNodeId === "node-oct-2027-government-oversight-fork";
        const branchProb = isForkSplit
          ? targetRes?.conditionalProbability ??
            e.defaultConditionalProb ??
            0.33
          : targetRes?.marginalProbability ??
            targetNode?.question?.demoHypothesisProb ??
            e.defaultConditionalProb ??
            0.5;

        // Thickness (weight) of each branch is directly proportional to its probability (3px to 22px)
        const strokeWidth = Math.max(2.5, Number((branchProb * 22).toFixed(1)));
        const probPct = Math.round(branchProb * 100);

        const isHighlighted =
          highlightedConnectedIds === null ||
          (highlightedConnectedIds.has(e.sourceNodeId) &&
            highlightedConnectedIds.has(e.targetNodeId));

        const strokeColor =
          targetNode?.branchTrack === "race"
            ? "#f43f5e" // crimson rose for Race branch
            : targetNode?.branchTrack === "slowdown"
            ? "#10b981" // emerald for Slowdown branch
            : e.targetNodeId === "node-oversight-other-hybrid"
            ? "#94a3b8" // slate for Hybrid residual branch
            : [
                "node-mid-2026-china-wakes-up",
                "node-feb-2027-china-steals-agent-2",
                "node-may-2027-national-security",
                "node-aug-2027-geopolitics-superintelligence",
              ].includes(e.targetNodeId)
            ? "#38bdf8" // sky blue for Geopolitical & Weight Theft branch
            : "#f59e0b"; // amber gold for Shared R&D Spine

        // Clean label on the branch: show branch name + % at the major fork, and concise % along branches
        const cleanLabel = isForkSplit
          ? e.targetNodeId === "node-race-1-continue-agent-4"
            ? `Race • ${probPct}%`
            : e.targetNodeId === "node-slowdown-1-freeze-agent-4-safer-1"
            ? `Slowdown • ${probPct}%`
            : `Hybrid • ${probPct}%`
          : `${probPct}%`;

        return {
          id: e.id,
          source: e.sourceNodeId,
          target: e.targetNodeId,
          label: cleanLabel,
          animated: isForkSplit,
          style: {
            stroke: strokeColor,
            strokeWidth,
            opacity: isHighlighted ? 0.92 : 0.16,
            transition: "stroke-width 200ms ease, opacity 150ms ease",
          },
          labelStyle: {
            fill: isHighlighted ? "#f8fafc" : "#64748b",
            fontSize: isForkSplit ? 11 : 10,
            fontWeight: 700,
            fontFamily: "monospace",
          },
          labelBgStyle: {
            fill: "#090d16",
            fillOpacity: isHighlighted ? 0.88 : 0.4,
          },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
        };
      });
  }, [
    allGraphEdges,
    visibleStoryNodes,
    nodes,
    propagation.results,
    highlightedConnectedIds,
  ]);

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
        title: `Custom AI 2027 Branch Fork (${new Date()
          .toISOString()
          .slice(11, 16)})`,
        rationale:
          "Saved from the interactive Branching Probability Graph with custom overrides.",
        ownerHandle: "elena_vance",
        nodeProbabilityOverrides: overrides,
      }),
    });
    const data = await res.json();
    if (res.ok && data.fork) {
      setForkSavedMessage(`/scenarios/ai-2027/forks/${data.fork.id}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-[#090d16] overflow-hidden">
      {/* Slim, Uncluttered Top Bar */}
      <div className="shrink-0 border-b border-slate-800/80 bg-slate-950/95 px-4 py-2">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-2">
          {/* Left: Scenario Title & Visual Branch Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-amber-400" />
              <h1 className="text-sm sm:text-base font-bold text-white">
                AI 2027 Branching Probability Graph
              </h1>
            </div>

            {/* Interactive Branch Track Filter Pills */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTrack("all")}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  selectedTrack === "all"
                    ? "bg-slate-200 text-slate-950 font-semibold"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                All Branches
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedTrack(selectedTrack === "spine" ? "all" : "spine")
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium transition-colors border ${
                  selectedTrack === "spine"
                    ? "border-amber-400 bg-amber-500/20 text-amber-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Spine (2025–2027)
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedTrack(selectedTrack === "race" ? "all" : "race")
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium transition-colors border ${
                  selectedTrack === "race"
                    ? "border-rose-400 bg-rose-500/25 text-rose-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Race Branch ({raceProbPct}%)
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedTrack(
                    selectedTrack === "slowdown" ? "all" : "slowdown"
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium transition-colors border ${
                  selectedTrack === "slowdown"
                    ? "border-emerald-400 bg-emerald-500/25 text-emerald-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Slowdown Branch ({slowdownProbPct}%)
              </button>
            </div>
          </div>

          {/* Right: Compact Controls (Lens, Sliders Toggle, Supplements Toggle, View Mode) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lens Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1">
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400">Lens:</span>
              <select
                aria-label="Select Forecast Lens"
                value={selectedLens}
                onChange={(e) =>
                  setSelectedLens(e.target.value as ForecastLens)
                }
                className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none"
              >
                <option value="demo_hypothesis" className="bg-slate-900">
                  Baseline Priors
                </option>
                <option value="community" className="bg-slate-900">
                  Human Community
                </option>
                <option value="ai_gemini" className="bg-slate-900">
                  Gemini Agent
                </option>
                <option value="ai_claude" className="bg-slate-900">
                  Claude Agent
                </option>
                <option value="ai_gpt" className="bg-slate-900">
                  GPT Agent
                </option>
                <option value="my_forecasts" className="bg-slate-900">
                  My Forecasts
                </option>
              </select>
            </div>

            {/* Toggle Quick Sliders */}
            <button
              type="button"
              onClick={() => setShowSimulatorBar((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                showSimulatorBar || Object.keys(overrides).length > 0
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>
                Adjust Branch Weights
                {Object.keys(overrides).length > 0
                  ? ` (${Object.keys(overrides).length})`
                  : ""}
              </span>
            </button>

            {/* Toggle Supplement Sub-Branches */}
            <button
              type="button"
              onClick={() => setShowSupplements((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                showSupplements
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{showSupplements ? "Hide Supplements" : "+ Supplements"}</span>
            </button>

            {/* Graph vs Swimlane Switcher */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("graph")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  viewMode === "graph"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Network className="h-3 w-3" />
                <span>Branch Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("swimlane")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  viewMode === "swimlane"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Branch Weight Simulator Drawer (Hidden by default to avoid overwhelming user) */}
        {showSimulatorBar && (
          <div className="mx-auto mt-2 max-w-[1800px] rounded-xl border border-amber-500/30 bg-slate-900/95 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-300">
                Drag sliders to test counterfactuals — branch thickness updates in real time:
              </span>
              <div className="flex items-center gap-2">
                {Object.keys(overrides).length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveFork}
                      className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400"
                    >
                      Save as Scenario Fork
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOverrides({});
                        setForkSavedMessage(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowSimulatorBar(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {forkSavedMessage && (
              <div className="mb-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 flex items-center justify-between">
                <span>Saved your custom branch weights as a Scenario Fork!</span>
                <Link
                  href={forkSavedMessage}
                  className="font-bold underline text-amber-300"
                >
                  View Fork →
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    Mar 2027: Agent-3 Superhuman Coder
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {agent3ProbPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={agent3ProbPct}
                  onChange={(e) =>
                    handleSetOverride(
                      "node-mar-2027-algorithmic-breakthroughs",
                      Number((Number(e.target.value) / 100).toFixed(2))
                    )
                  }
                  className="w-full"
                />
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    Oct 2027 Fork: Race vs Slowdown Weight
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    Race {raceProbPct}% / Slowdown {slowdownProbPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={88}
                  value={raceProbPct}
                  onChange={(e) =>
                    handleSetOverride(
                      "node-race-1-continue-agent-4",
                      Number((Number(e.target.value) / 100).toFixed(2))
                    )
                  }
                  className="w-full"
                />
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    Feb 2027: China Steals Agent-2 Weights
                  </span>
                  <span className="font-mono font-bold text-sky-400">
                    {chinaTheftProbPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={chinaTheftProbPct}
                  onChange={(e) =>
                    handleSetOverride(
                      "node-feb-2027-china-steals-agent-2",
                      Number((Number(e.target.value) / 100).toFixed(2))
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace: Full-Screen Branching Probability Graph + On-Demand Node Detail Drawer */}
      <div className="relative flex flex-1 overflow-hidden">
        {viewMode === "graph" ? (
          <div className="relative flex-1 h-full w-full bg-[#090d16]">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              fitViewOptions={{ padding: 0.08, minZoom: 0.35, maxZoom: 1.1 }}
              minZoom={0.25}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1e293b" gap={28} size={1} />
              <Controls
                showInteractive={false}
                className="!bg-slate-900/90 !border-slate-700 !text-white !shadow-xl"
              />
            </ReactFlow>

            {/* Subtle Floating Helper Pill (Bottom Left) */}
            <div className="pointer-events-none absolute bottom-4 left-14 z-10 hidden sm:flex items-center gap-3 rounded-full border border-slate-800/90 bg-slate-950/85 px-4 py-1.5 text-xs text-slate-300 backdrop-blur-md shadow-lg">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <strong>Branch thickness = Probability weight.</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span>
                {selectedNode
                  ? "Click canvas or press Esc to close details"
                  : "Click any node to inspect details, evidence & sliders"}
              </span>
            </div>
          </div>
        ) : (
          /* Secondary Compact List View (Only when explicitly toggled) */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              {(
                [
                  {
                    track: "spine",
                    title: "Shared Spine (Mid 2025 – Oct 2027 Fork)",
                    accent: "border-amber-500/40",
                  },
                  {
                    track: "race",
                    title: `Race Branch (${raceProbPct}% Weight — Nov 2027 to 2030)`,
                    accent: "border-rose-500/40",
                  },
                  {
                    track: "slowdown",
                    title: `Slowdown Branch (${slowdownProbPct}% Weight — Nov 2027 to 2030)`,
                    accent: "border-emerald-500/40",
                  },
                ] as const
              ).map((lane) => {
                const laneNodes = visibleStoryNodes.filter(
                  (n) => n.branchTrack === lane.track
                );
                if (laneNodes.length === 0) return null;
                return (
                  <section
                    key={lane.track}
                    className={`rounded-2xl border ${lane.accent} bg-slate-900/40 p-4 space-y-3`}
                  >
                    <h2 className="text-sm font-bold text-white">{lane.title}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {laneNodes.map((n) => {
                        const p =
                          propagation.results[n.id]?.marginalProbability ??
                          n.question?.demoHypothesisProb ??
                          0.5;
                        const shortName =
                          CLEAN_NODE_LAYOUT[n.id]?.shortTitle || n.title;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setSelectedNodeId(n.id)}
                            className={`text-left rounded-xl border p-3 transition-all ${
                              selectedNodeId === n.id
                                ? "border-amber-400 bg-slate-900"
                                : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-400">{n.dateLabel}</span>
                              <span className="font-bold text-amber-400">
                                {Math.round(p * 100)}%
                              </span>
                            </div>
                            <div className="mt-1 text-xs font-bold text-white">
                              {shortName}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* Slide-Over Node Detail & Audit Drawer — ONLY rendered when the user clicks a node! */}
        {selectedNode && (
          <div className="fixed inset-y-0 right-0 z-30 w-full max-w-[520px] border-l border-slate-800 bg-slate-950 shadow-2xl lg:static lg:h-full lg:shrink-0">
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
