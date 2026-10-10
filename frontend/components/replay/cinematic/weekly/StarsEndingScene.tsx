'use client';

import React, { useState } from 'react';
import { Sparkles, Home, RotateCcw, Award } from 'lucide-react';
import { HighlightsGrid } from '@/types/replay';

interface StarsEndingSceneProps {
  onReturnHome: () => void;
  onReplay: () => void;
  highlights?: HighlightsGrid;
}

export const StarsEndingScene: React.FC<StarsEndingSceneProps> = ({
  onReturnHome,
  onReplay,
  highlights,
}) => {
  const [showCards, setShowCards] = useState<boolean>(false);

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      {/* Dynamic Starfield Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-white animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-violet-300 animate-ping" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-teal-200 animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" style={{ animationDuration: '7s', animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 space-y-6 animate-replay-slide-up max-w-xl">
        <div className="h-12 w-12 mx-auto rounded-full bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-[0_0_24px_rgba(167,139,250,0.4)]">
          <Sparkles size={20} />
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif font-medium text-white tracking-tight leading-tight">
          Thank you for returning this week.
        </h2>

        <p className="text-sm sm:text-base font-serif italic text-slate-300 leading-relaxed">
          &ldquo;Your story isn&apos;t measured by perfection. It is written in every pause you chose.&rdquo;
        </p>

        {/* Collectible highlights preview if toggled */}
        {showCards && highlights && (
          <div className="grid grid-cols-2 gap-3 pt-4 text-left animate-replay-slide-up">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase text-teal-300 block">Sanctuary</span>
              <p className="text-sm font-serif font-medium text-white">{highlights.favorite_sanctuary}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase text-violet-300 block">Calm Streak</span>
              <p className="text-sm font-serif font-medium text-white">{highlights.longest_calm_streak}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase text-amber-300 block">Quiet Victory</span>
              <p className="text-sm font-serif font-medium text-white">{highlights.quiet_victory}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase text-sky-300 block">Reflection Day</span>
              <p className="text-sm font-serif font-medium text-white">{highlights.reflection_day}</p>
            </div>
          </div>
        )}

        {/* Return Home Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
          <button
            onClick={onReturnHome}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-serif font-medium shadow-xl shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Home size={14} />
            <span>Return Home</span>
          </button>

          {!showCards && highlights && (
            <button
              onClick={() => setShowCards(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-serif border border-white/10 transition-all cursor-pointer"
            >
              <Award size={14} />
              <span>View Keepsake Cards</span>
            </button>
          )}

          <button
            onClick={onReplay}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-serif border border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
