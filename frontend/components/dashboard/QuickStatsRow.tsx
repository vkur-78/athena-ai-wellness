"use client";

import React from "react";
import { Flame, Sparkles, Heart, Activity } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface QuickStatsRowProps {
  todayCheckin?: CheckinResponse | null;
  streakDays: number;
  weeklyHistory?: CheckinResponse[];
  checkinHistory?: CheckinResponse[];
  calmScore?: number;
  onOpenCheckinModal?: () => void;
  onCheckinClick?: () => void;
}

export default function QuickStatsRow({
  todayCheckin,
  streakDays,
  weeklyHistory = [],
  checkinHistory,
  calmScore = 86,
  onOpenCheckinModal,
  onCheckinClick,
}: QuickStatsRowProps) {
  const { isLight } = useTheme();
  const effectiveWeekly = checkinHistory || weeklyHistory;
  const triggerCheckin = onCheckinClick || onOpenCheckinModal || (() => {});

  // Compute 7-day consistency dots for the current week (Mon-Sun)
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Check which days have check-in recorded in the past 7 days
  const checkedDays = daysOfWeek.map((_, index) => {
    if (index > todayIndex) return "future";
    const daysAgo = todayIndex - index;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    const hasDayCheckin = effectiveWeekly.some(
      (c) => (c.date && c.date.startsWith(targetDateStr)) || (c.created_at && c.created_at.startsWith(targetDateStr))
    );
    if (index === todayIndex && todayCheckin) return "completed";
    return hasDayCheckin ? "completed" : "missed";
  });

  const weeklyCompletedCount = checkedDays.filter((s) => s === "completed").length;
  const weeklyRate = Math.round((weeklyCompletedCount / Math.max(1, todayIndex + 1)) * 100);

  // Format check-in time
  const getCheckinTimeStr = () => {
    if (!todayCheckin) return "Tap to pause & check in";
    try {
      const rawDate = todayCheckin.created_at || todayCheckin.date;
      if (!rawDate) return "Checked in today";
      const date = new Date(rawDate);
      return `Checked in at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    } catch {
      return "Checked in today";
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case "calm":
      case "peaceful":
        return "🌱";
      case "good":
      case "content":
        return "✨";
      case "reflective":
      case "tired":
        return "🌙";
      case "anxious":
      case "overwhelmed":
        return "🌊";
      case "sad":
      case "low":
        return "🌧️";
      default:
        return "🍃";
    }
  };

  const cardBaseClasses = `rounded-3xl border p-4 sm:p-5 transition-all duration-250 cursor-pointer group flex flex-col justify-between hover:-translate-y-1 ${
    isLight
      ? "bg-[#fdfbf7]/90 hover:bg-white border-[#e7e5e4] hover:border-stone-300 shadow-sm hover:shadow-md hover:shadow-stone-200/60"
      : "bg-[#1a1b21]/90 hover:bg-[#20222a] border-[#2a2c36] hover:border-[#3d4050] shadow-xs hover:shadow-lg hover:shadow-black/40"
  }`;

  return (
    <section aria-label="Quick Sanctuary Stats" className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* CARD 1: Mood Today */}
        <div onClick={triggerCheckin} className={cardBaseClasses}>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Mood Today
            </span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs border ${
                isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
              }`}
            >
              {todayCheckin ? (
                <span>{getMoodEmoji(todayCheckin.mood)}</span>
              ) : (
                <Heart size={13} />
              )}
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-lg sm:text-xl font-serif font-semibold truncate capitalize ${
                isLight ? "text-stone-900" : "text-zinc-100"
              }`}
            >
              {todayCheckin ? todayCheckin.mood || "Grounded" : "Awaiting pause"}
            </div>
            <p
              className={`text-[11px] sm:text-xs font-serif mt-0.5 truncate ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {getCheckinTimeStr()}
            </p>
          </div>
        </div>

        {/* CARD 2: Current Streak */}
        <div className={cardBaseClasses}>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Sanctuary Streak
            </span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-amber-950/40 border-amber-800/40 text-amber-400"
              }`}
            >
              <Flame size={14} className="animate-pulse" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-lg sm:text-xl font-serif font-semibold ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {streakDays}
              </span>
              <span
                className={`text-xs font-serif ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {streakDays === 1 ? "day" : "days"}
              </span>
            </div>
            <p
              className={`text-[11px] sm:text-xs font-serif mt-0.5 truncate ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {streakDays > 0 ? "Daily presence honored" : "Begin your sequence today"}
            </p>
          </div>
        </div>

        {/* CARD 3: Weekly Consistency */}
        <div className={cardBaseClasses}>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Weekly Rhythm
            </span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-violet-50 border-violet-200 text-violet-700"
                  : "bg-violet-950/40 border-violet-800/40 text-violet-300"
              }`}
            >
              <Activity size={13} />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm sm:text-base font-serif font-semibold ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {weeklyCompletedCount}/7 days
              </span>
              <span
                className={`text-[11px] font-mono font-medium ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {weeklyRate}%
              </span>
            </div>

            {/* Mini 7-Day Dots Indicator */}
            <div className="flex items-center justify-between gap-1 mt-2">
              {checkedDays.map((status, idx) => {
                const isToday = idx === todayIndex;
                let dotClass = isLight
                  ? "bg-stone-200 text-stone-400"
                  : "bg-zinc-800 text-zinc-600";

                if (status === "completed") {
                  dotClass = isLight
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-500 text-black shadow-xs shadow-emerald-500/20";
                } else if (isToday) {
                  dotClass = isLight
                    ? "border border-dashed border-stone-400 bg-stone-100"
                    : "border border-dashed border-violet-400/60 bg-zinc-800";
                }

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-0.5"
                    title={`${daysOfWeek[idx]} - ${status}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full transition-all flex items-center justify-center text-[7px] font-mono ${dotClass}`}
                    />
                    <span
                      className={`text-[8px] font-mono ${
                        isToday
                          ? isLight
                            ? "font-bold text-stone-800"
                            : "font-bold text-violet-300"
                          : isLight
                          ? "text-stone-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {daysOfWeek[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 4: Calm Score */}
        <div className={cardBaseClasses}>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Calm Score
            </span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-teal-950/40 border-teal-800/40 text-teal-300"
              }`}
            >
              <Sparkles size={13} />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-lg sm:text-xl font-serif font-semibold ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {calmScore}%
              </span>
              <span
                className={`text-xs font-serif ${
                  isLight ? "text-emerald-700 font-medium" : "text-emerald-400 font-medium"
                }`}
              >
                Gentle Stillness
              </span>
            </div>

            {/* Micro Calm Progress Bar */}
            <div
              className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${
                isLight ? "bg-stone-200" : "bg-zinc-800"
              }`}
            >
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-emerald-400"
                style={{ width: `${Math.min(100, Math.max(10, calmScore))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
