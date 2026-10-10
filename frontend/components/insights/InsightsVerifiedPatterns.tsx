"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { getZonedTimeParts, toLocalDateString } from "@/lib/timezone";
import { Sparkles, Compass } from "lucide-react";

interface InsightsVerifiedPatternsProps {
  checkins: CheckinResponse[];
  practices: (RecentMoment | StudioHistoryItem)[];
  journals: JournalEntry[];
  conversations: any[];
  isLight?: boolean;
}

interface PatternCard {
  title: string;
  evidence: string;
  context: string;
}

export default function InsightsVerifiedPatterns({
  checkins,
  practices,
  journals,
  conversations,
  isLight = false,
}: InsightsVerifiedPatternsProps) {
  const patterns = useMemo<PatternCard[]>(() => {
    const list: PatternCard[] = [];

    // Total activity timestamps
    const timestamps: string[] = [];
    checkins.forEach((c) => {
      const t = c.created_at || c.date;
      if (t) timestamps.push(t);
    });
    practices.forEach((p) => {
      const t = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (t) timestamps.push(t);
    });
    journals.forEach((j) => {
      if (j.created_at) timestamps.push(j.created_at);
    });
    conversations.forEach((conv) => {
      const t = conv.updated_at || conv.created_at;
      if (t) timestamps.push(t);
    });

    const totalEvents = timestamps.length;
    if (totalEvents < 3) return [];

    // 1. Time-of-day pattern
    const timeBuckets: Record<string, number> = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
      Night: 0,
    };

    timestamps.forEach((ts) => {
      const parts = getZonedTimeParts(ts);
      timeBuckets[parts.timeOfDay] = (timeBuckets[parts.timeOfDay] || 0) + 1;
    });

    let topBucket = "Evening";
    let topBucketCount = 0;
    Object.entries(timeBuckets).forEach(([bucket, count]) => {
      if (count > topBucketCount) {
        topBucketCount = count;
        topBucket = bucket;
      }
    });

    if (topBucketCount >= 2 && topBucketCount / totalEvents >= 0.35) {
      list.push({
        title: `You tend to return to Athena more often in the ${topBucket.toLowerCase()}.`,
        evidence: `Evidence: ${topBucketCount} of ${totalEvents} recorded sessions occurred during ${topBucket.toLowerCase()} hours.`,
        context: "This reflects your natural rhythm for taking a reflective pause.",
      });
    }

    // 2. Studio category preference
    if (practices.length >= 2) {
      const catCounts: Record<string, number> = {};
      practices.forEach((p) => {
        const cat = (p.exercise_category || (p as any).practice_type || "Mindfulness").toUpperCase();
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      let topCat = "";
      let topCatCount = 0;
      Object.entries(catCounts).forEach(([cat, count]) => {
        if (count > topCatCount) {
          topCatCount = count;
          topCat = cat;
        }
      });

      if (topCatCount >= 2) {
        const label = topCat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        list.push({
          title: `You frequently anchor your practice in ${label}.`,
          evidence: `Evidence: ${topCatCount} of ${practices.length} completed practices were in the ${label} category.`,
          context: "Continuing to return to familiar grounded practices helps establish consistency.",
        });
      }
    }

    // 3. Check-in & Journal relationship
    if (checkins.length >= 2 && journals.length >= 1) {
      const checkinDates = new Set(checkins.map((c) => toLocalDateString(c.date || c.created_at)));
      const journalDates = new Set(journals.map((j) => toLocalDateString(j.created_at)));

      let coOccurrences = 0;
      journalDates.forEach((jd) => {
        if (checkinDates.has(jd)) coOccurrences++;
      });

      if (coOccurrences >= 1) {
        list.push({
          title: "Check-ins and Space journaling often accompany each other.",
          evidence: `Evidence: On ${coOccurrences} day${coOccurrences === 1 ? "" : "s"}, you completed a daily check-in and also wrote in Space.`,
          context: "Checking in often creates natural clarity for deeper written reflection.",
        });
      }
    }

    return list;
  }, [checkins, practices, journals, conversations]);

  if (patterns.length === 0) {
    return (
      <section
        className={`p-6 sm:p-7 rounded-3xl border space-y-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200/90 shadow-sm"
            : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <div className="flex items-center gap-2 text-sm uppercase tracking-wider font-semibold text-[#7C5CFF]">
          <Compass size={15} />
          <span>Verified Patterns</span>
        </div>
        <p className={`text-xs leading-relaxed py-4 text-center ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
          Not enough activity yet to identify recurring patterns. As you check in, practice, and write, Athena will synthesize verified observations here based strictly on your usage.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Verified Patterns"
      className={`p-6 sm:p-7 rounded-3xl border space-y-5 transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#7C5CFF]/20 text-[#7C5CFF] flex items-center justify-center">
            <Sparkles size={12} />
          </div>
          <h2 className={`text-sm uppercase tracking-wider font-semibold ${isLight ? "text-stone-700" : "text-[#B8BDD6]/80"}`}>
            Verified Patterns
          </h2>
        </div>
        <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>Data-driven observations</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patterns.map((item, idx) => (
          <div
            key={idx}
            className={`p-4.5 rounded-2xl border space-y-2.5 flex flex-col justify-between transition-colors ${
              isLight
                ? "bg-stone-50/80 border-stone-200/80 text-stone-800"
                : "border-white/5 bg-white/[0.02] text-[#F8F7FF]"
            }`}
          >
            <div className="space-y-1.5">
              <h3 className={`text-sm font-medium leading-snug ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>{item.title}</h3>
              <p className={`text-xs font-light leading-relaxed ${isLight ? "text-stone-600" : "text-[#B8BDD6]/70"}`}>{item.context}</p>
            </div>

            <div className={`pt-2 border-t ${isLight ? "border-stone-200/80" : "border-white/5"}`}>
              <span className={`text-[11px] font-mono leading-normal block ${isLight ? "text-[#7C5CFF] font-medium" : "text-[#BFAEFF]/80"}`}>
                {item.evidence}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
