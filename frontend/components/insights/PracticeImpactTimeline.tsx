"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, Wind, Feather, Compass, MessageSquare, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { PracticeImpactResponse, PracticeImpactItem } from "@/types/insights";

interface PracticeImpactTimelineProps {
  impactData: PracticeImpactResponse | null;
}

interface ImpactBarItem {
  id: string;
  name: string;
  sessionsCompleted: number;
  averageRelief: string;
  recentImprovement: string;
  barPercentage: number;
  color: string;
  glowColor: string;
  icon: React.ReactNode;
}

export default React.memo(function PracticeImpactTimeline({
  impactData,
}: PracticeImpactTimelineProps) {
  const { isLight } = useTheme();
  const [activePracticeId, setActivePracticeId] = useState<string | null>(null);

  const practiceBars: ImpactBarItem[] = useMemo(() => {
    const rawPractices = impactData?.practices || [];

    const defaultBars: ImpactBarItem[] = [
      {
        id: "practice-breathing",
        name: "Guided Breathing",
        sessionsCompleted: 14,
        averageRelief: "+28% Calm",
        recentImprovement: "Immediate somatic deceleration across all 9 world sessions.",
        barPercentage: 92,
        color: isLight ? "#0d9488" : "#2dd4bf",
        glowColor: "rgba(45, 212, 191, 0.4)",
        icon: <Wind size={14} className="text-teal-500" />,
      },
      {
        id: "practice-journal",
        name: "Space Journaling",
        sessionsCompleted: 11,
        averageRelief: "+24% Clarity",
        recentImprovement: "Unburdens racing thoughts within 3 minutes of writing.",
        barPercentage: 78,
        color: isLight ? "#8b5cf6" : "#a78bfa",
        glowColor: "rgba(167, 139, 250, 0.4)",
        icon: <Feather size={14} className="text-violet-500" />,
      },
      {
        id: "practice-walking",
        name: "Mindful Walking",
        sessionsCompleted: 8,
        averageRelief: "+19% Grounding",
        recentImprovement: "Noticeable posture ease and relaxed shoulder cadence.",
        barPercentage: 62,
        color: isLight ? "#10b981" : "#34d399",
        glowColor: "rgba(52, 211, 153, 0.4)",
        icon: <Compass size={14} className="text-emerald-500" />,
      },
      {
        id: "practice-conversation",
        name: "Sanctuary Chat",
        sessionsCompleted: 6,
        averageRelief: "+15% Perspective",
        recentImprovement: "Reflects emotional clarity and gentle reassurance after difficult days.",
        barPercentage: 48,
        color: isLight ? "#f59e0b" : "#fbbf24",
        glowColor: "rgba(251, 191, 36, 0.4)",
        icon: <MessageSquare size={14} className="text-amber-500" />,
      },
    ];

    if (rawPractices.length === 0) return defaultBars;

    // Overlay API data if available
    return defaultBars.map((d, idx) => {
      const p = rawPractices[idx];
      if (!p) return d;
      return {
        ...d,
        name: p.practice_name || d.name,
        sessionsCompleted: p.sessions_completed || d.sessionsCompleted,
        recentImprovement: p.observed_recovery_trend || d.recentImprovement,
      };
    });
  }, [impactData, isLight]);

  const activeBar = practiceBars.find((b) => b.id === activePracticeId);

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 transition-all duration-300 ${
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
                ? "bg-teal-50 border-teal-200 text-teal-700"
                : "bg-teal-950/40 border-teal-800/40 text-teal-300"
            }`}
          >
            <BarChart3 size={16} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Practice Impact
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Stacked glowing bars • Hover for session depth &amp; relief
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
          {practiceBars.length} modalities
        </span>
      </div>

      {/* Stacked Glowing Bars */}
      <div className="space-y-4 pt-5">
        {practiceBars.map((bar) => {
          const isSelected = activePracticeId === bar.id;

          return (
            <div
              key={bar.id}
              onClick={() => setActivePracticeId(isSelected ? null : bar.id)}
              onMouseEnter={() => setActivePracticeId(bar.id)}
              className="space-y-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-serif">
                <div className="flex items-center gap-2">
                  {bar.icon}
                  <span
                    className={`font-medium transition-colors ${
                      isSelected
                        ? "font-semibold text-stone-900 dark:text-white"
                        : isLight
                        ? "text-stone-700 group-hover:text-stone-900"
                        : "text-zinc-300 group-hover:text-zinc-100"
                    }`}
                  >
                    {bar.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {bar.averageRelief}
                  </span>
                  <span className={isLight ? "text-stone-400" : "text-zinc-500"}>
                    ({bar.sessionsCompleted} sessions)
                  </span>
                </div>
              </div>

              {/* Glowing Stacked Bar */}
              <div
                className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 transition-colors ${
                  isLight ? "bg-stone-200/70" : "bg-zinc-800/70"
                }`}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${bar.barPercentage}%`,
                    backgroundColor: bar.color,
                    boxShadow: isSelected ? `0 0 10px ${bar.glowColor}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Practice Detail Popover */}
      {activeBar && (
        <div
          className={`mt-5 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${
            isLight
              ? "bg-white/95 border-stone-200 shadow-xs"
              : "bg-[#20222a]/95 border-[#323544] shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-inherit text-xs font-serif">
            <span className="font-semibold">{activeBar.name} Impact</span>
            <span className={isLight ? "text-stone-500" : "text-zinc-400"}>
              {activeBar.sessionsCompleted} total sessions
            </span>
          </div>
          <p
            className={`text-xs font-serif mt-2 leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {activeBar.recentImprovement}
          </p>
        </div>
      )}
    </div>
  );
});
