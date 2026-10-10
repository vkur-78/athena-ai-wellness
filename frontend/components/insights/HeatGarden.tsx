"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Flower2, Moon, Star, Wind, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TriggerHeatmapResponse, TriggerCategoryItem } from "@/types/insights";

interface HeatGardenProps {
  heatmapData: TriggerHeatmapResponse | null;
}

interface GardenStarNode {
  id: string;
  category: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  brightness: number; // 0.4 to 1
  color: string;
  glowColor: string;
  intensityLabel: string;
  recurrenceLabel: string;
  helpfulPractice: string;
  note: string;
}

export default React.memo(function HeatGarden({
  heatmapData,
}: HeatGardenProps) {
  const { isLight } = useTheme();
  const [activeStarId, setActiveStarId] = useState<string | null>(null);

  // Generate constellation star field from category items
  const starNodes: GardenStarNode[] = useMemo(() => {
    const rawCategories = heatmapData?.categories || [];

    const defaultNodes: GardenStarNode[] = [
      {
        id: "star-work",
        category: "Work & Deadlines",
        x: 22,
        y: 35,
        size: 16,
        brightness: 0.95,
        color: isLight ? "#f59e0b" : "#fbbf24",
        glowColor: "rgba(251, 191, 36, 0.45)",
        intensityLabel: "Moderate Tension",
        recurrenceLabel: "Seen on weekday afternoons",
        helpfulPractice: "Mountain Trail Walking",
        note: "Transitions between intense focus sessions benefit from an physical pause.",
      },
      {
        id: "star-sleep",
        category: "Sleep Rhythm",
        x: 68,
        y: 28,
        size: 13,
        brightness: 0.85,
        color: isLight ? "#8b5cf6" : "#a78bfa",
        glowColor: "rgba(167, 139, 250, 0.45)",
        intensityLabel: "Gentle Fluctuation",
        recurrenceLabel: "Late evening pattern",
        helpfulPractice: "Sleep Sanctuary Audio",
        note: "A 10-minute quiet buffer before bed helps prevent morning lethargy.",
      },
      {
        id: "star-conversations",
        category: "Deep Conversations",
        x: 45,
        y: 65,
        size: 11,
        brightness: 0.7,
        color: isLight ? "#0d9488" : "#2dd4bf",
        glowColor: "rgba(45, 212, 191, 0.35)",
        intensityLabel: "Emotional Processing",
        recurrenceLabel: "Occasional spikes",
        helpfulPractice: "Private Space Notebook",
        note: "Writing down honest thoughts clears mental clutter after draining chats.",
      },
      {
        id: "star-journal",
        category: "Space Contemplation",
        x: 78,
        y: 72,
        size: 14,
        brightness: 0.9,
        color: isLight ? "#10b981" : "#34d399",
        glowColor: "rgba(52, 211, 153, 0.4)",
        intensityLabel: "Grounding Anchor",
        recurrenceLabel: "Consistent recovery",
        helpfulPractice: "Daily Space Journal",
        note: "Unprompted journaling regularly produces immediate emotional relief.",
      },
      {
        id: "star-self-pressure",
        category: "Self-Expectation",
        x: 32,
        y: 78,
        size: 12,
        brightness: 0.75,
        color: isLight ? "#ec4899" : "#f472b6",
        glowColor: "rgba(244, 114, 182, 0.35)",
        intensityLabel: "Subtle Strain",
        recurrenceLabel: "Mid-week tendency",
        helpfulPractice: "Self-Compassion Studio",
        note: "Reminding yourself that 'doing enough' is acceptable softens self-criticism.",
      },
      {
        id: "star-stillness",
        category: "Sensory Pause",
        x: 52,
        y: 22,
        size: 10,
        brightness: 0.65,
        color: isLight ? "#38bdf8" : "#60a5fa",
        glowColor: "rgba(96, 165, 250, 0.3)",
        intensityLabel: "Restorative Stillness",
        recurrenceLabel: "Weekend morning sanctuary",
        helpfulPractice: "Bamboo Grove 5-4-3-2-1",
        note: "Connecting with sensory details in the room re-centers racing thoughts.",
      },
    ];

    if (rawCategories.length === 0) return defaultNodes;

    // Overlay API data onto nodes
    return defaultNodes.map((d, idx) => {
      const cat = rawCategories[idx];
      if (!cat) return d;
      const helpful = cat.helpful_practices?.[0]?.name || d.helpfulPractice;
      return {
        ...d,
        category: cat.category || d.category,
        intensityLabel: cat.intensity_label || d.intensityLabel,
        helpfulPractice: helpful,
        size: Math.max(9, Math.min(18, (cat.intensity_level || 2) * 4 + 4)),
      };
    });
  }, [heatmapData, isLight]);

  const activeStar = starNodes.find((s) => s.id === activeStarId) || starNodes[0];

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
        isLight
          ? "bg-[#fdfbf7]/90 border-stone-200/80 shadow-xs"
          : "bg-[#1a1b22]/90 border-[#292b36] shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <Flower2 size={16} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              The Heat Garden
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              A celestial constellation of recurring patterns • Brighter stars reflect frequent themes
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
            isLight
              ? "bg-white/80 border-stone-200 text-stone-600"
              : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
          }`}
        >
          {starNodes.length} patterns observed
        </span>
      </div>

      {/* Interactive Celestial Garden Canvas */}
      <div
        className={`relative h-56 sm:h-64 mt-5 rounded-[20px] border overflow-hidden select-none transition-colors ${
          isLight
            ? "bg-gradient-to-b from-[#f8f6f0] to-[#f2ede4] border-stone-200/70"
            : "bg-gradient-to-b from-[#13141a] to-[#0e0f14] border-[#252732]"
        }`}
      >
        {/* Soft background stardust noise grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${isLight ? "#78716c" : "#a1a1aa"} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Constellation Guide Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1="22%" y1="35%" x2="45%" y2="65%"
            stroke={isLight ? "rgba(120, 113, 108, 0.2)" : "rgba(161, 161, 170, 0.15)"}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="45%" y1="65%" x2="78%" y2="72%"
            stroke={isLight ? "rgba(120, 113, 108, 0.2)" : "rgba(161, 161, 170, 0.15)"}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="52%" y1="22%" x2="68%" y2="28%"
            stroke={isLight ? "rgba(120, 113, 108, 0.2)" : "rgba(161, 161, 170, 0.15)"}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Glowing Star Nodes */}
        {starNodes.map((star) => {
          const isSelected = star.id === activeStarId;

          return (
            <div
              key={star.id}
              onClick={() => setActiveStarId(star.id)}
              onMouseEnter={() => setActiveStarId(star.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group p-3"
              style={{ left: `${star.x}%`, top: `${star.y}%` }}
            >
              {/* Star Core */}
              <div
                className="relative rounded-full transition-transform group-hover:scale-130 duration-200"
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${star.size * 2}px ${star.glowColor}`,
                }}
              >
                {/* Breathing Star Aura */}
                <div
                  className="absolute -inset-1 rounded-full animate-ping opacity-30 pointer-events-none"
                  style={{
                    backgroundColor: star.color,
                    animationDuration: `${3 + (star.x % 3)}s`,
                  }}
                />
              </div>

              {/* Star Label pill */}
              <span
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-[10px] font-serif px-2 py-0.5 rounded-full border transition-all ${
                  isSelected
                    ? isLight
                      ? "bg-white text-stone-900 border-stone-300 font-semibold shadow-xs"
                      : "bg-[#20222a] text-zinc-100 border-[#383a48] font-semibold shadow-xs"
                    : "opacity-60 group-hover:opacity-100 text-stone-500 dark:text-zinc-400 bg-transparent border-transparent"
                }`}
              >
                {star.category}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Star Detail Popover */}
      {activeStar && (
        <div
          className={`mt-4 rounded-[20px] border p-4 transition-all duration-200 ${
            isLight
              ? "bg-white/95 border-stone-200 shadow-xs"
              : "bg-[#20222a]/95 border-[#323544] shadow-xs"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-inherit">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: activeStar.color }}
              />
              <span
                className={`text-xs sm:text-sm font-serif font-semibold ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {activeStar.category}
              </span>
              <span className="text-xs opacity-40">•</span>
              <span
                className={`text-xs font-serif ${
                  isLight ? "text-stone-600" : "text-zinc-300"
                }`}
              >
                {activeStar.intensityLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-serif text-teal-600 dark:text-teal-400">
              <Wind size={13} />
              <span>Remedy: {activeStar.helpfulPractice}</span>
            </div>
          </div>

          <p
            className={`text-xs font-serif mt-2 leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {activeStar.note}
          </p>
        </div>
      )}
    </div>
  );
});
