'use client';

import React from 'react';
import { RecoveryMomentCard } from '@/types/replay';
import { MemoryCard } from '../cards/MemoryCard';
import { ShieldCheck } from 'lucide-react';

interface Scene3RecoveryMomentsProps {
  moments: RecoveryMomentCard[];
}

export const Scene3RecoveryMoments: React.FC<Scene3RecoveryMomentsProps> = ({ moments }) => {
  const displayMoments = moments && moments.length > 0 ? moments : [];

  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-4xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/20 bg-violet-500/10 text-xs font-mono tracking-wider text-violet-300 mb-3">
          <ShieldCheck size={13} />
          <span>Verified Traceability</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          Recovery Moments
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          These aren&apos;t fabricated milestones. They are real pauses you chose when your day demanded attention.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {displayMoments.map((m) => (
          <MemoryCard
            key={m.id}
            title={m.title}
            date={m.date}
            category={m.category}
            whyItMattered={m.why_it_mattered}
            iconType={m.icon_type}
          />
        ))}
      </div>
    </div>
  );
};
