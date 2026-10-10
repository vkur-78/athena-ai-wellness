"use client";

import React, { useState } from "react";
import { CheckinResponse } from "@/types/checkin";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Sparkles, Activity } from "lucide-react";

interface InsightsMoodTimelineProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
}

export default function InsightsMoodTimeline({
  checkinHistory,
  todayCheckin,
}: InsightsMoodTimelineProps) {
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

  // Map mood to intensity height (scale 1 to 5)
  const getMoodIntensity = (mood?: string | null): number => {
    if (!mood) return 2.5; // neutral baseline
    const m = mood.toLowerCase();
    if (m.includes("joy") || m.includes("grat") || m.includes("ener")) return 4.8;
    if (m.includes("calm") || m.includes("peace") || m.includes("ground")) return 4.0;
    if (m.includes("think") || m.includes("reflect") || m.includes("okay")) return 3.2;
    if (m.includes("tired") || m.includes("low")) return 2.2;
    if (m.includes("anx") || m.includes("stress") || m.includes("heav")) return 1.8;
    return 3.0;
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
    const intensity = checkin ? getMoodIntensity(checkin.mood) : 2.5;

    return {
      name,
      dateStr,
      isToday,
      isPast,
      checkin,
      intensity,
      hasEntry: Boolean(checkin),
    };
  });

  // SVG Coordinates
  // Width 700, Height 180, Y ranges from 140 (low) to 40 (high)
  const svgWidth = 700;
  const svgHeight = 180;
  const paddingX = 40;
  const stepX = (svgWidth - paddingX * 2) / 6;

  const points = daysData.map((d, i) => {
    const x = paddingX + i * stepX;
    // Intensity 1 to 5 maps to Y 145 down to 35
    const y = 150 - ((d.intensity - 1) / 4) * 115;
    return { x, y, ...d };
  });

  // Build smooth bezier curve
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  // Active hover day or today
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points.find((p) => p.isToday) || points[0];

  return (
    <section aria-label="Mood Timeline Flow" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Mood Timeline
          </h2>
          <p className="text-[13px] font-sans text-[#B8BDD6]">
            A flowing emotional rhythm over seven days.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-sans px-3.5 py-1.5 rounded-full border border-[#7C5CFF]/30 bg-[#0B1228]/80 text-[#BFAEFF]">
          <Activity size={13} className="text-[#BFAEFF]" />
          <span>Smooth Rhythm</span>
        </div>
      </div>

      {/* Main Glass Chart Card */}
      <div className="sanctuary-glass p-6 sm:p-8 rounded-[28px] border border-[#7C5CFF]/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.08)]">
        {/* SVG Flowing Timeline */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[600px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-52 overflow-visible"
            >
              <defs>
                {/* Flowing Line Gradient */}
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7C5CFF" />
                  <stop offset="50%" stopColor="#4ADE80" />
                  <stop offset="100%" stopColor="#7C5CFF" />
                </linearGradient>

                {/* Ambient Area Gradient */}
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill under curve */}
              <path
                d={`${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`}
                fill="url(#areaGradient)"
              />

              {/* Self-drawing smooth bezier curve */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 1200,
                  strokeDashoffset: 0,
                  animation: "lightSweep 2s ease-out",
                  filter: "drop-shadow(0 0 10px rgba(124, 92, 255, 0.6))",
                }}
              />

              {/* 7 Glowing Dots */}
              {points.map((pt, i) => {
                const isHovered = hoveredIdx === i;
                const dotColor = pt.hasEntry ? "#4ADE80" : pt.isToday ? "#7C5CFF" : "#B8BDD6";

                return (
                  <g
                    key={pt.name}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Glowing Aura */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 14 : pt.hasEntry || pt.isToday ? 9 : 6}
                      fill={dotColor}
                      opacity={isHovered ? 0.35 : pt.hasEntry ? 0.25 : 0.15}
                      className="transition-all duration-300"
                    />

                    {/* Dot Center */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 7 : 5}
                      fill={dotColor}
                      stroke="#060814"
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                      style={{
                        filter: pt.hasEntry ? `drop-shadow(0 0 8px ${dotColor})` : "none",
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Day Labels Under Curve */}
            <div className="flex justify-between px-6 pt-2">
              {daysData.map((d, i) => (
                <div
                  key={d.name}
                  onClick={() => setHoveredIdx(i)}
                  className={`flex flex-col items-center cursor-pointer transition-colors duration-200 ${
                    d.isToday
                      ? "text-[#F8F7FF] font-bold"
                      : "text-[#B8BDD6] hover:text-[#F8F7FF]"
                  }`}
                >
                  <span className="text-[12px] font-sans uppercase tracking-wider">
                    {d.name}
                  </span>
                  <span className="text-[10px] font-sans mt-0.5 text-[#BFAEFF]">
                    {d.checkin?.mood || (d.isToday ? "Today" : "—")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Day Inspection Drawer */}
        {activePoint && (
          <div className="mt-5 p-4 rounded-[20px] border border-[#7C5CFF]/20 bg-[#0B1228]/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#F8F7FF]">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: activePoint.hasEntry ? "#4ADE80" : "#7C5CFF",
                  boxShadow: `0 0 8px ${activePoint.hasEntry ? "#4ADE80" : "#7C5CFF"}`,
                }}
              />
              <span className="font-hero-serif font-semibold text-base">
                {activePoint.name} ({activePoint.dateStr})
              </span>
            </div>

            <div className="text-[13px] font-sans text-[#B8BDD6]">
              {activePoint.checkin ? (
                <span>
                  Recorded presence:{" "}
                  <strong className="text-[#F8F7FF] capitalize">
                    {activePoint.checkin.mood}
                  </strong>{" "}
                  (Energy {activePoint.checkin.energy_level || 3}/5)
                </span>
              ) : (
                <span className="italic">
                  {activePoint.isPast ? "No check-in on this day" : "Scheduled sanctuary day"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
