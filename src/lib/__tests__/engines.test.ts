import { describe, expect, it } from "vitest";
import {
  computeBrierScore,
  computeSingleParentMarginal,
  detectGraphCycles,
  propagateGraphProbabilities,
  validateExclusiveBranches,
  validateMultiParentCPT,
  validateProbability,
} from "../probability-engine";
import {
  canonicalizePayload,
  createServerAuditReceipt,
  verifyAuditReceipt,
} from "../audit-receipt";
import {
  doesPolicyDominate,
  evaluateFairMarketsPolicies,
} from "../pareto-engine";
import { FutureEdge, FutureNode, PolicyIntervention } from "@/types/futuregraph";

describe("FutureGraph Probability Engine — Section 6 & 14 Acceptance Tests", () => {
  it("Test: root 40%, conditionals 35% and 12% => marginal 21.2%", () => {
    const marginal = computeSingleParentMarginal(0.4, 0.35, 0.12);
    expect(marginal).toBeCloseTo(0.212, 5);
  });

  it("Test: changing root to 60% => marginal 25.8% with unchanged conditionals", () => {
    const marginal = computeSingleParentMarginal(0.6, 0.35, 0.12);
    expect(marginal).toBeCloseTo(0.258, 5);
  });

  it("Test: invalid probability (e.g. -5% or 150%) is rejected", () => {
    expect(validateProbability(-0.05).valid).toBe(false);
    expect(validateProbability(1.5).valid).toBe(false);
    expect(validateProbability(Number.NaN).valid).toBe(false);
    expect(validateProbability(0.42).valid).toBe(true);
  });

  it("Test: exclusive outcomes must sum to 100%, with explicit Other/Unknown support", () => {
    const validGroup = validateExclusiveBranches([
      { id: "race", label: "Continue Agent-4 Race (6-4 Vote)", probability: 0.55 },
      { id: "slowdown", label: "Slowdown & Lock Shared Memory (6-4 Vote)", probability: 0.35 },
      { id: "other", label: "Other / Hybrid Pause or Escalation", probability: 0.1, isOtherBranch: true },
    ]);
    expect(validGroup.valid).toBe(true);
    expect(validGroup.warnings).toHaveLength(0);

    const invalidGroup = validateExclusiveBranches([
      { id: "race", label: "Race", probability: 0.7 },
      { id: "slowdown", label: "Slowdown", probability: 0.5 },
    ]);
    expect(invalidGroup.valid).toBe(false);
    expect(invalidGroup.errors[0]).toContain("must sum to 100.0%");
  });

  it("Test: ambiguous multiple-parent dependency is blocked or flagged until modeled, not silently multiplied", () => {
    const unmodeledCheck = validateMultiParentCPT("node-child", ["parent-a", "parent-b"], undefined);
    expect(unmodeledCheck.valid).toBe(false);
    expect(unmodeledCheck.errors[0]).toContain("Naive multiplication of correlated parents is prohibited");

    const partialCheck = validateMultiParentCPT("node-child", ["parent-a", "parent-b"], [
      { parentStates: { "parent-a": "YES", "parent-b": "YES" }, probability: 0.8 },
    ]);
    expect(partialCheck.valid).toBe(false);

    const fullCptCheck = validateMultiParentCPT("node-child", ["parent-a", "parent-b"], [
      { parentStates: { "parent-a": "YES", "parent-b": "YES" }, probability: 0.85 },
      { parentStates: { "parent-a": "YES", "parent-b": "NO" }, probability: 0.45 },
      { parentStates: { "parent-a": "NO", "parent-b": "YES" }, probability: 0.3 },
      { parentStates: { "parent-a": "NO", "parent-b": "NO" }, probability: 0.05 },
    ]);
    expect(fullCptCheck.valid).toBe(true);
  });

  it("Test: prohibited cycles are rejected", () => {
    const cycleResult = detectGraphCycles(
      ["A", "B", "C"],
      [
        { sourceNodeId: "A", targetNodeId: "B" },
        { sourceNodeId: "B", targetNodeId: "C" },
        { sourceNodeId: "C", targetNodeId: "A" },
      ]
    );
    expect(cycleResult.hasCycle).toBe(true);
    expect(cycleResult.cyclePath.length).toBeGreaterThanOrEqual(3);

    const dagResult = detectGraphCycles(
      ["A", "B", "C"],
      [
        { sourceNodeId: "A", targetNodeId: "B" },
        { sourceNodeId: "B", targetNodeId: "C" },
        { sourceNodeId: "A", targetNodeId: "C" },
      ]
    );
    expect(dagResult.hasCycle).toBe(false);
  });

  it("Test: end-to-end DAG propagation computes exact marginals and deltas when root shifts 40% -> 60%", () => {
    const mockNodes: FutureNode[] = [
      {
        id: "tai-2030",
        scenarioId: "ai-2027",
        logicalId: "Q-TAI-2030",
        nodeType: "resolvable_proposition",
        provenanceType: "operationalized_question",
        branchTrack: "operationalized",
        chapter: "2027–2030",
        dateLabel: "By Dec 2030",
        sortDate: "2030-12-31",
        title: "Transformative AI by 2030",
        summary: "Root proposition",
        detailedDescription: "Root proposition",
        plainEnglishDefinition: "YES if transformative AI is deployed by 2030.",
        outcomeSet: ["YES", "NO"],
        observedStatus: "future_unresolved",
        verificationNote: "Unresolved",
        sourceUrl: "https://ai-2027.com/research/timelines-forecast",
        authorAsOf: "2025-04-03",
        currentAsOf: "2026-11-02",
        positionX: 0,
        positionY: 0,
        linkedOpportunities: [],
        question: {
          id: "q-tai",
          nodeId: "tai-2030",
          questionText: "Transformative AI by 2030?",
          resolutionCriteria: "Criterion",
          resolutionSource: "Source",
          resolutionOwner: "Committee",
          horizonDate: "2030-12-31",
          closeDate: "2030-12-31",
          modelRole: "root",
          parentNodeIds: [],
          demoHypothesisProb: 0.4,
          disputeStatus: "none",
        },
      },
      {
        id: "unemployment-2033",
        scenarioId: "ai-2027",
        logicalId: "Q-UNEMP-2033",
        nodeType: "resolvable_proposition",
        provenanceType: "operationalized_question",
        branchTrack: "operationalized",
        chapter: "2030–2033",
        dateLabel: "By Dec 2033",
        sortDate: "2033-12-31",
        title: "High White-Collar Unemployment by 2033",
        summary: "Conditional child proposition",
        detailedDescription: "Conditional child proposition",
        plainEnglishDefinition: "YES if white-collar unemployment exceeds threshold by 2033.",
        outcomeSet: ["YES", "NO"],
        observedStatus: "future_unresolved",
        verificationNote: "Unresolved",
        sourceUrl: "https://ai-2027.com/",
        authorAsOf: "2025-04-03",
        currentAsOf: "2026-11-02",
        positionX: 300,
        positionY: 0,
        linkedOpportunities: [],
        question: {
          id: "q-unemp",
          nodeId: "unemployment-2033",
          questionText: "High unemployment by 2033?",
          resolutionCriteria: "Criterion",
          resolutionSource: "BLS",
          resolutionOwner: "Committee",
          horizonDate: "2033-12-31",
          closeDate: "2033-12-31",
          modelRole: "single_parent_conditional",
          parentNodeIds: ["tai-2030"],
          cptTable: [
            { parentStates: { "tai-2030": "YES" }, probability: 0.35 },
            { parentStates: { "tai-2030": "NO" }, probability: 0.12 },
          ],
          demoHypothesisProb: 0.212,
          disputeStatus: "none",
        },
      },
    ];

    const mockEdges: FutureEdge[] = [
      {
        id: "e1",
        scenarioId: "ai-2027",
        sourceNodeId: "tai-2030",
        targetNodeId: "unemployment-2033",
        relationType: "conditional_probability",
        conditionLabel: "P(Unemployment | TAI=YES) = 35%, P(Unemployment | TAI=NO) = 12%",
        parentOutcome: "YES",
        isModeled: true,
        defaultConditionalProb: 0.35,
        assumptionNote: "Spec section 6.2 benchmark",
        sortOrder: 1,
      },
    ];

    const propOut = propagateGraphProbabilities(
      mockNodes,
      mockEdges,
      { "tai-2030": 0.4 },
      { "tai-2030": 0.6 }
    );

    expect(propOut.valid).toBe(true);
    const childRes = propOut.results["unemployment-2033"];
    expect(childRes.baselineMarginal).toBeCloseTo(0.212, 5);
    expect(childRes.marginalProbability).toBeCloseTo(0.258, 5);
    expect(childRes.delta).toBeCloseTo(0.046, 5);
  });

  it("Test: Brier score handles resolved questions, narrative milestones, and unrealized conditions properly", () => {
    const scored = computeBrierScore({
      probability: 0.7,
      outcome: 1,
      submittedAtIso: "2026-06-01T00:00:00Z",
      cutoffAtIso: "2026-12-31T23:59:59Z",
      nodeType: "resolvable_proposition",
      conditioningRealized: true,
    });
    expect(scored.status).toBe("scored");
    expect(scored.brierScore).toBeCloseTo(0.09, 5);

    const unrealized = computeBrierScore({
      probability: 0.8,
      outcome: 0,
      submittedAtIso: "2026-06-01T00:00:00Z",
      cutoffAtIso: "2026-12-31T23:59:59Z",
      nodeType: "resolvable_proposition",
      conditioningRealized: false,
    });
    expect(unrealized.status).toBe("unscored_condition_unrealized");
    expect(unrealized.brierScore).toBeNull();

    const narrative = computeBrierScore({
      probability: 0.5,
      outcome: 1,
      submittedAtIso: "2026-06-01T00:00:00Z",
      cutoffAtIso: "2026-12-31T23:59:59Z",
      nodeType: "scenario_milestone",
    });
    expect(narrative.status).toBe("unscored_non_resolvable_type");
    expect(narrative.brierScore).toBeNull();
  });
});

