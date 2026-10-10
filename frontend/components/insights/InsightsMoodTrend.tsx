"use client";

import React, { useState } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { formatZonedDate } from "@/lib/timezone";

interface InsightsMoodTrendProps {
  checkins: CheckinResponse[];
  journals: JournalEntry[];
  isLight?: boolean;
}

const MOOD_INTENSITY: Record<string, { value: number; label: string; color: string }> = {
  great: { value: 5, label: "Energized", color: "#4ADE80" },
  good: { value: 4, label: "Calm & Steady", color: "#60A5FA" },
  okay: { value: 3, label: "Neutral", color: "#A78BFA" },
  down: { value: 2, label: "Tender", color: "#FBBF24" },
  struggling: { value: 1, label: "Overwhelmed", color: "#F87171" },
  calm: { value: 4, label: "Calm", color: "#60A5FA" },
  anxious: { value: 2, label: "Anxious", color: "#FBBF24" },
  peaceful: { value: 5, label: "Peaceful", color: "#4ADE80" },
  exhausted: { value: 1, label: "Exhausted", color: "#F87171" },
};

export default function InsightsMoodTrend({ checkins, journals, isLight = false }: InsightsMoodTrendProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    mood: string;
    energy?: number;
    hasJournal: boolean;
    reflection?: string | null;
    x: number;
    y: number;
  } | null>(null);

  // Filter valid checkins and sort chronologically
  const sortedCheckins = [...checkins]
    .filter((c) => Boolean(c.date || c.created_at))
    .sort((a, b) => {
      const da = new Date(a.date || a.created_at || "").getTime();
      const db = new Date(b.date || b.created_at || "").getTime();
      return da - db;
    })
    .slice(-14); // Last 14 entries for clear readability

  if (sortedCheckins.length < 2) {
    return (
      <div
        className={`p-6 sm:p-8 rounded-3xl border space-y-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200/90 shadow-sm"
            : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
          Mood Trend
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
          Not enough data yet. As you check in and use Athena, this chart will become more meaningful.
        </p>
      </div>
    );
  }

  // Map to points
  const journalDates = new Set(
    journals.map((j) => (j.created_at ? j.created_at.slice(0, 10) : ""))
  );

  const points = sortedCheckins.map((c, i) => {
    const rawMood = (c.mood || "okay").toLowerCase();
    const config = MOOD_INTENSITY[rawMood] || { value: 3, label: c.mood || "Okay", color: "#A78BFA" };
    const dateStr = (c.date || c.created_at || "").slice(0, 10);
    const hasJournal = journalDates.has(dateStr);

    return {
      index: i,
      dateStr,
      dateLabel: formatZonedDate(c.date || c.created_at || ""),
      moodLabel: config.label,
      value: config.value,
      color: config.color,
      energy: c.energy_level,
      reflection: c.reflection_text || c.ai_reflection,
      hasJournal,
    };
  });

  // Chart dimensions
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (index: number) => {
    if (points.length <= 1) return width / 2;
    return paddingX + (index / (points.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    // val is 1..5. Invert for SVG coords (5 at top, 1 at bottom)
    const normalized = (val - 1) / 4; // 0..1
    return height - paddingY - normalized * (height - 2 * paddingY);
  };

  // Generate SVG path string
  const pathD = points
    .map((pt, i) => {
      const x = getX(i);
      const y = getY(pt.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <section
      className={`p-6 sm:p-8 rounded-3xl border space-y-5 transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className={`text-base sm:text-lg font-serif ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
            Mood Trend
          </h2>
          <p className={`text-xs sm:text-sm ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
            Emotional intensity across your recent check-ins
          </p>
        </div>
        <div className={`flex items-center gap-3 text-[11px] font-mono ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80]" /> Uplifted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A78BFA]" /> Steady
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F87171]" /> Overwhelmed
          </span>
        </div>
      </div>

      {/* Interactive Line Chart SVG */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
        >
          {/* Subtle horizontal grid lines */}
          {[1, 2, 3, 4, 5].map((level) => {
            const y = getY(level);
            return (
              <line
                key={level}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Connected Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#7C5CFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, i) => {
            const cx = getX(i);
            const cy = getY(pt.value);
            const isHovered = hoveredPoint?.date === pt.dateLabel;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={pt.color}
                  stroke={isLight ? "#FFFFFF" : "#060814"}
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      date: pt.dateLabel,
                      mood: pt.moodLabel,
                      energy: pt.energy,
                      hasJournal: pt.hasJournal,
                      reflection: pt.reflection,
                      x: cx,
                      y: cy,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Small indicator if journal exists on this day */}
                {pt.hasJournal && (
                  <circle
                    cx={cx}
                    cy={cy - 9}
                    r={2}
                    fill="#BFAEFF"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs space-y-1 animate-in fade-in duration-150 max-w-sm ${
              isLight
                ? "bg-stone-50 border-stone-200 text-stone-800 shadow-md"
                : "border-white/10 bg-white/[0.04] text-[#F8F7FF]"
            }`}
          >
            <div className={`flex items-center justify-between font-mono text-[11px] ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
              <span>{hoveredPoint.date}</span>
              {hoveredPoint.hasJournal && (
                <span className="text-[#7C5CFF] font-medium">• Journaled</span>
              )}
            </div>
            <div className={`font-serif text-sm flex items-center gap-2 ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>
              <span>{hoveredPoint.mood}</span>
              {hoveredPoint.energy && (
                <span className={`text-[11px] font-mono ${isLight ? "text-stone-500" : "text-[#94A3B8]"}`}>
                  Energy: {hoveredPoint.energy}/5
                </span>
              )}
            </div>
            {hoveredPoint.reflection && (
              <p className={`italic truncate ${isLight ? "text-stone-600" : "text-[#94A3B8]"}`}>
                &ldquo;{hoveredPoint.reflection}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
