import { NextRequest, NextResponse } from "next/server";
import {
  compareLenses,
  createScenarioFork,
  getBasePriorsForLens,
  getStore,
  submitArgumentItem,
  submitBranchProposal,
  submitForecastEvent,
} from "@/lib/store";
import { propagateGraphProbabilities } from "@/lib/probability-engine";
import { ForecastLens } from "@/types/futuregraph";

const MCP_TOOLS = [
  {
    name: "list_scenarios",
    description: "List all canonical and forked scenarios in FutureGraph.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "read_graph",
    description: "Read the complete nodes, edges, and propagated probabilities for a scenario.",
    inputSchema: {
      type: "object",
      properties: {
        scenarioId: { type: "string", default: "ai-2027" },
        lens: { type: "string", default: "demo_hypothesis" },
      },
    },
  },
  {
    name: "get_node",
    description: "Retrieve the full 5-tab epistemic audit dossier for a specific node.",
    inputSchema: {
      type: "object",
      required: ["nodeId"],
      properties: { nodeId: { type: "string" } },
    },
  },
  {
    name: "get_forecast_history",
    description: "Retrieve immutable forecast events and SHA-256 receipts for a node.",
    inputSchema: {
      type: "object",
      required: ["nodeId"],
      properties: { nodeId: { type: "string" } },
    },
  },
  {
    name: "submit_forecast",
    description: "Submit an AI agent or human probability forecast and receive a tamper-evident SHA-256 receipt.",
    inputSchema: {
      type: "object",
      required: ["nodeId", "probability", "rationale"],
      properties: {
        nodeId: { type: "string" },
        probability: { type: "number", minimum: 0, maximum: 1 },
        rationale: { type: "string" },
        citedUrls: { type: "array", items: { type: "string" } },
        forecasterHandle: { type: "string" },
      },
    },
  },
  {
    name: "propose_branch",
    description: "Propose a missing conditional branch or alternative outcome under a parent node.",
    inputSchema: {
      type: "object",
      required: ["parentNodeId", "proposedTitle", "proposedSummary"],
      properties: {
        parentNodeId: { type: "string" },
        proposedTitle: { type: "string" },
        proposedSummary: { type: "string" },
        conditionalAssumption: { type: "string" },
        suggestedProbability: { type: "number" },
      },
    },
  },
  {
    name: "propose_evidence",
    description: "Attach a primary source URL, research supplement excerpt, or video timecode to a node.",
    inputSchema: {
      type: "object",
      required: ["nodeId", "url", "title", "relevanceNote"],
      properties: {
        nodeId: { type: "string" },
        url: { type: "string" },
        title: { type: "string" },
        relationship: { type: "string", enum: ["supports", "disputes", "contextualizes"] },
        relevanceNote: { type: "string" },
      },
    },
  },
  {
    name: "add_argument",
    description: "Add a structured steelman argument or assumption challenge to a node.",
    inputSchema: {
      type: "object",
      required: ["nodeId", "stance", "thesis", "reasoning"],
      properties: {
        nodeId: { type: "string" },
        stance: { type: "string", enum: ["for", "against", "steelman", "assumption_challenge"] },
        thesis: { type: "string" },
        reasoning: { type: "string" },
        targetAssumption: { type: "string" },
      },
    },
  },
  {
    name: "simulate_graph",
    description: "Run live conditional probability propagation across the DAG with custom node overrides.",
    inputSchema: {
      type: "object",
      required: ["overrides"],
      properties: {
        overrides: { type: "object" },
        lens: { type: "string", default: "demo_hypothesis" },
      },
    },
  },
  {
    name: "compare_forecasters",
    description: "Compute 'Where We Disagree' divergence between two lenses (e.g., community vs ai_gemini).",
    inputSchema: {
      type: "object",
      properties: {
        lensA: { type: "string", default: "community" },
        lensB: { type: "string", default: "ai_gemini" },
      },
    },
  },
  {
    name: "fork_scenario",
    description: "Create a persistent scenario fork with custom probability overrides and added branches.",
    inputSchema: {
      type: "object",
      required: ["title", "rationale", "nodeProbabilityOverrides"],
      properties: {
        title: { type: "string" },
        rationale: { type: "string" },
        nodeProbabilityOverrides: { type: "object" },
      },
    },
  },
];

