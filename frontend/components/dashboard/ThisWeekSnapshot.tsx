"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import {
  Calendar,
  MessageSquare,
  BookOpen,
  Wind,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import {
  calculateCurrentWeekCheckins,
  calculateCurrentWeekConversations,
  calculateCurrentWeekJournals,
  calculateCurrentWeekPractices,
} from "@/lib/dashboardMetrics";

interface ThisWeekSnapshotProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

type ModalType = "checkins" | "conversations" | "journals" | "practices" | null;

export default function ThisWeekSnapshot({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: ThisWeekSnapshotProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Filter strictly to current week (Monday <= date <= today)
  const currentWeekCheckins = useMemo(
    () => calculateCurrentWeekCheckins(checkinHistory, todayCheckin),
    [checkinHistory, todayCheckin]
  );
  const currentWeekConversations = useMemo(
    () => calculateCurrentWeekConversations(conversations),
    [conversations]
  );
  const currentWeekJournals = useMemo(
    () => calculateCurrentWeekJournals(recentJournals),
    [recentJournals]
  );
  const currentWeekPractices = useMemo(
    () => calculateCurrentWeekPractices(recentMoments),
    [recentMoments]
  );

  const checkinCount = currentWeekCheckins.count;
  const conversationCount = currentWeekConversations.count;
  const journalCount = currentWeekJournals.count;
  const practiceCount = currentWeekPractices.count;

  const cards = [
    {
      id: "checkins" as const,
      label: "Check-ins",
      count: checkinCount,
      icon: Calendar,
      color: "#A78BFA",
      description: "Daily self-attunement logs",
    },
    {
      id: "conversations" as const,
      label: "Conversations",
      count: conversationCount,
      icon: MessageSquare,
      color: "#60A5FA",
      description: "Therapeutic dialogues",
    },
    {
      id: "journals" as const,
      label: "Journal Entries",
      count: journalCount,
      icon: BookOpen,
      color: "#F59E0B",
      description: "Space written reflections",
    },
    {
      id: "practices" as const,
      label: "Practices",
      count: practiceCount,
      icon: Wind,
      color: "#4ADE80",
      description: "Studio somatic sessions",
    },
  ];

  return (
    <section aria-label="This Week Snapshot" className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Sparkles size={12} className="text-[#C4B5FD]" />
            <span>Activity Overview • Verified Records</span>
          </div>
          <h2 className="font-hero-title text-xl sm:text-2xl text-[#F8F7FF] tracking-tight">
            This Week’s Snapshot
          </h2>
        </div>
        <span className="text-xs font-sans text-[#959BB4] hidden sm:inline">
          Tap any card for detailed history
        </span>
      </div>

      {/* 4 Interactive Mini Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveModal(card.id)}
              className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-[22px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/90 to-[#060814]/95 backdrop-blur-xl text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#7C5CFF]/45 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(124,92,255,0.18)] cursor-pointer focus:outline-none"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span
                  className="p-2 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${card.color}15`,
                    borderColor: `${card.color}35`,
                    color: card.color,
                  }}
                >
                  <Icon size={16} />
                </span>

                <span className="text-xs text-[#959BB4] group-hover:text-white transition-colors flex items-center">
                  Details <ChevronRight size={12} />
                </span>
              </div>

              <div>
                <span className="font-hero-title text-2xl sm:text-3xl text-white font-bold tracking-tight">
                  {card.count}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[#DDD6FE] mt-0.5">
                  {card.label}
                </p>
                <p className="text-[10px] font-sans text-[#959BB4] mt-0.5 line-clamp-1">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Modal */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-athena-fade"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[28px] border border-[#7C5CFF]/30 bg-[#0B1228] p-6 sm:p-8 text-white shadow-2xl animate-athena-rise space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="space-y-0.5">
                <span className="text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF]">
                  Verified Breakdown
                </span>
                <h3 className="font-hero-title text-2xl text-white font-semibold capitalize">
                  {activeModal}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#959BB4] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Based on Modal Type */}
            <div className="space-y-3">
              {activeModal === "checkins" && (
                currentWeekCheckins.records.length === 0 ? (
                  <p className="text-sm font-sans text-[#959BB4] italic">No check-ins recorded for this current week yet.</p>
                ) : (
                  currentWeekCheckins.records.map((c: CheckinResponse, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-sans">
                      <div>
                        <span className="font-semibold text-white">{c.mood || "Gentle check-in"}</span>
                        {c.reflection_text && (
                          <p className="text-[#B8BDD6] text-[11px] italic mt-0.5">“{c.reflection_text}”</p>
                        )}
                      </div>
                      <span className="text-[#959BB4]">{new Date(c.date || c.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))
                )
              )}

              {activeModal === "conversations" && (
                currentWeekConversations.records.length === 0 ? (
                  <p className="text-sm font-sans text-[#959BB4] italic">No conversations recorded this week.</p>
                ) : (
                  currentWeekConversations.records.map((conv: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{conv.title || "Reflective Dialogue"}</span>
                        <span className="text-[#959BB4]">{new Date(conv.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      {conv.summary && (
                        <p className="text-[#B8BDD6] text-[11px]">
                          Topic: {conv.summary}
                        </p>
                      )}
                    </div>
                  ))
                )
              )}

              {activeModal === "journals" && (
                currentWeekJournals.records.length === 0 ? (
                  <p className="text-sm font-sans text-[#959BB4] italic">No journal entries written this week.</p>
                ) : (
                  currentWeekJournals.records.map((j: JournalEntry, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{j.title || "Space Note"}</span>
                        <span className="text-[#959BB4]">{new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <p className="text-[#B8BDD6] text-[11px] line-clamp-2">
                        {j.content}
                      </p>
                    </div>
                  ))
                )
              )}

              {activeModal === "practices" && (
                currentWeekPractices.records.length === 0 ? (
                  <p className="text-sm font-sans text-[#959BB4] italic">No practices completed this week.</p>
                ) : (
                  currentWeekPractices.records.map((m: RecentMoment, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-sans">
                      <div>
                        <span className="font-semibold text-white">{m.practice_title || m.title || (m as any).routine || "Studio Practice"}</span>
                        <p className="text-[#4ADE80] text-[11px]">✓ Practice completed</p>
                      </div>
                      <span className="text-[#959BB4]">{new Date(m.created_at || (m as any).started_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
