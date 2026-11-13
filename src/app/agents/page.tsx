import React from "react";
import type { Metadata } from "next";
import { getAllForecasterRuns, getForecasterActors } from "@/lib/store";
import { AgentsDirectoryClient } from "@/components/AgentsDirectoryClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forecaster Agents & Personal Distributions — FutureGraph",
  description:
    "Explore transparent worldview agents, personal forecast distributions, explicit assumptions, and 1-click conditional branch Prompt Packs across all FutureGraph atlases.",
};

export default function AgentsDirectoryPage() {
  const actors = getForecasterActors();
  const runs = getAllForecasterRuns();

  return <AgentsDirectoryClient initialActors={actors} initialRuns={runs} />;
}
