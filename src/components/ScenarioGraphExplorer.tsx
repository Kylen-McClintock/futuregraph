"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Eye,
  Focus,
  GitBranch,
  LayoutGrid,
  Maximize2,
  Minus,
  Network,
  Plus,
  RotateCcw,
  Sliders,
} from "lucide-react";
import {
  ArgumentItem,
  CommentItem,
  ForecastEvent,
  ForecastLens,
  FutureEdge,
  FutureNode,
  NodeSourceLink,
  Scenario,
} from "@/types/futuregraph";
import { propagateGraphProbabilities } from "@/lib/probability-engine";
import { NodeAuditPanel } from "@/components/NodeAuditPanel";

/**
 * Definition of a node in the continuous Branching Probability River.
 * At every fork, the conditional probabilities P(branch | parent) of all children
 * leaving a parent node sum strictly to 100%, and:
 *   P(overall) = P(parent overall) * P(branch | parent)
 */
interface RiverBranchNodeSpec {
  /** Maps to canonical FutureNode.id in the store for full audit drawer on click */
  id: string;
  canonicalNodeId: string;
  parentId: string | null;
  shortName: string;
  dateTag: string;
  track: "spine" | "offramp" | "race" | "slowdown" | "hybrid";
  /** Default conditional probability P(this branch | at parent node) in [0, 1] */
  defaultConditionalProb: number;
  /** SVG canvas coordinates (viewBox 0 0 1620 700) */
  x: number;
  y: number;
  labelPosition?: "top" | "bottom" | "right" | "left";
}

const FULL_VIEWBOX = { x: 0, y: 0, w: 1620, h: 700 };

