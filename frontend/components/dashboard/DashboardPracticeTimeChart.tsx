"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { Wind, ArrowRight, Disc3 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardPracticeTimeChartProps {
  practices: (RecentMoment | StudioHistoryItem)[];
  isLight?: boolean;
}

interface PracticeCategoryStat {
  category: string;
  categoryLabel: string;
  count: number;
  minutes: number;
  percentage: number;
  color: string;
}

const CATEGORY_PALETTE: Record<string, string> = {
  BREATHING: "#10B981", // Emerald
  BREATHE: "#10B981",
  GROUNDING: "#3B82F6", // Blue
  GROUND: "#3B82F6",
  MINDFULNESS: "#8B5CF6", // Purple
  RESET: "#A855F7",
  NERVOUS_SYSTEM_RESET: "#A855F7",
  RELAXATION: "#F59E0B", // Amber
  "BODY SCAN": "#EC4899", // Rose
  BODY_SCAN: "#EC4899",
  FOCUS: "#06B6D4", // Cyan
};

export default function DashboardPracticeTimeChart({
  practices,
  isLight = false,
}: DashboardPracticeTimeChartProps) {
  const { t } = useLanguage();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group strictly by verified practice category
  const { categories, totalMinutes, totalSessions } = useMemo(() => {
    const map = new Map<string, { minutes: number; count: number }>();
    let allMin = 0;
    let allCount = 0;

    practices.forEach((p) => {
      const rawCat = (p.exercise_category || (p as any).practice_type || "PRACTICE").toUpperCase();
      const dur = Number(p.duration_seconds || (p as any).actual_duration || 0);
      const mins = Math.max(1, Math.round(dur / 60));

      const existing = map.get(rawCat) || { minutes: 0, count: 0 };
      existing.minutes += mins;
      existing.count += 1;
      map.set(rawCat, existing);

      allMin += mins;
      allCount += 1;
    });

    const list: PracticeCategoryStat[] = [];
    map.forEach((val, key) => {
      const pct = allMin > 0 ? Math.round((val.minutes / allMin) * 100) : 0;
      const cleanLabel = key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      const color = CATEGORY_PALETTE[key] || "#7C5CFF";

      list.push({
        category: key,
        categoryLabel: cleanLabel,
        count: val.count,
        minutes: val.minutes,
        percentage: pct,
        color,
      });
    });

    list.sort((a, b) => b.minutes - a.minutes);

    return { categories: list, totalMinutes: allMin, totalSessions: allCount };
  }, [practices]);

  if (categories.length === 0) {
    return (
      <section
        aria-label="Practice Mix"
        className={`p-5 sm:p-6 rounded-3xl border transition-all h-full flex flex-col justify-between ${
          isLight
            ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
            : "bg-[#0B1228]/80 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                isLight ? "text-stone-900" : "text-[#F8F7FF]"
              }`}
            >
              Your Practice Mix
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? "border-stone-200 bg-stone-50 text-stone-600"
                  : "border-white/10 bg-white/5 text-[#B8BDD6]/70"
              }`}
            >
              Studio
            </span>
          </div>
          <div className="py-12 text-center text-xs opacity-60">
            No completed studio practices yet. Your practice distribution will appear here.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Practice Mix"
      className={`p-5 sm:p-6 rounded-3xl border transition-all h-full flex flex-col justify-between ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Disc3 size={16} className={isLight ? "text-purple-600" : "text-purple-400"} />
              <h3
                className={`text-sm font-semibold uppercase tracking-wider ${
                  isLight ? "text-stone-900" : "text-[#F8F7FF]"
                }`}
              >
                Your Practice Mix
              </h3>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
              {totalSessions} sessions · {totalMinutes} practice minutes total
            </p>
          </div>
          <Link
            href="/studio"
            className={`text-xs flex items-center gap-1 font-medium transition-colors ${
              isLight ? "text-indigo-600 hover:text-indigo-800" : "text-indigo-400 hover:text-indigo-300"
            }`}
          >
            <span>Studio</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Stacked Multi-Color Distribution Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex mb-5 bg-white/5">
          {categories.map((c) => (
            <div
              key={c.category}
              style={{
                width: `${c.percentage}%`,
                backgroundColor: c.color,
              }}
              title={`${c.categoryLabel}: ${c.percentage}%`}
              className="h-full transition-all duration-300 hover:opacity-80 cursor-pointer"
              onMouseEnter={() => setHoveredCategory(c.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            />
          ))}
        </div>

        {/* Horizontal Category Breakdown Bars */}
        <div className="space-y-3">
          {categories.slice(0, 5).map((c) => {
            const isHovered = hoveredCategory === c.category;

            return (
              <div
                key={c.category}
                onMouseEnter={() => setHoveredCategory(c.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span
                      className={`font-medium ${
                        isLight ? "text-stone-800" : "text-white"
                      }`}
                    >
                      {c.categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}>
                      {c.count} {c.count === 1 ? "session" : "sessions"} · {c.minutes}m
                    </span>
                    <span className="font-bold text-xs" style={{ color: c.color }}>
                      {c.percentage}%
                    </span>
                  </div>
                </div>

                <div
                  className={`h-2 w-full rounded-full overflow-hidden ${
                    isLight ? "bg-stone-100" : "bg-white/5"
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${c.percentage}%`,
                      backgroundColor: c.color,
                      opacity: isHovered ? 1 : 0.85,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}
      >
        <span>Categories discovered in sanctuary records</span>
        <span className="font-mono">Real studio logs</span>
      </div>
    </section>
  );
}
