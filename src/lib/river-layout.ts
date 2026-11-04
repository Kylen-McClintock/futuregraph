export interface RiverLayoutInputNode {
  id: string;
  canonicalNodeId: string;
  parentId: string | null;
  shortName: string;
  dateTag: string;
  track: "spine" | "offramp" | "race" | "slowdown" | "hybrid";
  x: number;
  y: number;
  overallProb: number;
  conditionalProb: number;
  isTerminalOutcome: boolean;
  labelPosition?: "top" | "bottom" | "right" | "left";
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ResolvedRiverLabelLayout {
  nodeId: string;
  placement: "top" | "bottom" | "right" | "left";
  textAnchor: "middle" | "start" | "end";
  anchorX: number;
  titleLines: string[];
  titleFontSize: number;
  subFontSize: number;
  lineHeight: number;
  titleFirstLineY: number;
  metaY: number;
  radius: number;
  isForkHub: boolean;
  isSideBranch: boolean;
  bbox: BoundingBox;
}

const FORK_HUB_IDS = new Set([
  "river-2027-oct-fork",
  "r2040-2029-crossroads",
  "r2050-s-q1-fizzle",
  "r2050-s-q2-civ",
  "r2050-s-q3a-good",
  "r2050-s-q3b-good",
  "r2050-c-q1-fizzle",
  "r2050-c-q2-civ",
  "r2050-c-q3a-good",
  "r2050-c-q3b-good",
]);

export function splitIntoTwoLines(text: string, maxChars = 19): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  if (words.length <= 1) return [text];
  const mid = Math.floor(text.length / 2);
  let bestSplitIdx = 1;
  let bestDiff = Infinity;
  let running = 0;
  for (let i = 0; i < words.length - 1; i++) {
    running += words[i].length + (i > 0 ? 1 : 0);
    const diff = Math.abs(running - mid);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplitIdx = i + 1;
    }
  }
  return [
    words.slice(0, bestSplitIdx).join(" "),
    words.slice(bestSplitIdx).join(" "),
  ];
}

export function boxesIntersect(
  a: BoundingBox,
  b: BoundingBox,
  padding = 4
): boolean {
  return !(
    a.right + padding <= b.left ||
    a.left - padding >= b.right ||
    a.bottom + padding <= b.top ||
    a.top - padding >= b.bottom
  );
}

export function boxIntersectionArea(
  a: BoundingBox,
  b: BoundingBox,
  padding = 4
): number {
  const xOverlap = Math.max(
    0,
    Math.min(a.right + padding, b.right) - Math.max(a.left - padding, b.left)
  );
  const yOverlap = Math.max(
    0,
    Math.min(a.bottom + padding, b.bottom) - Math.max(a.top - padding, b.top)
  );
  return xOverlap * yOverlap;
}

/**
 * Deterministic UI Non-Overlap Solver for River Branching Trees:
 * 1. Enforces a compact 2-tier label hierarchy (Title + Unified `XX% · @handle ▲upvotes` metadata line).
 * 2. Uses horizontal right-side anchoring (`placement: "right"`) for stacked terminal leaf columns.
 * 3. Protects reserved top (`y < 82`) and bottom (`y > 690`) header/banner safe zones.
 * 4. Checks candidate label bounding boxes against all node circles and already-placed labels,
 *    automatically flipping or nudging any label that would otherwise collide.
 */
