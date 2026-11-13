"use client";

import { useCallback, useEffect, useState } from "react";

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export interface MobileGraphViewportState {
  /** Viewport narrow side or width < 768px */
  isMobile: boolean;
  /** Width < 640px */
  isSmallPhone: boolean;
  /** Current browser viewport is taller than wide (innerHeight > innerWidth) */
  isPortrait: boolean;
  /** Whether mobile Full Screen prefers horizontal/landscape presentation */
  preferHorizontalFullScreen: boolean;
  /** Toggle between Horizontal (Landscape) and Portrait while in mobile Full Screen */
  toggleHorizontalFullScreen: () => void;
  /**
   * True when Full Screen is active on a mobile device whose OS viewport is still
   * portrait (e.g. iOS Safari or OS Rotation Lock ON), activating CSS 90deg landscape shell.
   * Automatically becomes false if the OS itself rotates into native landscape!
   */
  isRotatedCssLandscape: boolean;
  /** Maps screen-space pointer/touch deltas (clientX/Y) into graph-local (dx, dy) */
  mapScreenDelta: (
    dxScreen: number,
    dyScreen: number
  ) => { dx: number; dy: number };
  /** Maps screen-space clientX/clientY into normalized [0, 1] coordinates on the graph element */
  mapScreenPointToRelative: (
    clientX: number,
    clientY: number,
    rect: DOMRect
  ) => { relX: number; relY: number };
}

export function useMobileGraphViewport(
  isFullScreen: boolean
): MobileGraphViewportState {
  const [viewport, setViewport] = useState<{
    isMobile: boolean;
    isSmallPhone: boolean;
    isPortrait: boolean;
  }>({
    isMobile: false,
    isSmallPhone: false,
    isPortrait: false,
  });

  const [preferHorizontalFullScreen, setPreferHorizontalFullScreen] =
    useState(true);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const shortestEdge = Math.min(w, h);
      setViewport({
        isMobile: w < 768 || shortestEdge < 540,
        isSmallPhone: w < 640,
        isPortrait: h > w,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Reset preference to Horizontal whenever newly entering Full Screen on mobile,
  // and progressively attempt Screen Orientation API lock where supported (e.g. Android Chrome).
  useEffect(() => {
    if (!isFullScreen) {
      try {
        const orientationApi = screen.orientation as ScreenOrientation & {
          unlock?: () => void;
        };
        orientationApi?.unlock?.();
      } catch {
        // Ignore on browsers that restrict orientation unlock
      }
      return;
    }

    if (viewport.isMobile && preferHorizontalFullScreen) {
      try {
        const orientationApi = screen.orientation as ScreenOrientation & {
          lock?: (mode: string) => Promise<void>;
        };
        orientationApi?.lock?.("landscape")?.catch?.(() => {
          // Expected on iOS Safari / desktop / non-fullscreen documents;
          // CSS .fg-mobile-landscape-shell handles horizontal display seamlessly.
        });
      } catch {
        // Ignore unsupported orientation lock
      }
    } else if (viewport.isMobile && !preferHorizontalFullScreen) {
      try {
        const orientationApi = screen.orientation as ScreenOrientation & {
          unlock?: () => void;
        };
        orientationApi?.unlock?.();
      } catch {
        // Ignore
      }
    }
  }, [isFullScreen, viewport.isMobile, preferHorizontalFullScreen]);

  const toggleHorizontalFullScreen = useCallback(() => {
    setPreferHorizontalFullScreen((prev) => !prev);
  }, []);

  const isRotatedCssLandscape =
    isFullScreen &&
    viewport.isMobile &&
    viewport.isPortrait &&
    preferHorizontalFullScreen;

  const mapScreenDelta = useCallback(
    (dxScreen: number, dyScreen: number) => {
      if (isRotatedCssLandscape) {
        // Container is rotated +90deg clockwise:
        // Local +X (right) = Screen +Y (down); Local +Y (down) = Screen -X (left).
        return { dx: dyScreen, dy: -dxScreen };
      }
      return { dx: dxScreen, dy: dyScreen };
    },
    [isRotatedCssLandscape]
  );

  const mapScreenPointToRelative = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      if (isRotatedCssLandscape) {
        const relX = clamp01((clientY - rect.top) / Math.max(1, rect.height));
        const relY = clamp01((rect.right - clientX) / Math.max(1, rect.width));
        return { relX, relY };
      }
      const relX = clamp01((clientX - rect.left) / Math.max(1, rect.width));
      const relY = clamp01((clientY - rect.top) / Math.max(1, rect.height));
      return { relX, relY };
    },
    [isRotatedCssLandscape]
  );

  return {
    isMobile: viewport.isMobile,
    isSmallPhone: viewport.isSmallPhone,
    isPortrait: viewport.isPortrait,
    preferHorizontalFullScreen,
    toggleHorizontalFullScreen,
    isRotatedCssLandscape,
    mapScreenDelta,
    mapScreenPointToRelative,
  };
}
