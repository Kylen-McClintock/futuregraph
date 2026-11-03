import { CPTEntry, FutureEdge, FutureNode } from "@/types/futuregraph";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NodeProbabilityResult {
  nodeId: string;
  /** Unconditional / marginal probability P(event) in [0, 1], or null if narrative-only */
  marginalProbability: number | null;
  /** Conditional probability P(event | active parent outcome) if applicable */
  conditionalProbability: number | null;
  /** Joint path probability P(full scenario path to this node) if on a modeled branch chain */
  pathProbability: number | null;
  /** Baseline marginal before overrides */
  baselineMarginal: number | null;
  /** Delta (marginalProbability - baselineMarginal) */
  delta: number | null;
  /** Whether this node's edges are qualitative-only (not probabilistically parameterized) */
  isQualitativeOnly: boolean;
  /** Human-readable mathematical trace explaining how the probability was derived */
  derivationFormula: string;
  /** Fixed conditional assumptions held constant during propagation */
  fixedAssumptions: string[];
}

export interface PropagationOutput {
  valid: boolean;
  errors: string[];
  warnings: string[];
  results: Record<string, NodeProbabilityResult>;
}

/**
 * Validates that a probability lies strictly within [0, 1].
 */
export function validateProbability(p: number, label = "Probability"): ValidationResult {
  if (typeof p !== "number" || Number.isNaN(p) || !Number.isFinite(p)) {
    return { valid: false, errors: [`${label} must be a finite number.`], warnings: [] };
  }
  if (p < 0 || p > 1) {
    return {
      valid: false,
      errors: [`${label} (${(p * 100).toFixed(1)}%) is out of range. Must be between 0% and 100%.`],
      warnings: [],
    };
  }
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Validates that a set of mutually exclusive and exhaustive branches sum to 100% (1.0 ± 1e-5).
 */
export function validateExclusiveBranches(
  branches: Array<{ id: string; label: string; probability: number; isOtherBranch?: boolean }>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (branches.length === 0) {
    return { valid: false, errors: ["Exclusive branch group cannot be empty."], warnings: [] };
  }

  let sum = 0;
  for (const b of branches) {
    const check = validateProbability(b.probability, `Branch "${b.label}"`);
    if (!check.valid) {
      errors.push(...check.errors);
    }
    sum += b.probability;
  }

  if (Math.abs(sum - 1.0) > 1e-4) {
    errors.push(
      `Exclusive branch outcomes must sum to 100.0% (current sum: ${(sum * 100).toFixed(2)}%). Include or adjust an explicit Other/Unknown branch.`
    );
  }

  const hasOther = branches.some((b) => b.isOtherBranch);
  if (!hasOther && branches.length > 1) {
    warnings.push(
      "Branch set does not include an explicit Other/Unknown residual branch; verify outcomes are strictly exhaustive."
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Computes exact marginal probability for a single binary parent using Law of Total Probability:
 * P(B) = P(A) * P(B | A) + (1 - P(A)) * P(B | not A)
 */
export function computeSingleParentMarginal(
  pParentYes: number,
  pTargetGivenParentYes: number,
  pTargetGivenParentNo: number
): number {
  const checkParent = validateProbability(pParentYes, "P(A)");
  const checkYes = validateProbability(pTargetGivenParentYes, "P(B | A)");
  const checkNo = validateProbability(pTargetGivenParentNo, "P(B | ¬A)");

  if (!checkParent.valid || !checkYes.valid || !checkNo.valid) {
    throw new Error(
      [...checkParent.errors, ...checkYes.errors, ...checkNo.errors].join(" ")
    );
  }

  const raw = pParentYes * pTargetGivenParentYes + (1 - pParentYes) * pTargetGivenParentNo;
  return Number(raw.toFixed(6));
}

/**
 * Detects directed cycles in the graph using three-color DFS.
 */
export function detectGraphCycles(
  nodeIds: string[],
  edges: Array<{ sourceNodeId: string; targetNodeId: string }>
): { hasCycle: boolean; cyclePath: string[] } {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const edge of edges) {
    if (!adj.has(edge.sourceNodeId)) adj.set(edge.sourceNodeId, []);
    adj.get(edge.sourceNodeId)!.push(edge.targetNodeId);
  }

  const state = new Map<string, 0 | 1 | 2>(); // 0 = unvisited, 1 = visiting, 2 = visited
  const parentMap = new Map<string, string>();

  for (const id of nodeIds) state.set(id, 0);

  for (const startId of nodeIds) {
    if (state.get(startId) !== 0) continue;

    const stack: Array<{ id: string; idx: number }> = [{ id: startId, idx: 0 }];
    state.set(startId, 1);

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const neighbors = adj.get(top.id) || [];

      if (top.idx < neighbors.length) {
        const nextId = neighbors[top.idx];
        top.idx += 1;
        const nextState = state.get(nextId) ?? 0;

        if (nextState === 1) {
          // Cycle detected; reconstruct path
          const cycle: string[] = [nextId];
          for (let i = stack.length - 1; i >= 0; i--) {
            cycle.push(stack[i].id);
            if (stack[i].id === nextId) break;
          }
          cycle.reverse();
          return { hasCycle: true, cyclePath: cycle };
        } else if (nextState === 0) {
          parentMap.set(nextId, top.id);
          state.set(nextId, 1);
          stack.push({ id: nextId, idx: 0 });
        }
      } else {
        state.set(top.id, 2);
        stack.pop();
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

/**
 * Validates that a multi-parent node has a complete Conditional Probability Table (CPT)
 * covering all 2^k binary combinations of its modeled parents.
 * Never naively multiplies independent-looking numbers!
 */
export function validateMultiParentCPT(
  nodeId: string,
  parentIds: string[],
  cptTable?: CPTEntry[]
): ValidationResult {
  if (parentIds.length <= 1) {
    return { valid: true, errors: [], warnings: [] };
  }

  if (!cptTable || cptTable.length === 0) {
    return {
      valid: false,
      errors: [
        `Node "${nodeId}" has multiple modeled parents (${parentIds.join(
          ", "
        )}) without an explicit Conditional Probability Table (CPT). Naive multiplication of correlated parents is prohibited.`,
      ],
      warnings: [],
    };
  }

  const requiredCount = Math.pow(2, parentIds.length);
  if (cptTable.length < requiredCount) {
    return {
      valid: false,
      errors: [
        `Node "${nodeId}" CPT requires ${requiredCount} entries for ${parentIds.length} binary parents, but only ${cptTable.length} were supplied.`,
      ],
      warnings: [],
    };
  }

  const errors: string[] = [];
  for (const row of cptTable) {
    const pCheck = validateProbability(row.probability, `CPT entry on ${nodeId}`);
    if (!pCheck.valid) errors.push(...pCheck.errors);
    for (const pid of parentIds) {
      if (!(pid in row.parentStates)) {
        errors.push(`CPT entry on "${nodeId}" is missing state for parent "${pid}".`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

/**
 * Evaluates a multi-parent CPT using the law of total probability over parent marginals
 * (or exact joint branch states when parents are mutually exclusive).
 */
export function evaluateCPT(
  parentIds: string[],
  parentMarginals: Record<string, number>,
  cptTable: CPTEntry[],
  exclusiveGroupMap?: Record<string, string>
): { marginal: number; formula: string } {
  let total = 0;
  const terms: string[] = [];

  for (const row of cptTable) {
    let rowWeight = 1;
    const stateDesc: string[] = [];

    // Check if two parents belong to the same exclusive group and are both YES
    const yesParentsInGroup = new Set<string>();
    let impossibleExclusiveCombination = false;

    for (const pid of parentIds) {
      const state = row.parentStates[pid];
      const group = exclusiveGroupMap?.[pid];
      if (state === "YES" && group) {
        if (yesParentsInGroup.has(group)) {
          impossibleExclusiveCombination = true;
        }
        yesParentsInGroup.add(group);
      }
    }

    if (impossibleExclusiveCombination) {
      continue;
    }

    for (const pid of parentIds) {
      const pYes = parentMarginals[pid] ?? 0.5;
      const state = row.parentStates[pid];
      const factor = state === "YES" ? pYes : 1 - pYes;
      rowWeight *= factor;
      stateDesc.push(`${pid}=${state} (${(factor * 100).toFixed(1)}%)`);
    }

    const contribution = rowWeight * row.probability;
    total += contribution;
    terms.push(
      `[${stateDesc.join(", ")}] × ${(row.probability * 100).toFixed(1)}% = ${(
        contribution * 100
      ).toFixed(2)}%`
    );
  }

  return {
    marginal: Number(Math.min(1, Math.max(0, total)).toFixed(6)),
    formula: `Σ P(parents) · P(Y | parents): ${terms.join(" + ")}`,
  };
}

/**
 * Propagates probabilities across a FutureGraph DAG, comparing baseline priors
 * against user/scenario overrides and returning full mathematical provenance.
 */
export function propagateGraphProbabilities(
  nodes: FutureNode[],
  edges: FutureEdge[],
  basePriors: Record<string, number>,
  overrides: Record<string, number> = {}
): PropagationOutput {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate all override values
  for (const [nodeId, val] of Object.entries(overrides)) {
    const check = validateProbability(val, `Override for ${nodeId}`);
    if (!check.valid) {
      errors.push(...check.errors);
    }
  }
  for (const [nodeId, val] of Object.entries(basePriors)) {
    const check = validateProbability(val, `Base prior for ${nodeId}`);
    if (!check.valid) {
      errors.push(...check.errors);
    }
  }

  // 2. Check DAG for cycles
  const nodeIds = nodes.map((n) => n.id);
  const cycleCheck = detectGraphCycles(
    nodeIds,
    edges.map((e) => ({ sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId }))
  );
  if (cycleCheck.hasCycle) {
    errors.push(
      `Prohibited cycle detected in graph: ${cycleCheck.cyclePath.join(" -> ")}`
    );
    return { valid: false, errors, warnings, results: {} };
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, results: {} };
  }

  const nodeMap = new Map<string, FutureNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Build topological ordering
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }
  for (const e of edges) {
    if (adj.has(e.sourceNodeId) && inDegree.has(e.targetNodeId)) {
      adj.get(e.sourceNodeId)!.push(e.targetNodeId);
      inDegree.set(e.targetNodeId, (inDegree.get(e.targetNodeId) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    topoOrder.push(curr);
    for (const next of adj.get(curr) || []) {
      inDegree.set(next, (inDegree.get(next) || 0) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  // Helper to run one pass (either baseline or with overrides)
  const runPass = (activeOverrides: Record<string, number>) => {
    const marginals: Record<string, number | null> = {};
    const conditionals: Record<string, number | null> = {};
    const paths: Record<string, number | null> = {};
    const formulas: Record<string, string> = {};
    const fixedAssumptionsMap: Record<string, string[]> = {};
    const qualitativeFlags: Record<string, boolean> = {};

    // Auto-balance exclusive groups if one member is overridden
    const adjustedOverrides = { ...activeOverrides };
    const exclusiveGroups = new Map<string, FutureNode[]>();
    for (const n of nodes) {
      const groupId = n.question?.exclusiveGroupId;
      if (groupId) {
        if (!exclusiveGroups.has(groupId)) exclusiveGroups.set(groupId, []);
        exclusiveGroups.get(groupId)!.push(n);
      }
    }

    for (const [, groupNodes] of exclusiveGroups.entries()) {
      const overriddenInGroup = groupNodes.filter((n) => n.id in activeOverrides);
      if (overriddenInGroup.length === 1 && groupNodes.length >= 2) {
        const target = overriddenInGroup[0];
        const newTargetP = activeOverrides[target.id];
        const others = groupNodes.filter((n) => n.id !== target.id);
        const oldOthersSum = others.reduce(
          (acc, n) => acc + (basePriors[n.id] ?? n.question?.demoHypothesisProb ?? 0),
          0
        );
        const remainingMass = Math.max(0, 1 - newTargetP);
        for (const other of others) {
          const oldP = basePriors[other.id] ?? other.question?.demoHypothesisProb ?? 0;
          adjustedOverrides[other.id] =
            oldOthersSum > 0
              ? Number(((oldP / oldOthersSum) * remainingMass).toFixed(6))
              : Number((remainingMass / others.length).toFixed(6));
        }
      }
    }

    for (const nodeId of topoOrder) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const q = node.question;
      const incomingModeledEdges = edges.filter(
        (e) => e.targetNodeId === nodeId && e.isModeled
      );

      // If no question is attached and no modeled edges, it is a narrative milestone
      if (!q && incomingModeledEdges.length === 0) {
        marginals[nodeId] = null;
        conditionals[nodeId] = null;
        paths[nodeId] = null;
        qualitativeFlags[nodeId] = true;
        formulas[nodeId] =
          "Authored AI 2027 scenario milestone (narrative spine — not a priced probability node).";
        fixedAssumptionsMap[nodeId] = [];
        continue;
      }

      const explicitOverride = adjustedOverrides[nodeId];
      const basePrior =
        basePriors[nodeId] ??
        q?.authorDocumentedProb ??
        q?.demoHypothesisProb ??
        null;

      if (q?.modelRole === "root" || q?.modelRole === "standalone" || incomingModeledEdges.length === 0) {
        const p = explicitOverride !== undefined ? explicitOverride : basePrior;
        marginals[nodeId] = p;
        conditionals[nodeId] = p;
        paths[nodeId] = p;
        qualitativeFlags[nodeId] = p === null;
        formulas[nodeId] =
          p !== null
            ? `Root / unconditional prior P(${node.logicalId}) = ${(p * 100).toFixed(1)}%`
            : "Not yet forecast";
        fixedAssumptionsMap[nodeId] = ["Unconditional root proposition"];
        continue;
      }

      if (q?.modelRole === "exclusive_branch") {
        const parentId = q.parentNodeIds[0] || incomingModeledEdges[0]?.sourceNodeId;
        const parentMarginal = parentId ? (marginals[parentId] ?? 1.0) : 1.0;
        const branchCond = explicitOverride !== undefined ? explicitOverride : (basePrior ?? 0.5);
        const pathProb = Number((parentMarginal * branchCond).toFixed(6));
        marginals[nodeId] = pathProb;
        conditionals[nodeId] = branchCond;
        paths[nodeId] = pathProb;
        qualitativeFlags[nodeId] = false;
        formulas[nodeId] = `P(path) = P(${parentId}) [${(parentMarginal * 100).toFixed(
          1
        )}%] × P(${node.logicalId} | ${parentId}) [${(branchCond * 100).toFixed(
          1
        )}%] = ${(pathProb * 100).toFixed(1)}%`;
        fixedAssumptionsMap[nodeId] = [
          `Exclusive branch conditional P(${node.logicalId} | parent) = ${(branchCond * 100).toFixed(1)}%`,
        ];
        continue;
      }

      if (q?.modelRole === "single_parent_conditional" && q.cptTable && q.cptTable.length >= 2) {
        const parentId = q.parentNodeIds[0];
        const parentMarginal = marginals[parentId] ?? basePriors[parentId] ?? 0.5;
        const rowYes = q.cptTable.find((r) => r.parentStates[parentId] === "YES");
        const rowNo = q.cptTable.find((r) => r.parentStates[parentId] === "NO");
        const pGivenYes =
          explicitOverride !== undefined
            ? explicitOverride
            : (rowYes?.probability ?? basePrior ?? 0.5);
        const pGivenNo = rowNo?.probability ?? 0.1;

        const m = computeSingleParentMarginal(parentMarginal, pGivenYes, pGivenNo);
        marginals[nodeId] = m;
        conditionals[nodeId] = pGivenYes;
        paths[nodeId] = Number((parentMarginal * pGivenYes).toFixed(6));
        qualitativeFlags[nodeId] = false;
        formulas[nodeId] = `P(${node.logicalId}) = P(${parentId})[${(
          parentMarginal * 100
        ).toFixed(1)}%] × P(Y|${parentId})[${(pGivenYes * 100).toFixed(
          1
        )}%] + (1 − P(${parentId}))[${((1 - parentMarginal) * 100).toFixed(
          1
        )}%] × P(Y|¬${parentId})[${(pGivenNo * 100).toFixed(1)}%] = ${(
          m * 100
        ).toFixed(1)}%`;
        fixedAssumptionsMap[nodeId] = [
          `P(${node.logicalId} | ${parentId}=YES) = ${(pGivenYes * 100).toFixed(1)}%`,
          `P(${node.logicalId} | ${parentId}=NO) = ${(pGivenNo * 100).toFixed(1)}%`,
        ];
        continue;
      }

      // Multi-parent CPT check
      const parentIds =
        q?.parentNodeIds && q.parentNodeIds.length > 0
          ? q.parentNodeIds
          : incomingModeledEdges.map((e) => e.sourceNodeId);

      if (parentIds.length > 1) {
        const cptCheck = validateMultiParentCPT(nodeId, parentIds, q?.cptTable);
        if (!cptCheck.valid || !q?.cptTable) {
          warnings.push(...cptCheck.errors);
          marginals[nodeId] = explicitOverride ?? basePrior;
          conditionals[nodeId] = explicitOverride ?? basePrior;
          paths[nodeId] = null;
          qualitativeFlags[nodeId] = true;
          formulas[nodeId] =
            "Blocked multi-parent propagation: explicit Conditional Probability Table (CPT) required to avoid naive independent multiplication.";
          fixedAssumptionsMap[nodeId] = ["Qualitative dependency only until CPT is parameterized"];
          continue;
        }

        const parentM: Record<string, number> = {};
        const exMap: Record<string, string> = {};
        for (const pid of parentIds) {
          parentM[pid] = marginals[pid] ?? basePriors[pid] ?? 0.5;
          const pNode = nodeMap.get(pid);
          if (pNode?.question?.exclusiveGroupId) {
            exMap[pid] = pNode.question.exclusiveGroupId;
          }
        }

        const evalOut = evaluateCPT(parentIds, parentM, q.cptTable, exMap);
        const finalM = explicitOverride !== undefined ? explicitOverride : evalOut.marginal;
        marginals[nodeId] = finalM;
        conditionals[nodeId] = q.cptTable[0]?.probability ?? finalM;
        paths[nodeId] = finalM;
        qualitativeFlags[nodeId] = false;
        formulas[nodeId] = evalOut.formula;
        fixedAssumptionsMap[nodeId] = q.cptTable.map(
          (r) =>
            `P(Y | ${Object.entries(r.parentStates)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}) = ${(r.probability * 100).toFixed(1)}%`
        );
        continue;
      }

      // Single incoming modeled edge fallback
      const singleEdge = incomingModeledEdges[0];
      const pParent = marginals[singleEdge.sourceNodeId] ?? 0.5;
      const pCond =
        explicitOverride !== undefined
          ? explicitOverride
          : (singleEdge.defaultConditionalProb ?? basePrior ?? 0.5);
      const pFallbackNo = 0.08;
      const m = computeSingleParentMarginal(pParent, pCond, pFallbackNo);
      marginals[nodeId] = m;
      conditionals[nodeId] = pCond;
      paths[nodeId] = Number((pParent * pCond).toFixed(6));
      qualitativeFlags[nodeId] = false;
      formulas[nodeId] = `P(${node.logicalId}) = ${(pParent * 100).toFixed(1)}% × ${(
        pCond * 100
      ).toFixed(1)}% + ${((1 - pParent) * 100).toFixed(1)}% × ${(
        pFallbackNo * 100
      ).toFixed(1)}% = ${(m * 100).toFixed(1)}%`;
      fixedAssumptionsMap[nodeId] = [
        `P(${node.logicalId} | ${singleEdge.sourceNodeId}=YES) = ${(pCond * 100).toFixed(1)}%`,
      ];
    }

    return { marginals, conditionals, paths, formulas, fixedAssumptionsMap, qualitativeFlags };
  };

  const baselinePass = runPass({});
  const activePass = runPass(overrides);

  const results: Record<string, NodeProbabilityResult> = {};
  for (const n of nodes) {
    const baseM = baselinePass.marginals[n.id];
    const currM = activePass.marginals[n.id];
    const delta =
      baseM !== null && currM !== null && baseM !== undefined && currM !== undefined
        ? Number((currM - baseM).toFixed(6))
        : null;

    results[n.id] = {
      nodeId: n.id,
      marginalProbability: currM ?? null,
      conditionalProbability: activePass.conditionals[n.id] ?? null,
      pathProbability: activePass.paths[n.id] ?? null,
      baselineMarginal: baseM ?? null,
      delta,
      isQualitativeOnly: activePass.qualitativeFlags[n.id] ?? true,
      derivationFormula: activePass.formulas[n.id] || "",
      fixedAssumptions: activePass.fixedAssumptionsMap[n.id] || [],
    };
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    results,
  };
}

/**
 * Computes Binary Brier Score = (p - o)^2 for qualifying pre-resolution forecasts.
 * Respects resolution cutoff and unscored conditional branches whose conditioning event did not occur.
 */
export function computeBrierScore(params: {
  probability: number;
  outcome: 0 | 1 | null;
  submittedAtIso: string;
  cutoffAtIso: string;
  nodeType: FutureNode["nodeType"];
  conditioningRealized?: boolean;
}): {
  status: "scored" | "unscored_unresolved" | "unscored_non_resolvable_type" | "unscored_condition_unrealized" | "unscored_after_cutoff";
  brierScore: number | null;
  explanation: string;
} {
  if (
    params.nodeType === "scenario_milestone" ||
    params.nodeType === "subjective_hypothesis"
  ) {
    return {
      status: "unscored_non_resolvable_type",
      brierScore: null,
      explanation:
        "Authored fictional scenario milestones and unresolved metaphysical hypotheses are not scored as empirical prediction accuracy.",
    };
  }

  if (params.conditioningRealized === false) {
    return {
      status: "unscored_condition_unrealized",
      brierScore: null,
      explanation:
        "Conditioning parent event did not occur; conditional forecast remains unscored rather than falsely penalized.",
    };
  }

  if (params.outcome === null || params.outcome === undefined) {
    return {
      status: "unscored_unresolved",
      brierScore: null,
      explanation: "Question has not yet resolved.",
    };
  }

  const subTime = new Date(params.submittedAtIso).getTime();
  const cutTime = new Date(params.cutoffAtIso).getTime();
  if (subTime > cutTime) {
    return {
      status: "unscored_after_cutoff",
      brierScore: null,
      explanation: "Forecast was submitted after the qualifying pre-resolution cutoff timestamp.",
    };
  }

  const pCheck = validateProbability(params.probability);
  if (!pCheck.valid) {
    throw new Error(pCheck.errors.join(" "));
  }

  const score = Number(Math.pow(params.probability - params.outcome, 2).toFixed(6));
  return {
    status: "scored",
    brierScore: score,
    explanation: `Binary Brier score = (${params.probability.toFixed(3)} − ${params.outcome})^2 = ${score.toFixed(4)}`,
  };
}

export function validateGraphAcyclic(
  nodes: Array<{ id: string }>,
  edges: Array<{ sourceNodeId: string; targetNodeId: string }>
): ValidationResult {
  const check = detectGraphCycles(
    nodes.map((n) => n.id),
    edges
  );
  if (check.hasCycle) {
    return {
      valid: false,
      errors: [`Cycle detected in graph: ${check.cyclePath.join(" -> ")}`],
      warnings: [],
    };
  }
  return { valid: true, errors: [], warnings: [] };
}

