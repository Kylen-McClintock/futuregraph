/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { ReactNode } from "react";
import { LENS_PRIORS_BY_NODE } from "@/data/ai2027-seed";
import { findForecastableNode, getBasePriorsForLens, getCrowdProbability, getStore } from "@/lib/store";
import {
  getLedgerEntryForEvent,
  getReputationState,
  getScorecard,
  getWorldview,
} from "@/lib/reputation-store";
import {
  ACCURACY_CATEGORIES,
  categoryColor,
  categoryLabel,
  classifyNodeCategory,
  confidenceLabel,
  formatSignedRp,
  isNodeScorable,
} from "@/lib/reputation-engine";
import { hasVerifiedX } from "@/lib/identity";
import { getSiteOrigin } from "@/lib/paths";
import type { Profile } from "@/types/futuregraph";

export const dynamic = "force-dynamic";

const C = {
  bg0: "#060a13",
  bg1: "#0d1424",
  ink: "#f8fafc",
  sub: "#cbd5e1",
  mute: "#8b9bb4",
  line: "rgba(148,163,184,0.22)",
  amber: "#f59e0b",
  sky: "#38bdf8",
  violet: "#a855f7",
  emerald: "#10b981",
  rose: "#f43f5e",
};

type Aspect = "16x9" | "4x5";

async function loadFonts() {
  const dir = path.join(process.cwd(), "src/assets/fonts");
  const [inter500, inter800, mono700] = await Promise.all([
    readFile(path.join(dir, "inter-latin-500-normal.woff")),
    readFile(path.join(dir, "inter-latin-800-normal.woff")),
    readFile(path.join(dir, "JetBrainsMono-latin-700-normal.woff")),
  ]);
  return [
    { name: "Inter", data: inter500, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: inter800, weight: 800 as const, style: "normal" as const },
    { name: "Mono", data: mono700, weight: 700 as const, style: "normal" as const },
  ];
}

/**
 * The bundled Inter / JetBrains Mono subsets cover Latin + general punctuation only. Map common
 * symbols from seeded titles onto supported glyphs (and drop the rest) so cards never show tofu.
 */
function glyphSafe(text: string): string {
  return text
    .replace(/[→⇒➜⟶]/g, "»")
    .replace(/[←⇐⟵]/g, "«")
    .replace(/[↔⇔]/g, "<>")
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[≈]/g, "~")
    .replace(/[✓✔]/g, "")
    .replace(/[^\u0000-\u024F\u2000-\u206F\u20AC\u2122\u2191\u2193\u2212\u00B7]/gu, "");
}

function clip(text: string, max: number): string {
  const t = glyphSafe(text).replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function pct(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return "—";
  const v = p * 100;
  return `${v >= 10 || v === 0 ? Math.round(v) : v.toFixed(1)}%`;
}

function utcDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Fetch an X avatar into a data URI (short timeout) so a slow CDN never breaks the card. */
async function avatarDataUri(profile?: Profile | null): Promise<string | null> {
  const url = profile?.xAvatarUrl || profile?.avatarUrl;
  if (!url || !/^https:\/\/(pbs\.twimg\.com|abs\.twimg\.com|lh3\.googleusercontent\.com)\//.test(url)) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

function Shell({ children, accent = C.amber, aspect }: { children: ReactNode; accent?: string; aspect: Aspect }) {
  const pad = aspect === "4x5" ? 64 : 52;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: pad,
        backgroundColor: C.bg0,
        backgroundImage: `radial-gradient(circle at 12% 0%, ${accent}33 0%, transparent 42%), radial-gradient(circle at 100% 100%, #6366f133 0%, transparent 48%), linear-gradient(160deg, ${C.bg0} 0%, ${C.bg1} 55%, #140f2e 100%)`,
        color: C.ink,
        fontFamily: "Inter",
      }}
    >
      {children}
    </div>
  );
}

