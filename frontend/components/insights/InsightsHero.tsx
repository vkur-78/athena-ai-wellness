"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sparkles, Calendar, BookOpen, Wind, ArrowRight } from "lucide-react";

interface InsightsHeroProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
}

export default function InsightsHero({
  checkinHistory,
  todayCheckin,
  recentJournals,
  recentMoments,
}: InsightsHeroProps) {
  // Aggregate real counts
  const checkinCount = checkinHistory.length + (todayCheckin ? 1 : 0);
  const journalCount = recentJournals.length;
  const practiceCount = recentMoments.length;
  const totalEntries = checkinCount + journalCount + practiceCount;

  // Single sentence logic strictly <= 12 words
  const heroSentence = useMemo<string>(() => {
    if (totalEntries === 0) {
      // 9 words
      return "Every meaningful story begins with one moment of honesty.";
    }

    // Check today's checkin
    if (!todayCheckin) {
      // 4 words
      return "Today is still unwritten.";
    }

    // Check recent moods
    const recentMoods = checkinHistory
      .slice(0, 5)
      .map((c) => (c.mood || "").toLowerCase());
    
    const isCalmOrGood = recentMoods.some(
      (m) => m.includes("calm") || m.includes("peace") || m.includes("joy") || m.includes("good") || m.includes("great")
    );

    if (isCalmOrGood) {
      // 7 words
      return "You've been finding calmer evenings this week.";
    }

    // 6 words
    return "You've returned to yourself more often.";
  }, [totalEntries, todayCheckin, checkinHistory]);

  return (
    <header aria-label="Emotional Overview" className="relative pt-4 sm:pt-6 space-y-5 animate-athena-rise">
      {/* Question Tracker Tag */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 backdrop-blur-md">
          <Sparkles size={12} className="text-[#C4B5FD] animate-pulse" />
          <span>How am I doing?</span>
        </span>
        <span className="text-xs font-sans text-[#959BB4] hidden sm:inline">
          Truthful synthesis from your verified records
        </span>
      </div>

      {/* Hero Single Sentence: Large elegant serif */}
      <h1 className="font-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-[46px] leading-[1.18] text-[#F8F7FF] max-w-4xl tracking-tight">
        {heroSentence}
      </h1>

      {/* Below Hero: Three animated chips or start reflection if empty */}
      <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
        {totalEntries > 0 ? (
          <>
            {/* Chip 1: Check-ins */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1228]/80 border border-[#7C5CFF]/25 shadow-sm text-xs font-sans text-[#F8F7FF] transition-transform duration-200 hover:-translate-y-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_8px_#A78BFA]" />
              <Calendar size={13} className="text-[#A78BFA]" />
              <span className="font-semibold text-white">{checkinCount}</span>
              <span className="text-[#B8BDD6]">{checkinCount === 1 ? "check-in" : "check-ins"}</span>
            </div>

            {/* Chip 2: Journal Entries */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1228]/80 border border-[#7C5CFF]/25 shadow-sm text-xs font-sans text-[#F8F7FF] transition-transform duration-200 hover:-translate-y-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] shadow-[0_0_8px_#60A5FA]" />
              <BookOpen size={13} className="text-[#60A5FA]" />
              <span className="font-semibold text-white">{journalCount}</span>
              <span className="text-[#B8BDD6]">{journalCount === 1 ? "journal entry" : "journal entries"}</span>
            </div>

            {/* Chip 3: Calming Practices */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1228]/80 border border-[#7C5CFF]/25 shadow-sm text-xs font-sans text-[#F8F7FF] transition-transform duration-200 hover:-translate-y-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
              <Wind size={13} className="text-[#4ADE80]" />
              <span className="font-semibold text-white">{practiceCount}</span>
              <span className="text-[#B8BDD6]">{practiceCount === 1 ? "calming practice" : "calming practices"}</span>
            </div>
          </>
        ) : (
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/30 border border-[#7C5CFF]/40 text-xs font-sans font-semibold text-[#F8F7FF] transition-all duration-200 shadow-[0_0_16px_rgba(124,92,255,0.25)] hover:-translate-y-0.5"
          >
            <Sparkles size={13} className="text-[#C4B5FD]" />
            <span>Start your first reflection</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </header>
  );
}
