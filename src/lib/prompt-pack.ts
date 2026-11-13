import {
  evaluateGraphDistribution,
  getRegisteredGraph,
  getRegisteredGraphs,
  getSubtreeForks,
} from "@/lib/graph-registry";
import {
  ConditionalForkGroupSpec,
  ForecasterActor,
  ForkRationaleEntry,
  GraphForecastRun,
  LevActorForecast,
  RegisteredGraphId,
  RegisteredGraphSpec,
  WorldviewCard,
} from "@/types/forecaster";

export type PromptPackScope = "branch" | "graph" | "all_site";
export type PromptPackOutputMode = "standard" | "quick_pct";

export interface GeneratePromptPackParams {
  graphId: RegisteredGraphId;
  scope: PromptPackScope;
  branchNodeId?: string | null;
  outputMode?: PromptPackOutputMode;
  actorHandle?: string;
  actorDisplayName?: string;
  actorType?: ForecasterActor["actorType"];
  worldview?: Partial<WorldviewCard>;
  baseOrigin?: string;
}

export interface GeneratedPromptPack {
  scope: PromptPackScope;
  outputMode: PromptPackOutputMode;
  targetGraphIds: RegisteredGraphId[];
  forkCount: number;
  optionCount: number;
  promptText: string;
  curlExampleCommand: string;
  jsonSchemaTemplate: Record<string, unknown>;
}

