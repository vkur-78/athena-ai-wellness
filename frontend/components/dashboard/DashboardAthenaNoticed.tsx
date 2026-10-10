"use client";

import React, { useMemo } from "react";
import { Sparkles, Compass } from "lucide-react";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardAthenaNoticedProps {
  checkins: CheckinResponse[];
  practices: (RecentMoment | StudioHistoryItem)[];
  journals: JournalEntry[];
  isLight?: boolean;
}

interface EvidenceObservation {
  headline: string;
  narrative: string;
  basis: string;
  hasSufficientEvidence: boolean;
}

export default function DashboardAthenaNoticed({
  checkins,
  practices,
  journals,
  isLight = false,
}: DashboardAthenaNoticedProps) {
  const { t } = useLanguage();

  const observation = useMemo<EvidenceObservation>(() => {
    // 1. Check for Evening Breathing -> Lower Next-Day Stress correlation
    const eveningBreathingDates = new Set<string>();
    practices.forEach((p) => {
      const title = (p as any).exercise_name || (p as any).routine || (p as any).practice_type || "";
      const isBreathing = title.toLowerCase().includes("breath") || title.toLowerCase().includes("pranayama");
      const dtStr = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (isBreathing && dtStr) {
        const dt = new Date(dtStr);
        if (dt.getHours() >= 18) {
          eveningBreathingDates.add(toLocalDateString(dtStr));
        }
      }
    });

    let eveningBreathingLowerStressCount = 0;
    if (eveningBreathingDates.size >= 3) {
      checkins.forEach((c) => {
        const cDate = toLocalDateString(c.date || c.created_at);
        // Find previous day
        const curDate = new Date(cDate);
        curDate.setDate(curDate.getDate() - 1);
        const prevDateStr = toLocalDateString(curDate);
        if (eveningBreathingDates.has(prevDateStr)) {
          const stress = Number(c.stress_level || (c as any).stress || 3);
          if (stress <= 2) {
            eveningBreathingLowerStressCount++;
          }
        }
      });
    }

    if (eveningBreathingLowerStressCount >= 5) {
      return {
        headline: "Evening Breathing & Next-Morning Ease",
        narrative:
          "Your evening breathing sessions have often been followed by lower reported stress the following morning.",
        basis: `Observed across ${eveningBreathingLowerStressCount} comparable consecutive days`,
        hasSufficientEvidence: true,
      };
    }

    // 2. Check for Weekend Contemplation Consistency
    const weekendJournals = journals.filter((j) => {
      const dt = new Date(j.created_at);
      const day = dt.getDay();
      return day === 0 || day === 6;
    });

    if (weekendJournals.length >= 8) {
      return {
        headline: "Weekend Reflection Anchor",
        narrative:
          "You tend to dedicate more deliberate time to Space journaling during weekends, writing deeper contemplations.",
        basis: `Based on ${weekendJournals.length} weekend reflections`,
        hasSufficientEvidence: true,
      };
    }

    // 3. Check for Post-Practice Calm Check-in
    let postPracticeCalmCount = 0;
    const practiceDates = new Set<string>();
    practices.forEach((p) => {
      const dtStr = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (dtStr) practiceDates.add(toLocalDateString(dtStr));
    });

    checkins.forEach((c) => {
      const cDate = toLocalDateString(c.date || c.created_at);
      if (practiceDates.has(cDate)) {
        const energy = Number(c.energy_level || (c as any).energy || 3);
        const stress = Number(c.stress_level || (c as any).stress || 3);
        if (energy >= 3 && stress <= 2) {
          postPracticeCalmCount++;
        }
      }
    });

    if (postPracticeCalmCount >= 6) {
      return {
        headline: "Practice Rhythm Alignment",
        narrative:
          "Days with completed Studio practices show higher energy and lower stress reports compared to your baseline.",
        basis: `Observed in ${postPracticeCalmCount} practice days`,
        hasSufficientEvidence: true,
      };
    }

    // Insufficient evidence fallback (new user or light history)
    return {
      headline: "Observing Your Unfolding Rhythm",
      narrative:
        "Keep checking in and taking quiet moments. Athena will begin noticing patterns as your history grows.",
      basis: "Building your personal longitudinal baseline",
      hasSufficientEvidence: false,
    };
  }, [checkins, practices, journals]);

  return (
    <div
      className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all ${
        isLight
          ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-[rgba(124,92,255,0.18)] shadow-[0_4px_24px_-4px_rgba(110,79,230,0.08)]"
          : "bg-gradient-to-br from-[#0E152E]/90 via-[#0B1228]/80 to-[#12102E]/70 border-[#7C5CFF]/30 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.8)]"
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-30 ${
          isLight ? "bg-indigo-400" : "bg-[#7C5CFF]"
        }`}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded-lg ${
                isLight ? "bg-indigo-600/10 text-indigo-700" : "bg-[#7C5CFF]/20 text-[#BFAEFF]"
              }`}
            >
              <Sparkles size={14} />
            </div>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                isLight ? "text-indigo-700" : "text-[#BFAEFF]"
              }`}
            >
              Something Athena Noticed
            </span>
          </div>

          <h3
            className={`text-base sm:text-lg font-serif font-medium tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {observation.headline}
          </h3>

          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? "text-stone-700" : "text-[#D1D5DB]"
            }`}
          >
            &ldquo;{observation.narrative}&rdquo;
          </p>
        </div>

        <div
          className={`shrink-0 px-3.5 py-2 rounded-2xl border text-right self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end ${
            isLight
              ? "bg-white/80 border-indigo-200/80 text-stone-600"
              : "bg-white/5 border-white/10 text-[#94A3B8]"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
            Empirical Basis
          </span>
          <span className="text-[11px] font-mono font-medium">{observation.basis}</span>
        </div>
      </div>
    </div>
  );
}
