'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  X,
  Compass,
  Heart,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { LivingReplayData } from '@/types/replay';
import { FALLBACK_LIVING_REPLAY_WEEKLY, FALLBACK_LIVING_REPLAY_MONTHLY } from '@/lib/replayApi';

interface DashboardReplayHubProps {
  onExperienceReplay: (type: 'weekly' | 'monthly', initialChapter?: number) => void;
  weeklyReplay?: LivingReplayData | null;
  monthlyReplay?: LivingReplayData | null;
  daysCompletedThisWeek?: number;
}

interface SavedProgress {
  replayId: string;
  replayType: 'weekly' | 'monthly';
  periodDisplay: string;
  chapter: number;
  totalChapters: number;
  title: string;
  updatedAt: number;
}

type HeroDisplayState = 'weekly_ready' | 'monthly_ready' | 'countdown';

interface ShelfItem {
  id: string;
  type: 'weekly' | 'monthly';
  title: string;
  seasonTitle: string;
  periodDisplay: string;
  durationText: string;
  dominantMood: string;
  moodColor: string;
  activeDays: number;
  studioMinutes: number;
  previewType: 'lantern' | 'river' | 'stars' | 'bloom' | 'aurora';
}

const SHELF_STORIES: ShelfItem[] = [
  {
    id: 'this-week',
    type: 'weekly',
    title: 'This Week',
    seasonTitle: 'Finding Quieter Evenings',
    periodDisplay: 'Sep 14 – Sep 20, 2026',
    durationText: '52s story',
    dominantMood: 'Calmer',
    moodColor: '#a78bfa',
    activeDays: 6,
    studioMinutes: 28,
    previewType: 'lantern',
  },
  {
    id: 'last-week',
    type: 'weekly',
    title: 'Last Week',
    seasonTitle: 'The Gentle Tide',
    periodDisplay: 'Sep 07 – Sep 13, 2026',
    durationText: '48s story',
    dominantMood: 'Steady',
    moodColor: '#2dd4bf',
    activeDays: 5,
    studioMinutes: 22,
    previewType: 'river',
  },
  {
    id: 'august-story',
    type: 'monthly',
    title: 'August Story',
    seasonTitle: 'Summer Shadows & Quiet Steps',
    periodDisplay: 'August 2026',
    durationText: '2m 05s journey',
    dominantMood: 'Grounded',
    moodColor: '#34d399',
    activeDays: 19,
    studioMinutes: 72,
    previewType: 'aurora',
  },
  {
    id: 'july-story',
    type: 'monthly',
    title: 'July Story',
    seasonTitle: 'Midsummer Whispers & Slow Light',
    periodDisplay: 'July 2026',
    durationText: '1m 58s journey',
    dominantMood: 'Peaceful',
    moodColor: '#818cf8',
    activeDays: 18,
    studioMinutes: 65,
    previewType: 'bloom',
  },
];