function Brand({ right }: { right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.amber}`,
            backgroundImage: `linear-gradient(135deg, ${C.amber}55, ${C.sky}44)`,
            color: C.amber,
            fontFamily: "Mono",
            fontSize: 18,
          }}
        >
          FG
        </div>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 800, letterSpacing: 3, color: C.sub }}>
          FUTUREGRAPH · AGIFUTURES.ORG
        </div>
      </div>
      {right}
    </div>
  );
}

function Chip({ label, color, size = 18 }: { label: string; color: string; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: `${Math.round(size * 0.35)}px ${Math.round(size * 0.8)}px`,
        borderRadius: 999,
        border: `2px solid ${color}88`,
        backgroundColor: `${color}22`,
        color,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: 1.5,
      }}
    >
      {label}
    </div>
  );
}

function Avatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  if (src) {
    return <img src={src} width={size} height={size} style={{ borderRadius: size, border: `3px solid ${C.amber}` }} />;
  }
  const initials = name.replace(/^@/, "").split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "FG";
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size,
        alignItems: "center",
        justifyContent: "center",
        border: `3px solid ${C.amber}`,
        backgroundImage: `linear-gradient(135deg, #1e293b, #312e81)`,
        fontSize: Math.round(size * 0.38),
        fontWeight: 800,
      }}
    >
      {initials}
    </div>
  );
}

function Identity({ profile, avatar, size, verifiedLabel }: { profile?: Profile | null; avatar: string | null; size: number; verifiedLabel?: string }) {
  const name = profile?.displayName || "FutureGraph Forecaster";
  const handle = profile?.xHandle || profile?.handle || "forecaster";
  const verified = profile ? hasVerifiedX(profile) : false;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Avatar src={avatar} name={name} size={size} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: Math.round(size * 0.42), fontWeight: 800 }}>{clip(name, size >= 90 ? 26 : 30)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: Math.round(size * 0.32), color: C.mute }}>
          <span>@{handle}</span>
          {verified ? <span style={{ color: C.sky }}>X VERIFIED</span> : null}
          {verifiedLabel ? <span style={{ color: C.emerald }}>{verifiedLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, color, width, height = 18, labelSize = 18 }: { label: string; value: number | null; color: string; width: number; height?: number; labelSize?: number }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: labelSize, color: C.sub }}>
        <span style={{ letterSpacing: 2, fontWeight: 800, color }}>{label}</span>
        <span style={{ fontFamily: "Mono", color: C.ink }}>{pct(value)}</span>
      </div>
      <div style={{ display: "flex", width, height, borderRadius: height, backgroundColor: "rgba(148,163,184,0.18)" }}>
        <div style={{ display: "flex", width: Math.max(height, Math.round(width * v)), height, borderRadius: height, backgroundImage: `linear-gradient(90deg, ${color}aa, ${color})` }} />
      </div>
    </div>
  );
}

function Footer({ left, right, size = 17 }: { left: string; right: string; size?: number }) {
  // Tall (4:5) cards use size ≥ 20: stack the two lines so they never collide.
  const stacked = size >= 20;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        justifyContent: "space-between",
        alignItems: stacked ? "flex-start" : "center",
        gap: stacked ? 10 : 0,
        width: "100%",
        borderTop: `1px solid ${C.line}`,
        paddingTop: 16,
        fontSize: size,
        color: C.mute,
        fontFamily: "Mono",
      }}
    >
      <span>{glyphSafe(left)}</span>
      <span style={{ color: C.amber }}>{glyphSafe(right)}</span>
    </div>
  );
}

