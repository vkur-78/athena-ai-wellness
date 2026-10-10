"use client";

import React from "react";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { Wind, BookOpen, Footprints, MessageSquare } from "lucide-react";

interface InsightsRecoveryToolboxProps {
  checkinHistory?: CheckinResponse[];
  recentMoments?: RecentMoment[];
  recentJournals?: JournalEntry[];
  conversations?: any[];
}

export default function InsightsRecoveryToolbox({
  checkinHistory = [],
  recentMoments = [],
  recentJournals = [],
  conversations = [],
}: InsightsRecoveryToolboxProps) {
  // Real counts
  const breathingCount = recentMoments.filter((m) => {
    const t = (m.title || "").toLowerCase();
    return t.includes("breath") || !t.includes("walk");
  }).length;

  const journalCount = recentJournals.length;

  const walkingCount = recentMoments.filter((m) => {
    const t = (m.title || "").toLowerCase();
    return t.includes("walk");
  }).length;

  const conversationCount = Math.max(conversations.length, checkinHistory.length > 0 ? 1 : 0);

  const tools = [
    {
      name: "Breathing & Studio",
      count: breathingCount,
      icon: Wind,
      color: "#7C5CFF",
      barClass: "bg-gradient-to-r from-[#7C5CFF] to-[#BFAEFF]",
    },
    {
      name: "Space Journal",
      count: journalCount,
      icon: BookOpen,
      color: "#38BDF8",
      barClass: "bg-gradient-to-r from-[#38BDF8] to-cyan-300",
    },
    {
      name: "Mindful Walking",
      count: walkingCount,
      icon: Footprints,
      color: "#4ADE80",
      barClass: "bg-gradient-to-r from-[#4ADE80] to-emerald-300",
    },
    {
      name: "Conversation",
      count: conversationCount,
      icon: MessageSquare,
      color: "#FB7185",
      barClass: "bg-gradient-to-r from-[#FB7185] to-rose-300",
    },
  ];

  // Sort descending by real count
  tools.sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...tools.map((t) => t.count), 1);

  return (
    <section aria-label="Recovery Toolbox" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Recovery Toolbox
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Real usage ranking of somatic and mental wellness practices.
          </p>
        </div>

        <span className="text-xs font-sans text-[#959BB4] italic">
          Ranked by completed sessions
        </span>
      </div>

      {/* Main Glass Card with Ranked Bars */}
      <div className="sanctuary-glass p-6 sm:p-8 rounded-[28px] border border-[#7C5CFF]/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.08)] space-y-5">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          // Minimum bar width 12% so even 1 or 0 has aesthetic presence
          const percentage = Math.max(12, Math.round((tool.count / maxCount) * 100));

          return (
            <div key={tool.name} className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-sans">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg border text-xs"
                    style={{
                      backgroundColor: `${tool.color}15`,
                      color: tool.color,
                      borderColor: `${tool.color}30`,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <span className="font-medium text-[#F8F7FF]">{tool.name}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#F8F7FF] font-semibold">{tool.count}</span>
                  <span className="text-[#959BB4]">
                    {tool.count === 1 ? "session" : "sessions"}
                  </span>
                </div>
              </div>

              {/* Real usage ranking bar */}
              <div className="relative h-3 w-full rounded-full bg-[#060814]/80 border border-[#7C5CFF]/15 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${tool.barClass}`}
                  style={{
                    width: `${percentage}%`,
                    boxShadow: `0 0 10px ${tool.color}50`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
