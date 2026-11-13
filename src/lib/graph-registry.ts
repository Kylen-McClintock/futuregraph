import {
  AI_2040_RIVER_SPECS,
  RiverBranchNodeSpec,
} from "@/data/ai2040-seed";
import {
  AI_2050_COMPREHENSIVE_RIVER_SPECS,
  AI_2050_SIMPLE_RIVER_SPECS,
} from "@/data/ai2050-seed";
import {
  computeNatureOfRealityGraph,
  getBaselineConditionalMap,
  NATURE_OF_REALITY_EPOCHS,
  NATURE_OF_REALITY_LINKS,
  NATURE_OF_REALITY_NODES,
  NATURE_OF_REALITY_PRESETS,
} from "@/data/nature-of-reality-seed";
import {
  ConditionalForkGroupSpec,
  GraphForecastRun,
  RegisteredGraphId,
  RegisteredGraphNodeMeta,
  RegisteredGraphSpec,
} from "@/types/forecaster";

export const AI_2027_RIVER_SPECS: RiverBranchNodeSpec[] = [
  {
    id: "river-2025-start",
    canonicalNodeId: "node-mid-2025-stumbling-agents",
    parentId: null,
    shortName: "Coding Agents Launch",
    dateTag: "Mid 2025",
    track: "spine",
    defaultConditionalProb: 1.0,
    x: 95,
    y: 370,
    labelPosition: "top",
  },
  {
    id: "river-2026-rd",
    canonicalNodeId: "node-early-2026-coding-automation",
    parentId: "river-2025-start",
    shortName: "AI Automates R&D",
    dateTag: "2026",
    track: "spine",
    defaultConditionalProb: 0.88,
    x: 295,
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
    x: 295,
    y: 545,
    labelPosition: "bottom",
  },
  {
    id: "river-2027-mar-sc",
    canonicalNodeId: "node-mar-2027-algorithmic-breakthroughs",
    parentId: "river-2026-rd",
    shortName: "Superhuman AI Coder",
    dateTag: "Mar 2027",
    track: "spine",
    defaultConditionalProb: 0.68,
    x: 505,
    y: 312,
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
    x: 505,
    y: 510,
    labelPosition: "bottom",
  },
  {
    id: "river-2027-china-theft",
    canonicalNodeId: "node-feb-2027-china-steals-agent-2",
    parentId: "river-2027-mar-sc",
    shortName: "China Steals Weights",
    dateTag: "Mid 2027",
    track: "spine",
    defaultConditionalProb: 0.85,
    x: 720,
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
    x: 720,
    y: 145,
    labelPosition: "top",
  },
  {
    id: "river-2027-sep-misaligned",
    canonicalNodeId: "node-sep-2027-agent-4-superhuman-ai-researcher",
    parentId: "river-2027-china-theft",
    shortName: "AI Hides Misaligned Goals",
    dateTag: "Sep 2027",
    track: "spine",
    defaultConditionalProb: 0.9,
    x: 935,
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
    x: 935,
    y: 170,
    labelPosition: "top",
  },
  {
    id: "river-2027-oct-fork",
    canonicalNodeId: "node-oct-2027-government-oversight-fork",
    parentId: "river-2027-sep-misaligned",
    shortName: "Oct 2027 Oversight Vote",
    dateTag: "Oct 2027 Fork",
    track: "spine",
    defaultConditionalProb: 1.0,
    x: 1125,
    y: 332,
    labelPosition: "top",
  },
  {
    id: "river-race-1-continue",
    canonicalNodeId: "node-race-1-continue-agent-4",
    parentId: "river-2027-oct-fork",
    shortName: "Keep Racing",
    dateTag: "Nov 2027",
    track: "race",
    defaultConditionalProb: 0.52,
    x: 1315,
    y: 140,
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
    x: 1475,
    y: 122,
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
    x: 1475,
    y: 235,
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
    x: 1615,
    y: 118,
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
    x: 1615,
    y: 225,
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
    x: 1765,
    y: 118,
    labelPosition: "bottom",
  },
  {
    id: "river-hybrid-pause",
    canonicalNodeId: "node-oversight-other-hybrid",
    parentId: "river-2027-oct-fork",
    shortName: "Partial Pause / Stalemate",
    dateTag: "2028–2030",
    track: "hybrid",
    defaultConditionalProb: 0.12,
    x: 1350,
    y: 340,
    labelPosition: "bottom",
  },
  {
    id: "river-slow-1-freeze",
    canonicalNodeId: "node-slowdown-1-freeze-agent-4-safer-1",
    parentId: "river-2027-oct-fork",
    shortName: "Slow Down & Freeze AI",
    dateTag: "Nov 2027",
    track: "slowdown",
    defaultConditionalProb: 0.36,
    x: 1315,
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
    x: 1475,
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
    x: 1475,
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
    x: 1625,
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
    x: 1625,
    y: 465,
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
    x: 1765,
    y: 572,
    labelPosition: "bottom",
  },
];

