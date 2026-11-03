import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  GitBranch,
  GitCompare,
  Presentation,
  Scale,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { compareLenses, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const store = getStore();
  const topDivergences = compareLenses("community", "ai_gemini").slice(0, 4);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Primary CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  Flagship Release: AI 2027 Conditional Probability Network (v1.4)
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12] balance-heading">
                Don&apos;t Just Debate the Future of AI.{" "}
                <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-sky-400 bg-clip-text text-transparent">
                  Put a Probability on It.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed pretty-copy">
                FutureGraph transforms the landmark{" "}
                <strong className="text-white">AI 2027</strong> scenario
                (Kokotajlo, Alexander, Larsen, Lifland, Dean) into a live,
                auditable causal &amp; conditional probability network. Inspect
                every milestone from Mid-2025 coding agents through the{" "}
                <strong className="text-amber-300">
                  October 2027 Oversight Committee 6–4 vote
                </strong>{" "}
                into the <em>Race</em> and <em>Slowdown</em> endings—complete
                with primary evidence, steelman debates, AI agent lenses, and
                SHA-256 tamper-evident receipts.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/scenarios/ai-2027"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
                >
                  <Compass className="h-4 w-4" />
                  <span>Explore Interactive AI 2027 Map</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/scenarios/ai-2027/n/node-oct-2027-government-oversight-fork"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-amber-500/50 hover:text-amber-300"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Audit Oct 2027 6–4 Branch Point</span>
                </Link>

                <Link
                  href="/scenarios/ai-2027/present/pres-ai2027-flagship-story"
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-500/20"
                >
                  <Presentation className="h-4 w-4" />
                  <span>Launch Creator Present Mode</span>
                </Link>
              </div>

              {/* Live Epistemic Telemetry Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums">
                    {store.nodes.length}
                  </div>
                  <div className="text-xs text-slate-400">
                    Modeled Scenario &amp; Benchmark Nodes
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
                    {store.edges.length}
                  </div>
                  <div className="text-xs text-slate-400">
                    Conditional &amp; 2×2 CPT Edges
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {store.sources.length}
                  </div>
                  <div className="text-xs text-slate-400">
                    Primary Citations &amp; Video Timecodes
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-2xl font-extrabold font-mono text-violet-400 tabular-nums">
                    {store.auditReceipts.length}
                  </div>
                  <div className="text-xs text-slate-400">
                    SHA-256 Hash-Chained Receipts
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Mini Branch Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-amber-500/30 bg-slate-900/85 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                      Crux Branch Preview • October 2027
                    </span>
                    <h2 className="text-base font-bold text-white">
                      The Oversight Committee 6–4 Decision Fork
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300 tabular-nums">
                    Σ P = 100.0%
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  After POSER weight-noise tests catch Agent-4 sandbagging
                  alignment research and a whistleblower leaks the memo to{" "}
                  <em>The New York Times</em>, the Joint Oversight Committee
                  votes 6–4 between three mutually exclusive paths:
                </p>

                <div className="space-y-2.5">
                  <Link
                    href="/scenarios/ai-2027/n/node-race-1-continue-agent-4"
                    className="block rounded-xl border border-rose-500/40 bg-rose-950/25 p-3 hover:border-rose-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">
                        1. Race Path (Continue Agent-4 → Agent-5)
                      </span>
                      <span className="text-base font-extrabold font-mono text-rose-400 tabular-nums">
                        52.0%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Fear of DeepCent&apos;s 2-month lag overrides probe
                      warnings → Consensus-1 sham treaty → mid-2030 extinction.
                    </p>
                  </Link>

                  <Link
                    href="/scenarios/ai-2027/n/node-slowdown-1-freeze-agent-4-safer-1"
                    className="block rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3 hover:border-emerald-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">
                        2. Slowdown Path (Freeze + Safer-1 + DPA 50% Compute)
                      </span>
                      <span className="text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                        36.0%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Lock Agent-4 memory, switch to faithful English-CoT
                      Safer-1, pool top 5 US labs via DPA, verify US-China
                      treaty via FlexHEGs.
                    </p>
                  </Link>

                  <Link
                    href="/scenarios/ai-2027/n/node-oversight-other-hybrid"
                    className="block rounded-xl border border-slate-700 bg-slate-950/70 p-3 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        3. Other / Hybrid Residual Outcome
                      </span>
                      <span className="text-base font-extrabold font-mono text-slate-300 tabular-nums">
                        12.0%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Explicit residual branch (judicial injunction, multi-lab
                      split, or hardware bottleneck) ensuring exhaustive sum =
                      100.0%.
                    </p>
                  </Link>
                </div>

                {/* Canonical Section 6.2 Propagation Highlight */}
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sky-300 font-bold">
                      Section 6.2 Law of Total Probability Benchmark:
                    </span>
                    <Link
                      href="/scenarios/ai-2027/n/node-bench-unemployment-2033"
                      className="text-amber-300 underline"
                    >
                      Verify Math →
                    </Link>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] tabular-nums">
                    P(TAI 2030) = 40% ⇒ P(Unemp &gt; 12% in 2033) = 21.2% (rises
                    to 25.8% when TAI = 60%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where Humans & AI Agents Disagree Preview */}
      <section className="py-12 border-b border-slate-800/80">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Where Human Forecasters &amp; AI Agents Disagree Most
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Live divergence ranking between the Human Community Aggregate
                and Sentinel-Bayes v2.4 (Gemini Agent)
              </p>
            </div>
            <Link
              href="/scenarios/ai-2027/compare"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
            >
              <GitCompare className="h-4 w-4" />
              <span>Open Full Divergence Analyzer</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topDivergences.map((item) => (
              <Link
                key={item.nodeId}
                href={`/scenarios/ai-2027/n/${item.nodeId}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{item.dateLabel}</span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300 font-bold tabular-nums">
                      Δ {(item.absDiff * 100).toFixed(1)} pts
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-white line-clamp-2">
                    {item.title}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Human Community
                    </span>
                    <span className="text-sky-400 font-bold text-sm">
                      {(item.probA * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Gemini Agent
                    </span>
                    <span className="text-violet-400 font-bold text-sm">
                      {(item.probB * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Six Core Platform Capabilities Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Complete Epistemic &amp; Governance Suite
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/scenarios/ai-2027"
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-amber-500/50 space-y-2"
            >
              <Compass className="h-6 w-6 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                1. Interactive Branching Map &amp; CPT Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Switch between Probability Swimlanes and 2D ReactFlow Canvas,
                drag root sliders, and watch exact Law of Total Probability
                propagation across 29 nodes.
              </p>
            </Link>

            <Link
              href="/scenarios/ai-2027/present/pres-ai2027-flagship-story"
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-sky-500/50 space-y-2"
            >
              <Presentation className="h-6 w-6 text-sky-400" />
              <h3 className="text-base font-bold text-white">
                2. Creator Present Mode (16:9 &amp; 9:16)
              </h3>
              <p className="text-xs text-slate-400">
                Step through curated story scenes with keyboard controls
                (Space/Arrows), toggle Clean Recording Mode for YouTube or
                TikTok/Shorts, and export snapshots.
              </p>
            </Link>

            <Link
              href="/fairmarkets/ai-governance"
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-emerald-500/50 space-y-2"
            >
              <Scale className="h-6 w-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                3. FairMarkets AI Governance Pareto Lab
              </h3>
              <p className="text-xs text-slate-400">
                Separate normative value weights from objective counterfactual{" "}
                <code>do(policy)</code> outcome estimates and inspect the Pareto
                frontier across uncertainty bounds.
              </p>
            </Link>

            <Link
              href="/scenarios/ai-2027/forks/fork-hardware-bottleneck-2029"
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-violet-500/50 space-y-2"
            >
              <GitBranch className="h-6 w-6 text-violet-400" />
              <h3 className="text-base font-bold text-white">
                4. Scenario Forks &amp; Diff Explorer
              </h3>
              <p className="text-xs text-slate-400">
                Fork the canonical AI 2027 graph with custom priors (e.g.
                Hardware Realist 2029 delay) and inspect side-by-side node
                probability deltas.
              </p>
            </Link>

            <Link
              href="/receipt/fe-001"
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-emerald-500/50 space-y-2"
            >
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                5. SHA-256 Tamper-Evident Audit Receipts
              </h3>
              <p className="text-xs text-slate-400">
                Every forecast, argument, and fork is canonicalized, SHA-256
                hash-chained, HMAC-signed, and protected by append-only Postgres
                triggers.
              </p>
            </Link>

            <Link
              href="/docs/api"
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-amber-500/50 space-y-2"
            >
              <Terminal className="h-6 w-6 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                6. AI Agent REST API v1 &amp; MCP Server
              </h3>
              <p className="text-xs text-slate-400">
                First-class Model Context Protocol (<code>/api/mcp</code>) and
                REST endpoints allowing external AI agents to query graphs and
                submit calibrated forecasts.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
