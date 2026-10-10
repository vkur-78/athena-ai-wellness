"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Heart, Check, BookOpen, MessageSquare } from "lucide-react";
import { CheckinResponse } from "@/types/checkin";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

interface CompletionCardProps {
  checkin: CheckinResponse;
  onContinue: () => void;
}

export default function CompletionCard({
  checkin,
  onContinue,
}: CompletionCardProps) {
  const router = useRouter();
  const { isLight } = useTheme();
  const { t } = useLanguage();
  const [savedToSpace, setSavedToSpace] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  // 400–600ms subtle typing indicator before comforting response emerges
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getMoodEmoji = (mood: string) => {
    const m = (mood || "").toLowerCase();
    switch (m) {
      case "great":
      case "joyful":
        return "😄";
      case "good":
      case "peaceful":
        return "🙂";
      case "okay":
      case "grounded":
        return "😐";
      case "low":
      case "tender":
        return "😔";
      case "very difficult":
      case "stirred":
        return "😣";
      default:
        return "🌿";
    }
  };

  const getEnergyLabel = (val: number) => {
    const labels: Record<number, string> = {
      1: "Gentle / Rest Needed",
      2: "Low",
      3: "Steady",
      4: "Good",
      5: "Full of energy",
    };
    return labels[val] || `${val}/5`;
  };

  // Part 9 Therapist Language System
  const therapistSentence = useMemo(() => {
    const m = (checkin.mood || "").toLowerCase();
    const energy = checkin.energy_level || 3;

    if (energy <= 2) {
      return "Since your energy feels lower, let's keep today gentle.";
    }

    if (m === "great" || m === "joyful") {
      return "I'm glad today has offered a little breathing room.";
    }
    if (m === "good" || m === "peaceful") {
      return "Let's protect this steady feeling.";
    }
    if (m === "okay" || m === "grounded") {
      return "We don't have to force today to be better.";
    }
    if (m === "low" || m === "tender") {
      return "I'm here. Let's keep today small.";
    }
    if (m === "very difficult" || m === "stirred") {
      return "Thank you for staying with me. We can take this one step at a time.";
    }

    return "I'm here with you today.";
  }, [checkin.mood, checkin.energy_level]);

  const handleSaveToSpace = () => {
    try {
      const draftContent = `Today's Check-in (${checkin.mood}):\n\n"${checkin.ai_reflection || therapistSentence}"${checkin.reflection_text ? `\n\nNote: ${checkin.reflection_text}` : ''}`;
      localStorage.setItem("athena_journal_pending_draft", draftContent);
      setSavedToSpace(true);
      setTimeout(() => {
        onContinue();
        router.push("/journal");
      }, 250);
    } catch {
      onContinue();
      router.push("/journal");
    }
  };

  const handleContinueConversation = () => {
    onContinue();
    router.push("/chat");
  };

  return (
    <div className="space-y-6 text-center animate-in fade-in duration-[280ms]">
      {/* Gentle Header Icon */}
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border shadow-xs transition-transform duration-[220ms] ${
          isLight
            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
            : "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
        }`}
      >
        <Check size={26} strokeWidth={2.5} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight font-serif">
          {t("checkin_complete_title", "Thank you for checking in.")}
        </h2>
        <p className={`text-xs sm:text-sm font-serif italic ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
          {t("checkin_complete_sub", "I'm here with you today.")}
        </p>
      </div>

      {/* Soft Elevated Card: Athena Reflection */}
      <div
        className={`rounded-[20px] border p-6 sm:p-7 text-left space-y-4 shadow-sm relative overflow-hidden transition-all duration-[280ms] ${
          isLight
            ? "bg-[#ffffff] border-[#e8e4dc] text-stone-900"
            : "bg-[#181922] border-[#292b37] text-zinc-100"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-violet-400">
          <Heart size={14} className="fill-current opacity-70" />
          <span className="font-serif">Athena</span>
        </div>

        {isTyping ? (
          /* Part 2: Typing indicator (400–600ms) with no delay longer than 800ms and no spinners */
          <div className="flex items-center gap-2 py-3 px-1 text-sm font-serif italic opacity-70 animate-pulse">
            <span className="text-xs">{t("checkin_listening", "Athena is listening")}</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in duration-[280ms]">
            <p className="text-sm sm:text-base font-serif italic leading-relaxed">
              &ldquo;{checkin.ai_reflection || therapistSentence}&rdquo;
            </p>
          </div>
        )}

        {/* Selected Metrics Summary Bar */}
        <div className={`pt-4 border-t grid grid-cols-2 gap-3 text-center text-xs ${isLight ? "border-stone-200" : "border-zinc-800"}`}>
          <div className={`rounded-[16px] p-2.5 border ${isLight ? "bg-stone-50 border-stone-200 text-stone-700" : "bg-zinc-900/60 border-zinc-800 text-zinc-300"}`}>
            <span className="block text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{t("checkin_mood_label", "Mood")}</span>
            <span className="font-medium flex items-center justify-center gap-1.5 capitalize font-serif">
              <span>{getMoodEmoji(checkin.mood)}</span>
              <span>{checkin.mood}</span>
            </span>
          </div>

          <div className={`rounded-[16px] p-2.5 border ${isLight ? "bg-stone-50 border-stone-200 text-stone-700" : "bg-zinc-900/60 border-zinc-800 text-zinc-300"}`}>
            <span className="block text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{t("checkin_energy_label", "Energy")}</span>
            <span className="font-medium font-serif text-amber-600 dark:text-violet-300">
              {getEnergyLabel(checkin.energy_level)}
            </span>
          </div>
        </div>
      </div>

      {/* Part 10 Buttons: Primary soft violet glow, Secondary transparent with border */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveToSpace}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-[20px] py-3.5 px-5 text-xs sm:text-sm font-serif font-medium border transition-all duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer ${
            savedToSpace
              ? "bg-emerald-600 text-white border-emerald-600"
              : isLight
              ? "bg-transparent hover:bg-stone-100 text-stone-800 border-stone-300"
              : "bg-transparent hover:bg-white/5 text-zinc-200 border-zinc-700"
          }`}
        >
          <BookOpen size={16} className="text-amber-500" />
          <span>{savedToSpace ? t("checkin_saved_space", "Saved to Space") : t("checkin_save_space", "Save to Space")}</span>
        </button>

        <button
          type="button"
          onClick={handleContinueConversation}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-[20px] py-3.5 px-5 text-xs sm:text-sm font-serif font-medium transition-all duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer ${
            isLight
              ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          }`}
        >
          <MessageSquare size={16} />
          <span>{t("checkin_continue_chat", "Continue Conversation")}</span>
        </button>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={onContinue}
          className={`text-xs font-serif opacity-70 hover:opacity-100 transition-opacity cursor-pointer ${
            isLight ? "text-stone-600" : "text-zinc-400"
          }`}
        >
          {t("checkin_close", "Close")}
        </button>
      </div>
    </div>
  );
}
