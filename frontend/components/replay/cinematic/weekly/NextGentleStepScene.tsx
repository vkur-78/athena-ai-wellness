'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Feather, Wind, ArrowRight } from 'lucide-react';

interface NextGentleStepSceneProps {
  suggestion?: string;
  onMaybeLater?: () => void;
}

export const NextGentleStepScene: React.FC<NextGentleStepSceneProps> = ({
  suggestion = 'Friday evenings often become easier after writing two unhurried sentences.',
  onMaybeLater,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      <header className="mb-6 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-teal-300/80">
          Chapter 7 — Your Next Gentle Step
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          One Single Invitation
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 max-w-md mx-auto">
          No endless to-do lists. Just one gentle practice tuned to your rhythm for the week ahead.
        </p>
      </header>

      {/* Focused Glass Suggestion Card */}
      <div className="w-full rounded-3xl border border-teal-500/20 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-5 my-4">
        <div className="h-10 w-10 mx-auto rounded-2xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300">
          <Compass size={20} />
        </div>

        <p className="text-lg sm:text-xl font-serif text-white leading-relaxed font-medium">
          &ldquo;{suggestion}&rdquo;
        </p>

        <p className="text-xs font-serif text-slate-400 leading-relaxed max-w-md mx-auto">
          Protected pauses create room for restoration before exhaustion sets in. Take whatever feels softest today.
        </p>

        {/* The Three Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            href="/journal"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-serif font-medium shadow-lg shadow-violet-600/25 transition-all hover:scale-105 active:scale-95"
          >
            <Feather size={13} />
            <span>Open Space</span>
          </Link>

          <Link
            href="/studio"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-serif font-medium shadow-lg shadow-teal-600/25 transition-all hover:scale-105 active:scale-95"
          >
            <Wind size={13} />
            <span>Open Studio</span>
          </Link>

          <button
            onClick={onMaybeLater}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-serif border border-white/10 transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
