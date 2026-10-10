"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Sparkles, Calendar, BookOpen, Wind, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface InsightsEmotionalRiverProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
}

interface RiverDay {
  name: string;
  shortDate: string;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  checkin?: CheckinResponse;
  journal?: JournalEntry;
  practice?: RecentMoment;
  moodLevel: "Great" | "Good" | "Okay" | "Low" | "Difficult" | "Unwritten";
  color: string;
  glow: string;
  heightPercent: number; // 12% to 92%
}

export default function InsightsEmotionalRiver({
  checkinHistory,
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
}: InsightsEmotionalRiverProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Compute 7 days: Mon to Sun of current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Date map lookups
  const checkinMap = useMemo(() => {
    const map = new Map<string, CheckinResponse>();
    checkinHistory.forEach((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      if (ds && !map.has(ds)) map.set(ds, c);
    });
    if (todayCheckin) {
      const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || now);
      if (todayDs) map.set(todayDs, todayCheckin);
    }
    return map;
  }, [checkinHistory, todayCheckin, now]);

  const journalMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    recentJournals.forEach((j) => {
      const ds = toLocalDateString(j.created_at);
      if (ds && !map.has(ds)) map.set(ds, j);
    });
    return map;
  }, [recentJournals]);

  const momentMap = useMemo(() => {
    const map = new Map<string, RecentMoment>();
    recentMoments.forEach((m) => {
      const ds = toLocalDateString(m.created_at);
      if (ds && !map.has(ds)) map.set(ds, m);
    });
    return map;
  }, [recentMoments]);

  // Color mapping strictly matching prompt:
  // Great: Lavender (#A78BFA)
  // Good: Soft Blue (#60A5FA)
  // Okay: Silver (#94A3B8)
  // Low: Warm Amber (#F59E0B)
  // Difficult: Rose (#F43F5E)
  const mapMoodToVisuals = (mood?: string | null): {
    level: "Great" | "Good" | "Okay" | "Low" | "Difficult";
    color: string;
    glow: string;
    height: number;
  } => {
    if (!mood) {
      return {
        level: "Okay",
        color: "#94A3B8",
        glow: "rgba(148, 163, 184, 0.4)",
        height: 56,
      };
    }
    const m = mood.toLowerCase();
    if (m.includes("great") || m.includes("joy") || m.includes("flow") || m.includes("gratitude")) {
      return {
        level: "Great",
        color: "#A78BFA", // Lavender
        glow: "rgba(167, 139, 250, 0.5)",
        height: 92,
      };
    }
    if (m.includes("good") || m.includes("calm") || m.includes("peace") || m.includes("grounded")) {
      return {
        level: "Good",
        color: "#60A5FA", // Soft Blue
        glow: "rgba(96, 165, 250, 0.5)",
        height: 76,
      };
    }
    if (m.includes("low") || m.includes("tired") || m.includes("drained") || m.includes("heavy")) {
      return {
        level: "Low",
        color: "#F59E0B", // Warm Amber
        glow: "rgba(245, 158, 11, 0.5)",
        height: 38,
      };
    }
    if (m.includes("difficult") || m.includes("stress") || m.includes("anx") || m.includes("overwhelm")) {
      return {
        level: "Difficult",
        color: "#F43F5E", // Rose
        glow: "rgba(244, 63, 94, 0.5)",
        height: 24,
      };
    }
    return {
      level: "Okay",
      color: "#94A3B8", // Silver
      glow: "rgba(148, 163, 184, 0.4)",
      height: 56,
    };
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayStr = toLocalDateString(now);

  const days: RiverDay[] = useMemo(() => {
    return dayNames.map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateString(d);
      const isToday = dateStr === todayStr;
      const isPast = d < now && !isToday;
      const checkin = checkinMap.get(dateStr);
      const journal = journalMap.get(dateStr);
      const practice = momentMap.get(dateStr);

      const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      if (checkin) {
        const visuals = mapMoodToVisuals(checkin.mood);
        return {
          name,
          shortDate,
          dateStr,
          isToday,
          isPast,
          checkin,
          journal,
          practice,
          moodLevel: visuals.level,
          color: visuals.color,
          glow: visuals.glow,
          heightPercent: visuals.height,
        };
      }

      return {
        name,
        shortDate,
        dateStr,
        isToday,
        isPast,
        checkin: undefined,
        journal,
        practice,
        moodLevel: "Unwritten",
        color: "rgba(124, 92, 255, 0.2)",
        glow: "rgba(124, 92, 255, 0.1)",
        heightPercent: 12,
      };
    });
  }, [monday, checkinMap, journalMap, momentMap, todayStr, now]);

  const hasAnyCheckin = days.some((d) => Boolean(d.checkin));
  const activeDay = selectedIdx !== null ? days[selectedIdx] : null;

  return (
    <section aria-label="Emotional River" className="relative space-y-4">
      {/* Header with question tracking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Sparkles size={12} className="text-[#C4B5FD]" />
            <span>What changed? • Signature Visualization</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            The Emotional River
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Seven flowing days. Ribbon height reflects mood intensity, moving organically with your week.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-sans text-[#B8BDD6] pt-1 sm:pt-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#A78BFA] shadow-[0_0_6px_#A78BFA]" />
            <span>Great</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#60A5FA] shadow-[0_0_6px_#60A5FA]" />
            <span>Good</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#94A3B8] shadow-[0_0_6px_#94A3B8]" />
            <span>Okay</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
            <span>Low</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_6px_#F43F5E]" />
            <span>Difficult</span>
          </span>
        </div>
      </div>

      {/* Main River Canvas Card */}
      <div className="relative rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_48px_-8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(248,247,255,0.08)] overflow-hidden">
        {/* Floating Ambient Particles (Continuous gentle drift) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span
            className="absolute w-1.5 h-1.5 rounded-full bg-[#A78BFA]/40 animate-athena-drift"
            style={{ top: "40%", left: "15%", animationDelay: "0s" }}
          />
          <span
            className="absolute w-2 h-2 rounded-full bg-[#60A5FA]/30 animate-athena-drift"
            style={{ top: "65%", left: "45%", animationDelay: "3s" }}
          />
          <span
            className="absolute w-1 h-1 rounded-full bg-[#DDD6FE]/50 animate-athena-drift"
            style={{ top: "25%", left: "75%", animationDelay: "5s" }}
          />
        </div>

        {!hasAnyCheckin ? (
          /* Empty State */
          <div className="py-14 sm:py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center animate-athena-glow">
              <Sparkles size={22} className="text-[#C4B5FD]" />
            </div>
            <p className="font-hero-title text-xl text-[#F8F7FF]">
              Waiting for your first check-in.
            </p>
            <p className="text-xs sm:text-sm font-sans text-[#B8BDD6] max-w-sm mx-auto">
              Your daily ribbons will flow here as you log reflections, showing how calm and intensity shift across time.
            </p>
          </div>
        ) : (
          /* Seven Vertical Columns with Flowing Ribbons */
          <div className="space-y-6">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 md:gap-6 h-64 sm:h-72 items-end pt-4 pb-2">
              {days.map((day, idx) => {
                const isSelected = selectedIdx === idx;
                const hasCheckin = Boolean(day.checkin);

                return (
                  <button
                    key={day.name}
                    type="button"
                    onClick={() => setSelectedIdx(isSelected ? null : idx)}
                    className="group relative flex flex-col items-center justify-end h-full w-full focus:outline-none cursor-pointer"
                    aria-label={`Select ${day.name} ${day.shortDate}`}
                  >
                    {/* Flowing Ribbon Container */}
                    <div className="relative w-full max-w-[44px] sm:max-w-[54px] md:max-w-[64px] h-full flex items-end justify-center">
                      {/* Ribbon Track Background */}
                      <div className="absolute inset-x-0 bottom-0 top-0 rounded-2xl bg-white/[0.03] border border-white/[0.05] transition-colors group-hover:bg-white/[0.06]" />

                      {/* Animated Flowing Ribbon Column */}
                      <div
                        className="relative w-full rounded-2xl transition-all duration-500 ease-out overflow-hidden flex flex-col justify-between p-1.5"
                        style={{
                          height: `${day.heightPercent}%`,
                          background: hasCheckin
                            ? `linear-gradient(180deg, ${day.color} 0%, ${day.color}88 60%, rgba(11, 18, 40, 0.9) 100%)`
                            : "linear-gradient(180deg, rgba(124, 92, 255, 0.15) 0%, rgba(6, 8, 20, 0.4) 100%)",
                          boxShadow: hasCheckin
                            ? `0 0 20px ${day.glow}, inset 0 1px 1px rgba(255,255,255,0.3)`
                            : "none",
                        }}
                      >
                        {/* Top glowing cap */}
                        {hasCheckin && (
                          <div
                            className="w-full h-1.5 rounded-full"
                            style={{
                              backgroundColor: day.color,
                              boxShadow: `0 0 8px ${day.color}`,
                            }}
                          />
                        )}

                        {/* Activity Badges inside column if tall enough */}
                        <div className="space-y-1 my-auto hidden sm:flex flex-col items-center">
                          {day.journal && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-xs" title="Journal written" />
                          )}
                          {day.practice && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-xs" title="Practice completed" />
                          )}
                        </div>

                        {/* Selected Indicator Ring */}
                        {isSelected && (
                          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/80 shadow-[0_0_16px_rgba(255,255,255,0.4)] pointer-events-none" />
                        )}
                      </div>
                    </div>

                    {/* Day Labels at bottom */}
                    <div className="mt-3 text-center transition-transform group-hover:-translate-y-0.5">
                      <p className={`text-xs sm:text-sm font-semibold ${
                        day.isToday ? "text-[#A78BFA]" : isSelected ? "text-white" : "text-[#B8BDD6]"
                      }`}>
                        {day.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-sans text-[#959BB4]">
                        {day.shortDate}
                      </p>
                    </div>

                    {/* Today Pill */}
                    {day.isToday && (
                      <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_8px_#A78BFA]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inline Day Expansion (Strict Rule: No popup! Inline expansion only!) */}
            {activeDay && (
              <div className="mt-4 pt-4 border-t border-[#7C5CFF]/20 animate-athena-rise">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1733]/90 border border-[#7C5CFF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-hero-title text-lg text-white font-semibold">
                        {activeDay.name}, {activeDay.shortDate}
                      </span>
                      {activeDay.checkin ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${activeDay.color}25`,
                            color: activeDay.color,
                            border: `1px solid ${activeDay.color}50`,
                          }}
                        >
                          {activeDay.moodLevel} Mood
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-sans text-[#959BB4] bg-white/5 border border-white/10">
                          No check-in recorded
                        </span>
                      )}
                    </div>

                    {/* Notes or details */}
                    {activeDay.checkin?.reflection_text && (
                      <p className="text-xs sm:text-sm font-sans text-[#B8BDD6] italic max-w-xl">
                        “{activeDay.checkin.reflection_text}”
                      </p>
                    )}
                  </div>

                  {/* Actions / Verified Events */}
                  <div className="flex flex-wrap items-center gap-2">
                    {activeDay.journal && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#60A5FA]/15 border border-[#60A5FA]/30 text-xs font-sans font-medium text-[#93C5FD]">
                        <BookOpen size={12} />
                        <span>Journaled</span>
                      </span>
                    )}

                    {activeDay.practice && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-xs font-sans font-medium text-[#86EFAC]">
                        <Wind size={12} />
                        <span>{activeDay.practice.practice_title || activeDay.practice.title || activeDay.practice.routine || "Breathing completed"}</span>
                      </span>
                    )}

                    {activeDay.checkin && !activeDay.journal && !activeDay.practice && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-sans text-[#B8BDD6]">
                        <CheckCircle2 size={12} className="text-[#A78BFA]" />
                        <span>Check-in logged</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedIdx(null)}
                      className="text-xs font-sans text-[#959BB4] hover:text-white px-2 py-1 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
