"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  ChevronDown,
  Compass,
  GitBranch,
  GitCompare,
  Menu,
  Moon,
  Presentation,
  Scale,
  ShieldCheck,
  Sliders,
  Sun,
  Terminal,
  Trophy,
  X,
} from "lucide-react";
import { AuthNavButton } from "@/components/AuthNavButton";

export function Navbar() {
  const pathname = usePathname();
  const [lightMode, setLightMode] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const moreContainerRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDialogElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);

  const moreMenuId = useId();
  const drawerId = useId();

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

  const closeMobileDrawer = useCallback(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !drawer.open) {
      setMobileDrawerOpen(false);
      return;
    }
    if (scroller && scroller.offsetWidth > 0) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: "auto" });
      // Fallback safety close in case reduced motion or hidden layout skips observer
      window.setTimeout(() => {
        if (drawer.open && scroller.scrollLeft >= scroller.offsetWidth * 0.6) {
          drawer.close();
          setMobileDrawerOpen(false);
        }
      }, 280);
    } else {
      drawer.close();
      setMobileDrawerOpen(false);
    }
  }, []);

  const openMobileDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer) return;
    if (!drawer.open) {
      drawer.showModal();
    }
    setMobileDrawerOpen(true);

    if (scroller) {
      const supportsInitialTarget =
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        CSS.supports("scroll-initial-target", "nearest");
      if (!supportsInitialTarget) {
        scroller.scrollTo({
          left: scroller.offsetWidth,
          behavior: "instant" as ScrollBehavior,
        });
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      }
      scroller.scrollTo({ left: 0, behavior: "auto" });
    }
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMoreOpen(false);
    if (drawerRef.current?.open) {
      drawerRef.current.close();
    }
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Close desktop "More" dropdown on outside click or Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onDocPointer = (e: MouseEvent) => {
      if (
        moreContainerRef.current &&
        !moreContainerRef.current.contains(e.target as Node)
      ) {
        setMoreOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  // IntersectionObserver + scroll backdrop fallback for mobile navigation drawer
  useEffect(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(320, window.innerWidth);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry || !drawer.open) return;
        if (entry.intersectionRatio < visibleThreshold) {
          drawer.close();
          setMobileDrawerOpen(false);
        } else if (entry.intersectionRatio >= 0.98) {
          setMobileDrawerOpen(true);
        }
      },
      { root: drawer, threshold: [visibleThreshold, 0.98, 1] }
    );
    observer.observe(sheet);

    const supportsScrollTimeline =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: scroll()");

    const onScroll = () => {
      if (sheet.offsetWidth > 0) {
        const ratio = Math.max(
          0,
          Math.min(1, 1 - scroller.scrollLeft / sheet.offsetWidth)
        );
        drawer.style.setProperty("--drawer-backdrop", String(ratio));
      }
    };

    if (!supportsScrollTimeline) {
      scroller.addEventListener("scroll", onScroll, { passive: true });
    }

    const onCancel = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
        closeMobileDrawer();
      }
    };

    const onNativeClose = () => {
      drawer.returnValue = "";
      setMobileDrawerOpen(false);
    };

    drawer.addEventListener("cancel", onCancel);
    drawer.addEventListener("close", onNativeClose);

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      drawer.removeEventListener("cancel", onCancel);
      drawer.removeEventListener("close", onNativeClose);
    };
  }, [closeMobileDrawer]);

  const toggleTheme = () => {
    const nextMode = lightMode ? "dark" : "light";
    applyThemeToDom(nextMode, true);
  };

  const primaryLinks = [
    {
      href: "/",
      label: "All Graphs",
      icon: Compass,
      match: (p: string) => p === "/",
    },
    {
      href: "/lev",
      label: "LEV & Pace of Aging",
      icon: Activity,
      match: (p: string) => p.startsWith("/lev"),
    },
    {
      href: "/scenarios/ai-2050",
      label: "AI 2050",
      icon: GitBranch,
      match: (p: string) =>
        p === "/scenarios/ai-2050" || p.startsWith("/scenarios/ai-2050/n/"),
    },
    {
      href: "/scenarios/nature-of-reality",
      label: "Nature of Reality",
      icon: Compass,
      match: (p: string) => p.startsWith("/scenarios/nature-of-reality"),
    },
    {
      href: "/scenarios/ai-2027",
      label: "AI 2027",
      icon: GitBranch,
      match: (p: string) =>
        p === "/scenarios/ai-2027" || p.startsWith("/scenarios/ai-2027/n/"),
    },
    {
      href: "/agents",
      label: "Agents",
      icon: Bot,
      match: (p: string) => p.startsWith("/agents"),
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      match: (p: string) =>
        p.startsWith("/leaderboard") ||
        p.startsWith("/q/") ||
        p.startsWith("/u/"),
    },
  ];

  const secondaryLinks = [
    {
      href: "/scenarios/ai-2040",
      label: "AI 2040 Map",
      icon: GitBranch,
      match: (p: string) =>
        p === "/scenarios/ai-2040" || p.startsWith("/scenarios/ai-2040/n/"),
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
  const activeMobileBadge =
    primaryLinks.find((item) => item.match(pathname))?.label ||
    secondaryLinks.find((item) => item.match(pathname))?.label ||
    "Graphs";

  if (pathname.startsWith("/embed")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-2 px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <a
              href="https://www.agifutures.org"
              className="hidden xl:inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors shrink-0"
              title="Return to AGI Futures"
            >
              <span>← AGI Futures</span>
            </a>

            <Link href="/" className="flex items-center gap-2 group min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-sky-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold tracking-tight text-slate-100 text-sm sm:text-base truncate">
                  FutureGraph
                </span>
                <span className="inline-block lg:hidden rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300 truncate max-w-[110px] sm:max-w-[160px]">
                  {activeMobileBadge}
                </span>
              </div>
            </Link>

            {/* Desktop Inline Primary Navigation (lg+) */}
            <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
              {primaryLinks.map((item) => {
                const Icon = item.icon;
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Accessible button-triggered submenu for secondary tools */}
              <div ref={moreContainerRef} className="relative">
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  aria-controls={moreMenuId}
                  onClick={() => setMoreOpen((prev) => !prev)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSecondaryActive
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <span>More</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 opacity-80 transition-transform ${
                      moreOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {moreOpen && (
                  <ul
                    id={moreMenuId}
                    className="absolute left-0 mt-1.5 w-52 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl z-50 space-y-0.5"
                  >
                    {secondaryLinks.map((item) => {
                      const Icon = item.icon;
                      const active = item.match(pathname);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                              active
                                ? "bg-amber-500/15 text-amber-300 font-semibold"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <AuthNavButton />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                lightMode ? "Switch to dark theme" : "Switch to light theme"
              }
              title={
                lightMode ? "Switch to dark theme" : "Switch to light theme"
              }
              className="inline-flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
            >
              {lightMode ? (
                <>
                  <Moon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            {/* Mobile & Tablet Menu Button (< lg) */}
            <button
              type="button"
              aria-expanded={mobileDrawerOpen}
              aria-controls={drawerId}
              onClick={openMobileDrawer}
              className="inline-flex lg:hidden items-center justify-center gap-1.5 min-h-[38px] rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 text-xs font-bold text-amber-200 hover:bg-amber-500/25 transition-colors"
            >
              <Menu className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Native <dialog> + CSS Scroll-Snap Swipeable Mobile Navigation Drawer */}
      <dialog
        id={drawerId}
        ref={drawerRef}
        aria-label="Site navigation"
        className="fg-mobile-nav-drawer"
        onClick={(e) => {
          if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
            closeMobileDrawer();
          }
        }}
      >
        <div ref={scrollerRef} className="fg-drawer-scroller">
          <nav
            ref={sheetRef}
            aria-label="Mobile primary navigation"
            className="fg-drawer-sheet border-r border-slate-800 bg-slate-950 text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">
                    FutureGraph
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Forecast Graphs &amp; Agents
                  </div>
                </div>
              </div>

              <button
                type="button"
                autoFocus
                onClick={closeMobileDrawer}
                aria-label="Close navigation menu"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-3 space-y-4 overflow-y-auto">
              <div>
                <div className="px-2 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Forecast Graphs &amp; Directory
                </div>
                <ul className="space-y-1">
                  {primaryLinks.map((item) => {
                    const Icon = item.icon;
                    const active = item.match(pathname);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            active
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "text-slate-200 hover:bg-slate-900"
                          }`}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0 text-amber-400"
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <div className="px-2 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Scenario Tools &amp; Governance
                </div>
                <ul className="space-y-1">
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon;
                    const active = item.match(pathname);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                              : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0 text-sky-400"
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <a
                  href="https://www.agifutures.org"
                  className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
                >
                  <ArrowLeft className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span>Return to AGI Futures (agifutures.org)</span>
                </a>
              </div>
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}
