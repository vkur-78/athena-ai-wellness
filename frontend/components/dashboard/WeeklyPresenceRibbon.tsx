"use client";

import React, { useMemo } from "react";
import { Sparkles, Heart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface WeeklyPresenceRibbonProps {
  checkinHistory?: CheckinResponse[];
  todayCheckin?: CheckinResponse | null;
  onOpenCheckinModal?: () => void;
}

interface StoneDay {
  label: string;
  dayIndex: number; // 0 = Mon, 6 = Sun
  isToday: boolean;
  isFilled: boolean;
  dateStr: string;
  mood?: string;
}

export default React.memo(function WeeklyPresenceRibbon({
  checkinHistory = [],
  todayCheckin,
  onOpenCheckinModal,
}: WeeklyPresenceRibbonProps) {
  const { isLight } = useTheme();

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const { stones, quietMomentsCount } = useMemo(() => {
    const dates = new Set<string>();
    checkinHistory.forEach((c) => {
      const d = c.date || (c.created_at ? c.created_at.split("T")[0] : "");
      if (d) dates.add(d);
    });
    if (todayCheckin?.date) dates.add(todayCheckin.date);

    const now = new Date();
    const diffToMonday = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);

    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let filledCount = 0;
    const computedStones: StoneDay[] = [];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const str = fmt(cur);
      const isToday = i === todayDayIndex;
      const isFilled = dates.has(str);

      if (isFilled) filledCount++;

      computedStones.push({
        label: daysOfWeek[i],
        dayIndex: i,
        isToday,
        isFilled,
        dateStr: str,
      });
    }

    return { stones: computedStones, quietMomentsCount: filledCount };
  }, [checkinHistory, todayCheckin, todayDayIndex]);

  return (
    <div
      role="region"
      aria-label="Weekly Presence Ribbon"
      className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 transition-all duration-200 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-sm"
          : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-md"
      }`}
    >
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-xs font-serif uppercase tracking-widest opacity-60">Weekly Presence</h3>
        <span className="text-[11px] font-serif opacity-70">Mon – Sun</span>
      </div>

      {/* Seven Animated Stones Ribbon */}
      <div className="py-3 flex items-center justify-between gap-2 max-w-sm mx-auto">
        {stones.map((stone, idx) => (
          <div
            key={stone.dateStr}
            className="flex flex-col items-center gap-1.5 group cursor-default"
            title={`${dayNames[idx]}: ${stone.isFilled ? "Quiet moment recorded" : stone.isToday ? "Today" : "Unrecorded"}`}
          >
            {/* The Presence Stone */}
            <div
              className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl transition-all duration-300 ${
                stone.isToday
                  ? stone.isFilled
                    ? "bg-amber-400 border border-amber-300 shadow-md animate-stone-glow text-stone-900"
                    : "border-2 border-amber-400 bg-amber-400/10 shadow-xs animate-stone-glow text-amber-500"
                  : stone.isFilled
                  ? isLight
                    ? "bg-stone-800 text-stone-100 shadow-xs"
                    : "bg-violet-600/90 text-white shadow-xs"
                  : isLight
                  ? "border border-stone-200 bg-stone-100/60 text-stone-400"
                  : "border border-zinc-800 bg-zinc-900/50 text-zinc-600"
              }`}
            >
              {/* Inner stone shine if filled */}
              {stone.isFilled && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-white/20 pointer-events-none"
                />
              )}
              <span className="text-[11px] font-serif font-medium">{stone.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Elegant Narrative Line */}
      <div className="pt-2 text-center border-t border-inherit/40">
        <p className="text-xs font-serif leading-relaxed">
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {quietMomentsCount} {quietMomentsCount === 1 ? "quiet moment" : "quiet moments"}
          </span>{" "}
          this week.
        </p>
      </div>
    </div>
  );
});
