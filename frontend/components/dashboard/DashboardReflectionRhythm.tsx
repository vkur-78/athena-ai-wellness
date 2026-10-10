"use client";

import React, { useState, useMemo } from "react";
import { JournalEntry } from "@/types/journal";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { BookOpen, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardReflectionRhythmProps {
  journals: JournalEntry[];
  dateRangeDays: number;
  isLight?: boolean;
}

interface PeriodReflectionStat {
  periodKey: string;
  label: string;
  entriesCount: number;
  wordCount: number;
  avgWords: number;
}

export default function DashboardReflectionRhythm({
  journals,
  dateRangeDays,
  isLight = false,
}: DashboardReflectionRhythmProps) {
  const { t } = useLanguage();
  const [metricMode, setMetricMode] = useState<"entries" | "words">("entries");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group journals into periods (by week for <= 90 days, by month for > 90 days)
  const isMonthly = dateRangeDays > 90;

  const periodStats = useMemo<PeriodReflectionStat[]>(() => {
    if (journals.length === 0) return [];

    const map = new Map<string, { label: string; entries: number; words: number }>();

    // Sort journals chronologically
    const sorted = [...journals].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sorted.forEach((j) => {
      const dt = new Date(j.created_at);
      let key = "";
      let label = "";

      if (isMonthly) {
        key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        label = dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      } else {
        // Group by ISO week or 7-day interval
        const weekNum = Math.ceil(dt.getDate() / 7);
        const monthShort = dt.toLocaleDateString("en-US", { month: "short" });
        key = `${dt.getFullYear()}-${dt.getMonth()}-W${weekNum}`;
        label = `${monthShort} W${weekNum}`;
      }

      const text = j.content || "";
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;

      const existing = map.get(key) || { label, entries: 0, words: 0 };
      existing.entries += 1;
      existing.words += words;
      map.set(key, existing);
    });

    const result: PeriodReflectionStat[] = [];
    map.forEach((val, key) => {
      result.push({
        periodKey: key,
        label: val.label,
        entriesCount: val.entries,
        wordCount: val.words,
        avgWords: val.entries > 0 ? Math.round(val.words / val.entries) : 0,
      });
    });

    return result;
  }, [journals, isMonthly]);

  const maxVal = useMemo(() => {
    if (periodStats.length === 0) return 1;
    const values = periodStats.map((p) =>
      metricMode === "entries" ? p.entriesCount : p.wordCount
    );
    return Math.max(...values, 1);
  }, [periodStats, metricMode]);

  const totalWords = useMemo(() => {
    return journals.reduce((acc, j) => {
      const words = j.content ? j.content.trim().split(/\s+/).length : 0;
      return acc + words;
    }, 0);
  }, [journals]);

  if (journals.length === 0) {
    return (
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isLight
            ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
            : "bg-[#0B1228]/70 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {t("nav_space", "Your Reflection Rhythm")}
            </h3>
          </div>
        </div>
        <div className="py-10 text-center">
          <p className={`text-xs ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
            {t("home_no_journals_yet", "No written reflections in this period yet. Your journal words and rhythm will appear here.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/70 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Header with Mode Switcher */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("nav_space", "Your Reflection Rhythm")}
              </h3>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
              {journals.length} {t("kpi_reflections", "reflections")} · {totalWords.toLocaleString()} {t("words", "words written")}
            </p>
          </div>

          {/* Toggle: Entries vs Words */}
          <div
            className={`inline-flex items-center p-0.5 rounded-xl border text-xs self-start sm:self-auto ${
              isLight
                ? "bg-[#FAF7F2] border-stone-200 text-stone-600"
                : "bg-white/5 border-white/10 text-stone-300"
            }`}
          >
            <button
              onClick={() => setMetricMode("entries")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                metricMode === "entries"
                  ? isLight
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Entries
            </button>
            <button
              onClick={() => setMetricMode("words")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                metricMode === "words"
                  ? isLight
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Words
            </button>
          </div>
        </div>

        {/* Visual Chart Bars */}
        <div className="space-y-3 pt-1">
          {periodStats.slice(-8).map((p, idx) => {
            const currentVal = metricMode === "entries" ? p.entriesCount : p.wordCount;
            const pct = Math.max(Math.round((currentVal / maxVal) * 100), 4);
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={p.periodKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-mono text-[11px] ${isLight ? "text-stone-600" : "text-[#B8BDD6]/80"}`}>
                    {p.label}
                  </span>
                  <span className={`font-mono font-semibold ${isLight ? "text-indigo-700" : "text-indigo-300"}`}>
                    {metricMode === "entries" ? `${p.entriesCount} entries` : `${p.wordCount.toLocaleString()} words`}
                  </span>
                </div>

                {/* Bar */}
                <div
                  className={`h-3 w-full rounded-full overflow-hidden ${
                    isLight ? "bg-stone-100" : "bg-white/5"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHovered
                        ? "bg-gradient-to-r from-indigo-500 to-violet-400 shadow-sm shadow-indigo-500/30"
                        : "bg-gradient-to-r from-indigo-500/80 to-violet-500/70"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Hover Details Popover */}
                {isHovered && (
                  <div
                    className={`absolute z-20 left-1/2 -translate-x-1/2 -top-12 px-3 py-1.5 rounded-xl border text-[11px] shadow-lg whitespace-nowrap pointer-events-none transition-all ${
                      isLight
                        ? "bg-white text-stone-800 border-indigo-200 shadow-indigo-100"
                        : "bg-[#0E1528] text-white border-indigo-500/40 shadow-black/80"
                    }`}
                  >
                    <span>{p.label}: </span>
                    <span className="font-semibold text-indigo-400">{p.entriesCount} entries</span>
                    <span className="opacity-60"> · </span>
                    <span>{p.wordCount.toLocaleString()} words</span>
                    <span className="opacity-60"> · avg {p.avgWords} w/entry</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div
        className={`mt-4 pt-3 border-t text-[11px] flex items-center justify-between ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}
      >
        <span>Reflection depth over time</span>
        <span>Space Sanctuary</span>
      </div>
    </div>
  );
}
