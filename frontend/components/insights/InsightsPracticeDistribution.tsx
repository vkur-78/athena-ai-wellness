"use client";

import React from "react";
import { RecentMoment } from "@/types/studio";

interface InsightsPracticeDistributionProps {
  practices: RecentMoment[];
  isLight?: boolean;
}

export default function InsightsPracticeDistribution({
  practices,
  isLight = false,
}: InsightsPracticeDistributionProps) {
  // Categorize real stored practice sessions
  const counts: Record<string, number> = {
    Breathing: 0,
    Grounding: 0,
    Reset: 0,
    Focus: 0,
    "Wind-down": 0,
    Relaxation: 0,
  };

  practices.forEach((p) => {
    const rawCat = (p.exercise_category || p.routine || p.practice_type || "").toUpperCase();
    if (rawCat.includes("BREATH")) counts["Breathing"] += 1;
    else if (rawCat.includes("GROUND")) counts["Grounding"] += 1;
    else if (rawCat.includes("RESET")) counts["Reset"] += 1;
    else if (rawCat.includes("FOCUS")) counts["Focus"] += 1;
    else if (rawCat.includes("WIND") || rawCat.includes("SLEEP") || rawCat.includes("EVENING")) counts["Wind-down"] += 1;
    else if (rawCat.includes("RELAX") || rawCat.includes("BODY")) counts["Relaxation"] += 1;
    else counts["Breathing"] += 1; // default fallback if unclassified
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div
        className={`p-6 sm:p-8 rounded-3xl border space-y-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200/90 shadow-sm"
            : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
          Practice Distribution
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
          No practices recorded yet. Take a moment in Studio whenever you need space.
        </p>
      </div>
    );
  }

  // Sort categories by frequency descending
  const sortedEntries = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section
      className={`p-6 sm:p-8 rounded-3xl border space-y-5 transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
            Practice Distribution
          </h2>
          <p className={`text-xs sm:text-sm ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
            What kind of practices you return to most often
          </p>
        </div>
        <span className="text-xs font-mono text-[#7C5CFF] font-semibold">
          {total} total {total === 1 ? "practice" : "practices"}
        </span>
      </div>

      {/* Horizontal Bar Breakdown */}
      <div className="space-y-3.5 pt-2">
        {sortedEntries.map(([category, count]) => {
          const pct = Math.round((count / total) * 100);

          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className={`font-medium ${isLight ? "text-stone-800" : "text-[#F8F7FF]"}`}>{category}</span>
                <span className={`font-mono ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
                  {count} <span className="opacity-60">({pct}%)</span>
                </span>
              </div>

              <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-white/[0.04]"}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#A78BFA] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
