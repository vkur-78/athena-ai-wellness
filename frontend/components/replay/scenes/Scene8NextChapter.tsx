'use client';

import React from 'react';
import Link from 'next/link';
import { NextChapterItem } from '@/types/replay';
import { Compass, ArrowRight } from 'lucide-react';

interface Scene8NextChapterProps {
  suggestions: NextChapterItem[];
}

export const Scene8NextChapter: React.FC<Scene8NextChapterProps> = ({ suggestions }) => {
  const items = suggestions && suggestions.length > 0 ? suggestions : [];

  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 max-w-4xl mx-auto w-full animate-replay-fade">
      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-400/20 bg-teal-500/10 text-xs font-mono tracking-wider text-teal-300 mb-3">
          <Compass size={13} />
          <span>Gentle Next Chapter</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
          Invitations for Tomorrow
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-md mx-auto">
          No demands, no rigid resolutions. Just three subtle places to step into when you need stillness.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-2xl transition-all duration-300 hover:border-teal-400/30 hover:bg-slate-900/95 flex flex-col justify-between animate-replay-slide-up"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal-300/80 block">
                Adaptive Step
              </span>
              <h3 className="text-lg font-serif font-medium text-white group-hover:text-teal-100 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm font-serif text-slate-300 leading-relaxed">
                {item.suggestion}
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-white/5">
              <Link
                href={item.action_route}
                className="inline-flex items-center gap-2 text-xs font-serif text-teal-300 hover:text-teal-200 transition-colors group/link"
              >
                <span>{item.action_label}</span>
                <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
