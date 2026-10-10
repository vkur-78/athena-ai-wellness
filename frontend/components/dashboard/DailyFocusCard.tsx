"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Check, Wind, Heart, RotateCcw } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const DAILY_FOCUSES = [
  {
    id: "focus-shoulders",
    title: "Notice your shoulders today.",
    guidance: "Let them gently drop two inches away from your ears. You don't have to brace against the day.",
    category: "Somatic Ease",
    actionLabel: "60s Breath",
  },
  {
    id: "focus-outside",
    title: "Step outside once.",
    guidance: "Stand still for just sixty seconds and let the open air touch your face.",
    category: "Fresh Presence",
    actionLabel: "Step Outside",
  },
  {
    id: "focus-pause-reply",
    title: "Take one slow breath before replying.",
    guidance: "Whenever someone asks for your attention, give yourself one breath of stillness before you respond.",
    category: "Gentle Boundary",
    actionLabel: "Practice Breath",
  },
  {
    id: "focus-jaw",
    title: "Soften your jaw and unclench your teeth.",
    guidance: "Let your tongue rest gently against the floor of your mouth and let your gaze soften.",
    category: "Tension Release",
    actionLabel: "60s Pause",
  },
  {
    id: "focus-feet",
    title: "Feel your feet against the earth.",
    guidance: "Three times today, simply notice the physical contact of the ground holding you steady.",
    category: "Grounding",
    actionLabel: "Feel Ground",
  },
  {
    id: "focus-water",
    title: "Sip a warm drink with both hands.",
    guidance: "Feel the warmth radiating into your palms and take a quiet moment just for you.",
    category: "Nourishment",
    actionLabel: "Quiet Sip",
  },
  {
    id: "focus-eyes",
    title: "Rest your eyes on something distant.",
    guidance: "Look out the nearest window at the horizon or a distant tree for twenty seconds.",
    category: "Horizon Rest",
    actionLabel: "Look Out",
  },
];

interface DailyFocusCardProps {
  onOpenCalmModal?: () => void;
}

export default React.memo(function DailyFocusCard({
  onOpenCalmModal,
}: DailyFocusCardProps) {
  const { isLight } = useTheme();
  const [isNoticed, setIsNoticed] = useState(false);
  const [showMiniTimer, setShowMiniTimer] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  // Choose exactly one daily focus based on day of year
  const dailyFocus = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return DAILY_FOCUSES[dayOfYear % DAILY_FOCUSES.length];
  }, []);

  // Mini breathing timer toggle
  const handleStartTimer = () => {
    if (onOpenCalmModal) {
      onOpenCalmModal();
      return;
    }
    setShowMiniTimer(true);
    setSecondsRemaining(60);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowMiniTimer(false);
          setIsNoticed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-300 ${
        isLight
          ? "bg-gradient-to-r from-amber-50/60 via-stone-50/50 to-emerald-50/40 border-stone-200/80 shadow-xs"
          : "bg-gradient-to-r from-[#1d1e26]/90 via-[#191b22]/90 to-[#161a22]/90 border-[#2b2d39] shadow-xs"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Gentle Daily Focus Description */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-serif uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${
                isLight
                  ? "bg-amber-100/70 border-amber-200 text-amber-800"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <Sparkles size={11} />
              <span>Daily Gentle Focus</span>
            </span>
            <span
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              • {dailyFocus.category}
            </span>
          </div>

          <h3
            className={`text-base sm:text-lg font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {dailyFocus.title}
          </h3>

          <p
            className={`text-xs sm:text-sm font-serif leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {dailyFocus.guidance}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {showMiniTimer ? (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-serif border animate-pulse ${
                isLight
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
              }`}
            >
              <Wind size={13} className="animate-spin" style={{ animationDuration: "4s" }} />
              <span>Breathe... {secondsRemaining}s</span>
            </div>
          ) : isNoticed ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif font-medium border ${
                isLight
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-emerald-950/40 border-emerald-600/40 text-emerald-300"
              }`}
            >
              <Check size={13} strokeWidth={2.5} />
              <span>Noticed today</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartTimer}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif font-medium shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isLight
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "bg-violet-600 hover:bg-violet-500 text-white"
                }`}
              >
                <Wind size={13} />
                <span>{dailyFocus.actionLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNoticed(true)}
                className={`p-2 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isLight
                    ? "bg-white/80 hover:bg-white text-stone-600 border-stone-200"
                    : "bg-[#232530] hover:bg-[#2b2d3b] text-zinc-300 border-[#383a4a]"
                }`}
                title="Mark as noticed"
                aria-label="Mark daily focus as noticed"
              >
                <Check size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
