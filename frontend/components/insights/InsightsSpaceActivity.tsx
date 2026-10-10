"use client";

import React, { useMemo } from "react";
import { JournalEntry } from "@/types/journal";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { formatZonedDate, ATHENA_DEFAULT_TIMEZONE } from "@/lib/timezone";
import { BookOpen } from "lucide-react";

interface InsightsSpaceActivityProps {
  journals: JournalEntry[];
  allDates: string[];
  isLight?: boolean;
}

export default function InsightsSpaceActivity({
  journals,
  allDates,
  isLight = false,
}: InsightsSpaceActivityProps) {
  // Aggregate journal entries and real word counts by date
  const dailyData = useMemo(() => {
    const map = new Map<string, { count: number; words: number }>();

    journals.forEach((j) => {
      if (!j.created_at) return;
      const ds = toLocalDateString(j.created_at);
      if (!ds) return;

      // Calculate actual words strictly from real content
      const wordCount = j.content
        ? j.content.trim().split(/\s+/).filter(Boolean).length
        : 0;

      const existing = map.get(ds) || { count: 0, words: 0 };
      existing.count += 1;
      existing.words += wordCount;
      map.set(ds, existing);
    });

    return allDates.map((dateStr) => {
      const data = map.get(dateStr) || { count: 0, words: 0 };
      return {
        dateStr,
        displayDate: formatZonedDate(dateStr, ATHENA_DEFAULT_TIMEZONE),
        entries: data.count,
        words: data.words,
      };
    });
  }, [journals, allDates]);

  const totalEntries = useMemo(() => {
    return dailyData.reduce((acc, d) => acc + d.entries, 0);
  }, [dailyData]);

  const totalWords = useMemo(() => {
    return dailyData.reduce((acc, d) => acc + d.words, 0);
  }, [dailyData]);

  const maxEntries = useMemo(() => {
    return Math.max(...dailyData.map((d) => d.entries), 1);
  }, [dailyData]);

  if (totalEntries === 0) {
    return (
      <div
        className={`p-5 sm:p-6 rounded-3xl border space-y-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200/90 shadow-sm"
            : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`text-sm uppercase tracking-wider font-semibold ${isLight ? "text-stone-700" : "text-[#B8BDD6]/80"}`}>
            Space Activity
          </h2>
          <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>0 entries</span>
        </div>
        <p className={`text-xs leading-relaxed py-6 text-center ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
          No reflective Space entries recorded in this period. Take a quiet moment in Space to write down what is on your mind.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Space Activity"
      className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-sm uppercase tracking-wider font-semibold ${isLight ? "text-stone-700" : "text-[#B8BDD6]/80"}`}>
              Space / Journal Activity
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
              Entries recorded in your private sanctuary
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-300">
            <BookOpen size={12} />
            <span>{totalEntries} {totalEntries === 1 ? "entry" : "entries"}</span>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className={`h-36 flex items-end gap-1 sm:gap-2 border-b pb-2 pt-4 ${isLight ? "border-stone-100" : "border-white/10"}`}>
          {dailyData.map((day) => {
            const heightPct = day.entries > 0 ? Math.max((day.entries / maxEntries) * 100, 15) : 0;

            return (
              <div
                key={day.dateStr}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {day.entries > 0 ? (
                  <div
                    className="w-full max-w-[20px] rounded-t-lg bg-blue-400 group-hover:bg-blue-300 transition-all duration-200"
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <span className={`text-[10px] ${isLight ? "text-stone-300" : "text-[#B8BDD6]/20"}`}>·</span>
                )}

                {/* Tooltip on hover */}
                <div
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-lg text-[10px] whitespace-nowrap shadow-lg space-y-0.5 ${
                    isLight
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-[#0B1228] border border-white/20 text-white"
                  }`}
                >
                  <div className="font-semibold text-blue-300">{day.displayDate}</div>
                  <div>{day.entries} {day.entries === 1 ? "entry" : "entries"}</div>
                  {day.words > 0 && <div className="text-stone-300 dark:text-[#B8BDD6]/70">{day.words} words</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-3 flex items-center justify-between text-xs pt-2 border-t ${isLight ? "border-stone-100 text-stone-600" : "border-white/5 text-[#B8BDD6]/60"}`}>
        <span>Total words written:</span>
        <span className={`font-semibold ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>{totalWords}</span>
      </div>
    </section>
  );
}
