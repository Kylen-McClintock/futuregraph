import {
  GovernanceObjectiveId,
  PolicyIntervention,
} from "@/types/futuregraph";

export interface EvaluatedPolicyResult {
  intervention: PolicyIntervention;
  /** Effective objective scores on [0, 100] under current belief/uncertainty parameters (independent of user value weights!) */
  objectiveScores: Record<GovernanceObjectiveId, number>;
  /** Weighted utility alignment score [0, 100] for the user's normative value sliders */
  userWeightedScore: number;
  /** Weighted utility alignment score [0, 100] for the opt-in participant aggregate */
  communityWeightedScore: number;
  /** True if no other policy is >= on all active objectives and strictly > on at least one */
  isParetoOptimal: boolean;
  /** IDs of policies that strictly dominate this policy on the active objectives */
  dominatedByIds: string[];
  /** Human-readable explanation of Pareto status and key tradeoffs */
  paretoExplanation: string;
}

export interface ParetoAnalysisOutput {
  evaluatedPolicies: EvaluatedPolicyResult[];
  paretoSetIds: string[];
  dominatedIds: string[];
  /** True if switching between pointEstimate, uncertaintyLow, and uncertaintyHigh changes which policies are Pareto-optimal */
  dominanceReversesUnderUncertainty: boolean;
  uncertaintyReversalNote: string;
}

/**
 * Computes effective objective outcome estimates for each intervention under a given
 * uncertainty mode and P(Adversarial Misalignment) belief, WITHOUT ever allowing
 * normative value weights to alter the predicted outcome probabilities/scores.
 */
export function computePolicyObjectiveScores(
  intervention: PolicyIntervention,
  uncertaintyMode: "point" | "pessimistic" | "optimistic" = "point",
  misalignmentProbDelta = 0 // delta from baseline 0.55
): Record<GovernanceObjectiveId, number> {
  const scores = {} as Record<GovernanceObjectiveId, number>;
  const keys = Object.keys(intervention.outcomeEstimates) as GovernanceObjectiveId[];

  for (const objId of keys) {
    const est = intervention.outcomeEstimates[objId];
    let base = est.pointEstimate;
    if (uncertaintyMode === "pessimistic") base = est.uncertaintyLow;
    if (uncertaintyMode === "optimistic") base = est.uncertaintyHigh;

    const adjusted = Math.max(
      0,
      Math.min(100, Number((base + misalignmentProbDelta * est.misalignmentSensitivity).toFixed(1)))
    );
    scores[objId] = adjusted;
  }

  return scores;
}

/**
 * Determines whether policy A strictly Pareto-dominates policy B across the selected active objectives.
 * A dominates B iff for all o in activeObjectives, score(A, o) >= score(B, o),
 * and there exists at least one o where score(A, o) > score(B, o).
 */
export function doesPolicyDominate(
  scoresA: Record<GovernanceObjectiveId, number>,
  scoresB: Record<GovernanceObjectiveId, number>,
  activeObjectives: GovernanceObjectiveId[]
): boolean {
  if (activeObjectives.length === 0) return false;
  let allGreaterOrEqual = true;
  let atLeastOneStrictlyGreater = false;

  for (const obj of activeObjectives) {
    const a = scoresA[obj] ?? 0;
    const b = scoresB[obj] ?? 0;
    if (a < b) {
      allGreaterOrEqual = false;
      break;
    }
    if (a > b) {
      atLeastOneStrictlyGreater = true;
    }
  }

  return allGreaterOrEqual && atLeastOneStrictlyGreater;
}

/**
 * Computes normalized weighted utility score from user value weights and policy objective scores.
 */
export function computeWeightedUtility(
  objectiveScores: Record<GovernanceObjectiveId, number>,
  valueWeights: Record<GovernanceObjectiveId, number>,
  activeObjectives: GovernanceObjectiveId[]
): number {
  let weightSum = 0;
  let weightedTotal = 0;

  for (const obj of activeObjectives) {
    const w = Math.max(0, valueWeights[obj] ?? 0);
    const s = objectiveScores[obj] ?? 0;
    weightSum += w;
    weightedTotal += w * s;
  }

  if (weightSum === 0) return 0;
  return Number((weightedTotal / weightSum).toFixed(1));
}

