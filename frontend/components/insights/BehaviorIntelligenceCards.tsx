"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Compass, Sparkles, Clock, ArrowRight, Shield } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BehaviorPatternsResponse, BehaviorPatternCard } from "@/types/insights";

interface BehaviorIntelligenceCardsProps {
  patternsData: BehaviorPatternsResponse | null;
  loading?: boolean;
}

export default function BehaviorIntelligenceCards({
  patternsData,
  loading,
}: BehaviorIntelligenceCardsProps) {
  const { isLight } = useTheme();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading || !patternsData) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-3xl border p-5 sm:p-6 animate-pulse ${
              isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
            }`}
          >
            <div className="h-4 w-32 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-2" />
            <div className="h-6 w-3/4 bg-stone-300/40 dark:bg-zinc-700/40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const patterns = patternsData.patterns || [];

  if (patternsData.is_empty_state || patterns.length === 0) {
    return (
      <section aria-labelledby="behavioral-intelligence-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-violet-500" />
            <h2
              id="behavioral-intelligence-title"
              className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              What I&apos;m noticing
            </h2>
          </div>
        </div>

        <div
          className={`rounded-[20px] border p-6 sm:p-8 text-center space-y-3 transition-all duration-[220ms] ${
            isLight
              ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
              : "bg-[#181920] border-[#272834] shadow-xs"
          }`}
        >
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-[12px] border text-sm ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-amber-950/40 border-amber-800/40 text-amber-300"
            }`}
          >
            <Sparkles size={18} />
          </div>
          <h3
            className={`text-base font-serif font-semibold ${
              isLight ? "text-stone-900" : "text-zinc-100"
            }`}
          >
            I&apos;m still learning this rhythm
          </h3>
          <p
            className={`text-xs sm:text-sm font-serif max-w-md mx-auto leading-relaxed ${
              isLight ? "text-stone-500" : "text-zinc-400"
            }`}
          >
            Your first few days help Athena learn your unique rhythm. As check-ins, Studio sessions,
            and Space entries grow, gentle reflections will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="behavioral-intelligence-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-violet-500" />
          <h2
            id="behavioral-intelligence-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            What I&apos;m noticing
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          {patterns.length} verified {patterns.length === 1 ? "pattern" : "patterns"}
        </span>
      </div>

      <div className="space-y-3.5">
        {patterns.map((pattern) => {
          const isExpanded = !!expandedIds[pattern.id];

          return (
            <div
              key={pattern.id}
              className={`rounded-3xl border transition-all duration-250 overflow-hidden ${
                isLight
                  ? "bg-[#fdfbf7] hover:bg-white border-[#e7e5e4] hover:border-stone-300 shadow-xs"
                  : "bg-[#181920] hover:bg-[#1f202a] border-[#272834] hover:border-[#3a3c4c] shadow-xs"
              }`}
            >
              {/* Card Header (Always Visible) */}
              <button
                type="button"
                onClick={() => toggleExpand(pattern.id)}
                aria-expanded={isExpanded}
                className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`text-[11px] font-serif uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isLight
                          ? "bg-stone-100 border-stone-200 text-stone-600"
                          : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {pattern.category}
                    </span>
                    <span
                      className={`text-xs font-serif italic ${
                        isLight ? "text-violet-700" : "text-violet-300"
                      }`}
                    >
                      • {pattern.confidence_language}
                    </span>
                  </div>

                  <h3
                    className={`text-base sm:text-lg font-serif font-semibold tracking-tight ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {pattern.title}
                  </h3>
                </div>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  } ${
                    isLight
                      ? "border-stone-200 bg-stone-100 text-stone-600"
                      : "border-zinc-700/60 bg-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <ChevronDown size={15} />
                </div>
              </button>

              {/* Smooth Inline Expansion Details (NO MODAL) */}
              {isExpanded && (
                <div
                  className={`px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t space-y-4 animate-in fade-in duration-200 ${
                    isLight ? "border-stone-200/70" : "border-zinc-800/70"
                  }`}
                >
                  {/* Why I Noticed This */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-serif font-medium uppercase tracking-wider text-violet-500">
                      <Sparkles size={12} />
                      <span>Why I noticed this</span>
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-serif leading-relaxed ${
                        isLight ? "text-stone-700" : "text-zinc-300"
                      }`}
                    >
                      {pattern.explanation}
                    </p>
                  </div>

                  {/* Supporting Moments */}
                  {pattern.supporting_moments && pattern.supporting_moments.length > 0 && (
                    <div className="space-y-1.5">
                      <span
                        className={`text-[11px] font-serif uppercase tracking-wider block ${
                          isLight ? "text-stone-500" : "text-zinc-400"
                        }`}
                      >
                        Supporting Moments
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {pattern.supporting_moments.map((moment, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-serif border ${
                              isLight
                                ? "bg-stone-100 border-stone-200 text-stone-700"
                                : "bg-zinc-800/70 border-zinc-700/50 text-zinc-300"
                            }`}
                          >
                            <Clock size={11} className="text-stone-400" />
                            <span>{moment}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gentle Experiment */}
                  {pattern.suggested_experiment && (
                    <div
                      className={`rounded-2xl p-3.5 border ${
                        isLight
                          ? "bg-amber-50/60 border-amber-200/80 text-amber-900"
                          : "bg-amber-950/20 border-amber-800/30 text-amber-200"
                      }`}
                    >
                      <span className="text-[11px] font-serif uppercase tracking-wider block font-semibold mb-1 text-amber-700 dark:text-amber-300">
                        Gentle Experiment
                      </span>
                      <p className="text-xs sm:text-sm font-serif leading-relaxed">
                        {pattern.suggested_experiment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
