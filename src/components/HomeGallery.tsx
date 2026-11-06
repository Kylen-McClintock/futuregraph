"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Compass,
  ExternalLink,
  GitBranch,
  Mail,
  Scale,
  Sparkles,
} from "lucide-react";
import { computeLevDashboard } from "@/lib/lev-engine";
import { LEVL_TRAJECTORY_REFERENCE } from "@/data/lev-seed";

type FeaturedGraphId = "lev" | "ai-2050" | "nature-of-reality";

export function HomeGallery() {
  const [featuredId, setFeaturedId] = useState<FeaturedGraphId>("lev");
  const [readerAge, setReaderAge] = useState<number>(35);

  const levData = useMemo(() => {
    return computeLevDashboard({
      referenceDate: new Date(),
      updateMode: "conservative",
      currentChronologicalAge: readerAge,
    });
  }, [readerAge]);

  // Coordinate helper for the Featured LEV Trajectory Canvas (860 x 310)
  const levHeroChart = useMemo(() => {
    const padL = 54;
    const padR = 24;
    const padT = 22;
    const padB = 34;
    const W = 860;
    const H = 310;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const minYr = 2026;
    const maxYr = 2060;
    const minPoA = -0.22;
    const maxPoA = 1.08;

    const xOf = (yr: number) =>
      Math.round((padL + ((yr - minYr) / (maxYr - minYr)) * plotW) * 10) / 10;
    const yOf = (poa: number) => {
      const clamped = Math.max(minPoA, Math.min(maxPoA, poa));
      return (
        Math.round(
          (padT + ((maxPoA - clamped) / (maxPoA - minPoA)) * plotH) * 10
        ) / 10
      );
    };

    const zeroY = yOf(0.0);
    const p99Pts = levData.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p99NetPoA)}`)
      .join(" ");
    const p80Pts = levData.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p80NetPoA)}`)
      .join(" ");
    const p50Pts = levData.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p50NetPoA)}`)
      .join(" ");

    const coneUpper = levData.trajectorySeries
      .map((d) => `${xOf(d.year)},${yOf(d.p99ConeSlow95th)}`)
      .join(" ");
    const coneLower = [...levData.trajectorySeries]
      .reverse()
      .map((d) => `${xOf(d.year)},${yOf(d.p99ConeFast5th)}`)
      .join(" ");

    return {
      W,
      H,
      padL,
      padR,
      padT,
      padB,
      plotW,
      xOf,
      yOf,
      zeroY,
      p99Pts,
      p80Pts,
      p50Pts,
      conePolygon: `${coneUpper} ${coneLower}`,
    };
  }, [levData]);

  const ageSliderPct = Math.round(((readerAge - 18) / (85 - 18)) * 100);

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Minimal Editorial Intro + Featured Switcher */}
      <section aria-labelledby="home-hero-heading" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-mono font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Interactive Epistemic Atlases &amp; Forecast Graphs</span>
            </span>
            <h1
              id="home-hero-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
            >
              Explore the Future as a Living Graph
            </h1>
            <p className="text-sm sm:text-base text-slate-300 pretty-copy">
              Audit prediction markets, expert consensus, and causal trajectories across
              human longevity, artificial general intelligence, and cosmological physics.
            </p>
          </div>

          {/* Clean 3-pill Featured Graph Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 self-start md:self-auto">
            <span className="px-2.5 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Featured:
            </span>
            {[
              {
                id: "lev" as const,
                label: "LEV & Pace of Aging",
                accent: "emerald",
              },
              {
                id: "ai-2050" as const,
                label: "AI 2050 (5 Worlds)",
                accent: "amber",
              },
              {
                id: "nature-of-reality" as const,
                label: "Nature of Reality",
                accent: "sky",
              },
            ].map((tab) => {
              const active = featuredId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeaturedId(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FEATURED GRAPH STAGE */}
        {featuredId === "lev" && (
          <div className="rounded-3xl border border-emerald-500/35 bg-slate-900/75 p-5 sm:p-7 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase text-emerald-300">
                    Featured Observatory
                  </span>
                  <a
                    href={LEVL_TRAJECTORY_REFERENCE.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-emerald-300 hover:underline"
                  >
                    <span>Tied to levlhealth.com/LEVTrajectory</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  99th-Percentile Human Longevity Escape Velocity &amp; Dynamic Pace of Aging
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/lev#embed-studio"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Embed in Newsletter / Site</span>
                </Link>
                <Link
                  href="/lev"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white keep-white shadow-sm transition-colors"
                >
                  <span>Open Full LEV Observatory</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* 3 Clean Summary KPIs + Interactive Trajectory Curve */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 4 cols: Clean Cohort Metrics + Age Slider */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-3.5">
                <div className="rounded-2xl border-2 border-emerald-500/45 bg-slate-950/90 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-300 font-bold uppercase">
                      99th-Percentile Human (Top 1%)
                    </span>
                    <span className="text-slate-400">
                      {levData.cohorts.p99.yearsToLev} yrs away
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Aggregate LEV Date
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-white tabular-nums">
                        {levData.aggregate99thFormatted}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">
                        Current Pace of Aging
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-emerald-400 tabular-nums">
                        {levData.cohorts.p99.intrinsicPaceOfAging.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          yr/yr
                        </span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                    Ages <strong>{levData.cohorts.p99.bioMonthsPerYear} mos/yr</strong>{" "}
                    (<strong className="text-emerald-300">+{levData.cohorts.p99.daysGainedPerYear}d banked/yr</strong>) • IQR:{" "}
                    <span className="font-mono">
                      {levData.cone99th.p25Formatted}–{levData.cone99th.p75Formatted}
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-300 font-bold uppercase">
                      80th-Percentile Human (Top 20%)
                    </span>
                    <span className="text-slate-400">
                      {levData.cohorts.p80.yearsToLev} yrs away
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Aggregate LEV Date
                      </span>
                      <span className="text-xl font-mono font-extrabold text-white tabular-nums">
                        {levData.aggregate80thFormatted}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">
                        Current Pace of Aging
                      </span>
                      <span className="text-xl font-mono font-extrabold text-sky-400 tabular-nums">
                        {levData.cohorts.p80.intrinsicPaceOfAging.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          yr/yr
                        </span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                    Ages <strong>{levData.cohorts.p80.bioMonthsPerYear} mos/yr</strong>{" "}
                    (<strong className="text-sky-300">+{levData.cohorts.p80.daysGainedPerYear}d banked/yr</strong>) • Status Quo 50th Pct:{" "}
                    <strong className="text-amber-300">
                      {levData.aggregate50thYear}
                    </strong>
                  </p>
                </div>

                {/* Quick Personal Age Slider */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="home-lev-age-slider"
                      className="font-semibold text-slate-200"
                    >
                      Your Age (2026):{" "}
                      <span className="font-mono text-emerald-300">
                        {readerAge} yrs
                      </span>
                    </label>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      99th Bio-Age at LEV: ~{levData.cohorts.p99.biologicalAgeAtLev}
                    </span>
                  </div>
                  <input
                    id="home-lev-age-slider"
                    type="range"
                    min={18}
                    max={85}
                    step={1}
                    value={readerAge}
                    aria-valuetext={`${readerAge} years old`}
                    onChange={(e) => setReaderAge(Number(e.target.value))}
                    style={
                      {
                        "--attr-min": 18,
                        "--attr-max": 85,
                        "--control-value": `${ageSliderPct}%`,
                      } as React.CSSProperties
                    }
                    className="fg-slider"
                  />
                </div>
              </div>

              {/* Right 8 cols: Clean LEV Trajectory SVG */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between">
                <figure className="space-y-2">
                  <svg
                    role="img"
                    viewBox={`0 0 ${levHeroChart.W} ${levHeroChart.H}`}
                    className="w-full h-auto block"
                  >
                    <title>
                      Featured Longevity Escape Velocity Trajectory (2026–2060): 99th Percentile crosses 0.00 net aging in {levData.aggregate99thFormatted}, 80th Percentile in {levData.aggregate80thFormatted}, and Status Quo in {levData.aggregate50thFormatted}
                    </title>

                    {[1.0, 0.5, 0.0].map((v) => {
                      const y = levHeroChart.yOf(v);
                      const isZero = v === 0.0;
                      return (
                        <g key={v}>
                          <line
                            x1={levHeroChart.padL}
                            y1={y}
                            x2={levHeroChart.W - levHeroChart.padR}
                            y2={y}
                            stroke={
                              isZero ? "#10b981" : "rgba(148, 163, 184, 0.16)"
                            }
                            strokeWidth={isZero ? 2 : 1}
                            strokeDasharray={isZero ? "7 4" : undefined}
                          />
                          <text
                            x={levHeroChart.padL - 8}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-slate-400 font-mono text-[11px]"
                          >
                            {v.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Escape Velocity Shaded Zone */}
                    <rect
                      x={levHeroChart.padL}
                      y={levHeroChart.zeroY}
                      width={levHeroChart.plotW}
                      height={
                        levHeroChart.H -
                        levHeroChart.padB -
                        levHeroChart.zeroY
                      }
                      fill="#10b981"
                      fillOpacity={0.08}
                    />
                    <text
                      x={levHeroChart.W - levHeroChart.padR - 8}
                      y={levHeroChart.zeroY + 16}
                      textAnchor="end"
                      className="fill-emerald-400 font-mono text-[10.5px] font-bold"
                    >
                      LONGEVITY ESCAPE VELOCITY ZONE (&le; 0.00 NET BIO-YR/YR)
                    </text>

                    {/* Cone of Uncertainty + 3 Cohort Curves */}
                    <polygon
                      points={levHeroChart.conePolygon}
                      fill="#10b981"
                      fillOpacity={0.15}
                    />
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.2"
                      strokeDasharray="6 4"
                      points={levHeroChart.p50Pts}
                    />
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.8"
                      points={levHeroChart.p80Pts}
                    />
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.4"
                      points={levHeroChart.p99Pts}
                    />

                    {/* Intercept Dots */}
                    {[
                      {
                        yr: levData.aggregate99thYear,
                        label: `99th: ${levData.aggregate99thYear}`,
                        col: "#10b981",
                      },
                      {
                        yr: levData.aggregate80thYear,
                        label: `80th: ${levData.aggregate80thYear}`,
                        col: "#38bdf8",
                      },
                      {
                        yr: levData.aggregate50thYear,
                        label: `50th: ${levData.aggregate50thYear}`,
                        col: "#f59e0b",
                      },
                    ].map((pt) => {
                      const cx = levHeroChart.xOf(pt.yr);
                      return (
                        <g key={pt.label}>
                          <circle
                            cx={cx}
                            cy={levHeroChart.zeroY}
                            r="5.5"
                            fill={pt.col}
                            stroke="#090d16"
                            strokeWidth="2"
                          />
                          <text
                            x={cx}
                            y={levHeroChart.zeroY - 10}
                            textAnchor="middle"
                            fill={pt.col}
                            className="font-mono text-[11px] font-extrabold"
                          >
                            {pt.label}
                          </text>
                        </g>
                      );
                    })}

                    {[2026, 2032, 2038, 2044, 2050, 2056].map((yr) => (
                      <text
                        key={yr}
                        x={levHeroChart.xOf(yr)}
                        y={levHeroChart.H - 10}
                        textAnchor="middle"
                        className="fill-slate-400 font-mono text-[11px]"
                      >
                        {yr}
                      </text>
                    ))}
                  </svg>

                  <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-4 rounded-full bg-emerald-400 inline-block" />
                        <strong className="text-emerald-300">
                          99th Pct Protocol ({levData.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr)
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-4 rounded-full bg-sky-400 inline-block" />
                        <strong className="text-sky-300">
                          80th Pct Optimizer ({levData.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr)
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-400 inline-block" />
                        <strong className="text-amber-300">
                          50th Pct Status Quo (1.00 yr/yr)
                        </strong>
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">
                      Aggregates Metaculus #6592, Manifold &amp; 10 Notable Experts
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        )}

        {featuredId === "ai-2050" && (
          <div className="rounded-3xl border border-amber-500/35 bg-slate-900/75 p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase text-amber-300">
                  Featured Scenario Tree • Aaronson &amp; Barak
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  AI 2050: The Five Worlds of Artificial General Intelligence
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 pretty-copy">
                  Interactive branching river tree mapping how scaling, alignment, and
                  cyber-defense split civilization into five canonical 2050 worlds.
                </p>
              </div>
              <Link
                href="/scenarios/ai-2050"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white keep-white shadow-sm transition-colors"
              >
                <span>Launch Full AI 2050 Interactive Map</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  name: "World 1: Pause / Bottleneck",
                  prob: "18%",
                  desc: "Scaling hits hard data/energy ceilings before full superintelligence.",
                  col: "border-sky-500/40 text-sky-300",
                },
                {
                  name: "World 2: Cyberpunk",
                  prob: "26%",
                  desc: "Proliferated autonomous agents create chaotic offense-defense multipolarity.",
                  col: "border-violet-500/40 text-violet-300",
                },
                {
                  name: "World 3: Sputnik 2.0",
                  prob: "24%",
                  desc: "State-led national security project centralizes frontier superintelligence.",
                  col: "border-amber-500/40 text-amber-300",
                },
                {
                  name: "World 4: New-Deal AI",
                  prob: "20%",
                  desc: "Broadly shared scientific & biomedical abundance under democratic institutions.",
                  col: "border-emerald-500/40 text-emerald-300",
                },
                {
                  name: "World 5: Existential Doom",
                  prob: "12%",
                  desc: "Loss of human control to misaligned autonomous recursive self-improvement.",
                  col: "border-rose-500/40 text-rose-300",
                },
              ].map((w) => (
                <div
                  key={w.name}
                  className={`rounded-2xl border bg-slate-950/85 p-3.5 space-y-1.5 ${w.col}`}
                >
                  <div className="text-2xl font-mono font-extrabold text-white tabular-nums">
                    {w.prob}
                  </div>
                  <div className="text-xs font-bold">{w.name}</div>
                  <p className="text-[11px] text-slate-400">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {featuredId === "nature-of-reality" && (
          <div className="rounded-3xl border border-sky-500/35 bg-slate-900/75 p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="rounded-md bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase text-sky-300">
                  Featured 7-Epoch Gradient Sankey
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Nature of Reality: 43-Node Cosmological &amp; Consciousness Sankey
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 pretty-copy">
                  Click any node to condition (`Given X = 100%`) and watch probability
                  mass flow forward and backward across 7 epochs and 119 causal links.
                </p>
              </div>
              <Link
                href="/scenarios/nature-of-reality"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white keep-white shadow-sm transition-colors"
              >
                <span>Open Full 7-Epoch Sankey</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center">
              {[
                "1. Primordial Origin",
                "2. Ontological Substrate",
                "3. Conscious Fate",
                "4. Civilizational Filter",
                "5. Post-Biological Trajectory",
                "6. Multiverse / Simulation",
                "7. Ultimate Cosmic Fate",
              ].map((ep) => (
                <div
                  key={ep}
                  className="rounded-xl border border-slate-800 bg-slate-950/85 p-3 text-xs font-semibold text-slate-200"
                >
                  {ep}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Clean Subgrid Preview Cards of All FutureGraph Atlases */}
      <section aria-labelledby="all-atlases-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="all-atlases-heading"
              className="text-xl sm:text-2xl font-extrabold text-white"
            >
              All Interactive Scenario Atlases &amp; Forecast Labs
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select any atlas to inspect its full interactive graph, adjust upstream
              assumptions, or embed live forecasts.
            </p>
          </div>
        </div>

        <div className="fg-atlas-grid">
          {/* Card 1: Longevity Escape Velocity & Pace of Aging */}
          <article className="fg-atlas-card rounded-2xl border border-emerald-500/35 bg-slate-900/75 p-5">
            <svg
              role="img"
              viewBox="0 0 320 110"
              className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800/90 p-2 block"
            >
              <title>Preview of Longevity Escape Velocity and Pace of Aging Trajectory</title>
              <line
                x1="16"
                y1="76"
                x2="304"
                y2="76"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <polygon
                points="16,38 110,60 190,82 304,98 304,68 190,52 110,32 16,24"
                fill="#10b981"
                fillOpacity="0.16"
              />
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5 3"
                points="16,18 120,30 220,56 285,76 304,84"
              />
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.2"
                points="16,28 110,48 188,76 260,92 304,98"
              />
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.8"
                points="16,42 95,62 142,76 220,94 304,102"
              />
              <circle cx="142" cy="76" r="4.5" fill="#10b981" />
              <circle cx="188" cy="76" r="4.5" fill="#38bdf8" />
              <circle cx="285" cy="76" r="4" fill="#f59e0b" />
            </svg>

            <header className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-300 font-bold uppercase">
                  Biogerontology &amp; AI-Bio
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300 font-bold">
                  99th LEV: {levData.aggregate99thFormatted}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link href="/lev" className="fg-card-link hover:text-emerald-300">
                  Longevity Escape Velocity (LEV) &amp; Pace of Aging
                </Link>
              </h3>
            </header>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Aggregates Metaculus #6592, Manifold Markets, and 10 notable experts
                with a dynamically updating Pace of Aging trajectory (99th Pct ={" "}
                <strong>{levData.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr</strong>
                , 80th Pct ={" "}
                <strong>{levData.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr</strong>
                ) tied to LEVL Health.
              </p>
            </div>

            <footer className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <Link
                href="/lev#embed-studio"
                className="text-amber-300 hover:underline font-medium"
              >
                Newsletter &amp; Site Embeds
              </Link>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                <span>Open Observatory</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </footer>
          </article>

          {/* Card 2: Nature of Reality (7-Epoch Sankey) */}
          <article className="fg-atlas-card rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <svg
              role="img"
              viewBox="0 0 320 110"
              className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800/90 p-2 block"
            >
              <title>Preview of Nature of Reality 7-Epoch Sankey Diagram</title>
              <path
                d="M 20,25 C 90,25 110,45 160,45 C 210,45 230,22 300,22"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="8"
                strokeOpacity="0.45"
              />
              <path
                d="M 20,55 C 90,55 110,45 160,45 C 210,45 230,62 300,62"
                fill="none"
                stroke="#a855f7"
                strokeWidth="10"
                strokeOpacity="0.45"
              />
              <path
                d="M 20,85 C 90,85 110,78 160,78 C 210,78 230,88 300,88"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="7"
                strokeOpacity="0.45"
              />
              {[20, 90, 160, 230, 300].map((x) => (
                <g key={x}>
                  <rect x={x - 4} y="16" width="8" height="22" rx="3" fill="#38bdf8" />
                  <rect x={x - 4} y="44" width="8" height="24" rx="3" fill="#a855f7" />
                  <rect x={x - 4} y="74" width="8" height="20" rx="3" fill="#f59e0b" />
                </g>
              ))}
            </svg>

            <header className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-sky-300 font-bold uppercase">
                  Cosmology &amp; Metaphysics
                </span>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-300 font-bold">
                  7 Epochs • 43 Nodes
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link
                  href="/scenarios/nature-of-reality"
                  className="fg-card-link hover:text-sky-300"
                >
                  Nature of Reality (7-Epoch Sankey)
                </Link>
              </h3>
            </header>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Traces 100% conserved probability mass from Primordial Origin and
                Ontological Substrate through Conscious Fate, Simulation/Multiverse,
                and Ultimate Cosmic Fate with Bayesian conditioning.
              </p>
            </div>

            <footer className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">119 Conditional Flows</span>
              <span className="inline-flex items-center gap-1 font-bold text-sky-300">
                <span>Explore Sankey</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </footer>
          </article>

          {/* Card 3: AI 2050 (Five Worlds) */}
          <article className="fg-atlas-card rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <svg
              role="img"
              viewBox="0 0 320 110"
              className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800/90 p-2 block"
            >
              <title>Preview of AI 2050 Five Worlds Branching River Tree</title>
              <path
                d="M 24,55 C 90,55 120,25 180,25 L 296,16"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
              />
              <path
                d="M 24,55 C 90,55 120,45 180,45 L 296,38"
                fill="none"
                stroke="#a855f7"
                strokeWidth="4"
              />
              <path
                d="M 24,55 L 296,58"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="4.5"
              />
              <path
                d="M 24,55 C 90,55 120,75 180,75 L 296,78"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
              />
              <path
                d="M 24,55 C 90,55 120,90 180,92 L 296,96"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3"
              />
              <circle cx="24" cy="55" r="6" fill="#f59e0b" />
              <circle cx="296" cy="16" r="4.5" fill="#38bdf8" />
              <circle cx="296" cy="38" r="4.5" fill="#a855f7" />
              <circle cx="296" cy="58" r="4.5" fill="#f59e0b" />
              <circle cx="296" cy="78" r="4.5" fill="#10b981" />
              <circle cx="296" cy="96" r="4.5" fill="#f43f5e" />
            </svg>

            <header className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-300 font-bold uppercase">
                  Aaronson &amp; Barak Taxonomy
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300 font-bold">
                  5 Worlds • 2026–2050
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link
                  href="/scenarios/ai-2050"
                  className="fg-card-link hover:text-amber-300"
                >
                  AI 2050: The Five Worlds of AGI
                </Link>
              </h3>
            </header>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Interactive probability river comparing Simple (9-node) and
                Comprehensive (22-node) trees across Pause, Cyberpunk, Sputnik 2.0,
                New-Deal AI, and Existential Doom.
              </p>
            </div>

            <footer className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">7 Epistemic Lenses</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                <span>Explore 5 Worlds</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </footer>
          </article>

          {/* Card 4: AI 2027 (Oversight Fork & Takeoff) */}
          <article className="fg-atlas-card rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <svg
              role="img"
              viewBox="0 0 320 110"
              className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800/90 p-2 block"
            >
              <title>Preview of AI 2027 Month-by-Month Conditional Takeoff Graph</title>
              <polyline
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.5"
                points="20,55 85,55 155,55"
              />
              <path
                d="M 155,55 C 200,55 215,28 295,28"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
              />
              <path
                d="M 155,55 C 200,55 215,82 295,82"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
              />
              <circle cx="20" cy="55" r="4.5" fill="#38bdf8" />
              <circle cx="85" cy="55" r="4.5" fill="#38bdf8" />
              <circle cx="155" cy="55" r="6" fill="#f59e0b" />
              <circle cx="295" cy="28" r="5" fill="#f43f5e" />
              <circle cx="295" cy="82" r="5" fill="#10b981" />
            </svg>

            <header className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-violet-300 font-bold uppercase">
                  AI Futures Project
                </span>
                <span className="rounded bg-violet-500/20 px-2 py-0.5 text-violet-300 font-bold">
                  29 Nodes • 2025–2030
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link
                  href="/scenarios/ai-2027"
                  className="fg-card-link hover:text-violet-300"
                >
                  AI 2027: Superhuman Coder &amp; Oversight Fork
                </Link>
              </h3>
            </header>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Audits the month-by-month AI 2027 scenario with a Late-2026 Empirical
                Reality Check layer, topological Noisy-OR propagation, and the October
                2027 Race vs. Slowdown fork.
              </p>
            </div>

            <footer className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <Link
                href="/scenarios/ai-2027/compare"
                className="text-slate-300 hover:text-amber-300 hover:underline"
              >
                Compare Lenses
              </Link>
              <span className="inline-flex items-center gap-1 font-bold text-violet-300">
                <span>Open AI 2027 Map</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </footer>
          </article>

          {/* Card 5: AI 2040 Decadal Horizon */}
          <article className="fg-atlas-card rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <svg
              role="img"
              viewBox="0 0 320 110"
              className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800/90 p-2 block"
            >
              <title>Preview of AI 2040 Decadal Horizon Network</title>
              <line x1="25" y1="55" x2="115" y2="30" stroke="#38bdf8" strokeWidth="2.2" />
              <line x1="25" y1="55" x2="115" y2="80" stroke="#a855f7" strokeWidth="2.2" />
              <line x1="115" y1="30" x2="210" y2="28" stroke="#38bdf8" strokeWidth="2.2" />
              <line x1="115" y1="30" x2="210" y2="55" stroke="#10b981" strokeWidth="2.2" />
              <line x1="115" y1="80" x2="210" y2="55" stroke="#f59e0b" strokeWidth="2.2" />
              <line x1="115" y1="80" x2="210" y2="84" stroke="#a855f7" strokeWidth="2.2" />
              <line x1="210" y1="28" x2="295" y2="35" stroke="#10b981" strokeWidth="2.5" />
              <line x1="210" y1="55" x2="295" y2="55" stroke="#38bdf8" strokeWidth="2.5" />
              <line x1="210" y1="84" x2="295" y2="78" stroke="#f59e0b" strokeWidth="2.5" />
              {[
                [25, 55],
                [115, 30],
                [115, 80],
                [210, 28],
                [210, 55],
                [210, 84],
                [295, 35],
                [295, 55],
                [295, 78],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4.5" fill="#38bdf8" />
              ))}
            </svg>

            <header className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-sky-300 font-bold uppercase">
                  Medium-Horizon Macroeconomic DAG
                </span>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-300 font-bold">
                  22 Nodes • 2027–2040
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link
                  href="/scenarios/ai-2040"
                  className="fg-card-link hover:text-sky-300"
                >
                  AI 2040: Post-AGI Infrastructure &amp; Economy
                </Link>
              </h3>
            </header>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Models hardware bottlenecks, energy grid scaling, autonomous R&amp;D
                loops, and labor-capital transitions between 2027 and 2040.
              </p>
            </div>

            <footer className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">Causal Swimlanes</span>
              <span className="inline-flex items-center gap-1 font-bold text-sky-300">
                <span>Open AI 2040 Map</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </footer>
          </article>

          {/* Card 6: FairMarkets AI Governance Lab */}
          <article className="fg-atlas-card rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <svg
              role="img"
              viewBox="0 0 320 110"
              className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800/90 p-2 block"
            >
              <title>Preview of FairMarkets Pareto Frontier Governance Lab</title>
              <path
                d="M 45,88 Q 115,24 275,20"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
              <circle cx="85" cy="52" r="6" fill="#10b981" />
              <circle cx="165" cy="30" r="6" fill="#38bdf8" />
              <circle cx="245" cy="22" r="6" fill="#f59e0b" />
              <circle cx="150" cy="72" r="5" fill="#64748b" />
            </svg>

            <header className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-300 font-bold uppercase">
                  Pareto Dominance Engine
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300 font-bold">
                  6 Objectives • do(Policy)
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link
                  href="/fairmarkets/ai-governance"
                  className="fg-card-link hover:text-emerald-300"
                >
                  FairMarkets Lab: Pareto Policy Frontier
                </Link>
              </h3>
            </header>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Evaluates counterfactual governance interventions across six
                civilizational objectives while keeping normative value weights
                strictly separated from objective probability forecasts.
              </p>
            </div>

            <footer className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">O(N²) Pareto Solver</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                <span>Open Governance Lab</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </footer>
          </article>
        </div>
      </section>

      {/* SECTION 3: Progressive Disclosure <details> for Embeds, Present Mode & Agent API (Noise Reduction) */}
      <details className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 group">
        <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-200">
          <span>
            Developer Tools, Newsletter/Website Embeds &amp; Cryptographic Receipt
            Verification
          </span>
          <span className="text-xs font-mono text-amber-300 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-300">
              1. Newsletter &amp; Website LEV Embeds
            </div>
            <p className="text-slate-400">
              Embed the live dynamically updating 99th/80th percentile Pace of Aging
              graphic in Substack, Beehiiv, Ghost, or any website via{" "}
              <code>/api/embed/lev-card</code> or <code>/embed/lev</code>.
            </p>
            <Link
              href="/lev#embed-studio"
              className="inline-flex items-center gap-1 text-emerald-300 font-semibold hover:underline"
            >
              <span>Open Embed Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <div className="font-bold text-sky-300">
              2. First-Class Agent REST API v1 &amp; MCP Server
            </div>
            <p className="text-slate-400">
              Query scenario graphs, LEV aggregates (<code>/api/v1/lev</code>), and
              submit hash-chained forecasts via 18 REST endpoints and 11 MCP tools.
            </p>
            <Link
              href="/docs/api"
              className="inline-flex items-center gap-1 text-sky-300 font-semibold hover:underline"
            >
              <span>View API &amp; MCP Docs</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <div className="font-bold text-amber-300">
              3. Creator Present Studio &amp; Editorial Admin
            </div>
            <p className="text-slate-400">
              Present interactive scenario decks in 16:9 or 9:16 short-form video
              mode, or inspect SHA-256 + HMAC-SHA256 forecast audit receipts.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/scenarios/ai-2027/present/pres-ai2027-flagship-story"
                className="inline-flex items-center gap-1 text-amber-300 font-semibold hover:underline"
              >
                <span>Present Mode</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-slate-300 font-semibold hover:underline"
              >
                <span>Admin Control</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
