"use client";

import React from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { getZonedTimeParts } from "@/lib/timezone";

interface InsightsTimeOfDayProps {
  checkins: CheckinResponse[];
  practices: RecentMoment[];
  journals: JournalEntry[];
  conversations: any[];
  isLight?: boolean;
}

export default function InsightsTimeOfDay({
  checkins,
  practices,
  journals,
  conversations,
  isLight = false,
}: InsightsTimeOfDayProps) {
  // Aggregate real timestamps across all 4 interaction channels
  const buckets: Record<"Morning" | "Afternoon" | "Evening" | "Night", number> = {
    Morning: 0, // 5:00 - 11:59
    Afternoon: 0, // 12:00 - 16:59
    Evening: 0, // 17:00 - 20:59
    Night: 0, // 21:00 - 4:59
  };

  const processTimestamp = (ts?: string | null) => {
    if (!ts) return;
    const parts = getZonedTimeParts(ts);
    buckets[parts.timeOfDay] += 1;
  };

  checkins.forEach((c) => processTimestamp(c.created_at || c.date));
  practices.forEach((p) => processTimestamp(p.created_at || p.completed_at || p.started_at));
  journals.forEach((j) => processTimestamp(j.created_at));
  conversations.forEach((conv) => processTimestamp(conv.updated_at || conv.created_at));

  const total = Object.values(buckets).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div
        className={`p-6 sm:p-8 rounded-3xl border space-y-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200/90 shadow-sm"
            : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
          Time-of-Day Pattern
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
          Not enough data yet. As you use Athena across different times of day, your natural pattern will appear here.
        </p>
      </div>
    );
  }

  const sections: {
    key: "Morning" | "Afternoon" | "Evening" | "Night";
    timeWindow: string;
    sublabel: string;
  }[] = [
    { key: "Morning", timeWindow: "5 AM – 12 PM", sublabel: "Arriving & setting intentions" },
    { key: "Afternoon", timeWindow: "12 PM – 5 PM", sublabel: "Midday pause & reset" },
    { key: "Evening", timeWindow: "5 PM – 9 PM", sublabel: "Releasing the day" },
    { key: "Night", timeWindow: "9 PM – 5 AM", sublabel: "Quiet reflection & sleep" },
  ];

  return (
    <section
      className={`p-6 sm:p-8 rounded-3xl border space-y-5 transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div>
        <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
          Time-of-Day Pattern
        </h2>
        <p className={`text-xs sm:text-sm ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
          When you naturally seek support and space with Athena
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {sections.map(({ key, timeWindow, sublabel }) => {
          const count = buckets[key];
          const pct = Math.round((count / total) * 100);

          return (
            <div
              key={key}
              className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between transition-colors ${
                isLight
                  ? "bg-stone-50/80 border-stone-200/80 text-stone-800"
                  : "border-white/10 bg-white/[0.02] text-[#F8F7FF]"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-serif ${isLight ? "text-stone-900 font-medium" : "text-[#F8F7FF]"}`}>{key}</span>
                  <span className="text-xs font-mono text-[#7C5CFF] font-semibold">{pct}%</span>
                </div>
                <p className={`text-[11px] font-mono ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>{timeWindow}</p>
                <p className={`text-[11px] font-sans ${isLight ? "text-stone-600" : "text-[#94A3B8]/80"}`}>{sublabel}</p>
              </div>

              <div className={`w-full h-1.5 rounded-full overflow-hidden mt-3 ${isLight ? "bg-stone-200" : "bg-white/[0.04]"}`}>
                <div
                  className="h-full rounded-full bg-[#7C5CFF] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
