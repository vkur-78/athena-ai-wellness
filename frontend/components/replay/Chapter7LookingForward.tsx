'use client';

import React, { useState } from 'react';
import { getMonthlyReplayPdfUrl } from '@/lib/replayApi';

interface Chapter7LookingForwardProps {
  data: {
    letter?: string;
    focus_area?: string;
    quote?: string;
    [key: string]: string | undefined;
  };
  userName: string;
  month: string;
  onRestart: () => void;
}

export const Chapter7LookingForward: React.FC<Chapter7LookingForwardProps> = ({
  data,
  userName,
  month,
  onRestart,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    const url = getMonthlyReplayPdfUrl('default_user', month);
    window.open(url, '_blank');
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-6 py-10 text-center animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono uppercase tracking-widest mb-6">
        <span>Chapter VII • Keepsake Ending</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-100 tracking-tight mb-3">
        Carrying This Quiet Strength Forward
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 font-serif mb-8">
        A closing letter from Athena to you.
      </p>

      {/* Closing Card */}
      <div className="w-full p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl text-left space-y-6">
        <p className="text-base sm:text-lg text-slate-200 font-serif leading-relaxed italic">
          &ldquo;{data.closing_letter || data.letter || 'Thank you for giving yourself permission to show up exactly as you were this month.'}&rdquo;
        </p>

        {data.quote && (
          <div className="pt-6 border-t border-slate-800/80">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">Guiding Words</span>
            <p className="text-sm sm:text-base text-emerald-300/90 font-serif mt-1">
              "{data.quote}"
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-slate-950 font-semibold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{isDownloading ? 'Preparing your Sanctuary Report...' : 'Download Sanctuary PDF'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Replay From Beginning
          </button>
        </div>
      </div>
    </div>
  );
};
