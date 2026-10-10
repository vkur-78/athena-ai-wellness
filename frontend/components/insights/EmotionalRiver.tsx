"use client";

import React, { useState, useMemo } from "react";
import { Waves, Sparkles, Clock, Compass, Activity } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TherapeuticAnalytics, EnergyRhythmPoint } from "@/types/insights";

interface EmotionalRiverProps {
  analytics: TherapeuticAnalytics | null;
  loading?: boolean;
}

interface RiverWaypoint {
  id: string;
  period: string;
  timeRange: string;
  x: number;
  y: number;
  thickness: number;
  intensity: "low" | "medium" | "high";
  intensityLabel: string;
  mood: string;
  moodEmoji: string;
  activity: string;
  narrative: string;
}

export default React.memo(function EmotionalRiver({
  analytics,
  loading,
}: EmotionalRiverProps) {
  const { isLight } = useTheme();

  // Find current client hour to highlight current moment along the river
  const currentHour = useMemo(() => new Date().getHours(), []);

  // Determine current active waypoint
  const defaultActiveIndex = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) return 0;
    if (currentHour >= 12 && currentHour < 17) return 1;
    if (currentHour >= 17 && currentHour < 21) return 2;
    return 3;
  }, [currentHour]);

  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(defaultActiveIndex);

  // River waypoints data mapping
  const waypoints: RiverWaypoint[] = useMemo(() => {
    const rawRhythm = analytics?.energy_rhythm || [];
    const getPeriodNarrative = (periodName: string, fallback: string) => {
      const found = rawRhythm.find((r) => r.period.toLowerCase() === periodName.toLowerCase());
      return found?.narrative || fallback;
    };

    return [
      {
        id: "dawn-morning",
        period: "Morning",
        timeRange: "6:00 AM – 11:59 AM",
        x: 90,
        y: 105,
        thickness: 20,
        intensity: "medium",
        intensityLabel: "Steady Baseline",
        mood: "Purposeful Focus",
        moodEmoji: "🌱",
        activity: "Morning Check-in & Water",
        narrative: getPeriodNarrative("morning", "Mornings open with calm focus before daily tasks accumulate."),
      },
      {
        id: "midday-sun",
        period: "Afternoon",
        timeRange: "12:00 PM – 4:59 PM",
        x: 265,
        y: 60,
        thickness: 34,
        intensity: "high",
        intensityLabel: "Highest Intensity",
        mood: "Active Engagement",
        moodEmoji: "⚡",
        activity: "Midday Walking Meditation",
        narrative: getPeriodNarrative("afternoon", "Afternoon transitions carry the heaviest cognitive load and emotional movement."),
      },
      {
        id: "golden-dusk",
        period: "Evening",
        timeRange: "5:00 PM – 9:59 PM",
        x: 445,
        y: 135,
        thickness: 22,
        intensity: "medium",
        intensityLabel: "Smooth Deceleration",
        mood: "Lighter & Settled",
        moodEmoji: "✨",
        activity: "Guided Breath in Sakura Garden",
        narrative: getPeriodNarrative("evening", "Evenings demonstrate consistent signs of deliberate emotional recovery and peace."),
      },
      {
        id: "starlit-night",
        period: "Night",
        timeRange: "10:00 PM – 5:59 AM",
        x: 615,
        y: 95,
        thickness: 14,
        intensity: "low",
        intensityLabel: "Restful Flow",
        mood: "Quiet Stillness",
        moodEmoji: "🌙",
        activity: "Space Journal & Sleep Haven",
        narrative: getPeriodNarrative("night", "Quiet hours settle into deep rest and restorative processing."),
      },
    ];
  }, [analytics]);

  const activeWaypoint = waypoints[activeNodeIndex];

  // Construct organic top and bottom river banks based on varying thickness
  // Upper bank: y - halfThickness
  // Lower bank: y + halfThickness
  const riverPaths = useMemo(() => {
    const w0 = waypoints[0];
    const w1 = waypoints[1];
    const w2 = waypoints[2];
    const w3 = waypoints[3];

    // Upper bank curve
    const topPath = `M 0,${105 - 10} ` +
      `C 40,${105 - 10} ${w0.x - 40},${w0.y - w0.thickness / 2} ${w0.x},${w0.y - w0.thickness / 2} ` +
      `C ${w0.x + 50},${w0.y - w0.thickness / 2} ${w1.x - 50},${w1.y - w1.thickness / 2} ${w1.x},${w1.y - w1.thickness / 2} ` +
      `C ${w1.x + 50},${w1.y - w1.thickness / 2} ${w2.x - 50},${w2.y - w2.thickness / 2} ${w2.x},${w2.y - w2.thickness / 2} ` +
      `C ${w2.x + 50},${w2.y - w2.thickness / 2} ${w3.x - 40},${w3.y - w3.thickness / 2} ${w3.x},${w3.y - w3.thickness / 2} ` +
      `C ${w3.x + 40},${w3.y - w3.thickness / 2} 670,${95 - 7} 700,${95 - 7}`;

    // Lower bank curve in reverse
    const bottomPath = `L 700,${95 + 7} ` +
      `C 670,${95 + 7} ${w3.x + 40},${w3.y + w3.thickness / 2} ${w3.x},${w3.y + w3.thickness / 2} ` +
      `C ${w3.x - 40},${w3.y + w3.thickness / 2} ${w2.x + 50},${w2.y + w2.thickness / 2} ${w2.x},${w2.y + w2.thickness / 2} ` +
      `C ${w2.x - 50},${w2.y + w2.thickness / 2} ${w1.x + 50},${w1.y + w1.thickness / 2} ${w1.x},${w1.y + w1.thickness / 2} ` +
      `C ${w1.x - 50},${w1.y + w1.thickness / 2} ${w0.x + 50},${w0.y + w0.thickness / 2} ${w0.x},${w0.y + w0.thickness / 2} ` +
      `C ${w0.x - 40},${w0.y + w0.thickness / 2} 40,${105 + 10} 0,${105 + 10} Z`;

    const fullRiverPolygon = `${topPath} ${bottomPath}`;

    // Center spine wave path for the flowing animated current
    const spinePath = `M 0,105 ` +
      `C 40,105 ${w0.x - 40},${w0.y} ${w0.x},${w0.y} ` +
      `C ${w0.x + 50},${w0.y} ${w1.x - 50},${w1.y} ${w1.x},${w1.y} ` +
      `C ${w1.x + 50},${w1.y} ${w2.x - 50},${w2.y} ${w2.x},${w2.y} ` +
      `C ${w2.x + 50},${w2.y} ${w3.x - 40},${w3.y} ${w3.x},${w3.y} ` +
      `C ${w3.x + 40},${w3.y} 670,95 700,95`;

    return { fullRiverPolygon, spinePath };
  }, [waypoints]);

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fcfaf7]/90 to-[#f6f2ea]/90 border-stone-200/80 shadow-xs"
          : "bg-gradient-to-br from-[#1b1c24]/95 via-[#16171e]/90 to-[#13131a]/90 border-[#2b2d39] shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-sky-50 border-sky-200 text-sky-700"
                : "bg-sky-950/40 border-sky-800/40 text-sky-300"
            }`}
          >
            <Waves size={16} />
          </div>
          <div>
            <h2
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              The Emotional River
            </h2>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Thicker sections mark intensity • Calmer stretches reflect recovery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif border ${
              isLight
                ? "bg-sky-50/80 border-sky-200 text-sky-800"
                : "bg-sky-950/40 border-sky-800/40 text-sky-300"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>Flowing live</span>
          </span>
        </div>
      </div>

      {/* Signature Animated SVG River Ribbon */}
      <div className="relative pt-6 pb-2 select-none">
        <svg
          viewBox="0 0 700 200"
          className="w-full h-44 sm:h-52 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Smooth river gradient fill */}
            <linearGradient id="riverFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={isLight ? 0.35 : 0.4} />
              <stop offset="35%" stopColor="#818cf8" stopOpacity={isLight ? 0.55 : 0.65} />
              <stop offset="70%" stopColor="#34d399" stopOpacity={isLight ? 0.4 : 0.45} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={isLight ? 0.3 : 0.35} />
            </linearGradient>

            <linearGradient id="riverSpineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#6366f1" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>

            {/* Ambient River Glow Filter */}
            <filter id="riverGlow" x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Organic River Body Ribbon */}
          <path
            d={riverPaths.fullRiverPolygon}
            fill="url(#riverFlowGradient)"
            filter="url(#riverGlow)"
            className="transition-all duration-500"
          />

          {/* 2. Animated Flowing Wave Spine Current */}
          <path
            d={riverPaths.spinePath}
            fill="none"
            stroke="url(#riverSpineGradient)"
            strokeWidth="2.5"
            className="animate-river-flow opacity-80"
          />

          {/* 3. Interactive Waypoint Stepping Stones */}
          {waypoints.map((wp, idx) => {
            const isSelected = idx === activeNodeIndex;
            const isCurrentMoment = idx === defaultActiveIndex;

            return (
              <g
                key={wp.id}
                className="cursor-pointer group"
                onClick={() => setActiveNodeIndex(idx)}
                onMouseEnter={() => setActiveNodeIndex(idx)}
              >
                {/* Outer halo aura for active or current moment */}
                {(isSelected || isCurrentMoment) && (
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={isSelected ? 18 : 14}
                    className={`${
                      isSelected
                        ? "fill-amber-400/25 dark:fill-amber-400/20"
                        : "fill-sky-400/20 dark:fill-sky-400/15"
                    } animate-ping`}
                    style={{ animationDuration: "3s" }}
                  />
                )}

                {/* Stepping stone circle */}
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isSelected ? 9 : 7}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? isLight
                        ? "fill-stone-900 stroke-amber-300 stroke-2"
                        : "fill-white stroke-amber-400 stroke-2"
                      : isLight
                      ? "fill-white stroke-sky-500 stroke-2 group-hover:stroke-sky-700"
                      : "fill-[#1d1e26] stroke-sky-400 stroke-2 group-hover:stroke-sky-300"
                  }`}
                />

                {/* Period Label */}
                <text
                  x={wp.x}
                  y={wp.y > 100 ? wp.y + 24 : wp.y - 16}
                  textAnchor="middle"
                  className={`text-[11px] font-serif transition-colors ${
                    isSelected
                      ? "font-semibold fill-amber-600 dark:fill-amber-300"
                      : isLight
                      ? "fill-stone-600"
                      : "fill-zinc-400"
                  }`}
                >
                  {wp.period}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Active River Node Detail Floating Glass Capsule */}
        {activeWaypoint && (
          <div
            className={`mt-4 rounded-[20px] border p-4 transition-all duration-200 ${
              isLight
                ? "bg-white/90 border-stone-200 shadow-xs"
                : "bg-[#20222a]/90 border-[#323544] shadow-xs"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-inherit">
              <div className="flex items-center gap-2">
                <span className="text-base">{activeWaypoint.moodEmoji}</span>
                <span
                  className={`text-xs sm:text-sm font-serif font-semibold ${
                    isLight ? "text-stone-900" : "text-zinc-100"
                  }`}
                >
                  {activeWaypoint.period} ({activeWaypoint.timeRange})
                </span>
                <span className="text-xs opacity-40">•</span>
                <span
                  className={`text-xs font-serif font-medium ${
                    activeWaypoint.intensity === "high"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {activeWaypoint.intensityLabel}
                </span>
              </div>

              <span
                className={`text-[11px] font-serif ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {activeWaypoint.activity}
              </span>
            </div>

            <p
              className={`text-xs font-serif mt-2 leading-relaxed ${
                isLight ? "text-stone-600" : "text-zinc-300"
              }`}
            >
              {activeWaypoint.narrative}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
