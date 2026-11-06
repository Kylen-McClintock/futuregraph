export interface LevPredictionMarket {
  id: string;
  platform: "Metaculus" | "Manifold Markets" | "Foresight / Manifold" | "Metaculus Community";
  questionTitle: string;
  url: string;
  resolutionMetric: string;
  rawMarketDisplay: string;
  rawProbabilityOrMedian: string;
  forecasterCountOrLiquidity: string;
  targetPopulation: "national_population" | "living_cohort" | "general_public" | "age_stratified";
  implied50thPercentileYear: number;
  implied80thPercentileYear: number;
  implied99thPercentileYear: number;
  translationMethodology: string;
  weightInMarketAggregate: number;
  lastVerifiedDate: string;
}

export interface LevExpertPrediction {
  id: string;
  expertName: string;
  roleAndAffiliation: string;
  avatarInitials: string;
  category: "ai_biotech" | "biogerontology" | "genetics_reprogramming" | "longevity_protocol" | "regulatory_realist";
  statedTimelineLabel: string;
  pointEstimate99thYear: number;
  lowBound99thYear: number;
  highBound99thYear: number;
  implied80thYear: number;
  implied50thYear: number;
  statedConfidenceNote: string;
  primaryMechanism: string;
  sourceTitle: string;
  sourceUrl: string;
  publicationYear: number;
  weightInExpertAggregate: number;
}

export interface CohortPaceProfile {
  cohortId: "p99" | "p80" | "p50";
  label: string;
  shortLabel: string;
  percentileRank: number;
  badgeColor: string;
  strokeColorDark: string;
  strokeColorLight: string;
  description: string;
  /** Baseline intrinsic Pace of Aging (bio-years per calendar year) as of 2026-01-01 */
  baselineIntrinsicPoA2026: number;
  /** Raw unshrunk leaderboard/population reference before Bayesian shrinkage */
  rawObservedReferencePoA: number;
  /** Conservative Empirical Bayes shrinkage factor toward multi-organ physiological clock */
  bayesianShrinkageLambda: number;
  /** Conservative annual protocol refinement drift (bio-yr/yr improvement per year) */
  conservativeAnnualProtocolDrift: number;
  /** Biotech Rejuvenation translation efficiency & early-access lead time (years ahead of population) */
  biotechAccessLeadYears: number;
  /** Protocol & biomarker stack summary tied to LEVL Trajectory */
  protocolSummary: string[];
}

export const LEVL_TRAJECTORY_REFERENCE = {
  name: "LEVL Health — LEV Trajectory & Benchmark",
  url: "https://www.levlhealth.com/LEVTrajectory/",
  platformUrl: "https://www.levlhealth.com/",
  benchmarkName: "LEV Benchmark (DunedinPACE + Multi-System Physiological Composite)",
  referenceEpochIso: "2026-01-01T00:00:00Z",
  methodologyNote:
    "Models Longevity Escape Velocity (LEV) as the intercept where annual biological damage accumulation (Pace of Aging) is fully offset by personal protocol deceleration plus compounding medical rejuvenation breakthroughs (Net Biological Aging <= 0.00 bio-yr/yr, or >= +1.0 yr remaining healthy life expectancy gained per calendar year). Single-assay epigenetic outliers are conservatively shrunk toward multi-organ physiological biomarkers.",
};

