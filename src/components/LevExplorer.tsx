"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Check,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  Mail,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  COHORT_PACE_PROFILES,
  LEV_EXPERT_PREDICTIONS,
  LEV_PREDICTION_MARKETS,
  LEVL_TRAJECTORY_REFERENCE,
} from "@/data/lev-seed";
import {
  computeLevDashboard,
  ConservativeUpdateMode,
  formatDecimalYear,
} from "@/lib/lev-engine";

export interface LevExplorerProps {
  isEmbed?: boolean;
  initialTheme?: "dark" | "light";
  initialView?: "all" | "hero" | "pace" | "markets" | "pulse";
  initialAge?: number;
  initialMode?: ConservativeUpdateMode;
  initialDetail?: "full" | "minimal";
  initialShowPulse?: boolean;
}

export function LevExplorer({
  isEmbed = false,
  initialTheme,
  initialView = "all",
  initialAge = 35,
  initialMode = "conservative",
  initialDetail = "full",
  initialShowPulse = false,
}: LevExplorerProps) {
  const [updateMode, setUpdateMode] = useState<ConservativeUpdateMode>(initialMode);
  const [currentAge, setCurrentAge] = useState<number>(initialAge);
  const [selectedPulseIdx, setSelectedPulseIdx] = useState<number>(0);
  const isMinimal = initialDetail === "minimal";
  const [chartTab, setChartTab] = useState<"velocity" | "alive_healthy" | "speedometer">(
    "velocity"
  );
  const [expertFilter, setExpertFilter] = useState<string>("all");

  // Custom aggregation weights (default 40% markets, 35% experts, 25% trajectory intercept)
  const [marketsWeightPct, setMarketsWeightPct] = useState<number>(40);
  const [expertsWeightPct, setExpertsWeightPct] = useState<number>(35);
  const [trajectoryWeightPct, setTrajectoryWeightPct] = useState<number>(25);

  // Embed studio controls
  const [embedTab, setEmbedTab] = useState<"newsletter" | "iframe" | "script" | "api">(
    "newsletter"
  );
  const [embedTheme, setEmbedTheme] = useState<"dark" | "light">("light");
  const [embedVariant, setEmbedVariant] = useState<"full" | "pace">("full");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hostOrigin, setHostOrigin] = useState<string>(
    "https://futuregraph-beta.vercel.app"
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setHostOrigin(window.location.origin);
    }
  }, []);

  // Modern Web Guidance: dark-mode iframe theme handling (explicit query param + postMessage protocol)
  useEffect(() => {
    if (!isEmbed) return;
    const applyEmbedTheme = (mode: "dark" | "light") => {
      document.documentElement.classList.toggle("light", mode === "light");
      document.documentElement.classList.toggle("dark", mode === "dark");
      const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="color-scheme"]'
      );
      if (meta) meta.content = mode;
    };
    if (initialTheme) {
      applyEmbedTheme(initialTheme);
    }
    const onMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "fg-lev-embed-theme" &&
        (event.data.theme === "light" || event.data.theme === "dark")
      ) {
        applyEmbedTheme(event.data.theme);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isEmbed, initialTheme]);

  // Auto-resize notification for parent host pages when embedded
  useEffect(() => {
    if (!isEmbed || typeof window === "undefined") return;
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent?.postMessage({ type: "fg-lev-embed-resize", height }, "*");
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [isEmbed, chartTab, expertFilter, updateMode]);

  const dashboard = useMemo(() => {
    return computeLevDashboard({
      referenceDate: new Date(),
      updateMode,
      currentChronologicalAge: currentAge,
      weights: {
        marketsWeight: marketsWeightPct / 100,
        expertsWeight: expertsWeightPct / 100,
        trajectoryWeight: trajectoryWeightPct / 100,
      },
    });
  }, [
    updateMode,
    currentAge,
    marketsWeightPct,
    expertsWeightPct,
    trajectoryWeightPct,
  ]);

  const filteredExperts = useMemo(() => {
    if (expertFilter === "all") return LEV_EXPERT_PREDICTIONS;
    return LEV_EXPERT_PREDICTIONS.filter((e) => e.category === expertFilter);
  }, [expertFilter]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Fallback
    }
  };

  // SVG coordinate helper for the interactive Trajectory Chart (viewBox 920 x 360)
  const chartGeometry = useMemo(() => {
    const padL = 64;
    const padR = 28;
    const padT = 26;
    const padB = 42;
    const W = 920;
    const H = 360;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const minYr = 2026;
    const maxYr = 2060;
    const xOf = (yr: number) =>
      Math.round((padL + ((yr - minYr) / (maxYr - minYr)) * plotW) * 10) / 10;

    if (chartTab === "alive_healthy") {
      const minPct = 0;
      const maxPct = 100;
      const yOf = (pct: number) =>
        Math.round(
          (padT + ((maxPct - Math.max(minPct, Math.min(maxPct, pct))) / 100) * plotH) *
            10
        ) / 10;

      const p99Line = dashboard.trajectorySeries
        .map((d) => `${xOf(d.year)},${yOf(d.p99AliveHealthyPct)}`)
        .join(" ");
      const p80Line = dashboard.trajectorySeries
        .map((d) => `${xOf(d.year)},${yOf(d.p80AliveHealthyPct)}`)
        .join(" ");
      const p50Line = dashboard.trajectorySeries
        .map((d) => `${xOf(d.year)},${yOf(d.p50AliveHealthyPct)}`)
        .join(" ");

      return {
        W,
        H,
        padL,
        padR,
        padT,
        padB,
        plotW,
        plotH,
        xOf,
        yOf,
        zeroY: yOf(50),
        p99Line,
        p80Line,
        p50Line,
        p99IntrinsicLine: "",
        p80IntrinsicLine: "",
        cone99Polygon: "",
        cone80Polygon: "",
      };
    }

    // Default "velocity" mode: Net Biological Aging Rate (-0.25 to 1.10 bio-yr/yr)
    const minPoA = -0.25;
    const maxPoA = 1.1;
    const yOf = (poa: number) => {
      const c = Math.max(minPoA, Math.min(maxPoA, poa));
      return (
        Math.round((padT + ((maxPoA - c) / (maxPoA - minPoA)) * plotH) * 10) / 10
      );
    };

    const zeroY = yOf(0.0);
    const p99Line = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p99NetPoA)}`)
      .join(" ");
    const p80Line = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p80NetPoA)}`)
      .join(" ");
    const p50Line = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p50NetPoA)}`)
      .join(" ");

    const p99IntrinsicLine = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p99IntrinsicPoA)}`)
      .join(" ");
    const p80IntrinsicLine = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p80IntrinsicPoA)}`)
      .join(" ");

    const cone99Upper = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p99ConeSlow95th)}`)
      .join(" ");
    const cone99Lower = [...dashboard.trajectorySeries]
      .reverse()
      .map((d) => `${xOf(d.year)},${yOf(d.p99ConeFast5th)}`)
      .join(" ");

    const cone80Upper = dashboard.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p80ConeSlow95th)}`)
      .join(" ");
    const cone80Lower = [...dashboard.trajectorySeries]
      .reverse()
      .map((d) => `${xOf(d.year)},${yOf(d.p80ConeFast5th)}`)
      .join(" ");

    return {
      W,
      H,
      padL,
      padR,
      padT,
      padB,
      plotW,
      plotH,
      xOf,
      yOf,
      zeroY,
      p99Line,
      p80Line,
      p50Line,
      p99IntrinsicLine,
      p80IntrinsicLine,
      cone99Polygon: `${cone99Upper} ${cone99Lower}`,
      cone80Polygon: `${cone80Upper} ${cone80Lower}`,
    };
  }, [dashboard, chartTab]);

  // Pre-built embed snippets for Newsletter & Website Studio
  const svgCardUrl = `${hostOrigin}/api/embed/lev-card?theme=${embedTheme}&variant=${embedVariant}&age=${currentAge}&mode=${updateMode}`;
  const iframeEmbedUrl = `${hostOrigin}/embed/lev?theme=${embedTheme}&view=all&age=${currentAge}&mode=${updateMode}`;
  const scriptEmbedUrl = `${hostOrigin}/api/embed/lev-script`;

  const newsletterLinkedImageHtml = `<!-- Dynamic LEV 99th-Percentile & Pace of Aging Graphic (Auto-updates conservatively; works in Substack, Beehiiv, ConvertKit, Ghost) -->