describe("FutureGraph Audit Receipt & Hash Chain — Section 8.3 & 14 Acceptance Tests", () => {
  it("Test: canonical SHA-256 receipt creation and tamper detection", () => {
    const canonicalA = canonicalizePayload({ b: 2, a: 1, nested: { z: true, y: false } });
    const canonicalB = canonicalizePayload({ nested: { y: false, z: true }, a: 1, b: 2 });
    expect(canonicalA).toBe(canonicalB);

    const receipt = createServerAuditReceipt({
      eventId: "evt-test-001",
      entityType: "forecast_event",
      entityId: "fe-001",
      contributorId: "usr-eli",
      contributorHandle: "eli_lifland",
      contributorName: "Eli Lifland (Seeded Benchmark)",
      scenarioVersion: 1,
      canonicalPayload: {
        nodeId: "q-sc-2027",
        probability: 0.38,
        rationale: "Updated May 2025 timelines model median.",
      },
      serverTimestamp: "2026-11-02T21:00:00.000Z",
    });

    const verified = verifyAuditReceipt(receipt);
    expect(verified.verified).toBe(true);
    expect(verified.payloadMatches).toBe(true);
    expect(verified.chainMatches).toBe(true);
    expect(verified.limitationsDisclosure).toContain("Server-verified commitment");

    // Mutate payload and confirm verification fails
    const tampered = {
      ...receipt,
      canonicalPayload: {
        ...receipt.canonicalPayload,
        probability: 0.99,
      },
    };
    const tamperedCheck = verifyAuditReceipt(tampered);
    expect(tamperedCheck.verified).toBe(false);
    expect(tamperedCheck.payloadMatches).toBe(false);
  });
});

