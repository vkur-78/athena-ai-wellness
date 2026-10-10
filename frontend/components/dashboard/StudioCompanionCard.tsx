"use client";

import React from "react";
import Link from "next/link";
import { Wind, Play, Clock, Sparkles, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { RecentMoment } from "@/types/studio";

interface StudioCompanionCardProps {
  lastMoment?: RecentMoment | null;
}

export default React.memo(function StudioCompanionCard({
  lastMoment,
}: StudioCompanionCardProps) {
  const { isLight } = useTheme();

  const environmentName = lastMoment?.routine || "Sakura Blossom Meadow";
  const practiceType = lastMoment?.practice_type || "4-7-8 Guided Breath";
  const sessionLength = "5 mins remaining";

  return (
    <div
      role="region"
      aria-label="Studio Companion"
      className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 ${
        isLight
          ? "border-stone-200/90 shadow-sm hover:shadow-md hover:border-teal-300"
          : "border-[#2a2d3a] shadow-md hover:shadow-lg hover:border-teal-500/40"
      }`}
    >
      {/* 1. Animated Ambient Gradient Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-gradient-breathe pointer-events-none transition-opacity duration-700"
        style={{
          background: isLight
            ? "radial-gradient(ellipse at 80% 20%, rgba(204, 251, 241, 0.75), rgba(240, 253, 250, 0.8) 50%, rgba(255, 255, 255, 0.95) 85%)"
            : "radial-gradient(ellipse at 80% 20%, rgba(19, 78, 74, 0.55), rgba(15, 23, 42, 0.75) 55%, rgba(18, 19, 24, 0.95) 85%)",
        }}
      />

      {/* 2. Breathing Light Centerpiece */}
      <div
        aria-hidden="true"
        className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full blur-2xl opacity-40 animate-sanctuary-pulse pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(94, 234, 212, 0.6) 0%, rgba(45, 212, 191, 0.2) 60%, transparent 80%)"
            : "radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, rgba(13, 148, 136, 0.15) 60%, transparent 80%)",
        }}
      />

      {/* 3. Floating Light Particles */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-2 h-2 rounded-full bg-teal-400/60 blur-[1px] animate-sanctuary-mote-1"
          style={{ left: "20%", top: "30%" }}
        />
        <div
          className="absolute w-2.5 h-2.5 rounded-full bg-emerald-300/50 blur-[1px] animate-sanctuary-mote-2"
          style={{ left: "75%", top: "40%" }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/60 blur-[1px] animate-sanctuary-mote-3"
          style={{ left: "45%", top: "70%" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-serif backdrop-blur-md border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300">
            <Wind size={11} className="animate-spin-slow" />
            <span>Living Studio</span>
          </div>

          <span className="text-[11px] opacity-60 flex items-center gap-1">
            <Clock size={10} />
            {sessionLength}
          </span>
        </div>

        <div>
          <h4 className="text-base font-serif font-semibold tracking-tight">
            {environmentName}
          </h4>
          <p className="text-xs opacity-70 mt-0.5 font-serif">
            {practiceType}
          </p>
        </div>

        {/* Action Button: Re-enter Sanctuary */}
        <div className="pt-2">
          <Link
            href={`/studio?practice=${lastMoment?.practice_type || "breathe"}`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[18px] text-xs font-serif font-medium transition-all duration-180 active:scale-95 cursor-pointer ${
              isLight
                ? "bg-teal-900 hover:bg-teal-800 text-white shadow-xs"
                : "bg-teal-600 hover:bg-teal-500 text-white shadow-xs shadow-teal-950/40"
            }`}
          >
            <Play size={11} className="fill-current" />
            <span>Re-enter Sanctuary</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5 duration-180" />
          </Link>
        </div>
      </div>
    </div>
  );
});
