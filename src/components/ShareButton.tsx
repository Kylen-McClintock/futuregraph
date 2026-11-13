"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareStudio, type ShareCardMode } from "@/components/ShareStudio";

interface ShareButtonProps {
  label: string;
  title: string;
  subtitle?: string;
  mode: ShareCardMode;
  cardParams: Record<string, string>;
  sharePath: string;
  shareText: string;
  attachEventId?: string;
  variant?: "primary" | "secondary";
}

/** Button that opens the Share Studio (for server-rendered pages). */
export function ShareButton({ label, variant = "primary", ...studio }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "primary"
            ? "inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-slate-200 keep-white"
            : "inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-amber-500/50"
        }
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span className={variant === "primary" ? "text-slate-950" : undefined}>{label}</span>
      </button>
      <ShareStudio open={open} onClose={() => setOpen(false)} {...studio} />
    </>
  );
}

/** Copy-to-clipboard button with an accessible status bubble (Modern Web Guidance: copy-button). */
export function CopyTextButton({ text, label, ariaLabel }: { text: string; label: string; ariaLabel?: string }) {
  const [status, setStatus] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setStatus("Copied");
          } catch {
            setStatus("Copy failed");
          }
          setTimeout(() => setStatus(""), 2000);
        }}
        className="inline-flex min-h-[24px] items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-amber-500/50"
      >
        {label}
      </button>
      <span role="status" className="fg-copy-status text-xs text-emerald-300">
        {status}
      </span>
    </span>
  );
}