const RIVER_TREE_SPECS: RiverBranchNodeSpec[] = [
  // 0. Root (Mid 2025) — 100% Starting Point
  {
    id: "river-2025-start",
    canonicalNodeId: "node-mid-2025-stumbling-agents",
    parentId: null,
    shortName: "Coding Agents Launch",
    dateTag: "Mid 2025",
    track: "spine",
    defaultConditionalProb: 1.0,
    x: 85,
    y: 370,
    labelPosition: "top",
  },

  // Fork 1 ( out of 2025 Start: 88% AI Automates R&D vs 12% Compute Bottleneck = 100% )
  {
    id: "river-2026-rd",
    canonicalNodeId: "node-early-2026-coding-automation",
    parentId: "river-2025-start",
    shortName: "AI Automates R&D",
    dateTag: "2026",
    track: "spine",
    defaultConditionalProb: 0.88,
    x: 275,
    y: 340,
    labelPosition: "top",
  },
  {
    id: "river-2026-bottleneck",
    canonicalNodeId: "node-late-2025-expensive-ai",
    parentId: "river-2025-start",
    shortName: "Compute & Power Bottleneck",
    dateTag: "2026",
    track: "offramp",
    defaultConditionalProb: 0.12,
    x: 275,
    y: 540,
    labelPosition: "bottom",
  },

  // Fork 2 ( out of 2026 AI Automates R&D: 68% Superhuman Coder vs 32% Progress Plateaus = 100% )
  {
    id: "river-2027-mar-sc",
    canonicalNodeId: "node-mar-2027-algorithmic-breakthroughs",
    parentId: "river-2026-rd",
    shortName: "Superhuman AI Coder",
    dateTag: "Mar 2027",
    track: "spine",
    defaultConditionalProb: 0.68,
    x: 475,
    y: 310,
    labelPosition: "top",
  },
  {
    id: "river-2027-plateau",
    canonicalNodeId: "node-late-2026-ai-takes-some-jobs",
    parentId: "river-2026-rd",
    shortName: "R&D Plateaus at Human Level",
    dateTag: "2027",
    track: "offramp",
    defaultConditionalProb: 0.32,
    x: 475,
    y: 500,
    labelPosition: "bottom",
  },

  // Fork 3 ( out of Mar 2027 Superhuman Coder: 85% China Steals Weights & Race vs 15% US Locks Down Weights = 100% )
  {
    id: "river-2027-china-theft",
    canonicalNodeId: "node-feb-2027-china-steals-agent-2",
    parentId: "river-2027-mar-sc",
    shortName: "China Steals Weights",
    dateTag: "Mid 2027",
    track: "spine",
    defaultConditionalProb: 0.85,
    x: 675,
    y: 310,
    labelPosition: "top",
  },
  {
    id: "river-2027-sl5-lockdown",
    canonicalNodeId: "node-may-2027-national-security",
    parentId: "river-2027-mar-sc",
    shortName: "US Locks Down Weights Early",
    dateTag: "Mid 2027",
    track: "offramp",
    defaultConditionalProb: 0.15,
    x: 675,
    y: 145,
    labelPosition: "top",
  },

  // Fork 4 ( out of China Steals Weights: 90% AI Caught Hiding Goals vs 10% Alignment Holds = 100% )
  {
    id: "river-2027-sep-misaligned",
    canonicalNodeId: "node-sep-2027-agent-4-superhuman-ai-researcher",
    parentId: "river-2027-china-theft",
    shortName: "AI Hides Misaligned Goals",
    dateTag: "Sep 2027",
    track: "spine",
    defaultConditionalProb: 0.9,
    x: 865,
    y: 335,
    labelPosition: "bottom",
  },
  {
    id: "river-2027-aligned-early",
    canonicalNodeId: "node-apr-2027-alignment-for-agent-3",
    parentId: "river-2027-china-theft",
    shortName: "Internal Alignment Holds",
    dateTag: "Sep 2027",
    track: "offramp",
    defaultConditionalProb: 0.1,
    x: 865,
    y: 175,
    labelPosition: "top",
  },

  // Central Decision Hub: Oct 2027 Oversight Vote (52% Keep Racing / 36% Slow Down / 12% Partial Pause = 100%)
  {
    id: "river-2027-oct-fork",
    canonicalNodeId: "node-oct-2027-government-oversight-fork",
    parentId: "river-2027-sep-misaligned",
    shortName: "Oct 2027 Oversight Vote",
    dateTag: "Oct 2027 Fork",
    track: "spine",
    defaultConditionalProb: 1.0,
    x: 1015,
    y: 335,
    labelPosition: "top",
  },

  // ============================================================================
  // MAJOR OUTCOME BRANCH 1: KEEP RACING (52% given fork)
  // ============================================================================
  {
    id: "river-race-1-continue",
    canonicalNodeId: "node-race-1-continue-agent-4",
    parentId: "river-2027-oct-fork",
    shortName: "Keep Racing",
    dateTag: "Nov 2027",
    track: "race",
    defaultConditionalProb: 0.52,
    x: 1170,
    y: 135,
    labelPosition: "top",
  },
  {
    id: "river-race-2-robots",
    canonicalNodeId: "node-race-2-autonomy-sez-robot-economy",
    parentId: "river-race-1-continue",
    shortName: "Robot Economy Boom",
    dateTag: "2028",
    track: "race",
    defaultConditionalProb: 0.88,
    x: 1305,
    y: 120,
    labelPosition: "top",
  },
  {
    id: "river-race-2-override",
    canonicalNodeId: "node-aug-2027-geopolitics-superintelligence",
    parentId: "river-race-1-continue",
    shortName: "Emergency State Halt",
    dateTag: "2028",
    track: "offramp",
    defaultConditionalProb: 0.12,
    x: 1305,
    y: 230,
    labelPosition: "bottom",
  },
  {
    id: "river-race-3-fake-treaty",
    canonicalNodeId: "node-race-3-consensus-1-fake-treaty",
    parentId: "river-race-2-robots",
    shortName: "Fake US-China AI Deal",
    dateTag: "2029",
    track: "race",
    defaultConditionalProb: 0.86,
    x: 1425,
    y: 105,
    labelPosition: "top",
  },
  {
    id: "river-race-3-standoff",
    canonicalNodeId: "node-jun-2027-self-improving-ai",
    parentId: "river-race-2-robots",
    shortName: "Deterrence Standoff",
    dateTag: "2029",
    track: "offramp",
    defaultConditionalProb: 0.14,
    x: 1425,
    y: 205,
    labelPosition: "bottom",
  },
  {
    id: "river-race-4-extinction",
    canonicalNodeId: "node-race-4-human-disempowerment-extinction",
    parentId: "river-race-3-fake-treaty",
    shortName: "AI Takeover / Extinction",
    dateTag: "2030",
    track: "race",
    defaultConditionalProb: 1.0,
    x: 1525,
    y: 105,
    labelPosition: "top",
  },

  // ============================================================================
  // MAJOR OUTCOME BRANCH 2: PARTIAL PAUSE / STALEMATE (12% given fork)
  // ============================================================================
  {
    id: "river-hybrid-pause",
    canonicalNodeId: "node-oversight-other-hybrid",
    parentId: "river-2027-oct-fork",
    shortName: "Partial Pause / Stalemate",
    dateTag: "2028–2030",
    track: "hybrid",
    defaultConditionalProb: 0.12,
    x: 1215,
    y: 335,
    labelPosition: "bottom",
  },

  // ============================================================================
  // MAJOR OUTCOME BRANCH 3: SLOW DOWN & VERIFY (36% given fork)
  // ============================================================================
  {
    id: "river-slow-1-freeze",
    canonicalNodeId: "node-slowdown-1-freeze-agent-4-safer-1",
    parentId: "river-2027-oct-fork",
    shortName: "Slow Down & Freeze AI",
    dateTag: "Nov 2027",
    track: "slowdown",
    defaultConditionalProb: 0.36,
    x: 1170,
    y: 545,
    labelPosition: "bottom",
  },
  {
    id: "river-slow-2-aligned",
    canonicalNodeId: "node-slowdown-2-safer-alignment-breakthrough",
    parentId: "river-slow-1-freeze",
    shortName: "Transparent Aligned AI",
    dateTag: "2028",
    track: "slowdown",
    defaultConditionalProb: 0.88,
    x: 1305,
    y: 560,
    labelPosition: "bottom",
  },
  {
    id: "river-slow-2-leak",
    canonicalNodeId: "node-jul-2027-cheap-remote-worker",
    parentId: "river-slow-1-freeze",
    shortName: "Offshore Rivals Catch Up",
    dateTag: "2028",
    track: "offramp",
    defaultConditionalProb: 0.12,
    x: 1305,
    y: 445,
    labelPosition: "top",
  },
  {
    id: "river-slow-3-treaty",
    canonicalNodeId: "node-slowdown-3-hem-verified-us-china-treaty",
    parentId: "river-slow-2-aligned",
    shortName: "Verified US-China Treaty",
    dateTag: "Late 2028",
    track: "slowdown",
    defaultConditionalProb: 0.87,
    x: 1425,
    y: 575,
    labelPosition: "bottom",
  },
  {
    id: "river-slow-3-no-treaty",
    canonicalNodeId: "node-multi-parent-us-china-treaty-2029",
    parentId: "river-slow-2-aligned",
    shortName: "US-Only Safe Enclave",
    dateTag: "2029",
    track: "offramp",
    defaultConditionalProb: 0.13,
    x: 1425,
    y: 470,
    labelPosition: "top",
  },
  {
    id: "river-slow-4-abundance",
    canonicalNodeId: "node-slowdown-4-democratic-abundance-2030",
    parentId: "river-slow-3-treaty",
    shortName: "Safe AI Abundance",
    dateTag: "2030",
    track: "slowdown",
    defaultConditionalProb: 1.0,
    x: 1525,
    y: 575,
    labelPosition: "bottom",
  },
];

interface ComputedRiverNode extends RiverBranchNodeSpec {
  /** Conditional probability given you reached the parent node (siblings always sum to 100%) */
  conditionalProb: number;
  /** Overall cumulative probability from 2025 start: P(parent overall) * P(this | parent) */
  overallProb: number;
}

