"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sparkles, HelpCircle, X, CheckCircle2 } from "lucide-react";

interface AIReflectionCardProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

export default function AIReflectionCard({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: AIReflectionCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);

  // Evidence counts strictly computed from verified timestamps
  const eveningConvs = useMemo(() => {
    return conversations.filter((c) => {
      const t = c.created_at || c.updated_at;
      if (!t) return false;
      const h = new Date(t).getHours();
      return h >= 18;
    }).length;
  }, [conversations]);

  const eveningJournals = useMemo(() => {
    return recentJournals.filter((j) => {
      if (!j.created_at) return false;
      const h = new Date(j.created_at).getHours();
      return h >= 18;
    }).length;
  }, [recentJournals]);

  const breathingPractices = useMemo(() => {
    return recentMoments.filter((m) => {
      const title = (m.practice_title || m.title || m.routine || m.practice_type || "").toLowerCase();
      return title.includes("breath");
    }).length;
  }, [recentMoments]);

  const totalActivities = (todayCheckin ? 1 : 0) + checkinHistory.length + recentJournals.length + recentMoments.length + conversations.length;
  const hasEnoughData = totalActivities >= 2;

  const { reflectionSentence, evidenceItems } = useMemo(() => {
    if (!hasEnoughData) {
      return {
        reflectionSentence: "Your story is still unfolding. Complete check-ins to see grounded patterns.",
        evidenceItems: [
          { label: "Check-ins recorded", value: `${(todayCheckin ? 1 : 0) + checkinHistory.length} total` },
          { label: "Mindful pauses", value: `${recentMoments.length} total` },
        ],
      };
    }

    if (eveningConvs + eveningJournals >= 2) {
      return {
        reflectionSentence: "You tend to return when evenings become quieter.",
        evidenceItems: [
          { label: "Evening conversations", value: `${eveningConvs} recorded after 6 PM` },
          { label: "Evening reflections", value: `${eveningJournals} written after 6 PM` },
          { label: "Breathing practices", value: `${breathingPractices} sessions` },
        ],
      };
    }

    if (checkinHistory.length >= 2) {
      return {
        reflectionSentence: `You checked in on ${checkinHistory.length} recorded days recently.`,
        evidenceItems: [
          { label: "Daily check-ins", value: `${checkinHistory.length} verified` },
          { label: "Space entries", value: `${recentJournals.length} written` },
          { label: "Studio sessions", value: `${recentMoments.length} completed` },
        ],
      };
    }

    return {
      reflectionSentence: "You are creating steady, deliberate space for your well-being.",
      evidenceItems: [
        { label: "Recent check-ins", value: `${checkinHistory.length + (todayCheckin ? 1 : 0)} logged` },
        { label: "Recent pauses", value: `${recentMoments.length} completed` },
      ],
    };
  }, [hasEnoughData, eveningConvs, eveningJournals, breathingPractices, checkinHistory, todayCheckin, recentJournals, recentMoments]);

  return (
    <section aria-label="Therapeutic AI Reflection" className="relative">
      <div className="relative p-6 sm:p-7 rounded-[26px] border border-[#7C5CFF]/25 bg-gradient-to-r from-[#0F1738] via-[#0B1228] to-[#080D20] backdrop-blur-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        {/* Soft Ambient Spotlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#7C5CFF]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs font-sans font-semibold text-[#BFAEFF]">
              <Sparkles size={11} className="text-[#C4B5FD]" />
              <span>Sanctuary Observation</span>
            </span>
          </div>

          <p className="font-hero-title text-lg sm:text-xl text-[#F8F7FF] font-medium leading-snug">
            “{reflectionSentence}”
          </p>
        </div>

        {/* "Why?" Button */}
        <div className="relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setShowEvidence(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-sans font-semibold text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <HelpCircle size={13} className="text-[#C4B5FD]" />
            <span>Why?</span>
          </button>
        </div>
      </div>

      {/* Transparent Reasoning Evidence Modal */}
      {showEvidence && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-athena-fade"
          onClick={() => setShowEvidence(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[26px] border border-[#7C5CFF]/30 bg-[#0B1228] p-6 sm:p-7 text-white shadow-2xl animate-athena-rise space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="space-y-0.5">
                <span className="text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF]">
                  Transparent Evidence
                </span>
                <h3 className="font-hero-title text-xl text-white font-semibold">
                  Why this observation?
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowEvidence(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#959BB4] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs font-sans text-[#B8BDD6]">
              This observation is derived transparently from your verified activity timestamps without fabrication:
            </p>

            {/* Evidence items */}
            <div className="space-y-2.5">
              {evidenceItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#4ADE80]" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEvidence(false)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
