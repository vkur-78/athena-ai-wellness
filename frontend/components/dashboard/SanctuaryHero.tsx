"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";
import { ArrowRight, Check, Sparkles, Clock } from "lucide-react";

import { getZonedTimeParts, formatZonedTime } from "@/lib/timezone";

interface SanctuaryHeroProps {
  displayName: string;
  todayCheckin: CheckinResponse | null;
  lastVisitText: string;
  onOpenCheckinModal: () => void;
}

export default function SanctuaryHero({
  displayName,
  todayCheckin,
  lastVisitText,
  onOpenCheckinModal,
}: SanctuaryHeroProps) {
  const { isLight } = useTheme();

  // Time-aware greeting in Asia/Kolkata
  const zonedParts = getZonedTimeParts();
  const timeGreeting =
    zonedParts.timeOfDay === "Morning"
      ? "Good Morning"
      : zonedParts.timeOfDay === "Afternoon"
      ? "Good Afternoon"
      : zonedParts.timeOfDay === "Evening"
      ? "Good Evening"
      : "Peaceful Night";

  const isCompleted = Boolean(todayCheckin);

  // Formatted check-in time in Asia/Kolkata
  let completedTimeStr: string | null = null;
  if (todayCheckin?.created_at || todayCheckin?.date) {
    completedTimeStr = formatZonedTime(todayCheckin.created_at || todayCheckin.date);
  }

  // Real mood name
  const moodName = todayCheckin?.mood
    ? todayCheckin.mood.charAt(0).toUpperCase() + todayCheckin.mood.slice(1)
    : "Completed";

  // Accent mapping for mood ring (Phase 8.1 Palette)
  const getRingColor = () => {
    if (!isCompleted) {
      return "#7C5CFF"; // Indigo Glow
    }
    const m = (todayCheckin?.mood || "").toLowerCase();
    if (m.includes("calm") || m.includes("ground") || m.includes("peace")) {
      return "#4ADE80"; // Status Emerald
    }
    if (m.includes("anx") || m.includes("stress") || m.includes("heav") || m.includes("low")) {
      return "#FB7185"; // Status Coral
    }
    if (m.includes("think") || m.includes("reflect") || m.includes("flow")) {
      return "#BFAEFF"; // Lavender Mist
    }
    return "#7C5CFF";
  };

  const ringColor = getRingColor();

  return (
    <section
      aria-label="Welcome Hero"
      className="sanctuary-glass relative rounded-[28px] p-6 sm:p-10 border border-[#7C5CFF]/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.1)] transition-all duration-[250ms] overflow-hidden"
    >
      {/* Ambient Radial Spotlight Behind Hero Content */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-12">
        {/* Left Side: Editorial Typography & Single Check-in CTA */}
        <div className="space-y-5 max-w-xl">
          {/* Subtle Sanctuary Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs font-sans font-medium text-[#BFAEFF] backdrop-blur-md">
            <Sparkles size={13} className="text-[#BFAEFF]" />
            <span>Athena Sanctuary</span>
            <span className="opacity-40">•</span>
            <span>Quiet Room</span>
          </div>

          {/* Hero Heading: Moon White, very bold, large, soft glow */}
          <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-hero-serif font-bold tracking-tight leading-[1.08] text-[#F8F7FF] drop-shadow-[0_0_24px_rgba(124,92,255,0.2)]">
            {timeGreeting}, {displayName}.
          </h1>

          {/* Quote: Secondary, Soft Silver, Elegant */}
          <p className="text-base sm:text-lg font-sans leading-relaxed text-[#B8BDD6]">
            &ldquo;You&apos;ve returned. That&apos;s enough for today.&rdquo;
          </p>

          {/* Chips: Small floating translucent glass capsules */}
          <div className="pt-1 flex flex-wrap items-center gap-3 text-xs sm:text-[13px] font-sans">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#7C5CFF]/25 bg-[#0B1228]/70 text-[#B8BDD6] backdrop-blur-xl shadow-xs">
              <Clock size={13} className="text-[#BFAEFF]" />
              <span>{lastVisitText}</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#7C5CFF]/25 bg-[#0B1228]/70 text-[#B8BDD6] backdrop-blur-xl shadow-xs">
              {isCompleted ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
                  <span>
                    Today&apos;s check-in complete {completedTimeStr ? `• ${completedTimeStr}` : ""}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
                  <span>Today&apos;s check-in waiting</span>
                </>
              )}
            </div>
          </div>

          {/* Primary Button: Glowing Indigo Pill, Moon White Text */}
          <div className="pt-2">
            {!isCompleted ? (
              <button
                type="button"
                id="hero-begin-checkin-btn"
                onClick={onOpenCheckinModal}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 min-h-[48px] rounded-[20px] text-sm font-semibold tracking-wide text-[#F8F7FF] transition-all duration-[200ms] hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-[#7C5CFF] hover:bg-[#6845F5] shadow-[0_0_20px_rgba(124,92,255,0.45)] hover:shadow-[0_0_32px_rgba(124,92,255,0.65)] border border-[#7C5CFF]/60"
              >
                <span>Begin Check-in</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-[20px] text-sm font-medium border border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80] shadow-[0_0_12px_rgba(74,222,128,0.2)]">
                <Check size={16} />
                <span>Today&apos;s Check-in Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Presence Ring (Thicker stroke, Indigo glow, Animated idle pulse) */}
        <div className="shrink-0 flex flex-col items-center justify-center pt-2 lg:pt-0">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center animate-mood-ring">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Subtle Ambient Track */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="9"
                fill="transparent"
                className="text-[#0B1228]/80"
              />

              {/* Glowing Presence Stroke */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke={ringColor}
                strokeWidth="9"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={isCompleted ? 0 : 2 * Math.PI * 64 * 0.95}
                strokeLinecap="round"
                fill="transparent"
                className={`transition-all duration-1000 ease-out ${
                  isCompleted ? "animate-pulse" : ""
                }`}
                style={{
                  filter: isCompleted
                    ? `drop-shadow(0 0 18px ${ringColor})`
                    : `drop-shadow(0 0 10px rgba(124,92,255,0.4))`,
                }}
              />
            </svg>

            {/* Inner Ring State: Readable Moon White typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
              <span className="text-[11px] font-sans font-medium tracking-wider uppercase text-[#BFAEFF]">
                {isCompleted ? "Today's State" : "Presence Ring"}
              </span>

              <span className="text-base sm:text-xl font-hero-serif font-bold tracking-tight text-[#F8F7FF] mt-1">
                {isCompleted ? moodName : "Ready when you are."}
              </span>

              <span className="text-[11px] font-sans text-[#B8BDD6] mt-0.5">
                {isCompleted ? (completedTimeStr ? `Checked in at ${completedTimeStr}` : "Recorded today") : "Take your time"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
