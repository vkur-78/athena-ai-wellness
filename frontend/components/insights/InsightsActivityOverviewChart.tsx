"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { BarChart3, Calendar, MessageSquare, BookOpen, Wind } from "lucide-react";
import { toLocalDateString } from "@/lib/dashboardMetrics";

interface InsightsActivityOverviewChartProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

type RangeOption = 7 | 30 | 90;

export default function InsightsActivityOverviewChart({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsActivityOverviewChartProps) {
  const [rangeDays, setRangeDays] = useState<RangeOption>(30);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Compute startDate based on selected range (strictly <= now, no future dates)
  const now = new Date();
  const todayStr = toLocalDateString(now);

  const startDateStr = useMemo(() => {
    const d = new Date(now);
    d.setDate(now.getDate() - (rangeDays - 1));
    return toLocalDateString(d);
  }, [rangeDays, now]);

  // Real filtered counts within [startDateStr, todayStr]
  const metrics = useMemo(() => {
    // Check-ins (deduplicated by date)
    const checkinDateSet = new Set<string>();
    checkinHistory.forEach((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      if (ds && ds >= startDateStr && ds <= todayStr) {
        checkinDateSet.add(ds);
      }
    });
    if (todayCheckin) {
      const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || now);
      if (todayDs && todayDs >= startDateStr && todayDs <= todayStr) {
        checkinDateSet.add(todayDs);
      }
    }
    const checkinsCount = checkinDateSet.size;

    // Conversations
    const convsCount = conversations.filter((c) => {
      const ds = toLocalDateString(c.created_at || c.updated_at);
      return ds >= startDateStr && ds <= todayStr;
    }).length;

    // Journals
    const journalsCount = recentJournals.filter((j) => {
      const ds = toLocalDateString(j.created_at);
      return ds >= startDateStr && ds <= todayStr;
    }).length;

    // Studio Practices
    const practicesCount = recentMoments.filter((m) => {
      const ds = toLocalDateString(m.created_at || (m as any).started_at);
      return ds >= startDateStr && ds <= todayStr;
    }).length;

    const total = checkinsCount + convsCount + journalsCount + practicesCount;

    return {
      checkins: checkinsCount,
      conversations: convsCount,
      journals: journalsCount,
      practices: practicesCount,
      total,
    };
  }, [checkinHistory, todayCheckin, conversations, recentJournals, recentMoments, startDateStr, todayStr]);

  const categories = [
    {
      id: "checkins",
      label: "Check-ins",
      count: metrics.checkins,
      icon: Calendar,
      color: "#A78BFA",
      gradient: "from-[#A78BFA] to-[#8B5CF6]",
      description: "Daily emotional check-ins",
    },
    {
      id: "conversations",
      label: "Conversations",
      count: metrics.conversations,
      icon: MessageSquare,
      color: "#60A5FA",
      gradient: "from-[#60A5FA] to-[#3B82F6]",
      description: "Dialogue therapy sessions",
    },
    {
      id: "journals",
      label: "Journal Entries",
      count: metrics.journals,
      icon: BookOpen,
      color: "#F59E0B",
      gradient: "from-[#F59E0B] to-[#D97706]",
      description: "Space written entries",
    },
    {
      id: "practices",
      label: "Practices",
      count: metrics.practices,
      icon: Wind,
      color: "#4ADE80",
      gradient: "from-[#4ADE80] to-[#10B981]",
      description: "Completed Studio sessions",
    },
  ];

  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <section aria-label="Activity Overview Chart" className="space-y-4">
      {/* Header with Range Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <BarChart3 size={12} className="text-[#C4B5FD]" />
            <span>Section 2 • Engagement Volume</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Activity Overview
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Total verified interactions recorded across Athena. Zero placeholders.
          </p>
        </div>

        {/* Range Selector */}
        <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/10 self-start sm:self-auto">
          {([7, 30, 90] as RangeOption[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRangeDays(r)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all duration-200 cursor-pointer ${
                rangeDays === r
                  ? "bg-[#7C5CFF] text-white shadow-sm shadow-[#7C5CFF]/40"
                  : "text-[#B8BDD6] hover:text-white"
              }`}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Box */}
      <div className="p-6 sm:p-8 rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 backdrop-blur-2xl shadow-xl space-y-6">
        {metrics.total === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="font-hero-title text-lg text-white">Your story is still unfolding</p>
            <p className="text-xs sm:text-sm font-sans text-[#959BB4] max-w-sm mx-auto">
              No activity recorded in the past {rangeDays} days. Check in or practice to see your overview.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const pct = (cat.count / maxCount) * 100;
              const isHovered = hoveredCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-sans">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="font-semibold text-white group-hover:text-[#DDD6FE] transition-colors">
                        {cat.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-hero-title text-base sm:text-lg font-bold text-white">
                        {cat.count}
                      </span>
                      <span className="text-[11px] font-sans text-[#959BB4] w-12 text-right">
                        {metrics.total > 0 ? Math.round((cat.count / metrics.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Bar Track */}
                  <div className="h-3 w-full rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${cat.gradient} transition-all duration-700 ease-out`}
                      style={{
                        width: `${Math.max(cat.count > 0 ? 3 : 0, pct)}%`,
                        boxShadow: isHovered ? `0 0 12px ${cat.color}` : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total Footer Summary */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-sans text-[#B8BDD6]">
              <span>Window: Past {rangeDays} days</span>
              <span className="font-semibold text-white">
                {metrics.total} total mindful actions recorded
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