describe("FairMarkets Governance Lab — Section 9 & 14 Acceptance Tests", () => {
  const testInterventions: PolicyIntervention[] = [
    {
      id: "pol-dominator",
      slug: "coordinated-safety-compacts",
      title: "Coordinated Verification & Safety Thresholds",
      shortLabel: "Coordinated Verification",
      description: "Hardware-enabled verification + mandatory interpretability gates",
      causalModelCaveat: "Modeled as do(policy)",
      linkedNodeIds: ["node-oct-2027-branch"],
      isHypothetical: true,
      outcomeEstimates: {
        physical_safety: {
          objectiveId: "physical_safety",
          pointEstimate: 82,
          uncertaintyLow: 65,
          uncertaintyHigh: 92,
          misalignmentSensitivity: -15,
          assumptionSummary: "High safety",
          linkedNodeId: "node-slowdown-safer1",
        },
        autonomy_freedom: {
          objectiveId: "autonomy_freedom",
          pointEstimate: 74,
          uncertaintyLow: 58,
          uncertaintyHigh: 84,
          misalignmentSensitivity: -10,
          assumptionSummary: "Moderate-high autonomy",
          linkedNodeId: "node-slowdown-2028-election",
        },
        democratic_accountability: {
          objectiveId: "democratic_accountability",
          pointEstimate: 78,
          uncertaintyLow: 60,
          uncertaintyHigh: 88,
          misalignmentSensitivity: -12,
          assumptionSummary: "High accountability",
          linkedNodeId: "node-oct-2027-oversight",
        },
        economic_abundance: {
          objectiveId: "economic_abundance",
          pointEstimate: 76,
          uncertaintyLow: 60,
          uncertaintyHigh: 88,
          misalignmentSensitivity: -8,
          assumptionSummary: "High abundance",
          linkedNodeId: "node-slowdown-2029-transformation",
        },
        scientific_progress: {
          objectiveId: "scientific_progress",
          pointEstimate: 75,
          uncertaintyLow: 60,
          uncertaintyHigh: 86,
          misalignmentSensitivity: -5,
          assumptionSummary: "Strong progress",
          linkedNodeId: "node-slowdown-safer4",
        },
        global_stability: {
          objectiveId: "global_stability",
          pointEstimate: 80,
          uncertaintyLow: 62,
          uncertaintyHigh: 90,
          misalignmentSensitivity: -14,
          assumptionSummary: "High stability",
          linkedNodeId: "node-slowdown-july-2028-deal",
        },
      },
    },
    {
      id: "pol-dominated",
      slug: "opaque-unilateral-centralization",
      title: "Opaque Unilateral Rush Without Verification",
      shortLabel: "Opaque Rush",
      description: "Dominated test policy",
      causalModelCaveat: "Modeled as do(policy)",
      linkedNodeIds: ["node-race-vote"],
      isHypothetical: true,
      outcomeEstimates: {
        physical_safety: {
          objectiveId: "physical_safety",
          pointEstimate: 35,
          uncertaintyLow: 15,
          uncertaintyHigh: 55,
          misalignmentSensitivity: -40,
          assumptionSummary: "Low safety",
          linkedNodeId: "node-race-bioweapon",
        },
        autonomy_freedom: {
          objectiveId: "autonomy_freedom",
          pointEstimate: 40,
          uncertaintyLow: 20,
          uncertaintyHigh: 60,
          misalignmentSensitivity: -30,
          assumptionSummary: "Low autonomy",
          linkedNodeId: "node-race-capture",
        },
        democratic_accountability: {
          objectiveId: "democratic_accountability",
          pointEstimate: 30,
          uncertaintyLow: 15,
          uncertaintyHigh: 50,
          misalignmentSensitivity: -25,
          assumptionSummary: "Low accountability",
          linkedNodeId: "node-race-capture",
        },
        economic_abundance: {
          objectiveId: "economic_abundance",
          pointEstimate: 70,
          uncertaintyLow: 40,
          uncertaintyHigh: 90,
          misalignmentSensitivity: -20,
          assumptionSummary: "Short-term boom",
          linkedNodeId: "node-race-sez",
        },
        scientific_progress: {
          objectiveId: "scientific_progress",
          pointEstimate: 72,
          uncertaintyLow: 50,
          uncertaintyHigh: 92,
          misalignmentSensitivity: -10,
          assumptionSummary: "Fast R&D",
          linkedNodeId: "node-race-agent5",
        },
        global_stability: {
          objectiveId: "global_stability",
          pointEstimate: 28,
          uncertaintyLow: 10,
          uncertaintyHigh: 50,
          misalignmentSensitivity: -35,
          assumptionSummary: "Arms race",
          linkedNodeId: "node-race-consensus1",
        },
      },
    },
  ];

  it("Test: dominated vs non-dominated policies computed correctly and changing value weights never mutates objective outcome forecasts", () => {
    const activeObjs = [
      "physical_safety",
      "democratic_accountability",
      "economic_abundance",
    ] as const;

    const out1 = evaluateFairMarketsPolicies({
      interventions: testInterventions,
      activeObjectives: [...activeObjs],
      userWeights: {
        physical_safety: 90,
        autonomy_freedom: 50,
        democratic_accountability: 80,
        economic_abundance: 20,
        scientific_progress: 50,
        global_stability: 70,
      },
      communityWeights: {
        physical_safety: 70,
        autonomy_freedom: 70,
        democratic_accountability: 70,
        economic_abundance: 70,
        scientific_progress: 70,
        global_stability: 70,
      },
    });

    expect(out1.paretoSetIds).toContain("pol-dominator");
    expect(out1.dominatedIds).toContain("pol-dominated");

    const scoresBefore = out1.evaluatedPolicies[0].objectiveScores;

    // Now radically change user value weights
    const out2 = evaluateFairMarketsPolicies({
      interventions: testInterventions,
      activeObjectives: [...activeObjs],
      userWeights: {
        physical_safety: 5,
        autonomy_freedom: 5,
        democratic_accountability: 5,
        economic_abundance: 100,
        scientific_progress: 100,
        global_stability: 5,
      },
      communityWeights: {
        physical_safety: 70,
        autonomy_freedom: 70,
        democratic_accountability: 70,
        economic_abundance: 70,
        scientific_progress: 70,
        global_stability: 70,
      },
    });

    const scoresAfter = out2.evaluatedPolicies[0].objectiveScores;
    // Objective forecasts MUST be identical regardless of user value weights
    expect(scoresAfter).toEqual(scoresBefore);
    expect(doesPolicyDominate(scoresBefore, out1.evaluatedPolicies[1].objectiveScores, [...activeObjs])).toBe(true);
  });
});