const RIVER_SPECS_BY_GRAPH_ID = new Map<string, RiverBranchNodeSpec[]>();

/**
 * Generic builder that converts ANY present or future RiverBranchNodeSpec[] tree
 * into a standardized RegisteredGraphSpec for Forecaster Agents, Crowd Wisdom,
 * Prompt Packs, and Variance overlays.
 */
export function buildRiverGraphSpec(params: {
  graphId: RegisteredGraphId;
  slug: string;
  routeHref: string;
  title: string;
  shortTitle: string;
  domainBadge: string;
  accentColor: string;
  defaultBaselineLabel: string;
  defaultCreatorHandle?: string;
  description: string;
  riverSpecs: RiverBranchNodeSpec[];
}): RegisteredGraphSpec {
  RIVER_SPECS_BY_GRAPH_ID.set(params.graphId, params.riverSpecs);

  const byId = new Map(params.riverSpecs.map((s) => [s.id, s]));
  const childrenByParent = new Map<string, RiverBranchNodeSpec[]>();
  for (const spec of params.riverSpecs) {
    if (!spec.parentId) continue;
    const list = childrenByParent.get(spec.parentId) || [];
    list.push(spec);
    childrenByParent.set(spec.parentId, list);
  }

  const forks: ConditionalForkGroupSpec[] = [];
  for (const [parentId, children] of childrenByParent.entries()) {
    // Only forks with >= 2 mutually exclusive outgoing branches are decision/probability splits
    // (1-child transitions are deterministic 100% pass-throughs)
    if (children.length < 2) continue;
    const parent = byId.get(parentId);
    if (!parent) continue;
    forks.push({
      forkId: `fork-${parent.id}`,
      parentNodeId: parent.id,
      parentCanonicalNodeId: parent.canonicalNodeId,
      forkTitle: `${parent.shortName} (${parent.dateTag})`,
      forkQuestion: `Given '${parent.shortName}' (${parent.dateTag}), assign conditional probabilities summing to 100% across outgoing branches:`,
      epochOrDateLabel: parent.dateTag,
      options: children.map((c) => ({
        splitKey: c.id,
        targetNodeId: c.id,
        canonicalNodeId: c.canonicalNodeId,
        label: c.shortName,
        dateOrEpochTag: c.dateTag,
        defaultConditionalProb: c.defaultConditionalProb,
      })),
    });
  }

  const nodes: RegisteredGraphNodeMeta[] = params.riverSpecs.map((s) => ({
    id: s.id,
    canonicalNodeId: s.canonicalNodeId,
    label: s.shortName,
    epochOrDateLabel: s.dateTag,
    isTerminalOutcome: !childrenByParent.has(s.id),
  }));

  return {
    graphId: params.graphId,
    slug: params.slug,
    routeHref: params.routeHref,
    title: params.title,
    shortTitle: params.shortTitle,
    domainBadge: params.domainBadge,
    accentColor: params.accentColor,
    topologyKind: "river_tree",
    defaultBaselineLabel: params.defaultBaselineLabel,
    defaultCreatorHandle: params.defaultCreatorHandle,
    description: params.description,
    forks,
    nodes,
  };
}

