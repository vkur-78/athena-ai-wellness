"use client";

import React, { useState } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { getZonedWeekBounds } from "@/lib/timezone";

interface InsightsWeeklyActivityProps {
  checkins: CheckinResponse[];
  practices: RecentMoment[];
  journals: JournalEntry[];
  isLight?: boolean;
}

type ActivityFilter = "all" | "checkins" | "practices" | "journals";

export default function InsightsWeeklyActivity({
  checkins,
  practices,
  journals,
  isLight = false,
}: InsightsWeeklyActivityProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const weekBounds = getZonedWeekBounds();

  // Aggregate counts per day
  const dailyData = weekBounds.days.map((day) => {
    if (day.isFuture) {
      return { day, checkins: 0, practices: 0, journals: 0, total: 0 };
    }

    const dayCheckins = checkins.filter((c) => {
      const d = (c.date || c.created_at || "").slice(0, 10);
      return d === day.dateStr;
    }).length;

    const dayPractices = practices.filter((p) => {
      const d = (p.created_at || p.completed_at || "").slice(0, 10);
      return d === day.dateStr;
    }).length;

    const dayJournals = journals.filter((j) => {
      const d = (j.created_at || "").slice(0, 10);
      return d === day.dateStr;
    }).length;

    const total = dayCheckins + dayPractices + dayJournals;

    return {
      day,
      checkins: dayCheckins,
      practices: dayPractices,
      journals: dayJournals,
      total,
    };
  });

  const totalWeekActivity = dailyData.reduce((acc, d) => acc + d.total, 0);

  // Maximum value for scaling bars
  const maxVal = Math.max(
    1,
    ...dailyData.map((d) => {
      if (filter === "checkins") return d.checkins;
      if (filter === "practices") return d.practices;
      if (filter === "journals") return d.journals;
      return d.total;
    })
  );

  return (
    <section
      className={`p-6 sm:p-8 rounded-3xl border space-y-5 transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
            Weekly Activity
          </h2>
          <p className={`text-xs sm:text-sm ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
            Consistency across Monday to Sunday this week
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          className={`flex items-center gap-1 p-1 rounded-full border self-start sm:self-auto text-xs ${
            isLight
              ? "border-stone-200 bg-stone-100 text-stone-600"
              : "border-white/10 bg-white/[0.03] text-[#94A3B8]"
          }`}
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "checkins", label: "Check-ins" },
              { key: "practices", label: "Practices" },
              { key: "journals", label: "Journal" },
            ] as { key: ActivityFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filter === tab.key
                  ? "bg-[#7C5CFF] text-white shadow-xs"
                  : isLight
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-[#94A3B8] hover:text-[#F8F7FF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {totalWeekActivity === 0 ? (
        <p className={`text-xs sm:text-sm py-4 ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
          No activity recorded yet this week. As you practice or check in, your weekly rhythm will appear here.
        </p>
      ) : (
        <div className="space-y-4 pt-2">
          {/* Bar Columns */}
          <div className={`grid grid-cols-7 gap-2 sm:gap-4 items-end h-36 sm:h-44 border-b pb-2 ${isLight ? "border-stone-100" : "border-white/10"}`}>
            {dailyData.map((item, idx) => {
              const count =
                filter === "checkins"
                  ? item.checkins
                  : filter === "practices"
                  ? item.practices
                  : filter === "journals"
                  ? item.journals
                  : item.total;

              const heightPct = item.day.isFuture ? 0 : Math.round((count / maxVal) * 100);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full gap-2 group"
                >
                  <span className={`text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
                    {item.day.isFuture ? "-" : count}
                  </span>

                  <div className={`w-full max-w-[36px] rounded-t-lg h-full flex items-end overflow-hidden ${isLight ? "bg-stone-100" : "bg-white/[0.03]"}`}>
                    {!item.day.isFuture && count > 0 && (
                      <div
                        className="w-full rounded-t-lg transition-all duration-300 bg-gradient-to-t from-[#7C5CFF] to-[#A78BFA]"
                        style={{ height: `${Math.max(8, heightPct)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
            {dailyData.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div
                  className={`text-xs font-mono ${
                    item.day.isToday
                      ? isLight
                        ? "text-[#7C5CFF] font-bold"
                        : "text-[#BFAEFF] font-semibold"
                      : item.day.isFuture
                      ? isLight
                        ? "text-stone-300"
                        : "text-[#94A3B8]/40"
                      : isLight
                      ? "text-stone-700"
                      : "text-[#94A3B8]"
                  }`}
                >
                  {item.day.name}
                </div>
                {item.day.isToday && (
                  <div className="w-1 h-1 rounded-full bg-[#7C5CFF] mx-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
