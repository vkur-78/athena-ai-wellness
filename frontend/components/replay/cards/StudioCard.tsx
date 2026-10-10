'use client';

import React from 'react';
import { Sparkles, Clock, Mic, Eye } from 'lucide-react';
import { StudioCardProps } from '@/types/replay';

export const StudioCard: React.FC<StudioCardProps> = ({
  world,
  totalMinutes,
  sessionsCount = 1,
  preferredVoice = 'Nova',
  preferredPerspective = 'First Person',
  narrative,
  ambienceNote = 'A slow, immersive environment that breathes in sync with you.',
  className = '',
}) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-teal-500/20 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl transition-all duration-500 hover:border-teal-400/40 hover:bg-slate-900/95 hover:shadow-2xl hover:shadow-teal-950/40 animate-replay-slide-up ${className}`}
    >
      {/* Slow rotating ambient aura */}
      <div className="absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl animate-thought-breathe pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping" />
          <span className="text-xs font-mono uppercase tracking-widest text-teal-300">
            Sanctuary World
          </span>
        </div>
        <span className="text-xs font-serif text-slate-400">
          {sessionsCount} mindful {sessionsCount === 1 ? 'visit' : 'visits'}
        </span>
      </header>

      <div className="relative z-10 space-y-4">
        <div>
          <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-white tracking-tight">
            {world}
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-serif italic text-teal-200/80">
            {ambienceNote}
          </p>
        </div>

        {narrative && (
          <p className="text-sm font-serif leading-relaxed text-slate-300">
            {narrative}
          </p>
        )}

        {/* World Metric Pill Badges */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-center">
            <div className="flex items-center justify-center text-teal-300 mb-1">
              <Clock size={15} />
            </div>
            <span className="block text-lg font-serif font-medium text-white">
              {totalMinutes}m
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Total Time
            </span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-center">
            <div className="flex items-center justify-center text-teal-300 mb-1">
              <Mic size={15} />
            </div>
            <span className="block text-lg font-serif font-medium text-white truncate">
              {preferredVoice}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Guide Voice
            </span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-center">
            <div className="flex items-center justify-center text-teal-300 mb-1">
              <Eye size={15} />
            </div>
            <span className="block text-lg font-serif font-medium text-white truncate">
              {preferredPerspective}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              View
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
