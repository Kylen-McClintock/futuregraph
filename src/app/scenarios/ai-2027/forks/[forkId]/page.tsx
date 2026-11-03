"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, GitBranch, PlusCircle, ShieldCheck } from "lucide-react";

interface DiffItem {
  nodeId: string;
  title: string;
  dateLabel: string;
  branchTrack: string;
  canonicalProbability: number;
  forkProbability: number;
  delta: number;
  isDirectlyOverridden: boolean;
}

export default function ScenarioForkDiffPage({
  params,
}: {
  params: { forkId: string };
}) {
  const [diffData, setDiffData] = useState<{
    fork: {
      id: string;
      title: string;
      subtitle: string;
      ownerHandle: string;
      ownerName: string;
      rationale: string;
      createdAt: string;
      receiptId: string;
    };
    nodeDiffs: DiffItem[];
    addedNodes: Array<{
      id: string;
      parentNodeId: string;
      title: string;
      dateLabel: string;
      summary: string;
      probability: number;
    }>;
  } | null>(null);

  useEffect(() => {
    fetch(`/futuregraph/api/v1/scenarios/ai-2027/diff?forkId=${encodeURIComponent(params.forkId)}`)
      .then((r) => r.json())
      .then((d) => setDiffData(d));
  }, [params.forkId]);

  if (!diffData || !diffData.fork) {
    return (
      <div className="mx-auto max-w-[1280px] p-8 text-sm text-slate-400">
        Loading Scenario Fork Diff...
      </div>
    );
  }

  const { fork, nodeDiffs, addedNodes } = diffData;

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-violet-500/40 bg-slate-900/80 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 px-3 py-0.5 text-xs font-mono font-bold text-violet-300">
            <GitBranch className="h-3.5 w-3.5" />
            <span>SCENARIO FORK DIFF VS. CANONICAL AI 2027 V1</span>
          </span>
          <Link
            href={`/receipt/${fork.receiptId}`}
            className="inline-flex items-center gap-1 text-xs font-mono text-emerald-300 hover:underline"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verify Fork Receipt ({fork.receiptId})</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {fork.title}
        </h1>
        <p className="text-sm text-slate-300">{fork.rationale}</p>
        <div className="text-xs text-slate-400">
          Authored by{" "}
          <Link
            href={`/u/${fork.ownerHandle}`}
            className="text-sky-300 font-semibold hover:underline"
          >
            {fork.ownerName} (@{fork.ownerHandle})
          </Link>{" "}
          • Created {fork.createdAt.slice(0, 10)}
        </div>
      </div>

      {/* Added Custom Branch Nodes in Fork */}
      {addedNodes && addedNodes.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span>New Branch Nodes Added in This Fork ({addedNodes.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addedNodes.map((an) => (
              <div
                key={an.id}
                className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
                  <span>{an.dateLabel}</span>
                  <span>Prior: {(an.probability * 100).toFixed(1)}%</span>
                </div>
                <h3 className="text-sm font-bold text-white">{an.title}</h3>
                <p className="text-xs text-slate-300">{an.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Probability Delta Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-white">
          Direct Overrides &amp; Downstream Propagated Deltas ({nodeDiffs.length} Nodes)
        </h2>
        <div className="fg-table-container bg-slate-950">
          <table className="fg-responsive-table text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/95 text-slate-300">
                <th className="p-3.5">Scenario Node</th>
                <th className="p-3.5">Change Type</th>
                <th className="p-3.5">Canonical AI 2027</th>
                <th className="p-3.5 text-violet-300">Fork Probability</th>
                <th className="p-3.5">Net Shift ($\Delta$)</th>
                <th className="p-3.5">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {nodeDiffs.map((d) => (
                <tr key={d.nodeId} className="hover:bg-slate-900/50">
                  <td className="p-3.5">
                    <div className="text-[11px] font-mono text-amber-300">
                      {d.dateLabel}
                    </div>
                    <div className="font-bold text-white">{d.title}</div>
                  </td>
                  <td className="p-3.5">
                    {d.isDirectlyOverridden ? (
                      <span className="rounded bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 text-[11px] font-mono text-violet-300">
                        Direct Override
                      </span>
                    ) : (
                      <span className="rounded bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[11px] font-mono text-sky-300">
                        Propagated Child
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-300 tabular-nums">
                    {(d.canonicalProbability * 100).toFixed(1)}%
                  </td>
                  <td className="p-3.5 font-mono font-bold text-violet-300 tabular-nums">
                    {(d.forkProbability * 100).toFixed(1)}%
                  </td>
                  <td className="p-3.5 font-mono font-bold tabular-nums">
                    <span
                      className={
                        d.delta > 0 ? "text-emerald-400" : "text-rose-400"
                      }
                    >
                      {d.delta > 0 ? "+" : ""}
                      {(d.delta * 100).toFixed(1)} pts
                    </span>
                  </td>
                  <td className="p-3.5">
                    <Link
                      href={`/scenarios/ai-2027/n/${d.nodeId}`}
                      className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                    >
                      <span>Audit</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
