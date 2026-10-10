"use client";

import React, { useState } from "react";
import { Award, Clock, Sparkles, Heart, ChevronDown, Feather, Wind } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { MilestonesResponse, MilestoneMemory } from "@/types/insights";

interface MilestoneLibraryProps {
  milestonesData: MilestonesResponse | null;
  loading?: boolean;
}

export default function MilestoneLibrary({ milestonesData, loading }: MilestoneLibraryProps) {
  const { isLight } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading || !milestonesData) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-stone-300/40 dark:bg-zinc-700/40 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-28 rounded-3xl border p-5 animate-pulse ${
                isLight ? "bg-white/60 border-stone-200/80" : "bg-[#181920]/60 border-[#272834]"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const milestones = milestonesData.milestones || [];

  if (milestonesData.is_empty_state || milestones.length === 0) {
    return (
      <section aria-labelledby="milestone-library-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-violet-500" />
            <h2
              id="milestone-library-title"
              className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Milestone Library
            </h2>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-6 sm:p-8 text-center space-y-3 ${
            isLight
              ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
              : "bg-[#181920] border-[#272834] shadow-xs"
          }`}
        >
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border text-sm ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-amber-950/40 border-amber-800/40 text-amber-300"
            }`}
          >
            <Award size={18} />
          </div>
          <h3
            className={`text-base font-serif font-semibold ${
              isLight ? "text-stone-900" : "text-zinc-100"
            }`}
          >
            Memories in formation
          </h3>
          <p
            className={`text-xs sm:text-sm font-serif max-w-md mx-auto leading-relaxed ${
              isLight ? "text-stone-500" : "text-zinc-400"
            }`}
          >
            Milestones in Athena are memories, not achievements. As you write, practice, and return,
            meaningful moments will be preserved here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="milestone-library-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-violet-500" />
          <h2
            id="milestone-library-title"
            className={`text-lg sm:text-xl font-serif font-semibold tracking-tight ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Milestone Library
          </h2>
        </div>
        <span
          className={`text-[11px] font-serif ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          Memories of presence • Not achievements
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {milestones.map((m) => {
          const isExpanded = expandedId === m.id;

          return (
            <div
              key={m.id}
              onClick={() => setExpandedId(isExpanded ? null : m.id)}
              className={`rounded-3xl border p-5 sm:p-6 transition-all duration-250 cursor-pointer flex flex-col justify-between group select-none ${
                isLight
                  ? "bg-[#fdfbf7] hover:bg-white border-[#e7e5e4] hover:border-amber-300 shadow-xs hover:shadow-sm"
                  : "bg-[#181920] hover:bg-[#1f202a] border-[#272834] hover:border-amber-800/50 shadow-xs"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs ${
                      isLight
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-amber-950/40 border-amber-800/40 text-amber-300"
                    }`}
                  >
                    <Sparkles size={13} />
                  </div>

                  <span
                    className={`text-[11px] font-serif flex items-center gap-1 ${
                      isLight ? "text-stone-400" : "text-zinc-500"
                    }`}
                  >
                    <Clock size={10} />
                    <span>{m.created_at}</span>
                  </span>
                </div>

                <h3
                  className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                    isLight ? "text-stone-900" : "text-white"
                  }`}
                >
                  {m.title}
                </h3>

                <p
                  className={`text-xs font-serif leading-relaxed ${
                    isLight ? "text-stone-600" : "text-zinc-300"
                  }`}
                >
                  {m.description}
                </p>

                {/* Expanded rationale */}
                {isExpanded && (
                  <div
                    className={`mt-2 pt-2 border-t text-[11px] font-serif italic animate-in fade-in duration-200 ${
                      isLight ? "border-stone-200 text-amber-900" : "border-zinc-700 text-amber-200"
                    }`}
                  >
                    Why Athena remembered this: A turning point where you met difficult feelings with
                    unhurried presence.
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end">
                <span
                  className={`text-[11px] font-serif flex items-center gap-1 transition-colors ${
                    isLight ? "text-stone-400 group-hover:text-stone-700" : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  <span>{isExpanded ? "Collapse" : "Why remembered"}</span>
                  <ChevronDown size={11} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
