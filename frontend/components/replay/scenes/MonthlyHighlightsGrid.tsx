'use client';

import React from 'react';
import { HighlightsGrid } from '@/types/replay';
import { Sparkles, Download, Share2, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface MonthlyHighlightsGridProps {
  highlights: HighlightsGrid;
  pdfExportUrl?: string;
  onRestartReplay: () => void;
  onOpenShareModal: () => void;
}

export const MonthlyHighlightsGrid: React.FC<MonthlyHighlightsGridProps> = ({
  highlights,
  pdfExportUrl,
  onRestartReplay,
  onOpenShareModal,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-4xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/20 bg-amber-500/10 text-xs font-mono tracking-wider text-amber-300 mb-3">
          <Sparkles size={13} />
          <span>Collectible Keepsakes</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          Your Sanctuary Keepsakes
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-2 max-w-md mx-auto">
          Quiet tokens of the ground you held. Collectible memories preserved without clinical ratings.
        </p>
      </header>

      {/* Collectible 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
        {/* Card 1: Favorite Sanctuary */}
        <div className="group relative overflow-hidden rounded-3xl border border-teal-500/20 bg-slate-900/80 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-teal-400/40 hover:-translate-y-1 shadow-lg shadow-teal-950/20 text-center flex flex-col justify-between">
          <div className="h-1.5 w-12 mx-auto rounded-full bg-teal-400/40 mb-4" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-300/80 block mb-1">
              Favorite Sanctuary
            </span>
            <p className="text-lg font-serif font-medium text-white group-hover:text-teal-200 transition-colors">
              {highlights.favorite_sanctuary}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-serif text-slate-400">
            A slow refuge for your breath
          </div>
        </div>

        {/* Card 2: Longest Calm Streak */}
        <div className="group relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-indigo-400/40 hover:-translate-y-1 shadow-lg shadow-indigo-950/20 text-center flex flex-col justify-between">
          <div className="h-1.5 w-12 mx-auto rounded-full bg-indigo-400/40 mb-4" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300/80 block mb-1">
              Longest Calm Streak
            </span>
            <p className="text-lg font-serif font-medium text-white group-hover:text-indigo-200 transition-colors">
              {highlights.longest_calm_streak}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-serif text-slate-400">
            Steady ground held with grace
          </div>
        </div>

        {/* Card 3: Reflection Day */}
        <div className="group relative overflow-hidden rounded-3xl border border-violet-500/20 bg-slate-900/80 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-1 shadow-lg shadow-violet-950/20 text-center flex flex-col justify-between">
          <div className="h-1.5 w-12 mx-auto rounded-full bg-violet-400/40 mb-4" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-300/80 block mb-1">
              Reflection Window
            </span>
            <p className="text-lg font-serif font-medium text-white group-hover:text-violet-200 transition-colors">
              {highlights.reflection_day}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-serif text-slate-400">
            When words flowed most naturally
          </div>
        </div>

        {/* Card 4: Quiet Victory */}
        <div className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900/80 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-1 shadow-lg shadow-amber-950/20 text-center flex flex-col justify-between">
          <div className="h-1.5 w-12 mx-auto rounded-full bg-amber-400/40 mb-4" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 block mb-1">
              Quiet Victory
            </span>
            <p className="text-lg font-serif font-medium text-white group-hover:text-amber-200 transition-colors">
              {highlights.quiet_victory}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-serif text-slate-400">
            Resilience defined by returning
          </div>
        </div>
      </div>

      {/* Keepsake Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/10 w-full">
        {pdfExportUrl && (
          <a
            href={pdfExportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-serif font-medium border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <Download size={14} />
            <span>Download PDF Keepsake</span>
          </a>
        )}

        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-serif font-medium shadow-lg shadow-violet-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Share2 size={14} />
          <span>Share Keepsake Preview</span>
        </button>

        <button
          onClick={onRestartReplay}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-serif border border-slate-800 transition-all cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Replay Story</span>
        </button>

        <Link
          href="/replay"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-serif border border-slate-800 transition-all"
        >
          <Home size={14} />
          <span>Replay Archive</span>
        </Link>
      </div>
    </div>
  );
};