export const COHORT_PACE_PROFILES: Record<"p99" | "p80" | "p50", CohortPaceProfile> = {
  p99: {
    cohortId: "p99",
    label: "99th Percentile Person (Top 1% Frontier Optimizer)",
    shortLabel: "99th Percentile (Top 1%)",
    percentileRank: 99,
    badgeColor: "emerald",
    strokeColorDark: "#10b981",
    strokeColorLight: "#047857",
    description:
      "Top 1% longevity protocol adherent combining multi-biomarker feedback loops, elite cardiorespiratory fitness (VO2 max top 1.5%), sleep architecture optimization, and LEVL Synergy Engine multi-compound interventions.",
    baselineIntrinsicPoA2026: 0.668,
    rawObservedReferencePoA: 0.56,
    bayesianShrinkageLambda: 0.35,
    conservativeAnnualProtocolDrift: 0.0095,
    biotechAccessLeadYears: 14.5,
    protocolSummary: [
      "DunedinPACE + GrimAge2 + Multi-Organ MRI/Liquid Biopsy feedback loop",
      "VO2 max > 55 mL/kg/min, Zone-2 + HIIT & resistance training",
      "Precision circadian caloric/glycemic control + 8h sleep efficiency > 90%",
      "Synergy-screened geroprotectors & early Phase II/III clinical trial access",
    ],
  },
  p80: {
    cohortId: "p80",
    label: "80th Percentile Person (Top 20% Proactive Health)",
    shortLabel: "80th Percentile (Top 20%)",
    percentileRank: 80,
    badgeColor: "sky",
    strokeColorDark: "#38bdf8",
    strokeColorLight: "#0369a1",
    description:
      "Top 20% health-conscious adult maintaining structured aerobic/strength exercise, healthy metabolic biomarkers, restorative sleep, and evidence-backed Tier-1 longevity habits.",
    baselineIntrinsicPoA2026: 0.844,
    rawObservedReferencePoA: 0.81,
    bayesianShrinkageLambda: 0.35,
    conservativeAnnualProtocolDrift: 0.0065,
    biotechAccessLeadYears: 8.5,
    protocolSummary: [
      "Annual comprehensive blood panel (ApoB, HbA1c, hsCRP, homocysteine)",
      "150–240 min/wk structured aerobic + strength training",
      "Consistent 7.5–8h sleep schedule & Mediterranean/whole-food nutrition",
      "Early-mainstream adoption of FDA-cleared preventive gerotherapeutics",
    ],
  },
  p50: {
    cohortId: "p50",
    label: "50th Percentile Person (Status Quo Baseline)",
    shortLabel: "50th Percentile (Status Quo)",
    percentileRank: 50,
    badgeColor: "amber",
    strokeColorDark: "#f59e0b",
    strokeColorLight: "#b45309",
    description:
      "Median population aging trajectory (Status Quo dashed baseline on LEVL Trajectory). Ages 1.00 biological year per chronological year today and receives longevity therapies after standard population-wide regulatory & insurance rollout.",
    baselineIntrinsicPoA2026: 1.0,
    rawObservedReferencePoA: 1.0,
    bayesianShrinkageLambda: 0.0,
    conservativeAnnualProtocolDrift: 0.002,
    biotechAccessLeadYears: 0.0,
    protocolSummary: [
      "Standard reactive sick-care & actuarial population baseline (PoA = 1.00)",
      "Receives rejuvenation therapeutics only after full population-scale reimbursement",
    ],
  },
};

