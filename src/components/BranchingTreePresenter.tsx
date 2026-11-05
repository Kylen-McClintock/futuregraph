"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Compass,
  EyeOff,
  GitBranch,
  Maximize2,
  Minimize2,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import {
  ArgumentItem,
  ForecastLens,
  FutureNode,
  NodeSourceLink,
} from "@/types/futuregraph";
import {
  AI_2040_ARGUMENTS,
  AI_2040_NODE_SOURCES,
  AI_2040_NODES,
  AI_2040_RIVER_SPECS,
  AI_2040_TIMELINE_COLS,
  RiverBranchNodeSpec,
} from "@/data/ai2040-seed";
import {
  AI_2050_ARGUMENTS,
  AI_2050_COMPREHENSIVE_RIVER_SPECS,
  AI_2050_COMPREHENSIVE_TIMELINE_COLS,
  AI_2050_NODE_SOURCES,
  AI_2050_NODES,
  AI_2050_SIMPLE_RIVER_SPECS,
  AI_2050_SIMPLE_TIMELINE_COLS,
} from "@/data/ai2050-seed";
import {
  SEED_ARGUMENTS,
  SEED_NODE_SOURCES,
  SEED_NODES,
  SEED_SOURCES,
} from "@/data/ai2027-seed";
import { RIVER_TREE_SPECS } from "@/components/ScenarioGraphExplorer";
import {
  BranchSceneArtwork,
  resolveBranchSceneMetadata,
} from "@/components/BranchSceneArtwork";

export type PresentTreeKey =
  | "ai-2050-simple"
  | "ai-2050-comprehensive"
  | "ai-2027"
  | "ai-2040";

interface ComputedPresentNode extends RiverBranchNodeSpec {
  conditionalProb: number;
  overallProb: number;
  isDecisionFork: boolean;
  isTerminalOutcome: boolean;
  childIds: string[];
}

