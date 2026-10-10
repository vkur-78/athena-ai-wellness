"use client";

import React, { useState } from "react";
import { Activity, Sun, Moon, Sparkles, Clock, Info } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TherapeuticAnalytics, EnergyRhythmPoint } from "@/types/insights";

interface EmotionalRhythmCurveProps {
  analytics: TherapeuticAnalytics | null;
  loading?: boolean;
}

export default function EmotionalRhythmCurve({ analytics, loading }: EmotionalRhythmCurveProps) {
  const { isLight } = useTheme();
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  if (loading || !analytics) {
    return (
      <div
        className={`rounded-3xl border p-6 sm:p-8 animate-pulse ${
          isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
        }`}
      >
        <div className="h-4 w-40 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-4" />
        <div className="h-48 w-full bg-stone-200/30 dark:bg-zinc-800/30 rounded-2xl" />
      </div>
    );
  }

  const nodes: EnergyRhythmPoint[] = analytics.energy_rhythm || [
    { period: "Morning", level: "Steady", narrative: "Mornings open with purposeful focus before daily demands pick up." },
    { period: "Afternoon", level: "Heavier", narrative: "Afternoon transitions typically present the highest mental load." },
    { period: "Evening", level: "Lighter", narrative: "Evenings show clear signs of intentional deceleration and recovery." },
    { period: "Night", level: "Steady", narrative: "Quiet hours settle into restful reflection." },
  ];

  // Map 4 nodes into 24-hour curved coordinates
  // Width: 600, Height: 200
  // Morning: x=75, Midday/Afternoon: x=225, Evening: x=375, Night: x=525
  const points = [
    { ...nodes[0], x: 75, y: 110, time: "6:00 AM – 11:59 AM" },
    { ...nodes[1], x: 225, y: 65, time: "12:00 PM – 4:59 PM" },
    { ...nodes[2], x: 375, y: 135, time: "5:00 PM – 9:59 PM" },
    { ...nodes[3], x: 525, y: 120, time: "10:00 PM – 5:59 AM" },
  ];

  // Smooth SVG cubic bezier path
  const pathD = `M 0,110 C 40,110 ${points[0].x - 35},${points[0].y} ${points[0].x},${points[0].y} ` +
    `C ${points[0].x + 45},${points[0].y} ${points[1].x - 45},${points[1].y} ${points[1].x},${points[1].y} ` +
    `C ${points[1].x + 45},${points[1].y} ${points[2].x - 45},${points[2].y} ${points[2].x},${points[2].y} ` +
    `C ${points[2].x + 45},${points[2].y} ${points[3].x - 45},${points[3].y} ${points[3].x},${points[3].y} ` +
    `C ${points[3].x + 35},${points[3].y} 570,120 600,120`;

  const fillD = `${pathD} L 600,200 L 0,200 Z`;

  const activeNode = selectedNodeIndex !== null ? points[selectedNodeIndex] : points[2]; // Default to evening

  return (
    <section aria-labelledby="emotional-rhythm-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-violet-500" />
          <h2
            id="emotional-rhythm-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Emotional Rhythm
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          24-Hour living curve • Hover nodes
        </span>
      </div>

      <div
        className={`rounded-3xl border p-5 sm:p-7 transition-all duration-250 ${
          isLight
            ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
            : "bg-[#181920] border-[#272834] shadow-xs"
        }`}
      >
        {/* Living SVG Curve */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox="0 0 600 200"
            className="w-full h-44 sm:h-52 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="rhythmGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#d97706" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="rhythmGradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#c084fc" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="35%" stopColor="#ec4899" />
                <stop offset="70%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {/* Baseline guideline */}
            <line
              x1="0"
              y1="160"
              x2="600"
              y2="160"
              stroke={isLight ? "#e5e5e5" : "#2a2b38"}
              strokeDasharray="4 4"
              strokeWidth="1"
            />

            {/* Gradient Area Fill */}
            <path
              d={fillD}
              fill={isLight ? "url(#rhythmGradientLight)" : "url(#rhythmGradientDark)"}
            />

            {/* Smooth Animated Curve */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#strokeGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* 4 Key Anchor Nodes */}
            {points.map((pt, idx) => {
              const isSelected = selectedNodeIndex === idx;
              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-transform duration-200 group"
                  onClick={() => setSelectedNodeIndex(idx)}
                  onMouseEnter={() => setSelectedNodeIndex(idx)}
                >
                  {/* Outer aura on select */}
                  {isSelected && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill={isLight ? "#8b5cf6" : "#a78bfa"}
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "7" : "5"}
                    fill={isLight ? "#ffffff" : "#181920"}
                    stroke={isSelected ? "#8b5cf6" : (isLight ? "#78716c" : "#a1a1aa")}
                    strokeWidth={isSelected ? "3" : "2"}
                    className="transition-all duration-200"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    className={`text-[10px] font-serif select-none ${
                      isSelected
                        ? (isLight ? "fill-stone-900 font-bold" : "fill-white font-bold")
                        : (isLight ? "fill-stone-500 font-medium" : "fill-zinc-400 font-medium")
                    }`}
                  >
                    {pt.period}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Dynamic Context Panel for Active Node */}
        {activeNode && (
          <div
            className={`mt-4 p-4 rounded-2xl border transition-all duration-200 ${
              isLight
                ? "bg-white/80 border-stone-200/80 shadow-xs"
                : "bg-[#20222b]/80 border-[#2e313f] shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-semibold text-violet-600 dark:text-violet-300">
                  {activeNode.period} Rhythm
                </span>
                <span
                  className={`text-[11px] font-serif px-2 py-0.5 rounded-full border ${
                    activeNode.level === "Lighter"
                      ? (isLight ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300")
                      : activeNode.level === "Heavier"
                      ? (isLight ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-amber-950/40 border-amber-800/40 text-amber-300")
                      : (isLight ? "bg-stone-100 border-stone-200 text-stone-700" : "bg-zinc-800 border-zinc-700 text-zinc-300")
                  }`}
                >
                  {activeNode.level} energy
                </span>
              </div>
              <span
                className={`text-[11px] font-serif ${
                  isLight ? "text-stone-400" : "text-zinc-500"
                }`}
              >
                {activeNode.time}
              </span>
            </div>

            <p
              className={`text-xs sm:text-sm font-serif leading-relaxed ${
                isLight ? "text-stone-600" : "text-zinc-300"
              }`}
            >
              {activeNode.narrative}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