/**
 * Builds the RegisteredGraphSpec for Nature of Reality (43 nodes, 98 links, 7 epochs).
 */
function buildNatureOfRealityGraphSpec(): RegisteredGraphSpec {
  const baseCondMap = getBaselineConditionalMap();
  const rootPreset = NATURE_OF_REALITY_PRESETS[0]; // Kylen McClintock's exact original baseline
  const col0Nodes = NATURE_OF_REALITY_NODES.filter((n) => n.columnIndex === 0).sort(
    (a, b) => a.orderInColumn - b.orderInColumn
  );

  const forks: ConditionalForkGroupSpec[] = [
    {
      forkId: "fork-nor-root-col0",
      parentNodeId: null,
      forkTitle: "Epoch I: What Existed Before Our Universe?",
      forkQuestion:
        "Assign root probabilities summing to 100% across primordial origins before our universe:",
      epochOrDateLabel: "I. Ontological Origin",
      isRootPartition: true,
      options: col0Nodes.map((n) => ({
        splitKey: n.id,
        targetNodeId: n.id,
        label: n.name,
        dateOrEpochTag: "Epoch I",
        defaultConditionalProb: rootPreset.rootPriors[n.id] ?? n.baselineValue,
      })),
    },
  ];

  const outgoingBySource = new Map<
    string,
    typeof NATURE_OF_REALITY_LINKS
  >();
  for (const link of NATURE_OF_REALITY_LINKS) {
    const list = outgoingBySource.get(link.sourceId) || [];
    list.push(link);
    outgoingBySource.set(link.sourceId, list);
  }

  const nodeById = new Map(NATURE_OF_REALITY_NODES.map((n) => [n.id, n]));
  const epochByCol = new Map(
    NATURE_OF_REALITY_EPOCHS.map((ep) => [ep.columnIndex, ep])
  );

  for (const node of NATURE_OF_REALITY_NODES) {
    const outLinks = outgoingBySource.get(node.id) || [];
    if (outLinks.length < 2) continue;
    const ep = epochByCol.get(node.columnIndex);
    forks.push({
      forkId: `fork-${node.id}`,
      parentNodeId: node.id,
      forkTitle: `${node.name} (${ep?.shortTitle || `Col ${node.columnIndex}`})`,
      forkQuestion: `Given '${node.name}', assign outgoing transition shares summing to 100%:`,
      epochOrDateLabel: ep?.shortTitle || `Epoch ${node.columnIndex + 1}`,
      options: outLinks.map((l) => {
        const target = nodeById.get(l.targetId);
        const key = `${l.sourceId}->${l.targetId}`;
        return {
          splitKey: key,
          targetNodeId: l.targetId,
          label: target?.name || l.targetId,
          dateOrEpochTag:
            epochByCol.get(target?.columnIndex ?? 0)?.shortTitle || "",
          defaultConditionalProb: Number(
            (baseCondMap.get(key) ?? 1 / outLinks.length).toFixed(4)
          ),
        };
      }),
    });
  }

  const nodes: RegisteredGraphNodeMeta[] = NATURE_OF_REALITY_NODES.map((n) => ({
    id: n.id,
    label: n.name,
    epochOrDateLabel:
      epochByCol.get(n.columnIndex)?.shortTitle || `Epoch ${n.columnIndex + 1}`,
    isTerminalOutcome: n.columnIndex === 6 || !outgoingBySource.has(n.id),
  }));

  return {
    graphId: "nature-of-reality",
    slug: "nature-of-reality",
    routeHref: "/scenarios/nature-of-reality",
    title: "Nature of Reality: 7-Epoch Probabilistic Sankey",
    shortTitle: "Nature of Reality",
    domainBadge: "Cosmology & Consciousness",
    accentColor: "#a855f7",
    topologyKind: "sankey_flow",
    defaultBaselineLabel: "Kylen McClintock (Creator)",
    defaultCreatorHandle: "kylen",
    description:
      "43-node, 7-epoch conserved probability Sankey tracing Primordial Origin → Cosmogenesis → Conscious Fate at Death → Simulation/Afterlife Architecture → Macro-Cosmic Fate.",
    forks,
    nodes,
  };
}

