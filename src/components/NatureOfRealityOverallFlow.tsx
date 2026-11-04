"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import {
  GitBranch,
  Layers,
  Maximize2,
  RotateCcw,
  Sparkles,
  Workflow,
  ZoomIn,
} from "lucide-react";
import {
  ComputedRealityGraph,
  ComputedRealityNode,
  NATURE_OF_REALITY_EPOCHS,
} from "@/data/nature-of-reality-seed";

export type OverallFlowVisualMode =
  | "marimekko"
  | "macro-river"
  | "storyline-funnel";

export type MacroWorldviewId =
  | "physicalist"
  | "simulation"
  | "consciousness"
  | "theistic"
  | "mysterian";

interface MacroWorldviewMeta {
  id: MacroWorldviewId;
  name: string;
  shortName: string;
  subtitle: string;
  color: string;
  lightBg: string;
}

const MACRO_WORLDVIEWS: MacroWorldviewMeta[] = [
  {
    id: "physicalist",
    name: "Physicalist & Multiverse Cosmology",
    shortName: "Physicalist / Multiverse",
    subtitle:
      "Naturalistic inflation, quantum vacuum, biological cessation & thermodynamic fate",
    color: "#4f46e5",
    lightBg: "#eef2ff",
  },
  {
    id: "simulation",
    name: "Simulation & Technological Creation",
    shortName: "Simulation / Tech",
    subtitle:
      "Ancestor/alien substrates, waking up outside the sim & computational shutdown",
    color: "#0284c7",
    lightBg: "#f0f9ff",
  },
  {
    id: "consciousness",
    name: "Idealist & Universal Consciousness",
    shortName: "Idealist / Mind",
    subtitle:
      "Non-material continuation, cosmic mind return, reincarnation & experiential loops",
    color: "#c026d3",
    lightBg: "#fdf4ff",
  },
  {
    id: "theistic",
    name: "Theistic & Moral Teleology",
    shortName: "Theistic / Moral",
    subtitle:
      "Divine creation, afterlife judgment, foundational moral weight & creator telos",
    color: "#e11d48",
    lightBg: "#fff1f2",
  },
  {
    id: "mysterian",
    name: "Mysterian & Epistemic Horizon",
    shortName: "Mysterian / Unknown",
    subtitle:
      "Beyond human cognitive closure: unconceived origins, mechanisms & endings",
    color: "#d97706",
    lightBg: "#fffbeb",
  },
];

const MACRO_WORLDVIEW_MAP = new Map<MacroWorldviewId, MacroWorldviewMeta>(
  MACRO_WORLDVIEWS.map((m) => [m.id, m])
);

function getNodeMacroWorldview(nodeId: string): MacroWorldviewId {
  switch (nodeId) {
    case "nor-c1-ancestor-simulation":
    case "nor-c1-alien-simulation":
    case "nor-c2-simulated-afterlife":
    case "nor-c2-wake-up-simulation":
    case "nor-c3-passive-simulation":
    case "nor-c3-agentic-simulation":
    case "nor-c4-reliving-own-life":
    case "nor-c4-living-imaginary-others":
    case "nor-c4-adventitious-evolution":
    case "nor-c4-agency-research-entertainment":
    case "nor-c6-plug-pulled":
      return "simulation";

    case "nor-c2-nonmaterial-continuation":
    case "nor-c3-universal-consciousness":
    case "nor-c3-reincarnation":
      return "consciousness";

    case "nor-c1-divine-creation":
    case "nor-c3-afterlife-heaven-hell":
    case "nor-c4-moral-implications-base":
    case "nor-c6-creator-ends":
      return "theistic";

    case "nor-c0-incomprehensible":
    case "nor-c1-incomprehensible-mechanism":
    case "nor-c1-uncaused-other":
    case "nor-c2-incomprehensible-death":
    case "nor-c6-incomprehensible-ending":
    case "nor-c6-finished-in-fluffer":
      return "mysterian";

    default:
      return "physicalist";
  }
}

function formatPct(prob: number, decimals = 1): string {
  const pct = prob * 100;
  if (pct <= 0) return "0%";
  if (pct < 0.05) return "<0.1%";
  return `${pct.toFixed(decimals)}%`;
}

interface LineageAnalysis {
  focusNodeId: string;
  focusColumn: number;
  focusProb: number;
  connectedNodeIds: Set<string>;
  connectedLinkIds: Set<string>;
  /**
   * For upstream nodes: fraction of focusNode's probability that originated from `nodeId` (0..1).
   * For downstream nodes: conditional probability that flow leaving `focusNode` reaches `nodeId` (0..1).
   * For focusNode itself: 1.0.
   */
  focusShareByNodeId: Map<string, number>;
  /**
   * Flow along each link that belongs specifically to `focusNode`'s upstream or downstream cone.
   */
  lineageFlowByLinkId: Map<string, number>;
}

/**
 * Computes exact forward & backward lineage reach and conditional shares for a clicked focus node.
 */
function computeFocusLineageAnalysis(
  graph: ComputedRealityGraph,
  focusNodeId: string | null
): LineageAnalysis | null {
  if (!focusNodeId) return null;
  const focusNode = graph.nodeMap.get(focusNodeId);
  if (!focusNode) return null;

  const focusColumn = focusNode.columnIndex;
  const focusProb = Math.max(1e-6, focusNode.probability);
  const connectedNodeIds = new Set<string>([focusNodeId]);
  const connectedLinkIds = new Set<string>();
  const focusShareByNodeId = new Map<string, number>([[focusNodeId, 1.0]]);
  const lineageFlowByLinkId = new Map<string, number>();

  // 1. Downstream forward propagation from focusNode (columns > focusColumn)
  const forwardMass = new Map<string, number>([[focusNodeId, focusProb]]);
  for (let col = focusColumn; col <= 5; col++) {
    for (const link of graph.links) {
      if (link.flow <= 1e-6) continue;
      const sNode = graph.nodeMap.get(link.sourceId);
      const tNode = graph.nodeMap.get(link.targetId);
      if (!sNode || !tNode || sNode.columnIndex !== col) continue;

      const srcMass = forwardMass.get(sNode.id) ?? 0;
      if (srcMass <= 1e-7) continue;

      const edgeReachMass = srcMass * link.conditionalProb;
      if (edgeReachMass > 1e-7) {
        connectedNodeIds.add(tNode.id);
        connectedLinkIds.add(link.id);
        lineageFlowByLinkId.set(link.id, edgeReachMass);
        forwardMass.set(
          tNode.id,
          (forwardMass.get(tNode.id) ?? 0) + edgeReachMass
        );
      }
    }
  }
  for (const [nId, mass] of forwardMass.entries()) {
    if (nId !== focusNodeId) {
      focusShareByNodeId.set(nId, Math.min(1, mass / focusProb));
    }
  }

  // 2. Upstream backward propagation from focusNode (columns < focusColumn)
  const backwardMass = new Map<string, number>([[focusNodeId, focusProb]]);
  for (let col = focusColumn; col >= 1; col--) {
    for (const link of graph.links) {
      if (link.flow <= 1e-6) continue;
      const sNode = graph.nodeMap.get(link.sourceId);
      const tNode = graph.nodeMap.get(link.targetId);
      if (!sNode || !tNode || tNode.columnIndex !== col) continue;

      const tgtMass = backwardMass.get(tNode.id) ?? 0;
      if (tgtMass <= 1e-7 || tNode.probability <= 1e-7) continue;

      // Bayes upstream share of tNode that came via `link`
      const parentFraction = link.flow / tNode.probability;
      const edgeBackMass = tgtMass * parentFraction;
      if (edgeBackMass > 1e-7) {
        connectedNodeIds.add(sNode.id);
        connectedLinkIds.add(link.id);
        lineageFlowByLinkId.set(link.id, edgeBackMass);
        backwardMass.set(
          sNode.id,
          (backwardMass.get(sNode.id) ?? 0) + edgeBackMass
        );
      }
    }
  }
  for (const [nId, mass] of backwardMass.entries()) {
    if (nId !== focusNodeId) {
      focusShareByNodeId.set(nId, Math.min(1, mass / focusProb));
    }
  }

  return {
    focusNodeId,
    focusColumn,
    focusProb,
    connectedNodeIds,
    connectedLinkIds,
    focusShareByNodeId,
    lineageFlowByLinkId,
  };
}

interface MarimekkoSegment {
  id: string;
  nodeId: string | null; // null if virtual continuity trunk
  columnIndex: number;
  label: string;
  shortLabel: string;
  probability: number;
  shareOfColumn: number;
  color: string;
  isTrunk: boolean;
  isTopNode: boolean;
  isFocusedNode: boolean;
  isConnectedToFocus: boolean;
  focusConditionalShare: number | null; // e.g., 0.10 means 10% of focused node flows here
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  height: number;
}

