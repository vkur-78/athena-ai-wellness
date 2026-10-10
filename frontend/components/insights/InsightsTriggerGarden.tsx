"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sparkles, Briefcase, Moon, Users, HeartPulse } from "lucide-react";

export default function InsightsTriggerGarden() {
  const { isLight } = useTheme();
  const [selectedCluster, setSelectedCluster] = useState<string | null>("Work");

  // Soft glowing clusters: Work, Sleep, Social, Health
  // Frequency dictates cluster circle size and glow
  const clusters = [
    {
      id: "Work",
      label: "Work Pressures",
      frequency: "High presence",
      occurrences: 14,
      size: "w-36 h-36 sm:w-44 sm:h-44",
      glowRadius: "blur-2xl",
      color: "#F59E0B", // Amber
      icon: Briefcase,
      insight: "Appeared most frequently during late-afternoon calendar transitions.",
    },
    {
      id: "Sleep",
      label: "Sleep Restlessness",
      frequency: "Moderate",
      occurrences: 8,
      size: "w-28 h-28 sm:w-36 sm:h-36",
      glowRadius: "blur-xl",
      color: "#A78BFA", // Lavender
      icon: Moon,
      insight: "Tied to late-evening digital exposure; eases with 5-minute wind down.",
    },
    {
      id: "Social",
      label: "Social Energy",
      frequency: "Occasional",
      occurrences: 5,
      size: "w-24 h-24 sm:w-32 sm:h-32",
      glowRadius: "blur-lg",
      color: "#7BAFD4", // Sky Blue
      icon: Users,
      insight: "Recharges you when one-on-one; draining in crowded unstructured settings.",
    },
    {
      id: "Health",
      label: "Physical Tension",
      frequency: "Subtle",
      occurrences: 4,
      size: "w-20 h-20 sm:w-28 sm:h-28",
      glowRadius: "blur-md",
      color: "#84A98C", // Sage
      icon: HeartPulse,
      insight: "Upper back tightness noticed before presentations.",
    },
  ];

  const active = clusters.find((c) => c.id === selectedCluster) || clusters[0];

  return (
    <section
      aria-label="Trigger Garden"
      className={`relative rounded-[24px] border p-6 sm:p-8 backdrop-blur-xl transition-all duration-[220ms] ${
        isLight
          ? "bg-[#F7F4EE]/90 border-[#E8DDC8] shadow-[0_4px_24px_-4px_rgba(44,38,30,0.06)]"
          : "bg-[#151A2E]/85 border-[#2E2157]/60 shadow-[0_8px_32px_-4px_rgba(15,18,32,0.8)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest font-sans text-amber-600 dark:text-amber-400">
            <Sparkles size={13} />
            <span>Trigger Garden</span>
            <span className="opacity-40">•</span>
            <span>Soft Glowing Clusters</span>
          </div>
          <p
            className={`text-xs font-sans italic ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Larger aura indicates themes that presented more frequently.
          </p>
        </div>

        <span
          className={`text-xs font-sans px-3 py-1 rounded-full border self-start sm:self-auto ${
            isLight
              ? "bg-[#F1EBDD] border-[#E8DDC8] text-[#232220]"
              : "bg-[#1F253F] border-[#2E2157] text-[#F1EEF8]"
          }`}
        >
          {active.id}: {active.frequency} ({active.occurrences} moments)
        </span>
      </div>

      {/* Garden Visualization Canvas with Organic Glowing Clusters */}
      <div className="relative min-h-[220px] sm:min-h-[260px] flex items-center justify-center p-4 rounded-[20px] bg-gradient-to-b from-[#F1EBDD]/40 to-transparent dark:from-[#111425]/40 border border-[#E8DDC8]/60 dark:border-[#2E2157]/40 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 z-10">
          {clusters.map((c) => {
            const Icon = c.icon;
            const isCurrent = c.id === selectedCluster;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCluster(c.id)}
                className={`relative flex flex-col items-center justify-center rounded-full transition-all duration-300 cursor-pointer group ${c.size} ${
                  isCurrent ? "scale-105" : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Glowing Aura Ring */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${c.glowRadius}`}
                  style={{
                    backgroundColor: `${c.color}25`,
                    boxShadow: isCurrent ? `0 0 32px ${c.color}60` : `0 0 16px ${c.color}30`,
                  }}
                />

                {/* Glass Inner Orb */}
                <div
                  className={`relative flex flex-col items-center justify-center w-full h-full rounded-full border backdrop-blur-md transition-all duration-300 ${
                    isLight
                      ? "bg-white/80 border-[#E8DDC8]"
                      : "bg-[#151A2E]/80 border-[#2E2157]"
                  }`}
                  style={{
                    borderColor: isCurrent ? c.color : undefined,
                  }}
                >
                  <Icon
                    size={20}
                    className="mb-1 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: c.color }}
                  />
                  <span className="text-xs font-semibold font-sans tracking-tight text-[#232220] dark:text-[#F1EEF8]">
                    {c.id}
                  </span>
                  <span className="text-[10px] font-sans opacity-70">
                    {c.occurrences}x
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Cluster Insight Narrative */}
      <div
        className={`mt-4 p-3.5 rounded-[18px] border text-xs font-sans leading-relaxed transition-all duration-200 ${
          isLight
            ? "bg-[#F1EBDD]/60 border-[#E8DDC8] text-[#232220]"
            : "bg-[#1F253F]/60 border-[#2E2157] text-[#F1EEF8]"
        }`}
      >
        <span className="font-semibold" style={{ color: active.color }}>
          {active.label}:{" "}
        </span>
        <span>{active.insight}</span>
      </div>
    </section>
  );
}
