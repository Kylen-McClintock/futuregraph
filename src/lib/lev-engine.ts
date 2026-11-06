import {
  COHORT_PACE_PROFILES,
  LEV_EXPERT_PREDICTIONS,
  LEV_PREDICTION_MARKETS,
  LEVL_TRAJECTORY_REFERENCE,
} from "@/data/lev-seed";

export type ConservativeUpdateMode = "conservative" | "moderate";

export interface LevAggregateWeights {
  marketsWeight: number; // default 0.40
  expertsWeight: number; // default 0.35
  trajectoryWeight: number; // default 0.25
}

export interface CohortLivePaceMetrics {
  cohortId: "p99" | "p80" | "p50";
  label: string;
  shortLabel: string;
  percentileRank: number;
  /** Conservative Bayesian-shrunk intrinsic Pace of Aging (DunedinPACE + multi-organ composite) at current timestamp */
  intrinsicPaceOfAging: number;
  /** Raw unshrunk reference value (e.g. leaderboard raw epigenetic clock) */
  rawReferencePoA: number;
  /** Current annual biotech/therapeutic rejuvenation offset (yr/yr) */
  biotechRejuvenationOffset: number;
  /** Net effective biological aging velocity = intrinsicPoA - biotechRejuvenationOffset */
  netEffectivePaceOfAging: number;
  /** Biological months aged per 12 calendar months (intrinsic) */
  bioMonthsPerYear: number;
  /** Days of healthy longevity runway banked per calendar year */
  daysGainedPerYear: number;
  /** Conservative annual rate of change in intrinsic PoA (yr/yr per year) */
  annualConservativeDrift: number;
  /** Projected calendar year (decimal) when Net Effective PoA crosses <= 0.00 (Longevity Escape Velocity) */
  levInterceptYear: number;
  levInterceptFormatted: string;
  /** Years remaining from current date until cohort LEV intercept */
  yearsToLev: number;
  /** Expected Biological Age at the moment of LEV intercept for a user of `currentAge` */
  biologicalAgeAtLev: number;
}

export interface LevTrajectoryPoint {
  year: number;
  /** Net biological aging rate (bio-yr/yr). <= 0.00 means Longevity Escape Velocity achieved! */
  p99NetPoA: number;
  p80NetPoA: number;
  p50NetPoA: number;
  /** Intrinsic protocol-only Pace of Aging (without future biotech wave) */
  p99IntrinsicPoA: number;
  p80IntrinsicPoA: number;
  /** Cone of Uncertainty (5th to 95th percentile scientific breakthrough velocity) around 99th-percentile trajectory */
  p99ConeFast5th: number;
  p99ConeSlow95th: number;
  /** Cone of Uncertainty around 80th-percentile trajectory */
  p80ConeFast5th: number;
  p80ConeSlow95th: number;
  /** Alive & Healthy Probability (%) for a person starting at `currentAge` in 2026 (tied to levlhealth.com/LEVTrajectory) */
  p99AliveHealthyPct: number;
  p80AliveHealthyPct: number;
  p50AliveHealthyPct: number;
}