interface MarimekkoRibbon {
  id: string;
  sourceSegId: string;
  targetSegId: string;
  sourceNodeId: string | null;
  targetNodeId: string | null;
  flow: number;
  lineageFlow: number;
  isConnectedRibbon: boolean;
  sourceColor: string;
  targetColor: string;
  x0: number;
  x1: number;
  sy0: number;
  sy1: number;
  ty0: number;
  ty1: number;
  midX: number;
  midY: number;
  pathD: string;
  isDominantBridge: boolean;
}

const MARIMEKKO_VIEWBOX = { w: 1560, h: 446 };
const MARIMEKKO_COL_X = [18, 238, 458, 678, 898, 1118, 1338];
const MARIMEKKO_PILLAR_W = 148;
const MARIMEKKO_TOP_Y = 68;
const MARIMEKKO_BOTTOM_Y = 420;
const MARIMEKKO_TOTAL_H = MARIMEKKO_BOTTOM_Y - MARIMEKKO_TOP_Y;

const CONCISE_EPOCH_PILL_TITLES: Record<number, string> = {
  0: "I. BEFORE OUR UNIVERSE",
  1: "II. WHY UNIVERSE EXISTS",
  2: "III. CONSCIOUS FATE",
  3: "IV. CONTINUATION & SIM",
  4: "V. SIMULATION PURPOSE",
  5: "VI. COSMIC TRAJECTORY",
  6: "VII. ULTIMATE FATE",
};

/**
 * Builds the 7-Stage Proportional Marimekko & Alluvial Flow layout.
 * When `lineage` is active (user clicked a node), dynamically magnifies all forward and backward
 * connected branches in their respective columns so small related branches are easy to read and trace,
 * while still displaying their exact unchanged overall probabilities!
 */
