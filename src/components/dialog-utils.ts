"use client";

import { useEffect, type RefObject } from "react";

/** Spread onto <dialog> to enable native light-dismiss (Chrome/Edge/Firefox). */
export const LIGHT_DISMISS_ATTRS = { closedby: "any" } as unknown as Record<string, string>;

/**
 * Modern Web Guidance (light-dismiss-a-dialog): fallback for browsers without `closedby`
 * (Safari). Closes only when the press AND release both land outside the dialog box, so a text
 * selection drag that ends on the backdrop doesn't dismiss it.
 */
export function useLightDismissFallback(ref: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || typeof HTMLDialogElement === "undefined") return;
    if ("closedBy" in HTMLDialogElement.prototype) return;
    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const onDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) dialog.close();
    };
    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, [ref]);
}
