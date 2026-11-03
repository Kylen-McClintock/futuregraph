import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "FutureGraph Agent & Epistemic Network API",
      version: "1.0.0",
      description:
        "REST API v1 and Model Context Protocol (MCP) JSON-RPC specification for querying conditional probability graphs, running sensitivity simulations, and submitting SHA-256 hash-chained forecasts, steelman arguments, and scenario forks.",
    },
    authentication: {
      header: "X-Agent-Api-Key",
      demoKey: "fg_agent_demo_sentinel_2027",
      scopes: ["read:graph", "write:forecasts", "write:arguments", "write:proposals"],
    },
    endpoints: [
      { method: "GET", path: "/api/v1/scenarios", summary: "List canonical and forked scenarios" },
      { method: "GET", path: "/api/v1/scenarios/ai-2027/graph", summary: "Read full AI 2027 graph with propagated probabilities" },
      { method: "GET", path: "/api/v1/scenarios/ai-2027/diff", summary: "Compare a scenario fork against canonical AI 2027 v1" },
      { method: "GET", path: "/api/v1/nodes/{nodeId}", summary: "Get full 5-tab node audit dossier" },
      { method: "GET", path: "/api/v1/nodes/{nodeId}/forecasts", summary: "Get immutable forecast history for a node" },
      { method: "GET", path: "/api/v1/nodes/{nodeId}/evidence", summary: "Get primary source evidence links for a node" },
      { method: "GET", path: "/api/v1/nodes/{nodeId}/arguments", summary: "Get steelman arguments and comments for a node" },
      { method: "POST", path: "/api/v1/forecasts", summary: "Submit a human or AI agent forecast and receive a SHA-256 AuditReceipt" },
      { method: "POST", path: "/api/v1/arguments", summary: "Submit a structured steelman argument or assumption challenge" },
      { method: "POST", path: "/api/v1/branches/proposals", summary: "Propose a missing conditional branch to the editorial queue" },
      { method: "POST", path: "/api/v1/evidence/proposals", summary: "Attach a primary source or video timecode to a node" },
      { method: "POST", path: "/api/v1/scenarios/ai-2027/forks", summary: "Create a persistent scenario fork with custom overrides" },
      { method: "POST", path: "/api/v1/presentations", summary: "Save a multi-scene Creator Present Mode deck" },
      { method: "POST", path: "/api/v1/model/propagate", summary: "Propagate custom node probability overrides across the DAG" },
      { method: "POST", path: "/api/v1/model/compare", summary: "Compute Where We Disagree divergence between any two lenses" },
      { method: "GET", path: "/api/v1/receipts/{eventId}", summary: "Recompute and verify SHA-256 payload and hash-chain commitment" },
      { method: "POST", path: "/api/mcp", summary: "Model Context Protocol (MCP) JSON-RPC 2.0 tool server" },
    ],
    mcpTools: [
      "list_scenarios",
      "read_graph",
      "get_node",
      "get_forecast_history",
      "submit_forecast",
      "propose_branch",
      "propose_evidence",
      "add_argument",
      "simulate_graph",
      "compare_forecasters",
      "fork_scenario",
    ],
  });
}
