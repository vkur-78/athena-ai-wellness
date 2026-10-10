"use client";

import React, { useMemo } from "react";
import { Sun, CloudSun, Sunset, Moon, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface EmotionalWeatherCardProps {
  currentPeriod?: string;
}

export default React.memo(function EmotionalWeatherCard({
  currentPeriod,
}: EmotionalWeatherCardProps) {
  const { isLight } = useTheme();

  const periods = [
    { label: "Morning", state: "Calm", icon: Sun, color: "text-amber-500", glow: "rgba(245, 158, 11, 0.5)", x: 40, y: 70 },
    { label: "Afternoon", state: "Focused", icon: CloudSun, color: "text-sky-500", glow: "rgba(56, 189, 248, 0.5)", x: 120, y: 45 },
    { label: "Evening", state: "Peaceful", icon: Sunset, color: "text-rose-400", glow: "rgba(244, 114, 182, 0.5)", x: 200, y: 35 },
    { label: "Night", state: "Restful", icon: Moon, color: "text-indigo-400", glow: "rgba(129, 140, 248, 0.5)", x: 280, y: 65 },
  ];

  const currentHour = new Date().getHours();
  const currentIdx =
    currentHour < 12 ? 0 : currentHour < 17 ? 1 : currentHour < 21 ? 2 : 3;

  return (
    <div
      role="region"
      aria-label="Emotional Weather Preview"
      className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 transition-all duration-200 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-sm"
          : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-md"
      }`}
    >
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="text-sm font-serif font-semibold tracking-tight">Emotional Weather</h3>
          <p className="text-[11px] opacity-60">Gentle preview of daily emotional cadence</p>
        </div>
        <span className="text-[11px] font-serif opacity-70 px-2 py-0.5 rounded-full border border-inherit">
          {periods[currentIdx].label} {periods[currentIdx].state}
        </span>
      </div>

      {/* Smooth Flowing SVG Curve */}
      <div className="relative pt-4 pb-2">
        <svg
          viewBox="0 0 320 100"
          className="w-full h-24 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="weatherGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="weatherArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill under curve */}
          <path
            d="M 40 70 C 80 50, 100 45, 120 45 C 160 45, 180 35, 200 35 C 240 35, 260 65, 280 65 L 280 100 L 40 100 Z"
            fill="url(#weatherArea)"
          />

          {/* Flowing curve line */}
          <path
            d="M 40 70 C 80 50, 100 45, 120 45 C 160 45, 180 35, 200 35 C 240 35, 260 65, 280 65"
            fill="none"
            stroke="url(#weatherGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Sun / Moon Markers along the curve */}
          {periods.map((p, idx) => {
            const isCurrent = idx === currentIdx;
            return (
              <g key={p.label}>
                {isCurrent && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill={p.glow}
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isCurrent ? "5" : "3.5"}
                  fill={isLight ? "#ffffff" : "#1a1b22"}
                  stroke={isLight ? "#292524" : "#ffffff"}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Labels under the curve */}
        <div className="grid grid-cols-4 gap-1 text-center pt-1 font-serif">
          {periods.map((p, idx) => {
            const isCurrent = idx === currentIdx;
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className={`flex flex-col items-center gap-0.5 transition-opacity ${
                  isCurrent ? "opacity-100 font-semibold" : "opacity-60"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon size={11} className={p.color} />
                  <span className="text-[11px]">{p.label}</span>
                </div>
                <span className="text-[10px] opacity-75">{p.state}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
