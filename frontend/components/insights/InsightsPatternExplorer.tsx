"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import {
  Sparkles,
  Clock,
  BookOpen,
  Wind,
  Compass,
  Tag,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface InsightsPatternExplorerProps {
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
  conversations?: any[];
}

interface DerivedPattern {
  id: string;
  category: "timing" | "theme" | "practice" | "rhythm";
  icon: any;
  accentColor: string;
  badge: string;
  title: string;
  observation: string;
  source: string;
  evidenceItems: { title: string; date: string }[];
}

interface VerifiedTopic {
  name: string;
  count: number;
  journals: number;
  checkins: number;
  color: string;
}

export default function InsightsPatternExplorer({
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsPatternExplorerProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Total verified user records
  const totalRecords =
    checkinHistory.length +
    recentJournals.length +
    recentMoments.length +
    conversations.length;

  // 1. Analyze Engagement Timing from real timestamps
  const timingInsights = useMemo(() => {
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let nightCount = 0;

    const allTimestamps: { date: Date; label: string }[] = [];

    const processTs = (tsStr?: string | null, label: string = "Activity") => {
      if (!tsStr) return;
      const d = new Date(tsStr);
      if (isNaN(d.getTime())) return;
      allTimestamps.push({ date: d, label });
      const h = d.getHours();
      if (h >= 5 && h < 12) morningCount++;
      else if (h >= 12 && h < 17) afternoonCount++;
      else if (h >= 17 && h < 22) eveningCount++;
      else nightCount++;
    };

    checkinHistory.forEach((c) =>
      processTs(c.created_at || c.date, `Check-in: ${c.mood || "Grounded"}`)
    );
    recentJournals.forEach((j) =>
      processTs(j.created_at, `Journal: ${j.title || "Reflection"}`)
    );
    recentMoments.forEach((m) =>
      processTs(
        m.created_at || m.started_at,
        `Practice: ${m.practice_title || m.title || "Studio"}`
      )
    );

    const totalDated = allTimestamps.length;
    return {
      morningCount,
      afternoonCount,
      eveningCount,
      nightCount,
      totalDated,
      timestamps: allTimestamps,
    };
  }, [checkinHistory, recentJournals, recentMoments]);

  // 2. Discover Verified Recurring Topics strictly from actual text
  const verifiedTopics: VerifiedTopic[] = useMemo(() => {
    const topicConfigs = [
      {
        name: "Work & Career",
        keywords: [
          "work",
          "job",
          "career",
          "meeting",
          "deadline",
          "project",
          "boss",
          "client",
          "office",
        ],
        color: "#F59E0B",
      },
      {
        name: "Rest & Sleep",
        keywords: ["sleep", "rest", "tired", "exhausted", "night", "insomnia", "bed", "nap"],
        color: "#60A5FA",
      },
      {
        name: "Relationships",
        keywords: [
          "friend",
          "partner",
          "relationship",
          "family",
          "mom",
          "dad",
          "parent",
          "colleague",
          "people",
        ],
        color: "#A78BFA",
      },
      {
        name: "Calm & Grounding",
        keywords: [
          "calm",
          "peace",
          "breath",
          "breathe",
          "grounded",
          "walk",
          "quiet",
          "present",
          "gratitude",
        ],
        color: "#4ADE80",
      },
    ];

    return topicConfigs
      .map((cfg) => {
        let journalCount = 0;
        let checkinCount = 0;

        recentJournals.forEach((j) => {
          const text = `${j.title || ""} ${j.content || ""}`.toLowerCase();
          if (cfg.keywords.some((kw) => text.includes(kw))) {
            journalCount++;
          }
        });

        checkinHistory.forEach((c) => {
          const text = `${c.reflection_text || ""} ${c.ai_reflection || ""}`.toLowerCase();
          if (cfg.keywords.some((kw) => text.includes(kw))) {
            checkinCount++;
          }
        });

        const total = journalCount + checkinCount;
        return {
          name: cfg.name,
          count: total,
          journals: journalCount,
          checkins: checkinCount,
          color: cfg.color,
        };
      })
      .filter((t) => t.count > 0);
  }, [recentJournals, checkinHistory]);

  // 3. Assemble Grounded Patterns
  const patterns: DerivedPattern[] = useMemo(() => {
    const list: DerivedPattern[] = [];

    // Pattern 1: Timing Rhythm
    if (timingInsights.totalDated >= 2) {
      const { morningCount, afternoonCount, eveningCount, nightCount } = timingInsights;
      const maxCount = Math.max(morningCount, afternoonCount, eveningCount, nightCount);

      let slotName = "Evening";
      let hoursDesc = "5:00 PM – 10:00 PM";
      if (maxCount === morningCount) {
        slotName = "Morning";
        hoursDesc = "5:00 AM – 12:00 PM";
      } else if (maxCount === afternoonCount) {
        slotName = "Afternoon";
        hoursDesc = "12:00 PM – 5:00 PM";
      } else if (maxCount === nightCount) {
        slotName = "Night";
        hoursDesc = "10:00 PM – 5:00 AM";
      }

      list.push({
        id: "rhythm-timing",
        category: "timing",
        icon: Clock,
        accentColor: "#A78BFA",
        badge: "Engagement Rhythm",
        title: `${slotName} is your primary sanctuary window`,
        observation: `${maxCount} of your ${timingInsights.totalDated} recorded activities took place during ${slotName.toLowerCase()} hours (${hoursDesc}).`,
        source: `Derived from ${timingInsights.totalDated} timestamped activities`,
        evidenceItems: timingInsights.timestamps.slice(0, 3).map((t) => ({
          title: t.label,
          date: t.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        })),
      });
    }

    // Pattern 2: Top Recurring Theme
    if (verifiedTopics.length > 0) {
      const topTopic = verifiedTopics[0];
      list.push({
        id: "theme-focus",
        category: "theme",
        icon: Tag,
        accentColor: topTopic.color,
        badge: "Recurring Theme",
        title: `"${topTopic.name}" surfaced in ${topTopic.count} reflections`,
        observation: `You reflected on ${topTopic.name.toLowerCase()} across ${topTopic.journals} journal entries and ${topTopic.checkins} check-in reflections.`,
        source: `Grounded in your written Space entries and check-in reflections`,
        evidenceItems: recentJournals.slice(0, 3).map((j) => ({
          title: j.title || "Space Reflection",
          date: new Date(j.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        })),
      });
    }

    // Pattern 3: Studio & Restorative Practice
    if (recentMoments.length >= 1) {
      const practiceTitles = Array.from(
        new Set(
          recentMoments.map(
            (m) => m.practice_title || m.title || "Mindful Session"
          )
        )
      );

      list.push({
        id: "practice-anchors",
        category: "practice",
        icon: Wind,
        accentColor: "#4ADE80",
        badge: "Restorative Practice",
        title: `${recentMoments.length} somatic ${recentMoments.length === 1 ? "practice" : "practices"} completed`,
        observation: `You returned to practices including: ${practiceTitles.slice(0, 2).join(", ")}.`,
        source: `Recorded in Athena Studio`,
        evidenceItems: recentMoments.slice(0, 3).map((m) => ({
          title: m.practice_title || m.title || "Studio Practice",
          date: new Date(
            m.created_at || m.started_at || Date.now()
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        })),
      });
    }

    // Pattern 4: Weekly Check-in Cadence
    if (checkinHistory.length >= 2) {
      list.push({
        id: "checkin-presence",
        category: "rhythm",
        icon: BookOpen,
        accentColor: "#60A5FA",
        badge: "Reflective Cadence",
        title: `${checkinHistory.length} check-in points recorded`,
        observation: `Each check-in provides a genuine anchor in your emotional journey without extrapolation.`,
        source: `Direct check-in history records`,
        evidenceItems: checkinHistory.slice(0, 3).map((c) => ({
          title: `Mood: ${c.mood || "Grounded"}`,
          date: new Date(c.date || c.created_at || Date.now()).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            }
          ),
        })),
      });
    }

    return list;
  }, [timingInsights, verifiedTopics, recentMoments, checkinHistory, recentJournals]);

  return (
    <section className="relative z-10 w-full max-w-[1240px] mx-auto space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#7C5CFF]" />
            <span className="text-[11px] font-medium tracking-wider text-[#A78BFA] uppercase">
              Section 5 • Traceable Patterns
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#F8F7FF] tracking-tight">
            Patterns & Recurring Anchors
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl mt-1">
            Grounded observations derived strictly from your verified check-ins, journal reflections, and Studio practices. No fabricated biometrics or hypothetical claims.
          </p>
        </div>
      </div>

      {/* Insufficient Data State */}
      {totalRecords < 2 || patterns.length === 0 ? (
        <div className="relative rounded-2xl border border-[rgba(124,92,255,0.15)] bg-[#0B0F1F]/80 p-8 sm:p-12 text-center overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-radial from-[rgba(124,92,255,0.06)] via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center mx-auto text-[#A78BFA]">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-serif text-[#F8F7FF]">
              Your story is still unfolding
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Complete a few check-ins, journal reflections, or studio practices to start seeing genuine patterns here. Athena never fabricates trends or artificial metrics.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/journal"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(124,92,255,0.15)] hover:bg-[rgba(124,92,255,0.25)] border border-[rgba(124,92,255,0.3)] text-xs font-medium text-[#F8F7FF] transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#A78BFA]" />
                Write in Space
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-xs font-medium text-[#F8F7FF] transition-all"
              >
                <Wind className="w-3.5 h-3.5 text-[#4ADE80]" />
                Explore Studio
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Real Topic Pills if any detected */}
          {verifiedTopics.length > 0 && (
            <div className="rounded-2xl border border-[rgba(124,92,255,0.15)] bg-[#0B0F1F]/60 p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-medium text-[#94A3B8] flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[#A78BFA]" />
                  Verified Themes from Your Writings
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Click to inspect occurrences
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {verifiedTopics.map((topic) => {
                  const isSelected = selectedTopic === topic.name;
                  return (
                    <button
                      key={topic.name}
                      onClick={() =>
                        setSelectedTopic(isSelected ? null : topic.name)
                      }
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[rgba(124,92,255,0.25)] border-[#7C5CFF] text-[#F8F7FF] shadow-[0_0_12px_rgba(124,92,255,0.2)]"
                          : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:border-[rgba(124,92,255,0.3)] hover:text-[#F8F7FF]"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                      <span>{topic.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#E2E8F0]">
                        {topic.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pattern Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[rgba(124,92,255,0.15)] bg-[#0B0F1F]/70 p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-[rgba(124,92,255,0.3)] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border"
                        style={{
                          backgroundColor: `${item.accentColor}15`,
                          borderColor: `${item.accentColor}30`,
                          color: item.accentColor,
                        }}
                      >
                        <IconComp className="w-3 h-3" />
                        {item.badge}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        Traceable observation
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-serif text-[#F8F7FF] leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                      {item.observation}
                    </p>
                  </div>

                  {/* Grounded Evidence List */}
                  <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                    <div className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">
                      Grounding Evidence
                    </div>
                    <div className="space-y-1.5">
                      {item.evidenceItems.map((ev, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-[#CBD5E1] bg-[rgba(255,255,255,0.02)] px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.04)]"
                        >
                          <span className="truncate max-w-[200px] text-[11px]">
                            {ev.title}
                          </span>
                          <span className="text-[10px] text-[#64748B] flex-shrink-0">
                            {ev.date}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#A78BFA] pt-1">
                      {item.source}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
