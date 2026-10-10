'use client';

import React, { useState } from 'react';
import { RecoveryMomentCard } from '@/types/replay';
import { Sparkles, Droplets } from 'lucide-react';

interface EmotionalRiverSceneProps {
  moments?: RecoveryMomentCard[];
}

export const EmotionalRiverScene: React.FC<EmotionalRiverSceneProps> = ({ moments = [] }) => {
  const [activeRipple, setActiveRipple] = useState<number | null>(null);

  const displayMoments = moments.length > 0 ? moments.slice(0, 3) : [
    { id: '1', title: 'Desk Relief in Sakura Garden', date: 'Thu', category: 'Studio', why_it_mattered: 'Let your nervous system decompress after demanding afternoon calls.' },
    { id: '2', title: 'Space Journal Entry', date: 'Wed', category: 'Journal', why_it_mattered: 'Words created breathing space between thoughts.' },
    { id: '3', title: 'Evening Mindful Breath', date: 'Fri', category: 'Sanctuary', why_it_mattered: 'Three minutes protected your evening sleep.' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      <header className="mb-6 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-teal-300/80">
          Chapter 3 — Emotional River
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          The Flowing Cadence
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 max-w-md mx-auto">
          Replacing static charts with an organic river that softened from tension into golden stillness.
        </p>
      </header>

      {/* Animated Organic Flowing River Canvas */}
      <div className="relative w-full rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-2xl shadow-2xl overflow-hidden my-4">
        {/* Shifting Ambient Gradient River */}
        <svg
          viewBox="0 0 900 280"
          className="w-full h-auto min-w-[600px] overflow-visible"
        >
          <defs>
            {/* River Color Shift: Deep Blue -> Purple -> Restorative Gold */}
            <linearGradient id="riverGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />    {/* Blue */}
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.85" />   {/* Purple */}
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />   {/* Gold */}
            </linearGradient>

            <linearGradient id="riverBankGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.6" />
            </linearGradient>

            <filter id="riverGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* River Basin Fill */}
          <path
            d="M 0 140 Q 220 80 450 150 T 900 130 L 900 280 L 0 280 Z"
            fill="url(#riverBankGrad)"
          />

          {/* Main Meandering River Ribbon */}
          <path
            d="M 0 140 Q 220 80 450 150 T 900 130"
            fill="none"
            stroke="url(#riverGradient)"
            strokeWidth="38"
            strokeLinecap="round"
            filter="url(#riverGlow)"
            className="transition-all duration-700"
          />

          {/* Secondary Shimmer Wave */}
          <path
            d="M 0 145 Q 230 95 460 145 T 900 135"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.3"
            strokeDasharray="12,18"
            className="animate-thought-breathe"
          />

          {/* Interactive Ripple Points where verified recovery happened */}
          {displayMoments.map((m, idx) => {
            const positions = [
              { cx: 220, cy: 110 },
              { cx: 500, cy: 150 },
              { cx: 760, cy: 135 },
            ];
            const pos = positions[idx] || { cx: 450, cy: 140 };
            const isActive = activeRipple === idx;

            return (
              <g
                key={m.id || idx}
                className="cursor-pointer group"
                onClick={() => setActiveRipple(idx)}
                onMouseEnter={() => setActiveRipple(idx)}
              >
                {/* Expanding Ripple Rings */}
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={isActive ? 28 : 18}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeOpacity={isActive ? 0.8 : 0.4}
                  className="animate-ping"
                  style={{ animationDuration: '3s', animationDelay: `${idx * 0.8}s` }}
                />

                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={isActive ? 12 : 7}
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="transition-all duration-300 group-hover:scale-125 shadow-lg shadow-amber-400/50"
                />

                <text
                  x={pos.cx}
                  y={pos.cy - 22}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="11"
                  fontFamily="monospace"
                  className="select-none uppercase font-semibold tracking-wider drop-shadow-md"
                >
                  {m.title.slice(0, 16)}...
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Ripple Narrative Note */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-left text-xs font-serif text-slate-300">
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-teal-400 shrink-0" />
            <span>
              {activeRipple !== null
                ? displayMoments[activeRipple]?.why_it_mattered
                : 'Click any gold ripple along the river to see the recovery moment that calmed the current.'}
            </span>
          </div>

          <span className="text-[10px] font-mono text-amber-300 shrink-0 uppercase tracking-widest">
            Verified Rhythm
          </span>
        </div>
      </div>
    </div>
  );
};
