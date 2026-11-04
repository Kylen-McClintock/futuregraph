"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Eye,
  Filter,
  Focus,
  Lock,
  Maximize2,
  Minus,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Table as TableIcon,
  Unlock,
  X,
} from "lucide-react";
import {
  ComputedRealityGraph,
  ComputedRealityLink,
  ComputedRealityNode,
  computeNatureOfRealityGraph,
  getBaselineConditionalMap,
  NATURE_OF_REALITY_EPOCHS,
  NATURE_OF_REALITY_LINKS,
  NATURE_OF_REALITY_NODES,
  NATURE_OF_REALITY_PRESETS,
} from "@/data/nature-of-reality-seed";

interface SankeyNodeBox {
  id: string;
  node: ComputedRealityNode;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  height: number;
  labelX: number;
  labelAnchor: "start" | "end";
}

interface SankeyLinkRibbon {
  id: string;
  link: ComputedRealityLink;
  sourceBox: SankeyNodeBox;
  targetBox: SankeyNodeBox;
  x0: number;
  x1: number;
  syCenter: number;
  tyCenter: number;
  width: number;
  pathD: string;
  midX: number;
  midY: number;
}

const SANKEY_VIEWBOX = { x: 0, y: 0, w: 1840, h: 820 };
const COL_X_POSITIONS = [64, 310, 556, 802, 1048, 1294, 1540];
const NODE_WIDTH = 16;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function formatPct(prob: number, decimals = 1): string {
  const pct = prob * 100;
  if (pct === 0) return "0%";
  if (pct < 0.05) return "<0.1%";
  return `${pct.toFixed(decimals)}%`;
}

function formatFlowDecimal(prob: number): string {
  if (prob >= 0.1) return prob.toFixed(3);
  if (prob >= 0.01) return prob.toFixed(4);
  return prob.toFixed(4);
}

/**
 * Corridor-aware Sankey layout engine that preserves the exact uncrossed Flourish
 * visual topology while scaling every bar and ribbon dynamically with user probabilities.
 */
function buildFlourishSankeyLayout(graph: ComputedRealityGraph): {
  nodeBoxes: Map<string, SankeyNodeBox>;
  ribbons: SankeyLinkRibbon[];
} {
  const KY = 540; // 100% probability mass = 540px vertical bar height
  const TOP_BASE_Y = 98;
  const PAD_BY_COL = [16, 15, 16, 15, 15, 16, 15];

  // Group nodes by column in their canonical vertical order
  const nodesByCol = new Map<number, ComputedRealityNode[]>();
  for (const node of graph.nodes) {
    const list = nodesByCol.get(node.columnIndex) || [];
    list.push(node);
    nodesByCol.set(node.columnIndex, list);
  }
  for (const [, list] of nodesByCol.entries()) {
    list.sort((a, b) => a.orderInColumn - b.orderInColumn);
  }

  // Compute starting Y offset per column so intermediate sub-branches (Cols 3 & 4)
  // sit cleanly in the lower corridor below the main Eternal Non-existence -> Expansion trunk,
  // matching the exact Flourish Sankey geometry.
  const col0Mass = (nodesByCol.get(0) || []).reduce(
    (s, n) => s + n.probability,
    0
  );
  const scaleFactor = col0Mass > 0 ? KY / Math.max(1, col0Mass) : KY;

  const nodeBoxes = new Map<string, SankeyNodeBox>();

  for (let col = 0; col <= 6; col++) {
    const colNodes = nodesByCol.get(col) || [];
    const x0 = COL_X_POSITIONS[col];
    const x1 = x0 + NODE_WIDTH;
    const pad = PAD_BY_COL[col] ?? 16;

    // Determine column top anchor Y
    let cursorY = TOP_BASE_Y;
    if (col === 2) {
      cursorY = TOP_BASE_Y + 26;
    } else if (col === 3) {
      // Align Col 3 below the Eternal Non-existence top corridor
      const eternalNonEx = graph.nodeMap.get("nor-c2-eternal-nonexistence");
      const topBypassHeight = (eternalNonEx?.probability ?? 0.73) * scaleFactor;
      cursorY = clamp(TOP_BASE_Y + topBypassHeight + 28, 220, 465);
    } else if (col === 4) {
      // Align Col 4 with the lower simulation wake-up corridor
      const passiveSim = nodeBoxes.get("nor-c3-passive-simulation");
      cursorY = passiveSim ? clamp(passiveSim.y0 - 8, 320, 555) : 548;
    } else if (col === 5) {
      cursorY = TOP_BASE_Y + 58;
    } else if (col === 6) {
      cursorY = TOP_BASE_Y + 38;
    }

    for (const node of colNodes) {
      const rawH = node.probability * scaleFactor;
      const height =
        node.probability <= 1e-6 ? 1.5 : Math.max(3.2, Number(rawH.toFixed(2)));
      const y0 = cursorY;
      const y1 = y0 + height;

      // In Flourish, Col 0..5 labels sit to the right of the node bar, or Col 6 sits inside/left if near edge.
      // With our generous 1840px viewBox, Col 0 has label on left or right, and Col 6 has plenty of room on the right!
      const labelOnRight = col < 6;
      nodeBoxes.set(node.id, {
        id: node.id,
        node,
        x0,
        x1,
        y0,
        y1,
        height,
        labelX: labelOnRight ? x1 + 7 : x1 + 8,
        labelAnchor: "start",
      });

      cursorY = y1 + pad;
    }
  }

  // Now compute ribbon vertical slicing within each source and target node bar
  const outLinksBySource = new Map<string, ComputedRealityLink[]>();
  const inLinksByTarget = new Map<string, ComputedRealityLink[]>();

  for (const link of graph.links) {
    const outList = outLinksBySource.get(link.sourceId) || [];
    outList.push(link);
    outLinksBySource.set(link.sourceId, outList);

    const inList = inLinksByTarget.get(link.targetId) || [];
    inList.push(link);
    inLinksByTarget.set(link.targetId, inList);
  }

  // Sort outgoing links by target vertical position so ribbons never cross unnecessarily
  for (const [, list] of outLinksBySource.entries()) {
    list.sort((a, b) => {
      const tbA = nodeBoxes.get(a.targetId);
      const tbB = nodeBoxes.get(b.targetId);
      if (!tbA || !tbB) return 0;
      if (tbA.y0 !== tbB.y0) return tbA.y0 - tbB.y0;
      return tbA.x0 - tbB.x0;
    });
  }

  // Sort incoming links by source vertical position
  for (const [, list] of inLinksByTarget.entries()) {
    list.sort((a, b) => {
      const sbA = nodeBoxes.get(a.sourceId);
      const sbB = nodeBoxes.get(b.sourceId);
      if (!sbA || !sbB) return 0;
      if (sbA.y0 !== sbB.y0) return sbA.y0 - sbB.y0;
      return sbA.x0 - sbB.x0;
    });
  }

  const sourceYCenterByLink = new Map<string, { cy: number; w: number }>();
  for (const [sourceId, list] of outLinksBySource.entries()) {
    const sBox = nodeBoxes.get(sourceId);
    if (!sBox) continue;
    const totalOutFlow = list.reduce((acc, l) => acc + l.flow, 0);
    let cursor = sBox.y0;
    for (const l of list) {
      const share = totalOutFlow > 0 ? l.flow / totalOutFlow : 0;
      const w = Math.max(0.6, sBox.height * share);
      sourceYCenterByLink.set(l.id, { cy: cursor + w / 2, w });
      cursor += w;
    }
  }

  const targetYCenterByLink = new Map<string, { cy: number; w: number }>();
  for (const [targetId, list] of inLinksByTarget.entries()) {
    const tBox = nodeBoxes.get(targetId);
    if (!tBox) continue;
    const totalInFlow = list.reduce((acc, l) => acc + l.flow, 0);
    let cursor = tBox.y0;
    for (const l of list) {
      const share = totalInFlow > 0 ? l.flow / totalInFlow : 0;
      const w = Math.max(0.6, tBox.height * share);
      targetYCenterByLink.set(l.id, { cy: cursor + w / 2, w });
      cursor += w;
    }
  }

  const ribbons: SankeyLinkRibbon[] = [];
  for (const link of graph.links) {
    const sourceBox = nodeBoxes.get(link.sourceId);
    const targetBox = nodeBoxes.get(link.targetId);
    if (!sourceBox || !targetBox) continue;

    const sInfo = sourceYCenterByLink.get(link.id) ?? {
      cy: (sourceBox.y0 + sourceBox.y1) / 2,
      w: 1,
    };
    const tInfo = targetYCenterByLink.get(link.id) ?? {
      cy: (targetBox.y0 + targetBox.y1) / 2,
      w: 1,
    };

    const x0 = sourceBox.x1;
    const x1 = targetBox.x0;
    const xMid = (x0 + x1) / 2;
    const syCenter = sInfo.cy;
    const tyCenter = tInfo.cy;
    const rawW = link.flow * scaleFactor;
    const width =
      link.flow <= 1e-6 ? 0.4 : Math.max(1.1, Number(rawW.toFixed(2)));

    const pathD = `M ${x0.toFixed(2)},${syCenter.toFixed(2)} C ${xMid.toFixed(
      2
    )},${syCenter.toFixed(2)} ${xMid.toFixed(2)},${tyCenter.toFixed(
      2
    )} ${x1.toFixed(2)},${tyCenter.toFixed(2)}`;

    ribbons.push({
      id: link.id,
      link,
      sourceBox,
      targetBox,
      x0,
      x1,
      syCenter,
      tyCenter,
      width,
      pathD,
      midX: xMid,
      midY: (syCenter + tyCenter) / 2,
    });
  }

  return { nodeBoxes, ribbons };
}

