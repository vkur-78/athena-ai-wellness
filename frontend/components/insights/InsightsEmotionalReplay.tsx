"use client";

import React from "react";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { Zap, Sun, Shield, HeartHandshake, Disc } from "lucide-react";

interface InsightsEmotionalReplayProps {
  checkinHistory?: CheckinResponse[];
  recentMoments?: RecentMoment[];
  recentJournals?: JournalEntry[];
  onOpenReplay?: () => void;
}

export default function InsightsEmotionalReplay({
  checkinHistory = [],
  recentMoments = [],
  recentJournals = [],
  onOpenReplay,
}: InsightsEmotionalReplayProps) {
  // 1. Biggest Emotional Shift
  // Check if any checkin went from heavy/anxious to calm
  let biggestShift = "Shifted from tension into calm grounding";
  const hasShift = checkinHistory.some((c) => {
    const m = (c.mood || "").toLowerCase();
    return m.includes("calm") || m.includes("peace");
  }) && checkinHistory.some((c) => {
    const m = (c.mood || "").toLowerCase();
    return m.includes("stress") || m.includes("anx") || m.includes("heavy");
  });

  // 2. Calmest Day
  // Find day with calmest mood checkin or multiple practices
  const calmestDayName = checkinHistory.find((c) => {
    const m = (c.mood || "").toLowerCase();
    return m.includes("calm") || m.includes("peace");
  });
  const calmestDayText = calmestDayName?.date
    ? new Date(calmestDayName.date).toLocaleDateString(undefined, { weekday: "long" })
    : null;

  // 3. Strongest Comeback
  // Check if user returned after gaps or after stress
  const hasComeback = checkinHistory.length >= 2;

  // 4. Most Supportive Habit
  let supportiveHabit = "Breathing & Stillness";
  if (recentJournals.length > recentMoments.length) {
    supportiveHabit = "Space Journal Writing";
  } else if (recentMoments.length > 0) {
    const latest = recentMoments[0];
    supportiveHabit = latest.title?.replace(/Practice|Exercise/gi, "").trim() || "Breathe Together";
  }

  const replayCards = [
    {
      id: "shift",
      title: "Biggest Emotional Shift",
      stat: hasShift ? "Tension → Grounded" : null,
      description: hasShift
        ? "You softened acute daytime pressure through intentional pauses."
        : "More entries unlock this insight.",
      icon: Zap,
      accent: "#BFAEFF",
      gradient: "from-[#7C5CFF]/20 via-[#BFAEFF]/10 to-transparent",
    },
    {
      id: "calm",
      title: "Calmest Day",
      stat: calmestDayText || null,
      description: calmestDayText
        ? `${calmestDayText} carried your deepest grounded reflections.`
        : "More entries unlock this insight.",
      icon: Sun,
      accent: "#4ADE80",
      gradient: "from-[#4ADE80]/20 via-[#4ADE80]/10 to-transparent",
    },
    {
      id: "comeback",
      title: "Strongest Comeback",
      stat: hasComeback ? "Returned After Stress" : null,
      description: hasComeback
        ? "You chose to return to your sanctuary even following difficult moments."
        : "More entries unlock this insight.",
      icon: Shield,
      accent: "#38BDF8",
      gradient: "from-[#38BDF8]/20 via-[#38BDF8]/10 to-transparent",
    },
    {
      id: "habit",
      title: "Most Supportive Habit",
      stat: recentMoments.length > 0 || recentJournals.length > 0 ? supportiveHabit : null,
      description: recentMoments.length > 0 || recentJournals.length > 0
        ? `Your recurring anchor across recent reflections.`
        : "More entries unlock this insight.",
      icon: HeartHandshake,
      accent: "#FB7185",
      gradient: "from-[#FB7185]/20 via-[#FB7185]/10 to-transparent",
    },
  ];

  return (
    <section aria-label="Emotional Replay" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#BFAEFF] mb-1">
            <Disc size={13} className="text-[#BFAEFF]" />
            <span>Spotify Wrapped Style</span>
          </div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Emotional Replay
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Flagship emotional milestones synthesized from your stored activity.
          </p>
        </div>

        {onOpenReplay && (
          <button
            type="button"
            onClick={onOpenReplay}
            className="px-4 py-2 rounded-2xl bg-[#7C5CFF]/15 hover:bg-[#7C5CFF]/25 border border-[#7C5CFF]/30 text-xs font-semibold text-[#F8F7FF] transition shadow-[0_0_12px_rgba(124,92,255,0.2)] hover:-translate-y-0.5 cursor-pointer"
          >
            Launch Cinematic Replay
          </button>
        )}
      </div>

      {/* 4 Spotify-Wrapped Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {replayCards.map((card) => {
          const Icon = card.icon;
          const isUnlocked = Boolean(card.stat);

          return (
            <div
              key={card.id}
              className={`sanctuary-glass relative flex flex-col justify-between p-6 sm:p-7 rounded-[26px] border overflow-hidden transition-all duration-[220ms] ${
                isUnlocked
                  ? "border-[#7C5CFF]/25 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.08)] hover:-translate-y-1 hover:border-[#7C5CFF]/50"
                  : "border-white/5 opacity-80"
              }`}
            >
              {/* Subtle Ambient Radial Glow */}
              <div
                className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none bg-gradient-to-br ${card.gradient}`}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-xs"
                    style={{
                      backgroundColor: `${card.accent}15`,
                      color: card.accent,
                      borderColor: `${card.accent}30`,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                    Wrapped Chapter
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-sans text-[#B8BDD6] mb-1">
                    {card.title}
                  </h3>
                  <div className="text-[20px] sm:text-[22px] font-hero-serif font-bold tracking-tight text-[#F8F7FF] min-h-[32px] flex items-center">
                    {card.stat || "Locked Milestone"}
                  </div>
                  <p className={`text-[12px] font-sans mt-2 leading-relaxed ${
                    isUnlocked ? "text-[#B8BDD6]" : "text-[#959BB4] italic"
                  }`}>
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
