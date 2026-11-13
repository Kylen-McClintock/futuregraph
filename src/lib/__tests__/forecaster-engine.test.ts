import { describe, expect, it } from "vitest";
import {
  ALL_SEED_FORECASTER_ACTORS,
  SEED_GRAPH_FORECAST_RUNS,
} from "@/data/starter-agents-seed";
import {
  computeNatureOfRealityGraph,
  getBaselineConditionalMap,
  NATURE_OF_REALITY_PRESETS,
} from "@/data/nature-of-reality-seed";
import { computeLevDashboard } from "@/lib/lev-engine";
import {
  evaluateGraphDistribution,
  getRegisteredGraph,
  registerFutureGraph,
} from "@/lib/graph-registry";
import {
  computeCrowdDistribution,
  computeGraphVarianceReport,
  computeOverlayLevDashboard,
  decodePortableForecastBundle,
  encodePortableForecastBundle,
} from "@/lib/forecaster-engine";
import {
  generatePromptPack,
  parseAndValidateAgentResponse,
} from "@/lib/prompt-pack";
import { submitForecasterGraphRuns } from "@/lib/store";
import { RegisteredGraphSpec } from "@/types/forecaster";

describe("Forecaster Agents, Personal Distributions & Universal Graph Registry", () => {
  it("1. Preserves Kylen McClintock (@kylen) exact 43-node / 98-link baseline on Nature of Reality", () => {
    const kylenRun = SEED_GRAPH_FORECAST_RUNS.find(
      (r) => r.graphId === "nature-of-reality" && r.actorHandle === "kylen"
    );
    expect(kylenRun).toBeDefined();

    const evaluated = evaluateGraphDistribution("nature-of-reality", {
      rootPriors: kylenRun!.rootPriors,
      conditionalSplits: kylenRun!.conditionalSplits,
    });

    const originalBaseline = computeNatureOfRealityGraph(
      NATURE_OF_REALITY_PRESETS[0].rootPriors,
      {},
      null
    );
    expect(originalBaseline.nodes).toHaveLength(43);
    expect(originalBaseline.links).toHaveLength(119);

    for (const node of originalBaseline.nodes) {
      expect(evaluated.nodeOverallProbabilities[node.id]).toBeCloseTo(
        node.probability,
        5
      );
    }

    const baseCondMap = getBaselineConditionalMap();
    for (const link of originalBaseline.links) {
      const key = `${link.sourceId}->${link.targetId}`;
      expect(evaluated.normalizedConditionalSplits[key]).toBeCloseTo(
        baseCondMap.get(key) ?? link.conditionalProb,
        4
      );
    }
  });

  it("2. Preserves LEVL / Default LEV forecast while differentiating Crowd Wisdom sub-lenses (All vs Humans+Mkts vs AI Agents)", () => {
    const baseDashboard = computeLevDashboard({
      referenceDate: new Date("2026-11-12T12:00:00Z"),
      updateMode: "conservative",
      currentChronologicalAge: 35,
    });

    // LEVL / Default stays anchored to ~2037-2038 p99 and ~0.66 PoA
    expect(baseDashboard.aggregate99thYear).toBeGreaterThan(2036.0);
    expect(baseDashboard.aggregate99thYear).toBeLessThan(2039.5);
    expect(baseDashboard.cohorts.p99.intrinsicPaceOfAging).toBeCloseTo(0.66, 1);

    const crowdAll = computeCrowdDistribution(
      "lev",
      "all_ensemble",
      ALL_SEED_FORECASTER_ACTORS,
      SEED_GRAPH_FORECAST_RUNS
    );
    const crowdHumans = computeCrowdDistribution(
      "lev",
      "humans_markets",
      ALL_SEED_FORECASTER_ACTORS,
      SEED_GRAPH_FORECAST_RUNS
    );
    const crowdAgents = computeCrowdDistribution(
      "lev",
      "agents_only",
      ALL_SEED_FORECASTER_ACTORS,
      SEED_GRAPH_FORECAST_RUNS
    );

    expect(crowdAll.levForecast).toBeDefined();
    expect(crowdHumans.levForecast).toBeDefined();
    expect(crowdAgents.levForecast).toBeDefined();
    expect(crowdAgents.contributorCount).toBe(5);
    expect(crowdHumans.contributorCount).toBeGreaterThanOrEqual(11);

    // Distinct ensemble compositions yield distinct forecasts
    expect(crowdHumans.levForecast!.p99Year).not.toBe(
      crowdAgents.levForecast!.p99Year
    );

    // Overlay trajectory hits <= 0.00 Net PoA at the target intercept year
    const kurzweilLevRun = SEED_GRAPH_FORECAST_RUNS.find(
      (r) => r.graphId === "lev" && r.actorHandle === "kurzweil_horizon"
    )!;
    const overlay = computeOverlayLevDashboard({
      baseDashboard,
      targetForecast: kurzweilLevRun.levForecast!,
      currentChronologicalAge: 35,
    });
    expect(overlay.aggregate99thYear).toBe(kurzweilLevRun.levForecast!.p99Year);
    const ptAfterIntercept = overlay.trajectorySeries.find(
      (pt) => pt.year >= Math.ceil(kurzweilLevRun.levForecast!.p99Year)
    );
    expect(ptAfterIntercept).toBeDefined();
    expect(ptAfterIntercept!.p99NetPoA).toBeLessThanOrEqual(0.0);
  });

  it("3. Conserves 100% probability mass at every fork across all 5 starter worldview agents and all 5 branching/Sankey atlases", () => {
    const starterHandles = [
      "kurzweil_horizon",
      "sentinel_treaty",
      "amdahl_realist",
      "tetlock_calib",
      "everett_sim",
    ];
    const graphIds = [
      "ai-2027",
      "ai-2040",
      "ai-2050-simple",
      "ai-2050-comprehensive",
      "nature-of-reality",
    ] as const;

    for (const gid of graphIds) {
      const spec = getRegisteredGraph(gid)!;
      expect(spec).toBeDefined();

      for (const handle of starterHandles) {
        const run = SEED_GRAPH_FORECAST_RUNS.find(
          (r) => r.graphId === gid && r.actorHandle === handle
        );
        expect(run, `Missing run for ${handle} on ${gid}`).toBeDefined();

        const dist = evaluateGraphDistribution(gid, {
          rootPriors: run!.rootPriors,
          conditionalSplits: run!.conditionalSplits,
        });

        for (const fork of spec.forks) {
          const mapToCheck = fork.isRootPartition
            ? dist.normalizedRootPriors!
            : dist.normalizedConditionalSplits;
          const sum = fork.options.reduce(
            (acc, opt) => acc + (mapToCheck[opt.splitKey] ?? 0),
            0
          );
          expect(
            sum,
            `Fork ${fork.forkId} on ${gid} for ${handle} did not sum to 1.0`
          ).toBeCloseTo(1.0, 3);
        }
      }
    }
  });

  it("4. Generates 1-click Prompt Packs, parses fenced/percentage JSON replies, encodes portable bundles, and computes signed Δ vs. Crowd", async () => {
    const branchPack = generatePromptPack({
      graphId: "ai-2027",
      scope: "branch",
      branchNodeId: "river-2027-oct-fork",
      outputMode: "quick_pct",
      actorHandle: "my_test_agent",
      actorDisplayName: "My Test Agent",
    });
    expect(branchPack.forkCount).toBeGreaterThanOrEqual(1);
    expect(branchPack.promptText).toContain("river-2027-oct-fork");
    expect(branchPack.curlExampleCommand).toContain("/futuregraph/api/v1/agents/runs");

    const allSitePack = generatePromptPack({
      graphId: "ai-2050-simple",
      scope: "all_site",
      outputMode: "standard",
      actorHandle: "my_test_agent",
      actorDisplayName: "My Test Agent",
    });
    expect(allSitePack.targetGraphIds.length).toBeGreaterThanOrEqual(6);

    // Paste fenced markdown with 0-100 percentages that sum to 110 (auto-converted & normalized!)
    const fencedReply = [
      "Here is my calibrated forecast:",
      "```json",
      JSON.stringify({
        graphId: "ai-2050-simple",
        headlineSummary: "High credence on Futurama abundance with non-trivial Singularia tail.",
        conditionalSplits: {
          "r2050-s-end-fizzle": 10,
          "r2050-s-q2-civ": 100,
          "r2050-s-q3a-good": 60,
          "r2050-s-q3b-good": 40,
          "r2050-s-end-futurama": 75,
          "r2050-s-end-dystopia": 25,
          "r2050-s-end-singularia": 70,
          "r2050-s-end-paperclip": 30,
        },
        forkRationales: {
          "fork-r2050-s-q1-fizzle": {
            rationale: "Scaling laws continue past 2030.",
            keyAssumption: "Verifiable RL environments generalize.",
          },
        },
      }),
      "```",
    ].join("\n");

    const parsed = parseAndValidateAgentResponse({
      rawText: fencedReply,
      defaultGraphId: "ai-2050-simple",
      fallbackHandle: "my_test_agent",
      fallbackDisplayName: "My Test Agent",
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.warnings.length).toBeGreaterThan(0);

    const run = parsed.runs[0];
    // 10 and 100 normalize to 10/110 and 100/110
    expect(
      run.conditionalSplits["r2050-s-end-fizzle"] +
        run.conditionalSplits["r2050-s-q2-civ"]
    ).toBeCloseTo(1.0, 4);

    // Variance report against Crowd Wisdom
    const variance = computeGraphVarianceReport(
      "ai-2050-simple",
      run,
      "all_ensemble",
      ALL_SEED_FORECASTER_ACTORS,
      SEED_GRAPH_FORECAST_RUNS
    );
    expect(variance.rankedDivergences.length).toBeGreaterThan(0);
    const futuramaDelta = variance.byNodeId["r2050-s-end-futurama"];
    expect(futuramaDelta).toBeDefined();
    expect(futuramaDelta.signedDelta).toBeCloseTo(
      futuramaDelta.actorProb - futuramaDelta.crowdProb,
      3
    );

    // Portable URL bundle round-trip
    const token = encodePortableForecastBundle({
      v: 1,
      actor: {
        handle: "my_test_agent",
        displayName: "My Test Agent",
        actorType: "ai_agent",
        roleLabel: "Sandbox Agent",
        worldview: ALL_SEED_FORECASTER_ACTORS[0].worldview,
      },
      run,
    });
    const decoded = decodePortableForecastBundle(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.actor.handle).toBe("my_test_agent");
    expect(decoded!.run.graphId).toBe("ai-2050-simple");

    // Submitting under a verified handle ("kylen") safely forks into Community Sandbox without overwriting @kylen
    const saved = await submitForecasterGraphRuns({
      handle: "kylen",
      displayName: "Visitor Fork of Kylen",
      runs: [run],
      skipPersistence: true,
    });
    expect(saved.actor.handle).toMatch(/^kylen_fork_/);
    expect(saved.actor.isVerifiedEnsemble).toBe(false);
    expect(saved.receipt.payloadSha256).toHaveLength(64);
  });

  it("5. Supports registering brand-new Future Graphs via registerFutureGraph with automatic Prompt Pack, Crowd Wisdom, and Variance compatibility", () => {
    const mockFutureSpec: RegisteredGraphSpec = {
      graphId: "fusion-abundance-2045",
      slug: "fusion-abundance-2045",
      routeHref: "/scenarios/fusion-abundance-2045",
      title: "Commercial Fusion & Energy Abundance 2045",
      shortTitle: "Fusion 2045",
      domainBadge: "Energy & Grid",
      accentColor: "#f59e0b",
      topologyKind: "river_tree",
      defaultBaselineLabel: "Energy Grid Baseline",
      description: "Mock future graph verifying universal registry extensibility.",
      forks: [
        {
          forkId: "fork-fusion-root",
          parentNodeId: "fusion-root",
          forkTitle: "Net-Electric Q>10 Demo by 2032?",
          forkQuestion: "Does a commercial pilot achieve Q>10 net electricity before 2032?",
          epochOrDateLabel: "2032",
          options: [
            {
              splitKey: "fusion-yes-2032",
              targetNodeId: "fusion-yes-2032",
              label: "Yes: High-Temp Superconducting Tokamak/Stellarator Succeeds",
              defaultConditionalProb: 0.6,
            },
            {
              splitKey: "fusion-no-2032",
              targetNodeId: "fusion-no-2032",
              label: "No: Tritium/Materials Delays Past 2032",
              defaultConditionalProb: 0.4,
            },
          ],
        },
        {
          forkId: "fork-fusion-cost",
          parentNodeId: "fusion-yes-2032",
          forkTitle: "LCOE Below $35/MWh by 2045?",
          forkQuestion: "Given 2032 pilot success, does fusion undercut solar+storage baseload?",
          epochOrDateLabel: "2045",
          options: [
            {
              splitKey: "fusion-cheap",
              targetNodeId: "fusion-cheap",
              label: "Abundant Sub-$35/MWh Baseload",
              defaultConditionalProb: 0.55,
            },
            {
              splitKey: "fusion-niche",
              targetNodeId: "fusion-niche",
              label: "High-CapEx Industrial/Defense Niche Only",
              defaultConditionalProb: 0.45,
            },
          ],
        },
      ],
      nodes: [
        {
          id: "fusion-root",
          label: "2026 Fusion Programs",
          epochOrDateLabel: "2026",
          isTerminalOutcome: false,
        },
        {
          id: "fusion-yes-2032",
          label: "Q>10 Pilot Succeeds",
          epochOrDateLabel: "2032",
          isTerminalOutcome: false,
        },
        {
          id: "fusion-no-2032",
          label: "Materials Delay",
          epochOrDateLabel: "2032",
          isTerminalOutcome: true,
        },
        {
          id: "fusion-cheap",
          label: "Abundant Sub-$35/MWh Baseload",
          epochOrDateLabel: "2045",
          isTerminalOutcome: true,
        },
        {
          id: "fusion-niche",
          label: "High-CapEx Niche",
          epochOrDateLabel: "2045",
          isTerminalOutcome: true,
        },
      ],
    };

    registerFutureGraph(mockFutureSpec);

    const pack = generatePromptPack({
      graphId: "fusion-abundance-2045",
      scope: "graph",
    });
    expect(pack.forkCount).toBe(2);
    expect(pack.promptText).toContain("fusion-cheap");

    const parsed = parseAndValidateAgentResponse({
      parsedJson: {
        graphId: "fusion-abundance-2045",
        headlineSummary: "Bullish on HTS magnets and mass-manufactured modular cores.",
        conditionalSplits: {
          "fusion-yes-2032": 0.8,
          "fusion-no-2032": 0.2,
          "fusion-cheap": 0.7,
          "fusion-niche": 0.3,
        },
      },
      defaultGraphId: "fusion-abundance-2045",
      fallbackHandle: "kurzweil_horizon",
    });
    expect(parsed.ok).toBe(true);

    const evalDist = evaluateGraphDistribution("fusion-abundance-2045", {
      conditionalSplits: parsed.runs[0].conditionalSplits,
    });
    // 0.8 * 0.7 = 0.56 overall probability for fusion-cheap!
    expect(evalDist.nodeOverallProbabilities["fusion-cheap"]).toBeCloseTo(
      0.56,
      4
    );

    const variance = computeGraphVarianceReport(
      "fusion-abundance-2045",
      parsed.runs[0],
      "all_ensemble",
      ALL_SEED_FORECASTER_ACTORS,
      SEED_GRAPH_FORECAST_RUNS
    );
    // Fallback baseline has 0.6 * 0.55 = 0.33 for fusion-cheap -> +0.23 signed delta!
    expect(variance.byNodeId["fusion-cheap"].signedDelta).toBeCloseTo(0.23, 3);
  });
});
