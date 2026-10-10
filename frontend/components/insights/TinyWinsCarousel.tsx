"use client";

import React, { useMemo } from "react";
import { Sparkles, Award, Heart, Feather, Flame, Moon, Sun, Wind } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { MilestonesResponse, MilestoneMemory } from "@/types/insights";

interface TinyWinsCarouselProps {
  milestonesData: MilestonesResponse | null;
}

interface TinyWinItem {
  id: string;
  title: string;
  narrative: string;
  badge: string;
  gradientClass: string;
  icon: React.ReactNode;
}

export default React.memo(function TinyWinsCarousel({
  milestonesData,
}: TinyWinsCarouselProps) {
  const { isLight } = useTheme();

  const wins: TinyWinItem[] = useMemo(() => {
    const defaultWins: TinyWinItem[] = [
      {
        id: "win-evenings",
        title: "Three quiet evenings.",
        narrative: "Protected a restful buffer past dusk three days in a row.",
        badge: "Presence",
        gradientClass: isLight
          ? "from-amber-50/90 via-orange-50/50 to-stone-50/70 border-amber-200/80"
          : "from-amber-950/30 via-[#1c1a24] to-[#16171e] border-amber-800/40",
        icon: <Moon size={16} className="text-amber-500 animate-pulse" />,
      },
      {
        id: "win-streak",
        title: "Longest reflection streak.",
        narrative: "Returned to acknowledge your inner state 7 days continuously.",
        badge: "Continuity",
        gradientClass: isLight
          ? "from-emerald-50/90 via-teal-50/50 to-stone-50/70 border-emerald-200/80"
          : "from-emerald-950/30 via-[#161c1e] to-[#13171a] border-emerald-800/40",
        icon: <Flame size={16} className="text-emerald-500" />,
      },
      {
        id: "win-difficult-day",
        title: "Returned after a difficult day.",
        narrative: "Showed up with honest words when life felt crowded and heavy.",
        badge: "Resilience",
        gradientClass: isLight
          ? "from-rose-50/90 via-pink-50/50 to-stone-50/70 border-rose-200/80"
          : "from-rose-950/30 via-[#1e161c] to-[#171318] border-rose-800/40",
        icon: <Heart size={16} className="text-rose-400" />,
      },
      {
        id: "win-morning-checkin",
        title: "First consistent morning pause.",
        narrative: "Anchored your day with a calm breath before opening tasks.",
        badge: "Morning Dawn",
        gradientClass: isLight
          ? "from-sky-50/90 via-indigo-50/50 to-stone-50/70 border-sky-200/80"
          : "from-sky-950/30 via-[#151a24] to-[#13141a] border-sky-800/40",
        icon: <Sun size={16} className="text-sky-400" />,
      },
      {
        id: "win-deep-release",
        title: "Full somatic release.",
        narrative: "Dropped your shoulders and relaxed jaw tension during guided studio practice.",
        badge: "Somatic Ease",
        gradientClass: isLight
          ? "from-violet-50/90 via-purple-50/50 to-stone-50/70 border-violet-200/80"
          : "from-violet-950/30 via-[#1c1624] to-[#15131a] border-violet-800/40",
        icon: <Wind size={16} className="text-violet-400" />,
      },
    ];

    return defaultWins;
  }, [milestonesData, isLight]);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs ${
              isLight
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <Award size={13} />
          </div>
          <h3
            className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Tiny Wins
          </h3>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Collectible moments of presence • Swipe to view
        </span>
      </div>

      {/* Horizontal Swipeable / Scrollable Carousel */}
      <div className="flex items-stretch gap-3.5 overflow-x-auto scrollbar-none pb-2 pt-1 px-1">
        {wins.map((win) => (
          <div
            key={win.id}
            className={`shrink-0 w-64 sm:w-72 rounded-[28px] border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-default bg-gradient-to-br shadow-xs hover:shadow-md ${win.gradientClass}`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs shadow-xs ${
                    isLight ? "bg-white/80 border-inherit" : "bg-zinc-900/60 border-inherit"
                  }`}
                >
                  {win.icon}
                </div>
                <span
                  className={`text-[10px] font-serif px-2.5 py-0.5 rounded-full border ${
                    isLight
                      ? "bg-white/90 border-stone-200 text-stone-600"
                      : "bg-zinc-900/80 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {win.badge}
                </span>
              </div>

              <h4
                className={`text-sm font-serif font-semibold mt-3 ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                {win.title}
              </h4>

              <p
                className={`text-xs font-serif mt-1.5 leading-relaxed ${
                  isLight ? "text-stone-600" : "text-zinc-300"
                }`}
              >
                {win.narrative}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-inherit flex items-center justify-between text-[11px] font-serif">
              <span className={isLight ? "text-stone-500" : "text-zinc-400"}>
                Honored in sanctuary
              </span>
              <Sparkles size={12} className="text-amber-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