export async function GET() {
  return NextResponse.json({
    protocol: "mcp/1.0",
    serverName: "futuregraph-mcp-server",
    version: "1.0.0",
    tools: MCP_TOOLS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id ?? 1;
    const method = body.method || "tools/list";
    const params = body.params || {};
    const store = getStore();

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "futuregraph-mcp-server", version: "1.0.0" },
          capabilities: { tools: {} },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      });
    }

    const toolName = method === "tools/call" ? params.name : method;
    const args = method === "tools/call" ? params.arguments || {} : params;

    switch (toolName) {
      case "list_scenarios": {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            scenarios: [store.scenario, ...store.forks],
          },
        });
      }
      case "read_graph": {
        const lens = (args.lens as ForecastLens) || "demo_hypothesis";
        const priors = getBasePriorsForLens(lens);
        const prop = propagateGraphProbabilities(store.nodes, store.edges, priors, {});
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            scenario: store.scenario,
            nodes: store.nodes,
            edges: store.edges,
            propagation: prop,
          },
        });
      }
      case "get_node": {
        const node = store.nodes.find((n) => n.id === args.nodeId || n.logicalId === args.nodeId);
        if (!node) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: `Node '${args.nodeId}' not found` },
          });
        }
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            node,
            evidence: store.nodeSources.filter((ns) => ns.nodeId === node.id),
            arguments: store.arguments.filter((a) => a.nodeId === node.id),
            forecasts: store.forecastEvents.filter((f) => f.nodeId === node.id),
          },
        });
      }
      case "get_forecast_history": {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            nodeId: args.nodeId,
            forecasts: store.forecastEvents.filter((f) => f.nodeId === args.nodeId),
          },
        });
      }
      case "submit_forecast": {
        const res = await submitForecastEvent({
          nodeId: args.nodeId,
          probability: Number(args.probability),
          rationale: args.rationale,
          citedUrls: args.citedUrls || [],
          forecasterHandle: args.forecasterHandle || "sentinel_bayes_v2",
          forecasterName: args.forecasterName || "Sentinel-Bayes v2.4 (MCP Agent)",
          forecasterType: "ai_agent",
        });
        return NextResponse.json({ jsonrpc: "2.0", id, result: res });
      }
      case "propose_branch": {
        const res = await submitBranchProposal({
          parentNodeId: args.parentNodeId,
          proposedTitle: args.proposedTitle,
          proposedSummary: args.proposedSummary,
          conditionalAssumption: args.conditionalAssumption || "MCP Agent proposed branch",
          suggestedProbability:
            args.suggestedProbability !== undefined ? Number(args.suggestedProbability) : undefined,
          proposerHandle: args.proposerHandle || "sentinel_bayes_v2",
        });
        return NextResponse.json({ jsonrpc: "2.0", id, result: res });
      }
      case "propose_evidence": {
        const res = await submitBranchProposal({
          parentNodeId: args.nodeId,
          proposalType: "evidence_addition",
          proposedTitle: `Evidence: ${args.title}`,
          proposedSummary: args.relevanceNote,
          conditionalAssumption: `Relationship: ${args.relationship || "supports"}`,
          sourceUrl: args.url,
          proposerHandle: args.proposerHandle || "sentinel_bayes_v2",
        });
        return NextResponse.json({ jsonrpc: "2.0", id, result: res });
      }
      case "add_argument": {
        const res = await submitArgumentItem({
          nodeId: args.nodeId,
          stance: args.stance || "steelman",
          thesis: args.thesis,
          reasoning: args.reasoning,
          targetAssumption: args.targetAssumption,
          authorHandle: args.authorHandle || "sentinel_bayes_v2",
          authorName: "Sentinel-Bayes v2.4 (MCP Agent)",
          authorType: "ai_agent",
        });
        return NextResponse.json({ jsonrpc: "2.0", id, result: res });
      }
      case "simulate_graph": {
        const lens = (args.lens as ForecastLens) || "demo_hypothesis";
        const priors = getBasePriorsForLens(lens);
        const prop = propagateGraphProbabilities(
          store.nodes,
          store.edges,
          priors,
          args.overrides || {}
        );
        return NextResponse.json({ jsonrpc: "2.0", id, result: prop });
      }
      case "compare_forecasters": {
        const comp = compareLenses(
          (args.lensA as ForecastLens) || "community",
          (args.lensB as ForecastLens) || "ai_gemini"
        );
        return NextResponse.json({ jsonrpc: "2.0", id, result: { comparison: comp } });
      }
      case "fork_scenario": {
        const res = await createScenarioFork({
          title: args.title,
          rationale: args.rationale,
          ownerHandle: args.ownerHandle || "sentinel_bayes_v2",
          nodeProbabilityOverrides: args.nodeProbabilityOverrides || {},
        });
        return NextResponse.json({ jsonrpc: "2.0", id, result: res });
      }
      default:
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown MCP tool '${toolName}'` },
        });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "MCP execution error";
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32603, message } },
      { status: 400 }
    );
  }
}
