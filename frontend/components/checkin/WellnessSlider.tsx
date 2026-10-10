"use client";

import { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";
import clsx from "clsx";

interface WellnessSliderProps {
  title: string;
  subtitle?: string;
  value: number;
  onChange: (val: number) => void;
  labels: Record<number, string>;
  metricName: string;
  icon?: ReactNode;
  accentVariant?: "violet" | "teal" | "amber";
}

export default function WellnessSlider({
  title,
  subtitle,
  value,
  onChange,
  labels,
  metricName,
  icon,
  accentVariant = "violet",
}: WellnessSliderProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const currentLabel = labels[value] || `Level ${value}`;

  // Theme styling based on metric variant (gentle, calming tones, no alarming reds)
  const variantStyles = {
    violet: {
      activeText: isLight ? "text-violet-700" : "text-violet-400",
      pillBg: isLight
        ? "bg-violet-100/90 border-violet-300 text-violet-800"
        : "bg-violet-950/60 border-violet-500/50 text-violet-300",
      accentRange: "accent-violet-600",
      glowRing: isLight ? "shadow-violet-200/50" : "shadow-violet-900/30",
    },
    teal: {
      activeText: isLight ? "text-teal-700" : "text-teal-400",
      pillBg: isLight
        ? "bg-teal-100/90 border-teal-300 text-teal-800"
        : "bg-teal-950/60 border-teal-500/50 text-teal-300",
      accentRange: "accent-teal-600",
      glowRing: isLight ? "shadow-teal-200/50" : "shadow-teal-900/30",
    },
    amber: {
      activeText: isLight ? "text-amber-700" : "text-amber-300",
      pillBg: isLight
        ? "bg-amber-100/90 border-amber-300 text-amber-800"
        : "bg-amber-950/50 border-amber-500/40 text-amber-200",
      accentRange: "accent-amber-600",
      glowRing: isLight ? "shadow-amber-200/50" : "shadow-amber-900/30",
    },
  }[accentVariant];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className={clsx("text-xl sm:text-2xl font-semibold tracking-tight", isLight ? "text-stone-900" : "text-white")}>
          {title}
        </h2>
        {subtitle && (
          <p className={clsx("text-xs sm:text-sm max-w-md mx-auto", isLight ? "text-stone-500" : "text-zinc-400")}>
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={clsx(
          "rounded-3xl p-6 sm:p-7 space-y-6 border transition-colors",
          isLight
            ? "border-stone-200/90 bg-stone-50/80 shadow-md shadow-stone-200/50"
            : "border-zinc-800/90 bg-zinc-950/70 backdrop-blur-sm shadow-xl shadow-black/40"
        )}
      >
        {/* Metric Header & Live Value Display */}
        <div className="flex items-center justify-between">
          <div className={clsx("flex items-center gap-2.5 text-xs sm:text-sm font-medium", isLight ? "text-stone-700" : "text-zinc-300")}>
            {icon}
            <span>{metricName}</span>
          </div>

          <div
            className={clsx(
              "px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 shadow-sm",
              variantStyles.pillBg,
              variantStyles.glowRing
            )}
          >
            <span className="font-semibold mr-1.5">{value} / 5</span>
            <span>— {currentLabel}</span>
          </div>
        </div>

        {/* The Range Input Slider */}
        <div className="space-y-3 pt-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value, 10))}
              className={clsx(
                "w-full h-3 rounded-xl cursor-pointer transition-all duration-150 touch-none",
                isLight ? "bg-stone-200" : "bg-zinc-800/90",
                variantStyles.accentRange
              )}
            />
          </div>

          {/* Step notches and labels */}
          <div className="grid grid-cols-5 gap-1 text-center">
            {[1, 2, 3, 4, 5].map((step) => {
              const isCurrent = value === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onChange(step)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <span
                    className={clsx(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
                      isCurrent
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-110"
                        : isLight
                          ? "text-stone-400 group-hover:text-stone-700 group-hover:bg-stone-200/60"
                          : "text-zinc-500 group-hover:text-zinc-300 group-hover:bg-zinc-800/60"
                    )}
                  >
                    {step}
                  </span>
                  <span
                    className={clsx(
                      "text-[10px] sm:text-xs font-medium mt-1 leading-tight transition-colors line-clamp-2 px-0.5",
                      isCurrent
                        ? isLight ? "text-stone-800 font-semibold" : "text-zinc-200 font-semibold"
                        : isLight ? "text-stone-500 group-hover:text-stone-700" : "text-zinc-500 group-hover:text-zinc-400"
                    )}
                  >
                    {labels[step]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
