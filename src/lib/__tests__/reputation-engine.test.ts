import { describe, expect, it } from "vitest";
import {
  BASE_RP,
  PROVISIONAL_CONFIDENCE_CAP,
  assignPercentiles,
  classifyNodeCategory,
  computeBaseRp,
  computeForecasterScorecard,
  computeProjectedReputationDelta,
  computeTimeWeightedQuestionSettlement,
  horizonDecayFactor,
  isNodeScorable,
  percentileRank,
  tierForRp,
} from "@/lib/reputation-engine";
import type { ReputationLedgerEntry } from "@/types/futuregraph";

function expectedScore(p: number, q: number, trueBelief: number, multiplier = 1): number {
  return (
    multiplier *
    (trueBelief * computeBaseRp(p, q, 1) + (1 - trueBelief) * computeBaseRp(p, q, 0))
  );
}

function ledgerEntry(overrides: Partial<ReputationLedgerEntry>): ReputationLedgerEntry {
  return {
    id: "le",
    questionNodeId: "q",
    questionTitle: "Q",
    category: "agi_capabilities",
    forecasterHandle: "alice",
    forecasterType: "human",
    outcome: 1,
    rpDelta: 10,
    timeWeightedBrier: 0.1,
    originalEventId: "fe",
    originalProbability: 0.7,
    originalCrowdProb: 0.5,
    originalConfidence: 1,
    originalSubmittedAt: "2026-01-01T00:00:00Z",
    effectiveMultiplier: 1,
    revisionCount: 1,
    isContrarianHit: false,
    resolutionReceiptId: "rr",
    resolvedAt: "2026-06-01T00:00:00Z",
    isSandboxDrill: false,
    ...overrides,
  };
}

describe("Hybrid Log Score — strict properness", () => {
  it("expected RP is uniquely maximized by reporting the true belief, for any crowd and conviction", () => {
    const grid = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
    for (const q of [0.05, 0.2, 0.5, 0.85]) {
      for (const trueBelief of [0.1, 0.35, 0.6, 0.9]) {
        for (const multiplier of [0.25, 1, 3]) {
          let bestP = 0;
          let bestScore = -Infinity;
          for (const p of grid) {
            const s = expectedScore(p, q, trueBelief, multiplier);
            if (s > bestScore) {
              bestScore = s;
              bestP = p;
            }
          }
          expect(bestP).toBeCloseTo(trueBelief, 5);
        }
      }
    }
  });
});

describe("Asymmetric contrarian & consensus-bust payouts", () => {
  it("rewards calling an underdog and punishes riding a busted consensus", () => {
    const underdog = computeProjectedReputationDelta({
      probability: 0.8,
      crowdProbability: 0.1,
      confidenceMultiplier: 2,
      currentRp: BASE_RP,
      isVerified: true,
    });
    expect(underdog.deltaIfYes).toBe(368);

    const chalk = computeProjectedReputationDelta({
      probability: 0.85,
      crowdProbability: 0.85,
      confidenceMultiplier: 1,
      currentRp: BASE_RP,
      isVerified: true,
    });
    expect(chalk.deltaIfYes).toBe(38);
    expect(chalk.deltaIfYes).toBeLessThan(underdog.deltaIfYes / 5);

    const bust = computeProjectedReputationDelta({
      probability: 0.9,
      crowdProbability: 0.85,
      confidenceMultiplier: 2,
      currentRp: BASE_RP,
      isVerified: true,
    });
    expect(bust.deltaIfNo).toBe(-291);
    expect(Math.abs(bust.deltaIfNo)).toBeGreaterThan(bust.deltaIfYes * 3);
  });

  it("scales both upside and downside linearly with the confidence slider", () => {
    const base = computeProjectedReputationDelta({
      probability: 0.7,
      crowdProbability: 0.4,
      confidenceMultiplier: 1,
      currentRp: BASE_RP,
      isVerified: true,
    });
    const tripled = computeProjectedReputationDelta({
      probability: 0.7,
      crowdProbability: 0.4,
      confidenceMultiplier: 3,
      currentRp: BASE_RP,
      isVerified: true,
    });
    expect(tripled.deltaIfYes).toBeCloseTo(base.deltaIfYes * 3, -1);
    expect(tripled.deltaIfNo).toBeCloseTo(base.deltaIfNo * 3, -1);
  });
});

