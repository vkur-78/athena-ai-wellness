"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { Play, ChevronLeft, ChevronRight, Sparkles, Disc, Moon, Sun, Wind, Shield, BookOpen, Compass } from "lucide-react";
import { LivingReplayData } from "@/types/replay";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";

interface SanctuaryLivingReplayProps {
  onExperienceReplay: (type?: "weekly" | "monthly", initialChapter?: number) => void;
  replayData?: LivingReplayData | null;
  checkinHistory?: CheckinResponse[];
  recentJournals?: JournalEntry[];
  recentMoments?: RecentMoment[];
}

interface RealEventCard {
  id: string;
  tag: string;
  title: string;
  narrative: string;
  source: string;
  icon: any;
  accent: string;
  gradient: string;
}

export default function SanctuaryLivingReplay({
  onExperienceReplay,
  replayData,
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
}: SanctuaryLivingReplayProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const offset = direction === "left" ? -360 : 360;
      carouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && carouselRef.current?.contains(document.activeElement)) {
        if (e.key === "ArrowLeft") {
          scroll("left");
        } else if (e.key === "ArrowRight") {
          scroll("right");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Real Story Cards Strictly From Stored Events
  const realStoryCards = useMemo<RealEventCard[]>(() => {
    const cards: RealEventCard[] = [];

    // 1. Returned After Stress Check
    const hadStress = checkinHistory.some((c) => {
      const m = (c.mood || "").toLowerCase();
      return m.includes("stress") || m.includes("anx") || m.includes("overwhelm") || (c.stress_level && c.stress_level >= 3);
    });
    const hadPractice = recentMoments.length > 0;
    if (hadStress && hadPractice) {
      const breathingCount = recentMoments.filter((m) => (m.title || "").toLowerCase().includes("breath") || !m.title?.toLowerCase().includes("walk")).length;
      cards.push({
        id: "returned-after-stress",
        tag: "Real Resilience",
        title: "Returned After Stress",
        narrative: breathingCount >= 2
          ? "You completed two breathing sessions after stressful afternoons."
          : "You stepped into a calming practice following moments of tension.",
        source: "Check-in & Studio logs",
        icon: Shield,
        accent: "#4ADE80",
        gradient: "from-emerald-500/20 via-emerald-950/10 to-transparent",
      });
    }

    // 2. Calm Evening Check
    const eveningActivities = [
      ...checkinHistory.filter((c) => {
        const raw = c.date || c.created_at;
        if (!raw) return false;
        const h = new Date(raw).getHours();
        return h >= 18;
      }),
      ...recentJournals.filter((j) => {
        if (!j.created_at) return false;
        const h = new Date(j.created_at).getHours();
        return h >= 18;
      }),
    ];
    if (eveningActivities.length > 0) {
      cards.push({
        id: "calm-evening",
        tag: "Evening Reflection",
        title: "Calm Evening",
        narrative: "You dedicated unhurried time at the end of the day to reflect and unwind.",
        source: "Evening timestamps",
        icon: Moon,
        accent: "#BFAEFF",
        gradient: "from-violet-500/20 via-indigo-950/10 to-transparent",
      });
    }

    // 3. Strong Monday Check
    const mondayCheckin = checkinHistory.find((c) => {
      const raw = c.date || c.created_at;
      if (!raw) return false;
      return new Date(raw).getDay() === 1; // 1 = Mon
    });
    if (mondayCheckin) {
      cards.push({
        id: "strong-monday",
        tag: "Early Grounding",
        title: "Strong Monday",
        narrative: "You showed up at the start of the week, setting a gentle intention early.",
        source: "Monday check-in",
        icon: Sun,
        accent: "#FBBF24",
        gradient: "from-amber-500/20 via-amber-950/10 to-transparent",
      });
    }

    // 4. Quiet Weekend Check
    const weekendActivity = checkinHistory.some((c) => {
      const raw = c.date || c.created_at;
      if (!raw) return false;
      const day = new Date(raw).getDay();
      return day === 0 || day === 6;
    }) || recentMoments.some((m) => {
      if (!m.created_at) return false;
      const day = new Date(m.created_at).getDay();
      return day === 0 || day === 6;
    });
    if (weekendActivity) {
      cards.push({
        id: "quiet-weekend",
        tag: "Rest Rhythm",
        title: "Quiet Weekend",
        narrative: "Mindful moments logged during Saturday and Sunday pause.",
        source: "Weekend activity",
        icon: Compass,
        accent: "#38BDF8",
        gradient: "from-sky-500/20 via-blue-950/10 to-transparent",
      });
    }

    // Fallback if not enough data yet
    if (cards.length === 0) {
      cards.push({
        id: "gentle-beginning",
        tag: "First Anchor",
        title: "Gentle Beginning",
        narrative: "More entries unlock this insight. Check in today to start your weekly story.",
        source: "Awaiting entries",
        icon: Sparkles,
        accent: "#7C5CFF",
        gradient: "from-[#7C5CFF]/20 via-[#0B1228]/40 to-transparent",
      });
    }

    return cards;
  }, [checkinHistory, recentJournals, recentMoments]);

  return (
    <section aria-label="Weekly Story Carousel" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-sans font-medium text-[#BFAEFF]">
            <Sparkles size={14} className="text-[#BFAEFF]" />
            <span>Weekly Story</span>
            <span className="opacity-40">•</span>
            <span>Real Events Only</span>
          </div>
          <h2 className="text-[22px] sm:text-[28px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Weekly Story
          </h2>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous story card"
            className="p-2.5 rounded-full border border-[#7C5CFF]/20 bg-[#0B1228]/80 text-[#B8BDD6] hover:text-[#F8F7FF] hover:border-[#7C5CFF]/50 hover:bg-[#7C5CFF]/15 transition-all duration-[180ms] hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next story card"
            className="p-2.5 rounded-full border border-[#7C5CFF]/20 bg-[#0B1228]/80 text-[#B8BDD6] hover:text-[#F8F7FF] hover:border-[#7C5CFF]/50 hover:bg-[#7C5CFF]/15 transition-all duration-[180ms] hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Snap Scrolling Carousel */}
      <div
        ref={carouselRef}
        tabIndex={0}
        aria-label="Weekly story cards"
        className="flex items-stretch gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]/40 rounded-[28px]"
        style={{ scrollbarWidth: "none" }}
      >
        {realStoryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onExperienceReplay("weekly", idx + 1)}
              className="sanctuary-glass relative flex-none w-[310px] sm:w-[350px] snap-start rounded-[26px] border border-[#7C5CFF]/25 p-6 sm:p-7 cursor-pointer group flex flex-col justify-between transition-all duration-[250ms] hover:-translate-y-1 hover:border-[#7C5CFF]/50 hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.85),0_0_24px_rgba(124,92,255,0.3)] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.1)] overflow-hidden"
            >
              {/* Subtle Ambient Radial Glow */}
              <div
                className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none bg-gradient-to-br ${card.gradient}`}
              />

              <div className="relative z-10">
                {/* Top Bar: Tag Badge & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-sans font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30">
                    {card.tag}
                  </span>

                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-xs"
                    style={{
                      backgroundColor: `${card.accent}15`,
                      color: card.accent,
                      borderColor: `${card.accent}30`,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-[20px] sm:text-[22px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF] mb-2 group-hover:text-[#BFAEFF] transition-colors">
                  {card.title}
                </h3>

                {/* Narrative text from real event */}
                <p className="text-[13px] font-sans text-[#B8BDD6] leading-relaxed">
                  &ldquo;{card.narrative}&rdquo;
                </p>
              </div>

              {/* Bottom: Source & Play Action */}
              <div className="relative z-10 pt-4 mt-4 border-t border-[#7C5CFF]/20 flex items-center justify-between">
                <span className="text-[11px] font-sans text-[#959BB4]">
                  {card.source}
                </span>

                <button
                  type="button"
                  aria-label={`Play replay for ${card.title}`}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[#7C5CFF] text-[#F8F7FF] shadow-[0_0_12px_rgba(124,92,255,0.4)] transition-all duration-[200ms] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(124,92,255,0.6)] active:scale-95 cursor-pointer"
                >
                  <Play size={13} className="fill-current translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Flagship Replay Card */}
        <div
          onClick={() => onExperienceReplay("weekly", 1)}
          className="sanctuary-glass relative flex-none w-[330px] sm:w-[380px] snap-start rounded-[26px] border border-[#7C5CFF]/40 p-6 sm:p-7 cursor-pointer group flex flex-col justify-between transition-all duration-[250ms] hover:-translate-y-1 hover:border-[#7C5CFF]/70 hover:shadow-[0_20px_50px_rgba(124,92,255,0.3)] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(248,247,255,0.15)]"
          style={{
            background: "linear-gradient(145deg, rgba(24, 18, 56, 0.9) 0%, rgba(11, 18, 40, 0.95) 100%)",
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-sans font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#7C5CFF] text-[#F8F7FF] shadow-[0_0_12px_rgba(124,92,255,0.5)]">
                Cinematic Replay
              </span>

              <div className="flex items-center gap-1.5 text-[12px] font-sans font-medium text-[#BFAEFF]">
                <Disc size={14} className="animate-spin" style={{ animationDuration: "8s" }} />
                <span>Full Experience</span>
              </div>
            </div>

            <h3 className="text-[20px] sm:text-[22px] font-hero-serif font-bold tracking-tight text-[#F8F7FF] mb-2 group-hover:text-[#BFAEFF] transition-colors">
              The Arc of Your Week
            </h3>

            <p className="text-[13px] font-sans text-[#B8BDD6] leading-relaxed">
              Synthesizing your stored check-ins and practices into an unhurried visual storytelling replay.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-[#7C5CFF]/25 flex items-center justify-between">
            <span className="text-[12px] font-sans font-medium text-[#F8F7FF]">
              Spotify Wrapped Style
            </span>

            <button
              type="button"
              aria-label="Play Weekly Replay"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7C5CFF] text-[#F8F7FF] shadow-[0_0_16px_rgba(124,92,255,0.5)] transition-all duration-[200ms] group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(124,92,255,0.7)] active:scale-95 cursor-pointer"
            >
              <Play size={15} className="fill-current translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
