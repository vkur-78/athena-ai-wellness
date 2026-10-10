'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sliders,
} from 'lucide-react';
import { LivingReplayData } from '@/types/replay';
import { ambientSound } from '@/lib/ambientSound';

import { Scene1Opening } from './scenes/Scene1Opening';
import { Scene2MoodJourney } from './scenes/Scene2MoodJourney';
import { Scene3RecoveryMoments } from './scenes/Scene3RecoveryMoments';
import { Scene4SanctuaryWorld } from './scenes/Scene4SanctuaryWorld';
import { Scene5QuietVictories } from './scenes/Scene5QuietVictories';
import { Scene6EmotionalRhythm } from './scenes/Scene6EmotionalRhythm';
import { Scene7GrowthReflection } from './scenes/Scene7GrowthReflection';
import { Scene8NextChapter } from './scenes/Scene8NextChapter';
import { MonthlyHighlightsGrid } from './scenes/MonthlyHighlightsGrid';
import { ShareKeepsakeModal } from './ShareKeepsakeModal';

interface LivingReplayPlayerProps {
  replay: LivingReplayData;
  onExit?: () => void;
}

const CHAPTER_NAMES = [
  'Opening',
  'Mood Ribbon',
  'Recovery Moments',
  'Sanctuary World',
  'Quiet Victories',
  'Natural Rhythm',
  'Growth Reflection',
  'Next Chapter',
  'Keepsakes',
];