<figure style="margin: 24px 0; text-align: center;">
  <a href="https://www.levlhealth.com/LEVTrajectory/" target="_blank" rel="noopener noreferrer" style="display: inline-block; text-decoration: none;">
    <img
      src="${svgCardUrl}"
      alt="99th Percentile Human LEV Date (${dashboard.aggregate99thFormatted}) and Dynamic Pace of Aging: 99th Percentile = ${dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr, 80th Percentile = ${dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr"
      width="100%"
      style="max-width: 720px; height: auto; border-radius: 14px; border: 1px solid #cbd5e1; display: block;"
    />
  </a>
  <figcaption style="margin-top: 8px; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #64748b;">
    Live Conservative Aggregate: <strong>99th-Pct LEV = ${dashboard.aggregate99thFormatted} (${dashboard.aggregate99thYear})</strong> • 99th-Pct Pace of Aging: <strong>${dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr</strong> • 80th-Pct: <strong>${dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr</strong>. Model tied to <a href="https://www.levlhealth.com/LEVTrajectory/" target="_blank" rel="noopener noreferrer" style="color: #047857; font-weight: 600;">levlhealth.com/LEVTrajectory</a>.
  </figcaption>
</figure>`;

  const newsletterMarkdownSnippet = `[![99th Percentile Human LEV Aggregate (${dashboard.aggregate99thFormatted}) & Dynamic Pace of Aging Tracker](${svgCardUrl})](https://www.levlhealth.com/LEVTrajectory/)
*Live Conservative Aggregate: **99th-Percentile Human LEV = ${dashboard.aggregate99thFormatted} (${dashboard.aggregate99thYear})** (IQR: ${dashboard.cone99th.p25Formatted}–${dashboard.cone99th.p75Formatted}) | Current Pace of Aging: **99th Pct = ${dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} bio-yr/yr**, **80th Pct = ${dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} bio-yr/yr** — [Explore your personal trajectory at levlhealth.com/LEVTrajectory](https://www.levlhealth.com/LEVTrajectory/)*`;

  const emailTableHtmlSnippet = `<!-- Email-Safe Inline Table + Live Dynamic Chart Card for Newsletters -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 20px auto; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #0f172a;">
  <tr>
    <td style="padding: 18px 20px; background-color: #0f172a; color: #f8fafc;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: #10b981; text-transform: uppercase;">Longevity Escape Velocity (LEV) &amp; Pace of Aging Tracker</div>
      <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">99th-Percentile Human LEV: <span style="color: #10b981;">${dashboard.aggregate99thFormatted} (${dashboard.aggregate99thYear})</span></div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Aggregating Metaculus #6592, Manifold Markets, 10 Notable Experts &amp; LEVL Health Trajectory</div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0;">
      <a href="https://www.levlhealth.com/LEVTrajectory/" target="_blank" rel="noopener noreferrer">
        <img src="${svgCardUrl}" alt="LEV Trajectory &amp; Pace of Aging Chart" width="680" style="width: 100%; max-width: 680px; height: auto; display: block; border: 0;" />
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding: 14px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
      <strong>Current Pace of Aging (Conservative Update):</strong> 99th Pct = <strong>${dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr</strong> (+${dashboard.cohorts.p99.daysGainedPerYear}d/yr banked) • 80th Pct = <strong>${dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr</strong> (+${dashboard.cohorts.p80.daysGainedPerYear}d/yr banked).
      <a href="https://www.levlhealth.com/LEVTrajectory/" target="_blank" rel="noopener noreferrer" style="color: #047857; font-weight: 700; margin-left: 6px;">Calculate your LEV Trajectory →</a>
    </td>
  </tr>
</table>`;

  const websiteIframeSnippet = `<iframe
  title="Longevity Escape Velocity (LEV) 99th Percentile Aggregate & Dynamic Pace of Aging Tracker"
  src="${iframeEmbedUrl}"
  width="100%"
  height="820"
  style="border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 16px; max-width: 1120px; display: block; margin: 0 auto;"
  loading="lazy"
></iframe>`;

  const websiteScriptSnippet = `<script
  async
  src="${scriptEmbedUrl}"
  data-theme="${embedTheme}"
  data-view="all"
  data-age="${currentAge}"
  data-mode="${updateMode}"
></script>`;

  const ageSliderPct = Math.round(((currentAge - 18) / (85 - 18)) * 100);

  return (
    <div
      className={`mx-auto ${
        isEmbed ? "max-w-[1140px] px-3 py-4" : "max-w-[1520px] px-4 py-7"
      } space-y-6`}
    >
      {/* Top Hero Banner (Hidden only when embedding standalone pulse view) */}
      {initialView !== "pulse" && (
      <header className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-emerald-950/30 p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-mono font-bold text-emerald-300">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>LONGEVITY ESCAPE VELOCITY (LEV) &amp; PACE OF AGING OBSERVATORY</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 text-[11px] font-mono text-sky-300 tabular-nums">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>Conservative Bayesian Update: {dashboard.asOfDateFormatted}</span>
            </span>
            {dashboard.latestWeeklyPulse && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/35 px-2.5 py-1 text-[11px] font-mono font-semibold text-violet-300 tabular-nums">
                <span>
                  This Week: {dashboard.latestWeeklyPulse.netWeeklyDelta.days99thLevShift}d LEV shift •{" "}
                  {dashboard.latestWeeklyPulse.netWeeklyDelta.poa99thShift} yr/yr PoA
                </span>
              </span>
            )}
          </div>

          <a
            href={LEVL_TRAJECTORY_REFERENCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
          >
            <span>Tied to LEVL Health: levlhealth.com/LEVTrajectory</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Primary Headline: 99th Percentile Human LEV Aggregate Date */}
          <div className={`${isMinimal ? "lg:col-span-6" : "lg:col-span-5"} rounded-2xl border-2 border-emerald-500/50 bg-slate-950/85 p-5 flex flex-col justify-between space-y-4`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Aggregate 99th-Percentile Human LEV Date
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-300 tabular-nums">
                  {dashboard.cohorts.p99.yearsToLev} yrs away
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
                {dashboard.aggregate99thFormatted}{" "}
                <span className="text-xl sm:text-2xl font-mono text-emerald-400">
                  ({dashboard.aggregate99thYear})
                </span>
              </h1>
              <p className="text-xs text-slate-300 pretty-copy">
                When a{" "}
                <strong className="text-emerald-300">
                  99th-percentile longevity-optimized human
                </strong>{" "}
                (top 1% biological Pace of Aging + early frontier therapy access)
                crosses{" "}
                <strong className="text-white">
                  &ge;1.0 year of healthy life expectancy gained per calendar year
                </strong>
                .
              </p>
            </div>

            {/* Sub-aggregate breakdown pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
                <div className="text-[10px] font-mono uppercase text-sky-300">
                  Markets ({Math.round(dashboard.weights.marketsWeight * 100)}%)
                </div>
                <div className="text-sm font-mono font-bold text-white tabular-nums">
                  {dashboard.marketAggregate99thYear}
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
                <div className="text-[10px] font-mono uppercase text-violet-300">
                  Experts ({Math.round(dashboard.weights.expertsWeight * 100)}%)
                </div>
                <div className="text-sm font-mono font-bold text-white tabular-nums">
                  {dashboard.expertAggregate99thYear}
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
                <div className="text-[10px] font-mono uppercase text-emerald-300">
                  PoA Intercept ({Math.round(dashboard.weights.trajectoryWeight * 100)}%)
                </div>
                <div className="text-sm font-mono font-bold text-white tabular-nums">
                  {dashboard.trajectoryIntercept99thYear}
                </div>
              </div>
            </div>

            {/* Cone of Uncertainty Bar */}
            <div className="rounded-xl bg-slate-900/70 border border-slate-800/90 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  99th-Pct Cohort Cone of Uncertainty:
                </span>
                <span className="text-emerald-300 font-bold tabular-nums">
                  IQR: {dashboard.cone99th.p25Formatted} –{" "}
                  {dashboard.cone99th.p75Formatted}
                </span>
              </div>
              {!isMinimal && (
                <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono tabular-nums">
                  <div className="rounded bg-slate-950 px-2 py-1 border border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">P10 (Fast AI)</span>
                    <span className="text-emerald-300 font-bold">
                      {dashboard.cone99th.p10Year}
                    </span>
                  </div>
                  <div className="rounded bg-slate-950 px-2 py-1 border border-emerald-500/40">
                    <span className="text-slate-400 block text-[9px]">P50 Median</span>
                    <span className="text-white font-bold">
                      {dashboard.cone99th.p50Year}
                    </span>
                  </div>
                  <div className="rounded bg-slate-950 px-2 py-1 border border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">P90 (Slow)</span>
                    <span className="text-amber-300 font-bold">
                      {dashboard.cone99th.p90Year}
                    </span>
                  </div>
                  <div className="rounded bg-slate-950 px-2 py-1 border border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">P99 Tail Bound</span>
                    <span className="text-sky-300 font-bold">
                      {dashboard.cone99th.p99TailConfidenceYear}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Columns: Live Conservative Pace of Aging Cards (99th vs 80th vs optional 50th Percentile) */}
          <div className={`${isMinimal ? "lg:col-span-6 grid grid-cols-1 sm:grid-cols-2" : "lg:col-span-7 grid grid-cols-1 sm:grid-cols-3"} gap-3.5`}>
            {/* Card 1: 99th Percentile Pace of Aging */}
            <div className="fg-card-size-container">
              <article className="h-full rounded-2xl border border-emerald-500/45 bg-slate-950/80 p-4 flex flex-col justify-between space-y-3">
                <header className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-emerald-300">
                      99th Percentile
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Top 1% Human
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    Current Pace of Aging (99th Pct)
                  </h2>
                </header>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-400 tabular-nums">
                      {dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      bio-yrs / yr
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Ages{" "}
                    <strong className="text-white tabular-nums">
                      {dashboard.cohorts.p99.bioMonthsPerYear} bio-months
                    </strong>{" "}
                    per 12 calendar months — banking{" "}
                    <strong className="text-emerald-300 tabular-nums">
                      +{dashboard.cohorts.p99.daysGainedPerYear} days/yr
                    </strong>{" "}
                    of healthy runway today.
                  </p>
                  {!isMinimal && (
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-[11px] space-y-1 font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Raw Leaderboard Ref:</span>
                        <span className="text-slate-300">~0.56 yr/yr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Conservative Shrinkage:</span>
                        <span className="text-emerald-300 font-bold">
                          {dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(3)} yr/yr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Annual Protocol Drift:</span>
                        <span className="text-emerald-300">
                          -{dashboard.cohorts.p99.annualConservativeDrift.toFixed(3)}/yr
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-300 font-bold">LEV Intercept:</span>
                        <span className="text-emerald-400 font-bold">
                          {dashboard.aggregate99thFormatted}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/70">
                  <span>{isMinimal ? "LEV Intercept:" : `Bio-Age at LEV (Age ${currentAge}):`}</span>
                  <strong className="font-mono text-emerald-300 tabular-nums">
                    {isMinimal ? dashboard.aggregate99thFormatted : `~${dashboard.cohorts.p99.biologicalAgeAtLev} yrs`}
                  </strong>
                </footer>
              </article>
            </div>

            {/* Card 2: 80th Percentile Pace of Aging */}
            <div className="fg-card-size-container">
              <article className="h-full rounded-2xl border border-sky-500/45 bg-slate-950/80 p-4 flex flex-col justify-between space-y-3">
                <header className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-sky-300">
                      80th Percentile
                    </span>
                    <span className="text-[11px] font-mono text-sky-400 font-bold">
                      Top 20% Human
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    Current Pace of Aging (80th Pct)
                  </h2>
                </header>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-mono font-extrabold text-sky-400 tabular-nums">
                      {dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      bio-yrs / yr
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Ages{" "}
                    <strong className="text-white tabular-nums">
                      {dashboard.cohorts.p80.bioMonthsPerYear} bio-months
                    </strong>{" "}
                    per 12 calendar months — banking{" "}
                    <strong className="text-sky-300 tabular-nums">
                      +{dashboard.cohorts.p80.daysGainedPerYear} days/yr
                    </strong>{" "}
                    of healthy runway today.
                  </p>
                  {!isMinimal && (
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-[11px] space-y-1 font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-400">DunedinPACE Z=-0.84:</span>
                        <span className="text-slate-300">~0.81–0.88 yr/yr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Conservative Estimate:</span>
                        <span className="text-sky-300 font-bold">
                          {dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(3)} yr/yr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Annual Protocol Drift:</span>
                        <span className="text-sky-300">
                          -{dashboard.cohorts.p80.annualConservativeDrift.toFixed(3)}/yr
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-300 font-bold">LEV Intercept:</span>
                        <span className="text-sky-400 font-bold">
                          {dashboard.aggregate80thFormatted}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/70">
                  <span>{isMinimal ? "LEV Intercept:" : `Bio-Age at LEV (Age ${currentAge}):`}</span>
                  <strong className="font-mono text-sky-300 tabular-nums">
                    {isMinimal ? dashboard.aggregate80thFormatted : `~${dashboard.cohorts.p80.biologicalAgeAtLev} yrs`}
                  </strong>
                </footer>
              </article>
            </div>

            {/* Card 3: 50th Percentile Status Quo Baseline (Hidden in minimal detail mode) */}
            {!isMinimal && (
              <div className="fg-card-size-container">
                <article className="h-full rounded-2xl border border-amber-500/35 border-dashed bg-slate-950/80 p-4 flex flex-col justify-between space-y-3">
                  <header className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-amber-300">
                        50th Percentile
                      </span>
                      <span className="text-[11px] font-mono text-amber-300 font-bold">
                        Status Quo
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-white">
                      Population Mean (Status Quo)
                    </h2>
                  </header>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-mono font-extrabold text-amber-400 tabular-nums">
                        {dashboard.cohorts.p50.intrinsicPaceOfAging.toFixed(2)}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        bio-yrs / yr
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Ages{" "}
                      <strong className="text-white tabular-nums">
                        12.0 bio-months
                      </strong>{" "}
                      per 12 calendar months — standard population actuarial curve
                      tracked by Metaculus #6592.
                    </p>
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-[11px] space-y-1 font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Population Mean (μ):</span>
                        <span className="text-slate-300">1.000 yr/yr (SD 0.10)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Metaculus #6592 Med:</span>
                        <span className="text-amber-300 font-bold">Nov 2053</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lag Behind 99th Pct:</span>
                        <span className="text-amber-300">
                          +
                          {(
                            dashboard.aggregate50thYear - dashboard.aggregate99thYear
                          ).toFixed(1)}{" "}
                          yrs
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-300 font-bold">LEV Intercept:</span>
                        <span className="text-amber-400 font-bold">
                          {dashboard.aggregate50thFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  <footer className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/70">
                    <span>Bio-Age at LEV (Age {currentAge}):</span>
                    <strong className="font-mono text-amber-300 tabular-nums">
                      ~{dashboard.cohorts.p50.biologicalAgeAtLev} yrs
                    </strong>
                  </footer>
                </article>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* BI-DIRECTIONAL WEEKLY NEWSLETTER PULSE & BREAKTHROUGH FEED */}
      {(initialView === "all" || initialView === "pulse" || initialShowPulse) &&
        dashboard.weeklyPulses.length > 0 && (() => {
          const activePulse =
            dashboard.weeklyPulses[
              Math.min(selectedPulseIdx, dashboard.weeklyPulses.length - 1)
            ] || dashboard.latestWeeklyPulse;
          return (
            <section
              aria-labelledby="lev-weekly-pulse-heading"
              className="rounded-2xl border border-violet-500/35 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-violet-950/25 p-5 sm:p-6 space-y-4 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 px-3 py-0.5 text-[11px] font-mono font-bold uppercase text-violet-300">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      <span>Two-Way Weekly Newsletter × FutureGraph Sync</span>
                    </span>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {activePulse.issueLabel} ({activePulse.weekOf})
                    </span>
                  </div>
                  <h2
                    id="lev-weekly-pulse-heading"
                    className="text-lg sm:text-xl font-extrabold text-white"
                  >
                    {activePulse.newsletterTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Issue selector */}
                  <div className="flex items-center gap-1 rounded-xl bg-slate-950/90 p-1 border border-slate-800">
                    {dashboard.weeklyPulses.slice(0, 4).map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPulseIdx(idx)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors ${
                          selectedPulseIdx === idx
                            ? "bg-violet-500/25 text-violet-300 border border-violet-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {p.weekOf}
                      </button>
                    ))}
                  </div>

                  <a
                    href={activePulse.newsletterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/25"
                  >
                    <span>Read Issue</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Net Weekly Bayesian Impact Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl bg-slate-950/85 border border-emerald-500/30 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    99th-Pct LEV Weekly Shift
                  </div>
                  <div className="text-base font-mono font-extrabold text-emerald-300 tabular-nums">
                    {activePulse.netWeeklyDelta.days99thLevShift > 0 ? "+" : ""}
                    {activePulse.netWeeklyDelta.days99thLevShift} days
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/85 border border-sky-500/30 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    80th-Pct LEV Weekly Shift
                  </div>
                  <div className="text-base font-mono font-extrabold text-sky-300 tabular-nums">
                    {activePulse.netWeeklyDelta.days80thLevShift > 0 ? "+" : ""}
                    {activePulse.netWeeklyDelta.days80thLevShift} days
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/85 border border-emerald-500/30 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    99th-Pct PoA Weekly Delta
                  </div>
                  <div className="text-base font-mono font-extrabold text-emerald-300 tabular-nums">
                    {activePulse.netWeeklyDelta.poa99thShift > 0 ? "+" : ""}
                    {activePulse.netWeeklyDelta.poa99thShift} yr/yr
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/85 border border-sky-500/30 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    80th-Pct PoA Weekly Delta
                  </div>
                  <div className="text-base font-mono font-extrabold text-sky-300 tabular-nums">
                    {activePulse.netWeeklyDelta.poa80thShift > 0 ? "+" : ""}
                    {activePulse.netWeeklyDelta.poa80thShift} yr/yr
                  </div>
                </div>
              </div>

              {/* 3-Column Weekly Digest: Prediction Markets, Expert Consensus, Longevity Breakthroughs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <article className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold uppercase text-sky-300">
                    1. Prediction Markets This Week
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activePulse.predictionMarketsSummary}
                  </p>
                </article>

                <article className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold uppercase text-violet-300">
                    2. Expert Consensus &amp; Clinical Shifts
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activePulse.expertConsensusSummary}
                  </p>
                </article>

                <article className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold uppercase text-emerald-300">
                    3. Longevity &amp; Biomarker Breakthroughs
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activePulse.breakthroughsSummary}
                  </p>
                </article>
              </div>

              {/* Breakthrough items if not minimal */}
              {!isMinimal && activePulse.breakthroughs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {activePulse.breakthroughs.map((bt) => (
                    <div
                      key={bt.id}
                      className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">
                            {bt.title}
                          </span>
                          <span className="shrink-0 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 tabular-nums">
                            {bt.delta99thLevYears} yr LEV • {bt.deltaPoA99th} PoA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {bt.summary}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Category: {bt.category}</span>
                        <a
                          href={bt.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-300 hover:underline"
                        >
                          {bt.sourceLabel} ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

      {/* SECTION 1: Dynamically Updating Pace of Aging & LEVL Trajectory Graphic */}
      {initialView !== "markets" && initialView !== "hero" && initialView !== "pulse" && (
        <section
          aria-labelledby="lev-trajectory-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Dynamically Updating Graphic • Conservative Bayesian Updates
                </span>
              </div>
              <h2
                id="lev-trajectory-heading"
                className="text-xl sm:text-2xl font-extrabold text-white"
              >
                Pace of Aging (99th vs. 80th Percentile) &amp; LEVL Escape Velocity Trajectory
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 pretty-copy">
                Modeled on{" "}
                <a
                  href={LEVL_TRAJECTORY_REFERENCE.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 underline decoration-emerald-500/50 hover:text-emerald-200 font-semibold"
                >
                  levlhealth.com/LEVTrajectory
                </a>
                : compares the{" "}
                <strong className="text-amber-300">
                  Status Quo (50th Pct dashed orange)
                </strong>{" "}
                against the{" "}
                <strong className="text-sky-300">
                  80th Percentile Health Optimizer (solid cyan)
                </strong>{" "}
                and{" "}
                <strong className="text-emerald-300">
                  99th Percentile Protocol Frontier (solid green + Cone of Uncertainty)
                </strong>
                .
              </p>
            </div>

            {/* Chart view selector tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-950 p-1.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setChartTab("velocity")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  chartTab === "velocity"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Net Aging Velocity &amp; LEV Intercept
              </button>
              <button
                type="button"
                onClick={() => setChartTab("alive_healthy")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  chartTab === "alive_healthy"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Alive &amp; Healthy Curve (LEVL Trajectory)
              </button>
              <button
                type="button"
                onClick={() => setChartTab("speedometer")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  chartTab === "speedometer"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Pace of Aging Speedometers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Interactive SVG Graphic (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
              {chartTab !== "speedometer" ? (
                <figure className="space-y-2.5">
                  <svg
                    role="img"
                    viewBox={`0 0 ${chartGeometry.W} ${chartGeometry.H}`}
                    className="w-full h-auto overflow-visible"
                  >
                    <title>
                      {chartTab === "velocity"
                        ? `Net Biological Aging Velocity (2026–2060): 99th Percentile crosses LEV in ${dashboard.aggregate99thFormatted}, 80th Percentile in ${dashboard.aggregate80thFormatted}, Status Quo in ${dashboard.aggregate50thFormatted}`
                        : `Alive & Healthy Probability Curve (2026–2060) starting at chronological age ${currentAge}`}
                    </title>

                    {/* Horizontal Grid Lines */}
                    {chartTab === "velocity" ? (
                      <>
                        {[1.0, 0.75, 0.5, 0.25, 0.0, -0.2].map((val) => {
                          const y = chartGeometry.yOf(val);
                          const isZero = val === 0.0;
                          return (
                            <g key={val}>
                              <line
                                x1={chartGeometry.padL}
                                y1={y}
                                x2={chartGeometry.W - chartGeometry.padR}
                                y2={y}
                                stroke={isZero ? "#10b981" : "rgba(148, 163, 184, 0.16)"}
                                strokeWidth={isZero ? 2 : 1}
                                strokeDasharray={isZero ? "7 4" : undefined}
                              />
                              <text
                                x={chartGeometry.padL - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-slate-400 font-mono text-[11px]"
                              >
                                {val.toFixed(2)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Shaded Escape Velocity Zone (<= 0.00 net bio-yr/yr) */}
                        <rect
                          x={chartGeometry.padL}
                          y={chartGeometry.zeroY}
                          width={chartGeometry.plotW}
                          height={
                            chartGeometry.H -
                            chartGeometry.padB -
                            chartGeometry.zeroY
                          }
                          fill="#10b981"
                          fillOpacity={0.08}
                        />
                        <text
                          x={chartGeometry.W - chartGeometry.padR - 8}
                          y={chartGeometry.zeroY + 18}
                          textAnchor="end"
                          className="fill-emerald-400 font-mono text-[11px] font-bold"
                        >
                          ▲ LONGEVITY ESCAPE VELOCITY ZONE (&le; 0.00 NET BIO-YR/YR)
                        </text>

                        {/* Cones of Uncertainty (5th–95th percentile breakthrough speed) */}
                        <polygon
                          points={chartGeometry.cone80Polygon}
                          fill="#38bdf8"
                          fillOpacity={0.08}
                        />
                        <polygon
                          points={chartGeometry.cone99Polygon}
                          fill="#10b981"
                          fillOpacity={0.16}
                        />

                        {/* Intrinsic Protocol-Only Dotted Reference Lines */}
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.25"
                          strokeDasharray="2 4"
                          strokeOpacity="0.55"
                          points={chartGeometry.p99IntrinsicLine}
                        />
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1.25"
                          strokeDasharray="2 4"
                          strokeOpacity="0.55"
                          points={chartGeometry.p80IntrinsicLine}
                        />

                        {/* Main Net Trajectory Curves: Status Quo (dashed orange), 80th (cyan), 99th (emerald) */}
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray="7 5"
                          points={chartGeometry.p50Line}
                        />
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          points={chartGeometry.p80Line}
                        />
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          points={chartGeometry.p99Line}
                        />

                        {/* 2026 Starting Pace of Aging Callout Dots */}
                        <circle
                          cx={chartGeometry.xOf(2026)}
                          cy={chartGeometry.yOf(
                            dashboard.cohorts.p99.intrinsicPaceOfAging
                          )}
                          r="5"
                          fill="#10b981"
                        />
                        <circle
                          cx={chartGeometry.xOf(2026)}
                          cy={chartGeometry.yOf(
                            dashboard.cohorts.p80.intrinsicPaceOfAging
                          )}
                          r="5"
                          fill="#38bdf8"
                        />
                        <circle
                          cx={chartGeometry.xOf(2026)}
                          cy={chartGeometry.yOf(1.0)}
                          r="5"
                          fill="#f59e0b"
                        />

                        {/* LEV Intercept Markers on the 0.00 Threshold Line */}
                        {[
                          {
                            yr: dashboard.aggregate99thYear,
                            label: `99th LEV: ${dashboard.aggregate99thYear}`,
                            col: "#10b981",
                            dy: -12,
                          },
                          {
                            yr: dashboard.aggregate80thYear,
                            label: `80th LEV: ${dashboard.aggregate80thYear}`,
                            col: "#38bdf8",
                            dy: -12,
                          },
                          {
                            yr: dashboard.aggregate50thYear,
                            label: `50th LEV: ${dashboard.aggregate50thYear}`,
                            col: "#f59e0b",
                            dy: -12,
                          },
                        ].map((m) => {
                          const cx = chartGeometry.xOf(m.yr);
                          return (
                            <g key={m.label}>
                              <line
                                x1={cx}
                                y1={chartGeometry.padT}
                                x2={cx}
                                y2={chartGeometry.zeroY}
                                stroke={m.col}
                                strokeWidth="1.2"
                                strokeDasharray="3 3"
                                strokeOpacity="0.6"
                              />
                              <circle
                                cx={cx}
                                cy={chartGeometry.zeroY}
                                r="6"
                                fill={m.col}
                                stroke="#090d16"
                                strokeWidth="2"
                              />
                              <text
                                x={cx}
                                y={chartGeometry.zeroY + m.dy}
                                textAnchor="middle"
                                fill={m.col}
                                className="font-mono text-[11px] font-extrabold"
                              >
                                {m.label}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {/* Alive & Healthy Probability (0% to 100%) */}
                        {[100, 80, 60, 40, 20].map((pct) => {
                          const y = chartGeometry.yOf(pct);
                          return (
                            <g key={pct}>
                              <line
                                x1={chartGeometry.padL}
                                y1={y}
                                x2={chartGeometry.W - chartGeometry.padR}
                                y2={y}
                                stroke="rgba(148, 163, 184, 0.16)"
                                strokeWidth="1"
                              />
                              <text
                                x={chartGeometry.padL - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-slate-400 font-mono text-[11px]"
                              >
                                {pct}%
                              </text>
                            </g>
                          );
                        })}

                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray="7 5"
                          points={chartGeometry.p50Line}
                        />
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          points={chartGeometry.p80Line}
                        />
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          points={chartGeometry.p99Line}
                        />

                        <text
                          x={chartGeometry.W - chartGeometry.padR - 10}
                          y={chartGeometry.padT + 22}
                          textAnchor="end"
                          className="fill-emerald-300 font-mono text-[11px] font-bold"
                        >
                          Compression of Morbidity: 99th Pct Curve Rebounds at LEV (
                          {dashboard.aggregate99thYear})
                        </text>
                      </>
                    )}

                    {/* X-Axis Year Ticks */}
                    {[2026, 2030, 2035, 2040, 2045, 2050, 2055, 2060].map((yr) => (
                      <g key={yr}>
                        <line
                          x1={chartGeometry.xOf(yr)}
                          y1={chartGeometry.padT}
                          x2={chartGeometry.xOf(yr)}
                          y2={chartGeometry.H - chartGeometry.padB}
                          stroke="rgba(148, 163, 184, 0.1)"
                          strokeWidth="1"
                        />
                        <text
                          x={chartGeometry.xOf(yr)}
                          y={chartGeometry.H - 14}
                          textAnchor="middle"
                          className="fill-slate-400 font-mono text-[11px]"
                        >
                          {yr}
                        </text>
                      </g>
                    ))}
                  </svg>

                  <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-5 rounded-full bg-emerald-400 inline-block" />
                        <strong className="text-emerald-300">
                          99th Pct Protocol (PoA {dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)})
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-5 rounded-full bg-sky-400 inline-block" />
                        <strong className="text-sky-300">
                          80th Pct Optimizer (PoA {dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)})
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-0.5 w-5 border-t-2 border-dashed border-amber-400 inline-block" />
                        <strong className="text-amber-300">
                          50th Pct Status Quo (PoA 1.00)
                        </strong>
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      Shaded Green Band = 5th–95th Pct Biotech Breakthrough Cone
                    </span>
                  </figcaption>
                </figure>
              ) : (
                /* Speedometer Gauge View comparing 99th vs 80th vs 50th Percentile Pace of Aging */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
                  {(["p99", "p80", "p50"] as const).map((cid) => {
                    const c = dashboard.cohorts[cid];
                    const prof = COHORT_PACE_PROFILES[cid];
                    const stroke =
                      cid === "p99"
                        ? "#10b981"
                        : cid === "p80"
                        ? "#38bdf8"
                        : "#f59e0b";
                    // Map PoA 0.40..1.20 to 0..100% arc
                    const norm = Math.max(
                      0,
                      Math.min(1, (c.intrinsicPaceOfAging - 0.4) / 0.8)
                    );
                    const dashLen = Math.round(norm * 220);

                    return (
                      <div
                        key={cid}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col items-center text-center space-y-2.5"
                      >
                        <span className="text-xs font-mono font-bold uppercase text-slate-300">
                          {c.shortLabel}
                        </span>
                        <svg
                          role="img"
                          viewBox="0 0 180 115"
                          className="w-44 h-28"
                        >
                          <title>
                            {c.shortLabel} Pace of Aging Gauge:{" "}
                            {c.intrinsicPaceOfAging.toFixed(2)} bio-yrs/yr
                          </title>
                          <path
                            d="M 20 95 A 70 70 0 0 1 160 95"
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.2)"
                            strokeWidth="14"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 20 95 A 70 70 0 0 1 160 95"
                            fill="none"
                            stroke={stroke}
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${dashLen} 240`}
                          />
                          <text
                            x="90"
                            y="78"
                            textAnchor="middle"
                            fill="#f8fafc"
                            className="font-mono text-2xl font-extrabold"
                          >
                            {c.intrinsicPaceOfAging.toFixed(2)}
                          </text>
                          <text
                            x="90"
                            y="96"
                            textAnchor="middle"
                            fill="#94a3b8"
                            className="font-mono text-[10px]"
                          >
                            bio-yrs / calendar yr
                          </text>
                        </svg>
                        <div className="text-xs text-slate-300">
                          <strong>{c.bioMonthsPerYear} mos</strong> aged per 12 mos •{" "}
                          <strong style={{ color: stroke }}>
                            +{c.daysGainedPerYear}d/yr
                          </strong>{" "}
                          banked
                        </div>
                        <ul className="text-left text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800 w-full">
                          {prof.protocolSummary.map((line) => (
                            <li key={line} className="flex items-start gap-1.5">
                              <span style={{ color: stroke }}>•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Controls Panel (4 cols): Conservative Update Engine & Personal Simulator */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-950/85 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Trajectory &amp; Conservative Update Controls</span>
                </h3>
              </div>

              {/* Update Mode Toggle */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-200 block">
                  1. Biomarker &amp; Market Update Damping
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateMode("conservative")}
                    className={`rounded-xl px-3 py-2 text-left border transition-colors ${
                      updateMode === "conservative"
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-xs font-bold">Conservative (Default)</div>
                    <div className="text-[10px] opacity-80">
                      35% Empirical Bayes shrinkage on clock outliers
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateMode("moderate")}
                    className={`rounded-xl px-3 py-2 text-left border transition-colors ${
                      updateMode === "moderate"
                        ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-xs font-bold">Moderate Frontier</div>
                    <div className="text-[10px] opacity-80">
                      Faster AI-biotech clinical translation slope
                    </div>
                  </button>
                </div>
              </div>

              {/* Chronological Age Slider (Modern Web Guidance: slider) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="lev-chronological-age-slider"
                    className="text-xs font-semibold text-slate-200"
                  >
                    2. Reader Chronological Age (in 2026)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                    {currentAge} yrs old
                  </span>
                </div>
                <input
                  id="lev-chronological-age-slider"
                  type="range"
                  min={18}
                  max={85}
                  step={1}
                  value={currentAge}
                  aria-valuetext={`${currentAge} years old`}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  style={
                    {
                      "--attr-min": 18,
                      "--attr-max": 85,
                      "--control-value": `${ageSliderPct}%`,
                    } as React.CSSProperties
                  }
                  className="fg-slider"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 tabular-nums">
                  <span>18 yrs</span>
                  <span>
                    99th-Pct Bio-Age at LEV: ~
                    {dashboard.cohorts.p99.biologicalAgeAtLev} yrs
                  </span>
                  <span>85 yrs</span>
                </div>
              </div>

              {/* Epistemic Source Weights */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    3. Aggregate Source Weighting
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMarketsWeightPct(40);
                      setExpertsWeightPct(35);
                      setTrajectoryWeightPct(25);
                    }}
                    className="text-[11px] font-mono text-amber-300 hover:underline"
                  >
                    Reset (40/35/25)
                  </button>
                </div>

                {[
                  {
                    id: "lev-w-markets",
                    label: "Prediction Markets (Metaculus + Manifold)",
                    val: marketsWeightPct,
                    setVal: setMarketsWeightPct,
                    col: "text-sky-300",
                  },
                  {
                    id: "lev-w-experts",
                    label: "Notable Expert Forecasts (n = 10)",
                    val: expertsWeightPct,
                    setVal: setExpertsWeightPct,
                    col: "text-violet-300",
                  },
                  {
                    id: "lev-w-traj",
                    label: "LEVL Pace-of-Aging Intercept Model",
                    val: trajectoryWeightPct,
                    setVal: setTrajectoryWeightPct,
                    col: "text-emerald-300",
                  },
                ].map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <label htmlFor={s.id} className="text-slate-300">
                        {s.label}
                      </label>
                      <span className={`font-mono font-bold tabular-nums ${s.col}`}>
                        {s.val}%
                      </span>
                    </div>
                    <input
                      id={s.id}
                      type="range"
                      min={5}
                      max={80}
                      step={5}
                      value={s.val}
                      aria-valuetext={`${s.val} percent weight`}
                      onChange={(e) => s.setVal(Number(e.target.value))}
                      style={
                        {
                          "--attr-min": 5,
                          "--attr-max": 80,
                          "--control-value": `${Math.round(
                            ((s.val - 5) / 75) * 100
                          )}%`,
                        } as React.CSSProperties
                      }
                      className="fg-slider"
                    />
                  </div>
                ))}
              </div>

              {/* Conservative Methodology Callout */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Why Conservative Updates?</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Single epigenetic clock readings (e.g., 0.48 DunedinPACE) can
                  overstate systemic organ rejuvenation. This graphic shrinks raw
                  leaderboard extremes by 35% toward multi-system physiological
                  markers (VO2 max, HRV, ApoB, glycan/proteomic clocks) aligned with{" "}
                  <a
                    href={LEVL_TRAJECTORY_REFERENCE.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 underline"
                  >
                    LEVL Trajectory
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Prediction Markets & Forecasting Platforms */}
      {initialView !== "pace" && initialView !== "hero" && initialView !== "pulse" && (
        <section
          aria-labelledby="lev-markets-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-300">
                Crowd Forecasting &amp; Prediction Market Aggregation (Weight:{" "}
                {Math.round(dashboard.weights.marketsWeight * 100)}%)
              </span>
              <h2
                id="lev-markets-heading"
                className="text-xl sm:text-2xl font-extrabold text-white"
              >
                Relevant Prediction Markets for Longevity Escape Velocity
              </h2>
            </div>
            <div className="rounded-xl bg-sky-500/15 border border-sky-500/30 px-3.5 py-2 text-right font-mono">
              <div className="text-[10px] uppercase text-sky-300">
                Market-Implied 99th-Pct LEV
              </div>
              <div className="text-lg font-extrabold text-white tabular-nums">
                {formatDecimalYear(dashboard.marketAggregate99thYear, true)} (
                {dashboard.marketAggregate99thYear})
              </div>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="lev-markets-caption"
            className="fg-table-container"
          >
            <table
              className="fg-responsive-table fg-stack-mobile text-left text-xs"
              style={
                {
                  "--label-2": '"Question & Resolution Criteria"',
                  "--label-3": '"Raw Market Price / Median"',
                  "--label-4": '"Implied 99th-Pct LEV"',
                  "--label-5": '"Implied 80th / 50th LEV"',
                  "--label-6": '"Cohort Translation Basis"',
                } as React.CSSProperties
              }
            >
              <caption
                id="lev-markets-caption"
                className="sr-only"
              >
                Prediction markets tracking Longevity Escape Velocity and their implied 99th, 80th, and 50th percentile human intercept dates
              </caption>
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-300">
                  <th scope="col" className="py-3 px-3.5">
                    Platform &amp; Weight
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    Question &amp; Resolution Criteria
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    Raw Crowd Metric
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    99th-Pct Human LEV
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    80th / 50th Pct
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    Cohort Translation Rationale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {LEV_PREDICTION_MARKETS.map((mkt) => (
                  <tr
                    key={mkt.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <th
                      scope="row"
                      className="py-3.5 px-3.5 font-semibold text-white align-top"
                    >
                      <div className="flex flex-col gap-1">
                        <a
                          href={mkt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-300 hover:underline font-bold"
                        >
                          <span>{mkt.platform}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                        <span className="text-[10px] font-mono text-slate-400">
                          Weight: {Math.round(mkt.weightInMarketAggregate * 100)}% •{" "}
                          {mkt.forecasterCountOrLiquidity}
                        </span>
                      </div>
                    </th>
                    <td className="py-3.5 px-3.5 align-top text-slate-200">
                      <div className="font-semibold text-white mb-1">
                        {mkt.questionTitle}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {mkt.resolutionMetric}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top font-mono font-bold text-amber-300">
                      {mkt.rawMarketDisplay}
                    </td>
                    <td className="py-3.5 px-3.5 align-top font-mono">
                      <span className="inline-block rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-extrabold text-emerald-300">
                        {formatDecimalYear(mkt.implied99thPercentileYear, true)} (
                        {mkt.implied99thPercentileYear})
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 align-top font-mono text-slate-300">
                      <div>
                        80th:{" "}
                        <strong className="text-sky-300">
                          {mkt.implied80thPercentileYear}
                        </strong>
                      </div>
                      <div>
                        50th:{" "}
                        <strong className="text-amber-300">
                          {mkt.implied50thPercentileYear}
                        </strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top text-[11px] text-slate-300 max-w-xs">
                      {mkt.translationMethodology}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: Notable Expert Predictions & Visual Timeline Forest Plot */}
      {initialView !== "pace" && initialView !== "hero" && initialView !== "pulse" && (
        <section
          aria-labelledby="lev-experts-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-300">
                Biogerontology, Genetics &amp; AI-Biotech Pioneers (Weight:{" "}
                {Math.round(dashboard.weights.expertsWeight * 100)}%)
              </span>
              <h2
                id="lev-experts-heading"
                className="text-xl sm:text-2xl font-extrabold text-white"
              >
                Most Notable Expert Predictions for Human LEV
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Experts (10)" },
                { id: "ai_biotech", label: "AI-Biotech" },
                { id: "biogerontology", label: "Biogerontology" },
                { id: "genetics_reprogramming", label: "Genetics & OSK" },
                { id: "longevity_protocol", label: "Protocols" },
                { id: "regulatory_realist", label: "Regulatory Realists" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExpertFilter(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    expertFilter === tab.id
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Forest Plot comparing Expert 99th-Percentile Ranges against Aggregate */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">
                99th-Percentile Frontier LEV Timeline Distribution (2028 – 2054)
              </span>
              <span className="font-mono text-emerald-300 font-bold">
                Vertical Line = {dashboard.aggregate99thFormatted} (
                {dashboard.aggregate99thYear}) Aggregate
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {filteredExperts.map((exp) => {
                const minScale = 2028;
                const maxScale = 2054;
                const pctOf = (yr: number) =>
                  Math.max(
                    0,
                    Math.min(100, ((yr - minScale) / (maxScale - minScale)) * 100)
                  );
                const leftPct = pctOf(exp.lowBound99thYear);
                const widthPct = Math.max(
                  2,
                  pctOf(exp.highBound99thYear) - leftPct
                );
                const pointPct = pctOf(exp.pointEstimate99thYear);
                const aggPct = pctOf(dashboard.aggregate99thYear);

                return (
                  <div
                    key={exp.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center py-1.5 border-b border-slate-900 last:border-0"
                  >
                    <div className="sm:col-span-4 flex items-center justify-between sm:pr-3">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {exp.expertName}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[260px]">
                          {exp.roleAndAffiliation}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums sm:hidden">
                        {exp.pointEstimate99thYear}
                      </span>
                    </div>

                    <div className="sm:col-span-6 relative h-6 rounded-lg bg-slate-900 border border-slate-800/80 overflow-hidden">
                      {/* Aggregate vertical line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/80 z-10"
                        style={{ left: `${aggPct}%` }}
                      />
                      {/* Range Bar */}
                      <div
                        className="absolute top-1.5 bottom-1.5 rounded-full bg-violet-500/35 border border-violet-400/50"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      />
                      {/* Point Estimate Dot */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 z-20"
                        style={{ left: `${pointPct}%` }}
                      />
                    </div>

                    <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-2 font-mono text-xs tabular-nums">
                      <span className="text-emerald-300 font-bold">
                        {exp.pointEstimate99thYear}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({exp.lowBound99thYear}–{exp.highBound99thYear})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Semantic Expert Table */}
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="lev-experts-caption"
            className="fg-table-container"
          >
            <table
              className="fg-responsive-table fg-stack-mobile text-left text-xs"
              style={
                {
                  "--label-2": '"Stated Timeline & Confidence"',
                  "--label-3": '"99th-Pct Point & Range"',
                  "--label-4": '"80th / 50th Implied"',
                  "--label-5": '"Primary Scientific Mechanism"',
                } as React.CSSProperties
              }
            >
              <caption id="lev-experts-caption" className="sr-only">
                Notable expert predictions for Longevity Escape Velocity with 99th-percentile estimates and biological mechanisms
              </caption>
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-300">
                  <th scope="col" className="py-3 px-3.5">
                    Expert &amp; Affiliation
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    Stated Timeline &amp; Confidence
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    99th-Pct Point (Range)
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    80th / 50th Pct
                  </th>
                  <th scope="col" className="py-3 px-3.5">
                    Primary Mechanism &amp; Citation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredExperts.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <th
                      scope="row"
                      className="py-3.5 px-3.5 font-semibold text-white align-top"
                    >
                      <div className="font-bold text-white">{exp.expertName}</div>
                      <div className="text-[11px] text-slate-400">
                        {exp.roleAndAffiliation}
                      </div>
                      <div className="text-[10px] font-mono text-violet-300 mt-0.5">
                        Weight: {Math.round(exp.weightInExpertAggregate * 100)}%
                      </div>
                    </th>
                    <td className="py-3.5 px-3.5 align-top text-slate-200">
                      <div className="font-mono font-bold text-amber-300">
                        {exp.statedTimelineLabel}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {exp.statedConfidenceNote}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top font-mono">
                      <span className="inline-block rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-extrabold text-emerald-300">
                        {exp.pointEstimate99thYear}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Range: {exp.lowBound99thYear}–{exp.highBound99thYear}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top font-mono text-slate-300">
                      <div>
                        80th: <strong className="text-sky-300">{exp.implied80thYear}</strong>
                      </div>
                      <div>
                        50th: <strong className="text-amber-300">{exp.implied50thYear}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top text-[11px] text-slate-300 max-w-sm">
                      <p className="mb-1">{exp.primaryMechanism}</p>
                      <a
                        href={exp.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sky-300 hover:underline font-medium"
                      >
                        <span>
                          {exp.sourceTitle} ({exp.publicationYear})
                        </span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 4: Website & Newsletter Embed Studio (Hidden inside compact iframe embeds unless requested) */}
      {!isEmbed && (
        <section
          id="embed-studio"
          aria-labelledby="lev-embed-heading"
          className="rounded-2xl border border-amber-500/40 bg-slate-900/80 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  Zero-Friction Syndication • Newsletters (Substack / Beehiiv) &amp; Websites
                </span>
              </div>
              <h2
                id="lev-embed-heading"
                className="text-xl sm:text-2xl font-extrabold text-white"
              >
                Embed This Live LEV &amp; Pace of Aging Graphic Anywhere
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 pretty-copy">
                Email newsletters strip <code>&lt;script&gt;</code> and{" "}
                <code>&lt;iframe&gt;</code> tags — so we built a{" "}
                <strong className="text-emerald-300">
                  live server-rendered SVG image endpoint (
                  <code>/api/embed/lev-card</code>)
                </strong>{" "}
                for Substack, Beehiiv, ConvertKit, and Ghost emails, plus an{" "}
                <strong className="text-sky-300">
                  interactive <code>&lt;iframe&gt;</code> &amp; 1-line{" "}
                  <code>&lt;script&gt;</code> widget
                </strong>{" "}
                for websites.
              </p>
            </div>

            {/* Theme & Variant selectors for the embed */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setEmbedTheme("light")}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    embedTheme === "light"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Light (Newsletter Default)
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedTheme("dark")}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    embedTheme === "dark"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Dark
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setEmbedVariant("full")}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    embedVariant === "full"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Full Card (LEV + Pace + Markets)
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedVariant("pace")}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    embedVariant === "pace"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pace of Aging Only (99th vs 80th)
                </button>
              </div>
            </div>
          </div>

          {/* Format Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
              {
                id: "newsletter",
                label: "1. Newsletter Embed (Substack / Beehiiv / Email HTML / Markdown)",
                icon: Mail,
              },
              {
                id: "iframe",
                label: "2. Website Interactive Iframe (<iframe>)",
                icon: Code2,
              },
              {
                id: "script",
                label: "3. 1-Line Auto-Resizing Widget (<script>)",
                icon: Sparkles,
              },
              {
                id: "api",
                label: "4. Live JSON Data API (/api/v1/lev)",
                icon: Activity,
              },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setEmbedTab(t.id as "newsletter" | "iframe" | "script" | "api")
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    embedTab === t.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 cols: Live Rendered Newsletter SVG Preview */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-300">
                  LIVE NEWSLETTER / DYNAMIC SVG CARD PREVIEW
                </span>
                <a
                  href={svgCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-300 hover:underline font-mono"
                >
                  <span>Open Raw SVG Endpoint</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-950 p-2 shadow-inner overflow-hidden">
                <img
                  src={svgCardUrl}
                  alt={`Live dynamically updating LEV & Pace of Aging card (${embedTheme} theme, ${embedVariant} variant)`}
                  className="w-full h-auto rounded-xl block"
                />
              </div>
            </div>

            {/* Right 6 cols: Copyable Code Snippets */}
            <div className="lg:col-span-6 space-y-4">
              {embedTab === "newsletter" && (
                <>
                  {/* Snippet 1: Linked Image HTML for Substack / Beehiiv / Ghost HTML blocks */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">
                        A. Newsletter HTML Block (Substack / Beehiiv / Ghost / ConvertKit)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy("nl-html", newsletterLinkedImageHtml)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                      >
                        {copiedId === "nl-html" ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy HTML</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-300 leading-relaxed max-h-40">
                      <code>{newsletterLinkedImageHtml}</code>
                    </pre>
                  </div>

                  {/* Snippet 2: Markdown for Substack / Markdown Newsletters / GitHub */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300">
                        B. Markdown Embed (Markdown Newsletters / Docs / GitHub)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy("nl-md", newsletterMarkdownSnippet)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/30"
                      >
                        {copiedId === "nl-md" ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy Markdown</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-300 leading-relaxed">
                      <code>{newsletterMarkdownSnippet}</code>
                    </pre>
                  </div>

                  {/* Snippet 3: Email-safe full table HTML */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        C. Email-Safe Inline Table Card (Apple Mail / Gmail / Outlook)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy("nl-table", emailTableHtmlSnippet)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
                      >
                        {copiedId === "nl-table" ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy Email Table</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-300 leading-relaxed max-h-36">
                      <code>{emailTableHtmlSnippet}</code>
                    </pre>
                  </div>
                </>
              )}

              {embedTab === "iframe" && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300">
                      Interactive Website Iframe (Chromeless, Accessible, Responsive)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("web-iframe", websiteIframeSnippet)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/30"
                    >
                      {copiedId === "web-iframe" ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copy Iframe</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs font-mono text-slate-300 leading-relaxed">
                    <code>{websiteIframeSnippet}</code>
                  </pre>
                  <p className="text-xs text-slate-400">
                    Supports query parameters: <code>?theme=dark|light</code>,{" "}
                    <code>&amp;view=all|pace|markets</code>,{" "}
                    <code>&amp;age=35</code>, and{" "}
                    <code>&amp;mode=conservative|moderate</code>. Also accepts runtime{" "}
                    <code>postMessage({`{ type: "fg-lev-embed-theme", theme: "light" }`})</code>{" "}
                    for dynamic host theme syncing across all browsers including Safari.
                  </p>
                </div>
              )}

              {embedTab === "script" && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300">
                      1-Line Auto-Resizing JavaScript Widget
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("web-script", websiteScriptSnippet)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 px-2.5 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-500/30"
                    >
                      {copiedId === "web-script" ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copy Script Tag</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs font-mono text-slate-300 leading-relaxed">
                    <code>{websiteScriptSnippet}</code>
                  </pre>
                  <p className="text-xs text-slate-400">
                    Drop into Webflow, WordPress, Ghost, or any HTML page. Automatically
                    mounts the interactive LEV &amp; Pace of Aging widget and resizes its
                    container smoothly via <code>postMessage</code>.
                  </p>
                </div>
              )}

              {embedTab === "api" && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">
                      CORS-Enabled Live JSON Endpoint (<code>GET /api/v1/lev</code>)
                    </span>
                    <a
                      href="/api/v1/lev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-emerald-300 hover:underline"
                    >
                      <span>Open /api/v1/lev</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-300 leading-relaxed">
                    <code>{`curl -s "${hostOrigin}/api/v1/lev?age=${currentAge}&mode=${updateMode}" | jq '.computation | {
  aggregate99thFormatted,
  aggregate80thFormatted,
  aggregate50thFormatted,
  p99PaceOfAging: .cohorts.p99.intrinsicPaceOfAging,
  p80PaceOfAging: .cohorts.p80.intrinsicPaceOfAging
}'`}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Compact Footer when rendered inside an external iframe embed */}
      {isEmbed && (
        <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">FutureGraph × LEVL Trajectory</span>
            <span>•</span>
            <span>
              99th-Pct LEV:{" "}
              <strong className="text-emerald-300">
                {dashboard.aggregate99thFormatted}
              </strong>
            </span>
            <span>•</span>
            <span>
              99th PoA:{" "}
              <strong className="text-emerald-300">
                {dashboard.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr
              </strong>
            </span>
            <span>•</span>
            <span>
              80th PoA:{" "}
              <strong className="text-sky-300">
                {dashboard.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={LEVL_TRAJECTORY_REFERENCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>levlhealth.com/LEVTrajectory</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <Link
              href="/lev"
              target="_blank"
              className="text-sky-300 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Full Interactive Hub</span>
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
