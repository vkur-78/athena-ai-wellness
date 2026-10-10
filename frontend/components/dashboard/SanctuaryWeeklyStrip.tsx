"use client";

import React, { useState } from "react";
import { DayTimelineNode } from "@/lib/dashboardMetrics";
import { Check, Sparkles, Smile, BookOpen, Wind } from "lucide-react";

interface SanctuaryWeeklyStripProps {
  timelineDays: DayTimelineNode[];
  completedCount: number;
}

export default function SanctuaryWeeklyStrip({
  timelineDays,
  completedCount,
}: SanctuaryWeeklyStripProps) {
  const [hoveredDay, setHoveredDay] = useState<DayTimelineNode | null>(null);

  // Active day to inspect: hovered day, or today by default
  const activeDay = hoveredDay || timelineDays.find((d) => d.isToday) || timelineDays[0];

  // Specific 4-color palette mapping from prompt: green, blue, amber, purple
  const getDayMoodColor = (day: DayTimelineNode): { bg: string; border: string; glow: string; name: string } => {
    if (!day.isCompleted && !day.mood) {
      if (day.isToday) {
        return { bg: "#7C5CFF", border: "#7C5CFF", glow: "rgba(124,92,255,0.5)", name: "Ready" };
      }
      return { bg: "transparent", border: "rgba(124,92,255,0.2)", glow: "none", name: "Upcoming" };
    }

    const m = (day.mood || "").toLowerCase();
    if (m.includes("calm") || m.includes("peace") || m.includes("ground") || m.includes("good")) {
      return { bg: "#4ADE80", border: "#4ADE80", glow: "rgba(74,222,128,0.5)", name: "Green • Calm" };
    }
    if (m.includes("think") || m.includes("reflect") || m.includes("flow") || m.includes("clear")) {
      return { bg: "#38BDF8", border: "#38BDF8", glow: "rgba(56,189,248,0.5)", name: "Blue • Clarity" };
    }
    if (m.includes("joy") || m.includes("happy") || m.includes("anx") || m.includes("stress")) {
      return { bg: "#FBBF24", border: "#FBBF24", glow: "rgba(251,191,36,0.5)", name: "Amber • Active" };
    }
    return { bg: "#A855F7", border: "#A855F7", glow: "rgba(168,85,247,0.5)", name: "Purple • Tender" };
  };

  return (
    <section aria-label="Weekly Timeline Ribbon" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-sans font-medium text-[#BFAEFF]">
            <Sparkles size={14} className="text-[#BFAEFF]" />
            <span>Your Rhythm</span>
            <span className="opacity-40">•</span>
            <span>Seven-Day Mood Ribbon</span>
          </div>
          <h2 className="text-[22px] sm:text-[28px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Seven-Day Rhythm
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-[12px] font-sans px-3.5 py-1.5 rounded-full border border-[#7C5CFF]/30 bg-[#0B1228]/80 text-[#BFAEFF] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
          <span>{completedCount} of 7 Days Completed</span>
        </div>
      </div>

      {/* Main Glass Timeline Card */}
      <div className="sanctuary-glass p-6 sm:p-9 rounded-[28px] border border-[#7C5CFF]/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.08)]">
        {/* Seven-Day Ribbon with Smooth Connecting Curves */}
        <div className="relative py-6 sm:py-8">
          {/* Background Connecting Ribbon Track */}
          <div className="absolute top-1/2 left-6 right-6 sm:left-10 sm:right-10 h-[3px] -translate-y-1/2 pointer-events-none rounded-full bg-[#7C5CFF]/15" />

          {/* Smooth Fluid Gradient Ribbon Flow */}
          <div
            className="absolute top-1/2 left-6 sm:left-10 h-[3px] -translate-y-1/2 pointer-events-none rounded-full bg-gradient-to-r from-[#4ADE80] via-[#38BDF8] via-[#FBBF24] to-[#A855F7] transition-all duration-700 shadow-[0_0_12px_rgba(124,92,255,0.6)]"
            style={{
              width: `${Math.max(0, Math.min(100, ((completedCount - 0.5) / 6) * 100))}%`,
            }}
          />

          {/* 7 Connected Days */}
          <div className="relative z-10 flex items-center justify-between">
            {timelineDays.map((day) => {
              const isSelected = activeDay?.dateStr === day.dateStr;
              const isCompleted = day.isCompleted;
              const isToday = day.isToday;
              const moodStyle = getDayMoodColor(day);

              return (
                <div
                  key={day.name}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`flex flex-col items-center cursor-pointer group transition-all duration-[220ms] ${
                    isSelected ? "scale-110" : "hover:scale-105"
                  }`}
                >
                  {/* Day Label */}
                  <span
                    className={`text-[12px] font-sans font-medium uppercase tracking-wider mb-3 transition-colors ${
                      isToday
                        ? "text-[#F8F7FF] font-bold"
                        : "text-[#B8BDD6] group-hover:text-[#F8F7FF]"
                    }`}
                  >
                    {day.name}
                  </span>

                  {/* Connected Circle Container */}
                  <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
                    {/* Pulsing Aura on Today */}
                    {isToday && (
                      <span className="absolute inset-0 rounded-full animate-timeline-pulse" />
                    )}

                    {/* The Mood Dot */}
                    <div
                      className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all duration-[220ms] border-2`}
                      style={{
                        backgroundColor: isCompleted ? moodStyle.bg : isToday ? "#0B1228" : "#060814",
                        borderColor: isCompleted ? moodStyle.border : isToday ? "#7C5CFF" : "rgba(124,92,255,0.2)",
                        boxShadow: isCompleted ? `0 0 16px ${moodStyle.glow}` : isToday ? "0 0 14px rgba(124,92,255,0.5)" : "none",
                        color: isCompleted ? "#060814" : "#F8F7FF",
                      }}
                    >
                      {isCompleted ? (
                        <Check size={16} strokeWidth={2.8} />
                      ) : isToday ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF] animate-ping" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      )}
                    </div>
                  </div>

                  {/* State Subtitle */}
                  <span
                    className={`text-[11px] font-sans mt-2.5 transition-colors capitalize ${
                      isCompleted
                        ? "text-[#4ADE80] font-medium"
                        : isToday
                        ? "text-[#BFAEFF] font-semibold"
                        : "text-[#B8BDD6]/60"
                    }`}
                  >
                    {isCompleted ? (day.mood || "Logged") : isToday ? "Today" : day.isPast ? "Missed" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover / Active Day Inspection Drawer */}
        {activeDay && (
          <div className="mt-4 p-4 rounded-[20px] border border-[#7C5CFF]/20 bg-[#0B1228]/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#F8F7FF]">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: getDayMoodColor(activeDay).border,
                  boxShadow: `0 0 8px ${getDayMoodColor(activeDay).glow}`,
                }}
              />
              <div>
                <span className="font-hero-serif font-semibold text-base">
                  {activeDay.name} ({activeDay.dateStr})
                </span>
                {activeDay.timeLabel && (
                  <span className="text-[12px] font-sans text-[#B8BDD6] ml-2">
                    • Check-in at {activeDay.timeLabel}
                  </span>
                )}
                {activeDay.mood && (
                  <span className="text-[12px] font-sans text-[#BFAEFF] ml-2 font-medium capitalize">
                    ({activeDay.mood})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeDay.activities.length > 0 ? (
                activeDay.activities.map((act) => (
                  <span
                    key={act}
                    className="text-[11px] font-sans font-medium px-2.5 py-1 rounded-full bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30"
                  >
                    {act}
                  </span>
                ))
              ) : (
                <span className="text-[12px] font-sans text-[#B8BDD6] italic">
                  {activeDay.isPast ? "No check-in recorded" : "Upcoming sanctuary day"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
