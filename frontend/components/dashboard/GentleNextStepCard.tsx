"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Clock, Feather, Wind, MessageSquare, BookOpen, LucideIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";

interface GentleNextStepCardProps {
  todayCheckin?: CheckinResponse | null;
  lastConversation?: any;
  lastMoment?: RecentMoment | null;
  lastJournal?: JournalEntry | null;
  onOpenCheckinModal: () => void;
  onOpenCalmModal: () => void;
}

interface StepRecommendation {
  title: string;
  sentence: string;
  timeEstimate: string;
  buttonLabel: "Begin" | "Continue" | "Resume";
  icon: LucideIcon;
  badge: string;
  onClick: () => void;
}

export default React.memo(function GentleNextStepCard({
  todayCheckin,
  lastConversation,
  lastMoment,
  lastJournal,
  onOpenCheckinModal,
  onOpenCalmModal,
}: GentleNextStepCardProps) {
  const router = useRouter();
  const { isLight } = useTheme();

  // Intelligently select Athena's ONE single next step
  const recommendation = useMemo<StepRecommendation>(() => {
    const hour = new Date().getHours();

    // 1. If not checked in today -> Gentle Check-in
    if (!todayCheckin) {
      return {
        title: "3-minute breathing & check-in",
        sentence: "Take a quiet moment to honor how your mind and body are resting right now.",
        timeEstimate: "3 mins",
        buttonLabel: "Begin",
        icon: Feather,
        badge: "Recommended Next Step",
        onClick: onOpenCheckinModal,
      };
    }

    // 2. If recent studio practice exists
    if (lastMoment?.practice_type) {
      return {
        title: "Continue breathing practice",
        sentence: "Return to your quiet cadence in the living sanctuary.",
        timeEstimate: "4 mins",
        buttonLabel: "Resume",
        icon: Wind,
        badge: "Practice in Progress",
        onClick: () => router.push(`/studio?practice=${lastMoment.practice_type}`),
      };
    }

    // 3. If recent conversation exists
    if (lastConversation) {
      return {
        title: "Continue yesterday's conversation",
        sentence: "Pick up the gentle thread where your thoughts left off.",
        timeEstimate: "5 mins",
        buttonLabel: "Resume",
        icon: MessageSquare,
        badge: "Open Reflection",
        onClick: () => router.push("/chat"),
      };
    }

    // 4. Evening contemplation in Space
    if (hour >= 18) {
      return {
        title: "Write one thought",
        sentence: "Give words to one feeling before the day settles into rest.",
        timeEstimate: "3 mins",
        buttonLabel: "Begin",
        icon: BookOpen,
        badge: "Evening Space",
        onClick: () => router.push("/journal"),
      };
    }

    // 5. Default peaceful pause
    return {
      title: "Listen quietly",
      sentence: "Allow a moment of serene stillness with ambient soundscapes.",
      timeEstimate: "2 mins",
      buttonLabel: "Begin",
      icon: Wind,
      badge: "Gentle Pause",
      onClick: onOpenCalmModal,
    };
  }, [todayCheckin, lastConversation, lastMoment, router, onOpenCheckinModal, onOpenCalmModal]);

  const Icon = recommendation.icon;

  return (
    <div
      role="region"
      aria-label="Today's Gentle Next Step"
      className={`group relative overflow-hidden rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#ffffff]/90 to-[#faf8f5]/95 border-[#e8e4dc] shadow-sm hover:shadow-md hover:border-amber-300/80"
          : "bg-gradient-to-br from-[#181922]/95 via-[#161720]/90 to-[#12131a]/95 border-[#252733] shadow-md hover:shadow-lg hover:border-violet-500/50"
      }`}
    >
      {/* Soft Ambient Hover Glow Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-300"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(244, 114, 182, 0.15) 60%, transparent 80%)"
            : "radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(124, 58, 237, 0.1) 60%, transparent 80%)",
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left Content */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium font-serif ${
                isLight
                  ? "bg-amber-50 border-amber-200/90 text-amber-800"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <Sparkles size={11} className="text-amber-500 animate-pulse" />
              <span>{recommendation.badge}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-sans ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              <Clock size={11} />
              <span>{recommendation.timeEstimate}</span>
            </span>
          </div>

          <h2
            className={`text-xl sm:text-2xl font-serif font-medium tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {recommendation.title}
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed font-sans ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {recommendation.sentence}
          </p>
        </div>

        {/* Right Single Primary Action Button with Soft Hover Glow */}
        <div className="shrink-0 sm:self-center">
          <button
            type="button"
            onClick={recommendation.onClick}
            className={`relative group/btn inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-[18px] text-sm font-medium transition-all duration-200 active:scale-95 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isLight
                ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md hover:shadow-lg"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-950/50"
            }`}
          >
            {/* Ambient Button Glow */}
            <span
              aria-hidden="true"
              className="absolute -inset-0.5 rounded-full bg-amber-400/25 blur-sm opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none"
            />
            <Icon size={15} className="relative z-10 transition-transform group-hover/btn:scale-110 duration-180" />
            <span className="relative z-10 font-serif tracking-wide">{recommendation.buttonLabel}</span>
            <ArrowRight size={14} className="relative z-10 transition-transform group-hover/btn:translate-x-1 duration-180" />
          </button>
        </div>
      </div>
    </div>
  );
});
