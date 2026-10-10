"use client";

import React from "react";
import { CuratedExercise, StudioLanguage } from "@/lib/studioExerciseContent";

interface StudioSessionCompletionProps {
  exercise: CuratedExercise;
  language: StudioLanguage;
  durationSeconds: number;
  onDone: () => void;
  onTryAnother: () => void;
}

export function StudioSessionCompletion({
  exercise,
  language,
  durationSeconds,
  onDone,
  onTryAnother,
}: StudioSessionCompletionProps) {
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  const headingText =
    language === "hi"
      ? "अभ्यास पूर्ण हुआ।"
      : language === "mr"
      ? "सराव पूर्ण झाला."
      : "Practice complete.";

  const completionMessage =
    exercise.completionMessage[language] ||
    exercise.completionMessage.en ||
    (language === "hi"
      ? "आपने अपने लिए शांति के कुछ पल निकाले।"
      : language === "mr"
      ? "तुम्ही स्वतःसाठी काही शांत क्षण दिले."
      : "You gave yourself a few minutes of space.");

  const titleText = exercise.title[language] || exercise.title.en;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#060814] text-[#F8F7FF] flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto selection:bg-[#7C5CFF]/30 select-none animate-in fade-in duration-300"
      role="region"
      aria-label="Practice Completion"
    >
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        {/* Soft Indicator */}
        <div className="space-y-3">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 mx-auto flex items-center justify-center text-xs font-mono text-[#BFAEFF]">
            ✓
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif text-[#F8F7FF] tracking-tight">
            {headingText}
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] font-light leading-relaxed max-w-sm mx-auto">
            {completionMessage}
          </p>
        </div>

        {/* Quiet Practice Summary Box */}
        <div className="py-4 px-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1.5 max-w-xs mx-auto">
          <div className="text-xs uppercase tracking-widest text-[#94A3B8] font-mono">
            {durationMinutes} {language === "hi" ? "मिनट" : language === "mr" ? "मिनिटे" : "minutes"}
          </div>
          <div className="text-base font-serif text-[#F8F7FF]">
            {titleText}
          </div>
        </div>

        {/* Discreet Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={onDone}
            className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-[#F8F7FF] text-sm font-medium transition-all cursor-pointer"
          >
            {language === "hi" ? "संपन्न" : language === "mr" ? "पूर्ण" : "Done"}
          </button>

          <button
            type="button"
            onClick={onTryAnother}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-[#94A3B8] hover:text-[#F8F7FF] hover:bg-white/5 border border-transparent text-sm transition-all cursor-pointer"
          >
            {language === "hi"
              ? "अन्य अभ्यास चुनें"
              : language === "mr"
              ? "दुसरा सराव निवडा"
              : "Try another practice"}
          </button>
        </div>
      </div>
    </div>
  );
}
