'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  FastForward,
  MessageSquare,
} from 'lucide-react';
import { LivingReplayData } from '@/types/replay';
import { ambientSound } from '@/lib/ambientSound';

// Weekly Storyboard Scenes
import { WeeklyChapter1Opening } from './weekly/WeeklyChapter1Opening';
import { SevenDayStonesScene } from './weekly/SevenDayStonesScene';
import { EmotionalRiverScene } from './weekly/EmotionalRiverScene';
import { RisingLanternsScene } from './weekly/RisingLanternsScene';
import { MiniatureWorldsScene } from './weekly/MiniatureWorldsScene';
import { FloatingPracticesScene } from './weekly/FloatingPracticesScene';
import { NextGentleStepScene } from './weekly/NextGentleStepScene';
import { StarsEndingScene } from './weekly/StarsEndingScene';

// Monthly Showcase Storyboard
import { MonthlyCinematicStoryboard } from './monthly/MonthlyCinematicStoryboard';

interface CinematicEventPlayerProps {
  replay: LivingReplayData;
  onExit?: () => void;
  initialChapter?: number;
}

const WEEKLY_CHAPTER_TITLES = [
  'Opening',
  'Seven-Day Journey',
  'Emotional River',
  'Quiet Victories',
  'Sanctuary Journey',
  'What Helped',
  'Next Gentle Step',
  'Ending & Stars',
];

