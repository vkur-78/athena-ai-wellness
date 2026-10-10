"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Compass, Sun, Moon, Sparkles, ArrowRight, Footprints } from "lucide-react";

interface InsightsGentleGuidanceProps {
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
}

interface GuidanceCard {
  id: string;
  timeframe: string;
  actionText: string;
  href: string;
  icon: any;
  color: string;
}

export default function InsightsGentleGuidance({
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
}: InsightsGentleGuidanceProps) {
  // Generate 3 actionable cards strictly <= 15 words each, derived from behavior
  const cards: GuidanceCard[] = useMemo(() => {
    // Check if user has done breathing
    const hasBreathwork = recentMoments.some((m) => {
      const t = (m.practice_title || m.title || m.routine || m.practice_type || "").toLowerCase();
      return t.includes("breath");
    });

    // Check if user has done walking
    const hasWalk = recentMoments.some((m) => {
      const t = (m.practice_title || m.title || m.routine || m.practice_type || "").toLowerCase();
      return t.includes("walk");
    });

    return [
      {
        id: "guidance-morning",
        timeframe: "Tomorrow Morning",
        // Exactly 5 words:
        actionText: hasBreathwork
          ? "Try a two-minute breathing pause."
          : "Start with a quiet breathing pause.",
        href: "/studio",
        icon: Sun,
        color: "#F59E0B",
      },
      {
        id: "guidance-evening",
        timeframe: "Before Sleep",
        // Exactly 5 words:
        actionText: "Write one sentence in Space.",
        href: "/journal",
        icon: Moon,
        color: "#A78BFA",
      },
      {
        id: "guidance-weekend",
        timeframe: "This Weekend",
        // Exactly 4 words:
        actionText: hasWalk ? "Take a five-minute walk." : "Take an unhurried outdoor stroll.",
        href: "/studio",
        icon: Footprints,
        color: "#4ADE80",
      },
    ];
  }, [recentMoments]);

  return (
    <section aria-label="Gentle Guidance" className="relative space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Compass size={12} className="text-[#C4B5FD]" />
            <span>What should I do next? • Gentle Guidance</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Gentle Next Steps
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Three micro-actions tuned to your rhythm. No rigid schedules or overwhelming goals.
          </p>
        </div>
      </div>

      {/* Three Actionable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              href={card.href}
              className="group relative rounded-[26px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/90 to-[#060814]/95 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7C5CFF]/45 hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7),0_0_24px_rgba(124,92,255,0.2)] overflow-hidden flex flex-col justify-between space-y-6"
            >
              {/* Soft ambient corner glow */}
              <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-35 pointer-events-none"
                style={{ backgroundColor: card.color }}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans uppercase font-bold tracking-wider text-[#959BB4]">
                    {card.timeframe}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${card.color}18`, color: card.color }}
                  >
                    <Icon size={14} />
                  </span>
                </div>

                {/* Action text strictly <= 15 words */}
                <p className="font-hero-title text-lg sm:text-xl text-[#F8F7FF] leading-snug group-hover:text-white transition-colors">
                  “{card.actionText}”
                </p>
              </div>

              {/* Action Link Footer */}
              <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-[#DDD6FE]">
                <span className="font-semibold group-hover:text-white transition-colors">
                  Open practice
                </span>
                <ArrowRight
                  size={14}
                  className="transform transition-transform duration-200 group-hover:translate-x-1 text-[#C4B5FD]"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
