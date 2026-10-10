"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Wind, MessageSquare, Feather, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TodayGuidanceResponse } from "@/types/insights";

interface LiveGuidanceHeroProps {
  guidance: TodayGuidanceResponse | null;
  loading?: boolean;
}

export default function LiveGuidanceHero({ guidance, loading }: LiveGuidanceHeroProps) {
  const { isLight } = useTheme();

  if (loading || !guidance) {
    return (
      <div
        className={`rounded-3xl border p-6 sm:p-8 animate-pulse ${
          isLight
            ? "bg-white/60 border-stone-200/80"
            : "bg-[#181920]/60 border-[#272834]"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-24 bg-stone-300/40 dark:bg-zinc-700/40 rounded" />
        </div>
        <div className="h-7 w-2/3 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-3" />
        <div className="h-4 w-full max-w-md bg-stone-300/30 dark:bg-zinc-700/30 rounded" />
      </div>
    );
  }

  const getActionHref = () => {
    switch (guidance.action_type) {
      case "studio":
        return "/studio";
      case "journal":
        return "/journal";
      case "chat":
      default:
        return "/chat";
    }
  };

  const getActionIcon = () => {
    switch (guidance.action_type) {
      case "studio":
        return <Wind size={15} />;
      case "journal":
        return <Feather size={15} />;
      case "chat":
      default:
        return <MessageSquare size={15} />;
    }
  };

  return (
    <section
      aria-label="Live Behavioral Guidance"
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 transition-all duration-300 ${
        isLight
          ? "bg-gradient-to-br from-amber-50/70 via-stone-50/90 to-violet-50/40 border-stone-200/90 shadow-sm"
          : "bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#1e1a29] border-violet-900/30 shadow-md"
      }`}
    >
      <div className="space-y-4">
        {/* Top Status & Context Pill */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-serif tracking-wide uppercase">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${
                isLight
                  ? "bg-amber-100/70 border-amber-200 text-amber-800"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}
            >
              <Clock size={11} />
              <span>Live Guidance</span>
            </span>
            {guidance.context_reason && (
              <span
                className={`text-[11px] font-serif lowercase ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                • {guidance.context_reason}
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-1.5 text-xs font-serif ${
              isLight ? "text-stone-500" : "text-zinc-400"
            }`}
          >
            <Sparkles size={13} className="text-violet-400" />
            <span>Contextual Companion</span>
          </div>
        </div>

        {/* Dynamic Greeting */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {guidance.greeting}
          </h2>
          <p
            className={`text-sm sm:text-base font-serif leading-relaxed mt-2 max-w-2xl ${
              isLight ? "text-stone-700" : "text-zinc-300"
            }`}
          >
            {guidance.guidance}
          </p>
        </div>

        {/* Grounded Action Invitation */}
        {guidance.action_label && (
          <div className="pt-2">
            <Link
              href={getActionHref()}
              className={`inline-flex items-center gap-2 rounded-2xl py-2.5 px-5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                isLight
                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-sm"
              }`}
            >
              {getActionIcon()}
              <span>{guidance.action_label}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
