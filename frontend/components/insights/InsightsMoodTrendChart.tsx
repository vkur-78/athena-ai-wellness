"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { TrendingUp, Smile } from "lucide-react";
import { toLocalDateString } from "@/lib/dashboardMetrics";

interface InsightsMoodTrendChartProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
}

interface DataPoint {
  dateStr: string;
  displayDate: string;
  mood: string;
  moodLevel: number; // 1 to 5
  color: string;
  checkin: CheckinResponse;
  journalCount: number;
  practiceCount: number;
}

const MOOD_LEVELS: Record<string, { level: number; color: string; label: string }> = {
  great: { level: 5, color: "#A78BFA", label: "Great" },
  good: { level: 4, color: "#60A5FA", label: "Good" },
  okay: { level: 3, color: "#94A3B8", label: "Okay" },
  low: { level: 2, color: "#F59E0B", label: "Low" },
  difficult: { level: 1, color: "#F43F5E", label: "Very Difficult" },
};

function parseMoodLevel(moodStr?: string | null): { level: number; color: string; label: string } {
  if (!moodStr) return { level: 3, color: "#94A3B8", label: "Okay" };
  const lower = moodStr.toLowerCase();
  if (lower.includes("great") || lower.includes("joy") || lower.includes("flow")) return MOOD_LEVELS.great;
  if (lower.includes("good") || lower.includes("calm") || lower.includes("peace")) return MOOD_LEVELS.good;
  if (lower.includes("low") || lower.includes("tired") || lower.includes("drained")) return MOOD_LEVELS.low;
  if (lower.includes("difficult") || lower.includes("stress") || lower.includes("anx") || lower.includes("heavy")) {
    return MOOD_LEVELS.difficult;
  }
  return MOOD_LEVELS.okay;
}

