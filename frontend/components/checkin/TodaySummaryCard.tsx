"use client";

import { useState } from "react";
import { CheckinResponse } from "@/types/checkin";
import { ChevronDown, ChevronUp, Check, Heart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface TodaySummaryCardProps {
  checkin: CheckinResponse;
  onOpenCheckinAgain?: () => void;
}

export default function TodaySummaryCard({
  checkin,
}: TodaySummaryCardProps) {
  const { isLight } = useTheme();
  // Card is slightly collapsed after completion while remaining expandable if thoughts exist
  const hasDetails = Boolean(checkin.ai_reflection || checkin.reflection_text);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`w-full rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 shadow-xs ${
        isLight
          ? "bg-[#fdfbf7] border-[#e7e5e4] text-stone-900"
          : "bg-[#1c1d22] border-[#2a2b33] text-zinc-100"
      }`}
    >
      {/* Primary Serene Completed State: Single quiet acknowledgment */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-emerald-950/40 border-emerald-800/30 text-emerald-400"
            }`}
          >
            <Check size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3
              className={`text-sm font-semibold font-serif ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Thank you for checking in today.
            </h3>
            <p
              className={`text-xs font-serif italic ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Your pause has been safely received.
            </p>
          </div>
        </div>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`p-1.5 rounded-xl transition cursor-pointer sanctuary-hover ${
              isLight
                ? "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
            aria-label={expanded ? "Collapse thought" : "View thought from Athena"}
            title={expanded ? "Collapse" : "A thought from Athena"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}
      </div>

      {/* Expandable Details: Only 'A thought from Athena' or user note */}
      {hasDetails && expanded && (
        <div
          className={`mt-3.5 pt-3 border-t space-y-2.5 animate-in fade-in duration-180 ${
            isLight ? "border-[#e7e5e4]" : "border-[#24252c]"
          }`}
        >
          {checkin.ai_reflection && (
            <div
              className={`rounded-2xl border p-3.5 space-y-1 ${
                isLight
                  ? "bg-[#f8f6f0] border-[#e7e5e4]"
                  : "bg-[#16171b] border-[#24252c]"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider ${
                  isLight ? "text-stone-500" : "text-violet-300"
                }`}
              >
                <Heart size={11} />
                <span>A thought from Athena</span>
              </div>
              <p
                className={`text-xs sm:text-sm font-serif italic leading-relaxed ${
                  isLight ? "text-stone-700" : "text-zinc-300"
                }`}
              >
                &ldquo;{checkin.ai_reflection}&rdquo;
              </p>
            </div>
          )}

          {checkin.reflection_text && (
            <div
              className={`text-xs pl-1 font-serif ${
                isLight ? "text-stone-600" : "text-zinc-400"
              }`}
            >
              <span className={isLight ? "text-stone-400" : "text-zinc-500"}>
                Your note:{" "}
              </span>
              <span>&ldquo;{checkin.reflection_text}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
