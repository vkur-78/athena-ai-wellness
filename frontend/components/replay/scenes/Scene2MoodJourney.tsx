'use client';

import React, { useState } from 'react';
import { MoodJourneyFlowPoint } from '@/types/replay';
import { Activity, Sparkles, Heart } from 'lucide-react';

interface Scene2MoodJourneyProps {
  moodJourney: MoodJourneyFlowPoint[];
}

export const Scene2MoodJourney: React.FC<Scene2MoodJourneyProps> = ({ moodJourney }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = moodJourney && moodJourney.length > 0 ? moodJourney : [];
  const count = points.length || 7;

  // Compute normalized coordinates for the SVG Ribbon
  const width = 800;
  const height = 240;
  const paddingX = 60;
  const paddingY = 40;

  const getX = (index: number) => {
    if (count <= 1) return width / 2;
    return paddingX + (index / (count - 1)) * (width - paddingX * 2);
  };

  const getY = (calmLevel: number) => {
    // Invert: higher calm score (e.g. 95) = higher vertically (lower Y)
    const minScore = 50;
    const maxScore = 100;
    const normalized = Math.max(0, Math.min(1, (calmLevel - minScore) / (maxScore - minScore)));
    return height - paddingY - normalized * (height - paddingY * 2);
  };

  // Build SVG path command with smooth cubic Bézier curves
  const buildRibbonPath = () => {
    if (points.length === 0) return '';
    const coords = points.map((p, idx) => ({ x: getX(idx), y: getY(p.calm_level) }));

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const mx = (p0.x + p1.x) / 2;
      path += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  // Build closed area under the ribbon for luminous gradient fill
  const buildAreaPath = () => {
    if (points.length === 0) return '';
    const linePath = buildRibbonPath();
    const lastX = getX(points.length - 1);
    const firstX = getX(0);
    return `${linePath} L ${lastX} ${height} L ${firstX} ${height} Z`;
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-4xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-400/20 bg-teal-500/10 text-xs font-mono tracking-wider text-teal-300 mb-3">
          <Activity size={13} />
          <span>Emotional Movement</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          Your Flowing Ribbon
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          Hover across the ribbon to see how your nervous system gradually settled through the days.
        </p>
      </header>

      {/* Ribbon Visualization Canvas Card */}
      <div className="relative w-full rounded-3xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-teal-500/10 blur-[90px] pointer-events-none" />

        <div className="relative w-full overflow-x-auto scrollbar-none">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[550px] overflow-visible"
          >
            <defs>
              {/* Vertical Gradient for Area */}
              <linearGradient id="ribbonAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
              </linearGradient>

              {/* Horizontal Gradient for Flowing Ribbon Line */}
              <linearGradient id="ribbonStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" />     {/* Overwhelmed / Tension */}
                <stop offset="25%" stopColor="#fbbf24" />    {/* Steadying */}
                <stop offset="50%" stopColor="#38bdf8" />    {/* Reflective */}
                <stop offset="75%" stopColor="#2dd4bf" />    {/* Calmer */}
                <stop offset="100%" stopColor="#a78bfa" />   {/* Peaceful */}
              </linearGradient>

              <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Glowing Gradient Fill under the Ribbon */}
            <path d={buildAreaPath()} fill="url(#ribbonAreaGrad)" />

            {/* Main Glowing Ribbon Path */}
            <path
              d={buildRibbonPath()}
              fill="none"
              stroke="url(#ribbonStrokeGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              filter="url(#ribbonGlow)"
              className="transition-all duration-300"
            />

            {/* Interactive Day Node Pins */}
            {points.map((p, idx) => {
              const x = getX(idx);
              const y = getY(p.calm_level);
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onClick={() => setHoveredIndex(idx)}
                >
                  {/* Subtle vertical indicator line */}
                  <line
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={height - 25}
                    stroke={isHovered ? '#818cf8' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isHovered ? '1.5' : '1'}
                    strokeDasharray={isHovered ? 'none' : '3,3'}
                    className="transition-colors"
                  />

                  {/* Pulsing circle node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 8 : 5}
                    fill={isHovered ? '#ffffff' : '#a78bfa'}
                    stroke="#1e1b4b"
                    strokeWidth="2.5"
                    className="transition-all duration-200 group-hover:scale-125"
                  />

                  {/* Day Label at bottom of ribbon */}
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#94a3b8'}
                    fontSize="11"
                    fontFamily="monospace"
                    className="transition-colors uppercase font-medium select-none"
                  >
                    {p.day_label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected / Hovered Day Spotlight Details */}
        {activePoint && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 animate-replay-fade">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-400/20 text-teal-300">
                <Heart size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-serif font-medium text-white">
                    {activePoint.day_label} • {activePoint.date}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize bg-white/10 text-teal-200">
                    {activePoint.mood}
                  </span>
                </div>
                <p className="text-xs font-serif text-slate-300 italic mt-0.5">
                  &ldquo;{activePoint.reflection_snippet || 'Maintained mindful rhythm.'}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block uppercase">Calm Index</span>
                <span className="text-xl font-serif font-semibold text-teal-300">
                  {activePoint.calm_level}%
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block uppercase">Tension</span>
                <span className="text-sm font-serif font-medium text-slate-300">
                  {activePoint.tension}/5
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
