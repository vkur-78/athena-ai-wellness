'use client';

import React, { useState, useEffect } from 'react';
import { QuietVictoryCard } from '@/types/replay';
import { Flame, Sparkles } from 'lucide-react';

interface RisingLanternsSceneProps {
  victories?: QuietVictoryCard[];
}

export const RisingLanternsScene: React.FC<RisingLanternsSceneProps> = ({ victories = [] }) => {
  const [visibleCount, setVisibleCount] = useState<number>(1);

  const lanterns = victories.length > 0 ? victories : [
    { id: '1', title: 'Returned After a Difficult Day', description: 'When fatigue asked for withdrawal, you made room for a gentle reset.', significance: 'Resilience is measured by returning.' },
    { id: '2', title: 'Chose to Pause Instead of Rushing', description: 'Taking even three minutes of steady breath interrupted the cycle of urgency.', significance: 'Protected your nervous system before dinner.' },
    { id: '3', title: 'Wrote When Words Felt Heavy', description: 'Opening your Space journal allowed feelings to settle into honest ink.', significance: 'Translating feeling clarifies what matters.' },
  ];

  // Lanterns lift off one by one
  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < lanterns.length) return prev + 1;
        return prev;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [lanterns.length]);

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      <header className="mb-6 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300/80">
          Chapter 4 — Quiet Victories
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          Rising Lanterns of Presence
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 max-w-md mx-auto">
          Instead of artificial scores, your moments of returning lift gently like lanterns into the night.
        </p>
      </header>

      {/* Floating Lanterns Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full my-4">
        {lanterns.map((l, index) => {
          const isVisible = index < visibleCount;

          return (
            <div
              key={l.id || index}
              className={`relative flex flex-col items-center justify-between rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/40 via-slate-900/80 to-slate-950 p-6 backdrop-blur-xl shadow-2xl transition-all duration-1000 ${
                isVisible
                  ? 'opacity-100 translate-y-0 shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                  : 'opacity-0 translate-y-16 pointer-events-none'
              }`}
            >
              {/* Lantern Warm Glowing Wick / Flame */}
              <div className="relative mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                  <Flame size={20} className="text-amber-400 fill-amber-400 animate-thought-breathe" />
                </div>
                <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
              </div>

              {/* Lantern Paper Body with Verified Moment */}
              <div className="space-y-2 text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 block">
                  Verified Pause
                </span>
                <h3 className="text-lg font-serif font-medium text-white leading-snug">
                  {l.title}
                </h3>
                <p className="text-xs font-serif text-slate-300/90 leading-relaxed">
                  {l.description}
                </p>
              </div>

              {/* Significance Footer */}
              <div className="mt-4 pt-3 border-t border-amber-500/15 w-full flex items-center justify-center gap-1.5 text-[11px] font-serif italic text-amber-200/80">
                <Sparkles size={11} className="text-amber-400" />
                <span>{l.significance}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
