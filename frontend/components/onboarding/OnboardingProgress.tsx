"use client";

import Image from "next/image";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  canGoBack?: boolean;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
  onPrevious,
  canGoBack = false,
}: OnboardingProgressProps) {
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="w-full max-w-xl mx-auto mb-6 sm:mb-8 space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2.5">
          <div className="relative h-6 w-6 rounded-[7px] overflow-hidden border border-[#7C5CFF]/40 bg-[#0B1228] shrink-0">
            <Image
              src="/athena-logo.png"
              alt="Athena Logo"
              width={24}
              height={24}
              className="object-cover"
            />
          </div>

          {canGoBack && onPrevious ? (
            <button
              type="button"
              onClick={onPrevious}
              className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title="Previous question"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-violet-400 font-medium">
              <Sparkles size={14} />
              <span>Sanctuary Intake</span>
            </div>
          )}
          <span className="text-zinc-500 font-mono text-[11px]">
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <Clock size={12} className="text-zinc-500" />
          <span>~3 min session</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          style={{ width: `${progressPercent}%` }}
          className="h-full bg-violet-400/90 rounded-full transition-all duration-300 ease-out"
        />
      </div>
    </div>
  );
}
