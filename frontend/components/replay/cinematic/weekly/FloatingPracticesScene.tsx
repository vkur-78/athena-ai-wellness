'use client';

import React from 'react';
import { Wind, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

interface FloatingPractice {
  title: string;
  category: string;
  impactNote: string;
  supportingEvidence: string;
  icon: 'wind' | 'heart' | 'sparkles';
}

const PRACTICES: FloatingPractice[] = [
  {
    title: 'Desk Relief',
    category: 'Somatic Reset',
    impactNote: 'Relieved cervical tension after concentrated afternoon work blocks.',
    supportingEvidence: 'Calm index increased by +18% on days you took a 3-minute desk pause.',
    icon: 'wind',
  },
  {
    title: 'Mindful Breathing',
    category: 'Vagal Tone',
    impactNote: 'Paced breathing restored parasympathetic balance before evening transitions.',
    supportingEvidence: 'Logged 4 sessions with 100% completion in Sakura Garden.',
    icon: 'heart',
  },
  {
    title: 'Space Reflection',
    category: 'Expressive Writing',
    impactNote: 'Writing unhurried sentences cleared residual work thoughts before sleep.',
    supportingEvidence: 'Tension dropped from 4/5 to 1/5 following night journal entries.',
    icon: 'sparkles',
  },
];

export const FloatingPracticesScene: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full min-h-[65vh] select-none animate-replay-fade">
      <header className="mb-6 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300/80">
          Chapter 6 — What Helped You
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-tight">
          Floating Glass Practices
        </h2>
        <p className="text-xs sm:text-sm font-serif text-slate-400 max-w-md mx-auto">
          These three practices provided verifiable nervous system recovery when demand crested.
        </p>
      </header>

      {/* Floating Glass Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full my-4">
        {PRACTICES.map((p, idx) => (
          <div
            key={p.title}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-2xl transition-all duration-700 hover:border-indigo-400/40 hover:-translate-y-2 shadow-2xl flex flex-col justify-between text-left animate-replay-slide-up"
            style={{ animationDelay: `${idx * 200}ms` }}
          >
            {/* Subtle glow behind card */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">
                  {p.category}
                </span>
                <div className="h-7 w-7 rounded-xl bg-white/5 flex items-center justify-center text-indigo-300 border border-white/5">
                  {p.icon === 'wind' ? <Wind size={13} /> : p.icon === 'heart' ? <Heart size={13} /> : <Sparkles size={13} />}
                </div>
              </div>

              <h3 className="text-lg font-serif font-medium text-white group-hover:text-indigo-200 transition-colors">
                {p.title}
              </h3>

              <p className="text-xs font-serif text-slate-300 leading-relaxed">
                {p.impactNote}
              </p>
            </div>

            {/* Evidence Callout */}
            <div className="mt-5 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-1">
                Supporting Evidence
              </span>
              <p className="text-[11px] font-serif italic text-teal-200/90 leading-relaxed">
                &ldquo;{p.supportingEvidence}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
