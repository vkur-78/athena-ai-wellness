'use client';

import React, { useState } from 'react';
import { Chapter2Rhythm as RhythmType } from '@/types/replay';

interface Chapter2RhythmProps {
  rhythm: RhythmType;
}

export const Chapter2Rhythm: React.FC<Chapter2RhythmProps> = ({ rhythm }) => {
  const [activeTab, setActiveTab] = useState<'wave' | 'river' | 'heatmap' | 'constellation'>('wave');

  // SVG dimensions for Energy Wave
  const waveWidth = 560;
  const waveHeight = 200;
  const wavePoints = rhythm.energy_wave || [];

  const svgCoords = wavePoints.map((pt, idx) => {
    const x = wavePoints.length > 1 ? (idx / (wavePoints.length - 1)) * (waveWidth - 80) + 40 : waveWidth / 2;
    // Map energy 1-10 to Y coordinate (inverted)
    const y = waveHeight - ((pt.energy_level || 5) / 10) * (waveHeight - 60) - 30;
    return { x, y, pt };
  });

  const wavePathD = svgCoords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = svgCoords[idx - 1];
    const midX = (prev.x + curr.x) / 2;
    return `${acc} C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter II • Emotional Rhythm</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-6">
        How Your Energy Flowed This Month
      </h2>

      {/* Rhythm Sub-Nav Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {[
          { key: 'wave', label: 'Energy Wave', icon: '🌊' },
          { key: 'river', label: 'Recovery River', icon: '🛶' },
          { key: 'heatmap', label: 'Time Heatmap', icon: '⏳' },
          { key: 'constellation', label: 'Studio Constellation', icon: '✨' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 scale-105'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Energy Wave */}
      {activeTab === 'wave' && (
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
          <p className="text-xs text-slate-400 font-serif mb-6 text-left">
            A continuous wave of emotional stability, calm, and recovery across your month.
          </p>

          <div className="overflow-x-auto">
            <svg
              width={waveWidth}
              height={waveHeight}
              viewBox={`0 0 ${waveWidth} ${waveHeight}`}
              className="mx-auto overflow-visible"
            >
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              {wavePathD && (
                <path
                  d={`${wavePathD} L ${svgCoords[svgCoords.length - 1].x} ${waveHeight} L ${svgCoords[0].x} ${waveHeight} Z`}
                  fill="url(#waveGrad)"
                />
              )}

              {/* Curve Stroke */}
              {wavePathD && (
                <path
                  d={wavePathD}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {svgCoords.map((coord, i) => (
                <g key={i} className="group">
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="5"
                    fill="#ede9fe"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                  <text
                    x={coord.x}
                    y={coord.y - 12}
                    textAnchor="middle"
                    fill="#c4b5fd"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {coord.pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left">
            {wavePoints.map((pt, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                <span className="font-semibold text-violet-300">{pt.label}:</span>{' '}
                <span className="text-slate-300">{pt.reflection}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Recovery River */}
      {activeTab === 'river' && (
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl text-left">
          <p className="text-xs text-slate-400 font-serif mb-6">
            The gentle steps your nervous system traveled to recover from moments of overwhelm.
          </p>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-violet-500/30">
            {rhythm.recovery_river.map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-violet-400 group-hover:scale-125 transition-transform" />
                <h4 className="text-sm font-semibold text-violet-200">{step.step}</h4>
                <p className="text-xs sm:text-sm text-slate-300 font-serif mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Time Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
          <p className="text-xs text-slate-400 font-serif mb-6 text-left">
            When you sought calm and self-connection throughout your days.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(rhythm.time_heatmap || {}).map(([timeSlot, desc]) => (
              <div
                key={timeSlot}
                className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex flex-col items-center text-center"
              >
                <span className="text-2xl mb-2">
                  {timeSlot === 'morning' ? '🌅' : timeSlot === 'afternoon' ? '☀️' : timeSlot === 'evening' ? '🌆' : '🌙'}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  {timeSlot}
                </span>
                <span className="text-xs text-violet-400/90 font-serif">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Studio Constellation */}
      {activeTab === 'constellation' && (
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
          <p className="text-xs text-slate-400 font-serif mb-6 text-left">
            Each star represents a practice you grounded yourself in this month.
          </p>

          <div className="relative h-64 w-full rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden">
            {/* SVG Connecting lines between constellation stars */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {rhythm.constellation.map((star, idx) => {
                if (idx === 0) return null;
                const prev = rhythm.constellation[idx - 1];
                return (
                  <line
                    key={idx}
                    x1={`${prev.x}%`}
                    y1={`${prev.y}%`}
                    x2={`${star.x}%`}
                    y2={`${star.y}%`}
                    stroke="rgba(167, 139, 250, 0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </svg>

            {/* Stars */}
            {rhythm.constellation.map((star, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${star.x}%`, top: `${star.y}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-violet-300 animate-pulse shadow-[0_0_12px_4px_rgba(167,139,250,0.6)] group-hover:scale-150 transition-transform" />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-200 pointer-events-none z-10 shadow-lg">
                  {star.practice_name} ({star.times}x)
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-slate-400">
            {rhythm.constellation.map((star, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                ✦ {star.practice_name} ({star.times}x)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
