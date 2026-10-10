'use client';

import React from 'react';
import Link from 'next/link';
import { WorldGrowthItem } from '@/types/replay';

interface Chapter4WorldGrowthProps {
  growthItems: WorldGrowthItem[];
}

export const Chapter4WorldGrowth: React.FC<Chapter4WorldGrowthProps> = ({ growthItems }) => {
  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter IV • Sanctuary Growth</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
        Welcomed to Your Sanctuary
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 font-serif mb-8">
        Your emotional home quietly responded to your real practices this month.
      </p>

      {growthItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-300">
          <p className="font-serif italic">
            Your sanctuary is resting quietly, holding space for your first steps.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {growthItems.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col justify-between text-left hover:border-emerald-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-emerald-400/90 font-mono mb-2">
                  <span className="capitalize">{item.object_name.replace('_', ' ')}</span>
                  <span>{new Date(item.unlocked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
                <h3 className="text-lg font-medium text-slate-100 font-serif mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 font-serif italic">"{item.whisper}"</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-medium transition-all hover:scale-105"
        >
          <span>Explore Studio Worlds</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
};