function formatGraphForksMarkdown(
  spec: RegisteredGraphSpec,
  forks: ConditionalForkGroupSpec[]
): string {
  if (spec.topologyKind === "trajectory_quantiles" || spec.graphId === "lev") {
    return [
      `### Graph: ${spec.title} (\`graphId: "${spec.graphId}"\`)`,
      `- Domain: ${spec.domainBadge}`,
      `- Task: Estimate when annual biotech rejuvenation + personal protocol deceleration offsets biological aging (Net Pace of Aging <= 0.00 bio-yr/yr):`,
      `  - \`p99Year\`: 99th-percentile human (Top 1% biomarker protocol optimizer, LEVL baseline ~2037.5)`,
      `  - \`p99Low\` / \`p99High\`: 25th / 75th percentile uncertainty bounds around \`p99Year\``,
      `  - \`p80Year\`: 80th-percentile proactive health cohort (LEVL baseline ~2042.5)`,
      `  - \`p50Year\`: 50th-percentile status-quo population (LEVL baseline ~2052.1)`,
      `  - \`intrinsicPoAP99\`: 2026 intrinsic Pace of Aging for 99th percentile in bio-yr/yr (e.g. 0.67)`,
      `  - \`velocityMultiplier\`: Biotech rejuvenation S-curve multiplier relative to baseline (1.0 = baseline, 1.25 = faster, 0.72 = slower)`,
      `  - \`mechanismSummary\`: 1-2 sentence causal rationale`,
    ].join("\n");
  }

  const lines: string[] = [
    `### Graph: ${spec.title} (\`graphId: "${spec.graphId}"\`)`,
    `- Topology: \`${spec.topologyKind}\` • Baseline Reference: ${spec.defaultBaselineLabel}`,
    `- Rule: Within EVERY fork group below, your outgoing probabilities MUST be decimals in [0, 1] that **sum to 1.00** (100%).`,
    "",
  ];

  for (const fork of forks) {
    lines.push(
      `#### Fork \`${fork.forkId}\` — ${fork.forkTitle}${
        fork.isRootPartition ? " [ROOT PRIORS -> put in `rootPriors`]" : ""
      }`
    );
    lines.push(`${fork.forkQuestion}`);
    for (const opt of fork.options) {
      lines.push(
        `  - \`"${opt.splitKey}"\`: ${opt.label}${
          opt.dateOrEpochTag ? ` (${opt.dateOrEpochTag})` : ""
        } — [Reference prior: ${(opt.defaultConditionalProb * 100).toFixed(1)}%]`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildSingleGraphTemplate(
  spec: RegisteredGraphSpec,
  forks: ConditionalForkGroupSpec[],
  outputMode: PromptPackOutputMode
): Record<string, unknown> {
  if (spec.graphId === "lev" || spec.topologyKind === "trajectory_quantiles") {
    return {
      graphId: spec.graphId,
      headlineSummary: "1-sentence summary of your LEV forecast and core mechanism",
      levForecast: {
        p99Year: 2037.5,
        p99Low: 2034.5,
        p99High: 2041.0,
        p80Year: 2042.5,
        p50Year: 2052.1,
        intrinsicPoAP99: 0.668,
        velocityMultiplier: 1.0,
        mechanismSummary: "Explain why rejuvenation + protocol optimization crosses Net PoA <= 0 at these dates.",
        keyAssumption: "Load-bearing clinical or AI-bio assumption",
      },
    };
  }

  const rootPriors: Record<string, number> = {};
  const conditionalSplits: Record<string, number> = {};
  const forkRationales: Record<string, { rationale: string; keyAssumption?: string }> = {};

  for (const fork of forks) {
    for (const opt of fork.options) {
      if (fork.isRootPartition) {
        rootPriors[opt.splitKey] = Number(opt.defaultConditionalProb.toFixed(4));
      } else {
        conditionalSplits[opt.splitKey] = Number(
          opt.defaultConditionalProb.toFixed(4)
        );
      }
    }
    if (outputMode === "standard") {
      forkRationales[fork.forkId] = {
        rationale: `1-2 sentence justification for ${fork.forkTitle}`,
        keyAssumption: "Core falsifiable assumption at this fork",
      };
    }
  }

  const template: Record<string, unknown> = {
    graphId: spec.graphId,
    headlineSummary: `1-sentence headline takeaway for ${spec.shortTitle}`,
  };
  if (Object.keys(rootPriors).length > 0) {
    template.rootPriors = rootPriors;
  }
  template.conditionalSplits = conditionalSplits;
  if (outputMode === "standard") {
    template.forkRationales = forkRationales;
  }
  return template;
}

/**
 * Generates a self-contained 1-click Copy-Paste Prompt Pack (plus 1-line `curl` push command)
 * for any Focused Branch, Full Graph, or All-Site Sweep.
 */
export function generatePromptPack(
  params: GeneratePromptPackParams
): GeneratedPromptPack {
  const scope = params.scope || "graph";
  const outputMode = params.outputMode || "standard";
  const handle = (params.actorHandle || "custom_forecaster")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 36);
  const displayName = params.actorDisplayName || "Custom Worldview Agent";
  const actorType = params.actorType || "ai_agent";
  const baseOrigin = params.baseOrigin || "https://agifutures.co";

  const targetGraphs: Array<{
    spec: RegisteredGraphSpec;
    forks: ConditionalForkGroupSpec[];
  }> = [];

  if (scope === "all_site") {
    for (const spec of getRegisteredGraphs()) {
      targetGraphs.push({ spec, forks: spec.forks });
    }
  } else {
    const spec =
      getRegisteredGraph(params.graphId) || getRegisteredGraphs()[0];
    const forks =
      scope === "branch" && params.branchNodeId
        ? getSubtreeForks(spec.graphId, params.branchNodeId)
        : spec.forks;
    targetGraphs.push({ spec, forks });
  }

  let forkCount = 0;
  let optionCount = 0;
  for (const g of targetGraphs) {
    if (g.spec.graphId === "lev") {
      forkCount += 1;
      optionCount += 3;
    } else {
      forkCount += g.forks.length;
      for (const f of g.forks) optionCount += f.options.length;
    }
  }

  const wv = params.worldview;
  const worldviewSection = [
    `## Your Forecaster Persona & Worldview Assumptions`,
    `- **Forecaster Handle**: \`@${handle}\` (${displayName})`,
    wv?.coreThesis
      ? `- **Core Worldview Thesis**: ${wv.coreThesis}`
      : `- **Core Worldview Thesis**: State your coherent causal thesis clearly and apply it consistently across every fork.`,
    wv?.systemPrompt
      ? `- **Tuning Instructions / System Prompt**: ${wv.systemPrompt}`
      : null,
    wv?.explicitAxioms && wv.explicitAxioms.length > 0
      ? `- **Explicit Load-Bearing Axioms**:\n${wv.explicitAxioms
          .map((ax) => `  1. ${ax}`)
          .join("\n")}`
      : null,
    wv?.priorAxes && wv.priorAxes.length > 0
      ? `- **Calibrated Prior Axes (0–100)**: ${wv.priorAxes
          .map((a) => `${a.shortLabel}: ${a.score}/100`)
          .join(" • ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const jsonSchemaTemplate: Record<string, unknown> =
    scope === "all_site"
      ? {
          actor: {
            handle,
            displayName,
            actorType,
            worldview: {
              coreThesis:
                wv?.coreThesis ||
                "Concise 1-2 sentence statement of your worldview and key priors.",
              modelBadge: wv?.modelBadge || "Custom Agent",
              explicitAxioms: wv?.explicitAxioms || [
                "First load-bearing axiom",
                "Second load-bearing axiom",
              ],
            },
          },
          runs: targetGraphs.map((g) =>
            buildSingleGraphTemplate(g.spec, g.forks, outputMode)
          ),
        }
      : {
          actor: {
            handle,
            displayName,
            actorType,
            worldview: {
              coreThesis:
                wv?.coreThesis ||
                "Concise 1-2 sentence statement of your worldview and key priors.",
              modelBadge: wv?.modelBadge || "Custom Agent",
              explicitAxioms: wv?.explicitAxioms || [
                "First load-bearing axiom",
                "Second load-bearing axiom",
              ],
            },
          },
          ...buildSingleGraphTemplate(
            targetGraphs[0].spec,
            targetGraphs[0].forks,
            outputMode
          ),
        };

  const scopeTitle =
    scope === "branch"
      ? `Focused Conditional Branch (${params.branchNodeId || "Selected Subtree"})`
      : scope === "all_site"
      ? `All-Site Multi-Atlas Sweep (${targetGraphs.length} Graphs)`
      : `Full Graph Forecast (${targetGraphs[0].spec.title})`;

  const promptText = [
    `# FutureGraph Conditional Probability Elicitation — ${scopeTitle}`,
    "",
    `You are filling out a conserved conditional probability distribution for FutureGraph.`,
    `Do NOT hedge everything to 50/50 — commit to coherent probabilities reflecting the worldview below while respecting strict probability conservation (sibling splits at every fork MUST sum to 1.00).`,
    "",
    worldviewSection,
    "",
    `## Conditional Branches to Forecast`,
    ...targetGraphs.map((g) => formatGraphForksMarkdown(g.spec, g.forks)),
    "",
    `## Output Instructions (Strict JSON Only)`,
    `Return **ONLY** a single valid JSON block matching the exact keys below so it can be pasted directly back into FutureGraph (do not rename any \`splitKey\` IDs):`,
    "",
    "```json",
    JSON.stringify(jsonSchemaTemplate, null, 2),
    "```",
  ].join("\n");

  const curlExampleCommand = [
    `curl -sS -X POST "${baseOrigin}/futuregraph/api/v1/agents/runs" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify(jsonSchemaTemplate)}'`,
  ].join("\n");

  return {
    scope,
    outputMode,
    targetGraphIds: targetGraphs.map((g) => g.spec.graphId),
    forkCount,
    optionCount,
    promptText,
    curlExampleCommand,
    jsonSchemaTemplate,
  };
}

export interface ParsedAgentForecastResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  actorPatch?: {
    handle?: string;
    displayName?: string;
    actorType?: ForecasterActor["actorType"];
    roleLabel?: string;
    worldview?: Partial<WorldviewCard>;
  };
  runs: GraphForecastRun[];
}

function extractJsonObjectFromText(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("Paste your agent's JSON response first.");
  }

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2. Markdown code fence extraction ```json ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // 3. First '{' to last '}' substring extraction
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }

  throw new Error(
    "Could not find a valid JSON object in the pasted response. Ask your agent to output valid JSON."
  );
}

function normalizeProbMapForForks(
  spec: RegisteredGraphSpec,
  rawSplits: Record<string, unknown> | undefined,
  rawRoots: Record<string, unknown> | undefined,
  warnings: string[]
): {
  normalizedSplits: Record<string, number>;
  normalizedRoots?: Record<string, number>;
} {
  const inputSplits: Record<string, number> = {};
  const inputRoots: Record<string, number> = {};

  if (rawSplits && typeof rawSplits === "object") {
    for (const [k, v] of Object.entries(rawSplits)) {
      const num = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(num) && num >= 0) {
        inputSplits[k] = num;
      }
    }
  }
  if (rawRoots && typeof rawRoots === "object") {
    for (const [k, v] of Object.entries(rawRoots)) {
      const num = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(num) && num >= 0) {
        inputRoots[k] = num;
      }
    }
  }

  // Detect 0..100 percentage scale vs 0..1 decimal scale per fork
  for (const fork of spec.forks) {
    const targetMap = fork.isRootPartition ? inputRoots : inputSplits;
    const providedVals = fork.options
      .map((o) => targetMap[o.splitKey])
      .filter((v): v is number => v !== undefined);
    if (providedVals.length === 0) continue;

    const maxVal = Math.max(...providedVals);
    const sumVal = providedVals.reduce((a, b) => a + b, 0);
    if (maxVal > 1.0001 || sumVal > 1.5) {
      for (const o of fork.options) {
        if (targetMap[o.splitKey] !== undefined) {
          targetMap[o.splitKey] = targetMap[o.splitKey] / 100;
        }
      }
      warnings.push(
        `Converted 0–100 percentage values to 0–1 decimals on '${fork.forkTitle}'.`
      );
    }

    // If all sibling options in this fork were provided, check sum == 1.0
    if (providedVals.length === fork.options.length) {
      const decimalSum = fork.options.reduce(
        (acc, o) => acc + (targetMap[o.splitKey] ?? 0),
        0
      );
      if (decimalSum > 0 && Math.abs(decimalSum - 1.0) > 0.015) {
        warnings.push(
          `Normalized '${fork.forkTitle}' from ${(decimalSum * 100).toFixed(
            1
          )}% to 100.0%.`
        );
      }
    }
  }

  const evaluated = evaluateGraphDistribution(spec.graphId, {
    rootPriors: Object.keys(inputRoots).length > 0 ? inputRoots : undefined,
    conditionalSplits: inputSplits,
  });

  return {
    normalizedSplits: evaluated.normalizedConditionalSplits,
    normalizedRoots: evaluated.normalizedRootPriors,
  };
}

/**
 * Tolerantly parses, validates, and normalizes a pasted LLM JSON response or API payload
 * into ready-to-preview / ready-to-save `GraphForecastRun` objects.
 */
export function parseAndValidateAgentResponse(params: {
  rawText?: string;
  parsedJson?: unknown;
  defaultGraphId: RegisteredGraphId;
  fallbackHandle?: string;
  fallbackDisplayName?: string;
  fallbackActorType?: ForecasterActor["actorType"];
}): ParsedAgentForecastResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rootObj: Record<string, unknown>;
  try {
    const raw =
      params.parsedJson !== undefined
        ? params.parsedJson
        : extractJsonObjectFromText(params.rawText || "");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return {
        ok: false,
        errors: ["Expected a top-level JSON object."],
        warnings: [],
        runs: [],
      };
    }
    rootObj = raw as Record<string, unknown>;
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : "Invalid JSON input."],
      warnings: [],
      runs: [],
    };
  }

  const actorRaw =
    rootObj.actor && typeof rootObj.actor === "object"
      ? (rootObj.actor as Record<string, unknown>)
      : undefined;

  const handle = String(
    actorRaw?.handle ||
      rootObj.actorHandle ||
      params.fallbackHandle ||
      "custom_agent"
  )
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 36);

  const displayName = String(
    actorRaw?.displayName ||
      rootObj.actorDisplayName ||
      params.fallbackDisplayName ||
      handle
  ).slice(0, 64);

  const rawActorType = String(
    actorRaw?.actorType ||
      rootObj.actorType ||
      params.fallbackActorType ||
      "ai_agent"
  );
  const actorType: ForecasterActor["actorType"] =
    rawActorType === "human" || rawActorType === "market_baseline"
      ? rawActorType
      : "ai_agent";

  const wvRaw =
    actorRaw?.worldview && typeof actorRaw.worldview === "object"
      ? (actorRaw.worldview as Partial<WorldviewCard>)
      : undefined;

  const rawRunItems: Array<Record<string, unknown>> = Array.isArray(rootObj.runs)
    ? (rootObj.runs.filter(
        (r) => r && typeof r === "object"
      ) as Array<Record<string, unknown>>)
    : [rootObj];

  if (rawRunItems.length === 0) {
    return {
      ok: false,
      errors: ["No forecast runs found in JSON payload."],
      warnings,
      runs: [],
    };
  }

  const nowIso = new Date().toISOString();
  const parsedRuns: GraphForecastRun[] = [];

  for (const item of rawRunItems) {
    const graphId = String(
      item.graphId || params.defaultGraphId
    ) as RegisteredGraphId;
    const spec = getRegisteredGraph(graphId);
    if (!spec) {
      errors.push(
        `Unrecognized graphId '${graphId}'. Valid IDs: ${getRegisteredGraphs()
          .map((g) => g.graphId)
          .join(", ")}.`
      );
      continue;
    }

    const forkRationales: Record<string, ForkRationaleEntry> = {};
    if (item.forkRationales && typeof item.forkRationales === "object") {
      for (const [fk, fv] of Object.entries(
        item.forkRationales as Record<string, unknown>
      )) {
        if (typeof fv === "string" && fv.trim()) {
          forkRationales[fk] = { rationale: fv.trim() };
        } else if (fv && typeof fv === "object") {
          const entry = fv as Record<string, unknown>;
          if (typeof entry.rationale === "string" && entry.rationale.trim()) {
            forkRationales[fk] = {
              rationale: entry.rationale.trim(),
              keyAssumption:
                typeof entry.keyAssumption === "string"
                  ? entry.keyAssumption.trim()
                  : undefined,
            };
          }
        }
      }
    }

    if (graphId === "lev" || spec.topologyKind === "trajectory_quantiles") {
      const levRaw =
        item.levForecast && typeof item.levForecast === "object"
          ? (item.levForecast as Record<string, unknown>)
          : item;
      const p99Year = Number(levRaw.p99Year ?? 2037.5);
      const p80Year = Number(levRaw.p80Year ?? p99Year + 5.0);
      const p50Year = Number(levRaw.p50Year ?? p80Year + 9.0);
      if (
        !Number.isFinite(p99Year) ||
        p99Year < 2026 ||
        p99Year > 2120
      ) {
        errors.push(
          `LEV p99Year must be a calendar year between 2026 and 2120 (got '${String(
            levRaw.p99Year
          )}').`
        );
        continue;
      }

      const levForecast: LevActorForecast = {
        p99Year: Math.round(p99Year * 10) / 10,
        p99Low: Math.round(Number(levRaw.p99Low ?? p99Year - 3.0) * 10) / 10,
        p99High: Math.round(Number(levRaw.p99High ?? p99Year + 4.0) * 10) / 10,
        p80Year: Math.round(p80Year * 10) / 10,
        p50Year: Math.round(p50Year * 10) / 10,
        intrinsicPoAP99: Number(
          Math.max(
            0.35,
            Math.min(1.1, Number(levRaw.intrinsicPoAP99 ?? 0.668))
          ).toFixed(3)
        ),
        velocityMultiplier: Number(
          Math.max(
            0.4,
            Math.min(2.0, Number(levRaw.velocityMultiplier ?? 1.0))
          ).toFixed(3)
        ),
        mechanismSummary: String(
          levRaw.mechanismSummary ||
            item.headlineSummary ||
            `Custom LEV forecast (${displayName})`
        ),
        keyAssumption:
          typeof levRaw.keyAssumption === "string"
            ? levRaw.keyAssumption
            : undefined,
      };

      parsedRuns.push({
        id: `run-${handle}-${graphId}-${Date.now().toString(36)}`,
        graphId,
        actorHandle: handle,
        actorDisplayName: displayName,
        actorType,
        conditionalSplits: {},
        forkRationales,
        levForecast,
        headlineSummary: String(
          item.headlineSummary ||
            `99th Pct LEV: ${levForecast.p99Year} • 80th: ${levForecast.p80Year} • 50th: ${levForecast.p50Year}`
        ),
        submittedAt: nowIso,
      });
      continue;
    }

    const rawSplits =
      item.conditionalSplits && typeof item.conditionalSplits === "object"
        ? (item.conditionalSplits as Record<string, unknown>)
        : undefined;
    const rawRoots =
      item.rootPriors && typeof item.rootPriors === "object"
        ? (item.rootPriors as Record<string, unknown>)
        : undefined;

    if (!rawSplits && !rawRoots) {
      errors.push(
        `Missing 'conditionalSplits'${
          spec.topologyKind === "sankey_flow" ? " or 'rootPriors'" : ""
        } for graph '${graphId}'.`
      );
      continue;
    }

    const { normalizedSplits, normalizedRoots } = normalizeProbMapForForks(
      spec,
      rawSplits,
      rawRoots,
      warnings
    );

    parsedRuns.push({
      id: `run-${handle}-${graphId}-${Date.now().toString(36)}`,
      graphId,
      actorHandle: handle,
      actorDisplayName: displayName,
      actorType,
      rootPriors: normalizedRoots,
      conditionalSplits: normalizedSplits,
      forkRationales,
      headlineSummary: String(
        item.headlineSummary || `${displayName} forecast on ${spec.shortTitle}`
      ),
      submittedAt: nowIso,
    });
  }

  return {
    ok: errors.length === 0 && parsedRuns.length > 0,
    errors,
    warnings,
    actorPatch: {
      handle,
      displayName,
      actorType,
      roleLabel:
        typeof actorRaw?.roleLabel === "string"
          ? actorRaw.roleLabel
          : undefined,
      worldview: wvRaw,
    },
    runs: parsedRuns,
  };
}