export interface LevDashboardComputation {
  asOfIso: string;
  asOfDateFormatted: string;
  decimalYearNow: number;
  updateMode: ConservativeUpdateMode;
  currentChronologicalAge: number;
  weights: LevAggregateWeights;
  /** Component sub-aggregates for 99th-percentile human LEV */
  marketAggregate99thYear: number;
  expertAggregate99thYear: number;
  trajectoryIntercept99thYear: number;
  /** Final weighted aggregate dates across the three cohorts */
  aggregate99thYear: number;
  aggregate99thFormatted: string;
  aggregate80thYear: number;
  aggregate80thFormatted: string;
  aggregate50thYear: number;
  aggregate50thFormatted: string;
  /** Cone of Uncertainty percentiles for the 99th-percentile human LEV date */
  cone99th: {
    p10Year: number;
    p10Formatted: string;
    p25Year: number;
    p25Formatted: string;
    p50Year: number;
    p50Formatted: string;
    p75Year: number;
    p75Formatted: string;
    p90Year: number;
    p90Formatted: string;
    p99TailConfidenceYear: number;
    p99TailConfidenceFormatted: string;
  };
  /** Live dynamically updated Pace of Aging metrics for 99th, 80th, and 50th percentile persons */
  cohorts: {
    p99: CohortLivePaceMetrics;
    p80: CohortLivePaceMetrics;
    p50: CohortLivePaceMetrics;
  };
  /** Year-by-year trajectory series (2026 -> 2060) */
  trajectorySeries: LevTrajectoryPoint[];
  levlReference: typeof LEVL_TRAJECTORY_REFERENCE;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDecimalYear(decimalYear: number, shortMonth = false): string {
  const year = Math.floor(decimalYear);
  const fraction = Math.max(0, Math.min(0.999, decimalYear - year));
  const monthIdx = Math.min(11, Math.floor(fraction * 12));
  const months = shortMonth ? SHORT_MONTH_NAMES : MONTH_NAMES;
  return `${months[monthIdx]} ${year}`;
}

export function getDecimalYearFromDate(date: Date): number {
  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const endOfYear = Date.UTC(year + 1, 0, 1);
  const frac = (date.getTime() - startOfYear) / (endOfYear - startOfYear);
  return Math.round((year + Math.max(0, Math.min(0.9999, frac))) * 10000) / 10000;
}

/**
 * Computes annual biotech rejuvenation velocity Delta E_biotech(t) (in bio-yrs reversed/offset per calendar year)
 * for a given cohort at decimal year `t`.
 * Models the S-curve / compounding transition from metabolic/senolytic interventions (2026-2031)
 * to partial epigenetic reprogramming, thymus regeneration, and AI-designed multi-target therapeutics (2032-2055).
 */
function computeBiotechRejuvenationOffsetAtYear(
  year: number,
  cohortId: "p99" | "p80" | "p50",
  updateMode: ConservativeUpdateMode,
  scenarioShiftYears = 0
): number {
  const profile = COHORT_PACE_PROFILES[cohortId];
  // Effective technological maturity year experienced by this cohort (accounting for early-access lead time)
  const leadScale = cohortId === "p99" ? 1.0 : cohortId === "p80" ? 0.58 : 0.0;
  const effectiveTechYear =
    year + profile.biotechAccessLeadYears * 0.72 - scenarioShiftYears;

  const dampingFactor = updateMode === "conservative" ? 1.0 : 1.14;

  // Logistic + compounding S-curve centered around effectiveTechYear = 2046.5 (for population) / ~2036.8 (for p99)
  const tRel = effectiveTechYear - 2046.2;
  const logisticComponent = 1.18 / (1 + Math.exp(-0.235 * tRel));

  // Subtract early-baseline offset so 2026 starts at realistic validated clinical baseline
  const baselineOffset = cohortId === "p99" ? 0.012 : cohortId === "p80" ? 0.005 : 0.0;
  const rawOffset = Math.max(0, (logisticComponent - 0.01) * dampingFactor + baselineOffset * leadScale);

  return Math.round(rawOffset * 10000) / 10000;
}

export function computeIntrinsicPoAAtYear(
  year: number,
  cohortId: "p99" | "p80" | "p50",
  updateMode: ConservativeUpdateMode
): number {
  const profile = COHORT_PACE_PROFILES[cohortId];
  const elapsedSince2026 = Math.max(0, year - 2026.0);
  const modeMultiplier = updateMode === "conservative" ? 1.0 : 1.22;
  const driftRate = profile.conservativeAnnualProtocolDrift * modeMultiplier;

  // Exponentially damped floor so intrinsic lifestyle/protocol PoA alone asymptotes around ~0.46 (p99), ~0.68 (p80), ~0.92 (p50)
  const floorPoA = cohortId === "p99" ? 0.46 : cohortId === "p80" ? 0.68 : 0.92;
  const span = profile.baselineIntrinsicPoA2026 - floorPoA;
  const decayConstant = span > 0 ? driftRate / span : 0;
  const intrinsic = floorPoA + span * Math.exp(-decayConstant * elapsedSince2026);

  return Math.round(intrinsic * 10000) / 10000;
}

export function computeLevDashboard(options?: {
  referenceDate?: Date;
  updateMode?: ConservativeUpdateMode;
  currentChronologicalAge?: number;
  weights?: Partial<LevAggregateWeights>;
}): LevDashboardComputation {
  const now = options?.referenceDate ?? new Date();
  const decimalYearNow = Math.max(2026.0, getDecimalYearFromDate(now));
  const updateMode: ConservativeUpdateMode = options?.updateMode ?? "conservative";
  const currentChronologicalAge = Math.max(18, Math.min(95, options?.currentChronologicalAge ?? 35));

  const rawWeights: LevAggregateWeights = {
    marketsWeight: options?.weights?.marketsWeight ?? 0.4,
    expertsWeight: options?.weights?.expertsWeight ?? 0.35,
    trajectoryWeight: options?.weights?.trajectoryWeight ?? 0.25,
  };
  const weightSum =
    rawWeights.marketsWeight + rawWeights.expertsWeight + rawWeights.trajectoryWeight || 1;
  const weights: LevAggregateWeights = {
    marketsWeight: Math.round((rawWeights.marketsWeight / weightSum) * 1000) / 1000,
    expertsWeight: Math.round((rawWeights.expertsWeight / weightSum) * 1000) / 1000,
    trajectoryWeight: Math.round((rawWeights.trajectoryWeight / weightSum) * 1000) / 1000,
  };

  // 1. Prediction Markets weighted aggregate
  const mktWeightSum = LEV_PREDICTION_MARKETS.reduce(
    (acc, m) => acc + m.weightInMarketAggregate,
    0
  );
  const marketAggregate99thYear =
    LEV_PREDICTION_MARKETS.reduce(
      (acc, m) => acc + m.implied99thPercentileYear * m.weightInMarketAggregate,
      0
    ) / mktWeightSum;
  const marketAggregate80thYear =
    LEV_PREDICTION_MARKETS.reduce(
      (acc, m) => acc + m.implied80thPercentileYear * m.weightInMarketAggregate,
      0
    ) / mktWeightSum;
  const marketAggregate50thYear =
    LEV_PREDICTION_MARKETS.reduce(
      (acc, m) => acc + m.implied50thPercentileYear * m.weightInMarketAggregate,
      0
    ) / mktWeightSum;

  // 2. Expert Predictions weighted aggregate
  const expWeightSum = LEV_EXPERT_PREDICTIONS.reduce(
    (acc, e) => acc + e.weightInExpertAggregate,
    0
  );
  const expertAggregate99thYear =
    LEV_EXPERT_PREDICTIONS.reduce(
      (acc, e) => acc + e.pointEstimate99thYear * e.weightInExpertAggregate,
      0
    ) / expWeightSum;
  const expertAggregate80thYear =
    LEV_EXPERT_PREDICTIONS.reduce(
      (acc, e) => acc + e.implied80thYear * e.weightInExpertAggregate,
      0
    ) / expWeightSum;
  const expertAggregate50thYear =
    LEV_EXPERT_PREDICTIONS.reduce(
      (acc, e) => acc + e.implied50thYear * e.weightInExpertAggregate,
      0
    ) / expWeightSum;

  // 3. Find exact trajectory intercept years where Net Effective PoA <= 0.00
  const findInterceptYear = (cohortId: "p99" | "p80" | "p50"): number => {
    for (let y = 2026.0; y <= 2075.0; y += 0.05) {
      const intrinsic = computeIntrinsicPoAAtYear(y, cohortId, updateMode);
      const offset = computeBiotechRejuvenationOffsetAtYear(y, cohortId, updateMode, 0);
      if (intrinsic - offset <= 0) {
        return Math.round(y * 10) / 10;
      }
    }
    return 2060.0;
  };

  const trajectoryIntercept99thYear = findInterceptYear("p99");
  const trajectoryIntercept80thYear = findInterceptYear("p80");
  const trajectoryIntercept50thYear = findInterceptYear("p50");

  // 4. Combined Weighted Aggregate Dates
  const aggregate99thYear =
    Math.round(
      (marketAggregate99thYear * weights.marketsWeight +
        expertAggregate99thYear * weights.expertsWeight +
        trajectoryIntercept99thYear * weights.trajectoryWeight) *
        10
    ) / 10;

  const aggregate80thYear =
    Math.round(
      (marketAggregate80thYear * weights.marketsWeight +
        expertAggregate80thYear * weights.expertsWeight +
        trajectoryIntercept80thYear * weights.trajectoryWeight) *
        10
    ) / 10;

  const aggregate50thYear =
    Math.round(
      (marketAggregate50thYear * weights.marketsWeight +
        expertAggregate50thYear * weights.expertsWeight +
        trajectoryIntercept50thYear * weights.trajectoryWeight) *
        10
    ) / 10;

  // 5. Compute live Pace of Aging metrics as of `decimalYearNow`
  const buildCohortMetrics = (
    cohortId: "p99" | "p80" | "p50",
    interceptYr: number
  ): CohortLivePaceMetrics => {
    const profile = COHORT_PACE_PROFILES[cohortId];
    const intrinsic = computeIntrinsicPoAAtYear(decimalYearNow, cohortId, updateMode);
    const offset = computeBiotechRejuvenationOffsetAtYear(
      decimalYearNow,
      cohortId,
      updateMode,
      0
    );
    const netPoA = Math.max(0, Math.round((intrinsic - offset) * 1000) / 1000);
    const bioMonthsPerYear = Math.round(intrinsic * 12 * 10) / 10;
    const daysGainedPerYear = Math.round((1 - intrinsic) * 365.25);
    const yearsToLev = Math.max(0, Math.round((interceptYr - decimalYearNow) * 10) / 10);

    // Integrate biological years accumulated between now and LEV intercept
    const avgNetPoAUntilLev = netPoA * 0.52;
    const biologicalAgeAtLev =
      Math.round((currentChronologicalAge + yearsToLev * avgNetPoAUntilLev) * 10) / 10;

    return {
      cohortId,
      label: profile.label,
      shortLabel: profile.shortLabel,
      percentileRank: profile.percentileRank,
      intrinsicPaceOfAging: Math.round(intrinsic * 1000) / 1000,
      rawReferencePoA: profile.rawObservedReferencePoA,
      biotechRejuvenationOffset: Math.round(offset * 1000) / 1000,
      netEffectivePaceOfAging: netPoA,
      bioMonthsPerYear,
      daysGainedPerYear,
      annualConservativeDrift: profile.conservativeAnnualProtocolDrift,
      levInterceptYear: interceptYr,
      levInterceptFormatted: formatDecimalYear(interceptYr),
      yearsToLev,
      biologicalAgeAtLev,
    };
  };

  const cohorts = {
    p99: buildCohortMetrics("p99", aggregate99thYear),
    p80: buildCohortMetrics("p80", aggregate80thYear),
    p50: buildCohortMetrics("p50", aggregate50thYear),
  };

  // 6. Generate 2026 -> 2060 Trajectory Series (including Alive & Healthy curves + Cone of Uncertainty)
  const trajectorySeries: LevTrajectoryPoint[] = [];
  let p99BioAge = currentChronologicalAge * 0.92; // 99th percentile starts biologically younger
  let p80BioAge = currentChronologicalAge * 0.96;
  let p50BioAge = currentChronologicalAge * 1.0;

  for (let year = 2026; year <= 2060; year++) {
    const p99Intr = computeIntrinsicPoAAtYear(year, "p99", updateMode);
    const p80Intr = computeIntrinsicPoAAtYear(year, "p80", updateMode);
    const p50Intr = computeIntrinsicPoAAtYear(year, "p50", updateMode);

    const p99Off = computeBiotechRejuvenationOffsetAtYear(year, "p99", updateMode, 0);
    const p80Off = computeBiotechRejuvenationOffsetAtYear(year, "p80", updateMode, 0);
    const p50Off = computeBiotechRejuvenationOffsetAtYear(year, "p50", updateMode, 0);

    const p99Net = Math.round((p99Intr - p99Off) * 1000) / 1000;
    const p80Net = Math.round((p80Intr - p80Off) * 1000) / 1000;
    const p50Net = Math.round((p50Intr - p50Off) * 1000) / 1000;

    // Cone of Uncertainty (5th percentile fast breakthrough vs 95th percentile slow breakthrough)
    const p99FastOff = computeBiotechRejuvenationOffsetAtYear(year, "p99", updateMode, -4.8);
    const p99SlowOff = computeBiotechRejuvenationOffsetAtYear(year, "p99", updateMode, 5.5);
    const p80FastOff = computeBiotechRejuvenationOffsetAtYear(year, "p80", updateMode, -4.8);
    const p80SlowOff = computeBiotechRejuvenationOffsetAtYear(year, "p80", updateMode, 5.5);

    if (year > 2026) {
      p99BioAge = Math.max(24, p99BioAge + p99Net);
      p80BioAge = Math.max(26, p80BioAge + p80Net);
      p50BioAge = Math.max(28, p50BioAge + p50Net);
    }

    // Gompertz-Makeham Alive & Healthy probability function based on biological age
    const computeAliveHealthy = (bioAge: number, netRate: number): number => {
      const effectiveAge = Math.max(20, bioAge);
      // Morbidity/mortality hazard rises exponentially past biological age 62 unless reversed
      const ageExcess = Math.max(0, effectiveAge - 42);
      const gompertzDecay = Math.exp(-0.00042 * Math.pow(ageExcess, 2.15));
      // Compression of morbidity boost once netRate <= 0 (escape velocity)
      const levBoost = netRate <= 0 ? Math.min(0.06, Math.abs(netRate) * 0.12) : 0;
      const pct = Math.min(99.4, Math.max(12.0, (gompertzDecay + levBoost) * 100));
      return Math.round(pct * 10) / 10;
    };

    trajectorySeries.push({
      year,
      p99NetPoA: p99Net,
      p80NetPoA: p80Net,
      p50NetPoA: p50Net,
      p99IntrinsicPoA: Math.round(p99Intr * 1000) / 1000,
      p80IntrinsicPoA: Math.round(p80Intr * 1000) / 1000,
      p99ConeFast5th: Math.round((p99Intr - p99FastOff) * 1000) / 1000,
      p99ConeSlow95th: Math.round((p99Intr - p99SlowOff) * 1000) / 1000,
      p80ConeFast5th: Math.round((p80Intr - p80FastOff) * 1000) / 1000,
      p80ConeSlow95th: Math.round((p80Intr - p80SlowOff) * 1000) / 1000,
      p99AliveHealthyPct: computeAliveHealthy(p99BioAge, p99Net),
      p80AliveHealthyPct: computeAliveHealthy(p80BioAge, p80Net),
      p50AliveHealthyPct: computeAliveHealthy(p50BioAge, p50Net),
    });
  }

  // 7. Cone of Uncertainty percentiles for the 99th-Percentile Human LEV Date
  const p10Year = Math.round((aggregate99thYear - 6.3) * 10) / 10;
  const p25Year = Math.round((aggregate99thYear - 3.4) * 10) / 10;
  const p50Year = aggregate99thYear;
  const p75Year = Math.round((aggregate99thYear + 4.2) * 10) / 10;
  const p90Year = Math.round((aggregate99thYear + 8.6) * 10) / 10;
  const p99TailConfidenceYear = Math.round((aggregate99thYear + 21.4) * 10) / 10;

  return {
    asOfIso: now.toISOString(),
    asOfDateFormatted: now.toISOString().slice(0, 10),
    decimalYearNow: Math.round(decimalYearNow * 1000) / 1000,
    updateMode,
    currentChronologicalAge,
    weights,
    marketAggregate99thYear: Math.round(marketAggregate99thYear * 10) / 10,
    expertAggregate99thYear: Math.round(expertAggregate99thYear * 10) / 10,
    trajectoryIntercept99thYear,
    aggregate99thYear,
    aggregate99thFormatted: formatDecimalYear(aggregate99thYear),
    aggregate80thYear,
    aggregate80thFormatted: formatDecimalYear(aggregate80thYear),
    aggregate50thYear,
    aggregate50thFormatted: formatDecimalYear(aggregate50thYear),
    cone99th: {
      p10Year,
      p10Formatted: formatDecimalYear(p10Year, true),
      p25Year,
      p25Formatted: formatDecimalYear(p25Year, true),
      p50Year,
      p50Formatted: formatDecimalYear(p50Year, true),
      p75Year,
      p75Formatted: formatDecimalYear(p75Year, true),
      p90Year,
      p90Formatted: formatDecimalYear(p90Year, true),
      p99TailConfidenceYear,
      p99TailConfidenceFormatted: formatDecimalYear(p99TailConfidenceYear, true),
    },
    cohorts,
    trajectorySeries,
    levlReference: LEVL_TRAJECTORY_REFERENCE,
  };
}