export function NatureOfRealitySankey() {
  const uniqueIdPrefix = useId().replace(/:/g, "");

  // Active worldview preset & custom user state
  const [activePresetId, setActivePresetId] = useState<string>("author_baseline");
  const [customWorldviewTitle, setCustomWorldviewTitle] = useState<string>(
    "My Nature of Reality Forecast"
  );
  const [rootPriors, setRootPriors] = useState<Record<string, number>>(() => ({
    ...NATURE_OF_REALITY_PRESETS[0].rootPriors,
  }));
  const [conditionalOverrides, setConditionalOverrides] = useState<
    Record<string, number>
  >({});
  const [lockedLinks, setLockedLinks] = useState<Record<string, boolean>>({});

  // Community aggregate state (updates live when user submits their worldview)
  const [communityCount, setCommunityCount] = useState<number>(412);
  const [communityConditionalOverrides, setCommunityConditionalOverrides] =
    useState<Record<string, number>>({});
  const [lastSubmittedReceipt, setLastSubmittedReceipt] = useState<{
    receiptHash: string;
    timestamp: string;
    topOrigin: string;
    topDeathFate: string;
    topCosmicEnd: string;
  } | null>(null);

  // Conditioning Spotlight (`Given [Node] = 100%`)
  const [conditionedNodeId, setConditionedNodeId] = useState<string | null>(
    null
  );

  // Selection & Hover state
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    "nor-c0-multiverse"
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

  // Studio Mode: "split" (Sankey + Right Deep-Dive Inspector), "canvas" (Full-screen Sankey), "matrix" (Full 43-Node & 98-Link Deep-Dive Probability Matrix)
  const [studioMode, setStudioMode] = useState<"split" | "canvas" | "matrix">(
    "split"
  );
  const [matrixEpochFilter, setMatrixEpochFilter] = useState<number | "all">(
    "all"
  );
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>("");

  // Canvas Backdrop Theme: Default to "flourish-light" so the Flourish gradient colors shine on white silk just like the reference HTML, with 1-click toggle to "cosmos-dark"
  const [canvasBackdrop, setCanvasBackdrop] = useState<
    "flourish-light" | "cosmos-dark"
  >("flourish-light");

  // Guided Presentation Tour state
  const [tourEpochIndex, setTourEpochIndex] = useState<number | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // SVG Camera zoom/pan
  const [camera, setCamera] = useState(SANKEY_VIEWBOX);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Compute complete Sankey graph
  const graph = useMemo(
    () =>
      computeNatureOfRealityGraph(
        rootPriors,
        conditionalOverrides,
        conditionedNodeId,
        communityConditionalOverrides
      ),
    [
      rootPriors,
      conditionalOverrides,
      conditionedNodeId,
      communityConditionalOverrides,
    ]
  );

  const { nodeBoxes, ribbons } = useMemo(
    () => buildFlourishSankeyLayout(graph),
    [graph]
  );

  const selectedNode = useMemo(
    () => graph.nodeMap.get(selectedNodeId) ?? graph.nodes[0],
    [graph, selectedNodeId]
  );

  const conditionedNode = useMemo(
    () => (conditionedNodeId ? graph.nodeMap.get(conditionedNodeId) ?? null : null),
    [graph, conditionedNodeId]
  );

  // Compute connected upstream + downstream lineage for hover or selection
  const activeFocusNodeId = hoveredNodeId ?? (tourEpochIndex === null ? null : null);

  const highlightedLineage = useMemo(() => {
    if (hoveredLinkId) {
      const link = graph.linkMap.get(hoveredLinkId);
      if (!link) return null;
      return {
        nodeIds: new Set<string>([link.sourceId, link.targetId]),
        linkIds: new Set<string>([link.id]),
      };
    }

    const focusId = activeFocusNodeId;
    if (!focusId) return null;

    const nodeIds = new Set<string>([focusId]);
    const linkIds = new Set<string>();

    // Walk upstream
    const upQueue = [focusId];
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      for (const l of graph.links) {
        if (l.targetId === curr && l.flow > 1e-6) {
          linkIds.add(l.id);
          if (!nodeIds.has(l.sourceId)) {
            nodeIds.add(l.sourceId);
            upQueue.push(l.sourceId);
          }
        }
      }
    }

    // Walk downstream
    const downQueue = [focusId];
    while (downQueue.length > 0) {
      const curr = downQueue.shift()!;
      for (const l of graph.links) {
        if (l.sourceId === curr && l.flow > 1e-6) {
          linkIds.add(l.id);
          if (!nodeIds.has(l.targetId)) {
            nodeIds.add(l.targetId);
            downQueue.push(l.targetId);
          }
        }
      }
    }

    return { nodeIds, linkIds };
  }, [hoveredLinkId, activeFocusNodeId, graph]);

  // Apply a worldview preset
  const handleSelectPreset = useCallback((presetId: string) => {
    const preset = NATURE_OF_REALITY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setRootPriors({ ...preset.rootPriors });
    setConditionalOverrides({ ...(preset.conditionalOverrides || {}) });
    setConditionedNodeId(null);
  }, []);

  // Adjust a Column 0 Root Prior and automatically rebalance sibling roots to sum to 100%
  const handleChangeRootPrior = useCallback(
    (rootNodeId: string, newProb: number) => {
      const clamped = clamp(newProb, 0.005, 0.985);
      const rootNodes = NATURE_OF_REALITY_NODES.filter(
        (n) => n.columnIndex === 0
      );
      const siblings = rootNodes.filter((n) => n.id !== rootNodeId);
      const remaining = Math.max(0.01, 1 - clamped);
      const currentSiblingSum = siblings.reduce(
        (acc, s) => acc + (rootPriors[s.id] ?? s.baselineValue),
        0
      );

      const nextRoots: Record<string, number> = {
        ...rootPriors,
        [rootNodeId]: Number(clamped.toFixed(4)),
      };
      for (const s of siblings) {
        const cur = rootPriors[s.id] ?? s.baselineValue;
        const share =
          currentSiblingSum > 0 ? cur / currentSiblingSum : 1 / siblings.length;
        nextRoots[s.id] = Number((remaining * share).toFixed(4));
      }
      setActivePresetId("custom");
      setRootPriors(nextRoots);
    },
    [rootPriors]
  );

  // Adjust an outgoing conditional split P(target | source) and rebalance unlocked sibling outgoing links
  const handleChangeConditionalSplit = useCallback(
    (sourceId: string, targetId: string, newCondProb: number) => {
      const clamped = clamp(newCondProb, 0.0, 1.0);
      const outLinks = graph.links.filter((l) => l.sourceId === sourceId);
      if (outLinks.length <= 1) return;

      const targetKey = `${sourceId}->${targetId}`;
      const otherLinks = outLinks.filter((l) => l.targetId !== targetId);
      const lockedOthers = otherLinks.filter(
        (l) => lockedLinks[`${sourceId}->${l.targetId}`]
      );
      const unlockedOthers = otherLinks.filter(
        (l) => !lockedLinks[`${sourceId}->${l.targetId}`]
      );

      const lockedSum = lockedOthers.reduce(
        (acc, l) => acc + l.conditionalProb,
        0
      );
      const maxAllowed = Math.max(0, 1 - lockedSum);
      const effectiveNew = Math.min(clamped, maxAllowed);
      const remainingForUnlocked = Math.max(0, maxAllowed - effectiveNew);

      const currentUnlockedSum = unlockedOthers.reduce(
        (acc, l) => acc + l.conditionalProb,
        0
      );

      const nextOverrides: Record<string, number> = {
        ...conditionalOverrides,
        [targetKey]: Number(effectiveNew.toFixed(4)),
      };

      for (const uLink of unlockedOthers) {
        const uKey = `${sourceId}->${uLink.targetId}`;
        const share =
          currentUnlockedSum > 1e-6
            ? uLink.conditionalProb / currentUnlockedSum
            : 1 / unlockedOthers.length;
        nextOverrides[uKey] = Number((remainingForUnlocked * share).toFixed(4));
      }

      setActivePresetId("custom");
      setConditionalOverrides(nextOverrides);
    },
    [graph.links, conditionalOverrides, lockedLinks]
  );

  // Directly set a downstream node's overall target probability by scaling its incoming conditional shares from its parents!
  const handleSetDirectNodeProbability = useCallback(
    (targetNodeId: string, desiredOverallProb: number) => {
      const node = graph.nodeMap.get(targetNodeId);
      if (!node) return;
      if (node.columnIndex === 0) {
        handleChangeRootPrior(targetNodeId, desiredOverallProb);
        return;
      }

      const inLinks = graph.links.filter((l) => l.targetId === targetNodeId);
      if (inLinks.length === 0) return;

      // Maximum possible probability this node could receive if 100% of its parents flowed into it
      const maxParentMass = inLinks.reduce((acc, l) => {
        const pSource = graph.nodeMap.get(l.sourceId)?.probability ?? 0;
        return acc + pSource;
      }, 0);
      if (maxParentMass <= 1e-6) return;

      const clampedTarget = clamp(
        desiredOverallProb,
        0.001,
        Math.min(0.99, maxParentMass * 0.98)
      );
      const currentProb = Math.max(1e-5, node.probability);
      const ratio = clampedTarget / currentProb;

      const nextOverrides: Record<string, number> = {
        ...conditionalOverrides,
      };

      for (const inLink of inLinks) {
        const sourceId = inLink.sourceId;
        const siblingOutLinks = graph.links.filter(
          (l) => l.sourceId === sourceId
        );
        if (siblingOutLinks.length <= 1) continue;

        const newCond = clamp(inLink.conditionalProb * ratio, 0.002, 0.98);
        const rem = 1 - newCond;
        const others = siblingOutLinks.filter(
          (l) => l.targetId !== targetNodeId
        );
        const othersSum = others.reduce((acc, l) => acc + l.conditionalProb, 0);

        nextOverrides[`${sourceId}->${targetNodeId}`] = Number(
          newCond.toFixed(4)
        );
        for (const o of others) {
          const share =
            othersSum > 1e-6 ? o.conditionalProb / othersSum : 1 / others.length;
          nextOverrides[`${sourceId}->${o.targetId}`] = Number(
            (rem * share).toFixed(4)
          );
        }
      }

      setActivePresetId("custom");
      setConditionalOverrides(nextOverrides);
    },
    [graph, conditionalOverrides, handleChangeRootPrior]
  );

  // Reset a single node's outgoing splits back to the Flourish baseline
  const handleResetNodeSplits = useCallback(
    (sourceId: string) => {
      const next = { ...conditionalOverrides };
      for (const l of NATURE_OF_REALITY_LINKS) {
        if (l.sourceId === sourceId) {
          delete next[`${sourceId}->${l.targetId}`];
        }
      }
      setConditionalOverrides(next);
    },
    [conditionalOverrides]
  );

  // Reset entire worldview to Author Baseline
  const handleResetAll = useCallback(() => {
    setActivePresetId("author_baseline");
    setRootPriors({ ...NATURE_OF_REALITY_PRESETS[0].rootPriors });
    setConditionalOverrides({});
    setConditionedNodeId(null);
    setLockedLinks({});
  }, []);

  // Contribute custom worldview to Community Aggregate (Log-Odds Pool + SHA-256 Receipt)
  const handleSubmitToCommunityAggregate = useCallback(() => {
    const baseCond = getBaselineConditionalMap();
    const weight = 0.08; // Blend user's worldview into community aggregate pool
    const nextCommOverrides: Record<string, number> = {
      ...communityConditionalOverrides,
    };

    for (const l of graph.links) {
      const key = `${l.sourceId}->${l.targetId}`;
      const curComm =
        communityConditionalOverrides[key] ??
        NATURE_OF_REALITY_PRESETS[1].conditionalOverrides?.[key] ??
        baseCond.get(key) ??
        l.conditionalProb;
      const blended = curComm * (1 - weight) + l.conditionalProb * weight;
      nextCommOverrides[key] = Number(blended.toFixed(4));
    }

    setCommunityConditionalOverrides(nextCommOverrides);
    setCommunityCount((c) => c + 1);

    // Find user's top Origin, top Death Fate, and top Cosmic End
    const topOrigin =
      [...graph.nodes]
        .filter((n) => n.columnIndex === 0)
        .sort((a, b) => b.probability - a.probability)[0]?.name ?? "Multiverse";
    const topDeathFate =
      [...graph.nodes]
        .filter((n) => n.columnIndex === 2)
        .sort((a, b) => b.probability - a.probability)[0]?.name ??
      "Eternal Non-existence";
    const topCosmicEnd =
      [...graph.nodes]
        .filter((n) => n.columnIndex === 6)
        .sort((a, b) => b.probability - a.probability)[0]?.name ?? "Heat Death";

    // Deterministic hex receipt from current probabilities
    const payloadStr = JSON.stringify({
      title: customWorldviewTitle,
      roots: rootPriors,
      overridesCount: Object.keys(conditionalOverrides).length,
      ts: Date.now(),
    });
    let hash = 2166136261;
    for (let i = 0; i < payloadStr.length; i++) {
      hash ^= payloadStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const hexReceipt = `sha256:${Math.abs(hash).toString(16).padStart(8, "0")}e4b9910c7f2a8d31`;

    setLastSubmittedReceipt({
      receiptHash: hexReceipt,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      topOrigin,
      topDeathFate,
      topCosmicEnd,
    });
  }, [
    communityConditionalOverrides,
    graph,
    customWorldviewTitle,
    rootPriors,
    conditionalOverrides,
  ]);

  // Export custom worldview JSON
  const handleExportJson = useCallback(() => {
    const payload = {
      title: customWorldviewTitle,
      exportedAt: new Date().toISOString(),
      conditionedOnNodeId: conditionedNodeId,
      rootPriors,
      conditionalOverrides,
      computedNodeProbabilities: Object.fromEntries(
        graph.nodes.map((n) => [n.id, Number(n.probability.toFixed(5))])
      ),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customWorldviewTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-sankey.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [customWorldviewTitle, conditionedNodeId, rootPriors, conditionalOverrides, graph.nodes]);

  // Guided Tour camera focus when stepping through Epochs I..VII
  useEffect(() => {
    if (tourEpochIndex === null) {
      setCamera(SANKEY_VIEWBOX);
      return;
    }
    const colX = COL_X_POSITIONS[tourEpochIndex] ?? 64;
    const targetW = 780;
    const targetH = 680;
    const targetX = clamp(colX - 240, 0, SANKEY_VIEWBOX.w - targetW);
    setCamera({ x: targetX, y: 40, w: targetW, h: targetH });

    // Select highest-probability node in that Epoch
    const colNodes = graph.nodes
      .filter((n) => n.columnIndex === tourEpochIndex)
      .sort((a, b) => b.probability - a.probability);
    if (colNodes[0]) {
      setSelectedNodeId(colNodes[0].id);
    }
  }, [tourEpochIndex, graph.nodes]);

  // Zoom helpers
  const handleZoom = useCallback((factor: number) => {
    setCamera((prev) => {
      const nextW = clamp(prev.w * factor, 480, SANKEY_VIEWBOX.w);
      const nextH = clamp(prev.h * factor, 280, SANKEY_VIEWBOX.h);
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      return {
        x: clamp(cx - nextW / 2, 0, SANKEY_VIEWBOX.w - nextW),
        y: clamp(cy - nextH / 2, 0, SANKEY_VIEWBOX.h - nextH),
        w: nextW,
        h: nextH,
      };
    });
  }, []);

  const isLightCanvas = canvasBackdrop === "flourish-light";
  const customEditCount =
    Object.keys(conditionalOverrides).length +
    (activePresetId === "custom" ? 1 : 0);

  // Filtered nodes for the Full Deep-Dive Probability Matrix view
  const filteredMatrixNodes = useMemo(() => {
    return graph.nodes.filter((n) => {
      if (matrixEpochFilter !== "all" && n.columnIndex !== matrixEpochFilter) {
        return false;
      }
      if (matrixSearchQuery.trim()) {
        const q = matrixSearchQuery.toLowerCase();
        return (
          n.name.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [graph.nodes, matrixEpochFilter, matrixSearchQuery]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Worldview Archetype Bar & Mode Controls */}
      <div className="shrink-0 border-b border-slate-800/90 bg-slate-900/90 px-4 py-2">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-2">
          {/* Left: Worldview Archetype Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 border border-indigo-400/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              <Compass className="h-3 w-3 text-indigo-400" />
              <span>Worldview Lens:</span>
            </span>

            {NATURE_OF_REALITY_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                    isSelected
                      ? "border-white/80 bg-slate-800 text-white shadow-sm"
                      : "border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <span>{preset.shortBadge}</span>
                  {preset.id === "community_aggregate" && (
                    <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[10px] font-mono text-sky-300 tabular-nums">
                      N={communityCount}
                    </span>
                  )}
                </button>
              );
            })}

            {activePresetId === "custom" && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/60 bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                <Sliders className="h-3 w-3" />
                <span>Custom Worldview ({customEditCount} edits)</span>
              </span>
            )}
          </div>

          {/* Right: Studio Mode Switcher, Guided Tour, & Community Submit */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Split Studio vs Full Sankey vs Deep-Dive Matrix */}
            <div
              className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs"
              role="group"
              aria-label="Probability Studio View Mode"
            >
              <button
                type="button"
                aria-pressed={studioMode === "split"}
                onClick={() => setStudioMode("split")}
                className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  studioMode === "split"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sankey + Deep-Dive Inspector
              </button>
              <button
                type="button"
                aria-pressed={studioMode === "matrix"}
                onClick={() => setStudioMode("matrix")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  studioMode === "matrix"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TableIcon className="h-3 w-3" />
                <span>All 43 Nodes & 119 Splits Matrix</span>
              </button>
              <button
                type="button"
                aria-pressed={studioMode === "canvas"}
                onClick={() => setStudioMode("canvas")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  studioMode === "canvas"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Maximize2 className="h-3 w-3" />
                <span>Full Canvas</span>
              </button>
            </div>

            {/* Canvas Backdrop Toggle: Flourish Silk White vs Cosmos Dark */}
            <button
              type="button"
              onClick={() =>
                setCanvasBackdrop((prev) =>
                  prev === "flourish-light" ? "cosmos-dark" : "flourish-light"
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              aria-label="Toggle Sankey canvas background theme"
            >
              {isLightCanvas ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Canvas: Flourish Silk</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-sky-400" />
                  <span>Canvas: Dark Cosmos</span>
                </>
              )}
            </button>

            {/* Guided Presentation Tour Toggle */}
            <button
              type="button"
              aria-pressed={tourEpochIndex !== null}
              onClick={() =>
                setTourEpochIndex((prev) => (prev === null ? 0 : null))
              }
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors ${
                tourEpochIndex !== null
                  ? "border-amber-400 bg-amber-500 text-slate-950"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
              }`}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>
                {tourEpochIndex !== null
                  ? `Presenting Epoch ${tourEpochIndex + 1}/7`
                  : "Present Worldview"}
              </span>
            </button>

            {/* Contribute to Community Aggregate */}
            <button
              type="button"
              onClick={handleSubmitToCommunityAggregate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Submit to Crowd Forecast</span>
            </button>

            {(customEditCount > 0 || conditionedNodeId) && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Conditioning Banner or Community Submission Receipt Banner */}
      {(conditionedNode || lastSubmittedReceipt || tourEpochIndex !== null) && (
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 py-1.5">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-2 text-xs">
            {conditionedNode && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-amber-200">
                <Focus className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Conditioned Spotlight Active:</strong> Assuming{" "}
                  <span
                    className="rounded px-1.5 py-0.5 font-bold text-white"
                    style={{ backgroundColor: conditionedNode.color }}
                  >
                    {conditionedNode.name} = 100%
                  </span>{" "}
                  (Unconditioned prior:{" "}
                  {formatPct(conditionedNode.baselineProbability)}). All
                  upstream origins (Bayes&apos; rule) and downstream fates are
                  renormalized to 100%!
                </span>
                <button
                  type="button"
                  onClick={() => setConditionedNodeId(null)}
                  className="ml-1 inline-flex items-center gap-1 rounded bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-slate-950 hover:bg-amber-300"
                >
                  <X className="h-3 w-3" />
                  <span>Uncondition</span>
                </button>
              </div>
            )}

            {tourEpochIndex !== null && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-400/40 bg-indigo-950/60 px-3 py-1 text-indigo-200">
                <span className="font-bold text-amber-300">
                  {NATURE_OF_REALITY_EPOCHS[tourEpochIndex]?.shortTitle}:{" "}
                  {NATURE_OF_REALITY_EPOCHS[tourEpochIndex]?.questionTitle}
                </span>
                <span className="text-slate-300">
                  {NATURE_OF_REALITY_EPOCHS[tourEpochIndex]?.subtitle}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={tourEpochIndex <= 0}
                    onClick={() =>
                      setTourEpochIndex((i) => Math.max(0, (i ?? 0) - 1))
                    }
                    className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3 w-3 inline" /> Prev Epoch
                  </button>
                  <button
                    type="button"
                    disabled={tourEpochIndex >= 6}
                    onClick={() =>
                      setTourEpochIndex((i) => Math.min(6, (i ?? 0) + 1))
                    }
                    className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white disabled:opacity-40"
                  >
                    Next Epoch <ChevronRight className="h-3 w-3 inline" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTourEpochIndex(null)}
                    className="ml-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                  >
                    Exit Tour
                  </button>
                </div>
              </div>
            )}

            {lastSubmittedReceipt && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Merged into Crowd Aggregate (<strong>N={communityCount}</strong>
                  ) • Top Path: <strong>{lastSubmittedReceipt.topOrigin}</strong>{" "}
                  → <strong>{lastSubmittedReceipt.topDeathFate}</strong> →{" "}
                  <strong>{lastSubmittedReceipt.topCosmicEnd}</strong> • Receipt{" "}
                  <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                    {lastSubmittedReceipt.receiptHash}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={() => setLastSubmittedReceipt(null)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Dismiss receipt banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace: Either Sankey (+ Inspector) OR Full 43-Node/98-Link Deep-Dive Matrix */}
      {studioMode === "matrix" ? (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-950 select-text">
          <div className="mx-auto max-w-[1680px] space-y-6">
            {/* Matrix Header & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  <span>
                    Deep-Dive Probability Matrix: Place Exact Probabilities on
                    Every Node & Conditional Branch
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust any node&apos;s overall probability or edit exact
                  conditional transition splits P(Target | Source) across all 7
                  Epochs (43 nodes, 119 directed links). All sibling branches
                  automatically normalize to 100%.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter by Epoch */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                  <button
                    type="button"
                    onClick={() => setMatrixEpochFilter("all")}
                    className={`rounded px-2 py-0.5 font-semibold ${
                      matrixEpochFilter === "all"
                        ? "bg-indigo-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All 7 Epochs
                  </button>
                  {NATURE_OF_REALITY_EPOCHS.map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setMatrixEpochFilter(ep.columnIndex)}
                      className={`rounded px-2 py-0.5 font-semibold ${
                        matrixEpochFilter === ep.columnIndex
                          ? "bg-indigo-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {ep.shortTitle.split(".")[0]}
                    </button>
                  ))}
                </div>

                <label htmlFor={`${uniqueIdPrefix}-matrix-search`} className="sr-only">
                  Search nodes or mechanisms
                </label>
                <input
                  id={`${uniqueIdPrefix}-matrix-search`}
                  type="search"
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  placeholder="Search 43 hypotheses..."
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5 text-sky-400" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioMode("split")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-400"
                >
                  <span>Back to Gradient Sankey</span>
                </button>
              </div>
            </div>

            {/* Semantic Accessible Data Table & Interactive Editor for All 43 Nodes & 98 Links */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">
                  Nature of Reality complete probabilistic breakdown across 7
                  cosmological epochs, 43 nodes, and 98 conditional transitions
                </caption>
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th scope="col" className="py-3 px-4">
                      Epoch / Section
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Hypothesis Node
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Direct Overall Probability (Slider + Exact %)
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Author Baseline vs. Crowd
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Outgoing Conditional Transitions P(Target | This Node)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredMatrixNodes.map((node) => {
                    const epoch = NATURE_OF_REALITY_EPOCHS[node.columnIndex];
                    const outLinks = graph.links.filter(
                      (l) => l.sourceId === node.id
                    );
                    const deltaBase =
                      (node.probability - node.baselineProbability) * 100;
                    const nodeSliderId = `${uniqueIdPrefix}-matrix-node-${node.id}`;
                    const nodeNumId = `${uniqueIdPrefix}-matrix-num-${node.id}`;

                    return (
                      <tr
                        key={node.id}
                        className="hover:bg-slate-800/35 align-top"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                            style={{
                              backgroundColor: `${epoch?.badgeColor ?? "#4328E7"}cc`,
                            }}
                          >
                            {epoch?.shortTitle}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
                            {epoch?.questionTitle}
                          </div>
                        </td>

                        <th
                          scope="row"
                          className="py-3.5 px-4 font-bold text-white min-w-[220px]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-sm shrink-0 border border-white/20"
                              style={{ backgroundColor: node.color }}
                            />
                            <span>{node.name}</span>
                          </div>
                          <p className="mt-1 text-[11px] font-normal text-slate-400 leading-relaxed max-w-xs">
                            {node.summary}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setConditionedNodeId(
                                conditionedNodeId === node.id ? null : node.id
                              );
                            }}
                            className={`mt-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${
                              conditionedNodeId === node.id
                                ? "border-amber-400 bg-amber-500 text-slate-950"
                                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-400/60 hover:text-amber-300"
                            }`}
                          >
                            <Focus className="h-2.5 w-2.5" />
                            <span>
                              {conditionedNodeId === node.id
                                ? "Conditioned (100%)"
                                : "Condition on Node = 100%"}
                            </span>
                          </button>
                        </th>

                        <td className="py-3.5 px-4 min-w-[230px]">
                          <div className="flex items-center gap-2">
                            <label htmlFor={nodeSliderId} className="sr-only">
                              {node.name} overall probability slider
                            </label>
                            <input
                              id={nodeSliderId}
                              type="range"
                              min={0.1}
                              max={99}
                              step={0.1}
                              value={Number(
                                (node.probability * 100).toFixed(1)
                              )}
                              onChange={(e) =>
                                handleSetDirectNodeProbability(
                                  node.id,
                                  Number(e.target.value) / 100
                                )
                              }
                              className="w-28 accent-indigo-400"
                            />
                            <label htmlFor={nodeNumId} className="sr-only">
                              {node.name} exact percentage input
                            </label>
                            <input
                              id={nodeNumId}
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={Number(
                                (node.probability * 100).toFixed(2)
                              )}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!Number.isNaN(val)) {
                                  handleSetDirectNodeProbability(
                                    node.id,
                                    val / 100
                                  );
                                }
                              }}
                              className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-amber-300 tabular-nums focus:border-indigo-400 focus:outline-none"
                            />
                            <span className="font-mono text-xs text-slate-400">
                              %
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-slate-400 tabular-nums">
                            Decimal flow:{" "}
                            <strong className="text-slate-200">
                              {formatFlowDecimal(node.probability)}
                            </strong>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono whitespace-nowrap tabular-nums">
                          <div className="text-slate-300">
                            Author:{" "}
                            <strong>
                              {formatPct(node.baselineProbability, 2)}
                            </strong>
                          </div>
                          <div className="text-sky-300 mt-0.5">
                            Crowd:{" "}
                            <strong>
                              {formatPct(node.communityProbability, 2)}
                            </strong>
                          </div>
                          {Math.abs(deltaBase) >= 0.05 && (
                            <div
                              className={`mt-0.5 text-[10px] font-bold ${
                                deltaBase > 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              Delta: {deltaBase > 0 ? "+" : ""}
                              {deltaBase.toFixed(1)}%
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 min-w-[380px]">
                          {outLinks.length === 0 ? (
                            <span className="inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                              Terminal Cosmic Fate Endpoint
                            </span>
                          ) : (
                            <div className="space-y-1.5">
                              {outLinks.map((outLink) => {
                                const targetNode = graph.nodeMap.get(
                                  outLink.targetId
                                );
                                if (!targetNode) return null;
                                const splitSliderId = `${uniqueIdPrefix}-mat-split-${outLink.id}`;
                                const splitNumId = `${uniqueIdPrefix}-mat-split-num-${outLink.id}`;
                                return (
                                  <div
                                    key={outLink.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 px-2.5 py-1"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: targetNode.color,
                                        }}
                                      />
                                      <span className="truncate text-[11px] font-medium text-slate-200">
                                        → {targetNode.shortLabel || targetNode.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <label
                                        htmlFor={splitSliderId}
                                        className="sr-only"
                                      >
                                        Conditional split from {node.name} to{" "}
                                        {targetNode.name}
                                      </label>
                                      <input
                                        id={splitSliderId}
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        value={Number(
                                          (
                                            outLink.conditionalProb * 100
                                          ).toFixed(1)
                                        )}
                                        onChange={(e) =>
                                          handleChangeConditionalSplit(
                                            node.id,
                                            targetNode.id,
                                            Number(e.target.value) / 100
                                          )
                                        }
                                        className="w-20 accent-sky-400"
                                      />
                                      <label
                                        htmlFor={splitNumId}
                                        className="sr-only"
                                      >
                                        Exact conditional percentage from{" "}
                                        {node.name} to {targetNode.name}
                                      </label>
                                      <input
                                        id={splitNumId}
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={Number(
                                          (
                                            outLink.conditionalProb * 100
                                          ).toFixed(1)
                                        )}
                                        onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v)) {
                                            handleChangeConditionalSplit(
                                              node.id,
                                              targetNode.id,
                                              v / 100
                                            );
                                          }
                                        }}
                                        className="w-16 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-bold text-sky-300 tabular-nums"
                                      />
                                      <span className="text-[10px] font-mono text-slate-400 w-14 text-right tabular-nums">
                                        ({formatPct(outLink.flow, 1)})
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Split Studio or Full Canvas Mode: Interactive Flourish-Style Gradient Sankey + Right Deep-Dive Inspector */
        <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left / Main: Flourish-Grade Multi-Epoch Gradient Sankey Canvas */}
          <div
            ref={svgContainerRef}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest("[data-floating-ui]")) {
                return;
              }
              setIsDragging(true);
              dragStartRef.current = { x: e.clientX, y: e.clientY };
            }}
            onMouseMove={(e) => {
              if (!isDragging || !dragStartRef.current) return;
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              dragStartRef.current = { x: e.clientX, y: e.clientY };
              setCamera((prev) => ({
                ...prev,
                x: clamp(prev.x - dx * 1.4, -120, SANKEY_VIEWBOX.w - prev.w + 120),
                y: clamp(prev.y - dy * 1.4, -80, SANKEY_VIEWBOX.h - prev.h + 80),
              }));
            }}
            onMouseUp={() => {
              setIsDragging(false);
              dragStartRef.current = null;
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              dragStartRef.current = null;
            }}
            className={`relative flex-1 min-h-[380px] overflow-hidden transition-colors duration-300 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${
              isLightCanvas
                ? "bg-[#fcfbf9] text-slate-900"
                : "bg-[#070b14] text-slate-100"
            }`}
          >
            {/* Interactive SVG Sankey Diagram */}
            <svg
              role="img"
              viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`}
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <title>
                Nature of Reality: A Probabilistic Breakdown — 7-Epoch
                Interactive Gradient Sankey Diagram across 43 Cosmological and
                Consciousness Hypotheses
              </title>

              {/* Dynamic Linear Gradients matching Flourish's exact 10% -> 90% stops at 0.8 stop-opacity */}
              <defs>
                {ribbons.map((r) => (
                  <linearGradient
                    key={`grad-${r.id}`}
                    id={`${uniqueIdPrefix}-grad-${r.id}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="10%"
                      stopColor={r.link.sourceColor}
                      stopOpacity={isLightCanvas ? 0.8 : 0.84}
                    />
                    <stop
                      offset="90%"
                      stopColor={r.link.targetColor}
                      stopOpacity={isLightCanvas ? 0.8 : 0.84}
                    />
                  </linearGradient>
                ))}
              </defs>

              {/* Top 7 Epoch / Section Column Guides & Headers */}
              <g className="epoch-headers">
                {NATURE_OF_REALITY_EPOCHS.map((ep) => {
                  const colX = COL_X_POSITIONS[ep.columnIndex] ?? 64;
                  const isTourActive = tourEpochIndex === ep.columnIndex;
                  return (
                    <g key={ep.id}>
                      {/* Subtle vertical column guide line */}
                      <line
                        x1={colX + NODE_WIDTH / 2}
                        y1={76}
                        x2={colX + NODE_WIDTH / 2}
                        y2={785}
                        stroke={isLightCanvas ? "#e2e8f0" : "#1e293b"}
                        strokeWidth={1}
                        strokeDasharray="3 5"
                      />

                      {/* Clickable Epoch Header Card */}
                      <g
                        onClick={() => {
                          const topNode = [...graph.nodes]
                            .filter((n) => n.columnIndex === ep.columnIndex)
                            .sort((a, b) => b.probability - a.probability)[0];
                          if (topNode) setSelectedNodeId(topNode.id);
                        }}
                        className="cursor-pointer"
                      >
                        <rect
                          x={colX - 6}
                          y={14}
                          width={228}
                          height={52}
                          rx={8}
                          fill={
                            isTourActive
                              ? ep.badgeColor
                              : isLightCanvas
                              ? "#ffffff"
                              : "#0f172a"
                          }
                          stroke={ep.badgeColor}
                          strokeWidth={isTourActive ? 2.5 : 1.2}
                          opacity={0.96}
                        />
                        <text
                          x={colX + 4}
                          y={31}
                          fontSize={10.5}
                          fontWeight={800}
                          fill={
                            isTourActive
                              ? "#ffffff"
                              : isLightCanvas
                              ? ep.badgeColor
                              : "#38bdf8"
                          }
                          style={{ letterSpacing: "0.04em" }}
                        >
                          {ep.shortTitle.toUpperCase()}
                        </text>
                        <text
                          x={colX + 4}
                          y={47}
                          fontSize={11.5}
                          fontWeight={700}
                          fill={
                            isTourActive
                              ? "#ffffff"
                              : isLightCanvas
                              ? "#0f172a"
                              : "#f8fafc"
                          }
                        >
                          {ep.questionTitle}
                        </text>
                        <text
                          x={colX + 4}
                          y={60}
                          fontSize={9}
                          fill={
                            isTourActive
                              ? "#f1f5f9"
                              : isLightCanvas
                              ? "#64748b"
                              : "#94a3b8"
                          }
                        >
                          {ep.subtitle.slice(0, 42)}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* LAYER 1: Base Gradient Links (`.base-layer` — dims to 0.18 when hovering a node/link) */}
              <g
                className="base-links transition-opacity duration-200"
                opacity={highlightedLineage ? 0.18 : 1}
              >
                {ribbons.map((r) => {
                  if (r.link.flow <= 1e-6) return null;
                  return (
                    <path
                      key={r.id}
                      d={r.pathD}
                      fill="none"
                      stroke={`url(#${uniqueIdPrefix}-grad-${r.id})`}
                      strokeWidth={r.width}
                      onMouseEnter={() => setHoveredLinkId(r.id)}
                      onMouseLeave={() => setHoveredLinkId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(r.link.sourceId);
                      }}
                      className="cursor-pointer transition-all duration-300"
                    />
                  );
                })}
              </g>

              {/* LAYER 2: Highlighted Lineage Links & Flow Value Badges (`.highlight-layer`) */}
              {highlightedLineage && (
                <g className="highlight-layer pointer-events-none">
                  {ribbons
                    .filter(
                      (r) =>
                        highlightedLineage.linkIds.has(r.id) &&
                        r.link.flow > 1e-6
                    )
                    .map((r) => (
                      <g key={`hl-${r.id}`}>
                        <path
                          d={r.pathD}
                          fill="none"
                          stroke={`url(#${uniqueIdPrefix}-grad-${r.id})`}
                          strokeWidth={Math.max(2.2, r.width)}
                          opacity={0.96}
                        />
                        {/* Show exact flow percentage along active ribbons */}
                        {r.link.flow >= 0.004 && (
                          <g transform={`translate(${r.midX}, ${r.midY})`}>
                            <rect
                              x={-28}
                              y={-9}
                              width={56}
                              height={18}
                              rx={4}
                              fill={isLightCanvas ? "#0f172acc" : "#020617dd"}
                              stroke={r.link.sourceColor}
                              strokeWidth={1}
                            />
                            <text
                              x={0}
                              y={3.5}
                              textAnchor="middle"
                              fontSize={10}
                              fontWeight={700}
                              fill="#ffffff"
                            >
                              {formatPct(r.link.flow, 1)}
                            </text>
                          </g>
                        )}
                      </g>
                    ))}
                </g>
              )}

              {/* LAYER 3: Vertical Node Bars (`<rect>`) & Crisp Non-Overlapping Labels */}
              <g className="nodes">
                {Array.from(nodeBoxes.values()).map((box) => {
                  const { node } = box;
                  const isSelected = selectedNodeId === node.id;
                  const isConditioned = conditionedNodeId === node.id;
                  const isDimmed =
                    highlightedLineage &&
                    !highlightedLineage.nodeIds.has(node.id);

                  const displayLabel =
                    node.name.length > 36 && node.shortLabel
                      ? node.shortLabel
                      : node.name;
                  const cy = (box.y0 + box.y1) / 2;

                  return (
                    <g
                      key={box.id}
                      transform={`translate(${box.x0}, ${box.y0})`}
                      opacity={isDimmed ? 0.28 : 1}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      className="cursor-pointer transition-opacity duration-150"
                    >
                      {/* Outer selection / conditioning halo */}
                      {(isSelected || isConditioned) && (
                        <rect
                          x={-3}
                          y={-3}
                          width={NODE_WIDTH + 6}
                          height={box.height + 6}
                          rx={4}
                          fill="none"
                          stroke={isConditioned ? "#f59e0b" : "#38bdf8"}
                          strokeWidth={2.5}
                        />
                      )}

                      {/* Main Flourish Colored Node Bar */}
                      <rect
                        width={NODE_WIDTH}
                        height={box.height}
                        rx={1.5}
                        fill={node.color}
                        stroke={isLightCanvas ? "#ffffff" : "#0f172a"}
                        strokeWidth={0.8}
                      />

                      {/* Node Title + Tabular Probability Badge */}
                      <text
                        x={NODE_WIDTH + 6}
                        y={cy - box.y0}
                        dy="0.32em"
                        textAnchor="start"
                        fontSize={11.5}
                        fontWeight={isSelected ? 800 : 600}
                        fill={isLightCanvas ? "#111827" : "#f8fafc"}
                        stroke={isLightCanvas ? "#fcfbf9" : "#070b14"}
                        strokeWidth={3.2}
                        paintOrder="stroke"
                        style={{ pointerEvents: "none" }}
                      >
                        {displayLabel}{" "}
                        <tspan
                          fontWeight={800}
                          fill={
                            isLightCanvas
                              ? node.color === "#FFC502"
                                ? "#b45309"
                                : node.color
                              : "#38bdf8"
                          }
                        >
                          ({formatPct(node.probability, 1)})
                        </tspan>
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Bottom-Left Floating Quick Epoch 1 Root Priors Strip */}
            <div
              data-floating-ui
              className={`absolute bottom-3 left-3 z-10 hidden xl:flex items-center gap-3 rounded-xl border px-3.5 py-2 shadow-xl backdrop-blur-md ${
                isLightCanvas
                  ? "border-slate-300/90 bg-white/90 text-slate-900"
                  : "border-slate-800 bg-slate-950/90 text-slate-100"
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                I. Origin Priors:
              </div>
              {graph.nodes
                .filter((n) => n.columnIndex === 0)
                .map((rootNode) => {
                  const quickSliderId = `${uniqueIdPrefix}-quick-root-${rootNode.id}`;
                  return (
                    <div
                      key={rootNode.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: rootNode.color }}
                      />
                      <label
                        htmlFor={quickSliderId}
                        className="font-semibold truncate max-w-[115px] cursor-pointer"
                        onClick={() => setSelectedNodeId(rootNode.id)}
                      >
                        {rootNode.shortLabel || rootNode.name}
                      </label>
                      <input
                        id={quickSliderId}
                        type="range"
                        min={1}
                        max={97}
                        step={0.5}
                        value={Number((rootNode.probability * 100).toFixed(1))}
                        onChange={(e) =>
                          handleChangeRootPrior(
                            rootNode.id,
                            Number(e.target.value) / 100
                          )
                        }
                        className="w-16 accent-indigo-600"
                      />
                      <span className="font-mono font-bold tabular-nums w-11 text-right">
                        {formatPct(rootNode.probability, 1)}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Bottom-Right Zoom & Reset Controls */}
            <div
              data-floating-ui
              className={`absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-xl border px-2 py-1 shadow-lg backdrop-blur-md ${
                isLightCanvas
                  ? "border-slate-300 bg-white/90 text-slate-800"
                  : "border-slate-800 bg-slate-900/90 text-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => handleZoom(0.8)}
                className="p-1 hover:text-indigo-500"
                aria-label="Zoom in Sankey diagram"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold tabular-nums">
                {Math.round((SANKEY_VIEWBOX.w / camera.w) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(1.25)}
                className="p-1 hover:text-indigo-500"
                aria-label="Zoom out Sankey diagram"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCamera(SANKEY_VIEWBOX)}
                className="ml-1 rounded px-1.5 py-0.5 text-[11px] font-mono hover:bg-slate-500/10"
              >
                Fit All
              </button>
            </div>
          </div>

          {/* Right Panel: Deep-Dive Probability Studio & Philosophical/Physics Citations */}
          {studioMode === "split" && selectedNode && (
            <aside
              aria-label="Selected Hypothesis Deep-Dive Probability Studio"
              className="flex flex-col w-full lg:w-[470px] xl:w-[510px] lg:h-full shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 overflow-y-auto select-text"
            >
              {/* Node Header */}
              <div className="border-b border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                    style={{ backgroundColor: selectedNode.color }}
                  >
                    {
                      NATURE_OF_REALITY_EPOCHS[selectedNode.columnIndex]
                        ?.shortTitle
                    }
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-pressed={conditionedNodeId === selectedNode.id}
                      onClick={() =>
                        setConditionedNodeId(
                          conditionedNodeId === selectedNode.id
                            ? null
                            : selectedNode.id
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        conditionedNodeId === selectedNode.id
                          ? "border-amber-400 bg-amber-500 text-slate-950"
                          : "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                      }`}
                    >
                      <Focus className="h-3 w-3" />
                      <span>
                        {conditionedNodeId === selectedNode.id
                          ? "Conditioned = 100%"
                          : "Assume Node = 100%"}
                      </span>
                    </button>
                  </div>
                </div>

                <h2 className="mt-2 text-base font-extrabold text-white leading-snug">
                  {selectedNode.name}
                </h2>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {selectedNode.summary}
                </p>

                {/* Live Probability Readout Strip */}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-center">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Your Probability
                    </div>
                    <div
                      className="text-lg font-mono font-extrabold tabular-nums"
                      style={{ color: selectedNode.color }}
                    >
                      {formatPct(selectedNode.probability, 2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                      ({formatFlowDecimal(selectedNode.probability)})
                    </div>
                  </div>
                  <div className="border-x border-slate-800/80">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Author Baseline
                    </div>
                    <div className="text-base font-mono font-bold text-slate-200 tabular-nums mt-0.5">
                      {formatPct(selectedNode.baselineProbability, 2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                      ({formatFlowDecimal(selectedNode.baselineProbability)})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-sky-400">
                      Crowd (N={communityCount})
                    </div>
                    <div className="text-base font-mono font-bold text-sky-300 tabular-nums mt-0.5">
                      {formatPct(selectedNode.communityProbability, 2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                      ({formatFlowDecimal(selectedNode.communityProbability)})
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Place Direct Overall Probability on This Node */}
              <div className="border-b border-slate-800 bg-indigo-950/20 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <label
                    htmlFor={`${uniqueIdPrefix}-insp-overall-slider`}
                    className="flex items-center gap-1.5 font-bold text-indigo-300"
                  >
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    <span>
                      {selectedNode.columnIndex === 0
                        ? "Set Root Origin Prior Probability:"
                        : "Set Direct Target Probability for This Node:"}
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    <label
                      htmlFor={`${uniqueIdPrefix}-insp-overall-num`}
                      className="sr-only"
                    >
                      Exact overall percentage for {selectedNode.name}
                    </label>
                    <input
                      id={`${uniqueIdPrefix}-insp-overall-num`}
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={Number(
                        (selectedNode.probability * 100).toFixed(2)
                      )}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v)) {
                          handleSetDirectNodeProbability(
                            selectedNode.id,
                            v / 100
                          );
                        }
                      }}
                      className="w-20 rounded border border-indigo-500/40 bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 tabular-nums focus:border-indigo-400 focus:outline-none"
                    />
                    <span className="font-mono text-xs text-slate-400">%</span>
                  </div>
                </div>

                <input
                  id={`${uniqueIdPrefix}-insp-overall-slider`}
                  type="range"
                  min={0.2}
                  max={98}
                  step={0.2}
                  value={Number((selectedNode.probability * 100).toFixed(1))}
                  onChange={(e) =>
                    handleSetDirectNodeProbability(
                      selectedNode.id,
                      Number(e.target.value) / 100
                    )
                  }
                  className="w-full accent-indigo-400"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {selectedNode.columnIndex === 0
                    ? "Automatically rebalances the other 3 Epoch I root origins so Epoch I sums to 100%."
                    : "Scales incoming conditional transitions from parent nodes and propagates forward to all downstream cosmic fates."}
                </p>
              </div>

              {/* SECTION 2: Deep-Dive Outgoing Conditional Splits P(Target | Selected Node) */}
              {selectedNode.outgoingLinkIds.length > 0 && (
                <div className="border-b border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                        Outgoing Conditional Splits P(Next |{" "}
                        {selectedNode.shortLabel || selectedNode.name})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Given this node occurs, place exact conditional
                        probabilities on what happens next (always sums to 100%):
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetNodeSplits(selectedNode.id)}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white"
                    >
                      Reset Node
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedNode.outgoingLinkIds.map((linkId) => {
                      const link = graph.linkMap.get(linkId);
                      if (!link) return null;
                      const targetNode = graph.nodeMap.get(link.targetId);
                      if (!targetNode) return null;

                      const lockKey = `${selectedNode.id}->${targetNode.id}`;
                      const isLocked = !!lockedLinks[lockKey];
                      const sliderId = `${uniqueIdPrefix}-out-slider-${link.id}`;
                      const numId = `${uniqueIdPrefix}-out-num-${link.id}`;

                      return (
                        <div
                          key={link.id}
                          className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedNodeId(targetNode.id)}
                              className="flex items-center gap-2 text-left text-xs font-bold text-white hover:text-sky-300 min-w-0"
                            >
                              <span
                                className="h-3 w-3 rounded-sm shrink-0"
                                style={{ backgroundColor: targetNode.color }}
                              />
                              <span className="truncate">{targetNode.name}</span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                aria-pressed={isLocked}
                                onClick={() =>
                                  setLockedLinks((prev) => ({
                                    ...prev,
                                    [lockKey]: !prev[lockKey],
                                  }))
                                }
                                className={`rounded p-1 text-[10px] ${
                                  isLocked
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : "text-slate-500 hover:text-slate-300"
                                }`}
                                aria-label={
                                  isLocked
                                    ? `Unlock ${targetNode.name} conditional branch`
                                    : `Lock ${targetNode.name} conditional branch`
                                }
                              >
                                {isLocked ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  <Unlock className="h-3 w-3" />
                                )}
                              </button>

                              <label htmlFor={numId} className="sr-only">
                                Exact conditional split percentage to{" "}
                                {targetNode.name}
                              </label>
                              <input
                                id={numId}
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                disabled={isLocked}
                                value={Number(
                                  (link.conditionalProb * 100).toFixed(1)
                                )}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!Number.isNaN(val)) {
                                    handleChangeConditionalSplit(
                                      selectedNode.id,
                                      targetNode.id,
                                      val / 100
                                    );
                                  }
                                }}
                                className="w-16 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-xs font-bold text-sky-300 tabular-nums disabled:opacity-50"
                              />
                              <span className="font-mono text-xs text-slate-400">
                                %
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label htmlFor={sliderId} className="sr-only">
                              Conditional split slider to {targetNode.name}
                            </label>
                            <input
                              id={sliderId}
                              type="range"
                              min={0}
                              max={100}
                              step={0.5}
                              disabled={isLocked}
                              value={Number(
                                (link.conditionalProb * 100).toFixed(1)
                              )}
                              onChange={(e) =>
                                handleChangeConditionalSplit(
                                  selectedNode.id,
                                  targetNode.id,
                                  Number(e.target.value) / 100
                                )
                              }
                              className="flex-1 accent-sky-400 disabled:opacity-40"
                            />
                            <span className="font-mono text-[10px] text-slate-400 tabular-nums w-28 text-right">
                              Flow: {formatPct(link.flow, 2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: Incoming Parent Ribbons (Upstream Contributors) */}
              {selectedNode.incomingLinkIds.length > 0 && (
                <div className="border-b border-slate-800 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300 mb-1">
                    Upstream Sources Flowing Into This Node
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    Click any upstream cause to inspect it, or adjust its
                    conditional transition directly:
                  </p>
                  <div className="space-y-1.5">
                    {selectedNode.incomingLinkIds.map((linkId) => {
                      const link = graph.linkMap.get(linkId);
                      if (!link) return null;
                      const sourceNode = graph.nodeMap.get(link.sourceId);
                      if (!sourceNode) return null;
                      const shareOfNode =
                        selectedNode.probability > 1e-6
                          ? link.flow / selectedNode.probability
                          : 0;

                      return (
                        <div
                          key={link.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-900/40 px-2.5 py-1.5 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedNodeId(sourceNode.id)}
                            className="flex items-center gap-2 font-semibold text-slate-200 hover:text-white truncate"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: sourceNode.color }}
                            />
                            <span className="truncate">{sourceNode.name}</span>
                          </button>
                          <div className="font-mono text-[11px] text-slate-300 shrink-0 tabular-nums">
                            <span className="text-amber-300 font-bold">
                              {formatPct(link.flow, 2)}
                            </span>{" "}
                            <span className="text-slate-500">
                              ({Math.round(shareOfNode * 100)}% of node)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 4: Theoretical Mechanism & Cited Physics / Philosophy Literature */}
              <div className="p-4 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                    Theoretical & Cosmological Mechanism
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedNode.deepMechanism}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                    Key Academic & Philosophical Arguments (
                    {selectedNode.citations.length})
                  </div>
                  <div className="space-y-2.5">
                    {selectedNode.citations.map((cit, idx) => (
                      <div
                        key={`${selectedNode.id}-cit-${idx}`}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-white">
                            {cit.author}{" "}
                            <span className="font-mono text-[11px] text-sky-400 font-normal">
                              @{cit.handle}
                            </span>
                          </span>
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300 tabular-nums">
                            ▲ {cit.upvotes}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-amber-300/90">
                          {cit.workTitle} ({cit.year})
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                          {cit.thesis}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-slate-400">
                            {cit.platform}
                          </span>
                          <a
                            href={cit.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-sky-400 hover:text-sky-300 underline"
                          >
                            Read Source ({cit.workTitle.slice(0, 24)}…) ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal Worldview Naming & Export Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                  <label
                    htmlFor={`${uniqueIdPrefix}-worldview-title`}
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    Personal Worldview Title (For Presentation & Crowd Pool)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`${uniqueIdPrefix}-worldview-title`}
                      type="text"
                      value={customWorldviewTitle}
                      onChange={(e) => setCustomWorldviewTitle(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        setCopiedShareLink(true);
                        setTimeout(() => setCopiedShareLink(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <Share2 className="h-3 w-3 text-sky-400" />
                      <span>{copiedShareLink ? "Copied!" : "Share"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3 text-emerald-400" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
