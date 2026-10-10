"use client";

import React from "react";
import { Sparkles, Compass, CheckCircle2, Bookmark } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { EmotionalSeason } from "@/types/insights";

interface EmotionalSeasonsProps {
  season: EmotionalSeason | null;
  loading?: boolean;
}

export default function EmotionalSeasons({ season, loading }: EmotionalSeasonsProps) {
  const { isLight } = useTheme();

  if (loading || !season) {
    return (
      <div
        className={`h-40 rounded-3xl border p-6 animate-pulse ${
          isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
        }`}
      />
    );
  }

  const seasonTitle = season.season_title || "Building Stability";
  const whyNarrative = season.why_this_season || "Your sanctuary journey is beginning to take root quietly.";
  const evidenceList = season.evidence_summary && season.evidence_summary.length > 0
    ? season.evidence_summary
    : [
        "Consistent returns to acknowledge feelings without pressure or streaks.",
        "Deliberate buffers established between demands and rest.",
        "Space entries honoring honest thoughts on both lighter and heavier days.",
      ];

  return (
    <section aria-labelledby="emotional-seasons-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="text-violet-500" />
          <h2
            id="emotional-seasons-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Emotional Season
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Longer themes • Beyond calendar months
        </span>
      </div>

      <div
        className={`rounded-3xl border p-6 sm:p-8 transition-all duration-250 space-y-5 ${
          isLight
            ? "bg-gradient-to-br from-amber-50/40 via-stone-50/90 to-violet-50/30 border-[#e7e5e4] shadow-xs"
            : "bg-gradient-to-br from-[#1a1b24] via-[#161720] to-[#1e1c28] border-violet-900/30 shadow-xs"
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-serif uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? "bg-amber-100/70 border-amber-200 text-amber-800"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}
            >
              Current Season
            </span>
          </div>

          <h3
            className={`text-xl sm:text-2xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {seasonTitle}
          </h3>

          <p
            className={`text-xs sm:text-sm font-serif leading-relaxed max-w-2xl ${
              isLight ? "text-stone-700" : "text-zinc-300"
            }`}
          >
            {whyNarrative}
          </p>
        </div>

        {/* Narrative & Evidence Breakdown */}
        <div className="space-y-2 pt-1 border-t border-stone-200/70 dark:border-zinc-800/70">
          <span
            className={`text-[11px] font-serif uppercase tracking-wider block font-semibold pt-2 ${
              isLight ? "text-stone-600" : "text-zinc-400"
            }`}
          >
            Observed Behaviors Shaping This Season
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {evidenceList.map((ev, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs font-serif leading-relaxed flex items-start gap-2 ${
                  isLight
                    ? "bg-white/80 border-stone-200/80 text-stone-700 shadow-xs"
                    : "bg-[#20222a]/80 border-[#2c2e3c] text-zinc-300 shadow-xs"
                }`}
              >
                <CheckCircle2 size={14} className="shrink-0 text-amber-500 mt-0.5" />
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
