"use client";

import React from "react";
import Link from "next/link";
import { JournalEntry } from "@/types/journal";
import { BookOpen, ArrowUpRight, Clock, Tag } from "lucide-react";

interface InsightsJournalConnectionsProps {
  recentJournals: JournalEntry[];
}

export default function InsightsJournalConnections({
  recentJournals,
}: InsightsJournalConnectionsProps) {
  const hasJournals = recentJournals && recentJournals.length > 0;

  const formatJournalTime = (created_at?: string) => {
    if (!created_at) return "Recently";
    try {
      const d = new Date(created_at);
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <section aria-label="Journal Connections" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[26px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Journal Connections
          </h2>
          <p className="text-[13px] font-sans text-[#B8BDD6]">
            Words and reflections externalized into quiet Space.
          </p>
        </div>

        <Link
          href="/journal"
          className="text-xs font-sans font-medium text-[#BFAEFF] hover:text-[#F8F7FF] flex items-center gap-1 transition-colors"
        >
          <span>All Space entries</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {hasJournals ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recentJournals.slice(0, 3).map((entry, idx) => {
            const previewText = entry.content
              ? entry.content.slice(0, 85) + (entry.content.length > 85 ? "..." : "")
              : "A quiet space reflection recorded in your sanctuary.";
            const emotionTag = entry.mood_tag || entry.tags?.[0] || "Reflection";

            return (
              <div
                key={entry.id || idx}
                className="sanctuary-glass flex flex-col justify-between p-6 rounded-[26px] border border-[#7C5CFF]/20 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[250ms] hover:-translate-y-1 hover:border-[#7C5CFF]/45"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30">
                      <Tag size={10} />
                      <span className="capitalize">{emotionTag}</span>
                    </span>

                    <span className="text-[11px] font-sans text-[#B8BDD6] flex items-center gap-1">
                      <Clock size={11} />
                      <span>{formatJournalTime(entry.created_at)}</span>
                    </span>
                  </div>

                  <h3 className="text-[16px] sm:text-[17px] font-hero-serif font-semibold text-[#F8F7FF] leading-snug line-clamp-1">
                    {entry.title || "Quiet Space Entry"}
                  </h3>

                  <p className="text-[13px] font-sans text-[#B8BDD6] leading-relaxed line-clamp-2">
                    &ldquo;{previewText}&rdquo;
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-[#7C5CFF]/20 flex justify-end">
                  <Link
                    href="/journal"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#BFAEFF] hover:text-[#F8F7FF] transition-colors"
                  >
                    <span>Open in Space</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Minimal Empty State */
        <div className="sanctuary-glass p-8 rounded-[26px] border border-[#7C5CFF]/20 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C5CFF]/15 text-[#BFAEFF] border border-[#7C5CFF]/30">
            <BookOpen size={20} />
          </div>
          <h3 className="text-lg font-hero-serif font-semibold text-[#F8F7FF]">
            Your Space canvas is open
          </h3>
          <p className="text-xs text-[#B8BDD6] max-w-sm leading-relaxed">
            Putting words to tension in Space prevents worries from lingering. No journal entries recorded yet today.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7C5CFF] text-[#F8F7FF] text-xs font-semibold transition-all hover:bg-[#6845F5] shadow-xs"
          >
            <span>Write in Space</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}