function buildMarimekkoFlowLayout(
  graph: ComputedRealityGraph,
  includeBypassTrunks: boolean,
  lineage: LineageAnalysis | null
): {
  segmentsByCol: Map<number, MarimekkoSegment[]>;
  segmentMap: Map<string, MarimekkoSegment>;
  ribbons: MarimekkoRibbon[];
} {
  interface StepEdge {
    id: string;
    col: number;
    sourceSegId: string;
    targetSegId: string;
    sourceNodeId: string | null;
    targetNodeId: string | null;
    flow: number;
    lineageFlow: number;
    isConnectedRibbon: boolean;
    sourceColor: string;
    targetColor: string;
  }

  const trunkMassByCol = new Map<number, number>();
  const trunkLineageMassByCol = new Map<number, number>();
  const stepEdgeMap = new Map<string, StepEdge>();

  const addStepEdge = (
    col: number,
    sourceSegId: string,
    targetSegId: string,
    sourceNodeId: string | null,
    targetNodeId: string | null,
    flow: number,
    lineageFlow: number,
    isConnectedRibbon: boolean,
    sourceColor: string,
    targetColor: string
  ) => {
    if (flow <= 1e-6) return;
    const key = `${col}:${sourceSegId}->${targetSegId}`;
    const existing = stepEdgeMap.get(key);
    if (existing) {
      existing.flow += flow;
      existing.lineageFlow += lineageFlow;
      existing.isConnectedRibbon =
        existing.isConnectedRibbon || isConnectedRibbon;
      // If a connected ribbon flows into/out of a trunk, prefer the real node's vivid color over slate gray
      if (isConnectedRibbon && sourceColor !== "#64748b") {
        existing.sourceColor = sourceColor;
      }
      if (isConnectedRibbon && targetColor !== "#64748b") {
        existing.targetColor = targetColor;
      }
    } else {
      stepEdgeMap.set(key, {
        id: key,
        col,
        sourceSegId,
        targetSegId,
        sourceNodeId,
        targetNodeId,
        flow,
        lineageFlow,
        isConnectedRibbon,
        sourceColor,
        targetColor,
      });
    }
  };

  for (const link of graph.links) {
    if (link.flow <= 1e-6) continue;
    const sNode = graph.nodeMap.get(link.sourceId);
    const tNode = graph.nodeMap.get(link.targetId);
    if (!sNode || !tNode) continue;

    const c0 = sNode.columnIndex;
    const c1 = tNode.columnIndex;
    if (c1 <= c0) continue;

    const isConnLink = lineage?.connectedLinkIds.has(link.id) ?? false;
    const linFlow = lineage?.lineageFlowByLinkId.get(link.id) ?? 0;

    if (c1 === c0 + 1) {
      addStepEdge(
        c0,
        sNode.id,
        tNode.id,
        sNode.id,
        tNode.id,
        link.flow,
        linFlow,
        isConnLink,
        sNode.color,
        tNode.color
      );
    } else if (includeBypassTrunks) {
      for (let k = c0 + 1; k < c1; k++) {
        trunkMassByCol.set(k, (trunkMassByCol.get(k) ?? 0) + link.flow);
        if (isConnLink && linFlow > 1e-6) {
          trunkLineageMassByCol.set(
            k,
            (trunkLineageMassByCol.get(k) ?? 0) + linFlow
          );
        }
      }
      for (let col = c0; col < c1; col++) {
        const srcId = col === c0 ? sNode.id : `trunk-col-${col}`;
        const tgtId = col + 1 === c1 ? tNode.id : `trunk-col-${col + 1}`;
        const srcColor =
          col === c0
            ? sNode.color
            : isConnLink
            ? sNode.color
            : "#64748b";
        const tgtColor =
          col + 1 === c1
            ? tNode.color
            : isConnLink
            ? tNode.color
            : "#64748b";
        addStepEdge(
          col,
          srcId,
          tgtId,
          sNode.id,
          tNode.id,
          link.flow,
          linFlow,
          isConnLink,
          srcColor,
          tgtColor
        );
      }
    }
  }

  const TRUNK_LABELS: Record<number, { label: string; short: string }> = {
    1: {
      label: "Unconceived Origin Pass-Through",
      short: "Direct Pass-Through",
    },
    3: {
      label: "No Post-Mortem Experience (Bypass Trunk)",
      short: "No Afterlife (Bypass)",
    },
    4: {
      label: "Non-Simulated Reality (Bypass Trunk)",
      short: "Non-Sim (Bypass)",
    },
    5: {
      label: "Direct Sim / External Termination",
      short: "Direct Termination",
    },
  };

  const segmentsByCol = new Map<number, MarimekkoSegment[]>();
  const segmentMap = new Map<string, MarimekkoSegment>();

  for (let col = 0; col <= 6; col++) {
    const colNodes = [...graph.nodes]
      .filter((n) => n.columnIndex === col && n.probability > 1e-5)
      .sort((a, b) => b.probability - a.probability);

    const topRealNodeId = colNodes[0]?.id ?? null;

    interface RawSegItem {
      id: string;
      nodeId: string | null;
      label: string;
      shortLabel: string;
      probability: number;
      color: string;
      isTrunk: boolean;
      isTopNode: boolean;
      isFocusedNode: boolean;
      isConnectedToFocus: boolean;
      focusConditionalShare: number | null;
    }

    const rawItems: RawSegItem[] = colNodes.map((n) => {
      const isFocusedNode = lineage?.focusNodeId === n.id;
      const isConnectedToFocus = lineage
        ? lineage.connectedNodeIds.has(n.id)
        : false;
      const focusConditionalShare =
        lineage && isConnectedToFocus
          ? lineage.focusShareByNodeId.get(n.id) ?? null
          : null;

      return {
        id: n.id,
        nodeId: n.id,
        label: n.name,
        shortLabel: n.shortLabel || n.name,
        probability: n.probability,
        color: n.color,
        isTrunk: false,
        isTopNode: n.id === topRealNodeId,
        isFocusedNode,
        isConnectedToFocus,
        focusConditionalShare,
      };
    });

    const trunkMass = includeBypassTrunks ? trunkMassByCol.get(col) ?? 0 : 0;
    const trunkLinMass = includeBypassTrunks
      ? trunkLineageMassByCol.get(col) ?? 0
      : 0;
    if (trunkMass > 0.002) {
      const meta = TRUNK_LABELS[col] ?? {
        label: "Continuity Bypass Trunk",
        short: "Bypass Trunk",
      };
      const isTrunkConnected = lineage !== null && trunkLinMass > 1e-5;
      rawItems.push({
        id: `trunk-col-${col}`,
        nodeId: null,
        label: meta.label,
        shortLabel: meta.short,
        probability: trunkMass,
        color: "#64748b",
        isTrunk: true,
        isTopNode: false,
        isFocusedNode: false,
        isConnectedToFocus: isTrunkConnected,
        focusConditionalShare:
          lineage && isTrunkConnected
            ? Math.min(1, trunkLinMass / lineage.focusProb)
            : null,
      });
    }

    // When a focus node is active, sort connected real nodes to the top of the column
    // so all magnified branches group cleanly together without crossing unconnected blocks!
    if (lineage) {
      rawItems.sort((a, b) => {
        const aScore = a.isFocusedNode
          ? 3
          : a.isConnectedToFocus && !a.isTrunk
          ? 2
          : a.isConnectedToFocus && a.isTrunk
          ? 1
          : 0;
        const bScore = b.isFocusedNode
          ? 3
          : b.isConnectedToFocus && !b.isTrunk
          ? 2
          : b.isConnectedToFocus && b.isTrunk
          ? 1
          : 0;
        if (aScore !== bScore) return bScore - aScore;
        return b.probability - a.probability;
      });
    }

    const totalColMass = rawItems.reduce((acc, it) => acc + it.probability, 0);
    const gap = 2.4;
    const totalGap = Math.max(0, (rawItems.length - 1) * gap);
    const availH = Math.max(120, MARIMEKKO_TOTAL_H - totalGap);

    const x0 = MARIMEKKO_COL_X[col];
    const x1 = x0 + MARIMEKKO_PILLAR_W;

    let finalHeights: number[] = [];

    if (!lineage) {
      // Standard 100% proportional heights
      const rawHeights = rawItems.map((it) => {
        const share = totalColMass > 0 ? it.probability / totalColMass : 0;
        return Math.max(5.5, share * availH);
      });
      const sumRawH = rawHeights.reduce((a, b) => a + b, 0);
      const normFactor = sumRawH > 0 ? availH / sumRawH : 1;
      finalHeights = rawHeights.map((h) => h * normFactor);
    } else {
      // DYNAMIC LINEAGE MAGNIFICATION MODE:
      // Expand connected branches in this column so they occupy 75%-86% of column height
      // and every connected branch has a generous minimum height (36px-48px) for full label clarity!
      const connItems = rawItems.filter((it) => it.isConnectedToFocus);
      const otherItems = rawItems.filter((it) => !it.isConnectedToFocus);

      if (connItems.length === 0 || otherItems.length === 0) {
        // Either all connected or none connected in this column
        const weights = rawItems.map((it) =>
          it.isConnectedToFocus
            ? Math.max(0.12, Math.pow(it.focusConditionalShare ?? it.probability, 0.6))
            : Math.max(0.04, it.probability)
        );
        const wSum = weights.reduce((a, b) => a + b, 0);
        const minH = connItems.length > 0 ? 32 : 6;
        const rawH = weights.map((w) => Math.max(minH, (w / wSum) * availH));
        const rSum = rawH.reduce((a, b) => a + b, 0);
        finalHeights = rawH.map((h) => (h / rSum) * availH);
      } else {
        // Both connected and unconnected segments exist in this column:
        // Allocate 78% of vertical height to connected segments (or up to 86% if there are many connected nodes)
        const targetConnShare = Math.min(
          0.86,
          Math.max(0.75, connItems.length * 0.16)
        );
        const connAvailH = availH * targetConnShare;
        const otherAvailH = availH * (1 - targetConnShare);

        // Weight connected items by damped conditional share so even 1% connected branches get 36px-52px!
        const connWeights = connItems.map((it) => {
          if (it.isFocusedNode) return 1.5;
          if (it.isTrunk) return 0.35; // Keep connected bypass trunk modest so real connected nodes shine
          const cond = it.focusConditionalShare ?? it.probability;
          return Math.max(0.18, Math.pow(cond, 0.55));
        });
        const connWSum = connWeights.reduce((a, b) => a + b, 0);
        const minConnBoxH = Math.min(44, connAvailH / connItems.length);
        const rawConnH = connWeights.map((w) =>
          Math.max(minConnBoxH, (w / connWSum) * connAvailH)
        );
        const rawConnSum = rawConnH.reduce((a, b) => a + b, 0);
        const normConnH = rawConnH.map((h) => (h / rawConnSum) * connAvailH);

        // Compress unconnected items into the remaining 14%-25% at the bottom of the column
        const otherMassSum = otherItems.reduce(
          (acc, it) => acc + it.probability,
          0
        );
        const rawOtherH = otherItems.map((it) => {
          const share =
            otherMassSum > 0
              ? it.probability / otherMassSum
              : 1 / otherItems.length;
          return Math.max(5, share * otherAvailH);
        });
        const rawOtherSum = rawOtherH.reduce((a, b) => a + b, 0);
        const normOtherH = rawOtherH.map(
          (h) => (h / rawOtherSum) * otherAvailH
        );

        let cIdx = 0;
        let oIdx = 0;
        finalHeights = rawItems.map((it) =>
          it.isConnectedToFocus ? normConnH[cIdx++] : normOtherH[oIdx++]
        );
      }
    }

    let cursorY = MARIMEKKO_TOP_Y;
    const colSegs: MarimekkoSegment[] = [];

    rawItems.forEach((it, idx) => {
      const h = finalHeights[idx];
      const share = totalColMass > 0 ? it.probability / totalColMass : 0;
      const seg: MarimekkoSegment = {
        id: it.id,
        nodeId: it.nodeId,
        columnIndex: col,
        label: it.label,
        shortLabel: it.shortLabel,
        probability: it.probability,
        shareOfColumn: share,
        color: it.color,
        isTrunk: it.isTrunk,
        isTopNode: it.isTopNode,
        isFocusedNode: it.isFocusedNode,
        isConnectedToFocus: it.isConnectedToFocus,
        focusConditionalShare: it.focusConditionalShare,
        x0,
        x1,
        y0: cursorY,
        y1: cursorY + h,
        height: h,
      };
      colSegs.push(seg);
      segmentMap.set(seg.id, seg);
      cursorY += h + gap;
    });

    segmentsByCol.set(col, colSegs);
  }

  // Group step edges by source and target to slice vertical attachment intervals cleanly
  const outBySource = new Map<string, StepEdge[]>();
  const inByTarget = new Map<string, StepEdge[]>();

  for (const edge of stepEdgeMap.values()) {
    if (!segmentMap.has(edge.sourceSegId) || !segmentMap.has(edge.targetSegId)) {
      continue;
    }
    const outList = outBySource.get(edge.sourceSegId) || [];
    outList.push(edge);
    outBySource.set(edge.sourceSegId, outList);

    const inList = inByTarget.get(edge.targetSegId) || [];
    inList.push(edge);
    inByTarget.set(edge.targetSegId, inList);
  }

  for (const [, list] of outBySource.entries()) {
    list.sort((a, b) => {
      const ta = segmentMap.get(a.targetSegId);
      const tb = segmentMap.get(b.targetSegId);
      return (ta?.y0 ?? 0) - (tb?.y0 ?? 0);
    });
  }

  for (const [, list] of inByTarget.entries()) {
    list.sort((a, b) => {
      const sa = segmentMap.get(a.sourceSegId);
      const sb = segmentMap.get(b.sourceSegId);
      return (sa?.y0 ?? 0) - (sb?.y0 ?? 0);
    });
  }

  // Helper to compute visual slice weight of an edge on a segment's attachment bar.
  // When `lineage` is active, connected edges get boosted slice weight so ribbons connecting
  // magnified segments remain wide even when entering a high-mass node like Continued Expansion!
  const getEdgeVisualWeight = (e: StepEdge): number => {
    if (!lineage) return e.flow;
    if (e.isConnectedRibbon) {
      return Math.max(e.flow, e.lineageFlow * 6.5, 0.018);
    }
    return e.flow * 0.22;
  };

  const sourceSlice = new Map<string, { y0: number; y1: number }>();
  for (const [srcId, list] of outBySource.entries()) {
    const seg = segmentMap.get(srcId);
    if (!seg) continue;
    const weights = list.map(getEdgeVisualWeight);
    const sumW = weights.reduce((acc, w) => acc + w, 0);
    let cy = seg.y0;
    list.forEach((e, idx) => {
      const frac = sumW > 0 ? weights[idx] / sumW : 0;
      const h = seg.height * frac;
      sourceSlice.set(e.id, { y0: cy, y1: cy + h });
      cy += h;
    });
  }

  const targetSlice = new Map<string, { y0: number; y1: number }>();
  for (const [tgtId, list] of inByTarget.entries()) {
    const seg = segmentMap.get(tgtId);
    if (!seg) continue;
    const weights = list.map(getEdgeVisualWeight);
    const sumW = weights.reduce((acc, w) => acc + w, 0);
    let cy = seg.y0;
    list.forEach((e, idx) => {
      const frac = sumW > 0 ? weights[idx] / sumW : 0;
      const h = seg.height * frac;
      targetSlice.set(e.id, { y0: cy, y1: cy + h });
      cy += h;
    });
  }

  const ribbons: MarimekkoRibbon[] = [];
  for (const edge of stepEdgeMap.values()) {
    const sSeg = segmentMap.get(edge.sourceSegId);
    const tSeg = segmentMap.get(edge.targetSegId);
    if (!sSeg || !tSeg) continue;

    const sInterval = sourceSlice.get(edge.id) ?? {
      y0: sSeg.y0,
      y1: sSeg.y1,
    };
    const tInterval = targetSlice.get(edge.id) ?? {
      y0: tSeg.y0,
      y1: tSeg.y1,
    };

    const x0 = sSeg.x1;
    const x1 = tSeg.x0;
    const mx = (x0 + x1) / 2;
    const syCenter = (sInterval.y0 + sInterval.y1) / 2;
    const tyCenter = (tInterval.y0 + tInterval.y1) / 2;

    const pathD = [
      `M ${x0.toFixed(1)},${sInterval.y0.toFixed(1)}`,
      `C ${mx.toFixed(1)},${sInterval.y0.toFixed(1)} ${mx.toFixed(1)},${tInterval.y0.toFixed(1)} ${x1.toFixed(1)},${tInterval.y0.toFixed(1)}`,
      `L ${x1.toFixed(1)},${tInterval.y1.toFixed(1)}`,
      `C ${mx.toFixed(1)},${tInterval.y1.toFixed(1)} ${mx.toFixed(1)},${sInterval.y1.toFixed(1)} ${x0.toFixed(1)},${sInterval.y1.toFixed(1)}`,
      "Z",
    ].join(" ");

    ribbons.push({
      id: edge.id,
      sourceSegId: edge.sourceSegId,
      targetSegId: edge.targetSegId,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      flow: edge.flow,
      lineageFlow: edge.lineageFlow,
      isConnectedRibbon: edge.isConnectedRibbon,
      sourceColor: edge.sourceColor,
      targetColor: edge.targetColor,
      x0,
      x1,
      sy0: sInterval.y0,
      sy1: sInterval.y1,
      ty0: tInterval.y0,
      ty1: tInterval.y1,
      midX: mx,
      midY: (syCenter + tyCenter) / 2,
      pathD,
      isDominantBridge: sSeg.isTopNode && tSeg.isTopNode,
    });
  }

  // Sort ribbons so connected ribbons render on top of dimmed unconnected ribbons
  ribbons.sort((a, b) => {
    if (a.isConnectedRibbon !== b.isConnectedRibbon) {
      return a.isConnectedRibbon ? 1 : -1;
    }
    return a.flow - b.flow;
  });

  return { segmentsByCol, segmentMap, ribbons };
}

