import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FairMarkets AI Governance Lab | Pareto-Frontier Institutional Design",
  description:
    "Interactive AI governance and coordination simulator exploring how institutional design and differentially defensive technology expand the Pareto frontiers of safety and freedom.",
  alternates: {
    canonical: "/futuregraph/fairmarkets/ai-governance",
  },
  openGraph: {
    title: "FairMarkets AI Governance Lab | FutureGraph",
    description:
      "Coordinate toward mutual HyperAbundance by expanding the Pareto frontiers of safety and freedom, and growth and conservation.",
    url: "/futuregraph/fairmarkets/ai-governance",
  },
};

export default function FairMarketsGovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
