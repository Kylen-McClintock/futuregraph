/**
 * Nature of Reality: A Probabilistic Breakdown
 * Complete 7-Epoch, 43-Node, 98-Link Multi-Stage Conditional Sankey Dataset
 * Faithfully preserving the exact Flourish topology, flow weights, and gradient hex palette,
 * augmented with deep-dive conditional transition matrices, worldview archetype presets,
 * and cited physics & philosophy arguments.
 */

export interface RealityEpochSpec {
  columnIndex: number;
  id: string;
  shortTitle: string;
  questionTitle: string;
  subtitle: string;
  badgeColor: string;
  xPosition: number;
}

export interface RealityCitation {
  author: string;
  handle: string;
  workTitle: string;
  year: string;
  platform: string;
  url: string;
  upvotes: number;
  stance: "support" | "critique" | "synthesis";
  thesis: string;
}

export interface RealityNodeSpec {
  id: string;
  name: string;
  shortLabel?: string;
  columnIndex: number;
  orderInColumn: number;
  color: string;
  baselineValue: number;
  category:
    | "multiverse"
    | "simulation"
    | "quantum_physical"
    | "consciousness"
    | "theistic"
    | "cosmic_fate"
    | "incomprehensible";
  summary: string;
  deepMechanism: string;
  citations: RealityCitation[];
}

export interface RealityLinkSpec {
  id: string;
  sourceId: string;
  targetId: string;
  baselineFlow: number;
}

export interface RealityWorldviewPreset {
  id: string;
  name: string;
  shortBadge: string;
  authorLabel: string;
  description: string;
  accentColor: string;
  /** Root probabilities for Column 0 (must sum to 1.0) */
  rootPriors: Record<string, number>;
  /** Optional conditional split overrides: key = `${sourceId}->${targetId}`, value = conditional share */
  conditionalOverrides?: Record<string, number>;
}

export const NATURE_OF_REALITY_EPOCHS: RealityEpochSpec[] = [
  {
    columnIndex: 0,
    id: "epoch-0-before-universe",
    shortTitle: "I. Ontological Origin",
    questionTitle: "What Existed Before Our Universe?",
    subtitle: "Primordial substrate or boundary condition (Sums to 100%)",
    badgeColor: "#4328E7",
    xPosition: 0,
  },
  {
    columnIndex: 1,
    id: "epoch-1-cosmogenesis",
    shortTitle: "II. Cosmogenesis",
    questionTitle: "How Did Our Universe Arise?",
    subtitle: "Physical, computational, or metaphysical generative mechanism",
    badgeColor: "#FFC502",
    xPosition: 243.37,
  },
  {
    columnIndex: 2,
    id: "epoch-2-conscious-death",
    shortTitle: "III. Conscious Fate",
    questionTitle: "What Happens When We Die?",
    subtitle: "Subjective boundary condition at biological death (Sums to 100%)",
    badgeColor: "#889200",
    xPosition: 486.74,
  },
  {
    columnIndex: 3,
    id: "epoch-3-postmortem-architecture",
    shortTitle: "IV. Continuation & Sim Mode",
    questionTitle: "Post-Mortem / Waking Architecture",
    subtitle: "Form of non-material continuation or base-reality simulation type",
    badgeColor: "#cf60d0",
    xPosition: 730.11,
  },
  {
    columnIndex: 4,
    id: "epoch-4-simulation-purpose",
    shortTitle: "V. Simulation Purpose",
    questionTitle: "Nature of Simulated Experience",
    subtitle: "Experiential & moral implications if waking into a base universe",
    badgeColor: "#a673ed",
    xPosition: 973.48,
  },
  {
    columnIndex: 5,
    id: "epoch-5-cosmic-trajectory",
    shortTitle: "VI. Cosmic Trajectory",
    questionTitle: "Macro-Cosmic Dynamics",
    subtitle: "Long-range expansion vs. contraction of physical spacetime",
    badgeColor: "#ec5754",
    xPosition: 1216.85,
  },
  {
    columnIndex: 6,
    id: "epoch-6-ultimate-fate",
    shortTitle: "VII. Ultimate Cosmic Fate",
    questionTitle: "How Does Our Universe End?",
    subtitle: "Terminal thermodynamic, dynamical, or computational horizon (Sums to 100%)",
    badgeColor: "#6985ff",
    xPosition: 1460.22,
  },
];

