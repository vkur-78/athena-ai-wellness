'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Play, Compass, Heart, ArrowRight } from 'lucide-react';
import { fetchReplayArchive, fetchLivingReplay } from '@/lib/replayApi';
import { ReplayArchiveItem, LivingReplayData } from '@/types/replay';
import { CinematicEventPlayer } from '@/components/replay/cinematic/CinematicEventPlayer';

export default function ReplayArchiveSection() {
  const [archive, setArchive] = useState<ReplayArchiveItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [activeReplay, setActiveReplay] = useState<LivingReplayData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReplayArchive()
      .then((items) => setArchive(items))
      .catch((e) => console.warn('Failed to load archive:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenReplay = async (item: ReplayArchiveItem) => {
    try {
      setLoading(true);
      const data = await fetchLivingReplay(item.type, item.id);
      setActiveReplay(data);
    } catch (e) {
      console.warn('Failed to open replay:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = archive.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <section aria-label="Replay Archive" className="space-y-6 pt-6 border-t border-inherit">
      {/* Fullscreen Player Modal if active */}
      {activeReplay && (
        <CinematicEventPlayer
          replay={activeReplay}
          onExit={() => setActiveReplay(null)}
        />
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">
            <Sparkles size={13} />
            <span>Living Replay Archive</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold tracking-tight">
            Past Weekly Chapters &amp; Monthly Stories
          </h2>
          <p className="text-xs sm:text-sm font-serif text-slate-400 mt-1 max-w-xl">
            Replays are preserved automatically every Sunday and month-end. Tap any past story to relive your emotional cadence in full-screen cinematic playback.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/5 p-1 rounded-2xl border border-inherit shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Stories
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              filter === 'weekly'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setFilter('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              filter === 'monthly'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </header>

      {/* Archive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenReplay(item)}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 hover:bg-slate-900/90 hover:border-violet-500/40 p-5 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-violet-950/30 flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                  {item.type === 'weekly' ? 'Weekly Story' : 'Monthly Odyssey'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {item.period_display}
                </span>
              </div>

              <h3 className="text-lg font-serif font-medium text-white group-hover:text-violet-200 transition-colors leading-snug">
                {item.season_title}
              </h3>

              <div className="flex items-center gap-3 text-xs font-serif text-slate-400 pt-1">
                <span>Mood: <strong className="text-teal-300 capitalize">{item.dominant_mood}</strong></span>
                <span>•</span>
                <span>{item.active_days} active days</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-serif text-violet-300 group-hover:text-violet-200">
              <div className="flex items-center gap-1.5">
                <Play size={11} className="fill-current" />
                <span>Experience Replay</span>
              </div>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
