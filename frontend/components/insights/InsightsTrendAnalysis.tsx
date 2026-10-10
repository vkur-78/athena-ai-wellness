"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Activity, Zap, ShieldAlert, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface InsightsTrendAnalysisProps {
  checkins: any[];
  dateRangeDays?: number;
  allDates?: string[];
  isLight?: boolean;
}

interface TrendPoint {
  dateStr: string;
  displayDate: string;
  hasCheckin: boolean;
  energy: number | null;
  stress: number | null;
  energyMA: number | null;
  stressMA: number | null;
  mood?: string;
  reflection?: string;
  x: number;
  energyY: number | null;
  stressY: number | null;
  energyMAY: number | null;
  stressMAY: number | null;
}

export default function InsightsTrendAnalysis({
  checkins,
  dateRangeDays = 30,
  allDates,
  isLight = false,
}: InsightsTrendAnalysisProps) {
  const { t } = useLanguage();
  const [activeSeries, setActiveSeries] = useState<"both" | "energy" | "stress">("both");
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  // SVG dimensions
  const svgWidth = 960;
  const svgHeight = 280;
  const padding = { top: 32, right: 36, bottom: 44, left: 52 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const checkinByDate = useMemo(() => {
    const map = new Map<string, any>();
    checkins.forEach((c) => {
      const ds = toLocalDateString(c.date || c.checkin_date || c.created_at);
      if (ds) map.set(ds, c);
    });
    return map;
  }, [checkins]);

  // Determine effective dates
  const effectiveDates = useMemo<string[]>(() => {
    if (allDates && allDates.length > 0) return allDates;
    if (checkins.length === 0) return [];
    const dateSet = new Set<string>();
    checkins.forEach((c) => {
      const ds = toLocalDateString(c.date || c.checkin_date || c.created_at);
      if (ds) dateSet.add(ds);
    });
    return Array.from(dateSet).sort();
  }, [allDates, checkins]);

  // Cautious, evidence-grounded interpretation of energy and stress trajectory
  const evidenceInterpretation = useMemo<string | null>(() => {
    const validEnergy = checkins
      .map((c) => (typeof c.energy === "number" ? c.energy : c.energy_level))
      .filter((v): v is number => typeof v === "number" && !isNaN(v));

    const validStress = checkins
      .map((c) => (typeof c.stress === "number" ? c.stress : c.stress_level))
      .filter((v): v is number => typeof v === "number" && !isNaN(v));

    if (validEnergy.length < 6) return null;

    const mid = Math.floor(validEnergy.length / 2);
    const firstHalfE = validEnergy.slice(0, mid);
    const secondHalfE = validEnergy.slice(mid);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = (arr: number[]) => {
      const m = avg(arr);
      return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
    };

    const var1 = variance(firstHalfE);
    const var2 = variance(secondHalfE);

    if (var2 < var1 * 0.75) {
      return "Energy appeared steadier during the latter half of this period.";
    }

    if (validStress.length >= 6) {
      const firstHalfS = validStress.slice(0, Math.floor(validStress.length / 2));
      const secondHalfS = validStress.slice(Math.floor(validStress.length / 2));
      if (avg(secondHalfS) < avg(firstHalfS) - 0.4) {
        return "Lower stress levels tended to appear more frequently in the latter half of this period.";
      }
    }

    if (avg(secondHalfE) > avg(firstHalfE) + 0.4) {
      return "Energy levels tended to be higher during the latter half of this period.";
    }

    return "Energy and stress patterns maintained a relatively consistent distribution across this period.";
  }, [checkins]);

  // Compute 7-day rolling moving average mathematically
  const points = useMemo<TrendPoint[]>(() => {
    if (!effectiveDates || effectiveDates.length === 0) return [];
    const totalDays = effectiveDates.length;
    const xStep = totalDays > 1 ? chartWidth / (totalDays - 1) : chartWidth / 2;

    const rawPoints: TrendPoint[] = effectiveDates.map((dateStr, idx) => {
      const checkin = checkinByDate.get(dateStr);
      const x = padding.left + (totalDays > 1 ? idx * xStep : chartWidth / 2);
      const dt = new Date(dateStr + "T00:00:00");
      const displayDate = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      if (!checkin) {
        return {
          dateStr,
          displayDate,
          hasCheckin: false,
          energy: null,
          stress: null,
          energyMA: null,
          stressMA: null,
          x,
          energyY: null,
          stressY: null,
          energyMAY: null,
          stressMAY: null,
        };
      }

      const eRaw = Number((checkin as any).energy ?? checkin.energy_level ?? 3);
      const sRaw = Number((checkin as any).stress ?? checkin.stress_level ?? 3);
      const energy = Math.max(1, Math.min(5, eRaw));
      const stress = Math.max(1, Math.min(5, sRaw));

      const energyY = padding.top + (5 - energy) * (chartHeight / 4);
      const stressY = padding.top + (5 - stress) * (chartHeight / 4);

      return {
        dateStr,
        displayDate,
        hasCheckin: true,
        energy,
        stress,
        energyMA: null,
        stressMA: null,
        mood: checkin.mood,
        reflection: checkin.reflection_text || checkin.ai_reflection || undefined,
        x,
        energyY,
        stressY,
        energyMAY: null,
        stressMAY: null,
      };
    });

    // Compute rolling 7-day window moving average
    const windowSize = 7;
    for (let i = 0; i < rawPoints.length; i++) {
      let eSum = 0;
      let sSum = 0;
      let count = 0;

      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        if (rawPoints[j].hasCheckin && rawPoints[j].energy !== null && rawPoints[j].stress !== null) {
          eSum += rawPoints[j].energy!;
          sSum += rawPoints[j].stress!;
          count++;
        }
      }

      if (count >= 2) {
        const eAvg = eSum / count;
        const sAvg = sSum / count;
        rawPoints[i].energyMA = Number(eAvg.toFixed(2));
        rawPoints[i].stressMA = Number(sAvg.toFixed(2));
        rawPoints[i].energyMAY = padding.top + (5 - eAvg) * (chartHeight / 4);
        rawPoints[i].stressMAY = padding.top + (5 - sAvg) * (chartHeight / 4);
      }
    }

    return rawPoints;
  }, [allDates, checkinByDate, chartWidth, chartHeight, padding.left, padding.top]);

  // Build SVG path strings
  function buildPath(coords: { x: number; y: number }[]): string {
    if (coords.length === 0) return "";
    if (coords.length === 1) return `M ${coords[0].x - 1} ${coords[0].y} L ${coords[0].x + 1} ${coords[0].y}`;
    let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 1; i < coords.length; i++) {
      path += ` L ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)}`;
    }
    return path;
  }

  const { energyPaths, stressPaths, energyMAPaths, stressMAPaths } = useMemo(() => {
    const ePaths: string[] = [];
    const sPaths: string[] = [];
    const eMAPaths: string[] = [];
    const sMAPaths: string[] = [];

    let curE: { x: number; y: number }[] = [];
    let curS: { x: number; y: number }[] = [];
    let curEMA: { x: number; y: number }[] = [];
    let curSMA: { x: number; y: number }[] = [];

    points.forEach((p) => {
      if (p.hasCheckin && p.energyY !== null) curE.push({ x: p.x, y: p.energyY });
      else if (curE.length > 0) { ePaths.push(buildPath(curE)); curE = []; }

      if (p.hasCheckin && p.stressY !== null) curS.push({ x: p.x, y: p.stressY });
      else if (curS.length > 0) { sPaths.push(buildPath(curS)); curS = []; }

      if (p.energyMAY !== null) curEMA.push({ x: p.x, y: p.energyMAY });
      else if (curEMA.length > 0) { eMAPaths.push(buildPath(curEMA)); curEMA = []; }

      if (p.stressMAY !== null) curSMA.push({ x: p.x, y: p.stressMAY });
      else if (curSMA.length > 0) { sMAPaths.push(buildPath(curSMA)); curSMA = []; }
    });

    if (curE.length > 0) ePaths.push(buildPath(curE));
    if (curS.length > 0) sPaths.push(buildPath(curS));
    if (curEMA.length > 0) eMAPaths.push(buildPath(curEMA));
    if (curSMA.length > 0) sMAPaths.push(buildPath(curSMA));

    return { energyPaths: ePaths, stressPaths: sPaths, energyMAPaths: eMAPaths, stressMAPaths: sMAPaths };
  }, [points]);

  const xAxisTicks = useMemo(() => {
    if (points.length === 0) return [];
    const maxLabels = 8;
    const step = Math.max(1, Math.floor(points.length / (maxLabels - 1)));
    const ticks: TrendPoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      ticks.push(points[i]);
    }
    if (ticks[ticks.length - 1].dateStr !== points[points.length - 1].dateStr) {
      ticks.push(points[points.length - 1]);
    }
    return ticks;
  }, [points]);

  const hasData = points.some((p) => p.hasCheckin);

  return (
    <div
      className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
          : "bg-[#0B1228]/80 border-white/10 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.6)] backdrop-blur-xl"
      }`}
    >
      {/* Header with Title and Interactive Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} className={isLight ? "text-amber-600" : "text-amber-400"} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Energy vs. Stress Trend Analysis
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
            Empirical ratings (1 to 5) with optional 7-day rolling trendline
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Moving Average Toggle */}
          <button
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`px-3 py-1 rounded-xl border text-xs font-medium transition-all ${
              showMovingAverage
                ? isLight
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : isLight
                ? "bg-stone-50 border-stone-200 text-stone-500"
                : "bg-white/5 border-white/10 text-stone-400"
            }`}
          >
            7-Day Rolling Trendline
          </button>

          {/* Series Toggle */}
          <div
            className={`inline-flex items-center p-0.5 rounded-xl border text-xs ${
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
              {t("chart_both", "Both")}
            </button>
            <button
              onClick={() => setActiveSeries("energy")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeSeries === "energy"
                  ? isLight
                    ? "bg-white text-amber-700 shadow-xs"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {t("chart_energy", "Energy")}
            </button>
            <button
              onClick={() => setActiveSeries("stress")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeSeries === "stress"
                  ? isLight
                    ? "bg-white text-purple-700 shadow-xs"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {t("chart_stress", "Stress")}
            </button>
          </div>
        </div>
      </div>

      {evidenceInterpretation && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 px-3.5 py-1.5 text-xs text-[#BFAEFF]">
          <Sparkles size={13} className="text-[#7C5CFF] shrink-0" />
          <span>{evidenceInterpretation}</span>
        </div>
      )}

      {!hasData ? (
        <div className="py-16 text-center text-xs opacity-60">
          No check-in ratings recorded for this window. Complete daily check-ins to unlock your longitudinal trends.
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none overflow-visible">
            {/* Grid Lines */}
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

            {/* Vertical hover line */}
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

            {/* Raw Energy Paths */}
            {(activeSeries === "both" || activeSeries === "energy") &&
              energyPaths.map((dStr, idx) => (
                <path
                  key={`energy-${idx}`}
                  d={dStr}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

            {/* Raw Stress Paths */}
            {(activeSeries === "both" || activeSeries === "stress") &&
              stressPaths.map((dStr, idx) => (
                <path
                  key={`stress-${idx}`}
                  d={dStr}
                  fill="none"
                  stroke="#A78BFA"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

            {/* 7-Day Moving Average Lines (Dashed) */}
            {showMovingAverage && (activeSeries === "both" || activeSeries === "energy") &&
              energyMAPaths.map((dStr, idx) => (
                <path
                  key={`energy-ma-${idx}`}
                  d={dStr}
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                  className="opacity-80"
                />
              ))}

            {showMovingAverage && (activeSeries === "both" || activeSeries === "stress") &&
              stressMAPaths.map((dStr, idx) => (
                <path
                  key={`stress-ma-${idx}`}
                  d={dStr}
                  fill="none"
                  stroke="#C084FC"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                  className="opacity-80"
                />
              ))}

            {/* Point circles */}
            {points.map((p) => {
              if (!p.hasCheckin) return null;
              const isPointHovered = hoveredPoint?.dateStr === p.dateStr;

              return (
                <g key={p.dateStr}>
                  {(activeSeries === "both" || activeSeries === "energy") && p.energyY !== null && (
                    <circle
                      cx={p.x}
                      cy={p.energyY}
                      r={isPointHovered ? 5.5 : 3}
                      fill={isLight ? "#FFFFFF" : "#0B1228"}
                      stroke="#F59E0B"
                      strokeWidth={isPointHovered ? 3 : 2}
                    />
                  )}
                  {(activeSeries === "both" || activeSeries === "stress") && p.stressY !== null && (
                    <circle
                      cx={p.x}
                      cy={p.stressY}
                      r={isPointHovered ? 5.5 : 3}
                      fill={isLight ? "#FFFFFF" : "#0B1228"}
                      stroke="#A78BFA"
                      strokeWidth={isPointHovered ? 3 : 2}
                    />
                  )}
                </g>
              );
            })}

            {/* Hitboxes for touch/hover */}
            {points.map((p) => {
              const xStep = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
              const hitWidth = Math.max(xStep, 16);
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

            {/* X-Axis Ticks */}
            {xAxisTicks.map((p) => (
              <text
                key={`tick-${p.dateStr}`}
                x={p.x}
                y={padding.top + chartHeight + 20}
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
                left: `${Math.min(Math.max(hoveredPoint.x, 70), svgWidth - 160)}px`,
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
                      {hoveredPoint.energy} / 5
                      {hoveredPoint.energyMA && (
                        <span className="text-[10px] opacity-60 ml-1">({hoveredPoint.energyMA} avg)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <ShieldAlert size={11} /> Stress
                    </span>
                    <span className="font-bold">
                      {hoveredPoint.stress} / 5
                      {hoveredPoint.stressMA && (
                        <span className="text-[10px] opacity-60 ml-1">({hoveredPoint.stressMA} avg)</span>
                      )}
                    </span>
                  </div>
                  {hoveredPoint.reflection && (
                    <div className="mt-1.5 pt-1.5 border-t border-inherit text-[10px] italic font-sans opacity-75 max-w-[200px] truncate">
                      &ldquo;{hoveredPoint.reflection}&rdquo;
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[11px] opacity-60">No check-in recorded</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend Footer */}
      <div
        className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? "border-stone-100 text-stone-500" : "border-white/5 text-[#B8BDD6]/60"
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Energy
          </span>
          <span className="flex items-center gap-1.5 text-purple-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Stress
          </span>
          {showMovingAverage && (
            <span className="flex items-center gap-1.5 text-indigo-400 text-[11px]">
              <span className="w-3 h-0.5 border-t border-dashed border-indigo-400" /> 7-Day Moving Avg
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono">Hover points to view ratings & check-in notes</span>
      </div>
    </div>
  );
}
