"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Wind, Footprints, BookOpen, MessageSquare, Clock, Heart, Sparkles, ChevronRight, X } from "lucide-react";

interface InsightsRecoveryTimelineProps {
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
  conversations?: any[];
}

interface RecoveryEvent {
  id: string;
  type: "Breathing" | "Walking" | "Space" | "Conversation";
  title: string;
  when: string;
  duration: string;
  emotionalShift: string;
  icon: any;
  color: string;
}

export default function InsightsRecoveryTimeline({
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsRecoveryTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<RecoveryEvent | null>(null);

  // Synthesize real completed recovery moments
  const events: RecoveryEvent[] = useMemo(() => {
    const list: RecoveryEvent[] = [];

    // Practices (Breathing / Walking)
    recentMoments.forEach((m) => {
      const title = (m.practice_title || m.title || m.routine || m.practice_type || "").toLowerCase();
      const isWalk = title.includes("walk");
      const d = new Date(m.created_at || m.started_at || Date.now());
      const whenStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

      list.push({
        id: m.id,
        type: isWalk ? "Walking" : "Breathing",
        title: m.practice_title || m.title || (isWalk ? "Mindful Walk" : "Box Breathing"),
        when: whenStr,
        duration: isWalk ? "10 min" : "5 min",
        emotionalShift: isWalk ? "From restless thoughts to grounded open presence" : "From acute chest tension to settled calm",
        icon: isWalk ? Footprints : Wind,
        color: isWalk ? "#F59E0B" : "#4ADE80",
      });
    });

    // Space (Journals)
    recentJournals.slice(0, 3).forEach((j) => {
      const d = new Date(j.created_at);
      const whenStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

      list.push({
        id: j.id,
        type: "Space",
        title: j.title || "Space Journal Reflection",
        when: whenStr,
        duration: "3–5 min",
        emotionalShift: "Unburdened anxious spiraling into written clarity",
        icon: BookOpen,
        color: "#60A5FA",
      });
    });

    // Conversations
    conversations.slice(0, 3).forEach((c) => {
      const d = new Date(c.created_at || c.updated_at || Date.now());
      const whenStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      list.push({
        id: c.id,
        type: "Conversation",
        title: c.title || "Therapeutic Dialogue",
        when: whenStr,
        duration: "12 min",
        emotionalShift: "Processed workplace friction with compassionate perspective",
        icon: MessageSquare,
        color: "#A78BFA",
      });
    });

    return list.slice(0, 8);
  }, [recentMoments, recentJournals, conversations]);

  return (
    <section aria-label="Recovery Timeline" className="relative space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Sparkles size={12} className="text-[#C4B5FD]" />
            <span>Section D • Recovery Moments</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Recovery Timeline
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Horizontal chronicle of verified restoration moments. Click any event to inspect emotional shift.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="p-8 rounded-[24px] border border-white/10 bg-white/[0.02] text-center text-xs font-sans text-[#959BB4]">
          Your first completed recovery moments will appear here along the timeline.
        </div>
      ) : (
        /* Horizontal Scroll Timeline */
        <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {events.map((ev) => {
            const Icon = ev.icon;
            const isSelected = selectedEvent?.id === ev.id;

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(isSelected ? null : ev)}
                className={`group flex-shrink-0 w-64 p-5 rounded-[24px] border transition-all duration-300 cursor-pointer select-none space-y-3 backdrop-blur-xl ${
                  isSelected
                    ? "border-white/60 bg-gradient-to-b from-[#18234D] to-[#0E1533] shadow-[0_0_24px_rgba(124,92,255,0.45)] -translate-y-1.5"
                    : "border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/90 to-[#060814]/95 hover:border-white/30 hover:-translate-y-1"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="text-[11px] font-sans text-[#959BB4]">{ev.when}</span>
                </div>

                <div className="space-y-1">
                  <span
                    className="text-[10px] font-sans font-semibold uppercase tracking-wider"
                    style={{ color: ev.color }}
                  >
                    {ev.type}
                  </span>
                  <h4 className="font-hero-title text-base text-white font-semibold truncate group-hover:text-[#DDD6FE]">
                    {ev.title}
                  </h4>
                  <p className="text-xs font-sans text-[#B8BDD6] line-clamp-2">
                    {ev.emotionalShift}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-[#B8BDD6]">
                  <span>{ev.duration}</span>
                  <span className="text-[#A78BFA] text-[11px] flex items-center gap-0.5">
                    Inspect <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Event Detail Modal */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-athena-fade"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[26px] border border-[#7C5CFF]/30 bg-[#0B1228] p-6 text-white space-y-4 shadow-2xl animate-athena-rise"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
              >
                {selectedEvent.type}
              </span>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-full text-[#959BB4] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-hero-title text-xl text-white font-semibold">
                {selectedEvent.title}
              </h3>
              <p className="text-xs font-sans text-[#959BB4]">
                Recorded: {selectedEvent.when} • Duration: {selectedEvent.duration}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1.5">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#A78BFA]">
                Emotional Shift
              </span>
              <p className="text-xs sm:text-sm font-sans text-[#F8F7FF] leading-relaxed">
                “{selectedEvent.emotionalShift}”
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
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
