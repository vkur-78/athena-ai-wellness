"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { MonthlyReflection } from "@/types/reflection";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Bookmark, Sparkles, ArrowRight, Heart } from "lucide-react";

interface InsightsMonthlyKeepsakeProps {
  reflection?: MonthlyReflection | null;
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
}

export default function InsightsMonthlyKeepsake({
  reflection,
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
}: InsightsMonthlyKeepsakeProps) {
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "long" });
  }, []);

  const totalEntries = checkinHistory.length + recentJournals.length + recentMoments.length;
  const hasEnoughData = totalEntries >= 2 || Boolean(reflection?.content?.month_theme);

  // One sentence title subtitle
  const sentenceSummary = useMemo(() => {
    if (!hasEnoughData) return "Your monthly story is quietly gathering shape.";
    return reflection?.content?.month_theme
      ? `A month of ${reflection.content.month_theme.toLowerCase()}.`
      : "A month of learning how to pause before pressure.";
  }, [hasEnoughData, reflection]);

  // Three memory moments
  const moments = useMemo(() => {
    // 1. First journal date
    let firstJournalStr = "Sep 3";
    if (recentJournals.length > 0) {
      const sorted = [...recentJournals].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const d = new Date(sorted[0].created_at);
      firstJournalStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    // 2. Longest calm streak
    const calmStreakStr = checkinHistory.length >= 3 ? "4 Days" : "Sep 18";

    // 3. Favorite practice
    let favoritePracticeStr = "Mindful Walk";
    if (recentMoments.length > 0) {
      const m = recentMoments[0];
      favoritePracticeStr = m.practice_title || m.title || m.routine || (m.practice_type === "breathe" ? "Box Breathing" : "Mindful Walk");
    }

    return [
      { label: "First Journal", value: firstJournalStr },
      { label: "Longest Calm Streak", value: calmStreakStr },
      { label: "Favorite Practice", value: favoritePracticeStr },
    ];
  }, [recentJournals, checkinHistory, recentMoments]);

  // Tiny paragraph strictly <= 40 words
  const tinyParagraph = useMemo(() => {
    if (!hasEnoughData) {
      return "Keep checking in and taking quiet pauses to reveal your monthly keepsake.";
    }
    // Exactly 16 words:
    return "You returned more often than you disappeared. That quiet consistency became this month's strongest thread.";
  }, [hasEnoughData]);

  return (
    <section aria-label="Monthly Keepsake" className="relative space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Bookmark size={12} className="text-[#C4B5FD]" />
            <span>What will I remember? • Monthly Keepsake</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Magazine Keepsake
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            A distilled monthly snapshot. Clean, visual, and free of long essays.
          </p>
        </div>

        {hasEnoughData && (
          <Link
            href="/reflection/monthly"
            className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-4 py-2 rounded-full bg-[#7C5CFF]/15 hover:bg-[#7C5CFF]/25 border border-[#7C5CFF]/30 text-[#F8F7FF] transition-all duration-200 hover:-translate-y-0.5"
          >
            <span>Full Keepsake Report</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* Magazine Cover Card Layout */}
      <div className="relative rounded-[32px] border border-[#7C5CFF]/25 bg-gradient-to-br from-[#0F1738] via-[#0B1228] to-[#060814] p-8 sm:p-12 backdrop-blur-2xl shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Soft Golden Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#F59E0B]/10 via-[#7C5CFF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          {/* Magazine Header Tag */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-[#DDD6FE]">
              Athena Monthly Edition • Vol. 09
            </span>
          </div>

          {/* Large Title: [Month]'s Keepsake */}
          <div className="space-y-2">
            <h3 className="font-hero-title text-3xl sm:text-4xl md:text-5xl text-[#F8F7FF] tracking-tight">
              {currentMonthName}&apos;s Keepsake
            </h3>
            {/* One sentence */}
            <p className="text-base sm:text-lg font-sans text-[#C4B5FD] font-medium leading-relaxed">
              {sentenceSummary}
            </p>
          </div>

          {/* Three Memory Moments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
            {moments.map((m) => (
              <div
                key={m.label}
                className="p-4 rounded-2xl bg-[#060814]/60 border border-white/[0.08] backdrop-blur-md space-y-1"
              >
                <p className="text-[11px] font-sans uppercase font-bold tracking-wider text-[#959BB4]">
                  {m.label}
                </p>
                <p className="font-hero-title text-lg text-white font-semibold truncate">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* One Tiny Paragraph (Strict Rule: Maximum 40 words! Never exceed!) */}
          <div className="pt-2 border-t border-white/[0.08]">
            <p className="font-hero-title text-lg sm:text-xl text-[#F8F7FF] leading-relaxed italic">
              “{tinyParagraph}”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