describe("Provisional leverage guardrail", () => {
  it("caps unverified accounts at 1.5× while verified accounts unlock 3×", () => {
    const provisional = computeProjectedReputationDelta({
      probability: 0.8,
      crowdProbability: 0.2,
      confidenceMultiplier: 3,
      currentRp: BASE_RP,
      isVerified: false,
    });
    expect(provisional.effectiveMultiplier).toBe(PROVISIONAL_CONFIDENCE_CAP);
    expect(provisional.multiplierWasCapped).toBe(true);

    const verified = computeProjectedReputationDelta({
      probability: 0.8,
      crowdProbability: 0.2,
      confidenceMultiplier: 3,
      currentRp: BASE_RP,
      isVerified: true,
    });
    expect(verified.effectiveMultiplier).toBe(3);
    expect(verified.multiplierWasCapped).toBe(false);
  });

  it("never lets reputation fall below the floor", () => {
    const preview = computeProjectedReputationDelta({
      probability: 0.99,
      crowdProbability: 0.5,
      confidenceMultiplier: 3,
      currentRp: 150,
      isVerified: true,
    });
    expect(preview.newRpIfNo).toBe(100);
  });
});

describe("Anti-sniping horizon decay & time-weighted revisions", () => {
  const openedAtIso = "2026-01-01T00:00:00Z";
  const closeAtIso = "2026-12-31T00:00:00Z";

  it("gives full weight early, decays inside the final quarter, and zero after close", () => {
    expect(horizonDecayFactor({ submittedAtIso: "2026-02-01T00:00:00Z", openedAtIso, closeAtIso })).toBe(1);
    const late = horizonDecayFactor({ submittedAtIso: "2026-12-20T00:00:00Z", openedAtIso, closeAtIso });
    expect(late).toBeGreaterThanOrEqual(0.1);
    expect(late).toBeLessThan(0.25);
    expect(horizonDecayFactor({ submittedAtIso: "2027-01-02T00:00:00Z", openedAtIso, closeAtIso })).toBe(0);
  });

  it("early bold calls outweigh last-minute snipes of the same probability", () => {
    const early = computeTimeWeightedQuestionSettlement({
      events: [{ eventId: "a", probability: 0.8, crowdProbSnapshot: 0.2, confidenceMultiplier: 1, submittedAtIso: "2026-02-01T00:00:00Z" }],
      outcome: 1,
      openedAtIso,
      closeAtIso,
    });
    const sniped = computeTimeWeightedQuestionSettlement({
      events: [{ eventId: "b", probability: 0.8, crowdProbSnapshot: 0.2, confidenceMultiplier: 1, submittedAtIso: "2026-12-28T00:00:00Z" }],
      outcome: 1,
      openedAtIso,
      closeAtIso,
    });
    expect(early.rpDelta).toBeGreaterThan(sniped.rpDelta * 5);
  });

  it("a late update only affects the remaining sliver of the window", () => {
    const held = computeTimeWeightedQuestionSettlement({
      events: [
        { eventId: "a", probability: 0.3, crowdProbSnapshot: 0.5, confidenceMultiplier: 1, submittedAtIso: "2026-01-15T00:00:00Z" },
        { eventId: "b", probability: 0.95, crowdProbSnapshot: 0.9, confidenceMultiplier: 1, submittedAtIso: "2026-12-25T00:00:00Z" },
      ],
      outcome: 1,
      openedAtIso,
      closeAtIso,
    });
    expect(held.revisionCount).toBe(2);
    expect(held.segments[0].weight).toBeGreaterThan(0.95);
    expect(held.rpDelta).toBeLessThan(0);
    expect(held.original?.eventId).toBe("a");
  });

  it("ignores forecasts submitted after the close date", () => {
    const res = computeTimeWeightedQuestionSettlement({
      events: [{ eventId: "late", probability: 0.99, crowdProbSnapshot: 0.5, confidenceMultiplier: 3, submittedAtIso: "2027-02-01T00:00:00Z" }],
      outcome: 1,
      openedAtIso,
      closeAtIso,
    });
    expect(res.eligible).toBe(false);
    expect(res.rpDelta).toBe(0);
  });

  it("flags contrarian hits", () => {
    const res = computeTimeWeightedQuestionSettlement({
      events: [{ eventId: "a", probability: 0.7, crowdProbSnapshot: 0.15, confidenceMultiplier: 1, submittedAtIso: "2026-02-01T00:00:00Z" }],
      outcome: 1,
      openedAtIso,
      closeAtIso,
    });
    expect(res.isContrarianHit).toBe(true);
  });
});

