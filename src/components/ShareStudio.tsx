"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ImageIcon, Link2, Loader2 } from "lucide-react";
import { apiPath, withBasePath } from "@/lib/paths";
import { LIGHT_DISMISS_ATTRS, useLightDismissFallback } from "@/components/dialog-utils";
import { XLogo } from "@/components/AuthContext";

export type ShareCardMode = "forecast" | "victory" | "scorecard" | "worldview";

interface ShareStudioProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  mode: ShareCardMode;
  /** Card query params, e.g. { eventId } | { handle } | { worldviewId }. */
  cardParams: Record<string, string>;
  /** Share landing path relative to basePath (e.g. /f/fe-123) — unfurls the 16:9 card on X. */
  sharePath: string;
  shareText: string;
  /** When set, shows "Link your X post" for this forecast event. */
  attachEventId?: string;
}

function useCopyFeedback() {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const last = useRef("");
  const report = (text: string) => {
    clearTimeout(timer.current);
    // VoiceOver skips identical consecutive announcements; vary with a no-break space.
    const next = text === last.current ? `${text}\u00A0` : text;
    last.current = next;
    setMessage("");
    requestAnimationFrame(() => setMessage(next));
    timer.current = setTimeout(() => setMessage(""), 2400);
  };
  return { message, report };
}

export function ShareStudio({
  open,
  onClose,
  title,
  subtitle,
  mode,
  cardParams,
  sharePath,
  shareText,
  attachEventId,
}: ShareStudioProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useLightDismissFallback(dialogRef);
  const titleId = useId();
  const [aspect, setAspect] = useState<"16x9" | "4x5">("16x9");
  const [cacheBust, setCacheBust] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { message, report } = useCopyFeedback();
  const [xPostUrl, setXPostUrl] = useState("");
  const [attachState, setAttachState] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setCacheBust(Date.now());
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const imageUrl = useMemo(() => {
    const qs = new URLSearchParams({ mode, aspect, ...cardParams, v: String(cacheBust) });
    return apiPath(`/og?${qs.toString()}`);
  }, [mode, aspect, cardParams, cacheBust]);

  useEffect(() => setImgLoaded(false), [imageUrl]);

  const absoluteShareUrl = typeof window !== "undefined" ? `${window.location.origin}${withBasePath(sharePath)}` : withBasePath(sharePath);
  const intentUrl = `https://x.com/intent/post?${new URLSearchParams({ text: shareText, url: absoluteShareUrl }).toString()}`;

  const copyImage = async () => {
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) throw new Error("unsupported");
      // Pass a Promise<Blob> so Safari keeps the user-activation for the clipboard write.
      const blob = fetch(imageUrl).then((r) => {
        if (!r.ok) throw new Error("render failed");
        return r.blob();
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      report("Image copied — paste it into your X post");
    } catch {
      report("Copy failed — use Download PNG instead");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteShareUrl);
      report("Link copied");
    } catch {
      report("Copy failed");
    }
  };

  const attachPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachEventId) return;
    setAttachState(null);
    const res = await fetch(apiPath(`/v1/forecasts/${encodeURIComponent(attachEventId)}/social-link`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xPostUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setAttachState(
      res.ok
        ? { tone: "ok", text: "Linked! Your receipt now points to your X post." }
        : { tone: "error", text: data.error || "Couldn't link that post." }
    );
  };

  const dims = aspect === "4x5" ? { w: 1080, h: 1350 } : { w: 1200, h: 630 };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...LIGHT_DISMISS_ATTRS}
      onClose={onClose}
      className="p-0 fg-dialog-wide"
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-extrabold text-white">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <form method="dialog">
            <button type="submit" className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-white">
              Close
            </button>
          </form>
        </div>

        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Card format</legend>
          {[
            { id: "16x9" as const, label: "16:9 link card", hint: "auto-unfurls on X" },
            { id: "4x5" as const, label: "4:5 mobile post", hint: "max feed reach" },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                aspect === opt.id ? "border-amber-500/60 bg-amber-500/15 text-amber-200" : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              <input
                type="radio"
                name={`${titleId}-aspect`}
                value={opt.id}
                checked={aspect === opt.id}
                onChange={() => setAspect(opt.id)}
                className="accent-amber-500"
              />
              <span>{opt.label}</span>
              <span className="font-normal text-slate-400">· {opt.hint}</span>
            </label>
          ))}
        </fieldset>

        <div
          className={`relative mx-auto overflow-hidden rounded-xl border border-slate-700 bg-slate-950 ${aspect === "4x5" ? "max-w-[340px]" : "w-full"}`}
          style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Rendering card…
            </div>
          )}
          {cacheBust > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              width={dims.w}
              height={dims.h}
              decoding="async"
              alt={`${title} — ${aspect === "4x5" ? "4:5" : "16:9"} share card preview`}
              onLoad={() => setImgLoaded(true)}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={intentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-200 keep-white"
          >
            <XLogo />
            <span className="text-slate-950">Post to X</span>
          </a>
          <button
            type="button"
            onClick={copyImage}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Copy image
          </button>
          <a
            href={imageUrl}
            download={`futuregraph-${mode}-${aspect}.png`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download PNG
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy link
          </button>
          <span role="status" className="fg-copy-status inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
            {message && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {message}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Tip: the link alone unfurls the 16:9 card on X. For maximum reach, paste the copied 4:5 image into your post and keep the link in the text.
        </p>

        {attachEventId && (
          <form onSubmit={attachPost} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
            <label htmlFor={`${titleId}-xpost`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Link2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              Posted it? Link your X post to this receipt (optional)
            </label>
            <div className="flex gap-2">
              <input
                id={`${titleId}-xpost`}
                type="url"
                inputMode="url"
                required
                value={xPostUrl}
                onChange={(e) => setXPostUrl(e.target.value)}
                placeholder="https://x.com/yourhandle/status/…"
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
              <button type="submit" className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400">
                Link post
              </button>
            </div>
            {attachState && (
              <p role={attachState.tone === "error" ? "alert" : "status"} className={`text-xs ${attachState.tone === "error" ? "text-rose-300" : "text-emerald-300"}`}>
                {attachState.text}
              </p>
            )}
          </form>
        )}
      </div>
    </dialog>
  );
}
