import {
  COHORT_PACE_PROFILES,
  LEV_PREDICTION_MARKETS,
} from "@/data/lev-seed";
import {
  CohortLivePaceMetrics,
  computeLevDashboard,
  ConservativeUpdateMode,
  formatDecimalYear,
  LevDashboardComputation,
  LevTrajectoryPoint,
} from "@/lib/lev-engine";
import {
  evaluateGraphDistribution,
  getDefaultGraphDistribution,
  getRegisteredGraph,
} from "@/lib/graph-registry";
import {
  CrowdEnsembleMode,
  ForecasterActor,
  ForkRationaleEntry,
  GraphForecastRun,
  GraphVarianceReport,
  LevActorForecast,
  NodeVarianceDelta,
  RegisteredGraphId,
  WorldviewCard,
} from "@/types/forecaster";

export interface ComputedCrowdDistribution {
  graphId: RegisteredGraphId;
  crowdMode: CrowdEnsembleMode;
  contributorCount: number;
  contributorHandles: string[];
  nodeOverallProbabilities: Record<string, number>;
  canonicalNodeProbabilities: Record<string, number>;
  normalizedConditionalSplits: Record<string, number>;
  normalizedRootPriors?: Record<string, number>;
  levForecast?: LevActorForecast;
}

function averageRecordMaps(
  items: Array<{ map: Record<string, number>; weight: number }>
): Record<string, number> {
  const result: Record<string, number> = {};
  const weightSums: Record<string, number> = {};
  for (const item of items) {
    if (item.weight <= 0) continue;
    for (const [key, val] of Object.entries(item.map)) {
      if (!Number.isFinite(val)) continue;
      result[key] = (result[key] || 0) + val * item.weight;
      weightSums[key] = (weightSums[key] || 0) + item.weight;
    }
  }
  for (const key of Object.keys(result)) {
    const w = weightSums[key] || 1;
    result[key] = Number((result[key] / w).toFixed(6));
  }
  return result;
}

function averageLevForecasts(
  items: Array<{ lev: LevActorForecast; weight: number }>,
  summaryLabel: string
): LevActorForecast {
  const valid = items.filter((x) => x.weight > 0 && x.lev);
  if (valid.length === 0) {
    return {
      p99Year: 2037.5,
      p99Low: 2034.1,
      p99High: 2041.7,
      p80Year: 2042.5,
      p50Year: 2052.1,
      intrinsicPoAP99: 0.668,
      velocityMultiplier: 1.0,
      mechanismSummary: summaryLabel,
    };
  }
  const wSum = valid.reduce((acc, x) => acc + x.weight, 0) || 1;
  const avg = (fn: (l: LevActorForecast) => number, digits = 1) => {
    const v = valid.reduce((acc, x) => acc + fn(x.lev) * x.weight, 0) / wSum;
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
  };
  return {
    p99Year: avg((l) => l.p99Year, 1),
    p99Low: avg((l) => l.p99Low, 1),
    p99High: avg((l) => l.p99High, 1),
    p80Year: avg((l) => l.p80Year, 1),
    p50Year: avg((l) => l.p50Year, 1),
    intrinsicPoAP99: avg((l) => l.intrinsicPoAP99, 3),
    velocityMultiplier: avg((l) => l.velocityMultiplier, 3),
    mechanismSummary: summaryLabel,
  };
}

/**
 * Computes the calibrated Crowd Wisdom distribution for ANY registered graph
 * across the 3 user-toggleable ensemble lenses:
 * - `all_ensemble`: Prediction Markets + Verified Humans + Diverse-Worldview AI Agents
 * - `humans_markets`: Prediction Markets + Verified Human Forecasters only
 * - `agents_only`: Verified Diverse-Worldview AI Agents only
 */
