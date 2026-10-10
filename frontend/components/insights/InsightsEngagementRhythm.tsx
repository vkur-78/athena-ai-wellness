"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sun, Sunset, Moon, Sparkles, Sunrise, Clock } from "lucide-react";

interface InsightsEngagementRhythmProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

interface WindowBucket {
  id: "morning" | "afternoon" | "evening" | "night";
  label: string;
  hours: string;
  icon: any;
  color: string;
  gradient: string;
  count: number;
}

export default function InsightsEngagementRhythm({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsEngagementRhythmProps) {
  // Aggregate hour of each recorded event strictly from timestamps
  const hourCounts = useMemo(() => {
    let morning = 0; // 5 to 11
    let afternoon = 0; // 12 to 16
    let evening = 0; // 17 to 20
    let night = 0; // 21 to 4

    const processTime = (isoString?: string | null) => {
      if (!isoString) return;
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return;
      const h = d.getHours();
      if (h >= 5 && h < 12) morning += 1;
      else if (h >= 12 && h < 17) afternoon += 1;
      else if (h >= 17 && h < 21) evening += 1;
      else night += 1;
    };

    checkinHistory.forEach((c) => processTime(c.created_at || c.date));
    if (todayCheckin) processTime(todayCheckin.created_at || todayCheckin.date);
    recentJournals.forEach((j) => processTime(j.created_at));
    recentMoments.forEach((m) => processTime(m.created_at || (m as any).started_at));
    conversations.forEach((conv) => processTime(conv.created_at || conv.updated_at));

    return { morning, afternoon, evening, night };
  }, [checkinHistory, todayCheckin, recentJournals, recentMoments, conversations]);

  const totalEvents =
    hourCounts.morning + hourCounts.afternoon + hourCounts.evening + hourCounts.night;

  const buckets: WindowBucket[] = [
    {
      id: "morning",
      label: "Morning",
      hours: "5:00 AM – 11:59 AM",
      icon: Sunrise,
      color: "#FBBF24",
      gradient: "from-amber-400 to-amber-600",
      count: hourCounts.morning,
    },
    {
      id: "afternoon",
      label: "Afternoon",
      hours: "12:00 PM – 4:59 PM",
      icon: Sun,
      color: "#60A5FA",
      gradient: "from-blue-400 to-indigo-500",
      count: hourCounts.afternoon,
    },
    {
      id: "evening",
      label: "Evening",
      hours: "5:00 PM – 8:59 PM",
      icon: Sunset,
      color: "#A78BFA",
      gradient: "from-purple-400 to-violet-600",
      count: hourCounts.evening,
    },
    {
      id: "night",
      label: "Night",
      hours: "9:00 PM – 4:59 AM",
      icon: Moon,
      color: "#818CF8",
      gradient: "from-indigo-500 to-slate-700",
      count: hourCounts.night,
    },
  ];

  // Primary arrival window
  const topBucket = useMemo(() => {
    if (totalEvents === 0) return null;
    const sorted = [...buckets].sort((a, b) => b.count - a.count);
    return sorted[0];
  }, [buckets, totalEvents]);

  return (
    <section aria-label="Engagement Rhythm Chart" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Clock size={12} className="text-[#C4B5FD]" />
            <span>Section 3 • Engagement Timing</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Return Rhythm
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            When you tend to return to Athena, based strictly on your recorded timestamps.
          </p>
        </div>

        {topBucket && topBucket.count > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs font-sans text-[#DDD6FE]">
            <span>Most frequent:</span>
            <span className="font-semibold text-white">{topBucket.label} ({topBucket.count})</span>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 backdrop-blur-2xl shadow-xl space-y-6">
        {totalEvents === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="font-hero-title text-lg text-white">No timestamps recorded yet</p>
            <p className="text-xs sm:text-sm font-sans text-[#959BB4] max-w-sm mx-auto">
              Your engagement timing will emerge here as you check in and practice.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {buckets.map((b) => {
              const Icon = b.icon;
              const pct = totalEvents > 0 ? Math.round((b.count / totalEvents) * 100) : 0;
              const isTop = topBucket?.id === b.id && b.count > 0;

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
                    isTop
                      ? "bg-white/[0.06] border-[#7C5CFF]/50 shadow-[0_0_20px_rgba(124,92,255,0.2)]"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="p-2 rounded-xl"
                      style={{ backgroundColor: `${b.color}20`, color: b.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-mono font-bold text-white/90">{pct}%</span>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-hero-title text-base sm:text-lg text-white font-semibold">
                      {b.label}
                    </h3>
                    <p className="text-[11px] font-sans text-[#959BB4]">{b.hours}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-[#B8BDD6]">
                    <span>Recorded interactions</span>
                    <span className="font-bold text-white">{b.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {topBucket && topBucket.count > 0 && (
          <p className="text-xs font-sans text-[#959BB4] italic text-center pt-2">
            Descriptive observation: You return to Athena most often during {topBucket.label.toLowerCase()} hours.
          </p>
        )}
      </div>
    </section>
  );
}
