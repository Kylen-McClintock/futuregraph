"use client";

import React, { useId, useMemo } from "react";
import { Flame, Lock, TrendingDown, TrendingUp } from "lucide-react";
import {
  CONFIDENCE_MAX,
  CONFIDENCE_MIN,
  PROVISIONAL_CONFIDENCE_CAP,
  VERIFIED_MIN_RESOLVED_OVERALL,
  computeProjectedReputationDelta,
  confidenceLabel,
  formatSignedRp,
} from "@/lib/reputation-engine";

interface ReputationImpactMeterProps {
  probability: number;
  crowdProbability: number;
  crowdIsDefault: boolean;
  confidence: number;
  onConfidenceChange: (value: number) => void;
  currentRp: number;
  isVerified: boolean;
  resolvedCount: number;
  horizonDecay: number;
  scorable: boolean;
  categoryLabel: string;
  categoryColor: string;
  signedIn: boolean;
}

const BAR_SCALE_RP = 400;

export function ReputationImpactMeter({
  probability,
  crowdProbability,
  crowdIsDefault,
  confidence,
  onConfidenceChange,
  currentRp,
  isVerified,
  resolvedCount,
  horizonDecay,
  scorable,
  categoryLabel,
  categoryColor,
  signedIn,
}: ReputationImpactMeterProps) {
  const sliderId = useId();
  const maxConfidence = isVerified ? CONFIDENCE_MAX : PROVISIONAL_CONFIDENCE_CAP;
  const preview = useMemo(
    () =>
      computeProjectedReputationDelta({
        probability,
        crowdProbability,
        confidenceMultiplier: confidence,
        currentRp,
        isVerified,
        horizonDecay,
      }),
    [probability, crowdProbability, confidence, currentRp, isVerified, horizonDecay]
  );

  if (!scorable) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
        <strong className="text-slate-100">Unscored milestone.</strong> This node is an authored scenario beat, so your forecast is sealed on the
        ledger and shareable but won&apos;t move your Reputation. Operationalized questions and near-term checkpoints are scored.
      </div>
    );
  }

  const sliderValue = Math.round(Math.min(confidence, maxConfidence) * 100);
  const fillPct = ((sliderValue - CONFIDENCE_MIN * 100) / (maxConfidence * 100 - CONFIDENCE_MIN * 100)) * 100;
  const yesWidth = Math.min(100, (Math.abs(preview.deltaIfYes) / BAR_SCALE_RP) * 100);
  const noWidth = Math.min(100, (Math.abs(preview.deltaIfNo) / BAR_SCALE_RP) * 100);
  const edgePts = Math.round(preview.edgeVsCrowd * 100);
  const multiple = probability >= crowdProbability ? probability / crowdProbability : (1 - probability) / (1 - crowdProbability);
  const label = confidenceLabel(preview.effectiveMultiplier);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Reputation at stake</span>
        <span
          className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ borderColor: `${categoryColor}66`, color: categoryColor, backgroundColor: `${categoryColor}1a` }}
        >
          {categoryLabel} · <span className="tabular-nums">{currentRp.toLocaleString("en-US")} RP</span>
          {!signedIn && " (new forecaster)"}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={sliderId} className="flex items-center gap-1.5 text-xs text-slate-300">
            <Flame className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Confidence wager
          </label>
          <span className="text-sm font-extrabold text-white tabular-nums">
            {preview.effectiveMultiplier.toFixed(2)}× <span className="text-xs font-semibold text-amber-300">{label}</span>
          </span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={CONFIDENCE_MIN * 100}
          max={maxConfidence * 100}
          step={5}
          value={sliderValue}
          aria-valuetext={`${preview.effectiveMultiplier.toFixed(2)} times, ${label}`}
          style={{ "--control-value": `${fillPct}%` } as React.CSSProperties}
          onChange={(e) => onConfidenceChange(Number(e.target.value) / 100)}
          className="fg-wager-slider mt-1"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0.25× exploratory</span>
          <span>1× standard</span>
          <span>{isVerified ? "3× signature call" : "1.5× cap"}</span>
        </div>
        {!isVerified && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Up to 3× unlocks once you&apos;re Verified ({Math.min(resolvedCount, VERIFIED_MIN_RESOLVED_OVERALL)}/{VERIFIED_MIN_RESOLVED_OVERALL} resolved calls).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" aria-live="polite">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              If YES
            </span>
            <span className="font-mono tabular-nums">{formatSignedRp(preview.deltaIfYes)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`fg-rp-bar h-full rounded-full ${preview.deltaIfYes >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
              style={{ inlineSize: `${Math.max(2, yesWidth)}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-slate-300 tabular-nums">
            {currentRp.toLocaleString("en-US")} → <strong className="text-white">{preview.newRpIfYes.toLocaleString("en-US")} RP</strong>
          </div>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-300">
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              If NO
            </span>
            <span className="font-mono tabular-nums">{formatSignedRp(preview.deltaIfNo)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`fg-rp-bar h-full rounded-full ${preview.deltaIfNo >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
              style={{ inlineSize: `${Math.max(2, noWidth)}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-slate-300 tabular-nums">
            {currentRp.toLocaleString("en-US")} → <strong className="text-white">{preview.newRpIfNo.toLocaleString("en-US")} RP</strong>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Crowd {crowdIsDefault ? "(no forecasts yet, 50% default)" : "consensus"}{" "}
        <span className="font-mono text-sky-300 tabular-nums">{Math.round(crowdProbability * 100)}%</span> · you{" "}
        <span className="font-mono text-amber-300 tabular-nums">{Math.round(probability * 100)}%</span>
        {Math.abs(edgePts) >= 3 ? (
          <>
            {" "}
            — you&apos;re {edgePts > 0 ? "bullish" : "bearish"} by {Math.abs(edgePts)} pts ({multiple.toFixed(1)}× the crowd&apos;s odds on your side).
            Long-shot calls that hit pay the most.
          </>
        ) : (
          <> — riding the consensus earns little if right and costs more if the crowd is wrong.</>
        )}
        {horizonDecay < 0.999 && (
          <span className="block text-amber-300">
            Late entry: close date is near, so this forecast carries {Math.round(horizonDecay * 100)}% weight (anti-sniping).
          </span>
        )}
      </p>
    </div>
  );
}
