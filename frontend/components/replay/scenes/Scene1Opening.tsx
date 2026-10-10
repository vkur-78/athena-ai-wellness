'use client';

import React from 'react';
import { OpeningSceneData } from '@/types/replay';
import { Sparkles } from 'lucide-react';

interface Scene1OpeningProps {
  scene: OpeningSceneData;
  userName?: string;
  replayType?: 'weekly' | 'monthly';
  onBegin?: () => void;
}

export const Scene1Opening: React.FC<Scene1OpeningProps> = ({
  scene,
  replayType = 'weekly',
  onBegin,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 sm:px-8 max-w-2xl mx-auto min-h-[50vh] animate-replay-fade">
      {/* Soft Ambient Radial Background */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-violet-600/10 blur-[110px] animate-thought-breathe" />
      </div>

      {/* Season Title Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 text-xs font-mono tracking-wider text-violet-300 mb-6 backdrop-blur-md">
        <Sparkles size={12} />
        <span>{scene.season_title}</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400 capitalize">{replayType} Replay</span>
      </div>

      {/* Main Time-Aware Greeting */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight mb-4 animate-replay-slide-up">
        {scene.greeting}
      </h1>

      {/* Period Display */}
      <p className="text-sm font-serif text-slate-400 mb-8 tracking-wide">
        {scene.period_display}
      </p>

      {/* Quiet Opening Quote */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl max-w-lg mb-8 shadow-xl shadow-black/20">
        <p className="text-base sm:text-lg font-serif italic text-slate-200 leading-relaxed">
          &ldquo;{scene.quote}&rdquo;
        </p>
      </div>

      {onBegin && (
        <button
          onClick={onBegin}
          className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium tracking-wide transition-all shadow-lg shadow-violet-600/25 hover:scale-105 active:scale-95 cursor-pointer"
        >
          Begin The Story
        </button>
      )}
    </div>
  );
};
