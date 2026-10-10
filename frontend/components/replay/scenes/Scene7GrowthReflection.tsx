'use client';

import React from 'react';
import { GrowthReflectionData } from '@/types/replay';
import { ReflectionCard } from '../cards/ReflectionCard';
import { Feather } from 'lucide-react';

interface Scene7GrowthReflectionProps {
  reflection: GrowthReflectionData;
}

export const Scene7GrowthReflection: React.FC<Scene7GrowthReflectionProps> = ({ reflection }) => {
  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-3xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/20 bg-violet-500/10 text-xs font-mono tracking-wider text-violet-300 mb-3">
          <Feather size={13} />
          <span>Sanctuary Voice</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          A Moment of Reflection
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          Honest words to remind you of the ground you have carried.
        </p>
      </header>

      <div className="w-full">
        <ReflectionCard
          headline={reflection.headline}
          narrative={reflection.narrative}
          keyTakeaway={reflection.key_takeaway}
        />
      </div>
    </div>
  );
};