function shortDomain(): string {
  return getSiteOrigin().replace(/^https?:\/\//, "");
}

// -----------------------------------------------------------------------------
// Card modes
// -----------------------------------------------------------------------------

async function forecastCard(eventId: string, aspect: Aspect) {
  const store = getStore();
  const event = store.forecastEvents.find((e) => e.id === eventId);
  if (!event) return null;
  const node = findForecastableNode(event.nodeId);
  if (!node) return null;
  const profile = store.profiles.find((p) => p.handle === event.forecasterHandle) || null;
  const avatar = await avatarDataUri(profile);
  const category = event.accuracyCategory || classifyNodeCategory(node);
  const catColor = categoryColor(category);
  const crowd = event.crowdProbSnapshot ?? getCrowdProbability(node);
  const ai = LENS_PRIORS_BY_NODE[node.id]?.ai_gemini ?? null;
  const conf = event.confidenceMultiplier ?? 1;
  const scorable = isNodeScorable(node);
  const card = profile ? getScorecard(profile.handle) : null;
  const catRp = card?.categories.find((c) => c.category === category);
  const tall = aspect === "4x5";
  const barW = tall ? 952 : 560;

  return (
    <Shell aspect={aspect} accent={catColor}>
      <Brand right={<Chip label={categoryLabel(category).toUpperCase()} color={catColor} size={tall ? 20 : 16} />} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: tall ? 44 : 26 }}>
        <Identity profile={profile} avatar={avatar} size={tall ? 92 : 64} />
        {catRp ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontFamily: "Mono", fontSize: tall ? 40 : 30, color: C.ink }}>{catRp.reputationPoints.toLocaleString("en-US")} RP</div>
            <div style={{ display: "flex", fontSize: tall ? 20 : 15, color: card?.isVerified ? C.emerald : C.mute, letterSpacing: 2 }}>
              {card?.isVerified ? `VERIFIED · ${card.tierLabel.toUpperCase()}` : `PROVISIONAL · ${card?.resolvedCount ?? 0}/5 RESOLVED`}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", marginTop: tall ? 40 : 22, fontSize: tall ? 50 : 34, fontWeight: 800, lineHeight: 1.15 }}>
        {clip(node.question?.questionText && node.scenarioId === "scen-checkpoints" ? node.title.replace(/^Checkpoint:\s*/, "") : node.title, tall ? 140 : 96)}
      </div>
      <div style={{ display: "flex", flexDirection: tall ? "column" : "row", gap: tall ? 40 : 40, marginTop: tall ? 44 : 22, alignItems: tall ? "flex-start" : "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: tall ? 22 : 16, letterSpacing: 4, color: C.amber, fontWeight: 800 }}>MY CALL</div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: tall ? 190 : 124, lineHeight: 1, color: C.ink }}>{pct(event.probability)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: tall ? 22 : 14 }}>
          <Bar label="ME" value={event.probability} color={C.amber} width={barW} labelSize={tall ? 22 : 16} height={tall ? 22 : 14} />
          <Bar label="CROWD AT LOCK-IN" value={crowd} color={C.sky} width={barW} labelSize={tall ? 22 : 16} height={tall ? 22 : 14} />
          {ai !== null ? <Bar label="AI AGENT" value={ai} color={C.violet} width={barW} labelSize={tall ? 22 : 16} height={tall ? 22 : 14} /> : null}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: tall ? 44 : 22 }}>
        <Chip label={`${conf.toFixed(2).replace(/0$/, "")}× ${confidenceLabel(conf).toUpperCase()}`} color={C.amber} size={tall ? 22 : 16} />
        {scorable && event.projectedRpIfYes !== null && event.projectedRpIfYes !== undefined ? (
          <>
            <Chip label={`IF YES ${formatSignedRp(event.projectedRpIfYes)}`} color={C.emerald} size={tall ? 22 : 16} />
            <Chip label={`IF NO ${formatSignedRp(event.projectedRpIfNo ?? 0)}`} color={C.rose} size={tall ? 22 : 16} />
          </>
        ) : (
          <Chip label="RECORDED · UNSCORED MILESTONE" color={C.mute} size={tall ? 22 : 16} />
        )}
      </div>
      {tall ? (
        <div style={{ display: "flex", marginTop: 44, fontSize: 30, color: C.sub, lineHeight: 1.35 }}>“{clip(event.rationale, 210)}”</div>
      ) : null}
      <div style={{ display: "flex", flexGrow: 1 }} />
      <Footer
        size={tall ? 20 : 15}
        left={`LOCKED ${utcDate(event.serverTimestamp)} UTC · SHA-256 ${event.payloadHash.slice(0, 10)}`}
        right={`CHALLENGE THIS CALL » ${shortDomain()}`}
      />
    </Shell>
  );
}