export function computeCrowdDistribution(
  graphId: RegisteredGraphId,
  crowdMode: CrowdEnsembleMode,
  actors: ForecasterActor[],
  runs: GraphForecastRun[]
): ComputedCrowdDistribution {
  const actorByHandle = new Map(actors.map((a) => [a.handle, a]));
  const verifiedGraphRuns = runs.filter((r) => {
    if (r.graphId !== graphId) return false;
    const actor = actorByHandle.get(r.actorHandle);
    return Boolean(actor?.isVerifiedEnsemble);
  });

  // Special handling for LEV quantile / trajectory graph
  if (graphId === "lev") {
    const mktWeightSum =
      LEV_PREDICTION_MARKETS.reduce(
        (acc, m) => acc + m.weightInMarketAggregate,
        0
      ) || 1;
    const marketSynth: LevActorForecast = {
      p99Year:
        Math.round(
          (LEV_PREDICTION_MARKETS.reduce(
            (acc, m) => acc + m.implied99thPercentileYear * m.weightInMarketAggregate,
            0
          ) /
            mktWeightSum) *
            10
        ) / 10,
      p99Low: 2033.8,
      p99High: 2042.9,
      p80Year:
        Math.round(
          (LEV_PREDICTION_MARKETS.reduce(
            (acc, m) => acc + m.implied80thPercentileYear * m.weightInMarketAggregate,
            0
          ) /
            mktWeightSum) *
            10
        ) / 10,
      p50Year:
        Math.round(
          (LEV_PREDICTION_MARKETS.reduce(
            (acc, m) => acc + m.implied50thPercentileYear * m.weightInMarketAggregate,
            0
          ) /
            mktWeightSum) *
            10
        ) / 10,
      intrinsicPoAP99: 0.668,
      velocityMultiplier: 1.0,
      mechanismSummary: "Prediction markets weighted consensus (Metaculus + Manifold).",
    };

    const humanRuns = verifiedGraphRuns.filter(
      (r) =>
        r.levForecast &&
        (r.actorType === "human" || r.actorType === "market_baseline")
    );
    const agentRuns = verifiedGraphRuns.filter(
      (r) => r.levForecast && r.actorType === "ai_agent"
    );

    const humansPool = averageLevForecasts(
      humanRuns.map((r) => ({
        lev: r.levForecast!,
        weight: r.actorType === "market_baseline" ? 2.5 : 1.0,
      })),
      "Verified Human & Market Longevity Forecasters"
    );
    const humansAndMarketsCombined = averageLevForecasts(
      [
        { lev: marketSynth, weight: 0.45 },
        { lev: humansPool, weight: 0.55 },
      ],
      "Crowd Wisdom (Humans & Prediction Markets): Metaculus/Manifold markets + published longevity researchers & LEVL creator."
    );
    const agentsCombined = averageLevForecasts(
      agentRuns.map((r) => ({ lev: r.levForecast!, weight: 1.0 })),
      "Crowd Wisdom (AI Agents Only): Equal-weight ensemble across 5 transparent worldview agents."
    );

    let chosenLev: LevActorForecast;
    let contributorHandles: string[];
    if (crowdMode === "humans_markets") {
      chosenLev = humansAndMarketsCombined;
      contributorHandles = humanRuns.map((r) => r.actorHandle);
    } else if (crowdMode === "agents_only") {
      chosenLev = agentsCombined;
      contributorHandles = agentRuns.map((r) => r.actorHandle);
    } else {
      chosenLev = averageLevForecasts(
        [
          { lev: humansAndMarketsCombined, weight: 0.58 },
          { lev: agentsCombined, weight: 0.42 },
        ],
        "Blended Multi-Worldview Crowd Wisdom: Prediction markets (Metaculus/Manifold) + verified human researchers + 5 diverse AI worldview agents."
      );
      contributorHandles = verifiedGraphRuns.map((r) => r.actorHandle);
    }

    return {
      graphId,
      crowdMode,
      contributorCount: contributorHandles.length,
      contributorHandles,
      nodeOverallProbabilities: {},
      canonicalNodeProbabilities: {},
      normalizedConditionalSplits: {},
      levForecast: chosenLev,
    };
  }

  // Branching River Trees & Conserved Sankey Graphs (plus any future registered graph)
  const humanMarketRuns = verifiedGraphRuns.filter(
    (r) => r.actorType === "human" || r.actorType === "market_baseline"
  );
  const agentRuns = verifiedGraphRuns.filter((r) => r.actorType === "ai_agent");

  let selectedRuns: Array<{ run: GraphForecastRun; weight: number }> = [];
  if (crowdMode === "humans_markets") {
    selectedRuns = humanMarketRuns.map((run) => ({
      run,
      weight: run.actorType === "market_baseline" ? 1.25 : 1.0,
    }));
  } else if (crowdMode === "agents_only") {
    selectedRuns = agentRuns.map((run) => ({ run, weight: 1.0 }));
  } else {
    // all_ensemble: balanced pool between verified humans/markets (55%) and diverse AI agents (45%)
    const hmCount = humanMarketRuns.length;
    const agCount = agentRuns.length;
    if (hmCount > 0 && agCount > 0) {
      const hmUnit = 0.55 / hmCount;
      const agUnit = 0.45 / agCount;
      selectedRuns = [
        ...humanMarketRuns.map((run) => ({
          run,
          weight: run.actorType === "market_baseline" ? hmUnit * 1.2 : hmUnit,
        })),
        ...agentRuns.map((run) => ({ run, weight: agUnit })),
      ];
    } else {
      selectedRuns = verifiedGraphRuns.map((run) => ({ run, weight: 1.0 }));
    }
  }

  if (selectedRuns.length === 0) {
    const fallback = getDefaultGraphDistribution(graphId);
    return {
      graphId,
      crowdMode,
      contributorCount: 0,
      contributorHandles: [],
      ...fallback,
    };
  }

  // Normalize each contributor run individually first so every contributor has equal/intended probability mass
  const evaluatedContributors = selectedRuns.map(({ run, weight }) => ({
    handle: run.actorHandle,
    weight,
    dist: evaluateGraphDistribution(graphId, {
      rootPriors: run.rootPriors,
      conditionalSplits: run.conditionalSplits,
    }),
  }));

  const blendedSplits = averageRecordMaps(
    evaluatedContributors.map((c) => ({
      map: c.dist.normalizedConditionalSplits,
      weight: c.weight,
    }))
  );

  const rootContributors = evaluatedContributors.filter(
    (c) => c.dist.normalizedRootPriors !== undefined
  );
  const blendedRoots =
    rootContributors.length > 0
      ? averageRecordMaps(
          rootContributors.map((c) => ({
            map: c.dist.normalizedRootPriors!,
            weight: c.weight,
          }))
        )
      : undefined;

  const finalEvaluated = evaluateGraphDistribution(graphId, {
    rootPriors: blendedRoots,
    conditionalSplits: blendedSplits,
  });

  return {
    graphId,
    crowdMode,
    contributorCount: evaluatedContributors.length,
    contributorHandles: evaluatedContributors.map((c) => c.handle),
    ...finalEvaluated,
  };
}

