"use client";

import { useTheme } from "@/context/ThemeContext";
import { MoodType } from "@/types/checkin";
import clsx from "clsx";

interface MoodOption {
  emoji: string;
  value: MoodType;
  sublabel: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { emoji: "😄", value: "Great", sublabel: "Light & energizing" },
  { emoji: "🙂", value: "Good", sublabel: "Peaceful & steady" },
  { emoji: "😐", value: "Okay", sublabel: "A bit neutral" },
  { emoji: "😔", value: "Low", sublabel: "Heavy or quiet" },
  { emoji: "😣", value: "Very Difficult", sublabel: "Tough to carry" },
];

interface MoodSelectorProps {
  selectedMood: MoodType | string | null;
  onSelectMood: (mood: MoodType) => void;
}

export default function MoodSelector({
  selectedMood,
  onSelectMood,
}: MoodSelectorProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className={clsx("text-xl sm:text-2xl font-semibold tracking-tight", isLight ? "text-stone-900" : "text-white")}>
          How has today felt overall?
        </h2>
        <p className={clsx("text-xs sm:text-sm", isLight ? "text-stone-500" : "text-zinc-400")}>
          Pause for a second and choose the state that matches your day best.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {MOOD_OPTIONS.map((opt) => {
          const isSelected = selectedMood === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelectMood(opt.value)}
              className={clsx(
                "flex sm:flex-col items-center sm:justify-center gap-3.5 sm:gap-2 p-3.5 sm:p-4 rounded-2xl border text-left sm:text-center transition-all duration-200 cursor-pointer group",
                isSelected
                  ? isLight
                    ? "border-violet-400/80 bg-violet-50/90 shadow-md shadow-violet-200/50 scale-[1.03] ring-2 ring-violet-400/30"
                    : "border-violet-500/80 bg-gradient-to-b from-violet-950/60 to-purple-950/40 shadow-lg shadow-violet-500/20 scale-[1.03] ring-2 ring-violet-500/40"
                  : isLight
                    ? "border-stone-200/80 bg-stone-50/70 hover:border-stone-300 hover:bg-stone-100/90 hover:scale-[1.01] active:scale-[0.99]"
                    : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80 hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              <span className="text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-110 select-none">
                {opt.emoji}
              </span>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p
                  className={clsx(
                    "text-sm font-semibold tracking-wide transition-colors",
                    isSelected
                      ? isLight ? "text-violet-900" : "text-violet-200"
                      : isLight ? "text-stone-800 group-hover:text-stone-950" : "text-zinc-200 group-hover:text-white"
                  )}
                >
                  {opt.value}
                </p>
                <p className={clsx("text-[11px] line-clamp-1 sm:mt-0.5", isLight ? "text-stone-500" : "text-zinc-500")}>
                  {opt.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
