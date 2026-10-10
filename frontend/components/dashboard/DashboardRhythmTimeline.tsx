"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Sparkles, Calendar } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardRhythmTimelineProps {
  checkins: CheckinResponse[];
  journals: JournalEntry[];
  practices: (RecentMoment | StudioHistoryItem)[];
  dateRangeDays: number;
  allDates: string[];
  isLight?: boolean;
}

interface HeatmapDay {
  dateStr: string;
  displayDate: string;
  checkins: number;
  journals: number;
  practices: number;
  total: number;
  intensity: 0 | 1 | 2 | 3;
}

export default function DashboardRhythmTimeline({
  checkins,
  journals,
  practices,
  dateRangeDays,
  allDates,
  isLight = false,
}: DashboardRhythmTimelineProps) {
  const { t } = useLanguage();
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // Compute daily activity map
  const heatmapData = useMemo<HeatmapDay[]>(() => {
    // Show up to the last 70 days or allDates
    const sliceDates = allDates.slice(-70);

    return sliceDates.map((dateStr) => {
      const cCount = checkins.filter((c) => toLocalDateString(c.date || c.created_at) === dateStr).length;
      const jCount = journals.filter((j) => toLocalDateString(j.created_at) === dateStr).length;
      const pCount = practices.filter((p) => {
        const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
        return toLocalDateString(timeVal) === dateStr;
      }).length;

      const total = cCount + jCount + pCount;
      let intensity: 0 | 1 | 2 | 3 = 0;
      if (total === 1) intensity = 1;
      else if (total === 2) intensity = 2;
      else if (total >= 3) intensity = 3;

      const dt = new Date(dateStr + "T00:00:00");
      const displayDate = dt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

      return {
        dateStr,
        displayDate,
        checkins: cCount,
        journals: jCount,
        practices: pCount,
        total,
        intensity,
      };
    });
  }, [allDates, checkins, journals, practices]);

  const activeDaysCount = useMemo(() => {
    return heatmapData.filter((d) => d.total > 0).length;
  }, [heatmapData]);

  // Color intensities
  const getCellColor = (intensity: number) => {
    if (isLight) {
      switch (intensity) {
        case 3:
          return "bg-indigo-600 border-indigo-600 shadow-xs";
        case 2:
          return "bg-indigo-400 border-indigo-400";
        case 1:
          return "bg-indigo-200 border-indigo-200";
        default:
          return "bg-stone-100 border-stone-200/60";
      }
    } else {
      switch (intensity) {
        case 3:
          return "bg-[#8B5CF6] border-[#8B5CF6] shadow-xs shadow-[#8B5CF6]/30";
        case 2:
          return "bg-[#6D28D9] border-[#6D28D9]";
        case 1:
          return "bg-[#4C1D95] border-[#5B21B6]";
        default:
          return "bg-white/[0.04] border-white/5";
      }
    }
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isLight ? "bg-indigo-600" : "bg-[#7C5CFF]"}`}
            />
            <h3
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                isLight ? "text-indigo-700" : "text-[#BFAEFF]"
              }`}
            >
              Your Athena Rhythm
            </h3>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            Daily presence density · Quiet days represent gentle resting intervals
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-semibold text-indigo-400">{activeDaysCount}</span>
          <span className={`opacity-60 ${isLight ? "text-stone-600" : "text-[#B8BDD6]"}`}>
            active days in window
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative pt-2 pb-1 overflow-x-auto">
        <div className="flex flex-wrap gap-1.5 min-w-[280px]">
          {heatmapData.map((d) => (
            <div
              key={d.dateStr}
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md border transition-all duration-150 cursor-pointer hover:scale-125 ${getCellColor(
                d.intensity
              )}`}
            />
          ))}
        </div>

        {/* Hover Tooltip */}
        {hoveredDay && (
          <div
            className={`mt-3 p-2.5 rounded-xl border text-xs shadow-lg inline-flex items-center gap-3 ${
              isLight
                ? "bg-white text-stone-900 border-indigo-200"
                : "bg-[#0E152E] text-white border-indigo-500/40"
            }`}
          >
            <span className="font-semibold">{hoveredDay.displayDate}:</span>
            {hoveredDay.total === 0 ? (
              <span className="opacity-60 italic">Quiet day · Resting interval</span>
            ) : (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-emerald-400">Check-ins: {hoveredDay.checkins}</span>
                <span className="opacity-40">|</span>
                <span className="text-blue-400">Journals: {hoveredDay.journals}</span>
                <span className="opacity-40">|</span>
                <span className="text-purple-400">Studio: {hoveredDay.practices}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}
      >
        <span>Sanctuary Presence Rhythm</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">Quiet</span>
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(0)}`} />
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(1)}`} />
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(2)}`} />
          <span className={`w-2.5 h-2.5 rounded-xs border ${getCellColor(3)}`} />
          <span className="text-[10px]">Active</span>
        </div>
      </div>
    </div>
  );
}
