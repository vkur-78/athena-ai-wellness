"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Calendar, Heart, Flame, Wind, Check, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";
import { SanctuaryBead, SanctuaryGrowthStage } from "@/types/dashboard";

interface WeeklyRhythmSanctuaryProps {
  checkinHistory?: CheckinResponse[];
  todayCheckin?: CheckinResponse | null;
  streakDays?: number;
  calmScore?: number;
  onOpenCheckinModal?: () => void;
}

export default React.memo(function WeeklyRhythmSanctuary({
  checkinHistory = [],
  todayCheckin,
  streakDays = 1,
  calmScore = 84,
  onOpenCheckinModal,
}: WeeklyRhythmSanctuaryProps) {
  const { isLight } = useTheme();
  const [activeBeadIndex, setActiveBeadIndex] = useState<number | null>(null);

  // Days of current week (Monday to Sunday)
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Compute 7 Sanctuary Beads
  const beads: SanctuaryBead[] = useMemo(() => {
    return daysOfWeek.map((letter, index) => {
      const daysDiff = index - todayIndex;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysDiff);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Check if match in history or today
      const matched = checkinHistory.find(
        (c) => (c.date && c.date.startsWith(dateStr)) || (c.created_at && c.created_at.startsWith(dateStr))
      );

      const isToday = index === todayIndex;
      const isPast = index < todayIndex;
      const isFuture = index > todayIndex;

      let status: SanctuaryBead["status"] = "future";
      let mood = matched?.mood;
      let activity = "Sanctuary moment";
      let reflection = "A quiet pause was taken.";

      if (isToday) {
        if (todayCheckin) {
          status = "completed";
          mood = todayCheckin.mood;
          activity = "Daily reflection & breathing";
          reflection = "Checked in with present-moment awareness.";
        } else {
          status = "today";
          activity = "Ready for today's pause";
          reflection = "Arrive whenever you are ready.";
        }
      } else if (isPast) {
        if (matched) {
          status = "completed";
          mood = matched.mood;
          activity = "Guided breath & check-in";
          reflection = `Felt ${matched.mood || "grounded"} during reflection.`;
        } else {
          status = "missed";
          activity = "Gentle rest day";
          reflection = "Quiet unrecorded presence.";
        }
      }

      return {
        dayLetter: letter,
        dayIndex: index,
        dateStr,
        status,
        mood,
        moodEmoji: mood?.toLowerCase().includes("peace") || mood?.toLowerCase().includes("calm") ? "🌱" : "✨",
        activitySummary: activity,
        reflectionSnippet: reflection,
      };
    });
  }, [checkinHistory, todayCheckin, todayIndex]);

  // Compute Sanctuary Growth Stage (Progress without gamification)
  const growthStage: SanctuaryGrowthStage = useMemo(() => {
    if (streakDays >= 45) {
      return {
        streakDays,
        stageName: "Sanctuary Horizon Illuminated",
        description: "Sunrise washes over the high mountain ridge. Your presence has built a enduring home.",
        visualIcon: "horizon",
        progressPercentage: 100,
        nextMilestoneDays: 60,
      };
    } else if (streakDays >= 21) {
      return {
        streakDays,
        stageName: "Sanctuary Sakura in Bloom",
        description: "Delicate cherry blossoms drift quietly across your garden pool. Stillness has taken root.",
        visualIcon: "tree",
        progressPercentage: Math.min(100, Math.round((streakDays / 45) * 100)),
        nextMilestoneDays: 45,
      };
    } else if (streakDays >= 7) {
      return {
        streakDays,
        stageName: "Garden Stream Flowing",
        description: "A gentle stream murmurs through the valley stones. Your rhythm is finding its natural course.",
        visualIcon: "stream",
        progressPercentage: Math.min(100, Math.round((streakDays / 21) * 100)),
        nextMilestoneDays: 21,
      };
    }
    return {
      streakDays,
      stageName: "Sanctuary Lantern Lit",
      description: "A warm paper lantern glows at the garden gate. Step inside at your own pace.",
      visualIcon: "lantern",
      progressPercentage: Math.min(100, Math.round((streakDays / 7) * 100)),
      nextMilestoneDays: 7,
    };
  }, [streakDays]);

  const activeBead = activeBeadIndex !== null ? beads[activeBeadIndex] : beads[todayIndex];

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 transition-all duration-300 ${
        isLight
          ? "bg-[#fdfbf7]/90 border-stone-200/80 shadow-xs"
          : "bg-[#1a1b22]/90 border-[#292b36] shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-amber-50 border-amber-200/80 text-amber-700"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <Calendar size={15} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Weekly Rhythm &amp; Sanctuary Growth
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Connected presence across your week
            </p>
          </div>
        </div>

        {/* Growth Stage Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif border self-start sm:self-center ${
            isLight
              ? "bg-amber-50/80 border-amber-200 text-amber-800"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          <span>
            {growthStage.visualIcon === "lantern"
              ? "🏮"
              : growthStage.visualIcon === "stream"
              ? "🌊"
              : growthStage.visualIcon === "tree"
              ? "🌸"
              : "⛰️"}
          </span>
          <span className="font-medium">{growthStage.stageName}</span>
        </div>
      </div>

      {/* Connected Flowing Sanctuary Beads */}
      <div className="pt-7 pb-4">
        <div className="relative flex items-center justify-between px-3 sm:px-6">
          {/* Continuous flowing horizontal connector thread */}
          <div
            aria-hidden="true"
            className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 z-0"
            style={{
              background: isLight
                ? "linear-gradient(to right, rgba(16,185,129,0.35), rgba(245,158,11,0.4), rgba(214,211,209,0.5))"
                : "linear-gradient(to right, rgba(16,185,129,0.3), rgba(245,158,11,0.35), rgba(63,63,70,0.5))",
            }}
          />

          {/* 7 Beads */}
          {beads.map((bead, idx) => {
            const isSelected = activeBeadIndex === idx;
            const isCurrentDay = idx === todayIndex;

            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveBeadIndex(idx);
                  if (isCurrentDay && !todayCheckin && onOpenCheckinModal) {
                    onOpenCheckinModal();
                  }
                }}
                onMouseEnter={() => setActiveBeadIndex(idx)}
                className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
              >
                {/* Bead Orb */}
                <div
                  className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-115 ${
                    bead.status === "completed"
                      ? isLight
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-100"
                        : "bg-emerald-500 text-white shadow-md shadow-emerald-500/40 ring-2 ring-emerald-950"
                      : isCurrentDay
                      ? isLight
                        ? "bg-amber-400 text-stone-900 animate-sanctuary-bead-halo font-semibold ring-2 ring-amber-200"
                        : "bg-amber-400 text-stone-950 animate-sanctuary-bead-halo font-semibold ring-2 ring-amber-900"
                      : bead.status === "partial"
                      ? isLight
                        ? "bg-amber-200/80 text-amber-900 ring-1 ring-amber-300"
                        : "bg-amber-900/40 text-amber-200 ring-1 ring-amber-800"
                      : isLight
                      ? "bg-white border-2 border-stone-200 text-stone-400 group-hover:border-stone-400"
                      : "bg-[#21232c] border-2 border-[#333644] text-zinc-500 group-hover:border-[#4d5166]"
                  }`}
                >
                  {bead.status === "completed" ? (
                    <Check size={14} strokeWidth={2.8} />
                  ) : (
                    <span>{bead.dayLetter}</span>
                  )}
                </div>

                {/* Day Label below */}
                <span
                  className={`text-[10px] sm:text-[11px] font-serif transition-colors ${
                    isCurrentDay
                      ? "font-semibold text-amber-600 dark:text-amber-400"
                      : isLight
                      ? "text-stone-500"
                      : "text-zinc-400"
                  }`}
                >
                  {bead.dayLetter}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover/Active Bead Detail Card */}
        {activeBead && (
          <div
            className={`mt-6 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${
              isLight
                ? "bg-white/90 border-stone-200 shadow-xs"
                : "bg-[#20222a]/90 border-[#323544] shadow-xs"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {activeBead.moodEmoji || "🍃"}
                </span>
                <span
                  className={`text-xs font-serif font-semibold ${
                    isLight ? "text-stone-900" : "text-zinc-100"
                  }`}
                >
                  {dayNames[activeBead.dayIndex]} ({activeBead.dateStr})
                </span>
                <span className="text-xs opacity-40">•</span>
                <span
                  className={`text-xs font-serif ${
                    isLight ? "text-stone-600" : "text-zinc-300"
                  }`}
                >
                  {activeBead.activitySummary}
                </span>
              </div>

              <p
                className={`text-xs font-serif italic ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                &ldquo;{activeBead.reflectionSnippet}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meaningful Sanctuary Growth (Progress without Gamification) */}
      <div className="mt-4 pt-4 border-t border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-md">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-serif font-semibold ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Sanctuary Bloom
            </span>
            <span
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              • {streakDays} days of calm return
            </span>
          </div>
          <p
            className={`text-xs font-serif leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {growthStage.description}
          </p>
        </div>

        {/* Gentle Bloom Progress Bar */}
        <div className="w-full sm:w-48 shrink-0 space-y-1.5">
          <div className="flex justify-between text-[10px] font-serif">
            <span className={isLight ? "text-stone-500" : "text-zinc-400"}>
              Current Haven
            </span>
            <span className={isLight ? "text-stone-700" : "text-zinc-300"}>
              {growthStage.progressPercentage}%
            </span>
          </div>
          <div
            className={`h-1.5 w-full rounded-full overflow-hidden ${
              isLight ? "bg-stone-200" : "bg-zinc-800"
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${growthStage.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