function findNodeRationale(
  run: GraphForecastRun,
  nodeId: string,
  canonicalNodeId?: string
): ForkRationaleEntry | undefined {
  if (run.forkRationales[nodeId]) return run.forkRationales[nodeId];
  if (canonicalNodeId && run.forkRationales[canonicalNodeId]) {
    return run.forkRationales[canonicalNodeId];
  }
  if (run.forkRationales[`fork-${nodeId}`]) {
    return run.forkRationales[`fork-${nodeId}`];
  }
  // Also check if a parent fork rationale covers this child option
  const spec = getRegisteredGraph(run.graphId);
  if (spec) {
    for (const fork of spec.forks) {
      if (
        fork.options.some(
          (o) =>
            o.targetNodeId === nodeId ||
            o.splitKey === nodeId ||
            (canonicalNodeId && o.canonicalNodeId === canonicalNodeId)
        )
      ) {
        if (run.forkRationales[fork.forkId]) {
          return run.forkRationales[fork.forkId];
        }
        if (fork.parentNodeId && run.forkRationales[fork.parentNodeId]) {
          return run.forkRationales[fork.parentNodeId];
        }
      }
    }
  }
  return undefined;
}

/**
 * Computes signed Variance from Crowd Wisdom (`Δ vs. Crowd`) for any individual person or AI agent run.
 */
