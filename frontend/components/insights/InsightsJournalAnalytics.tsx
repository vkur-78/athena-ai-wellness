"use client";

import React, { useMemo } from "react";
import { JournalEntry } from "@/types/journal";
import { BookOpen, Sparkles, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface InsightsJournalAnalyticsProps {
  journals: JournalEntry[];
  checkins?: any[];
  isLight?: boolean;
}

interface MonthlyJournalStat {
  monthKey: string;
  monthLabel: string;
  entries: number;
  totalWords: number;
  avgWordsPerEntry: number;
}

export default function InsightsJournalAnalytics({
  journals,
  checkins,
  isLight = false,
}: InsightsJournalAnalyticsProps) {
  const { t } = useLanguage();

  const { monthlyStats, longestPeriods, totalAllWords } = useMemo(() => {
    const map = new Map<string, { monthLabel: string; entries: number; totalWords: number }>();
    let grandWords = 0;

    journals.forEach((j) => {
      if (!j.created_at) return;
      const dt = new Date(j.created_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const text = j.content || "";
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      grandWords += words;

      const existing = map.get(key) || { monthLabel, entries: 0, totalWords: 0 };
      existing.entries += 1;
      existing.totalWords += words;
      map.set(key, existing);
    });

    const list: MonthlyJournalStat[] = [];
    map.forEach((val, key) => {
      list.push({
        monthKey: key,
        monthLabel: val.monthLabel,
        entries: val.entries,
        totalWords: val.totalWords,
        avgWordsPerEntry: val.entries > 0 ? Math.round(val.totalWords / val.entries) : 0,
      });
    });

    list.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // Identify top 3 longest reflection periods by total words written
    const topPeriods = [...list].sort((a, b) => b.totalWords - a.totalWords).slice(0, 3);

    return { monthlyStats: list, longestPeriods: topPeriods, totalAllWords: grandWords };
  }, [journals]);

  if (journals.length === 0) {
    return (
      <section
        aria-label="Reflection Over Time"
        className={`p-5 sm:p-7 rounded-3xl border transition-all ${
          isLight
            ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
            : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className={isLight ? "text-blue-600" : "text-blue-400"} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Reflection Over Time
          </h2>
        </div>
        <p className="text-xs opacity-60">No journal reflections written yet.</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Reflection Over Time"
      className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className={isLight ? "text-blue-600" : "text-blue-400"} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              {t("insights_reflection_analytics_title", "REFLECTION ANALYTICS")}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            {t(
              "insights_reflection_analytics_sub",
              "Your journaling rhythm and written reflection over time"
            )}
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="font-bold text-blue-400">{journals.length}</span> {t("kpi_journals", "reflections")} ·{" "}
          <span className="font-bold text-blue-400">{totalAllWords.toLocaleString()}</span> {t("chart_words", "words total")}
        </div>
      </div>

      {/* Top Reflection Periods Showcase */}
      {longestPeriods.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-70">
            Deepest Reflection Periods
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {longestPeriods.map((p, idx) => (
              <div
                key={p.monthKey}
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight
                    ? "bg-[#FAF7F2] border-blue-200/80 text-stone-900"
                    : "bg-white/[0.03] border-blue-500/20 text-white"
                }`}
              >
                <div>
                  <div className="text-[11px] font-mono text-blue-400 font-bold uppercase">
                    Rank #{idx + 1} · {p.monthLabel}
                  </div>
                  <div className="text-xs font-semibold mt-0.5">
                    {p.entries} reflections written
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-blue-400">{p.totalWords.toLocaleString()}</span>
                  <div className="text-[10px] opacity-60">words</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Reflection Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                isLight ? "border-stone-200 text-stone-500" : "border-white/10 text-[#B8BDD6]/60"
              }`}
            >
              <th className="py-2.5 px-3">Month</th>
              <th className="py-2.5 px-3">Entries</th>
              <th className="py-2.5 px-3">Total Words</th>
              <th className="py-2.5 px-3 text-right">Avg Words / Entry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit font-mono">
            {monthlyStats.slice(0, 10).map((row) => (
              <tr
                key={row.monthKey}
                className={`transition-colors ${
                  isLight ? "hover:bg-stone-50 text-stone-800" : "hover:bg-white/[0.04] text-stone-300"
                }`}
              >
                <td className="py-2.5 px-3 font-sans font-medium">{row.monthLabel}</td>
                <td className="py-2.5 px-3 text-blue-400 font-semibold">{row.entries}</td>
                <td className="py-2.5 px-3 text-indigo-400">{row.totalWords.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right opacity-80">{row.avgWordsPerEntry} words</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`mt-4 pt-3 border-t text-[11px] flex items-center justify-between ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/50"
        }`}
      >
        <span>Word counts represent depth of contemplation without clinical inferences</span>
        <span>Space Analytics</span>
      </div>
    </section>
  );
}