describe("FutureGraph AI 2027 Canonical Dataset & Store Integration Tests", () => {
  it("Test: 29-node AI 2027 DAG is acyclic, propagates cleanly, and enforces human vs AI agent lens segregation", async () => {
    const {
      getStore,
      getBasePriorsForLens,
      submitForecastEvent,
      submitArgumentItem,
      submitBranchProposal,
      createScenarioFork,
      compareLenses,
    } = await import("../store");

    const store = getStore();
    expect(store.nodes.length).toBeGreaterThanOrEqual(29);
    expect(store.edges.length).toBeGreaterThanOrEqual(28);

    const demoPriors = getBasePriorsForLens("demo_hypothesis");
    const prop = propagateGraphProbabilities(store.nodes, store.edges, demoPriors, {});
    expect(prop.valid).toBe(true);
    expect(Object.keys(prop.results).length).toBe(store.nodes.length);

    // Compare demo_hypothesis vs ai_claude lens
    const diff = compareLenses("demo_hypothesis", "ai_claude");
    expect(diff.length).toBe(store.nodes.length);
    expect(diff[0].absDiff).toBeGreaterThanOrEqual(diff[diff.length - 1].absDiff);

    // Submit an AI Agent forecast and verify receipt + human community lens isolation
    const commBefore = getBasePriorsForLens("community")["node-oct-2027-government-oversight-fork"];
    const agentSub = await submitForecastEvent({
      nodeId: "node-oct-2027-government-oversight-fork",
      probability: 0.77,
      rationale: "Autonomous agent test forecast verifying Sybil isolation from human community median.",
      forecasterHandle: "sentinel_bayes_v2",
      forecasterType: "ai_agent",
    });
    expect(agentSub.receipt.payloadSha256).toHaveLength(64);
    const commAfter = getBasePriorsForLens("community")["node-oct-2027-government-oversight-fork"];
    expect(commAfter).toBe(commBefore);

    // Submit argument, branch proposal, and fork
    const argSub = await submitArgumentItem({
      nodeId: "node-oct-2027-government-oversight-fork",
      stance: "steelman",
      thesis: "Test steelman thesis on oversight vote",
      reasoning: "Detailed reasoning testing canonical receipt generation.",
    });
    expect(argSub.receipt.chainSha256).toHaveLength(64);

    const propSub = await submitBranchProposal({
      parentNodeId: "node-jul-2027-cheap-remote-worker",
      proposedTitle: "Test Counterfactual Branch",
      proposedSummary: "Summary of test counterfactual branch.",
      conditionalAssumption: "Test condition",
      suggestedProbability: 0.4,
    });
    expect(propSub.proposal.status).toBe("pending_review");

    const forkSub = await createScenarioFork({
      title: "Test Hardware Bottleneck Fork",
      rationale: "Testing fork creation and receipt verification.",
      nodeProbabilityOverrides: { "node-mar-2027-algorithmic-breakthroughs": 0.25 },
    });
    expect(forkSub.fork.nodeProbabilityOverrides["node-mar-2027-algorithmic-breakthroughs"]).toBe(0.25);
  });

  it("Test: AI 2050 Five Worlds Simple (9 nodes) & Comprehensive (22 nodes) trees sum to 100% and include cited forum arguments", async () => {
    const {
      AI_2050_SIMPLE_RIVER_SPECS,
      AI_2050_COMPREHENSIVE_RIVER_SPECS,
      AI_2050_NODES,
      AI_2050_ARGUMENTS,
    } = await import("@/data/ai2050-seed");

    expect(AI_2050_SIMPLE_RIVER_SPECS).toHaveLength(9);
    expect(AI_2050_COMPREHENSIVE_RIVER_SPECS).toHaveLength(22);
    expect(AI_2050_NODES).toHaveLength(22);

    const computeTerminalSum = (specs: typeof AI_2050_SIMPLE_RIVER_SPECS) => {
      const parentSet = new Set(specs.map((s) => s.parentId).filter(Boolean));
      const overallMap = new Map<string, number>();
      for (const s of specs) {
        if (!s.parentId) {
          overallMap.set(s.id, 1.0);
        } else {
          const p = overallMap.get(s.parentId) ?? 1.0;
          overallMap.set(s.id, p * s.defaultConditionalProb);
        }
      }
      const terminals = specs.filter((s) => !parentSet.has(s.id));
      const sum = terminals.reduce((acc, t) => acc + (overallMap.get(t.id) ?? 0), 0);
      return { terminals, sum };
    };

    const simpleRes = computeTerminalSum(AI_2050_SIMPLE_RIVER_SPECS);
    expect(simpleRes.terminals).toHaveLength(5);
    expect(simpleRes.sum).toBeCloseTo(1.0, 2);

    const compRes = computeTerminalSum(AI_2050_COMPREHENSIVE_RIVER_SPECS);
    expect(compRes.terminals).toHaveLength(10);
    expect(compRes.sum).toBeCloseTo(1.0, 2);

    // Every AI 2050 node has at least one curated forum argument with platform, source URL, and upvotes
    for (const node of AI_2050_NODES) {
      const nodeArgs = AI_2050_ARGUMENTS.filter((a) => a.nodeId === node.id);
      expect(nodeArgs.length).toBeGreaterThanOrEqual(1);
      for (const arg of nodeArgs) {
        expect(arg.externalPlatform).toBeTruthy();
        expect(arg.externalSourceUrl).toMatch(/^https?:\/\//);
        expect(arg.externalUpvotes).toBeGreaterThan(0);
      }
    }
  });

  it("Test: Every node in AI 2027 (29 nodes) and AI 2040 (22 nodes) has well-sourced academic/forum arguments with external citations and upvotes", async () => {
    const { SEED_NODES, SEED_ARGUMENTS } = await import("@/data/ai2027-seed");
    const { AI_2040_NODES, AI_2040_ARGUMENTS } = await import("@/data/ai2040-seed");

    expect(SEED_NODES).toHaveLength(29);
    for (const node of SEED_NODES) {
      const nodeArgs = SEED_ARGUMENTS.filter((a) => a.nodeId === node.id);
      expect(nodeArgs.length).toBeGreaterThanOrEqual(1);
      for (const arg of nodeArgs) {
        expect(arg.externalPlatform).toBeTruthy();
        expect(arg.externalSourceUrl).toMatch(/^https?:\/\//);
        expect(arg.externalUpvotes).toBeGreaterThan(0);
      }
    }

    expect(AI_2040_NODES).toHaveLength(22);
    for (const node of AI_2040_NODES) {
      const nodeArgs = AI_2040_ARGUMENTS.filter((a) => a.nodeId === node.id);
      expect(nodeArgs.length).toBeGreaterThanOrEqual(1);
      for (const arg of nodeArgs) {
        expect(arg.externalPlatform).toBeTruthy();
        expect(arg.externalSourceUrl).toMatch(/^https?:\/\//);
        expect(arg.externalUpvotes).toBeGreaterThan(0);
      }
    }
  });

  it("Test: River Tree Layout Solver guarantees zero label-to-label or label-to-circle bounding-box overlaps across all 4 scenario trees", async () => {
    const { resolveRiverLabelPlacements, boxIntersectionArea } = await import("../river-layout");
    const { RIVER_TREE_SPECS } = await import("@/components/ScenarioGraphExplorer");
    const { SEED_ARGUMENTS, SEED_COMMENTS } = await import("@/data/ai2027-seed");
    const { AI_2040_RIVER_SPECS, AI_2040_ARGUMENTS, AI_2040_COMMENTS } = await import("@/data/ai2040-seed");
    const {
      AI_2050_SIMPLE_RIVER_SPECS,
      AI_2050_COMPREHENSIVE_RIVER_SPECS,
      AI_2050_ARGUMENTS,
      AI_2050_COMMENTS,
    } = await import("@/data/ai2050-seed");

    const trees = [
      { name: "AI 2027", specs: RIVER_TREE_SPECS, args: SEED_ARGUMENTS },
      { name: "AI 2040", specs: AI_2040_RIVER_SPECS, args: AI_2040_ARGUMENTS },
      { name: "AI 2050 Simple", specs: AI_2050_SIMPLE_RIVER_SPECS, args: AI_2050_ARGUMENTS },
      { name: "AI 2050 Comprehensive", specs: AI_2050_COMPREHENSIVE_RIVER_SPECS, args: AI_2050_ARGUMENTS },
    ];

    for (const tree of trees) {
      const parentSet = new Set(tree.specs.map((s) => s.parentId).filter(Boolean));
      const overallMap = new Map<string, number>();
      for (const s of tree.specs) {
        if (!s.parentId) {
          overallMap.set(s.id, 1.0);
        } else {
          const p = overallMap.get(s.parentId) ?? 1.0;
          overallMap.set(s.id, p * s.defaultConditionalProb);
        }
      }

      const debateMap = new Map<string, { topHandle?: string; topUpvotes?: number }>();
      for (const spec of tree.specs) {
        const topArg = tree.args
          .filter((a) => a.nodeId === spec.canonicalNodeId)
          .sort((a, b) => (b.externalUpvotes ?? 0) - (a.externalUpvotes ?? 0))[0];
        if (topArg) {
          debateMap.set(spec.canonicalNodeId, {
            topHandle: topArg.authorHandle,
            topUpvotes: topArg.externalUpvotes ?? 0,
          });
        }
      }

      const inputs = tree.specs.map((spec) => ({
        id: spec.id,
        canonicalNodeId: spec.canonicalNodeId,
        parentId: spec.parentId,
        shortName: spec.shortName,
        dateTag: spec.dateTag,
        track: spec.track,
        x: spec.x,
        y: spec.y,
        overallProb: overallMap.get(spec.id) ?? spec.defaultConditionalProb,
        conditionalProb: spec.defaultConditionalProb,
        isTerminalOutcome: !parentSet.has(spec.id),
        labelPosition: spec.labelPosition,
      }));

      const resolvedMap = resolveRiverLabelPlacements(inputs, debateMap);
      const list = Array.from(resolvedMap.values());
      expect(list).toHaveLength(tree.specs.length);

      // Verify zero pairwise label bounding-box overlaps and zero label-to-circle overlaps
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (a.bbox.top < 60 || a.bbox.bottom > 685) {
          throw new Error(
            `[${tree.name}] Node "${a.nodeId}" (${a.placement}) violated header/footer safe zone: top=${a.bbox.top}, bottom=${a.bbox.bottom}`
          );
        }
        for (const spec of tree.specs) {
          const r = resolvedMap.get(spec.id)?.radius ?? 10;
          const circleBox = {
            left: spec.x - r,
            right: spec.x + r,
            top: spec.y - r,
            bottom: spec.y + r,
          };
          const circleOverlap = boxIntersectionArea(a.bbox, circleBox, 0);
          expect(circleOverlap).toBe(0);
        }
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j];
          const overlapArea = boxIntersectionArea(a.bbox, b.bbox, 0);
          if (overlapArea > 0) {
            throw new Error(
              `[${tree.name}] Label overlap detected between "${a.nodeId}" (${a.placement}, x=${Math.round(a.bbox.left)}..${Math.round(a.bbox.right)}, y=${Math.round(a.bbox.top)}..${Math.round(a.bbox.bottom)}) and "${b.nodeId}" (${b.placement}, x=${Math.round(b.bbox.left)}..${Math.round(b.bbox.right)}, y=${Math.round(b.bbox.top)}..${Math.round(b.bbox.bottom)}): area=${overlapArea}`
            );
          }
          expect(overlapArea).toBe(0);
        }
      }
    }

    // Verify no arguments or comments are attributed to synthetic mock handles elena_vance or marcus_chen
    const allArgs = [...SEED_ARGUMENTS, ...AI_2040_ARGUMENTS, ...AI_2050_ARGUMENTS];
    const allComments = [...SEED_COMMENTS, ...AI_2040_COMMENTS, ...AI_2050_COMMENTS];
    for (const arg of allArgs) {
      expect(arg.authorHandle).not.toBe("elena_vance");
      expect(arg.authorHandle).not.toBe("marcus_chen");
    }
    for (const cmt of allComments) {
      expect(cmt.authorHandle).not.toBe("elena_vance");
      expect(cmt.authorHandle).not.toBe("marcus_chen");
    }
  });
});


