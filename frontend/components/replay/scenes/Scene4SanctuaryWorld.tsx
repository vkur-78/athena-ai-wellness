'use client';

import React from 'react';
import { SanctuaryWorldData } from '@/types/replay';
import { StudioCard } from '../cards/StudioCard';
import { Compass } from 'lucide-react';

interface Scene4SanctuaryWorldProps {
  worldData: SanctuaryWorldData;
}

export const Scene4SanctuaryWorld: React.FC<Scene4SanctuaryWorldProps> = ({ worldData }) => {
  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-3xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-400/20 bg-teal-500/10 text-xs font-mono tracking-wider text-teal-300 mb-3">
          <Compass size={13} />
          <span>Sanctuary Haven</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          Where You Rested
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          The sanctuary environment that supported your mind when the world was loud.
        </p>
      </header>

      <div className="w-full">
        <StudioCard
          world={worldData.favorite_world}
          totalMinutes={worldData.total_minutes}
          sessionsCount={worldData.sessions_count}
          preferredVoice={worldData.preferred_voice}
          preferredPerspective={worldData.preferred_camera}
          narrative={worldData.completion_rate_narrative}
          ambienceNote={worldData.world_ambience_note}
        />
      </div>
    </div>
  );
};
