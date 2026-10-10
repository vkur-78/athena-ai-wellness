"use client";

import React from "react";
import { Sparkles, Play, Disc } from "lucide-react";
import { LivingReplayData } from "@/types/replay";

interface InsightsWeeklyStoryProps {
  replayData?: LivingReplayData | null;
  onOpenReplay?: () => void;
}

export default function InsightsWeeklyStory({
  replayData,
  onOpenReplay,
}: InsightsWeeklyStoryProps) {
  const storyTitle = replayData?.title || "The Rhythm of Unhurried Presence";
  const storySubtitle =
    replayData?.chapters?.[0]?.narration_text ||
    "A continuous weekly reflection on slowing down, releasing urgency between demands, and creating space to breathe.";
  const weekNumber = replayData?.week_number || 38;

  return (
    <section aria-label="Weekly Story" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Weekly Story
          </h2>
          <p className="text-[13px] font-sans text-[#B8BDD6]">
            The glanceable narrative arc of your week.
          </p>
        </div>
      </div>

      {/* Main Glass Story Card */}
      <div
        className="sanctuary-glass relative p-6 sm:p-9 rounded-[28px] border border-[#7C5CFF]/30 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(248,247,255,0.12)] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(16, 22, 52, 0.9) 0%, rgba(6, 8, 20, 0.95) 100%)",
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#7C5CFF] text-[#F8F7FF] shadow-[0_0_12px_rgba(124,92,255,0.4)]">
                Week {weekNumber} Narrative
              </span>
              <span className="text-[12px] font-sans text-[#BFAEFF]">• Cinematic Chapter</span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
              {storyTitle}
            </h3>

            <p className="text-sm sm:text-base font-sans text-[#B8BDD6] leading-relaxed">
              {storySubtitle}
            </p>
          </div>

          <div className="shrink-0 pt-2 md:pt-0">
            {onOpenReplay ? (
              <button
                type="button"
                onClick={onOpenReplay}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[20px] bg-[#7C5CFF] hover:bg-[#6845F5] text-[#F8F7FF] text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(124,92,255,0.45)] hover:shadow-[0_0_28px_rgba(124,92,255,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play size={16} className="fill-current translate-x-0.5" />
                <span>Launch Replay</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-[#BFAEFF] bg-[#7C5CFF]/15 px-4 py-2.5 rounded-full border border-[#7C5CFF]/30">
                <Disc size={15} className="animate-spin" style={{ animationDuration: "8s" }} />
                <span>Available in Home Replay</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
