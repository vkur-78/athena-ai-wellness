"use client";

import React, { useMemo } from "react";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { CheckinResponse } from "@/types/checkin";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Wind, BookOpen, Smile, Sparkles, CheckCircle2 } from "lucide-react";

interface InsightsRecoveryMomentsProps {
  recentMoments: RecentMoment[];
  recentJournals: JournalEntry[];
  checkinHistory: CheckinResponse[];
}

export default function InsightsRecoveryMoments({
  recentMoments,
  recentJournals,
  checkinHistory,
}: InsightsRecoveryMomentsProps) {
  // Aggregate real recorded activities sorted by recency
  const recoveryActivities = useMemo(() => {
    interface ActivityItem {
      id: string;
      timeLabel: string;
      title: string;
      type: "practice" | "journal" | "checkin";
      timestamp: number;
    }

    const items: ActivityItem[] = [];
    const now = new Date();
    const todayStr = toLocalDateString(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    const getRelativeLabel = (dateInput: string | Date | undefined): string => {
      if (!dateInput) return "Recently";
      const d = new Date(dateInput);
      const ds = toLocalDateString(d);
      if (ds === todayStr) return "Today";
      if (ds === yesterdayStr) return "Yesterday";
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 6) {
        return d.toLocaleDateString([], { weekday: "long" });
      }
      return `${diffDays} days ago`;
    };

    // 1. Studio moments
    recentMoments.forEach((m, idx) => {
      const dt = m.created_at || m.started_at;
      if (dt) {
        const titleName = m.title || (m.practice_type ? m.practice_type.charAt(0).toUpperCase() + m.practice_type.slice(1) : "Breathing");
        items.push({
          id: `moment-${idx}`,
          timeLabel: getRelativeLabel(dt),
          title: `${titleName} completed.`,
          type: "practice",
          timestamp: new Date(dt).getTime(),
        });
      }
    });

    // 2. Journal entries
    recentJournals.forEach((j, idx) => {
      if (j.created_at) {
        items.push({
          id: `journal-${idx}`,
          timeLabel: getRelativeLabel(j.created_at),
          title: "Journal written in Space.",
          type: "journal",
          timestamp: new Date(j.created_at).getTime(),
        });
      }
    });

    // 3. Daily check-ins
    checkinHistory.forEach((c, idx) => {
      const dt = c.date || c.created_at;
      if (dt) {
        const mood = c.mood ? ` (${c.mood})` : "";
        items.push({
          id: `checkin-${idx}`,
          timeLabel: getRelativeLabel(dt),
          title: `Daily check-in completed${mood}.`,
          type: "checkin",
          timestamp: new Date(dt).getTime(),
        });
      }
    });

    // Sort newest first
    items.sort((a, b) => b.timestamp - a.timestamp);

    // If empty fallback
    if (items.length === 0) {
      items.push({
        id: "fallback-arrival",
        timeLabel: "Today",
        title: "Arrived in Sanctuary.",
        type: "checkin",
        timestamp: Date.now(),
      });
    }

    return items.slice(0, 4);
  }, [recentMoments, recentJournals, checkinHistory]);

  const getIcon = (type: string) => {
    switch (type) {
      case "practice":
        return <Wind size={18} className="text-[#4ADE80]" />;
      case "journal":
        return <BookOpen size={18} className="text-[#BFAEFF]" />;
      default:
        return <Smile size={18} className="text-[#7C5CFF]" />;
    }
  };

  return (
    <section aria-label="Recovery Moments" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Recovery Moments
          </h2>
          <p className="text-[13px] font-sans text-[#B8BDD6]">
            Real history of restorative activities. No invented percentages.
          </p>
        </div>
      </div>

      {/* Real Saved Activity Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {recoveryActivities.map((act) => (
          <div
            key={act.id}
            className="sanctuary-glass flex items-start gap-4 p-5 sm:p-6 rounded-[24px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[250ms] hover:-translate-y-1 hover:border-[#7C5CFF]/45"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B1228] border border-[#7C5CFF]/30 shadow-xs">
              {getIcon(act.type)}
            </div>

            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF] block">
                {act.timeLabel}
              </span>
              <p className="text-[15px] font-hero-serif font-semibold text-[#F8F7FF] leading-snug truncate">
                {act.title}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-sans text-[#4ADE80] pt-0.5">
                <CheckCircle2 size={12} />
                <span>Saved to history</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