function buildLevGraphSpec(): RegisteredGraphSpec {
  return {
    graphId: "lev",
    slug: "lev",
    routeHref: "/lev",
    title: "Longevity Escape Velocity (LEV) & Dynamic Pace of Aging",
    shortTitle: "LEV & Pace of Aging",
    domainBadge: "Biogerontology & AI-Bio",
    accentColor: "#10b981",
    topologyKind: "trajectory_quantiles",
    defaultBaselineLabel: "LEVL / Default Composite",
    defaultCreatorHandle: "kylen",
    description:
      "Models when annual medical rejuvenation + personal protocol optimization offsets biological aging (Net Pace of Aging <= 0.00 bio-yr/yr) across 99th, 80th, and 50th percentile human cohorts.",
    forks: [],
    nodes: [
      {
        id: "lev-p99-intercept",
        label: "99th-Percentile Human LEV Year (Top 1% Optimizer)",
        epochOrDateLabel: "Top 1% Cohort",
        isTerminalOutcome: true,
      },
      {
        id: "lev-p80-intercept",
        label: "80th-Percentile Human LEV Year (Top 20% Proactive)",
        epochOrDateLabel: "Top 20% Cohort",
        isTerminalOutcome: true,
      },
      {
        id: "lev-p50-intercept",
        label: "50th-Percentile Human LEV Year (Status Quo Population)",
        epochOrDateLabel: "Median Cohort",
        isTerminalOutcome: true,
      },
    ],
  };
}

const GRAPH_REGISTRY = new Map<RegisteredGraphId, RegisteredGraphSpec>();

function initDefaultRegistry() {
  if (GRAPH_REGISTRY.size > 0) return;

  const specs: RegisteredGraphSpec[] = [
    buildLevGraphSpec(),
    buildNatureOfRealityGraphSpec(),
    buildRiverGraphSpec({
      graphId: "ai-2050-simple",
      slug: "ai-2050",
      routeHref: "/scenarios/ai-2050",
      title: "AI 2050: Five Worlds of AI (Simple 5-World Tree)",
      shortTitle: "AI 2050 (5 Worlds)",
      domainBadge: "AGI Macro Worlds",
      accentColor: "#38bdf8",
      defaultBaselineLabel: "Metaculus #20683 Baseline",
      description:
        "Aaronson & Barak's Five Worlds decision tree: Will AI Fizzle? → Will Civilization Recognizably Continue? → Will It Be Good? (AI-Fizzle, Futurama, AI-Dystopia, Singularia, Paperclipalypse).",
      riverSpecs: AI_2050_SIMPLE_RIVER_SPECS,
    }),
    buildRiverGraphSpec({
      graphId: "ai-2050-comprehensive",
      slug: "ai-2050",
      routeHref: "/scenarios/ai-2050",
      title: "AI 2050: Deep Path (Causal Mechanisms & 10 Sub-Worlds)",
      shortTitle: "AI 2050 (Deep 22-Node)",
      domainBadge: "AGI Sub-Worlds",
      accentColor: "#8b5cf6",
      defaultBaselineLabel: "Metaculus + Aaronson/Barak",
      description:
        "22-node decomposition of the Five Worlds into causal midpoints and 10 concrete post-2050 sub-worlds.",
      riverSpecs: AI_2050_COMPREHENSIVE_RIVER_SPECS,
    }),
    buildRiverGraphSpec({
      graphId: "ai-2027",
      slug: "ai-2027",
      routeHref: "/scenarios/ai-2027",
      title: "AI 2027: Fast Takeoff & Oct 2027 Oversight Fork",
      shortTitle: "AI 2027",
      domainBadge: "Near-Term Takeoff",
      accentColor: "#f59e0b",
      defaultBaselineLabel: "AI 2027 Authors Baseline",
      description:
        "2025–2030 branching probability river from Coding Agents through Automated AI R&D, Weight Theft, Deceptive Alignment, and the October 2027 Oversight Fork.",
      riverSpecs: AI_2027_RIVER_SPECS,
    }),
    buildRiverGraphSpec({
      graphId: "ai-2040",
      slug: "ai-2040",
      routeHref: "/scenarios/ai-2040",
      title: "AI 2040: Plan A vs. Plans B–S Crossroads",
      shortTitle: "AI 2040",
      domainBadge: "Treaty & Governance",
      accentColor: "#10b981",
      defaultBaselineLabel: "AI 2040 Authors Baseline",
      description:
        "2026–2040 strategic roadmap contrasting Plan A (US-China Verified Slowdown & 2035 Expert Pause until Alignment is a Hard Science) against Plans B, C/D, and S.",
      riverSpecs: AI_2040_RIVER_SPECS,
    }),
  ];

  for (const s of specs) {
    GRAPH_REGISTRY.set(s.graphId, s);
  }
}

