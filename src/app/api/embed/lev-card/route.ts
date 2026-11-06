import { NextRequest, NextResponse } from "next/server";
import {
  computeLevDashboard,
  ConservativeUpdateMode,
  formatDecimalYear,
} from "@/lib/lev-engine";
import { LEV_EXPERT_PREDICTIONS, LEV_PREDICTION_MARKETS } from "@/data/lev-seed";

export const dynamic = "force-dynamic";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const variant = searchParams.get("variant") || "full"; // "full" | "pace" | "markets"
  const updateMode: ConservativeUpdateMode =
    searchParams.get("mode") === "moderate" ? "moderate" : "conservative";
  const ageParam = Number(searchParams.get("age") || "35");
  const currentAge = Number.isFinite(ageParam)
    ? Math.max(18, Math.min(90, ageParam))
    : 35;

  const data = computeLevDashboard({
    referenceDate: new Date(),
    updateMode,
    currentChronologicalAge: currentAge,
  });

  const isLight = theme === "light";
  const bgStart = isLight ? "#f8fafc" : "#070b14";
  const bgEnd = isLight ? "#eef2f6" : "#0f172a";
  const cardBg = isLight ? "#ffffff" : "#111827";
  const panelBg = isLight ? "#f1f5f9" : "#0b1120";
  const borderCol = isLight ? "#cbd5e1" : "#1e293b";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#334155" : "#cbd5e1";
  const textMuted = isLight ? "#64748b" : "#94a3b8";
  const gridCol = isLight ? "#e2e8f0" : "#1e293b";

  const emeraldCol = isLight ? "#047857" : "#10b981";
  const skyCol = isLight ? "#0369a1" : "#38bdf8";
  const amberCol = isLight ? "#b45309" : "#f59e0b";
  const violetCol = isLight ? "#6d28d9" : "#a855f7";

  // Helper to map trajectory year (2026..2060) & Net PoA (-0.30..1.10) to SVG coords
  const buildTrajectoryPolylines = (
    chartX: number,
    chartY: number,
    chartW: number,
    chartH: number
  ) => {
    const minYr = 2026;
    const maxYr = 2060;
    const minPoA = -0.25;
    const maxPoA = 1.1;

    const xOf = (yr: number) =>
      Math.round((chartX + ((yr - minYr) / (maxYr - minYr)) * chartW) * 10) / 10;
    const yOf = (poa: number) => {
      const clamped = Math.max(minPoA, Math.min(maxPoA, poa));
      return (
        Math.round(
          (chartY + ((maxPoA - clamped) / (maxPoA - minPoA)) * chartH) * 10
        ) / 10
      );
    };

    const zeroY = yOf(0.0);
    const p99Pts = data.trajectorySeries
      .map((pt) => `${xOf(pt.year)},${yOf(pt.p99NetPoA)}`)
      .join(" ");
    const p80Pts = data.trajectorySeries
      .map((pt) => `${xOf(pt.year)},${yOf(pt.p80NetPoA)}`)
      .join(" ");
    const p50Pts = data.trajectorySeries
      .map((pt) => `${xOf(pt.year)},${yOf(pt.p50NetPoA)}`)
      .join(" ");

    // Cone of uncertainty polygon around 99th percentile
    const coneUpper = data.trajectorySeries
      .map((pt) => `${xOf(pt.year)},${yOf(pt.p99ConeSlow95th)}`)
      .join(" ");
    const coneLower = [...data.trajectorySeries]
      .reverse()
      .map((pt) => `${xOf(pt.year)},${yOf(pt.p99ConeFast5th)}`)
      .join(" ");
    const conePolygon = `${coneUpper} ${coneLower}`;

    return {
      xOf,
      yOf,
      zeroY,
      p99Pts,
      p80Pts,
      p50Pts,
      conePolygon,
    };
  };

  if (variant === "pace") {
    const chart = buildTrajectoryPolylines(90, 290, 1030, 250);
    const p99X = chart.xOf(data.aggregate99thYear);
    const p80X = chart.xOf(data.aggregate80thYear);
    const p50X = chart.xOf(data.aggregate50thYear);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" width="1200" height="630" viewBox="0 0 1200 630">
      <title>Dynamic Pace of Aging (99th vs 80th Percentile) &amp; LEV Trajectory (${esc(data.asOfDateFormatted)})</title>
      <desc>Conservative Bayesian Pace of Aging tracker: 99th Percentile Person at ${data.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr (LEV: ${esc(data.aggregate99thFormatted)}), 80th Percentile Person at ${data.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr (LEV: ${esc(data.aggregate80thFormatted)}), Status Quo at 1.00 yr/yr (LEV: ${esc(data.aggregate50thFormatted)}).</desc>
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgStart}"/>
          <stop offset="100%" stop-color="${bgEnd}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect x="24" y="20" width="1152" height="590" rx="20" fill="${cardBg}" stroke="${borderCol}" stroke-width="2"/>

      <!-- Header -->
      <text x="52" y="58" fill="${emeraldCol}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" letter-spacing="1.5">DYNAMIC PACE OF AGING &amp; LONGEVITY ESCAPE VELOCITY TRAJECTORY • CONSERVATIVE UPDATES</text>
      <text x="52" y="92" fill="${textPrimary}" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800">Current Biological Pace of Aging: 99th vs. 80th Percentile Human</text>
      <text x="1144" y="58" text-anchor="end" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="13">UPDATED: ${esc(data.asOfDateFormatted)} • TIED TO LEVLHEALTH.COM/LEVTRAJECTORY</text>

      <!-- 3 Metric Cards -->
      <rect x="52" y="114" width="350" height="128" rx="14" fill="${panelBg}" stroke="${emeraldCol}" stroke-width="2"/>
      <text x="72" y="140" fill="${emeraldCol}" font-family="system-ui, sans-serif" font-size="13" font-weight="700">99TH PERCENTILE PERSON (TOP 1% PROTOCOL)</text>
      <text x="72" y="190" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="44" font-weight="800">${data.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} <tspan font-size="18" fill="${textSecondary}">bio-yr/yr</tspan></text>
      <text x="72" y="220" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="13">${data.cohorts.p99.bioMonthsPerYear} bio-mos/yr (+${data.cohorts.p99.daysGainedPerYear}d banked) • LEV: <tspan font-weight="700" fill="${emeraldCol}">${esc(data.aggregate99thFormatted)}</tspan></text>

      <rect x="424" y="114" width="350" height="128" rx="14" fill="${panelBg}" stroke="${skyCol}" stroke-width="2"/>
      <text x="444" y="140" fill="${skyCol}" font-family="system-ui, sans-serif" font-size="13" font-weight="700">80TH PERCENTILE PERSON (TOP 20% HEALTH)</text>
      <text x="444" y="190" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="44" font-weight="800">${data.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} <tspan font-size="18" fill="${textSecondary}">bio-yr/yr</tspan></text>
      <text x="444" y="220" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="13">${data.cohorts.p80.bioMonthsPerYear} bio-mos/yr (+${data.cohorts.p80.daysGainedPerYear}d banked) • LEV: <tspan font-weight="700" fill="${skyCol}">${esc(data.aggregate80thFormatted)}</tspan></text>

      <rect x="796" y="114" width="348" height="128" rx="14" fill="${panelBg}" stroke="${amberCol}" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="816" y="140" fill="${amberCol}" font-family="system-ui, sans-serif" font-size="13" font-weight="700">50TH PERCENTILE (STATUS QUO BASELINE)</text>
      <text x="816" y="190" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="44" font-weight="800">${data.cohorts.p50.intrinsicPaceOfAging.toFixed(2)} <tspan font-size="18" fill="${textSecondary}">bio-yr/yr</tspan></text>
      <text x="816" y="220" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="13">12.0 bio-mos/yr (Population Mean) • LEV: <tspan font-weight="700" fill="${amberCol}">${esc(data.aggregate50thFormatted)}</tspan></text>

      <!-- Trajectory Chart Area -->
      <text x="90" y="274" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="13" font-weight="700">NET BIOLOGICAL AGING VELOCITY (2026–2060) &amp; ESCAPE VELOCITY THRESHOLD (&lt;= 0.00 BIO-YR/YR)</text>
      <line x1="90" y1="${chart.yOf(1.0)}" x2="1120" y2="${chart.yOf(1.0)}" stroke="${gridCol}" stroke-width="1"/>
      <text x="80" y="${chart.yOf(1.0) + 4}" text-anchor="end" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="11">1.00</text>
      <line x1="90" y1="${chart.yOf(0.5)}" x2="1120" y2="${chart.yOf(0.5)}" stroke="${gridCol}" stroke-width="1"/>
      <text x="80" y="${chart.yOf(0.5) + 4}" text-anchor="end" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="11">0.50</text>

      <!-- LEV Escape Velocity Threshold Line (0.00) -->
      <rect x="90" y="${chart.zeroY}" width="1030" height="${290 + 250 - chart.zeroY}" fill="${emeraldCol}" fill-opacity="0.07"/>
      <line x1="90" y1="${chart.zeroY}" x2="1120" y2="${chart.zeroY}" stroke="${emeraldCol}" stroke-width="2" stroke-dasharray="8 4"/>
      <text x="80" y="${chart.zeroY + 4}" text-anchor="end" fill="${emeraldCol}" font-family="ui-monospace, monospace" font-size="12" font-weight="700">0.00 LEV</text>
      <text x="1112" y="${chart.zeroY + 18}" text-anchor="end" fill="${emeraldCol}" font-family="system-ui, sans-serif" font-size="11" font-weight="700">LONGEVITY ESCAPE VELOCITY ZONE (&gt;= +1 YR LIFE EXPECTANCY / YR)</text>

      <!-- Cone of Uncertainty -->
      <polygon points="${chart.conePolygon}" fill="${emeraldCol}" fill-opacity="0.14"/>

      <!-- 3 Cohort Trajectory Curves -->
      <polyline fill="none" stroke="${amberCol}" stroke-width="2.5" stroke-dasharray="7 5" points="${chart.p50Pts}"/>
      <polyline fill="none" stroke="${skyCol}" stroke-width="3" points="${chart.p80Pts}"/>
      <polyline fill="none" stroke="${emeraldCol}" stroke-width="3.5" points="${chart.p99Pts}"/>

      <!-- Intercept Markers -->
      <circle cx="${p99X}" cy="${chart.zeroY}" r="6" fill="${emeraldCol}" stroke="${cardBg}" stroke-width="2"/>
      <text x="${p99X}" y="${chart.zeroY - 12}" text-anchor="middle" fill="${emeraldCol}" font-family="ui-monospace, monospace" font-size="12" font-weight="800">99th: ${data.aggregate99thYear}</text>

      <circle cx="${p80X}" cy="${chart.zeroY}" r="6" fill="${skyCol}" stroke="${cardBg}" stroke-width="2"/>
      <text x="${p80X}" y="${chart.zeroY - 12}" text-anchor="middle" fill="${skyCol}" font-family="ui-monospace, monospace" font-size="12" font-weight="800">80th: ${data.aggregate80thYear}</text>

      <circle cx="${p50X}" cy="${chart.zeroY}" r="6" fill="${amberCol}" stroke="${cardBg}" stroke-width="2"/>
      <text x="${p50X}" y="${chart.zeroY - 12}" text-anchor="middle" fill="${amberCol}" font-family="ui-monospace, monospace" font-size="12" font-weight="800">50th: ${data.aggregate50thYear}</text>

      <!-- X-Axis Labels -->
      ${[2026, 2030, 2035, 2040, 2045, 2050, 2055, 2060]
        .map(
          (yr) =>
            `<text x="${chart.xOf(yr)}" y="560" text-anchor="middle" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="12">${yr}</text>`
        )
        .join("")}

      <!-- Footer -->
      <text x="52" y="592" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="12">Model tied to <tspan fill="${emeraldCol}" font-weight="700">levlhealth.com/LEVTrajectory</tspan> • Aggregates Metaculus #6592, Manifold Markets, &amp; 10 Geroscience/AI-Bio Expert Forecasts</text>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Default "full" or "markets" card (1200x760) combining Aggregate Date + Pace of Aging + Market/Expert Forest Plot + Trajectory
  const chart = buildTrajectoryPolylines(640, 465, 510, 210);
  const p99X = chart.xOf(data.aggregate99thYear);
  const p80X = chart.xOf(data.aggregate80thYear);
  const p50X = chart.xOf(data.aggregate50thYear);

  // Forest plot scale (2028..2056) on left column
  const minForestYr = 2028;
  const maxForestYr = 2056;
  const fx = (yr: number) =>
    Math.round(
      (235 +
        ((Math.max(minForestYr, Math.min(maxForestYr, yr)) - minForestYr) /
          (maxForestYr - minForestYr)) *
          335) *
        10
    ) / 10;

  const topExperts = LEV_EXPERT_PREDICTIONS.slice(0, 7);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" width="1200" height="760" viewBox="0 0 1200 760">
    <title>99th Percentile Human Longevity Escape Velocity (LEV) Aggregate &amp; Dynamic Pace of Aging Tracker (${esc(data.asOfDateFormatted)})</title>
    <desc>Aggregate 99th Percentile Human LEV Date: ${esc(data.aggregate99thFormatted)} (${data.aggregate99thYear}). Current Pace of Aging: 99th Percentile = ${data.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} yr/yr, 80th Percentile = ${data.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} yr/yr.</desc>
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="760" fill="url(#bg)"/>
    <rect x="20" y="18" width="1160" height="724" rx="22" fill="${cardBg}" stroke="${borderCol}" stroke-width="2"/>

    <!-- Top Banner -->
    <text x="48" y="54" fill="${emeraldCol}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="1.6">FUTUREGRAPH × LEVL TRAJECTORY • LONGEVITY ESCAPE VELOCITY (LEV) OBSERVATORY</text>
    <text x="1152" y="54" text-anchor="end" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="12">LIVE CONSERVATIVE BAYESIAN UPDATE • ${esc(data.asOfDateFormatted)}</text>
    <text x="48" y="88" fill="${textPrimary}" font-family="system-ui, -apple-system, sans-serif" font-size="27" font-weight="800">99th-Percentile Human LEV Date &amp; Dynamic Pace of Aging</text>

    <!-- Row 1: 3 Primary Aggregate & Pace Cards -->
    <!-- Card 1: 99th Percentile LEV Date -->
    <rect x="48" y="108" width="356" height="142" rx="16" fill="${panelBg}" stroke="${emeraldCol}" stroke-width="2.5"/>
    <text x="68" y="134" fill="${emeraldCol}" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="0.8">AGGREGATE 99TH-PERCENTILE HUMAN LEV DATE</text>
    <text x="68" y="184" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="42" font-weight="800">${esc(formatDecimalYear(data.aggregate99thYear, true))} <tspan font-size="20" fill="${emeraldCol}">(${data.aggregate99thYear})</tspan></text>
    <text x="68" y="212" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="12.5">IQR Cone: <tspan font-family="ui-monospace, monospace" font-weight="700">${esc(data.cone99th.p25Formatted)} – ${esc(data.cone99th.p75Formatted)}</tspan> (${data.cohorts.p99.yearsToLev} yrs away)</text>
    <text x="68" y="234" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="11.5">Markets: ${data.marketAggregate99thYear} • Experts: ${data.expertAggregate99thYear} • Trajectory: ${data.trajectoryIntercept99thYear}</text>

    <!-- Card 2: 99th Percentile Current Pace of Aging -->
    <rect x="422" y="108" width="356" height="142" rx="16" fill="${panelBg}" stroke="${emeraldCol}" stroke-width="1.75"/>
    <text x="442" y="134" fill="${emeraldCol}" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="0.8">99TH PERCENTILE PACE OF AGING (TOP 1%)</text>
    <text x="442" y="184" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="42" font-weight="800">${data.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} <tspan font-size="18" fill="${textSecondary}">bio-yr / yr</tspan></text>
    <text x="442" y="212" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="12.5">Ages <tspan font-weight="700">${data.cohorts.p99.bioMonthsPerYear} mos</tspan> per 12 calendar mos (<tspan fill="${emeraldCol}" font-weight="700">+${data.cohorts.p99.daysGainedPerYear} days/yr banked</tspan>)</text>
    <text x="442" y="234" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="11.5">Conservative drift: -${data.cohorts.p99.annualConservativeDrift.toFixed(3)}/yr • Bio-Age at LEV (Age ${currentAge}): ~${data.cohorts.p99.biologicalAgeAtLev}</text>

    <!-- Card 3: 80th Percentile Current Pace of Aging -->
    <rect x="796" y="108" width="356" height="142" rx="16" fill="${panelBg}" stroke="${skyCol}" stroke-width="1.75"/>
    <text x="816" y="134" fill="${skyCol}" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="0.8">80TH PERCENTILE PACE OF AGING (TOP 20%)</text>
    <text x="816" y="184" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="42" font-weight="800">${data.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} <tspan font-size="18" fill="${textSecondary}">bio-yr / yr</tspan></text>
    <text x="816" y="212" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="12.5">Ages <tspan font-weight="700">${data.cohorts.p80.bioMonthsPerYear} mos</tspan> per 12 calendar mos (<tspan fill="${skyCol}" font-weight="700">+${data.cohorts.p80.daysGainedPerYear} days/yr banked</tspan>)</text>
    <text x="816" y="234" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="11.5">80th-Pct LEV Date: <tspan font-weight="700" fill="${skyCol}">${esc(formatDecimalYear(data.aggregate80thYear, true))} (${data.aggregate80thYear})</tspan> • Status Quo: ${data.aggregate50thYear}</text>

    <!-- Left Column (Bottom): Prediction Markets & Notable Experts Forest Plot -->
    <rect x="48" y="268" width="546" height="436" rx="16" fill="${panelBg}" stroke="${borderCol}" stroke-width="1.5"/>
    <text x="68" y="296" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="800">PREDICTION MARKETS &amp; NOTABLE EXPERT FORECASTS (99TH-PCT LEV)</text>
    <text x="68" y="314" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="11.5">Bars show 99th-percentile frontier range &amp; point estimate; vertical line = ${data.aggregate99thYear} aggregate</text>

    <!-- Forest Axis Years -->
    ${[2030, 2035, 2040, 2045, 2050, 2055]
      .map(
        (yr) =>
          `<line x1="${fx(yr)}" y1="326" x2="${fx(yr)}" y2="672" stroke="${gridCol}" stroke-width="1"/>
           <text x="${fx(yr)}" y="688" text-anchor="middle" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="10.5">${yr}</text>`
      )
      .join("")}

    <!-- Aggregate Reference Line on Forest Plot -->
    <line x1="${fx(data.aggregate99thYear)}" y1="324" x2="${fx(data.aggregate99thYear)}" y2="672" stroke="${emeraldCol}" stroke-width="2" stroke-dasharray="5 3"/>

    <!-- Market Rows (Top 3) -->
    ${LEV_PREDICTION_MARKETS.slice(0, 3)
      .map((m, idx) => {
        const y = 346 + idx * 32;
        const x99 = fx(m.implied99thPercentileYear);
        const x50 = fx(m.implied50thPercentileYear);
        const shortName =
          m.id === "mkt-metaculus-6592"
            ? "Metaculus #6592"
            : m.id === "mkt-manifold-lev-2036"
            ? "Manifold (by 2036: 34%)"
            : "Manifold / Foresight (49%)";
        return `<text x="68" y="${y + 4}" fill="${skyCol}" font-family="system-ui, sans-serif" font-size="12" font-weight="700">${esc(shortName)}</text>
          <line x1="${x99}" y1="${y}" x2="${x50}" y2="${y}" stroke="${skyCol}" stroke-width="3" stroke-opacity="0.45"/>
          <circle cx="${x99}" cy="${y}" r="5.5" fill="${skyCol}"/>
          <circle cx="${x50}" cy="${y}" r="4" fill="${amberCol}"/>
          <text x="${x99 - 8}" y="${y + 4}" text-anchor="end" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="11" font-weight="700">${m.implied99thPercentileYear}</text>`;
      })
      .join("")}

    <line x1="68" y1="432" x2="574" y2="432" stroke="${borderCol}" stroke-width="1"/>

    <!-- Expert Rows (Top 7) -->
    ${topExperts
      .map((e, idx) => {
        const y = 454 + idx * 31;
        const xLow = fx(e.lowBound99thYear);
        const xHigh = fx(e.highBound99thYear);
        const xPt = fx(e.pointEstimate99thYear);
        const shortExpert = e.expertName.replace(", PhD", "").replace(", MD", "").slice(0, 22);
        return `<text x="68" y="${y + 4}" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="12" font-weight="600">${esc(shortExpert)}</text>
          <line x1="${xLow}" y1="${y}" x2="${xHigh}" y2="${y}" stroke="${violetCol}" stroke-width="4" stroke-linecap="round" stroke-opacity="0.4"/>
          <circle cx="${xPt}" cy="${y}" r="5.5" fill="${emeraldCol}" stroke="${cardBg}" stroke-width="1.5"/>
          <text x="${xHigh + 6}" y="${y + 4}" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="11" font-weight="700">${e.pointEstimate99thYear}</text>`;
      })
      .join("")}

    <!-- Right Column (Bottom): LEVL Trajectory & Pace of Aging Chart -->
    <rect x="612" y="268" width="540" height="436" rx="16" fill="${panelBg}" stroke="${borderCol}" stroke-width="1.5"/>
    <text x="632" y="296" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="800">LEVL TRAJECTORY: PACE OF AGING INTERCEPT (2026–2060)</text>
    <text x="632" y="314" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="11.5">Tied to levlhealth.com/LEVTrajectory • Shaded Cone = 5th–95th Pct Breakthrough Speed</text>

    <!-- Legend Pills -->
    <rect x="632" y="328" width="155" height="58" rx="10" fill="${cardBg}" stroke="${emeraldCol}" stroke-width="1.5"/>
    <text x="644" y="347" fill="${emeraldCol}" font-family="system-ui, sans-serif" font-size="11" font-weight="800">99TH PCT (PROTOCOL)</text>
    <text x="644" y="366" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="14" font-weight="800">PoA ${data.cohorts.p99.intrinsicPaceOfAging.toFixed(2)} → ${data.aggregate99thYear}</text>
    <text x="644" y="380" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="10">Solid Green + Uncertainty Cone</text>

    <rect x="798" y="328" width="155" height="58" rx="10" fill="${cardBg}" stroke="${skyCol}" stroke-width="1.5"/>
    <text x="810" y="347" fill="${skyCol}" font-family="system-ui, sans-serif" font-size="11" font-weight="800">80TH PCT (OPTIMIZER)</text>
    <text x="810" y="366" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="14" font-weight="800">PoA ${data.cohorts.p80.intrinsicPaceOfAging.toFixed(2)} → ${data.aggregate80thYear}</text>
    <text x="810" y="380" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="10">Solid Cyan Curve</text>

    <rect x="964" y="328" width="168" height="58" rx="10" fill="${cardBg}" stroke="${amberCol}" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="976" y="347" fill="${amberCol}" font-family="system-ui, sans-serif" font-size="11" font-weight="800">50TH PCT (STATUS QUO)</text>
    <text x="976" y="366" fill="${textPrimary}" font-family="ui-monospace, monospace" font-size="14" font-weight="800">PoA 1.00 → ${data.aggregate50thYear}</text>
    <text x="976" y="380" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="10">Dashed Orange Baseline</text>

    <!-- Chart Grid -->
    <text x="632" y="420" fill="${textSecondary}" font-family="system-ui, sans-serif" font-size="11.5" font-weight="700">Net Biological Aging Rate (bio-yrs / calendar yr) — Crosses 0.00 at Escape Velocity</text>
    <line x1="640" y1="${chart.yOf(1.0)}" x2="1130" y2="${chart.yOf(1.0)}" stroke="${gridCol}" stroke-width="1"/>
    <line x1="640" y1="${chart.yOf(0.5)}" x2="1130" y2="${chart.yOf(0.5)}" stroke="${gridCol}" stroke-width="1"/>

    <!-- LEV Zone (< 0.00) -->
    <rect x="640" y="${chart.zeroY}" width="490" height="${465 + 210 - chart.zeroY}" fill="${emeraldCol}" fill-opacity="0.08"/>
    <line x1="640" y1="${chart.zeroY}" x2="1130" y2="${chart.zeroY}" stroke="${emeraldCol}" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="1126" y="${chart.zeroY - 6}" text-anchor="end" fill="${emeraldCol}" font-family="ui-monospace, monospace" font-size="10.5" font-weight="800">LEV THRESHOLD (0.00 NET AGING)</text>

    <!-- Cone + Curves -->
    <polygon points="${chart.conePolygon}" fill="${emeraldCol}" fill-opacity="0.16"/>
    <polyline fill="none" stroke="${amberCol}" stroke-width="2.2" stroke-dasharray="6 4" points="${chart.p50Pts}"/>
    <polyline fill="none" stroke="${skyCol}" stroke-width="2.8" points="${chart.p80Pts}"/>
    <polyline fill="none" stroke="${emeraldCol}" stroke-width="3.2" points="${chart.p99Pts}"/>

    <!-- Intercept Dots -->
    <circle cx="${p99X}" cy="${chart.zeroY}" r="5.5" fill="${emeraldCol}" stroke="${cardBg}" stroke-width="2"/>
    <text x="${p99X}" y="${chart.zeroY + 18}" text-anchor="middle" fill="${emeraldCol}" font-family="ui-monospace, monospace" font-size="11" font-weight="800">${data.aggregate99thYear}</text>

    <circle cx="${p80X}" cy="${chart.zeroY}" r="5.5" fill="${skyCol}" stroke="${cardBg}" stroke-width="2"/>
    <text x="${p80X}" y="${chart.zeroY + 18}" text-anchor="middle" fill="${skyCol}" font-family="ui-monospace, monospace" font-size="11" font-weight="800">${data.aggregate80thYear}</text>

    <circle cx="${p50X}" cy="${chart.zeroY}" r="5.5" fill="${amberCol}" stroke="${cardBg}" stroke-width="2"/>
    <text x="${p50X}" y="${chart.zeroY + 18}" text-anchor="middle" fill="${amberCol}" font-family="ui-monospace, monospace" font-size="11" font-weight="800">${data.aggregate50thYear}</text>

    ${[2026, 2032, 2038, 2044, 2050, 2056]
      .map(
        (yr) =>
          `<text x="${chart.xOf(yr)}" y="690" text-anchor="middle" fill="${textMuted}" font-family="ui-monospace, monospace" font-size="11">${yr}</text>`
      )
      .join("")}

    <!-- Bottom Attribution Bar -->
    <text x="48" y="726" fill="${textMuted}" font-family="system-ui, sans-serif" font-size="12">Embeddable Live Widget &amp; Newsletter SVG • Trajectory Model: <tspan fill="${emeraldCol}" font-weight="700">https://www.levlhealth.com/LEVTrajectory/</tspan> • Data: Metaculus, Manifold, SENS/LEVF, Blueprint</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
