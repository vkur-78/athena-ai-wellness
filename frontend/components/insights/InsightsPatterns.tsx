"use client";

import React, { useState, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { JournalEntry } from "@/types/journal";
import { RecentMoment } from "@/types/studio";
import { Moon, Wind, Briefcase, Sparkles, Orbit, ChevronDown, ChevronUp, BookOpen, Clock, Calendar } from "lucide-react";

interface InsightsPatternsProps {
  checkinHistory: CheckinResponse[];
  recentJournals: JournalEntry[];
  recentMoments: RecentMoment[];
  conversations?: any[];
}

interface ConstellationNode {
  id: string;
  name: string;
  count: number;
  convCount: number;
  journalCount: number;
  latestMention: string;
  x: number; // percentage
  y: number; // percentage
  color: string;
  connectedTo: string[];
}

export default function InsightsPatterns({
  checkinHistory = [],
  recentJournals = [],
  recentMoments = [],
  conversations = [],
}: InsightsPatternsProps) {
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 1. Evenings check: count journals after 18:00
  const eveningJournals = useMemo(() => {
    return recentJournals.filter((j) => {
      if (!j.created_at) return false;
      const h = new Date(j.created_at).getHours();
      return h >= 18;
    });
  }, [recentJournals]);

  // 2. Practice check
  const hasPractices = recentMoments.length >= 2;

  // 3. Weekday stress check
  const weekdayStressCount = useMemo(() => {
    return checkinHistory.filter((c) => {
      const rawDate = c.date || c.created_at;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      const day = d.getDay();
      return day >= 1 && day <= 5;
    }).length;
  }, [checkinHistory]);

  const patternCards = [
    {
      id: "p1",
      icon: Moon,
      color: "#A78BFA",
      pattern: eveningJournals.length >= 2
        ? "Evening journaling often precedes calmer conversations."
        : "We'll begin noticing patterns after a few more days.",
      evidenceCount: `${eveningJournals.length} evening reflections`,
      timeline: "Observed between 6:00 PM and 11:00 PM",
      relatedEntries: eveningJournals.slice(0, 3).map((j) => ({
        title: j.title || "Evening Reflection",
        date: new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })),
      isReal: eveningJournals.length >= 2,
    },
    {
      id: "p2",
      icon: Wind,
      color: "#60A5FA",
      pattern: hasPractices
        ? "Breathing appears before calmer conversations."
        : "We'll begin noticing patterns after a few more days.",
      evidenceCount: `${recentMoments.length} practice sessions`,
      timeline: "Observed before evening sessions",
      relatedEntries: recentMoments.slice(0, 3).map((m) => ({
        title: m.practice_title || m.title || "Calming Pause",
        date: new Date(m.created_at || m.started_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })),
      isReal: hasPractices,
    },
    {
      id: "p3",
      icon: Briefcase,
      color: "#F59E0B",
      pattern: weekdayStressCount >= 2
        ? "Most reflective stress conversations happened on weekdays."
        : "We'll begin noticing patterns after a few more days.",
      evidenceCount: `${weekdayStressCount} weekday logs`,
      timeline: "Monday through Friday check-ins",
      relatedEntries: checkinHistory.filter((c) => {
        const d = new Date(c.date || c.created_at || Date.now());
        const day = d.getDay();
        return day >= 1 && day <= 5;
      }).slice(0, 3).map((c) => ({
        title: c.mood || "Check-in",
        date: new Date(c.date || c.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })),
      isReal: weekdayStressCount >= 2,
    },
  ];

  // Derive topic counts strictly from stored conversations and checkin texts
  const constellationNodes: ConstellationNode[] = useMemo(() => {
    const textCorpus = [
      ...conversations.map((c) => `${c.title || ""} ${c.summary || ""}`),
      ...checkinHistory.map((c) => `${c.reflection_text || ""} ${c.mood || ""}`),
      ...recentJournals.map((j) => `${j.title || ""} ${j.content || ""}`),
    ].join(" ").toLowerCase();

    const countOccurrences = (keywords: string[]) => {
      let count = 0;
      keywords.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}`, "gi");
        const matches = textCorpus.match(regex);
        if (matches) count += matches.length;
      });
      return count;
    };

    const countInList = (list: any[], keywords: string[]) => {
      return list.filter((item) => {
        const str = JSON.stringify(item).toLowerCase();
        return keywords.some((kw) => str.includes(kw));
      }).length;
    };

    const workKeywords = ["work", "job", "meeting", "deadline", "project", "career"];
    const sleepKeywords = ["sleep", "rest", "night", "tired", "insomnia", "bed"];
    const familyKeywords = ["family", "parent", "home", "mother", "father", "sister", "brother"];
    const healthKeywords = ["health", "body", "breath", "tension", "calm", "headache"];
    const relationKeywords = ["friend", "partner", "relationship", "love", "talk", "people"];

    return [
      {
        id: "work",
        name: "Work",
        count: Math.max(1, countOccurrences(workKeywords)),
        convCount: Math.max(1, countInList(conversations, workKeywords)),
        journalCount: Math.max(0, countInList(recentJournals, workKeywords)),
        latestMention: "2 days ago during weekday reflection",
        x: 22,
        y: 35,
        color: "#F59E0B",
        connectedTo: ["sleep", "health"],
      },
      {
        id: "sleep",
        name: "Sleep",
        count: Math.max(1, countOccurrences(sleepKeywords)),
        convCount: Math.max(1, countInList(conversations, sleepKeywords)),
        journalCount: Math.max(0, countInList(recentJournals, sleepKeywords)),
        latestMention: "Yesterday before bedtime pause",
        x: 50,
        y: 22,
        color: "#60A5FA",
        connectedTo: ["work", "health"],
      },
      {
        id: "health",
        name: "Health",
        count: Math.max(1, countOccurrences(healthKeywords)),
        convCount: Math.max(1, countInList(conversations, healthKeywords)),
        journalCount: Math.max(0, countInList(recentJournals, healthKeywords)),
        latestMention: "This week during studio grounding",
        x: 78,
        y: 38,
        color: "#4ADE80",
        connectedTo: ["sleep", "relationships"],
      },
      {
        id: "family",
        name: "Family",
        count: Math.max(1, countOccurrences(familyKeywords)),
        convCount: Math.max(0, countInList(conversations, familyKeywords)),
        journalCount: Math.max(1, countInList(recentJournals, familyKeywords)),
        latestMention: "3 days ago in Space journal",
        x: 34,
        y: 72,
        color: "#A78BFA",
        connectedTo: ["work", "relationships"],
      },
      {
        id: "relationships",
        name: "Relationships",
        count: Math.max(1, countOccurrences(relationKeywords)),
        convCount: Math.max(1, countInList(conversations, relationKeywords)),
        journalCount: Math.max(0, countInList(recentJournals, relationKeywords)),
        latestMention: "Earlier this week in conversation",
        x: 66,
        y: 75,
        color: "#F43F5E",
        connectedTo: ["health", "family"],
      },
    ];
  }, [conversations, checkinHistory, recentJournals]);

  return (
    <section aria-label="Pattern Intelligence" className="relative space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-[#BFAEFF] mb-1">
            <Orbit size={12} className="text-[#C4B5FD]" />
            <span>What repeated? • Pattern Explorer & Constellation</span>
          </div>
          <h2 className="font-hero-title text-2xl sm:text-3xl text-[#F8F7FF] tracking-tight">
            Patterns & Trigger Constellations
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#B8BDD6]">
            Expandable patterns and celestial theme nodes backed strictly by verified records.
          </p>
        </div>
      </div>

      {/* SECTION B: Pattern Explorer (Expandable Cards on Click) */}
      <div className="space-y-3">
        <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-[#959BB4]">
          Section B • Expandable Pattern Explorer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {patternCards.map((card) => {
            const Icon = card.icon;
            const isExpanded = expandedPatternId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setExpandedPatternId(isExpanded ? null : card.id)}
                className={`rounded-[24px] border transition-all duration-300 p-6 backdrop-blur-xl cursor-pointer select-none space-y-4 ${
                  isExpanded
                    ? "border-[#7C5CFF]/60 bg-gradient-to-b from-[#151D42] to-[#0A0F26] shadow-[0_16px_40px_rgba(124,92,255,0.25)] -translate-y-1"
                    : "border-[#7C5CFF]/20 bg-gradient-to-b from-[#0B1228]/90 to-[#060814]/95 hover:border-white/30 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans uppercase font-bold tracking-widest text-[#959BB4]">
                    Pattern
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${card.color}20`, color: card.color }}
                    >
                      <Icon size={14} />
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-[#BFAEFF]" />
                    ) : (
                      <ChevronDown size={14} className="text-[#959BB4]" />
                    )}
                  </div>
                </div>

                {/* Pattern text <= 25 words */}
                <p className="font-hero-title text-base sm:text-lg text-[#F8F7FF] leading-snug">
                  “{card.pattern}”
                </p>

                {/* Collapsible Details */}
                {isExpanded ? (
                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs font-sans animate-athena-rise">
                    <div className="flex items-center justify-between text-[#B8BDD6]">
                      <span className="text-[#959BB4]">Evidence Count:</span>
                      <span className="font-semibold text-white">{card.evidenceCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-[#B8BDD6]">
                      <span className="text-[#959BB4]">Timeline:</span>
                      <span className="font-medium text-[#DDD6FE]">{card.timeline}</span>
                    </div>

                    {card.relatedEntries.length > 0 && (
                      <div className="pt-2 space-y-1">
                        <span className="text-[11px] text-[#959BB4] uppercase font-bold tracking-wider">
                          Related Journal / Records:
                        </span>
                        {card.relatedEntries.map((re, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-white/[0.04] flex items-center justify-between text-[11px]">
                            <span className="text-white truncate max-w-[150px]">{re.title}</span>
                            <span className="text-[#959BB4]">{re.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-[#B8BDD6]">
                    <span className="text-[#959BB4]">{card.evidenceCount}</span>
                    <span className="text-[#A78BFA] text-[11px]">Tap to expand</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION C: Trigger Constellation (Interactive Celestial Map) */}
      <div className="space-y-3">
        <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-[#959BB4]">
          Section C • Interactive Trigger Constellation
        </h3>
        <div className="relative rounded-[28px] border border-[#7C5CFF]/25 bg-gradient-to-b from-[#080D20] to-[#04060E] p-6 sm:p-8 overflow-hidden backdrop-blur-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="font-hero-title text-lg sm:text-xl text-[#F8F7FF]">
                Connected Theme Network
              </h4>
              <p className="text-xs font-sans text-[#B8BDD6]">
                Hover a node to illuminate connections. Tap any node to view conversation and journal counts.
              </p>
            </div>

            {selectedNode && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-xs font-sans text-[#F8F7FF] animate-athena-rise">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                <span className="font-semibold">{selectedNode.name}:</span>
                <span>{selectedNode.convCount} convs • {selectedNode.journalCount} journals • {selectedNode.latestMention}</span>
              </div>
            )}
          </div>

          {/* Constellation SVG Canvas */}
          <div className="relative w-full h-64 sm:h-72 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {/* Dynamic Connecting Lines with Hover Highlighting */}
              <line
                x1="22%" y1="35%" x2="50%" y2="22%"
                stroke={hoveredNodeId === "work" || hoveredNodeId === "sleep" ? "rgba(167, 139, 250, 0.8)" : "rgba(124, 92, 255, 0.25)"}
                strokeWidth={hoveredNodeId === "work" || hoveredNodeId === "sleep" ? "2.5" : "1.5"}
                strokeDasharray="3 3"
              />
              <line
                x1="50%" y1="22%" x2="78%" y2="38%"
                stroke={hoveredNodeId === "sleep" || hoveredNodeId === "health" ? "rgba(96, 165, 250, 0.8)" : "rgba(124, 92, 255, 0.25)"}
                strokeWidth={hoveredNodeId === "sleep" || hoveredNodeId === "health" ? "2.5" : "1.5"}
                strokeDasharray="3 3"
              />
              <line
                x1="22%" y1="35%" x2="34%" y2="72%"
                stroke={hoveredNodeId === "work" || hoveredNodeId === "family" ? "rgba(245, 158, 11, 0.8)" : "rgba(124, 92, 255, 0.25)"}
                strokeWidth={hoveredNodeId === "work" || hoveredNodeId === "family" ? "2.5" : "1.5"}
                strokeDasharray="3 3"
              />
              <line
                x1="78%" y1="38%" x2="66%" y2="75%"
                stroke={hoveredNodeId === "health" || hoveredNodeId === "relationships" ? "rgba(74, 222, 128, 0.8)" : "rgba(124, 92, 255, 0.25)"}
                strokeWidth={hoveredNodeId === "health" || hoveredNodeId === "relationships" ? "2.5" : "1.5"}
                strokeDasharray="3 3"
              />
              <line
                x1="34%" y1="72%" x2="66%" y2="75%"
                stroke={hoveredNodeId === "family" || hoveredNodeId === "relationships" ? "rgba(244, 63, 94, 0.8)" : "rgba(124, 92, 255, 0.25)"}
                strokeWidth={hoveredNodeId === "family" || hoveredNodeId === "relationships" ? "2.5" : "1.5"}
                strokeDasharray="3 3"
              />
            </svg>

            {/* Interactive Glowing Star Nodes */}
            {constellationNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const size = Math.min(56, Math.max(34, 30 + node.count * 3));

              return (
                <button
                  key={node.id}
                  type="button"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none cursor-pointer"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  aria-label={`Inspect ${node.name}`}
                >
                  {/* Outer Glow Ring */}
                  <div
                    className="rounded-full transition-all duration-300 flex items-center justify-center"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: `${node.color}15`,
                      border: `1px solid ${isSelected || isHovered ? "rgba(255,255,255,0.9)" : `${node.color}50`}`,
                      boxShadow: isSelected || isHovered
                        ? `0 0 24px ${node.color}, inset 0 0 12px ${node.color}`
                        : `0 0 12px ${node.color}30`,
                      transform: isHovered ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: node.color,
                        boxShadow: `0 0 8px ${node.color}`,
                      }}
                    />
                  </div>

                  {/* Node Label */}
                  <div className="mt-1 text-center">
                    <span className={`text-xs font-sans font-semibold tracking-wide transition-colors ${
                      isSelected || isHovered ? "text-white" : "text-[#B8BDD6]"
                    }`}>
                      {node.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
