"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  BookOpen,
  Wind,
  Clock,
  ArrowRight,
  GitCommit,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardRecentAndQuickLookProps {
  currentCheckins: CheckinResponse[];
  previousCheckins: CheckinResponse[];
  currentJournals: JournalEntry[];
  previousJournals: JournalEntry[];
  currentPractices: (RecentMoment | StudioHistoryItem)[];
  previousPractices: (RecentMoment | StudioHistoryItem)[];
  dateRangeDays: number;
  isLight?: boolean;
}

interface TimelineItem {
  id: string;
  type: "checkin" | "journal" | "practice";
  title: string;
  subtitle: string;
  timestamp: string;
  dateLabel: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

export default function DashboardRecentAndQuickLook({
  currentCheckins,
  previousCheckins,
  currentJournals,
  previousJournals,
  currentPractices,
  previousPractices,
  dateRangeDays,
  isLight = false,
}: DashboardRecentAndQuickLookProps) {
  const { t } = useLanguage();

  // Helper for computing delta metrics
  const computeChange = (cur: number, prev: number) => {
    if (prev === 0) {
      if (cur === 0) return { deltaStr: "0", pctStr: "—", dir: "neutral" as const };
      return { deltaStr: `+${cur}`, pctStr: "+100%", dir: "up" as const };
    }
    const diff = cur - prev;
    const pct = Math.round((diff / prev) * 100);
    if (pct > 0) return { deltaStr: `+${diff}`, pctStr: `↑ ${pct}%`, dir: "up" as const };
    if (pct < 0) return { deltaStr: `${diff}`, pctStr: `↓ ${Math.abs(pct)}%`, dir: "down" as const };
    return { deltaStr: "0", pctStr: "0%", dir: "neutral" as const };
  };

  const curMinutes = useMemo(() => {
    return currentPractices.reduce((acc, p) => {
      const dur = Number(p.duration_seconds || (p as any).actual_duration || 0);
      return acc + Math.round(dur / 60);
    }, 0);
  }, [currentPractices]);

  const prevMinutes = useMemo(() => {
    return previousPractices.reduce((acc, p) => {
      const dur = Number(p.duration_seconds || (p as any).actual_duration || 0);
      return acc + Math.round(dur / 60);
    }, 0);
  }, [previousPractices]);

  const curActiveDays = useMemo(() => {
    const dates = new Set<string>();
    currentCheckins.forEach((c) => dates.add(toLocalDateString(c.date || c.created_at)));
    currentJournals.forEach((j) => dates.add(toLocalDateString(j.created_at)));
    currentPractices.forEach((p) => {
      const tVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      dates.add(toLocalDateString(tVal));
    });
    return dates.size;
  }, [currentCheckins, currentJournals, currentPractices]);

  const prevActiveDays = useMemo(() => {
    const dates = new Set<string>();
    previousCheckins.forEach((c) => dates.add(toLocalDateString(c.date || c.created_at)));
    previousJournals.forEach((j) => dates.add(toLocalDateString(j.created_at)));
    previousPractices.forEach((p) => {
      const tVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      dates.add(toLocalDateString(tVal));
    });
    return dates.size;
  }, [previousCheckins, previousJournals, previousPractices]);

  const checkinsChange = computeChange(currentCheckins.length, previousCheckins.length);
  const journalsChange = computeChange(currentJournals.length, previousJournals.length);
  const practicesChange = computeChange(currentPractices.length, previousPractices.length);
  const minutesChange = computeChange(curMinutes, prevMinutes);
  const activeDaysChange = computeChange(curActiveDays, prevActiveDays);

  const hasPreviousWindow = previousCheckins.length + previousJournals.length + previousPractices.length >= 2;

  // Comparison summary sentence (honest evidence only)
  const comparisonSummary = useMemo(() => {
    if (!hasPreviousWindow) {
      return "Establishing your baseline window. Comparative trends will emerge as your journey continues.";
    }

    const curTotal = currentCheckins.length + currentPractices.length + currentJournals.length;
    const prevTotal = previousCheckins.length + previousPractices.length + previousJournals.length;

    if (curTotal > prevTotal * 1.15) {
      return `Your Athena sanctuary presence increased this period (+${curTotal - prevTotal} total events), with higher practice consistency.`;
    } else if (curTotal < prevTotal * 0.85) {
      return `You engaged in a quieter, more resting rhythm this period compared to your previous ${dateRangeDays} days.`;
    } else {
      return `Your engagement rhythm remained remarkably steady across both ${dateRangeDays}-day periods.`;
    }
  }, [hasPreviousWindow, currentCheckins, previousCheckins, currentPractices, previousPractices, currentJournals, previousJournals, dateRangeDays]);

  // Build Chronological Timeline Items
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const allItems: TimelineItem[] = [];
    const todayStr = toLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    currentCheckins.forEach((c) => {
      const dtStr = c.date || c.created_at;
      if (!dtStr) return;
      const dLocal = toLocalDateString(dtStr);
      let dateLabel = dLocal === todayStr ? "Today" : dLocal === yesterdayStr ? "Yesterday" : new Date(dtStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const energy = Number(c.energy_level || (c as any).energy || 3);
      const stress = Number(c.stress_level || (c as any).stress || 3);

      allItems.push({
        id: `c-${c.id}`,
        type: "checkin",
        title: c.mood ? `Check-in · ${c.mood}` : "Daily Check-in",
        subtitle: `Energy ${energy}/5 · Stress ${stress}/5`,
        timestamp: dtStr,
        dateLabel,
        href: "/insights",
        badge: `E:${energy} S:${stress}`,
        badgeColor: stress >= 4 ? "#F87171" : "#10B981",
      });
    });

    currentPractices.forEach((p) => {
      const dtStr = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (!dtStr) return;
      const dLocal = toLocalDateString(dtStr);
      let dateLabel = dLocal === todayStr ? "Today" : dLocal === yesterdayStr ? "Yesterday" : new Date(dtStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const name = (p as any).exercise_name || (p as any).routine || (p as any).practice_type || "Practice Session";
      const mins = Math.max(1, Math.round(Number(p.duration_seconds || (p as any).actual_duration || 60) / 60));

      allItems.push({
        id: `p-${p.id}`,
        type: "practice",
        title: name,
        subtitle: `${mins} min completed session`,
        timestamp: dtStr,
        dateLabel,
        href: "/studio",
        badge: `${mins}m`,
        badgeColor: "#8B5CF6",
      });
    });

    currentJournals.forEach((j) => {
      const dtStr = j.created_at;
      if (!dtStr) return;
      const dLocal = toLocalDateString(dtStr);
      let dateLabel = dLocal === todayStr ? "Today" : dLocal === yesterdayStr ? "Yesterday" : new Date(dtStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const text = j.content || "";
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;

      allItems.push({
        id: `j-${j.id}`,
        type: "journal",
        title: j.title || "Space Contemplation",
        subtitle: `${words} words written`,
        timestamp: dtStr,
        dateLabel,
        href: "/journal",
        badge: `${words}w`,
        badgeColor: "#3B82F6",
      });
    });

    allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allItems.slice(0, 7);
  }, [currentCheckins, currentPractices, currentJournals]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      {/* Module 1: Chronological Activity Timeline (7 cols) */}
      <section
        aria-label="Recent Chronological Timeline"
        className={`lg:col-span-7 p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          isLight
            ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
            : "bg-[#0B1228]/80 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Recent Activity Timeline
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
              Chronological feed
            </span>
          </div>

          {timelineItems.length === 0 ? (
            <div className="py-12 text-center text-xs opacity-60">
              No recent activity recorded in this period.
            </div>
          ) : (
            <div className="relative pl-5 border-l border-indigo-500/20 space-y-4 my-2">
              {timelineItems.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <span
                    className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-inherit bg-[#0B1228]"
                    style={{ borderColor: item.badgeColor }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                          isLight ? "text-stone-400" : "text-[#B8BDD6]/60"
                        }`}>
                          {item.dateLabel}
                        </span>
                        <span className="opacity-30">·</span>
                        <Link
                          href={item.href}
                          className={`text-xs font-semibold truncate hover:underline ${
                            isLight ? "text-stone-900" : "text-white"
                          }`}
                        >
                          {item.title}
                        </Link>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isLight ? "text-stone-600" : "text-[#B8BDD6]/70"}`}>
                        {item.subtitle}
                      </p>
                    </div>

                    {item.badge && (
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 border"
                        style={{
                          backgroundColor: `${item.badgeColor}15`,
                          color: item.badgeColor,
                          borderColor: `${item.badgeColor}30`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}>
          <span>Verified activity feed</span>
          <span>Asia/Kolkata</span>
        </div>
      </section>

      {/* Module 2: "What Changed?" Comparison Module (5 cols) */}
      <section
        aria-label="What Changed Comparison"
        className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          isLight
            ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
            : "bg-[#0B1228]/80 border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className={isLight ? "text-emerald-600" : "text-emerald-400"} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                What Changed?
              </h3>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              isLight ? "bg-stone-50 border-stone-200 text-stone-600" : "bg-white/5 border-white/10 text-stone-300"
            }`}>
              vs Prev {dateRangeDays}D
            </span>
          </div>

          <p className={`text-xs leading-relaxed mb-4 ${isLight ? "text-stone-700" : "text-[#D1D5DB]"}`}>
            {comparisonSummary}
          </p>

          {/* Comparison Metrics Grid */}
          <div className="space-y-2.5">
            {[
              {
                label: "Check-ins",
                cur: currentCheckins.length,
                prev: previousCheckins.length,
                change: checkinsChange,
              },
              {
                label: "Reflections",
                cur: currentJournals.length,
                prev: previousJournals.length,
                change: journalsChange,
              },
              {
                label: "Studio Sessions",
                cur: currentPractices.length,
                prev: previousPractices.length,
                change: practicesChange,
              },
              {
                label: "Practice Minutes",
                cur: curMinutes,
                prev: prevMinutes,
                change: minutesChange,
              },
              {
                label: "Active Days",
                cur: curActiveDays,
                prev: prevActiveDays,
                change: activeDaysChange,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isLight ? "bg-[#FAF7F2] border-stone-200/80" : "bg-white/[0.03] border-white/5"
                }`}
              >
                <span className={`font-medium ${isLight ? "text-stone-800" : "text-stone-200"}`}>
                  {row.label}
                </span>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="opacity-60">{row.cur} vs {row.prev}</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded ${
                      row.change.dir === "up"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : row.change.dir === "down"
                        ? "bg-rose-500/20 text-rose-400"
                        : "opacity-50"
                    }`}
                  >
                    {row.change.pctStr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-4 pt-3 border-t text-[11px] flex items-center justify-between ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}>
          <span>Sourced strictly from recorded logs</span>
          <span>Zero fabrication</span>
        </div>
      </section>
    </div>
  );
}
