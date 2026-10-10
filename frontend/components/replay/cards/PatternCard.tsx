'use client';

import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { PatternCardProps } from '@/types/replay';

export const PatternCard: React.FC<PatternCardProps> = ({
  discovery,
  confidence,
  evidence,
  title = 'Verified Emotional Rhythm',
  whyNoticed,
  className = '',
}) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 hover:border-indigo-400/40 hover:bg-slate-900/95 hover:shadow-2xl hover:shadow-indigo-950/50 animate-replay-slide-up ${className}`}
    >
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
            <Compass size={17} />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-300">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-950/40 text-[11px] font-mono text-indigo-300">
          <Sparkles size={11} />
          <span>{confidence}</span>
        </div>
      </header>

      <div className="relative z-10 space-y-4">
        <h3 className="text-xl sm:text-2xl font-serif font-medium text-white/95 leading-snug">
          &ldquo;{discovery}&rdquo;
        </h3>

        {whyNoticed && (
          <p className="text-xs font-serif text-slate-400 leading-relaxed">
            <span className="text-indigo-300 font-medium">Why Athena noticed:</span>{' '}
            {whyNoticed}
          </p>
        )}

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs font-serif leading-relaxed text-slate-300">
          <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px] tracking-wider">
            Supporting Evidence
          </span>
          {evidence}
        </div>
      </div>
    </article>
  );
};
