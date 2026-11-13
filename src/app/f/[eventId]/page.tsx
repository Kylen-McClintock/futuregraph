import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, ShieldCheck, Swords, Trophy } from "lucide-react";
import { findForecastableNode, getStore } from "@/lib/store";
import { getLedgerEntryForEvent, getReputationState, getSocialLink } from "@/lib/reputation-store";
import {
  categoryColor,
  categoryLabel,
  classifyNodeCategory,
  confidenceLabel,
  formatSignedRp,
  isNodeScorable,
} from "@/lib/reputation-engine";
import { absoluteUrl, apiPath, nodeForecastPath } from "@/lib/paths";
import { hasVerifiedX } from "@/lib/identity";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

function load(eventId: string) {
  getReputationState();
  const store = getStore();
  const event = store.forecastEvents.find((e) => e.id === eventId);
  if (!event) return null;
  const node = findForecastableNode(event.nodeId);
  if (!node) return null;
  const profile = store.profiles.find((p) => p.handle === event.forecasterHandle) || null;
  const settlement = getLedgerEntryForEvent(event.id);
  return { event, node, profile, settlement };
}

export function generateMetadata({ params }: { params: { eventId: string } }): Metadata {
  const data = load(params.eventId);
  if (!data) return { title: "Forecast not found — FutureGraph" };
  const { event, node, profile, settlement } = data;
  const who = profile?.xHandle ? `@${profile.xHandle}` : `@${event.forecasterHandle}`;
  const won = settlement && settlement.rpDelta > 0;
  const mode = won ? "victory" : "forecast";
  const image = absoluteUrl(`/api/og?mode=${mode}&eventId=${encodeURIComponent(event.id)}&aspect=16x9`);
  const title = won
    ? `${who} called it: ${Math.round(event.probability * 100)}% on "${node.title.slice(0, 70)}"`
    : `${who} is calling ${Math.round(event.probability * 100)}% on "${node.title.slice(0, 80)}"`;
  const description =
    typeof event.crowdProbSnapshot === "number"
      ? `Crowd said ${Math.round(event.crowdProbSnapshot * 100)}%. Locked in with a tamper-evident SHA-256 receipt on FutureGraph. Make your counter-call.`
      : "Locked in with a tamper-evident SHA-256 receipt on FutureGraph. Make your counter-call.";
  return {
    title,
    description,
    openGraph: { title, description, url: absoluteUrl(`/f/${event.id}`), images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function ForecastReceiptPage({ params }: { params: { eventId: string } }) {
  const data = load(params.eventId);
  if (!data) return notFound();
  const { event, node, profile, settlement } = data;
  const category = event.accuracyCategory || classifyNodeCategory(node);
  const scorable = isNodeScorable(node);
  const resolved = node.question?.resolvedOutcome === 0 || node.question?.resolvedOutcome === 1;
  const won = Boolean(settlement && settlement.rpDelta > 0);
  const social = getSocialLink(event.id);
  const who = profile?.xHandle || event.forecasterHandle;
  const cardMode = won ? "victory" : "forecast";
  const shareText = won
    ? `Called it. I said ${Math.round((settlement!.outcome === 1 ? settlement!.originalProbability : 1 - settlement!.originalProbability) * 100)}% when the crowd said ${Math.round((settlement!.outcome === 1 ? settlement!.originalCrowdProb : 1 - settlement!.originalCrowdProb) * 100)}%. ${formatSignedRp(settlement!.rpDelta)} on my verified FutureGraph record:`
    : `I'm calling ${Math.round(event.probability * 100)}% on: ${node.title.slice(0, 120)}. Locked in with a tamper-evident receipt. Make your counter-call:`;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ color: categoryColor(category), borderColor: `${categoryColor(category)}66` }}
          >
            {categoryLabel(category)}
          </span>
          {resolved ? (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${won ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
              Resolved {node.question?.resolvedOutcome === 1 ? "YES" : "NO"}
              {settlement ? ` · ${formatSignedRp(settlement.rpDelta)}` : ""}
            </span>
          ) : (
            <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">Open · closes {node.question?.closeDate}</span>
          )}
          {node.question?.isSandboxDrill && (
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300">Sandbox calibration drill</span>
          )}
        </div>
        <ShareButton
          label={won ? "Share “Called It” card" : "Share this forecast"}
          title={won ? "Called it — share your win" : "Share this forecast"}
          mode={cardMode}
          cardParams={{ eventId: event.id }}
          sharePath={`/f/${event.id}`}
          shareText={shareText}
          attachEventId={event.id}
        />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white balance-heading">
        <Link href={`/u/${event.forecasterHandle}`} className="text-amber-300 hover:underline">
          @{who}
        </Link>{" "}
        {won ? "called it" : "is calling"} {Math.round(event.probability * 100)}% on: {node.title}
      </h1>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950" style={{ aspectRatio: "1200 / 630" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={apiPath(`/og?mode=${cardMode}&eventId=${encodeURIComponent(event.id)}&aspect=16x9`)}
          width={1200}
          height={630}
          alt={`${won ? "Called It" : "Forecast"} card for @${who}`}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Their call</div>
          <div className="text-3xl font-extrabold font-mono text-amber-300 tabular-nums">{Math.round(event.probability * 100)}%</div>
          <div className="text-xs text-slate-400">
            {(event.confidenceMultiplier ?? 1).toFixed(2)}× {confidenceLabel(event.confidenceMultiplier ?? 1)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Crowd at lock-in</div>
          <div className="text-3xl font-extrabold font-mono text-sky-300 tabular-nums">
            {typeof event.crowdProbSnapshot === "number" ? `${Math.round(event.crowdProbSnapshot * 100)}%` : "—"}
          </div>
          <div className="text-xs text-slate-400">Sealed in the SHA-256 payload</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">{settlement ? "Settled" : "Reputation at stake"}</div>
          {settlement ? (
            <div className={`text-3xl font-extrabold font-mono tabular-nums ${settlement.rpDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {formatSignedRp(settlement.rpDelta)}
            </div>
          ) : scorable && typeof event.projectedRpIfYes === "number" ? (
            <div className="text-sm font-mono tabular-nums pt-2">
              <span className="text-emerald-300">YES {formatSignedRp(event.projectedRpIfYes)}</span>
              <br />
              <span className="text-rose-300">NO {formatSignedRp(event.projectedRpIfNo ?? 0)}</span>
            </div>
          ) : (
            <div className="text-sm text-slate-400 pt-2">Unscored milestone</div>
          )}
        </div>
      </div>

      <blockquote className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-200">
        “{event.rationale}”
      </blockquote>

      <div className="flex flex-wrap items-center gap-2">
        {!resolved && (
          <Link
            href={`${nodeForecastPath(node)}?challenge=${encodeURIComponent(event.id)}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            Think they&apos;re wrong? Make your counter-call
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
        <Link
          href={`/receipt/${event.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verify receipt
        </Link>
        <Link
          href={`/u/${event.forecasterHandle}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          @{who}&apos;s track record
        </Link>
        {social && (
          <a
            href={social.xPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300"
          >
            Original X post
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      <p className="text-[11px] font-mono text-slate-500 break-all">
        Locked {event.serverTimestamp} UTC · payload SHA-256 {event.payloadHash} · {profile && hasVerifiedX(profile) ? "X identity verified via OAuth" : "identity: FutureGraph account"}
      </p>
    </div>
  );
}
