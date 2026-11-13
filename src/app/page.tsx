import React from "react";
import type { Metadata } from "next";
import { HomeGallery } from "@/components/HomeGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FutureGraph Scenario Atlas | AI 2027, 2040, 2050 & LEV Forecasts",
  description:
    "Interactive Bayesian probability graphs mapping branching AI timelines (2027, 2040, 2050), Longevity Escape Velocity trajectories, and Pareto-optimal AI governance.",
  alternates: {
    canonical: "/futuregraph",
  },
  openGraph: {
    title: "FutureGraph Scenario Atlas | AGI Futures",
    description:
      "Stress-test branching AI timelines, Longevity Escape Velocity prediction markets, and institutional governance scenarios.",
    url: "/futuregraph",
  },
};

export default function HomePage() {
  return <HomeGallery />;
}