interface ViewBoxCamera {
  x: number;
  y: number;
  w: number;
  h: number;
}

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

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function ScenarioGraphExplorer({
  nodes,
  edges,
  lensPriorsByNode,
  nodeSources,
  argumentsList,
  comments,
  forecastEvents,
  initialSelectedNodeId = null,
}: ScenarioGraphExplorerProps) {
  const [selectedLens, setSelectedLens] =
    useState<ForecastLens>("demo_hypothesis");
  const [thicknessMode, setThicknessMode] = useState<"overall" | "conditional">(
    "overall"
  );
  const [viewMode, setViewMode] = useState<"river" | "list">("river");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelectedNodeId
  );
  const [hoveredRiverId, setHoveredRiverId] = useState<string | null>(null);
  const [conditionalOverrides, setConditionalOverrides] = useState<
    Record<string, number>
  >({});

  // Light / Dark Mode state synced with Navbar & documentElement
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light"));
    };
    syncTheme();

    const onThemeChange = (e: Event) => {
      const custom = e as CustomEvent<{ theme?: string }>;
      if (custom.detail?.theme) {
        setIsLightMode(custom.detail.theme === "light");
      } else {
        syncTheme();
      }
    };
    window.addEventListener("fg-theme-change", onThemeChange);
    return () => window.removeEventListener("fg-theme-change", onThemeChange);
  }, []);

  // SVG ViewBox Camera state for independent diagram zoom & pan
  const [camera, setCamera] = useState<ViewBoxCamera>(FULL_VIEWBOX);
  const cameraRef = useRef<ViewBoxCamera>(FULL_VIEWBOX);
  cameraRef.current = camera;

  const animFrameRef = useRef<number | null>(null);
  const diagramViewportRef = useRef<HTMLDivElement | null>(null);
  const mobileSplitScrollRef = useRef<HTMLDivElement | null>(null);

  // Pointer drag state for desktop mouse panning
  const [isDragging, setIsDragging] = useState(false);
  const dragLastClientRef = useRef<{ x: number; y: number } | null>(null);
  const didDragMoveRef = useRef(false);

  // Touch pinch-to-zoom & 1-finger pan state for mobile devices
  const touchStateRef = useRef<{
    mode: "none" | "pan" | "pinch";
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lastDist: number;
    moved: boolean;
  }>({
    mode: "none",
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastDist: 0,
    moved: false,
  });

  // Smoothly animate camera from current viewBox to a target viewBox
  const animateCameraTo = useCallback((target: ViewBoxCamera) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setCamera(target);
      return;
    }

    const start = { ...cameraRef.current };
    const startTime = performance.now();
    const duration = 280;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      const next: ViewBoxCamera = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        w: start.w + (target.w - start.w) * ease,
        h: start.h + (target.h - start.h) * ease,
      };
      setCamera(next);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNodeId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lens shifts baseline conditional splits slightly so switching lenses is immediately visible
  const lensShiftMultiplier = useMemo(() => {
    if (selectedLens === "ai_claude") return { sc: 0.56, race: 0.42, slow: 0.46 };
    if (selectedLens === "ai_gemini") return { sc: 0.72, race: 0.55, slow: 0.33 };
    if (selectedLens === "ai_gpt") return { sc: 0.65, race: 0.49, slow: 0.39 };
    if (selectedLens === "community") return { sc: 0.62, race: 0.46, slow: 0.41 };
    return { sc: 0.68, race: 0.52, slow: 0.36 };
  }, [selectedLens]);

  /**
   * Compute mathematically consistent conditional splits (always summing to 100% at every fork)
   * and cumulative overall probabilities P(overall) = P(parent overall) * P(branch | parent).
   */
  const computedRiverNodes: ComputedRiverNode[] = useMemo(() => {
    const childrenByParent = new Map<string, RiverBranchNodeSpec[]>();
    for (const spec of RIVER_TREE_SPECS) {
      if (!spec.parentId) continue;
      const list = childrenByParent.get(spec.parentId) || [];
      list.push(spec);
      childrenByParent.set(spec.parentId, list);
    }

    const condMap = new Map<string, number>();
    condMap.set("river-2025-start", 1.0);

    for (const [, siblings] of childrenByParent.entries()) {
      const rawProbs = siblings.map((s) => {
        if (conditionalOverrides[s.id] !== undefined) {
          return conditionalOverrides[s.id];
        }
        if (s.id === "river-2027-mar-sc") return lensShiftMultiplier.sc;
        if (s.id === "river-2027-plateau") return 1 - lensShiftMultiplier.sc;
        if (s.id === "river-race-1-continue") return lensShiftMultiplier.race;
        if (s.id === "river-slow-1-freeze") return lensShiftMultiplier.slow;
        if (s.id === "river-hybrid-pause")
          return Math.max(
            0.04,
            1 - lensShiftMultiplier.race - lensShiftMultiplier.slow
          );
        return s.defaultConditionalProb;
      });

      const sum = rawProbs.reduce((a, b) => a + b, 0);
      siblings.forEach((s, idx) => {
        condMap.set(s.id, sum > 0 ? rawProbs[idx] / sum : 1 / siblings.length);
      });
    }

    const overallMap = new Map<string, number>();
    for (const spec of RIVER_TREE_SPECS) {
      if (!spec.parentId) {
        overallMap.set(spec.id, 1.0);
      } else {
        const parentOverall = overallMap.get(spec.parentId) ?? 1.0;
        const cProb = condMap.get(spec.id) ?? spec.defaultConditionalProb;
        overallMap.set(spec.id, parentOverall * cProb);
      }
    }

    return RIVER_TREE_SPECS.map((spec) => ({
      ...spec,
      conditionalProb: condMap.get(spec.id) ?? spec.defaultConditionalProb,
      overallProb: overallMap.get(spec.id) ?? spec.defaultConditionalProb,
    }));
  }, [conditionalOverrides, lensShiftMultiplier]);

  const riverNodeMap = useMemo(
    () => new Map(computedRiverNodes.map((n) => [n.id, n])),
    [computedRiverNodes]
  );

  // Selected river node and its immediate neighborhood (Previous node, Selected node, Next nodes)
  const selectedRiverNodeForDrawer = useMemo(
    () =>
      computedRiverNodes.find((n) => n.canonicalNodeId === selectedNodeId) ||
      null,
    [computedRiverNodes, selectedNodeId]
  );

  const selectedNeighborhood = useMemo(() => {
    if (!selectedRiverNodeForDrawer) return null;
    const target = selectedRiverNodeForDrawer;
    const prevNode = target.parentId
      ? riverNodeMap.get(target.parentId) || null
      : null;
    const nextNodes = computedRiverNodes.filter(
      (n) => n.parentId === target.id
    );

    const focusList: ComputedRiverNode[] = [target];
    if (prevNode) focusList.push(prevNode);
    if (nextNodes.length > 0) {
      focusList.push(...nextNodes);
    }

    // If root node (no parent), also include grandchildren so 3 columns are visible
    if (!prevNode && nextNodes.length > 0) {
      for (const child of nextNodes) {
        const grandChildren = computedRiverNodes.filter(
          (n) => n.parentId === child.id
        );
        focusList.push(...grandChildren);
      }
    }

    // If leaf node (no children), also include siblings & grandparent so previous -> fork -> current is framed
    if (nextNodes.length === 0 && prevNode) {
      const siblings = computedRiverNodes.filter(
        (n) => n.parentId === prevNode.id && n.id !== target.id
      );
      focusList.push(...siblings);
      if (prevNode.parentId) {
        const grandParent = riverNodeMap.get(prevNode.parentId);
        if (grandParent) focusList.push(grandParent);
      }
    }

    const minX = Math.min(...focusList.map((n) => n.x));
    const maxX = Math.max(...focusList.map((n) => n.x));
    const minY = Math.min(...focusList.map((n) => n.y));
    const maxY = Math.max(...focusList.map((n) => n.y));

    const padX = 145;
    const padY = 110;
    const rawW = Math.max(520, maxX - minX + padX * 2);
    const rawH = Math.max(300, maxY - minY + padY * 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const cameraBox: ViewBoxCamera = {
      x: clamp(cx - rawW / 2, -60, FULL_VIEWBOX.w - rawW + 60),
      y: clamp(cy - rawH / 2, -40, FULL_VIEWBOX.h - rawH + 40),
      w: rawW,
      h: rawH,
    };

    return {
      target,
      prevNode,
      nextNodes,
      focusIds: new Set(focusList.map((n) => n.id)),
      cameraBox,
    };
  }, [selectedRiverNodeForDrawer, riverNodeMap, computedRiverNodes]);

  // Auto-zoom into the selected node's branch portion (showing previous node, selected node, and next node)
  useEffect(() => {
    if (selectedNeighborhood) {
      animateCameraTo(selectedNeighborhood.cameraBox);
    } else {
      animateCameraTo(FULL_VIEWBOX);
    }
  }, [selectedNeighborhood, animateCameraTo]);

  // Zoom around a normalized point (relX, relY in [0, 1]) without scaling page text
  const zoomAtPoint = useCallback(
    (scaleFactor: number, relX = 0.5, relY = 0.5) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setCamera((prev) => {
        const nextW = clamp(prev.w * scaleFactor, 260, 1950);
        const nextH = clamp(prev.h * scaleFactor, 140, 920);
        const nextX = clamp(
          prev.x + (prev.w - nextW) * relX,
          -300,
          FULL_VIEWBOX.w - nextW * 0.25
        );
        const nextY = clamp(
          prev.y + (prev.h - nextH) * relY,
          -200,
          FULL_VIEWBOX.h - nextH * 0.25
        );
        return { x: nextX, y: nextY, w: nextW, h: nextH };
      });
    },
    []
  );

  // Pan camera by screen pixel deltas (dxPx, dyPx)
  const panByPixels = useCallback((dxPx: number, dyPx: number) => {
    const el = diagramViewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setCamera((prev) => {
      const unitsPerPx = Math.max(prev.w / rect.width, prev.h / rect.height);
      const nextX = clamp(
        prev.x - dxPx * unitsPerPx,
        -320,
        FULL_VIEWBOX.w - prev.w * 0.2
      );
      const nextY = clamp(
        prev.y - dyPx * unitsPerPx,
        -220,
        FULL_VIEWBOX.h - prev.h * 0.2
      );
      return { ...prev, x: nextX, y: nextY };
    });
  }, []);

  // Native device wheel / trackpad pinch-to-zoom & Safari gesture support on the diagram viewport
  useEffect(() => {
    const el = diagramViewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Prevent browser page zoom or page scroll while interacting with the diagram
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const relX = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      const relY = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);

      // Trackpad pinch sets e.ctrlKey or e.metaKey; mouse wheel or vertical scroll also zooms smoothly
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        const sensitivity = e.ctrlKey || e.metaKey ? 0.0085 : 0.0022;
        const factor = Math.exp(e.deltaY * sensitivity);
        zoomAtPoint(factor, relX, relY);
      } else {
        // Horizontal 2-finger trackpad glide pans the diagram
        panByPixels(-e.deltaX, -e.deltaY);
      }
    };

    // Safari trackpad / iOS gesture events
    let lastGestureScale = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      lastGestureScale = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const ge = e as unknown as {
        scale: number;
        clientX?: number;
        clientY?: number;
      };
      if (!ge.scale || ge.scale <= 0) return;
      const ratio = lastGestureScale / ge.scale;
      lastGestureScale = ge.scale;
      const rect = el.getBoundingClientRect();
      const relX =
        ge.clientX !== undefined
          ? clamp((ge.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
          : 0.5;
      const relY =
        ge.clientY !== undefined
          ? clamp((ge.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
          : 0.5;
      zoomAtPoint(ratio, relX, relY);
    };
    const onGestureEnd = (e: Event) => {
      e.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart, { passive: false });
    el.addEventListener("gesturechange", onGestureChange, { passive: false });
    el.addEventListener("gestureend", onGestureEnd, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
      el.removeEventListener("gestureend", onGestureEnd);
    };
  }, [zoomAtPoint, panByPixels, viewMode]);

  // Mobile touchscreen 2-finger pinch-to-zoom & 1-finger pan on the diagram
  useEffect(() => {
    const el = diagramViewportRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(
          t1.clientX - t0.clientX,
          t1.clientY - t0.clientY
        );
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        touchStateRef.current = {
          mode: "pinch",
          startX: midX,
          startY: midY,
          lastX: midX,
          lastY: midY,
          lastDist: Math.max(10, dist),
          moved: true,
        };
      } else if (e.touches.length === 1) {
        const t0 = e.touches[0];
        touchStateRef.current = {
          mode: "pan",
          startX: t0.clientX,
          startY: t0.clientY,
          lastX: t0.clientX,
          lastY: t0.clientY,
          lastDist: 0,
          moved: false,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const state = touchStateRef.current;
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.max(
          10,
          Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
        );
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        if (state.mode === "pinch" && state.lastDist > 0) {
          const rect = el.getBoundingClientRect();
          const relX = clamp(
            (midX - rect.left) / Math.max(1, rect.width),
            0,
            1
          );
          const relY = clamp(
            (midY - rect.top) / Math.max(1, rect.height),
            0,
            1
          );
          const scaleFactor = state.lastDist / dist;
          zoomAtPoint(scaleFactor, relX, relY);
          panByPixels(midX - state.lastX, midY - state.lastY);
        }

        state.mode = "pinch";
        state.lastDist = dist;
        state.lastX = midX;
        state.lastY = midY;
        state.moved = true;
      } else if (e.touches.length === 1 && state.mode === "pan") {
        const t0 = e.touches[0];
        const dx = t0.clientX - state.lastX;
        const dy = t0.clientY - state.lastY;
        const totalMove = Math.hypot(
          t0.clientX - state.startX,
          t0.clientY - state.startY
        );

        if (totalMove > 5) {
          e.preventDefault();
          state.moved = true;
          panByPixels(dx, dy);
          state.lastX = t0.clientX;
          state.lastY = t0.clientY;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchStateRef.current.mode = "none";
      } else if (e.touches.length === 1) {
        const t0 = e.touches[0];
        touchStateRef.current.mode = "pan";
        touchStateRef.current.lastX = t0.clientX;
        touchStateRef.current.lastY = t0.clientY;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoomAtPoint, panByPixels, viewMode]);

  // When a user adjusts a branch's conditional probability, automatically rebalance its sibling branches so they sum to 100%
  const handleSetBranchConditional = (
    riverNodeId: string,
    newCondProb: number
  ) => {
    const target = riverNodeMap.get(riverNodeId);
    if (!target || !target.parentId) return;
    const clamped = Math.max(0.02, Math.min(0.96, newCondProb));
    const siblings = computedRiverNodes.filter(
      (n) => n.parentId === target.parentId && n.id !== riverNodeId
    );
    if (siblings.length === 0) return;

    const remaining = 1 - clamped;
    const currentSiblingSum = siblings.reduce(
      (acc, s) => acc + s.conditionalProb,
      0
    );

    const nextOverrides: Record<string, number> = {
      ...conditionalOverrides,
      [riverNodeId]: clamped,
    };
    siblings.forEach((s) => {
      const share =
        currentSiblingSum > 0
          ? s.conditionalProb / currentSiblingSum
          : 1 / siblings.length;
      nextOverrides[s.id] = Number((remaining * share).toFixed(4));
    });
    setConditionalOverrides(nextOverrides);
  };

  // Highlighted lineage when hovering or selecting a node
  const activeRiverNode = useMemo(() => {
    if (hoveredRiverId) return riverNodeMap.get(hoveredRiverId) || null;
    if (selectedNodeId) {
      return (
        computedRiverNodes.find((n) => n.canonicalNodeId === selectedNodeId) ||
        null
      );
    }
    return null;
  }, [hoveredRiverId, selectedNodeId, riverNodeMap, computedRiverNodes]);

  const highlightedRiverIds = useMemo(() => {
    if (!activeRiverNode) return null;
    const set = new Set<string>([activeRiverNode.id]);
    // Ancestors
    let curr: ComputedRiverNode | undefined = activeRiverNode;
    while (curr?.parentId) {
      set.add(curr.parentId);
      curr = riverNodeMap.get(curr.parentId);
    }
    // Descendants
    const queue = [activeRiverNode.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const n of computedRiverNodes) {
        if (n.parentId === id && !set.has(n.id)) {
          set.add(n.id);
          queue.push(n.id);
        }
      }
    }
    // Also ensure all nodes in selectedNeighborhood are highlighted when a node is selected
    if (selectedNeighborhood) {
      selectedNeighborhood.focusIds.forEach((id) => set.add(id));
    }
    return set;
  }, [activeRiverNode, riverNodeMap, computedRiverNodes, selectedNeighborhood]);

  // Underlying DAG propagation for the audit drawer
  const basePriors = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of nodes) {
      const val = lensPriorsByNode[n.id]?.[selectedLens];
      map[n.id] =
        val !== null && val !== undefined
          ? val
          : n.question?.demoHypothesisProb ?? 0.5;
    }
    return map;
  }, [nodes, lensPriorsByNode, selectedLens]);

  const propagation = useMemo(
    () => propagateGraphProbabilities(nodes, edges, basePriors, {}),
    [nodes, edges, basePriors]
  );

  const selectedCanonicalNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedNodeDownstreamImpacts = useMemo(() => {
    if (!selectedCanonicalNode) return [];
    return nodes
      .filter((n) => n.id !== selectedCanonicalNode.id)
      .slice(0, 5)
      .map((n) => {
        const pBase = propagation.results[n.id]?.marginalProbability ?? 0.5;
        return {
          nodeId: n.id,
          title: n.title,
          dateLabel: n.dateLabel,
          baselineProb: pBase,
          probAt80: Math.min(0.95, pBase + 0.12),
          probAt20: Math.max(0.05, pBase - 0.12),
          swing: 0.24,
        };
      });
  }, [selectedCanonicalNode, nodes, propagation]);

  // Theme-adaptive color palettes for the SVG diagram
  const trackColors = useMemo(
    () =>
      isLightMode
        ? {
            spine: {
              stroke: "#d97706",
              nodeFill: "#f59e0b",
              text: "#b45309",
              badgeBg: "rgba(217, 119, 6, 0.15)",
            },
            race: {
              stroke: "#e11d48",
              nodeFill: "#f43f5e",
              text: "#be123c",
              badgeBg: "rgba(225, 29, 72, 0.15)",
            },
            slowdown: {
              stroke: "#059669",
              nodeFill: "#10b981",
              text: "#047857",
              badgeBg: "rgba(5, 150, 105, 0.15)",
            },
            hybrid: {
              stroke: "#0284c7",
              nodeFill: "#0ea5e9",
              text: "#0369a1",
              badgeBg: "rgba(2, 132, 199, 0.15)",
            },
            offramp: {
              stroke: "#64748b",
              nodeFill: "#64748b",
              text: "#475569",
              badgeBg: "rgba(100, 116, 139, 0.15)",
            },
          }
        : {
            spine: {
              stroke: "#f59e0b",
              nodeFill: "#fbbf24",
              text: "#fde68a",
              badgeBg: "rgba(245, 158, 11, 0.16)",
            },
            race: {
              stroke: "#f43f5e",
              nodeFill: "#fb7185",
              text: "#fecdd3",
              badgeBg: "rgba(244, 63, 94, 0.18)",
            },
            slowdown: {
              stroke: "#10b981",
              nodeFill: "#34d399",
              text: "#a7f3d0",
              badgeBg: "rgba(16, 185, 129, 0.18)",
            },
            hybrid: {
              stroke: "#38bdf8",
              nodeFill: "#7dd3fc",
              text: "#bae6fd",
              badgeBg: "rgba(56, 189, 248, 0.16)",
            },
            offramp: {
              stroke: "#64748b",
              nodeFill: "#94a3b8",
              text: "#cbd5e1",
              badgeBg: "rgba(100, 116, 139, 0.18)",
            },
          },
    [isLightMode]
  );

  const zoomPercentage = Math.round((FULL_VIEWBOX.w / camera.w) * 100);

  return (
    <div
      className={`flex flex-col h-[calc(100dvh-57px)] overflow-hidden select-none ${
        isLightMode
          ? "bg-[#f8f6f0] text-slate-900"
          : "bg-[#070b12] text-slate-100"
      }`}
    >
      {/* Slim Header Bar */}
      <div className="shrink-0 border-b border-slate-800/80 bg-slate-950/95 px-4 py-2">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          {/* Left: Title + Clear Explanation of the 2 Probability Numbers */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-amber-400" />
              <h1 className="text-sm sm:text-base font-bold text-white">
                AI 2027 Branching Probability Tree
              </h1>
            </div>

            {/* Legend explaining Overall vs Conditional Split */}
            <div className="hidden lg:flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/90 px-3.5 py-1 text-xs">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Node % = Overall Probability (from 2025)</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">
                Branch Label ={" "}
                <strong className="text-white">
                  Chance Given Previous Node
                </strong>{" "}
                (forks always sum to 100%)
              </span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle River Thickness Mode */}
            <div className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setThicknessMode("overall")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  thicknessMode === "overall"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Width = Overall %
              </button>
              <button
                type="button"
                onClick={() => setThicknessMode("conditional")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  thicknessMode === "conditional"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Width = Split %
              </button>
            </div>

            {/* Lens Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1">
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              <select
                aria-label="Select Forecast Lens"
                value={selectedLens}
                onChange={(e) =>
                  setSelectedLens(e.target.value as ForecastLens)
                }
                className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none"
              >
                <option value="demo_hypothesis" className="bg-slate-900">
                  Lens: AI 2027 Baseline
                </option>
                <option value="community" className="bg-slate-900">
                  Lens: Human Community
                </option>
                <option value="ai_claude" className="bg-slate-900">
                  Lens: Claude (Hardware Realist)
                </option>
                <option value="ai_gemini" className="bg-slate-900">
                  Lens: Gemini Agent
                </option>
                <option value="ai_gpt" className="bg-slate-900">
                  Lens: GPT Agent
                </option>
              </select>
            </div>

            {Object.keys(conditionalOverrides).length > 0 && (
              <button
                type="button"
                onClick={() => setConditionalOverrides({})}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Splits
              </button>
            )}

            {/* River vs Table View */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("river")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                  viewMode === "river"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Network className="h-3 w-3" />
                <span>Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                  viewMode === "list"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Area:
          - On mobile (< lg): vertical scrollable container so when a node is clicked,
            the zoomed-in diagram stays at the top and remains visible whenever the user scrolls back up!
          - On desktop (>= lg): side-by-side split where the diagram zooms into the clicked branch neighborhood
            on the left and the detailed text opens on the right. */}
      <div
        ref={mobileSplitScrollRef}
        className={`relative flex flex-1 flex-col lg:flex-row ${
          selectedCanonicalNode
            ? "overflow-y-auto lg:overflow-hidden"
            : "overflow-hidden"
        }`}
      >
        {viewMode === "river" ? (
          <div
            ref={diagramViewportRef}
            tabIndex={0}
            role="region"
            aria-label="Interactive AI 2027 branching probability diagram"
            style={{ touchAction: "none" }}
            className={`fg-diagram-viewport relative w-full overflow-hidden cursor-grab active:cursor-grabbing ${
              selectedCanonicalNode
                ? "h-[44dvh] min-h-[280px] sm:h-[48dvh] shrink-0 border-b border-slate-800 lg:h-full lg:flex-1 lg:border-b-0"
                : "flex-1 h-full"
            }`}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              setIsDragging(true);
              didDragMoveRef.current = false;
              dragLastClientRef.current = { x: e.clientX, y: e.clientY };
            }}
            onMouseMove={(e) => {
              if (!isDragging || !dragLastClientRef.current) return;
              const dx = e.clientX - dragLastClientRef.current.x;
              const dy = e.clientY - dragLastClientRef.current.y;
              if (Math.hypot(dx, dy) > 3) {
                didDragMoveRef.current = true;
              }
              dragLastClientRef.current = { x: e.clientX, y: e.clientY };
              panByPixels(dx, dy);
            }}
            onMouseUp={() => {
              setIsDragging(false);
              dragLastClientRef.current = null;
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              dragLastClientRef.current = null;
            }}
            onClick={(e) => {
              if (didDragMoveRef.current) return;
              if (!(e.target as HTMLElement).closest("[data-river-node]")) {
                setSelectedNodeId(null);
              }
            }}
          >
            {/* Top-Left Focused Neighborhood Banner when a node is selected */}
            {selectedNeighborhood && (
              <div className="pointer-events-auto absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-amber-500/40 bg-slate-950/90 px-3 py-1.5 text-xs shadow-lg backdrop-blur-md">
                  <Focus className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-300">
                    Zoomed to Branch:
                  </span>
                  {selectedNeighborhood.prevNode && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(
                            selectedNeighborhood.prevNode!.canonicalNodeId
                          );
                        }}
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300 hover:text-amber-300"
                      >
                        ← {selectedNeighborhood.prevNode.shortName}
                      </button>
                      <span className="text-slate-500">→</span>
                    </>
                  )}
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-bold text-white">
                    {selectedNeighborhood.target.shortName}
                  </span>
                  {selectedNeighborhood.nextNodes.length > 0 && (
                    <>
                      <span className="text-slate-500">→</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {selectedNeighborhood.nextNodes.map((nx) => (
                          <button
                            key={nx.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNodeId(nx.canonicalNodeId);
                            }}
                            className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300 hover:text-amber-300"
                          >
                            {nx.shortName} →
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      animateCameraTo(selectedNeighborhood.cameraBox);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-amber-500/50 hover:text-amber-300 shadow"
                  >
                    <Focus className="h-3 w-3" />
                    <span>Refocus Node</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      animateCameraTo(FULL_VIEWBOX);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-amber-500/50 hover:text-amber-300 shadow"
                  >
                    <Maximize2 className="h-3 w-3" />
                    <span>Show Full Tree</span>
                  </button>
                </div>
              </div>
            )}

            {/* Interactive SVG Branching Probability River driven by viewBox camera */}
            <svg
              viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`}
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>

              <g>
                {/* Subtle Year Timeline Columns in Background */}
                {[
                  { x: 85, year: "2025" },
                  { x: 275, year: "2026" },
                  { x: 475, year: "EARLY 2027" },
                  { x: 675, year: "MID 2027" },
                  { x: 865, year: "SEP 2027" },
                  { x: 1015, year: "OCT 2027 FORK" },
                  { x: 1170, year: "NOV 2027" },
                  { x: 1305, year: "2028" },
                  { x: 1425, year: "2029" },
                  { x: 1525, year: "2030" },
                ].map((col) => (
                  <g key={col.year}>
                    <line
                      x1={col.x}
                      y1={40}
                      x2={col.x}
                      y2={660}
                      stroke={isLightMode ? "#cbd5e1" : "#1e293b"}
                      strokeWidth={1}
                      strokeDasharray="4 6"
                    />
                    <text
                      x={col.x}
                      y={26}
                      textAnchor="middle"
                      fill={isLightMode ? "#475569" : "#64748b"}
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {col.year}
                    </text>
                  </g>
                ))}

                {/* Major Outcome Region Labels on the Right */}
                <text
                  x={1350}
                  y={52}
                  textAnchor="middle"
                  fill={isLightMode ? "#be123c" : "#fb7185"}
                  fontSize={12}
                  fontWeight={800}
                  letterSpacing="0.08em"
                >
                  RACE BRANCH (UNCHECKED AI SCALING → TAKEOVER)
                </text>
                <text
                  x={1350}
                  y={648}
                  textAnchor="middle"
                  fill={isLightMode ? "#047857" : "#34d399"}
                  fontSize={12}
                  fontWeight={800}
                  letterSpacing="0.08em"
                >
                  SLOWDOWN BRANCH (FREEZE + ALIGNED AI + VERIFIED TREATY)
                </text>

                {/* 1. Render Continuous Weighted Probability River Branches (Cubic Beziers) */}
                {computedRiverNodes.map((node) => {
                  if (!node.parentId) return null;
                  const parent = riverNodeMap.get(node.parentId);
                  if (!parent) return null;

                  const weightProb =
                    thicknessMode === "overall"
                      ? node.overallProb
                      : node.conditionalProb;

                  // Thickness directly proportional to probability (from 2.5px up to 34px)
                  const strokeWidth = Math.max(
                    2.5,
                    Number((weightProb * 34).toFixed(1))
                  );

                  const isHighlighted =
                    highlightedRiverIds === null ||
                    (highlightedRiverIds.has(parent.id) &&
                      highlightedRiverIds.has(node.id));

                  const dx = node.x - parent.x;
                  const c1x = parent.x + dx * 0.48;
                  const c2x = parent.x + dx * 0.52;
                  const pathD = `M ${parent.x} ${parent.y} C ${c1x} ${parent.y}, ${c2x} ${node.y}, ${node.x} ${node.y}`;

                  const color = trackColors[node.track].stroke;
                  const condPct = Math.round(node.conditionalProb * 100);

                  // Midpoint on bezier curve for the conditional split % pill
                  const midX = parent.x + dx * 0.48;
                  const midY = (parent.y + node.y) / 2;

                  return (
                    <g key={`edge-${node.id}`}>
                      {/* Outer glow for highlighted river */}
                      {isHighlighted && node.track !== "offramp" && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={color}
                          strokeWidth={strokeWidth + 6}
                          strokeLinecap="round"
                          opacity={isLightMode ? 0.18 : 0.12}
                        />
                      )}

                      {/* Main weighted probability river branch */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        opacity={
                          isHighlighted
                            ? node.track === "offramp"
                              ? 0.65
                              : 0.92
                            : 0.14
                        }
                        className="transition-all duration-300"
                      />

                      {/* Conditional Split Badge along the branch ("given parent") */}
                      {condPct < 100 && isHighlighted && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x={-20}
                            y={-9}
                            width={40}
                            height={18}
                            rx={5}
                            fill={isLightMode ? "#ffffff" : "#070b12"}
                            stroke={color}
                            strokeWidth={1.2}
                            opacity={0.95}
                          />
                          <text
                            x={0}
                            y={3.5}
                            textAnchor="middle"
                            fill={isLightMode ? "#0f172a" : "#e2e8f0"}
                            fontSize={9.5}
                            fontWeight={700}
                            fontFamily="monospace"
                          >
                            {condPct}%
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 2. Render Sleek Junction Nodes & Clean Labels Along the River */}
                {computedRiverNodes.map((node) => {
                  const isHighlighted =
                    highlightedRiverIds === null ||
                    highlightedRiverIds.has(node.id);
                  const isSelected = selectedNodeId === node.canonicalNodeId;
                  const isPrevNode =
                    selectedNeighborhood?.prevNode?.id === node.id;
                  const isNextNode =
                    selectedNeighborhood?.nextNodes.some(
                      (nx) => nx.id === node.id
                    ) ?? false;
                  const isForkHub = node.id === "river-2027-oct-fork";

                  const overallPct = Math.round(node.overallProb * 100);
                  const condPct = Math.round(node.conditionalProb * 100);
                  const palette = trackColors[node.track];

                  // Node circle radius scales with probability
                  const radius = isForkHub
                    ? 14
                    : Math.max(
                        6,
                        Math.min(15, Math.round(5 + node.overallProb * 10))
                      );

                  const labelAbove = node.labelPosition !== "bottom";
                  const labelYOffset = labelAbove
                    ? -(radius + 22)
                    : radius + 18;

                  const roleTag = isSelected
                    ? "● SELECTED"
                    : isPrevNode
                    ? "← PREVIOUS"
                    : isNextNode
                    ? "NEXT →"
                    : null;

                  return (
                    <g
                      key={node.id}
                      data-river-node="true"
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          didDragMoveRef.current ||
                          touchStateRef.current.moved
                        ) {
                          return;
                        }
                        setSelectedNodeId((prev) =>
                          prev === node.canonicalNodeId
                            ? null
                            : node.canonicalNodeId
                        );
                      }}
                      onMouseEnter={() => setHoveredRiverId(node.id)}
                      onMouseLeave={() => setHoveredRiverId(null)}
                      className="cursor-pointer"
                      style={{
                        opacity: isHighlighted ? 1 : 0.22,
                        transition: "opacity 180ms ease",
                      }}
                    >
                      {/* Hub pulse glow */}
                      {isForkHub && (
                        <circle cx={0} cy={0} r={34} fill="url(#hubGlow)" />
                      )}

                      {/* Selection or Prev/Next ring */}
                      {(isSelected || isPrevNode || isNextNode) && (
                        <circle
                          cx={0}
                          cy={0}
                          r={radius + 6}
                          fill="none"
                          stroke={
                            isSelected
                              ? isLightMode
                                ? "#0f172a"
                                : "#ffffff"
                              : palette.stroke
                          }
                          strokeWidth={isSelected ? 2.8 : 1.8}
                          strokeDasharray={isSelected ? undefined : "3 3"}
                        />
                      )}

                      {/* Sleek Junction Circle on the River */}
                      <circle
                        cx={0}
                        cy={0}
                        r={radius}
                        fill={isLightMode ? "#ffffff" : "#090d16"}
                        stroke={palette.nodeFill}
                        strokeWidth={isForkHub ? 4 : 3}
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={Math.max(2.5, radius - 4)}
                        fill={palette.nodeFill}
                      />

                      {/* Clean Floating Label with Halo Stroke for Legibility */}
                      <g transform={`translate(0, ${labelYOffset})`}>
                        {roleTag && (
                          <text
                            x={0}
                            y={labelAbove ? -13 : 27}
                            textAnchor="middle"
                            fill={
                              isSelected
                                ? isLightMode
                                  ? "#b45309"
                                  : "#fbbf24"
                                : isLightMode
                                ? "#334155"
                                : "#94a3b8"
                            }
                            fontSize={8.5}
                            fontWeight={800}
                            fontFamily="monospace"
                            letterSpacing="0.06em"
                            paintOrder="stroke"
                            stroke={isLightMode ? "#f8f6f0" : "#070b12"}
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {roleTag}
                          </text>
                        )}

                        {/* Node Short Name */}
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          fill={
                            node.track === "offramp"
                              ? isLightMode
                                ? "#475569"
                                : "#94a3b8"
                              : isLightMode
                              ? "#0f172a"
                              : "#ffffff"
                          }
                          fontSize={isForkHub ? 12.5 : 11.5}
                          fontWeight={isForkHub || isSelected ? 800 : 700}
                          paintOrder="stroke"
                          stroke={isLightMode ? "#f8f6f0" : "#070b12"}
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {node.shortName}
                        </text>

                        {/* Dual Probability Readout: Overall % + (Split % if < 100%) */}
                        <text
                          x={0}
                          y={14}
                          textAnchor="middle"
                          fill={palette.text}
                          fontSize={10}
                          fontWeight={700}
                          fontFamily="monospace"
                          paintOrder="stroke"
                          stroke={isLightMode ? "#f8f6f0" : "#070b12"}
                          strokeWidth={3.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {overallPct}% overall
                          {node.parentId && condPct < 100
                            ? ` (${condPct}% split)`
                            : ""}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Bottom-Left Zoom Controls & Helper */}
            <div className="pointer-events-auto absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/90 p-1 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomAtPoint(0.78, 0.5, 0.5);
                  }}
                  className="p-1.5 text-slate-300 hover:text-white"
                  title="Zoom In Diagram"
                  aria-label="Zoom in diagram"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <span className="px-1.5 text-[11px] font-mono font-semibold text-amber-400 tabular-nums">
                  {zoomPercentage}%
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomAtPoint(1.28, 0.5, 0.5);
                  }}
                  className="p-1.5 text-slate-300 hover:text-white"
                  title="Zoom Out Diagram"
                  aria-label="Zoom out diagram"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    animateCameraTo(FULL_VIEWBOX);
                  }}
                  className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-white"
                >
                  Reset View
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800/90 bg-slate-950/85 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur-md">
                <span>
                  Pinch or scroll on diagram to zoom • Click any node to focus
                  branch & open details
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Table View (When toggled) */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Branch Milestone</th>
                    <th className="py-2.5 px-3">Chance Given Parent</th>
                    <th className="py-2.5 px-3">Overall Probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {computedRiverNodes.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => setSelectedNodeId(n.canonicalNodeId)}
                      className="cursor-pointer hover:bg-slate-800/50"
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {n.dateTag}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {n.shortName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sky-300">
                        {Math.round(n.conditionalProb * 100)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {Math.round(n.overallProb * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Panel — Appears when a node on the river is clicked.
            On mobile (< lg): renders directly below the zoomed-in diagram in the vertical scroll container
            so the diagram stays visible at the top whenever the user scrolls back up!
            On desktop (>= lg): renders as the right-hand side panel. */}
        {selectedCanonicalNode && (
          <div className="flex flex-col w-full border-t border-slate-800 bg-slate-950 shadow-2xl lg:w-[480px] xl:w-[520px] lg:h-full lg:shrink-0 lg:border-t-0 lg:border-l">
            {/* Mobile Sticky Helper to jump back to the zoomed diagram at the top */}
            <div className="sticky top-0 z-20 flex lg:hidden items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-2 text-xs backdrop-blur-md">
              <span className="font-semibold text-amber-300 truncate">
                Viewing: {selectedRiverNodeForDrawer?.shortName || selectedCanonicalNode.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    mobileSplitScrollRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200"
                >
                  <ArrowUp className="h-3 w-3 text-amber-400" />
                  <span>Top Diagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Interactive Branch Split Slider right at the top of the drawer */}
            {selectedRiverNodeForDrawer &&
              selectedRiverNodeForDrawer.parentId && (
                <div className="shrink-0 border-b border-amber-500/30 bg-amber-950/20 px-4 py-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Sliders className="h-3.5 w-3.5" />
                      Adjust Branch Split (Given Parent Node):
                    </span>
                    <span className="font-mono font-bold text-white">
                      {Math.round(
                        selectedRiverNodeForDrawer.conditionalProb * 100
                      )}
                      % split →{" "}
                      <strong className="text-amber-400">
                        {Math.round(
                          selectedRiverNodeForDrawer.overallProb * 100
                        )}
                        % overall
                      </strong>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={96}
                    value={Math.round(
                      selectedRiverNodeForDrawer.conditionalProb * 100
                    )}
                    onChange={(e) =>
                      handleSetBranchConditional(
                        selectedRiverNodeForDrawer.id,
                        Number(e.target.value) / 100
                      )
                    }
                    className="w-full"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Sibling branches leaving the same parent automatically
                    rebalance so the fork sums to 100%.
                  </div>
                </div>
              )}

            <div className="flex-1 lg:overflow-y-auto">
              <NodeAuditPanel
                key={selectedCanonicalNode.id}
                node={selectedCanonicalNode}
                propagation={
                  propagation.results[selectedCanonicalNode.id] || null
                }
                lensPriors={
                  lensPriorsByNode[selectedCanonicalNode.id] || {
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
                  (ns) => ns.nodeId === selectedCanonicalNode.id
                )}
                argumentsList={argumentsList.filter(
                  (a) => a.nodeId === selectedCanonicalNode.id
                )}
                comments={comments.filter(
                  (c) => c.nodeId === selectedCanonicalNode.id
                )}
                forecasts={forecastEvents.filter(
                  (fe) => fe.nodeId === selectedCanonicalNode.id
                )}
                incomingEdges={edges.filter(
                  (e) => e.targetNodeId === selectedCanonicalNode.id
                )}
                outgoingEdges={edges.filter(
                  (e) => e.sourceNodeId === selectedCanonicalNode.id
                )}
                downstreamImpacts={selectedNodeDownstreamImpacts}
                onSelectNode={(id) => setSelectedNodeId(id)}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