interface MacroRiverBlock {
  id: string;
  worldviewId: MacroWorldviewId;
  meta: MacroWorldviewMeta;
  columnIndex: number;
  probability: number;
  topRepresentativeNode: ComputedRealityNode | null;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  height: number;
}

interface MacroRiverRibbon {
  id: string;
  col: number;
  sourceWorldview: MacroWorldviewId;
  targetWorldview: MacroWorldviewId;
  flow: number;
  sourceColor: string;
  targetColor: string;
  pathD: string;
  x0: number;
  x1: number;
  syCenter: number;
  tyCenter: number;
}

/**
 * Builds the 5-Worldview Macro River (Bundled Paradigm Streamgraph) across all 7 Epochs.
 */
function buildMacroWorldviewRiverLayout(graph: ComputedRealityGraph): {
  blocksByCol: Map<number, MacroRiverBlock[]>;
  ribbons: MacroRiverRibbon[];
} {
  const massGrid = new Map<string, number>();
  const repNodeGrid = new Map<string, ComputedRealityNode>();

  for (const node of graph.nodes) {
    const wv = getNodeMacroWorldview(node.id);
    const key = `${node.columnIndex}:${wv}`;
    massGrid.set(key, (massGrid.get(key) ?? 0) + node.probability);
    const curBest = repNodeGrid.get(key);
    if (!curBest || node.probability > curBest.probability) {
      repNodeGrid.set(key, node);
    }
  }

  const stepFlows = new Map<string, number>();
  const addStep = (
    col: number,
    sWv: MacroWorldviewId,
    tWv: MacroWorldviewId,
    flow: number
  ) => {
    if (flow <= 1e-6) return;
    const key = `${col}:${sWv}->${tWv}`;
    stepFlows.set(key, (stepFlows.get(key) ?? 0) + flow);
  };

  for (const link of graph.links) {
    if (link.flow <= 1e-6) continue;
    const sNode = graph.nodeMap.get(link.sourceId);
    const tNode = graph.nodeMap.get(link.targetId);
    if (!sNode || !tNode) continue;

    const c0 = sNode.columnIndex;
    const c1 = tNode.columnIndex;
    if (c1 <= c0) continue;

    const sWv = getNodeMacroWorldview(sNode.id);
    const tWv = getNodeMacroWorldview(tNode.id);

    if (c1 === c0 + 1) {
      addStep(c0, sWv, tWv, link.flow);
    } else {
      for (let k = c0 + 1; k < c1; k++) {
        const key = `${k}:${sWv}`;
        massGrid.set(key, (massGrid.get(key) ?? 0) + link.flow);
        if (!repNodeGrid.has(key)) {
          repNodeGrid.set(key, sNode);
        }
      }
      for (let col = c0; col < c1; col++) {
        const nextWv = col + 1 === c1 ? tWv : sWv;
        addStep(col, sWv, nextWv, link.flow);
      }
    }
  }

  const blocksByCol = new Map<number, MacroRiverBlock[]>();
  const blockMap = new Map<string, MacroRiverBlock>();

  for (let col = 0; col <= 6; col++) {
    const activeWvs = MACRO_WORLDVIEWS.map((meta) => ({
      meta,
      prob: massGrid.get(`${col}:${meta.id}`) ?? 0,
    })).filter((item) => item.prob > 0.001);

    const totalMass = activeWvs.reduce((acc, it) => acc + it.prob, 0);
    const gap = 5;
    const availH =
      MARIMEKKO_TOTAL_H - Math.max(0, (activeWvs.length - 1) * gap);
    const x0 = MARIMEKKO_COL_X[col];
    const x1 = x0 + MARIMEKKO_PILLAR_W;

    const rawHeights = activeWvs.map((it) =>
      Math.max(14, (totalMass > 0 ? it.prob / totalMass : 0) * availH)
    );
    const sumRaw = rawHeights.reduce((a, b) => a + b, 0);
    const scale = sumRaw > 0 ? availH / sumRaw : 1;

    let cy = MARIMEKKO_TOP_Y;
    const colBlocks: MacroRiverBlock[] = [];
    activeWvs.forEach((it, idx) => {
      const h = rawHeights[idx] * scale;
      const bKey = `${col}:${it.meta.id}`;
      const block: MacroRiverBlock = {
        id: bKey,
        worldviewId: it.meta.id,
        meta: it.meta,
        columnIndex: col,
        probability: it.prob,
        topRepresentativeNode: repNodeGrid.get(bKey) ?? null,
        x0,
        x1,
        y0: cy,
        y1: cy + h,
        height: h,
      };
      colBlocks.push(block);
      blockMap.set(bKey, block);
      cy += h + gap;
    });
    blocksByCol.set(col, colBlocks);
  }

  const outByBlock = new Map<
    string,
    Array<{
      id: string;
      col: number;
      sWv: MacroWorldviewId;
      tWv: MacroWorldviewId;
      flow: number;
    }>
  >();
  const inByBlock = new Map<
    string,
    Array<{
      id: string;
      col: number;
      sWv: MacroWorldviewId;
      tWv: MacroWorldviewId;
      flow: number;
    }>
  >();

  for (const [key, flow] of stepFlows.entries()) {
    const [colStr, pairStr] = key.split(":");
    const col = Number(colStr);
    const [sWv, tWv] = pairStr.split("->") as [
      MacroWorldviewId,
      MacroWorldviewId,
    ];
    const sKey = `${col}:${sWv}`;
    const tKey = `${col + 1}:${tWv}`;
    if (!blockMap.has(sKey) || !blockMap.has(tKey)) continue;

    const item = { id: key, col, sWv, tWv, flow };
    const outList = outByBlock.get(sKey) || [];
    outList.push(item);
    outByBlock.set(sKey, outList);

    const inList = inByBlock.get(tKey) || [];
    inList.push(item);
    inByBlock.set(tKey, inList);
  }

  const srcSlice = new Map<string, { y0: number; y1: number }>();
  for (const [sKey, list] of outByBlock.entries()) {
    const blk = blockMap.get(sKey);
    if (!blk) continue;
    list.sort((a, b) => {
      const ta = blockMap.get(`${a.col + 1}:${a.tWv}`);
      const tb = blockMap.get(`${b.col + 1}:${b.tWv}`);
      return (ta?.y0 ?? 0) - (tb?.y0 ?? 0);
    });
    const sum = list.reduce((acc, i) => acc + i.flow, 0);
    let cy = blk.y0;
    for (const i of list) {
      const h = (sum > 0 ? i.flow / sum : 0) * blk.height;
      srcSlice.set(i.id, { y0: cy, y1: cy + h });
      cy += h;
    }
  }

  const tgtSlice = new Map<string, { y0: number; y1: number }>();
  for (const [tKey, list] of inByBlock.entries()) {
    const blk = blockMap.get(tKey);
    if (!blk) continue;
    list.sort((a, b) => {
      const sa = blockMap.get(`${a.col}:${a.sWv}`);
      const sb = blockMap.get(`${b.col}:${b.sWv}`);
      return (sa?.y0 ?? 0) - (sb?.y0 ?? 0);
    });
    const sum = list.reduce((acc, i) => acc + i.flow, 0);
    let cy = blk.y0;
    for (const i of list) {
      const h = (sum > 0 ? i.flow / sum : 0) * blk.height;
      tgtSlice.set(i.id, { y0: cy, y1: cy + h });
      cy += h;
    }
  }

  const ribbons: MacroRiverRibbon[] = [];
  for (const [key, flow] of stepFlows.entries()) {
    const [colStr, pairStr] = key.split(":");
    const col = Number(colStr);
    const [sWv, tWv] = pairStr.split("->") as [
      MacroWorldviewId,
      MacroWorldviewId,
    ];
    const sBlk = blockMap.get(`${col}:${sWv}`);
    const tBlk = blockMap.get(`${col + 1}:${tWv}`);
    if (!sBlk || !tBlk) continue;

    const sInt = srcSlice.get(key) ?? { y0: sBlk.y0, y1: sBlk.y1 };
    const tInt = tgtSlice.get(key) ?? { y0: tBlk.y0, y1: tBlk.y1 };

    const x0 = sBlk.x1;
    const x1 = tBlk.x0;
    const mx = (x0 + x1) / 2;

    const pathD = [
      `M ${x0.toFixed(1)},${sInt.y0.toFixed(1)}`,
      `C ${mx.toFixed(1)},${sInt.y0.toFixed(1)} ${mx.toFixed(1)},${tInt.y0.toFixed(1)} ${x1.toFixed(1)},${tInt.y0.toFixed(1)}`,
      `L ${x1.toFixed(1)},${tInt.y1.toFixed(1)}`,
      `C ${mx.toFixed(1)},${tInt.y1.toFixed(1)} ${mx.toFixed(1)},${sInt.y1.toFixed(1)} ${x0.toFixed(1)},${sInt.y1.toFixed(1)}`,
      "Z",
    ].join(" ");

    ribbons.push({
      id: key,
      col,
      sourceWorldview: sWv,
      targetWorldview: tWv,
      flow,
      sourceColor: sBlk.meta.color,
      targetColor: tBlk.meta.color,
      pathD,
      x0,
      x1,
      syCenter: (sInt.y0 + sInt.y1) / 2,
      tyCenter: (tInt.y0 + tInt.y1) / 2,
    });
  }

  return { blocksByCol, ribbons };
}