export function resolveRiverLabelPlacements(
  nodes: RiverLayoutInputNode[],
  debateSummaryByCanonicalId?: Map<
    string,
    { topHandle?: string; topUpvotes?: number }
  >,
  options?: {
    viewBoxWidth?: number;
    viewBoxHeight?: number;
    headerSafeTopY?: number;
    footerSafeBottomY?: number;
  }
): Map<string, ResolvedRiverLabelLayout> {
  const viewBoxWidth = options?.viewBoxWidth ?? 1860;
  const viewBoxHeight = options?.viewBoxHeight ?? 720;
  const headerSafeTopY = options?.headerSafeTopY ?? 82;
  const footerSafeBottomY = options?.footerSafeBottomY ?? 690;

  // Precompute circle obstacles for all nodes
  const circleBoxes = new Map<string, BoundingBox>();
  const nodeMetaMap = new Map<
    string,
    {
      radius: number;
      isForkHub: boolean;
      isSideBranch: boolean;
      titleFontSize: number;
      subFontSize: number;
      lineHeight: number;
      metaCharLen: number;
    }
  >();

  for (const node of nodes) {
    const isForkHub = FORK_HUB_IDS.has(node.id);
    const isSideBranch = node.track === "offramp";
    const radius = isForkHub
      ? 14
      : isSideBranch
      ? Math.max(4.5, Math.min(10, Math.round(4 + node.overallProb * 14)))
      : Math.max(6.5, Math.min(15, Math.round(5.5 + node.overallProb * 10)));

    const titleFontSize = isForkHub
      ? 12.5
      : isSideBranch
      ? Number((8.4 + Math.min(0.32, node.overallProb) * 5.5).toFixed(1))
      : Number((10.4 + Math.min(0.6, node.overallProb) * 2.2).toFixed(1));

    const subFontSize = isSideBranch
      ? Number((7.6 + Math.min(0.3, node.overallProb) * 3.2).toFixed(1))
      : 9.2;

    const lineHeight = Math.round(titleFontSize * 1.16);

    const debate = debateSummaryByCanonicalId?.get(node.canonicalNodeId);
    const handleStr =
      debate?.topHandle && (!isSideBranch || node.isTerminalOutcome)
        ? ` · @${debate.topHandle}${
            debate.topUpvotes ? ` ▲${debate.topUpvotes}` : ""
          }`
        : "";
    const pctStr = `${Math.round(node.overallProb * 100)}% (split ${Math.round(
      node.conditionalProb * 100
    )}%)`;
    const metaCharLen = Math.max(
      10,
      `${Math.round(node.overallProb * 100)}%${handleStr}`.length,
      pctStr.length * 0.72
    );

    nodeMetaMap.set(node.id, {
      radius,
      isForkHub,
      isSideBranch,
      titleFontSize,
      subFontSize,
      lineHeight,
      metaCharLen,
    });

    circleBoxes.set(node.id, {
      left: node.x - radius - 4,
      right: node.x + radius + 4,
      top: node.y - radius - 4,
      bottom: node.y + radius + 4,
    });
  }

  // Detect vertically dense columns: if two nodes have |dx| < 140 and |dy| < 115,
  // forbid pointing their labels into the vertical gap between them.
  const forcedPlacementByNodeId = new Map<
    string,
    "top" | "bottom" | "right" | "left"
  >();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (Math.abs(a.x - b.x) < 140) {
        const upper = a.y <= b.y ? a : b;
        const lower = a.y <= b.y ? b : a;
        const dy = lower.y - upper.y;
        if (dy < 92 && upper.isTerminalOutcome && lower.isTerminalOutcome) {
          forcedPlacementByNodeId.set(upper.id, "right");
          forcedPlacementByNodeId.set(lower.id, "right");
        } else if (dy < 120) {
          // Never allow upper="bottom" AND lower="top" into a tight <120px gap
          const upPref = upper.labelPosition ?? "top";
          const lowPref = lower.labelPosition ?? "bottom";
          if (upPref === "bottom" && lowPref === "top") {
            forcedPlacementByNodeId.set(upper.id, "top");
            forcedPlacementByNodeId.set(lower.id, "bottom");
          }
        }
      }
    }
  }

  function buildCandidate(
    node: RiverLayoutInputNode,
    placement: "top" | "bottom" | "right" | "left",
    nudgeY = 0
  ): ResolvedRiverLabelLayout {
    const meta = nodeMetaMap.get(node.id)!;
    const {
      radius,
      isForkHub,
      isSideBranch,
      titleFontSize,
      subFontSize,
      lineHeight,
      metaCharLen,
    } = meta;

    // Single-line or wider wrap when horizontal ("right"/"left"), compact 2-line wrap when "top"/"bottom"
    const maxWrapChars =
      placement === "right" || placement === "left" ? 30 : 19;
    const titleLines = splitIntoTwoLines(node.shortName, maxWrapChars);

    const maxTitleChars = Math.max(...titleLines.map((l) => l.length));
    const titleWidthPx = maxTitleChars * titleFontSize * 0.57;
    const metaWidthPx = metaCharLen * subFontSize * 0.56;
    const blockWidth = Math.max(titleWidthPx, metaWidthPx);

    let textAnchor: "middle" | "start" | "end" = "middle";
    let anchorX = 0;
    let titleFirstLineY = 0;
    let metaY = 0;
    let bbox: BoundingBox;

    if (placement === "right") {
      textAnchor = "start";
      anchorX = radius + 10;
      const totalLines = titleLines.length + 1;
      const blockH = totalLines * lineHeight;
      titleFirstLineY =
        Math.round(-blockH / 2 + titleFontSize * 0.85) + nudgeY;
      metaY =
        titleFirstLineY +
        (titleLines.length - 1) * lineHeight +
        Math.round(subFontSize * 1.32);
      bbox = {
        left: node.x + anchorX - 2,
        right: node.x + anchorX + blockWidth + 4,
        top: node.y + titleFirstLineY - titleFontSize,
        bottom: node.y + metaY + 3,
      };
    } else if (placement === "left") {
      textAnchor = "end";
      anchorX = -(radius + 10);
      const totalLines = titleLines.length + 1;
      const blockH = totalLines * lineHeight;
      titleFirstLineY =
        Math.round(-blockH / 2 + titleFontSize * 0.85) + nudgeY;
      metaY =
        titleFirstLineY +
        (titleLines.length - 1) * lineHeight +
        Math.round(subFontSize * 1.32);
      bbox = {
        left: node.x + anchorX - blockWidth - 4,
        right: node.x + anchorX + 2,
        top: node.y + titleFirstLineY - titleFontSize,
        bottom: node.y + metaY + 3,
      };
    } else if (placement === "top") {
      textAnchor = "middle";
      anchorX = 0;
      metaY = -(radius + (isSideBranch ? 8 : 10)) + nudgeY;
      titleFirstLineY =
        metaY -
        (isSideBranch ? 11.5 : 13) -
        (titleLines.length - 1) * lineHeight;
      bbox = {
        left: node.x - blockWidth / 2 - 3,
        right: node.x + blockWidth / 2 + 3,
        top: node.y + titleFirstLineY - titleFontSize,
        bottom: node.y + metaY + 3,
      };
    } else {
      // "bottom"
      textAnchor = "middle";
      anchorX = 0;
      titleFirstLineY = radius + (isSideBranch ? 13 : 15) + nudgeY;
      metaY =
        titleFirstLineY +
        (titleLines.length - 1) * lineHeight +
        (isSideBranch ? 11.5 : 13);
      bbox = {
        left: node.x - blockWidth / 2 - 3,
        right: node.x + blockWidth / 2 + 3,
        top: node.y + titleFirstLineY - titleFontSize,
        bottom: node.y + metaY + 3,
      };
    }

    return {
      nodeId: node.id,
      placement,
      textAnchor,
      anchorX,
      titleLines,
      titleFontSize,
      subFontSize,
      lineHeight,
      titleFirstLineY,
      metaY,
      radius,
      isForkHub,
      isSideBranch,
      bbox,
    };
  }

  const placedLayouts = new Map<string, ResolvedRiverLabelLayout>();

  // Sort nodes so fork hubs & terminal outcomes place first, then main spine/branches, then side off-ramps
  const sortedNodes = [...nodes].sort((a, b) => {
    const aHub = FORK_HUB_IDS.has(a.id) ? 1 : 0;
    const bHub = FORK_HUB_IDS.has(b.id) ? 1 : 0;
    if (aHub !== bHub) return bHub - aHub;
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  for (const node of sortedNodes) {
    const preferred =
      forcedPlacementByNodeId.get(node.id) ??
      node.labelPosition ??
      (node.isTerminalOutcome && node.x >= 1400 ? "right" : "top");

    const allPlacements: Array<"top" | "bottom" | "right" | "left"> = [
      preferred,
      ...(preferred === "top"
        ? (["bottom", "right", "left"] as const)
        : preferred === "bottom"
        ? (["top", "right", "left"] as const)
        : preferred === "right"
        ? (["top", "bottom", "left"] as const)
        : (["top", "bottom", "right"] as const)),
    ];

    const nudges = [0, -6, 6, -12, 12, -18, 18];
    let bestCandidate: ResolvedRiverLabelLayout | null = null;
    let bestPenalty = Infinity;

    for (const placement of allPlacements) {
      for (const nudgeY of nudges) {
        const cand = buildCandidate(node, placement, nudgeY);
        let penalty = Math.abs(nudgeY) * 0.5;
        if (placement !== preferred) penalty += 15;

        // 1. Safe-zone boundary checks (header, footer, left/right canvas edges)
        if (cand.bbox.top < headerSafeTopY) {
          penalty += (headerSafeTopY - cand.bbox.top) * 200;
        }
        if (cand.bbox.bottom > footerSafeBottomY) {
          penalty += (cand.bbox.bottom - footerSafeBottomY) * 200;
        }
        if (cand.bbox.left < 6) {
          penalty += (6 - cand.bbox.left) * 200;
        }
        if (cand.bbox.right > viewBoxWidth - 6) {
          penalty += (cand.bbox.right - (viewBoxWidth - 6)) * 200;
        }

        // 2. Check intersection with all node circles
        for (const [otherId, circleBox] of circleBoxes.entries()) {
          const area = boxIntersectionArea(
            cand.bbox,
            circleBox,
            otherId === node.id ? 1 : 4
          );
          if (area > 0) {
            penalty += 5000 + area * 50;
          }
        }

        // 3. Check intersection with all already-placed labels
        for (const placed of placedLayouts.values()) {
          const area = boxIntersectionArea(cand.bbox, placed.bbox, 5);
          if (area > 0) {
            penalty += 10000 + area * 100;
          }
        }

        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestCandidate = cand;
        }
        if (penalty === 0) break;
      }
      if (bestPenalty === 0) break;
    }

    placedLayouts.set(
      node.id,
      bestCandidate ?? buildCandidate(node, preferred, 0)
    );
  }

  return placedLayouts;
}
