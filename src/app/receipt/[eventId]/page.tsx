"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AuditReceipt } from "@/types/futuregraph";

export default function ReceiptVerifierPage({
  params,
}: {
  params: { eventId: string };
}) {
  const [data, setData] = useState<{
    receipt: AuditReceipt;
    verification: {
      verified: boolean;
      recomputedPayloadHash: string;
      recomputedChainHash: string;
      payloadMatches: boolean;
      chainMatches: boolean;
      limitationsDisclosure: string;
    };
  } | null>(null);
  const [tamperSimulated, setTamperSimulated] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/receipts/${encodeURIComponent(params.eventId)}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [params.eventId]);

  if (!data || !data.receipt) {
    return (
      <div className="mx-auto max-w-[1000px] p-8 text-sm text-slate-400">
        Verifying SHA-256 Receipt {params.eventId}...
      </div>
    );
  }

  const { receipt, verification } = data;
  const isVerified = !tamperSimulated && verification.verified;

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 space-y-6">
      <div
        className={`rounded-2xl border-2 p-6 space-y-4 ${
          isVerified
            ? "border-emerald-500/50 bg-emerald-950/20"
            : "border-rose-500/60 bg-rose-950/30"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isVerified ? (
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-rose-400" />
            )}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                FutureGraph Cryptographic Audit Log
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {isVerified
                  ? "SHA-256 Receipt & Hash Chain Verified"
                  : "TAMPER DETECTED: Payload Hash Mismatch!"}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTamperSimulated((prev) => !prev)}
            className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25"
          >
            {tamperSimulated
              ? "Restore Original Canonical Payload"
              : "⚡ Simulate Payload Tampering (+1% Prob Mutation)"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-mono">
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-1">
            <div className="text-slate-400">Event / Receipt ID:</div>
            <div className="text-white font-bold">{receipt.eventId}</div>
            <div className="text-slate-400 pt-1">Contributor:</div>
            <Link
              href={`/u/${receipt.contributorHandle}`}
              className="text-sky-300 hover:underline block"
            >
              {receipt.contributorName} (@{receipt.contributorHandle})
            </Link>
            <div className="text-slate-400 pt-1">Server UTC Timestamp:</div>
            <div className="text-amber-300">{receipt.serverTimestamp}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-1 break-all">
            <div className="text-slate-400">Payload SHA-256 Commitment:</div>
            <div className="text-emerald-300">{receipt.payloadSha256}</div>
            <div className="text-slate-400 pt-1">Previous Receipt Chain Hash:</div>
            <div className="text-slate-300">
              {receipt.prevReceiptHash || "GENESIS_FUTUREGRAPH_AI2027_V1"}
            </div>
            <div className="text-slate-400 pt-1">Current Chain SHA-256 Hash:</div>
            <div
              className={
                isVerified ? "text-sky-300 font-bold" : "text-rose-400 font-bold"
              }
            >
              {tamperSimulated
                ? "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (MISMATCH)"
                : receipt.chainSha256}
            </div>
          </div>
        </div>

        {/* Canonical JSON Payload Inspector */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Deterministic Canonical JSON Payload (Sorted Keys):
          </div>
          <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200">
            {JSON.stringify(
              tamperSimulated
                ? {
                    ...receipt.canonicalPayload,
                    probability: 0.999,
                    _tamperedNote: "Unauthorized post-hoc edit attempt",
                  }
                : receipt.canonicalPayload,
              null,
              2
            )}
          </pre>
        </div>

        {/* Honest Cryptographic Limitations Disclosure (Spec Section 8.3) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300 flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">
              Cryptographic Verification &amp; Limitations Disclosure:{" "}
            </strong>
            {verification.limitationsDisclosure}
          </div>
        </div>
      </div>
    </div>
  );
}
