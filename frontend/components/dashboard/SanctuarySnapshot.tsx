"use client";

import React from "react";
import Link from "next/link";
import { Smile, Flame, BookOpen, Wind, ArrowRight, Check, Plus, Edit3 } from "lucide-react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";

interface SanctuarySnapshotProps {
  todayCheckin: CheckinResponse | null;
  actualStreak: number;
  journalActivity: {
    countThisWeek: number;
    displayText: string;
    isWaiting: boolean;
  };
  practiceActivity: {
    displayText: string;
    subtext: string;
    hasPractice: boolean;
  };
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
  onOpenCheckinModal?: () => void;
}

function getMoodEmoji(mood?: string | null): string {
  if (!mood) return "🌱";
  const m = mood.toLowerCase();
  if (m.includes("calm") || m.includes("peace") || m.includes("ground")) return "🌿";
  if (m.includes("happy") || m.includes("joy") || m.includes("content")) return "✨";
  if (m.includes("reflect") || m.includes("think") || m.includes("pensive")) return "⛅";
  if (m.includes("anx") || m.includes("stress") || m.includes("overwhelm")) return "🌊";
  if (m.includes("sad") || m.includes("tired") || m.includes("weary") || m.includes("heavy")) return "🌧️";
  return "🌿";
}

export default function SanctuarySnapshot({
  todayCheckin,
  actualStreak,
  journalActivity,
  practiceActivity,
  recentJournals = [],
  recentMoments = [],
  onOpenCheckinModal,
}: SanctuarySnapshotProps) {
  const isCheckedIn = Boolean(todayCheckin);

  // Formatted check-in time
  let checkinTimeStr = "";
  if (todayCheckin?.created_at || todayCheckin?.date) {
    try {
      const d = new Date(todayCheckin.created_at || todayCheckin.date);
      checkinTimeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {}
  }

  const moodName = todayCheckin?.mood
    ? todayCheckin.mood.charAt(0).toUpperCase() + todayCheckin.mood.slice(1)
    : null;

  // Check if journal entry exists for today
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayEntry = recentJournals.find((j) => {
    const dStr = (j.created_at || "").slice(0, 10);
    return dStr === todayDateStr;
  });

  return (
    <section aria-label="Today First Cards" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Today at a Glance
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Every metric is grounded in your real saved journey.
          </p>
        </div>
      </div>

      {/* 4 Real-Data Only Micro Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Mood */}
        <div className="sanctuary-glass flex flex-col justify-between p-6 rounded-[24px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[220ms] hover:-translate-y-1 hover:border-[#7C5CFF]/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30 text-lg shadow-[0_0_12px_rgba(124,92,255,0.2)]">
                {isCheckedIn ? getMoodEmoji(todayCheckin?.mood) : <Smile size={19} />}
              </div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                Today&apos;s Mood
              </span>
            </div>

            <div>
              <div className="text-[20px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF]">
                {isCheckedIn ? moodName : "Not Checked In"}
              </div>
              <p className="text-[12px] font-sans mt-1 text-[#B8BDD6]">
                {isCheckedIn
                  ? `Checked in at ${checkinTimeStr || "session"}`
                  : "Begin your daily sanctuary check-in"}
              </p>
            </div>
          </div>

          <div className="pt-4">
            {!isCheckedIn ? (
              <button
                type="button"
                onClick={onOpenCheckinModal}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#7C5CFF] hover:bg-[#6845F5] text-white text-xs font-medium shadow-[0_0_12px_rgba(124,92,255,0.35)] transition cursor-pointer"
              >
                <span>Begin Check-in</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs text-[#4ADE80]">
                <Check size={14} />
                <span>Recorded today</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Presence */}
        <div className="sanctuary-glass flex flex-col justify-between p-6 rounded-[24px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[220ms] hover:-translate-y-1 hover:border-[#FB7185]/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30 shadow-[0_0_12px_rgba(251,113,133,0.2)]">
                <Flame size={19} className={actualStreak > 0 ? "animate-pulse" : ""} />
              </div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                Presence
              </span>
            </div>

            <div>
              <div className="text-[20px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF] flex items-center gap-2">
                <span>{actualStreak}</span>
                <span className="text-sm font-sans font-normal text-[#B8BDD6]">
                  {actualStreak === 1 ? "day streak" : "day streak"}
                </span>
              </div>
              <p className="text-[12px] font-sans mt-1 text-[#B8BDD6]">
                {actualStreak > 0
                  ? "Continuous daily sanctuary returns"
                  : "Start your streak with today's pause"}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <div className="inline-flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCheckedIn ? "bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" : "bg-[#FBBF24]"
                }`}
              />
              <span className={isCheckedIn ? "text-[#4ADE80]" : "text-[#FBBF24]"}>
                {isCheckedIn ? "Today completed" : "Waiting for today"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Journal */}
        <div className="sanctuary-glass flex flex-col justify-between p-6 rounded-[24px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[220ms] hover:-translate-y-1 hover:border-[#BFAEFF]/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30 shadow-[0_0_12px_rgba(124,92,255,0.2)]">
                <BookOpen size={19} />
              </div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                Space Journal
              </span>
            </div>

            <div>
              <div className="text-[20px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF] truncate">
                {todayEntry ? (todayEntry.title || "Today's Entry") : "No Entry Today"}
              </div>
              <p className="text-[12px] font-sans mt-1 text-[#B8BDD6] truncate">
                {todayEntry
                  ? (todayEntry.content?.slice(0, 45) || "Saved reflection") + "..."
                  : `${journalActivity.countThisWeek} ${
                      journalActivity.countThisWeek === 1 ? "entry" : "entries"
                    } this week`}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/journal"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 hover:bg-[#7C5CFF]/25 text-[#F8F7FF] text-xs font-medium transition cursor-pointer"
            >
              {todayEntry ? (
                <>
                  <Edit3 size={13} />
                  <span>Continue</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Write</span>
                </>
              )}
            </Link>
          </div>
        </div>

        {/* Card 4: Practice */}
        <div className="sanctuary-glass flex flex-col justify-between p-6 rounded-[24px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[220ms] hover:-translate-y-1 hover:border-[#4ADE80]/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 shadow-[0_0_12px_rgba(74,222,128,0.2)]">
                <Wind size={19} />
              </div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#BFAEFF]">
                Studio Practice
              </span>
            </div>

            <div>
              <div className="text-[18px] sm:text-[20px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF] truncate">
                {practiceActivity.hasPractice
                  ? (practiceActivity.displayText.startsWith("Last:")
                      ? practiceActivity.displayText
                      : `Last: ${practiceActivity.displayText}`)
                  : "No Practice Yet"}
              </div>
              <p className="text-[12px] font-sans mt-1 text-[#B8BDD6] truncate">
                {practiceActivity.hasPractice
                  ? practiceActivity.subtext
                  : "Calm your nervous system in Studio"}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/studio"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#4ADE80]/30 bg-[#4ADE80]/15 hover:bg-[#4ADE80]/25 text-[#F8F7FF] text-xs font-medium transition cursor-pointer"
            >
              <span>Explore Studio</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
