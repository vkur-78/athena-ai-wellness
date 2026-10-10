"use client";

import { useState } from "react";
import { JournalEntry } from "@/types/journal";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Sparkles,
  Calendar,
  Heart,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

interface JournalReaderProps {
  entry: JournalEntry;
  onBack: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => Promise<void>;
  onRequestReflection: (entryId: string) => Promise<void>;
  isReflecting?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export default function JournalReader({
  entry,
  onBack,
  onEdit,
  onDelete,
  onRequestReflection,
  isReflecting = false,
  theme = "dark",
  onToggleTheme,
}: JournalReaderProps) {
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const handleRelease = async () => {
    setIsReleasing(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsReleasing(false);
    }
  };

  const isLight = theme === "light";

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left animate-in fade-in duration-300">
      {/* Top Navigation & Minimal Action Row */}
      <div
        className={`flex items-center justify-between gap-4 pb-4 border-b transition-colors ${
          isLight ? "border-stone-200" : "border-zinc-800/60"
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 text-xs transition-colors cursor-pointer ${
            isLight
              ? "text-stone-500 hover:text-stone-900"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <ArrowLeft size={15} />
          <span>Return to Space</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? "border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              }`}
              title={isLight ? "Sanctuary Night" : "Quiet Parchment"}
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          )}



          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[18px] border text-xs transition cursor-pointer ${
              isLight
                ? "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>

          {/* Release Entry Action (Therapist Microcopy) */}
          {confirmRelease ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <button
                type="button"
                onClick={handleRelease}
                disabled={isReleasing}
                className="px-3.5 py-1.5 rounded-[18px] bg-red-950/60 border border-red-800/60 text-xs text-red-300 hover:bg-red-900/60 transition cursor-pointer disabled:opacity-50"
              >
                {isReleasing ? "Releasing..." : "Release entry"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRelease(false)}
                className={`px-2.5 py-1.5 rounded-[18px] border text-xs transition cursor-pointer ${
                  isLight
                    ? "border-stone-300 text-stone-500 hover:text-stone-800"
                    : "border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRelease(true)}
              className={`p-1.5 rounded-[18px] transition cursor-pointer ${
                isLight
                  ? "text-stone-400 hover:text-red-600 hover:bg-stone-100"
                  : "text-zinc-500 hover:text-red-400 hover:bg-zinc-900/60"
              }`}
              title="Release entry"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Immersive Reading Canvas with Generous Whitespace */}
      <article
        className={`rounded-[28px] border px-8 py-10 sm:px-14 sm:py-14 backdrop-blur-md shadow-xs transition-all duration-200 space-y-8 ${
          isLight
            ? "bg-[#FFFFFF] border-[rgba(24,24,27,0.08)] shadow-[0_8px_32px_rgba(24,24,27,0.06)]"
            : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        }`}
      >
        {/* Date header */}
        <div
          className={`flex items-center gap-2 text-xs font-medium ${
            isLight ? "text-stone-500" : "text-[#B8BDD6]"
          }`}
        >
          <Calendar size={13} className="text-[#BFAEFF]" />
          <time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time>
        </div>

        {/* Full Text - Book-like Paragraph Typography & Whitespace */}
        <div
          className={`text-base sm:text-lg space-y-6 ${
            isLight ? "text-stone-900" : "text-[#F8F7FF]"
          }`}
        >
          {entry.content.split(/\n\n+/).map((paragraph, idx) => (
            <p key={idx} className="leading-[1.85] whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Athena's Thought Note (Appears like a quiet note, not an AI response) */}
        {entry.ai_reflection ? (
          <div
            className={`mt-10 pt-8 border-t space-y-3 animate-in fade-in ${
              isLight ? "border-stone-200" : "border-[#7C5CFF]/20"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#BFAEFF] uppercase tracking-wider">
              <Heart size={14} className="fill-[#7C5CFF]/20 text-[#BFAEFF]" />
              <span>A thought from Athena</span>
            </div>
            <div
              className={`rounded-[20px] p-5 sm:p-6 border transition-all ${
                isLight
                  ? "bg-stone-50 border-stone-200 text-stone-800"
                  : "bg-[#0B1228]/80 border-[#7C5CFF]/25 text-[#F8F7FF]"
              }`}
            >
              <p className="text-sm sm:text-base italic leading-relaxed text-[#BFAEFF]">
                &ldquo;{entry.ai_reflection}&rdquo;
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`mt-10 pt-8 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? "border-stone-200" : "border-[#7C5CFF]/20"
            }`}
          >
            <p className={`text-xs ${isLight ? "text-stone-500" : "text-[#B8BDD6]/70"}`}>
              This entry is completely private to you.
            </p>
            <button
              type="button"
              onClick={() => onRequestReflection(entry.id)}
              disabled={isReflecting}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
                isLight
                  ? "border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800"
                  : "border-[#7C5CFF]/40 bg-[#7C5CFF]/15 hover:bg-[#7C5CFF]/25 text-[#F8F7FF] shadow-[0_0_12px_rgba(124,92,255,0.15)]"
              }`}
            >
              {isReflecting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-[#BFAEFF]" />
                  <span>Holding space...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className={isLight ? "text-stone-600" : "text-[#BFAEFF]"} />
                  <span>Invite a thought from Athena</span>
                </>
              )}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
