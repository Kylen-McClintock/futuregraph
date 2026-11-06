import React from "react";
import type { Metadata } from "next";
import { LevExplorer } from "@/components/LevExplorer";
import { ConservativeUpdateMode } from "@/lib/lev-engine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "LEV 99th Percentile Aggregate & Dynamic Pace of Aging Widget | FutureGraph × LEVL Trajectory",
  description:
    "Embeddable Longevity Escape Velocity (LEV) prediction market & expert aggregate + dynamic Pace of Aging tracker for 99th and 80th percentile humans.",
};

export default function LevEmbedPage({
  searchParams,
}: {
  searchParams?: {
    theme?: string;
    view?: string;
    age?: string;
    mode?: string;
  };
}) {
  const theme =
    searchParams?.theme === "light"
      ? "light"
      : searchParams?.theme === "dark"
      ? "dark"
      : undefined;
  const view =
    searchParams?.view === "pace" || searchParams?.view === "markets"
      ? searchParams.view
      : "all";
  const ageNum = Number(searchParams?.age || "35");
  const initialAge = Number.isFinite(ageNum)
    ? Math.max(18, Math.min(85, ageNum))
    : 35;
  const initialMode: ConservativeUpdateMode =
    searchParams?.mode === "moderate" ? "moderate" : "conservative";

  return (
    <LevExplorer
      isEmbed={true}
      initialTheme={theme}
      initialView={view}
      initialAge={initialAge}
      initialMode={initialMode}
    />
  );
}