export default function DashboardReplayHub({
  onExperienceReplay,
  weeklyReplay,
  monthlyReplay,
  daysCompletedThisWeek,
}: DashboardReplayHubProps) {
  const { isLight } = useTheme();

  // Progress Resumption state
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  // Carousel shelf scroll ref
  const shelfScrollRef = useRef<HTMLDivElement>(null);
  const [shelfFilter, setShelfFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Time calculations
  const today = new Date().getDay();
  const daysUntilSunday = (7 - today) % 7;
  const isSunday = today === 0;
  const isMonthEnd = new Date().getDate() >= 26;

  // Default hero state: Month end shows monthly, Sunday shows weekly, else weekly ready for demo or countdown
  const [activeHeroMode, setActiveHeroMode] = useState<HeroDisplayState>(
    isMonthEnd ? 'monthly_ready' : 'weekly_ready'
  );

  // Check localStorage for saved story progress
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('athena_replay_progress');
      if (raw) {
        const parsed = JSON.parse(raw) as SavedProgress;
        if (parsed && parsed.chapter && parsed.chapter > 1) {
          setSavedProgress(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse replay progress', e);
    }
  }, []);

  const dismissProgress = () => {
    setSavedProgress(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('athena_replay_progress');
    }
  };

  // Carousel Scroll
  const scrollShelf = (direction: 'left' | 'right') => {
    if (shelfScrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      shelfScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filtered stories
  const filteredStories = SHELF_STORIES.filter((s) => {
    if (shelfFilter === 'all') return true;
    return s.type === shelfFilter;
  });

  // Calculate progress percentage for countdown state
  const weekProgressPct = daysCompletedThisWeek !== undefined
    ? Math.min(100, Math.round((daysCompletedThisWeek / 7) * 100))
    : Math.min(100, Math.round(((today === 0 ? 7 : today) / 7) * 100));

  return (
    <section
      aria-label="Athena Living Replay Flagship Centerpiece"
      className="w-full space-y-6"
    >
      {/* ------------------------------------------------------------- */}
      {/* SECTION HEADER: YOUR WEEKLY STORY (Part 4 Flagship Feature)    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pb-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400 animate-pulse" />
            <h3
              className={`text-xl sm:text-2xl font-serif font-semibold tracking-tight ${
                isLight ? 'text-stone-900' : 'text-white'
              }`}
            >
              Your Weekly Story
            </h3>
          </div>
          <p
            className={`text-xs sm:text-sm font-serif ${
              isLight ? 'text-stone-500' : 'text-zinc-400'
            }`}
          >
            A flagship reflection gathered from your quiet moments and reflections
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* "CONTINUE WATCHING" ALERT (if story was paused mid-stream)   */}
      {/* ------------------------------------------------------------- */}
      {savedProgress && (
        <div
          className={`relative overflow-hidden rounded-[20px] border p-4 sm:p-5 transition-all duration-[220ms] animate-replay-fade ${
            isLight
              ? 'bg-amber-50/90 border-amber-200/90 text-amber-950 shadow-sm'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-100 shadow-lg shadow-amber-950/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                }`}
              >
                <RotateCcw size={18} className="animate-spin-slow" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-amber-600 dark:text-amber-400">
                    Continue Watching
                  </span>
                  <span className="text-amber-400 dark:text-amber-600">•</span>
                  <span className="text-xs font-serif font-medium">
                    {savedProgress.periodDisplay}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-serif font-semibold">
                  Paused at Chapter {savedProgress.chapter}: &ldquo;{savedProgress.title}&rdquo;
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() =>
                  onExperienceReplay(savedProgress.replayType, savedProgress.chapter)
                }
                className="flex items-center gap-2 px-4 py-2 rounded-[20px] bg-amber-600 hover:bg-amber-500 text-white text-xs font-serif font-medium shadow-md transition-all duration-[220ms] hover:scale-105 active:scale-[0.98] duration-[180ms] cursor-pointer"
              >
                <Play size={12} className="fill-white" />
                <span>Resume Story</span>
              </button>
              <button
                onClick={dismissProgress}
                className="p-2 rounded-[20px] hover:bg-black/10 dark:hover:bg-white/10 text-amber-700 dark:text-amber-300 text-xs transition-colors cursor-pointer"
                title="Dismiss and restart from beginning"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLAGSHIP FULL-WIDTH HERO SECTION (State 1 / State 2 / State 3) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`relative overflow-hidden rounded-[20px] border transition-all duration-500 shadow-2xl ${
          activeHeroMode === 'monthly_ready'
            ? isLight
              ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border-indigo-400/40 text-slate-100 shadow-indigo-950/40'
              : 'bg-gradient-to-br from-[#0c0d18] via-[#111224] to-[#1a112e] border-violet-500/40 text-slate-100 shadow-violet-950/50'
            : isLight
            ? 'bg-gradient-to-br from-white via-[#fcfbf9] to-[#f4efe8] border-violet-200/80 text-stone-900 shadow-stone-300/40'
            : 'bg-gradient-to-br from-[#1b1c2b] via-[#141522] to-[#0e0f18] border-violet-500/30 text-zinc-100 shadow-violet-950/30'
        }`}
      >
        {/* Living Animated Atmospheric Canvas: Floating Particles & Ambient Breathe */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-thought-breathe pointer-events-none ${
              activeHeroMode === 'monthly_ready'
                ? 'bg-violet-600/25'
                : isLight
                ? 'bg-violet-300/30'
                : 'bg-violet-600/15'
            }`}
          />
          <div
            className={`absolute -bottom-10 -left-10 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
              activeHeroMode === 'monthly_ready'
                ? 'bg-teal-500/20'
                : isLight
                ? 'bg-amber-200/40'
                : 'bg-teal-500/15'
            }`}
          />
        </div>

        {/* Top Mini State Selector: Allows instant previewing */}
        <div className="relative z-20 px-6 pt-5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border font-medium ${
                activeHeroMode === 'monthly_ready'
                  ? 'bg-violet-500/20 text-violet-200 border-violet-400/40 shadow-[0_0_12px_rgba(167,139,250,0.3)]'
                  : isLight
                  ? 'bg-violet-100 text-violet-800 border-violet-200'
                  : 'bg-violet-500/15 text-violet-300 border-violet-500/30'
              }`}
            >
              <Sparkles size={11} className="animate-pulse" />
              <span>Flagship Living Story</span>
            </span>
          </div>

          {/* Quick Hero State Switcher */}
          <div
            className={`flex items-center gap-1 p-1 rounded-full border text-[11px] font-serif ${
              activeHeroMode === 'monthly_ready' || !isLight
                ? 'bg-black/30 border-white/10 text-slate-300'
                : 'bg-stone-100/80 border-stone-200 text-stone-600'
            }`}
          >
            <button
              onClick={() => setActiveHeroMode('weekly_ready')}
              className={`px-3 py-1 rounded-full transition-all duration-[220ms] cursor-pointer ${
                activeHeroMode === 'weekly_ready'
                  ? 'bg-violet-600 text-white font-medium shadow-xs'
                  : 'hover:text-white'
              }`}
            >
              Weekly Story
            </button>
            <button
              onClick={() => setActiveHeroMode('monthly_ready')}
              className={`px-3 py-1 rounded-full transition-all duration-[220ms] cursor-pointer ${
                activeHeroMode === 'monthly_ready'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'hover:text-white'
              }`}
            >
              Monthly Story
            </button>
            <button
              onClick={() => setActiveHeroMode('countdown')}
              className={`px-3 py-1 rounded-full transition-all duration-[220ms] cursor-pointer ${
                activeHeroMode === 'countdown'
                  ? 'bg-stone-700 text-white font-medium shadow-xs'
                  : 'hover:text-white'
              }`}
            >
              Countdown
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* HERO CONTENT: STATE 1 — WEEKLY REPLAY READY (FLAGSHIP CARD) */}
        {/* ----------------------------------------------------------- */}
        {activeHeroMode === 'weekly_ready' && (
          <div className="relative z-10 p-6 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-8 animate-replay-fade">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center flex-wrap gap-2.5 text-xs font-mono">
                <span className="text-violet-500 dark:text-violet-400 font-semibold tracking-wider uppercase">
                  ✨ Week 38 Living Story
                </span>
                <span className="opacity-40">•</span>
                {/* Mood Color Badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-serif border bg-violet-500/10 border-violet-500/30 text-violet-300">
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a78bfa]" />
                  <span>Mood: Peaceful Lavender</span>
                </span>
                <span className="opacity-40">•</span>
                <span
                  className={`text-xs font-serif ${
                    isLight ? 'text-stone-500' : 'text-slate-400'
                  }`}
                >
                  Last Sunday generated • Sep 20
                </span>
              </div>

              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-serif font-medium tracking-tight leading-tight ${
                  isLight ? 'text-stone-900' : 'text-white'
                }`}
              >
                &ldquo;Your week quietly found its rhythm.&rdquo;
              </h2>

              <p
                className={`text-xs sm:text-sm font-serif leading-relaxed max-w-xl ${
                  isLight ? 'text-stone-600' : 'text-slate-300'
                }`}
              >
                Distilled from 6 days of emotional check-ins, quiet studio pauses, and
                grounding moments. Experience the story your week quietly told with gentle Web
                Audio ambiance.
              </p>

              {/* Progress Bar & Evidence */}
              <div className="space-y-2 pt-1 max-w-md">
                <div className="flex items-center justify-between text-xs font-serif opacity-75">
                  <span>Weekly Synthesis</span>
                  <span className="font-mono">6 of 7 sanctuary days active (85%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 w-[85%]" />
                </div>
              </div>
            </div>

            {/* Play Button Action */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <button
                onClick={() => onExperienceReplay('weekly')}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-[20px] bg-violet-600 hover:bg-violet-500 text-white font-serif font-medium text-sm sm:text-base shadow-2xl shadow-violet-600/40 transition-all duration-[220ms] hover:scale-105 active:scale-[0.98] duration-[180ms] cursor-pointer animate-pulse-gentle"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                  <Play size={14} className="ml-0.5 fill-white" />
                </div>
                <span>Experience Your Story</span>
              </button>

              <span
                className={`text-[11px] font-serif ${
                  isLight ? 'text-stone-500' : 'text-slate-400'
                }`}
              >
                52-second cinematic • Generated last Sunday
              </span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* HERO CONTENT: STATE 2 — MONTHLY REPLAY READY (BIGGEST CARD) */}
        {/* ----------------------------------------------------------- */}
        {activeHeroMode === 'monthly_ready' && (
          <div className="relative z-10 p-7 sm:p-11 flex flex-col md:flex-row md:items-center justify-between gap-8 animate-replay-fade">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="text-indigo-300 font-semibold tracking-widest uppercase flex items-center gap-1.5">
                  <Moon size={13} className="text-indigo-300" />
                  <span>🌙 September Story is Ready</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="text-slate-300 font-serif">
                  2m 18s cinematic journey
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
                  Season • Returning Gently
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight text-white leading-tight">
                  A Month of Soft Transitions &amp; Deep Grounding
                </h2>
              </div>

              <p className="text-xs sm:text-sm font-serif leading-relaxed text-slate-300 max-w-xl">
                Across 21 active sanctuary days and 84 studio minutes, September marked a shift
                from midday tension toward peaceful evening rhythms. Explore your verified growth
                chapters and emotional arc.
              </p>

              {/* Verified Monthly Highlights */}
              <div className="flex items-center flex-wrap gap-2 pt-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-serif bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  Dominant Arc: Overwhelmed → Peaceful
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-serif bg-violet-500/20 text-violet-200 border border-violet-500/30">
                  6-Day Longest Streak
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-serif bg-teal-500/20 text-teal-200 border border-teal-500/30">
                  Sakura Garden Sanctuary
                </span>
              </div>
            </div>

            {/* Monthly Grand CTA Button */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <button
                onClick={() => onExperienceReplay('monthly')}
                className="group relative flex items-center gap-3.5 px-9 py-4.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-serif font-medium text-sm sm:text-base shadow-2xl shadow-indigo-600/50 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse-gentle border border-indigo-400/30"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                  <Play size={15} className="ml-0.5 fill-white" />
                </div>
                <span>Experience Monthly Story</span>
              </button>

              <span className="text-[11px] font-serif text-slate-400">
                10-Chapter Full Showcase • Vector PDF Keepsake included
              </span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* HERO CONTENT: STATE 3 — COUNTDOWN PROGRESS (ALWAYS ALIVE)   */}
        {/* ----------------------------------------------------------- */}
        {activeHeroMode === 'countdown' && (
          <div className="relative z-10 p-6 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-8 animate-replay-fade">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="text-violet-500 dark:text-violet-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Next Weekly Story</span>
                </span>
                <span className="opacity-40">•</span>
                <span
                  className={
                    isLight ? 'text-stone-500 font-serif' : 'text-slate-400 font-serif'
                  }
                >
                  {isSunday
                    ? 'Unlocks tonight at 18:00'
                    : `Available in ${daysUntilSunday} ${
                        daysUntilSunday === 1 ? 'day' : 'days'
                      }`}
                </span>
              </div>

              <h2
                className={`text-2xl sm:text-3xl font-serif font-medium tracking-tight ${
                  isLight ? 'text-stone-900' : 'text-white'
                }`}
              >
                Athena is quietly gathering your week&apos;s rhythms.
              </h2>

              {/* Progress Bar & Status */}
              <div className="space-y-2 pt-1 max-w-lg">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={isLight ? 'text-stone-600' : 'text-slate-400'}
                  >
                    Week Synthesis Progress
                  </span>
                  <span className="text-violet-500 dark:text-violet-400 font-semibold">
                    {weekProgressPct}% Complete
                  </span>
                </div>

                {/* Styled progress bar */}
                <div
                  className={`h-3 w-full rounded-full overflow-hidden p-0.5 border ${
                    isLight
                      ? 'bg-stone-200/80 border-stone-300'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-700"
                    style={{ width: `${weekProgressPct}%` }}
                  />
                </div>

                <p
                  className={`text-xs font-serif italic ${
                    isLight ? 'text-stone-500' : 'text-slate-400'
                  }`}
                >
                  {weekProgressPct >= 70
                    ? 'Emotional stones, quiet victories, and studio moments are being composed.'
                    : 'Check in daily to weave your conversations, reflections, and breathing pauses into Sunday’s story.'}
                </p>
              </div>
            </div>

            {/* Previous Story Instant Action */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <button
                onClick={() => onExperienceReplay('weekly')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-serif font-medium border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                    : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                }`}
              >
                <RotateCcw size={13} />
                <span>Revisit Last Sunday&apos;s Story</span>
              </button>

              <span
                className={`text-[11px] font-serif ${
                  isLight ? 'text-stone-500' : 'text-slate-400'
                }`}
              >
                Available anytime in Replay Shelf
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* YOUTUBE / SPOTIFY STYLE REPLAY SHELF (Horizontal Carousel)   */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-2">
        {/* Shelf Header & Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-violet-500 dark:text-violet-400 font-semibold">
                Story Vault
              </span>
              <span className="opacity-30">•</span>
              <h3
                className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
                  isLight ? 'text-stone-900' : 'text-white'
                }`}
              >
                Replay Shelf &amp; Past Stories
              </h3>
            </div>
            <p
              className={`text-xs font-serif ${
                isLight ? 'text-stone-500' : 'text-zinc-400'
              }`}
            >
              Hover to preview silent 4-second scenes • Click any card to launch cinematic
              experience
            </p>
          </div>

          {/* Filter Pills + Scroll Buttons */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 p-1 rounded-full border text-xs font-serif ${
                isLight
                  ? 'bg-stone-100 border-stone-200 text-stone-600'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <button
                onClick={() => setShelfFilter('all')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  shelfFilter === 'all'
                    ? 'bg-violet-600 text-white font-medium shadow-xs'
                    : 'hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                All Stories
              </button>
              <button
                onClick={() => setShelfFilter('weekly')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  shelfFilter === 'weekly'
                    ? 'bg-violet-600 text-white font-medium shadow-xs'
                    : 'hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setShelfFilter('monthly')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  shelfFilter === 'monthly'
                    ? 'bg-violet-600 text-white font-medium shadow-xs'
                    : 'hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollShelf('left')}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
                title="Scroll Shelf Left"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollShelf('right')}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
                title="Scroll Shelf Right"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scrolling Card Track */}
        <div
          ref={shelfScrollRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-zinc-700 select-none"
        >
          {filteredStories.map((item) => {
            const isHovered = hoveredCardId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredCardId(item.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onClick={() => onExperienceReplay(item.type)}
                className={`group relative flex-none w-[280px] sm:w-[320px] rounded-[20px] border p-4 cursor-pointer transition-all duration-[220ms] transform ${
                  isHovered ? '-translate-y-1 scale-[1.02]' : 'translate-y-0 scale-100'
                } ${
                  isLight
                    ? 'bg-white/95 border-stone-200/90 shadow-sm hover:border-violet-300 hover:shadow-[0_12px_28px_rgba(139,92,246,0.18)]'
                    : 'bg-[#181922] border-white/5 shadow-md hover:border-violet-500/40 hover:shadow-[0_12px_32px_rgba(139,92,246,0.25)]'
                }`}
              >
                {/* Visual Thumbnail Stage with Silent 4s Preview on Hover */}
                <div className="relative h-40 w-full rounded-[16px] overflow-hidden bg-slate-950 border border-white/10 mb-3.5 flex items-center justify-center">
                  {/* Background poster art */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr ${
                      item.type === 'monthly'
                        ? 'from-indigo-950 via-violet-950 to-slate-900'
                        : 'from-slate-950 via-zinc-900 to-indigo-950'
                    }`}
                  />

                  {/* Silent Animated Preview Overlays */}
                  {item.previewType === 'lantern' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div
                        className={`absolute bottom-2 left-8 w-4 h-6 rounded-md bg-amber-400/50 blur-[2px] shadow-[0_0_12px_rgba(251,191,36,0.8)] transition-transform duration-1000 ${
                          isHovered ? '-translate-y-24 animate-pulse' : 'translate-y-0'
                        }`}
                      />
                      <div
                        className={`absolute bottom-4 left-24 w-5 h-7 rounded-md bg-amber-300/60 blur-[1px] shadow-[0_0_14px_rgba(252,211,77,0.8)] transition-transform duration-1200 ${
                          isHovered ? '-translate-y-28 animate-pulse' : 'translate-y-0'
                        }`}
                        style={{ transitionDelay: '150ms' }}
                      />
                      <div
                        className={`absolute bottom-1 right-12 w-4 h-5 rounded-md bg-amber-500/50 blur-[2px] shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-transform duration-1100 ${
                          isHovered ? '-translate-y-20 animate-pulse' : 'translate-y-0'
                        }`}
                        style={{ transitionDelay: '300ms' }}
                      />
                    </div>
                  )}

                  {item.previewType === 'river' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-70">
                      <svg
                        className={`w-full h-full text-teal-400/30 transition-transform duration-1000 ${
                          isHovered ? 'scale-110 translate-x-2' : 'scale-100'
                        }`}
                        viewBox="0 0 100 60"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0 25 Q25 15, 50 25 T100 25 L100 60 L0 60 Z"
                          fill="currentColor"
                        />
                        <path
                          d="M0 35 Q25 45, 50 35 T100 35 L100 60 L0 60 Z"
                          fill="rgba(45, 212, 191, 0.4)"
                        />
                      </svg>
                    </div>
                  )}

                  {item.previewType === 'stars' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div
                        className={`absolute top-6 left-12 w-2 h-2 rounded-full bg-white transition-all duration-700 ${
                          isHovered
                            ? 'scale-150 shadow-[0_0_12px_#fff] animate-pulse'
                            : 'scale-100 opacity-60'
                        }`}
                      />
                      <div
                        className={`absolute top-14 right-16 w-2.5 h-2.5 rounded-full bg-violet-300 transition-all duration-700 ${
                          isHovered
                            ? 'scale-150 shadow-[0_0_14px_#c4b5fd] animate-pulse'
                            : 'scale-100 opacity-50'
                        }`}
                        style={{ animationDelay: '300ms' }}
                      />
                      <div
                        className={`absolute bottom-8 left-20 w-2 h-2 rounded-full bg-teal-200 transition-all duration-700 ${
                          isHovered
                            ? 'scale-125 shadow-[0_0_10px_#99f6e4] animate-pulse'
                            : 'scale-100 opacity-40'
                        }`}
                        style={{ animationDelay: '600ms' }}
                      />
                    </div>
                  )}

                  {item.previewType === 'bloom' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-16 h-16 rounded-full border border-violet-400/40 transition-transform duration-1000 ${
                          isHovered ? 'scale-150 rotate-45 border-violet-300' : 'scale-75 rotate-0'
                        }`}
                      />
                      <div
                        className={`absolute w-10 h-10 rounded-full border border-teal-300/40 transition-transform duration-1000 ${
                          isHovered ? 'scale-125 -rotate-45' : 'scale-50 rotate-0'
                        }`}
                      />
                    </div>
                  )}

                  {item.previewType === 'aurora' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div
                        className={`w-full h-full bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-violet-500/25 blur-xl transition-all duration-1000 ${
                          isHovered ? 'scale-125 opacity-90' : 'scale-100 opacity-40'
                        }`}
                      />
                    </div>
                  )}

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                        item.type === 'monthly'
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-900/80 text-violet-300 border-violet-500/30'
                      }`}
                    >
                      {item.type === 'monthly' ? 'Monthly' : 'Weekly'}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 text-slate-200 border border-white/10 flex items-center gap-1">
                      <Clock size={10} />
                      <span>{item.durationText}</span>
                    </span>
                  </div>

                  {/* Play Action Hover Overlay */}
                  <div
                    className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity duration-250 ${
                      isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600 text-white text-xs font-serif shadow-lg shadow-violet-600/40">
                      <Play size={11} className="ml-0.5 fill-white" />
                      <span>Watch Story</span>
                    </div>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-mono text-[11px] ${
                        isLight ? 'text-stone-500' : 'text-zinc-400'
                      }`}
                    >
                      {item.periodDisplay}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-serif border ${
                        isLight
                          ? 'bg-stone-100 border-stone-200 text-stone-700'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {item.dominantMood}
                    </span>
                  </div>

                  <div>
                    <h4
                      className={`text-sm sm:text-base font-serif font-semibold line-clamp-1 ${
                        isLight ? 'text-stone-900' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p
                      className={`text-xs font-serif italic line-clamp-1 ${
                        isLight ? 'text-stone-600' : 'text-zinc-400'
                      }`}
                    >
                      {item.seasonTitle}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-3 text-[11px] font-serif ${
                      isLight ? 'text-stone-500' : 'text-zinc-400'
                    }`}
                  >
                    <span>{item.activeDays} active days</span>
                    <span>•</span>
                    <span>{item.studioMinutes} studio mins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