export const LivingReplayPlayer: React.FC<LivingReplayPlayerProps> = ({ replay, onExit }) => {
  const router = useRouter();
  const [currentScene, setCurrentScene] = useState<number>(1); // 1 through 9 (9 = Keepsakes grid)
  const totalScenes = 9;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Time per scene: Weekly ~9s, Monthly ~16s
  const isWeekly = replay.replay_type === 'weekly';
  const sceneDurationMs = reducedMotion ? 999999 : isWeekly ? 9500 : 16000;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sound Management
  useEffect(() => {
    // Start ambient tone if user allows
    if (!isMuted) {
      ambientSound.startAmbient().catch(() => {});
    }
    return () => {
      ambientSound.stopAmbient();
    };
  }, [isMuted]);

  const handleNext = useCallback(() => {
    setCurrentScene((prev) => {
      if (prev < totalScenes) {
        ambientSound.playChime();
        return prev + 1;
      }
      return prev;
    });
  }, [totalScenes]);

  const handlePrev = useCallback(() => {
    setCurrentScene((prev) => {
      if (prev > 1) {
        ambientSound.playChime();
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = ambientSound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Auto-advance Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isPlaying && currentScene < totalScenes && !reducedMotion) {
      timerRef.current = setTimeout(() => {
        handleNext();
      }, sceneDurationMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentScene, totalScenes, sceneDurationMs, reducedMotion, handleNext]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'Escape') {
        if (onExit) {
          onExit();
        } else {
          router.push('/replay');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleTogglePlay, handleToggleMute, onExit, router]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Empty State Fallback
  if (replay.is_empty_state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 text-center max-w-lg mx-auto animate-replay-fade text-slate-100">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-300 text-2xl mb-6">
          🌱
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-slate-100 mb-3 leading-snug">
          We&apos;re still gathering moments for your first replay.
        </h2>
        <p className="text-sm font-serif text-slate-400 leading-relaxed mb-8">
          {replay.empty_message ||
            'As you pause in Sakura Garden, write in Space, or check in honestly, Athena quietly preserves the ground you hold.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/studio"
            className="px-5 py-2.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 text-xs font-medium transition-all"
          >
            Take a Mindful Breath
          </Link>
          <Link
            href="/journal"
            className="px-5 py-2.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 text-xs font-medium transition-all"
          >
            Write in Space
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section
      ref={containerRef}
      role="region"
      aria-label="Athena Living Replay"
      aria-live="polite"
      className="relative min-h-[calc(100vh-80px)] w-full flex flex-col justify-between overflow-x-hidden bg-slate-950 text-slate-100 select-none transition-colors"
    >
      {/* Dynamic Background Atmosphere & Gentle Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-900/15 rounded-full blur-[140px] animate-thought-breathe" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[400px] bg-teal-900/10 rounded-full blur-[120px]" />
        {/* Floating particles */}
        <div className="absolute top-20 left-1/4 w-2 h-2 rounded-full bg-teal-300/30 blur-[1px] animate-float-particle" />
        <div className="absolute bottom-32 right-1/4 w-3 h-3 rounded-full bg-violet-300/25 blur-[2px] animate-float-particle" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-amber-300/30 blur-[1px] animate-float-particle" style={{ animationDelay: '5s' }} />
      </div>

      {/* Top Header & Chapter Progress Bar */}
      <header className="relative z-20 px-6 pt-6 pb-2 max-w-4xl mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => {
              if (onExit) onExit();
              else router.push('/replay');
            }}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Return to Replay Hub"
          >
            <ArrowLeft size={14} />
            <span>Replay Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-serif italic text-slate-300">{replay.period_display}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-violet-300 font-medium">
              {CHAPTER_NAMES[currentScene - 1]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle fullscreen mode"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Accessibility & Playback Settings"
              aria-label="Playback Settings"
            >
              <Sliders size={14} />
            </button>
          </div>
        </div>

        {/* Accessibility & Playback Settings Dropdown */}
        {showSettings && (
          <div className="p-3 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl text-xs space-y-2 max-w-xs ml-auto shadow-2xl animate-replay-fade">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-serif">Reduced Motion</span>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  reducedMotion ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {reducedMotion ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="text-[10px] text-slate-500 font-serif leading-tight">
              Keyboard shortcuts: Space (Play/Pause), Left/Right (Jump), M (Mute), Esc (Exit).
            </div>
          </div>
        )}

        {/* Segmented Progress Bars (1 through 9) */}
        <div className="grid grid-cols-9 gap-1.5 w-full">
          {Array.from({ length: totalScenes }).map((_, idx) => {
            const sceneNum = idx + 1;
            const isCompleted = currentScene > sceneNum;
            const isCurrent = currentScene === sceneNum;

            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentScene(sceneNum);
                  ambientSound.playChime();
                }}
                className="group relative h-2 rounded-full overflow-hidden bg-slate-800/80 transition-all cursor-pointer hover:bg-slate-700"
                title={`Scene ${sceneNum}: ${CHAPTER_NAMES[idx]}`}
                aria-label={`Jump to scene ${sceneNum}: ${CHAPTER_NAMES[idx]}`}
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? 'w-full bg-violet-400'
                      : isCurrent
                      ? 'w-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]'
                      : 'w-0 bg-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Cinematic Scene Display */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        {currentScene === 1 && (
          <Scene1Opening
            scene={replay.opening_scene}
            userName={replay.user_name}
            replayType={replay.replay_type}
            onBegin={() => setCurrentScene(2)}
          />
        )}

        {currentScene === 2 && (
          <Scene2MoodJourney moodJourney={replay.mood_journey} />
        )}

        {currentScene === 3 && (
          <Scene3RecoveryMoments moments={replay.recovery_moments} />
        )}

        {currentScene === 4 && (
          <Scene4SanctuaryWorld worldData={replay.sanctuary_world} />
        )}

        {currentScene === 5 && (
          <Scene5QuietVictories victories={replay.quiet_victories} />
        )}

        {currentScene === 6 && (
          <Scene6EmotionalRhythm rhythmData={replay.emotional_rhythm} />
        )}

        {currentScene === 7 && (
          <Scene7GrowthReflection reflection={replay.growth_reflection} />
        )}

        {currentScene === 8 && (
          <Scene8NextChapter suggestions={replay.next_chapter} />
        )}

        {currentScene === 9 && (
          <MonthlyHighlightsGrid
            highlights={replay.highlights_grid}
            pdfExportUrl={replay.pdf_export_url}
            onRestartReplay={() => setCurrentScene(1)}
            onOpenShareModal={() => setShowShareModal(true)}
          />
        )}
      </main>

      {/* Bottom Transport Controls */}
      <footer className="relative z-20 px-6 py-6 max-w-4xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentScene <= 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Previous Chapter"
        >
          <ChevronLeft size={15} />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-black/30"
            title={isPlaying ? 'Pause Story' : 'Play Story'}
            aria-label={isPlaying ? 'Pause Replay Story' : 'Play Replay Story'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            {currentScene} / {totalScenes}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentScene >= totalScenes}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/25 cursor-pointer"
          aria-label="Next Chapter"
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
      </footer>

      {/* Share Keepsake Modal */}
      <ShareKeepsakeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        replay={replay}
      />
    </section>
  );
};
