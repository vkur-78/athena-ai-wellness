"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Feather } from "lucide-react";

interface InsightsAISynthesisProps {
  checkins: CheckinResponse[];
  practices: RecentMoment[];
  journals: JournalEntry[];
  conversations: any[];
}

export default function InsightsAISynthesis({
  checkins,
  practices,
  journals,
  conversations,
}: InsightsAISynthesisProps) {
  // Synthesize observations from structured user data
  const synthesis = useMemo(() => {
    const totalActivities = checkins.length + practices.length + journals.length + conversations.length;
    if (totalActivities === 0) {
      return null;
    }

    const observations: { title: string; text: string }[] = [];

    // 1. Practice patterns
    if (practices.length > 0) {
      const breathingCount = practices.filter((p) =>
        (p.exercise_category || "").toUpperCase().includes("BREATH")
      ).length;
      if (breathingCount > 0) {
        observations.push({
          title: "Grounded breathwork",
          text: `You have returned to breathing practices ${breathingCount} time${breathingCount > 1 ? "s" : ""}, creating steady pauses throughout your routine.`,
        });
      } else {
        observations.push({
          title: "Intentional pausing",
          text: `You have dedicated time for ${practices.length} guided practice${practices.length > 1 ? "s" : ""}, giving yourself quiet space to reset.`,
        });
      }
    }

    // 2. Emotional consistency
    if (checkins.length >= 2) {
      observations.push({
        title: "Emotional awareness",
        text: `Your check-ins show regular moments of checking in with how you are arriving, fostering continuous self-attunement.`,
      });
    }

    // 3. Reflective expression
    if (journals.length > 0) {
      observations.push({
        title: "Space for writing",
        text: `You have captured ${journals.length} journal reflection${journals.length > 1 ? "s" : ""}, untangling thoughts in your private writing sanctuary.`,
      });
    }

    // Gentle Next Step
    const nextStep =
      practices.length === 0
        ? "Try a 2-minute reset in Studio whenever your mind feels hurried."
        : "Continue giving yourself permission to pause whenever you feel the day picking up speed.";

    return {
      observations,
      nextStep,
    };
  }, [checkins, practices, journals, conversations]);

  if (!synthesis || synthesis.observations.length === 0) {
    return null;
  }

  return (
    <section className="p-6 sm:p-8 rounded-2xl border border-[rgba(124,92,255,0.2)] bg-[rgba(124,92,255,0.03)] space-y-5">
      <div className="flex items-center gap-2 text-xs font-mono text-[#BFAEFF] tracking-wider uppercase">
        <Feather size={14} />
        <span>Athena Reflective Synthesis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {synthesis.observations.map((obs, i) => (
          <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
            <h3 className="text-sm font-serif text-[#F8F7FF]">{obs.title}</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{obs.text}</p>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#94A3B8]">
        <span>Suggested next step:</span>
        <span className="text-[#F8F7FF] font-medium text-right max-w-md">
          {synthesis.nextStep}
        </span>
      </div>
    </section>
  );
}
