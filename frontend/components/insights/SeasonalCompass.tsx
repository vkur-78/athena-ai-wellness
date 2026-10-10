"use client";

import React, { useMemo } from "react";
import { Compass, Sparkles, Moon, Sun, Flower2, Heart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { EmotionalSeason } from "@/types/insights";

interface SeasonalCompassProps {
  season: EmotionalSeason | null;
}

export default React.memo(function SeasonalCompass({
  season,
}: SeasonalCompassProps) {
  const { isLight } = useTheme();

  const seasonTitle = season?.season_title || "Season of Deep Rest";
  const seasonReason =
    season?.why_this_season ||
    "Your presence has focused on intentional deceleration and rebuilding core energy.";

  // Cardinal directions of the Emotional Season Compass
  const cardinalPoints = [
    { label: "Rest", direction: "N", angle: 0, icon: <Moon size={13} className="text-indigo-400" /> },
    { label: "Growth", direction: "E", angle: 90, icon: <Flower2 size={13} className="text-emerald-400" /> },
    { label: "Recovery", direction: "S", angle: 180, icon: <Heart size={13} className="text-rose-400" /> },
    { label: "Reflection", direction: "W", angle: 270, icon: <Sparkles size={13} className="text-amber-400" /> },
  ];

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-8 transition-all duration-200 text-center flex flex-col items-center ${
        isLight
          ? "bg-gradient-to-b from-[#fdfbf7] via-white to-[#f8f6f0] border-stone-200/80 shadow-xs"
          : "bg-gradient-to-b from-[#1a1b22] via-[#16171e] to-[#121318] border-[#292b36] shadow-xs"
      }`}
    >
      <div className="flex items-center gap-2 mb-6">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs ${
            isLight
              ? "bg-stone-100 border-stone-200 text-stone-700"
              : "bg-zinc-800 border-zinc-700 text-zinc-300"
          }`}
        >
          <Compass size={13} />
        </div>
        <h3
          className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
            isLight ? "text-stone-900" : "text-white"
          }`}
        >
          Emotional Season Compass
        </h3>
      </div>

      {/* Rotating Seasonal Compass Visualization */}
      <div className="relative flex items-center justify-center h-60 w-60 select-none my-2">
        {/* Slow Ambient Outer Rotating Compass Ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-stone-300 dark:border-zinc-700 animate-compass-slow pointer-events-none opacity-60" />

        {/* Outer Orbital Glow */}
        <div
          aria-hidden="true"
          className="absolute inset-4 rounded-full blur-xl opacity-35 animate-sanctuary-pulse pointer-events-none"
          style={{
            background: isLight
              ? "radial-gradient(circle, rgba(167, 139, 250, 0.4), transparent 70%)"
              : "radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%)",
          }}
        />

        {/* 4 Cardinal Points (Rest, Growth, Recovery, Reflection) */}
        {cardinalPoints.map((point) => {
          let posClass = "top-1 left-1/2 -translate-x-1/2";
          if (point.direction === "E") posClass = "right-1 top-1/2 -translate-y-1/2";
          else if (point.direction === "S") posClass = "bottom-1 left-1/2 -translate-x-1/2";
          else if (point.direction === "W") posClass = "left-1 top-1/2 -translate-y-1/2";

          return (
            <div
              key={point.direction}
              className={`absolute z-10 flex flex-col items-center gap-1 ${posClass}`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-xs ${
                  isLight
                    ? "bg-white border-stone-200"
                    : "bg-[#20222a] border-[#343644]"
                }`}
              >
                {point.icon}
              </div>
              <span
                className={`text-[10px] font-serif uppercase tracking-wider font-medium ${
                  isLight ? "text-stone-600" : "text-zinc-400"
                }`}
              >
                {point.label}
              </span>
            </div>
          );
        })}

        {/* Center: Current Emotional Season Sphere */}
        <div
          className={`relative z-20 flex flex-col items-center justify-center h-28 w-28 rounded-full border text-center p-3 shadow-md transition-transform hover:scale-105 ${
            isLight
              ? "bg-white/95 border-amber-200/90 text-stone-900 shadow-stone-200/50"
              : "bg-[#1f2028]/95 border-amber-500/30 text-white shadow-black/40"
          }`}
        >
          <span className="text-xl mb-1">🌿</span>
          <span className="text-xs font-serif font-semibold leading-tight line-clamp-2">
            {seasonTitle}
          </span>
        </div>
      </div>

      {/* Season Explanation & One Restorative Closing Thought */}
      <div className="max-w-md space-y-2 mt-4">
        <p
          className={`text-xs font-serif leading-relaxed ${
            isLight ? "text-stone-600" : "text-zinc-300"
          }`}
        >
          {seasonReason}
        </p>

        <div
          className={`pt-3 border-t border-inherit text-xs sm:text-sm font-serif italic ${
            isLight ? "text-stone-700" : "text-zinc-200"
          }`}
        >
          &ldquo;You are not behind. Growth in your sanctuary moves at the pace of quiet seasons, not clockwork.&rdquo;
        </div>
      </div>
    </div>
  );
});
