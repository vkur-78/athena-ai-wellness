"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/common/Loading";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  STUDIO_EXERCISE_LIBRARY,
  CuratedExercise,
  StudioLanguage,
} from "@/lib/studioExerciseContent";
import { StudioSessionPlayer } from "@/components/studio/StudioSessionPlayer";
import { StudioSessionCompletion } from "@/components/studio/StudioSessionCompletion";
import { StudioGuideVoiceModal } from "@/components/studio/StudioGuideVoiceModal";
import { StudioVoiceQAPanel } from "@/components/studio/StudioVoiceQAPanel";
import { recordStudioSession } from "@/lib/api";
import { Play, Sparkles, Wind, Compass, Zap, Waves, Feather, Target, ArrowRight, Headphones } from "lucide-react";

interface CategoryMeta {
  key: "RESET" | "BREATHE" | "GROUND" | "UNWIND" | "RELAXATION" | "FOCUS";
  label: string;
  subtitle: string;
  accent: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "RESET",
    label: "Reset",
    subtitle: "Calm energy pulse",
    accent: "from-violet-600/30 via-indigo-600/20 to-transparent",
    icon: Zap,
  },
  {
    key: "BREATHE",
    label: "Breathe",
    subtitle: "Slow your nervous system down",
    accent: "from-cyan-500/30 via-indigo-600/20 to-transparent",
    icon: Wind,
  },
  {
    key: "GROUND",
    label: "Ground",
    subtitle: "Organic sensory anchors",
    accent: "from-emerald-500/25 via-teal-600/20 to-transparent",
    icon: Compass,
  },
  {
    key: "UNWIND",
    label: "Unwind",
    subtitle: "Slow flowing release",
    accent: "from-rose-500/25 via-violet-600/20 to-transparent",
    icon: Waves,
  },
  {
    key: "RELAXATION",
    label: "Relaxation",
    subtitle: "Soft ambient sanctuary",
    accent: "from-purple-500/30 via-pink-600/15 to-transparent",
    icon: Feather,
  },
  {
    key: "FOCUS",
    label: "Focus",
    subtitle: "Clarity & mindful presence",
    accent: "from-amber-500/25 via-indigo-600/20 to-transparent",
    icon: Target,
  },
];