interface CosmicStorylinePath {
  id: string;
  nodes: ComputedRealityNode[];
  jointProbability: number;
  worldviewMeta: MacroWorldviewMeta;
}

function computeTopCosmicStorylines(
  graph: ComputedRealityGraph,
  limit = 6
): CosmicStorylinePath[] {
  const paths: CosmicStorylinePath[] = [];
  const roots = graph.nodes.filter(
    (n) => n.columnIndex === 0 && n.probability > 1e-4
  );

  const dfs = (currentChain: ComputedRealityNode[], currentProb: number) => {
    const last = currentChain[currentChain.length - 1];
    const outLinks = graph.links.filter(
      (l) => l.sourceId === last.id && l.conditionalProb > 0.01
    );
    if (outLinks.length === 0 || last.columnIndex === 6) {
      const wvId = getNodeMacroWorldview(
        currentChain[1]?.id ?? currentChain[0].id
      );
      paths.push({
        id: currentChain.map((n) => n.id).join("->"),
        nodes: currentChain,
        jointProbability: currentProb,
        worldviewMeta: MACRO_WORLDVIEW_MAP.get(wvId) ?? MACRO_WORLDVIEWS[0],
      });
      return;
    }

    for (const l of outLinks) {
      const nextNode = graph.nodeMap.get(l.targetId);
      if (!nextNode) continue;
      const nextProb = currentProb * l.conditionalProb;
      if (nextProb < 0.002) continue;
      dfs([...currentChain, nextNode], nextProb);
    }
  };

  for (const r of roots) {
    dfs([r], r.probability);
  }

  return paths
    .sort((a, b) => b.jointProbability - a.jointProbability)
    .slice(0, limit);
}

interface NatureOfRealityOverallFlowProps {
  graph: ComputedRealityGraph;
  isLightCanvas: boolean;
  selectedNodeId: string;
  conditionedNodeId: string | null;
  hoveredNodeId: string | null;
  focusedLineageNodeId?: string | null;
  onChangeFocusedLineageNodeId?: (nodeId: string | null) => void;
  onSelectNode: (nodeId: string) => void;
  onHoverNode: (nodeId: string | null) => void;
  onSwitchToSankey: () => void;
  customWorldviewTitle: string;
}

