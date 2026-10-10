"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Play, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";

interface StudioShortcutCardProps {
  lastMoment?: RecentMoment | null;
  totalPractices?: number;
}

export default function StudioShortcutCard({
  lastMoment,
  totalPractices = 9,
}: StudioShortcutCardProps) {
  const { isLight } = useTheme();

  const worldName = lastMoment?.routine || lastMoment?.moment_text || "Sakura Garden";
  const exerciseLabel = lastMoment
    ? `${lastMoment.practice_type || "Guided"} Practice`
    : "5:00 Mindful Breathing";
  const completionPercentage = lastMoment?.completed ? 100 : 75;

  // SVG Circular progress math
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

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
              <Sparkles size={14} />
            </div>
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              3D Sanctuary Studio
            </span>
          </div>
          <span
            className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
            }`}
          >
            Interactive World
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h3
              className={`text-base sm:text-lg font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              {worldName}
            </h3>
            <p
              className={`text-xs font-serif mt-0.5 ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {exerciseLabel}
            </p>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="56" height="56" className="transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke={isLight ? "#e7e5e4" : "#2a2c36"}
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke={isLight ? "#059669" : "#10b981"}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {completionPercentage >= 100 ? (
                <Check size={14} className={isLight ? "text-emerald-700" : "text-emerald-400"} />
              ) : (
                <span className={`text-[10px] font-mono font-semibold ${isLight ? "text-stone-700" : "text-zinc-300"}`}>
                  {completionPercentage}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-inherit flex items-center justify-between">
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-500"
          }`}
        >
          {lastMoment ? "Re-enter peaceful world" : "9 cinematic environments ready"}
        </span>
        <Link
          href="/studio"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            isLight
              ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
              : "bg-white hover:bg-stone-100 text-stone-900 shadow-xs"
          }`}
        >
          <span>Continue</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
