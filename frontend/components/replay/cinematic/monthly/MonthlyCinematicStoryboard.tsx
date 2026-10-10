'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Droplets, Compass, MessageSquare, BookOpen, TreePine, Award, Lock, Check } from 'lucide-react';
import { LivingReplayData } from '@/types/replay';

interface MonthlyCinematicStoryboardProps {
  replay: LivingReplayData;
  onReturnHome: () => void;
  onReplay: () => void;
}

const MONTHLY_STORY_STEPS = [
  'Opening & Season Title',
  'Calendar Bloom',
  'The Extended River',
  'Studio Odyssey',
  'Speech Lights',
  'Space Reflections',
  'The Growing Tree',
  'Cadence Evolution',
  'Constellation Keepsake',
];

export const MonthlyCinematicStoryboard: React.FC<MonthlyCinematicStoryboardProps> = ({
  replay,
  onReturnHome,
  onReplay,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[75vh] w-full max-w-4xl mx-auto px-4 select-none animate-replay-fade text-slate-100">
      {/* Top Chapter Progress Breadcrumb */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 py-3 border-b border-white/5">
        <span className="text-violet-300 uppercase tracking-wider">
          Monthly Showcase • {MONTHLY_STORY_STEPS[currentStep - 1]}
        </span>
        <span>
          Step {currentStep} of {MONTHLY_STORY_STEPS.length}
        </span>
      </div>

      {/* Main Chapter Content Switcher */}
      <div className="flex-1 flex items-center justify-center w-full py-6">
        {/* Step 1: Opening & Month Title */}
        {currentStep === 1 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono uppercase bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {replay.period_display}
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-medium text-white tracking-tight leading-tight">
              {replay.opening_scene.season_title}
            </h1>
            <p className="text-base font-serif italic text-slate-300 leading-relaxed">
              &ldquo;{replay.opening_scene.greeting}&rdquo;
            </p>
          </div>
        )}

        {/* Step 2: Calendar Bloom */}
        {currentStep === 2 && (
          <div className="text-center space-y-6 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-teal-300">
              <Calendar size={13} />
              <span>Calendar Bloom • 30 Days</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              Every Day Held Softly
            </h2>
            <p className="text-xs sm:text-sm font-serif text-slate-400">
              Active days illuminated gently. Inactive days rested without judgment.
            </p>

            {/* 30-Day Bloom Grid */}
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 max-w-md mx-auto p-4 rounded-3xl bg-slate-900/60 border border-white/5">
              {Array.from({ length: 30 }).map((_, i) => {
                const isActive = (i * 7 + 3) % 4 !== 0; // Deterministic bloom
                return (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-mono transition-all duration-700 ${
                      isActive
                        ? 'bg-gradient-to-br from-teal-500/40 to-teal-900/60 border border-teal-400/50 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.3)]'
                        : 'bg-slate-900/40 border border-white/5 text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Extended River */}
        {currentStep === 3 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-indigo-300">
              <Droplets size={13} />
              <span>Downstream Cadence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              The Extended River
            </h2>
            <p className="text-xs sm:text-sm font-serif text-slate-300 leading-relaxed">
              Across September, high-tide work momentum consistently settled into evening recovery windows. The water shifted from reactive speed into steady golden stillness.
            </p>
            <div className="h-32 w-full rounded-3xl bg-gradient-to-r from-blue-600/30 via-purple-600/40 to-amber-500/40 border border-white/10 flex items-center justify-center p-6 shadow-2xl">
              <span className="font-serif italic text-sm text-amber-200">
                &ldquo;Evenings repeatedly became your sanctuary anchor.&rdquo;
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Studio Odyssey */}
        {currentStep === 4 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-teal-300">
              <Compass size={13} />
              <span>Studio Odyssey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              {replay.sanctuary_world.favorite_world}
            </h2>
            <p className="text-xs sm:text-sm font-serif text-slate-300 leading-relaxed">
              You returned to {replay.sanctuary_world.favorite_world} across {replay.sanctuary_world.sessions_count} sessions, accumulating {replay.sanctuary_world.total_minutes} restorative minutes guided by {replay.sanctuary_world.preferred_voice}.
            </p>
            <div className="p-5 rounded-3xl bg-teal-950/40 border border-teal-500/20 text-teal-200 text-xs font-serif italic">
              {replay.sanctuary_world.world_ambience_note}
            </div>
          </div>
        )}

        {/* Step 5: Speech Lights */}
        {currentStep === 5 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-sky-300">
              <MessageSquare size={13} />
              <span>Mindful Conversations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              Speech Lights of Unburdening
            </h2>
            <p className="text-xs sm:text-sm font-serif text-slate-300 leading-relaxed">
              Athena preserves your privacy by never showing raw conversation text. Instead, floating speech lights represent moments you chose to unburden complex emotions in honest dialogue.
            </p>
            <div className="flex justify-center gap-4 py-4">
              <div className="h-12 w-12 rounded-full bg-sky-500/20 border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.5)] flex items-center justify-center text-sky-300 animate-thought-breathe">
                ✨
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/20 border border-violet-400/40 shadow-[0_0_20px_rgba(167,139,250,0.5)] flex items-center justify-center text-violet-300 animate-thought-breathe" style={{ animationDelay: '1s' }}>
                ✨
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-500/20 border border-teal-400/40 shadow-[0_0_20px_rgba(45,212,191,0.5)] flex items-center justify-center text-teal-300 animate-thought-breathe" style={{ animationDelay: '2s' }}>
                ✨
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Space Reflections */}
        {currentStep === 6 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-violet-300">
              <BookOpen size={13} />
              <span>Private Space Journal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              Themes in Ink
            </h2>
            <p className="text-xs sm:text-sm font-serif text-slate-300 leading-relaxed">
              Pages gently turned without exposing sensitive paragraphs. Your prominent writing themes this month:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['Restorative Pacing', 'Work Boundaries', 'Quiet Gratitude', 'Emotional Space'].map((theme) => (
                <span
                  key={theme}
                  className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 font-serif text-xs text-white"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Growing Tree */}
        {currentStep === 7 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-emerald-300">
              <TreePine size={13} />
              <span>Cumulative Recovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              The Living Tree of Stillness
            </h2>
            <p className="text-xs sm:text-sm font-serif text-slate-300 leading-relaxed">
              Every verified moment of returning grew a new branch. Recovery is not an instant cure; it is the living canopy of pauses you protect over time.
            </p>
            <div className="text-6xl py-4 animate-thought-breathe">
              🌳
            </div>
          </div>
        )}

        {/* Step 8: Before -> After Cadence */}
        {currentStep === 8 && (
          <div className="text-center space-y-4 max-w-xl animate-replay-slide-up">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white">
              Before &amp; After: Cadence Evolution
            </h2>
            <div className="grid grid-cols-2 gap-4 text-left pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">August Cadence</span>
                <p className="text-xs font-serif text-slate-300">Carried fatigue into evenings before stopping.</p>
              </div>
              <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/20 space-y-1">
                <span className="text-[10px] font-mono text-violet-300 uppercase">September Cadence</span>
                <p className="text-xs font-serif text-white">Created mindful breathing space before reacting.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Constellation & Keepsake Closing */}
        {currentStep === 9 && (
          <div className="text-center space-y-5 max-w-xl animate-replay-slide-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-300">
              <Award size={13} />
              <span>Personalized Constellation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-medium text-white">
              {replay.growth_reflection.headline}
            </h2>
            <p className="text-sm font-serif leading-relaxed text-slate-200">
              {replay.growth_reflection.narrative}
            </p>
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-950/30 text-xs font-serif italic text-amber-200">
              &ldquo;{replay.growth_reflection.key_takeaway}&rdquo;
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button
                onClick={onReturnHome}
                className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-serif cursor-pointer shadow-lg shadow-violet-600/30"
              >
                Return Home
              </button>
              <button
                onClick={onReplay}
                className="px-4 py-2.5 rounded-full bg-slate-900 text-slate-400 hover:text-white text-xs font-serif border border-slate-800 cursor-pointer"
              >
                Replay Story
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Step Navigation Bar */}
      <footer className="w-full flex items-center justify-between py-4 border-t border-white/5">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep <= 1}
          className="px-4 py-2 rounded-full bg-slate-900 text-xs font-serif text-slate-300 disabled:opacity-20 cursor-pointer"
        >
          ← Previous
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {MONTHLY_STORY_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i + 1)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentStep === i + 1 ? 'w-6 bg-violet-400' : 'w-2 bg-slate-800'
              }`}
              title={MONTHLY_STORY_STEPS[i]}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentStep((prev) => Math.min(MONTHLY_STORY_STEPS.length, prev + 1))}
          disabled={currentStep >= MONTHLY_STORY_STEPS.length}
          className="px-4 py-2 rounded-full bg-violet-600 text-xs font-serif text-white disabled:opacity-20 cursor-pointer shadow-md"
        >
          Next →
        </button>
      </footer>
    </div>
  );
};