export const LEV_PREDICTION_MARKETS: LevPredictionMarket[] = [
  {
    id: "mkt-metaculus-6592",
    platform: "Metaculus",
    questionTitle:
      "When will a country reach longevity escape velocity, i.e. sustained increase of life expectancy of at least 1?",
    url: "https://www.metaculus.com/questions/6592/date-life-expectancy-hits-escape-velocity/",
    resolutionMetric:
      "First calendar year in which any country's period life expectancy increases by >= 1.0 year/year over a sustained multi-year window.",
    rawMarketDisplay: "Median: Nov 2053 (Q1: Oct 2038 • Q3: 2096)",
    rawProbabilityOrMedian: "2053.85 (Median) | 2038.80 (25th Pct)",
    forecasterCountOrLiquidity: "480+ forecasters • 1,200+ predictions",
    targetPopulation: "national_population",
    implied50thPercentileYear: 2053.8,
    implied80thPercentileYear: 2043.6,
    implied99thPercentileYear: 2038.2,
    translationMethodology:
      "National period life expectancy lags 99th-percentile frontier individuals by ~15.6 yrs due to population demographic inertia, regulatory reimbursement lag, and the 34% lower baseline biological damage rate (PoA ~0.66 vs 1.00) in top-1% protocol adherents. Aligns with Metaculus Q1 (2038.8).",
    weightInMarketAggregate: 0.34,
    lastVerifiedDate: "2026-11-05",
  },
  {
    id: "mkt-manifold-lev-2036",
    platform: "Manifold Markets",
    questionTitle:
      "Life Extension Velocity (LEV) - for every year we survive, we gain an extra year - by 2036?",
    url: "https://manifold.markets/",
    resolutionMetric:
      "Resolves YES if scientific/medical consensus or verified clinical survival metrics show >= 1 year of life expectancy gained per calendar year by end of 2036.",
    rawMarketDisplay: "34% probability by 2036",
    rawProbabilityOrMedian: "34% by Dec 2036",
    forecasterCountOrLiquidity: "High-liquidity binary market",
    targetPopulation: "living_cohort",
    implied50thPercentileYear: 2050.5,
    implied80thPercentileYear: 2042.2,
    implied99thPercentileYear: 2037.8,
    translationMethodology:
      "Fitting a Weibull cumulative hazard curve anchored at 11% (2030) and 34% (2036) places the 50% threshold for frontier human LEV at ~2037.8 and general population rollout at ~2050.5.",
    weightInMarketAggregate: 0.22,
    lastVerifiedDate: "2026-11-05",
  },
  {
    id: "mkt-manifold-foresight-alive",
    platform: "Foresight / Manifold",
    questionTitle:
      "Will one person currently alive reach longevity escape velocity? (Foresight Vision Weekend)",
    url: "https://manifold.markets/",
    resolutionMetric:
      "Resolves YES if at least one human alive today reaches actuarial/biological escape velocity without reliance on cryonics suspension.",
    rawMarketDisplay: "49% probability (48%–51% range)",
    rawProbabilityOrMedian: "49% Yes",
    forecasterCountOrLiquidity: "Foresight Institute benchmark market",
    targetPopulation: "living_cohort",
    implied50thPercentileYear: 2052.0,
    implied80thPercentileYear: 2041.8,
    implied99thPercentileYear: 2036.9,
    translationMethodology:
      "For top-1% biologically optimized cohorts alive today to bridge into full regenerative escape velocity before late-life frailty, the initial frontier LEV window implied by a ~49% survival-to-LEV odds centers at ~2036.9.",
    weightInMarketAggregate: 0.18,
    lastVerifiedDate: "2026-11-05",
  },
  {
    id: "mkt-manifold-lev-2030",
    platform: "Manifold Markets",
    questionTitle: "Longevity escape velocity before 2030?",
    url: "https://manifold.markets/",
    resolutionMetric:
      "Scientific consensus, major journal publication, or regulatory recognition that human LEV is achieved prior to Jan 1, 2030.",
    rawMarketDisplay: "11% probability before 2030",
    rawProbabilityOrMedian: "11% before 2030",
    forecasterCountOrLiquidity: "Active binary market",
    targetPopulation: "living_cohort",
    implied50thPercentileYear: 2051.4,
    implied80thPercentileYear: 2042.0,
    implied99thPercentileYear: 2037.4,
    translationMethodology:
      "Establishes the early-tail P10 bound (~2030.2): traders assign an 11% chance that AI-accelerated therapeutics + extreme protocol optimization cross LEV this decade, with median frontier crossing in the late 2030s.",
    weightInMarketAggregate: 0.14,
    lastVerifiedDate: "2026-11-05",
  },
  {
    id: "mkt-manifold-public-2040",
    platform: "Manifold Markets",
    questionTitle:
      "General anti-aging treatments available to the public by 2040 & age-cohort split (30yo vs 80yo)",
    url: "https://manifold.markets/",
    resolutionMetric:
      "Broad commercial/clinical availability of validated age-reversing therapeutics by 2040 (38%) + 64% probability that 30yo cohorts reach LEV earlier than 80yo cohorts.",
    rawMarketDisplay: "38% Public by 2040 • 64% Younger/Low-Damage First",
    rawProbabilityOrMedian: "38% Public by 2040",
    forecasterCountOrLiquidity: "Composite demographic markets",
    targetPopulation: "general_public",
    implied50thPercentileYear: 2051.8,
    implied80thPercentileYear: 2041.9,
    implied99thPercentileYear: 2036.6,
    translationMethodology:
      "38% mass-public availability by 2040 implies a median mass rollout around ~2043–2045 and 99th-percentile early-access / clinical-protocol intercept ~6–7 years earlier (~2036.6).",
    weightInMarketAggregate: 0.12,
    lastVerifiedDate: "2026-11-05",
  },
];

