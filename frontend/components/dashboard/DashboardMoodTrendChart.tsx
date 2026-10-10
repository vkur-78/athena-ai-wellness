"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Heart, Activity, Zap, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardMoodTrendChartProps {
  checkins: CheckinResponse[];
  dateRangeDays: number;
  allDates: string[]; // Ordered list of YYYY-MM-DD in the active range
  isLight?: boolean;
  onOpenCheckinModal?: () => void;
}

interface TrendDataPoint {
  dateStr: string;
  displayDate: string;
  hasCheckin: boolean;
  energyLevel: number | null; // 1-5
  stressLevel: number | null; // 1-5
  mood?: string;
  reflection?: string;
  checkinCount?: number;
  isAggregated?: boolean;
  x: number;
  energyY: number | null;
  stressY: number | null;
}

export default function DashboardMoodTrendChart({
  checkins,
  dateRangeDays,
  allDates,
  isLight = false,
  onOpenCheckinModal,
}: DashboardMoodTrendChartProps) {
  const { t } = useLanguage();
  const [activeSeries, setActiveSeries] = useState<"both" | "energy" | "stress">("both");
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 240;
  const padding = { top: 28, right: 32, bottom: 40, left: 48 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Map check-ins by local date YYYY-MM-DD
  const checkinByDate = useMemo(() => {
    const map = new Map<string, CheckinResponse>();
    checkins.forEach((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      if (ds) map.set(ds, c);
    });
    return map;
  }, [checkins]);

  // Compute trend points with smart aggregation for long ranges
  // 7D, 30D -> daily
  // 90D, 180D (6M) -> weekly
  // 365D (1Y) -> monthly
  const points = useMemo<TrendDataPoint[]>(() => {
    if (!allDates || allDates.length === 0) return [];

    // Monthly aggregation for 1Y
    if (dateRangeDays >= 365) {
      const monthMap = new Map<string, string[]>();
      allDates.forEach((d) => {
        const monthKey = d.slice(0, 7);
        const existing = monthMap.get(monthKey) || [];
        existing.push(d);
        monthMap.set(monthKey, existing);
      });

      const monthBins = Array.from(monthMap.entries());
      const totalBins = monthBins.length;
      const xStep = totalBins > 1 ? chartWidth / (totalBins - 1) : chartWidth / 2;

      return monthBins.map(([mKey, dates], idx) => {
        const x = padding.left + (totalBins > 1 ? idx * xStep : chartWidth / 2);
        const [yearStr, monthStr] = mKey.split("-");
        const monthDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
        const displayDate = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

        const binCheckins = dates
          .map((d) => checkinByDate.get(d))
          .filter((c): c is CheckinResponse => Boolean(c));

        if (binCheckins.length === 0) {
          return {
            dateStr: dates[0],
            displayDate,
            hasCheckin: false,
            energyLevel: null,
            stressLevel: null,
            checkinCount: 0,
            isAggregated: true,
            x,
            energyY: null,
            stressY: null,
          };
        }

        const totalE = binCheckins.reduce(
          (sum, c) => sum + Number((c as any).energy ?? c.energy_level ?? 3),
          0
        );
        const totalS = binCheckins.reduce(
          (sum, c) => sum + Number((c as any).stress ?? c.stress_level ?? 3),
          0
        );
        const avgE = Math.round((totalE / binCheckins.length) * 10) / 10;
        const avgS = Math.round((totalS / binCheckins.length) * 10) / 10;
        const energyLevel = Math.max(1, Math.min(5, avgE));
        const stressLevel = Math.max(1, Math.min(5, avgS));

        const energyY = padding.top + (5 - energyLevel) * (chartHeight / 4);
        const stressY = padding.top + (5 - stressLevel) * (chartHeight / 4);

        return {
          dateStr: dates[0],
          displayDate,
          hasCheckin: true,
          energyLevel,
          stressLevel,
          checkinCount: binCheckins.length,
          isAggregated: true,
          x,
          energyY,
          stressY,
        };
      });
    }

    // Weekly aggregation for 90D or 180D (6M)
    if (dateRangeDays >= 90) {
      const chunkSize = 7;
      const weeklyBins: { dates: string[]; label: string }[] = [];
      for (let i = 0; i < allDates.length; i += chunkSize) {
        const chunk = allDates.slice(i, i + chunkSize);
        const startD = new Date(chunk[0] + "T00:00:00");
        const endD = new Date(chunk[chunk.length - 1] + "T00:00:00");
        const label = `${startD.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endD.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        weeklyBins.push({ dates: chunk, label });
      }

      const totalBins = weeklyBins.length;
      const xStep = totalBins > 1 ? chartWidth / (totalBins - 1) : chartWidth / 2;

      return weeklyBins.map((bin, idx) => {
        const x = padding.left + (totalBins > 1 ? idx * xStep : chartWidth / 2);
        const binCheckins = bin.dates
          .map((d) => checkinByDate.get(d))
          .filter((c): c is CheckinResponse => Boolean(c));

        if (binCheckins.length === 0) {
          return {
            dateStr: bin.dates[0],
            displayDate: bin.label,
            hasCheckin: false,
            energyLevel: null,
            stressLevel: null,
            checkinCount: 0,
            isAggregated: true,
            x,
            energyY: null,
            stressY: null,
          };
        }

        const totalE = binCheckins.reduce(
          (sum, c) => sum + Number((c as any).energy ?? c.energy_level ?? 3),
          0
        );
        const totalS = binCheckins.reduce(
          (sum, c) => sum + Number((c as any).stress ?? c.stress_level ?? 3),
          0
        );
        const avgE = Math.round((totalE / binCheckins.length) * 10) / 10;
        const avgS = Math.round((totalS / binCheckins.length) * 10) / 10;
        const energyLevel = Math.max(1, Math.min(5, avgE));
        const stressLevel = Math.max(1, Math.min(5, avgS));

        const energyY = padding.top + (5 - energyLevel) * (chartHeight / 4);
        const stressY = padding.top + (5 - stressLevel) * (chartHeight / 4);

        return {
          dateStr: bin.dates[0],
          displayDate: bin.label,
          hasCheckin: true,
          energyLevel,
          stressLevel,
          checkinCount: binCheckins.length,
          isAggregated: true,
          x,
          energyY,
          stressY,
        };
      });
    }

    // Daily for 7D and 30D
    const totalDays = allDates.length;
    const xStep = totalDays > 1 ? chartWidth / (totalDays - 1) : chartWidth / 2;

    return allDates.map((dateStr, idx) => {
      const checkin = checkinByDate.get(dateStr);
      const x = padding.left + (totalDays > 1 ? idx * xStep : chartWidth / 2);

      const d = new Date(dateStr + "T00:00:00");
      const displayDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!checkin) {
        return {
          dateStr,
          displayDate,
          hasCheckin: false,
          energyLevel: null,
          stressLevel: null,
          x,
          energyY: null,
          stressY: null,
        };
      }

      const eRaw = Number((checkin as any).energy ?? checkin.energy_level ?? 3);
      const sRaw = Number((checkin as any).stress ?? checkin.stress_level ?? 3);
      const energyLevel = Math.max(1, Math.min(5, eRaw));
      const stressLevel = Math.max(1, Math.min(5, sRaw));

      // Invert Y: 5 at top, 1 at bottom
      const energyY = padding.top + (5 - energyLevel) * (chartHeight / 4);
      const stressY = padding.top + (5 - stressLevel) * (chartHeight / 4);

      return {
        dateStr,
        displayDate,
        hasCheckin: true,
        energyLevel,
        stressLevel,
        mood: checkin.mood,
        reflection: checkin.reflection_text || checkin.ai_reflection || undefined,
        x,
        energyY,
        stressY,
      };
    });
  }, [allDates, checkinByDate, dateRangeDays, chartWidth, chartHeight, padding.left, padding.top]);

  // Build SVG path segments (missing days remain gaps, never fake interpolated)
  const { energySegments, stressSegments } = useMemo(() => {
    const eSegs: string[] = [];
    const sSegs: string[] = [];
    let currentESeg: { x: number; y: number }[] = [];
    let currentSSeg: { x: number; y: number }[] = [];

    points.forEach((p) => {
      if (p.hasCheckin && p.energyY !== null) {
        currentESeg.push({ x: p.x, y: p.energyY });
      } else {
        if (currentESeg.length > 0) {
          eSegs.push(buildPathString(currentESeg));
          currentESeg = [];
        }
      }

      if (p.hasCheckin && p.stressY !== null) {
        currentSSeg.push({ x: p.x, y: p.stressY });
      } else {
        if (currentSSeg.length > 0) {
          sSegs.push(buildPathString(currentSSeg));
          currentSSeg = [];
        }
      }
    });

    if (currentESeg.length > 0) eSegs.push(buildPathString(currentESeg));
    if (currentSSeg.length > 0) sSegs.push(buildPathString(currentSSeg));

    return { energySegments: eSegs, stressSegments: sSegs };
  }, [points]);

  function buildPathString(coords: { x: number; y: number }[]): string {
    if (coords.length === 0) return "";
    if (coords.length === 1) {
      return `M ${coords[0].x - 1} ${coords[0].y} L ${coords[0].x + 1} ${coords[0].y}`;
    }
    let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 1; i < coords.length; i++) {
      path += ` L ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)}`;
    }
    return path;
  }

  // Determine x-axis ticks to display without overlapping
  const xAxisTicks = useMemo(() => {
    if (points.length === 0) return [];
    const maxLabels = 7;
    const step = Math.max(1, Math.floor(points.length / (maxLabels - 1)));
    const ticks: TrendDataPoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      ticks.push(points[i]);
    }
    if (ticks[ticks.length - 1].dateStr !== points[points.length - 1].dateStr) {
      ticks.push(points[points.length - 1]);
    }
    return ticks;
  }, [points]);

  const hasAnyData = points.some((p) => p.hasCheckin);

  return (
    <section
      aria-label="Energy and Stress Trend"
      className={`relative p-5 sm:p-7 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
      }`}
    >
      {/* Header with Title and Series Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} className={isLight ? "text-amber-600" : "text-amber-400"} />
            <h2
              className={`text-sm font-semibold uppercase tracking-wider ${
                isLight ? "text-stone-900" : "text-[#F8F7FF]"
              }`}
            >
              ENERGY & STRESS
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            How your reported energy and stress have moved over time.
          </p>
        </div>

        {/* Series Filter Controls */}
        <div
          className={`inline-flex items-center p-0.5 rounded-xl border text-xs self-start sm:self-auto ${
            isLight
              ? "bg-[#FAF7F2] border-stone-200 text-stone-600"
              : "bg-white/5 border-white/10 text-stone-300"
          }`}
        >
          <button
            onClick={() => setActiveSeries("both")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeSeries === "both"
                ? isLight
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setActiveSeries("energy")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              activeSeries === "energy"
                ? isLight
                  ? "bg-white text-amber-700 shadow-xs"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Energy
          </button>
          <button
            onClick={() => setActiveSeries("stress")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              activeSeries === "stress"
                ? isLight
                  ? "bg-white text-purple-700 shadow-xs"
                  : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Stress
          </button>
        </div>
      </div>

      {/* Empty State Guard */}
      {!hasAnyData ? (
        <div className="py-16 text-center space-y-3">
          <p className={`text-xs sm:text-sm ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
            No check-in ratings recorded for this window. Check in to begin plotting your energy and stress curves.
          </p>
          {onOpenCheckinModal && (
            <button
              onClick={onOpenCheckinModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Complete Today&apos;s Check-in
            </button>
          )}
        </div>
      ) : (
        /* The SVG Interactive Chart */
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines (Scores 5 down to 1) */}
            {[5, 4, 3, 2, 1].map((val) => {
              const y = padding.top + (5 - val) * (chartHeight / 4);
              return (
                <g key={val} className="opacity-50">
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke={isLight ? "#E5E7EB" : "rgba(255,255,255,0.07)"}
                    strokeDasharray={val === 3 ? "none" : "3 3"}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    className={`text-[10px] font-mono select-none ${
                      isLight ? "fill-stone-400" : "fill-stone-500"
                    }`}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Vertical Day Grid Guides on hover */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + chartHeight}
                stroke={isLight ? "#6366F1" : "#818CF8"}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                className="opacity-70"
              />
            )}

            {/* Energy Path Segments */}
            {(activeSeries === "both" || activeSeries === "energy") &&
              energySegments.map((dStr, idx) => (
                <path
                  key={`energy-${idx}`}
                  d={dStr}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              ))}

            {/* Stress Path Segments */}
            {(activeSeries === "both" || activeSeries === "stress") &&
              stressSegments.map((dStr, idx) => (
                <path
                  key={`stress-${idx}`}
                  d={dStr}
                  fill="none"
                  stroke="#A78BFA"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              ))}

            {/* Render Points on the curves */}
            {points.map((p) => {
              if (!p.hasCheckin) return null;
              const isPointHovered = hoveredPoint?.dateStr === p.dateStr;

              return (
                <g key={p.dateStr}>
                  {/* Energy dot */}
                  {(activeSeries === "both" || activeSeries === "energy") && p.energyY !== null && (
                    <circle
                      cx={p.x}
                      cy={p.energyY}
                      r={isPointHovered ? 5.5 : 3.5}
                      fill={isLight ? "#FFFFFF" : "#0B1228"}
                      stroke="#F59E0B"
                      strokeWidth={isPointHovered ? 3 : 2}
                      className="transition-transform duration-150"
                    />
                  )}

                  {/* Stress dot */}
                  {(activeSeries === "both" || activeSeries === "stress") && p.stressY !== null && (
                    <circle
                      cx={p.x}
                      cy={p.stressY}
                      r={isPointHovered ? 5.5 : 3.5}
                      fill={isLight ? "#FFFFFF" : "#0B1228"}
                      stroke="#A78BFA"
                      strokeWidth={isPointHovered ? 3 : 2}
                      className="transition-transform duration-150"
                    />
                  )}
                </g>
              );
            })}

            {/* Transparent touch/hover hit-boxes across the width */}
            {points.map((p, idx) => {
              const xStep = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
              const hitWidth = Math.max(xStep, 18);
              return (
                <rect
                  key={`hit-${p.dateStr}`}
                  x={p.x - hitWidth / 2}
                  y={padding.top}
                  width={hitWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onClick={() => setHoveredPoint(p)}
                />
              );
            })}

            {/* X-Axis Date Labels */}
            {xAxisTicks.map((p) => (
              <text
                key={`tick-${p.dateStr}`}
                x={p.x}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className={`text-[10px] font-mono ${
                  isLight ? "fill-stone-500" : "fill-[#B8BDD6]/60"
                }`}
              >
                {p.displayDate}
              </text>
            ))}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredPoint && (
            <div
              className={`absolute z-30 p-3 rounded-2xl border text-xs shadow-xl pointer-events-none transition-all ${
                isLight
                  ? "bg-white text-stone-900 border-indigo-200 shadow-indigo-100"
                  : "bg-[#0E152E] text-white border-indigo-500/40 shadow-black/90"
              }`}
              style={{
                left: `${Math.min(Math.max(hoveredPoint.x, 70), svgWidth - 140)}px`,
                top: "10px",
              }}
            >
              <div className="font-semibold text-xs mb-1.5 pb-1 border-b border-inherit flex items-center justify-between gap-3">
                <span>{hoveredPoint.displayDate}</span>
                {hoveredPoint.mood && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    {hoveredPoint.mood}
                  </span>
                )}
              </div>

              {hoveredPoint.hasCheckin ? (
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Zap size={11} /> Energy
                    </span>
                    <span className="font-bold">
                      {hoveredPoint.energyLevel} / 5
                      {hoveredPoint.isAggregated && <span className="text-[9px] font-normal opacity-70 ml-1">avg</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <ShieldAlert size={11} /> Stress
                    </span>
                    <span className="font-bold">
                      {hoveredPoint.stressLevel} / 5
                      {hoveredPoint.isAggregated && <span className="text-[9px] font-normal opacity-70 ml-1">avg</span>}
                    </span>
                  </div>
                  {hoveredPoint.checkinCount !== undefined && (
                    <div className="pt-1 mt-1 border-t border-inherit text-[10px] text-stone-400">
                      {hoveredPoint.checkinCount} {hoveredPoint.checkinCount === 1 ? "check-in" : "check-ins"}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[11px] opacity-60">
                  {hoveredPoint.isAggregated ? "No check-ins in this period" : "No check-in on this day"}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chart Legend Footer */}
      <div
        className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/60"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-medium text-amber-500">Energy (1-5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="font-medium text-purple-400">Stress (1-5)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono">
          Hover or tap any date to inspect ratings
        </div>
      </div>
    </section>
  );
}
