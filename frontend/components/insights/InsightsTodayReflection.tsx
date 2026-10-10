"use client";

import React from "react";
import { Sparkles, Sun, Moon, Smile } from "lucide-react";
import { CheckinResponse } from "@/types/checkin";

interface InsightsTodayReflectionProps {
  todayCheckin: CheckinResponse | null;
  displayName: string;
}

export default function InsightsTodayReflection({
  todayCheckin,
  displayName,
}: InsightsTodayReflectionProps) {
  const isCheckedIn = Boolean(todayCheckin);
  const mood = todayCheckin?.mood ? todayCheckin.mood.toLowerCase() : "";

  // Dynamic sentence based on real checkin mood
  let reflectionSentence = "Your quiet space is here whenever you need to breathe.";
  let supportingNote = "No expectations or metrics to fulfill—just unhurried presence.";

  if (isCheckedIn) {
    if (mood.includes("calm") || mood.includes("peace") || mood.includes("ground")) {
      reflectionSentence = "A steady sense of calm is holding your day.";
      supportingNote = `You noted feeling ${mood} today. Your nervous system is settling into safety.`;
    } else if (mood.includes("anx") || mood.includes("stress") || mood.includes("overwhelm")) {
      reflectionSentence = "Holding space for what feels heavy right now.";
      supportingNote = "Acknowledging tension without judgment is the very first step toward release.";
    } else if (mood.includes("tired") || mood.includes("low") || mood.includes("exhaust")) {
      reflectionSentence = "Giving yourself permission to move slowly today.";
      supportingNote = "Rest is not a reward you earn; it is an essential foundation.";
    } else {
      reflectionSentence = "You showed up for yourself today.";
      supportingNote = `Today's check-in was recorded. Everything continues at your own natural pace.`;
    }
  }

  return (
    <section aria-label="Today's Reflection" className="relative">
      <div className="sanctuary-glass relative rounded-[28px] p-6 sm:p-10 border border-[#7C5CFF]/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.08)] overflow-hidden">
        {/* Ambient Radial Spotlight */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs font-sans font-medium text-[#BFAEFF] backdrop-blur-md">
            <Sparkles size={13} className="text-[#BFAEFF]" />
            <span>Storytelling Insights</span>
            <span className="opacity-40">•</span>
            <span>Today&apos;s Reflection</span>
          </div>

          <h1 className="text-[28px] sm:text-[38px] lg:text-[44px] font-hero-serif font-bold tracking-tight leading-[1.12] text-[#F8F7FF] drop-shadow-[0_0_20px_rgba(124,92,255,0.2)]">
            &ldquo;{reflectionSentence}&rdquo;
          </h1>

          <p className="text-sm sm:text-base font-sans text-[#B8BDD6] leading-relaxed">
            {supportingNote}
          </p>
        </div>
      </div>
    </section>
  );
}
