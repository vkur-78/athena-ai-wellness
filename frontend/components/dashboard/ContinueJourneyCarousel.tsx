"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { MessageSquare, Wind, BookOpen, Play, ChevronRight, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { LivingReplayData } from "@/types/replay";

interface ContinueJourneyCarouselProps {
  lastConversation?: any;
  lastMoment?: RecentMoment | null;
  lastJournal?: JournalEntry | null;
  weeklyReplay?: LivingReplayData | null;
  onExperienceReplay?: () => void;
}

export default React.memo(function ContinueJourneyCarousel({
  lastConversation,
  lastMoment,
  lastJournal,
  weeklyReplay,
  onExperienceReplay,
}: ContinueJourneyCarouselProps) {
  const { isLight } = useTheme();

  // Helper for human-friendly relative time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  const journalTitle = useMemo(() => {
    if (!lastJournal?.content) return "Private Reflection";
    const firstLine = lastJournal.content.split("\n")[0].trim();
    return firstLine.slice(0, 32) || "Space Contemplation";
  }, [lastJournal]);

  const cards = useMemo(() => {
    return [
      {
        id: "conversation",
        type: "Conversation",
        title: lastConversation?.title || "Reflective Dialogue",
        subtitle: lastConversation?.preview || "Exploring gentle thoughts and daily presence",
        timeAgo: getRelativeTime(lastConversation?.updated_at || lastConversation?.created_at),
        href: "/chat",
        buttonLabel: "Continue",
        icon: MessageSquare,
        accentBg: isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/10 text-amber-300 border-amber-500/30",
      },
      {
        id: "studio",
        type: "Studio",
        title: lastMoment?.routine || lastMoment?.moment_text || "Sakura Meadow Breath",
        subtitle: `${lastMoment?.practice_type || "Guided"} in 3D living sanctuary`,
        timeAgo: getRelativeTime(lastMoment?.started_at),
        href: `/studio?practice=${lastMoment?.practice_type || "breathe"}`,
        buttonLabel: "Continue",
        icon: Wind,
        accentBg: isLight ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-teal-500/10 text-teal-300 border-teal-500/30",
      },
      {
        id: "space",
        type: "Space",
        title: journalTitle,
        subtitle: lastJournal?.content ? `"${lastJournal.content.slice(0, 42)}..."` : "Written contemplation in sanctuary notebook",
        timeAgo: getRelativeTime(lastJournal?.created_at),
        href: "/journal",
        buttonLabel: "Continue",
        icon: BookOpen,
        accentBg: isLight ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-rose-500/10 text-rose-300 border-rose-500/30",
      },
      {
        id: "replay",
        type: "Weekly Replay",
        title: weeklyReplay?.opening_scene?.season_title || "Weekly Arc & Growth",
        subtitle: "Cinematic celebration of this week's quiet moments",
        timeAgo: "This week",
        onClick: onExperienceReplay,
        href: onExperienceReplay ? undefined : "/replay",
        buttonLabel: "View Replay",
        icon: Play,
        accentBg: isLight ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-violet-500/10 text-violet-300 border-violet-500/30",
      },
    ];
  }, [lastConversation, lastMoment, lastJournal, journalTitle, weeklyReplay, onExperienceReplay, isLight]);

  return (
    <section aria-label="Continue Your Journey" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-serif font-semibold tracking-tight">Continue Your Journey</h3>
        <span className="text-[11px] opacity-60">Pick up where you paused</span>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-1 px-1">
        {cards.map((card) => {
          const Icon = card.icon;

          const CardInner = (
            <div
              className={`h-full flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-180 group-hover:-translate-y-1 ${
                isLight
                  ? "bg-white/95 border-stone-200/90 shadow-xs hover:shadow-md hover:border-stone-300"
                  : "bg-[#1a1b22]/95 border-[#282a36] shadow-sm hover:shadow-md hover:border-[#3a3c4c]"
              }`}
            >
              {/* Card Header: Type badge & Time ago */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className={`p-1.5 rounded-lg border text-xs ${card.accentBg}`}>
                    <Icon size={12} />
                  </div>
                  <span className="text-[11px] font-serif uppercase tracking-wider font-semibold opacity-70">
                    {card.type}
                  </span>
                </div>
                <span className="text-[10px] opacity-50 flex items-center gap-0.5">
                  <Clock size={10} />
                  {card.timeAgo}
                </span>
              </div>

              {/* Title & Preview */}
              <div className="my-2 space-y-1">
                <h4 className="text-sm font-serif font-semibold tracking-tight line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-violet-300 transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between border-t border-inherit/40 text-xs font-serif font-medium">
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                  {card.buttonLabel}
                </span>
                <ChevronRight size={13} className="transition-transform group-hover:translate-x-1 duration-180" />
              </div>
            </div>
          );

          if (card.href) {
            return (
              <Link
                key={card.id}
                href={card.href}
                className="shrink-0 w-64 sm:w-72 snap-start group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl"
              >
                {CardInner}
              </Link>
            );
          }

          return (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className="shrink-0 w-64 sm:w-72 text-left snap-start group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl"
            >
              {CardInner}
            </button>
          );
        })}
      </div>
    </section>
  );
});
