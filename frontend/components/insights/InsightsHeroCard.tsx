"use client";

import React, { useMemo } from "react";
import { Sparkles, Calendar, BookOpen, Wind, Activity, TrendingUp, Clock } from "lucide-react";
import type { CheckInRecord } from "@/types/checkin";
import type { JournalEntry } from "@/types/journal";
import type { StudioSession } from "@/types/studio";

interface InsightsHeroCardProps {
  timeRange: "30D" | "90D" | "6M" | "1Y" | "ALL";
  selectedMonth: string | null;
  checkins: CheckInRecord[];
  journals: JournalEntry[];
  sessions: StudioSession[];
  allCheckins: CheckInRecord[];
  allJournals: JournalEntry[];
  allSessions: StudioSession[];
}

export default function InsightsHeroCard({
  timeRange,
  selectedMonth,
  checkins,
  journals,
  sessions,
  allCheckins,
  allJournals,
  allSessions,
}: InsightsHeroCardProps) {
  // 1. Calculate Active Days in Current Period
  const activeDaysSet = useMemo(() => {
    const dates = new Set<string>();
    checkins.forEach((c) => {
      const d = c.checkin_date || c.created_at;
      if (d) dates.add(d.slice(0, 10));
    });
    journals.forEach((j) => {
      const d = j.date || j.created_at;
      if (d) dates.add(d.slice(0, 10));
    });
    sessions.forEach((s) => {
      const d = s.created_at || s.started_at;
      if (d) dates.add(d.slice(0, 10));
    });
    return dates;
  }, [checkins, journals, sessions]);

  // Total Practice Minutes
  const totalPracticeMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => {
      const mins = s.duration_minutes || (s.duration_seconds ? Math.round(s.duration_seconds / 60) : 5);
      return acc + mins;
    }, 0);
  }, [sessions]);

  // 2. Comparison with Prior Period (if applicable)
  const comparison = useMemo(() => {
    if (selectedMonth || timeRange === "ALL") return null;

    let days = 30;
    if (timeRange === "90D") days = 90;
    if (timeRange === "6M") days = 180;
    if (timeRange === "1Y") days = 365;

    const now = new Date();
    const currStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    const prevStartStr = prevStart.toISOString().slice(0, 10);
    const currStartStr = currStart.toISOString().slice(0, 10);

    const prevActiveDays = new Set<string>();
    allCheckins.forEach((c) => {
      const d = (c.checkin_date || c.created_at || "").slice(0, 10);
      if (d >= prevStartStr && d < currStartStr) prevActiveDays.add(d);
    });
    allJournals.forEach((j) => {
      const d = (j.date || j.created_at || "").slice(0, 10);
      if (d >= prevStartStr && d < currStartStr) prevActiveDays.add(d);
    });
    allSessions.forEach((s) => {
      const d = (s.created_at || s.started_at || "").slice(0, 10);
      if (d >= prevStartStr && d < currStartStr) prevActiveDays.add(d);
    });

    if (prevActiveDays.size === 0) return null;

    const diff = activeDaysSet.size - prevActiveDays.size;
    return {
      prevDays: prevActiveDays.size,
      diff,
      increased: diff > 0,
      steady: diff === 0,
    };
  }, [timeRange, selectedMonth, activeDaysSet.size, allCheckins, allJournals, allSessions]);

  // Display Title
  const periodLabel = useMemo(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    switch (timeRange) {
      case "30D":
        return "Last 30 Days";
      case "90D":
        return "Last 90 Days";
      case "6M":
        return "Past 6 Months";
      case "1Y":
        return "Past 12 Months";
      case "ALL":
      default:
        return "All-Time Journey";
    }
  }, [timeRange, selectedMonth]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#7C5CFF]/30 bg-gradient-to-br from-[#0c1228]/95 via-[#0e1633]/90 to-[#070b18]/95 p-6 sm:p-8 text-white shadow-xl shadow-[#7C5CFF]/10">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#7C5CFF]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7C5CFF]/40 bg-[#7C5CFF]/10 px-3 py-0.5 text-xs font-semibold text-[#BFAEFF]">
              <Sparkles size={12} className="text-[#7C5CFF]" />
              <span>Personal Analytics Overview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-[#F8F7FF]">
              {periodLabel}
            </h2>
          </div>

          {comparison && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-300">
              <TrendingUp size={14} className={comparison.increased ? "text-emerald-400" : "text-[#BFAEFF]"} />
              <span>
                {comparison.diff > 0
                  ? `+${comparison.diff} active days compared to prior period`
                  : comparison.diff < 0
                  ? `${Math.abs(comparison.diff)} fewer active days than prior period`
                  : "Consistent pacing with prior equivalent period"}
              </span>
            </div>
          )}
        </div>

        {/* Narrative Storytelling Statement */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Across this {periodLabel.toLowerCase()}, you recorded presence on{" "}
          <strong className="text-[#F8F7FF] font-semibold">{activeDaysSet.size} distinct days</strong>.
          Your sanctuary engagement included {checkins.length} check-ins, {journals.length} reflective journal entries, and{" "}
          {sessions.length} mindful practice sessions totaling {totalPracticeMinutes} minutes.
        </p>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {/* Active Days */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-1 transition hover:border-[#7C5CFF]/40">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Days</span>
              <Activity size={14} className="text-[#7C5CFF]" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{activeDaysSet.size}</div>
            <div className="text-[11px] text-slate-400">Recorded presence</div>
          </div>

          {/* Check-ins */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-1 transition hover:border-amber-400/40">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Check-ins</span>
              <Calendar size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{checkins.length}</div>
            <div className="text-[11px] text-slate-400">Rhythm & energy logs</div>
          </div>

          {/* Journals */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-1 transition hover:border-sky-400/40">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Journal Entries</span>
              <BookOpen size={14} className="text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{journals.length}</div>
            <div className="text-[11px] text-slate-400">Private Space entries</div>
          </div>

          {/* Practice Sessions & Min */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-1 transition hover:border-teal-400/40">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Practices & Time</span>
              <Wind size={14} className="text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {sessions.length} <span className="text-sm font-normal text-slate-400">({totalPracticeMinutes}m)</span>
            </div>
            <div className="text-[11px] text-slate-400">Studio & breathwork</div>
          </div>
        </div>
      </div>
    </div>
  );
}