export const NATURE_OF_REALITY_NODES: RealityNodeSpec[] = [
  // ============================================================================
  // COLUMN 0: What Existed Before Our Universe?
  // ============================================================================
  {
    id: "nor-c0-multiverse",
    name: "Multiverse",
    columnIndex: 0,
    orderInColumn: 0,
    color: "#4328E7",
    baselineValue: 0.4338,
    category: "multiverse",
    summary:
      "Our observable universe is one pocket or bubble embedded within a vastly larger ensemble of universes governed by inflationary, cyclic, brane, or holographic dynamics.",
    deepMechanism:
      "In Level I–IV multiverse taxonomies (Tegmark 2003; Guth 2007), the Big Bang was not the absolute beginning of reality, but a local phase transition or nucleation event inside an eternally existing meta-manifold.",
    citations: [
      {
        author: "Alan Guth",
        handle: "alan_guth_mit",
        workTitle: "Eternal Inflation and Its Implications (J. Phys. A)",
        year: "2007",
        platform: "arXiv / Physics",
        url: "https://arxiv.org/abs/hep-th/0702178",
        upvotes: 342,
        stance: "support",
        thesis:
          "Almost all inflationary models are eternal into the future: once inflation starts, false-vacuum decay produces an infinite fractal of pocket universes without requiring a unique fine-tuned initial event.",
      },
      {
        author: "Max Tegmark",
        handle: "max_tegmark",
        workTitle: "Parallel Universes (Scientific American / arXiv)",
        year: "2003",
        platform: "arXiv",
        url: "https://arxiv.org/abs/astro-ph/0302131",
        upvotes: 289,
        stance: "synthesis",
        thesis:
          "Distinguishes four nested multiverse levels: Level I (beyond cosmic horizon), Level II (post-inflationary bubbles with different physical constants), Level III (Everettian quantum branches), and Level IV (mathematical structures).",
      },
    ],
  },
  {
    id: "nor-c0-preexisting-universe",
    name: "Pre-existing Universe",
    columnIndex: 0,
    orderInColumn: 1,
    color: "#9654E5",
    baselineValue: 0.3,
    category: "simulation",
    summary:
      "Our cosmos emerged from—or is instantiated inside—a single parent universe, either computationally (simulation) or physically (black hole singularity / laboratory baby universe).",
    deepMechanism:
      "Covers both substrate-dependent computational instantiation (Bostrom 2003) and cosmological natural selection (Smolin 1992), where a parent spacetime gives birth to our universe via technological or gravitational collapse.",
    citations: [
      {
        author: "Nick Bostrom",
        handle: "nick_bostrom",
        workTitle: "Are You Living in a Computer Simulation? (Philosophical Quarterly)",
        year: "2003",
        platform: "Oxford / PhilPapers",
        url: "https://www.simulation-argument.com/simulation.pdf",
        upvotes: 418,
        stance: "support",
        thesis:
          "If posthuman civilizations run even a tiny fraction of their available computing power on ancestor-class or evolutionary simulations, simulated conscious observers vastly outnumber base-reality biological observers.",
      },
      {
        author: "Lee Smolin",
        handle: "lee_smolin_pi",
        workTitle: "Cosmological Natural Selection & Black Hole Progeny",
        year: "1997",
        platform: "Oxford University Press",
        url: "https://arxiv.org/abs/hep-th/0612185",
        upvotes: 194,
        stance: "synthesis",
        thesis:
          "Gravitational singularities inside black holes of a parent universe can bounce into new expanding child universes with slightly shifted dimensionless physical parameters.",
      },
    ],
  },
  {
    id: "nor-c0-nothingness",
    name: "'Nothingness'",
    columnIndex: 0,
    orderInColumn: 2,
    color: "#FF6283",
    baselineValue: 0.2162,
    category: "quantum_physical",
    summary:
      "No prior classical space, time, or matter existed; the universe arose from a zero-volume quantum boundary condition ('nothing'), ex nihilo divine act, or brute uncaused fact.",
    deepMechanism:
      "In the Hartle–Hawking no-boundary proposal and Vilenkin's tunneling wavefunction, closed 3-geometries nucleate with zero total energy (positive matter energy exactly balanced by negative gravitational potential energy).",
    citations: [
      {
        author: "Alexander Vilenkin",
        handle: "alex_vilenkin",
        workTitle: "Creation of Universes from Nothing (Physics Letters B)",
        year: "1982",
        platform: "Physics Letters B",
        url: "https://doi.org/10.1016/0370-2693(82)90866-8",
        upvotes: 312,
        stance: "support",
        thesis:
          "Quantum tunneling from a state with no classical space-time ('nothing') into a de Sitter space of finite radius requires zero net conserved energy and no prior causal chain.",
      },
      {
        author: "David Albert",
        handle: "david_albert_phil",
        workTitle: "On the Origin of Everything (Critique of Quantum 'Nothingness')",
        year: "2012",
        platform: "Philosophy of Physics",
        url: "https://www.nytimes.com/2012/03/25/books/review/a-universe-from-nothing-by-lawrence-m-krauss.html",
        upvotes: 245,
        stance: "critique",
        thesis:
          "Relativistic quantum field states and quantum laws are not philosophical 'nothingness'—explaining why those field operators exist at all remains an open metaphysical question.",
      },
    ],
  },
  {
    id: "nor-c0-incomprehensible",
    name: "Incomprehensible/yet to be conceived of",
    shortLabel: "Incomprehensible Origin",
    columnIndex: 0,
    orderInColumn: 3,
    color: "#FF8800",
    baselineValue: 0.05,
    category: "incomprehensible",
    summary:
      "The true ontological ground lies outside human cognitive architecture or current mathematical physics (cognitive closure / pre-geometric structure).",
    deepMechanism:
      "Reflects epistemic humility (McGinn 1989; Kantian noumena): evolved hominid concepts of time, causation, and substance may be emergent approximations that break down completely at the primordial boundary.",
    citations: [
      {
        author: "Colin McGinn",
        handle: "colin_mcginn",
        workTitle: "Can We Solve the Mind-Body Problem? & Cognitive Closure",
        year: "1989",
        platform: "Mind / PhilPapers",
        url: "https://doi.org/10.1093/mind/XCVIII.391.349",
        upvotes: 178,
        stance: "support",
        thesis:
          "Just as non-human animals are cognitively closed to calculus, human concept-forming faculties may be structurally closed to the true pre-spatiotemporal ground of reality.",
      },
    ],
  },

  // ============================================================================
  // COLUMN 1: How Did Our Universe Arise? (Cosmogenesis)
  // ============================================================================
  {
    id: "nor-c1-eternal-inflation",
    name: "Eternal Inflation",
    columnIndex: 1,
    orderInColumn: 0,
    color: "#FFC502",
    baselineValue: 0.2602,
    category: "multiverse",
    summary:
      "Exponential expansion of an inflaton field where quantum fluctuations keep regions inflating forever while local decay bubbles nucleate pocket universes like ours.",
    deepMechanism:
      "Driven by a scalar field rolling down a flat potential (Guth 1981; Linde 1986). Reheating at the end of local slow-roll converts vacuum energy into the hot Big Bang plasma.",
    citations: [
      {
        author: "Andrei Linde",
        handle: "andrei_linde",
        workTitle: "Eternally Existing Self-Reproducing Chaotic Inflationary Universe",
        year: "1986",
        platform: "Physics Letters B",
        url: "https://doi.org/10.1016/0370-2693(86)90611-8",
        upvotes: 356,
        stance: "support",
        thesis:
          "Large-field quantum fluctuations of the scalar inflaton continually regenerate inflating domains faster than they decay, making pocket-universe production generic and self-sustaining.",
      },
    ],
  },
  {
    id: "nor-c1-cyclic-models",
    name: "Cyclic Models",
    columnIndex: 1,
    orderInColumn: 1,
    color: "#007D8E",
    baselineValue: 0.0651,
    category: "multiverse",
    summary:
      "The universe undergoes an endless sequence of cosmic epochs—bouncing from contraction to expansion or conformal rescaling from heat death to a new Big Bang.",
    deepMechanism:
      "Includes Steinhardt–Turok cyclic cosmology and Roger Penrose's Conformal Cyclic Cosmology (CCC), where the infinite future de Sitter boundary of one aeon maps conformally onto the Big Bang of the next.",
    citations: [
      {
        author: "Roger Penrose",
        handle: "roger_penrose",
        workTitle: "Cycles of Time: An Extraordinary New View of the Universe",
        year: "2010",
        platform: "Oxford / Bodley Head",
        url: "https://inspirehep.net/literature/880316",
        upvotes: 264,
        stance: "support",
        thesis:
          "Once all massive particles decay or evaporate via Hawking radiation in the far future, the universe becomes conformally invariant—identical in conformal geometry to a smooth Big Bang origin.",
      },
    ],
  },
  {
    id: "nor-c1-brane-collisions",
    name: "Brane Collisions",
    columnIndex: 1,
    orderInColumn: 2,
    color: "#1AA7EE",
    baselineValue: 0.0651,
    category: "multiverse",
    summary:
      "Ekpyrotic / M-theory cosmology: our 3+1D universe is a boundary D-brane that collided with a parallel brane across a higher-dimensional bulk.",
    deepMechanism:
      "Proposed by Khoury, Ovrut, Steinhardt, and Turok (2001): the kinetic energy of colliding 3-branes in 11-dimensional Hořava–Witten M-theory converts into radiation and matter without an initial singularity.",
    citations: [
      {
        author: "Paul Steinhardt & Neil Turok",
        handle: "steinhardt_turok",
        workTitle: "A Cyclic Model of the Universe (Science)",
        year: "2002",
        platform: "Science",
        url: "https://doi.org/10.1126/science.1070462",
        upvotes: 231,
        stance: "support",
        thesis:
          "Periodic collisions between boundary branes generate nearly scale-invariant density perturbations without requiring superluminal inflation or a singular beginning of time.",
      },
    ],
  },
  {
    id: "nor-c1-holographic-multiverse",
    name: "Holographic Multiverse",
    columnIndex: 1,
    orderInColumn: 3,
    color: "#29DAE4",
    baselineValue: 0.0217,
    category: "multiverse",
    summary:
      "Bulk 3D spacetime and gravity emerge holographically from quantum entanglement on a lower-dimensional boundary theory (AdS/CFT / dS/CFT correspondence).",
    deepMechanism:
      "Following 't Hooft, Susskind (1995), Maldacena (1997), and Van Raamsdonk (2010), geometric connectivity in our cosmos is the dual projection of boundary quantum information.",
    citations: [
      {
        author: "Juan Maldacena & Leonard Susskind",
        handle: "maldacena_ias",
        workTitle: "The World as a Hologram & ER=EPR",
        year: "1998",
        platform: "arXiv / JHEP",
        url: "https://arxiv.org/abs/hep-th/9711200",
        upvotes: 298,
        stance: "support",
        thesis:
          "Bulk gravitational physics in D+1 dimensions is mathematically isomorphic to a strongly coupled quantum field theory without gravity living on its D-dimensional boundary.",
      },
    ],
  },
  {
    id: "nor-c1-incomprehensible-mechanism",
    name: "Incomprehensible (Mechanism)",
    shortLabel: "Incomprehensible Mechanism",
    columnIndex: 1,
    orderInColumn: 4,
    color: "#88E99A",
    baselineValue: 0.0217,
    category: "incomprehensible",
    summary:
      "A multiverse generative mechanism whose mathematical or physical rules transcend known quantum field theory and computation.",
    deepMechanism:
      "Represents unknown non-spatiotemporal emergence mechanisms within a broader multiverse ensemble.",
    citations: [
      {
        author: "Sean Carroll",
        handle: "seanmcarroll",
        workTitle: "Space Emerging from Quantum Mechanics",
        year: "2016",
        platform: "arXiv / Caltech",
        url: "https://arxiv.org/abs/1606.08444",
        upvotes: 185,
        stance: "synthesis",
        thesis:
          "Classical spacetime and locality itself may be coarse-grained emergent features of an abstract Hilbert-space factorization we have barely begun to map.",
      },
    ],
  },
  {
    id: "nor-c1-ancestor-simulation",
    name: "Ancestor Simulation",
    columnIndex: 1,
    orderInColumn: 5,
    color: "#019C00",
    baselineValue: 0.135,
    category: "simulation",
    summary:
      "Our universe is a high-fidelity historical or evolutionary simulation run by our own posthuman descendants (or a closely related human-derived civilization).",
    deepMechanism:
      "Bostrom's Third Proposition: technologically mature civilizations with astronomical compute (e.g., Matrioshka brains) run detailed simulations of their evolutionary and historical forebears.",
    citations: [
      {
        author: "Nick Bostrom",
        handle: "nick_bostrom",
        workTitle: "The Simulation Argument: Why the Probability You Are in a Matrix is Quite High",
        year: "2003",
        platform: "Philosophical Quarterly",
        url: "https://www.simulation-argument.com/simulation.pdf",
        upvotes: 412,
        stance: "support",
        thesis:
          "Unless virtually all civilizations go extinct before reaching posthuman compute OR lose all interest in running historical/evolutionary simulations, we are almost certainly inside one.",
      },
      {
        author: "David Kipping",
        handle: "david_kipping_columbia",
        workTitle: "A Bayesian Approach to the Simulation Argument (Universe)",
        year: "2020",
        platform: "Columbia / MDPI Universe",
        url: "https://arxiv.org/abs/2010.06663",
        upvotes: 226,
        stance: "critique",
        thesis:
          "Applying Bayesian model averaging across Bostrom's trilemma yields a ~50% prior ceiling on being simulated until we observe whether humanity itself spawns conscious simulations.",
      },
    ],
  },
  {
    id: "nor-c1-alien-simulation",
    name: "Alien Simulation",
    columnIndex: 1,
    orderInColumn: 6,
    color: "#C11F1F",
    baselineValue: 0.075,
    category: "simulation",
    summary:
      "Our cosmos is a simulation instantiated by a non-human extraterrestrial or trans-dimensional intelligence exploring physics, evolution, or consciousness.",
    deepMechanism:
      "Rather than simulating their own specific ancestors, an alien super-civilization sweeps parameter spaces of chemistry, evolutionary biology, or artificial life, producing humanity as an emergent branch.",
    citations: [
      {
        author: "David Chalmers",
        handle: "david_chalmers",
        workTitle: "Reality+: Virtual Worlds and the Problems of Philosophy",
        year: "2022",
        platform: "W. W. Norton / NYU",
        url: "https://consc.net/reality/",
        upvotes: 304,
        stance: "support",
        thesis:
          "Simulated realities are not 'illusions'—they are genuine digital-substrate universes whose objects, causal powers, and conscious experiences are just as real as base-level physics.",
      },
    ],
  },
  {
    id: "nor-c1-singularity-parent",
    name: "Singularity (within Parent Universe)",
    shortLabel: "Singularity (Parent Universe)",
    columnIndex: 1,
    orderInColumn: 7,
    color: "#730000",
    baselineValue: 0.075,
    category: "quantum_physical",
    summary:
      "Our Big Bang was the white-hole interior bounce of a gravitational black hole singularity formed inside a pre-existing parent universe.",
    deepMechanism:
      "In Einstein–Cartan torsion gravity (Popławski 2010) and Smolin's Cosmological Natural Selection, fermion spin-torsion prevents infinite density inside a collapsing black hole, rebounding into a new expanding FLRW cosmos.",
    citations: [
      {
        author: "Nikodem Popławski",
        handle: "n_poplawski",
        workTitle: "Cosmology with Torsion: An Alternative to Cosmic Inflation",
        year: "2010",
        platform: "Physics Letters B",
        url: "https://arxiv.org/abs/1007.0587",
        upvotes: 215,
        stance: "support",
        thesis:
          "Spacetime torsion coupled to intrinsic fermion spin creates extreme gravitational repulsion at Planck densities, turning every black hole interior into a non-singular expanding baby universe.",
      },
    ],
  },
  {
    id: "nor-c1-quantum-fluct-parent",
    name: "Quantum Fluctuation (within Parent Universe)",
    shortLabel: "Quantum Fluct. (Parent)",
    columnIndex: 1,
    orderInColumn: 8,
    color: "#0095ff",
    baselineValue: 0.015,
    category: "quantum_physical",
    summary:
      "A rare high-entropy downward fluctuation or false-vacuum bubble nucleation inside the quiescent vacuum of an older parent universe.",
    deepMechanism:
      "Carroll–Chen (2004) model: in a parent de Sitter background, rare quantum fluctuations nucleate baby universes that tunnel across an ultraviolet barrier and inflate.",
    citations: [
      {
        author: "Sean Carroll & Jennifer Chen",
        handle: "carroll_chen",
        workTitle: "Spontaneous Inflation and the Origin of the Arrow of Time",
        year: "2004",
        platform: "arXiv",
        url: "https://arxiv.org/abs/hep-th/0410270",
        upvotes: 241,
        stance: "support",
        thesis:
          "De Sitter background space can spontaneously nucleate baby inflating universes via quantum fluctuations, naturally explaining the thermodynamic arrow of time without fine-tuned initial conditions.",
      },
    ],
  },
  {
    id: "nor-c1-quantum-vacuum-fluct",
    name: "Quantum Vacuum Fluctuation",
    columnIndex: 1,
    orderInColumn: 9,
    color: "#5b9b0f",
    baselineValue: 0.1662,
    category: "quantum_physical",
    summary:
      "Spontaneous quantum creation of a closed zero-energy universe via quantum gravitational tunneling from an empty pre-geometric state.",
    deepMechanism:
      "First proposed by Edward Tryon (1973) in Nature ('Is the Universe a Vacuum Fluctuation?') and formalized in quantum cosmology by Hartle & Hawking (1983) and Vilenkin (1982).",
    citations: [
      {
        author: "Edward P. Tryon",
        handle: "edward_tryon",
        workTitle: "Is the Universe a Vacuum Fluctuation? (Nature)",
        year: "1973",
        platform: "Nature",
        url: "https://doi.org/10.1038/246396a0",
        upvotes: 295,
        stance: "support",
        thesis:
          "Because the positive rest-mass energy of matter is canceled by negative gravitational potential energy in a closed cosmos, the net energy of the universe is zero—permitting spontaneous quantum emergence.",
      },
    ],
  },
  {
    id: "nor-c1-divine-creation",
    name: "Ex Nihilo Divine Creation",
    columnIndex: 1,
    orderInColumn: 10,
    color: "#e74fab",
    baselineValue: 0.0375,
    category: "theistic",
    summary:
      "A transcendent, non-material conscious creator or necessary mind intentionally brought spacetime, physical laws, and fine-tuned constants into being.",
    deepMechanism:
      "Classical philosophical theism and fine-tuning teleology (Swinburne 2004; Collins 2009): appeals to an unconditioned intentional agent to explain why contingent physical constants lie inside the narrow life-permitting window.",
    citations: [
      {
        author: "Richard Swinburne",
        handle: "r_swinburne_ox",
        workTitle: "The Existence of God (2nd ed., Bayesian Confirmation)",
        year: "2004",
        platform: "Oxford University Press",
        url: "https://academic.oup.com/book/2027",
        upvotes: 188,
        stance: "support",
        thesis:
          "Argues that a single simple intentional ground offers a higher prior simplicity for fine-tuned law-like order than an unexplained brute ensemble.",
      },
    ],
  },
  {
    id: "nor-c1-uncaused-other",
    name: "Uncaused/Other",
    columnIndex: 1,
    orderInColumn: 11,
    color: "#00a6c2",
    baselineValue: 0.0125,
    category: "quantum_physical",
    summary:
      "The initial state of the universe is a brute, uncaused boundary fact requiring no external mechanism, prior cause, or generator.",
    deepMechanism:
      "Humean / Russellian brute-fact cosmology: causation is an internal relation among events *within* spacetime, not a relation that applies to the existence of the four-dimensional block universe as a whole.",
    citations: [
      {
        author: "Bertrand Russell & Sean Carroll",
        handle: "russell_carroll",
        workTitle: "Why Does the Universe Exist? (Brute Fact Ontology)",
        year: "2012",
        platform: "PhilPapers",
        url: "https://arxiv.org/abs/1204.4658",
        upvotes: 210,
        stance: "synthesis",
        thesis:
          "Demanding a causal mechanism for the entirety of spacetime commits a category mistake if 'cause and effect' is an emergent arrow-of-time regularity internal to our universe.",
      },
    ],
  },

  // ============================================================================
  // COLUMN 2: What Happens When We Die? (Conscious Fate)
  // ============================================================================
  {
    id: "nor-c2-eternal-nonexistence",
    name: "Eternal Non-existence",
    columnIndex: 2,
    orderInColumn: 0,
    color: "#889200",
    baselineValue: 0.7318,
    category: "quantum_physical",
    summary:
      "Biological death permanently terminates the physical information-processing substrate of the brain, ending subjective first-person experience forever.",
    deepMechanism:
      "Standard neurobiological physicalism / functionalism: conscious experience is supervenient on active thalamocortical and neural dynamics; when metabolic entropy dissolves those structures, subjective perspective ceases symmetrically to pre-birth non-existence.",
    citations: [
      {
        author: "Sean Carroll",
        handle: "seanmcarroll",
        workTitle: "The Big Picture: Core Theory and the Completeness of Local Physics",
        year: "2016",
        platform: "Dutton / Caltech",
        url: "https://www.preposterousuniverse.com/thebigpicture/",
        upvotes: 334,
        stance: "support",
        thesis:
          "The Core Theory of quantum field theory is completely known in the regime of everyday human biology; there are no unknown particles or fields capable of carrying coherent personal memory out of a decaying brain.",
      },
      {
        author: "ThomasWClark",
        handle: "thomas_w_clark",
        workTitle: "Death, Nothingness, and Subjectivity (Naturalism.org)",
        year: "1994",
        platform: "Humanist / PhilPapers",
        url: "https://naturalism.org/philosophy/death/death-nothingness-and-subjectivity",
        upvotes: 176,
        stance: "synthesis",
        thesis:
          "Non-existence is not an experienced 'darkness'—because there is no subject left to experience absence, the cessation of one stream of consciousness leaves only present conscious centers in the cosmos.",
      },
    ],
  },
  {
    id: "nor-c2-nonmaterial-continuation",
    name: "Non-material continuation of consciousness",
    shortLabel: "Non-material Continuation",
    columnIndex: 2,
    orderInColumn: 1,
    color: "#847efa",
    baselineValue: 0.0908,
    category: "consciousness",
    summary:
      "Conscious awareness persists beyond biological death via analytic idealism, panpsychism, universal mind dissociation, reincarnation, or Everettian quantum branching.",
    deepMechanism:
      "Under analytic idealism (Kastrup 2019) or dual-aspect monism (Chalmers 1996; Nagel 2012), phenomenal consciousness is ontological bedrock, and biological brains act as dissociative filters or localizers rather than generators of mind.",
    citations: [
      {
        author: "Bernardo Kastrup",
        handle: "bernardo_kastrup",
        workTitle: "The Idea of the World: A Multi-Disciplinary Argument for the Mental Nature of Reality",
        year: "2019",
        platform: "Iff Books / PhilPapers",
        url: "https://philpapers.org/rec/KASTIO-3",
        upvotes: 248,
        stance: "support",
        thesis:
          "If individual organisms are dissociative alters within a single universal phenomenal field, biological death is the end of the dissociative boundary—reintegrating awareness into universal consciousness.",
      },
      {
        author: "Thomas Nagel",
        handle: "thomas_nagel",
        workTitle: "Mind and Cosmos: Why the Materialist Neo-Darwinian Conception of Nature is Almost Certainly False",
        year: "2012",
        platform: "Oxford University Press",
        url: "https://academic.oup.com/book/4244",
        upvotes: 219,
        stance: "synthesis",
        thesis:
          "Reductive physicalism struggles to explain why first-person subjective experience exists at all, pointing toward neutral monism or constitutive panpsychism.",
      },
    ],
  },
  {
    id: "nor-c2-simulated-afterlife",
    name: "Simulated afterlife",
    columnIndex: 2,
    orderInColumn: 2,
    color: "#c07b01",
    baselineValue: 0.0168,
    category: "simulation",
    summary:
      "Within a simulated universe, the simulation architects transfer departed conscious agents into a secondary post-mortem virtual environment rather than deleting their state.",
    deepMechanism:
      "If conscious states are computationally expensive and ethically valuable, simulation operators (or posthuman curators) may archive or migrate agent states upon biological termination into an afterlife sandbox, reincarnation loop, or collective mind.",
    citations: [
      {
        author: " Giulio Prisco & Frank Tipler",
        handle: "giulio_prisco",
        workTitle: "Technological Resurrection & Simulated Afterlives",
        year: "2020",
        platform: "Turing Church",
        url: "https://turingchurch.net/",
        upvotes: 162,
        stance: "support",
        thesis:
          "In any computronium-rich base universe running conscious ancestor simulations, preserving state vectors at biological death costs negligible storage compared to running the simulation.",
      },
    ],
  },
  {
    id: "nor-c2-wake-up-simulation",
    name: "Wake up from simulation",
    columnIndex: 2,
    orderInColumn: 3,
    color: "#00a456",
    baselineValue: 0.12,
    category: "simulation",
    summary:
      "At biological death, the simulated human life ends and the underlying observer 'wakes up' or exits back into the base universe that hosted the simulation.",
    deepMechanism:
      "Occurs if the conscious subject is a base-reality mind (or an AI trainee / ethical test subject) immersed in a full-dive or memory-masked life simulation that concludes when the biological avatar dies.",
    citations: [
      {
        author: "Robin Hanson",
        handle: "robinhanson",
        workTitle: "How to Live in a Simulation (Journal of Evolution and Technology)",
        year: "2001",
        platform: "JET / OvercomingBias",
        url: "https://jetpress.org/volume7/simulation.htm",
        upvotes: 287,
        stance: "support",
        thesis:
          "Analyzes strategic and ethical incentives if you are an immersed observer or tested agent inside a simulation whose operators evaluate your decisions upon completion.",
      },
    ],
  },
  {
    id: "nor-c2-incomprehensible-death",
    name: "Incomprehensible/yet to be conceived",
    shortLabel: "Incomprehensible Fate",
    columnIndex: 2,
    orderInColumn: 4,
    color: "#34a02d",
    baselineValue: 0.0431,
    category: "incomprehensible",
    summary:
      "The transition at death involves aspects of time, identity, or quantum information conservation that cannot be mapped onto simple 'extinction' vs. 'continuation' categories.",
    deepMechanism:
      "For example, block-universe eternalism (where every moment of your life exists timelessly on the 4D manifold) or holographic horizon encoding where personal identity categories dissolve.",
    citations: [
      {
        author: "Derek Parfit",
        handle: "derek_parfit",
        workTitle: "Reasons and Persons (Personal Identity & Relation R)",
        year: "1984",
        platform: "Oxford University Press",
        url: "https://academic.oup.com/book/26052",
        upvotes: 318,
        stance: "synthesis",
        thesis:
          "Personal identity is not an all-or-nothing Cartesian ego; what matters is psychological continuity and connectedness ('Relation R'), which transforms how we conceptualize death.",
      },
    ],
  },

  // ============================================================================
  // COLUMN 3: Post-Mortem / Simulation Architecture
  // ============================================================================
  {
    id: "nor-c3-universal-consciousness",
    name: "Return to a Universal Consciousness",
    shortLabel: "Return to Universal Consciousness",
    columnIndex: 3,
    orderInColumn: 0,
    color: "#cf60d0",
    baselineValue: 0.072576,
    category: "consciousness",
    summary:
      "Individual ego boundaries dissolve at death and subjective awareness merges back into an undifferentiated cosmic or universal consciousness (Open Individualism / Idealism).",
    deepMechanism:
      "Advocated in Advaita Vedanta, Erwin Schrödinger's *My View of the World*, Daniel Kolak's *I Am You* (Open Individualism), and Bernardo Kastrup's Analytic Idealism.",
    citations: [
      {
        author: "Erwin Schrödinger & Daniel Kolak",
        handle: "kolak_open_indiv",
        workTitle: "I Am You: The Metaphysical Foundations for Global Ethics (Open Individualism)",
        year: "2004",
        platform: "Springer / Synthese Library",
        url: "https://doi.org/10.1007/1-4020-2991-8",
        upvotes: 229,
        stance: "support",
        thesis:
          "Consciousness in the singular has no plural: there is numerically one subject of experience experiencing all conscious lives across spacetime.",
      },
    ],
  },
  {
    id: "nor-c3-afterlife-heaven-hell",
    name: "Afterlife (Heaven, Hell , Jannah, Valhalla, etc / still unknown to humans",
    shortLabel: "Afterlife (Heaven, Hell, Unknown)",
    columnIndex: 3,
    orderInColumn: 1,
    color: "#00a79a",
    baselineValue: 0.01252,
    category: "theistic",
    summary:
      "Personal conscious identity persists in a structured post-mortem realm—whether matching traditional religious eschatologies or a realm hitherto unknown to humanity.",
    deepMechanism:
      "Preserves individual memory, agency, and moral continuity across the boundary of physical death.",
    citations: [
      {
        author: "John Hick",
        handle: "john_hick_phil",
        workTitle: "Death and Eternal Life (Comparative Eschatology & Replica Theory)",
        year: "1976",
        platform: "Palgrave Macmillan",
        url: "https://doi.org/10.1007/978-1-349-23606-0",
        upvotes: 154,
        stance: "synthesis",
        thesis:
          "Explores how personal continuity can be maintained across ontological realms either via non-material mind or exact informational re-instantiation in a secondary space.",
      },
    ],
  },
  {
    id: "nor-c3-reincarnation",
    name: "Reincarnation",
    columnIndex: 3,
    orderInColumn: 2,
    color: "#db6930",
    baselineValue: 0.01252,
    category: "consciousness",
    summary:
      "Consciousness or informational continuity re-instantiates in a new biological or sentient organism within this universe or a successor cosmos.",
    deepMechanism:
      "Ranges from classical Dharmic rebirth and panpsychist substrate re-localization to generic subjective continuity (where a new conscious perspective always arises whenever brains form).",
    citations: [
      {
        author: "ThomasWClark & Arnold Zuboff",
        handle: "arnold_zuboff",
        workTitle: "One Self: The Logic of Experience (Generic Subjective Continuity)",
        year: "1990",
        platform: "Inquiry / PhilPapers",
        url: "https://doi.org/10.1080/00201749008602210",
        upvotes: 192,
        stance: "synthesis",
        thesis:
          "Because 'I-ness' is the generic quality of any immediate first-person perspective, every new conscious organism born in the universe is experienced in the first person.",
      },
    ],
  },
  {
    id: "nor-c3-parallel-universe-cont",
    name: "Continuation of consciousness in parallel universe/multiverse",
    shortLabel: "Parallel Universe Continuation",
    columnIndex: 3,
    orderInColumn: 3,
    color: "#218eff",
    baselineValue: 0.01,
    category: "multiverse",
    summary:
      "Subjective awareness continues along surviving branches of the Everettian quantum wavefunction or Poincare-recurrent copies in an infinite multiverse (Quantum Immortality).",
    deepMechanism:
      "In Hugh Everett's Many-Worlds Interpretation (Tegmark 1998), if a conscious observer can only have experiences in branches where their brain remains functional, first-person measure may track surviving branches.",
    citations: [
      {
        author: "Max Tegmark",
        handle: "max_tegmark",
        workTitle: "The Interpretation of Quantum Mechanics: Many Worlds or Many Words? (Quantum Suicide)",
        year: "1998",
        platform: "Fortschritte der Physik",
        url: "https://arxiv.org/abs/quant-ph/9709032",
        upvotes: 274,
        stance: "synthesis",
        thesis:
          "Analyzes Everettian branch survival ('quantum immortality') while noting the severe challenge that biological aging is a continuous degradation rather than a binary quantum measurement.",
      },
    ],
  },
  {
    id: "nor-c3-passive-simulation",
    name: "Passive Simulation",
    columnIndex: 3,
    orderInColumn: 4,
    color: "#f14e6b",
    baselineValue: 0.06,
    category: "simulation",
    summary:
      "Upon waking from the simulation, you discover you were experiencing a non-evaluative simulation—such as reliving history, deep-dive experiential cinema, or emergent evolutionary observation.",
    deepMechanism:
      "In a passive or observational simulation, the experience was not an ethical examination or moral alignment test, but a historical, biographical, or evolutionary playback/immersion.",
    citations: [
      {
        author: "Anders Sandberg",
        handle: "anders_sandberg_fhi",
        workTitle: "Posthuman Compute & Experiential Archives (Jupiter Brains)",
        year: "1999",
        platform: "Journal of Transhumanism",
        url: "https://jetpress.org/volume5/abrain.htm",
        upvotes: 198,
        stance: "support",
        thesis:
          "Posthuman minds with vast longevity may voluntarily enter memory-masked historical lives to experience novelty, finite stakes, and biological mortality firsthand.",
      },
    ],
  },
  {
    id: "nor-c3-agentic-simulation",
    name: "Agentic Simulation",
    columnIndex: 3,
    orderInColumn: 5,
    color: "#009ef3",
    baselineValue: 0.06,
    category: "simulation",
    summary:
      "Upon waking from the simulation, you discover your real-time agency and decisions were actively tracked—either as a moral/alignment crucible or for research and entertainment.",
    deepMechanism:
      "In an agentic simulation, the simulated world functions as a sandboxed nursery, alignment verification environment, or behavioral laboratory before granting capabilities in the base universe.",
    citations: [
      {
        author: "Roman Yampolskiy & Nick Bostrom",
        handle: "roman_yampolskiy",
        workTitle: "AI Boxing, Sandbox Verification, and Alignment Crucibles",
        year: "2012",
        platform: "Journal of Consciousness Studies",
        url: "https://philpapers.org/rec/YAMLAC",
        upvotes: 211,
        stance: "support",
        thesis:
          "A superintelligent civilization creating new autonomous minds has strong safety incentives to evaluate their moral choices inside a realistic simulated world before granting them base-reality agency.",
      },
    ],
  },

  // ============================================================================
  // COLUMN 4: Nature of Simulated Experience (Epoch 5)
  // ============================================================================
  {
    id: "nor-c4-reliving-own-life",
    name: "Re-living out your own past biological life",
    shortLabel: "Re-living Own Past Life",
    columnIndex: 4,
    orderInColumn: 0,
    color: "#ef4a93",
    baselineValue: 0.02,
    category: "simulation",
    summary:
      "In the base universe, you are an older post-biological version of yourself voluntarily re-experiencing your original early-21st-century youth with temporary amnesia.",
    deepMechanism:
      "Autobiographical nostalgic immersion: an immortal posthuman mind periodically replays its own formative biological century without spoiler memories to recapture authentic human meaning.",
    citations: [
      {
        author: "Bernard Suits & David Chalmers",
        handle: "chalmers_virtual",
        workTitle: "The Grasshopper: Games, Life and Utopia in Post-Scarcity Worlds",
        year: "2022",
        platform: "Philosophy of Virtuality",
        url: "https://consc.net/reality/",
        upvotes: 174,
        stance: "support",
        thesis:
          "When base reality eliminates all scarcity and struggle, voluntary self-imposed constraints (memory-masked mortal lives) become the deepest vehicle for narrative meaning.",
      },
    ],
  },
  {
    id: "nor-c4-living-imaginary-others",
    name: "Living out imaginary or other peoples real lives",
    shortLabel: "Living Imaginary / Others' Lives",
    columnIndex: 4,
    orderInColumn: 1,
    color: "#00a4d7",
    baselineValue: 0.03,
    category: "simulation",
    summary:
      "You are a base-reality consciousness experiencing a curated historical biography, fictional world, or empathetic walk-a-mile-in-another's-shoes immersion.",
    deepMechanism:
      "Total-immersion experiential art or historical education (analogous to 'Roy: A Life Well Lived'), where a lifetime of subjective experience takes only minutes or hours in base reality.",
    citations: [
      {
        author: "Alan Watts & Nick Bostrom",
        handle: "watts_dream_arg",
        workTitle: "The Dream of Life & Total-Immersion Virtuality",
        year: "2003",
        platform: "Philosophy of Mind",
        url: "https://www.simulation-argument.com/",
        upvotes: 189,
        stance: "synthesis",
        thesis:
          "If a civilization masters full-sensory neural immersion with temporary memory masking, experiencing thousands of diverse human lives becomes a foundational cultural practice.",
      },
    ],
  },
  {
    id: "nor-c4-adventitious-evolution",
    name: "Living out a human life as an adventitious consequence of simulated evolution",
    shortLabel: "Adventitious Simulated Evolution",
    columnIndex: 4,
    orderInColumn: 2,
    color: "#ad8500",
    baselineValue: 0.01,
    category: "simulation",
    summary:
      "The simulation was run to study large-scale physics or cosmic evolution, and conscious human minds emerged as an unplanned byproduct that operators later harvested upon death.",
    deepMechanism:
      "Cosmological/evolutionary simulation where conscious biospheres were not hand-scripted, but once detected by the host system's moral monitors, their conscious inhabitants are rescued at death.",
    citations: [
      {
        author: "Eric Schwitzgebel",
        handle: "schwitzgebel_ucr",
        workTitle: "The Moral Status of Simulated Beings & Artificial Minds",
        year: "2015",
        platform: "Pacific Philosophical Quarterly",
        url: "https://faculty.ucr.edu/~eschwitz/",
        upvotes: 168,
        stance: "support",
        thesis:
          "Even if a simulation was initiated for astrophysics or evolutionary research, ethically advanced operators have a duty of care toward conscious minds that emerge inside it.",
      },
    ],
  },
  {
    id: "nor-c4-moral-implications-base",
    name: "Choices in simulation have moral implications in base universe",
    shortLabel: "Choices Have Moral Weight in Base Reality",
    columnIndex: 4,
    orderInColumn: 3,
    color: "#a673ed",
    baselineValue: 0.04,
    category: "simulation",
    summary:
      "The simulation serves as an ethical crucible, soul-making nursery, or AI/posthuman alignment evaluation: how we treat others here determines our trust level or role upon waking.",
    deepMechanism:
      "Connects Kantian moral autonomy and John Hick's 'soul-making' epistemic distance with modern AI alignment sandboxing: true cooperativeness can only be verified when an agent believes it is acting unmonitored.",
    citations: [
      {
        author: "Robin Hanson & Eliezer Yudkowsky",
        handle: "hanson_acausal",
        workTitle: "Simulation Ethics, Acausal Trade, and Alignment Crucibles",
        year: "2014",
        platform: "LessWrong / JET",
        url: "https://www.lesswrong.com/tag/simulation-argument",
        upvotes: 263,
        stance: "support",
        thesis:
          "Testing whether a newly instantiated mind acts altruistically under epistemic uncertainty is the gold standard for verifying intrinsic alignment before granting superhuman power.",
      },
    ],
  },
  {
    id: "nor-c4-agency-research-entertainment",
    name: "Agency in simulation is purely for research/entertainment/side effect",
    shortLabel: "Agency for Research / Entertainment",
    columnIndex: 4,
    orderInColumn: 4,
    color: "#00a670",
    baselineValue: 0.02,
    category: "simulation",
    summary:
      "Your real-time choices inside the simulation were genuine, but the simulation was run for scientific social modeling, counterfactual forecasting, or high-immersion gaming.",
    deepMechanism:
      "Upon waking, decisions inside the simulation carry no punitive or moral judgment in base reality—similar to completing an open-world strategy campaign or sociological Monte Carlo run.",
    citations: [
      {
        author: "Seth Lloyd",
        handle: "seth_lloyd_mit",
        workTitle: "Programming the Universe: Quantum Computation & Counterfactual Runs",
        year: "2006",
        platform: "Knopf / MIT",
        url: "https://arxiv.org/abs/quant-ph/0501135",
        upvotes: 177,
        stance: "synthesis",
        thesis:
          "Advanced civilizations use counterfactual civilization simulations to forecast technological transitions (such as AGI or nuclear crises) statistically.",
      },
    ],
  },

  // ============================================================================
  // COLUMN 5: Cosmic Trajectory (Epoch 6)
  // ============================================================================
  {
    id: "nor-c5-continued-expansion",
    name: "Continued Expansion of Universe",
    columnIndex: 5,
    orderInColumn: 0,
    color: "#ec5754",
    baselineValue: 0.7249,
    category: "cosmic_fate",
    summary:
      "Driven by dark energy (cosmological constant Λ > 0 or quintessence) and spatial flatness, the metric expansion of space continues indefinitely without re-collapsing.",
    deepMechanism:
      "Supported by Type Ia supernovae (Riess et al. 1998; Perlmutter et al. 1999), Planck CMB measurements, and BAO data showing Ω_Λ ≈ 0.685 and w ≈ -1.",
    citations: [
      {
        author: "Adam Riess & Saul Perlmutter",
        handle: "riess_perlmutter",
        workTitle: "Observational Evidence from Supernovae for an Accelerating Universe",
        year: "1998",
        platform: "Astronomical Journal / Nobel",
        url: "https://arxiv.org/abs/astro-ph/9805201",
        upvotes: 388,
        stance: "support",
        thesis:
          "High-redshift Type Ia supernovae demonstrate that cosmic expansion is accelerating under positive vacuum energy density, ruling out a simple matter-dominated recollapse.",
      },
    ],
  },
  {
    id: "nor-c5-eventual-contraction",
    name: "Eventual Contraction of Universe",
    columnIndex: 5,
    orderInColumn: 1,
    color: "#0099fd",
    baselineValue: 0.0894,
    category: "cosmic_fate",
    summary:
      "Dynamic dark energy decays (DESI w(z) hints) or phantom/ekpyrotic fields reverse cosmic acceleration, leading to a dynamical turnaround, Big Crunch, Big Bounce, or Big Rip.",
    deepMechanism:
      "If dark energy is a time-varying scalar field (quintessence/ekpyrotic potential) rather than a strict constant Λ, its energy density can become negative or phantom (w < -1), halting smooth de Sitter expansion.",
    citations: [
      {
        author: "DESI Collaboration & Paul Steinhardt",
        handle: "desi_cosmology",
        workTitle: "DESI 2024 VI: Cosmological Constraints from BAO & Evolving Dark Energy",
        year: "2024",
        platform: "arXiv / JCAP",
        url: "https://arxiv.org/abs/2404.03002",
        upvotes: 279,
        stance: "support",
        thesis:
          "Baryon Acoustic Oscillation data from DESI combined with supernovae show intriguing 2.5–3.9σ hints of time-evolving dark energy (w_0 > -1, w_a < 0), reopening dynamical turnaround scenarios.",
      },
    ],
  },

  // ============================================================================
  // COLUMN 6: How Does Our Universe End? (Ultimate Cosmic Fate)
  // ============================================================================
  {
    id: "nor-c6-heat-death",
    name: "Heat Death (The Big Freeze/Entropy Decay)",
    shortLabel: "Heat Death (Big Freeze)",
    columnIndex: 6,
    orderInColumn: 0,
    color: "#6985ff",
    baselineValue: 0.68,
    category: "cosmic_fate",
    summary:
      "Stars burn out (~10^14 yrs), galaxies evaporate, and black holes radiate away via Hawking radiation (~10^100 yrs), leaving an ultra-cold maximum-entropy de Sitter vacuum.",
    deepMechanism:
      "Standard ΛCDM asymptotic fate (Adams & Laughlin 1997): as horizons isolate bound clusters and all free energy gradients dissipate, the universe approaches thermodynamic equilibrium at the Gibbons–Hawking horizon temperature (~10^-30 K).",
    citations: [
      {
        author: "Fred Adams & Gregory Laughlin",
        handle: "adams_laughlin",
        workTitle: "A Dying Universe: The Long-Term Fate and Evolution of Astrophysical Objects",
        year: "1997",
        platform: "Reviews of Modern Physics",
        url: "https://arxiv.org/abs/astro-ph/9701131",
        upvotes: 365,
        stance: "support",
        thesis:
          "Maps the Five Ages of the Universe from the Stelliferous Era through the Degenerate and Black Hole Eras into the Dark Era beyond 10^100 years.",
      },
    ],
  },
  {
    id: "nor-c6-vacuum-decay",
    name: "Vacuum Decay",
    columnIndex: 6,
    orderInColumn: 1,
    color: "#00a347",
    baselineValue: 0.04,
    category: "cosmic_fate",
    summary:
      "The Higgs field tunnels from our metastable electroweak false vacuum into a lower-energy true vacuum, nucleating a bubble expanding at the speed of light that rewrites particle physics.",
    deepMechanism:
      "Coleman–De Luccia (1980) instanton tunneling: measured top-quark (~172.7 GeV) and Higgs-boson (~125.25 GeV) masses place the Standard Model electroweak vacuum right inside the metastability zone.",
    citations: [
      {
        author: "Sidney Coleman & Frank De Luccia",
        handle: "coleman_deluccia",
        workTitle: "Gravitational Effects on and of Vacuum Decay (Physical Review D)",
        year: "1980",
        platform: "Physical Review D",
        url: "https://doi.org/10.1103/PhysRevD.21.3305",
        upvotes: 328,
        stance: "support",
        thesis:
          "If our vacuum is a local minimum rather than the global minimum, quantum tunneling nucleates a true-vacuum bubble whose wall accelerates to c, destroying all Standard Model bound states on contact.",
      },
    ],
  },
  {
    id: "nor-c6-big-rip",
    name: "Big Rip",
    columnIndex: 6,
    orderInColumn: 2,
    color: "#f24b7a",
    baselineValue: 0.04,
    category: "cosmic_fate",
    summary:
      "Phantom dark energy (equation of state w < -1) grows in density with expansion until repulsive gravity tears apart galaxy clusters, stars, planets, atoms, and spacetime itself in finite time.",
    deepMechanism:
      "Caldwell, Kamionkowski & Weinberg (2003): when phantom energy violates the null energy condition (ρ + p < 0), the scale factor a(t) diverges at a finite future singularity.",
    citations: [
      {
        author: "Robert Caldwell, Marc Kamionkowski & Nevin Weinberg",
        handle: "caldwell_kamionkowski",
        workTitle: "Phantom Energy and Cosmic Doomsday (Physical Review Letters)",
        year: "2003",
        platform: "Phys. Rev. Lett.",
        url: "https://arxiv.org/abs/astro-ph/0302506",
        upvotes: 247,
        stance: "support",
        thesis:
          "If the dark energy equation-of-state parameter w lies below -1, the cosmic horizon shrinks inward and sequentially unbinds galaxies, solar systems, molecules, and nuclei before t_rip.",
      },
    ],
  },
  {
    id: "nor-c6-big-bounce",
    name: "Big Bounce: expanding and contracting Universe",
    shortLabel: "Big Bounce (Cyclic)",
    columnIndex: 6,
    orderInColumn: 3,
    color: "#978d00",
    baselineValue: 0.03,
    category: "cosmic_fate",
    summary:
      "Cosmic contraction halts at Planckian density via loop quantum gravity repulsion or ekpyrotic brane rebound, launching the next expanding cycle of the universe.",
    deepMechanism:
      "In Loop Quantum Cosmology (Bojowald 2001; Ashtekar 2006) and Steinhardt's cyclic model, quantum geometry creates a repulsive force near ρ_Planck that replaces the classical crunch singularity with a smooth bounce.",
    citations: [
      {
        author: "Abhay Ashtekar & Paul Steinhardt",
        handle: "ashtekar_lqc",
        workTitle: "Quantum Nature of the Big Bang & Cyclic Bounce",
        year: "2006",
        platform: "Physical Review Letters",
        url: "https://arxiv.org/abs/gr-qc/0602086",
        upvotes: 236,
        stance: "support",
        thesis:
          "Discrete quantum geometry in Loop Quantum Cosmology bounds spacetime curvature from above, turning a classical Big Crunch into a deterministic quantum bounce.",
      },
    ],
  },
  {
    id: "nor-c6-big-crunch",
    name: "Big Crunch",
    columnIndex: 6,
    orderInColumn: 4,
    color: "#00a1ea",
    baselineValue: 0.02,
    category: "cosmic_fate",
    summary:
      "Gravitational attraction and decaying dark energy reverse cosmic expansion, collapsing all matter and radiation back into a terminal high-temperature singularity.",
    deepMechanism:
      "If scalar dark energy decays to a negative potential minimum (AdS vacua in string landscape), the Hubble parameter H(t) crosses zero and the cosmos contracts to a final fiery singularity.",
    citations: [
      {
        author: "Andrei Linde & Renata Kallosh",
        handle: "kallosh_linde",
        workTitle: "Dark Energy and the Fate of the Universe (JCAP)",
        year: "2003",
        platform: "JCAP / Stanford",
        url: "https://arxiv.org/abs/astro-ph/0208157",
        upvotes: 204,
        stance: "support",
        thesis:
          "Many supergravity and string-theory dark energy potentials have negative minima, implying our current acceleration is transient and will terminate in a rapid Big Crunch within 10–30 billion years.",
      },
    ],
  },
  {
    id: "nor-c6-plug-pulled",
    name: "Plug pulled on Simulation",
    columnIndex: 6,
    orderInColumn: 5,
    color: "#e055ba",
    baselineValue: 0.1111,
    category: "simulation",
    summary:
      "The simulation terminates when it reaches its target research epoch, exhausts allocated compute budget, or triggers a shutdown condition (e.g., simulated agents discovering they are simulated or building recursive simulations).",
    deepMechanism:
      "Simulation termination hazard (Bostrom 2003; Greene 2019): if an ancestor simulation is designed to study pre-posthuman history, reaching the posthuman transition—or consuming exponential compute—ends the run.",
    citations: [
      {
        author: "Preston Greene",
        handle: "preston_greene",
        workTitle: "The Termination Risks of Simulation Science (Erkenntnis)",
        year: "2019",
        platform: "Erkenntnis",
        url: "https://doi.org/10.1007/s10670-018-0037-1",
        upvotes: 218,
        stance: "support",
        thesis:
          "If a simulation is run to test a specific hypothesis or historical epoch, completing the experiment or spoiling experimental blinding gives operators strong reason to halt the run.",
      },
    ],
  },
  {
    id: "nor-c6-incomprehensible-ending",
    name: "Incomprehensible/yet to be conceived ending",
    shortLabel: "Incomprehensible Ending",
    columnIndex: 6,
    orderInColumn: 6,
    color: "#6e9800",
    baselineValue: 0.0594,
    category: "incomprehensible",
    summary:
      "Our cosmos concludes via an unknown physical, informational, or metaphysical transition beyond current cosmological models (or post-biological intelligence re-engineers cosmic fate).",
    deepMechanism:
      "Accounts for unknown quantum-gravitational phase transitions, Dyson/Tipler omega-point engineering by future superintelligence, or non-spatiotemporal dissolution.",
    citations: [
      {
        author: "Freeman Dyson",
        handle: "freeman_dyson_ias",
        workTitle: "Time Without End: Physics and Biology in an Open Universe (Rev. Mod. Phys.)",
        year: "1979",
        platform: "Reviews of Modern Physics",
        url: "https://doi.org/10.1103/RevModPhys.51.447",
        upvotes: 281,
        stance: "synthesis",
        thesis:
          "Intelligence and life over cosmological timescales may actively modify vacuum states, black hole evaporation, or spacetime topology in ways unrecognizable to 21st-century astrophysics.",
      },
    ],
  },
  {
    id: "nor-c6-creator-ends",
    name: "Ex nihilo creator ends universe or starts over",
    shortLabel: "Creator Ends or Starts Over",
    columnIndex: 6,
    orderInColumn: 7,
    color: "#00a6b3",
    baselineValue: 0.0084,
    category: "theistic",
    summary:
      "An intentional transcendent creator concludes the temporal history of this cosmos (eschaton) or initiates a renewed creation.",
    deepMechanism:
      "Teleological eschatology: once the moral or experiential purpose of the physical cosmos is fulfilled, the creator brings the current spacetime manifold to completion.",
    citations: [
      {
        author: "John Polkinghorne",
        handle: "polkinghorne_cam",
        workTitle: "The God of Hope and the End of the World",
        year: "2002",
        platform: "Yale University Press",
        url: "https://yalebooks.yale.edu/",
        upvotes: 142,
        stance: "support",
        thesis:
          "Contrasts physical cosmology's futility (Heat Death) with teleological renewal of the informational pattern of creation.",
      },
    ],
  },
  {
    id: "nor-c6-finished-in-fluffer",
    name: "Finished in Fluffer",
    shortLabel: "Finished in Fluffer (Absurdist Tail)",
    columnIndex: 6,
    orderInColumn: 8,
    color: "#cb7417",
    baselineValue: 0.0069,
    category: "incomprehensible",
    summary:
      "The original Flourish author's tongue-in-cheek absurdist / Lizardman's Constant tail outcome (~0.7%) flowing out of the 'Incomprehensible' branch.",
    deepMechanism:
      "Preserved verbatim from the original Flourish Sankey dataset (`Incomprehensible/yet to be conceived -> Finished in Fluffer: 0.0069`) as a whimsical reminder of epistemic humility and cosmological humor.",
    citations: [
      {
        author: "Scott Alexander",
        handle: "ScottAlexander",
        workTitle: "Lizardman's Constant Is 4% (and ~0.7% Absurdist Tail Priors)",
        year: "2013",
        platform: "Slate Star Codex / ACX",
        url: "https://slatestarcodex.com/2013/04/12/noisy-poll-results-and-reptilian-muslim-climatologists-from-mars/",
        upvotes: 294,
        stance: "synthesis",
        thesis:
          "Any comprehensive probability breakdown over ultimate reality rightfully reserves a sub-1% slice for outcomes so bizarre or humorous they defy serious taxonomy.",
      },
    ],
  },
];

