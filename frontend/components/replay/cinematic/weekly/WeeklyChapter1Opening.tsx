'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface WeeklyChapter1OpeningProps {
  userName?: string;
  seasonTitle?: string;
}

export const WeeklyChapter1Opening: React.FC<WeeklyChapter1OpeningProps> = ({
  userName = 'friend',
  seasonTitle = 'Finding Quieter Evenings',
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto min-h-[70vh] select-none">
      {/* Soft Moving Ambient Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-600/10 via-indigo-600/15 to-teal-500/10 blur-[130px] animate-thought-breathe" />
      </div>

      {/* Season Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-mono uppercase tracking-widest text-violet-300 mb-8 animate-replay-fade">
        <Sparkles size={13} className="text-violet-400" />
        <span>{seasonTitle}</span>
      </div>

      {/* Opening Cinematic Text */}
      <div className="space-y-4 max-w-xl animate-replay-slide-up">
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-white tracking-tight leading-tight">
          Your week quietly found its rhythm.
        </h1>

        <p className="text-sm sm:text-base font-serif italic text-slate-300/80 leading-relaxed pt-2">
          An unhurried recollection of the ground you held, {userName}.
        </p>
      </div>

      {/* Subtle indicator */}
      <div className="mt-14 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-slate-500 animate-pulse">
        <span>Story unfolding</span>
      </div>
    </div>
  );
};
