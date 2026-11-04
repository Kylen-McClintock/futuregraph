"use client";

import React, { useId, useMemo, useState } from "react";
import {
  Compass,
  Focus,
  GitBranch,
  Layers,
  Sparkles,
  Workflow,
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
    subtitle: "Naturalistic inflation, quantum vacuum, biological cessation & thermodynamic fate",
    color: "#4f46e5",
    lightBg: "#eef2ff",
  },
  {
    id: "simulation",
    name: "Simulation & Technological Creation",
    shortName: "Simulation / Tech",
    subtitle: "Ancestor/alien substrates, waking up outside the sim & computational shutdown",
    color: "#0284c7",
    lightBg: "#f0f9ff",
  },
  {
    id: "consciousness",
    name: "Idealist & Universal Consciousness",
    shortName: "Idealist / Mind",
    subtitle: "Non-material continuation, cosmic mind return, reincarnation & experiential loops",
    color: "#c026d3",
    lightBg: "#fdf4ff",
  },
  {
    id: "theistic",
    name: "Theistic & Moral Teleology",
    shortName: "Theistic / Moral",
    subtitle: "Divine creation, afterlife judgment, foundational moral weight & creator telos",
    color: "#e11d48",
    lightBg: "#fff1f2",
  },
  {
    id: "mysterian",
    name: "Mysterian & Epistemic Horizon",
    shortName: "Mysterian / Unknown",
    subtitle: "Beyond human cognitive closure: unconceived origins, mechanisms & endings",
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
  sourceColor: string;
  targetColor: string;
  x0: number;
  x1: number;
  sy0: number;
  sy1: number;
  ty0: number;
  ty1: number;
  pathD: string;
  isDominantBridge: boolean;
}

const MARIMEKKO_VIEWBOX = { w: 1520, h: 430 };
const MARIMEKKO_COL_X = [20, 236, 452, 668, 884, 1100, 1316];
const MARIMEKKO_PILLAR_W = 132;
const MARIMEKKO_TOP_Y = 68;
const MARIMEKKO_BOTTOM_Y = 404;
const MARIMEKKO_TOTAL_H = MARIMEKKO_BOTTOM_Y - MARIMEKKO_TOP_Y;

/**
 * Builds the 7-Stage Proportional Marimekko & Alluvial Flow layout.
 * When `includeBypassTrunks` is true, multi-column jumps pass through explicit
 * Continuity Trunk blocks so every single column sums to 100.0% of reality.
 * When `includeBypassTrunks` is false, each column normalizes its active hypotheses to 100% height.
 */
