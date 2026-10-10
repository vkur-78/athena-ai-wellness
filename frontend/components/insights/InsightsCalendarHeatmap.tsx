"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Calendar, CheckCircle2, BookOpen, Wind, X, Zap, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface InsightsCalendarHeatmapProps {
  checkins: any[];
  journals: any[];
  practices?: any[];
  sessions?: any[];
  isLight?: boolean;
}

interface CalendarDayInfo {
  dateStr: string;
  displayDate: string;
  dayOfWeek: number; // 0 Sun - 6 Sat
  checkins: any[];
  journals: any[];
  practices: any[];
  totalCount: number;
  intensity: number;
}

export default function InsightsCalendarHeatmap({
  checkins,
  journals,
  practices,
  sessions,
  isLight = false,
}: InsightsCalendarHeatmapProps) {
  const { t } = useLanguage();
  const effectivePractices = practices || sessions || [];
  const [filterType, setFilterType] = useState<"all" | "checkins" | "journals" | "practices">("all");
  const [selectedDay, setSelectedDay] = useState<CalendarDayInfo | null>(null);

  // Generate trailing 140 days (~20 weeks) of calendar data
  const calendarDays = useMemo<CalendarDayInfo[]>(() => {
    const days: CalendarDayInfo[] = [];
    const now = new Date();

    for (let i = 139; i >= 0; i--) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - i);
      const dateStr = toLocalDateString(dt);

      const dayCheckins = checkins.filter((c) => toLocalDateString(c.date || c.created_at) === dateStr);
      const dayJournals = journals.filter((j) => toLocalDateString(j.created_at) === dateStr);
      const dayPractices = effectivePractices.filter((p) => {
        const tVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
        return toLocalDateString(tVal) === dateStr;
      });

      let count = 0;
      if (filterType === "all") count = dayCheckins.length + dayJournals.length + dayPractices.length;
      else if (filterType === "checkins") count = dayCheckins.length;
      else if (filterType === "journals") count = dayJournals.length;
      else if (filterType === "practices") count = dayPractices.length;

      let intensity = 0;
      if (count === 1) intensity = 1;
      else if (count === 2) intensity = 2;
      else if (count >= 3) intensity = 3;

      days.push({
        dateStr,
        displayDate: dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        dayOfWeek: dt.getDay(),
        checkins: dayCheckins,
        journals: dayJournals,
        practices: dayPractices,
        totalCount: count,
        intensity,
      });
    }

    return days;
  }, [checkins, journals, effectivePractices, filterType]);

  const getCellColor = (intensity: number) => {
    if (isLight) {
      switch (intensity) {
        case 3: return "bg-indigo-600 border-indigo-600 shadow-xs";
        case 2: return "bg-indigo-400 border-indigo-400";
        case 1: return "bg-indigo-200 border-indigo-200";
        default: return "bg-stone-100 border-stone-200/60";
      }
    } else {
      switch (intensity) {
        case 3: return "bg-[#8B5CF6] border-[#8B5CF6] shadow-xs shadow-[#8B5CF6]/30";
        case 2: return "bg-[#6D28D9] border-[#6D28D9]";
        case 1: return "bg-[#4C1D95] border-[#5B21B6]";
        default: return "bg-white/[0.04] border-white/5";
      }
    }
  };

  return (
    <section
      aria-label="Interactive Activity Heatmap"
      className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
      }`}
    >
      {/* Header and Dataset Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              {t("insights_activity_rhythm_title", "ACTIVITY RHYTHM")}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            {t(
              "insights_activity_rhythm_sub",
              "Daily sanctuary presence across check-ins, reflections, and studio sessions"
            )}
          </p>
        </div>

        {/* Dataset Filters */}
        <div
          className={`inline-flex items-center p-0.5 rounded-xl border text-xs self-start sm:self-auto ${
            isLight
              ? "bg-[#FAF7F2] border-stone-200 text-stone-600"
              : "bg-white/5 border-white/10 text-stone-300"
          }`}
        >
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === "all"
                ? isLight ? "bg-white text-indigo-700 shadow-xs" : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {t("range_all", "All Activity")}
          </button>
          <button
            onClick={() => setFilterType("checkins")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === "checkins"
                ? isLight ? "bg-white text-emerald-700 shadow-xs" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {t("chart_checkins_series", "Check-ins")}
          </button>
          <button
            onClick={() => setFilterType("journals")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === "journals"
                ? isLight ? "bg-white text-blue-700 shadow-xs" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {t("chart_journals_series", "Journals")}
          </button>
          <button
            onClick={() => setFilterType("practices")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === "practices"
                ? isLight ? "bg-white text-purple-700 shadow-xs" : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {t("chart_studio_series", "Studio")}
          </button>
        </div>
      </div>

      {/* Grid of Days */}
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-wrap gap-2 min-w-[500px]">
          {calendarDays.map((d) => (
            <div
              key={d.dateStr}
              onClick={() => setSelectedDay(d)}
              title={`${d.displayDate}: ${d.totalCount} events`}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border transition-all duration-150 cursor-pointer hover:scale-125 ${
                selectedDay?.dateStr === d.dateStr
                  ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#0B1228]"
                  : ""
              } ${getCellColor(d.intensity)}`}
            />
          ))}
        </div>
      </div>

      {/* Day Details In-Page Popover (No Page Navigation Needed) */}
      {selectedDay && (
        <div
          className={`mt-5 p-4 sm:p-5 rounded-2xl border text-xs shadow-xl transition-all animate-athena-fade ${
            isLight
              ? "bg-[#FAF7F2] border-indigo-200 text-stone-900"
              : "bg-[#0E1528] border-indigo-500/30 text-white"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-inherit mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{selectedDay.displayDate}</span>
              <span className="text-[11px] font-mono opacity-60">
                ({selectedDay.totalCount} total events recorded)
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Check-in detail */}
            <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-stone-200" : "bg-white/[0.03] border-white/5"}`}>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1.5">
                <CheckCircle2 size={13} /> {t("chart_checkins_series", "Check-ins")}
              </div>
              {selectedDay.checkins.length === 0 ? (
                <span className="opacity-50 italic">{t("chart_nothing_recorded", "Nothing recorded")}</span>
              ) : (
                selectedDay.checkins.map((c, i) => {
                  const e = (c as any).energy ?? c.energy_level ?? 3;
                  const s = (c as any).stress ?? c.stress_level ?? 3;
                  return (
                    <div key={i} className="space-y-1 font-mono text-[11px]">
                      <div>{c.mood || "Recorded"}</div>
                      <div>
                        {t("chart_energy", "Energy")}: {e}/5 · {t("chart_stress", "Stress")}: {s}/5
                      </div>
                      {c.reflection_text && (
                        <p className="mt-1 font-sans italic opacity-75 truncate">&ldquo;{c.reflection_text}&rdquo;</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Studio practices detail */}
            <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-stone-200" : "bg-white/[0.03] border-white/5"}`}>
              <div className="flex items-center gap-1.5 font-semibold text-purple-400 mb-1.5">
                <Wind size={13} /> {t("chart_studio_series", "Studio")}
              </div>
              {selectedDay.practices.length === 0 ? (
                <span className="opacity-50 italic">{t("chart_nothing_recorded", "Nothing recorded")}</span>
              ) : (
                <ul className="space-y-1 font-mono text-[11px]">
                  {selectedDay.practices.map((p, i) => {
                    const dur = Math.max(1, Math.round(Number(p.duration_seconds || (p as any).actual_duration || 60) / 60));
                    const name = (p as any).exercise_name || (p as any).routine || (p as any).practice_type || "Practice";
                    return (
                      <li key={i} className="truncate">
                        • <span className="font-sans font-medium">{name}</span> ({dur}m)
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Journals detail */}
            <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-stone-200" : "bg-white/[0.03] border-white/5"}`}>
              <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1.5">
                <BookOpen size={13} /> Space Reflections
              </div>
              {selectedDay.journals.length === 0 ? (
                <span className="opacity-50 italic">No journal entry</span>
              ) : (
                <ul className="space-y-1 text-[11px]">
                  {selectedDay.journals.map((j, i) => (
                    <li key={i} className="truncate">
                      • <span className="font-medium">{j.title || "Reflection"}</span>
                      {j.content && <p className="opacity-75 italic truncate">&ldquo;{j.content.slice(0, 50)}...&rdquo;</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
        isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
      }`}>
        <span>Trailing 140 days presence grid</span>
        <div className="flex items-center gap-1.5">
          <span>Quiet</span>
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(0)}`} />
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(1)}`} />
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(2)}`} />
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(3)}`} />
          <span>Active</span>
        </div>
      </div>
    </section>
  );
}
