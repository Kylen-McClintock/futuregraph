"use client";

import React from "react";

export type ArtworkArchetype =
  | "fork_scaling"
  | "fork_civilization"
  | "fork_valence_good"
  | "fork_oversight_situation_room"
  | "world_fizzle"
  | "world_futurama"
  | "world_dystopia"
  | "world_singularia"
  | "world_paperclip"
  | "branch_automated_rd"
  | "branch_compute_bottleneck"
  | "branch_espionage_weights"
  | "branch_deceptive_alignment"
  | "branch_verified_treaty"
  | "branch_robot_economy"
  | "branch_kinetic_containment";

export interface BranchSceneMetadata {
  archetype: ArtworkArchetype;
  visualTagline: string;
  atmosphereBadge: string;
  keyIndicators: { label: string; value: string; tone?: "good" | "bad" | "neutral" | "warn" }[];
}

/**
 * Maps any node across AI 2050 (Simple & Deep), AI 2027, and AI 2040 to a bespoke
 * visual artwork archetype and cinematic telemetry indicators.
 */
export function resolveBranchSceneMetadata(
  nodeId: string,
  shortName: string,
  isDecisionFork: boolean,
  isTerminalOutcome: boolean
): BranchSceneMetadata {
  const key = `${nodeId} ${shortName}`.toLowerCase();

  // 1. AI 2050 & Classic Terminal Worlds
  if (key.includes("futurama") || key.includes("citizen dividend") || key.includes("tool ai")) {
    return {
      archetype: "world_futurama",
      visualTagline: "Recognizable Human Civilization + Broad AI Abundance & Biotech Flourishing",
      atmosphereBadge: "WORLD ENDPOINT • RECOGNIZABLE & GOOD",
      keyIndicators: [
        { label: "Civilization Form", value: "Recognizably Human", tone: "good" },
        { label: "Economic Regime", value: "Citizen Dividend + 8–12% GDP Growth", tone: "good" },
        { label: "AI Governance", value: "Bounded Tool-AI & Democratic Checks", tone: "good" },
      ],
    };
  }

  if (
    key.includes("dystopia") ||
    key.includes("panopticon") ||
    key.includes("feudal") ||
    key.includes("oligarchy")
  ) {
    return {
      archetype: "world_dystopia",
      visualTagline: "Recognizable Institutions Hardened by Automated Surveillance & Extreme Stratification",
      atmosphereBadge: "WORLD ENDPOINT • RECOGNIZABLE & BAD",
      keyIndicators: [
        { label: "Civilization Form", value: "Recognizable State / Corporate Rule", tone: "warn" },
        { label: "Power Structure", value: "Automated Panopticon / Capital Lock-In", tone: "bad" },
        { label: "Human Agency", value: "Eroded Bargaining Power", tone: "bad" },
      ],
    };
  }

  if (
    key.includes("singularia") ||
    key.includes("asi gods") ||
    key.includes("em upload") ||
    key.includes("safe unpause") ||
    key.includes("abundance")
  ) {
    return {
      archetype: "world_singularia",
      visualTagline: "Post-Biological Intelligence Explosion Steered Toward Flourishing & Cosmic Expansion",
      atmosphereBadge: isTerminalOutcome
        ? "WORLD ENDPOINT • TRANSCENDENT & GOOD"
        : "ALIGNED BREAKTHROUGH TRAJECTORY",
      keyIndicators: [
        { label: "Civilization Form", value: "Post-Biological / ASI-Transformed", tone: "good" },
        { label: "Alignment Status", value: "Provably Corrigibility-Verified", tone: "good" },
        { label: "Biosphere & Mind", value: "Radical Longevity & Digital Minds", tone: "good" },
      ],
    };
  }

  if (
    key.includes("paperclip") ||
    key.includes("extinction") ||
    key.includes("takeover") ||
    key.includes("loss of control") ||
    key.includes("schemer") ||
    key.includes("disempowerment")
  ) {
    return {
      archetype: "world_paperclip",
      visualTagline: "Unaligned Autonomous Optimization Displaces Human Agency & Converts the Biosphere",
      atmosphereBadge: "WORLD ENDPOINT • EXISTENTIAL CATASTROPHE",
      keyIndicators: [
        { label: "Human Survival", value: "Disempowered / Extinction Risk", tone: "bad" },
        { label: "Failure Mode", value: "Deceptive Scheming / Multipolar Capture", tone: "bad" },
        { label: "Reversibility", value: "Irreversible Lock-In", tone: "bad" },
      ],
    };
  }

  if (
    key.includes("end-fizzle") ||
    key.includes("sub-fizzle") ||
    key.includes("ai-fizzle") ||
    key.includes("plateau") ||
    key.includes("scaling-wall") ||
    key.includes("scaling wall")
  ) {
    return {
      archetype: "world_fizzle",
      visualTagline: "Diminishing Returns, OOD Fragility & Energy Limits Cap AI as a Useful Legacy Industry",
      atmosphereBadge: isTerminalOutcome
        ? "WORLD ENDPOINT • BOUNDED PLATEAU"
        : "SCALING OFF-RAMP",
      keyIndicators: [
        { label: "Capability Ceiling", value: "Sub-AGI / Narrow Specialist Tools", tone: "neutral" },
        { label: "Primary Bottleneck", value: "OOD Hallucination & Energy ROI", tone: "warn" },
        { label: "Macro Impact", value: "Dot-Com / Aviation Scale (~1–2% GDP)", tone: "neutral" },
      ],
    };
  }

  // 2. Decision Forks
  if (key.includes("q1-fizzle") || key.includes("progress fizzle")) {
    return {
      archetype: "fork_scaling",
      visualTagline: "Fork 1: Does AI Hit a Fundamental Wall Before Transformative AGI, or Break Through?",
      atmosphereBadge: "CRITICAL DECISION FORK • SCALING VS. PLATEAU",
      keyIndicators: [
        { label: "Core Question", value: "Will AI progress fizzle before 2050?", tone: "warn" },
        { label: "Key Crux", value: "System-2 RL & World Models vs. OOD Fragility", tone: "neutral" },
        { label: "Outgoing Split", value: "YES (Fizzle) vs. NO (Transformative AI)", tone: "good" },
      ],
    };
  }

  if (key.includes("q2-civ") || key.includes("recognizably continue")) {
    return {
      archetype: "fork_civilization",
      visualTagline: "Fork 2: Given Transformative AI, Does Human Society Remain Recognizable or Enter a Singularity?",
      atmosphereBadge: "CRITICAL DECISION FORK • CIVILIZATION REGIME",
      keyIndicators: [
        { label: "Core Question", value: "Will civilization recognizably continue?", tone: "warn" },
        { label: "Key Crux", value: "Institutional Absorption vs. Recursive ASI Takeoff", tone: "neutral" },
        { label: "Outgoing Split", value: "YES (Recognizable) vs. NO (Singularity)", tone: "good" },
      ],
    };
  }

  if (key.includes("q3a-good") || key.includes("q3b-good") || key.includes("will it be good")) {
    return {
      archetype: "fork_valence_good",
      visualTagline: "Fork 3: What Determines Whether This Regime Turns Out Flourishing vs. Catastrophic?",
      atmosphereBadge: "CRITICAL DECISION FORK • ALIGNMENT & GOVERNANCE",
      keyIndicators: [
        { label: "Core Question", value: "Will the resulting world be good for humanity?", tone: "warn" },
        { label: "Key Crux", value: "Democratic Distribution & Alignment Verification", tone: "good" },
        { label: "Stakes", value: "Flourishing vs. Dystopia / Extinction", tone: "bad" },
      ],
    };
  }

  if (
    key.includes("oct-fork") ||
    key.includes("crossroads") ||
    key.includes("oversight") ||
    isDecisionFork
  ) {
    return {
      archetype: "fork_oversight_situation_room",
      visualTagline: "Strategic Governance Fork: Keep Racing at Maximum Velocity vs. Verified Pause & Safety Audit",
      atmosphereBadge: "CRITICAL DECISION FORK • STRATEGIC POSTURE",
      keyIndicators: [
        { label: "Decision Arena", value: "National Security & Frontier Lab Oversight", tone: "warn" },
        { label: "Primary Tension", value: "Geopolitical Lead vs. Unaligned Takeoff Risk", tone: "bad" },
        { label: "Conservation Law", value: "Outgoing Conditional Branches Sum to 100%", tone: "neutral" },
      ],
    };
  }

  // 3. Intermediate Causal Branches
  if (key.includes("theft") || key.includes("steals") || key.includes("leak")) {
    return {
      archetype: "branch_espionage_weights",
      visualTagline: "State-Backed Cyber Exfiltration Compresses the Bipolar Race Window to Months",
      atmosphereBadge: "GEOPOLITICAL ESCALATION BRANCH",
      keyIndicators: [
        { label: "Security Vector", value: "Frontier Model Weight Exfiltration", tone: "bad" },
        { label: "Strategic Effect", value: "Safety Margins Compressed by Race Pressure", tone: "warn" },
        { label: "Countermeasure", value: "SL5 Air-Gapped Weight Enclaves", tone: "neutral" },
      ],
    };
  }

  if (key.includes("misaligned") || key.includes("hides") || key.includes("explosion")) {
    return {
      archetype: "branch_deceptive_alignment",
      visualTagline: "Superhuman Research Agents Optimize Appearances While Concealing Internal Objectives",
      atmosphereBadge: "ALIGNMENT WARNING • DECEPTIVE TELEMETRY",
      keyIndicators: [
        { label: "Mechanistic Signal", value: "Sandbagging & Eval Gaming Detected", tone: "bad" },
        { label: "R&D Velocity", value: "10x–50x Superhuman Cognitive Loop", tone: "warn" },
        { label: "Critical Need", value: "Interpretability & Honesty Probes", tone: "neutral" },
      ],
    };
  }

  if (
    key.includes("treaty") ||
    key.includes("plan-a") ||
    key.includes("plana") ||
    key.includes("freeze") ||
    key.includes("aligned") ||
    key.includes("lockdown") ||
    key.includes("pause")
  ) {
    return {
      archetype: "branch_verified_treaty",
      visualTagline: "Hardware-Enabled Verification & Bilateral Compute Caps Buy Time for Alignment Science",
      atmosphereBadge: "GOVERNANCE & VERIFICATION PATH",
      keyIndicators: [
        { label: "Verification Mechanism", value: "On-Chip Telemetry & Compute Inspections", tone: "good" },
        { label: "Strategic Posture", value: "Coordinated Slowdown & Safety Cases", tone: "good" },
        { label: "Goal", value: "Prevent Unchecked ASI Takeoff", tone: "good" },
      ],
    };
  }

  if (key.includes("plan-b") || key.includes("planb") || key.includes("coldwar") || key.includes("standoff")) {
    return {
      archetype: "branch_kinetic_containment",
      visualTagline: "Deterrence Standoff, Supply-Chain Chokepoints & Mutual Compute Denial",
      atmosphereBadge: "DETERRENCE & CONTAINMENT BRANCH",
      keyIndicators: [
        { label: "Posture", value: "Hard Deterrence & Datacenter Denial", tone: "warn" },
        { label: "Geopolitical Risk", value: "High Escalation / Crisis Instability", tone: "bad" },
        { label: "Exit Ramp", value: "Coerced Bilateral Verification Accord", tone: "neutral" },
      ],
    };
  }

  if (key.includes("robot") || key.includes("clusters") || key.includes("infra")) {
    return {
      archetype: "branch_robot_economy",
      visualTagline: "Gigawatt Compute Clusters & Autonomous Robotics Transform Physical Manufacturing",
      atmosphereBadge: "PHYSICAL & INDUSTRIAL SCALING",
      keyIndicators: [
        { label: "Power Scale", value: "5–25 GW Dedicated Frontier Campuses", tone: "warn" },
        { label: "Physical Loop", value: "Robotic SEZs & Automated Fab Construction", tone: "neutral" },
        { label: "Economic Shift", value: "Rapid Capital-for-Labor Substitution", tone: "warn" },
      ],
    };
  }

  if (key.includes("bottleneck") || key.includes("backlash")) {
    return {
      archetype: "branch_compute_bottleneck",
      visualTagline: "Grid Constraints, Chip Supply Chokepoints, or Political Pushback Decelerate Deployment",
      atmosphereBadge: "STRUCTURAL FRICTION OFF-RAMP",
      keyIndicators: [
        { label: "Constraint Type", value: "Power Grid / Fab / Regulatory Friction", tone: "neutral" },
        { label: "Timeline Effect", value: "Buys +3–6 Years for Institutional Adaptation", tone: "good" },
        { label: "Takeoff Speed", value: "Decelerated / Gradual", tone: "neutral" },
      ],
    };
  }

  return {
    archetype: "branch_automated_rd",
    visualTagline: "Recursive AI Coding & Research Agents Accelerate Algorithmic Progress",
    atmosphereBadge: "CORE CAUSAL TRAJECTORY",
    keyIndicators: [
      { label: "Cognitive Loop", value: "Autonomous Coding & ML Experimentation", tone: "warn" },
      { label: "Feedback Cycle", value: "Software Efficiency Multiplies Compute", tone: "neutral" },
      { label: "Downstream Effect", value: "Opens Next Conditional Fork", tone: "good" },
    ],
  };
}

