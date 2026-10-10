"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { Sparkles, Play, Pause, RotateCcw, Clock, CheckCircle2 } from "lucide-react";

interface InsightsWeeklyReplayProps {
  checkinHistory: CheckinResponse[];
  todayCheckin: CheckinResponse | null;
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
}

interface ReplayTile {
  dayName: string;
  shortDate: string;
  dateStr: string;
  isToday: boolean;
  emoji: string;
  moodName: string;
  journalWritten: boolean;
  practiceTitle?: string;
  hasActivity: boolean;
}

export default function InsightsWeeklyReplay({
  checkinHistory = [],
  todayCheckin,
  recentJournals = [],
  recentMoments = [],
}: InsightsWeeklyReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const timelineRef = useRef<HTMLDivElement>(null);

  // Construct 7 days of this week: Mon to Sun
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const checkinMap = useMemo(() => {
    const map = new Map<string, CheckinResponse>();
    checkinHistory.forEach((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      if (ds && !map.has(ds)) map.set(ds, c);
    });
    if (todayCheckin) {
      const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || now);
      if (todayDs) map.set(todayDs, todayCheckin);
    }
    return map;
  }, [checkinHistory, todayCheckin, now]);

  const journalMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    recentJournals.forEach((j) => {
      const ds = toLocalDateString(j.created_at);
      if (ds && !map.has(ds)) map.set(ds, j);
    });
    return map;
  }, [recentJournals]);

  const momentMap = useMemo(() => {
    const map = new Map<string, RecentMoment>();
    recentMoments.forEach((m) => {
      const ds = toLocalDateString(m.created_at);
      if (ds && !map.has(ds)) map.set(ds, m);
    });
    return map;
  }, [recentMoments]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayStr = toLocalDateString(now);

  const tiles: ReplayTile[] = useMemo(() => {
    return dayNames.map((dayName, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateString(d);
      const isToday = dateStr === todayStr;

      const checkin = checkinMap.get(dateStr);
      const journal = journalMap.get(dateStr);
      const practice = momentMap.get(dateStr);

      const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const hasActivity = Boolean(checkin || journal || practice);

      // Determine iconic emoji
      let emoji = "🙂";
      let moodName = "Resting day";

      if (practice) {
        const title = (practice.practice_title || practice.title || practice.routine || practice.practice_type || "").toLowerCase();
        if (title.includes("walk")) emoji = "🚶";
        else emoji = "🫁";
      } else if (journal) {
        emoji = "✍";
      } else if (checkin) {
        const m = (checkin.mood || "").toLowerCase();
        if (m.includes("great") || m.includes("joy")) emoji = "✨";
        else if (m.includes("calm") || m.includes("peace")) emoji = "🌤";
        else if (m.includes("low") || m.includes("tired")) emoji = "🌙";
        else emoji = "🙂";
        moodName = `${checkin.mood} mood`;
      }

      const practiceTitle = practice
        ? practice.practice_title || practice.title || practice.routine || (practice.practice_type === "breathe" ? "Breathing pause" : "Mindful walk")
        : undefined;

      return {
        dayName,
        shortDate,
        dateStr,
        isToday,
        emoji,
        moodName: checkin ? `${checkin.mood} mood` : hasActivity ? "Gentle activity" : "Unwritten day",
        journalWritten: Boolean(journal),
        practiceTitle,
        hasActivity,
      };
    });
  }, [monday, checkinMap, journalMap, momentMap, todayStr]);

  const hasAnyData = tiles.some((t) => t.hasActivity);

  // 18-second cinematic playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const totalDuration = 18000; // 18 seconds total
    const intervalMs = 100;
    const stepIncrement = (intervalMs / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          setIsPlaying(false);
          setActiveIdx(null);
          return 100;
        }

        // Map progress (0-100%) across 7 days
        const currentDayIndex = Math.min(6, Math.floor((next / 100) * 7));
        setActiveIdx(currentDayIndex);

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Scroll active tile into view when activeIdx changes
  useEffect(() => {
    if (activeIdx !== null && timelineRef.current) {
      const tileEls = timelineRef.current.children;
      if (tileEls[activeIdx]) {
        (tileEls[activeIdx] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeIdx]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (progress >= 100) setProgress(0);
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    setActiveIdx(null);
  };

  return (
    <section aria-label="Weekly Replay" className="relative space-y-4">
      {/* Header with question tracking and 18-second play control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Clock size={12} className="text-[#C4B5FD]" />
            <span>What will I remember? • Flagship Timeline</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Weekly Replay
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            A horizontal cinematic timeline of moments, practices, and reflections.
          </p>
        </div>

        {/* Your Week in 18 Seconds Button */}
        {hasAnyData && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayPause}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#60A5FA] text-white text-xs font-sans font-semibold shadow-[0_0_16px_rgba(124,92,255,0.4)] transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-white" />}
              <span>{isPlaying ? "Pause Week" : "Your Week in 18 Seconds"}</span>
            </button>

            {progress > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#959BB4] hover:text-white transition-colors cursor-pointer"
                title="Reset Replay"
                aria-label="Reset Replay"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 18-second Progress Bar */}
      {isPlaying && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C5CFF] via-[#60A5FA] to-[#4ADE80] transition-all duration-100 ease-linear shadow-[0_0_10px_#7C5CFF]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main Glass Tiles Horizon Container */}
      <div className="relative rounded-[28px] border border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/95 to-[#060814]/98 p-6 sm:p-8 backdrop-blur-2xl shadow-xl overflow-hidden">
        {!hasAnyData ? (
          /* Empty State */
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center animate-athena-glow">
              <Sparkles size={20} className="text-[#C4B5FD]" />
            </div>
            <p className="font-hero-title text-xl text-[#F8F7FF]">
              Your first week will become your first keepsake.
            </p>
            <p className="text-xs sm:text-sm font-sans text-[#B8BDD6] max-w-sm mx-auto">
              Every day you check in, practice, or write in Space adds a luminous glass tile to your weekly replay.
            </p>
          </div>
        ) : (
          /* Horizontal Glass Tile Timeline */
          <div
            ref={timelineRef}
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
          >
            {tiles.map((tile, idx) => {
              const isActive = activeIdx === idx;

              return (
                <div
                  key={tile.dayName}
                  onMouseEnter={() => !isPlaying && setActiveIdx(idx)}
                  onMouseLeave={() => !isPlaying && setActiveIdx(null)}
                  className={`group relative flex-shrink-0 w-36 sm:w-44 rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive
                      ? "border-white/60 bg-gradient-to-b from-[#18234D] to-[#0E1533] shadow-[0_0_24px_rgba(124,92,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] scale-[1.03] -translate-y-1"
                      : "border-[#7C5CFF]/20 bg-[#0B1228]/70 hover:border-[#7C5CFF]/45 hover:bg-[#0E1738]/80"
                  }`}
                >
                  {/* Top: Day Abbreviation & Date */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${
                      tile.isToday ? "text-[#A78BFA]" : "text-[#B8BDD6]"
                    }`}>
                      {tile.dayName}
                    </span>
                    <span className="text-[10px] font-sans text-[#959BB4]">
                      {tile.shortDate}
                    </span>
                  </div>

                  {/* Center: Iconic Emoji */}
                  <div className="my-4 text-center">
                    <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110 inline-block">
                      {tile.emoji}
                    </span>
                  </div>

                  {/* Bottom: Hover/Active Expanded Details */}
                  <div className="space-y-1 text-center">
                    <p className="text-xs font-semibold text-white truncate">
                      {tile.moodName}
                    </p>

                    <div className="pt-1.5 flex flex-col gap-1 items-center text-[11px] font-sans text-[#B8BDD6]">
                      {tile.practiceTitle && (
                        <span className="text-[#4ADE80] truncate max-w-full font-medium">
                          ✓ {tile.practiceTitle}
                        </span>
                      )}
                      {tile.journalWritten && (
                        <span className="text-[#60A5FA] truncate max-w-full font-medium">
                          ✓ Journal written
                        </span>
                      )}
                      {!tile.practiceTitle && !tile.journalWritten && tile.hasActivity && (
                        <span className="text-[#A78BFA]">
                          ✓ Check-in recorded
                        </span>
                      )}
                      {!tile.hasActivity && (
                        <span className="text-[#959BB4] italic">
                          Quiet day
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#7C5CFF] to-[#60A5FA]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
