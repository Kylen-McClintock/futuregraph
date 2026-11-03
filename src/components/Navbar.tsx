"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Compass,
  GitBranch,
  GitCompare,
  Presentation,
  Scale,
  ShieldCheck,
  Sliders,
  Sun,
  Moon,
  Terminal,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fg-theme");
    if (saved === "light") {
      setLightMode(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !lightMode;
    setLightMode(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("fg-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("fg-theme", "dark");
    }
  };

  // Hide top navbar chrome when in Present Mode clean view if desired, or keep compact
  const navLinks = [
    {
      href: "/scenarios/ai-2027",
      label: "AI 2027 Map",
      icon: Compass,
      match: (p: string) => p === "/scenarios/ai-2027" || p.startsWith("/scenarios/ai-2027/n/"),
    },
    {
      href: "/scenarios/ai-2027/compare",
      label: "Where We Disagree",
      icon: GitCompare,
      match: (p: string) => p.startsWith("/scenarios/ai-2027/compare"),
    },
    {
      href: "/scenarios/ai-2027/present/pres-ai2027-flagship-story",
      label: "Present Mode",
      icon: Presentation,
      match: (p: string) => p.startsWith("/scenarios/ai-2027/present"),
    },
    {
      href: "/scenarios/ai-2027/forks/fork-hardware-bottleneck-2029",
      label: "Scenario Forks",
      icon: GitBranch,
      match: (p: string) => p.startsWith("/scenarios/ai-2027/forks"),
    },
    {
      href: "/fairmarkets/ai-governance",
      label: "FairMarkets Lab",
      icon: Scale,
      match: (p: string) => p.startsWith("/fairmarkets"),
    },
    {
      href: "/receipt/fe-001",
      label: "Audit Receipts",
      icon: ShieldCheck,
      match: (p: string) => p.startsWith("/receipt"),
    },
    {
      href: "/docs/api",
      label: "Agent API & MCP",
      icon: Terminal,
      match: (p: string) => p.startsWith("/docs/api"),
    },
    {
      href: "/admin",
      label: "Editorial Admin",
      icon: Sliders,
      match: (p: string) => p.startsWith("/admin"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-sky-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-100 text-base">
                  FutureGraph
                </span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  AI 2027 v1.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Auditable Conditional Probability Network
              </p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/u/elena_vance"
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700"
          >
            <BookOpen className="h-3.5 w-3.5 text-sky-400" />
            <span>@elena_vance</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 tabular-nums">
              Brier 0.014
            </span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-amber-300"
          >
            {lightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Compact mobile/tablet horizontal sub-nav */}
      <div className="flex xl:hidden items-center gap-1 overflow-x-auto border-t border-slate-900 px-3 py-1.5">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                active
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