export function computeGraphVarianceReport(
  graphId: RegisteredGraphId,
  actorRun: GraphForecastRun,
  crowdMode: CrowdEnsembleMode,
  actors: ForecasterActor[],
  runs: GraphForecastRun[]
): GraphVarianceReport {
  const spec = getRegisteredGraph(graphId);
  const crowd = computeCrowdDistribution(graphId, crowdMode, actors, runs);

  if (graphId === "lev") {
    const baseLev = computeLevDashboard();
    const actorLev: LevActorForecast = actorRun.levForecast || {
      p99Year: baseLev.aggregate99thYear,
      p99Low: baseLev.cone99th.p25Year,
      p99High: baseLev.cone99th.p75Year,
      p80Year: baseLev.aggregate80thYear,
      p50Year: baseLev.aggregate50thYear,
      intrinsicPoAP99: baseLev.cohorts.p99.intrinsicPaceOfAging,
      velocityMultiplier: 1.0,
      mechanismSummary: actorRun.headlineSummary,
    };
    const crowdLev = crowd.levForecast!;
    const p99YearDelta = Number((actorLev.p99Year - crowdLev.p99Year).toFixed(1));
    const p80YearDelta = Number((actorLev.p80Year - crowdLev.p80Year).toFixed(1));
    const p50YearDelta = Number((actorLev.p50Year - crowdLev.p50Year).toFixed(1));

    const items: NodeVarianceDelta[] = [
      {
        nodeId: "lev-p99-intercept",
        label: "99th-Percentile Human LEV Year",
        epochOrDateLabel: `${actorLev.p99Year} vs ${crowdLev.p99Year}`,
        isTerminalOutcome: true,
        actorProb: actorLev.p99Year,
        crowdProb: crowdLev.p99Year,
        signedDelta: p99YearDelta,
        absDelta: Math.abs(p99YearDelta),
        rationale: actorLev.mechanismSummary,
        keyAssumption: actorLev.keyAssumption,
      },
      {
        nodeId: "lev-p80-intercept",
        label: "80th-Percentile Human LEV Year",
        epochOrDateLabel: `${actorLev.p80Year} vs ${crowdLev.p80Year}`,
        isTerminalOutcome: true,
        actorProb: actorLev.p80Year,
        crowdProb: crowdLev.p80Year,
        signedDelta: p80YearDelta,
        absDelta: Math.abs(p80YearDelta),
        rationale: actorLev.mechanismSummary,
      },
      {
        nodeId: "lev-p50-intercept",
        label: "50th-Percentile Population LEV Year",
        epochOrDateLabel: `${actorLev.p50Year} vs ${crowdLev.p50Year}`,
        isTerminalOutcome: true,
        actorProb: actorLev.p50Year,
        crowdProb: crowdLev.p50Year,
        signedDelta: p50YearDelta,
        absDelta: Math.abs(p50YearDelta),
        rationale: actorLev.mechanismSummary,
      },
    ];
    const ranked = [...items].sort((a, b) => b.absDelta - a.absDelta);
    const byNodeId: Record<string, NodeVarianceDelta> = {};
    for (const item of items) byNodeId[item.nodeId] = item;

    return {
      graphId,
      actorHandle: actorRun.actorHandle,
      crowdMode,
      meanAbsDivergence: Number(
        (
          items.reduce((acc, x) => acc + x.absDelta, 0) / items.length
        ).toFixed(2)
      ),
      maxAbsDivergence: ranked[0]?.absDelta ?? 0,
      rankedDivergences: ranked,
      byNodeId,
      levVariance: {
        actorP99Year: actorLev.p99Year,
        crowdP99Year: crowdLev.p99Year,
        p99YearDelta,
        actorP80Year: actorLev.p80Year,
        crowdP80Year: crowdLev.p80Year,
        p80YearDelta,
        actorP50Year: actorLev.p50Year,
        crowdP50Year: crowdLev.p50Year,
        p50YearDelta,
        actorPoAP99: actorLev.intrinsicPoAP99,
        crowdPoAP99: crowdLev.intrinsicPoAP99,
        mechanismSummary: actorLev.mechanismSummary,
      },
    };
  }

  const actorDist = evaluateGraphDistribution(graphId, {
    rootPriors: actorRun.rootPriors,
    conditionalSplits: actorRun.conditionalSplits,
  });

  const deltas: NodeVarianceDelta[] = [];
  const byNodeId: Record<string, NodeVarianceDelta> = {};

  for (const node of spec?.nodes || []) {
    const actorProb = actorDist.nodeOverallProbabilities[node.id] ?? 0;
    const crowdProb = crowd.nodeOverallProbabilities[node.id] ?? 0;
    const signedDelta = Number((actorProb - crowdProb).toFixed(4));
    const absDelta = Number(Math.abs(signedDelta).toFixed(4));
    const rat = findNodeRationale(actorRun, node.id, node.canonicalNodeId);

    const entry: NodeVarianceDelta = {
      nodeId: node.id,
      canonicalNodeId: node.canonicalNodeId,
      label: node.label,
      epochOrDateLabel: node.epochOrDateLabel,
      isTerminalOutcome: node.isTerminalOutcome,
      actorProb,
      crowdProb,
      signedDelta,
      absDelta,
      rationale: rat?.rationale,
      keyAssumption: rat?.keyAssumption,
    };

    deltas.push(entry);
    byNodeId[node.id] = entry;
    if (node.canonicalNodeId) {
      byNodeId[node.canonicalNodeId] = entry;
    }
  }

  // Exclude trivial deterministic root=1.0 nodes from top ranked disagreements
  const nonTrivial = deltas.filter(
    (d) => !(d.actorProb >= 0.9999 && d.crowdProb >= 0.9999)
  );
  const rankedDivergences = [...nonTrivial].sort(
    (a, b) => b.absDelta - a.absDelta
  );

  const meanAbsDivergence =
    nonTrivial.length > 0
      ? Number(
          (
            nonTrivial.reduce((acc, d) => acc + d.absDelta, 0) /
            nonTrivial.length
          ).toFixed(4)
        )
      : 0;

  return {
    graphId,
    actorHandle: actorRun.actorHandle,
    crowdMode,
    meanAbsDivergence,
    maxAbsDivergence: rankedDivergences[0]?.absDelta ?? 0,
    rankedDivergences,
    byNodeId,
  };
}

