'use client';

import React, { useState } from 'react';
import { SanctuaryWorldData } from '@/types/replay';
import { Compass, Clock, Mic, Eye, Sparkles } from 'lucide-react';

interface MiniatureWorldsSceneProps {
  worldData: SanctuaryWorldData;
}

interface MiniWorld {
  name: string;
  themeColor: string;
  glowColor: string;
  elementSymbol: string;
  description: string;
}

const MINI_WORLDS: MiniWorld[] = [
  {
    name: 'Sakura Garden',
    themeColor: 'from-pink-900/50 via-rose-950/70 to-slate-950',
    glowColor: 'bg-pink-500/20',
    elementSymbol: '🌸',
    description: 'Drifting petals and gentle breeze attuned to your breath.',
  },
  {
    name: 'Campfire Valley',
    themeColor: 'from-amber-900/50 via-orange-950/70 to-slate-950',
    glowColor: 'bg-amber-500/20',
    elementSymbol: '🔥',
    description: 'Warm crackling embers beside quiet mountain pines.',
  },
  {
    name: 'Ancient Forest',
    themeColor: 'from-emerald-900/50 via-teal-950/70 to-slate-950',
    glowColor: 'bg-emerald-500/20',
    elementSymbol: '🌲',
    description: 'Moss-covered cedar woods holding timeless calm.',
  },
];

export const MiniatureWorldsScene: React.FC<MiniatureWorldsSceneProps> = ({ worldData }) => {
  const [selectedWorldIndex, setSelectedWorldIndex] = useState<number>(0);
  const currentWorld = MINI_WORLDS[selectedWorldIndex] || MINI_WORLDS[0];

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      <header className="mb-6 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-teal-300/80">
          Chapter 5 — Sanctuary Odyssey
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          Miniature Sanctuary Worlds
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 max-w-md mx-auto">
          Attuned environments that supported your nervous system when the world was loud.
        </p>
      </header>

      {/* Main Miniature Rotating World Orb */}
      <div className="relative flex flex-col items-center justify-center my-4 w-full max-w-lg">
        {/* Soft World Orb with Cinematic Lighting */}
        <div className={`relative h-44 w-44 sm:h-52 sm:w-52 rounded-full border border-white/20 bg-gradient-to-tr ${currentWorld.themeColor} shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-700 animate-thought-breathe`}>
          {/* Ambient Inner Orb Halo */}
          <div className={`absolute inset-0 ${currentWorld.glowColor} blur-2xl rounded-full`} />

          {/* Miniature 3D Floating Element */}
          <div className="relative z-10 text-5xl sm:text-6xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] animate-float-particle">
            {currentWorld.elementSymbol}
          </div>
        </div>

        {/* World Name and Description */}
        <div className="mt-5 space-y-1">
          <h3 className="text-xl sm:text-2xl font-serif font-medium text-white">
            {worldData.favorite_world || currentWorld.name}
          </h3>
          <p className="text-xs sm:text-sm font-serif italic text-teal-200/80">
            {currentWorld.description}
          </p>
        </div>

        {/* World Metrics Row */}
        <div className="grid grid-cols-3 gap-3 w-full mt-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center justify-center text-teal-300 mb-1">
              <Clock size={14} />
            </div>
            <span className="block text-base font-serif font-medium text-white">
              {worldData.total_minutes}m
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Total Time
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center justify-center text-teal-300 mb-1">
              <Mic size={14} />
            </div>
            <span className="block text-base font-serif font-medium text-white truncate">
              {worldData.preferred_voice || 'Nova'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Guide Voice
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center justify-center text-teal-300 mb-1">
              <Eye size={14} />
            </div>
            <span className="block text-base font-serif font-medium text-white truncate">
              {worldData.preferred_camera || 'First Person'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Perspective
            </span>
          </div>
        </div>

        {/* World Selectors */}
        <div className="flex items-center gap-2 mt-4">
          {MINI_WORLDS.map((w, idx) => (
            <button
              key={w.name}
              onClick={() => setSelectedWorldIndex(idx)}
              className={`px-3 py-1 rounded-full text-[11px] font-serif border transition-all cursor-pointer ${
                selectedWorldIndex === idx
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'bg-transparent border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
