"use client";

import React from "react";
import Link from "next/link";
import { Wind, ArrowRight, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { PracticeImpactResponse, PracticeImpactItem } from "@/types/insights";

interface PracticeImpactDashboardProps {
  impactData: PracticeImpactResponse | null;
  loading?: boolean;
}

export default function PracticeImpactDashboard({ impactData, loading }: PracticeImpactDashboardProps) {
  const { isLight } = useTheme();

  if (loading || !impactData) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-32 rounded-3xl border p-5 animate-pulse ${
                isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const practices = impactData.practices || [];

  if (impactData.is_empty_state || practices.length === 0) {
    return (
      <section aria-labelledby="practice-impact-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-500" />
            <h2
              id="practice-impact-title"
              className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Practice Impact Dashboard
            </h2>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-6 sm:p-8 text-center space-y-3 ${
            isLight
              ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
              : "bg-[#181920] border-[#272834] shadow-xs"
          }`}
        >
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border text-sm ${
              isLight
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-violet-950/40 border-violet-800/40 text-violet-300"
            }`}
          >
            <Wind size={18} />
          </div>
          <h3
            className={`text-base font-serif font-semibold ${
              isLight ? "text-stone-900" : "text-zinc-100"
            }`}
          >
            I&apos;m still learning this rhythm
          </h3>
          <p
            className={`text-xs sm:text-sm font-serif max-w-md mx-auto leading-relaxed ${
              isLight ? "text-stone-500" : "text-zinc-400"
            }`}
          >
            Your first few Studio sessions help Athena measure which practices create the most relief
            for you. No fake predictions or artificial metrics.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="practice-impact-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-violet-500" />
          <h2
            id="practice-impact-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Practice Impact Dashboard
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Observed therapeutic outcomes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {practices.map((practice) => (
          <div
            key={practice.practice_id}
            className={`rounded-3xl border p-5 sm:p-6 transition-all duration-250 flex flex-col justify-between group hover:-translate-y-0.5 ${
              isLight
                ? "bg-[#fdfbf7] hover:bg-white border-[#e7e5e4] hover:border-stone-300 shadow-xs hover:shadow-sm"
                : "bg-[#181920] hover:bg-[#1f202a] border-[#272834] hover:border-[#3a3c4c] shadow-xs"
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs ${
                      isLight
                        ? "bg-violet-50 border-violet-200 text-violet-700"
                        : "bg-violet-950/40 border-violet-800/40 text-violet-300"
                    }`}
                  >
                    <Wind size={13} />
                  </div>
                  <h3
                    className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {practice.practice_name}
                  </h3>
                </div>

                <span
                  className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
                    isLight
                      ? "bg-stone-100 border-stone-200 text-stone-700"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {practice.sessions_completed} {practice.sessions_completed === 1 ? "session" : "sessions"}
                </span>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-serif ${
                    isLight ? "text-stone-500" : "text-zinc-400"
                  }`}
                >
                  <Clock size={11} className="opacity-60" />
                  <span>avg {practice.average_duration}</span>
                </span>
                <span className="opacity-30">•</span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-serif ${
                    isLight ? "text-stone-500" : "text-zinc-400"
                  }`}
                >
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span>{practice.completion_rate} completed</span>
                </span>
              </div>

              {/* Observed recovery trend narrative */}
              <p
                className={`text-xs sm:text-sm font-serif leading-relaxed italic ${
                  isLight ? "text-stone-600" : "text-zinc-300"
                }`}
              >
                &ldquo;{practice.observed_recovery_trend}&rdquo;
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <Link
                href="/studio"
                className={`inline-flex items-center gap-1 text-xs font-serif font-medium transition-colors ${
                  isLight
                    ? "text-violet-700 hover:text-violet-900"
                    : "text-violet-300 hover:text-violet-100"
                }`}
              >
                <span>Launch practice</span>
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {impactData.summary_sentence && (
        <p
          className={`text-xs sm:text-sm font-serif italic text-center pt-1 ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          {impactData.summary_sentence}
        </p>
      )}
    </section>
  );
}
