"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Wind, Feather, MessageSquare, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { AdaptiveWeeklyPlanResponse, AdaptiveWeeklyPlanItem } from "@/types/insights";

interface AdaptiveWeeklyPlanProps {
  planData: AdaptiveWeeklyPlanResponse | null;
  loading?: boolean;
}

export default function AdaptiveWeeklyPlan({ planData, loading }: AdaptiveWeeklyPlanProps) {
  const { isLight } = useTheme();

  if (loading || !planData) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-32 rounded-3xl border p-5 animate-pulse ${
                isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const items = planData.plan_items && planData.plan_items.length > 0
    ? planData.plan_items.slice(0, 3)
    : [
        {
          id: "plan-mon",
          day: "Monday",
          title: "Two-Minute Breathing Before Work",
          description: "Anchor your morning with quiet breath before opening messages or inbox demands.",
          action_type: "studio",
          action_target: "breathe",
          is_completed: false,
        },
        {
          id: "plan-wed",
          day: "Wednesday",
          title: "Midweek Evening Space Journal",
          description: "Five quiet minutes to empty the mental clutter that accumulated over the past three days.",
          action_type: "journal",
          action_target: "journal",
          is_completed: false,
        },
        {
          id: "plan-fri",
          day: "Friday",
          title: "Unhurried Conversation with Athena",
          description: "Reflect on what felt light and what felt heavy to enter the weekend cleanly.",
          action_type: "chat",
          action_target: "chat",
          is_completed: false,
        },
      ];

  const getActionHref = (item: AdaptiveWeeklyPlanItem) => {
    switch (item.action_type) {
      case "studio":
        return "/studio";
      case "journal":
        return "/journal";
      case "chat":
      default:
        return "/chat";
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "studio":
        return <Wind size={14} />;
      case "journal":
        return <Feather size={14} />;
      case "chat":
      default:
        return <MessageSquare size={14} />;
    }
  };

  return (
    <section aria-labelledby="adaptive-weekly-plan-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-violet-500" />
          <h2
            id="adaptive-weekly-plan-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Adaptive Weekly Plan
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Max 3 habit suggestions • Links directly
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={getActionHref(item)}
            className={`rounded-3xl border p-5 sm:p-6 transition-all duration-250 flex flex-col justify-between group hover:-translate-y-0.5 cursor-pointer ${
              isLight
                ? "bg-[#fdfbf7] hover:bg-white border-[#e7e5e4] hover:border-violet-300 shadow-xs hover:shadow-sm"
                : "bg-[#181920] hover:bg-[#1f202a] border-[#272834] hover:border-violet-800/60 shadow-xs"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-serif font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    isLight
                      ? "bg-violet-50 border-violet-200 text-violet-700"
                      : "bg-violet-950/40 border-violet-800/40 text-violet-300"
                  }`}
                >
                  {item.day}
                </span>

                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl border ${
                    isLight
                      ? "bg-stone-100 border-stone-200 text-stone-600 group-hover:text-stone-900"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-zinc-200"
                  }`}
                >
                  {getActionIcon(item.action_type)}
                </div>
              </div>

              <h3
                className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                {item.title}
              </h3>

              <p
                className={`text-xs font-serif leading-relaxed ${
                  isLight ? "text-stone-600" : "text-zinc-300"
                }`}
              >
                {item.description}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <span
                className={`inline-flex items-center gap-1 text-xs font-serif font-medium transition-colors ${
                  isLight ? "text-violet-700 group-hover:text-violet-900" : "text-violet-300 group-hover:text-violet-100"
                }`}
              >
                <span>Open {item.action_type}</span>
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
