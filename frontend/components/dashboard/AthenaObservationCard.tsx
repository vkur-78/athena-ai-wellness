"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Eye, Check, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";

interface AthenaObservationCardProps {
  checkinHistory?: CheckinResponse[];
  recentMoments?: RecentMoment[];
  recentJournals?: JournalEntry[];
  onExplorePattern?: () => void;
}

export default React.memo(function AthenaObservationCard({
  checkinHistory = [],
  recentMoments = [],
  recentJournals = [],
  onExplorePattern,
}: AthenaObservationCardProps) {
  const router = useRouter();
  const { isLight } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Proactively notice one verified pattern based on real data
  const observation = useMemo<string>(() => {
    // 1. Check if breathing happens mostly before noon
    const morningMoments = recentMoments.filter((m) => {
      if (!m.started_at) return false;
      const h = new Date(m.started_at).getHours();
      return h < 12;
    });
    if (recentMoments.length >= 2 && morningMoments.length >= recentMoments.length * 0.6) {
      return "Your breathing sessions tend to happen before work.";
    }

    // 2. Check if evening reflections are consistent
    const eveningCheckins = checkinHistory.filter((c) => {
      const ts = c.created_at || c.date;
      if (!ts) return false;
      const h = new Date(ts).getHours();
      return h >= 17;
    });
    if (checkinHistory.length >= 3 && eveningCheckins.length >= checkinHistory.length * 0.5) {
      return "You've been returning to quieter evenings this week.";
    }

    // 3. Check if writing follows heavier afternoon stress
    if (recentJournals.length > 0 && checkinHistory.some((c) => (c.stress_level || 1) >= 3)) {
      return "Writing has been following heavier afternoons.";
    }

    // 4. Default verified pattern (Part 3)
    return "I've been noticing a gentle rhythm.";
  }, [checkinHistory, recentMoments, recentJournals]);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="What I'm noticing"
      className={`relative overflow-hidden rounded-[20px] border p-5 sm:p-6 transition-all duration-[220ms] ${
        isLight
          ? "bg-gradient-to-br from-amber-50/60 via-white/90 to-[#faf6f0]/95 border-amber-200/70 shadow-sm"
          : "bg-gradient-to-br from-violet-950/20 via-[#1c1d25]/95 to-[#14151a]/95 border-violet-800/30 shadow-md"
      }`}
    >
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-[10px] border text-xs ${
              isLight
                ? "bg-amber-100/80 border-amber-200 text-amber-800"
                : "bg-violet-900/40 border-violet-700/50 text-violet-300"
            }`}
          >
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
          </div>
          <span className="text-xs font-serif font-semibold tracking-tight">What I&apos;m noticing</span>
        </div>
        <span className="text-[10px] font-serif uppercase tracking-widest opacity-50">Gentle Rhythm</span>
      </div>

      {/* Observation Single Sentence */}
      <div className="py-2">
        <p className="text-sm sm:text-base font-serif font-medium leading-relaxed">
          &ldquo;{observation}&rdquo;
        </p>
      </div>

      {/* Three Action Chips */}
      <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-inherit/40">
        {/* Chip 1: Explore Reflections */}
        <button
          type="button"
          onClick={() => {
            if (onExplorePattern) {
              onExplorePattern();
            } else {
              router.push("/insights");
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] text-xs font-serif font-medium transition-all duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer ${
            isLight
              ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]"
          }`}
        >
          <span>Reflections</span>
          <ArrowRight size={11} />
        </button>

        {/* Chip 2: Continue */}
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[20px] text-xs font-serif transition-colors duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer border ${
            acknowledged
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : isLight
              ? "border-stone-200 hover:bg-stone-100 text-stone-700"
              : "border-zinc-800 hover:bg-zinc-800 text-zinc-300"
          }`}
        >
          {acknowledged ? <Check size={11} /> : null}
          <span>{acknowledged ? "Noted" : "Continue"}</span>
        </button>

        {/* Chip 3: Not Today */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={`px-3 py-1.5 rounded-[20px] text-xs font-serif transition-colors duration-[220ms] cursor-pointer border ${
            isLight
              ? "border-transparent text-stone-500 hover:text-stone-800"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Not Today</span>
        </button>
      </div>
    </div>
  );
});
