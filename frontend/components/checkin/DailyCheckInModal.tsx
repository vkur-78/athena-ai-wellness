"use client";

import { useState, useEffect, useCallback } from "react";
import { MoodType, CheckinResponse, CheckinDraft } from "@/types/checkin";
import MoodSelector from "./MoodSelector";
import WellnessSlider from "./WellnessSlider";
import ReflectionInput from "./ReflectionInput";
import CompletionCard from "./CompletionCard";
import { useTodayCheckIn } from "@/context/CheckInContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, ArrowRight, BatteryMedium, Feather, Loader2, Sparkles, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface DailyCheckInModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: (checkin: CheckinResponse) => void;
}

const ENERGY_LABELS: Record<number, string> = {
  1: "Running on empty",
  2: "Low",
  3: "Steady",
  4: "Good",
  5: "Full of energy",
};

const STRESS_LABELS: Record<number, string> = {
  1: "Very light",
  2: "Manageable",
  3: "Noticeable",
  4: "Heavy",
  5: "Overwhelming",
};

export default function DailyCheckInModal({
  isOpen,
  userId,
  onComplete,
}: DailyCheckInModalProps) {
  const { isLight } = useTheme();
  const { language } = useLanguage();
  // Get today's local calendar date string (YYYY-MM-DD)
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();
  const draftStorageKey = `athena_checkin_draft_${userId}_${todayStr}`;
  const { submitCheckIn } = useTodayCheckIn();

  // Check-in state
  const [step, setStep] = useState<number>(1);
  const [mood, setMood] = useState<MoodType | string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [reflectionText, setReflectionText] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedCheckin, setCompletedCheckin] = useState<CheckinResponse | null>(null);

  // Restore draft progress from localStorage if page refreshed
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const draft: CheckinDraft = JSON.parse(saved);
        if (draft.date === todayStr) {
          if (draft.step) setStep(draft.step);
          if (draft.mood) setMood(draft.mood);
          if (draft.energy_level) setEnergyLevel(draft.energy_level);
          if (draft.stress_level) setStressLevel(draft.stress_level);
          if (draft.reflection_text) setReflectionText(draft.reflection_text);
        }
      }
    } catch (e) {
      console.warn("Failed to restore checkin draft:", e);
    }
  }, [isOpen, draftStorageKey, todayStr]);

  // Persist draft to localStorage on any state change
  const persistDraft = useCallback(
    (currentStep: number, currentMood: MoodType | string | null, energy: number, stress: number, text: string) => {
      if (typeof window === "undefined") return;
      try {
        const draft: CheckinDraft = {
          step: currentStep,
          date: todayStr,
          mood: currentMood,
          energy_level: energy,
          stress_level: stress,
          reflection_text: text,
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      } catch (e) {
        console.warn("Failed to persist checkin draft:", e);
      }
    },
    [draftStorageKey, todayStr]
  );

  // Disable Escape key from closing the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrorMessage(null);
    const nextStep = step + 1;
    setStep(nextStep);
    persistDraft(nextStep, mood, energyLevel, stressLevel, reflectionText);
  };

  const handlePrevStep = () => {
    if (step <= 1) return;
    setErrorMessage(null);
    const prevStep = step - 1;
    setStep(prevStep);
    persistDraft(prevStep, mood, energyLevel, stressLevel, reflectionText);
  };

  const handleSubmit = async () => {
    if (!mood) {
      setErrorMessage("Please select your mood first.");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Clean draft storage immediately
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {}

    try {
      // 0–200ms button shows loading, 300–800ms Athena reflection fades in
      const res = await submitCheckIn({
        mood: mood as string,
        energy: energyLevel,
        stress: stressLevel,
        notes: reflectionText.trim() || undefined,
        language: language,
      });

      const optimisticResult: CheckinResponse = {
        id: `checkin_${Date.now()}`,
        user_id: userId,
        date: todayStr,
        mood: mood as string,
        energy_level: energyLevel,
        stress_level: stressLevel,
        reflection_text: reflectionText.trim() || null,
        ai_reflection: res.reflection || "Thank you for pausing and checking in with yourself today.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCompletedCheckin(optimisticResult);
      // Immediately transition to completion card (typing indicator 400-600ms)
      setStep(5);
      setIsSubmitting(false);
    } catch (err: any) {
      console.warn("[Check-in Sync Error]:", err);
      setIsSubmitting(false);
      setErrorMessage("Could not record check-in. Please try again.");
    }
  };

  const handleFinish = () => {
    if (completedCheckin) {
      onComplete(completedCheckin);
    }
  };

  // Step 5 is Completion View
  const isCompletionView = step === 5 && completedCheckin !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        // Prevent accidental dismiss on backdrop click
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className={`w-full max-w-xl rounded-[28px] border p-6 sm:p-8 relative overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
          isLight
            ? "bg-white border-[rgba(124,92,255,0.14)] text-[#1C1917] shadow-[0_20px_60px_-15px_rgba(28,25,23,0.12)]"
            : "border-zinc-800 bg-[#0c0d12]/95 text-zinc-100 shadow-2xl shadow-black/80"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-36 w-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        {isCompletionView ? (
          <CompletionCard checkin={completedCheckin} onContinue={handleFinish} />
        ) : (
          <div className="space-y-6">
            {/* Top Header & Progress */}
            <div className="space-y-2">
              <div className={`flex items-center justify-between text-xs font-semibold ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
                <div className="flex items-center gap-1.5 text-violet-500 dark:text-violet-400">
                  <Sparkles size={14} />
                  <span>Daily Wellness Touchpoint</span>
                </div>
                <span className={`font-mono tracking-wider ${isLight ? "text-stone-400" : "text-zinc-400"}`}>
                  Step {step} of 4
                </span>
              </div>

              {/* Progress Bar (25%, 50%, 75%, 100%) */}
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-zinc-800/80"}`}>
                <div
                  className="h-full bg-violet-500 dark:bg-violet-400/90 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 p-3.5 text-xs text-amber-200 animate-in fade-in">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-[220px] flex flex-col justify-center">
              {step === 1 && (
                <MoodSelector
                  selectedMood={mood}
                  onSelectMood={(m) => {
                    setMood(m);
                    setErrorMessage(null);
                    persistDraft(1, m, energyLevel, stressLevel, reflectionText);
                  }}
                />
              )}

              {step === 2 && (
                <WellnessSlider
                  title="How much energy have you had today?"
                  subtitle="Notice the physical and mental vitality you've felt moving through your day."
                  value={energyLevel}
                  onChange={(val) => {
                    setEnergyLevel(val);
                    persistDraft(2, mood, val, stressLevel, reflectionText);
                  }}
                  labels={ENERGY_LABELS}
                  metricName="Energy Level"
                  icon={<BatteryMedium size={16} className="text-violet-400" />}
                  accentVariant="violet"
                />
              )}

              {step === 3 && (
                <WellnessSlider
                  title="How heavy has today felt?"
                  subtitle="Checking in with the emotional weight or pressures you've been carrying."
                  value={stressLevel}
                  onChange={(val) => {
                    setStressLevel(val);
                    persistDraft(3, mood, energyLevel, val, reflectionText);
                  }}
                  labels={STRESS_LABELS}
                  metricName="Stress & Weight"
                  icon={<Feather size={16} className="text-teal-400" />}
                  accentVariant="teal"
                />
              )}

              {step === 4 && (
                <ReflectionInput
                  value={reflectionText}
                  onChange={(val) => {
                    setReflectionText(val);
                    persistDraft(4, mood, energyLevel, stressLevel, val);
                  }}
                />
              )}
            </div>

            {/* Navigation Footer */}
            <div className={`flex items-center justify-between gap-3 pt-3 border-t ${isLight ? "border-stone-100" : "border-zinc-800/80"}`}>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[18px] border text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                    isLight
                      ? "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                      : "border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={step === 1 && !mood}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-xs sm:text-sm font-semibold transition-all duration-120 cursor-pointer",
                    step === 1 && !mood
                      ? isLight
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : isLight
                      ? "bg-[#6E4FE6] hover:bg-[#5D3FD3] text-white shadow-[0_4px_14px_rgba(110,79,230,0.30)] active:scale-95"
                      : "bg-[#232530] hover:bg-[#2b2d39] text-violet-200 border border-violet-800/30 shadow-xs active:scale-95"
                  )}
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-xs sm:text-sm font-semibold shadow-xs transition-all duration-120 active:scale-95 disabled:opacity-50 cursor-pointer ${
                    isLight
                      ? "bg-[#6E4FE6] hover:bg-[#5D3FD3] text-white shadow-[0_4px_14px_rgba(110,79,230,0.30)]"
                      : "bg-[#232530] hover:bg-[#2b2d39] text-violet-200 border border-violet-800/30"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Athena is reflecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Check-in</span>
                      <Sparkles size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
