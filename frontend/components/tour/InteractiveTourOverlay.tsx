'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTour, TOUR_STEPS } from '@/context/TourContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, ArrowRight, ArrowLeft, X, Check, Compass, Eye } from 'lucide-react';

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InteractiveTourOverlay() {
  const {
    isTourActive,
    currentStep,
    totalSteps,
    currentStepData,
    showInvitation,
    isCompleted,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    startTour,
    dismissInvitation,
  } = useTour();

  const { t } = useLanguage();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Position finder logic
  const updateTargetPosition = useCallback(() => {
    if (!currentStepData?.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStepData.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Ensure element has dimension
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        setIsLocating(false);
        return;
      }
    }
  }, [currentStepData?.target]);

  // When step changes or tour starts, locate the target element with smooth retry
  useEffect(() => {
    if (!isTourActive || !currentStepData) {
      setTargetRect(null);
      return;
    }

    setIsLocating(true);
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds total

    const interval = setInterval(() => {
      attempts++;
      const el = document.querySelector(currentStepData.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        // If element is offscreen, smoothly scroll it into view
        const isInViewport =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!isInViewport) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }

        // Measure
        setTimeout(() => {
          updateTargetPosition();
        }, 150);

        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        // Fallback: element not found on page, center card without spotlight
        setIsLocating(false);
        setTargetRect(null);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isTourActive, currentStep, currentStepData, updateTargetPosition]);

  // Listen to scroll & window resize to update spotlight rectangle
  useEffect(() => {
    if (!isTourActive) return;

    const handleUpdate = () => {
      updateTargetPosition();
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isTourActive, updateTargetPosition]);

  // Keyboard navigation: Escape exits, ArrowRight advances, ArrowLeft goes back
  useEffect(() => {
    if (!isTourActive && !showInvitation && !isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showInvitation) dismissInvitation();
        else if (isTourActive) skipTour();
        else if (isCompleted) completeTour();
      } else if (isTourActive) {
        if (e.key === 'ArrowRight') {
          nextStep();
        } else if (e.key === 'ArrowLeft') {
          prevStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, showInvitation, isCompleted, dismissInvitation, skipTour, completeTour, nextStep, prevStep]);

  // Compute tooltip position relative to spotlight
  const computeCardStyle = (): React.CSSProperties => {
    if (typeof window === 'undefined') return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Mobile fallback: pinned to bottom
    if (vw < 768) {
      return {
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 99999,
      };
    }

    // Desktop fallback if target is not found or centered
    if (!targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '440px',
        maxWidth: '90vw',
        zIndex: 99999,
      };
    }

    const cardWidth = 440;
    const cardHeightEst = 260;
    const margin = 16;

    // Decide whether to place card below, above, or side
    let top = targetRect.top + targetRect.height + margin;
    let left = targetRect.left;

    // If overflowing bottom, try above
    if (top + cardHeightEst > vh - 20) {
      const topAbove = targetRect.top - cardHeightEst - margin;
      if (topAbove > 20) {
        top = topAbove;
      } else {
        // If both overflow, place to the side or clamp
        top = Math.max(20, Math.min(vh - cardHeightEst - 20, targetRect.top));
      }
    }

    // Keep horizontally within viewport
    if (left + cardWidth > vw - 24) {
      left = vw - cardWidth - 24;
    }
    if (left < 24) {
      left = 24;
    }

    return {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${cardWidth}px`,
      maxWidth: 'calc(100vw - 48px)',
      zIndex: 99999,
      transition: 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    };
  };

  // 1. Initial Invitation Modal
  if (showInvitation) {
    return (
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-invite-title"
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
      >
        <div className="relative w-full max-w-md bg-stone-900/95 dark:bg-stone-950/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/20 text-stone-100 backdrop-blur-xl">
          <button
            onClick={dismissInvitation}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-200 rounded-full hover:bg-white/10 transition-colors"
            aria-label={t('common_close') || 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center mb-5 text-purple-300 shadow-inner">
            <Compass className="w-7 h-7" />
          </div>

          <h2 id="tour-invite-title" className="text-xl sm:text-2xl font-serif font-medium tracking-tight mb-2 text-white">
            {t('tour_welcome_prompt')}
          </h2>

          <p className="text-sm sm:text-base text-stone-300/90 leading-relaxed mb-6">
            Take a gentle, guided walkthrough of Athena&apos;s mindful sanctuary. See your check-in, reflection space, practice studio, and personal insights in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startTour}
              className="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t('tour_show_me', 'Show me around')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={dismissInvitation}
              className="px-5 py-3 rounded-2xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 font-medium transition-colors"
            >
              {t('tour_skip', 'Skip for now')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Completion Card (Over Care Page)
  if (isCompleted) {
    return (
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-complete-title"
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
      >
        <div className="relative w-full max-w-md bg-stone-900/95 dark:bg-stone-950/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 text-stone-100 backdrop-blur-xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-300 shadow-inner">
            <Check className="w-8 h-8" />
          </div>

          <h2 id="tour-complete-title" className="text-2xl font-serif font-medium tracking-tight mb-2 text-white">
            {t('tour_youre_ready')}
          </h2>

          <p className="text-sm sm:text-base text-stone-300/90 leading-relaxed mb-6">
            {t('tour_ready_desc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={completeTour}
              className="flex-1 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('tour_start_exploring')}</span>
            </button>
            <button
              onClick={completeTour}
              className="px-5 py-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 font-medium transition-colors"
            >
              {t('common_done') || 'Done'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Step Walkthrough
  if (!isTourActive || !currentStepData) {
    return null;
  }

  const spotlightPadding = 10;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <aside aria-label="Interactive Tour" className="fixed inset-0 z-[99990] pointer-events-none">
      {/* SVG Mask Spotlight cutout allowing user to see the exact application behind it */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen (opaque in mask) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight area (transparent in mask) */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - spotlightPadding)}
                y={Math.max(0, targetRect.top - spotlightPadding)}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Backdrop rect applying the mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 8, 16, 0.65)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Highlight Ring & Pulse */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300 animate-pulse"
          style={{
            top: `${Math.max(0, targetRect.top - spotlightPadding)}px`,
            left: `${Math.max(0, targetRect.left - spotlightPadding)}px`,
            width: `${targetRect.width + spotlightPadding * 2}px`,
            height: `${targetRect.height + spotlightPadding * 2}px`,
            zIndex: 99995,
          }}
        />
      )}

      {/* Interactive Walkthrough Card */}
      <div
        ref={cardRef}
        style={computeCardStyle()}
        className="pointer-events-auto bg-stone-900/95 dark:bg-stone-950/95 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-purple-950/50 backdrop-blur-xl text-stone-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Badge & Close */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {t('tour_step_counter', 'Step {current} of {total}', { current: currentStep, total: totalSteps })}
            </span>
          </div>

          <button
            onClick={skipTour}
            className="p-1.5 text-stone-400 hover:text-stone-200 rounded-full hover:bg-white/10 transition-colors"
            title={t('tour_skip')}
            aria-label={t('tour_skip')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-medium text-white mb-1.5">
            {t(currentStepData.titleKey, currentStepData.titleFallback)}
          </h3>
          <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans">
            {t(currentStepData.descKey, currentStepData.descFallback)}
          </p>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="flex items-center gap-1.5 pt-1">
          {TOUR_STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurr = stepNum === currentStep;
            return (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurr
                    ? 'w-6 bg-purple-400'
                    : isDone
                    ? 'w-2 bg-purple-600/60'
                    : 'w-2 bg-stone-700/60'
                }`}
              />
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 mt-1">
          <button
            onClick={skipTour}
            className="text-xs text-stone-400 hover:text-stone-200 font-medium px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
          >
            {t('tour_skip')}
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/70 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('tour_back')}</span>
              </button>
            )}

            <button
              onClick={nextStep}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isLastStep ? (t('tour_start_exploring') || 'Start Exploring') : t('tour_next')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
