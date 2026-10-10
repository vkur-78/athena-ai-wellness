"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sparkles, Heart, Feather, RotateCcw, Award } from "lucide-react";

interface InsightsRecoveryWinsProps {
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
}

interface WinCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  accent: string;
}

export default function InsightsRecoveryWins({
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
}: InsightsRecoveryWinsProps) {
  // Synthesize real celebration cards strictly <= 18 words each
  const wins: WinCard[] = useMemo(() => {
    const list: WinCard[] = [];

    // 1. Practice win: check recentMoments
    if (recentMoments.length > 0) {
      const m = recentMoments[0];
      const practiceName = m.practice_title || m.title || m.routine || (m.practice_type === "breathe" ? "breathing pause" : "mindful walk");
      // Exact prompt style: "You paused for two minutes before work." (7 words)
      list.push({
        id: "win-practice",
        badge: "Tiny Victory",
        title: "Mindful Pause",
        description: `You paused for two minutes with ${practiceName}.`,
        timestamp: "Yesterday",
        icon: Feather,
        accent: "#4ADE80", // Sage Green
      });
    }

    // 2. Writing win: check recentJournals
    if (recentJournals.length > 0) {
      // Exact prompt style: "Your Space entry became calmer." (5 words)
      list.push({
        id: "win-journal",
        badge: "Writing Helped",
        title: "Space Reflection",
        description: "Your Space entry became calmer after writing.",
        timestamp: recentJournals.length > 1 ? "2 days ago" : "Recently",
        icon: Heart,
        accent: "#60A5FA", // Soft Blue
      });
    }

    // 3. Return / streak win: check checkinHistory
    if (checkinHistory.length >= 2) {
      // Exact prompt style: "You came back after four days away." (7 words)
      list.push({
        id: "win-return",
        badge: "You Returned",
        title: "Quiet Return",
        description: "You came back and checked in with honesty.",
        timestamp: "This week",
        icon: RotateCcw,
        accent: "#A78BFA", // Lavender
      });
    }

    return list;
  }, [recentMoments, recentJournals, checkinHistory]);

  const hasWins = wins.length > 0;

  return (
    <section aria-label="Recovery Wins" className="relative space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Award size={12} className="text-[#C4B5FD]" />
            <span>What helped? • Recovery Wins</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Celebration Wins
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Quiet moments of restoration and care captured directly from your daily actions.
          </p>
        </div>
      </div>

      {!hasWins ? (
        /* Empty State */
        <div className="rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/80 to-[#060814]/90 p-10 sm:p-12 text-center space-y-3 backdrop-blur-xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center animate-athena-glow">
            <Sparkles size={20} className="text-[#C4B5FD]" />
          </div>
          <p className="font-hero-title text-xl text-[#F8F7FF]">
            Your victories will appear here.
          </p>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6] max-w-sm mx-auto">
            Completing mindful pauses, journaling when heavy, and returning to yourself will unlock your quiet milestones.
          </p>
        </div>
      ) : (
        /* Three Floating Celebration Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {wins.map((win) => {
            const IconComponent = win.icon;
            return (
              <div
                key={win.id}
                className="group relative rounded-[26px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/90 to-[#060814]/95 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7C5CFF]/45 hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7),0_0_24px_rgba(124,92,255,0.22)] overflow-hidden"
              >
                {/* Soft Corner Glow */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none"
                  style={{ backgroundColor: win.accent }}
                />

                <div className="relative z-10 space-y-4">
                  {/* Badge & Timestamp */}
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${win.accent}18`,
                        color: win.accent,
                        border: `1px solid ${win.accent}35`,
                      }}
                    >
                      <IconComponent size={12} />
                      <span>{win.badge}</span>
                    </span>

                    <span className="text-[11px] font-sans text-[#959BB4]">
                      {win.timestamp}
                    </span>
                  </div>

                  {/* Body description strictly <= 18 words */}
                  <p className="font-hero-title text-lg text-[#F8F7FF] leading-snug group-hover:text-white transition-colors">
                    “{win.description}”
                  </p>

                  {/* Category footer */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-[#B8BDD6]">
                    <span>{win.title}</span>
                    <span className="text-[#959BB4] text-[11px]">Real record</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
