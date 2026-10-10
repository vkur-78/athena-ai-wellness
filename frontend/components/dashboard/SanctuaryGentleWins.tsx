"use client";

import React from "react";
import { GentleReflectionItem } from "@/lib/dashboardMetrics";
import { Sparkles, Trophy } from "lucide-react";

interface SanctuaryGentleWinsProps {
  reflections: GentleReflectionItem[];
}

export default function SanctuaryGentleWins({
  reflections,
}: SanctuaryGentleWinsProps) {
  return (
    <section aria-label="Gentle Wins" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Gentle Wins
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Meaningful milestones celebrated purely from your real stored activity.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-sans px-3 py-1 rounded-full border border-[#7C5CFF]/30 bg-[#0B1228]/80 text-[#BFAEFF] shadow-xs">
          <Trophy size={11} className="text-[#BFAEFF]" />
          <span>Real Milestones</span>
        </div>
      </div>

      {/* Maximum 2 Reflections in Sanctuary Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reflections.slice(0, 2).map((item, idx) => {
          const isFallback = item.text === "More entries unlock this insight.";

          return (
            <div
              key={item.id || idx}
              className="sanctuary-glass flex items-start gap-4 p-5 sm:p-7 rounded-[22px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[220ms] hover:-translate-y-1 hover:border-[#7C5CFF]/45"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30 shadow-[0_0_12px_rgba(124,92,255,0.25)] mt-0.5">
                <Sparkles size={17} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-[#BFAEFF]">
                  {isFallback ? "Upcoming Milestone" : `Gentle Win ${idx + 1}`}
                </span>
                <p className={`text-[15px] sm:text-[17px] font-hero-serif font-medium tracking-tight leading-relaxed ${
                  isFallback ? "text-[#959BB4] italic" : "text-[#F8F7FF]"
                }`}>
                  {isFallback ? item.text : `“${item.text}”`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
