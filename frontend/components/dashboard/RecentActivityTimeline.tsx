"use client";

import React from "react";
import Link from "next/link";
import { Check, Feather, Wind, MessageSquare, Compass, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { CheckinResponse } from "@/types/checkin";

interface ActivityItem {
  id: string;
  type: "checkin" | "studio" | "journal" | "reflection";
  title: string;
  subtitle: string;
  timeLabel: string;
  href: string;
}

interface RecentActivityTimelineProps {
  todayCheckin?: CheckinResponse | null;
  recentMoments?: RecentMoment[];
  recentJournals?: JournalEntry[];
  recentCheckins?: CheckinResponse[];
  maxItems?: number;
}

export default function RecentActivityTimeline({
  todayCheckin,
  recentMoments = [],
  recentJournals = [],
  recentCheckins = [],
  maxItems = 5,
}: RecentActivityTimelineProps) {
  const { isLight } = useTheme();

  // Combine and sort events
  const activities = React.useMemo(() => {
    const list: ActivityItem[] = [];

    if (todayCheckin) {
      list.push({
        id: "checkin-today",
        type: "checkin",
        title: "Daily Check-in",
        subtitle: `Noticed feeling ${todayCheckin.mood || "grounded"}`,
        timeLabel: "Today",
        href: "/",
      });
    }

    recentMoments.slice(0, 3).forEach((m, idx) => {
      list.push({
        id: `studio-${m.id || idx}`,
        type: "studio",
        title: m.routine || m.moment_text || "3D Sanctuary Practice",
        subtitle: `${m.practice_type || "Guided"} practice in 3D sanctuary`,
        timeLabel: m.started_at ? formatRelativeTime(m.started_at) : "Recent",
        href: "/studio",
      });
    });

    recentJournals.slice(0, 3).forEach((j) => {
      list.push({
        id: `journal-${j.id}`,
        type: "journal",
        title: "Private Space Note",
        subtitle: j.content ? `${j.content.slice(0, 34)}...` : "Saved in notebook",
        timeLabel: j.created_at ? formatRelativeTime(j.created_at) : "Recent",
        href: "/journal",
      });
    });

    // If checkin history provided and not already added
    if (recentCheckins.length > 0 && !todayCheckin) {
      const latest = recentCheckins[0];
      list.push({
        id: `checkin-${latest.id}`,
        type: "checkin",
        title: "Daily Check-in",
        subtitle: `Reflected with ${latest.mood || "peaceful"} awareness`,
        timeLabel: latest.created_at ? formatRelativeTime(latest.created_at) : (latest.date || "Past"),
        href: "/",
      });
    }

    // Fallback if empty
    if (list.length === 0) {
      list.push({
        id: "welcome-activity",
        type: "checkin",
        title: "Sanctuary Opened",
        subtitle: "Your quiet personal wellness space is active",
        timeLabel: "Today",
        href: "/",
      });
    }

    return list.slice(0, 4);
  }, [todayCheckin, recentMoments, recentJournals]);

  function formatRelativeTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours === 1) return "1h ago";
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recent";
    }
  }

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "checkin":
        return <Check size={12} className={isLight ? "text-emerald-700" : "text-emerald-400"} />;
      case "studio":
        return <Wind size={12} className={isLight ? "text-teal-700" : "text-teal-400"} />;
      case "journal":
        return <Feather size={12} className={isLight ? "text-amber-700" : "text-amber-400"} />;
      case "reflection":
        return <Compass size={12} className={isLight ? "text-violet-700" : "text-violet-400"} />;
    }
  };

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
            <Clock size={14} />
          </div>
          <h2
            className={`text-xs sm:text-sm font-serif font-semibold tracking-wide uppercase ${
              isLight ? "text-stone-800" : "text-zinc-200"
            }`}
          >
            Recent Activity
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-500"
          }`}
        >
          Newest first
        </span>
      </div>

      <div className="relative pl-3 space-y-3.5 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-stone-200 dark:before:bg-zinc-800">
        {activities.map((act) => (
          <Link
            key={act.id}
            href={act.href}
            className="flex items-start justify-between gap-3 group relative cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border z-10 ${
                  isLight
                    ? "bg-white border-stone-300"
                    : "bg-[#1a1b21] border-zinc-700"
                }`}
              >
                {getIcon(act.type)}
              </div>
              <div className="min-w-0">
                <span
                  className={`text-xs font-serif font-semibold block transition-colors group-hover:underline ${
                    isLight ? "text-stone-800" : "text-zinc-200"
                  }`}
                >
                  {act.title}
                </span>
                <span
                  className={`text-[11px] font-serif block truncate max-w-[220px] sm:max-w-xs ${
                    isLight ? "text-stone-500" : "text-zinc-400"
                  }`}
                >
                  {act.subtitle}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono shrink-0 pt-0.5 ${
                isLight ? "text-stone-400" : "text-zinc-500"
              }`}
            >
              {act.timeLabel}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
