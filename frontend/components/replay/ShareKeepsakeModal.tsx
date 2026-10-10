'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Feather, Sparkles } from 'lucide-react';
import { LivingReplayData } from '@/types/replay';

interface ShareKeepsakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  replay: LivingReplayData;
}

export const ShareKeepsakeModal: React.FC<ShareKeepsakeModalProps> = ({
  isOpen,
  onClose,
  replay,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const quote = replay.growth_reflection.headline;
  const snippet = replay.growth_reflection.key_takeaway;
  const season = replay.opening_scene.season_title;
  const world = replay.sanctuary_world.favorite_world;

  const shareText = `"${quote}"\n${snippet}\n\nSeason: ${season} • Sanctuary: ${world}\n— From my Athena Living Replay`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-replay-fade">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 sm:p-8 shadow-2xl animate-replay-slide-up text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <header className="flex items-center gap-2 text-violet-300 text-xs font-mono uppercase tracking-widest mb-4">
          <Feather size={14} />
          <span>Private Keepsake Card</span>
        </header>

        {/* Visual Keepsake Card Preview */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-inner relative overflow-hidden mb-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase text-violet-300">
              Athena Sanctuary
            </span>
            <span className="text-[10px] font-serif text-slate-400">
              {replay.period_display}
            </span>
          </div>

          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
            {season}
          </p>
          <h4 className="text-xl font-serif font-medium text-white mb-3">
            {quote}
          </h4>

          <p className="text-xs font-serif italic text-slate-300 leading-relaxed border-l-2 border-violet-400/50 pl-3 mb-4">
            &ldquo;{snippet}&rdquo;
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] font-serif text-slate-400">
            <span>Resting in {world}</span>
            <span className="text-violet-300 flex items-center gap-1">
              <Sparkles size={11} />
              Gently Preserved
            </span>
          </div>
        </div>

        {/* Privacy Assurance Note */}
        <p className="text-[11px] font-serif text-slate-400 leading-relaxed mb-6">
          Athena never shares your raw conversation text or journal paragraphs. Only high-level grounded reflections are synthesized into your keepsakes.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-lg shadow-violet-600/25 cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied Keepsake' : 'Copy Keepsake Text'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
