"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sparkles, Check, Compass, Sun, Moon } from "lucide-react";

interface InsightsEmotionalSeasonProps {
  seasonName?: string;
  seasonTagline?: string;
}

export default function InsightsEmotionalSeason({
  seasonName = "Learning to Slow Down",
  seasonTagline = "A gentle season of releasing urgency and allowing yourself to arrive.",
}: InsightsEmotionalSeasonProps) {
  const { isLight } = useTheme();

  // Observed behaviors in this emotional season
  const observedBehaviors = [
    "Longer intentional pauses between demanding meetings.",
    "Noticed breath softening before entering evening family space.",
    "Declined non-essential weekend commitments to protect quiet.",
    "3 evening journal entries reflecting on bodily tension without judgment.",
  ];

  return (
    <section aria-label="Emotional Season Centerpiece" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2
          className={`text-xs font-sans uppercase tracking-widest font-semibold ${
            isLight ? "text-[#726E65]" : "text-[#959BB4]"
          }`}
        >
          Emotional Season
        </h2>
        <span
          className={`text-[11px] font-sans italic ${
            isLight ? "text-[#726E65]" : "text-[#959BB4]"
          }`}
        >
          Centerpiece Reflection
        </span>
      </div>

      {/* Large Gradient Centerpiece Card */}
      <div
        className={`relative overflow-hidden rounded-[24px] border p-7 sm:p-9 backdrop-blur-xl transition-all duration-[220ms] hover:scale-[1.01] ${
          isLight
            ? "bg-gradient-to-br from-[#F7F4EE] via-[#F1EBDD] to-[#E8DDC8]/60 border-[#E8DDC8] shadow-[0_6px_28px_-4px_rgba(44,38,30,0.08)]"
            : "bg-gradient-to-br from-[#151A2E] via-[#1A2038] to-[#2E2157]/50 border-[#2E2157]/80 shadow-[0_8px_36px_-4px_rgba(15,18,32,0.9),0_0_24px_rgba(167,139,250,0.15)]"
        }`}
      >
        {/* Subtle Animated Background Aura */}
        <div
          className={`absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-gradient-breathe ${
            isLight
              ? "bg-gradient-to-br from-purple-300/30 via-amber-200/25 to-sky-300/30"
              : "bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-sky-600/25"
          }`}
        />

        <div className="relative z-10 space-y-5">
          {/* Header Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                isLight
                  ? "bg-white/70 border-[#E8DDC8] text-violet-800"
                  : "bg-[#2E2157]/50 border-violet-400/40 text-violet-200"
              }`}
            >
              <Compass size={13} className="text-violet-500 animate-spin [animation-duration:30s]" />
              <span>Current Emotional Season</span>
            </span>
          </div>

          {/* Season Title in Large Elegant Serif */}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-hero-serif font-normal tracking-tight text-[#232220] dark:text-[#F1EEF8]">
              {seasonName}
            </h3>
            <p
              className={`text-sm sm:text-base font-sans leading-relaxed max-w-2xl ${
                isLight ? "text-[#726E65]" : "text-[#959BB4]"
              }`}
            >
              {seasonTagline}
            </p>
          </div>

          {/* Observed Behaviors Grid */}
          <div className="pt-2">
            <span
              className={`text-xs uppercase tracking-wider font-semibold font-sans block mb-3 ${
                isLight ? "text-[#726E65]" : "text-[#959BB4]"
              }`}
            >
              Observed Behaviors This Season
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {observedBehaviors.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 p-3 rounded-[18px] border transition-all duration-200 ${
                    isLight
                      ? "bg-white/60 border-[#E8DDC8]/80 text-[#232220]"
                      : "bg-[#111425]/60 border-[#2E2157]/50 text-[#F1EEF8]"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                      isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-950/60 text-emerald-300"
                    }`}
                  >
                    <Check size={11} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-sans leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
