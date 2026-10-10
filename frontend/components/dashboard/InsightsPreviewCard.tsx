"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight, BarChart3 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface InsightsPreviewCardProps {
  weeklyHistory?: CheckinResponse[];
  checkinHistory?: CheckinResponse[];
  trendSentence?: string;
}

export default function InsightsPreviewCard({
  weeklyHistory = [],
  checkinHistory,
  trendSentence = "Your evenings have felt calmer this week.",
}: InsightsPreviewCardProps) {
  const { isLight } = useTheme();
  const effectiveHistory = checkinHistory || weeklyHistory;

  // Synthetic or real 7-day sparkline heights [0..100]
  const sparklineData = React.useMemo(() => {
    if (effectiveHistory.length >= 4) {
      return effectiveHistory.slice(0, 7).reverse().map((c) => {
        switch (c.mood?.toLowerCase()) {
          case "calm":
          case "peaceful":
            return 85;
          case "good":
          case "content":
            return 75;
          case "reflective":
            return 60;
          case "tired":
            return 45;
          case "anxious":
          case "overwhelmed":
            return 30;
          default:
            return 65;
        }
      });
    }
    // Harmonious baseline pattern
    return [55, 62, 70, 65, 80, 78, 88];
  }, [weeklyHistory]);

  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition-all duration-250 flex flex-col justify-between hover:-translate-y-0.5 ${
        isLight
          ? "bg-[#fdfbf7]/90 hover:bg-white border-[#e7e5e4] hover:border-stone-300 shadow-sm"
          : "bg-[#1a1b21]/90 hover:bg-[#20222a] border-[#2a2c36] hover:border-[#3a3c48] shadow-xs"
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs ${
                isLight
                  ? "bg-stone-100 border-stone-200 text-stone-700"
                  : "bg-[#242632] border-[#363848] text-violet-300"
              }`}
            >
              <TrendingUp size={14} />
            </div>
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Therapeutic Insights
            </span>
          </div>
          <span
            className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
              isLight
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-violet-950/40 border-violet-800/40 text-violet-300"
            }`}
          >
            Weekly Pattern
          </span>
        </div>

        <p
          className={`text-sm sm:text-base font-serif italic mt-3.5 leading-relaxed ${
            isLight ? "text-stone-800" : "text-zinc-100"
          }`}
        >
          &ldquo;{trendSentence}&rdquo;
        </p>

        {/* Mini 7-Day Sparkline Bar Visualization */}
        <div className="mt-4 pt-3 border-t border-inherit">
          <div className="flex items-end justify-between gap-1.5 h-12 px-1">
            {sparklineData.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    idx === sparklineData.length - 1
                      ? isLight
                        ? "bg-violet-600"
                        : "bg-violet-400"
                      : isLight
                      ? "bg-stone-300 hover:bg-stone-400"
                      : "bg-zinc-700 hover:bg-zinc-600"
                  }`}
                  style={{ height: `${val}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-mono mt-1 text-stone-400 px-1">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-500"
          }`}
        >
          Patterns grow with daily pauses
        </span>
        <Link
          href="/insights"
          className={`inline-flex items-center gap-1.5 text-xs font-serif font-medium transition-colors cursor-pointer group ${
            isLight
              ? "text-stone-800 hover:text-stone-950"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          <span>View Full Insights</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
