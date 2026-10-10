"use client";

import React from "react";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { CheckinResponse } from "@/types/checkin";
import { Moon, Briefcase, Footprints, Sparkles, Lock } from "lucide-react";

interface InsightsPatternCardsProps {
  checkinHistory?: CheckinResponse[];
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

export default function InsightsPatternCards({
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsPatternCardsProps) {
  // 1. Evenings check: count journals written after 18:00 (6 PM) or 20:00 (8 PM)
  const eveningJournals = recentJournals.filter((j) => {
    if (!j.created_at) return false;
    const h = new Date(j.created_at).getHours();
    return h >= 18;
  });
  const hasEveningPattern = eveningJournals.length >= 2;

  // 2. Work conversations check: check if any weekdays have work-related tags or check-in stress
  const weekdayStress = checkinHistory.filter((c) => {
    const rawDate = c.date || c.created_at;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    const day = d.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const mood = (c.mood || "").toLowerCase();
    return isWeekday && (mood.includes("stress") || mood.includes("anx") || mood.includes("work") || mood.includes("heavy"));
  });
  const hasWeekdayPattern = weekdayStress.length >= 2;

  // 3. Practice timing check: check if practices happen after noon
  const afternoonPractices = recentMoments.filter((m) => {
    if (!m.created_at) return false;
    const h = new Date(m.created_at).getHours();
    return h >= 12;
  });
  const hasPracticePattern = afternoonPractices.length >= 2;

  const patterns = [
    {
      id: "evenings",
      title: "Evening Reflection",
      icon: Moon,
      accent: "#BFAEFF",
      text: hasEveningPattern
        ? "You tend to journal more in the evening hours after 8 PM."
        : "More entries unlock this insight.",
      source: hasEveningPattern ? "Journal timestamps" : "Awaiting more journal entries",
      isUnlocked: hasEveningPattern,
    },
    {
      id: "work",
      title: "Weekday Rhythm",
      icon: Briefcase,
      accent: "#FBBF24",
      text: hasWeekdayPattern
        ? "Most reflective stress conversations happened on weekdays."
        : "More entries unlock this insight.",
      source: hasWeekdayPattern ? "Conversation & check-in patterns" : "Awaiting weekday entries",
      isUnlocked: hasWeekdayPattern,
    },
    {
      id: "practice",
      title: "Practice Timing",
      icon: Footprints,
      accent: "#4ADE80",
      text: hasPracticePattern
        ? "Calming practices appear most often after afternoon check-ins."
        : "More entries unlock this insight.",
      source: hasPracticePattern ? "Studio practice history" : "Awaiting practice sessions",
      isUnlocked: hasPracticePattern,
    },
  ];

  return (
    <section aria-label="Behavior Patterns" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Patterns
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Truthful correlations observed strictly from your verified time and usage records.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-full border border-[#7C5CFF]/30 bg-[#0B1228]/80 text-[#BFAEFF] shadow-xs">
          <Sparkles size={12} className="text-[#BFAEFF]" />
          <span>Zero Fabricated Scores</span>
        </div>
      </div>

      {/* 3 Real Pattern Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {patterns.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={`sanctuary-glass flex flex-col justify-between p-6 rounded-[24px] border transition-all duration-[220ms] ${
                item.isUnlocked
                  ? "border-[#7C5CFF]/25 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] hover:-translate-y-1 hover:border-[#7C5CFF]/45"
                  : "border-white/5 opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border shadow-xs"
                    style={{
                      backgroundColor: `${item.accent}15`,
                      color: item.accent,
                      borderColor: `${item.accent}30`,
                    }}
                  >
                    <Icon size={19} />
                  </div>

                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                    {item.title}
                  </span>
                </div>

                <div>
                  <p className={`text-[15px] sm:text-[16px] font-hero-serif font-medium tracking-tight leading-relaxed ${
                    item.isUnlocked ? "text-[#F8F7FF]" : "text-[#959BB4] italic"
                  }`}>
                    {item.isUnlocked ? `“${item.text}”` : item.text}
                  </p>
                </div>
              </div>

              {/* Source Tag */}
              <div className="pt-4 mt-3 border-t border-[#7C5CFF]/15 flex items-center justify-between text-[11px] font-sans text-[#959BB4]">
                <span>Source</span>
                <span className="text-[#BFAEFF] font-medium">{item.source}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
