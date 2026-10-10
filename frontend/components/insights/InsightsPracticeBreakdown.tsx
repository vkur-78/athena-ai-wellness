"use client";

import React, { useState, useMemo } from "react";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { Wind, ArrowUpDown, Clock, Disc3 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface InsightsPracticeBreakdownProps {
  practices?: any[];
  sessions?: any[];
  onFilterCategory?: (cat: string | null) => void;
  activeCategory?: string | null;
  isLight?: boolean;
}

interface PracticeMetricRow {
  name: string;
  category: string;
  sessions: number;
  minutes: number;
  sharePercentage: number;
  lastUsed: string;
  lastUsedDate: Date;
  avgDurationMins: number;
}

export default function InsightsPracticeBreakdown({
  practices,
  sessions,
  onFilterCategory,
  activeCategory,
  isLight = false,
}: InsightsPracticeBreakdownProps) {
  const { t } = useLanguage();
  const effectivePractices = practices || sessions || [];
  const [sortBy, setSortBy] = useState<"mostUsed" | "mostTime" | "recent">("mostTime");

  const totalAllMinutes = useMemo(() => {
    return effectivePractices.reduce((acc, p) => {
      const dur = Number(p.duration_seconds || (p as any).actual_duration || 0);
      return acc + Math.round(dur / 60);
    }, 0);
  }, [effectivePractices]);

  const rows = useMemo<PracticeMetricRow[]>(() => {
    const map = new Map<
      string,
      {
        category: string;
        sessions: number;
        totalSecs: number;
        lastUsedDt: Date;
      }
    >();

    effectivePractices.forEach((p) => {
      const name = ((p as any).exercise_name || (p as any).routine || (p as any).practice_type || "Exercise")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      const cat = ((p as any).exercise_category || (p as any).practice_type || "Mindfulness")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      const dur = Number(p.duration_seconds || (p as any).actual_duration || 0);
      const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at || new Date().toISOString();
      const dt = new Date(timeVal);

      const existing = map.get(name) || {
        category: cat,
        sessions: 0,
        totalSecs: 0,
        lastUsedDt: dt,
      };

      existing.sessions += 1;
      existing.totalSecs += dur;
      if (dt > existing.lastUsedDt) existing.lastUsedDt = dt;
      map.set(name, existing);
    });

    const list: PracticeMetricRow[] = [];
    map.forEach((val, key) => {
      const mins = Math.max(1, Math.round(val.totalSecs / 60));
      const share = totalAllMinutes > 0 ? Math.round((mins / totalAllMinutes) * 100) : 0;
      const avg = Math.round(mins / Math.max(val.sessions, 1));

      list.push({
        name: key,
        category: val.category,
        sessions: val.sessions,
        minutes: mins,
        sharePercentage: share,
        lastUsed: val.lastUsedDt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        lastUsedDate: val.lastUsedDt,
        avgDurationMins: avg,
      });
    });

    if (sortBy === "mostUsed") list.sort((a, b) => b.sessions - a.sessions);
    else if (sortBy === "mostTime") list.sort((a, b) => b.minutes - a.minutes);
    else if (sortBy === "recent") list.sort((a, b) => b.lastUsedDate.getTime() - a.lastUsedDate.getTime());

    return list;
  }, [effectivePractices, totalAllMinutes, sortBy]);

  return (
    <section
      aria-label="Practice Performance Breakdown"
      className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Disc3 size={16} className={isLight ? "text-purple-600" : "text-purple-400"} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              {t("insights_practice_analytics_title", "PRACTICE ANALYTICS")}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            {t(
              "insights_practice_analytics_sub",
              "Which practices you actually return to, measured by sessions and minutes"
            )}
          </p>
        </div>

        {/* Sort Controls */}
        <div
          className={`inline-flex items-center p-0.5 rounded-xl border text-xs self-start sm:self-auto ${
            isLight
              ? "bg-[#FAF7F2] border-stone-200 text-stone-600"
              : "bg-white/5 border-white/10 text-stone-300"
          }`}
        >
          <button
            onClick={() => setSortBy("mostTime")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              sortBy === "mostTime"
                ? isLight ? "bg-white text-purple-700 shadow-xs" : "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            Most Time
          </button>
          <button
            onClick={() => setSortBy("mostUsed")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              sortBy === "mostUsed"
                ? isLight ? "bg-white text-purple-700 shadow-xs" : "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            Most Sessions
          </button>
          <button
            onClick={() => setSortBy("recent")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              sortBy === "recent"
                ? isLight ? "bg-white text-purple-700 shadow-xs" : "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            Recently Used
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center text-xs opacity-60">
          No practice history found in this timeframe.
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
                <th className="py-3 px-3">Practice Routine</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sessions</th>
                <th className="py-3 px-3">Total Minutes</th>
                <th className="py-3 px-3">Share</th>
                <th className="py-3 px-3">Avg Duration</th>
                <th className="py-3 px-3 text-right">Last Practiced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-mono">
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className={`transition-colors ${
                    isLight ? "hover:bg-stone-50 text-stone-800" : "hover:bg-white/[0.04] text-stone-300"
                  }`}
                >
                  <td className="py-3 px-3 font-sans font-medium">{row.name}</td>
                  <td className="py-3 px-3 font-sans opacity-70">{row.category}</td>
                  <td className="py-3 px-3 text-purple-400 font-semibold">{row.sessions}</td>
                  <td className="py-3 px-3 text-amber-400 font-semibold">{row.minutes}m</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-bold text-[11px]">
                      {row.sharePercentage}%
                    </span>
                  </td>
                  <td className="py-3 px-3 opacity-80">{row.avgDurationMins} min</td>
                  <td className="py-3 px-3 font-sans text-right opacity-70">{row.lastUsed}</td>
                </tr>
              ))}
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
        <span>Ranked practice routines</span>
        <span>Studio Sanctuary</span>
      </div>
    </section>
  );
}
