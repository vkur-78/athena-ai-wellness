"use client";

import { JournalEntry } from "@/types/journal";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";

interface JournalCardProps {
  entry: JournalEntry;
  onOpen: (entry: JournalEntry) => void;
  theme?: "dark" | "light";
}

export default function JournalCard({ entry, onOpen, theme = "dark" }: JournalCardProps) {
  // Format date: e.g. "September 10" or "September 10, 2026"
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Extract first sentence preview cleanly
  const getFirstSentencePreview = (text: string) => {
    if (!text) return "";
    const cleanText = text.trim().replace(/\r\n/g, "\n");
    const firstParagraph = cleanText.split("\n")[0].trim();
    const match = firstParagraph.match(/^.*?[.!?](?:\s|$)/);
    if (match && match[0].trim().length >= 5 && match[0].trim().length <= 140) {
      return match[0].trim();
    }
    if (firstParagraph.length > 120) {
      return firstParagraph.slice(0, 120).trim() + "...";
    }
    return firstParagraph.endsWith(".") ? firstParagraph : firstParagraph + "...";
  };

  const hasReflection = !!entry.ai_reflection;
  const isLight = theme === "light";

  return (
    <div
      onClick={() => onOpen(entry)}
      className={`group rounded-[26px] border p-5 sm:p-6 transition-all duration-200 active:scale-[0.99] cursor-pointer relative overflow-hidden text-left ${
        isLight
          ? "bg-white hover:bg-white border-[rgba(124,92,255,0.11)] hover:border-[rgba(110,79,230,0.32)] shadow-[0_2px_14px_-2px_rgba(28,25,23,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(110,79,230,0.08)] hover:-translate-y-0.5"
          : "sanctuary-glass border-[#7C5CFF]/20 hover:border-[#7C5CFF]/45 shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_32px_rgba(124,92,255,0.2)] hover:-translate-y-1"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Date */}
        <div
          className={`flex items-center gap-2 text-xs font-medium ${
            isLight ? "text-[#78716C]" : "text-[#B8BDD6]"
          }`}
        >
          <Calendar size={13} className={isLight ? "text-[#6E4FE6]" : "text-[#BFAEFF]"} />
          <span>{formatDate(entry.created_at)}</span>
        </div>

        {/* Thought Indicator (Subtle, gentle, therapist wording: "A thought from Athena") */}
        {hasReflection && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              isLight
                ? "bg-[rgba(110,79,230,0.08)] border-[rgba(110,79,230,0.20)] text-[#5D3FD3]"
                : "bg-[#7C5CFF]/15 border-[#7C5CFF]/35 text-[#BFAEFF]"
            }`}
          >
            <Sparkles size={11} className={isLight ? "text-[#6E4FE6]" : "text-[#BFAEFF]"} />
            <span>A thought from Athena</span>
          </div>
        )}
      </div>

      {/* First Sentence Preview - Handwritten Memory Feel */}
      <p
        className={`text-sm sm:text-base leading-relaxed line-clamp-3 mb-4 transition-colors ${
          isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
        }`}
      >
        &ldquo;{getFirstSentencePreview(entry.content)}&rdquo;
      </p>

      {/* Gentle Action */}
      <div
        className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
          isLight
            ? "text-[#6E4FE6] group-hover:text-[#5D3FD3]"
            : "text-[#BFAEFF] group-hover:text-[#F8F7FF]"
        }`}
      >
        <span>Continue Reading</span>
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