async function victoryCard(eventId: string, aspect: Aspect) {
  const entry = getLedgerEntryForEvent(eventId);
  if (!entry || entry.rpDelta <= 0) return forecastCard(eventId, aspect);
  const store = getStore();
  const profile = store.profiles.find((p) => p.handle === entry.forecasterHandle) || null;
  const avatar = await avatarDataUri(profile);
  const catColor = categoryColor(entry.category);
  const tall = aspect === "4x5";
  const outcomeLabel = entry.outcome === 1 ? "YES" : "NO";
  const myOnOutcome = entry.outcome === 1 ? entry.originalProbability : 1 - entry.originalProbability;
  const crowdOnOutcome = entry.outcome === 1 ? entry.originalCrowdProb : 1 - entry.originalCrowdProb;
  const originalEvent = store.forecastEvents.find((e) => e.id === entry.originalEventId);

  return (
    <Shell aspect={aspect} accent={C.emerald}>
      <Brand right={<Chip label={entry.isSandboxDrill ? "SANDBOX DRILL" : "RESOLVED"} color={entry.isSandboxDrill ? C.mute : C.emerald} size={tall ? 20 : 16} />} />
      <div style={{ display: "flex", marginTop: tall ? 52 : 26, alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <Identity profile={profile} avatar={avatar} size={tall ? 92 : 62} />
        {!tall ? <Chip label={categoryLabel(entry.category).toUpperCase()} color={catColor} size={15} /> : null}
      </div>
      {tall ? (
        <div style={{ display: "flex", marginTop: 28 }}>
          <Chip label={categoryLabel(entry.category).toUpperCase()} color={catColor} size={20} />
        </div>
      ) : null}
      <div style={{ display: "flex", marginTop: tall ? 40 : 22, fontSize: tall ? 150 : 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: C.amber }}>
        CALLED IT.
      </div>
      <div style={{ display: "flex", marginTop: tall ? 30 : 14, fontSize: tall ? 44 : 32, fontWeight: 800, color: C.ink }}>
        {`I said ${pct(myOnOutcome)} ${outcomeLabel} when the crowd said ${pct(crowdOnOutcome)}.`}
      </div>
      <div style={{ display: "flex", marginTop: tall ? 26 : 12, fontSize: tall ? 30 : 22, color: C.sub, lineHeight: 1.3 }}>{clip(entry.questionTitle, tall ? 150 : 110)}</div>
      <div style={{ display: "flex", gap: 18, marginTop: tall ? 44 : 22, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: tall ? 96 : 66, color: C.emerald }}>{formatSignedRp(entry.rpDelta)}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Chip label={`RESOLVED ${outcomeLabel} · ${utcDate(entry.resolvedAt)}`} color={C.emerald} size={tall ? 20 : 15} />
          <Chip label={`LOCKED ${utcDate(entry.originalSubmittedAt)} · ${entry.originalConfidence}× CONVICTION`} color={C.amber} size={tall ? 20 : 15} />
        </div>
      </div>
      {tall ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 48 }}>
          <Bar label={`ME ON ${outcomeLabel}`} value={myOnOutcome} color={C.amber} width={952} labelSize={22} height={22} />
          <Bar label={`CROWD ON ${outcomeLabel}`} value={crowdOnOutcome} color={C.sky} width={952} labelSize={22} height={22} />
        </div>
      ) : null}
      {tall && originalEvent ? (
        <div style={{ display: "flex", marginTop: 40, fontSize: 28, color: C.sub, lineHeight: 1.35 }}>“{clip(originalEvent.rationale, 180)}”</div>
      ) : null}
      <div style={{ display: "flex", flexGrow: 1 }} />
      <Footer size={tall ? 20 : 15} left={`TAMPER-EVIDENT RECEIPT ${entry.resolutionReceiptId}`} right={`VERIFY » ${shortDomain()}`} />
    </Shell>
  );
}

