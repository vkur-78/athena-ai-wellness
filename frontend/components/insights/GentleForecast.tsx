"use client";

import React, { useState } from "react";
import { Compass, Sparkles, Check, Heart, Wind, Feather } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecoveryForecast } from "@/types/insights";

interface GentleForecastProps {
  forecast: RecoveryForecast | null;
  loading?: boolean;
}

export default function GentleForecast({ forecast, loading }: GentleForecastProps) {
  const { isLight } = useTheme();
  const [chosenAction, setChosenAction] = useState<string | null>(null);

  if (loading || !forecast) {
    return (
      <div
        className={`h-36 rounded-3xl border p-6 animate-pulse ${
          isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
        }`}
      />
    );
  }

  const actions = forecast.actions && forecast.actions.length > 0
    ? forecast.actions
    : ["Start Wind-Down", "Journal First", "Not Tonight"];

  const getActionFeedback = (action: string) => {
    switch (action) {
      case "Start Wind-Down":
        return "Sanctuary prepared. Whenever you are ready, Studio practices await softly.";
      case "Journal First":
        return "Space is open. Taking unedited notes before sleep creates room to breathe.";
      case "Not Tonight":
        return "Honored. There is never any requirement to practice. Rest well.";
      default:
        return "Received. Taking care of today at your own quiet pace.";
    }
  };

  return (
    <section aria-labelledby="gentle-forecast-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-violet-500" />
          <h2
            id="gentle-forecast-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Gentle Forecast
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Recurring tendencies • Not predictions
        </span>
      </div>

      <div
        className={`rounded-3xl border p-5 sm:p-7 transition-all duration-250 space-y-4 ${
          isLight
            ? "bg-gradient-to-br from-violet-50/40 via-stone-50/80 to-amber-50/30 border-[#e7e5e4] shadow-xs"
            : "bg-gradient-to-br from-[#1a1b24] via-[#161720] to-[#1c1a26] border-violet-900/30 shadow-xs"
        }`}
      >
        <div className="space-y-1.5">
          <span
            className={`text-[11px] font-serif uppercase tracking-wider block ${
              isLight ? "text-violet-700 font-semibold" : "text-violet-300 font-semibold"
            }`}
          >
            {forecast.context_reason || "Observed Cadence"}
          </span>
          <p
            className={`text-sm sm:text-base font-serif leading-relaxed ${
              isLight ? "text-stone-900 font-medium" : "text-zinc-100 font-medium"
            }`}
          >
            &ldquo;{forecast.forecast_text}&rdquo;
          </p>
        </div>

        {/* Interactive Response Buttons */}
        <div className="pt-1 flex items-center flex-wrap gap-2.5">
          {actions.map((act) => {
            const isSelected = chosenAction === act;
            return (
              <button
                key={act}
                type="button"
                onClick={() => setChosenAction(act)}
                className={`px-4 py-2 rounded-2xl text-xs font-serif font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? isLight
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-violet-600 text-white shadow-xs"
                    : isLight
                    ? "bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 shadow-xs"
                    : "bg-[#20222a] hover:bg-[#282a36] border border-zinc-700/50 text-zinc-300 shadow-xs"
                }`}
              >
                <span>{act}</span>
              </button>
            );
          })}
        </div>

        {/* Warm Conversational Response */}
        {chosenAction && (
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-serif italic animate-in fade-in duration-200 ${
              isLight
                ? "bg-white/80 border-stone-200 text-stone-700"
                : "bg-[#1f2029]/80 border-violet-900/40 text-zinc-300"
            }`}
          >
            {getActionFeedback(chosenAction)}
          </div>
        )}
      </div>
    </section>
  );
}
