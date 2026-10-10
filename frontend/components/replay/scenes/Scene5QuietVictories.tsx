'use client';

import React from 'react';
import { QuietVictoryCard } from '@/types/replay';
import { CelebrationCard } from '../cards/CelebrationCard';
import { Heart } from 'lucide-react';

interface Scene5QuietVictoriesProps {
  victories: QuietVictoryCard[];
}

export const Scene5QuietVictories: React.FC<Scene5QuietVictoriesProps> = ({ victories }) => {
  const displayVictories = victories && victories.length > 0 ? victories : [];

  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-4xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/20 bg-amber-500/10 text-xs font-mono tracking-wider text-amber-300 mb-3">
          <Heart size={13} />
          <span>Presence Over Performance</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          Quiet Victories
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          We do not celebrate arbitrary scores. We honor the moments you chose compassion over haste.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {displayVictories.map((v) => (
          <CelebrationCard
            key={v.id}
            title={v.title}
            description={v.description}
            significance={v.significance}
            date={v.date}
          />
        ))}
      </div>
    </div>
  );
};
