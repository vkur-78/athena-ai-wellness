"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sparkles } from "lucide-react";

interface InsightsVisualHeroProps {
  heroSentence?: string;
  rhythmScore?: number;
}

export default function InsightsVisualHero({
  heroSentence = "Your evenings have been getting lighter.",
  rhythmScore = 88,
}: InsightsVisualHeroProps) {
  const { isLight } = useTheme();

  return (
    <section
      aria-label="Insights Storytelling Hero"
      className={`relative w-full rounded-[24px] border p-7 sm:p-9 backdrop-blur-xl transition-all duration-[220ms] ${
        isLight
          ? "bg-[#F7F4EE]/90 border-[#E8DDC8] shadow-[0_4px_24px_-4px_rgba(44,38,30,0.06)]"
          : "bg-[#151A2E]/85 border-[#2E2157]/60 shadow-[0_8px_32px_-4px_rgba(15,18,32,0.8),0_0_20px_rgba(167,139,250,0.12)]"
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
          isLight
            ? "bg-gradient-to-br from-amber-200/40 via-purple-200/30 to-sky-200/30"
            : "bg-gradient-to-br from-violet-600/25 via-indigo-600/20 to-sky-600/15"
        }`}
      />

      <div className="relative z-10 space-y-4">
        {/* Subtitle badge */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest font-sans text-violet-600 dark:text-violet-400">
          <Sparkles size={13} />
          <span>Emotional Landscape</span>
          <span className="opacity-40">•</span>
          <span>Living Story</span>
        </div>

        {/* Hero: Large elegant serif */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-hero-serif font-normal tracking-tight text-[#232220] dark:text-[#F1EEF8] max-w-3xl leading-tight">
          {heroSentence}
        </h1>

        {/* Animated emotional rhythm below hero */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-sans font-medium uppercase tracking-wider ${
                isLight ? "text-[#726E65]" : "text-[#959BB4]"
              }`}
            >
              Current Rhythm
            </span>

            {/* Living rhythm pulse visual */}
            <div className="flex items-center gap-1.5 h-6 px-3 rounded-full border border-violet-500/20 bg-violet-500/10">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs font-semibold font-sans text-violet-600 dark:text-violet-300">
                Gentle Flow ({rhythmScore}% Harmony)
              </span>
            </div>
          </div>

          {/* Calming wave bars */}
          <div className="flex items-center gap-1.5 h-5">
            {[40, 65, 85, 95, 80, 60, 45, 75, 90, 70, 50, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-700 ease-in-out"
                style={{
                  height: `${h}%`,
                  backgroundColor: isLight ? "#A78BFA" : "#C4B5FD",
                  opacity: 0.35 + (h / 100) * 0.65,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