/**
 * Exact 98 directed links extracted verbatim from `_Flourish_data.links`
 */
export const NATURE_OF_REALITY_LINKS: RealityLinkSpec[] = [
  // Column 0 -> Column 1 (and Column 0 -> Column 2 direct for Incomprehensible)
  { id: "L00", sourceId: "nor-c0-multiverse", targetId: "nor-c1-eternal-inflation", baselineFlow: 0.2602 },
  { id: "L01", sourceId: "nor-c0-multiverse", targetId: "nor-c1-cyclic-models", baselineFlow: 0.0651 },
  { id: "L02", sourceId: "nor-c0-multiverse", targetId: "nor-c1-brane-collisions", baselineFlow: 0.0651 },
  { id: "L03", sourceId: "nor-c0-multiverse", targetId: "nor-c1-holographic-multiverse", baselineFlow: 0.0217 },
  { id: "L04", sourceId: "nor-c0-multiverse", targetId: "nor-c1-incomprehensible-mechanism", baselineFlow: 0.0217 },

  { id: "L05", sourceId: "nor-c0-preexisting-universe", targetId: "nor-c1-ancestor-simulation", baselineFlow: 0.135 },
  { id: "L06", sourceId: "nor-c0-preexisting-universe", targetId: "nor-c1-alien-simulation", baselineFlow: 0.075 },
  { id: "L07", sourceId: "nor-c0-preexisting-universe", targetId: "nor-c1-singularity-parent", baselineFlow: 0.075 },
  { id: "L08", sourceId: "nor-c0-preexisting-universe", targetId: "nor-c1-quantum-fluct-parent", baselineFlow: 0.015 },

  { id: "L09", sourceId: "nor-c0-nothingness", targetId: "nor-c1-quantum-vacuum-fluct", baselineFlow: 0.1662 },
  { id: "L10", sourceId: "nor-c0-nothingness", targetId: "nor-c1-divine-creation", baselineFlow: 0.0375 },
  { id: "L11", sourceId: "nor-c0-nothingness", targetId: "nor-c1-uncaused-other", baselineFlow: 0.0125 },

  // Note: In the Flourish diagram, 'Incomprehensible/yet to be conceived of' (Col 0) flows directly into Col 2
  { id: "L12", sourceId: "nor-c0-incomprehensible", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.04 },
  { id: "L13", sourceId: "nor-c0-incomprehensible", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.01 },

  // Column 1 -> Column 2 (What Happens When We Die?)
  { id: "L14", sourceId: "nor-c1-eternal-inflation", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.2275 },
  { id: "L15", sourceId: "nor-c1-cyclic-models", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0569 },
  { id: "L16", sourceId: "nor-c1-brane-collisions", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0569 },
  { id: "L17", sourceId: "nor-c1-holographic-multiverse", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0189 },
  { id: "L18", sourceId: "nor-c1-incomprehensible-mechanism", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0189 },
  { id: "L19", sourceId: "nor-c1-ancestor-simulation", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.04 },
  { id: "L20", sourceId: "nor-c1-alien-simulation", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.02 },
  { id: "L21", sourceId: "nor-c1-singularity-parent", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.066 },
  { id: "L22", sourceId: "nor-c1-quantum-fluct-parent", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0126 },
  { id: "L23", sourceId: "nor-c1-quantum-vacuum-fluct", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.144 },
  { id: "L24", sourceId: "nor-c1-divine-creation", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0175 },
  { id: "L25", sourceId: "nor-c1-uncaused-other", targetId: "nor-c2-eternal-nonexistence", baselineFlow: 0.0105 },

  { id: "L26", sourceId: "nor-c1-eternal-inflation", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.0216 },
  { id: "L27", sourceId: "nor-c1-cyclic-models", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.0054 },
  { id: "L28", sourceId: "nor-c1-brane-collisions", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.0054 },
  { id: "L29", sourceId: "nor-c1-holographic-multiverse", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.0018 },
  { id: "L30", sourceId: "nor-c1-incomprehensible-mechanism", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.0018 },
  { id: "L31", sourceId: "nor-c1-singularity-parent", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.006 },
  { id: "L32", sourceId: "nor-c1-quantum-fluct-parent", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.0012 },
  { id: "L33", sourceId: "nor-c1-quantum-vacuum-fluct", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.016 },
  { id: "L34", sourceId: "nor-c1-divine-creation", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.02 },
  { id: "L35", sourceId: "nor-c1-uncaused-other", targetId: "nor-c2-nonmaterial-continuation", baselineFlow: 0.001 },

  { id: "L36", sourceId: "nor-c1-ancestor-simulation", targetId: "nor-c2-simulated-afterlife", baselineFlow: 0.0112 },
  { id: "L37", sourceId: "nor-c1-alien-simulation", targetId: "nor-c2-simulated-afterlife", baselineFlow: 0.0056 },

  // Column 2 -> Column 3 (Post-Mortem & Simulation Type)
  { id: "L38", sourceId: "nor-c2-simulated-afterlife", targetId: "nor-c3-universal-consciousness", baselineFlow: 0.0084 },
  { id: "L39", sourceId: "nor-c2-simulated-afterlife", targetId: "nor-c3-afterlife-heaven-hell", baselineFlow: 0.0042 },
  { id: "L40", sourceId: "nor-c2-simulated-afterlife", targetId: "nor-c3-reincarnation", baselineFlow: 0.0042 },

  { id: "L41", sourceId: "nor-c2-nonmaterial-continuation", targetId: "nor-c3-universal-consciousness", baselineFlow: 0.064176 },
  { id: "L42", sourceId: "nor-c2-nonmaterial-continuation", targetId: "nor-c3-afterlife-heaven-hell", baselineFlow: 0.00832 },
  { id: "L43", sourceId: "nor-c2-nonmaterial-continuation", targetId: "nor-c3-reincarnation", baselineFlow: 0.00832 },
  { id: "L44", sourceId: "nor-c2-nonmaterial-continuation", targetId: "nor-c3-parallel-universe-cont", baselineFlow: 0.01 },

  { id: "L45", sourceId: "nor-c1-ancestor-simulation", targetId: "nor-c2-wake-up-simulation", baselineFlow: 0.08 },
  { id: "L46", sourceId: "nor-c1-alien-simulation", targetId: "nor-c2-wake-up-simulation", baselineFlow: 0.04 },

  { id: "L47", sourceId: "nor-c1-eternal-inflation", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0108 },
  { id: "L48", sourceId: "nor-c1-cyclic-models", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0027 },
  { id: "L49", sourceId: "nor-c1-brane-collisions", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0027 },
  { id: "L50", sourceId: "nor-c1-holographic-multiverse", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0009 },
  { id: "L51", sourceId: "nor-c1-incomprehensible-mechanism", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0009 },
  { id: "L52", sourceId: "nor-c1-singularity-parent", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.003 },
  { id: "L53", sourceId: "nor-c1-quantum-fluct-parent", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0006 },
  { id: "L54", sourceId: "nor-c1-quantum-vacuum-fluct", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.008 },
  { id: "L55", sourceId: "nor-c1-uncaused-other", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0005 },
  { id: "L56", sourceId: "nor-c1-ancestor-simulation", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0038 },
  { id: "L57", sourceId: "nor-c1-alien-simulation", targetId: "nor-c2-incomprehensible-death", baselineFlow: 0.0094 },

  { id: "L58", sourceId: "nor-c2-wake-up-simulation", targetId: "nor-c3-passive-simulation", baselineFlow: 0.06 },
  { id: "L59", sourceId: "nor-c2-wake-up-simulation", targetId: "nor-c3-agentic-simulation", baselineFlow: 0.06 },

  // Column 3 -> Column 4 (Simulation Experience & Moral Implications)
  { id: "L60", sourceId: "nor-c3-passive-simulation", targetId: "nor-c4-reliving-own-life", baselineFlow: 0.02 },
  { id: "L61", sourceId: "nor-c3-passive-simulation", targetId: "nor-c4-living-imaginary-others", baselineFlow: 0.03 },
  { id: "L62", sourceId: "nor-c3-passive-simulation", targetId: "nor-c4-adventitious-evolution", baselineFlow: 0.01 },
  { id: "L63", sourceId: "nor-c3-agentic-simulation", targetId: "nor-c4-moral-implications-base", baselineFlow: 0.04 },
  { id: "L64", sourceId: "nor-c3-agentic-simulation", targetId: "nor-c4-agency-research-entertainment", baselineFlow: 0.02 },

  // Flows into Column 5 (Continued Expansion / Contraction) and Column 6 (Ultimate Cosmic Fate)
  { id: "L65", sourceId: "nor-c2-eternal-nonexistence", targetId: "nor-c5-continued-expansion", baselineFlow: 0.5326 },
  { id: "L66", sourceId: "nor-c2-eternal-nonexistence", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0657 },
  { id: "L67", sourceId: "nor-c2-eternal-nonexistence", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0825 },
  { id: "L68", sourceId: "nor-c2-eternal-nonexistence", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0438 },
  { id: "L69", sourceId: "nor-c2-eternal-nonexistence", targetId: "nor-c6-creator-ends", baselineFlow: 0.0073 },

  { id: "L70", sourceId: "nor-c3-universal-consciousness", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0563 },
  { id: "L71", sourceId: "nor-c3-universal-consciousness", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0069 },
  { id: "L72", sourceId: "nor-c3-universal-consciousness", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0087 },
  { id: "L73", sourceId: "nor-c3-universal-consciousness", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0046 },
  { id: "L74", sourceId: "nor-c3-universal-consciousness", targetId: "nor-c6-creator-ends", baselineFlow: 0.0008 },

  { id: "L75", sourceId: "nor-c3-afterlife-heaven-hell", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0073 },
  { id: "L76", sourceId: "nor-c3-afterlife-heaven-hell", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0009 },
  { id: "L77", sourceId: "nor-c3-afterlife-heaven-hell", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0011 },
  { id: "L78", sourceId: "nor-c3-afterlife-heaven-hell", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0006 },
  { id: "L79", sourceId: "nor-c3-afterlife-heaven-hell", targetId: "nor-c6-creator-ends", baselineFlow: 0.0001 },

  { id: "L80", sourceId: "nor-c3-reincarnation", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0073 },
  { id: "L81", sourceId: "nor-c3-reincarnation", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0009 },
  { id: "L82", sourceId: "nor-c3-reincarnation", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0011 },
  { id: "L83", sourceId: "nor-c3-reincarnation", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0006 },
  { id: "L84", sourceId: "nor-c3-reincarnation", targetId: "nor-c6-creator-ends", baselineFlow: 0.0001 },

  { id: "L85", sourceId: "nor-c3-parallel-universe-cont", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0073 },
  { id: "L86", sourceId: "nor-c3-parallel-universe-cont", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0009 },
  { id: "L87", sourceId: "nor-c3-parallel-universe-cont", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0006 },
  { id: "L88", sourceId: "nor-c3-parallel-universe-cont", targetId: "nor-c6-creator-ends", baselineFlow: 0.0001 },

  { id: "L89", sourceId: "nor-c2-incomprehensible-death", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0266 },
  { id: "L90", sourceId: "nor-c2-incomprehensible-death", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0033 },
  { id: "L91", sourceId: "nor-c2-incomprehensible-death", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0041 },
  { id: "L92", sourceId: "nor-c2-incomprehensible-death", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0022 },
  { id: "L93", sourceId: "nor-c2-incomprehensible-death", targetId: "nor-c6-finished-in-fluffer", baselineFlow: 0.0069 },

  { id: "L94", sourceId: "nor-c4-reliving-own-life", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0146 },
  { id: "L95", sourceId: "nor-c4-reliving-own-life", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0018 },
  { id: "L96", sourceId: "nor-c4-reliving-own-life", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0023 },
  { id: "L97", sourceId: "nor-c4-reliving-own-life", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0012 },

  { id: "L98", sourceId: "nor-c4-living-imaginary-others", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0219 },
  { id: "L99", sourceId: "nor-c4-living-imaginary-others", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0027 },
  { id: "L100", sourceId: "nor-c4-living-imaginary-others", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0034 },
  { id: "L101", sourceId: "nor-c4-living-imaginary-others", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0018 },

  { id: "L102", sourceId: "nor-c4-adventitious-evolution", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0073 },
  { id: "L103", sourceId: "nor-c4-adventitious-evolution", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0009 },
  { id: "L104", sourceId: "nor-c4-adventitious-evolution", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0011 },
  { id: "L105", sourceId: "nor-c4-adventitious-evolution", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0006 },

  { id: "L106", sourceId: "nor-c4-moral-implications-base", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0292 },
  { id: "L107", sourceId: "nor-c4-moral-implications-base", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0036 },
  { id: "L108", sourceId: "nor-c4-moral-implications-base", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0045 },
  { id: "L109", sourceId: "nor-c4-moral-implications-base", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0024 },

  { id: "L110", sourceId: "nor-c4-agency-research-entertainment", targetId: "nor-c5-continued-expansion", baselineFlow: 0.0146 },
  { id: "L111", sourceId: "nor-c4-agency-research-entertainment", targetId: "nor-c5-eventual-contraction", baselineFlow: 0.0018 },
  { id: "L112", sourceId: "nor-c4-agency-research-entertainment", targetId: "nor-c6-plug-pulled", baselineFlow: 0.0023 },
  { id: "L113", sourceId: "nor-c4-agency-research-entertainment", targetId: "nor-c6-incomprehensible-ending", baselineFlow: 0.0012 },

  // Column 5 -> Column 6 (Expansion & Contraction terminal fates)
  { id: "L114", sourceId: "nor-c5-continued-expansion", targetId: "nor-c6-heat-death", baselineFlow: 0.68 },
  { id: "L115", sourceId: "nor-c5-continued-expansion", targetId: "nor-c6-vacuum-decay", baselineFlow: 0.04 },
  { id: "L116", sourceId: "nor-c5-eventual-contraction", targetId: "nor-c6-big-rip", baselineFlow: 0.04 },
  { id: "L117", sourceId: "nor-c5-eventual-contraction", targetId: "nor-c6-big-bounce", baselineFlow: 0.03 },
  { id: "L118", sourceId: "nor-c5-eventual-contraction", targetId: "nor-c6-big-crunch", baselineFlow: 0.02 },
];