export function NatureOfRealityOverallFlow({
  graph,
  isLightCanvas,
  selectedNodeId,
  conditionedNodeId,
  hoveredNodeId,
  focusedLineageNodeId: externalFocusNodeId,
  onChangeFocusedLineageNodeId,
  onSelectNode,
  onHoverNode,
  onSwitchToSankey,
  customWorldviewTitle,
}: NatureOfRealityOverallFlowProps) {
  const uid = useId().replace(/:/g, "");
  const [flowMode, setFlowMode] = useState<OverallFlowVisualMode>("marimekko");
  const [includeBypassTrunks, setIncludeBypassTrunks] = useState<boolean>(true);
  const [hoveredMacroId, setHoveredMacroId] =
    useState<MacroWorldviewId | null>(null);

  // Dynamic Lineage Magnification State:
  // Clicking any node in the Marimekko diagram sets `focusedLineageNodeId` to expand
  // all connected forward & backward branches across all columns; clicking off or clicking again restores normal scale.
  const [internalFocusNodeId, setInternalFocusNodeId] = useState<
    string | null
  >(null);

  const focusedLineageNodeId =
    externalFocusNodeId !== undefined
      ? externalFocusNodeId
      : internalFocusNodeId;

  const setFocusedLineageNodeId = (
    updater: string | null | ((prev: string | null) => string | null)
  ) => {
    const nextVal =
      typeof updater === "function" ? updater(focusedLineageNodeId) : updater;
    if (onChangeFocusedLineageNodeId) {
      onChangeFocusedLineageNodeId(nextVal);
    } else {
      setInternalFocusNodeId(nextVal);
    }
  };

  // Allow Escape key to exit Lineage Magnification
  useEffect(() => {
    if (!focusedLineageNodeId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedLineageNodeId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedLineageNodeId]);

  const lineageAnalysis = useMemo(
    () => computeFocusLineageAnalysis(graph, focusedLineageNodeId),
    [graph, focusedLineageNodeId]
  );

  const focusedNode = useMemo(
    () =>
      focusedLineageNodeId
        ? graph.nodeMap.get(focusedLineageNodeId) ?? null
        : null,
    [graph, focusedLineageNodeId]
  );

  const marimekko = useMemo(
    () => buildMarimekkoFlowLayout(graph, includeBypassTrunks, lineageAnalysis),
    [graph, includeBypassTrunks, lineageAnalysis]
  );

  const macroRiver = useMemo(
    () => buildMacroWorldviewRiverLayout(graph),
    [graph]
  );

  const topStorylines = useMemo(
    () => computeTopCosmicStorylines(graph, 6),
    [graph]
  );

  const connectedBranchCount = lineageAnalysis
    ? lineageAnalysis.connectedNodeIds.size - 1
    : 0;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-lg transition-colors ${
        isLightCanvas
          ? "border-slate-200/90 bg-white text-slate-900"
          : "border-slate-800 bg-slate-900/90 text-slate-100"
      }`}
    >
      {/* Top Header & Visual Paradigm Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2
              className={`text-sm sm:text-base font-extrabold ${
                isLightCanvas ? "text-slate-900" : "text-white"
              }`}
            >
              Overall 7-Epoch Probability Flow ({customWorldviewTitle})
            </h2>
          </div>
          <p
            className={`text-xs mt-0.5 ${
              isLightCanvas ? "text-slate-600" : "text-slate-400"
            }`}
          >
            <strong>Click any node block</strong> to dynamically magnify all
            forward &amp; backward connected branches across every column while
            preserving true overall percentages;{" "}
            <strong>click empty background</strong> (or click the node again) to
            return to normal 100% proportional scale.
          </p>
        </div>

        {/* 3 Overall Flow Visual Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            role="group"
            aria-label="Overall Probability Flow Visualization Mode"
            className={`inline-flex items-center rounded-xl border p-0.5 text-xs ${
              isLightCanvas
                ? "border-slate-300 bg-slate-100"
                : "border-slate-800 bg-slate-950"
            }`}
          >
            <button
              type="button"
              onClick={() => setFlowMode("marimekko")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold transition-all ${
                flowMode === "marimekko"
                  ? "bg-indigo-600 text-white shadow-sm keep-white"
                  : isLightCanvas
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>100% Stage Marimekko Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setFlowMode("macro-river")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold transition-all ${
                flowMode === "macro-river"
                  ? "bg-fuchsia-600 text-white shadow-sm keep-white"
                  : isLightCanvas
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>5-Worldview Macro River</span>
            </button>
            <button
              type="button"
              onClick={() => setFlowMode("storyline-funnel")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold transition-all ${
                flowMode === "storyline-funnel"
                  ? "bg-amber-600 text-white shadow-sm keep-white"
                  : isLightCanvas
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Top 6 Storyline Funnel</span>
            </button>
          </div>

          {flowMode === "marimekko" && (
            <button
              type="button"
              onClick={() => setIncludeBypassTrunks((v) => !v)}
              className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                includeBypassTrunks
                  ? isLightCanvas
                    ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                    : "border-indigo-500/40 bg-indigo-950/60 text-indigo-200"
                  : isLightCanvas
                  ? "border-slate-300 bg-white text-slate-700"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
              title="Toggle between 100% Absolute Reality Scale (with Continuity Bypass Trunks at Epochs IV & V) vs. Normalized Stage-Only Scale"
            >
              {includeBypassTrunks
                ? "Scale: 100% Absolute (with Bypass Trunks)"
                : "Scale: Normalized per Stage"}
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchToSankey}
            className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
              isLightCanvas
                ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            43-Node Alluvial Sankey ↗
          </button>
        </div>
      </div>

      {/* Active Lineage Magnification Status Bar (When a Node is Clicked) */}
      {flowMode === "marimekko" && focusedNode && (
        <div
          className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-xs transition-all ${
            isLightCanvas
              ? "border-indigo-300 bg-indigo-50/90 text-indigo-950"
              : "border-indigo-500/50 bg-indigo-950/50 text-indigo-100"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white keep-white">
              <ZoomIn className="h-3 w-3" />
              <span>Lineage Magnification Active</span>
            </span>
            <span>
              Inspecting{" "}
              <strong className="font-extrabold">{focusedNode.name}</strong> (
              <span className="font-mono font-extrabold">
                {formatPct(focusedNode.probability, 1)} overall
              </span>
              ) — dynamically expanded{" "}
              <strong>{connectedBranchCount} connected branches</strong>{" "}
              (forward &amp; backward) across all columns while showing true
              overall percentages + conditional shares.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFocusedLineageNodeId(null)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-500 keep-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restore 100% Proportional Sizes (Click Off)</span>
          </button>
        </div>
      )}

      {/* MODE 1: 100% Proportional Stage Marimekko & Alluvial Flow Bridges */}
      {flowMode === "marimekko" && (
        <div className="mt-3">
          <div
            onClick={() => {
              if (focusedLineageNodeId) {
                setFocusedLineageNodeId(null);
              }
            }}
            className={`relative w-full overflow-x-auto rounded-xl border p-2 ${
              focusedLineageNodeId ? "cursor-zoom-out" : ""
            } ${
              isLightCanvas
                ? "border-slate-200 bg-[#fcfbf8]"
                : "border-slate-800/90 bg-[#070b14]"
            }`}
          >
            <svg
              viewBox={`0 0 ${MARIMEKKO_VIEWBOX.w} ${MARIMEKKO_VIEWBOX.h}`}
              className="w-full h-auto min-w-[960px]"
              role="img"
            >
              <title>
                7-Stage 100% Proportional Marimekko &amp; Dynamic Lineage
                Magnification Flow Diagram
              </title>
              <defs>
                {marimekko.ribbons.map((r) => {
                  const isFocusMode = lineageAnalysis !== null;
                  const isActiveRibbon = isFocusMode
                    ? r.isConnectedRibbon
                    : r.isDominantBridge;
                  const baseOpacity = isFocusMode
                    ? r.isConnectedRibbon
                      ? isLightCanvas
                        ? 0.72
                        : 0.78
                      : isLightCanvas
                      ? 0.09
                      : 0.1
                    : r.isDominantBridge
                    ? isLightCanvas
                      ? 0.62
                      : 0.7
                    : isLightCanvas
                    ? 0.36
                    : 0.42;

                  return (
                    <linearGradient
                      key={`mm-grad-${r.id}`}
                      id={`${uid}-mm-grad-${r.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`}
                      gradientUnits="userSpaceOnUse"
                      x1={r.x0}
                      y1={(r.sy0 + r.sy1) / 2}
                      x2={r.x1}
                      y2={(r.ty0 + r.ty1) / 2}
                    >
                      <stop
                        offset="5%"
                        stopColor={r.sourceColor}
                        stopOpacity={baseOpacity}
                      />
                      <stop
                        offset="95%"
                        stopColor={r.targetColor}
                        stopOpacity={
                          isActiveRibbon ? baseOpacity : baseOpacity
                        }
                      />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* 7 Epoch Column Headers (Properly fitted inside 148px pillar width) */}
              {NATURE_OF_REALITY_EPOCHS.map((ep) => {
                const x0 = MARIMEKKO_COL_X[ep.columnIndex];
                const conciseTop =
                  CONCISE_EPOCH_PILL_TITLES[ep.columnIndex] ??
                  ep.shortTitle.toUpperCase();
                const isFocusedCol =
                  lineageAnalysis?.focusColumn === ep.columnIndex;

                return (
                  <g
                    key={`mm-hdr-${ep.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <rect
                      x={x0}
                      y={8}
                      width={MARIMEKKO_PILLAR_W}
                      height={50}
                      rx={8}
                      fill={isLightCanvas ? "#ffffff" : "#0f172a"}
                      stroke={ep.badgeColor}
                      strokeWidth={isFocusedCol ? 2.2 : 1.5}
                    />
                    <rect
                      x={x0}
                      y={8}
                      width={MARIMEKKO_PILLAR_W}
                      height={17}
                      rx={6}
                      fill={ep.badgeColor}
                    />
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={19.5}
                      textAnchor="middle"
                      fontSize={8.5}
                      fontWeight={800}
                      fill="#ffffff"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {conciseTop}
                    </text>
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={37}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill={isLightCanvas ? "#0f172a" : "#f8fafc"}
                    >
                      {ep.questionTitle.length > 23
                        ? `${ep.questionTitle.slice(0, 22)}…`
                        : ep.questionTitle}
                    </text>
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={51}
                      textAnchor="middle"
                      fontSize={8.5}
                      fontWeight={600}
                      fill={
                        lineageAnalysis
                          ? isFocusedCol
                            ? ep.badgeColor
                            : isLightCanvas
                            ? "#4338ca"
                            : "#818cf8"
                          : isLightCanvas
                          ? "#475569"
                          : "#94a3b8"
                      }
                    >
                      {lineageAnalysis
                        ? isFocusedCol
                          ? "★ Focused Origin Column"
                          : "Connected Paths Magnified"
                        : "100% Proportional Pillar"}
                    </text>
                  </g>
                );
              })}

              {/* Tapered Alluvial Flow Bridges Between Adjacent Pillars */}
              <g className="marimekko-ribbons">
                {marimekko.ribbons.map((r) => {
                  const isHoverMatch =
                    hoveredNodeId !== null &&
                    (r.sourceNodeId === hoveredNodeId ||
                      r.targetNodeId === hoveredNodeId);
                  const gradId = `${uid}-mm-grad-${r.id.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                  )}`;

                  const showFlowBadge =
                    lineageAnalysis !== null &&
                    r.isConnectedRibbon &&
                    r.lineageFlow >= 0.004 &&
                    Math.abs(r.sy1 - r.sy0) >= 12 &&
                    Math.abs(r.ty1 - r.ty0) >= 12;

                  return (
                    <g key={r.id}>
                      <path
                        d={r.pathD}
                        fill={`url(#${gradId})`}
                        stroke={
                          r.isConnectedRibbon || isHoverMatch
                            ? r.sourceColor
                            : r.isDominantBridge && !lineageAnalysis
                            ? r.sourceColor
                            : "none"
                        }
                        strokeWidth={
                          r.isConnectedRibbon || isHoverMatch
                            ? 1.3
                            : r.isDominantBridge && !lineageAnalysis
                            ? 0.6
                            : 0
                        }
                        opacity={
                          hoveredNodeId && !lineageAnalysis
                            ? isHoverMatch
                              ? 0.95
                              : 0.2
                            : 1
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (r.sourceNodeId) {
                            setFocusedLineageNodeId((prev) =>
                              prev === r.sourceNodeId ? null : r.sourceNodeId
                            );
                            onSelectNode(r.sourceNodeId);
                          }
                        }}
                        className="cursor-pointer transition-all duration-300"
                      >
                        <title>
                          Overall Transition Flow: {formatPct(r.flow, 2)}
                          {r.isConnectedRibbon && r.lineageFlow > 0
                            ? ` (Focused Lineage Flow: ${formatPct(
                                r.lineageFlow,
                                2
                              )})`
                            : ""}
                        </title>
                      </path>

                      {/* Mid-Ribbon Flow Badge for Magnified Connected Paths */}
                      {showFlowBadge && (
                        <g
                          transform={`translate(${r.midX.toFixed(
                            1
                          )}, ${r.midY.toFixed(1)})`}
                          style={{ pointerEvents: "none" }}
                        >
                          <rect
                            x={-22}
                            y={-7.5}
                            width={44}
                            height={15}
                            rx={4}
                            fill={isLightCanvas ? "#0f172ae6" : "#020617ee"}
                            stroke={r.sourceColor}
                            strokeWidth={1}
                          />
                          <text
                            x={0}
                            y={3}
                            textAnchor="middle"
                            fontSize={8.5}
                            fontWeight={800}
                            fill="#ffffff"
                          >
                            {formatPct(r.lineageFlow, 1)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Stacked Proportional / Dynamically Magnified Stage Segments */}
              <g className="marimekko-segments">
                {Array.from(marimekko.segmentsByCol.values())
                  .flat()
                  .map((seg) => {
                    const isSelected =
                      seg.nodeId !== null && seg.nodeId === selectedNodeId;
                    const isConditioned =
                      seg.nodeId !== null && seg.nodeId === conditionedNodeId;
                    const isHovered =
                      seg.nodeId !== null && seg.nodeId === hoveredNodeId;

                    const isDimmedByFocus =
                      lineageAnalysis !== null && !seg.isConnectedToFocus;

                    const showTwoLines = seg.height >= 26;
                    const showSingleLine =
                      !showTwoLines && seg.height >= 12.5;

                    const textFill = seg.isTrunk
                      ? isLightCanvas
                        ? "#334155"
                        : "#cbd5e1"
                      : seg.color === "#FFC502"
                      ? "#0f172a"
                      : "#ffffff";

                    // Secondary readout: show actual overall % AND conditional share when magnified!
                    let secondLineText = `${formatPct(seg.probability, 1)} overall`;
                    if (lineageAnalysis && seg.isConnectedToFocus) {
                      if (seg.isFocusedNode) {
                        secondLineText = `${formatPct(
                          seg.probability,
                          1
                        )} ★ FOCUSED`;
                      } else if (
                        seg.focusConditionalShare !== null &&
                        !seg.isTrunk
                      ) {
                        secondLineText = `${formatPct(
                          seg.probability,
                          1
                        )} (${Math.round(
                          seg.focusConditionalShare * 100
                        )}% of focus)`;
                      }
                    } else if (seg.isTopNode && !seg.isTrunk) {
                      secondLineText = `${formatPct(seg.probability, 1)} ★ #1`;
                    } else {
                      secondLineText = formatPct(seg.probability, 1);
                    }

                    return (
                      <g
                        key={seg.id}
                        opacity={isDimmedByFocus ? 0.28 : 1}
                        onMouseEnter={() => {
                          if (seg.nodeId) onHoverNode(seg.nodeId);
                        }}
                        onMouseLeave={() => onHoverNode(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (seg.nodeId) {
                            setFocusedLineageNodeId((prev) =>
                              prev === seg.nodeId ? null : seg.nodeId
                            );
                            onSelectNode(seg.nodeId);
                          } else {
                            // Clicking a trunk clears focus
                            setFocusedLineageNodeId(null);
                          }
                        }}
                        className={
                          seg.nodeId
                            ? "cursor-pointer transition-all duration-300"
                            : "cursor-default transition-all duration-300"
                        }
                      >
                        <rect
                          x={seg.x0}
                          y={seg.y0}
                          width={MARIMEKKO_PILLAR_W}
                          height={seg.height}
                          rx={4}
                          fill={
                            seg.isTrunk
                              ? isLightCanvas
                                ? "#e2e8f0"
                                : "#1e293b"
                              : seg.color
                          }
                          fillOpacity={
                            seg.isTrunk
                              ? 0.85
                              : seg.isFocusedNode
                              ? 1
                              : 0.94
                          }
                          stroke={
                            seg.isFocusedNode
                              ? isLightCanvas
                                ? "#0f172a"
                                : "#ffffff"
                              : isConditioned
                              ? "#f59e0b"
                              : seg.isConnectedToFocus && lineageAnalysis
                              ? isLightCanvas
                                ? "#1e1b4b"
                                : "#f8fafc"
                              : isSelected || isHovered
                              ? isLightCanvas
                                ? "#0f172a"
                                : "#ffffff"
                              : seg.isTopNode
                              ? "#fbbf24"
                              : isLightCanvas
                              ? "#ffffff"
                              : "#0f172a"
                          }
                          strokeWidth={
                            seg.isFocusedNode
                              ? 3
                              : seg.isConnectedToFocus && lineageAnalysis
                              ? 1.8
                              : isSelected || isConditioned
                              ? 2.2
                              : seg.isTopNode
                              ? 1.4
                              : 0.9
                          }
                          strokeDasharray={seg.isTrunk ? "3 2" : undefined}
                        />

                        {showTwoLines && (
                          <>
                            <text
                              x={seg.x0 + 6}
                              y={seg.y0 + seg.height / 2 - 2.5}
                              fontSize={10}
                              fontWeight={800}
                              fill={textFill}
                              style={{ pointerEvents: "none" }}
                            >
                              {seg.shortLabel.length > 20
                                ? `${seg.shortLabel.slice(0, 19)}…`
                                : seg.shortLabel}
                            </text>
                            <text
                              x={seg.x0 + 6}
                              y={seg.y0 + seg.height / 2 + 10}
                              fontSize={
                                lineageAnalysis && seg.isConnectedToFocus
                                  ? 9.5
                                  : 10.5
                              }
                              fontWeight={900}
                              fill={textFill}
                              style={{ pointerEvents: "none" }}
                            >
                              {secondLineText}
                            </text>
                          </>
                        )}

                        {showSingleLine && (
                          <text
                            x={seg.x0 + 5}
                            y={seg.y0 + seg.height / 2 + 3.5}
                            fontSize={9}
                            fontWeight={800}
                            fill={textFill}
                            style={{ pointerEvents: "none" }}
                          >
                            {seg.shortLabel.slice(0, 14)}{" "}
                            {formatPct(seg.probability, 1)}
                          </text>
                        )}

                        <title>
                          {seg.label}: {formatPct(seg.probability, 2)} of total
                          reality
                          {seg.focusConditionalShare !== null
                            ? ` • ${formatPct(
                                seg.focusConditionalShare,
                                1
                              )} of focused node (${focusedNode?.shortLabel || focusedNode?.name})`
                            : ""}{" "}
                          — Click to toggle Lineage Magnification
                        </title>
                      </g>
                    );
                  })}
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* MODE 2: 5-Worldview Macro River (Bundled Paradigm Streamgraph) */}
      {flowMode === "macro-river" && (
        <div className="mt-3 space-y-3">
          {/* 5 Philosophical Worldview Legend & Filter Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
            {MACRO_WORLDVIEWS.map((wv) => {
              const col0Share =
                macroRiver.blocksByCol
                  .get(0)
                  ?.find((b) => b.worldviewId === wv.id)?.probability ?? 0;
              const col2Share =
                macroRiver.blocksByCol
                  .get(2)
                  ?.find((b) => b.worldviewId === wv.id)?.probability ?? 0;
              const col6Share =
                macroRiver.blocksByCol
                  .get(6)
                  ?.find((b) => b.worldviewId === wv.id)?.probability ?? 0;
              const isActive = hoveredMacroId === wv.id;

              return (
                <div
                  key={wv.id}
                  onMouseEnter={() => setHoveredMacroId(wv.id)}
                  onMouseLeave={() => setHoveredMacroId(null)}
                  className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                    isActive ? "ring-2 ring-indigo-500 shadow-md" : ""
                  } ${
                    isLightCanvas
                      ? "border-slate-200 bg-slate-50/90 hover:bg-white"
                      : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: wv.color }}
                      />
                      <span
                        className={
                          isLightCanvas ? "text-slate-900" : "text-white"
                        }
                      >
                        {wv.shortName}
                      </span>
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-[10px] line-clamp-2 ${
                      isLightCanvas ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {wv.subtitle}
                  </p>
                  <div
                    className={`mt-1.5 flex items-center justify-between border-t pt-1 font-mono text-[10px] ${
                      isLightCanvas
                        ? "border-slate-200 text-slate-700"
                        : "border-slate-800 text-slate-300"
                    }`}
                  >
                    <span>Origin: {formatPct(col0Share, 0)}</span>
                    <span>Death: {formatPct(col2Share, 0)}</span>
                    <span>End: {formatPct(col6Share, 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5-Worldview Bundled Streamgraph SVG */}
          <div
            className={`relative w-full overflow-x-auto rounded-xl border p-2 ${
              isLightCanvas
                ? "border-slate-200 bg-[#fcfbf8]"
                : "border-slate-800/90 bg-[#070b14]"
            }`}
          >
            <svg
              viewBox={`0 0 ${MARIMEKKO_VIEWBOX.w} ${MARIMEKKO_VIEWBOX.h}`}
              className="w-full h-auto min-w-[960px]"
              role="img"
            >
              <title>
                5-Worldview Macro River across the 7 Epochs of Reality
              </title>
              <defs>
                {macroRiver.ribbons.map((r) => (
                  <linearGradient
                    key={`mr-grad-${r.id}`}
                    id={`${uid}-mr-grad-${r.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`}
                    gradientUnits="userSpaceOnUse"
                    x1={r.x0}
                    y1={r.syCenter}
                    x2={r.x1}
                    y2={r.tyCenter}
                  >
                    <stop
                      offset="10%"
                      stopColor={r.sourceColor}
                      stopOpacity={isLightCanvas ? 0.58 : 0.65}
                    />
                    <stop
                      offset="90%"
                      stopColor={r.targetColor}
                      stopOpacity={isLightCanvas ? 0.58 : 0.65}
                    />
                  </linearGradient>
                ))}
              </defs>

              {/* 7 Epoch Column Headers */}
              {NATURE_OF_REALITY_EPOCHS.map((ep) => {
                const x0 = MARIMEKKO_COL_X[ep.columnIndex];
                const conciseTop =
                  CONCISE_EPOCH_PILL_TITLES[ep.columnIndex] ??
                  ep.shortTitle.toUpperCase();
                return (
                  <g key={`mr-hdr-${ep.id}`}>
                    <rect
                      x={x0}
                      y={10}
                      width={MARIMEKKO_PILLAR_W}
                      height={46}
                      rx={8}
                      fill={isLightCanvas ? "#ffffff" : "#0f172a"}
                      stroke={ep.badgeColor}
                      strokeWidth={1.5}
                    />
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={27}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={800}
                      fill={ep.badgeColor}
                    >
                      {conciseTop}
                    </text>
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={44}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill={isLightCanvas ? "#0f172a" : "#f8fafc"}
                    >
                      {ep.questionTitle.length > 23
                        ? `${ep.questionTitle.slice(0, 22)}…`
                        : ep.questionTitle}
                    </text>
                  </g>
                );
              })}

              {/* Bundled Paradigm River Ribbons */}
              <g className="macro-river-ribbons">
                {macroRiver.ribbons.map((r) => {
                  const isFocus =
                    !hoveredMacroId ||
                    r.sourceWorldview === hoveredMacroId ||
                    r.targetWorldview === hoveredMacroId;
                  const gradId = `${uid}-mr-grad-${r.id.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                  )}`;
                  return (
                    <path
                      key={r.id}
                      d={r.pathD}
                      fill={`url(#${gradId})`}
                      opacity={isFocus ? 1 : 0.15}
                      className="transition-opacity duration-200"
                    >
                      <title>
                        {MACRO_WORLDVIEW_MAP.get(r.sourceWorldview)?.shortName}{" "}
                        →{" "}
                        {MACRO_WORLDVIEW_MAP.get(r.targetWorldview)?.shortName}:{" "}
                        {formatPct(r.flow, 1)}
                      </title>
                    </path>
                  );
                })}
              </g>

              {/* Bundled Paradigm Blocks per Epoch */}
              <g className="macro-river-blocks">
                {Array.from(macroRiver.blocksByCol.values())
                  .flat()
                  .map((blk) => {
                    const isFocus =
                      !hoveredMacroId || blk.worldviewId === hoveredMacroId;
                    return (
                      <g
                        key={blk.id}
                        opacity={isFocus ? 1 : 0.25}
                        onMouseEnter={() => setHoveredMacroId(blk.worldviewId)}
                        onMouseLeave={() => setHoveredMacroId(null)}
                        onClick={() => {
                          if (blk.topRepresentativeNode) {
                            onSelectNode(blk.topRepresentativeNode.id);
                          }
                        }}
                        className="cursor-pointer transition-opacity duration-200"
                      >
                        <rect
                          x={blk.x0}
                          y={blk.y0}
                          width={MARIMEKKO_PILLAR_W}
                          height={blk.height}
                          rx={6}
                          fill={blk.meta.color}
                          stroke={isLightCanvas ? "#ffffff" : "#0f172a"}
                          strokeWidth={1.4}
                        />
                        {blk.height >= 26 ? (
                          <>
                            <text
                              x={blk.x0 + 7}
                              y={blk.y0 + blk.height / 2 - 2}
                              fontSize={10}
                              fontWeight={800}
                              fill="#ffffff"
                            >
                              {blk.meta.shortName}
                            </text>
                            <text
                              x={blk.x0 + 7}
                              y={blk.y0 + blk.height / 2 + 11}
                              fontSize={11}
                              fontWeight={900}
                              fill="#ffffff"
                            >
                              {formatPct(blk.probability, 1)}
                            </text>
                          </>
                        ) : (
                          blk.height >= 14 && (
                            <text
                              x={blk.x0 + 6}
                              y={blk.y0 + blk.height / 2 + 3.5}
                              fontSize={9.5}
                              fontWeight={800}
                              fill="#ffffff"
                            >
                              {blk.meta.shortName.split("/")[0].trim()}{" "}
                              {formatPct(blk.probability, 1)}
                            </text>
                          )
                        )}
                      </g>
                    );
                  })}
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* MODE 3: Top 6 End-to-End Cosmic Storyline Trajectories Funnel */}
      {flowMode === "storyline-funnel" && (
        <div className="mt-3 space-y-2.5">
          <div
            className={`text-xs ${
              isLightCanvas ? "text-slate-600" : "text-slate-400"
            }`}
          >
            Ranked end-to-end joint probability trajectories{" "}
            <code className="font-mono font-bold">
              P(Origin) × P(Mechanism | Origin) × … × P(Cosmic Fate)
            </code>{" "}
            computed live from your current conditional splits:
          </div>

          <div className="space-y-2">
            {topStorylines.map((path, rankIdx) => {
              const maxProb = topStorylines[0]?.jointProbability ?? 0.2;
              const barShare =
                maxProb > 0
                  ? Math.max(8, (path.jointProbability / maxProb) * 100)
                  : 20;

              return (
                <div
                  key={path.id}
                  className={`rounded-xl border p-3 transition-all ${
                    rankIdx === 0
                      ? isLightCanvas
                        ? "border-indigo-300 bg-indigo-50/50 shadow-sm"
                        : "border-indigo-500/50 bg-indigo-950/30 shadow-md"
                      : isLightCanvas
                      ? "border-slate-200 bg-slate-50/70"
                      : "border-slate-800 bg-slate-950/70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 font-mono text-[11px] font-extrabold text-white keep-white"
                        style={{ backgroundColor: path.worldviewMeta.color }}
                      >
                        #{rankIdx + 1} Cosmic Storyline
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isLightCanvas ? "text-slate-800" : "text-slate-200"
                        }`}
                      >
                        {path.worldviewMeta.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-sm font-extrabold tabular-nums"
                        style={{ color: path.worldviewMeta.color }}
                      >
                        {formatPct(path.jointProbability, 2)} of Total Reality
                      </span>
                    </div>
                  </div>

                  {/* Proportional Joint Probability Funnel Bar */}
                  <div
                    className={`h-2 w-full overflow-hidden rounded-full mb-2.5 ${
                      isLightCanvas ? "bg-slate-200" : "bg-slate-800"
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barShare}%`,
                        background: `linear-gradient(90deg, ${
                          path.nodes[0]?.color ?? "#4f46e5"
                        } 0%, ${
                          path.nodes[Math.floor(path.nodes.length / 2)]
                            ?.color ?? "#0284c7"
                        } 50%, ${
                          path.nodes[path.nodes.length - 1]?.color ?? "#e11d48"
                        } 100%)`,
                      }}
                    />
                  </div>

                  {/* Connected Step-by-Step Chain Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {path.nodes.map((node, nIdx) => {
                      const ep = NATURE_OF_REALITY_EPOCHS[node.columnIndex];
                      const isSel = selectedNodeId === node.id;
                      return (
                        <React.Fragment key={`${path.id}-${node.id}`}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectNode(node.id);
                              setFocusedLineageNodeId(node.id);
                              setFlowMode("marimekko");
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-all ${
                              isSel
                                ? "border-sky-500 ring-1 ring-sky-500 font-extrabold"
                                : ""
                            } ${
                              isLightCanvas
                                ? "border-slate-300 bg-white text-slate-900 hover:border-indigo-400"
                                : "border-slate-700 bg-slate-900 text-slate-100 hover:border-indigo-400"
                            }`}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-sm shrink-0"
                              style={{ backgroundColor: node.color }}
                            />
                            <span className="font-mono text-[10px] opacity-75">
                              {ep?.shortTitle.split(".")[0]}:
                            </span>
                            <span className="font-bold">
                              {node.shortLabel || node.name}
                            </span>
                            <span
                              className="font-mono text-[11px] font-extrabold tabular-nums"
                              style={{ color: node.color }}
                            >
                              ({formatPct(node.probability, 1)})
                            </span>
                          </button>
                          {nIdx < path.nodes.length - 1 && (
                            <span
                              className={`font-mono text-xs font-bold ${
                                isLightCanvas
                                  ? "text-slate-400"
                                  : "text-slate-500"
                              }`}
                            >
                              →
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
