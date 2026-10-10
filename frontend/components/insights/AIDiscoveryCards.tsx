"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, ChevronDown, ChevronUp, Sun, Feather, Wind, Coffee, ShieldCheck, ArrowRight, Compass } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BehaviorPatternsResponse, BehaviorPatternCard } from "@/types/insights";

interface AIDiscoveryCardsProps {
  patternsData: BehaviorPatternsResponse | null;
}

interface DiscoveryDisplayItem {
  id: string;
  category: string;
  headline: string;
  oneSentence: string;
  confidenceBadge: string;
  icon: React.ReactNode;
  iconBg: string;
  supportingMoments: string[];
  suggestedExperiment: string;
}

export default React.memo(function AIDiscoveryCards({
  patternsData,
}: AIDiscoveryCardsProps) {
  const { isLight } = useTheme();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Convert pattern data into compact 4 discovery cards
  const discoveryCards: DiscoveryDisplayItem[] = useMemo(() => {
    const defaultCards: DiscoveryDisplayItem[] = [
      {
        id: "pattern-evening-calm",
        category: "Evening Rhythm",
        headline: "Evening Calm",
        oneSentence: "Your evenings consistently become lighter after stepping away from screens.",
        confidenceBadge: "Observed Rhythm",
        icon: <Sun size={15} className="text-amber-500 animate-pulse" style={{ animationDuration: "3.5s" }} />,
        iconBg: isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30",
        supportingMoments: [
          "Tension softens steadily by 8 PM on evenings accompanied by walking.",
          "Check-in reflections frequently note 'clarity' and 'ease' past dusk.",
        ],
        suggestedExperiment: "Protect a 15-minute screen-free buffer between ending work and preparing dinner.",
      },
      {
        id: "pattern-space-anchor",
        category: "Space Notebook",
        headline: "Writing Anchor",
        oneSentence: "Writing in your Space creates immediate emotional breathing room.",
        confidenceBadge: "Gentle Anchor",
        icon: <Feather size={15} className="text-violet-500 animate-bounce" style={{ animationDuration: "4s" }} />,
        iconBg: isLight ? "bg-violet-50 border-violet-200" : "bg-violet-950/40 border-violet-800/40",
        supportingMoments: [
          "Words written during crowded hours coincide with a tangible calm rebound.",
          "Journaling twice a week prevents multi-day emotional buildup.",
        ],
        suggestedExperiment: "Jot down three honest unfiltered sentences whenever you feel mentally crowded.",
      },
      {
        id: "pattern-nature-breath",
        category: "Sanctuary Studio",
        headline: "Nature Restoration",
        oneSentence: "Outdoor walking practices steadily lower your afternoon tension ratings.",
        confidenceBadge: "Restorative Pattern",
        icon: <Wind size={15} className="text-teal-500 animate-pulse" style={{ animationDuration: "3s" }} />,
        iconBg: isLight ? "bg-teal-50 border-teal-200" : "bg-teal-950/40 border-teal-800/40",
        supportingMoments: [
          "Walking meditation in Mountain Trail recorded steady completion.",
          "Gentler breathing pace noted in reflections following guided walks.",
        ],
        suggestedExperiment: "Pair your midday lunch break with 5 minutes of mindful steps in fresh air.",
      },
      {
        id: "pattern-midday-pause",
        category: "Gentle Boundary",
        headline: "Midday Pause",
        oneSentence: "A 2-minute breath before midday transitions prevents evening fatigue.",
        confidenceBadge: "Consistent Rhythm",
        icon: <Coffee size={15} className="text-indigo-400" />,
        iconBg: isLight ? "bg-indigo-50 border-indigo-200" : "bg-indigo-950/40 border-indigo-800/40",
        supportingMoments: [
          "Days with a 1:00 PM pause show noticeably less reported exhaustion at dusk.",
          "Consistency of daily check-ins is highest when anchored to a midday pause.",
        ],
        suggestedExperiment: "Take one slow, deep exhale before opening your afternoon calendar.",
      },
    ];

    if (!patternsData || !patternsData.patterns || patternsData.patterns.length === 0) {
      return defaultCards;
    }

    // Merge API patterns with visual formatting
    return patternsData.patterns.slice(0, 4).map((p, idx) => {
      const fallback = defaultCards[idx % defaultCards.length];
      return {
        id: p.id || `api-pattern-${idx}`,
        category: p.category || fallback.category,
        headline: p.title || fallback.headline,
        oneSentence: p.explanation || fallback.oneSentence,
        confidenceBadge: p.confidence_language || fallback.confidenceBadge,
        icon: fallback.icon,
        iconBg: fallback.iconBg,
        supportingMoments: p.supporting_moments && p.supporting_moments.length > 0 ? p.supporting_moments : fallback.supportingMoments,
        suggestedExperiment: p.suggested_experiment || fallback.suggestedExperiment,
      };
    });
  }, [patternsData, isLight]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs ${
              isLight
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <Compass size={13} />
          </div>
          <h3
            className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            What I&apos;m noticing
          </h3>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          One-sentence reflections • Tap &ldquo;Why?&rdquo; to expand
        </span>
      </div>

      {/* 4 Compact Discovery Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {discoveryCards.map((card) => {
          const isExpanded = !!expandedIds[card.id];

          return (
            <div
              key={card.id}
              className={`rounded-[20px] border p-5 sm:p-6 transition-all duration-[220ms] flex flex-col justify-between ${
                isLight
                  ? "bg-[#ffffff]/90 hover:bg-white border-[#e8e4dc] hover:border-stone-300 shadow-sm hover:shadow-md"
                  : "bg-[#181922]/90 hover:bg-[#20222a] border-[#252733] hover:border-[#383a48] shadow-md hover:shadow-lg"
              }`}
            >
              <div>
                {/* Header: Icon, Category & Confidence Badge */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-inherit">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs shadow-xs ${card.iconBg}`}
                    >
                      {card.icon}
                    </div>
                    <span
                      className={`text-[11px] font-serif uppercase tracking-wider font-medium ${
                        isLight ? "text-stone-600" : "text-zinc-300"
                      }`}
                    >
                      {card.headline}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] sm:text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
                      isLight
                        ? "bg-stone-100 border-stone-200 text-stone-600"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {card.confidenceBadge}
                  </span>
                </div>

                {/* Collapsed View: Exactly ONE Sentence */}
                <p
                  className={`text-xs sm:text-sm font-serif leading-relaxed mt-3.5 ${
                    isLight ? "text-stone-800" : "text-zinc-200"
                  }`}
                >
                  &ldquo;{card.oneSentence}&rdquo;
                </p>

                {/* Progressive Disclosure: Expanded Evidence on demand */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-inherit space-y-3 animate-sanctuary-pulse" style={{ animationIterationCount: 1 }}>
                    {/* Supporting Moments */}
                    <div className="space-y-1.5">
                      <span
                        className={`block text-[11px] uppercase tracking-wider font-serif font-medium ${
                          isLight ? "text-stone-500" : "text-zinc-400"
                        }`}
                      >
                        Observed Evidence
                      </span>
                      <ul className="space-y-1">
                        {card.supportingMoments.map((m, idx) => (
                          <li
                            key={idx}
                            className={`text-xs font-serif flex items-start gap-1.5 ${
                              isLight ? "text-stone-600" : "text-zinc-300"
                            }`}
                          >
                            <span className="text-violet-500 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Experiment */}
                    {card.suggestedExperiment && (
                      <div
                        className={`rounded-xl border p-2.5 text-xs font-serif ${
                          isLight
                            ? "bg-amber-50/70 border-amber-200/80 text-amber-900"
                            : "bg-amber-950/30 border-amber-800/30 text-amber-200"
                        }`}
                      >
                        <span className="font-semibold block mb-0.5">Gentle Experiment:</span>
                        <span>{card.suggestedExperiment}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action: "Why?" Button */}
              <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-inherit">
                <span
                  className={`text-[11px] font-serif ${
                    isLight ? "text-stone-400" : "text-zinc-500"
                  }`}
                >
                  {card.category}
                </span>

                <button
                  type="button"
                  onClick={() => toggleExpand(card.id)}
                  className={`inline-flex items-center gap-1 text-xs font-serif font-medium cursor-pointer transition-colors ${
                    isLight
                      ? "text-violet-700 hover:text-violet-900"
                      : "text-violet-400 hover:text-violet-300"
                  }`}
                >
                  <span>{isExpanded ? "Close" : "Why?"}</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