export const CinematicEventPlayer: React.FC<CinematicEventPlayerProps> = ({
  replay,
  onExit,
  initialChapter = 1,
}) => {
  const router = useRouter();
  const isWeekly = replay.replay_type === 'weekly';
  const totalWeeklyScenes = 8;

  const [currentChapter, setCurrentChapter] = useState<number>(
    initialChapter && initialChapter >= 1 && initialChapter <= 8 ? initialChapter : 1
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize playback progress to localStorage for Dashboard "Continue Watching"
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isWeekly) {
      if (currentChapter >= totalWeeklyScenes) {
        // Replay reached finale, remove paused state
        localStorage.removeItem('athena_replay_progress');
      } else if (currentChapter > 1) {
        localStorage.setItem(
          'athena_replay_progress',
          JSON.stringify({
            replayId: replay.replay_id,
            replayType: 'weekly',
            periodDisplay: replay.period_display,
            chapter: currentChapter,
            totalChapters: totalWeeklyScenes,
            title: WEEKLY_CHAPTER_TITLES[currentChapter - 1],
            updatedAt: Date.now(),
          })
        );
      }
    }
  }, [currentChapter, isWeekly, replay.replay_id, replay.period_display, totalWeeklyScenes]);

  const returnHome = useCallback(() => {
    ambientSound.stopAmbient();
    if (onExit) {
      onExit();
    } else {
      router.push('/');
    }
  }, [onExit, router]);

  // Ambient Sound Setup
  useEffect(() => {
    if (!isMuted) {
      ambientSound.startAmbient().catch(() => {});
    }
    return () => {
      ambientSound.stopAmbient();
    };
  }, [isMuted]);

  // Chapter Advance Chimes & Sound
  const nextChapter = useCallback(() => {
    if (isWeekly) {
      setCurrentChapter((prev) => {
        if (prev < totalWeeklyScenes) {
          ambientSound.playChime();
          return prev + 1;
        }
        return prev;
      });
    }
  }, [isWeekly, totalWeeklyScenes]);

  const prevChapter = useCallback(() => {
    if (isWeekly) {
      setCurrentChapter((prev) => {
        if (prev > 1) {
          ambientSound.playChime();
          return prev - 1;
        }
        return prev;
      });
    }
  }, [isWeekly]);

  // Auto-advance Timer for Weekly Replay (Target ~45-60s total, ~7.5s per scene)
  useEffect(() => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

    if (isWeekly && isPlaying && currentChapter < totalWeeklyScenes) {
      // Scene 1 is 3.5s per storyboard; other scenes ~7.5s
      const duration = currentChapter === 1 ? 3800 : 7800;
      autoAdvanceTimerRef.current = setTimeout(() => {
        nextChapter();
      }, duration);
    }

    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [isWeekly, isPlaying, currentChapter, totalWeeklyScenes, nextChapter]);

  // Auto-hide controls on mouse inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2800);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextChapter();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevChapter();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted(ambientSound.toggleMute());
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setShowCaptions((c) => !c);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        returnHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextChapter, prevChapter, returnHome]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-black text-slate-100 select-none animate-replay-fade"
    >
      {/* Background Soft Parallax Gradient & Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-violet-950/20 via-indigo-950/25 to-teal-950/20 rounded-full blur-[150px] animate-thought-breathe" />
        <div className="absolute bottom-10 left-10 w-2.5 h-2.5 rounded-full bg-violet-400/25 blur-[1px] animate-float-particle" />
        <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-teal-400/25 blur-[1px] animate-float-particle" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-amber-400/20 blur-[2px] animate-float-particle" style={{ animationDelay: '4.5s' }} />
      </div>

      {/* Top Floating Control Bar (Exit, Mute, Captions) */}
      <header
        className={`relative z-30 px-6 py-5 max-w-5xl mx-auto w-full flex items-center justify-between transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            {isWeekly ? 'Weekly Living Replay' : 'Monthly Living Showcase'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-serif italic text-slate-300">
            {replay.period_display}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Captions Toggle */}
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-2 rounded-full border text-xs transition-colors cursor-pointer ${
              showCaptions
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
            }`}
            title="Toggle Captions (C)"
          >
            <MessageSquare size={14} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(ambientSound.toggleMute())}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Ambient Sound (M)' : 'Mute Ambient Sound (M)'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Exit / Return Home Button */}
          <button
            onClick={returnHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-serif text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Return Home (Esc)"
          >
            <X size={13} />
            <span>Return Home</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Cinematic Storyboard Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        {isWeekly ? (
          <>
            {currentChapter === 1 && (
              <WeeklyChapter1Opening
                userName={replay.user_name}
                seasonTitle={replay.opening_scene.season_title}
              />
            )}
            {currentChapter === 2 && (
              <SevenDayStonesScene moodJourney={replay.mood_journey} />
            )}
            {currentChapter === 3 && (
              <EmotionalRiverScene moments={replay.recovery_moments} />
            )}
            {currentChapter === 4 && (
              <RisingLanternsScene victories={replay.quiet_victories} />
            )}
            {currentChapter === 5 && (
              <MiniatureWorldsScene worldData={replay.sanctuary_world} />
            )}
            {currentChapter === 6 && <FloatingPracticesScene />}
            {currentChapter === 7 && (
              <NextGentleStepScene onMaybeLater={nextChapter} />
            )}
            {currentChapter === 8 && (
              <StarsEndingScene
                onReturnHome={returnHome}
                onReplay={() => setCurrentChapter(1)}
                highlights={replay.highlights_grid}
              />
            )}
          </>
        ) : (
          <MonthlyCinematicStoryboard
            replay={replay}
            onReturnHome={returnHome}
            onReplay={() => setCurrentChapter(1)}
          />
        )}
      </main>

      {/* Bottom Floating Transport Controls (Auto-hides on inactivity) */}
      {isWeekly && (
        <footer
          className={`relative z-30 px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-3 transition-opacity duration-500 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Segmented Chapter Progress Bar */}
          <div className="grid grid-cols-8 gap-1.5 w-full">
            {Array.from({ length: totalWeeklyScenes }).map((_, idx) => {
              const num = idx + 1;
              const isDone = currentChapter > num;
              const isCurrent = currentChapter === num;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentChapter(num);
                    ambientSound.playChime();
                  }}
                  className="h-1.5 rounded-full overflow-hidden bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                  title={`Chapter ${num}: ${WEEKLY_CHAPTER_TITLES[idx]}`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      isDone
                        ? 'w-full bg-violet-400'
                        : isCurrent
                        ? 'w-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]'
                        : 'w-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Transport Buttons Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={prevChapter}
              disabled={currentChapter <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 fill-white" />}
              </button>

              <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                {WEEKLY_CHAPTER_TITLES[currentChapter - 1]} ({currentChapter}/{totalWeeklyScenes})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentChapter(totalWeeklyScenes)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] font-serif"
                title="Skip to Ending"
              >
                <FastForward size={12} />
                <span>Skip</span>
              </button>

              <button
                onClick={nextChapter}
                disabled={currentChapter >= totalWeeklyScenes}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium disabled:opacity-20 transition-all cursor-pointer shadow-md"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
