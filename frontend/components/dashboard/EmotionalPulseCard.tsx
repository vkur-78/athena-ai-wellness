"use client";

import React, { useMemo } from "react";
import { Heart, Activity, Clock, TrendingUp, Sparkles, Feather, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface EmotionalPulseCardProps {
  todayCheckin?: CheckinResponse | null;
  calmScore?: number;
  checkinHistory?: CheckinResponse[];
  onCheckinClick: () => void;
}

export default React.memo(function EmotionalPulseCard({
  todayCheckin,
  calmScore = 84,
  checkinHistory = [],
  onCheckinClick,
}: EmotionalPulseCardProps) {
  const { isLight } = useTheme();

  // Mood Emoji mapping
  const moodEmoji = useMemo(() => {
    switch (todayCheckin?.mood?.toLowerCase()) {
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
  }, [todayCheckin?.mood]);

  // Format reflection time
  const reflectionTimeStr = useMemo(() => {
    if (!todayCheckin) return "Waiting for today's reflection";
    try {
      const raw = todayCheckin.created_at || todayCheckin.date;
      if (!raw) return "Checked in today";
      const date = new Date(raw);
      return `Reflected at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    } catch {
      return "Checked in today";
    }
  }, [todayCheckin]);

  // Compute energy level (1 to 4) based on stress & mood
  const { energyLabel, energyLevel } = useMemo(() => {
    if (!todayCheckin) {
      return { energyLabel: "Gentle Rest", energyLevel: 2 };
    }
    const stress = todayCheckin.stress_level || 3;
    if (stress <= 2) {
      return { energyLabel: "Steady Calm", energyLevel: 3 };
    } else if (stress === 3) {
      return { energyLabel: "Balanced Flow", energyLevel: 2 };
    } else if (stress === 4) {
      return { energyLabel: "Gentle Rest", energyLevel: 1 };
    }
    return { energyLabel: "Deep Care", energyLevel: 1 };
  }, [todayCheckin]);

  // Compute emotional shift comparison against recent history
  const emotionalShift = useMemo(() => {
    if (!todayCheckin) return "Holding a calm baseline";
    if (checkinHistory.length >= 2) {
      const yesterday = checkinHistory[1];
      const prevStress = yesterday.stress_level || 3;
      const currStress = todayCheckin.stress_level || 3;
      if (currStress < prevStress) {
        return "+14% calmer than yesterday";
      } else if (currStress > prevStress) {
        return "Noticing extra tension today";
      }
      return "Stable emotional cadence";
    }
    return "Settled into ease";
  }, [todayCheckin, checkinHistory]);

  return (
    <div
      onClick={onCheckinClick}
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 transition-all duration-300 group cursor-pointer ${
        isLight
          ? "bg-gradient-to-br from-white/90 via-[#fdfcf9]/85 to-[#faf6f0]/90 border-stone-200/80 hover:border-stone-300 shadow-sm hover:shadow-md"
          : "bg-gradient-to-br from-[#1c1d24]/90 via-[#181920]/85 to-[#14151a]/90 border-[#2b2d38] hover:border-[#3d4050] shadow-md hover:shadow-lg"
      }`}
    >
      {/* 1. Living Radial Breathing Glow Centerpiece */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -left-12 sm:left-1/4 h-72 w-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-60 animate-sanctuary-pulse"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(253, 230, 138, 0.45) 0%, rgba(244, 114, 182, 0.2) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(167, 139, 250, 0.28) 0%, rgba(245, 158, 11, 0.14) 50%, transparent 70%)",
        }}
      />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-amber-50 border-amber-200/80 text-amber-700"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <Activity size={15} />
          </div>
          <div>
            <h2
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Today&apos;s Emotional Pulse
            </h2>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Living center of your daily sanctuary
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif border ${
              todayCheckin
                ? isLight
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                  : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                : isLight
                ? "bg-stone-100 border-stone-200 text-stone-600"
                : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                todayCheckin ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{todayCheckin ? "Checked In" : "Awaiting Check-in"}</span>
          </span>
          <ArrowUpRight
            size={15}
            className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-inherit"
          />
        </div>
      </div>

      {/* Centerpiece 4-Metric Responsive Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
        {/* Metric 1: Mood / Current Feeling */}
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl border shadow-xs transition-transform group-hover:scale-105 ${
              isLight
                ? "bg-white/90 border-stone-200"
                : "bg-[#23242e] border-[#36384a]"
            }`}
          >
            <span>{todayCheckin ? moodEmoji : "🌿"}</span>
          </div>
          <div>
            <span
              className={`block text-[11px] uppercase tracking-wider font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Current State
            </span>
            <span
              className={`text-sm sm:text-base font-serif font-semibold capitalize ${
                isLight ? "text-stone-900" : "text-zinc-100"
              }`}
            >
              {todayCheckin?.mood || "Gentle Pause"}
            </span>
            <span
              className={`block text-[11px] font-serif truncate max-w-[140px] ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {todayCheckin ? "Recorded today" : "Tap to reflect"}
            </span>
          </div>
        </div>

        {/* Metric 2: Calm Score Level */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            {/* Circular Gauge */}
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className={isLight ? "text-stone-200" : "text-zinc-800"}
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isLight ? "text-emerald-500" : "text-violet-400"}
                strokeDasharray={`${calmScore}, 100`}
                strokeLinecap="round"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span
              className={`absolute text-xs font-serif font-semibold ${
                isLight ? "text-stone-800" : "text-zinc-100"
              }`}
            >
              {calmScore}%
            </span>
          </div>
          <div>
            <span
              className={`block text-[11px] uppercase tracking-wider font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Calm Level
            </span>
            <span
              className={`text-sm sm:text-base font-serif font-semibold ${
                isLight ? "text-stone-900" : "text-zinc-100"
              }`}
            >
              {calmScore >= 80 ? "Deep Serenity" : calmScore >= 60 ? "Steady Calm" : "Gentle Rest"}
            </span>
            <span
              className={`block text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Harmonious baseline
            </span>
          </div>
        </div>

        {/* Metric 3: Energy Level */}
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs ${
              isLight
                ? "bg-white/90 border-stone-200 text-amber-600"
                : "bg-[#23242e] border-[#36384a] text-amber-400"
            }`}
          >
            {/* 4-tier energy bars */}
            <div className="flex items-end gap-1 h-5">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    bar <= energyLevel
                      ? isLight
                        ? "bg-amber-500"
                        : "bg-amber-400"
                      : isLight
                      ? "bg-stone-200"
                      : "bg-zinc-700"
                  }`}
                  style={{ height: `${bar * 5}px` }}
                />
              ))}
            </div>
          </div>
          <div>
            <span
              className={`block text-[11px] uppercase tracking-wider font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Energy Rhythm
            </span>
            <span
              className={`text-sm sm:text-base font-serif font-semibold ${
                isLight ? "text-stone-900" : "text-zinc-100"
              }`}
            >
              {energyLabel}
            </span>
            <span
              className={`block text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Tier {energyLevel} of 4
            </span>
          </div>
        </div>

        {/* Metric 4: Shift & Reflection Time */}
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs ${
              isLight
                ? "bg-white/90 border-stone-200 text-violet-600"
                : "bg-[#23242e] border-[#36384a] text-violet-400"
            }`}
          >
            <Clock size={18} />
          </div>
          <div>
            <span
              className={`block text-[11px] uppercase tracking-wider font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Emotional Shift
            </span>
            <span
              className={`text-sm sm:text-base font-serif font-semibold ${
                isLight ? "text-stone-900" : "text-zinc-100"
              }`}
            >
              {emotionalShift}
            </span>
            <span
              className={`block text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {reflectionTimeStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
