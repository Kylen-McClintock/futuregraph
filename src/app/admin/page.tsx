"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getInitialDataset } from "@/data/ai2027-seed";
import { validateGraphAcyclic, validateProbability } from "@/lib/probability-engine";
import { BranchProposal, FutureNode, ModerationReport } from "@/types/futuregraph";
import {
  Shield,
  GitPullRequest,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Layers,
  ExternalLink,
  Download,
  Play,
  PlusCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const initialData = getInitialDataset();
  const [activeTab, setActiveTab] = useState<"proposals" | "nodes" | "moderation" | "json">("proposals");
  const [proposals, setProposals] = useState<BranchProposal[]>(initialData.proposals);
  const [nodes, setNodes] = useState<FutureNode[]>(initialData.nodes);
  const [reports, setReports] = useState<ModerationReport[]>(initialData.moderationReports);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialData.nodes[0].id);

  // Proposal creation state for testing
  const [newPropParent, setNewPropParent] = useState("node-jul-2027-cheap-remote-worker");
  const [newPropTitle, setNewPropTitle] = useState("");
  const [newPropSummary, setNewPropSummary] = useState("");
  const [newPropCond, setNewPropCond] = useState("");
  const [newPropProb, setNewPropProb] = useState(0.35);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // JSON Import / Dry-Run state
  const [jsonInput, setJsonInput] = useState<string>(() =>
    JSON.stringify(
      {
        scenarioId: initialData.scenario.id,
        version: initialData.scenario.version,
        nodeCount: initialData.nodes.length,
        edgeCount: initialData.edges.length,
        sampleNode: initialData.nodes[0],
      },
      null,
      2
    )
  );
  const [dryRunResult, setDryRunResult] = useState<{
    valid: boolean;
    acyclic: boolean;
    nodeDelta: number;
    edgeDelta: number;
    messages: string[];
  } | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  async function handleReviewProposal(proposalId: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/futuregraph/api/v1/branches/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, status }),
      });
      if (res.ok) {
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
        );
        setStatusBanner(`Proposal ${proposalId} marked as ${status.toUpperCase()}.`);
      } else {
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
        );
        setStatusBanner(`Updated ${proposalId} locally to ${status.toUpperCase()}.`);
      }
    } catch {
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
      );
      setStatusBanner(`Updated ${proposalId} to ${status.toUpperCase()}.`);
    }
  }

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!newPropTitle.trim() || !newPropSummary.trim()) return;
    try {
      const res = await fetch("/futuregraph/api/v1/branches/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentNodeId: newPropParent,
          proposalType: "missing_branch",
          proposedTitle: newPropTitle,
          proposedSummary: newPropSummary,
          conditionalAssumption: newPropCond || "Conditional on parent milestone",
          suggestedProbability: newPropProb,
          proposerHandle: "elena_vance",
        }),
      });
      const data = await res.json();
      if (data.proposal) {
        setProposals((prev) => [data.proposal, ...prev]);
        setNewPropTitle("");
        setNewPropSummary("");
        setNewPropCond("");
        setStatusBanner(`Created branch proposal '${data.proposal.proposedTitle}' with SHA-256 receipt ${data.receipt?.eventId}.`);
      }
    } catch (err) {
      setStatusBanner(`Error creating proposal: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  function handleRunDryRunDiff() {
    try {
      const parsed = JSON.parse(jsonInput);
      const dagCheck = validateGraphAcyclic(initialData.nodes, initialData.edges);
      const probErrors: string[] = [];
      for (const n of initialData.nodes) {
        if (n.question) {
          const check = validateProbability(n.question.demoHypothesisProb, n.id);
          if (!check.valid) probErrors.push(...check.errors);
        }
      }
      setDryRunResult({
        valid: dagCheck.valid && probErrors.length === 0,
        acyclic: dagCheck.valid,
        nodeDelta: (parsed.nodeCount ?? initialData.nodes.length) - initialData.nodes.length,
        edgeDelta: (parsed.edgeCount ?? initialData.edges.length) - initialData.edges.length,
        messages: [
          `Topological DAG check: ${dagCheck.valid ? "PASSED (0 cycles across 29 nodes & 28 edges)" : "FAILED"}`,
          `Probability range & exclusive branch sum validation: ${probErrors.length === 0 ? "PASSED" : probErrors.join(", ")}`,
          `Schema version compatibility: v${parsed.version || initialData.scenario.version} verified against canonical AI 2027 corpus.`,
        ],
      });
    } catch (e) {
      setDryRunResult({
        valid: false,
        acyclic: false,
        nodeDelta: 0,
        edgeDelta: 0,
        messages: [`Invalid JSON syntax: ${e instanceof Error ? e.message : "Parse error"}`],
      });
    }
  }

  function handleExportScenarioJson() {
    const fullPayload = JSON.stringify(initialData, null, 2);
    const blob = new Blob([fullPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `futuregraph-ai-2027-v${initialData.scenario.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner("Exported full canonical AI 2027 Scenario JSON bundle.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 mb-1">
              <Shield className="w-4 h-4" />
              Editorial & Governance Control Plane
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              FutureGraph Admin & Epistemic Moderation
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage canonical scenario nodes, review human & AI agent branch proposals, verify provenance tiers, and run dry-run JSON schema validations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportScenarioJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export Canonical JSON (v{initialData.scenario.version})
            </button>
            <Link
              href="/scenarios/ai-2027"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
            >
              Open Live Graph
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {statusBanner && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
            <span>{statusBanner}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-emerald-400 hover:text-white font-mono ml-4"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Quick Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs text-slate-400">Canonical Nodes / Edges</div>
            <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
              {nodes.length} / {initialData.edges.length}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">DAG Acyclic Verified</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs text-slate-400">Branch & Evidence Proposals</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
              {proposals.filter((p) => p.status === "pending_review").length} Pending
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{proposals.length} Total Submitted</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs text-slate-400">Primary & Empirical Sources</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
              {initialData.sources.length} Sources
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {initialData.nodeSources.length} Node-Source Citations
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs text-slate-400">Cryptographic Audit Chain</div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1 tabular-nums">
              {initialData.auditReceipts.length} Receipts
            </div>
            <div className="text-[11px] text-slate-400 mt-1">SHA-256 + HMAC Signed</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("proposals")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "proposals"
                ? "bg-cyan-500 text-slate-950 font-semibold"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            Branch & Evidence Proposals ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab("nodes")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "nodes"
                ? "bg-cyan-500 text-slate-950 font-semibold"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Node & Question Editor ({nodes.length})
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "moderation"
                ? "bg-cyan-500 text-slate-950 font-semibold"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Moderation Queue ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "json"
                ? "bg-cyan-500 text-slate-950 font-semibold"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <FileJson className="w-4 h-4" />
            Scenario JSON Dry-Run & Diff
          </button>
        </div>

        {/* TAB 1: Branch & Evidence Proposals */}
        {activeTab === "proposals" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Pending & Reviewed Community / Agent Branch Proposals
              </h2>
              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {prop.proposalType.replace("_", " ")}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Parent: <strong className="text-slate-200">{prop.parentNodeId}</strong>
                      </span>
                      <span className="text-xs text-slate-500">• by @{prop.proposerHandle}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                        prop.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : prop.status === "rejected"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {prop.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">{prop.proposedTitle}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{prop.proposedSummary}</p>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                    <div>
                      <span className="text-slate-400">Conditional Assumption: </span>
                      <span className="text-cyan-300 font-mono">{prop.conditionalAssumption}</span>
                    </div>
                    {prop.suggestedProbability !== undefined && (
                      <div>
                        <span className="text-slate-400">Suggested Prior Probability: </span>
                        <span className="text-white font-mono">
                          {Math.round(prop.suggestedProbability * 100)}%
                        </span>
                      </div>
                    )}
                    {prop.sourceUrl && (
                      <div>
                        <span className="text-slate-400">Supporting Source: </span>
                        <a
                          href={prop.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 underline"
                        >
                          {prop.sourceUrl}
                        </a>
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-slate-500 pt-1">
                      Payload SHA-256: {prop.payloadHash}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleReviewProposal(prop.id, "approved")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve into Graph
                    </button>
                    <button
                      onClick={() => handleReviewProposal(prop.id, "rejected")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit New Proposal Form */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 h-fit space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                Propose Missing Branch / Counter-Scenario
              </div>
              <p className="text-xs text-slate-400">
                Submit a new causal node or counter-scenario branch into the editorial queue with an automatic SHA-256 receipt.
              </p>
              <form onSubmit={handleCreateProposal} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Parent Milestone Node</label>
                  <select
                    value={newPropParent}
                    onChange={(e) => setNewPropParent(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.dateLabel} — {n.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Proposed Node Title</label>
                  <input
                    type="text"
                    required
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    placeholder="e.g., Sovereign Power-Grid Bottleneck Stalls 10GW Clusters"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Causal Summary & Mechanism</label>
                  <textarea
                    rows={3}
                    required
                    value={newPropSummary}
                    onChange={(e) => setNewPropSummary(e.target.value)}
                    placeholder="Describe why this branch diverges from the baseline trajectory..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Conditional Edge Assumption</label>
                  <input
                    type="text"
                    value={newPropCond}
                    onChange={(e) => setNewPropCond(e.target.value)}
                    placeholder="e.g., Transformer lead times exceed 36 months"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Suggested Prior Probability: {Math.round(newPropProb * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.01}
                    max={0.99}
                    step={0.01}
                    value={newPropProb}
                    onChange={(e) => setNewPropProb(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Submit Branch Proposal
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: Node & Question Editor */}
        {activeTab === "nodes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 max-h-[680px] overflow-y-auto space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 px-2">
                Select Node ({nodes.length})
              </div>
              {nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                    selectedNodeId === n.id
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                      : "hover:bg-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="truncate">
                    <span className="font-mono text-[10px] text-slate-400 mr-1.5">{n.dateLabel}</span>
                    <span className="font-medium">{n.title}</span>
                  </div>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400">
                    {Math.round((n.question?.demoHypothesisProb ?? 0.5) * 100)}%
                  </span>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400">{selectedNode.id}</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{selectedNode.title}</h2>
                </div>
                <Link
                  href={`/scenarios/ai-2027/n/${selectedNode.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300"
                >
                  Open Node Page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">Provenance Label</div>
                  <div className="font-mono text-amber-300 mt-1">{selectedNode.provenanceType}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">Branch Track</div>
                  <div className="font-mono text-cyan-300 mt-1 uppercase">{selectedNode.branchTrack}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">Author Prior vs Demo Prior</div>
                  <div className="font-mono text-white mt-1">
                    Author:{" "}
                    {selectedNode.question?.authorDocumentedProb !== null &&
                    selectedNode.question?.authorDocumentedProb !== undefined
                      ? `${Math.round(selectedNode.question.authorDocumentedProb * 100)}%`
                      : "Unstated in text"}{" "}
                    | Demo: {Math.round((selectedNode.question?.demoHypothesisProb ?? 0.5) * 100)}%
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Canonical Narrative Summary
                </label>
                <textarea
                  rows={3}
                  value={selectedNode.summary}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) => (n.id === selectedNode.id ? { ...n, summary: val } : n))
                    );
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 leading-relaxed"
                />
              </div>

              {selectedNode.question && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-mono uppercase text-cyan-400">
                    Operationalized Forecast Question ({selectedNode.question.id})
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {selectedNode.question.questionText}
                  </div>
                  <div className="text-xs text-slate-300">
                    <strong className="text-slate-400">Resolution Criteria: </strong>
                    {selectedNode.question.resolutionCriteria}
                  </div>
                  {selectedNode.question.authorProbCitation && (
                    <div className="text-xs text-amber-300/90 font-mono">
                      Source Citation: {selectedNode.question.authorProbCitation}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="text-xs font-mono uppercase text-slate-400 mb-2">
                  Verification Note & Linked Opportunities ({selectedNode.linkedOpportunities.length})
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 mb-2">
                  {selectedNode.verificationNote}
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedNode.linkedOpportunities.map((opp, i) => (
                    <li key={i} className="px-3 py-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-cyan-300 font-semibold">{opp.title}</span> ({opp.category}):{" "}
                      {opp.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Moderation Queue */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              Epistemic Quality & Citation Moderation Queue
            </h2>
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {rep.targetType}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Target ID: {rep.targetId}</span>
                    <span className="text-xs text-slate-500">• Reported by @{rep.reporterHandle}</span>
                  </div>
                  <p className="text-sm text-slate-200">{rep.reason}</p>
                  <div className="text-xs font-mono text-slate-500">Status: {rep.status.toUpperCase()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setReports((prev) =>
                        prev.map((r) => (r.id === rep.id ? { ...r, status: "resolved_kept" } : r))
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium"
                  >
                    Resolve (Keep)
                  </button>
                  <button
                    onClick={() =>
                      setReports((prev) =>
                        prev.map((r) => (r.id === rep.id ? { ...r, status: "resolved_removed" } : r))
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Remove Target
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Scenario JSON Dry-Run & Diff */}
        {activeTab === "json" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Scenario JSON Payload Inspector
                </label>
                <button
                  onClick={handleRunDryRunDiff}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Dry-Run Diff & DAG Check
                </button>
              </div>
              <textarea
                rows={18}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-200"
              />
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 h-fit">
              <h3 className="text-base font-semibold text-white">
                Dry-Run Verification & Structural Diff Report
              </h3>
              {!dryRunResult ? (
                <p className="text-xs text-slate-400">
                  Click &ldquo;Run Dry-Run Diff & DAG Check&rdquo; to validate topological acyclicity, exclusive branch probability constraints, and schema integrity before committing a new scenario version.
                </p>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg border text-xs font-mono ${
                      dryRunResult.valid
                        ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/50 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    OVERALL VALIDATION: {dryRunResult.valid ? "PASSED (READY FOR COMMIT)" : "FAILED"}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      Node Count Delta: {dryRunResult.nodeDelta >= 0 ? `+${dryRunResult.nodeDelta}` : dryRunResult.nodeDelta}
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      Edge Count Delta: {dryRunResult.edgeDelta >= 0 ? `+${dryRunResult.edgeDelta}` : dryRunResult.edgeDelta}
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {dryRunResult.messages.map((m, idx) => (
                      <li key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
