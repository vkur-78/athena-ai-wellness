"use client";

import React, { useMemo } from "react";
import { Sun, Moon, CloudSun, Sunset, Feather, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface LivingHeroSectionProps {
  displayName: string;
  todayCheckin?: CheckinResponse | null;
  streakDays?: number;
}

const HERO_STATEMENTS = [
  "Another gentle step begins here.",
  "Your quiet moments are becoming a rhythm.",
  "Small pauses have been finding you lately.",
  "Allowing space for whatever today brings.",
  "Every breath is an invitation to begin again.",
  "A quiet cadence is gently unfolding.",
];

export default React.memo(function LivingHeroSection({
  displayName,
  todayCheckin,
  streakDays = 0,
}: LivingHeroSectionProps) {
  const { isLight } = useTheme();

  // Dynamic Greeting based on exact time of day
  const { greeting, periodLabel, timeIcon } = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good morning",
        periodLabel: "Morning Sunlight",
        timeIcon: <Sun size={13} className="text-amber-500" />,
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Welcome back",
        periodLabel: "Open Canopy",
        timeIcon: <CloudSun size={13} className="text-sky-500" />,
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: "Glad you're here",
        periodLabel: "Peach Twilight",
        timeIcon: <Sunset size={13} className="text-rose-400" />,
      };
    } else {
      return {
        greeting: "The day can rest now",
        periodLabel: "Quiet Starlight",
        timeIcon: <Moon size={13} className="text-indigo-400" />,
      };
    }
  }, []);

  // Short personalized line (max 2 lines)
  const heroStatement = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return HERO_STATEMENTS[dayOfYear % HERO_STATEMENTS.length];
  }, []);

  return (
    <section
      aria-label="Sanctuary Living Hero"
      className="relative z-10 w-full pt-2 pb-1"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          {/* Subtle Atmosphere & Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium backdrop-blur-md transition-all ${
                isLight
                  ? "bg-white/80 border-stone-200/90 text-stone-600 shadow-xs"
                  : "bg-zinc-900/70 border-zinc-800 text-zinc-300 shadow-xs"
              }`}
            >
              {timeIcon}
              <span>{periodLabel}</span>
              <span className="opacity-40">•</span>
              <span>Sanctuary</span>
            </div>

            {todayCheckin?.mood && (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium backdrop-blur-md ${
                  isLight
                    ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-800"
                    : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="capitalize">{todayCheckin.mood}</span>
              </div>
            )}
          </div>

          {/* Living Greeting */}
          <h1
            className={`text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold tracking-tight leading-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {greeting}, {displayName}.
          </h1>

          {/* Personalized Hero Statement (max 2 lines) */}
          <p
            className={`text-sm sm:text-base font-serif italic max-w-xl leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {heroStatement}
          </p>
        </div>
      </div>
    </section>
  );
});
