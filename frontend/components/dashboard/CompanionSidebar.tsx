"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Sparkles, Wind, MessageSquare, ArrowRight, BookOpen } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import CalmEnergyOrb from "@/components/dashboard/CalmEnergyOrb";
import CareCenterPreviewCard from "@/components/dashboard/CareCenterPreviewCard";

interface CompanionSidebarProps {
  todayCheckin?: CheckinResponse | null;
  checkinHistory?: CheckinResponse[];
  lastMoment?: RecentMoment | null;
  lastConversation?: any;
  onOpenCareCenter: () => void;
  onOpenInsights?: () => void;
}

const GENTLE_FOCUSES = [
  "Be gentle with unfinished thoughts.",
  "You do not have to solve everything today.",
  "Let your breathing anchor your attention.",
  "Give yourself permission to pause between moments.",
  "Rest is a quiet form of progress.",
  "Notice where tension is holding, and gently release it.",
];

export default React.memo(function CompanionSidebar({
  todayCheckin,
  checkinHistory = [],
  lastMoment,
  lastConversation,
  onOpenCareCenter,
  onOpenInsights,
}: CompanionSidebarProps) {
  const { isLight } = useTheme();

  // One sentence focus for today
  const todayFocusSentence = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return GENTLE_FOCUSES[dayOfYear % GENTLE_FOCUSES.length];
  }, []);

  return (
    <aside
      aria-label="Athena Companion Panel"
      className="space-y-5 lg:sticky lg:top-16"
    >
      {/* 1. Calm Energy Orb */}
      <CalmEnergyOrb
        todayCheckin={todayCheckin}
        checkinHistory={checkinHistory}
        onOpenInsights={onOpenInsights}
      />

      {/* 2. Today's Focus (One Sentence) */}
      <div
        className={`relative overflow-hidden rounded-[28px] border p-5 transition-all duration-200 ${
          isLight
            ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-xs"
            : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-sm"
        }`}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-serif tracking-widest opacity-60 pb-2">
          <Sparkles size={11} className="text-amber-500" />
          <span>Today&apos;s Focus</span>
        </div>

        <p className="text-sm font-serif italic leading-relaxed">
          &ldquo;{todayFocusSentence}&rdquo;
        </p>
      </div>

      {/* 3. Quick Resume */}
      <div
        className={`relative overflow-hidden rounded-[28px] border p-5 transition-all duration-200 ${
          isLight
            ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-xs"
            : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between pb-2.5">
          <span className="text-[10px] uppercase font-serif tracking-widest opacity-60">Quick Resume</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {lastMoment ? (
          <Link
            href={`/studio?practice=${lastMoment.practice_type || "breathe"}`}
            className="group flex items-center justify-between gap-3 text-xs font-serif hover:text-amber-700 dark:hover:text-violet-300 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg border border-inherit/40 bg-teal-500/10 text-teal-600 dark:text-teal-300">
                <Wind size={13} />
              </div>
              <span className="line-clamp-1 font-medium">
                {lastMoment.routine || "Sakura Breathwork"}
              </span>
            </div>
            <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-1 duration-180" />
          </Link>
        ) : lastConversation ? (
          <Link
            href="/chat"
            className="group flex items-center justify-between gap-3 text-xs font-serif hover:text-amber-700 dark:hover:text-violet-300 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg border border-inherit/40 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <MessageSquare size={13} />
              </div>
              <span className="line-clamp-1 font-medium">
                {lastConversation.title || "Mindful Reflection"}
              </span>
            </div>
            <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-1 duration-180" />
          </Link>
        ) : (
          <Link
            href="/studio"
            className="group flex items-center justify-between gap-3 text-xs font-serif hover:text-amber-700 dark:hover:text-violet-300 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg border border-inherit/40 bg-teal-500/10 text-teal-600 dark:text-teal-300">
                <Wind size={13} />
              </div>
              <span className="line-clamp-1 font-medium">Open 3D Studio</span>
            </div>
            <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-1 duration-180" />
          </Link>
        )}
      </div>

      {/* 4. Care Center Trust Card */}
      <CareCenterPreviewCard onOpenCareCenter={onOpenCareCenter} />
    </aside>
  );
});
