import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getWorldview } from "@/lib/reputation-store";
import { absoluteUrl, apiPath } from "@/lib/paths";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

const SCENARIO_PATHS: Record<string, string> = {
  "ai-2027": "/scenarios/ai-2027",
  "ai-2040": "/scenarios/ai-2040",
  "ai-2050": "/scenarios/ai-2050",
  lev: "/lev",
  "nature-of-reality": "/scenarios/nature-of-reality",
};

export function generateMetadata({ params }: { params: { worldviewId: string } }): Metadata {
  const wv = getWorldview(params.worldviewId);
  if (!wv) return { title: "Worldview not found — FutureGraph" };
  const who = wv.ownerXHandle ? `@${wv.ownerXHandle}` : `@${wv.ownerHandle}`;
  const top = [...wv.outcomes].sort((a, b) => b.probability - a.probability)[0];
  const title = `${who}'s ${wv.scenarioTitle} worldview`;
  const description = top
    ? `Most likely: ${top.label} (${Math.round(top.probability * 100)}%). Map your own future on FutureGraph.`
    : "Map your own future on FutureGraph.";
  const image = absoluteUrl(`/api/og?mode=worldview&worldviewId=${encodeURIComponent(wv.id)}&aspect=16x9`);
  return {
    title,
    description,
    openGraph: { title, description, url: absoluteUrl(`/w/${wv.id}`), images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function WorldviewPage({ params }: { params: { worldviewId: string } }) {
  const wv = getWorldview(params.worldviewId);
  if (!wv) return notFound();
  const who = wv.ownerXHandle || wv.ownerHandle;
  const top = [...wv.outcomes].sort((a, b) => b.probability - a.probability);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
          {wv.scenarioTitle} · worldview snapshot
        </span>
        <ShareButton
          label="Share worldview"
          title="Share this worldview"
          mode="worldview"
          cardParams={{ worldviewId: wv.id }}
          sharePath={`/w/${wv.id}`}
          shareText={`My ${wv.scenarioTitle} worldview: ${top[0] ? `${top[0].label} ${Math.round(top[0].probability * 100)}%` : ""}. What's yours?`}
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white balance-heading">
        <Link href={`/u/${wv.ownerHandle}`} className="text-amber-300 hover:underline">
          @{who}
        </Link>
        : {wv.headline}
      </h1>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950" style={{ aspectRatio: "1200 / 630" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={apiPath(`/og?mode=worldview&worldviewId=${encodeURIComponent(wv.id)}&aspect=16x9`)}
          width={1200}
          height={630}
          alt={`${wv.scenarioTitle} worldview card for @${who}`}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </div>
      <ol className="space-y-2">
        {top.map((o, i) => (
          <li key={`${o.label}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm">
            <span className="text-slate-200">{o.label}</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">{Math.round(o.probability * 1000) / 10}%</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Link
          href={SCENARIO_PATHS[wv.scenarioSlug] || "/"}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
        >
          Map your own {wv.scenarioTitle} worldview
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link
          href={`/receipt/${wv.receiptId}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verify receipt
        </Link>
      </div>
      <p className="text-[11px] font-mono text-slate-500 break-all">
        Locked {wv.createdAt} UTC · payload SHA-256 {wv.payloadHash}. Worldviews are shareable snapshots and don&apos;t affect Reputation; scored calls are made on individual questions.
      </p>
    </div>
  );
}
