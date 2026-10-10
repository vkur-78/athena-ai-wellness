'use client';

import React from 'react';
import { OpeningLetter } from '@/types/replay';

interface OpeningLetterChapterProps {
  letter?: OpeningLetter;
  userName: string;
  monthDisplay: string;
  onBegin: () => void;
}

export const OpeningLetterChapter: React.FC<OpeningLetterChapterProps> = ({
  letter,
  userName,
  monthDisplay,
  onBegin,
}) => {
  const quote = letter?.quote || 'Before we begin, thank you for letting me walk beside you this month.';
  const body = letter?.letter || `You showed up to meet yourself without needing to prove anything, ${userName}. These chapters reflect the honest ground you held.`;

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-12 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-8">
        <span>Chapter I • Opening Letter</span>
      </div>

      <div className="relative p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6 text-left">
        <h2 className="text-xl sm:text-2xl font-serif text-slate-100 italic leading-relaxed text-center">
          &ldquo;{quote}&rdquo;
        </h2>

        <div className="w-16 h-0.5 bg-indigo-500/30 mx-auto" />

        <p className="text-base sm:text-lg font-serif text-slate-300 leading-relaxed">
          {body}
        </p>

        <p className="text-xs text-indigo-400/80 font-mono text-center pt-2">
          An unhurried recollection of {monthDisplay} • Generated solely from verified moments
        </p>

        <div className="pt-6 border-t border-slate-800/60 flex justify-center">
          <button
            onClick={onBegin}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
          >
            <span>Begin Your Replay</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
