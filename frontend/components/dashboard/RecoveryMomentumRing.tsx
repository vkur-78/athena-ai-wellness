"use client";

import React, { useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Sparkles, CheckCircle2 } from "lucide-react";

import {
  calculateCurrentWeekCheckins,
  calculateCurrentWeekJournals,
  calculateCurrentWeekPractices,
  calculateCurrentWeekConversations,
} from "@/lib/dashboardMetrics";

interface RecoveryMomentumRingProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  conversations?: any[];
}

export default function RecoveryMomentumRing({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: RecoveryMomentumRingProps) {
  // Real actions strictly inside the current week (Monday <= date <= today)
  const currentWeekCheckins = useMemo(
    () => calculateCurrentWeekCheckins(checkinHistory, todayCheckin),
    [checkinHistory, todayCheckin]
  );
  const currentWeekJournals = useMemo(
    () => calculateCurrentWeekJournals(recentJournals),
    [recentJournals]
  );
  const currentWeekPractices = useMemo(
    () => calculateCurrentWeekPractices(recentMoments),
    [recentMoments]
  );
  const currentWeekConversations = useMemo(
    () => calculateCurrentWeekConversations(conversations),
    [conversations]
  );

  const checkinCount = currentWeekCheckins.count;
  const journalCount = currentWeekJournals.count;
  const practiceCount = currentWeekPractices.count;
  const conversationCount = currentWeekConversations.count;

  const totalMoments = checkinCount + journalCount + practiceCount + conversationCount;

  // Gentle goal target (e.g. 7 moments for a peaceful week)
  const targetMoments = 7;
  const fillRatio = Math.min(1, totalMoments / targetMoments);

  // SVG circle calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - fillRatio * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/90 to-[#060814]/95 backdrop-blur-xl shadow-lg space-y-4 text-center overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-radial from-[#7C5CFF]/10 to-transparent pointer-events-none" />

      {/* Header Label */}
      <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF]">
        <Sparkles size={12} className="text-[#C4B5FD]" />
        <span>Recovery Momentum</span>
      </div>

      {/* Animated SVG Ring */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Base track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="rgba(124, 92, 255, 0.15)"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Filling ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="url(#momentumGradient)"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C5CFF" />
              <stop offset="50%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <span className="font-hero-title text-3xl sm:text-4xl text-white font-bold tracking-tight">
            {totalMoments}
          </span>
          <span className="text-[11px] sm:text-xs font-sans text-[#DDD6FE] max-w-[100px] leading-tight mt-1">
            mindful {totalMoments === 1 ? "moment" : "moments"} this week
          </span>
        </div>
      </div>

      {/* Real Breakdown Footer */}
      <div className="pt-2 border-t border-white/[0.08] w-full flex items-center justify-around text-[11px] font-sans text-[#B8BDD6]">
        <span>{checkinCount} check-ins</span>
        <span>•</span>
        <span>{journalCount} journals</span>
        <span>•</span>
        <span>{practiceCount} practices</span>
      </div>
    </div>
  );
}
