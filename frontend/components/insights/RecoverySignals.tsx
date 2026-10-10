"use client";

import React from "react";
import { CheckCircle2, Sparkles, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecoverySignalsResponse, RecoverySignalItem } from "@/types/insights";

interface RecoverySignalsProps {
  signalsData: RecoverySignalsResponse | null;
  loading?: boolean;
}

export default function RecoverySignals({ signalsData, loading }: RecoverySignalsProps) {
  const { isLight } = useTheme();

  if (loading || !signalsData) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-3xl border p-5 sm:p-6 animate-pulse ${
              isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
            }`}
          >
            <div className="h-4 w-40 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-2" />
            <div className="h-5 w-3/4 bg-stone-300/40 dark:bg-zinc-700/40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const signals = signalsData.signals || [];

  if (signalsData.is_empty_state || signals.length === 0) {
    return (
      <section aria-labelledby="recovery-signals-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <h2
              id="recovery-signals-title"
              className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Recovery Signals
            </h2>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-6 sm:p-8 text-center space-y-3 ${
            isLight
              ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
              : "bg-[#181920] border-[#272834] shadow-xs"
          }`}
        >
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border text-sm ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
            }`}
          >
            <HelpCircle size={18} />
          </div>
          <h3
            className={`text-base font-serif font-semibold ${
              isLight ? "text-stone-900" : "text-zinc-100"
            }`}
          >
            We&apos;re still learning this rhythm
          </h3>
          <p
            className={`text-xs sm:text-sm font-serif max-w-md mx-auto leading-relaxed ${
              isLight ? "text-stone-500" : "text-zinc-400"
            }`}
          >
            Athena proves what helped rather than asserting generic advice. As you complete practices
            and check-ins, evidence-backed recovery signals will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="recovery-signals-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500" />
          <h2
            id="recovery-signals-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Recovery Signals
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Evidence-based proof • What actually helped
        </span>
      </div>

      <div className="space-y-3.5">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`rounded-3xl border p-5 sm:p-6 transition-all duration-250 space-y-3.5 ${
              isLight
                ? "bg-[#fdfbf7] hover:bg-white border-[#e7e5e4] hover:border-emerald-300/80 shadow-xs"
                : "bg-[#181920] hover:bg-[#1a1c24] border-[#272834] hover:border-emerald-800/40 shadow-xs"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                    isLight
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                  }`}
                >
                  <CheckCircle2 size={16} />
                </div>
                <h3
                  className={`text-base sm:text-lg font-serif font-semibold tracking-tight ${
                    isLight ? "text-stone-900" : "text-white"
                  }`}
                >
                  {signal.signal_text}
                </h3>
              </div>

              <span
                className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border shrink-0 ${
                  isLight
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-emerald-950/40 border-emerald-700/40 text-emerald-300"
                }`}
              >
                {signal.confidence} confidence
              </span>
            </div>

            {/* Evidence details */}
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-serif leading-relaxed ${
                isLight
                  ? "bg-white/70 border-stone-200/80 text-stone-700"
                  : "bg-[#20222a]/70 border-[#2b2d3a] text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1 text-[11px] uppercase tracking-wider">
                <Sparkles size={11} />
                <span>Observed Evidence</span>
              </div>
              <p>{signal.evidence}</p>
            </div>

            {/* Supporting moments */}
            {signal.supporting_moments && signal.supporting_moments.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-0.5">
                <span
                  className={`text-[11px] font-serif uppercase tracking-wider ${
                    isLight ? "text-stone-400" : "text-zinc-500"
                  }`}
                >
                  Verified on:
                </span>
                {signal.supporting_moments.map((m, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-serif border ${
                      isLight
                        ? "bg-stone-100 border-stone-200 text-stone-600"
                        : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400"
                    }`}
                  >
                    <Clock size={10} className="opacity-60" />
                    <span>{m}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
