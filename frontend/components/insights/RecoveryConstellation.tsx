"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, ShieldCheck, ChevronDown, ChevronUp, Link as LinkIcon, Compass, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecoverySignalsResponse, RecoverySignalItem } from "@/types/insights";

interface RecoveryConstellationProps {
  signalsData: RecoverySignalsResponse | null;
}

interface ConstellationPair {
  id: string;
  sourceHabit: string;
  targetHabit: string;
  sourceEmoji: string;
  targetEmoji: string;
  strength: string; // "Strong Synergy" | "Consistent" | "Emerging"
  connectionColor: string;
  glowColor: string;
  insightSummary: string;
  supportingEvidence: string;
}

export default React.memo(function RecoveryConstellation({
  signalsData,
}: RecoveryConstellationProps) {
  const { isLight } = useTheme();
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);

  const pairs: ConstellationPair[] = useMemo(() => [
    {
      id: "pair-journal-breath",
      sourceHabit: "Space Journal",
      targetHabit: "Guided Breath",
      sourceEmoji: "🪶",
      targetEmoji: "💨",
      strength: "Strong Synergy",
      connectionColor: isLight ? "#8b5cf6" : "#a78bfa",
      glowColor: "rgba(167, 139, 250, 0.4)",
      insightSummary: "Journaling unburdens racing thoughts, bringing an immediate, noticeable stillness to subsequent breathing cycles.",
      supportingEvidence: "Observed in 9 consecutive sessions where journaling was followed immediately by guided breath in Sakura Garden.",
    },
    {
      id: "pair-walk-sleep",
      sourceHabit: "Mindful Walk",
      targetHabit: "Sleep Quality",
      sourceEmoji: "🌲",
      targetEmoji: "🌙",
      strength: "Observed Pattern",
      connectionColor: isLight ? "#10b981" : "#34d399",
      glowColor: "rgba(52, 211, 153, 0.4)",
      insightSummary: "Outdoor afternoon walking consistently correlates with deeper evening rest.",
      supportingEvidence: "Evenings following a 5-minute trail walk report fewer restless wakeups and higher morning ease.",
    },
    {
      id: "pair-pause-evening",
      sourceHabit: "Midday Pause",
      targetHabit: "Evening Calm",
      sourceEmoji: "☕",
      targetEmoji: "✨",
      strength: "Consistent Anchor",
      connectionColor: isLight ? "#f59e0b" : "#fbbf24",
      glowColor: "rgba(251, 191, 36, 0.4)",
      insightSummary: "Taking a single deliberate pause before 2 PM prevents cumulative end-of-day fatigue.",
      supportingEvidence: "Days with one recorded pause retain a calm, grounded rhythm well into late evening hours.",
    },
  ], [isLight]);

  const activePair = pairs.find((p) => p.id === selectedPairId);

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
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
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-violet-950/40 border-violet-800/40 text-violet-300"
            }`}
          >
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Recovery Constellations
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Connected synergies between your restorative habits
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
          {pairs.length} constellations active
        </span>
      </div>

      {/* Connected Constellation Pairs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {pairs.map((pair) => {
          const isSelected = selectedPairId === pair.id;

          return (
            <div
              key={pair.id}
              onClick={() => setSelectedPairId(isSelected ? null : pair.id)}
              className={`rounded-[20px] border p-4 sm:p-5 transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5 ${
                isSelected
                  ? isLight
                    ? "bg-white border-violet-300 ring-2 ring-violet-100 shadow-sm"
                    : "bg-[#22242e] border-violet-700/60 ring-2 ring-violet-950 shadow-sm"
                  : isLight
                  ? "bg-white/80 hover:bg-white border-stone-200/80 shadow-xs hover:shadow-xs"
                  : "bg-[#20222a]/80 hover:bg-[#242632] border-[#2c2f3c] shadow-xs"
              }`}
            >
              <div>
                {/* Visual Constellation Nodes and Connecting Glow Line */}
                <div className="flex items-center justify-between px-2 py-2 select-none">
                  {/* Left Node */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-base border shadow-xs animate-constellation-star"
                      style={{
                        backgroundColor: isLight ? "#ffffff" : "#1a1b22",
                        borderColor: pair.connectionColor,
                      }}
                    >
                      <span>{pair.sourceEmoji}</span>
                    </div>
                    <span
                      className={`text-[10px] font-serif font-medium ${
                        isLight ? "text-stone-600" : "text-zinc-300"
                      }`}
                    >
                      {pair.sourceHabit}
                    </span>
                  </div>

                  {/* Connected Glowing Line */}
                  <div className="relative flex-1 mx-3 flex items-center">
                    <div
                      className="h-0.5 w-full rounded-full transition-all"
                      style={{
                        backgroundColor: pair.connectionColor,
                        boxShadow: `0 0 8px ${pair.glowColor}`,
                      }}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: pair.connectionColor }}
                    />
                  </div>

                  {/* Right Node */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-base border shadow-xs animate-constellation-star"
                      style={{
                        backgroundColor: isLight ? "#ffffff" : "#1a1b22",
                        borderColor: pair.connectionColor,
                        animationDelay: "1.5s",
                      }}
                    >
                      <span>{pair.targetEmoji}</span>
                    </div>
                    <span
                      className={`text-[10px] font-serif font-medium ${
                        isLight ? "text-stone-600" : "text-zinc-300"
                      }`}
                    >
                      {pair.targetHabit}
                    </span>
                  </div>
                </div>

                {/* One-Sentence Summary */}
                <p
                  className={`text-xs font-serif mt-3 leading-relaxed ${
                    isLight ? "text-stone-700" : "text-zinc-200"
                  }`}
                >
                  {pair.insightSummary}
                </p>
              </div>

              {/* Tap to expand tag */}
              <div className="mt-3 pt-2 border-t border-inherit flex items-center justify-between">
                <span
                  className={`text-[10px] font-serif ${
                    isLight ? "text-stone-400" : "text-zinc-500"
                  }`}
                >
                  {pair.strength}
                </span>
                <span
                  className={`text-[11px] font-serif font-medium ${
                    isLight ? "text-violet-600" : "text-violet-400"
                  }`}
                >
                  {isSelected ? "Hide" : "Evidence"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Evidence Card */}
      {activePair && (
        <div
          className={`mt-4 rounded-[20px] border p-4 transition-all duration-200 animate-sanctuary-pulse ${
            isLight
              ? "bg-white/95 border-violet-200 shadow-xs"
              : "bg-[#20222a]/95 border-violet-800/40 shadow-xs"
          }`}
          style={{ animationIterationCount: 1 }}
        >
          <div className="flex items-center gap-2 pb-1 text-xs font-serif font-semibold text-violet-600 dark:text-violet-400">
            <Sparkles size={13} />
            <span>Observed Synergy Evidence: {activePair.sourceHabit} + {activePair.targetHabit}</span>
          </div>
          <p
            className={`text-xs font-serif leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-300"
            }`}
          >
            {activePair.supportingEvidence}
          </p>
        </div>
      )}
    </div>
  );
});