describe("Scorecards, verification thresholds & categories", () => {
  it("requires 5 resolved calls overall and 3 per category for Verified status", () => {
    const four = Array.from({ length: 4 }, (_, i) => ledgerEntry({ id: `e${i}`, rpDelta: 50 }));
    const card4 = computeForecasterScorecard({ handle: "alice", displayName: "Alice", participantType: "human", ledgerEntries: four });
    expect(card4.isVerified).toBe(false);
    expect(card4.tier).toBe("provisional");
    expect(card4.categories.find((c) => c.category === "agi_capabilities")?.isVerified).toBe(true);

    const five = [...four, ledgerEntry({ id: "e5", category: "ai_safety", rpDelta: 50 })];
    const card5 = computeForecasterScorecard({ handle: "alice", displayName: "Alice", participantType: "human", ledgerEntries: five });
    expect(card5.isVerified).toBe(true);
    expect(card5.overallRp).toBe(1250);
    expect(card5.tier).toBe("sharp");
    expect(card5.categories.find((c) => c.category === "ai_safety")?.isVerified).toBe(false);
  });

  it("assigns tiers and mid-rank percentiles", () => {
    expect(tierForRp(1700, true)).toBe("oracle");
    expect(tierForRp(1400, true)).toBe("superforecaster");
    expect(tierForRp(900, true)).toBe("developing");
    expect(percentileRank(10, [1, 5, 10, 20])).toBe(63);
    expect(percentileRank(10, [10])).toBeNull();

    const cards = assignPercentiles([
      computeForecasterScorecard({ handle: "alice", displayName: "A", participantType: "human", ledgerEntries: [ledgerEntry({ rpDelta: 200 })] }),
      computeForecasterScorecard({ handle: "bob", displayName: "B", participantType: "human", ledgerEntries: [ledgerEntry({ forecasterHandle: "bob", rpDelta: -50 })] }),
    ]);
    expect(cards[0].percentile).toBeGreaterThan(cards[1].percentile ?? 0);
  });

  it("classifies nodes into the six categories and keeps authored milestones unscored", () => {
    expect(classifyNodeCategory({ id: "x", title: "Partial epigenetic reprogramming trial doses first patient", summary: "" })).toBe("longevity_biotech");
    expect(classifyNodeCategory({ id: "x", title: "Aggressive containment & damaging cyber sabotage", summary: "" })).toBe("governance_geopolitics");
    expect(classifyNodeCategory({ id: "x", title: "Deployed model attempts weight exfiltration", summary: "" })).toBe("ai_safety");
    expect(classifyNodeCategory({ id: "x", title: "US federal statute regulating frontier AI", summary: "" })).toBe("governance_geopolitics");
    expect(classifyNodeCategory({ id: "x", title: "US unemployment rate reaches 5%", summary: "" })).toBe("economy_society");
    expect(classifyNodeCategory({ id: "x", title: "Magnetic confinement fusion achieves Q > 1", summary: "" })).toBe("science_frontier");
    expect(classifyNodeCategory({ id: "node-early-2026-coding-automation", title: "Coding automation & SL3 security", summary: "" })).toBe("agi_capabilities");
    expect(classifyNodeCategory({ id: "x", title: "Consciousness substrate", summary: "", scenarioId: "scen-nature-of-reality" })).toBe("unscored_metaphysical");

    expect(isNodeScorable({ id: "m", nodeType: "scenario_milestone", title: "t", summary: "", question: {} })).toBe(false);
    expect(isNodeScorable({ id: "r", nodeType: "resolvable_proposition", title: "t", summary: "", question: {} })).toBe(true);
  });
});
