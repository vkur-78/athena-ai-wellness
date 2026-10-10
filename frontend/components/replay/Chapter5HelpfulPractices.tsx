'use client';

import React from 'react';
import { HelpfulPracticeItem } from '@/types/replay';

interface Chapter5HelpfulPracticesProps {
  practices: HelpfulPracticeItem[];
}

export const Chapter5HelpfulPractices: React.FC<Chapter5HelpfulPracticesProps> = ({ practices }) => {
  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter IV • Helpful Habits</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
        Your Most Restorative Practices
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 font-serif mb-8">
        The supportive anchors that created space when things felt dense.
      </p>

      <div className="w-full space-y-4 text-left">
        {practices.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition-colors"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono flex items-center justify-center font-bold">
                  {item.rank || idx + 1}
                </span>
                <h3 className="text-base sm:text-lg font-medium text-slate-100 font-serif">
                  {item.practice}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-serif pl-7">
                {item.why_helpful}
              </p>
              {item.supporting_evidence && (
                <p className="text-[11px] text-slate-400 font-serif italic pl-7 border-t border-slate-800/40 pt-1">
                  Evidence: {item.supporting_evidence}
                </p>
              )}
            </div>
            <div className="shrink-0 pl-7 sm:pl-0">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                {item.times_used}x used
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