/**
 * Generates a full `LevDashboardComputation` calibrated to a specific `LevActorForecast`
 * (either Crowd Wisdom or any individual Person/Agent), while keeping `computeLevDashboard()`
 * untouched for the exact `LEVL / Default` view.
 */
export function computeOverlayLevDashboard(params: {
  baseDashboard: LevDashboardComputation;
  targetForecast: LevActorForecast;
  updateMode?: ConservativeUpdateMode;
  currentChronologicalAge?: number;
}): LevDashboardComputation {
  const { baseDashboard, targetForecast } = params;
  const currentChronologicalAge =
    params.currentChronologicalAge ?? baseDashboard.currentChronologicalAge;
  const decimalYearNow = baseDashboard.decimalYearNow;

  const buildCohort = (
    cohortId: "p99" | "p80" | "p50",
    interceptYr: number
  ): CohortLivePaceMetrics => {
    const profile = COHORT_PACE_PROFILES[cohortId];
    const baseCohort = baseDashboard.cohorts[cohortId];
    const intrinsic =
      cohortId === "p99"
        ? Math.max(0.38, Math.min(1.05, targetForecast.intrinsicPoAP99))
        : cohortId === "p80"
        ? Math.round(
            Math.max(
              0.52,
              Math.min(
                1.08,
                baseCohort.intrinsicPaceOfAging +
                  (targetForecast.intrinsicPoAP99 - 0.668) * 0.7
              )
            ) * 1000
          ) / 1000
        : baseCohort.intrinsicPaceOfAging;

    const offset =
      Math.round(
        baseCohort.biotechRejuvenationOffset *
          targetForecast.velocityMultiplier *
          1000
      ) / 1000;
    const netPoA = Math.max(0, Math.round((intrinsic - offset) * 1000) / 1000);
    const yearsToLev = Math.max(
      0,
      Math.round((interceptYr - decimalYearNow) * 10) / 10
    );
    const avgNetPoAUntilLev = netPoA * 0.52;
    const biologicalAgeAtLev =
      Math.round((currentChronologicalAge + yearsToLev * avgNetPoAUntilLev) * 10) /
      10;

    return {
      ...baseCohort,
      label: profile.label,
      shortLabel: profile.shortLabel,
      intrinsicPaceOfAging: Math.round(intrinsic * 1000) / 1000,
      poaP25: Math.round((intrinsic - 0.045) * 1000) / 1000,
      poaP50: Math.round(intrinsic * 1000) / 1000,
      poaP75: Math.round((intrinsic + 0.05) * 1000) / 1000,
      biotechRejuvenationOffset: offset,
      netEffectivePaceOfAging: netPoA,
      bioMonthsPerYear: Math.round(intrinsic * 12 * 10) / 10,
      daysGainedPerYear: Math.round((1 - intrinsic) * 365.25),
      levInterceptYear: interceptYr,
      levInterceptFormatted: formatDecimalYear(interceptYr),
      yearsToLev,
      biologicalAgeAtLev,
    };
  };

  const p99Yr = targetForecast.p99Year;
  const p80Yr = targetForecast.p80Year;
  const p50Yr = targetForecast.p50Year;

  const cohorts = {
    p99: buildCohort("p99", p99Yr),
    p80: buildCohort("p80", p80Yr),
    p50: buildCohort("p50", p50Yr),
  };

  // Build smooth logistic rejuvenation trajectories crossing <= 0.00 at p99Yr, p80Yr, p50Yr
  const trajectorySeries: LevTrajectoryPoint[] = [];
  let p99BioAge = currentChronologicalAge * 0.92;
  let p80BioAge = currentChronologicalAge * 0.96;
  let p50BioAge = currentChronologicalAge * 1.0;

  const computeNetCurveAtYear = (
    year: number,
    startIntrinsic: number,
    interceptYear: number,
    velMult: number
  ) => {
    const steepness = 0.21 * Math.max(0.65, Math.min(1.6, velMult));
    // Logistic rejuvenation S-curve calibrated so Net PoA = 0.000 at year === interceptYear
    const logisticAtIntercept = 1 / (1 + Math.exp(0)); // 0.5
    const scale = startIntrinsic / logisticAtIntercept; // 2 * startIntrinsic
    const offsetAtYear =
      scale / (1 + Math.exp(-steepness * (year - interceptYear)));
    const offsetAt2026 =
      scale / (1 + Math.exp(-steepness * (2026 - interceptYear)));
    // Anchor 2026 near startIntrinsic while hitting 0.00 cleanly at interceptYear
    const blend = Math.min(
      1,
      Math.max(0, (year - 2026) / Math.max(1.5, interceptYear - 2026))
    );
    const adjustedOffset = offsetAtYear - offsetAt2026 * (1 - blend) * 0.85;
    return Math.round((startIntrinsic - adjustedOffset) * 1000) / 1000;
  };

  const fastSpan = Math.max(2.0, p99Yr - targetForecast.p99Low);
  const slowSpan = Math.max(2.5, targetForecast.p99High - p99Yr);

  for (let year = 2026; year <= 2060; year++) {
    const basePt =
      baseDashboard.trajectorySeries[year - 2026] ||
      baseDashboard.trajectorySeries[baseDashboard.trajectorySeries.length - 1];

    const p99Net = computeNetCurveAtYear(
      year,
      cohorts.p99.intrinsicPaceOfAging,
      p99Yr,
      targetForecast.velocityMultiplier
    );
    const p80Net = computeNetCurveAtYear(
      year,
      cohorts.p80.intrinsicPaceOfAging,
      p80Yr,
      targetForecast.velocityMultiplier
    );
    const p50Net = computeNetCurveAtYear(
      year,
      cohorts.p50.intrinsicPaceOfAging,
      p50Yr,
      targetForecast.velocityMultiplier
    );

    const p99Fast = computeNetCurveAtYear(
      year,
      cohorts.p99.intrinsicPaceOfAging,
      p99Yr - fastSpan * 1.35,
      targetForecast.velocityMultiplier * 1.1
    );
    const p99Slow = computeNetCurveAtYear(
      year,
      cohorts.p99.intrinsicPaceOfAging,
      p99Yr + slowSpan * 1.35,
      targetForecast.velocityMultiplier * 0.9
    );

    if (year > 2026) {
      p99BioAge = Math.max(24, p99BioAge + p99Net);
      p80BioAge = Math.max(26, p80BioAge + p80Net);
      p50BioAge = Math.max(28, p50BioAge + p50Net);
    }

    const computeAliveHealthy = (bioAge: number, netRate: number): number => {
      const effectiveAge = Math.max(20, bioAge);
      const ageExcess = Math.max(0, effectiveAge - 42);
      const gompertzDecay = Math.exp(-0.00042 * Math.pow(ageExcess, 2.15));
      const levBoost =
        netRate <= 0 ? Math.min(0.06, Math.abs(netRate) * 0.12) : 0;
      const pct = Math.min(
        99.4,
        Math.max(12.0, (gompertzDecay + levBoost) * 100)
      );
      return Math.round(pct * 10) / 10;
    };

    trajectorySeries.push({
      ...basePt,
      year,
      p99NetPoA: p99Net,
      p80NetPoA: p80Net,
      p50NetPoA: p50Net,
      p99ConeFast5th: p99Fast,
      p99ConeSlow95th: p99Slow,
      p99AliveHealthyPct: computeAliveHealthy(p99BioAge, p99Net),
      p80AliveHealthyPct: computeAliveHealthy(p80BioAge, p80Net),
      p50AliveHealthyPct: computeAliveHealthy(p50BioAge, p50Net),
    });
  }

  const p10Year = Math.round((p99Yr - fastSpan * 1.6) * 10) / 10;
  const p25Year = Math.round(targetForecast.p99Low * 10) / 10;
  const p75Year = Math.round(targetForecast.p99High * 10) / 10;
  const p90Year = Math.round((p99Yr + slowSpan * 1.7) * 10) / 10;
  const p99TailYear = Math.round((p99Yr + slowSpan * 3.2) * 10) / 10;

  return {
    ...baseDashboard,
    currentChronologicalAge,
    aggregate99thYear: p99Yr,
    aggregate99thFormatted: formatDecimalYear(p99Yr),
    aggregate80thYear: p80Yr,
    aggregate80thFormatted: formatDecimalYear(p80Yr),
    aggregate50thYear: p50Yr,
    aggregate50thFormatted: formatDecimalYear(p50Yr),
    cone99th: {
      p10Year,
      p10Formatted: formatDecimalYear(p10Year, true),
      p25Year,
      p25Formatted: formatDecimalYear(p25Year, true),
      p50Year: p99Yr,
      p50Formatted: formatDecimalYear(p99Yr, true),
      p75Year,
      p75Formatted: formatDecimalYear(p75Year, true),
      p90Year,
      p90Formatted: formatDecimalYear(p90Year, true),
      p99TailConfidenceYear: p99TailYear,
      p99TailConfidenceFormatted: formatDecimalYear(p99TailYear, true),
    },
    cohorts,
    trajectorySeries,
  };
}

export interface PortableForecastBundle {
  v: 1;
  actor: {
    handle: string;
    displayName: string;
    actorType: ForecasterActor["actorType"];
    roleLabel: string;
    worldview: WorldviewCard;
  };
  run: GraphForecastRun;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const full = b64 + pad;
  if (typeof atob === "function") {
    const binary = atob(full);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(full, "base64"));
}

/**
 * Encodes an actor worldview + graph forecast run into a compact URL-safe token (`?agentRun=...`)
 * so shared links render immediately even without server persistence.
 */
export function encodePortableForecastBundle(
  bundle: PortableForecastBundle
): string {
  const json = JSON.stringify(bundle);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodePortableForecastBundle(
  token: string
): PortableForecastBundle | null {
  try {
    if (!token || token.length < 8) return null;
    const bytes = base64UrlToBytes(token.trim());
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as PortableForecastBundle;
    if (
      !parsed ||
      parsed.v !== 1 ||
      !parsed.run ||
      typeof parsed.run.graphId !== "string" ||
      !parsed.actor ||
      typeof parsed.actor.handle !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
