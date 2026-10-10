"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Feather } from "lucide-react";
import { MonthlyReflection } from "@/types/reflection";

interface InsightsMonthlyReflectionProps {
  reflection?: MonthlyReflection | null;
  totalEntriesCount?: number;
}

export default function InsightsMonthlyReflection({
  reflection,
  totalEntriesCount = 0,
}: InsightsMonthlyReflectionProps) {
  const hasEnoughData = totalEntriesCount >= 3 || Boolean(reflection?.content?.month_theme || reflection?.content?.full_text);

  const reflectionText =
    reflection?.content?.full_text ||
    reflection?.content?.closing ||
    reflection?.content?.your_journey?.[0] ||
    (hasEnoughData
      ? "This month showed more consistency than intensity. You returned even after difficult days."
      : "Keep checking in to unlock your monthly story.");

  const monthTheme = reflection?.content?.month_theme || "Quiet Resilience";

  return (
    <section aria-label="Monthly Reflection" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#BFAEFF] mb-1">
            <Feather size={13} className="text-[#BFAEFF]" />
            <span>Monthly Keepsake Synthesis</span>
          </div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Monthly Reflection
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            One thoughtful narrative synthesizing your overall month.
          </p>
        </div>

        {hasEnoughData && (
          <Link
            href="/reflection/monthly"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-2xl bg-[#7C5CFF]/15 hover:bg-[#7C5CFF]/25 border border-[#7C5CFF]/30 text-[#F8F7FF] transition shadow-[0_0_12px_rgba(124,92,255,0.2)] hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Full Keepsake Report</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* Main Glass Keepsake Card */}
      <div className="sanctuary-glass relative p-7 sm:p-10 rounded-[28px] border border-[#7C5CFF]/25 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.1)] overflow-hidden">
        {/* Soft Ambient Spotlight */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#7C5CFF]/15 via-[#BFAEFF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          {hasEnoughData && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs font-medium text-[#BFAEFF]">
              <Sparkles size={12} />
              <span>Theme: {monthTheme}</span>
            </div>
          )}

          <p className={`font-hero-serif leading-relaxed ${
            hasEnoughData
              ? "text-[18px] sm:text-[21px] text-[#F8F7FF] font-medium tracking-tight"
              : "text-[16px] sm:text-[18px] text-[#959BB4] italic"
          }`}>
            {hasEnoughData ? `“${reflectionText}”` : reflectionText}
          </p>

          <div className="pt-2 text-xs font-sans text-[#959BB4] flex items-center gap-2">
            <span>Athena Sanctuary Synthesis</span>
            <span className="opacity-40">•</span>
            <span>{hasEnoughData ? "Generated from stored reflections" : "Awaiting monthly milestones"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
