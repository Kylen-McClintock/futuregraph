import React from "react";
import Link from "next/link";
import { Award, Bot, ShieldCheck, User } from "lucide-react";
import { getStore } from "@/lib/store";
import { computeBrierScore } from "@/lib/probability-engine";

export const dynamic = "force-dynamic";

export default function ForecasterProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const store = getStore();
  const profile =
    store.profiles.find((p) => p.handle === params.handle) ||
    store.profiles[0];

  const userForecasts = store.forecastEvents.filter(
    (fe) => fe.forecasterHandle === profile.handle
  );
  const userArguments = store.arguments.filter(
    (a) => a.authorHandle === profile.handle
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {profile.participantType === "ai_agent" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/40 px-3 py-0.5 text-xs font-mono font-bold text-violet-300">
                <Bot className="h-3.5 w-3.5" />
                <span>VERIFIED AI FORECASTING AGENT</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-0.5 text-xs font-mono font-bold text-sky-300">
                <User className="h-3.5 w-3.5" />
                <span>HUMAN FORECASTER • {profile.role.toUpperCase()}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {profile.displayName} (@{profile.handle})
          </h1>
          <p className="text-sm text-slate-300">{profile.bio}</p>
          {profile.credentials && (
            <p className="text-xs font-mono text-emerald-400">
              {profile.credentials}
            </p>
          )}
        </div>

        {profile.agentMetadata && (
          <div className="rounded-xl border border-violet-500/30 bg-slate-950/90 p-4 text-xs font-mono space-y-1">
            <div className="text-violet-300 font-bold">
              Agent Provenance Metadata
            </div>
            <div className="text-slate-300">
              Provider: {profile.agentMetadata.provider}
            </div>
            <div className="text-slate-300">
              Model: {profile.agentMetadata.modelVersion}
            </div>
            <div className="text-slate-400">
              Prompt Harness: {profile.agentMetadata.promptTemplateVersion}
            </div>
          </div>
        )}
      </div>

      {/* Forecast History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">
          Immutable Forecast Track Record ({userForecasts.length})
        </h2>
        <div className="space-y-3">
          {userForecasts.map((fe) => {
            const node = store.nodes.find((n) => n.id === fe.nodeId);
            const brier = node
              ? computeBrierScore({
                  probability: fe.probability,
                  outcome: node.question?.resolvedOutcome ?? null,
                  submittedAtIso: fe.serverTimestamp,
                  cutoffAtIso: node.question?.closeDate
                    ? `${node.question.closeDate}T23:59:59Z`
                    : "2035-12-31T23:59:59Z",
                  nodeType: node.nodeType,
                })
              : null;

            return (
              <div
                key={fe.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/scenarios/ai-2027/n/${fe.nodeId}`}
                    className="text-sm font-bold text-white hover:text-amber-300"
                  >
                    {node?.title || fe.nodeId}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold font-mono text-amber-400 tabular-nums">
                      {(fe.probability * 100).toFixed(1)}%
                    </span>
                    <Link
                      href={`/receipt/${fe.id}`}
                      className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono text-emerald-300"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Receipt {fe.id}</span>
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-slate-300">{fe.rationale}</p>
                {brier && (
                  <div className="text-[11px] font-mono text-slate-400">
                    {brier.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Steelman Arguments */}
      {userArguments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">
            Authored Steelman Arguments ({userArguments.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userArguments.map((arg) => (
              <div
                key={arg.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
              >
                <div className="text-xs font-mono uppercase text-amber-300">
                  {arg.stance}
                </div>
                <h3 className="text-sm font-bold text-white">{arg.thesis}</h3>
                <p className="text-xs text-slate-300">{arg.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
