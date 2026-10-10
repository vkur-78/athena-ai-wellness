'use client';

import React from 'react';
import { Feather, Wind, Heart, Sparkles } from 'lucide-react';
import { MemoryCardProps } from '@/types/replay';

export const MemoryCard: React.FC<MemoryCardProps> = ({
  title,
  date,
  category = 'Sanctuary Pause',
  whyItMattered,
  iconType = 'feather',
  className = '',
}) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'wind':
        return <Wind size={18} className="text-teal-300" />;
      case 'heart':
        return <Heart size={18} className="text-rose-300" />;
      case 'sparkles':
        return <Sparkles size={18} className="text-amber-300" />;
      case 'feather':
      default:
        return <Feather size={18} className="text-violet-300" />;
    }
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-violet-400/30 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-violet-950/40 animate-replay-slide-up ${className}`}
    >
      {/* Subtle Glow Aura behind card */}
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-600/10 blur-3xl transition-opacity group-hover:bg-violet-600/20" />

      <header className="relative z-10 flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-inner">
            {renderIcon()}
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-violet-300/80">
              {category}
            </span>
            <p className="text-xs text-slate-400 font-serif">{date}</p>
          </div>
        </div>
      </header>

      <div className="relative z-10 space-y-2.5">
        <h3 className="text-lg font-serif font-medium tracking-tight text-white/95 group-hover:text-violet-100 transition-colors">
          {title}
        </h3>
        <p className="text-sm font-serif leading-relaxed text-slate-300/90">
          {whyItMattered}
        </p>
      </div>

      <footer className="relative z-10 mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-serif">
        <span>Verified stored moment</span>
        <span className="text-violet-400/80">Preserved gently</span>
      </footer>
    </article>
  );
};