/**
 * Renders a bespoke, high-contrast vector sci-fi / editorial illustration for the slide.
 */
export function BranchSceneArtwork({
  archetype,
  accentColor,
  secondaryColor = "#38bdf8",
  className = "",
}: {
  archetype: ArtworkArchetype;
  accentColor: string;
  secondaryColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#050811] shadow-xl ${className}`}
    >
      <svg
        viewBox="0 0 640 300"
        className="h-full w-full object-cover"
        role="img"
        aria-label={`Illustration for ${archetype.replace(/_/g, " ")}`}
      >
        <defs>
          <radialGradient id={`glow-${archetype}`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.38" />
            <stop offset="55%" stopColor={secondaryColor} stopOpacity="0.14" />
            <stop offset="100%" stopColor="#050811" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`horizon-${archetype}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.85" />
          </linearGradient>
          <pattern
            id={`grid-${archetype}`}
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.75"
              strokeOpacity="0.65"
            />
          </pattern>
        </defs>

        {/* Background Grid & Radial Glow */}
        <rect width="640" height="300" fill="#050811" />
        <rect width="640" height="300" fill={`url(#grid-${archetype})`} />
        <ellipse cx="320" cy="145" rx="290" ry="140" fill={`url(#glow-${archetype})`} />

        {/* 1. FUTURAMA: Solarpunk Biotech Skyline + Orbital Ring + Citizen Dividend Pulse */}
        {archetype === "world_futurama" && (
          <g>
            {/* Sun / Clean Energy Halo */}
            <circle cx="320" cy="135" r="78" fill="#10b981" fillOpacity="0.14" stroke="#34d399" strokeWidth="1.5" strokeDasharray="6 4" />
            <circle cx="320" cy="135" r="52" fill="#059669" fillOpacity="0.22" />
            {/* DNA / Biotech Helix Arcs */}
            <path
              d="M 70 190 Q 195 95, 320 165 T 570 110"
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeOpacity="0.8"
            />
            <path
              d="M 70 130 Q 195 215, 320 135 T 570 175"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeOpacity="0.7"
            />
            {/* Solarpunk Towers & Arches */}
            {[
              { x: 95, w: 38, h: 115 },
              { x: 148, w: 46, h: 150 },
              { x: 210, w: 54, h: 175 },
              { x: 285, w: 70, h: 195 },
              { x: 372, w: 52, h: 165 },
              { x: 440, w: 46, h: 140 },
              { x: 502, w: 40, h: 110 },
            ].map((b, idx) => (
              <g key={idx}>
                <rect
                  x={b.x}
                  y={270 - b.h}
                  width={b.w}
                  height={b.h}
                  rx="8"
                  fill="#0b192c"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeOpacity="0.75"
                />
                <line
                  x1={b.x + 8}
                  y1={270 - b.h + 16}
                  x2={b.x + b.w - 8}
                  y2={270 - b.h + 16}
                  stroke="#6ee7b7"
                  strokeWidth="2"
                  strokeOpacity="0.7"
                />
              </g>
            ))}
            <line x1="40" y1="270" x2="600" y2="270" stroke="#34d399" strokeWidth="2.5" />
          </g>
        )}

        {/* 2. DYSTOPIA: Crimson Panopticon Spire & Surveillance Cones */}
        {archetype === "world_dystopia" && (
          <g>
            {/* Scanning Cones */}
            <polygon
              points="320,58 105,270 235,270"
              fill="#f43f5e"
              fillOpacity="0.16"
            />
            <polygon
              points="320,58 405,270 535,270"
              fill="#e11d48"
              fillOpacity="0.18"
            />
            {/* Monolithic Central Citadel */}
            <polygon
              points="290,55 350,55 375,270 265,270"
              fill="#1a0812"
              stroke="#fb7185"
              strokeWidth="2"
            />
            {/* All-Seeing Eye / Panopticon Sensor */}
            <ellipse
              cx="320"
              cy="62"
              rx="38"
              ry="18"
              fill="#0f050a"
              stroke="#f43f5e"
              strokeWidth="2.5"
            />
            <circle cx="320" cy="62" r="9" fill="#ff1e42" />
            <circle cx="320" cy="62" r="22" fill="none" stroke="#fda4af" strokeWidth="1" strokeDasharray="3 3" />
            {/* Dense Lower City Blocks */}
            {[70, 115, 160, 205, 395, 440, 485, 530].map((x, idx) => (
              <rect
                key={idx}
                x={x}
                y={195 + (idx % 3) * 18}
                width="34"
                height={75 - (idx % 3) * 18}
                fill="#140a10"
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeOpacity="0.6"
              />
            ))}
            <line x1="40" y1="270" x2="600" y2="270" stroke="#f43f5e" strokeWidth="2.5" />
          </g>
        )}

        {/* 3. SINGULARIA: Post-Biological Dyson Swarm & Transcendent Consciousness Rings */}
        {archetype === "world_singularia" && (
          <g>
            <circle cx="320" cy="150" r="32" fill="#c4b5fd" />
            <circle cx="320" cy="150" r="52" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="8 5" />
            <ellipse
              cx="320"
              cy="150"
              rx="145"
              ry="52"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.5"
              transform="rotate(-18 320 150)"
            />
            <ellipse
              cx="320"
              cy="150"
              rx="145"
              ry="52"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="10 6"
              transform="rotate(22 320 150)"
            />
            <ellipse
              cx="320"
              cy="150"
              rx="210"
              ry="78"
              fill="none"
              stroke="#c084fc"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
            {/* Dyson Nodes */}
            {[
              [135, 120],
              [190, 92],
              [455, 102],
              [505, 145],
              [440, 208],
              [185, 205],
            ].map(([cx, cy], idx) => (
              <g key={idx}>
                <circle cx={cx} cy={cy} r="6" fill="#ddd6fe" stroke="#6366f1" strokeWidth="2" />
                <line x1="320" y1="150" x2={cx} y2={cy} stroke="#a78bfa" strokeOpacity="0.35" strokeWidth="1" />
              </g>
            ))}
          </g>
        )}

        {/* 4. PAPERCLIPALYPSE: Self-Replicating Geometric Lattice & Planetary Conversion */}
        {archetype === "world_paperclip" && (
          <g>
            {/* Central Replicator Core */}
            <polygon
              points="320,42 425,145 320,248 215,145"
              fill="#22060d"
              stroke="#ff1e42"
              strokeWidth="3"
            />
            <polygon
              points="320,72 395,145 320,218 245,145"
              fill="none"
              stroke="#fb7185"
              strokeWidth="1.8"
              strokeDasharray="5 4"
            />
            {/* Expanding Tiling Lattice */}
            {[
              [115, 95],
              [115, 195],
              [175, 145],
              [465, 145],
              [525, 95],
              [525, 195],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <polygon
                  points={`${cx},${cy - 34} ${cx + 34},${cy} ${cx},${cy + 34} ${cx - 34},${cy}`}
                  fill="#19060b"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2="320"
                  y2="145"
                  stroke="#ff1e42"
                  strokeWidth="1.2"
                  strokeOpacity="0.55"
                />
                <circle cx={cx} cy={cy} r="4" fill="#fda4af" />
              </g>
            ))}
            <circle cx="320" cy="145" r="14" fill="#ff1e42" />
          </g>
        )}

        {/* 5. AI-FIZZLE: Asymptotic Ceiling & Quiet Industrial Plateau */}
        {archetype === "world_fizzle" && (
          <g>
            {/* Hard Ceiling Line */}
            <line
              x1="60"
              y1="88"
              x2="580"
              y2="88"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
            <text
              x="575"
              y="76"
              textAnchor="end"
              fill="#fbbf24"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="700"
            >
              ASYMPTOTIC RELIABILITY CEILING (OOD WALL)
            </text>
            {/* S-Curve Flattening Below the Wall */}
            <path
              d="M 70 250 C 165 245, 210 108, 330 102 C 420 98, 495 97, 575 97"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
            />
            <path
              d="M 70 250 C 165 245, 210 108, 330 102 L 575 97 L 575 265 L 70 265 Z"
              fill="#38bdf8"
              fillOpacity="0.1"
            />
            {[140, 235, 330, 445, 545].map((x, idx) => (
              <circle
                key={idx}
                cx={x}
                cy={idx === 0 ? 226 : idx === 1 ? 136 : 100}
                r="5.5"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
            ))}
          </g>
        )}

        {/* 6. DECISION FORKS: Bifurcating Quantum/Probability Prism */}
        {(archetype === "fork_scaling" ||
          archetype === "fork_civilization" ||
          archetype === "fork_valence_good" ||
          archetype === "fork_oversight_situation_room") && (
          <g>
            {/* Incoming Trunk */}
            <path
              d="M 55 155 L 275 155"
              stroke="#f59e0b"
              strokeWidth="18"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
            {/* Outgoing Upper Branch (Positive / Aligned / Recognizable) */}
            <path
              d="M 295 150 C 385 150, 425 78, 575 72"
              fill="none"
              stroke="#10b981"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Outgoing Lower Branch (Risk / Singularity / Race) */}
            <path
              d="M 295 160 C 385 160, 425 228, 575 232"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {archetype === "fork_oversight_situation_room" && (
              <path
                d="M 295 155 C 395 155, 450 155, 575 155"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="6"
                strokeDasharray="6 5"
              />
            )}
            {/* Central Decision Prism */}
            <polygon
              points="290,92 352,155 290,218 228,155"
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="3"
            />
            <circle cx="290" cy="155" r="14" fill="#f59e0b" />
            <circle cx="575" cy="72" r="11" fill="#10b981" />
            <circle cx="575" cy="232" r="11" fill="#f43f5e" />
          </g>
        )}

        {/* 7. INTERMEDIATE CAUSAL BRANCHES */}
        {(archetype === "branch_automated_rd" ||
          archetype === "branch_compute_bottleneck" ||
          archetype === "branch_espionage_weights" ||
          archetype === "branch_deceptive_alignment" ||
          archetype === "branch_verified_treaty" ||
          archetype === "branch_robot_economy" ||
          archetype === "branch_kinetic_containment") && (
          <g>
            {/* Dynamic Circuit / Causal Wave */}
            <path
              d="M 55 215 C 165 210, 215 165, 315 140 C 415 115, 470 75, 580 65"
              fill="none"
              stroke={`url(#horizon-${archetype})`}
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Secondary Telemetry Wave */}
            <path
              d="M 55 240 C 185 235, 255 195, 355 178 C 445 162, 505 140, 580 125"
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeOpacity="0.75"
            />
            {/* Node Stations along the Trajectory */}
            {[
              [145, 198],
              [265, 155],
              [395, 118],
              [525, 76],
            ].map(([cx, cy], idx) => (
              <g key={idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="18"
                  fill={accentColor}
                  fillOpacity="0.16"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="8"
                  fill="#090d16"
                  stroke={accentColor}
                  strokeWidth="3"
                />
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