/**
 * Public registration hook so ANY future graph added to FutureGraph becomes
 * immediately compatible with Forecaster Agents, Prompt Packs, Crowd Wisdom, and Variance overlays.
 */
export function registerFutureGraph(
  spec: RegisteredGraphSpec,
  riverSpecs?: RiverBranchNodeSpec[]
): void {
  initDefaultRegistry();
  if (riverSpecs) {
    RIVER_SPECS_BY_GRAPH_ID.set(spec.graphId, riverSpecs);
  }
  GRAPH_REGISTRY.set(spec.graphId, spec);
}

export function getRegisteredGraphs(): RegisteredGraphSpec[] {
  initDefaultRegistry();
  return Array.from(GRAPH_REGISTRY.values());
}

export function getRegisteredGraph(
  graphId: RegisteredGraphId
): RegisteredGraphSpec | undefined {
  initDefaultRegistry();
  return GRAPH_REGISTRY.get(graphId);
}

export function getRiverSpecsForGraph(
  graphId: RegisteredGraphId
): RiverBranchNodeSpec[] | undefined {
  initDefaultRegistry();
  return RIVER_SPECS_BY_GRAPH_ID.get(graphId);
}

/**
 * Evaluates cumulative overall node probabilities and normalized conditional splits
 * for any branching river or Sankey graph given optional rootPriors + conditionalSplits.
 */
