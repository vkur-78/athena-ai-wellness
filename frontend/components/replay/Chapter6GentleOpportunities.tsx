'use client';

import React from 'react';
import { GentleOpportunity } from '@/types/replay';

interface Chapter6GentleOpportunitiesProps {
  opportunity: GentleOpportunity;
}

export const Chapter6GentleOpportunities: React.FC<Chapter6GentleOpportunitiesProps> = ({ opportunity }) => {
  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter VI • Gentle Opportunities</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
        An Invitation, Not an Expectation
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 font-serif mb-8">
        A small, curious adjustment for your emotional nervous system to try.
      </p>

      <div className="w-full p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl text-left space-y-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-400/90 font-mono">What We Noticed</span>
          <p className="text-base text-slate-300 font-serif mt-2 leading-relaxed">
            {opportunity.observation}
          </p>
        </div>

        <div className="pt-6 border-t border-slate-800/80">
          <span className="text-xs uppercase tracking-wider text-emerald-400/90 font-mono">Gentle Micro-Experiment</span>
          <p className="text-base sm:text-lg text-slate-100 font-serif italic mt-2 leading-relaxed">
            "{opportunity.experiment}"
          </p>
        </div>
      </div>
    </div>
  );
};
