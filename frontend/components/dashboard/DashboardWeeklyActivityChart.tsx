"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { BarChart3, CheckCircle2, BookOpen, Wind, Layers } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardWeeklyActivityChartProps {
  checkins: CheckinResponse[];
  journals: JournalEntry[];
  practices: (RecentMoment | StudioHistoryItem)[];
  dateRangeDays: number;
  isLight?: boolean;
}

interface WeekBucket {
  weekLabel: string;
  rangeLabel: string;
  checkins: number;
  journals: number;
  practices: number;
  total: number;
}

export default function DashboardWeeklyActivityChart({
  checkins,
  journals,
  practices,
  dateRangeDays,
  isLight = false,
}: DashboardWeeklyActivityChartProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<"all" | "checkins" | "journals" | "practices">("all");
  const [hoveredWeek, setHoveredWeek] = useState<WeekBucket | null>(null);

  // Group verified data into weeks (7-day intervals counting backwards from today)
  const weeks = useMemo<WeekBucket[]>(() => {
    const numWeeks = Math.max(2, Math.min(Math.ceil(dateRangeDays / 7), 12));
    const now = new Date();
    const buckets: WeekBucket[] = [];

    for (let i = numWeeks - 1; i >= 0; i--) {
      const endD = new Date(now);
      endD.setDate(now.getDate() - i * 7);
      const startD = new Date(endD);
      startD.setDate(endD.getDate() - 6);

      const startStr = toLocalDateString(startD);
      const endStr = toLocalDateString(endD);

      const cCount = checkins.filter((c) => {
        const ds = toLocalDateString(c.date || c.created_at);
        return ds >= startStr && ds <= endStr;
      }).length;

      const jCount = journals.filter((j) => {
        const ds = toLocalDateString(j.created_at);
        return ds >= startStr && ds <= endStr;
      }).length;

      const pCount = practices.filter((p) => {
        const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
        const ds = toLocalDateString(timeVal);
        return ds >= startStr && ds <= endStr;
      }).length;

      const startFmt = startD.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endFmt = endD.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      buckets.push({
        weekLabel: `Wk ${numWeeks - i}`,
        rangeLabel: `${startFmt} – ${endFmt}`,
        checkins: cCount,
        journals: jCount,
        practices: pCount,
        total: cCount + jCount + pCount,
      });
    }

    return buckets;
  }, [checkins, journals, practices, dateRangeDays]);

  const maxWeeklyCount = useMemo(() => {
    if (weeks.length === 0) return 1;
    const values = weeks.map((w) => {
      if (activeFilter === "checkins") return w.checkins;
      if (activeFilter === "journals") return w.journals;
      if (activeFilter === "practices") return w.practices;
      return w.total;
    });
    return Math.max(...values, 1);
  }, [weeks, activeFilter]);

  const hasData = weeks.some((w) => w.total > 0);

  return (
    <section
      aria-label="Weekly Activity Overview"
      className={`p-5 sm:p-6 rounded-3xl border transition-all h-full flex flex-col justify-between ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      }`}
    >
      <div>
        {/* Header with Title and Toggleable Datasets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                ACTIVITY
              </h3>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
              Activity count across Check-ins, Journals, and Studio
            </p>
          </div>

          {/* Dataset Toggles */}
          <div
            className={`inline-flex items-center p-0.5 rounded-xl border text-[11px] self-start sm:self-auto ${
              isLight
                ? "bg-[#FAF7F2] border-stone-200 text-stone-600"
                : "bg-white/5 border-white/10 text-stone-300"
            }`}
          >
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === "all"
                  ? isLight
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveFilter("checkins")}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeFilter === "checkins"
                  ? isLight
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Check-ins
            </button>
            <button
              onClick={() => setActiveFilter("journals")}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeFilter === "journals"
                  ? isLight
                    ? "bg-white text-blue-700 shadow-xs"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Journals
            </button>
            <button
              onClick={() => setActiveFilter("practices")}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeFilter === "practices"
                  ? isLight
                    ? "bg-white text-purple-700 shadow-xs"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Studio
            </button>
          </div>
        </div>

        {/* Visual Weekly Bars */}
        {!hasData ? (
          <div className="py-12 text-center text-xs opacity-60">
            No activity records found in this window.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {weeks.map((w, idx) => {
              const activeCount =
                activeFilter === "checkins"
                  ? w.checkins
                  : activeFilter === "journals"
                  ? w.journals
                  : activeFilter === "practices"
                  ? w.practices
                  : w.total;

              const totalPct = Math.max(Math.round((activeCount / maxWeeklyCount) * 100), activeCount > 0 ? 6 : 2);
              const isHovered = hoveredWeek?.rangeLabel === w.rangeLabel;

              return (
                <div
                  key={w.rangeLabel}
                  onMouseEnter={() => setHoveredWeek(w)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  className="group relative cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-mono text-[11px] ${isLight ? "text-stone-600" : "text-[#B8BDD6]/80"}`}>
                      {w.rangeLabel}
                    </span>
                    <span className="font-mono font-semibold text-xs">
                      {activeCount} {activeCount === 1 ? "event" : "events"}
                    </span>
                  </div>

                  {/* Multi-segment stacked bar or single bar */}
                  <div
                    className={`h-3.5 w-full rounded-full overflow-hidden flex ${
                      isLight ? "bg-stone-100" : "bg-white/5"
                    }`}
                  >
                    {activeFilter === "all" ? (
                      <>
                        {w.checkins > 0 && (
                          <div
                            style={{ width: `${(w.checkins / maxWeeklyCount) * 100}%` }}
                            className="h-full bg-emerald-500 transition-all duration-300"
                            title={`Check-ins: ${w.checkins}`}
                          />
                        )}
                        {w.journals > 0 && (
                          <div
                            style={{ width: `${(w.journals / maxWeeklyCount) * 100}%` }}
                            className="h-full bg-blue-500 transition-all duration-300"
                            title={`Journals: ${w.journals}`}
                          />
                        )}
                        {w.practices > 0 && (
                          <div
                            style={{ width: `${(w.practices / maxWeeklyCount) * 100}%` }}
                            className="h-full bg-purple-500 transition-all duration-300"
                            title={`Studio: ${w.practices}`}
                          />
                        )}
                      </>
                    ) : (
                      <div
                        style={{ width: `${totalPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          activeFilter === "checkins"
                            ? "bg-emerald-500"
                            : activeFilter === "journals"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                      />
                    )}
                  </div>

                  {/* Hover Floating Tooltip */}
                  {isHovered && (
                    <div
                      className={`absolute z-20 left-1/2 -translate-x-1/2 -top-12 px-3 py-1.5 rounded-xl border text-[11px] shadow-lg whitespace-nowrap pointer-events-none transition-all ${
                        isLight
                          ? "bg-white text-stone-900 border-indigo-200 shadow-indigo-100"
                          : "bg-[#0E1528] text-white border-indigo-500/40 shadow-black/80"
                      }`}
                    >
                      <span className="font-semibold">{w.rangeLabel}: </span>
                      <span className="text-emerald-400">{w.checkins} check-ins</span>
                      <span className="opacity-60"> · </span>
                      <span className="text-blue-400">{w.journals} journals</span>
                      <span className="opacity-60"> · </span>
                      <span className="text-purple-400">{w.practices} studio</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Check-ins
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Journals
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Studio
          </span>
        </div>
        <span>Tap/hover bars</span>
      </div>
    </section>
  );
}
