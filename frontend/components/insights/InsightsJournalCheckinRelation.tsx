"use client";

import React from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";

interface InsightsJournalCheckinRelationProps {
  checkins: CheckinResponse[];
  journals: JournalEntry[];
}

export default function InsightsJournalCheckinRelation({
  checkins,
  journals,
}: InsightsJournalCheckinRelationProps) {
  // Map distinct calendar dates
  const checkinDates = new Set(
    checkins.map((c) => (c.date || c.created_at || "").slice(0, 10)).filter(Boolean)
  );

  const journalDates = new Set(
    journals.map((j) => (j.created_at || "").slice(0, 10)).filter(Boolean)
  );

  // Overlap
  const sharedDays = Array.from(checkinDates).filter((d) => journalDates.has(d));

  // Only display if sufficient real data exists
  if (checkinDates.size < 2 && journalDates.size < 2) {
    return null;
  }

  const checkinOnlyCount = checkinDates.size - sharedDays.length;
  const journalOnlyCount = journalDates.size - sharedDays.length;
  const sharedCount = sharedDays.length;

  return (
    <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-serif text-[#F8F7FF]">
          Check-in & Journal Relationship
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8]">
          How journaling and check-in habits complement your routine
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
          <div className="text-xs font-mono text-[#94A3B8]">Check-in Days</div>
          <div className="text-2xl font-serif text-[#F8F7FF]">{checkinDates.size}</div>
          <p className="text-[11px] text-[#94A3B8]">Quick emotional touchpoints</p>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
          <div className="text-xs font-mono text-[#94A3B8]">Journal Days</div>
          <div className="text-2xl font-serif text-[#F8F7FF]">{journalDates.size}</div>
          <p className="text-[11px] text-[#94A3B8]">Deeper reflective writing</p>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
          <div className="text-xs font-mono text-[#BFAEFF]">Combined Days</div>
          <div className="text-2xl font-serif text-[#F8F7FF]">{sharedCount}</div>
          <p className="text-[11px] text-[#94A3B8]">Days with both practices</p>
        </div>
      </div>

      <p className="text-xs text-[#94A3B8]/80 leading-relaxed pt-1">
        {sharedCount > 0
          ? `On days you journaled and checked in, you gave yourself multiple touchpoints to process what was present.`
          : `You use check-ins and journaling at different moments depending on what you need.`}
      </p>
    </section>
  );
}
