"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Feather,
  Compass,
  Sparkles,
  MessageSquare,
  Wind,
  BookOpen,
  User,
  Heart,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

interface GuidedTourModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function GuidedTourModal({ forceOpen = false, onClose }: GuidedTourModalProps) {
  const router = useRouter();
  const { isLight } = useTheme();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<number>(0); // 0 = invitation prompt, 1..10 = tour steps

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setStep(1);
      return;
    }
    try {
      const dismissed = localStorage.getItem("athena_tour_dismissed");
      if (!dismissed) {
        // Show gentle prompt on first entry
        const timer = setTimeout(() => {
          setIsOpen(true);
          setStep(0);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [forceOpen]);

  const handleDismiss = () => {
    try {
      localStorage.setItem("athena_tour_dismissed", "true");
    } catch {}
    setIsOpen(false);
    onClose?.();
  };

  const handleStartTour = () => {
    setStep(1);
  };

  const handleNext = () => {
    if (step >= 10) {
      handleDismiss();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const tourSteps = [
    {
      num: 1,
      title: t("tour_step_home_title", "1. Home Sanctuary"),
      desc: t("tour_step_home_desc", "Your daily sanctuary home displays your presence rhythm, quick actions, and recent reflections."),
      icon: Feather,
      route: "/",
    },
    {
      num: 2,
      title: t("tour_step_checkin_title", "2. Daily Check-in"),
      desc: t("tour_step_checkin_desc", "Take a mindful pause each day. Track mood, energy, stress, and receive an instant empathetic reflection."),
      icon: Calendar,
      route: "/",
    },
    {
      num: 3,
      title: t("tour_step_journal_title", "3. Space / Journal"),
      desc: t("tour_step_journal_desc", "A secure, serene private sanctuary to write your thoughts and let your inner experiences unfold."),
      icon: BookOpen,
      route: "/journal",
    },
    {
      num: 4,
      title: t("tour_step_chat_title", "4. Athena Conversation"),
      desc: t("tour_step_chat_desc", "Speak with Athena anytime in your native language for grounded, therapeutic emotional companionship."),
      icon: MessageSquare,
      route: "/chat",
    },
    {
      num: 5,
      title: t("tour_step_studio_title", "5. The Studio"),
      desc: t("tour_step_studio_desc", "Unhurried somatic practices: box breathing, 4-7-8 rhythm, grounding exercises, and sensory resets."),
      icon: Wind,
      route: "/studio",
    },
    {
      num: 6,
      title: t("tour_step_insights_title", "6. Longitudinal Insights"),
      desc: t("tour_step_insights_desc", "Evidence-backed patterns showing how your energy, stress, and reflection rhythms evolve over time."),
      icon: Compass,
      route: "/insights",
    },
    {
      num: 7,
      title: t("tour_step_weekly_title", "7. Weekly Replay"),
      desc: t("tour_step_weekly_desc", "A gentle retrospective of your presence, check-ins, and studio practices across each calendar week."),
      icon: Sparkles,
      route: "/replay?type=weekly",
    },
    {
      num: 8,
      title: t("tour_step_monthly_title", "8. Monthly Replay"),
      desc: t("tour_step_monthly_desc", "A broader look at your sanctuary turning points, emotional trajectory, and monthly takeaways."),
      icon: Sparkles,
      route: "/replay?type=monthly",
    },
    {
      num: 9,
      title: t("tour_step_profile_title", "9. Profile & Privacy"),
      desc: t("tour_step_profile_desc", "Manage your mindful reminder times, reading atmosphere, global language, and zero-data-selling guarantee."),
      icon: User,
      route: "/profile",
    },
    {
      num: 10,
      title: t("tour_step_care_title", "10. Care & Crisis Support"),
      desc: t("tour_step_care_desc", "Immediate, compassionate 24/7 crisis resources and safety hotlines always within reach."),
      icon: Heart,
      route: "/care",
    },
  ];

  // Screen 0: Invitation Prompt
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className={`w-full max-w-md rounded-[26px] border p-6 sm:p-7 text-center space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 ${
            isLight
              ? "bg-white border-[#e8e4dc] text-stone-900 shadow-[0_12px_40px_-8px_rgba(28,25,23,0.12)]"
              : "bg-[#0f111a] border-[#292b37] text-zinc-100 shadow-black/80"
          }`}
        >
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-[20px] bg-violet-500/10 border border-violet-500/25 text-violet-400">
            <Sparkles size={24} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight font-serif">
              {t("tour_welcome_prompt", "Would you like a quick introduction to Athena?")}
            </h2>
            <p className={`text-xs ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
              {t("profile_subtitle", "Your sacred space, presence rhythm, and gentle care preferences.")}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleStartTour}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {t("tour_show_me", "Show me around")}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className={`w-full py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer ${
                isLight ? "text-stone-500 hover:text-stone-800" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t("tour_skip", "Skip for now")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = tourSteps[step - 1];
  const StepIcon = currentStepData?.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-[28px] border p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 ${
          isLight
            ? "bg-white border-[#e8e4dc] text-stone-900 shadow-[0_16px_50px_-10px_rgba(28,25,23,0.15)]"
            : "bg-[#0f111a] border-[#292b37] text-zinc-100 shadow-black/90"
        }`}
      >
        {/* Header & Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <StepIcon size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-violet-500 dark:text-violet-400 font-semibold">
                Step {step} of 10
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className={`p-1.5 rounded-full transition-colors ${
              isLight ? "hover:bg-stone-100 text-stone-400 hover:text-stone-700" : "hover:bg-white/5 text-zinc-500 hover:text-zinc-200"
            }`}
            title={t("tour_skip_tour", "Skip Tour")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-zinc-800"}`}>
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / 10) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="space-y-3 py-1">
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight font-serif">
            {currentStepData.title}
          </h3>
          <p className={`text-sm leading-relaxed ${isLight ? "text-stone-600" : "text-zinc-300"}`}>
            {currentStepData.desc}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-inherit">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isLight ? "text-stone-700 hover:bg-stone-100" : "text-zinc-300 hover:bg-white/5"
            }`}
          >
            <ArrowLeft size={14} />
            <span>{t("tour_back", "Back")}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className={`text-xs transition cursor-pointer px-2 ${
              isLight ? "text-stone-400 hover:text-stone-700" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t("tour_skip_tour", "Skip Tour")}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition active:scale-[0.97] cursor-pointer"
          >
            <span>{step === 10 ? t("tour_done", "Done") : t("tour_next", "Next")}</span>
            {step === 10 ? <Check size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