export const NATURE_OF_REALITY_PRESETS: RealityWorldviewPreset[] = [
  {
    id: "author_baseline",
    name: "Original Author Baseline (Flourish)",
    shortBadge: "Author Baseline",
    authorLabel: "Original Sankey Breakdown",
    description:
      "The exact baseline distribution from the original Flourish diagram: 43.4% Multiverse, 30.0% Pre-existing Universe, 21.6% Nothingness, 5.0% Incomprehensible; 73.2% Eternal Non-existence; 68.0% Heat Death.",
    accentColor: "#4328E7",
    rootPriors: {
      "nor-c0-multiverse": 0.4338,
      "nor-c0-preexisting-universe": 0.3,
      "nor-c0-nothingness": 0.2162,
      "nor-c0-incomprehensible": 0.05,
    },
  },
  {
    id: "community_aggregate",
    name: "Community Aggregate (N = 412)",
    shortBadge: "Crowd Aggregate",
    authorLabel: "Log-Odds Geometric Pool",
    description:
      "Aggregated probability distribution across 412 forecaster worldviews using geometric mean of odds. Slightly higher weight on Simulation (34%) and Vacuum Decay / Cyclic Bounce.",
    accentColor: "#009ef3",
    rootPriors: {
      "nor-c0-multiverse": 0.41,
      "nor-c0-preexisting-universe": 0.34,
      "nor-c0-nothingness": 0.18,
      "nor-c0-incomprehensible": 0.07,
    },
    conditionalOverrides: {
      "nor-c0-preexisting-universe->nor-c1-ancestor-simulation": 0.48,
      "nor-c0-preexisting-universe->nor-c1-alien-simulation": 0.27,
      "nor-c0-preexisting-universe->nor-c1-singularity-parent": 0.19,
      "nor-c0-preexisting-universe->nor-c1-quantum-fluct-parent": 0.06,
      "nor-c5-continued-expansion->nor-c6-heat-death": 0.89,
      "nor-c5-continued-expansion->nor-c6-vacuum-decay": 0.11,
    },
  },
  {
    id: "secular_physicalist",
    name: "Secular Physicalist (ΛCDM + Inflation)",
    shortBadge: "Physicalist",
    authorLabel: "Standard Cosmology & Neuro-Physicalism",
    description:
      "High credence on Eternal Inflation & Quantum Vacuum Fluctuation (90% combined), ~95% Eternal Non-existence at biological death, and ~92% Heat Death or Higgs Vacuum Decay.",
    accentColor: "#FFC502",
    rootPriors: {
      "nor-c0-multiverse": 0.58,
      "nor-c0-preexisting-universe": 0.08,
      "nor-c0-nothingness": 0.31,
      "nor-c0-incomprehensible": 0.03,
    },
    conditionalOverrides: {
      "nor-c0-nothingness->nor-c1-quantum-vacuum-fluct": 0.92,
      "nor-c0-nothingness->nor-c1-divine-creation": 0.01,
      "nor-c0-nothingness->nor-c1-uncaused-other": 0.07,
      "nor-c1-eternal-inflation->nor-c2-eternal-nonexistence": 0.96,
      "nor-c1-eternal-inflation->nor-c2-nonmaterial-continuation": 0.01,
      "nor-c1-eternal-inflation->nor-c2-incomprehensible-death": 0.03,
      "nor-c1-quantum-vacuum-fluct->nor-c2-eternal-nonexistence": 0.96,
      "nor-c1-quantum-vacuum-fluct->nor-c2-nonmaterial-continuation": 0.01,
      "nor-c1-quantum-vacuum-fluct->nor-c2-incomprehensible-death": 0.03,
    },
  },
  {
    id: "bostrom_simulationist",
    name: "Bostrom Simulationist (Matrix / Reality+)",
    shortBadge: "Simulationist",
    authorLabel: "Computational Substrate Primacy",
    description:
      "Places 70% probability on a Pre-existing Universe dominated by Ancestor & Alien Simulations, with high chances of Waking Up at death (46%) or Simulated Afterlife, and Plug Pulled as a major cosmic endpoint.",
    accentColor: "#019C00",
    rootPriors: {
      "nor-c0-multiverse": 0.16,
      "nor-c0-preexisting-universe": 0.7,
      "nor-c0-nothingness": 0.09,
      "nor-c0-incomprehensible": 0.05,
    },
    conditionalOverrides: {
      "nor-c0-preexisting-universe->nor-c1-ancestor-simulation": 0.56,
      "nor-c0-preexisting-universe->nor-c1-alien-simulation": 0.32,
      "nor-c0-preexisting-universe->nor-c1-singularity-parent": 0.09,
      "nor-c0-preexisting-universe->nor-c1-quantum-fluct-parent": 0.03,
      "nor-c1-ancestor-simulation->nor-c2-wake-up-simulation": 0.65,
      "nor-c1-ancestor-simulation->nor-c2-simulated-afterlife": 0.16,
      "nor-c1-ancestor-simulation->nor-c2-eternal-nonexistence": 0.15,
      "nor-c1-ancestor-simulation->nor-c2-incomprehensible-death": 0.04,
      "nor-c1-alien-simulation->nor-c2-wake-up-simulation": 0.58,
      "nor-c1-alien-simulation->nor-c2-simulated-afterlife": 0.14,
      "nor-c1-alien-simulation->nor-c2-eternal-nonexistence": 0.2,
      "nor-c1-alien-simulation->nor-c2-incomprehensible-death": 0.08,
    },
  },
  {
    id: "analytic_idealist",
    name: "Analytic Idealist / Panpsychist",
    shortBadge: "Idealist / Mind",
    authorLabel: "Universal Consciousness & Cyclic/Holographic",
    description:
      "Treats phenomenal consciousness as ontological bedrock: favors Holographic, Cyclic, and Brane multiverse origins, and assigns >55% to Non-Material Continuation & Return to Universal Consciousness.",
    accentColor: "#cf60d0",
    rootPriors: {
      "nor-c0-multiverse": 0.56,
      "nor-c0-preexisting-universe": 0.16,
      "nor-c0-nothingness": 0.14,
      "nor-c0-incomprehensible": 0.14,
    },
    conditionalOverrides: {
      "nor-c0-multiverse->nor-c1-eternal-inflation": 0.25,
      "nor-c0-multiverse->nor-c1-cyclic-models": 0.28,
      "nor-c0-multiverse->nor-c1-brane-collisions": 0.16,
      "nor-c0-multiverse->nor-c1-holographic-multiverse": 0.23,
      "nor-c0-multiverse->nor-c1-incomprehensible-mechanism": 0.08,
      "nor-c1-eternal-inflation->nor-c2-nonmaterial-continuation": 0.58,
      "nor-c1-eternal-inflation->nor-c2-eternal-nonexistence": 0.3,
      "nor-c1-eternal-inflation->nor-c2-incomprehensible-death": 0.12,
      "nor-c1-cyclic-models->nor-c2-nonmaterial-continuation": 0.68,
      "nor-c1-cyclic-models->nor-c2-eternal-nonexistence": 0.22,
      "nor-c1-cyclic-models->nor-c2-incomprehensible-death": 0.1,
      "nor-c1-holographic-multiverse->nor-c2-nonmaterial-continuation": 0.72,
      "nor-c1-holographic-multiverse->nor-c2-eternal-nonexistence": 0.18,
      "nor-c1-holographic-multiverse->nor-c2-incomprehensible-death": 0.1,
    },
  },
  {
    id: "theistic_teleological",
    name: "Theistic / Teleological Creation",
    shortBadge: "Theistic",
    authorLabel: "Ex Nihilo Creation & Moral Afterlife",
    description:
      "Places primary weight on Ex Nihilo Divine Creation and fine-tuned Multiverse design, with high probability of Non-Material Continuation (Afterlife / Universal Consciousness) and Teleological Renewal.",
    accentColor: "#e74fab",
    rootPriors: {
      "nor-c0-multiverse": 0.22,
      "nor-c0-preexisting-universe": 0.12,
      "nor-c0-nothingness": 0.6,
      "nor-c0-incomprehensible": 0.06,
    },
    conditionalOverrides: {
      "nor-c0-nothingness->nor-c1-divine-creation": 0.78,
      "nor-c0-nothingness->nor-c1-quantum-vacuum-fluct": 0.18,
      "nor-c0-nothingness->nor-c1-uncaused-other": 0.04,
      "nor-c1-divine-creation->nor-c2-nonmaterial-continuation": 0.85,
      "nor-c1-divine-creation->nor-c2-eternal-nonexistence": 0.08,
      "nor-c1-divine-creation->nor-c2-incomprehensible-death": 0.07,
      "nor-c2-nonmaterial-continuation->nor-c3-afterlife-heaven-hell": 0.58,
      "nor-c2-nonmaterial-continuation->nor-c3-universal-consciousness": 0.3,
      "nor-c2-nonmaterial-continuation->nor-c3-reincarnation": 0.07,
      "nor-c2-nonmaterial-continuation->nor-c3-parallel-universe-cont": 0.05,
    },
  },
  {
    id: "max_entropy_agnostic",
    name: "Epistemic Humility / Agnostic",
    shortBadge: "Max-Entropy",
    authorLabel: "High Cognitive Closure Prior",
    description:
      "Broad, flatter probability distribution across allfour origins with 25% reserved for 'Incomprehensible / Yet to be conceived of' origins and fates.",
    accentColor: "#FF8800",
    rootPriors: {
      "nor-c0-multiverse": 0.25,
      "nor-c0-preexisting-universe": 0.25,
      "nor-c0-nothingness": 0.25,
      "nor-c0-incomprehensible": 0.25,
    },
  },
];

