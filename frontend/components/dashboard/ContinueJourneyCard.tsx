"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Wind, Feather, Compass, ArrowRight, Play, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { HomeReflectionPreview as HomePreviewType } from "@/types/reflection";

interface ContinueJourneyCardProps {
  lastConversation?: {
    id?: string;
    title?: string;
    lastMessage?: string;
    updatedAt?: string;
    updated_at?: string;
  } | null;
  lastStudioMoment?: RecentMoment | null;
  lastJournalEntry?: JournalEntry | null;
  lastReflection?: HomePreviewType | string | null;
  lastReflectionTitle?: string | null;
}

export default function ContinueJourneyCard({
  lastConversation,
  lastStudioMoment,
  lastJournalEntry,
  lastReflection,
  lastReflectionTitle,
}: ContinueJourneyCardProps) {
  const { isLight } = useTheme();

  const cardBaseClasses = `p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group flex items-center justify-between cursor-pointer hover:translate-x-0.5 ${
    isLight
      ? "bg-white/70 hover:bg-white border-[#e7e5e4] hover:border-stone-400/80 shadow-xs hover:shadow-sm"
      : "bg-[#20222a]/70 hover:bg-[#252832] border-[#2c2f3c] hover:border-[#3e4254] shadow-xs"
  }`;

  const studioTitle =
    lastStudioMoment?.routine || lastStudioMoment?.moment_text || "Sakura Garden";
  const studioSubtitle = lastStudioMoment
    ? `${lastStudioMoment.practice_type || "Guided"} session`
    : "4:56 Guided Breath";

  const journalTitle = "Private Space Notebook";
  const journalSubtitle = lastJournalEntry?.content
    ? `${lastJournalEntry.content.slice(0, 34)}...`
    : "Write down your quiet thoughts";

  const reflectionWeekLabel =
    typeof lastReflection === "object" && lastReflection?.week_label
      ? lastReflection.week_label
      : "Weekly Reflection";
  const reflectionTitle =
    lastReflectionTitle ||
    (typeof lastReflection === "object" && lastReflection?.title
      ? lastReflection.title
      : typeof lastReflection === "string"
      ? lastReflection
      : "Explore therapeutic patterns");

  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition-all duration-250 ${
        isLight
          ? "bg-[#fdfbf7]/90 border-[#e7e5e4] shadow-sm"
          : "bg-[#1a1b21]/90 border-[#2a2c36] shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs ${
              isLight
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-[#242632] border-[#363848] text-violet-300"
            }`}
          >
            <Play size={13} className="ml-0.5" />
          </div>
          <h2
            className={`text-sm font-semibold tracking-tight font-serif ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Continue Your Journey
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Pick up where you left off
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Last Conversation */}
        <Link href="/chat" className={cardBaseClasses}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-violet-50 border-violet-200 text-violet-700"
                  : "bg-violet-950/40 border-violet-800/40 text-violet-300"
              }`}
            >
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <span
                className={`text-xs sm:text-sm font-serif font-semibold block truncate ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {lastConversation?.title || "Quiet Conversation"}
              </span>
              <span
                className={`text-[11px] font-serif block truncate max-w-[180px] ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {lastConversation?.lastMessage || "Speak freely with Athena"}
              </span>
            </div>
          </div>
          <ArrowRight
            size={14}
            className={`shrink-0 transition-transform group-hover:translate-x-1 ${
              isLight ? "text-stone-400" : "text-zinc-500"
            }`}
          />
        </Link>

        {/* 2. Last Studio Practice */}
        <Link href="/studio" className={cardBaseClasses}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
              }`}
            >
              <Wind size={16} />
            </div>
            <div className="min-w-0">
              <span
                className={`text-xs sm:text-sm font-serif font-semibold block truncate ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {studioTitle}
              </span>
              <span
                className={`text-[11px] font-serif block truncate ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {studioSubtitle}
              </span>
            </div>
          </div>
          <ArrowRight
            size={14}
            className={`shrink-0 transition-transform group-hover:translate-x-1 ${
              isLight ? "text-stone-400" : "text-zinc-500"
            }`}
          />
        </Link>

        {/* 3. Last Journal Entry */}
        <Link href="/journal" className={cardBaseClasses}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-amber-950/40 border-amber-800/40 text-amber-300"
              }`}
            >
              <Feather size={16} />
            </div>
            <div className="min-w-0">
              <span
                className={`text-xs sm:text-sm font-serif font-semibold block truncate ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {journalTitle}
              </span>
              <span
                className={`text-[11px] font-serif block truncate max-w-[180px] ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {journalSubtitle}
              </span>
            </div>
          </div>
          <ArrowRight
            size={14}
            className={`shrink-0 transition-transform group-hover:translate-x-1 ${
              isLight ? "text-stone-400" : "text-zinc-500"
            }`}
          />
        </Link>

        {/* 4. Last Reflection */}
        <Link href="/reflection/weekly" className={cardBaseClasses}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isLight
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-indigo-950/40 border-indigo-800/40 text-indigo-300"
              }`}
            >
              <Clock size={16} />
            </div>
            <div className="min-w-0">
              <span
                className={`text-xs sm:text-sm font-serif font-semibold block truncate ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                {reflectionWeekLabel}
              </span>
              <span
                className={`text-[11px] font-serif block truncate max-w-[180px] ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {reflectionTitle}
              </span>
            </div>
          </div>
          <ArrowRight
            size={14}
            className={`shrink-0 transition-transform group-hover:translate-x-1 ${
              isLight ? "text-stone-400" : "text-zinc-500"
            }`}
          />
        </Link>
      </div>
    </div>
  );
}
