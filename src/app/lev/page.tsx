import React from "react";
import type { Metadata } from "next";
import { LevExplorer } from "@/components/LevExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "99th-Percentile Human Longevity Escape Velocity (LEV) & Dynamic Pace of Aging | FutureGraph",
  description:
    "Live conservative Bayesian aggregate of Longevity Escape Velocity (LEV) prediction markets (Metaculus, Manifold), notable expert predictions, and dynamic Pace of Aging trajectories (99th vs. 80th percentile human) tied to LEVL Health (levlhealth.com/LEVTrajectory).",
  alternates: {
    canonical: "/futuregraph/lev",
  },
  openGraph: {
    title: "Longevity Escape Velocity (LEV) & Dynamic Pace of Aging Observatory | FutureGraph",
    description:
      "Live Bayesian aggregate of LEV prediction markets, expert forecasts, and Pace of Aging trajectories.",
    url: "/futuregraph/lev",
  },
};

export default function LevObservatoryPage() {
  return <LevExplorer isEmbed={false} />;
}