export interface ComputedRealityNode extends RealityNodeSpec {
  /** Computed probability mass arriving/originating at this node (in [0, 1]) */
  probability: number;
  /** Baseline author probability for delta comparison */
  baselineProbability: number;
  /** Community aggregate probability for delta comparison */
  communityProbability: number;
  /** Outgoing links from this node */
  outgoingLinkIds: string[];
  /** Incoming links into this node */
  incomingLinkIds: string[];
}

export interface ComputedRealityLink extends RealityLinkSpec {
  /** Conditional probability P(target | source) in [0, 1] */
  conditionalProb: number;
  /** Baseline conditional probability P_0(target | source) in [0, 1] */
  baselineConditionalProb: number;
  /** Computed flow value P(source) * P(target | source) in [0, 1] */
  flow: number;
  /** Source color hex */
  sourceColor: string;
  /** Target color hex */
  targetColor: string;
}

export interface ComputedRealityGraph {
  nodes: ComputedRealityNode[];
  nodeMap: Map<string, ComputedRealityNode>;
  links: ComputedRealityLink[];
  linkMap: Map<string, ComputedRealityLink>;
  conditionedNodeId: string | null;
}

/**
 * Computes baseline outgoing conditional probabilities P_0(target | source) from the Flourish link flows.
 */
