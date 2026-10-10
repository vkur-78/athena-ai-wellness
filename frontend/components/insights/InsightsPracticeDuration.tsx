"use client";

import React, { useMemo } from "react";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { formatZonedDate, ATHENA_DEFAULT_TIMEZONE } from "@/lib/timezone";
import { Clock } from "lucide-react";

interface InsightsPracticeDurationProps {
  practices: (RecentMoment | StudioHistoryItem)[];
  allDates: string[];
  isLight?: boolean;
}

export default function InsightsPracticeDuration({
  practices,
  allDates,
  isLight = false,
}: InsightsPracticeDurationProps) {
  // Compute total practice minutes per day
  const dailyMinutes = useMemo(() => {
    const map = new Map<string, number>();

    practices.forEach((p) => {
      const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      const ds = toLocalDateString(timeVal);
      if (!ds) return;
      const secs = Number(p.duration_seconds || (p as any).actual_duration || 0);
      const mins = Math.round(secs / 60) || (secs > 0 ? 1 : 0);
      map.set(ds, (map.get(ds) || 0) + mins);
    });

    return allDates.map((dateStr) => {
      const minutes = map.get(dateStr) || 0;
      return {
        dateStr,
        displayDate: formatZonedDate(dateStr, ATHENA_DEFAULT_TIMEZONE),
        minutes,
      };
    });
  }, [practices, allDates]);

  const totalMinutes = useMemo(() => {
    return dailyMinutes.reduce((acc, d) => acc + d.minutes, 0);
  }, [dailyMinutes]);

  const maxDailyMin = useMemo(() => {
    return Math.max(...dailyMinutes.map((d) => d.minutes), 1);
  }, [dailyMinutes]);

  const daysWithPractice = useMemo(() => {
    return dailyMinutes.filter((d) => d.minutes > 0).length;
  }, [dailyMinutes]);

  if (totalMinutes === 0) {
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
            Practice Duration
          </h2>
          <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>0 min total</span>
        </div>
        <p className={`text-xs leading-relaxed py-6 text-center ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
          No practice duration recorded in this period. As you complete Studio sessions, daily practice minutes will appear here.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Practice Duration"
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
              Practice Duration
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
              Minutes spent in guided practice per day
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-xs font-semibold text-teal-600 dark:text-teal-300">
            <Clock size={12} />
            <span>{totalMinutes} min</span>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className={`h-36 flex items-end gap-1 sm:gap-2 border-b pb-2 pt-4 ${isLight ? "border-stone-100" : "border-white/10"}`}>
          {dailyMinutes.map((day) => {
            const heightPct = day.minutes > 0 ? Math.max((day.minutes / maxDailyMin) * 100, 15) : 0;

            return (
              <div
                key={day.dateStr}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {day.minutes > 0 ? (
                  <div
                    className="w-full max-w-[20px] rounded-t-lg bg-teal-400/90 group-hover:bg-teal-300 transition-all duration-200"
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <span className={`text-[10px] ${isLight ? "text-stone-300" : "text-[#B8BDD6]/20"}`}>·</span>
                )}

                {/* Tooltip on hover */}
                <div
                  className={`absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md text-[10px] whitespace-nowrap shadow-lg ${
                    isLight
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-[#0B1228] border border-white/20 text-white"
                  }`}
                >
                  {day.displayDate}: {day.minutes} min
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-3 flex items-center justify-between text-xs pt-2 border-t ${isLight ? "border-stone-100 text-stone-600" : "border-white/5 text-[#B8BDD6]/60"}`}>
        <span>Practiced on:</span>
        <span className={`font-semibold ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>{daysWithPractice} days</span>
      </div>
    </section>
  );
}
