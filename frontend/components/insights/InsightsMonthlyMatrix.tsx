"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { Table, Calendar, CheckCircle2, BookOpen, Wind, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface InsightsMonthlyMatrixProps {
  checkins: any[];
  journals: any[];
  practices?: any[];
  sessions?: any[];
  selectedMonth: string | null;
  onSelectMonth: (monthKey: string | null) => void;
  isLight?: boolean;
}

interface MonthStatRow {
  monthKey: string; // "2026-09"
  monthLabel: string; // "September 2026"
  shortLabel: string; // "Sep 2026"
  checkins: number;
  journals: number;
  studioCount: number;
  practiceMinutes: number;
  topPractice: string;
}

export default function InsightsMonthlyMatrix({
  checkins,
  journals,
  practices,
  sessions,
  selectedMonth,
  onSelectMonth,
  isLight = false,
}: InsightsMonthlyMatrixProps) {
  const { t } = useLanguage();
  const effectivePractices = practices || sessions || [];

  const monthlyRows = useMemo<MonthStatRow[]>(() => {
    const map = new Map<
      string,
      {
        monthLabel: string;
        shortLabel: string;
        checkins: number;
        journals: number;
        practices: number;
        practiceSeconds: number;
        practiceCategories: Map<string, number>;
      }
    >();

    const getMonthKey = (dateStr: string) => {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return null;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const shortLabel = dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return { key, monthLabel, shortLabel };
    };

    // 1. Process Check-ins
    checkins.forEach((c) => {
      const dtStr = c.date || c.created_at;
      if (!dtStr) return;
      const res = getMonthKey(dtStr);
      if (!res) return;

      const existing = map.get(res.key) || {
        monthLabel: res.monthLabel,
        shortLabel: res.shortLabel,
        checkins: 0,
        journals: 0,
        practices: 0,
        practiceSeconds: 0,
        practiceCategories: new Map(),
      };
      existing.checkins += 1;
      map.set(res.key, existing);
    });

    // 2. Process Journals
    journals.forEach((j) => {
      if (!j.created_at) return;
      const res = getMonthKey(j.created_at);
      if (!res) return;

      const existing = map.get(res.key) || {
        monthLabel: res.monthLabel,
        shortLabel: res.shortLabel,
        checkins: 0,
        journals: 0,
        practices: 0,
        practiceSeconds: 0,
        practiceCategories: new Map(),
      };
      existing.journals += 1;
      map.set(res.key, existing);
    });

    // 3. Process Practices
    effectivePractices.forEach((p) => {
      const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (!timeVal) return;
      const res = getMonthKey(timeVal);
      if (!res) return;

      const existing = map.get(res.key) || {
        monthLabel: res.monthLabel,
        shortLabel: res.shortLabel,
        checkins: 0,
        journals: 0,
        practices: 0,
        practiceSeconds: 0,
        practiceCategories: new Map(),
      };
      existing.practices += 1;
      const dur = Number(p.duration_seconds || (p as any).actual_duration || 0);
      existing.practiceSeconds += dur;

      const cat = ((p as any).exercise_name || p.exercise_category || "Breathing").replace(/_/g, " ");
      existing.practiceCategories.set(cat, (existing.practiceCategories.get(cat) || 0) + 1);

      map.set(res.key, existing);
    });

    // Convert map to sorted list (descending by monthKey)
    const list: MonthStatRow[] = [];
    map.forEach((val, key) => {
      // Find top practice
      let topPractice = "—";
      let topCount = 0;
      val.practiceCategories.forEach((count, cat) => {
        if (count > topCount) {
          topCount = count;
          topPractice = cat;
        }
      });

      list.push({
        monthKey: key,
        monthLabel: val.monthLabel,
        shortLabel: val.shortLabel,
        checkins: val.checkins,
        journals: val.journals,
        studioCount: val.practices,
        practiceMinutes: Math.round(val.practiceSeconds / 60),
        topPractice,
      });
    });

    list.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    return list;
  }, [checkins, journals, effectivePractices]);

  return (
    <section
      aria-label="Monthly Analytical Breakdown"
      className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Monthly Longitudinal Comparison
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            Power BI drill-down matrix · Click any month row to filter and inspect detailed patterns
          </p>
        </div>

        {selectedMonth && (
          <button
            onClick={() => onSelectMonth(null)}
            className="px-3 py-1 rounded-xl text-xs font-medium border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      {monthlyRows.length === 0 ? (
        <div className="py-12 text-center text-xs opacity-60">
          No monthly history available yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                  isLight ? "border-stone-200 text-stone-500" : "border-white/10 text-[#B8BDD6]/60"
                }`}
              >
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-3">Check-ins</th>
                <th className="py-3 px-3">Journals</th>
                <th className="py-3 px-3">Studio</th>
                <th className="py-3 px-3">Minutes</th>
                <th className="py-3 px-3">Primary Practice</th>
                <th className="py-3 px-3 text-right">Drill Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-mono">
              {monthlyRows.map((row) => {
                const isSelected = selectedMonth === row.monthKey;

                return (
                  <tr
                    key={row.monthKey}
                    onClick={() => onSelectMonth(isSelected ? null : row.monthKey)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? isLight
                          ? "bg-indigo-50/90 text-indigo-950 font-bold"
                          : "bg-indigo-600/20 text-white font-bold"
                        : isLight
                        ? "hover:bg-stone-50 text-stone-800"
                        : "hover:bg-white/[0.04] text-stone-300"
                    }`}
                  >
                    <td className="py-3 px-3 font-sans font-medium flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? "bg-indigo-500 ring-2 ring-indigo-400/40" : "bg-white/20"
                        }`}
                      />
                      <span>{row.monthLabel}</span>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold">{row.checkins}</td>
                    <td className="py-3 px-3 text-blue-400 font-semibold">{row.journals}</td>
                    <td className="py-3 px-3 text-purple-400 font-semibold">{row.studioCount}</td>
                    <td className="py-3 px-3 text-amber-400 font-semibold">{row.practiceMinutes}m</td>
                    <td className="py-3 px-3 font-sans truncate max-w-[150px] opacity-80">
                      {row.topPractice}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <ChevronRight
                        size={14}
                        className={`inline-block transition-transform ${
                          isSelected ? "rotate-90 text-indigo-400" : "opacity-40"
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}
      >
        <span>
          {selectedMonth
            ? `Active Filter: ${monthlyRows.find((r) => r.monthKey === selectedMonth)?.monthLabel || selectedMonth}`
            : "Showing all recorded months"}
        </span>
        <span className="font-mono">Real historical logs</span>
      </div>
    </section>
  );
}