export const LEV_EXPERT_PREDICTIONS: LevExpertPrediction[] = [
  {
    id: "exp-de-grey",
    expertName: "Aubrey de Grey, PhD",
    roleAndAffiliation: "President, LEV Foundation • Coiner of 'Longevity Escape Velocity'",
    avatarInitials: "AG",
    category: "biogerontology",
    statedTimelineLabel: "2036–2038 (50% probability mark)",
    pointEstimate99thYear: 2037.0,
    lowBound99thYear: 2034.0,
    highBound99thYear: 2042.0,
    implied80thYear: 2041.5,
    implied50thYear: 2049.0,
    statedConfidenceNote: "Estimates ~50% chance of reaching human LEV by mid-to-late 2030s if Robust Mouse Rejuvenation & combination trials stay funded.",
    primaryMechanism:
      "Comprehensive damage repair across 7 SENS pillars: multi-modal senolytics, extracellular matrix crosslink breakers, mitochondrial allotopic expression, and stem cell replenishment.",
    sourceTitle: "LEV Foundation Roadmap & Robust Mouse Rejuvenation Updates",
    sourceUrl: "https://www.levf.org/",
    publicationYear: 2025,
    weightInExpertAggregate: 0.16,
  },
  {
    id: "exp-amodei",
    expertName: "Dario Amodei, PhD",
    roleAndAffiliation: "CEO & Co-Founder, Anthropic • PhD Biophysics (Princeton)",
    avatarInitials: "DA",
    category: "ai_biotech",
    statedTimelineLabel: "2033–2036 ('Compressed 21st Century')",
    pointEstimate99thYear: 2034.5,
    lowBound99thYear: 2032.0,
    highBound99thYear: 2038.0,
    implied80thYear: 2039.5,
    implied50thYear: 2047.0,
    statedConfidenceNote:
      "Projects AI compressing 50–100 years of biological research into 5–10 years, doubling human lifespan to ~150 years and enabling escape velocity for living cohorts.",
    primaryMechanism:
      "AI-accelerated biological discovery: virtual cell modeling, automated wet-lab hypothesis loops, precision clinical trial design, and multi-target genetic/epigenetic interventions.",
    sourceTitle: "Machines of Loving Grace: How AI Could Transform the World for the Better",
    sourceUrl: "https://darioamodei.com/machines-of-loving-grace",
    publicationYear: 2024,
    weightInExpertAggregate: 0.14,
  },
  {
    id: "exp-church",
    expertName: "George Church, PhD",
    roleAndAffiliation: "Professor of Genetics, Harvard Medical School & MIT • Wyss Institute",
    avatarInitials: "GC",
    category: "genetics_reprogramming",
    statedTimelineLabel: "Mid-to-Late 2030s (~2035–2040)",
    pointEstimate99thYear: 2037.5,
    lowBound99thYear: 2034.0,
    highBound99thYear: 2043.0,
    implied80thYear: 2042.5,
    implied50thYear: 2050.0,
    statedConfidenceNote:
      "Notes frontier cohorts could cross early borders of LEV within a decade via multiplex gene therapy and combinatorial cellular reprogramming.",
    primaryMechanism:
      "Multiplex AAV & CRISPR gene therapies (simultaneously targeting TGF-β, FGF21, αKlotho, telomerase) plus programmable epigenetic editing.",
    sourceTitle: "Harvard Wyss Institute & Rejuvenate Bio Combinatorial Gene Therapy Research",
    sourceUrl: "https://wyss.harvard.edu/",
    publicationYear: 2025,
    weightInExpertAggregate: 0.12,
  },
  {
    id: "exp-kurzweil",
    expertName: "Ray Kurzweil",
    roleAndAffiliation: "Principal Researcher & AI Visionary, Google • Author, The Singularity Is Nearer",
    avatarInitials: "RK",
    category: "ai_biotech",
    statedTimelineLabel: "2029–2032 (99th Percentile by ~2030)",
    pointEstimate99thYear: 2030.5,
    lowBound99thYear: 2029.0,
    highBound99thYear: 2033.0,
    implied80thYear: 2035.0,
    implied50thYear: 2042.0,
    statedConfidenceNote:
      "Explicitly distinguishes diligent, well-resourced early adopters (reaching LEV ~2029–2030) from broader population rollout (~2032+).",
    primaryMechanism:
      "Bridge 1 (current precision protocols) -> Bridge 2 (AI-simulated biology & mRNA/gene reprogramming in late 2020s/early 2030s) -> Bridge 3 (medical nanorobotics).",
    sourceTitle: "The Singularity Is Nearer: When We Merge with AI",
    sourceUrl: "https://en.wikipedia.org/wiki/The_Singularity_Is_Nearer",
    publicationYear: 2024,
    weightInExpertAggregate: 0.11,
  },
  {
    id: "exp-sinclair",
    expertName: "David Sinclair, PhD",
    roleAndAffiliation: "Professor of Genetics, Harvard Medical School • Author, Lifespan",
    avatarInitials: "DS",
    category: "genetics_reprogramming",
    statedTimelineLabel: "Late 2030s (~2036–2040)",
    pointEstimate99thYear: 2038.0,
    lowBound99thYear: 2035.0,
    highBound99thYear: 2043.0,
    implied80thYear: 2043.0,
    implied50thYear: 2051.0,
    statedConfidenceNote:
      "Following primate optic nerve restoration and early human partial-reprogramming trials, projects systemic age-resetting therapeutics scaling in the late 2030s.",
    primaryMechanism:
      "Information Theory of Aging: partial epigenetic reprogramming using inducible OSK (Oct4, Sox2, Klf4) Yamanaka factors & chemical reprogramming cocktails.",
    sourceTitle: "Harvard Glenn Center for Biology of Aging Research / Life Biosciences",
    sourceUrl: "https://sinclair.hms.harvard.edu/",
    publicationYear: 2025,
    weightInExpertAggregate: 0.1,
  },
  {
    id: "exp-johnson",
    expertName: "Bryan Johnson",
    roleAndAffiliation: "Founder, Project Blueprint & Rejuvenation Olympics",
    avatarInitials: "BJ",
    category: "longevity_protocol",
    statedTimelineLabel: "Mid 2030s (~2034–2038 Bridge Intercept)",
    pointEstimate99thYear: 2035.8,
    lowBound99thYear: 2033.0,
    highBound99thYear: 2039.5,
    implied80thYear: 2041.5,
    implied50thYear: 2052.0,
    statedConfidenceNote:
      "Demonstrated DunedinPACE scores of 0.48–0.64; argues that cutting personal biological aging velocity by ~35–45% halves the biotech hurdle needed to hit LEV.",
    primaryMechanism:
      "Continuous 100+ organ biomarker quantification, caloric/circadian precision, exercise/VO2 max optimization, and stacked regenerative therapies (plasma, follistatin, senolytics).",
    sourceTitle: "Rejuvenation Olympics & Project Blueprint Longitudinal Biomarker Ledger",
    sourceUrl: "https://rejuvenationolympics.com/",
    publicationYear: 2026,
    weightInExpertAggregate: 0.1,
  },
  {
    id: "exp-diamandis",
    expertName: "Peter Diamandis, MD",
    roleAndAffiliation: "Founder, XPRIZE Healthspan ($101M) & Fountain Life",
    avatarInitials: "PD",
    category: "longevity_protocol",
    statedTimelineLabel: "2030–2034 (Frontier Early Adopters)",
    pointEstimate99thYear: 2032.2,
    lowBound99thYear: 2030.0,
    highBound99thYear: 2035.5,
    implied80thYear: 2037.5,
    implied50thYear: 2045.0,
    statedConfidenceNote:
      "XPRIZE Healthspan targets a verified 10–20 year functional reversal in muscle, cognition, and immunity by 2030 as the direct catalyst for 99th-percentile LEV.",
    primaryMechanism:
      "AI multimodal early detection (full-body MRI + liquid biopsy) + therapeutic plasma exchange, NK/stem cell infusions, and XPRIZE Healthspan clinical trial winners.",
    sourceTitle: "XPRIZE Healthspan & Longevity Mindset Roadmap",
    sourceUrl: "https://www.xprize.org/prizes/healthspan",
    publicationYear: 2025,
    weightInExpertAggregate: 0.08,
  },
  {
    id: "exp-hassabis-altman",
    expertName: "Demis Hassabis & Sam Altman (AI-Bio Labs)",
    roleAndAffiliation: "Isomorphic Labs / DeepMind (Nobel '24) & Retro Biosciences ($1B+)",
    avatarInitials: "HA",
    category: "ai_biotech",
    statedTimelineLabel: "2035–2040 (+10 Healthy Years Bridge -> LEV)",
    pointEstimate99thYear: 2037.8,
    lowBound99thYear: 2035.0,
    highBound99thYear: 2042.0,
    implied80thYear: 2042.8,
    implied50thYear: 2051.0,
    statedConfidenceNote:
      "Retro Biosciences targets adding +10 healthy human years in the 2030s; Isomorphic Labs targets AI-designed clinical drug candidates compressing preclinical timelines by 10x.",
    primaryMechanism:
      "AlphaFold 3 rational molecular design + Retro's 3-pillar focus: autophagy enhancement, hematopoietic/microglia rejuvenation, and partial cellular reprogramming.",
    sourceTitle: "Retro Biosciences & Isomorphic Labs Translational Roadmaps",
    sourceUrl: "https://retrobio.com/",
    publicationYear: 2025,
    weightInExpertAggregate: 0.08,
  },
  {
    id: "exp-cordeiro",
    expertName: "José Luis Cordeiro, PhD",
    roleAndAffiliation: "MIT Engineer • Fellow, World Academy of Art & Science • Author, The Death of Death",
    avatarInitials: "JC",
    category: "biogerontology",
    statedTimelineLabel: "2029–2030 (LEV Bridge) • 2045 (Full Rejuvenation)",
    pointEstimate99thYear: 2030.5,
    lowBound99thYear: 2029.0,
    highBound99thYear: 2035.0,
    implied80thYear: 2036.5,
    implied50thYear: 2045.0,
    statedConfidenceNote:
      "Predicts initial escape velocity bridge by 2029–2030 for proactive individuals, culminating in full clinical biological age reversal by 2045.",
    primaryMechanism:
      "Exponential biotechnology convergence: induced pluripotent stem cells, telomere extension, organ bioprinting, and gene editing.",
    sourceTitle: "The Death of Death: The Scientific Possibility of Physical Immortality",
    sourceUrl: "https://en.wikipedia.org/wiki/Jos%C3%A9_Luis_Cordeiro",
    publicationYear: 2023,
    weightInExpertAggregate: 0.05,
  },
  {
    id: "exp-regulatory-realists",
    expertName: "Celine Halioua & Laura Deming (Biotech Realists)",
    roleAndAffiliation: "CEO, Loyal • Founder, The Longevity Fund (Translational Geroscience)",
    avatarInitials: "CD",
    category: "regulatory_realist",
    statedTimelineLabel: "2042–2050 (FDA-Cleared Systemic Rollout)",
    pointEstimate99thYear: 2045.0,
    lowBound99thYear: 2040.0,
    highBound99thYear: 2052.0,
    implied80thYear: 2051.0,
    implied50thYear: 2060.0,
    statedConfidenceNote:
      "Emphasizes clinical trial safety windows, biodistribution hurdles for in vivo reprogramming, and stepwise FDA validation before human LEV is achieved.",
    primaryMechanism:
      "Validated preventive metabolic & senolytic drugs clearing FDA proxy endpoints first, followed by multi-decade translational scaling of systemic rejuvenation.",
    sourceTitle: "Translational Geroscience & Regulatory Pathways for Aging Therapeutics",
    sourceUrl: "https://loyal.com/",
    publicationYear: 2025,
    weightInExpertAggregate: 0.06,
  },
];
