'use client';

import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { CelebrationCardProps } from '@/types/replay';

export const CelebrationCard: React.FC<CelebrationCardProps> = ({
  title,
  description,
  significance,
  tag = 'Quiet Victory',
  date,
  className = '',
}) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900/80 p-6 backdrop-blur-2xl transition-all duration-300 hover:border-amber-400/40 hover:bg-slate-900/95 hover:shadow-xl hover:shadow-amber-950/30 animate-replay-slide-up ${className}`}
    >
      <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
            <Heart size={15} />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300">
            {tag}
          </span>
        </div>
        {date && <span className="text-xs font-serif text-slate-400">{date}</span>}
      </header>

      <div className="relative z-10 space-y-2.5">
        <h3 className="text-lg sm:text-xl font-serif font-medium text-white/95 leading-snug group-hover:text-amber-100 transition-colors">
          {title}
        </h3>
        <p className="text-sm font-serif leading-relaxed text-slate-300">
          {description}
        </p>

        {significance && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2 text-xs font-serif italic text-amber-200/80">
            <Sparkles size={13} className="shrink-0 text-amber-400 mt-0.5" />
            <span>{significance}</span>
          </div>
        )}
      </div>
    </article>
  );
};
