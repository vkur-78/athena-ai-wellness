'use client';

import React, { useState } from 'react';
import { TurningPointCard } from '@/types/replay';

interface Chapter3TurningPointsProps {
  turningPoints: TurningPointCard[];
}

export const Chapter3TurningPoints: React.FC<Chapter3TurningPointsProps> = ({ turningPoints }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!turningPoints || turningPoints.length === 0) {
    return (
      <div className="flex flex-col items-center max-w-xl mx-auto px-6 py-12 text-center animate-fade-in">
        <h3 className="text-xl font-serif text-slate-300">Quiet Days</h3>
        <p className="text-sm text-slate-400 font-serif mt-2">
          Your month was characterized by gentle equilibrium without dramatic shifts.
        </p>
      </div>
    );
  }

  const current = turningPoints[currentIndex];

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter III • Turning Points</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
        Moments That Mattered
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 font-serif mb-8">
        Real milestones of emotional honesty and recovery you experienced this month.
      </p>

      {/* Main Moment Card */}
      <div className="w-full p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs text-rose-400 font-mono">
          <span>{current.date}</span>
          <span className="uppercase tracking-wider">{current.category}</span>
        </div>

        <div className="py-6 text-left space-y-4">
          <h3 className="text-lg sm:text-xl font-medium text-slate-100 font-serif">
            {current.moment}
          </h3>
          <p className="text-sm sm:text-base text-slate-300 font-serif italic leading-relaxed border-l-2 border-rose-500/40 pl-4">
            "{current.why_it_mattered}"
          </p>
        </div>

        {/* Carousel Pagination Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-3.5 py-1.5 rounded-full text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {currentIndex + 1} of {turningPoints.length}
          </span>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(turningPoints.length - 1, prev + 1))}
            disabled={currentIndex === turningPoints.length - 1}
            className="px-3.5 py-1.5 rounded-full text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
