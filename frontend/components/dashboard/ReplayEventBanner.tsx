'use client';

import React from 'react';
import { Sparkles, Play, Compass, Heart, Clock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { LivingReplayData } from '@/types/replay';

interface ReplayEventBannerProps {
  onExperienceReplay: () => void;
  replayData?: LivingReplayData | null;
  daysUntilSunday?: number;
}

export default function ReplayEventBanner({
  onExperienceReplay,
  replayData,
  daysUntilSunday = 0,
}: ReplayEventBannerProps) {
  const { isLight } = useTheme();

  const isSunday = daysUntilSunday === 0 || new Date().getDay() === 0;
  const isMonthEnd = new Date().getDate() >= 28;

  const title = isMonthEnd
    ? '✨ Your Monthly Story is Ready'
    : '✨ Your Weekly Story is Ready';

  const subtitle = replayData?.opening_scene?.quote || 'This week quietly told a story.';
  const season = replayData?.opening_scene?.season_title || 'Finding Quieter Evenings';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 transition-all duration-300 shadow-xl ${
        isLight
          ? 'bg-gradient-to-br from-white via-[#fcfbf9] to-[#f5f1eb] border-violet-200/80 shadow-stone-200/50'
          : 'bg-gradient-to-br from-[#1b1c28] via-[#14151e] to-[#0f1016] border-violet-500/25 shadow-violet-950/25'
      }`}
    >
      {/* Gentle Floating Atmospheric Glow */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${
                isLight
                  ? 'bg-violet-100/80 text-violet-800 border border-violet-200'
                  : 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
              }`}
            >
              <Sparkles size={12} className="animate-pulse" />
              <span>{title}</span>
            </span>

            <span
              className={`text-xs font-serif ${
                isLight ? 'text-stone-500' : 'text-zinc-400'
              }`}
            >
              {season}
            </span>
          </div>

          <h2
            className={`text-xl sm:text-2xl font-serif font-semibold tracking-tight ${
              isLight ? 'text-stone-900' : 'text-white'
            }`}
          >
            &ldquo;{subtitle}&rdquo;
          </h2>

          <p
            className={`text-xs sm:text-sm font-serif leading-relaxed ${
              isLight ? 'text-stone-600' : 'text-zinc-400'
            }`}
          >
            A 60-second full-screen cinematic recollection of your emotional rhythm, quiet victories, and recovery pauses.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <button
            onClick={onExperienceReplay}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-serif font-medium shadow-xl shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Play size={11} className="ml-0.5 fill-white" />
            </div>
            <span>Experience Your Story</span>
          </button>

          <span
            className={`text-[11px] font-serif ${
              isLight ? 'text-stone-500' : 'text-zinc-500'
            }`}
          >
            Full-screen event · Zero latency
          </span>
        </div>
      </div>
    </div>
  );
}
