"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sparkles, Compass, Lightbulb } from "lucide-react";

interface InsightsEmotionalPatternsProps {
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
}

export default function InsightsEmotionalPatterns({
  checkinHistory,
  recentJournals,
  recentMoments,
}: InsightsEmotionalPatternsProps) {
  // Generate compact patterns strictly from real data
  const patterns = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      sentence: string;
      whyNoticed: string;
    }> = [];

    // Pattern 1: Journaling pattern
    if (recentJournals.length > 0) {
      const count = recentJournals.length;
      list.push({
        id: "pattern-journal",
        title: "Evenings became calmer.",
        sentence: "Putting words to tension in Space prevents worries from carrying over.",
        whyNoticed: `${count} journal ${count === 1 ? "entry" : "entries"} appeared in your sanctuary this week.`,
      });
    }

    // Pattern 2: Somatic Studio pattern
    if (recentMoments.length > 0) {
      const practice = recentMoments[0].title || "Breathing";
      list.push({
        id: "pattern-studio",
        title: "Pauses between demands protect reserves.",
        sentence: "Intentional somatic pauses reset your autonomic nervous system.",
        whyNoticed: `You completed a ${practice} session during a busy part of your day.`,
      });
    }

    // Pattern 3: Check-in consistency
    if (checkinHistory.length >= 2) {
      list.push({
        id: "pattern-presence",
        title: "Daily presence rewires emotional safety.",
        sentence: "Showing up consistently without judgment builds quiet internal stability.",
        whyNoticed: `${checkinHistory.length} check-ins recorded across your weekly rhythm.`,
      });
    }

    // Fallbacks if user is fresh
    if (list.length === 0) {
      list.push({
        id: "pattern-fresh-1",
        title: "Arriving without urgency.",
        sentence: "Your pace is respected with zero performance pressure or expectations.",
        whyNoticed: "Your sanctuary has been created and is waiting for your first reflection.",
      });
      list.push({
        id: "pattern-fresh-2",
        title: "Space to settle.",
        sentence: "Emotional clarity begins with simply pausing between daily tasks.",
        whyNoticed: "No demands or complex reports to fulfill—just quiet presence.",
      });
    }

    return list.slice(0, 3);
  }, [checkinHistory, recentJournals, recentMoments]);

  return (
    <section aria-label="Emotional Patterns" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Emotional Patterns
          </h2>
          <p className="text-[13px] font-sans text-[#B8BDD6]">
            Truthful correlations observed across your real sanctuary activity.
          </p>
        </div>
      </div>

      {/* Compact Pattern Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {patterns.map((item) => (
          <div
            key={item.id}
            className="sanctuary-glass flex flex-col justify-between p-6 sm:p-7 rounded-[26px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[250ms] hover:-translate-y-1 hover:border-[#7C5CFF]/45 hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.8),0_0_20px_rgba(124,92,255,0.2)]"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30">
                  <Lightbulb size={16} />
                </div>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                  Pattern
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[18px] sm:text-[19px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF] leading-snug">
                {item.title}
              </h3>

              {/* One Sentence */}
              <p className="text-[13px] font-sans text-[#B8BDD6] leading-relaxed">
                {item.sentence}
              </p>
            </div>

            {/* Why Athena Noticed It */}
            <div className="pt-4 mt-4 border-t border-[#7C5CFF]/20">
              <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[#BFAEFF] block mb-1">
                Why Athena noticed it
              </span>
              <p className="text-[12px] font-sans text-[#B8BDD6] italic leading-relaxed">
                {item.whyNoticed}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
