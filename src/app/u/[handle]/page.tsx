import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bot,
  ExternalLink,
  FlaskConical,
  GitFork,
  ShieldCheck,
  Trophy,
  User,
} from "lucide-react";
import {
  findForecastableNode,
  getAllForecasterRuns,
  getForecasterActor,
  getForecasterActors,
  getRunsForActor,
  getStore,
} from "@/lib/store";
import { computeGraphVarianceReport } from "@/lib/forecaster-engine";
import { getRegisteredGraph } from "@/lib/graph-registry";
import { computeBrierScore } from "@/lib/probability-engine";
import {
  getLedgerForHandle,
  getReputationState,
  getScorecard,
  getWorldviewsForHandle,
} from "@/lib/reputation-store";
import {
  ACCURACY_CATEGORIES,
  VERIFIED_MIN_RESOLVED_OVERALL,
  categoryLabel,
  formatSignedRp,
} from "@/lib/reputation-engine";
import { getSessionForecaster } from "@/lib/auth-session";
import { hasVerifiedX } from "@/lib/identity";
import { absoluteUrl, apiPath, getSiteOrigin, nodeForecastPath, withBasePath } from "@/lib/paths";
import { CopyTextButton, ShareButton } from "@/components/ShareButton";
import { XLogo } from "@/components/AuthContext";

export const dynamic = "force-dynamic";

function findProfile(handle: string) {
  getReputationState();
  return getStore().profiles.find((p) => p.handle === decodeURIComponent(handle)) || null;
}

