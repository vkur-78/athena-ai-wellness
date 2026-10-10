'use client';

import React from 'react';
import { Feather, Sparkles } from 'lucide-react';
import { ReflectionCardProps } from '@/types/replay';

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  headline,
  narrative,
  keyTakeaway,
  className = '',
}) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-violet-500/20 bg-slate-900/85 p-6 sm:p-10 backdrop-blur-2xl transition-all duration-300 hover:border-violet-400/40 hover:bg-slate-900/95 hover:shadow-2xl hover:shadow-violet-950/40 animate-replay-slide-up ${className}`}
    >
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <header className="relative z-10 flex items-center gap-2.5 mb-5 text-violet-300 text-xs font-mono uppercase tracking-widest">
        <Feather size={15} />
        <span>Grounded Reflection</span>
      </header>

      <div className="relative z-10 space-y-5">
        <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-white/95 leading-tight">
          {headline}
        </h3>

        <p className="text-base sm:text-lg font-serif leading-relaxed text-slate-200/90 whitespace-pre-line">
          {narrative}
        </p>

        {keyTakeaway && (
          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-950/30 p-4 sm:p-5 text-xs sm:text-sm font-serif italic text-violet-200 leading-relaxed flex items-start gap-3">
            <Sparkles size={18} className="shrink-0 text-violet-400 mt-0.5" />
            <span>&ldquo;{keyTakeaway}&rdquo;</span>
          </div>
        )}
      </div>
    </article>
  );
};