export default function StudioPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, language: websiteLang } = useLanguage();

  const [authChecking, setAuthChecking] = useState(true);

  // Strict Authentication Guard
  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/login");
          return;
        }
        if (!active) return;
        setAuthChecking(false);
      } catch (err) {
        console.error("Studio Auth check failed:", err);
        router.replace("/login");
      }
    }
    checkAuth();
    return () => {
      active = false;
    };
  }, [router]);

  // Voice guide modal state (Exercise guide language is independent of website language)
  const [voiceModalExercise, setVoiceModalExercise] = useState<CuratedExercise | null>(null);
  const [activeVoiceLanguage, setActiveVoiceLanguage] = useState<StudioLanguage>("en");
  const [showVoiceQA, setShowVoiceQA] = useState<boolean>(false);

  // State: Library (A) vs Session (B) vs Completion (C)
  const [activeExercise, setActiveExercise] = useState<CuratedExercise | null>(null);
  const [completedExercise, setCompletedExercise] = useState<{
    exercise: CuratedExercise;
    durationSeconds: number;
  } | null>(null);

  // Handle opening guide selection
  const handlePromptGuide = (exercise: CuratedExercise) => {
    setVoiceModalExercise(exercise);
  };

  // Handle starting practice once guide voice is selected
  const handleStartPracticeWithVoice = (chosenVoice: StudioLanguage) => {
    if (!voiceModalExercise) return;
    setActiveVoiceLanguage(chosenVoice);
    setActiveExercise(voiceModalExercise);
    setVoiceModalExercise(null);
    setCompletedExercise(null);
  };

  // Handle exiting practice early
  const handleExitSession = () => {
    setActiveExercise(null);
    setCompletedExercise(null);
  };

  // Handle session completion: persist to backend and show calm completion state
  const handleCompleteSession = async (data: {
    durationSeconds: number;
    language: StudioLanguage;
    exerciseId: string;
    exerciseName: string;
    category: string;
    pauseCount: number;
  }) => {
    if (activeExercise) {
      setCompletedExercise({
        exercise: activeExercise,
        durationSeconds: data.durationSeconds,
      });
      setActiveExercise(null);

      // Persist to database without disrupting client view
      try {
        await recordStudioSession({
          exercise_id: data.exerciseId,
          exercise_name: data.exerciseName,
          exercise_category: data.category,
          duration_seconds: data.durationSeconds,
          completed: true,
          completion_status: "COMPLETED",
          session_status: "completed",
          completion_percentage: 100,
          language: data.language,
          selected_language: data.language,
          pause_count: data.pauseCount,
          completed_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("[Studio Session Save Fallback]:", err);
      }
    }
  };

  // Return to library from completion screen
  const handleDone = () => {
    setCompletedExercise(null);
    setActiveExercise(null);
  };

  if (authChecking) {
    return <Loading fullScreen label="Opening Sanctuary Studio..." />;
  }

  // ==========================================
  // STATE B: SEPARATE QUIET SESSION ENVIRONMENT
  // When active, all global navigation and dashboards disappear.
  // ==========================================
  if (activeExercise) {
    return (
      <StudioSessionPlayer
        exercise={activeExercise}
        language={activeVoiceLanguage}
        onExit={handleExitSession}
        onComplete={handleCompleteSession}
      />
    );
  }

  // Completion State
  if (completedExercise) {
    return (
      <StudioSessionCompletion
        exercise={completedExercise.exercise}
        language={activeVoiceLanguage}
        durationSeconds={completedExercise.durationSeconds}
        onDone={handleDone}
        onTryAnother={handleDone}
      />
    );
  }

  // ==========================================
  // STATE A: STUDIO LIBRARY
  // ==========================================
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden selection:bg-[#7C5CFF]/30 transition-colors duration-300">
      {/* Background Atmosphere */}
      <div className="sanctuary-aurora-bg studio-room" />

      {/* 1. Global Navigation (Only on Library state) */}
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      {/* 2. Main Studio Library Content */}
      <main data-tour="studio-area" className="relative z-10 max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-14 animate-athena-fade">
        {/* Header with Dev Voice QA Lab Button */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--accent)]">
              {t("studio_title", "THE STUDIO")}
            </span>
            <h1 className="text-3xl sm:text-5xl font-hero-serif font-bold text-[var(--text-primary)] tracking-tight">
              {t("studio_subtitle", "Find a few quiet minutes.")}
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] font-sans">
              Choose an unhurried practice that fits how you feel right now.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowVoiceQA(true)}
            title="Open Development Voice QA Panel"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(124,92,255,0.3)] shrink-0 self-start sm:self-auto mt-1"
          >
            <Headphones size={13} />
            <span>Voice QA Lab</span>
          </button>
        </header>

        {/* FEATURED PRACTICE CARD (Hero with Breathing Orb Preview) */}
        {(() => {
          const featured = STUDIO_EXERCISE_LIBRARY[0];
          if (!featured) return null;
          const fTitle = featured.title[websiteLang] || featured.title.en;
          const fDesc = featured.description[websiteLang] || featured.description.en;

          return (
            <div className="relative p-6 sm:p-9 rounded-[32px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] shadow-2xl overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 group hover:border-[var(--accent)] transition-all duration-300">
              {/* Radial backdrop */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_center,rgba(124,92,255,0.18),transparent_70%)] pointer-events-none group-hover:scale-110 transition-transform duration-500" />

              <div className="space-y-3 max-w-lg relative z-10 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
                  <Sparkles size={12} className="text-[var(--accent)]" />
                  <span>{t("studio_featured", "FEATURED PRACTICE")}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-hero-serif font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors break-words">
                  {fTitle}
                </h2>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {fDesc}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-[var(--text-muted)]">
                  <span className="text-[var(--accent)] font-semibold">{featured.duration_label}</span>
                  <span>•</span>
                  <span>Humanized Voice Guide</span>
                  <span>•</span>
                  <span>Breathing Orb</span>
                </div>
              </div>

              {/* Right: Breathing Orb Visual & CTA */}
              <div className="relative z-10 flex flex-col sm:items-end gap-4 shrink-0">
                {/* Breathing Orb Preview */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center self-center sm:self-auto">
                  <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 animate-ping opacity-30 pointer-events-none" />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#7C5CFF] via-indigo-500 to-cyan-400 shadow-[0_0_24px_rgba(124,92,255,0.6)] animate-pulse flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-white/40 backdrop-blur-xs" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePromptGuide(featured)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm shadow-lg shadow-[var(--accent)]/30 hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer whitespace-nowrap"
                >
                  <Play size={14} className="fill-white" />
                  <span>{t("studio_begin", "Begin Practice")}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ATMOSPHERIC CATEGORIES GRID: Doors into States of Mind */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {t("studio_states_of_mind", "States of Mind")}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => {
              const count = STUDIO_EXERCISE_LIBRARY.filter((ex) => ex.category === cat.key).length;
              const Icon = cat.icon;
              const catTitle = t(`cat_${cat.key.toLowerCase()}`, cat.label);
              const catSubtitle = t(`cat_${cat.key.toLowerCase()}_sub`, cat.subtitle);

              return (
                <a
                  key={cat.key}
                  href={`#cat-${cat.key}`}
                  className="group relative p-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)] transition-all duration-300 text-left flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1 shadow-md hover:shadow-[0_12px_28px_rgba(124,92,255,0.15)]"
                >
                  {/* Atmospheric Glow on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                  />

                  <div className="relative z-10 flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--accent)] group-hover:scale-110 transition-all">
                      <Icon size={16} />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {count} {t("studio_sessions_count", "sessions")}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="text-base font-semibold font-hero-serif text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {catTitle}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {catSubtitle}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Categorized Practices List */}
        <div className="space-y-12 sm:space-y-14 pt-4">
          {CATEGORIES.map((cat) => {
            const exercisesInCat = STUDIO_EXERCISE_LIBRARY.filter((ex) => ex.category === cat.key);
            if (exercisesInCat.length === 0) return null;
            const catTitle = t(`cat_${cat.key.toLowerCase()}`, cat.label);
            const catSubtitle = t(`cat_${cat.key.toLowerCase()}_sub`, cat.subtitle);

            return (
              <section key={cat.key} id={`cat-${cat.key}`} className="space-y-4 scroll-mt-24">
                {/* Section Header */}
                <div className="border-b border-[var(--border)] pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-medium">
                      {catTitle}
                    </h2>
                    <span className="text-xs text-[var(--text-muted)]">•</span>
                    <span className="text-xs text-[var(--text-secondary)]">{catSubtitle}</span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {exercisesInCat.length} {t("studio_practices_count", "practices")}
                  </span>
                </div>

                {/* Refined Content Cards List */}
                <div className="divide-y divide-[var(--border)]">
                  {exercisesInCat.map((exercise) => {
                    const title = exercise.title[websiteLang] || exercise.title.en;
                    const desc = exercise.description[websiteLang] || exercise.description.en;
                    const diff = exercise.difficulty[websiteLang] || exercise.difficulty.en;

                    return (
                      <article
                        key={exercise.id}
                        className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group min-w-0"
                      >
                        <div className="space-y-1.5 max-w-xl min-w-0">
                          <h3 className="text-base sm:text-lg font-serif text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent)] transition-colors break-words">
                            {title}
                          </h3>
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                            {desc}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[var(--text-muted)]">
                            <span className="text-[var(--accent)] font-semibold">{exercise.duration_label}</span>
                            <span>•</span>
                            <span>{diff}</span>
                            <span>•</span>
                            <span>Multiple Voice Guides</span>
                          </div>
                        </div>

                        <div className="shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handlePromptGuide(exercise)}
                            className="px-5 py-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white text-[var(--text-primary)] text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-xs whitespace-nowrap"
                          >
                            <span>{t("studio_begin", "Begin Practice")}</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Guide Voice Selection Modal */}
      <StudioGuideVoiceModal
        exercise={voiceModalExercise}
        isOpen={Boolean(voiceModalExercise)}
        onClose={() => setVoiceModalExercise(null)}
        onStartPractice={handleStartPracticeWithVoice}
      />

      {/* Dev Voice QA Panel */}
      <StudioVoiceQAPanel
        isOpen={showVoiceQA}
        onClose={() => setShowVoiceQA(false)}
      />
    </div>
  );
}
