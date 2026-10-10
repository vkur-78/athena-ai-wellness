'use client';

import React from 'react';
import { EmotionalRhythmData } from '@/types/replay';
import { PatternCard } from '../cards/PatternCard';
import { Sparkles } from 'lucide-react';

interface Scene6EmotionalRhythmProps {
  rhythmData: EmotionalRhythmData;
}

export const Scene6EmotionalRhythm: React.FC<Scene6EmotionalRhythmProps> = ({ rhythmData }) => {
  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-3xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-500/10 text-xs font-mono tracking-wider text-indigo-300 mb-3">
          <Sparkles size={13} />
          <span>Behavior Correlation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          Your Natural Rhythm
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          Athena quietly observes how your days unfold to reflect your truest windows of restoration.
        </p>
      </header>

      <div className="w-full">
        <PatternCard
          title="Strongest Verified Pattern"
          discovery={rhythmData.rhythm_narrative}
          whyNoticed={rhythmData.why_noticed}
          evidence={rhythmData.evidence}
          confidence={rhythmData.confidence_wording}
        />
      </div>
    </div>
  );
};
