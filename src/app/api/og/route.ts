import { NextRequest, NextResponse } from "next/server";
import { getBasePriorsForLens, getStore } from "@/lib/store";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId") || "node-oct-2027-government-oversight-fork";
  const myProbParam = searchParams.get("myProb");

  const store = getStore();
  const node =
    store.nodes.find((n) => n.id === nodeId) ||
    store.nodes.find((n) => n.id === "node-oct-2027-government-oversight-fork")!;

  const priors = getBasePriorsForLens("demo_hypothesis");
  const baseProb = Math.round((myProbParam ? Number(myProbParam) : (priors[node.id] ?? 0.5)) * 1000) / 10;
  const commProb = Math.round(((LENS_PRIORS_BY_NODE[node.id]?.community ?? 0.44) * 1000)) / 10;
  const aiProb = Math.round(((LENS_PRIORS_BY_NODE[node.id]?.ai_gemini ?? 0.48) * 1000)) / 10;

  const safeTitle = node.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeChapter = `${node.chapter} • ${node.dateLabel}`.replace(/&/g, "&amp;");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b101b"/>
        <stop offset="50%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect x="40" y="40" width="1120" height="550" rx="24" fill="#131c2e" stroke="#334155" stroke-width="2"/>
    <text x="80" y="105" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="2">FUTUREGRAPH • PUT A PROBABILITY ON IT</text>
    <text x="80" y="148" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="20">${safeChapter} — AI 2027 Conditional Network</text>
    <text x="80" y="220" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="34" font-weight="700">${safeTitle.slice(0, 62)}</text>
    <text x="80" y="268" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="28" font-weight="500">${safeTitle.length > 62 ? safeTitle.slice(62, 125) : ""}</text>
    <rect x="80" y="330" width="320" height="170" rx="16" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
    <text x="110" y="375" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="18" font-weight="700">CHALLENGE FORECAST</text>
    <text x="110" y="455" fill="#ffffff" font-family="monospace" font-size="64" font-weight="800">${baseProb}%</text>
    <rect x="430" y="330" width="320" height="170" rx="16" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <text x="460" y="375" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="18" font-weight="700">COMMUNITY MEDIAN</text>
    <text x="460" y="455" fill="#ffffff" font-family="monospace" font-size="64" font-weight="800">${commProb}%</text>
    <rect x="780" y="330" width="320" height="170" rx="16" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
    <text x="810" y="375" fill="#a855f7" font-family="system-ui, sans-serif" font-size="18" font-weight="700">GEMINI AGENT</text>
    <text x="810" y="455" fill="#ffffff" font-family="monospace" font-size="64" font-weight="800">${aiProb}%</text>
    <text x="80" y="555" fill="#64748b" font-family="monospace" font-size="18">SHA-256 Tamper-Evident Audit Trail • /scenarios/ai-2027/n/${node.id}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
