'use client';

import React from 'react';
import { Chapter1Story as StoryType } from '@/types/replay';

interface Chapter1StoryProps {
  story: StoryType;
  userName: string;
  monthDisplay: string;
}

export const Chapter1Story: React.FC<Chapter1StoryProps> = ({ story, userName, monthDisplay }) => {
  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-6 py-12 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-8">
        <span>Chapter II • Your Month&apos;s Story</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-slate-100 tracking-tight leading-tight mb-8">
        {story.headline}
      </h1>

      <div className="relative p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <p className="text-base sm:text-lg font-serif text-slate-300 leading-relaxed italic">
          "{story.narrative}"
        </p>

        <div className="mt-6 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Prepared for {userName}</span>
          <span>{monthDisplay}</span>
        </div>
      </div>
    </div>
  );
};
