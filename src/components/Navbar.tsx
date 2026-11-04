"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  ChevronDown,
  Compass,
  GitBranch,
  GitCompare,
  Moon,
  Presentation,
  Scale,
  ShieldCheck,
  Sliders,
  Sun,
  Terminal,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [lightMode, setLightMode] = useState(false);
  const moreDetailsRef = useRef<HTMLDetailsElement | null>(null);

  const applyThemeToDom = (mode: "light" | "dark", persist: boolean) => {
    const isLight = mode === "light";
    setLightMode(isLight);
    document.documentElement.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("dark", !isLight);
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="color-scheme"]'
    );
    if (persist) {
      const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const sysMode = sysDark ? "dark" : "light";
      try {
        if (mode === sysMode) {
          localStorage.removeItem("color-scheme");
        } else {
          localStorage.setItem("color-scheme", mode);
        }
        localStorage.setItem("fg-theme", mode);
      } catch {
        // Ignore storage errors if blocked
      }
    }
    if (meta) {
      meta.content = mode;
    }
    window.dispatchEvent(
      new CustomEvent("fg-theme-change", { detail: { theme: mode } })
    );
  };

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("fg-theme") ||
        localStorage.getItem("color-scheme");
      if (saved === "light") {
        applyThemeToDom("light", false);
      } else {
        applyThemeToDom("dark", false);
      }
    } catch {
      applyThemeToDom("dark", false);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "color-scheme" || e.key === "fg-theme") {
        const nextMode = e.newValue === "light" ? "light" : "dark";
        applyThemeToDom(nextMode, false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close <details> dropdown when route changes or clicking outside
  useEffect(() => {
    if (moreDetailsRef.current) {
      moreDetailsRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        moreDetailsRef.current?.open &&
        !moreDetailsRef.current.contains(e.target as Node)
      ) {
        moreDetailsRef.current.open = false;
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const toggleTheme = () => {
    const nextMode = lightMode ? "dark" : "light";
    applyThemeToDom(nextMode, true);
  };

  const primaryLinks = [
    {
      href: "/scenarios/nature-of-reality",
      label: "Nature of Reality (Sankey)",
      icon: Compass,
      match: (p: string) => p.startsWith("/scenarios/nature-of-reality"),
    },
    {
      href: "/scenarios/ai-2050",
      label: "AI 2050 (5 Worlds)",
      icon: Compass,
      match: (p: string) =>
        p === "/" ||
        p === "/scenarios/ai-2050" ||
        p.startsWith("/scenarios/ai-2050/n/"),
    },
    {
      href: "/scenarios/ai-2027",
      label: "AI 2027 Map",
      icon: GitBranch,
      match: (p: string) =>
        p === "/scenarios/ai-2027" ||
        p.startsWith("/scenarios/ai-2027/n/"),
    },
    {
      href: "/scenarios/ai-2040",
      label: "AI 2040 Map",
      icon: GitBranch,
      match: (p: string) =>
        p === "/scenarios/ai-2040" ||
        p.startsWith("/scenarios/ai-2040/n/"),
    },
    {
      href: "/scenarios/ai-2027/compare",
      label: "Compare Lenses",
      icon: GitCompare,
      match: (p: string) => p.startsWith("/scenarios/ai-2027/compare"),
    },
    {
      href: "/scenarios/ai-2027/present/pres-ai2027-flagship-story",
      label: "Present Mode",
      icon: Presentation,
      match: (p: string) => p.startsWith("/scenarios/ai-2027/present"),
    },
  ];

  const secondaryLinks = [
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

  const isSecondaryActive = secondaryLinks.some((item) => item.match(pathname));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="https://www.agifutures.org"
            className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
            title="Return to AGI Futures"
          >
            <span>← AGI Futures</span>
          </a>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-sky-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-100 text-sm sm:text-base">
                FutureGraph
              </span>
              <span className="hidden md:inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                {pathname.startsWith("/scenarios/ai-2050")
                  ? "AI 2050 • 5 Worlds"
                  : pathname.startsWith("/scenarios/ai-2040")
                  ? "AI 2040"
                  : "AI 2027–2050"}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            {/* Progressive disclosure <details> menu for secondary tools */}
            <details ref={moreDetailsRef} className="relative">
              <summary
                className={`list-none cursor-pointer flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSecondaryActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <span>More</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </summary>
              <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl z-50">
                {secondaryLinks.map((item) => {
                  const Icon = item.icon;
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-amber-500/15 text-amber-300"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/u/elena_vance"
            title="Default interactive guest sandbox profile"
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700"
          >
            <BookOpen className="h-3.5 w-3.5 text-sky-400" />
            <span>Guest Sandbox</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 tabular-nums">
              Demo
            </span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              lightMode ? "Switch to dark theme" : "Switch to light theme"
            }
            title={lightMode ? "Switch to dark theme" : "Switch to light theme"}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
          >
            {lightMode ? (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
