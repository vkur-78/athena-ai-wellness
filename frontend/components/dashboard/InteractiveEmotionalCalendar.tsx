"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import {
  Calendar,
  Sparkles,
  BookOpen,
  Wind,
  MessageSquare,
  X,
  ChevronRight,
  Smile,
} from "lucide-react";

interface InteractiveEmotionalCalendarProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

interface CalendarDay {
  dayName: string;
  shortDate: string;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  moodState: "Great" | "Good" | "Okay" | "Low" | "Difficult" | "Pending" | "Upcoming";
  color: string;
  glow: string;
  checkin?: CheckinResponse;
  journal?: JournalEntry;
  moment?: RecentMoment;
  conversation?: any;
}

export default function InteractiveEmotionalCalendar({
  checkinHistory,
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InteractiveEmotionalCalendarProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // 7 days of the current week: Mon to Sun
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Maps by YYYY-MM-DD
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

  const convMap = useMemo(() => {
    const map = new Map<string, any>();
    conversations.forEach((c) => {
      const ds = toLocalDateString(c.created_at || c.updated_at);
      if (ds && !map.has(ds)) map.set(ds, c);
    });
    return map;
  }, [conversations]);

  const getMoodVisuals = (mood?: string | null): {
    state: "Great" | "Good" | "Okay" | "Low" | "Difficult";
    color: string;
    glow: string;
  } => {
    if (!mood) {
      return { state: "Okay", color: "#94A3B8", glow: "rgba(148, 163, 184, 0.4)" };
    }
    const m = mood.toLowerCase();
    if (m.includes("great") || m.includes("joy") || m.includes("flow") || m.includes("gratitude")) {
      return { state: "Great", color: "#A78BFA", glow: "rgba(167, 139, 250, 0.5)" };
    }
    if (m.includes("good") || m.includes("calm") || m.includes("peace") || m.includes("grounded")) {
      return { state: "Good", color: "#60A5FA", glow: "rgba(96, 165, 250, 0.5)" };
    }
    if (m.includes("low") || m.includes("tired") || m.includes("drained")) {
      return { state: "Low", color: "#F59E0B", glow: "rgba(245, 158, 11, 0.5)" };
    }
    if (m.includes("difficult") || m.includes("stress") || m.includes("anx") || m.includes("heavy")) {
      return { state: "Difficult", color: "#F43F5E", glow: "rgba(244, 63, 94, 0.5)" };
    }
    return { state: "Okay", color: "#94A3B8", glow: "rgba(148, 163, 184, 0.4)" };
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayStr = toLocalDateString(now);

  const days: CalendarDay[] = useMemo(() => {
    return dayNames.map((dayName, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateString(d);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;

      const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      if (isFuture) {
        return {
          dayName,
          shortDate,
          dateStr,
          isToday: false,
          isPast: false,
          isFuture: true,
          moodState: "Upcoming" as const,
          color: "rgba(255, 255, 255, 0.12)",
          glow: "transparent",
          checkin: undefined,
          journal: undefined,
          moment: undefined,
          conversation: undefined,
        };
      }

      const checkin = checkinMap.get(dateStr);
      const journal = journalMap.get(dateStr);
      const moment = momentMap.get(dateStr);
      const conversation = convMap.get(dateStr);

      if (checkin) {
        const visuals = getMoodVisuals(checkin.mood);
        return {
          dayName,
          shortDate,
          dateStr,
          isToday,
          isPast,
          isFuture: false,
          moodState: visuals.state,
          color: visuals.color,
          glow: visuals.glow,
          checkin,
          journal,
          moment,
          conversation,
        };
      }

      return {
        dayName,
        shortDate,
        dateStr,
        isToday,
        isPast,
        isFuture: false,
        moodState: "Pending",
        color: "rgba(124, 92, 255, 0.2)",
        glow: "rgba(124, 92, 255, 0.1)",
        checkin: undefined,
        journal,
        moment,
        conversation,
      };
    });
  }, [monday, checkinMap, journalMap, momentMap, convMap, todayStr]);

  return (
    <section aria-label="Interactive Emotional Calendar" className="relative space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Calendar size={12} className="text-[#C4B5FD]" />
            <span>Emotional Calendar • Seven-Day Journey</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            This Week’s Rhythm
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Hover to view day details. Click any day to inspect your journal, conversation, and practice.
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

      {/* Seven-Day Rounded Tiles Grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-4 p-4 sm:p-6 rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 backdrop-blur-2xl shadow-xl overflow-hidden">
        {days.map((day, idx) => {
          const isHovered = hoveredIdx === idx;
          const hasCheckin = Boolean(day.checkin);

          return (
            <button
              key={day.dayName}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setSelectedDay(day)}
              className={`group relative flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl border text-center transition-all duration-300 cursor-pointer focus:outline-none ${
                day.isToday
                  ? "ring-2 ring-[#A78BFA] border-[#A78BFA]/80 shadow-[0_0_20px_rgba(167,139,250,0.35)]"
                  : day.isFuture
                  ? "border-dashed border-white/10 opacity-60 hover:opacity-100 hover:border-white/25"
                  : "border-white/[0.08] hover:border-white/40"
              } ${
                isHovered
                  ? "scale-105 -translate-y-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
                  : "hover:-translate-y-0.5"
              }`}
              style={{
                backgroundColor: hasCheckin ? `${day.color}15` : "rgba(11, 18, 40, 0.6)",
              }}
              aria-label={`Inspect ${day.dayName} ${day.shortDate}`}
            >
              {/* Day Abbreviation & Date */}
              <div className="space-y-0.5">
                <p className={`text-xs sm:text-sm font-semibold ${day.isToday ? "text-[#A78BFA]" : day.isFuture ? "text-[#959BB4]" : "text-white"}`}>
                  {day.dayName}
                </p>
                <p className="text-[10px] font-sans text-[#959BB4]">
                  {day.shortDate}
                </p>
              </div>

              {/* Center Mood Glowing Bead */}
              <div className="my-3 flex items-center justify-center">
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform group-hover:scale-110 flex items-center justify-center"
                  style={{
                    backgroundColor: day.color,
                    boxShadow: hasCheckin ? `0 0 14px ${day.color}` : "none",
                  }}
                >
                  {hasCheckin && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                </div>
              </div>

              {/* Micro-Indicators: Journal & Practice */}
              <div className="flex items-center gap-1 h-3">
                {day.journal && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" title="Journal written" />
                )}
                {day.moment && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" title="Practice completed" />
                )}
                {day.conversation && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" title="Conversation held" />
                )}
              </div>

              {/* Hover Floating Card Tooltip */}
              {isHovered && (
                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-30 px-3 py-1.5 rounded-xl bg-[#0F1738] border border-[#7C5CFF]/40 text-xs font-sans text-white shadow-xl pointer-events-none whitespace-nowrap animate-athena-rise">
                  <span className="font-semibold">{day.moodState}</span>
                  {day.journal && <span className="text-[#60A5FA]"> • Journaled</span>}
                  {day.moment && <span className="text-[#4ADE80]"> • Practice</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Side Slide-in Inspection Drawer (Part 2: Click opens drawer with Mood, Journal preview, Conversation summary, Practice used) */}
      {selectedDay && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-athena-fade"
          onClick={() => setSelectedDay(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-[#080D20] border-l border-[#7C5CFF]/30 p-6 sm:p-8 flex flex-col justify-between text-white shadow-2xl overflow-y-auto animate-athena-rise"
          >
            {/* Drawer Header */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest font-sans font-semibold text-[#BFAEFF]">
                    Daily Sanctuary Inspection
                  </span>
                  <h3 className="font-hero-title text-2xl text-white font-semibold">
                    {selectedDay.dayName}, {selectedDay.shortDate}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#959BB4] hover:text-white transition-colors cursor-pointer"
                  aria-label="Close Drawer"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedDay.isFuture ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3 my-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#BFAEFF]">
                    <Calendar size={20} />
                  </div>
                  <h4 className="font-hero-title text-xl text-white font-medium">Upcoming Day</h4>
                  <p className="text-xs sm:text-sm font-sans text-[#B8BDD6] max-w-xs mx-auto leading-relaxed">
                    This day has not arrived yet. Athena will accompany your thoughts and reflections when this day arrives.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mood State */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans uppercase font-bold text-[#959BB4]">Mood Check-in</span>
                      <span
                        className="px-3 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${selectedDay.color}20`,
                          color: selectedDay.color,
                          border: `1px solid ${selectedDay.color}40`,
                        }}
                      >
                        {selectedDay.moodState}
                      </span>
                    </div>
                    {selectedDay.checkin?.reflection_text ? (
                      <p className="text-xs sm:text-sm font-sans text-[#B8BDD6] italic">
                        “{selectedDay.checkin.reflection_text}”
                      </p>
                    ) : (
                      <p className="text-xs font-sans text-[#959BB4]">
                        {selectedDay.checkin ? "Check-in logged without written reflection." : "No check-in recorded for this day."}
                      </p>
                    )}
                  </div>

                  {/* Journal Preview */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-sans uppercase font-bold text-[#60A5FA]">
                      <BookOpen size={13} />
                      <span>Journal Entry</span>
                    </div>
                    {selectedDay.journal ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {selectedDay.journal.title || "Space Reflection"}
                        </p>
                        <p className="text-xs font-sans text-[#B8BDD6] line-clamp-3 leading-relaxed">
                          {selectedDay.journal.content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-sans text-[#959BB4]">
                        No journal entry logged on this day.
                      </p>
                    )}
                  </div>

                  {/* Conversation Summary */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-sans uppercase font-bold text-[#A78BFA]">
                      <MessageSquare size={13} />
                      <span>Conversation Session</span>
                    </div>
                    {selectedDay.conversation ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {selectedDay.conversation.title || "Reflective Talk"}
                        </p>
                        {selectedDay.conversation.summary && (
                          <p className="text-xs font-sans text-[#B8BDD6] line-clamp-2">
                            {selectedDay.conversation.summary}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-sans text-[#959BB4]">
                        No conversation active on this day.
                      </p>
                    )}
                  </div>

                  {/* Practice Used */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-sans uppercase font-bold text-[#4ADE80]">
                      <Wind size={13} />
                      <span>Practice Used</span>
                    </div>
                    {selectedDay.moment ? (
                      <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
                        ✓ Completed {selectedDay.moment.practice_title || selectedDay.moment.title || selectedDay.moment.routine || "Studio Practice"}.
                      </p>
                    ) : (
                      <p className="text-xs font-sans text-[#959BB4]">
                        No studio practice recorded on this day.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-sans text-[#959BB4]">Athena Verified Records</span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