function buildMarimekkoFlowLayout(
  graph: ComputedRealityGraph,
  includeBypassTrunks: boolean
): {
  segmentsByCol: Map<number, MarimekkoSegment[]>;
  segmentMap: Map<string, MarimekkoSegment>;
  ribbons: MarimekkoRibbon[];
} {
  // Expand multi-column links into single-column steps when includeBypassTrunks is true
  interface StepEdge {
    id: string;
    col: number; // connects col -> col + 1
    sourceSegId: string;
    targetSegId: string;
    sourceNodeId: string | null;
    targetNodeId: string | null;
    flow: number;
    sourceColor: string;
    targetColor: string;
  }

  const trunkMassByCol = new Map<number, number>();
  const stepEdgeMap = new Map<string, StepEdge>();

  const addStepEdge = (
    col: number,
    sourceSegId: string,
    targetSegId: string,
    sourceNodeId: string | null,
    targetNodeId: string | null,
    flow: number,
    sourceColor: string,
    targetColor: string
  ) => {
    if (flow <= 1e-6) return;
    const key = `${col}:${sourceSegId}->${targetSegId}`;
    const existing = stepEdgeMap.get(key);
    if (existing) {
      existing.flow += flow;
    } else {
      stepEdgeMap.set(key, {
        id: key,
        col,
        sourceSegId,
        targetSegId,
        sourceNodeId,
        targetNodeId,
        flow,
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

    if (c1 === c0 + 1) {
      addStepEdge(
        c0,
        sNode.id,
        tNode.id,
        sNode.id,
        tNode.id,
        link.flow,
        sNode.color,
        tNode.color
      );
    } else if (includeBypassTrunks) {
      // Multi-column jump: route through Continuity Trunks at intermediate columns
      for (let k = c0 + 1; k < c1; k++) {
        trunkMassByCol.set(k, (trunkMassByCol.get(k) ?? 0) + link.flow);
      }
      for (let col = c0; col < c1; col++) {
        const srcId = col === c0 ? sNode.id : `trunk-col-${col}`;
        const tgtId = col + 1 === c1 ? tNode.id : `trunk-col-${col + 1}`;
        const srcNodeId = col === c0 ? sNode.id : sNode.id;
        const tgtNodeId = col + 1 === c1 ? tNode.id : tNode.id;
        const srcColor = col === c0 ? sNode.color : "#64748b";
        const tgtColor = col + 1 === c1 ? tNode.color : "#64748b";
        addStepEdge(
          col,
          srcId,
          tgtId,
          srcNodeId,
          tgtNodeId,
          link.flow,
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
    const rawItems: Array<{
      id: string;
      nodeId: string | null;
      label: string;
      shortLabel: string;
      probability: number;
      color: string;
      isTrunk: boolean;
      isTopNode: boolean;
    }> = colNodes.map((n) => ({
      id: n.id,
      nodeId: n.id,
      label: n.name,
      shortLabel: n.shortLabel || n.name,
      probability: n.probability,
      color: n.color,
      isTrunk: false,
      isTopNode: n.id === topRealNodeId,
    }));

    const trunkMass = includeBypassTrunks ? trunkMassByCol.get(col) ?? 0 : 0;
    if (trunkMass > 0.002) {
      const meta = TRUNK_LABELS[col] ?? {
        label: "Continuity Bypass Trunk",
        short: "Bypass Trunk",
      };
      // Place trunk at the bottom of the pillar so the active hypotheses for that question sit prominently at the top!
      rawItems.push({
        id: `trunk-col-${col}`,
        nodeId: null,
        label: meta.label,
        shortLabel: meta.short,
        probability: trunkMass,
        color: "#64748b",
        isTrunk: true,
        isTopNode: false,
      });
    }

    const totalColMass = rawItems.reduce((acc, it) => acc + it.probability, 0);
    const gap = 2.2;
    const totalGap = Math.max(0, (rawItems.length - 1) * gap);
    const availH = Math.max(120, MARIMEKKO_TOTAL_H - totalGap);

    const x0 = MARIMEKKO_COL_X[col];
    const x1 = x0 + MARIMEKKO_PILLAR_W;

    // Compute raw heights with a minimum of 5px so small hypotheses remain clickable
    const rawHeights = rawItems.map((it) => {
      const share = totalColMass > 0 ? it.probability / totalColMass : 0;
      return Math.max(5.5, share * availH);
    });
    const sumRawH = rawHeights.reduce((a, b) => a + b, 0);
    const normFactor = sumRawH > 0 ? availH / sumRawH : 1;

    let cursorY = MARIMEKKO_TOP_Y;
    const colSegs: MarimekkoSegment[] = [];

    rawItems.forEach((it, idx) => {
      const h = rawHeights[idx] * normFactor;
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

  const sourceSlice = new Map<string, { y0: number; y1: number }>();
  for (const [srcId, list] of outBySource.entries()) {
    const seg = segmentMap.get(srcId);
    if (!seg) continue;
    const sumFlow = list.reduce((acc, e) => acc + e.flow, 0);
    let cy = seg.y0;
    for (const e of list) {
      const frac = sumFlow > 0 ? e.flow / sumFlow : 0;
      const h = seg.height * frac;
      sourceSlice.set(e.id, { y0: cy, y1: cy + h });
      cy += h;
    }
  }

  const targetSlice = new Map<string, { y0: number; y1: number }>();
  for (const [tgtId, list] of inByTarget.entries()) {
    const seg = segmentMap.get(tgtId);
    if (!seg) continue;
    const sumFlow = list.reduce((acc, e) => acc + e.flow, 0);
    let cy = seg.y0;
    for (const e of list) {
      const frac = sumFlow > 0 ? e.flow / sumFlow : 0;
      const h = seg.height * frac;
      targetSlice.set(e.id, { y0: cy, y1: cy + h });
      cy += h;
    }
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
      sourceColor: edge.sourceColor,
      targetColor: edge.targetColor,
      x0,
      x1,
      sy0: sInterval.y0,
      sy1: sInterval.y1,
      ty0: tInterval.y0,
      ty1: tInterval.y1,
      pathD,
      isDominantBridge: sSeg.isTopNode && tSeg.isTopNode,
    });
  }

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
 * Multi-column jumps carry their upstream worldview paradigm across intermediate epochs
 * so all 5 worldview rivers flow continuously from Origin (Epoch I) to Cosmic Fate (Epoch VII).
 */
function buildMacroWorldviewRiverLayout(graph: ComputedRealityGraph): {
  blocksByCol: Map<number, MacroRiverBlock[]>;
  ribbons: MacroRiverRibbon[];
} {
  // Mass per (col, worldview)
  const massGrid = new Map<string, number>();
  // Representative node with highest probability in (col, worldview)
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

  // Step transitions between (col, sourceWv) -> (col+1, targetWv)
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
      // Carry sWv across intermediate columns c0+1 .. c1-1, then transition to tWv at c1-1 -> c1
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
    const availH = MARIMEKKO_TOTAL_H - Math.max(0, (activeWvs.length - 1) * gap);
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

  // Slice ribbons between macro blocks
  const outByBlock = new Map<
    string,
    Array<{ id: string; col: number; sWv: MacroWorldviewId; tWv: MacroWorldviewId; flow: number }>
  >();
  const inByBlock = new Map<
    string,
    Array<{ id: string; col: number; sWv: MacroWorldviewId; tWv: MacroWorldviewId; flow: number }>
  >();

  for (const [key, flow] of stepFlows.entries()) {
    const [colStr, pairStr] = key.split(":");
    const col = Number(colStr);
    const [sWv, tWv] = pairStr.split("->") as [MacroWorldviewId, MacroWorldviewId];
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
    const [sWv, tWv] = pairStr.split("->") as [MacroWorldviewId, MacroWorldviewId];
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

/**
 * Computes the Top 6 Complete End-to-End Cosmic Storyline Trajectories from Epoch I to Epoch VII
 */
function computeTopCosmicStorylines(
  graph: ComputedRealityGraph,
  limit = 6
): CosmicStorylinePath[] {
  const paths: CosmicStorylinePath[] = [];
  const roots = graph.nodes.filter((n) => n.columnIndex === 0 && n.probability > 1e-4);

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
        worldviewMeta:
          MACRO_WORLDVIEW_MAP.get(wvId) ?? MACRO_WORLDVIEWS[0],
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

  const marimekko = useMemo(
    () => buildMarimekkoFlowLayout(graph, includeBypassTrunks),
    [graph, includeBypassTrunks]
  );

  const macroRiver = useMemo(
    () => buildMacroWorldviewRiverLayout(graph),
    [graph]
  );

  const topStorylines = useMemo(
    () => computeTopCosmicStorylines(graph, 6),
    [graph]
  );

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
            Visualizing how 100% of probability mass flows from{" "}
            <strong>Before Our Universe (Epoch I)</strong> through{" "}
            <strong>Death &amp; Simulation (Epochs III–V)</strong> to{" "}
            <strong>Ultimate Cosmic Fate (Epoch VII)</strong>. Drag any card
            slider below to watch the overall flow morph live.
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

      {/* MODE 1: 100% Proportional Stage Marimekko & Alluvial Flow Bridges */}
      {flowMode === "marimekko" && (
        <div className="mt-3">
          <div
            className={`relative w-full overflow-x-auto rounded-xl border p-2 ${
              isLightCanvas
                ? "border-slate-200 bg-[#fcfbf8]"
                : "border-slate-800/90 bg-[#070b14]"
            }`}
          >
            <svg
              viewBox={`0 0 ${MARIMEKKO_VIEWBOX.w} ${MARIMEKKO_VIEWBOX.h}`}
              className="w-full h-auto min-w-[920px]"
              role="img"
            >
              <title>
                7-Stage 100% Proportional Marimekko &amp; Alluvial Flow Diagram
              </title>
              <defs>
                {marimekko.ribbons.map((r) => (
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
                      stopOpacity={
                        r.isDominantBridge
                          ? isLightCanvas
                            ? 0.65
                            : 0.72
                          : isLightCanvas
                          ? 0.36
                          : 0.42
                      }
                    />
                    <stop
                      offset="95%"
                      stopColor={r.targetColor}
                      stopOpacity={
                        r.isDominantBridge
                          ? isLightCanvas
                            ? 0.65
                            : 0.72
                          : isLightCanvas
                          ? 0.36
                          : 0.42
                      }
                    />
                  </linearGradient>
                ))}
              </defs>

              {/* 7 Epoch Column Headers */}
              {NATURE_OF_REALITY_EPOCHS.map((ep) => {
                const x0 = MARIMEKKO_COL_X[ep.columnIndex];
                return (
                  <g key={`mm-hdr-${ep.id}`}>
                    <rect
                      x={x0}
                      y={10}
                      width={MARIMEKKO_PILLAR_W}
                      height={48}
                      rx={8}
                      fill={isLightCanvas ? "#ffffff" : "#0f172a"}
                      stroke={ep.badgeColor}
                      strokeWidth={1.5}
                    />
                    <rect
                      x={x0}
                      y={10}
                      width={MARIMEKKO_PILLAR_W}
                      height={16}
                      rx={6}
                      fill={ep.badgeColor}
                    />
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={21.5}
                      textAnchor="middle"
                      fontSize={9.5}
                      fontWeight={800}
                      fill="#ffffff"
                    >
                      {ep.shortTitle.toUpperCase()}
                    </text>
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={38}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill={isLightCanvas ? "#0f172a" : "#f8fafc"}
                    >
                      {ep.questionTitle.length > 22
                        ? `${ep.questionTitle.slice(0, 21)}…`
                        : ep.questionTitle}
                    </text>
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={51}
                      textAnchor="middle"
                      fontSize={8.5}
                      fontWeight={600}
                      fill={isLightCanvas ? "#475569" : "#94a3b8"}
                    >
                      100% Proportional Pillar
                    </text>
                  </g>
                );
              })}

              {/* Tapered Alluvial Flow Bridges Between Adjacent Pillars */}
              <g className="marimekko-ribbons">
                {marimekko.ribbons.map((r) => {
                  const isHighlighted =
                    (hoveredNodeId &&
                      (r.sourceNodeId === hoveredNodeId ||
                        r.targetNodeId === hoveredNodeId)) ||
                    (selectedNodeId &&
                      (r.sourceNodeId === selectedNodeId ||
                        r.targetNodeId === selectedNodeId));
                  const gradId = `${uid}-mm-grad-${r.id.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                  )}`;
                  return (
                    <path
                      key={r.id}
                      d={r.pathD}
                      fill={`url(#${gradId})`}
                      stroke={
                        isHighlighted
                          ? r.sourceColor
                          : r.isDominantBridge
                          ? r.sourceColor
                          : "none"
                      }
                      strokeWidth={
                        isHighlighted ? 1.4 : r.isDominantBridge ? 0.7 : 0
                      }
                      opacity={
                        hoveredNodeId
                          ? isHighlighted
                            ? 0.95
                            : 0.18
                          : 1
                      }
                      onClick={() => {
                        if (r.sourceNodeId) onSelectNode(r.sourceNodeId);
                      }}
                      className="cursor-pointer transition-opacity duration-200"
                    >
                      <title>
                        Flow: {formatPct(r.flow, 1)}
                      </title>
                    </path>
                  );
                })}
              </g>

              {/* 100% Stacked Proportional Stage Segments */}
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

                    const showTwoLines = seg.height >= 28;
                    const showSingleLine =
                      !showTwoLines && seg.height >= 13;

                    return (
                      <g
                        key={seg.id}
                        onMouseEnter={() => {
                          if (seg.nodeId) onHoverNode(seg.nodeId);
                        }}
                        onMouseLeave={() => onHoverNode(null)}
                        onClick={() => {
                          if (seg.nodeId) onSelectNode(seg.nodeId);
                        }}
                        className={
                          seg.nodeId ? "cursor-pointer" : "cursor-default"
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
                          fillOpacity={seg.isTrunk ? 0.85 : 0.92}
                          stroke={
                            isConditioned
                              ? "#f59e0b"
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
                            isSelected || isConditioned
                              ? 2.4
                              : seg.isTopNode
                              ? 1.5
                              : 0.9
                          }
                          strokeDasharray={seg.isTrunk ? "3 2" : undefined}
                        />

                        {showTwoLines && (
                          <>
                            <text
                              x={seg.x0 + 6}
                              y={seg.y0 + seg.height / 2 - 2}
                              fontSize={10}
                              fontWeight={800}
                              fill={
                                seg.isTrunk
                                  ? isLightCanvas
                                    ? "#334155"
                                    : "#cbd5e1"
                                  : seg.color === "#FFC502"
                                  ? "#0f172a"
                                  : "#ffffff"
                              }
                              style={{ pointerEvents: "none" }}
                            >
                              {seg.shortLabel.length > 18
                                ? `${seg.shortLabel.slice(0, 17)}…`
                                : seg.shortLabel}
                            </text>
                            <text
                              x={seg.x0 + 6}
                              y={seg.y0 + seg.height / 2 + 10}
                              fontSize={10.5}
                              fontWeight={900}
                              fill={
                                seg.isTrunk
                                  ? isLightCanvas
                                    ? "#475569"
                                    : "#94a3b8"
                                  : seg.color === "#FFC502"
                                  ? "#0f172a"
                                  : "#ffffff"
                              }
                              style={{ pointerEvents: "none" }}
                            >
                              {formatPct(seg.probability, 1)}
                              {seg.isTopNode && !seg.isTrunk ? " ★ #1" : ""}
                            </text>
                          </>
                        )}

                        {showSingleLine && (
                          <text
                            x={seg.x0 + 5}
                            y={seg.y0 + seg.height / 2 + 3.5}
                            fontSize={9}
                            fontWeight={800}
                            fill={
                              seg.isTrunk
                                ? isLightCanvas
                                  ? "#334155"
                                  : "#cbd5e1"
                                : seg.color === "#FFC502"
                                ? "#0f172a"
                                : "#ffffff"
                            }
                            style={{ pointerEvents: "none" }}
                          >
                            {seg.shortLabel.slice(0, 12)}{" "}
                            {formatPct(seg.probability, 1)}
                          </text>
                        )}

                        <title>
                          {seg.label}: {formatPct(seg.probability, 2)} of total
                          reality ({formatPct(seg.shareOfColumn, 1)} of column)
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
                    isActive
                      ? "ring-2 ring-indigo-500 shadow-md"
                      : ""
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
              className="w-full h-auto min-w-[920px]"
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
                      fontSize={10}
                      fontWeight={800}
                      fill={ep.badgeColor}
                    >
                      {ep.shortTitle.toUpperCase()}
                    </text>
                    <text
                      x={x0 + MARIMEKKO_PILLAR_W / 2}
                      y={44}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill={isLightCanvas ? "#0f172a" : "#f8fafc"}
                    >
                      {ep.questionTitle.length > 22
                        ? `${ep.questionTitle.slice(0, 21)}…`
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
                            onClick={() => onSelectNode(node.id)}
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
