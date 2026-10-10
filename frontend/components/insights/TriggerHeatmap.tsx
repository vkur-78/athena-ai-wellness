"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Layers, Sparkles, Clock, BookOpen, ArrowRight, Wind, Feather } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TriggerHeatmapResponse, TriggerCategoryItem } from "@/types/insights";

interface TriggerHeatmapProps {
  heatmapData: TriggerHeatmapResponse | null;
  loading?: boolean;
}

export default function TriggerHeatmap({ heatmapData, loading }: TriggerHeatmapProps) {
  const { isLight } = useTheme();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  if (loading || !heatmapData) {
    return (
      <div
        className={`rounded-3xl border p-6 sm:p-8 animate-pulse ${
          isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
        }`}
      >
        <div className="h-4 w-36 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-stone-200/30 dark:bg-zinc-800/30 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const categories = heatmapData.categories || [];

  if (heatmapData.is_empty_state || categories.length === 0) {
    return (
      <section aria-labelledby="trigger-heatmap-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-violet-500" />
            <h2
              id="trigger-heatmap-title"
              className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Trigger Heatmap
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
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-zinc-800/60 border-zinc-700/50 text-zinc-300"
            }`}
          >
            <Layers size={18} />
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
            Your trigger rhythm heatmap will emerge as daily check-ins and Space entries grow.
            Athena maps recurring friction softly to guide your practices.
          </p>
        </div>
      </section>
    );
  }

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // Soft soothing colors for intensity levels 1 to 4 (Never alarming reds)
  const getSoftIntensityStyle = (level: number, isSelected: boolean) => {
    if (isLight) {
      switch (level) {
        case 4:
          return isSelected
            ? "bg-violet-100/90 border-violet-400 text-violet-950 shadow-xs"
            : "bg-violet-50/80 border-violet-200 text-violet-900 hover:border-violet-300";
        case 3:
          return isSelected
            ? "bg-amber-100/90 border-amber-400 text-amber-950 shadow-xs"
            : "bg-amber-50/80 border-amber-200 text-amber-900 hover:border-amber-300";
        case 2:
          return isSelected
            ? "bg-teal-100/90 border-teal-400 text-teal-950 shadow-xs"
            : "bg-teal-50/70 border-teal-200 text-teal-900 hover:border-teal-300";
        case 1:
        default:
          return isSelected
            ? "bg-stone-200/90 border-stone-400 text-stone-900 shadow-xs"
            : "bg-stone-100/70 border-stone-200 text-stone-700 hover:border-stone-300";
      }
    } else {
      switch (level) {
        case 4:
          return isSelected
            ? "bg-violet-950/70 border-violet-500 text-violet-200 shadow-xs"
            : "bg-violet-950/30 border-violet-800/40 text-violet-300 hover:border-violet-700/60";
        case 3:
          return isSelected
            ? "bg-amber-950/60 border-amber-500 text-amber-200 shadow-xs"
            : "bg-amber-950/20 border-amber-800/40 text-amber-300 hover:border-amber-700/60";
        case 2:
          return isSelected
            ? "bg-teal-950/60 border-teal-500 text-teal-200 shadow-xs"
            : "bg-teal-950/20 border-teal-800/40 text-teal-300 hover:border-teal-700/60";
        case 1:
        default:
          return isSelected
            ? "bg-zinc-800/80 border-zinc-500 text-zinc-200 shadow-xs"
            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700";
      }
    }
  };

  return (
    <section aria-labelledby="trigger-heatmap-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-violet-500" />
          <h2
            id="trigger-heatmap-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Trigger Heatmap
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Soft intensity • Tap category to inspect
        </span>
      </div>

      <div
        className={`rounded-3xl border p-5 sm:p-7 transition-all duration-250 ${
          isLight
            ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
            : "bg-[#181920] border-[#272834] shadow-xs"
        }`}
      >
        {/* Heatmap Category Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            const styleClass = getSoftIntensityStyle(cat.intensity_level, isSelected);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${styleClass}`}
              >
                <div>
                  <span className="text-xs font-serif font-semibold block tracking-tight">
                    {cat.category}
                  </span>
                  <span className="text-[11px] font-serif block opacity-80 mt-0.5">
                    {cat.intensity_label}
                  </span>
                </div>

                {/* Micro intensity bar (never harsh) */}
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full ${
                        step <= cat.intensity_level
                          ? isLight ? "bg-stone-600 dark:bg-stone-300" : "bg-violet-400"
                          : isLight ? "bg-stone-300/40" : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Deep Dive Panel */}
        {activeCategory && (
          <div
            className={`mt-5 p-5 sm:p-6 rounded-2xl border transition-all duration-200 space-y-4 ${
              isLight
                ? "bg-white/80 border-stone-200/90 shadow-xs"
                : "bg-[#20222b]/80 border-[#2e313f] shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-semibold text-stone-900 dark:text-white">
                  {activeCategory.category} Observations
                </span>
                <span
                  className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
                    isLight
                      ? "bg-stone-100 border-stone-200 text-stone-700"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {activeCategory.intensity_label}
                </span>
              </div>
            </div>

            {/* Supporting Moments */}
            {activeCategory.supporting_moments.length > 0 && (
              <div className="space-y-1.5">
                <span
                  className={`text-[11px] font-serif uppercase tracking-wider block ${
                    isLight ? "text-stone-500" : "text-zinc-400"
                  }`}
                >
                  Recorded Moments
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeCategory.supporting_moments.map((m, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-serif border ${
                        isLight
                          ? "bg-stone-100 border-stone-200 text-stone-700"
                          : "bg-zinc-800/70 border-zinc-700/50 text-zinc-300"
                      }`}
                    >
                      <Clock size={11} className="text-stone-400" />
                      <span>{m}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Journal Excerpts */}
            {activeCategory.journal_excerpts.length > 0 && (
              <div className="space-y-1.5">
                <span
                  className={`text-[11px] font-serif uppercase tracking-wider block ${
                    isLight ? "text-stone-500" : "text-zinc-400"
                  }`}
                >
                  Space Reflection Excerpt
                </span>
                <div
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-serif italic ${
                    isLight
                      ? "bg-[#faf8f5] border-stone-200/80 text-stone-700"
                      : "bg-[#181921] border-[#292b38] text-zinc-300"
                  }`}
                >
                  &ldquo;{activeCategory.journal_excerpts[0]}&rdquo;
                </div>
              </div>
            )}

            {/* Helpful Studio Practices */}
            {activeCategory.helpful_practices.length > 0 && (
              <div className="space-y-2 pt-1">
                <span
                  className={`text-[11px] font-serif uppercase tracking-wider block font-semibold ${
                    isLight ? "text-violet-900" : "text-violet-300"
                  }`}
                >
                  Recommended Recovery Practices
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {activeCategory.helpful_practices.map((p, idx) => (
                    <Link
                      key={idx}
                      href={p.type === "journal" ? "/journal" : p.type === "chat" ? "/chat" : "/studio"}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-serif font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                        isLight
                          ? "bg-white hover:bg-stone-50 border-stone-200 text-stone-800 shadow-xs"
                          : "bg-[#1a1b24] hover:bg-[#222430] border-violet-900/40 text-violet-200 shadow-xs"
                      }`}
                    >
                      {p.type === "journal" ? <Feather size={13} /> : <Wind size={13} />}
                      <span>{p.name}</span>
                      <ArrowRight size={11} className="opacity-60" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Note */}
        <p
          className={`mt-4 text-xs sm:text-sm font-serif italic text-center ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          {heatmapData.calming_summary}
        </p>
      </div>
    </section>
  );
}