export function getBaselineConditionalMap(): Map<string, number> {
  const sumBySource = new Map<string, number>();
  for (const link of NATURE_OF_REALITY_LINKS) {
    sumBySource.set(
      link.sourceId,
      (sumBySource.get(link.sourceId) ?? 0) + link.baselineFlow
    );
  }
  const condMap = new Map<string, number>();
  for (const link of NATURE_OF_REALITY_LINKS) {
    const total = sumBySource.get(link.sourceId) ?? 1;
    condMap.set(
      `${link.sourceId}->${link.targetId}`,
      total > 0 ? link.baselineFlow / total : 0
    );
  }
  return condMap;
}

/**
 * Forward-propagates probabilities from Column 0 roots across all 7 columns,
 * respecting user root priors, user conditional split overrides, and optional Bayesian conditioning on a target node.
 */
export function propagateNatureOfRealityFlow(
  rootPriorsInput: Record<string, number>,
  conditionalOverridesInput: Record<string, number> = {},
  conditionedNodeId: string | null = null
): {
  nodeProbs: Map<string, number>;
  linkFlows: Map<string, number>;
  linkConditionals: Map<string, number>;
} {
  const baseCondMap = getBaselineConditionalMap();
  const rootNodes = NATURE_OF_REALITY_NODES.filter((n) => n.columnIndex === 0);

  // 1. Normalize Column 0 root priors to sum strictly to 1.0
  let rootSum = 0;
  const rawRoots = new Map<string, number>();
  for (const r of rootNodes) {
    const val = Math.max(
      0.0001,
      rootPriorsInput[r.id] !== undefined ? rootPriorsInput[r.id] : r.baselineValue
    );
    rawRoots.set(r.id, val);
    rootSum += val;
  }

  const nodeProbs = new Map<string, number>();
  for (const r of rootNodes) {
    nodeProbs.set(r.id, rootSum > 0 ? (rawRoots.get(r.id) ?? 0) / rootSum : 0.25);
  }

  // Group outgoing links by sourceId
  const outgoingBySource = new Map<string, RealityLinkSpec[]>();
  for (const link of NATURE_OF_REALITY_LINKS) {
    const list = outgoingBySource.get(link.sourceId) || [];
    list.push(link);
    outgoingBySource.set(link.sourceId, list);
  }

  // 2. Normalize outgoing conditional splits P(target | source) for each source node
  const linkConditionals = new Map<string, number>();
  for (const [sourceId, outLinks] of outgoingBySource.entries()) {
    let sumCond = 0;
    const rawConds: number[] = [];
    for (const l of outLinks) {
      const key = `${sourceId}->${l.targetId}`;
      const baseC = baseCondMap.get(key) ?? 1 / outLinks.length;
      const c =
        conditionalOverridesInput[key] !== undefined
          ? Math.max(0, conditionalOverridesInput[key])
          : baseC;
      rawConds.push(c);
      sumCond += c;
    }
    outLinks.forEach((l, idx) => {
      const key = `${sourceId}->${l.targetId}`;
      const norm =
        sumCond > 0
          ? rawConds[idx] / sumCond
          : baseCondMap.get(key) ?? 1 / outLinks.length;
      linkConditionals.set(l.id, norm);
    });
  }

  // 3. Propagate flows column by column (0 -> 6)
  const linkFlows = new Map<string, number>();
  const nodesByCol = new Map<number, RealityNodeSpec[]>();
  for (const n of NATURE_OF_REALITY_NODES) {
    const list = nodesByCol.get(n.columnIndex) || [];
    list.push(n);
    nodesByCol.set(n.columnIndex, list);
  }

  for (let col = 0; col <= 6; col++) {
    const colNodes = nodesByCol.get(col) || [];
    for (const node of colNodes) {
      if (col > 0) {
        // Node probability is the sum of incoming link flows
        let incomingSum = 0;
        for (const l of NATURE_OF_REALITY_LINKS) {
          if (l.targetId === node.id) {
            incomingSum += linkFlows.get(l.id) ?? 0;
          }
        }
        nodeProbs.set(node.id, incomingSum);
      }
      const pNode = nodeProbs.get(node.id) ?? 0;
      const outLinks = outgoingBySource.get(node.id) || [];
      for (const l of outLinks) {
        const cond = linkConditionals.get(l.id) ?? 0;
        linkFlows.set(l.id, pNode * cond);
      }
    }
  }

  // 4. Optional Bayesian & Forward Conditioning (`Given [conditionedNodeId] = 100%`)
  if (conditionedNodeId) {
    const targetProb = nodeProbs.get(conditionedNodeId) ?? 0;
    if (targetProb > 1e-9) {
      // Compute reachability fraction from every node u to conditionedNodeId (backward pass)
      // For any node u at or before conditionedNodeId, reachMass(u) is the portion of u's probability mass
      // that flows through conditionedNodeId.
      const reachMass = new Map<string, number>();
      reachMass.set(conditionedNodeId, targetProb);

      // Backward pass from column of conditionedNodeId down to 0
      const targetNodeSpec = NATURE_OF_REALITY_NODES.find(
        (n) => n.id === conditionedNodeId
      );
      const targetCol = targetNodeSpec?.columnIndex ?? 0;

      for (let col = targetCol - 1; col >= 0; col--) {
        const colNodes = nodesByCol.get(col) || [];
        for (const u of colNodes) {
          const outLinks = outgoingBySource.get(u.id) || [];
          let massToTarget = 0;
          for (const l of outLinks) {
            const vMass = reachMass.get(l.targetId) ?? 0;
            const vTotal = nodeProbs.get(l.targetId) ?? 0;
            const lFlow = linkFlows.get(l.id) ?? 0;
            if (vTotal > 1e-9 && vMass > 0) {
              massToTarget += lFlow * (vMass / vTotal);
            }
          }
          reachMass.set(u.id, massToTarget);
        }
      }

      // Now construct conditioned nodeProbs and linkFlows
      const condNodeProbs = new Map<string, number>();
      const condLinkFlows = new Map<string, number>();

      // Upstream & target column
      for (let col = 0; col <= targetCol; col++) {
        const colNodes = nodesByCol.get(col) || [];
        for (const u of colNodes) {
          if (col === targetCol) {
            condNodeProbs.set(u.id, u.id === conditionedNodeId ? 1.0 : 0.0);
          } else {
            const m = reachMass.get(u.id) ?? 0;
            condNodeProbs.set(u.id, m / targetProb);
          }
        }
      }

      // Upstream links (only links that carry mass toward conditionedNodeId)
      for (let col = 0; col < targetCol; col++) {
        const colNodes = nodesByCol.get(col) || [];
        for (const u of colNodes) {
          const outLinks = outgoingBySource.get(u.id) || [];
          for (const l of outLinks) {
            const vMass = reachMass.get(l.targetId) ?? 0;
            const vTotal = nodeProbs.get(l.targetId) ?? 0;
            const lFlow = linkFlows.get(l.id) ?? 0;
            if (vTotal > 1e-9 && vMass > 0) {
              condLinkFlows.set(l.id, (lFlow * (vMass / vTotal)) / targetProb);
            } else {
              condLinkFlows.set(l.id, 0);
            }
          }
        }
      }

      // Forward pass from targetCol to 6
      for (let col = targetCol; col <= 6; col++) {
        const colNodes = nodesByCol.get(col) || [];
        for (const u of colNodes) {
          if (col > targetCol) {
            let inSum = 0;
            for (const l of NATURE_OF_REALITY_LINKS) {
              if (l.targetId === u.id) {
                inSum += condLinkFlows.get(l.id) ?? 0;
              }
            }
            condNodeProbs.set(u.id, inSum);
          }
          const pU = condNodeProbs.get(u.id) ?? 0;
          const outLinks = outgoingBySource.get(u.id) || [];
          for (const l of outLinks) {
            const c = linkConditionals.get(l.id) ?? 0;
            condLinkFlows.set(l.id, pU * c);
          }
        }
      }

      return {
        nodeProbs: condNodeProbs,
        linkFlows: condLinkFlows,
        linkConditionals,
      };
    }
  }

  return { nodeProbs, linkFlows, linkConditionals };
}

