"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Wind, MessageSquare, Feather, ArrowRight, Play, Compass, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";

interface LivingQuickActionsProps {
  lastStudioMoment?: RecentMoment | null;
  lastConversation?: {
    id?: string;
    title?: string;
    lastMessage?: string;
    updated_at?: string;
  } | null;
  lastJournalEntry?: JournalEntry | null;
  streakDays?: number;
}

export default React.memo(function LivingQuickActions({
  lastStudioMoment,
  lastConversation,
  lastJournalEntry,
  streakDays = 1,
}: LivingQuickActionsProps) {
  const { isLight } = useTheme();

  // Studio continuation data
  const studioData = useMemo(() => {
    const worldName =
      lastStudioMoment?.routine || lastStudioMoment?.moment_text || "Sakura Garden";
    const practice = lastStudioMoment?.practice_type || "breathe";
    const durationLabel = "5-min guided session";
    const href = `/studio?practice=${practice}`;

    return {
      worldName,
      practice,
      durationLabel,
      href,
    };
  }, [lastStudioMoment]);

  // Conversation continuation data
  const conversationData = useMemo(() => {
    const title = lastConversation?.title || "Quiet Sanctuary Chat";
    const snippet =
      lastConversation?.lastMessage ||
      "What gentle shift would bring your heart more ease today?";
    const href = "/chat";

    return {
      title,
      snippet,
      href,
    };
  }, [lastConversation]);

  // Journal continuation data
  const journalData = useMemo(() => {
    const snippet = lastJournalEntry?.content
      ? `"${lastJournalEntry.content.slice(0, 52)}..."`
      : "A private, distraction-free space for your unspoken thoughts.";
    const status = lastJournalEntry
      ? "Recent entry saved"
      : "Today's fresh canvas";
    const href = "/journal";

    return {
      snippet,
      status,
      href,
    };
  }, [lastJournalEntry]);

  const cardBaseStyle = `group relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-250 flex flex-col justify-between hover:-translate-y-0.5 cursor-pointer ${
    isLight
      ? "bg-[#fdfbf7]/90 hover:bg-white border-stone-200/80 hover:border-stone-300 shadow-xs hover:shadow-md"
      : "bg-[#1a1b22]/90 hover:bg-[#21232c] border-[#292b36] hover:border-[#3a3c4a] shadow-xs hover:shadow-lg"
  }`;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs ${
              isLight
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <Compass size={13} />
          </div>
          <h3
            className={`text-sm font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Continue Journey
          </h3>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Remembers your progress
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* CARD 1: Continue Breathing / Studio */}
        <Link href={studioData.href} className={cardBaseStyle}>
          <div>
            <div className="flex items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
                  isLight
                    ? "bg-teal-50 border-teal-200/70 text-teal-700"
                    : "bg-teal-950/40 border-teal-800/40 text-teal-300"
                }`}
              >
                <Wind size={15} />
              </div>
              <span
                className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? "bg-stone-100 border-stone-200 text-stone-600"
                    : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                }`}
              >
                {studioData.worldName}
              </span>
            </div>

            <div className="mt-3.5 space-y-1">
              <h4
                className={`text-sm sm:text-base font-serif font-semibold group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                Continue Breathing
              </h4>
              <p
                className={`text-xs font-serif leading-relaxed line-clamp-2 ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                Resume your guided practice in {studioData.worldName}.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs font-serif">
            <span
              className={`text-[11px] ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {studioData.durationLabel}
            </span>
            <div
              className={`flex items-center gap-1 font-medium transition-transform group-hover:translate-x-1 ${
                isLight ? "text-teal-700" : "text-teal-300"
              }`}
            >
              <span>Resume</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* CARD 2: Continue Conversation */}
        <Link href={conversationData.href} className={cardBaseStyle}>
          <div>
            <div className="flex items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
                  isLight
                    ? "bg-violet-50 border-violet-200/70 text-violet-700"
                    : "bg-violet-950/40 border-violet-800/40 text-violet-300"
                }`}
              >
                <MessageSquare size={15} />
              </div>
              <span
                className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? "bg-violet-50 border-violet-200 text-violet-700"
                    : "bg-violet-950/40 border-violet-800/40 text-violet-300"
                }`}
              >
                Follow-up Ready
              </span>
            </div>

            <div className="mt-3.5 space-y-1">
              <h4
                className={`text-sm sm:text-base font-serif font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                Continue Conversation
              </h4>
              <p
                className={`text-xs font-serif italic leading-relaxed line-clamp-2 ${
                  isLight ? "text-stone-600" : "text-zinc-300"
                }`}
              >
                &ldquo;{conversationData.snippet}&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs font-serif">
            <span
              className={`text-[11px] truncate max-w-[120px] ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {conversationData.title}
            </span>
            <div
              className={`flex items-center gap-1 font-medium transition-transform group-hover:translate-x-1 ${
                isLight ? "text-violet-700" : "text-violet-300"
              }`}
            >
              <span>Reply</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* CARD 3: Space Journal */}
        <Link href={journalData.href} className={cardBaseStyle}>
          <div>
            <div className="flex items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
                  isLight
                    ? "bg-amber-50 border-amber-200/70 text-amber-700"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <Feather size={15} />
              </div>
              <span
                className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? "bg-stone-100 border-stone-200 text-stone-600"
                    : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                }`}
              >
                {journalData.status}
              </span>
            </div>

            <div className="mt-3.5 space-y-1">
              <h4
                className={`text-sm sm:text-base font-serif font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors ${
                  isLight ? "text-stone-900" : "text-zinc-100"
                }`}
              >
                Space Journal
              </h4>
              <p
                className={`text-xs font-serif leading-relaxed line-clamp-2 ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {journalData.snippet}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs font-serif">
            <span
              className={`text-[11px] ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {streakDays}d writing streak
            </span>
            <div
              className={`flex items-center gap-1 font-medium transition-transform group-hover:translate-x-1 ${
                isLight ? "text-amber-700" : "text-amber-300"
              }`}
            >
              <span>Write</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
});