/**
 * Runs complete FairMarkets Pareto-frontier and multidimensional non-dominance analysis.
 */
export function evaluateFairMarketsPolicies(params: {
  interventions: PolicyIntervention[];
  activeObjectives: GovernanceObjectiveId[];
  userWeights: Record<GovernanceObjectiveId, number>;
  communityWeights: Record<GovernanceObjectiveId, number>;
  uncertaintyMode?: "point" | "pessimistic" | "optimistic";
  misalignmentProbDelta?: number;
}): ParetoAnalysisOutput {
  const mode = params.uncertaintyMode || "point";
  const delta = params.misalignmentProbDelta || 0;

  const runForMode = (m: "point" | "pessimistic" | "optimistic") => {
    const scoreMap = new Map<string, Record<GovernanceObjectiveId, number>>();
    for (const p of params.interventions) {
      scoreMap.set(p.id, computePolicyObjectiveScores(p, m, delta));
    }

    const dominatedByMap = new Map<string, string[]>();
    for (const p of params.interventions) {
      const domBy: string[] = [];
      const sP = scoreMap.get(p.id)!;
      for (const other of params.interventions) {
        if (other.id === p.id) continue;
        const sOther = scoreMap.get(other.id)!;
        if (doesPolicyDominate(sOther, sP, params.activeObjectives)) {
          domBy.push(other.id);
        }
      }
      dominatedByMap.set(p.id, domBy);
    }

    return { scoreMap, dominatedByMap };
  };

  const currentPass = runForMode(mode);
  const pointPass = runForMode("point");
  const pessPass = runForMode("pessimistic");
  const optPass = runForMode("optimistic");

  const getParetoSet = (domMap: Map<string, string[]>) =>
    params.interventions
      .filter((p) => (domMap.get(p.id) || []).length === 0)
      .map((p) => p.id)
      .sort()
      .join(",");

  const paretoPoint = getParetoSet(pointPass.dominatedByMap);
  const paretoPess = getParetoSet(pessPass.dominatedByMap);
  const paretoOpt = getParetoSet(optPass.dominatedByMap);
  const dominanceReversesUnderUncertainty =
    paretoPoint !== paretoPess || paretoPoint !== paretoOpt;

  const evaluatedPolicies: EvaluatedPolicyResult[] = params.interventions.map((p) => {
    const objectiveScores = currentPass.scoreMap.get(p.id)!;
    const dominatedByIds = currentPass.dominatedByMap.get(p.id) || [];
    const isParetoOptimal = dominatedByIds.length === 0;

    let paretoExplanation = "";
    if (isParetoOptimal) {
      paretoExplanation = `Non-dominated (Pareto-efficient) across the ${params.activeObjectives.length} active objectives: no alternative policy improves one objective without trading off another.`;
    } else {
      const domNames = dominatedByIds
        .map((id) => params.interventions.find((x) => x.id === id)?.shortLabel || id)
        .join(", ");
      paretoExplanation = `Strictly dominated on the selected objectives by: ${domNames} (which scores at least as high on all active objectives and strictly higher on at least one).`;
    }

    return {
      intervention: p,
      objectiveScores,
      userWeightedScore: computeWeightedUtility(
        objectiveScores,
        params.userWeights,
        params.activeObjectives
      ),
      communityWeightedScore: computeWeightedUtility(
        objectiveScores,
        params.communityWeights,
        params.activeObjectives
      ),
      isParetoOptimal,
      dominatedByIds,
      paretoExplanation,
    };
  });

  return {
    evaluatedPolicies,
    paretoSetIds: evaluatedPolicies.filter((e) => e.isParetoOptimal).map((e) => e.intervention.id),
    dominatedIds: evaluatedPolicies.filter((e) => !e.isParetoOptimal).map((e) => e.intervention.id),
    dominanceReversesUnderUncertainty,
    uncertaintyReversalNote: dominanceReversesUnderUncertainty
      ? "Sensitivity alert: The set of Pareto-dominant policies shifts between pessimistic and optimistic model bounds on the currently selected objectives."
      : "Pareto frontier membership remains stable across point, pessimistic, and optimistic uncertainty bounds for the selected objectives.",
  };
}
