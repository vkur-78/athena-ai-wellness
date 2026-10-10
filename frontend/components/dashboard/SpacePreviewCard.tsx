"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, PenLine, ArrowRight, Calendar } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { JournalEntry } from "@/types/journal";

interface SpacePreviewCardProps {
  latestEntry?: JournalEntry | null;
}

export default React.memo(function SpacePreviewCard({
  latestEntry,
}: SpacePreviewCardProps) {
  const { isLight } = useTheme();

  // Format entry date
  const formattedDate = React.useMemo(() => {
    if (!latestEntry?.created_at) {
      return new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
    try {
      const d = new Date(latestEntry.created_at);
      return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Today";
    }
  }, [latestEntry]);

  // Extract first sentence
  const firstSentence = React.useMemo(() => {
    if (!latestEntry?.content) {
      return "The day begins in silence, waiting for your thoughts to find their shape.";
    }
    const match = latestEntry.content.match(/[^.!?]+[.!?]/);
    return match ? match[0].trim() : latestEntry.content.slice(0, 110) + "...";
  }, [latestEntry]);

  const title = React.useMemo(() => {
    if (!latestEntry?.content) return "Quiet Space Entry";
    const firstLine = latestEntry.content.split("\n")[0].trim();
    return firstLine.slice(0, 36) || "Quiet Space Entry";
  }, [latestEntry]);

  return (
    <div
      role="region"
      aria-label="Space Notebook Preview"
      className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 ${
        isLight
          ? "bg-[#fbf9f4] border-stone-200/90 shadow-xs hover:shadow-md hover:border-stone-300"
          : "bg-[#181920] border-[#292a36] shadow-sm hover:shadow-md hover:border-[#3a3c4e]"
      }`}
    >
      {/* Subtle notebook page left margin line */}
      <div
        aria-hidden="true"
        className={`absolute left-5 top-0 bottom-0 w-px pointer-events-none opacity-20 ${
          isLight ? "bg-rose-400" : "bg-violet-400"
        }`}
      />

      <div className="relative z-10 pl-4 space-y-3">
        {/* Header: Date & notebook tag */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-serif opacity-60">
            <Calendar size={11} />
            <span>{formattedDate}</span>
          </div>

          <span className="text-[10px] uppercase font-serif tracking-widest opacity-50">
            Space
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base font-serif font-semibold tracking-tight line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-violet-300 transition-colors">
          {title}
        </h4>

        {/* Handwritten feel First Sentence */}
        <p className="text-sm font-serif italic opacity-75 line-clamp-3 leading-relaxed">
          &ldquo;{firstSentence}&rdquo;
        </p>

        {/* Continue Writing Button */}
        <div className="pt-2">
          <Link
            href="/journal"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[18px] text-xs font-serif font-medium transition-all duration-180 active:scale-95 cursor-pointer ${
              isLight
                ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                : "bg-zinc-800 hover:bg-zinc-700 text-white shadow-xs"
            }`}
          >
            <PenLine size={12} />
            <span>Continue writing</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5 duration-180" />
          </Link>
        </div>
      </div>
    </div>
  );
});
