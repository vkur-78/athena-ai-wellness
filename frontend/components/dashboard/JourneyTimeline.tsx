"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Feather, Wind, MessageSquare, BookOpen, Sparkles, Check, Clock, LucideIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";

interface JourneyTimelineProps {
  todayCheckin?: CheckinResponse | null;
  recentMoments?: RecentMoment[];
  recentJournals?: JournalEntry[];
  conversations?: any[];
  onOpenCheckinModal?: () => void;
}

interface TimelineNode {
  id: string;
  stage: "Morning" | "Breathing" | "Conversation" | "Journal" | "Studio" | "Now";
  title: string;
  subtitle: string;
  timeLabel: string;
  isCompleted: boolean;
  isCurrent: boolean;
  icon: LucideIcon;
  route?: string;
  onAction?: () => void;
}

export default React.memo(function JourneyTimeline({
  todayCheckin,
  recentMoments = [],
  recentJournals = [],
  conversations = [],
  onOpenCheckinModal,
}: JourneyTimelineProps) {
  const router = useRouter();
  const { isLight } = useTheme();

  const nodes: TimelineNode[] = useMemo(() => {
    const hasCheckin = Boolean(todayCheckin);
    const hasStudio = recentMoments.length > 0;
    const hasConv = conversations.length > 0;
    const hasJournal = recentJournals.length > 0;
    const journalTitle = recentJournals[0]?.content
      ? recentJournals[0].content.split("\n")[0].slice(0, 32)
      : "Space Contemplation";

    return [
      {
        id: "morning",
        stage: "Morning",
        title: hasCheckin ? `Morning Alignment (${todayCheckin?.mood || "grounded"})` : "Morning Arrival",
        subtitle: hasCheckin ? "Daily emotional baseline set" : "Waiting for today's quiet check-in",
        timeLabel: hasCheckin ? "Checked in" : "Morning",
        isCompleted: hasCheckin,
        isCurrent: !hasCheckin,
        icon: Feather,
        onAction: onOpenCheckinModal,
      },
      {
        id: "breathing",
        stage: "Breathing",
        title: hasStudio ? recentMoments[0]?.routine || "4-7-8 Guided Breath" : "Somatic Breathwork",
        subtitle: hasStudio ? "Restorative nervous system reset" : "3-minute guided breath pause",
        timeLabel: hasStudio ? "Completed" : "Sanctuary",
        isCompleted: hasStudio,
        isCurrent: hasCheckin && !hasStudio,
        icon: Wind,
        route: `/studio?practice=breathe`,
      },
      {
        id: "conversation",
        stage: "Conversation",
        title: hasConv ? conversations[0]?.title || "Athena Dialogue" : "Reflective Dialogue",
        subtitle: hasConv ? "Continuing mindful thoughts" : "A safe space to explore feelings",
        timeLabel: hasConv ? "Active" : "Conversation",
        isCompleted: hasConv,
        isCurrent: hasStudio && !hasConv,
        icon: MessageSquare,
        route: "/chat",
      },
      {
        id: "journal",
        stage: "Journal",
        title: hasJournal ? journalTitle : "Sanctuary Notebook",
        subtitle: hasJournal ? "Written contemplation preserved" : "Give private words to this moment",
        timeLabel: hasJournal ? "Saved" : "Space",
        isCompleted: hasJournal,
        isCurrent: hasConv && !hasJournal,
        icon: BookOpen,
        route: "/journal",
      },
      {
        id: "studio",
        stage: "Studio",
        title: "Living Sanctuary 3D Immersion",
        subtitle: "Atmospheric nature environments for deep calm",
        timeLabel: "Open",
        isCompleted: false,
        isCurrent: false,
        icon: Wind,
        route: "/studio",
      },
      {
        id: "now",
        stage: "Now",
        title: "Present Presence",
        subtitle: "Breathing right here, right now",
        timeLabel: "Living",
        isCompleted: false,
        isCurrent: true,
        icon: Sparkles,
      },
    ];
  }, [todayCheckin, recentMoments, recentJournals, conversations, onOpenCheckinModal]);

  const handleNodeClick = (node: TimelineNode) => {
    if (node.onAction) {
      node.onAction();
    } else if (node.route) {
      router.push(node.route);
    }
  };

  return (
    <div
      role="region"
      aria-label="Journey Timeline"
      className={`relative overflow-hidden rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-sm"
          : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-md"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-inherit">
        <div>
          <h3 className="text-sm font-serif font-semibold tracking-tight">Journey Timeline</h3>
          <p className="text-[11px] opacity-60">Connected flow of today&apos;s quiet milestones</p>
        </div>
        <span className="text-[11px] font-serif opacity-70 px-2 py-0.5 rounded-full border border-inherit">
          Tap node to reopen
        </span>
      </div>

      {/* Connected Bead Stream */}
      <div className="relative pt-6 pb-2 pl-2">
        {/* Soft Connecting Line */}
        <div
          aria-hidden="true"
          className="absolute left-6 top-9 bottom-7 w-0.5 bg-gradient-to-b from-amber-400/50 via-teal-400/40 to-violet-400/50 opacity-40 pointer-events-none"
        />

        <div className="space-y-4">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const isClickable = Boolean(node.route || node.onAction);

            return (
              <div
                key={node.id}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={() => isClickable && handleNodeClick(node)}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleNodeClick(node);
                  }
                }}
                className={`group relative flex items-start gap-3.5 p-2 rounded-[18px] transition-all duration-180 ${
                  isClickable
                    ? isLight
                      ? "hover:bg-stone-100/70 cursor-pointer"
                      : "hover:bg-zinc-800/40 cursor-pointer"
                    : ""
                }`}
              >
                {/* Bead Indicator */}
                <div
                  className={`relative z-10 shrink-0 flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-300 ${
                    node.isCurrent
                      ? "bg-amber-400 text-stone-900 border-amber-300 shadow-md shadow-amber-400/30 scale-105 animate-pulse"
                      : node.isCompleted
                      ? isLight
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                        : "bg-emerald-950/50 text-emerald-300 border-emerald-600/40 shadow-xs"
                      : isLight
                      ? "bg-white text-stone-400 border-stone-200"
                      : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}
                >
                  {node.isCompleted ? (
                    <Check size={13} className="stroke-[2.5]" />
                  ) : (
                    <Icon size={13} />
                  )}
                </div>

                {/* Node Text & Stage */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-serif tracking-wider font-semibold opacity-60">
                        {node.stage}
                      </span>
                      {node.isCurrent && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] opacity-50 flex items-center gap-0.5">
                      <Clock size={10} />
                      {node.timeLabel}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-serif font-medium tracking-tight mt-0.5 group-hover:text-amber-600 dark:group-hover:text-violet-300 transition-colors">
                    {node.title}
                  </h4>
                  <p className="text-[11px] opacity-60 line-clamp-1 mt-0.5">
                    {node.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