interface ViewBoxCamera {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FULL_RIVER_VIEWBOX: ViewBoxCamera = { x: 0, y: 0, w: 1860, h: 720 };

const AI_2027_TIMELINE_COLS = [
  { x: 95, year: "MID 2025" },
  { x: 295, year: "2026" },
  { x: 505, year: "MAR 2027" },
  { x: 720, year: "MID 2027" },
  { x: 935, year: "SEP 2027" },
  { x: 1125, year: "OCT 2027 FORK" },
  { x: 1475, year: "2028" },
  { x: 1765, year: "2030 OUTCOMES" },
];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export interface BranchingTreePresenterProps {
  initialTreeKey?: PresentTreeKey;
  initialRiverNodeId?: string | null;
  initialConditionalOverrides?: Record<string, number>;
  onCloseEmbedded?: () => void;
  embedded?: boolean;
}

export function BranchingTreePresenter({
  initialTreeKey = "ai-2050-simple",
  initialRiverNodeId = null,
  initialConditionalOverrides = {},
  onCloseEmbedded,
  embedded = false,
}: BranchingTreePresenterProps) {
  const [treeKey, setTreeKey] = useState<PresentTreeKey>(initialTreeKey);
  const [tourFilter, setTourFilter] = useState<"all" | "forks" | "worlds">("all");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [cleanMode, setCleanMode] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [bottomCameraMode, setBottomCameraMode] = useState<"neighborhood" | "full">(
    "neighborhood"
  );
  const [selectedLens, setSelectedLens] = useState<ForecastLens>("demo_hypothesis");
  const [conditionalOverrides, setConditionalOverrides] = useState<
    Record<string, number>
  >(initialConditionalOverrides);

  const slideHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // Active river specs & metadata based on selected tree
  const activeSpecs = useMemo(() => {
    if (treeKey === "ai-2050-simple") return AI_2050_SIMPLE_RIVER_SPECS;
    if (treeKey === "ai-2050-comprehensive")
      return AI_2050_COMPREHENSIVE_RIVER_SPECS;
    if (treeKey === "ai-2040") return AI_2040_RIVER_SPECS;
    return RIVER_TREE_SPECS;
  }, [treeKey]);

  const activeTimelineCols = useMemo(() => {
    if (treeKey === "ai-2050-simple") return AI_2050_SIMPLE_TIMELINE_COLS;
    if (treeKey === "ai-2050-comprehensive")
      return AI_2050_COMPREHENSIVE_TIMELINE_COLS;
    if (treeKey === "ai-2040") return AI_2040_TIMELINE_COLS;
    return AI_2027_TIMELINE_COLS;
  }, [treeKey]);

  const allCanonicalNodes: FutureNode[] = useMemo(
    () => [...SEED_NODES, ...AI_2040_NODES, ...AI_2050_NODES],
    []
  );
  const allArguments: ArgumentItem[] = useMemo(
    () => [...SEED_ARGUMENTS, ...AI_2040_ARGUMENTS, ...AI_2050_ARGUMENTS],
    []
  );
  const allNodeSources: NodeSourceLink[] = useMemo(
    () => [...SEED_NODE_SOURCES, ...AI_2040_NODE_SOURCES, ...AI_2050_NODE_SOURCES],
    []
  );

  // Compute conditional & overall probabilities across the active branching tree
  const computedNodes: ComputedPresentNode[] = useMemo(() => {
    const childrenByParent = new Map<string, RiverBranchNodeSpec[]>();
    for (const spec of activeSpecs) {
      if (!spec.parentId) continue;
      const list = childrenByParent.get(spec.parentId) || [];
      list.push(spec);
      childrenByParent.set(spec.parentId, list);
    }

    const condMap = new Map<string, number>();
    for (const spec of activeSpecs) {
      if (!spec.parentId) condMap.set(spec.id, 1.0);
    }

    for (const [, siblings] of childrenByParent.entries()) {
      const rawProbs = siblings.map((s) =>
        conditionalOverrides[s.id] !== undefined
          ? conditionalOverrides[s.id]
          : s.defaultConditionalProb
      );
      const sum = rawProbs.reduce((a, b) => a + b, 0);
      siblings.forEach((s, idx) => {
        condMap.set(s.id, sum > 0 ? rawProbs[idx] / sum : 1 / siblings.length);
      });
    }

    const overallMap = new Map<string, number>();
    for (const spec of activeSpecs) {
      if (!spec.parentId) {
        overallMap.set(spec.id, 1.0);
      } else {
        const parentOverall = overallMap.get(spec.parentId) ?? 1.0;
        const cProb = condMap.get(spec.id) ?? spec.defaultConditionalProb;
        overallMap.set(spec.id, parentOverall * cProb);
      }
    }

    return activeSpecs.map((spec) => {
      const kids = childrenByParent.get(spec.id) || [];
      return {
        ...spec,
        conditionalProb: condMap.get(spec.id) ?? spec.defaultConditionalProb,
        overallProb: overallMap.get(spec.id) ?? spec.defaultConditionalProb,
        isDecisionFork: kids.length >= 2,
        isTerminalOutcome: kids.length === 0,
        childIds: kids.map((k) => k.id),
      };
    });
  }, [activeSpecs, conditionalOverrides]);

  const nodeMap = useMemo(
    () => new Map(computedNodes.map((n) => [n.id, n])),
    [computedNodes]
  );

  // Ordered tour deck based on tourFilter
  const deckNodes = useMemo(() => {
    if (tourFilter === "forks") {
      const forks = computedNodes.filter((n) => n.isDecisionFork);
      return forks.length > 0 ? forks : computedNodes;
    }
    if (tourFilter === "worlds") {
      const worlds = computedNodes
        .filter((n) => n.isTerminalOutcome)
        .sort((a, b) => b.overallProb - a.overallProb);
      return worlds.length > 0 ? worlds : computedNodes;
    }
    return computedNodes;
  }, [computedNodes, tourFilter]);

  const [activeRiverNodeId, setActiveRiverNodeId] = useState<string>(() => {
    if (
      initialRiverNodeId &&
      activeSpecs.some(
        (s) =>
          s.id === initialRiverNodeId ||
          s.canonicalNodeId === initialRiverNodeId
      )
    ) {
      const found = activeSpecs.find(
        (s) =>
          s.id === initialRiverNodeId ||
          s.canonicalNodeId === initialRiverNodeId
      );
      if (found) return found.id;
    }
    return activeSpecs[0]?.id || "";
  });

  // Ensure activeRiverNodeId stays valid when switching trees or filters
  useEffect(() => {
    if (!deckNodes.some((n) => n.id === activeRiverNodeId)) {
      if (deckNodes[0]) {
        setActiveRiverNodeId(deckNodes[0].id);
      }
    }
  }, [deckNodes, activeRiverNodeId]);

  const currentSlideIdx = useMemo(() => {
    const idx = deckNodes.findIndex((n) => n.id === activeRiverNodeId);
    return idx >= 0 ? idx : 0;
  }, [deckNodes, activeRiverNodeId]);

  const currentNode =
    deckNodes[currentSlideIdx] || computedNodes[0];

  const parentNode = useMemo(
    () =>
      currentNode?.parentId ? nodeMap.get(currentNode.parentId) || null : null,
    [currentNode, nodeMap]
  );

  const childNodes = useMemo(
    () =>
      currentNode
        ? computedNodes.filter((n) => n.parentId === currentNode.id)
        : [],
    [currentNode, computedNodes]
  );

  const siblingNodes = useMemo(
    () =>
      currentNode?.parentId
        ? computedNodes.filter(
            (n) => n.parentId === currentNode.parentId && n.id !== currentNode.id
          )
        : [],
    [currentNode, computedNodes]
  );

  // Full causal chain from root (100%) to currentNode
  const causalChain = useMemo(() => {
    if (!currentNode) return [];
    const chain: ComputedPresentNode[] = [];
    let curr: ComputedPresentNode | undefined = currentNode;
    while (curr) {
      chain.unshift(curr);
      curr = curr.parentId ? nodeMap.get(curr.parentId) : undefined;
    }
    return chain;
  }, [currentNode, nodeMap]);

  const activeLineageSet = useMemo(() => {
    const s = new Set<string>(causalChain.map((n) => n.id));
    for (const child of childNodes) {
      s.add(child.id);
    }
    return s;
  }, [causalChain, childNodes]);

  // All terminal outcomes ranked for comparison on terminal world slides
  const rankedTerminalWorlds = useMemo(
    () =>
      computedNodes
        .filter((n) => n.isTerminalOutcome)
        .sort((a, b) => b.overallProb - a.overallProb),
    [computedNodes]
  );

  // Canonical FutureNode, Arguments, and Sources for the active slide
  const canonicalNode = useMemo(
    () =>
      allCanonicalNodes.find((n) => n.id === currentNode?.canonicalNodeId) ||
      null,
    [allCanonicalNodes, currentNode]
  );

  const nodeArguments = useMemo(
    () =>
      allArguments
        .filter((a) => a.nodeId === currentNode?.canonicalNodeId)
        .sort(
          (a, b) =>
            (b.externalUpvotes ?? 50) - (a.externalUpvotes ?? 50)
        ),
    [allArguments, currentNode]
  );

  const nodeSourceLinks = useMemo(() => {
    const links = allNodeSources.filter(
      (ns) => ns.nodeId === currentNode?.canonicalNodeId
    );
    return links.map((l) => {
      const src = l.source || SEED_SOURCES.find((s) => s.id === l.sourceId);
      return {
        ...l,
        title: src?.title || "Primary Source",
        url: src?.url || null,
      };
    });
  }, [allNodeSources, currentNode]);

  const sceneMetadata = useMemo(
    () =>
      resolveBranchSceneMetadata(
        currentNode?.id || "",
        currentNode?.shortName || "",
        Boolean(currentNode?.isDecisionFork),
        Boolean(currentNode?.isTerminalOutcome)
      ),
    [currentNode]
  );

  // Directional transition helper using View Transitions API (Modern Web Guidance: directional-navigation-transitions & same-document-transitions)
  const transitionToNode = useCallback(
    (targetNodeId: string, direction: "forward" | "backward" = "forward") => {
      const updateDOM = () => {
        setActiveRiverNodeId(targetNodeId);
      };

      const docWithVT = document as Document & {
        startViewTransition?: (
          arg: (() => void) | { update: () => void; types?: string[] }
        ) => { finished: Promise<void> };
      };

      if (typeof document === "undefined" || !docWithVT.startViewTransition) {
        updateDOM();
        slideHeadingRef.current?.focus({ preventScroll: true });
        return;
      }

      try {
        const transition = docWithVT.startViewTransition({
          update: updateDOM,
          types: [direction],
        });
        transition.finished.finally(() => {
          slideHeadingRef.current?.focus({ preventScroll: true });
        });
      } catch {
        // Fallback for browsers that support startViewTransition(fn) without options object
        const transition = docWithVT.startViewTransition(updateDOM);
        transition.finished.finally(() => {
          slideHeadingRef.current?.focus({ preventScroll: true });
        });
      }
    },
    []
  );

  const goNextSlide = useCallback(() => {
    const nextIdx = (currentSlideIdx + 1) % deckNodes.length;
    if (deckNodes[nextIdx]) {
      transitionToNode(deckNodes[nextIdx].id, "forward");
    }
  }, [currentSlideIdx, deckNodes, transitionToNode]);

  const goPrevSlide = useCallback(() => {
    const prevIdx =
      (currentSlideIdx - 1 + deckNodes.length) % deckNodes.length;
    if (deckNodes[prevIdx]) {
      transitionToNode(deckNodes[prevIdx].id, "backward");
    }
  }, [currentSlideIdx, deckNodes, transitionToNode]);

  // Keyboard navigation (ArrowRight, Space, ArrowLeft, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIsAutoPlaying(false);
        goNextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIsAutoPlaying(false);
        goPrevSlide();
      } else if (e.key === "Escape") {
        if (cleanMode) setCleanMode(false);
        else if (onCloseEmbedded) onCloseEmbedded();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNextSlide, goPrevSlide, cleanMode, onCloseEmbedded]);

  // Auto-play cruise timer (with pause mechanism per Modern Web Guidance `motion`)
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = window.setInterval(() => {
      goNextSlide();
    }, 5200);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, goNextSlide]);

  // Live What-If Conditional Slider adjustment directly inside Present Mode
  const handleAdjustBranchSplit = useCallback(
    (branchNodeId: string, newCondProb: number) => {
      const target = nodeMap.get(branchNodeId);
      if (!target || !target.parentId) return;
      const clamped = clamp(newCondProb, 0.02, 0.96);
      const siblings = computedNodes.filter(
        (n) => n.parentId === target.parentId && n.id !== branchNodeId
      );
      if (siblings.length === 0) return;

      const remaining = 1 - clamped;
      const currentSiblingSum = siblings.reduce(
        (acc, s) => acc + s.conditionalProb,
        0
      );

      const nextOverrides: Record<string, number> = {
        ...conditionalOverrides,
        [branchNodeId]: clamped,
      };
      siblings.forEach((s) => {
        const share =
          currentSiblingSum > 0
            ? s.conditionalProb / currentSiblingSum
            : 1 / siblings.length;
        nextOverrides[s.id] = Number((remaining * share).toFixed(4));
      });
      setConditionalOverrides(nextOverrides);
    },
    [nodeMap, computedNodes, conditionalOverrides]
  );

  // ============================================================================
  // BOTTOM 1/3 LIVE CAMERA-TRACKED BRANCHING RIVER VIEWPORT
  // ============================================================================
  const [camera, setCamera] = useState<ViewBoxCamera>(FULL_RIVER_VIEWBOX);
  const cameraRef = useRef<ViewBoxCamera>(FULL_RIVER_VIEWBOX);
  cameraRef.current = camera;
  const animFrameRef = useRef<number | null>(null);

  // Compute the optimal neighborhood camera box showing [Past Node] -> [Current Node] -> [Subsequent Connected Branches]
  const targetNeighborhoodCamera = useMemo((): ViewBoxCamera => {
    if (bottomCameraMode === "full" || !currentNode) {
      return FULL_RIVER_VIEWBOX;
    }

    const focusNodes: ComputedPresentNode[] = [currentNode];
    if (parentNode) focusNodes.push(parentNode);
    if (childNodes.length > 0) focusNodes.push(...childNodes);

    // If at root, also include grandchildren so the initial view shows 2 hops of forks
    if (!parentNode && childNodes.length > 0) {
      for (const c of childNodes) {
        const grandKids = computedNodes.filter((n) => n.parentId === c.id);
        focusNodes.push(...grandKids);
      }
    }

    // If at a terminal leaf, include siblings & grandparent so the fork into this endpoint is clear
    if (childNodes.length === 0 && parentNode) {
      focusNodes.push(...siblingNodes);
      if (parentNode.parentId) {
        const gp = nodeMap.get(parentNode.parentId);
        if (gp) focusNodes.push(gp);
      }
    }

    const minX = Math.min(...focusNodes.map((n) => n.x));
    const maxX = Math.max(...focusNodes.map((n) => n.x));
    const minY = Math.min(...focusNodes.map((n) => n.y));
    const maxY = Math.max(...focusNodes.map((n) => n.y));

    const padX = 215;
    const padY = 125;
    const rawW = clamp(maxX - minX + padX * 2, 680, 1860);
    const rawH = clamp(maxY - minY + padY * 2, 270, 720);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return {
      x: clamp(cx - rawW / 2, -50, FULL_RIVER_VIEWBOX.w - rawW + 80),
      y: clamp(cy - rawH / 2, -30, FULL_RIVER_VIEWBOX.h - rawH + 40),
      w: rawW,
      h: rawH,
    };
  }, [
    bottomCameraMode,
    currentNode,
    parentNode,
    childNodes,
    siblingNodes,
    computedNodes,
    nodeMap,
  ]);

  // Smoothly glide SVG camera whenever targetNeighborhoodCamera changes
  useEffect(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setCamera(targetNeighborhoodCamera);
      return;
    }

    const start = { ...cameraRef.current };
    const startTime = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      // Smooth cubic-bezier ease-out
      const ease = 1 - Math.pow(1 - t, 3);
      setCamera({
        x: start.x + (targetNeighborhoodCamera.x - start.x) * ease,
        y: start.y + (targetNeighborhoodCamera.y - start.y) * ease,
        w: start.w + (targetNeighborhoodCamera.w - start.w) * ease,
        h: start.h + (targetNeighborhoodCamera.h - start.h) * ease,
      });
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetNeighborhoodCamera]);

  // Semantic color palette per node (Flourish-style gradients + clear crimson for worse outcomes)
  const getNodeSemanticPalette = useCallback((node: ComputedPresentNode) => {
    const key = `${node.id} ${node.shortName}`.toLowerCase();
    if (
      key.includes("paperclip") ||
      key.includes("extinction") ||
      key.includes("takeover") ||
      key.includes("schemer") ||
      key.includes("disempowerment") ||
      key.includes("loss of control")
    ) {
      return {
        stroke: "#ff1e42",
        nodeFill: "#ff3355",
        text: "#fda4af",
        badgeBg: "bg-red-500/20 border-red-500/50 text-red-200",
        barColor: "#ef4444",
        isWorse: true,
      };
    }
    if (
      key.includes("dystopia") ||
      key.includes("panopticon") ||
      key.includes("feudal") ||
      key.includes("oligarchy") ||
      key.includes("misaligned") ||
      key.includes("theft") ||
      node.track === "race"
    ) {
      return {
        stroke: "#f43f5e",
        nodeFill: "#fb7185",
        text: "#fecdd3",
        badgeBg: "bg-rose-500/20 border-rose-500/50 text-rose-200",
        barColor: "#f43f5e",
        isWorse: true,
      };
    }
    if (
      key.includes("singularia") ||
      key.includes("asi gods") ||
      key.includes("em upload") ||
      key.includes("q3b-good")
    ) {
      return {
        stroke: "#847efa",
        nodeFill: "#a78bfa",
        text: "#ddd6fe",
        badgeBg: "bg-violet-500/20 border-violet-500/50 text-violet-200",
        barColor: "#8b5cf6",
        isWorse: false,
      };
    }
    if (
      key.includes("futurama") ||
      key.includes("citizen dividend") ||
      key.includes("tool ai") ||
      key.includes("q3a-good") ||
      node.track === "slowdown"
    ) {
      return {
        stroke: "#10b981",
        nodeFill: "#34d399",
        text: "#a7f3d0",
        badgeBg: "bg-emerald-500/20 border-emerald-500/50 text-emerald-200",
        barColor: "#10b981",
        isWorse: false,
      };
    }
    if (node.isDecisionFork) {
      return {
        stroke: "#f59e0b",
        nodeFill: "#fbbf24",
        text: "#fde68a",
        badgeBg: "bg-amber-500/20 border-amber-500/50 text-amber-200",
        barColor: "#f59e0b",
        isWorse: false,
      };
    }
    return {
      stroke: "#38bdf8",
      nodeFill: "#7dd3fc",
      text: "#bae6fd",
      badgeBg: "bg-sky-500/20 border-sky-500/50 text-sky-200",
      barColor: "#38bdf8",
      isWorse: false,
    };
  }, []);

  // Compute True Sankey Vertical Start Offsets for the bottom-third river
  const sankeyStartYByNodeId = useMemo(() => {
    const map = new Map<string, number>();
    const childrenByParent = new Map<string, ComputedPresentNode[]>();
    for (const n of computedNodes) {
      if (!n.parentId) continue;
      const list = childrenByParent.get(n.parentId) || [];
      list.push(n);
      childrenByParent.set(n.parentId, list);
    }
    for (const [pId, kids] of childrenByParent.entries()) {
      const p = nodeMap.get(pId);
      if (!p) continue;
      const sorted = [...kids].sort((a, b) => a.y - b.y);
      const widths = sorted.map((c) =>
        Math.max(3, Number((c.overallProb * 32).toFixed(1)))
      );
      const totalWidth = widths.reduce((a, b) => a + b, 0);
      let cursorY = p.y - totalWidth / 2;
      sorted.forEach((c, idx) => {
        const w = widths[idx];
        map.set(c.id, cursorY + w / 2);
        cursorY += w;
      });
    }
    return map;
  }, [computedNodes, nodeMap]);

  if (!currentNode) return null;

  const currentPalette = getNodeSemanticPalette(currentNode);
  const topArgument = nodeArguments[0] || null;
  const slideArchetypeLabel = currentNode.isDecisionFork
    ? "DECISION NODE SLIDE • CONDITIONAL FORK"
    : currentNode.isTerminalOutcome
    ? "TERMINAL WORLD ENDPOINT SLIDE"
    : "CAUSAL BRANCH TRAJECTORY SLIDE";

  return (
    <div
      className={`${
        embedded
          ? "fixed inset-0 z-50 overflow-y-auto bg-[#050811]/95 backdrop-blur-xl p-3 sm:p-5"
          : "min-h-[calc(100vh-54px)] bg-[#050811] p-3 sm:p-5"
      } text-slate-100 flex flex-col items-center select-none`}
    >
      {/* Top Studio Controls Bar (hidden in Clean Capture Mode) */}
      {!cleanMode ? (
        <div className="w-full max-w-[1440px] mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-2.5 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            {onCloseEmbedded && (
              <button
                type="button"
                onClick={onCloseEmbedded}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-amber-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Exit Present Mode</span>
              </button>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Branching Present Studio</span>
            </span>

            {/* Classic Conditional Probability Tree Selector */}
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
              {(
                [
                  {
                    id: "ai-2050-simple",
                    label: "AI 2050: 5 Worlds (Simple)",
                  },
                  {
                    id: "ai-2050-comprehensive",
                    label: "AI 2050: Deep Path (22 Nodes)",
                  },
                  {
                    id: "ai-2027",
                    label: "AI 2027: Oversight Fork",
                  },
                  {
                    id: "ai-2040",
                    label: "AI 2040: Plan A Crossroads",
                  },
                ] as { id: PresentTreeKey; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTreeKey(t.id);
                    setIsAutoPlaying(false);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    treeKey === t.id
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Slide Deck Filter Mode */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
              {(
                [
                  { id: "all", label: "All Branches & Forks" },
                  { id: "forks", label: "⚡ Decision Forks Only" },
                  { id: "worlds", label: "🏁 World Endpoints Only" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setTourFilter(f.id);
                    setIsAutoPlaying(false);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    tourFilter === f.id
                      ? "bg-sky-500/25 border border-sky-400/50 text-sky-200"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Play / Pause Cruise Button */}
            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                isAutoPlaying
                  ? "border-amber-400 bg-amber-500/25 text-amber-200"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-500/50"
              }`}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pause Tour</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Auto-Glide Tour</span>
                </>
              )}
            </button>

            {Object.keys(conditionalOverrides).length > 0 && (
              <button
                type="button"
                onClick={() => setConditionalOverrides({})}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Splits</span>
              </button>
            )}

            {/* Aspect Ratio Switcher */}
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setAspectRatio("16:9")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  aspectRatio === "16:9"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>16:9 Stage</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("9:16")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  aspectRatio === "9:16"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>9:16 Vertical</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCleanMode(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Clean Capture</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCleanMode(false)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-900/90 border border-amber-500/50 px-3.5 py-1.5 text-xs font-bold text-amber-300 shadow-xl"
        >
          Exit Clean Capture (Esc)
        </button>
      )}

      {/* ==================================================================== */}
      {/* MAIN PRESENTATION STAGE CONTAINER (TOP 2/3 SLIDE + BOTTOM 1/3 RIVER) */}
      {/* ==================================================================== */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 shadow-2xl transition-all ${
          currentNode.isDecisionFork
            ? "border-amber-500/55 bg-gradient-to-br from-[#0c1222] via-[#0f172a] to-[#1e1b38]"
            : currentPalette.isWorse
            ? "border-rose-500/55 bg-gradient-to-br from-[#160a14] via-[#0f1424] to-[#1f0c18]"
            : "border-emerald-500/45 bg-gradient-to-br from-[#071521] via-[#0c1829] to-[#141836]"
        } ${
          aspectRatio === "9:16"
            ? "w-full max-w-[460px] min-h-[840px]"
            : "w-full max-w-[1440px] min-h-[770px]"
        }`}
      >
        {/* ================================================================== */}
        {/* TOP 2/3 OF SLIDE: DIFFERENTIATED SLIDE ARCHETYPE STAGE             */}
        {/* ================================================================== */}
        <div className="fg-present-slide-stage flex-1 p-5 sm:p-7 flex flex-col justify-between gap-4">
          {/* Slide Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-extrabold uppercase tracking-wider ${
                  currentNode.isDecisionFork
                    ? "bg-amber-500/20 border-amber-400/60 text-amber-300"
                    : currentNode.isTerminalOutcome
                    ? currentPalette.badgeBg
                    : "bg-sky-500/20 border-sky-400/50 text-sky-300"
                }`}
              >
                {currentNode.isDecisionFork ? (
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                ) : currentNode.isTerminalOutcome ? (
                  <Trophy className="h-3.5 w-3.5" />
                ) : (
                  <GitBranch className="h-3.5 w-3.5 text-sky-400" />
                )}
                <span>{slideArchetypeLabel}</span>
              </span>

              <span className="rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 text-xs font-mono text-slate-300 tabular-nums">
                Slide {currentSlideIdx + 1} / {deckNodes.length} •{" "}
                {currentNode.dateTag}
              </span>

              {/* Causal Lineage Breadcrumb Pills */}
              <div className="hidden xl:flex items-center gap-1 text-[11px] font-mono text-slate-400">
                {causalChain.map((step, idx) => {
                  const isCurrent = step.id === currentNode.id;
                  return (
                    <React.Fragment key={step.id}>
                      {idx > 0 && <span className="text-slate-600">→</span>}
                      <button
                        type="button"
                        onClick={() =>
                          transitionToNode(
                            step.id,
                            idx < causalChain.length - 1 ? "backward" : "forward"
                          )
                        }
                        className={`rounded px-1.5 py-0.5 transition-colors ${
                          isCurrent
                            ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                            : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {step.shortName.length > 22
                          ? `${step.shortName.slice(0, 20)}…`
                          : step.shortName}{" "}
                        ({(step.overallProb * 100).toFixed(0)}%)
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Dual Probability Header Readout (Branch Conditional % + Overall %) */}
            <div className="flex items-center gap-2">
              {parentNode && (
                <div className="rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-1 text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Branch P(this | past)
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-sky-300 tabular-nums">
                    {(currentNode.conditionalProb * 100).toFixed(1)}%
                  </div>
                </div>
              )}
              <div
                className="rounded-xl border-2 px-3.5 py-1 text-right bg-slate-950/90"
                style={{ borderColor: currentPalette.stroke }}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  Overall Probability
                </div>
                <div
                  className="text-base sm:text-xl font-extrabold font-mono tabular-nums"
                  style={{ color: currentPalette.nodeFill }}
                >
                  {(currentNode.overallProb * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* ARCHETYPE 1: DECISION FORK SLIDE (Multiple Outgoing Branches)    */}
          {/* ================================================================ */}
          {currentNode.isDecisionFork ? (
            <div
              className={`grid gap-5 items-stretch ${
                aspectRatio === "9:16"
                  ? "grid-cols-1"
                  : "grid-cols-1 lg:grid-cols-12"
              }`}
            >
              {/* Left 5 Cols: Fork Visual Illustration + Question Crux */}
              <div
                className={`${
                  aspectRatio === "9:16" ? "" : "lg:col-span-5"
                } flex flex-col justify-between rounded-2xl border border-amber-500/35 bg-slate-950/80 p-4 space-y-3`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                      {sceneMetadata.atmosphereBadge}
                    </span>
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-mono text-amber-200 tabular-nums">
                      Reaches Fork: {(currentNode.overallProb * 100).toFixed(1)}%
                    </span>
                  </div>

                  <h1
                    ref={slideHeadingRef}
                    tabIndex={-1}
                    className="fg-present-slide-title text-xl sm:text-2xl font-extrabold text-white tracking-tight outline-none"
                  >
                    {canonicalNode?.title || currentNode.shortName}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {canonicalNode?.summary || sceneMetadata.visualTagline}
                  </p>
                </div>

                <BranchSceneArtwork
                  archetype={sceneMetadata.archetype}
                  accentColor={currentPalette.stroke}
                  secondaryColor="#10b981"
                  className="h-36 sm:h-44 w-full"
                />

                {/* Top Cited Forecaster Crux Quote */}
                {topArgument && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-amber-300">
                        @{topArgument.authorHandle}{" "}
                        {topArgument.externalPlatform
                          ? `• ${topArgument.externalPlatform}`
                          : ""}
                      </span>
                      {topArgument.externalSourceUrl && (
                        <a
                          href={topArgument.externalSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-sky-400 hover:underline"
                        >
                          <span>Source</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                      &ldquo;{topArgument.thesis}: {topArgument.reasoning}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Right 7 Cols: Outgoing Conditional Branches Comparison (Sum = 100%) */}
              <div
                className={`${
                  aspectRatio === "9:16" ? "" : "lg:col-span-7"
                } flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-3`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                      ⚡ Outgoing Conditional Branches (Sum = 100% of Fork)
                    </div>
                    <p className="text-xs text-slate-400">
                      Click any branch card to glide the presentation down that path, or drag a slider to test live What-If splits.
                    </p>
                  </div>
                  {parentNode && (
                    <button
                      type="button"
                      onClick={() => transitionToNode(parentNode.id, "backward")}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-300 hover:border-amber-400 hover:text-white"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>
                        Past: {parentNode.shortName} (
                        {(parentNode.overallProb * 100).toFixed(1)}%)
                      </span>
                    </button>
                  )}
                </div>

                {/* Combined 100% Proportional Split Bar */}
                <div className="space-y-1">
                  <div className="flex h-4 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900 p-0.5 gap-0.5">
                    {childNodes.map((child) => {
                      const pal = getNodeSemanticPalette(child);
                      return (
                        <div
                          key={child.id}
                          style={{
                            width: `${Math.max(4, child.conditionalProb * 100)}%`,
                            backgroundColor: pal.stroke,
                          }}
                          className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                          title={`${child.shortName}: ${(
                            child.conditionalProb * 100
                          ).toFixed(1)}% split`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Individual Outgoing Branch Cards */}
                <div
                  className={`grid gap-3 ${
                    childNodes.length >= 3
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {childNodes.map((child) => {
                    const pal = getNodeSemanticPalette(child);
                    const childCanon = allCanonicalNodes.find(
                      (n) => n.id === child.canonicalNodeId
                    );
                    const grandChildren = computedNodes.filter(
                      (n) => n.parentId === child.id
                    );

                    return (
                      <div
                        key={child.id}
                        className="flex flex-col justify-between rounded-2xl border bg-slate-900/90 p-3.5 transition-all hover:shadow-lg space-y-2.5"
                        style={{ borderColor: `${pal.stroke}66` }}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="inline-block rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase"
                              style={{
                                backgroundColor: `${pal.stroke}25`,
                                color: pal.nodeFill,
                                border: `1px solid ${pal.stroke}55`,
                              }}
                            >
                              {child.isTerminalOutcome
                                ? "🏁 Endpoint World"
                                : child.isDecisionFork
                                ? "⚡ Next Fork"
                                : "🌊 Branch Path"}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {child.dateTag}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-white leading-snug">
                            {child.shortName}
                          </h3>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {childCanon?.summary ||
                              resolveBranchSceneMetadata(
                                child.id,
                                child.shortName,
                                child.isDecisionFork,
                                child.isTerminalOutcome
                              ).visualTagline}
                          </p>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-800/80">
                          {/* Branch Split % vs Resulting Overall % */}
                          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/90 p-2 border border-slate-800/80">
                            <div>
                              <div className="text-[10px] font-mono uppercase text-slate-400">
                                Branch Split
                              </div>
                              <div
                                className="text-lg font-extrabold font-mono tabular-nums"
                                style={{ color: pal.nodeFill }}
                              >
                                {(child.conditionalProb * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-mono uppercase text-slate-400">
                                Overall Prob
                              </div>
                              <div className="text-lg font-extrabold font-mono text-white tabular-nums">
                                {(child.overallProb * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          {/* Interactive Live Slider for Conditional Split */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              Adjust Split:
                            </span>
                            <input
                              type="range"
                              min={2}
                              max={96}
                              value={Math.round(child.conditionalProb * 100)}
                              onChange={(e) =>
                                handleAdjustBranchSplit(
                                  child.id,
                                  Number(e.target.value) / 100
                                )
                              }
                              aria-label={`Adjust conditional probability for ${child.shortName}`}
                              className="fg-slider h-1.5 flex-1"
                              style={
                                {
                                  "--control-value": `${Math.round(
                                    child.conditionalProb * 100
                                  )}%`,
                                } as React.CSSProperties
                              }
                            />
                          </div>

                          {/* Subsequent Grandchildren Preview + Glide Button */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-[10px] font-mono text-slate-400 truncate">
                              {grandChildren.length > 0
                                ? `Leads to ${grandChildren.length} branches`
                                : "Terminal outcome"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                transitionToNode(child.id, "forward")
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-950 transition-transform hover:scale-105 shrink-0"
                              style={{ backgroundColor: pal.nodeFill }}
                            >
                              <span>Glide to Branch</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* ARCHETYPE 2 & 3: CAUSAL BRANCH SLIDE / TERMINAL WORLD SLIDE      */
            /* ================================================================ */
            <div
              className={`grid gap-5 items-stretch ${
                aspectRatio === "9:16"
                  ? "grid-cols-1"
                  : "grid-cols-1 lg:grid-cols-12"
              }`}
            >
              {/* Left 7 Cols: Rich Thematic Illustration + World/Branch Narrative */}
              <div
                className={`${
                  aspectRatio === "9:16" ? "" : "lg:col-span-7"
                } flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/85 p-4 sm:p-5 space-y-3`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{ color: currentPalette.nodeFill }}
                    >
                      {sceneMetadata.atmosphereBadge}
                    </span>
                    {nodeSourceLinks[0]?.url && (
                      <a
                        href={nodeSourceLinks[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-mono text-sky-300 hover:bg-sky-500/20"
                      >
                        <span>{nodeSourceLinks[0].title}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <h1
                    ref={slideHeadingRef}
                    tabIndex={-1}
                    className="fg-present-slide-title text-2xl sm:text-3xl font-extrabold text-white tracking-tight outline-none"
                  >
                    {canonicalNode?.title || currentNode.shortName}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {canonicalNode?.summary || sceneMetadata.visualTagline}
                  </p>
                </div>

                {/* Bespoke Scene Illustration */}
                <BranchSceneArtwork
                  archetype={sceneMetadata.archetype}
                  accentColor={currentPalette.stroke}
                  secondaryColor={
                    currentPalette.isWorse ? "#f59e0b" : "#38bdf8"
                  }
                  className="h-40 sm:h-48 w-full"
                />

                {/* Key World / Branch Telemetry Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {sceneMetadata.keyIndicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800/90 bg-slate-900/90 px-3 py-2"
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {ind.label}
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          ind.tone === "good"
                            ? "text-emerald-300"
                            : ind.tone === "bad"
                            ? "text-rose-300"
                            : ind.tone === "warn"
                            ? "text-amber-300"
                            : "text-sky-200"
                        }`}
                      >
                        {ind.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Bayesian Probability Derivation + Past/Next Connections + Cited Evidence */}
              <div
                className={`${
                  aspectRatio === "9:16" ? "" : "lg:col-span-5"
                } flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/85 p-4 sm:p-5 space-y-3`}
              >
                {/* Bayesian Conditional Probability Derivation Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                      Bayesian Branch Derivation
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      P(overall) = P(past) × P(branch | past)
                    </span>
                  </div>

                  {parentNode ? (
                    <div className="grid grid-cols-3 items-center gap-2 rounded-xl bg-slate-950 p-2.5 border border-slate-800 text-center font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Past Node
                        </div>
                        <div className="text-base font-bold text-slate-200 tabular-nums">
                          {(parentNode.overallProb * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-sky-400">
                          × Branch Split
                        </div>
                        <div className="text-base font-bold text-sky-300 tabular-nums">
                          {(currentNode.conditionalProb * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className="rounded-lg py-1 border"
                        style={{
                          borderColor: `${currentPalette.stroke}80`,
                          backgroundColor: `${currentPalette.stroke}18`,
                        }}
                      >
                        <div className="text-[10px] text-amber-300">
                          = Overall
                        </div>
                        <div
                          className="text-lg font-extrabold tabular-nums"
                          style={{ color: currentPalette.nodeFill }}
                        >
                          {(currentNode.overallProb * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-slate-300">
                      Root Starting Point (100% initial probability mass)
                    </div>
                  )}

                  {/* Interactive Split Adjuster if this branch has a parent */}
                  {parentNode && siblingNodes.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        Branch Split:
                      </span>
                      <input
                        type="range"
                        min={2}
                        max={96}
                        value={Math.round(currentNode.conditionalProb * 100)}
                        onChange={(e) =>
                          handleAdjustBranchSplit(
                            currentNode.id,
                            Number(e.target.value) / 100
                          )
                        }
                        aria-label={`Adjust branch probability for ${currentNode.shortName}`}
                        className="fg-slider h-1.5 flex-1"
                        style={
                          {
                            "--control-value": `${Math.round(
                              currentNode.conditionalProb * 100
                            )}%`,
                          } as React.CSSProperties
                        }
                      />
                      <span className="text-xs font-mono font-bold text-sky-300 tabular-nums w-11 text-right">
                        {(currentNode.conditionalProb * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Top Cited Community / Academic Argument */}
                {topArgument && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-300">
                        Cited Argument • @{topArgument.authorHandle}
                      </span>
                      {topArgument.externalSourceUrl && (
                        <a
                          href={topArgument.externalSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                        >
                          <span>{topArgument.externalPlatform || "Link"}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white">
                      {topArgument.thesis}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {topArgument.reasoning}
                    </p>
                  </div>
                )}

                {/* If Terminal World: Show Ranked Comparison Bar across All Endpoints; Otherwise Show Subsequent Connected Branches */}
                {currentNode.isTerminalOutcome ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                      Share of All Terminal World Outcomes (Sum = 100%)
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {rankedTerminalWorlds.slice(0, 6).map((w) => {
                        const wPal = getNodeSemanticPalette(w);
                        const isSelf = w.id === currentNode.id;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => transitionToNode(w.id, "forward")}
                            className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all ${
                              isSelf
                                ? "bg-slate-800 border border-amber-400/60 font-bold text-white"
                                : "bg-slate-950/70 text-slate-300 hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="truncate">{w.shortName}</span>
                            <span
                              className="font-mono font-bold tabular-nums shrink-0"
                              style={{ color: wPal.nodeFill }}
                            >
                              {(w.overallProb * 100).toFixed(1)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300">
                      Subsequent Connected Branches →
                    </div>
                    <div className="space-y-1.5">
                      {childNodes.map((child) => {
                        const cPal = getNodeSemanticPalette(child);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() =>
                              transitionToNode(child.id, "forward")
                            }
                            className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-700/80 bg-slate-950 hover:border-amber-400 px-3 py-2 text-left transition-all"
                          >
                            <div>
                              <div className="text-xs font-bold text-white">
                                {child.shortName}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                Branch Split:{" "}
                                {(child.conditionalProb * 100).toFixed(1)}% •
                                Overall: {(child.overallProb * 100).toFixed(1)}%
                              </div>
                            </div>
                            <span
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-950 shrink-0"
                              style={{ backgroundColor: cPal.nodeFill }}
                            >
                              <span>Follow</span>
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* BOTTOM 1/3 OF SLIDE: LIVE CAMERA-TRACKED BRANCHING RIVER SHOWCASE  */}
        {/* ================================================================== */}
        <div className="relative border-t-2 border-slate-800/90 bg-[#050811]/95 px-4 pt-2.5 pb-3 flex flex-col justify-between">
          {/* Bottom-Third Telemetry Strip: Past Node -> Focused Branch -> Subsequent Connected Branches */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-amber-500/15 border border-amber-500/35 px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-300">
                Live Branch Showcase
              </span>

              {/* 1. Past Node Button */}
              {parentNode ? (
                <button
                  type="button"
                  onClick={() => transitionToNode(parentNode.id, "backward")}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-300 hover:border-amber-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 text-amber-400" />
                  <span>
                    Past: <strong>{parentNode.shortName}</strong> (
                    {(parentNode.overallProb * 100).toFixed(1)}%)
                  </span>
                </button>
              ) : (
                <span className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-xs font-mono text-slate-400">
                  Origin Root (100%)
                </span>
              )}

              <span className="text-slate-600 font-bold">→</span>

              {/* 2. Active Focused Branch Pill */}
              <div
                className="inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1 text-xs font-mono font-bold bg-slate-950"
                style={{
                  borderColor: currentPalette.stroke,
                  color: currentPalette.nodeFill,
                }}
              >
                <span>● {currentNode.shortName}</span>
                {parentNode && (
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-sky-300">
                    Branch: {(currentNode.conditionalProb * 100).toFixed(1)}%
                  </span>
                )}
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-white">
                  Overall: {(currentNode.overallProb * 100).toFixed(1)}%
                </span>
              </div>

              {/* 3. Subsequent Connected Branches Pills */}
              {childNodes.length > 0 && (
                <>
                  <span className="text-slate-600 font-bold">→</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {childNodes.map((child) => {
                      const cPal = getNodeSemanticPalette(child);
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => transitionToNode(child.id, "forward")}
                          className="inline-flex items-center gap-1 rounded-lg border bg-slate-900/90 px-2.5 py-1 text-[11px] font-mono text-slate-200 hover:scale-105 transition-all"
                          style={{ borderColor: `${cPal.stroke}80` }}
                        >
                          <span>{child.shortName}</span>
                          <span
                            className="font-bold"
                            style={{ color: cPal.nodeFill }}
                          >
                            ({(child.conditionalProb * 100).toFixed(0)}% split →{" "}
                            {(child.overallProb * 100).toFixed(1)}%)
                          </span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Camera Zoom Mode Toggle + Slide Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setBottomCameraMode((m) =>
                    m === "neighborhood" ? "full" : "neighborhood"
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-300 hover:border-sky-400 hover:text-white"
              >
                {bottomCameraMode === "neighborhood" ? (
                  <>
                    <Maximize2 className="h-3 w-3 text-sky-400" />
                    <span>Show Full Tree Map</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="h-3 w-3 text-amber-400" />
                    <span>Zoom to Active Branch</span>
                  </>
                )}
              </button>

              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    goPrevSlide();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white hover:border-amber-400"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    goNextSlide();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  <span>Next Slide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Camera-Tracked SVG Branching River */}
          <div className="relative h-[185px] sm:h-[215px] w-full overflow-hidden rounded-2xl border border-slate-800/90 bg-[#070b14]">
            <svg
              viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`}
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-full"
            >
              <defs>
                {computedNodes.map((node) => {
                  if (!node.parentId) return null;
                  const parent = nodeMap.get(node.parentId);
                  if (!parent) return null;
                  const pPal = getNodeSemanticPalette(parent);
                  const cPal = getNodeSemanticPalette(node);
                  return (
                    <linearGradient
                      key={`pres-grad-${node.id}`}
                      id={`pres-grad-${node.id}`}
                       gradientUnits="userSpaceOnUse"
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                    >
                      <stop offset="0%" stopColor={pPal.stroke} />
                      <stop offset="100%" stopColor={cPal.stroke} />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* Subtle Vertical Timeline Guides */}
              {activeTimelineCols.map((col) => (
                <g key={col.year}>
                  <line
                    x1={col.x}
                    y1={35}
                    x2={col.x}
                    y2={685}
                    stroke="#1e293b"
                    strokeDasharray="4 6"
                    strokeWidth={1.2}
                  />
                  <text
                    x={col.x}
                    y={26}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={12}
                    fontFamily="monospace"
                    fontWeight={700}
                  >
                    {col.year}
                  </text>
                </g>
              ))}

              {/* 1. River Branch Ribbons */}
              {computedNodes.map((node) => {
                if (!node.parentId) return null;
                const parent = nodeMap.get(node.parentId);
                if (!parent) return null;

                const isFocusedBranch = node.id === currentNode.id;
                const isDirectChildBranch = node.parentId === currentNode.id;
                const isInCausalChain =
                  activeLineageSet.has(node.id) &&
                  activeLineageSet.has(parent.id);

                const strokeWidth = Math.max(
                  isFocusedBranch || isDirectChildBranch ? 6 : 3,
                  Number((node.overallProb * 34).toFixed(1))
                );

                const startY = sankeyStartYByNodeId.get(node.id) ?? parent.y;
                const dx = node.x - parent.x;
                const d = `M ${parent.x} ${startY} C ${
                  parent.x + dx * 0.45
                } ${startY}, ${parent.x + dx * 0.55} ${node.y}, ${node.x} ${
                  node.y
                }`;

                const midX = (parent.x + node.x) / 2;
                const midY = (startY + node.y) / 2;
                const cPal = getNodeSemanticPalette(node);

                return (
                  <g
                    key={`edge-${node.id}`}
                    onClick={() => transitionToNode(node.id, "forward")}
                    className="cursor-pointer"
                  >
                    {/* Outer Glow on Focused or Direct Child Branch */}
                    {(isFocusedBranch || isDirectChildBranch) && (
                      <path
                        d={d}
                        fill="none"
                        stroke={cPal.stroke}
                        strokeWidth={strokeWidth + 12}
                        strokeLinecap="round"
                        strokeOpacity={isFocusedBranch ? 0.28 : 0.16}
                      />
                    )}

                    {/* Main Gradient Ribbon */}
                    <path
                      d={d}
                      fill="none"
                      stroke={`url(#pres-grad-${node.id})`}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeOpacity={
                        isFocusedBranch
                          ? 1
                          : isDirectChildBranch
                          ? 0.92
                          : isInCausalChain
                          ? 0.8
                          : 0.2
                      }
                    />

                    {/* Animated Flow Pulse along Causal Chain */}
                    {(isFocusedBranch || isInCausalChain) && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={Math.max(2, strokeWidth * 0.28)}
                        strokeLinecap="round"
                        strokeOpacity={isFocusedBranch ? 0.75 : 0.4}
                        className="fg-river-flow-pulse pointer-events-none"
                      />
                    )}

                    {/* Floating Midpoint Split Pill on Active / Child Branches */}
                    {(isFocusedBranch || isDirectChildBranch) && (
                      <g transform={`translate(${midX}, ${midY - 14})`}>
                        <rect
                          x={-54}
                          y={-11}
                          width={108}
                          height={20}
                          rx={6}
                          fill="#090d16"
                          fillOpacity={0.92}
                          stroke={cPal.stroke}
                          strokeWidth={1.3}
                        />
                        <text
                          x={0}
                          y={3}
                          textAnchor="middle"
                          fill={cPal.nodeFill}
                          fontSize={10.5}
                          fontFamily="monospace"
                          fontWeight={800}
                        >
                          {(node.conditionalProb * 100).toFixed(0)}% split →{" "}
                          {(node.overallProb * 100).toFixed(1)}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 2. River Nodes & Labels */}
              {computedNodes.map((node) => {
                const isCurrent = node.id === currentNode.id;
                const isPast = node.id === parentNode?.id;
                const isNextChild = node.parentId === currentNode.id;
                const isHighlighted =
                  isCurrent ||
                  isPast ||
                  isNextChild ||
                  activeLineageSet.has(node.id);
                const pal = getNodeSemanticPalette(node);
                const r = isCurrent ? 15 : isPast || isNextChild ? 12 : 8.5;

                const labelYOffset =
                  node.labelPosition === "bottom" ? r + 18 : -(r + 12);

                return (
                  <g
                    key={`node-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() =>
                      transitionToNode(
                        node.id,
                        node.x < currentNode.x ? "backward" : "forward"
                      )
                    }
                    className="cursor-pointer"
                    style={{ opacity: isHighlighted ? 1 : 0.26 }}
                  >
                    {isCurrent && (
                      <circle
                        r={r + 9}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={2.5}
                        strokeDasharray="5 4"
                      />
                    )}
                    <circle
                      r={r}
                      fill="#090d16"
                      stroke={isCurrent ? "#fbbf24" : pal.stroke}
                      strokeWidth={isCurrent ? 4 : 2.8}
                    />
                    <circle
                      r={Math.max(3.5, r - 5)}
                      fill={isCurrent ? "#fbbf24" : pal.nodeFill}
                    />

                    {/* Role Pill above/below focused neighborhood nodes */}
                    {(isCurrent || isPast || isNextChild) && (
                      <g transform={`translate(0, ${labelYOffset})`}>
                        <rect
                          x={-92}
                          y={-13}
                          width={184}
                          height={24}
                          rx={6}
                          fill="#050811"
                          fillOpacity={0.92}
                          stroke={isCurrent ? "#fbbf24" : pal.stroke}
                          strokeWidth={isCurrent ? 1.6 : 1}
                        />
                        <text
                          x={0}
                          y={3}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={11}
                          fontWeight={800}
                        >
                          {node.shortName.length > 22
                            ? `${node.shortName.slice(0, 20)}…`
                            : node.shortName}{" "}
                          ({(node.overallProb * 100).toFixed(1)}%)
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
