"use client";

import React, { useCallback, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { ShareStudio } from "@/components/ShareStudio";
import { apiPath } from "@/lib/paths";
import type { WorldviewOutcome, WorldviewSnapshot } from "@/types/futuregraph";

interface WorldviewShareButtonProps {
  scenarioSlug: WorldviewSnapshot["scenarioSlug"];
  scenarioTitle: string;
  headline: string;
  outcomes: WorldviewOutcome[];
  className?: string;
  label?: string;
}

/** Locks the current multi-branch worldview into a receipt-backed snapshot and opens the share studio. */
export function WorldviewShareButton({ scenarioSlug, scenarioTitle, headline, outcomes, className, label }: WorldviewShareButtonProps) {
  const { forecaster, openSignIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WorldviewSnapshot | null>(null);
  const [open, setOpen] = useState(false);

  const create = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiPath("/v1/worldviews"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioSlug, headline, outcomes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save worldview");
      setSnapshot(data.worldview);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save worldview");
    } finally {
      setBusy(false);
    }
  }, [scenarioSlug, headline, outcomes]);

  const onClick = () => {
    if (!forecaster) {
      openSignIn({
        reason: `Sign in to lock in and share your ${scenarioTitle} worldview.`,
        onSuccess: () => void create(),
      });
      return;
    }
    void create();
  };

  const top = [...outcomes].sort((a, b) => b.probability - a.probability)[0];

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={
          className ||
          "inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-60 keep-white"
        }
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Share2 className="h-3.5 w-3.5" aria-hidden="true" />}
        <span className="text-slate-950">{label || "Lock in & share my worldview"}</span>
      </button>
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-rose-300">
          {error}
        </p>
      )}
      {snapshot && (
        <ShareStudio
          open={open}
          onClose={() => setOpen(false)}
          title="Your worldview is locked in"
          subtitle={`${scenarioTitle} · receipt ${snapshot.receiptId}`}
          mode="worldview"
          cardParams={{ worldviewId: snapshot.id }}
          sharePath={`/w/${snapshot.id}`}
          shareText={`My ${scenarioTitle} worldview${top ? `: ${top.label} at ${Math.round(top.probability * 100)}%` : ""}. Where do you think we're headed?`}
        />
      )}
    </>
  );
}
