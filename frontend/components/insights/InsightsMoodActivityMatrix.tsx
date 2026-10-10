"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sparkles, Calendar, BookOpen, Wind, MessageSquare, Check, Filter } from "lucide-react";
import { toLocalDateString } from "@/lib/dashboardMetrics";

interface InsightsMoodActivityMatrixProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

interface MatrixRow {
  dateStr: string;
  displayDate: string;
  mood?: string | null;
  moodColor: string;
  checkin?: CheckinResponse;
  journal?: JournalEntry;
  moment?: RecentMoment;
  conversation?: any;
}

export default function InsightsMoodActivityMatrix({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsMoodActivityMatrixProps) {
  const [filterMode, setFilterMode] = useState<"all" | "with-practices" | "with-journals">("all");

  const rows: MatrixRow[] = useMemo(() => {
    const dates = new Set<string>();

    const checkinMap = new Map<string, CheckinResponse>();
    checkinHistory.forEach((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      if (ds) {
        dates.add(ds);
        if (!checkinMap.has(ds)) checkinMap.set(ds, c);
      }
    });

    if (todayCheckin) {
      const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || new Date());
      if (todayDs) {
        dates.add(todayDs);
        checkinMap.set(todayDs, todayCheckin);
      }
    }

    const journalMap = new Map<string, JournalEntry>();
    recentJournals.forEach((j) => {
      const ds = toLocalDateString(j.created_at);
      if (ds) {
        dates.add(ds);
        if (!journalMap.has(ds)) journalMap.set(ds, j);
      }
    });

    const momentMap = new Map<string, RecentMoment>();
    recentMoments.forEach((m) => {
      const ds = toLocalDateString(m.created_at || (m as any).started_at);
      if (ds) {
        dates.add(ds);
        if (!momentMap.has(ds)) momentMap.set(ds, m);
      }
    });

    const convMap = new Map<string, any>();
    conversations.forEach((c) => {
      const ds = toLocalDateString(c.created_at || c.updated_at);
      if (ds) {
        dates.add(ds);
        if (!convMap.has(ds)) convMap.set(ds, c);
      }
    });

    const sortedDates = Array.from(dates).sort().reverse(); // Latest first

    const getMoodColor = (mood?: string | null) => {
      if (!mood) return "#94A3B8";
      const m = mood.toLowerCase();
      if (m.includes("great") || m.includes("joy")) return "#A78BFA";
      if (m.includes("good") || m.includes("calm")) return "#60A5FA";
      if (m.includes("low") || m.includes("tired")) return "#F59E0B";
      if (m.includes("difficult") || m.includes("stress")) return "#F43F5E";
      return "#94A3B8";
    };

    return sortedDates.map((dateStr) => {
      const checkin = checkinMap.get(dateStr);
      const journal = journalMap.get(dateStr);
      const moment = momentMap.get(dateStr);
      const conversation = convMap.get(dateStr);

      const d = new Date(dateStr + "T12:00:00");
      const displayDate = isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      return {
        dateStr,
        displayDate,
        mood: checkin?.mood || null,
        moodColor: getMoodColor(checkin?.mood),
        checkin,
        journal,
        moment,
        conversation,
      };
    });
  }, [checkinHistory, todayCheckin, recentJournals, recentMoments, conversations]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (filterMode === "with-practices") {
      return rows.filter((r) => Boolean(r.moment));
    }
    if (filterMode === "with-journals") {
      return rows.filter((r) => Boolean(r.journal));
    }
    return rows;
  }, [rows, filterMode]);

  // Descriptive co-occurrence summary
  const descriptiveTakeaway = useMemo(() => {
    const daysWithPracticeAndMood = rows.filter((r) => r.moment && r.mood);
    if (daysWithPracticeAndMood.length === 0) return null;

    const moodsOnPracticeDays = daysWithPracticeAndMood.map((r) => r.mood);
    return `On days you completed a Studio practice, your recorded check-in moods were: ${Array.from(new Set(moodsOnPracticeDays)).join(", ")}.`;
  }, [rows]);

  return (
    <section aria-label="Mood and Activity Co-occurrence Matrix" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Sparkles size={12} className="text-[#C4B5FD]" />
            <span>Section 4 • Daily Co-occurrence</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Mood & Activity Matrix
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Inspect how your mood and daily practices occurred across recorded days.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/10 self-start sm:self-auto text-xs font-sans">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              filterMode === "all" ? "bg-[#7C5CFF] text-white" : "text-[#B8BDD6] hover:text-white"
            }`}
          >
            All Days ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("with-practices")}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              filterMode === "with-practices" ? "bg-[#7C5CFF] text-white" : "text-[#B8BDD6] hover:text-white"
            }`}
          >
            With Practices
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("with-journals")}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              filterMode === "with-journals" ? "bg-[#7C5CFF] text-white" : "text-[#B8BDD6] hover:text-white"
            }`}
          >
            With Journals
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 backdrop-blur-2xl shadow-xl overflow-hidden space-y-4">
        {filteredRows.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="font-hero-title text-lg text-white">No matching days recorded</p>
            <p className="text-xs sm:text-sm font-sans text-[#959BB4] max-w-sm mx-auto">
              Athena displays verified co-occurrence once check-ins and practices are logged.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[#959BB4] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Recorded Mood</th>
                  <th className="py-3 px-3 text-center">Check-in</th>
                  <th className="py-3 px-3 text-center">Journal</th>
                  <th className="py-3 px-3 text-center">Studio Practice</th>
                  <th className="py-3 px-3 text-center">Conversation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredRows.slice(0, 15).map((row) => (
                  <tr key={row.dateStr} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                      {row.displayDate}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.mood ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: `${row.moodColor}20`, color: row.moodColor }}
                        >
                          {row.mood}
                        </span>
                      ) : (
                        <span className="text-[#959BB4] italic">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {row.checkin ? (
                        <span className="text-[#A78BFA] font-bold">✓</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {row.journal ? (
                        <span className="text-[#F59E0B] font-bold">✓</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {row.moment ? (
                        <span className="text-[#4ADE80] font-bold">✓</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {row.conversation ? (
                        <span className="text-[#60A5FA] font-bold">✓</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {descriptiveTakeaway && (
          <div className="pt-3 border-t border-white/[0.06] text-xs font-sans text-[#DDD6FE] italic">
            {descriptiveTakeaway}
          </div>
        )}
      </div>
    </section>
  );
}
