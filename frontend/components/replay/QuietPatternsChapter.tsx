'use client';

import React from 'react';
import { QuietPattern } from '@/types/replay';

interface QuietPatternsChapterProps {
  patterns?: QuietPattern[];
}

export const QuietPatternsChapter: React.FC<QuietPatternsChapterProps> = ({ patterns = [] }) => {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono uppercase tracking-widest mb-6">
          <span>Chapter V • Quiet Patterns</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
          Quiet Equilibrium
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-serif">
          Your month unfolded evenly without recurring tensions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter V • Quiet Patterns</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
        Trends Athena Quietly Observed
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 font-serif mb-8">
        Grounded strictly in verified moments, articulated with truthful confidence.
      </p>

      <div className="w-full space-y-5 text-left">
        {patterns.map((item, idx) => {
          const isSteady = item.confidence_level === 'steady';
          const isLow = item.confidence_level === 'low';

          return (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg hover:border-teal-500/30 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <span className="text-xs uppercase tracking-wider font-mono text-teal-400">
                  Pattern {idx + 1}
                </span>
                <span
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                    isSteady
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : isLow
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                  }`}
                >
                  {item.confidence_wording}
                </span>
              </div>

              <div className="pt-4 space-y-3">
                <h3 className="text-lg font-serif font-medium text-slate-100">
                  {item.trend}
                </h3>

                <div className="space-y-1.5 text-xs sm:text-sm font-serif text-slate-300">
                  <p>
                    <span className="text-slate-400 font-sans font-medium">Why Athena noticed: </span>
                    {item.why_noticed}
                  </p>
                  <p className="text-slate-400 italic text-xs pt-1 border-t border-slate-800/40">
                    Evidence: {item.supporting_evidence}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