export function generateMetadata({ params }: { params: { handle: string } }): Metadata {
  const profile = findProfile(params.handle);
  if (!profile) return { title: "Forecaster not found — FutureGraph" };
  const card = getScorecard(profile.handle);
  const who = profile.xHandle ? `@${profile.xHandle}` : `@${profile.handle}`;
  const title = card?.isVerified
    ? `${who} · ${card.overallRp.toLocaleString("en-US")} RP ${card.tierLabel} — Verified Forecaster`
    : `${who} — FutureGraph Forecaster`;
  const description = card
    ? `${card.wins} wins, ${card.losses} misses, ${card.activeCount} active calls. Every forecast is receipt-backed; misses can't be deleted.`
    : "Receipt-backed forecast track record on FutureGraph.";
  const image = absoluteUrl(`/api/og?mode=scorecard&handle=${encodeURIComponent(profile.handle)}&aspect=16x9`);
  return {
    title,
    description,
    openGraph: { title, description, url: absoluteUrl(`/u/${profile.handle}`), images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ForecasterProfilePage({ params }: { params: { handle: string } }) {
  const store = getStore();
  const profile = findProfile(params.handle);
  if (!profile) return notFound();

  const session = await getSessionForecaster();
  const isOwner = session?.profile.handle === profile.handle;
  const card = getScorecard(profile.handle);
  const ledger = getLedgerForHandle(profile.handle);
  const victories = ledger.filter((e) => e.rpDelta > 0);
  const worldviews = getWorldviewsForHandle(profile.handle);
  const verifiedX = hasVerifiedX(profile);
  const forecasterActor = getForecasterActor(profile.handle);
  const actorGraphRuns = getRunsForActor(profile.handle);
  const allActors = getForecasterActors();
  const allRuns = getAllForecasterRuns();

  const userForecasts = store.forecastEvents
    .filter((fe) => fe.forecasterHandle === profile.handle)
    .sort((a, b) => Date.parse(b.serverTimestamp) - Date.parse(a.serverTimestamp));
  const userArguments = store.arguments.filter((a) => a.authorHandle === profile.handle);

  const passportUrl = `${getSiteOrigin().replace(/^https?:\/\//, "")}${withBasePath(`/u/${profile.handle}`)}`;
  const topCategory = card?.categories
    .filter((c) => c.resolvedCount > 0)
    .sort((a, b) => b.reputationPoints - a.reputationPoints)[0];
  const bioSnippet = card?.isVerified
    ? `🔮 Verified forecaster: ${card.overallRp.toLocaleString("en-US")} RP${card.percentile !== null ? ` (top ${Math.max(1, 100 - card.percentile)}%` : " ("}${topCategory ? `${card.percentile !== null ? ", " : ""}best: ${ACCURACY_CATEGORIES.find((c) => c.id === topCategory.category)?.shortLabel}` : ""}) · ${passportUrl}`
    : `🔮 Forecasting on FutureGraph (${card?.resolvedCount ?? 0}/${VERIFIED_MIN_RESOLVED_OVERALL} resolved, ${card?.activeCount ?? 0} live calls) · ${passportUrl}`;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {profile.xAvatarUrl || profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.xAvatarUrl || profile.avatarUrl}
              alt=""
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-full border-2 border-amber-500/60"
            />
          ) : null}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {profile.participantType === "ai_agent" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/40 px-3 py-0.5 text-xs font-mono font-bold text-violet-300">
                  <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>AI FORECASTING AGENT</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-0.5 text-xs font-mono font-bold text-sky-300">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>HUMAN FORECASTER • {profile.role.toUpperCase()}</span>
                </span>
              )}
              {verifiedX && (
                <a
                  href={`https://x.com/${profile.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-950 px-2.5 py-0.5 text-xs font-semibold text-white"
                >
                  <XLogo className="h-3 w-3" />@{profile.xHandle} · verified via X OAuth
                </a>
              )}
              {profile.agifuturesLinked && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  AGIFutures.org member
                </span>
              )}
              {profile.isSandbox && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                  <FlaskConical className="h-3 w-3" aria-hidden="true" />
                  Sandbox / demo profile
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {profile.displayName} (@{profile.handle})
            </h1>
            <p className="text-sm text-slate-300">{profile.bio}</p>
            {profile.credentials && <p className="text-xs font-mono text-emerald-400">{profile.credentials}</p>}
          </div>
        </div>

        {card && (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4 min-w-[240px] space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Overall forecast accuracy</div>
            <div className="text-4xl font-extrabold font-mono text-white tabular-nums">
              {card.overallRp.toLocaleString("en-US")} <span className="text-base text-slate-400">RP</span>
            </div>
            <div className={`text-sm font-bold ${card.isVerified ? "text-emerald-300" : "text-amber-300"}`}>
              {card.isVerified ? `Verified · ${card.tierLabel}` : `Provisional · ${card.resolvedCount}/${VERIFIED_MIN_RESOLVED_OVERALL} resolved`}
              {card.percentile !== null && <span className="text-sky-300"> · top {Math.max(1, 100 - card.percentile)}%</span>}
            </div>
            <div className="text-xs text-slate-400 tabular-nums">
              {card.wins} wins · {card.losses} misses · {card.activeCount} active
              {card.avgBrier !== null && ` · Brier ${card.avgBrier.toFixed(3)}`}
            </div>
          </div>
        )}

        {profile.agentMetadata && (
          <div className="rounded-xl border border-violet-500/30 bg-slate-950/90 p-4 text-xs font-mono space-y-1">
            <div className="text-violet-300 font-bold">Agent Provenance Metadata</div>
            <div className="text-slate-300">Provider: {profile.agentMetadata.provider}</div>
            <div className="text-slate-300">Model: {profile.agentMetadata.modelVersion}</div>
            <div className="text-slate-400">Prompt Harness: {profile.agentMetadata.promptTemplateVersion}</div>
          </div>
        )}
      </div>

      {forecasterActor && (
        <section
          aria-labelledby="worldview-card-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2
                id="worldview-card-heading"
                className="text-lg font-extrabold text-white"
              >
                Worldview, Epistemic Priors &amp; Tuned Prompt
              </h2>
              <p className="text-xs text-slate-400">
                Explicit prior axes and causal axioms shaping @{forecasterActor.handle}&apos;s distributions across all FutureGraph atlases.
              </p>
            </div>
            <Link
              href="/agents?studio=1"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-colors"
            >
              <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Fork / Test in Agent Studio</span>
            </Link>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {forecasterActor.worldview.coreThesis}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            {forecasterActor.worldview.priorAxes.map((axis) => (
              <div key={axis.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold truncate">
                    {axis.shortLabel}
                  </span>
                  <span className="font-extrabold text-white tabular-nums">
                    {axis.score}/100
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${axis.score}%`,
                      backgroundColor: forecasterActor.worldview.accentColor,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{axis.lowLabel}</span>
                  <span>{axis.highLabel}</span>
                </div>
              </div>
            ))}
          </div>

          <details className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 group">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-xs font-bold text-slate-200">
              <span>
                Inspect Explicit Axioms ({forecasterActor.worldview.explicitAxioms.length}), Grounding Links &amp; Exact System Prompt
              </span>
              <span className="font-mono text-cyan-300 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="pt-3 mt-3 border-t border-slate-800 space-y-3 text-xs">
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                {forecasterActor.worldview.explicitAxioms.map((ax, idx) => (
                  <li key={idx}>{ax}</li>
                ))}
              </ul>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase text-slate-400">
                    Exact System Prompt / Instructions
                  </span>
                  <CopyTextButton
                    text={forecasterActor.worldview.systemPrompt}
                    label="Copy system prompt"
                    ariaLabel={`Copy system prompt for ${forecasterActor.displayName}`}
                  />
                </div>
                <pre
                  role="region"
                  aria-label={`System prompt for ${forecasterActor.displayName}`}
                  tabIndex={0}
                  className="max-h-48 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] font-mono text-slate-200 whitespace-pre-wrap"
                >
                  <code>{forecasterActor.worldview.systemPrompt}</code>
                </pre>
              </div>

              {forecasterActor.worldview.groundingLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {forecasterActor.worldview.groundingLinks.map((lnk) => (
                    <a
                      key={lnk.url}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-sky-300 hover:underline"
                    >
                      <span>{lnk.title}</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </details>
        </section>
      )}

      {actorGraphRuns.length > 0 && (
        <section
          aria-labelledby="graph-distributions-heading"
          className="space-y-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="graph-distributions-heading"
              className="text-lg font-bold text-white"
            >
              Full-Graph Forecast Distributions &amp; Variance vs. Crowd ({actorGraphRuns.length})
            </h2>
            <span className="text-xs text-slate-400">
              Click any atlas to open @{profile.handle}&apos;s full probability distribution with Δ vs. Crowd active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actorGraphRuns.map((run) => {
              const spec = getRegisteredGraph(run.graphId);
              if (!spec) return null;
              const variance = computeGraphVarianceReport(
                run.graphId,
                run,
                "all_ensemble",
                allActors,
                allRuns
              );
              const topDiffs = variance.rankedDivergences.slice(0, 3);

              return (
                <article
                  key={run.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono font-bold text-cyan-300">
                        {spec.domainBadge}
                      </span>
                      {run.receiptId && (
                        <Link
                          href={`/receipt/${run.receiptId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 hover:underline"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Receipt</span>
                        </Link>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      {spec.title}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {run.headlineSummary}
                    </p>

                    {topDiffs.length > 0 && (
                      <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Top Variance vs. Crowd Wisdom
                        </div>
                        {topDiffs.map((d) => {
                          const isLev = run.graphId === "lev";
                          const formattedDelta = isLev
                            ? `${d.signedDelta > 0 ? `+${d.signedDelta}` : d.signedDelta} yrs`
                            : `${d.signedDelta >= 0 ? `+${(d.signedDelta * 100).toFixed(1)}%` : `${(d.signedDelta * 100).toFixed(1)}%`}`;
                          return (
                            <div
                              key={d.nodeId}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-slate-300 truncate">
                                {d.label}
                              </span>
                              <span
                                className={`font-mono font-bold tabular-nums shrink-0 ${
                                  (isLev ? d.signedDelta <= 0 : d.signedDelta >= 0)
                                    ? "text-emerald-300"
                                    : "text-amber-300"
                                }`}
                              >
                                {isLev
                                  ? `${d.actorProb} (${formattedDelta})`
                                  : `${(d.actorProb * 100).toFixed(1)}% (${formattedDelta})`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Updated {run.submittedAt.slice(0, 10)}
                    </span>
                    <Link
                      href={`${spec.routeHref}?forecaster=${encodeURIComponent(
                        profile.handle
                      )}&variance=1`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline"
                    >
                      <span>Explore Full Graph &amp; Variance</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {isOwner && card && (
        <section aria-labelledby="kit-heading" className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 space-y-3">
          <h2 id="kit-heading" className="flex items-center gap-2 text-base font-bold text-white">
            <XLogo className="h-4 w-4" />
            Put your verified score on your X profile
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">1. Bio snippet + passport link</div>
              <p className="rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs font-mono text-slate-200 break-words">{bioSnippet}</p>
              <CopyTextButton text={bioSnippet} label="Copy bio snippet" ariaLabel="Copy X bio snippet" />
              <p className="text-[11px] text-slate-400">
                Anyone who taps the link sees your full receipt-backed record, misses included, so a fake score in a bio can&apos;t survive a click.
                {!verifiedX && " Link your X account (account menu → Connect X) to show the verified @handle badge."}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">2. Pin your Verified Scorecard</div>
              <div className="overflow-hidden rounded-lg border border-slate-700" style={{ aspectRatio: "1200 / 630" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={apiPath(`/og?mode=scorecard&handle=${encodeURIComponent(profile.handle)}&aspect=16x9`)}
                  width={1200}
                  height={630}
                  alt="Your verified scorecard preview"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <ShareButton
                label="Post / pin my scorecard"
                title="Share your Verified Scorecard"
                subtitle="Post it, then pin the post to your X profile."
                mode="scorecard"
                cardParams={{ handle: profile.handle }}
                sharePath={`/u/${profile.handle}`}
                shareText={
                  card.isVerified
                    ? `My verified forecast accuracy: ${card.overallRp.toLocaleString("en-US")} RP (${card.tierLabel}). Every call receipt-backed, every miss included:`
                    : `I'm building a verified forecasting track record. Every call is receipt-backed and every miss is included. Check my calls:`
                }
              />
            </div>
          </div>
        </section>
      )}

      {card && (
        <section aria-labelledby="cat-heading" className="space-y-3">
          <h2 id="cat-heading" className="text-lg font-bold text-white">Accuracy by category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {card.categories.map((cat) => {
              const meta = ACCURACY_CATEGORIES.find((c) => c.id === cat.category)!;
              return (
                <div key={cat.category} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: meta.color }}>
                      {cat.label}
                    </span>
                    <span className={`text-[11px] ${cat.isVerified ? "text-emerald-300" : "text-slate-400"}`}>
                      {cat.isVerified ? `Verified · ${cat.tier}` : `${cat.resolvedCount}/3 to verify`}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                    {cat.reputationPoints.toLocaleString("en-US")} <span className="text-xs text-slate-400">RP</span>
                  </div>
                  <div className="text-[11px] text-slate-400 tabular-nums">
                    {cat.resolvedCount} resolved · {cat.activeCount} active
                    {cat.avgBrier !== null && ` · Brier ${cat.avgBrier.toFixed(3)}`}
                    {cat.percentile !== null && ` · ${cat.percentile}th pct`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {victories.length > 0 && (
        <section aria-labelledby="victory-heading" className="space-y-3">
          <h2 id="victory-heading" className="flex items-center gap-2 text-lg font-bold text-white">
            <Trophy className="h-5 w-5 text-amber-400" aria-hidden="true" />
            &ldquo;Called It&rdquo; gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {victories.map((v) => {
              const mine = v.outcome === 1 ? v.originalProbability : 1 - v.originalProbability;
              const crowd = v.outcome === 1 ? v.originalCrowdProb : 1 - v.originalCrowdProb;
              return (
                <div key={v.id} className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {categoryLabel(v.category)}
                      {v.isSandboxDrill && " · sandbox drill"}
                      {v.isContrarianHit && <span className="text-amber-300"> · contrarian hit</span>}
                    </span>
                    <span className="font-mono font-bold text-emerald-300 tabular-nums">{formatSignedRp(v.rpDelta)}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{v.questionTitle}</div>
                  <div className="text-xs text-slate-300">
                    Called <span className="font-mono text-amber-300">{Math.round(mine * 100)}%</span> {v.outcome === 1 ? "YES" : "NO"} when the crowd said{" "}
                    <span className="font-mono text-sky-300">{Math.round(crowd * 100)}%</span> · locked {v.originalSubmittedAt.slice(0, 10)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isOwner ? (
                      <ShareButton
                        label="Quote-tweet victory card"
                        title="Called it — share your win"
                        mode="victory"
                        cardParams={{ eventId: v.originalEventId }}
                        sharePath={`/f/${v.originalEventId}`}
                        shareText={`Called it. I said ${Math.round(mine * 100)}% when the crowd said ${Math.round(crowd * 100)}%. ${formatSignedRp(v.rpDelta)} on my verified record:`}
                        attachEventId={v.originalEventId}
                      />
                    ) : null}
                    <Link href={`/f/${v.originalEventId}`} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200">
                      View receipt card
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {ledger.length > 0 && (
        <section aria-labelledby="ledger-heading" className="space-y-3">
          <h2 id="ledger-heading" className="text-lg font-bold text-white">Settled calls — wins and misses ({ledger.length})</h2>
          <div className="fg-table-container">
            <table className="fg-responsive-table text-left text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th scope="col" className="p-2.5">Question</th>
                  <th scope="col" className="p-2.5">Outcome</th>
                  <th scope="col" className="p-2.5">Call vs crowd</th>
                  <th scope="col" className="p-2.5">Wager</th>
                  <th scope="col" className="p-2.5">ΔRP</th>
                  <th scope="col" className="p-2.5">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {ledger.map((e) => (
                  <tr key={e.id} className="bg-slate-950/70">
                    <th scope="row" className="p-2.5 font-normal text-slate-200">
                      {e.questionTitle}
                      {e.isSandboxDrill && <span className="ml-1 text-[10px] text-slate-500">(sandbox)</span>}
                    </th>
                    <td className="p-2.5 font-mono">{e.outcome === 1 ? "YES" : "NO"}</td>
                    <td className="p-2.5 font-mono tabular-nums">
                      {Math.round(e.originalProbability * 100)}% vs {Math.round(e.originalCrowdProb * 100)}%
                      {e.revisionCount > 1 && <span className="text-slate-500"> ({e.revisionCount} revisions)</span>}
                    </td>
                    <td className="p-2.5 font-mono tabular-nums">{e.originalConfidence}×</td>
                    <td className={`p-2.5 font-mono font-bold tabular-nums ${e.rpDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {formatSignedRp(e.rpDelta)}
                    </td>
                    <td className="p-2.5">
                      <Link href={`/receipt/${e.resolutionReceiptId}`} className="text-emerald-300 hover:underline">
                        {e.resolutionReceiptId}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {worldviews.length > 0 && (
        <section aria-labelledby="wv-heading" className="space-y-2">
          <h2 id="wv-heading" className="text-lg font-bold text-white">Worldview snapshots</h2>
          <div className="flex flex-wrap gap-2">
            {worldviews.map((w) => (
              <Link key={w.id} href={`/w/${w.id}`} className="rounded-xl border border-violet-500/30 bg-violet-950/20 px-3 py-2 text-xs text-violet-200 hover:border-violet-400/60">
                {w.scenarioTitle}: {w.headline}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Forecast History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">
          Immutable Forecast Track Record ({userForecasts.length})
        </h2>
        <div className="space-y-3">
          {userForecasts.map((fe) => {
            const node = findForecastableNode(fe.nodeId);
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
                    href={node ? nodeForecastPath(node) : "/"}
                    className="text-sm font-bold text-white hover:text-amber-300"
                  >
                    {node?.title || fe.nodeId}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold font-mono text-amber-400 tabular-nums">
                      {(fe.probability * 100).toFixed(1)}%
                    </span>
                    {typeof fe.crowdProbSnapshot === "number" && (
                      <span className="text-xs font-mono text-sky-300 tabular-nums">
                        crowd {(fe.crowdProbSnapshot * 100).toFixed(0)}%
                      </span>
                    )}
                    <Link
                      href={`/f/${fe.id}`}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-mono text-amber-300"
                    >
                      Card
                    </Link>
                    <Link
                      href={`/receipt/${fe.id}`}
                      className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono text-emerald-300"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
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
            Authored &amp; Cited Arguments ({userArguments.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userArguments.map((arg) => {
              const argNode = store.nodes.find((n) => n.id === arg.nodeId);
              return (
                <div
                  key={arg.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase text-amber-300">
                        {arg.stance}
                      </span>
                      {arg.externalPlatform && (
                        <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                          {arg.externalPlatform}
                        </span>
                      )}
                      {arg.externalUpvotes !== undefined && (
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 tabular-nums">
                          ▲ {arg.externalUpvotes}
                        </span>
                      )}
                    </div>
                    {arg.externalSourceUrl && (
                      <a
                        href={arg.externalSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/25"
                      >
                        <span>Original Source</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  {argNode && (
                    <Link
                      href={nodeForecastPath(argNode)}
                      className="block text-xs font-mono text-sky-400 hover:underline"
                    >
                      Node: {argNode.title}
                    </Link>
                  )}
                  <h3 className="text-sm font-bold text-white">{arg.thesis}</h3>
                  <p className="text-xs text-slate-300">{arg.reasoning}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