async function scorecardCard(handle: string, aspect: Aspect) {
  getReputationState();
  const store = getStore();
  const profile = store.profiles.find((p) => p.handle === handle) || null;
  const card = getScorecard(handle);
  if (!profile || !card) return null;
  const avatar = await avatarDataUri(profile);
  const tall = aspect === "4x5";
  const barW = tall ? 952 : 470;
  const top = card.percentile !== null ? `TOP ${Math.max(1, 100 - card.percentile)}%` : null;

  return (
    <Shell aspect={aspect} accent={card.isVerified ? C.emerald : C.amber}>
      <Brand right={<Chip label={card.isVerified ? "VERIFIED FORECASTER" : `PROVISIONAL · ${card.resolvedCount}/5`} color={card.isVerified ? C.emerald : C.amber} size={tall ? 20 : 15} />} />
      <div style={{ display: "flex", flexDirection: tall ? "column" : "row", gap: tall ? 44 : 44, marginTop: tall ? 52 : 28, flexGrow: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: tall ? 26 : 16, width: tall ? "100%" : 520 }}>
          <Identity profile={profile} avatar={avatar} size={tall ? 100 : 70} />
          <div style={{ display: "flex", fontSize: tall ? 22 : 16, letterSpacing: 4, color: C.mute, fontWeight: 800, marginTop: 8 }}>OVERALL FORECAST ACCURACY</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            <div style={{ display: "flex", fontFamily: "Mono", fontSize: tall ? 150 : 108, lineHeight: 1 }}>{card.overallRp.toLocaleString("en-US")}</div>
            <div style={{ display: "flex", fontSize: tall ? 40 : 28, color: C.mute, paddingBottom: 12 }}>RP</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Chip label={card.tierLabel.toUpperCase()} color={card.isVerified ? C.emerald : C.amber} size={tall ? 22 : 16} />
            {top ? <Chip label={top} color={C.sky} size={tall ? 22 : 16} /> : null}
            <Chip label={`${card.wins}W · ${card.losses}L · ${card.activeCount} ACTIVE`} color={C.mute} size={tall ? 22 : 16} />
          </div>
          {card.bestCall ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 6, fontSize: tall ? 24 : 17, color: C.sub }}>
              <span style={{ color: C.amber, fontWeight: 800, letterSpacing: 2 }}>BEST CALL {formatSignedRp(card.bestCall.rpDelta)}</span>
              <span>{clip(card.bestCall.questionTitle, tall ? 90 : 60)}</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: tall ? 22 : 14, justifyContent: "center" }}>
          {card.categories.map((cat) => {
            const color = ACCURACY_CATEGORIES.find((c) => c.id === cat.category)?.color || C.mute;
            const norm = Math.max(0.04, Math.min(1, (cat.reputationPoints - 600) / 1200));
            return (
              <div key={cat.category} style={{ display: "flex", flexDirection: "column", gap: 6, width: barW }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: tall ? 22 : 16 }}>
                  <span style={{ color, fontWeight: 800 }}>{cat.label}</span>
                  <span style={{ fontFamily: "Mono", color: cat.resolvedCount > 0 ? C.ink : C.mute }}>
                    {cat.resolvedCount > 0 ? `${cat.reputationPoints} · n=${cat.resolvedCount}` : "no resolved calls"}
                  </span>
                </div>
                <div style={{ display: "flex", width: barW, height: tall ? 18 : 12, borderRadius: 20, backgroundColor: "rgba(148,163,184,0.16)" }}>
                  <div style={{ display: "flex", width: Math.round(barW * (cat.resolvedCount > 0 ? norm : 0.02)), height: tall ? 18 : 12, borderRadius: 20, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer
        size={tall ? 20 : 15}
        left={card.includesSandboxDrills ? "INCLUDES SANDBOX CALIBRATION DRILLS" : "STRICTLY PROPER HYBRID LOG SCORE · EVERY MISS INCLUDED"}
        right={`VERIFY » ${shortDomain()}/futuregraph/u/${handle}`}
      />
    </Shell>
  );
}

async function worldviewCard(id: string, aspect: Aspect) {
  const wv = getWorldview(id);
  if (!wv) return null;
  const store = getStore();
  const profile = store.profiles.find((p) => p.handle === wv.ownerHandle) || null;
  const avatar = await avatarDataUri(profile);
  const tall = aspect === "4x5";
  const outcomes = [...wv.outcomes].sort((a, b) => b.probability - a.probability).slice(0, tall ? 8 : 5);
  const palette = [C.amber, C.sky, C.violet, C.emerald, C.rose, "#f97316", "#22d3ee", "#94a3b8"];
  const barW = tall ? 952 : 1096;

  return (
    <Shell aspect={aspect} accent={C.violet}>
      <Brand right={<Chip label={wv.scenarioTitle.toUpperCase()} color={C.violet} size={tall ? 20 : 15} />} />
      <div style={{ display: "flex", marginTop: tall ? 48 : 24 }}>
        <Identity profile={profile} avatar={avatar} size={tall ? 92 : 58} />
      </div>
      <div style={{ display: "flex", marginTop: tall ? 40 : 18, fontSize: tall ? 56 : 38, fontWeight: 800, lineHeight: 1.1 }}>{clip(wv.headline, 90)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: tall ? 24 : 12, marginTop: tall ? 44 : 20 }}>
        {outcomes.map((o, i) => (
          <Bar key={`${o.label}-${i}`} label={clip(o.label, 60).toUpperCase()} value={o.probability} color={palette[i % palette.length]} width={barW} labelSize={tall ? 22 : 16} height={tall ? 22 : 12} />
        ))}
      </div>
      <div style={{ display: "flex", flexGrow: 1 }} />
      <Footer size={tall ? 20 : 15} left={`LOCKED ${utcDate(wv.createdAt)} UTC · SHA-256 ${wv.payloadHash.slice(0, 10)}`} right={`MAP YOUR OWN FUTURE » ${shortDomain()}`} />
    </Shell>
  );
}

/** Legacy "Challenge Card" (nodeId + myProb), kept for existing links. */
function challengeCard(nodeId: string, myProbParam: string | null, aspect: Aspect) {
  const node = findForecastableNode(nodeId) || findForecastableNode("node-oct-2027-government-oversight-fork")!;
  const priors = getBasePriorsForLens("demo_hypothesis");
  const mine = myProbParam !== null && Number.isFinite(Number(myProbParam)) ? Number(myProbParam) : priors[node.id] ?? 0.5;
  const crowd = getCrowdProbability(node);
  const ai = LENS_PRIORS_BY_NODE[node.id]?.ai_gemini ?? null;
  const category = classifyNodeCategory(node);
  const tall = aspect === "4x5";
  const barW = tall ? 952 : 1096;
  return (
    <Shell aspect={aspect} accent={categoryColor(category)}>
      <Brand right={<Chip label="PUT A PROBABILITY ON IT" color={C.amber} size={tall ? 20 : 15} />} />
      <div style={{ display: "flex", marginTop: tall ? 48 : 28, fontSize: tall ? 24 : 18, color: C.mute, letterSpacing: 2 }}>{glyphSafe(`${node.chapter} · ${node.dateLabel}`).toUpperCase()}</div>
      <div style={{ display: "flex", marginTop: 12, fontSize: tall ? 56 : 40, fontWeight: 800, lineHeight: 1.12 }}>{clip(node.title, 110)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: tall ? 26 : 16, marginTop: tall ? 52 : 30 }}>
        <Bar label="CHALLENGE FORECAST" value={mine} color={C.amber} width={barW} labelSize={tall ? 24 : 18} height={tall ? 24 : 16} />
        <Bar label="COMMUNITY" value={crowd} color={C.sky} width={barW} labelSize={tall ? 24 : 18} height={tall ? 24 : 16} />
        {ai !== null ? <Bar label="AI AGENT" value={ai} color={C.violet} width={barW} labelSize={tall ? 24 : 18} height={tall ? 24 : 16} /> : null}
      </div>
      <div style={{ display: "flex", flexGrow: 1 }} />
      <Footer size={tall ? 20 : 15} left="SHA-256 TAMPER-EVIDENT AUDIT TRAIL" right={`WHAT'S YOUR NUMBER? » ${shortDomain()}`} />
    </Shell>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const aspect: Aspect = searchParams.get("aspect") === "4x5" ? "4x5" : "16x9";
  const size = aspect === "4x5" ? { width: 1080, height: 1350 } : { width: 1200, height: 630 };
  const mode = searchParams.get("mode") || (searchParams.get("eventId") ? "forecast" : "challenge");
  getReputationState();

  let element: JSX.Element | null = null;
  if (mode === "forecast" && searchParams.get("eventId")) element = await forecastCard(searchParams.get("eventId")!, aspect);
  else if (mode === "victory" && searchParams.get("eventId")) element = await victoryCard(searchParams.get("eventId")!, aspect);
  else if (mode === "scorecard" && searchParams.get("handle")) element = await scorecardCard(searchParams.get("handle")!, aspect);
  else if (mode === "worldview" && searchParams.get("worldviewId")) element = await worldviewCard(searchParams.get("worldviewId")!, aspect);
  if (!element) {
    element = challengeCard(searchParams.get("nodeId") || "node-oct-2027-government-oversight-fork", searchParams.get("myProb"), aspect);
  }

  return new ImageResponse(element, {
    ...size,
    fonts: await loadFonts(),
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
