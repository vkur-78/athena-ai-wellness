'use client';

import React, { useState, useEffect } from 'react';
import { MoodJourneyFlowPoint } from '@/types/replay';
import { Heart, Feather, Wind, MessageCircle } from 'lucide-react';

interface SevenDayStonesSceneProps {
  moodJourney: MoodJourneyFlowPoint[];
}

export const SevenDayStonesScene: React.FC<SevenDayStonesSceneProps> = ({ moodJourney }) => {
  const [activeStone, setActiveStone] = useState<number>(0);
  const [litCount, setLitCount] = useState<number>(1);

  const days = moodJourney && moodJourney.length === 7 ? moodJourney : [
    { day_label: 'Mon', date: '2026-09-14', mood: 'overwhelmed', energy: 2, tension: 4, calm_level: 68, reflection_snippet: 'Met the start of the week carrying heavy work demands.' },
    { day_label: 'Tue', date: '2026-09-15', mood: 'steady', energy: 3, tension: 3, calm_level: 76, reflection_snippet: 'Wrote 140 words in Space journal.' },
    { day_label: 'Wed', date: '2026-09-16', mood: 'steady', energy: 3, tension: 2, calm_level: 81, reflection_snippet: 'Unburdened heavy thoughts in dialogue.' },
    { day_label: 'Thu', date: '2026-09-17', mood: 'reflective', energy: 4, tension: 2, calm_level: 85, reflection_snippet: 'Paused for Desk Relief in Sakura Garden.' },
    { day_label: 'Fri', date: '2026-09-18', mood: 'calmer', energy: 4, tension: 1, calm_level: 90, reflection_snippet: 'Held 90% calm as the afternoon softened.' },
    { day_label: 'Sat', date: '2026-09-19', mood: 'calmer', energy: 3, tension: 1, calm_level: 92, reflection_snippet: 'Allowed the day to unfold without urgency.' },
    { day_label: 'Sun', date: '2026-09-20', mood: 'peaceful', energy: 4, tension: 1, calm_level: 95, reflection_snippet: 'Arrived at the week’s close with stillness.' },
  ];

  // Sequential stone illumination effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLitCount((prev) => {
        if (prev < 7) return prev + 1;
        return prev;
      });
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const getStoneColor = (mood: string, isLit: boolean) => {
    if (!isLit) return 'bg-slate-900 border-slate-800 text-slate-600 shadow-none opacity-40';
    switch (mood) {
      case 'overwhelmed':
        return 'bg-gradient-to-br from-rose-900/60 to-rose-950 border-rose-500/40 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.35)]';
      case 'steady':
        return 'bg-gradient-to-br from-amber-900/60 to-amber-950 border-amber-500/40 text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.35)]';
      case 'reflective':
        return 'bg-gradient-to-br from-sky-900/60 to-sky-950 border-sky-500/40 text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.35)]';
      case 'calmer':
        return 'bg-gradient-to-br from-teal-900/60 to-teal-950 border-teal-500/40 text-teal-200 shadow-[0_0_24px_rgba(45,212,191,0.4)]';
      case 'peaceful':
      default:
        return 'bg-gradient-to-br from-violet-900/60 to-violet-950 border-violet-400/50 text-violet-200 shadow-[0_0_28px_rgba(167,139,250,0.45)]';
    }
  };

  const selectedDay = days[activeStone] || days[0];

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      <header className="mb-8 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-violet-300/80">
          Chapter 2 — Seven-Day Journey
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          The Seven Glowing Stones
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 max-w-md mx-auto">
          Each day lit up as you carried your responsibilities. Tap any stone to reveal what took place.
        </p>
      </header>

      {/* Seven Organic Glowing Stones Row */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 my-6">
        {days.map((d, index) => {
          const isLit = index < litCount;
          const isSelected = activeStone === index;
          const colorClass = getStoneColor(d.mood, isLit);

          return (
            <button
              key={index}
              onClick={() => setActiveStone(index)}
              className={`group relative flex flex-col items-center justify-center w-12 sm:w-16 h-20 sm:h-24 rounded-[28px] border transition-all duration-500 cursor-pointer ${colorClass} ${
                isSelected ? 'scale-110 -translate-y-2 ring-2 ring-white/30' : 'hover:scale-105'
              }`}
              title={`${d.day_label}: ${d.mood}`}
            >
              {/* Internal subtle glow pulse */}
              {isLit && (
                <div className="absolute inset-0 rounded-[28px] bg-white/10 blur-sm pointer-events-none" />
              )}

              <span className="text-[10px] sm:text-xs font-mono font-medium uppercase tracking-wider relative z-10">
                {d.day_label}
              </span>

              <div className="my-1 text-xs relative z-10">
                <Heart size={12} className={isLit ? 'fill-current' : 'opacity-20'} />
              </div>

              <span className="text-[10px] font-mono opacity-80 relative z-10">
                {d.calm_level}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Stone Detail Card */}
      <div className="mt-6 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl transition-all animate-replay-slide-up text-left">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-serif font-medium text-white">
              {selectedDay.day_label} • {selectedDay.date}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono capitalize bg-white/10 text-violet-200">
              {selectedDay.mood}
            </span>
          </div>

          <div className="text-right font-mono text-xs text-teal-300">
            {selectedDay.calm_level}% Calm Index
          </div>
        </div>

        <p className="text-xs sm:text-sm font-serif italic text-slate-300 mb-4 leading-relaxed">
          &ldquo;{selectedDay.reflection_snippet}&rdquo;
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-2">
            <Feather size={12} className="text-violet-300" />
            <span>Space ink</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-2">
            <Wind size={12} className="text-teal-300" />
            <span>Studio pause</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-2">
            <MessageCircle size={12} className="text-amber-300" />
            <span>Dialogue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