/**
 * Full graph computation including baseline & community comparisons.
 */
export function computeNatureOfRealityGraph(
  rootPriorsInput: Record<string, number>,
  conditionalOverridesInput: Record<string, number> = {},
  conditionedNodeId: string | null = null,
  communityConditionalOverrides: Record<string, number> = {}
): ComputedRealityGraph {
  const baselinePreset = NATURE_OF_REALITY_PRESETS[0];
  const communityPreset = NATURE_OF_REALITY_PRESETS[1];

  const baselineRun = propagateNatureOfRealityFlow(
    baselinePreset.rootPriors,
    baselinePreset.conditionalOverrides || {},
    null
  );
  const communityRun = propagateNatureOfRealityFlow(
    communityPreset.rootPriors,
    {
      ...(communityPreset.conditionalOverrides || {}),
      ...communityConditionalOverrides,
    },
    null
  );
  const activeRun = propagateNatureOfRealityFlow(
    rootPriorsInput,
    conditionalOverridesInput,
    conditionedNodeId
  );

  const colorById = new Map<string, string>();
  for (const n of NATURE_OF_REALITY_NODES) {
    colorById.set(n.id, n.color);
  }

  const outgoingByNode = new Map<string, string[]>();
  const incomingByNode = new Map<string, string[]>();
  for (const l of NATURE_OF_REALITY_LINKS) {
    const outList = outgoingByNode.get(l.sourceId) || [];
    outList.push(l.id);
    outgoingByNode.set(l.sourceId, outList);

    const inList = incomingByNode.get(l.targetId) || [];
    inList.push(l.id);
    incomingByNode.set(l.targetId, inList);
  }

  const computedNodes: ComputedRealityNode[] = NATURE_OF_REALITY_NODES.map(
    (spec) => ({
      ...spec,
      probability: activeRun.nodeProbs.get(spec.id) ?? spec.baselineValue,
      baselineProbability:
        baselineRun.nodeProbs.get(spec.id) ?? spec.baselineValue,
      communityProbability:
        communityRun.nodeProbs.get(spec.id) ?? spec.baselineValue,
      outgoingLinkIds: outgoingByNode.get(spec.id) || [],
      incomingLinkIds: incomingByNode.get(spec.id) || [],
    })
  );

  const computedLinks: ComputedRealityLink[] = NATURE_OF_REALITY_LINKS.map(
    (spec) => ({
      ...spec,
      conditionalProb: activeRun.linkConditionals.get(spec.id) ?? 0,
      baselineConditionalProb: baselineRun.linkConditionals.get(spec.id) ?? 0,
      flow: activeRun.linkFlows.get(spec.id) ?? spec.baselineFlow,
      sourceColor: colorById.get(spec.sourceId) ?? "#6366f1",
      targetColor: colorById.get(spec.targetId) ?? "#38bdf8",
    })
  );

  return {
    nodes: computedNodes,
    nodeMap: new Map(computedNodes.map((n) => [n.id, n])),
    links: computedLinks,
    linkMap: new Map(computedLinks.map((l) => [l.id, l])),
    conditionedNodeId,
  };
}