export default function InsightsMoodTrendChart({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
}: InsightsMoodTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Group real checkins sorted chronologically
  const points: DataPoint[] = useMemo(() => {
    const map = new Map<string, CheckinResponse>();
    checkinHistory.forEach((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      if (ds && !map.has(ds)) map.set(ds, c);
    });
    if (todayCheckin) {
      const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || new Date());
      if (todayDs) map.set(todayDs, todayCheckin);
    }

    const journalCountsByDate = new Map<string, number>();
    recentJournals.forEach((j) => {
      const ds = toLocalDateString(j.created_at);
      if (ds) journalCountsByDate.set(ds, (journalCountsByDate.get(ds) || 0) + 1);
    });

    const practiceCountsByDate = new Map<string, number>();
    recentMoments.forEach((m) => {
      const ds = toLocalDateString(m.created_at || (m as any).started_at);
      if (ds) practiceCountsByDate.set(ds, (practiceCountsByDate.get(ds) || 0) + 1);
    });

    const sortedDates = Array.from(map.keys()).sort();

    return sortedDates.map((dateStr) => {
      const checkin = map.get(dateStr)!;
      const { level, color, label } = parseMoodLevel(checkin.mood);
      const d = new Date(dateStr + "T12:00:00");
      const displayDate = isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        dateStr,
        displayDate,
        mood: label,
        moodLevel: level,
        color,
        checkin,
        journalCount: journalCountsByDate.get(dateStr) || 0,
        practiceCount: practiceCountsByDate.get(dateStr) || 0,
      };
    });
  }, [checkinHistory, todayCheckin, recentJournals, recentMoments]);

  const hasData = points.length > 0;

  // Chart Dimensions
  const width = 800;
  const height = 260;
  const paddingLeft = 100;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 45;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Compute SVG coordinates
  const coords = useMemo(() => {
    if (points.length === 0) return [];
    if (points.length === 1) {
      const y = paddingTop + innerHeight - ((points[0].moodLevel - 1) / 4) * innerHeight;
      return [{ x: paddingLeft + innerWidth / 2, y, point: points[0] }];
    }

    return points.map((p, idx) => {
      const x = paddingLeft + (idx / (points.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((p.moodLevel - 1) / 4) * innerHeight;
      return { x, y, point: p };
    });
  }, [points, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Construct SVG path string
  const linePath = useMemo(() => {
    if (coords.length < 2) return "";
    return coords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, "");
  }, [coords]);

  const areaPath = useMemo(() => {
    if (coords.length < 2) return "";
    const first = coords[0];
    const last = coords[coords.length - 1];
    const bottomY = paddingTop + innerHeight;
    return `M ${first.x} ${bottomY} L ${first.x} ${first.y} ${coords.slice(1).map((c) => `L ${c.x} ${c.y}`).join(" ")} L ${last.x} ${bottomY} Z`;
  }, [coords, innerHeight, paddingTop]);

  const yLabels = [
    { level: 5, label: "Great", color: "#A78BFA" },
    { level: 4, label: "Good", color: "#60A5FA" },
    { level: 3, label: "Okay", color: "#94A3B8" },
    { level: 2, label: "Low", color: "#F59E0B" },
    { level: 1, label: "Difficult", color: "#F43F5E" },
  ];

  return (
    <section aria-label="Mood Trend Chart" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <TrendingUp size={12} className="text-[#C4B5FD]" />
            <span>Section 1 • Mood History</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Emotional Trend
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Only verified check-in days are plotted. Hover any point to view mood and associated moments.
          </p>
        </div>

        <div className="text-xs font-sans text-[#959BB4]">
          {points.length} {points.length === 1 ? "data point" : "data points"} recorded
        </div>
      </div>

      <div className="relative p-6 sm:p-8 rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 backdrop-blur-2xl shadow-xl overflow-hidden">
        {!hasData ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-[#B8BDD6]">
              <Smile size={20} />
            </div>
            <h3 className="font-hero-title text-lg text-white font-medium">Your story is still unfolding</h3>
            <p className="text-xs sm:text-sm font-sans text-[#959BB4] max-w-sm mx-auto leading-relaxed">
              Complete your first check-in to begin charting your emotional rhythm over time.
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto no-scrollbar">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[620px] select-none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Lines and Y-Axis Labels */}
              {yLabels.map((item) => {
                const y = paddingTop + innerHeight - ((item.level - 1) / 4) * innerHeight;
                return (
                  <g key={item.level}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + innerWidth}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 14}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] font-sans font-medium fill-[#B8BDD6]"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {areaPath && <path d={areaPath} fill="url(#moodAreaGrad)" />}

              {/* Trend Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#7C5CFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="filter drop-shadow-[0_0_8px_rgba(124,92,255,0.4)]"
                />
              )}

              {/* Interactive Data Points */}
              {coords.map((c) => {
                const isHovered = hoveredPoint?.dateStr === c.point.dateStr;
                return (
                  <g
                    key={c.point.dateStr}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(c.point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Invisible larger hover target */}
                    <circle cx={c.x} cy={c.y} r="16" fill="transparent" />

                    {/* Outer Glow Halo on Hover */}
                    {isHovered && (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r="12"
                        fill={`${c.point.color}35`}
                        className="animate-ping"
                      />
                    )}

                    {/* Core Point */}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isHovered ? "7" : "5"}
                      fill={c.point.color}
                      stroke="#0B1228"
                      strokeWidth="2"
                      style={{
                        filter: `drop-shadow(0 0 6px ${c.point.color})`,
                        transition: "all 0.2s ease",
                      }}
                    />

                    {/* X-Axis Date Label */}
                    <text
                      x={c.x}
                      y={paddingTop + innerHeight + 24}
                      textAnchor="middle"
                      className={`text-[10px] font-sans transition-colors ${
                        isHovered ? "fill-white font-bold" : "fill-[#959BB4]"
                      }`}
                    >
                      {c.point.displayDate}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredPoint && (
              <div
                className="absolute top-4 right-4 z-20 p-4 rounded-2xl bg-[#0B1228] border border-[#7C5CFF]/40 text-xs font-sans text-white shadow-2xl space-y-2 animate-athena-rise max-w-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                  <span className="font-semibold text-white">{hoveredPoint.displayDate}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: `${hoveredPoint.color}25`, color: hoveredPoint.color }}
                  >
                    {hoveredPoint.mood}
                  </span>
                </div>

                {hoveredPoint.checkin.reflection_text && (
                  <p className="text-[11px] text-[#DDD6FE] italic line-clamp-2">
                    “{hoveredPoint.checkin.reflection_text}”
                  </p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-[#B8BDD6] pt-1">
                  <span>Journal: {hoveredPoint.journalCount}</span>
                  <span>•</span>
                  <span>Practice: {hoveredPoint.practiceCount}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
