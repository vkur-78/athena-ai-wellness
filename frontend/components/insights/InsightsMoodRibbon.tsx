"use client";

import React, { useState } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Sparkles, Calendar, BookOpen, Wind, Smile } from "lucide-react";

interface InsightsMoodRibbonProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
}

export default function InsightsMoodRibbon({
  checkinHistory,
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
}: InsightsMoodRibbonProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Generate current week: Mon to Sun
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Map checkins by YYYY-MM-DD
  const checkinMap = new Map<string, CheckinResponse>();
  checkinHistory.forEach((c) => {
    const ds = toLocalDateString(c.date || c.created_at);
    if (ds && !checkinMap.has(ds)) checkinMap.set(ds, c);
  });
  if (todayCheckin) {
    const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || now);
    if (todayDs) checkinMap.set(todayDs, todayCheckin);
  }

  // Map journals by YYYY-MM-DD
  const journalMap = new Map<string, JournalEntry>();
  recentJournals.forEach((j) => {
    const ds = toLocalDateString(j.created_at);
    if (ds && !journalMap.has(ds)) journalMap.set(ds, j);
  });

  // Map practice moments by YYYY-MM-DD
  const momentMap = new Map<string, RecentMoment>();
  recentMoments.forEach((m) => {
    const ds = toLocalDateString(m.created_at);
    if (ds && !momentMap.has(ds)) momentMap.set(ds, m);
  });

  const getMoodIntensity = (mood?: string | null): number => {
    if (!mood) return 2.6;
    const m = mood.toLowerCase();
    if (m.includes("joy") || m.includes("grat") || m.includes("ener") || m.includes("flow")) return 4.6;
    if (m.includes("calm") || m.includes("peace") || m.includes("ground")) return 4.0;
    if (m.includes("think") || m.includes("reflect") || m.includes("okay")) return 3.2;
    if (m.includes("tired") || m.includes("low")) return 2.2;
    if (m.includes("anx") || m.includes("stress") || m.includes("heav")) return 1.6;
    return 3.0;
  };

  const getMoodColor = (mood?: string | null): string => {
    if (!mood) return "#7C5CFF";
    const m = mood.toLowerCase();
    if (m.includes("calm") || m.includes("peace") || m.includes("ground")) return "#4ADE80"; // Green
    if (m.includes("think") || m.includes("reflect") || m.includes("flow")) return "#38BDF8"; // Blue
    if (m.includes("anx") || m.includes("stress") || m.includes("heavy")) return "#FBBF24"; // Amber
    return "#BFAEFF"; // Purple
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayStr = toLocalDateString(now);

  const daysData = dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toLocalDateString(d);
    const isToday = dateStr === todayStr;
    const isPast = d < now && !isToday;
    const checkin = checkinMap.get(dateStr);
    const journal = journalMap.get(dateStr);
    const practice = momentMap.get(dateStr);
    const intensity = checkin ? getMoodIntensity(checkin.mood) : 2.6;

    return {
      name,
      dateStr,
      isToday,
      isPast,
      checkin,
      journal,
      practice,
      intensity,
      hasEntry: Boolean(checkin),
      moodColor: getMoodColor(checkin?.mood),
    };
  });

  // SVG Coordinates
  const svgWidth = 800;
  const svgHeight = 200;
  const paddingX = 50;
  const stepX = (svgWidth - paddingX * 2) / 6;

  const points = daysData.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = 160 - ((d.intensity - 1) / 4) * 120;
    return { x, y, ...d };
  });

  // Smooth bezier ribbon path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  // Active point
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points.find((p) => p.isToday) || points[0];

  return (
    <section aria-label="This Week Mood Ribbon" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            This Week
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Large animated mood ribbon across seven connected days.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans px-3.5 py-1.5 rounded-full border border-[#7C5CFF]/30 bg-[#0B1228]/80 text-[#BFAEFF] shadow-xs">
          <Sparkles size={12} className="text-[#BFAEFF]" />
          <span>Real Stored Data</span>
        </div>
      </div>

      {/* Main Glass Canvas Card */}
      <div className="sanctuary-glass p-6 sm:p-9 rounded-[28px] border border-[#7C5CFF]/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.08)]">
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="ribbonGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7C5CFF" />
                <stop offset="35%" stopColor="#38BDF8" />
                <stop offset="70%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#BFAEFF" />
              </linearGradient>
            </defs>

            {/* Subtle Horizon Track Line */}
            <line
              x1={paddingX}
              y1={110}
              x2={svgWidth - paddingX}
              y2={110}
              stroke="rgba(124, 92, 255, 0.15)"
              strokeDasharray="4 6"
              strokeWidth="1.5"
            />

            {/* Glowing Mood Ribbon */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#ribbonGlow)"
              strokeWidth="5"
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{
                filter: "drop-shadow(0 0 12px rgba(124, 92, 255, 0.6))",
              }}
            />

            {/* 7 Interactive Day Nodes */}
            {points.map((pt, i) => {
              const isHovered = hoveredIdx === i;
              const dotColor = pt.moodColor;

              return (
                <g
                  key={pt.name}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(i)}
                >
                  {/* Aura on hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 16 : pt.hasEntry ? 10 : 7}
                    fill={dotColor}
                    opacity={isHovered ? 0.35 : pt.hasEntry ? 0.22 : 0.1}
                    className="transition-all duration-300"
                  />

                  {/* Dot Body */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 8 : 6}
                    fill={pt.hasEntry ? dotColor : "#0B1228"}
                    stroke={dotColor}
                    strokeWidth="2.5"
                    className="transition-all duration-300"
                    style={{
                      filter: pt.hasEntry ? `drop-shadow(0 0 10px ${dotColor})` : "none",
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Day Label Badges */}
          <div className="flex justify-between px-4 sm:px-8 pt-3">
            {daysData.map((d, i) => (
              <button
                key={d.name}
                type="button"
                onClick={() => setHoveredIdx(i)}
                onMouseEnter={() => setHoveredIdx(i)}
                className={`flex flex-col items-center cursor-pointer transition-colors duration-180 ${
                  d.isToday
                    ? "text-[#F8F7FF] font-bold"
                    : hoveredIdx === i
                    ? "text-[#BFAEFF]"
                    : "text-[#B8BDD6] hover:text-[#F8F7FF]"
                }`}
              >
                <span className="text-[12px] font-sans uppercase tracking-wider">
                  {d.name}
                </span>
                <span className="text-[10px] font-sans mt-0.5 capitalize" style={{ color: d.moodColor }}>
                  {d.checkin?.mood || (d.isToday ? "Today" : "—")}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hover / Inspection Drawer: Shows Mood, Journal, Practice */}
        {activePoint && (
          <div className="mt-6 p-4 sm:p-5 rounded-[20px] border border-[#7C5CFF]/25 bg-[#0B1228]/85 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-[#F8F7FF] animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: activePoint.moodColor,
                  boxShadow: `0 0 10px ${activePoint.moodColor}`,
                }}
              />
              <div>
                <span className="font-hero-serif font-bold text-base text-[#F8F7FF]">
                  {activePoint.name}
                </span>
                <span className="text-xs font-sans text-[#B8BDD6] ml-2">
                  {activePoint.dateStr}
                </span>
              </div>
            </div>

            {/* 3 Detail Badges: Mood, Journal, Practice */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
              {/* Mood */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 text-[#F8F7FF]">
                <Smile size={13} className="text-[#BFAEFF]" />
                <span>
                  Mood:{" "}
                  <strong className="capitalize text-[#BFAEFF]">
                    {activePoint.checkin?.mood || "No check-in"}
                  </strong>
                </span>
              </div>

              {/* Journal */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-[#F8F7FF]">
                <BookOpen size={13} className="text-[#38BDF8]" />
                <span>
                  Journal:{" "}
                  <strong className="text-[#38BDF8]">
                    {activePoint.journal ? (activePoint.journal.title || "Entry written") : "None"}
                  </strong>
                </span>
              </div>

              {/* Practice */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#F8F7FF]">
                <Wind size={13} className="text-[#4ADE80]" />
                <span>
                  Practice:{" "}
                  <strong className="text-[#4ADE80]">
                    {activePoint.practice ? (activePoint.practice.title || "Completed") : "None"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
