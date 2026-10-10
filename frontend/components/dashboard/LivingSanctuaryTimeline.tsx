"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Check, Feather, Wind, MessageSquare, Sparkles, Clock, ArrowRight, Play } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { CheckinResponse } from "@/types/checkin";

interface TimelineMilestone {
  id: string;
  type: "checkin" | "studio" | "journal" | "replay";
  title: string;
  subtitle: string;
  timeLabel: string;
  href?: string;
  icon: React.ReactNode;
  iconBg: string;
  isToday?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface LivingSanctuaryTimelineProps {
  todayCheckin?: CheckinResponse | null;
  recentMoments?: RecentMoment[];
  recentJournals?: JournalEntry[];
  recentCheckins?: CheckinResponse[];
  onExperienceReplay?: () => void;
  hasReplayUnlocked?: boolean;
}

export default React.memo(function LivingSanctuaryTimeline({
  todayCheckin,
  recentMoments = [],
  recentJournals = [],
  recentCheckins = [],
  onExperienceReplay,
  hasReplayUnlocked = true,
}: LivingSanctuaryTimelineProps) {
  const { isLight } = useTheme();

  // Helper for human-friendly relative time
  const formatTime = (isoString?: string) => {
    if (!isoString) return "Today";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "Today";
    }
  };

  // Compile connected milestone stream
  const milestones: TimelineMilestone[] = useMemo(() => {
    const list: TimelineMilestone[] = [];

    // 1. Morning / Today's Check-in milestone
    if (todayCheckin) {
      list.push({
        id: "checkin-today",
        type: "checkin",
        title: "Daily Check-in & Emotional Shift",
        subtitle: `Arrived feeling ${todayCheckin.mood || "grounded"}. Stress rating ${todayCheckin.stress_level || 2}/5.`,
        timeLabel: formatTime(todayCheckin.created_at || todayCheckin.date),
        icon: <Feather size={14} className="text-amber-500" />,
        iconBg: isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30",
        isToday: true,
        actionLabel: "View reflection",
      });
    }

    // 2. Studio practice moment
    if (recentMoments.length > 0) {
      const m = recentMoments[0];
      list.push({
        id: `studio-${m.id || 0}`,
        type: "studio",
        title: m.routine || m.moment_text || "Sakura Garden Guided Breath",
        subtitle: `${m.practice_type || "Guided"} practice in living 3D sanctuary`,
        timeLabel: formatTime(m.started_at),
        href: `/studio?practice=${m.practice_type || "breathe"}`,
        icon: <Wind size={14} className="text-teal-500" />,
        iconBg: isLight ? "bg-teal-50 border-teal-200" : "bg-teal-950/40 border-teal-800/40",
        isToday: true,
        actionLabel: "Resume practice",
      });
    }

    // 3. Evening journal entry
    if (recentJournals.length > 0) {
      const j = recentJournals[0];
      list.push({
        id: `journal-${j.id}`,
        type: "journal",
        title: "Space Notebook Entry",
        subtitle: j.content ? `"${j.content.slice(0, 48)}..."` : "Saved private contemplation",
        timeLabel: formatTime(j.created_at),
        href: "/journal",
        icon: <Feather size={14} className="text-indigo-400" />,
        iconBg: isLight ? "bg-indigo-50 border-indigo-200" : "bg-indigo-950/40 border-indigo-800/40",
        actionLabel: "Open notebook",
      });
    }

    // 4. Weekly Replay Milestone
    if (hasReplayUnlocked) {
      list.push({
        id: "living-replay-milestone",
        type: "replay",
        title: "Weekly Living Replay Unlocked",
        subtitle: "Experience your 7-day emotional journey cinematically with music & narration",
        timeLabel: "Weekly Milestone",
        icon: <Sparkles size={14} className="text-violet-400" />,
        iconBg: isLight ? "bg-violet-50 border-violet-200" : "bg-violet-950/40 border-violet-800/40",
        actionLabel: "Play Replay",
        onAction: onExperienceReplay,
      });
    }

    // Fallback if brand new user
    if (list.length === 0) {
      list.push({
        id: "starter-milestone",
        type: "checkin",
        title: "Welcome to Your Living Sanctuary",
        subtitle: "Your sanctuary has opened. Take your first pause whenever you're ready.",
        timeLabel: "Just now",
        icon: <Sparkles size={14} className="text-amber-500" />,
        iconBg: isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30",
        isToday: true,
      });
    }

    return list;
  }, [todayCheckin, recentMoments, recentJournals, hasReplayUnlocked, onExperienceReplay, isLight]);

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 transition-all duration-300 ${
        isLight
          ? "bg-[#fdfbf7]/90 border-stone-200/80 shadow-xs"
          : "bg-[#1a1b22]/90 border-[#292b36] shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <Clock size={15} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Sanctuary Timeline
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Connected flowing milestones of today
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
            isLight
              ? "bg-white/80 border-stone-200 text-stone-600"
              : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
          }`}
        >
          {milestones.length} milestones
        </span>
      </div>

      {/* Connected Flowing Timeline with Vertical Gradient Beam */}
      <div className="relative pt-6 pl-2 sm:pl-4 space-y-6">
        {/* Continuous glowing vertical gradient beam */}
        <div
          aria-hidden="true"
          className="absolute left-6 sm:left-8 top-8 bottom-6 w-0.5 z-0"
          style={{
            background: isLight
              ? "linear-gradient(to bottom, rgba(245,158,11,0.6), rgba(16,185,129,0.5), rgba(124,58,237,0.4), rgba(214,211,209,0.2))"
              : "linear-gradient(to bottom, rgba(245,158,11,0.5), rgba(16,185,129,0.4), rgba(167,139,250,0.5), rgba(63,63,70,0.2))",
          }}
        />

        {milestones.map((m) => {
          const content = (
            <div
              className={`flex-1 rounded-2xl border p-4 transition-all duration-200 group-hover:translate-x-1 ${
                isLight
                  ? "bg-white/85 hover:bg-white border-stone-200/90 shadow-xs hover:shadow-sm"
                  : "bg-[#20222a]/85 hover:bg-[#252832] border-[#2c2f3c] hover:border-[#3d4152] shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4
                  className={`text-xs sm:text-sm font-serif font-semibold tracking-tight ${
                    isLight ? "text-stone-900" : "text-white"
                  }`}
                >
                  {m.title}
                </h4>
                <span
                  className={`text-[11px] font-serif ${
                    isLight ? "text-stone-400" : "text-zinc-500"
                  }`}
                >
                  {m.timeLabel}
                </span>
              </div>

              <p
                className={`text-xs font-serif mt-1 leading-relaxed ${
                  isLight ? "text-stone-600" : "text-zinc-300"
                }`}
              >
                {m.subtitle}
              </p>

              {m.actionLabel && (
                <div className="mt-2.5 pt-2 border-t border-inherit flex items-center justify-end">
                  <div
                    className={`inline-flex items-center gap-1 text-xs font-serif font-medium ${
                      m.type === "replay"
                        ? "text-violet-600 dark:text-violet-400"
                        : m.type === "studio"
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {m.type === "replay" && <Play size={11} className="fill-current" />}
                    <span>{m.actionLabel}</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              )}
            </div>
          );

          return (
            <div key={m.id} className="relative z-10 flex items-start gap-4 group">
              {/* Glowing milestone node badge */}
              <div
                className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border shadow-xs transition-transform group-hover:scale-110 ${m.iconBg}`}
              >
                {m.icon}
              </div>

              {/* Node Card / Link / Button */}
              {m.onAction ? (
                <button
                  type="button"
                  onClick={m.onAction}
                  className="flex-1 text-left cursor-pointer"
                >
                  {content}
                </button>
              ) : m.href ? (
                <Link href={m.href} className="flex-1 cursor-pointer">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
