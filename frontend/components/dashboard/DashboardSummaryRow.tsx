"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  BookOpen,
  Wind,
  Clock,
  CalendarCheck,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardSummaryRowProps {
  currentCheckins: CheckinResponse[];
  previousCheckins: CheckinResponse[];
  currentJournals: JournalEntry[];
  previousJournals: JournalEntry[];
  currentPractices: (RecentMoment | StudioHistoryItem)[];
  previousPractices: (RecentMoment | StudioHistoryItem)[];
  currentPracticeMinutes: number;
  previousPracticeMinutes: number;
  activeDays: number;
  totalWindowDays: number;
  currentStreak: number;
  isLight?: boolean;
}

interface SparklineProps {
  values: number[];
  color: string;
}

function MiniSparkline({ values, color }: SparklineProps) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 64;
  const height = 20;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible opacity-80 group-hover:opacity-100 transition-opacity">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function DashboardSummaryRow({
  currentCheckins,
  previousCheckins,
  currentJournals,
  previousJournals,
  currentPractices,
  previousPractices,
  currentPracticeMinutes,
  previousPracticeMinutes,
  activeDays,
  totalWindowDays,
  currentStreak,
  isLight = false,
}: DashboardSummaryRowProps) {
  const { t } = useLanguage();

  // Helper to compute honest numerical delta (no fake percentages)
  const computeDiff = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) return { label: `+${diff} vs prev period`, direction: "up" as const };
    if (diff < 0) return { label: `${diff} vs prev period`, direction: "down" as const };
    return { label: "Same as prev period", direction: "neutral" as const };
  };

  const hasPreviousData = previousCheckins.length + previousJournals.length + previousPractices.length >= 2;

  // Split current period into mini buckets for sparklines (5 points)
  const sparklines = useMemo(() => {
    const bucketsCount = 5;
    const cBuckets = new Array(bucketsCount).fill(0);
    const jBuckets = new Array(bucketsCount).fill(0);
    const pBuckets = new Array(bucketsCount).fill(0);

    const now = Date.now();
    const windowMs = totalWindowDays * 86400000;
    const bucketDuration = windowMs / bucketsCount;

    currentCheckins.forEach((c) => {
      const ds = c.date || c.created_at;
      if (!ds) return;
      const tVal = new Date(ds).getTime();
      const age = now - tVal;
      const bucketIdx = Math.min(Math.max(Math.floor((windowMs - age) / bucketDuration), 0), bucketsCount - 1);
      cBuckets[bucketIdx]++;
    });

    currentJournals.forEach((j) => {
      const tVal = new Date(j.created_at).getTime();
      const age = now - tVal;
      const bucketIdx = Math.min(Math.max(Math.floor((windowMs - age) / bucketDuration), 0), bucketsCount - 1);
      jBuckets[bucketIdx]++;
    });

    currentPractices.forEach((p) => {
      const tVal = new Date((p as any).completed_at || (p as any).started_at || (p as any).created_at).getTime();
      const age = now - tVal;
      const bucketIdx = Math.min(Math.max(Math.floor((windowMs - age) / bucketDuration), 0), bucketsCount - 1);
      pBuckets[bucketIdx]++;
    });

    return {
      checkins: cBuckets,
      journals: jBuckets,
      practices: pBuckets,
    };
  }, [currentCheckins, currentJournals, currentPractices, totalWindowDays]);

  const checkinsDiff = computeDiff(currentCheckins.length, previousCheckins.length);
  const journalsDiff = computeDiff(currentJournals.length, previousJournals.length);

  const kpis = [
    {
      id: "checkins",
      label: t("kpi_checkins", "Check-ins"),
      value: `${currentCheckins.length}`,
      subLabel: hasPreviousData ? checkinsDiff.label : t("label_baseline_period", "Baseline period"),
      deltaDir: hasPreviousData ? checkinsDiff.direction : "neutral",
      icon: CheckCircle2,
      accent: "#10B981", // Emerald
      sparkline: sparklines.checkins,
    },
    {
      id: "journals",
      label: t("kpi_journals", "Journals"),
      value: `${currentJournals.length}`,
      subLabel: hasPreviousData ? journalsDiff.label : t("label_written_reflections", "Written reflections"),
      deltaDir: hasPreviousData ? journalsDiff.direction : "neutral",
      icon: BookOpen,
      accent: "#3B82F6", // Blue
      sparkline: sparklines.journals,
    },
    {
      id: "practices",
      label: t("kpi_practice", "Practice"),
      value: t("replay_sessions_count", "{count} sessions", { count: currentPractices.length }),
      subLabel: t("replay_minutes_count", "{min} min total", { min: currentPracticeMinutes }),
      deltaDir: "neutral" as const,
      icon: Wind,
      accent: "#8B5CF6", // Purple
      sparkline: sparklines.practices,
    },
    {
      id: "activeDays",
      label: t("kpi_active_days", "Active Days"),
      value: `${activeDays}`,
      subLabel: `${activeDays} of ${totalWindowDays} days active`,
      deltaDir: "neutral" as const,
      icon: CalendarCheck,
      accent: "#F59E0B", // Amber
      sparkline: null,
    },
  ];

  return (
    <section aria-label="Athena Sanctuary Key Metrics" className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <div
              key={kpi.id}
              className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isLight
                  ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_2px_14px_-2px_rgba(28,25,23,0.04),0_1px_3px_rgba(124,92,255,0.02)] hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
                  : "bg-[#0B1228]/80 border-white/10 hover:border-[#7C5CFF]/40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 backdrop-blur-xl"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
                    }`}
                  >
                    {kpi.label}
                  </span>
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${kpi.accent}15`,
                      borderColor: `${kpi.accent}30`,
                      color: kpi.accent,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div
                    className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {kpi.value}
                  </div>
                  {kpi.sparkline && (
                    <MiniSparkline values={kpi.sparkline} color={kpi.accent} />
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-inherit flex items-center justify-between text-[11px]">
                <span
                  className={`truncate flex items-center gap-1 ${
                    kpi.deltaDir === "up"
                      ? isLight ? "text-emerald-700 font-medium" : "text-emerald-400 font-medium"
                      : kpi.deltaDir === "down"
                      ? isLight ? "text-rose-700 font-medium" : "text-rose-400 font-medium"
                      : isLight ? "text-stone-500" : "text-[#B8BDD6]/60"
                  }`}
                >
                  {kpi.subLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