export function evaluateGraphDistribution(
  graphId: RegisteredGraphId,
  input?: {
    rootPriors?: Record<string, number>;
    conditionalSplits?: Record<string, number>;
  }
): {
  nodeOverallProbabilities: Record<string, number>;
  canonicalNodeProbabilities: Record<string, number>;
  normalizedConditionalSplits: Record<string, number>;
  normalizedRootPriors?: Record<string, number>;
} {
  initDefaultRegistry();
  const spec = GRAPH_REGISTRY.get(graphId);
  if (!spec) {
    return {
      nodeOverallProbabilities: {},
      canonicalNodeProbabilities: {},
      normalizedConditionalSplits: {},
    };
  }

  if (spec.topologyKind === "sankey_flow" && graphId === "nature-of-reality") {
    const defaultRoot = NATURE_OF_REALITY_PRESETS[0].rootPriors;
    const rawRoot = {
      ...defaultRoot,
      ...(input?.rootPriors || {}),
    };
    const rootSum = Object.values(rawRoot).reduce((a, b) => a + Math.max(0, b), 0);
    const normalizedRootPriors: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawRoot)) {
      normalizedRootPriors[k] =
        rootSum > 0 ? Number((Math.max(0, v) / rootSum).toFixed(6)) : 0.25;
    }

    const computed = computeNatureOfRealityGraph(
      normalizedRootPriors,
      input?.conditionalSplits || {},
      null
    );

    const nodeOverallProbabilities: Record<string, number> = {};
    for (const n of computed.nodes) {
      nodeOverallProbabilities[n.id] = Number(n.probability.toFixed(6));
    }

    const normalizedConditionalSplits: Record<string, number> = {};
    for (const l of computed.links) {
      normalizedConditionalSplits[`${l.sourceId}->${l.targetId}`] = Number(
        l.conditionalProb.toFixed(6)
      );
    }

    return {
      nodeOverallProbabilities,
      canonicalNodeProbabilities: nodeOverallProbabilities,
      normalizedConditionalSplits,
      normalizedRootPriors,
    };
  }

  // Generic River Tree evaluation (works for AI 2027, AI 2040, AI 2050 Simple & Comprehensive, and any future river graph)
  const riverSpecs = RIVER_SPECS_BY_GRAPH_ID.get(graphId);
  if (!riverSpecs) {
    // Universal fallback for any future RegisteredGraphSpec defined purely via forks & nodes
    const normalizedConditionalSplits: Record<string, number> = {};
    let normalizedRootPriors: Record<string, number> | undefined;
    const nodeOverallProbabilities: Record<string, number> = {};
    const canonicalNodeProbabilities: Record<string, number> = {};

    const incomingForksCount = new Map<string, number>();
    for (const f of spec.forks) {
      if (f.isRootPartition) continue;
      for (const opt of f.options) {
        incomingForksCount.set(opt.targetNodeId, (incomingForksCount.get(opt.targetNodeId) || 0) + 1);
      }
    }

    for (const n of spec.nodes) {
      if (!incomingForksCount.has(n.id)) {
        nodeOverallProbabilities[n.id] = 1.0;
      } else {
        nodeOverallProbabilities[n.id] = 0.0;
      }
    }

    for (const fork of spec.forks) {
      if (fork.isRootPartition) {
        normalizedRootPriors = {};
        const raw = fork.options.map((opt) =>
          input?.rootPriors?.[opt.splitKey] !== undefined
            ? Math.max(0, input.rootPriors[opt.splitKey])
            : input?.conditionalSplits?.[opt.splitKey] !== undefined
            ? Math.max(0, input.conditionalSplits[opt.splitKey])
            : opt.defaultConditionalProb
        );
        const sum = raw.reduce((a, b) => a + b, 0);
        fork.options.forEach((opt, idx) => {
          const val =
            sum > 0
              ? Number((raw[idx] / sum).toFixed(6))
              : Number((1 / fork.options.length).toFixed(6));
          normalizedRootPriors![opt.splitKey] = val;
          normalizedConditionalSplits[opt.splitKey] = val;
          nodeOverallProbabilities[opt.targetNodeId] = val;
        });
      } else {
        const raw = fork.options.map((opt) =>
          input?.conditionalSplits?.[opt.splitKey] !== undefined
            ? Math.max(0, input.conditionalSplits[opt.splitKey])
            : opt.defaultConditionalProb
        );
        const sum = raw.reduce((a, b) => a + b, 0);
        const pParent = fork.parentNodeId ? (nodeOverallProbabilities[fork.parentNodeId] ?? 1.0) : 1.0;
        fork.options.forEach((opt, idx) => {
          const cProb =
            sum > 0
              ? Number((raw[idx] / sum).toFixed(6))
              : Number((1 / fork.options.length).toFixed(6));
          normalizedConditionalSplits[opt.splitKey] = cProb;
          nodeOverallProbabilities[opt.targetNodeId] = Number(
            ((nodeOverallProbabilities[opt.targetNodeId] || 0) + pParent * cProb).toFixed(6)
          );
        });
      }
    }

    for (const n of spec.nodes) {
      const p = nodeOverallProbabilities[n.id] ?? 0;
      canonicalNodeProbabilities[n.canonicalNodeId || n.id] = p;
    }

    return {
      nodeOverallProbabilities,
      canonicalNodeProbabilities,
      normalizedConditionalSplits,
      normalizedRootPriors,
    };
  }

  const childrenByParent = new Map<string, RiverBranchNodeSpec[]>();
  for (const s of riverSpecs) {
    if (!s.parentId) continue;
    const list = childrenByParent.get(s.parentId) || [];
    list.push(s);
    childrenByParent.set(s.parentId, list);
  }

  const normalizedConditionalSplits: Record<string, number> = {};
  for (const s of riverSpecs) {
    if (!s.parentId) {
      normalizedConditionalSplits[s.id] = 1.0;
    }
  }

  const overrides = input?.conditionalSplits || {};
  for (const [, siblings] of childrenByParent.entries()) {
    const raw = siblings.map((s) =>
      overrides[s.id] !== undefined
        ? Math.max(0, overrides[s.id])
        : s.defaultConditionalProb
    );
    const sum = raw.reduce((a, b) => a + b, 0);
    siblings.forEach((s, idx) => {
      normalizedConditionalSplits[s.id] =
        sum > 0
          ? Number((raw[idx] / sum).toFixed(6))
          : Number((1 / siblings.length).toFixed(6));
    });
  }

  const nodeOverallProbabilities: Record<string, number> = {};
  const canonicalNodeProbabilities: Record<string, number> = {};

  for (const s of riverSpecs) {
    if (!s.parentId) {
      nodeOverallProbabilities[s.id] = 1.0;
    } else {
      const pParent = nodeOverallProbabilities[s.parentId] ?? 1.0;
      const cProb = normalizedConditionalSplits[s.id] ?? s.defaultConditionalProb;
      nodeOverallProbabilities[s.id] = Number((pParent * cProb).toFixed(6));
    }
    canonicalNodeProbabilities[s.canonicalNodeId] =
      nodeOverallProbabilities[s.id];
  }

  return {
    nodeOverallProbabilities,
    canonicalNodeProbabilities,
    normalizedConditionalSplits,
  };
}

