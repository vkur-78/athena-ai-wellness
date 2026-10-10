"use client";

import React, { useState } from "react";
import { GitBranch, Sparkles, ArrowRight, ArrowDown, CheckCircle2, Shield, Heart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { StressRecoveryFlow } from "@/types/insights";

interface RecoveryJourneyFlowProps {
  flow: StressRecoveryFlow | null;
  loading?: boolean;
}

export default React.memo(function RecoveryJourneyFlow({
  flow,
  loading,
}: RecoveryJourneyFlowProps) {
  const { isLight } = useTheme();
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  // Cause-and-recovery sequence matching Phase 9.2 specifications
  const steps = [
    {
      id: "step-1",
      title: "Work Stress",
      category: "Trigger",
      badge: "Cause",
      emoji: "⚡",
      explanation: "Cognitive tension accumulated from midday deadlines and back-to-back communication.",
      color: isLight ? "#f59e0b" : "#fbbf24",
    },
    {
      id: "step-2",
      title: "Space Journal",
      category: "Action 1",
      badge: "Unburden",
      emoji: "🪶",
      explanation: "Externalizing raw thoughts onto private space creates cognitive room and halts ruminative loops.",
      color: isLight ? "#8b5cf6" : "#a78bfa",
    },
    {
      id: "step-3",
      title: "Guided Breathing",
      category: "Action 2",
      badge: "Downshift",
      emoji: "💨",
      explanation: "5-minute somatic breathing in Sakura Garden physically downshifts autonomic nervous system tone.",
      color: isLight ? "#0d9488" : "#2dd4bf",
    },
    {
      id: "step-4",
      title: "Calm Evening",
      category: "Outcome",
      badge: "Resolved",
      emoji: "✨",
      explanation: "Somatic release achieved with a restorative drop in tension and deep baseline presence.",
      color: isLight ? "#10b981" : "#34d399",
    },
  ];

  const activeStep = activeStepIndex !== null ? steps[activeStepIndex] : null;

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
        isLight
          ? "bg-[#fdfbf7]/90 border-stone-200/80 shadow-xs"
          : "bg-[#1a1b22]/90 border-[#292b36] shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-violet-950/40 border-violet-800/40 text-violet-300"
            }`}
          >
            <GitBranch size={16} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Recovery Journey Flow
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Verified cause-and-recovery sequence • Tap steps to inspect
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
            isLight
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
          }`}
        >
          {flow?.timestamp_context || "Verified Sequence"}
        </span>
      </div>

      {/* Cause-and-Recovery Flow Path */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
          {steps.map((step, idx) => {
            const isSelected = activeStepIndex === idx;

            return (
              <div key={step.id} className="flex flex-col sm:flex-row items-center gap-2">
                {/* Step Card */}
                <div
                  onClick={() => setActiveStepIndex(isSelected ? null : idx)}
                  className={`w-full p-4 rounded-[20px] border transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between hover:-translate-y-0.5 ${
                    isSelected
                      ? isLight
                        ? "bg-white border-violet-400 shadow-sm ring-2 ring-violet-200"
                        : "bg-[#20222c] border-violet-500 shadow-sm ring-2 ring-violet-900/40"
                      : isLight
                      ? "bg-white/80 hover:bg-white border-stone-200/80 shadow-xs"
                      : "bg-[#20222a]/80 hover:bg-[#252834] border-[#2c2f3c] shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-inherit">
                    <span className="text-base">{step.emoji}</span>
                    <span
                      className={`text-[10px] font-serif px-2 py-0.5 rounded-full border ${
                        isLight
                          ? "bg-stone-100 border-stone-200 text-stone-600"
                          : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  <h4
                    className={`text-xs sm:text-sm font-serif font-semibold mt-2.5 ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {step.title}
                  </h4>

                  <span
                    className={`text-[11px] font-serif mt-1 ${
                      isLight ? "text-stone-500" : "text-zinc-400"
                    }`}
                  >
                    {step.category}
                  </span>
                </div>

                {/* Animated Arrow Connector (Down on mobile, Right on desktop) */}
                {idx < steps.length - 1 && (
                  <div className="flex items-center justify-center py-1 sm:py-0 sm:px-1 text-stone-400 dark:text-zinc-600">
                    <ArrowDown size={14} className="sm:hidden" />
                    <ArrowRight size={14} className="hidden sm:inline" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Explanation */}
        {activeStep && (
          <div
            className={`mt-4 rounded-[20px] border p-4 transition-all duration-200 animate-sanctuary-pulse ${
              isLight
                ? "bg-white/95 border-violet-200 shadow-xs"
                : "bg-[#20222a]/95 border-violet-800/40 shadow-xs"
            }`}
            style={{ animationIterationCount: 1 }}
          >
            <div className="flex items-center gap-2 pb-1 text-xs font-serif font-semibold text-violet-600 dark:text-violet-400">
              <Sparkles size={13} />
              <span>Step Detail: {activeStep.title}</span>
            </div>
            <p
              className={`text-xs font-serif leading-relaxed ${
                isLight ? "text-stone-600" : "text-zinc-300"
              }`}
            >
              {activeStep.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
