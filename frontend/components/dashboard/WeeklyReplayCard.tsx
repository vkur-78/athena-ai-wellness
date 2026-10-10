"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface WeeklyReplayCardProps {
  daysCompletedThisWeek?: number;
}

export default function WeeklyReplayCard({ daysCompletedThisWeek }: WeeklyReplayCardProps = {}) {
  const { isLight } = useTheme();

  // Calculate days until Sunday (0 = Sunday)
  const today = new Date().getDay();
  const daysUntilSunday = (7 - today) % 7;
  const isSunday = today === 0;

  // Percentage toward Sunday (Mon=14%, Tue=28%, ... Sun=100%)
  const defaultPercentage = Math.round(((today === 0 ? 7 : today) / 7) * 100);
  const percentage = daysCompletedThisWeek !== undefined ? Math.round((daysCompletedThisWeek / 7) * 100) : defaultPercentage;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
              <Calendar size={14} />
            </div>
            <span
              className={`text-[11px] font-serif uppercase tracking-wider ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Sunday Replay
            </span>
          </div>
          <span
            className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
              isSunday
                ? isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                : isLight
                ? "bg-stone-100 border-stone-200 text-stone-600"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            {isSunday ? "Ready Now" : `In ${daysUntilSunday} ${daysUntilSunday === 1 ? "day" : "days"}`}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h3
              className={`text-base sm:text-lg font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              {isSunday ? "Your Weekly Replay is ready" : `Weekly Replay unlocks in ${daysUntilSunday} days`}
            </h3>
            <p
              className={`text-xs font-serif mt-0.5 leading-relaxed ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {isSunday
                ? "Experience your quiet week distilled into sound, words, and stillness."
                : "Every Sunday, Athena synthesizes your emotional cadence into a guided review."}
            </p>
          </div>

          {/* Mini Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="48" height="48" className="transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={isLight ? "#e7e5e4" : "#2a2c36"}
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={isLight ? "#7c3aed" : "#a78bfa"}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[9px] font-mono font-bold ${isLight ? "text-stone-700" : "text-zinc-300"}`}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between">
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-500"
          }`}
        >
          No paywall · Part of your Sanctuary
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/replay"
            className={`text-xs font-serif transition-colors ${
              isLight ? "text-stone-500 hover:text-stone-800" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Archive
          </Link>
          <Link
            href="/replay/weekly"
            className={`inline-flex items-center gap-1.5 text-xs font-serif font-medium transition-colors cursor-pointer group ${
              isLight
                ? "text-stone-800 hover:text-stone-950"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <span>{isSunday ? "Experience Replay" : "Preview Living Replay"}</span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