/**
 * Helper to retrieve the baseline ("Default / Creator") distribution for any graph.
 */
export function getDefaultGraphDistribution(graphId: RegisteredGraphId) {
  return evaluateGraphDistribution(graphId, {});
}

/**
 * Helper to retrieve all descendant fork groups starting from a focused branch/node ID.
 */
export function getSubtreeForks(
  graphId: RegisteredGraphId,
  startNodeId?: string | null
): ConditionalForkGroupSpec[] {
  initDefaultRegistry();
  const spec = GRAPH_REGISTRY.get(graphId);
  if (!spec) return [];
  if (!startNodeId) return spec.forks;

  // Match either river/sankey node ID or canonicalNodeId
  const matchedFork = spec.forks.find(
    (f) =>
      f.parentNodeId === startNodeId ||
      f.parentCanonicalNodeId === startNodeId ||
      f.forkId === startNodeId
  );

  // Traverse forward from startNodeId across forks
  const reachableNodeIds = new Set<string>([startNodeId]);
  // If startNodeId was a canonicalNodeId, also include matching graph node ID
  const nodeMatch = spec.nodes.find(
    (n) => n.id === startNodeId || n.canonicalNodeId === startNodeId
  );
  if (nodeMatch) {
    reachableNodeIds.add(nodeMatch.id);
    if (nodeMatch.canonicalNodeId) reachableNodeIds.add(nodeMatch.canonicalNodeId);
  }

  let added = true;
  while (added) {
    added = false;
    for (const fork of spec.forks) {
      if (
        (fork.parentNodeId && reachableNodeIds.has(fork.parentNodeId)) ||
        (fork.parentCanonicalNodeId &&
          reachableNodeIds.has(fork.parentCanonicalNodeId))
      ) {
        for (const opt of fork.options) {
          if (!reachableNodeIds.has(opt.targetNodeId)) {
            reachableNodeIds.add(opt.targetNodeId);
            added = true;
          }
        }
      }
    }
  }

  const filtered = spec.forks.filter(
    (f) =>
      (f.parentNodeId && reachableNodeIds.has(f.parentNodeId)) ||
      (f.parentCanonicalNodeId &&
        reachableNodeIds.has(f.parentCanonicalNodeId))
  );

  if (filtered.length > 0) return filtered;
  if (matchedFork) return [matchedFork];
  return spec.forks;
}
