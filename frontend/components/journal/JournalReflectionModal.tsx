"use client";

import { Sparkles, Lock, Check, Loader2 } from "lucide-react";

interface JournalReflectionModalProps {
  isOpen: boolean;
  onReflectTogether: () => void;
  onKeepPrivate: () => void;
  isReflecting?: boolean;
  theme?: "dark" | "light";
}

export default function JournalReflectionModal({
  isOpen,
  onReflectTogether,
  onKeepPrivate,
  isReflecting = false,
  theme = "dark",
}: JournalReflectionModalProps) {
  if (!isOpen) return null;

  const isLight = theme === "light";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`w-full max-w-md rounded-3xl border p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 ${
          isLight
            ? "bg-[#fdfbf7] border-[#e7e5e4] text-stone-900 shadow-stone-900/20"
            : "bg-[#0c0d12]/95 border-zinc-800 text-zinc-100 shadow-black/80"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Ambient Glow */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 h-28 w-56 rounded-full blur-3xl pointer-events-none ${
            isLight ? "bg-stone-300/30" : "bg-violet-600/20"
          }`}
        />

        {/* Saved Confirmation Header */}
        <div className="space-y-2.5">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <Check size={22} strokeWidth={2.5} />
          </div>

          <h3
            className={`text-xl font-semibold tracking-tight font-serif ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            Your words are safely here.
          </h3>
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? "text-stone-600" : "text-zinc-400"
            }`}
          >
            Would you like Athena to reflect with you?
          </p>
        </div>

        {/* Options: Default is "Keep this private" */}
        <div className="space-y-3 pt-2">
          {/* Default Option: Keep this private */}
          <button
            type="button"
            onClick={onKeepPrivate}
            disabled={isReflecting}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 ${
              isLight
                ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md shadow-stone-900/10 hover:scale-[1.01] active:scale-[0.99]"
                : "border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 text-white shadow-md shadow-black/40 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <Lock size={14} className={isLight ? "text-stone-300" : "text-zinc-400"} />
            <span>Keep this private</span>
            <span
              className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ml-1 ${
                isLight ? "bg-stone-800 text-stone-300" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Default
            </span>
          </button>

          {/* Option: Reflect together */}
          <button
            type="button"
            onClick={onReflectTogether}
            disabled={isReflecting}
            className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 ${
              isLight
                ? "border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800"
                : "border-violet-800/50 bg-violet-950/30 hover:bg-violet-900/40 text-violet-300"
            }`}
          >
            {isReflecting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Athena is reflecting...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Reflect together</span>
              </>
            )}
          </button>
        </div>

        <p className={`text-[11px] ${isLight ? "text-stone-500" : "text-zinc-500"}`}>
          You can always invite a thought from Athena later when reading your entry.
        </p>
      </div>
    </div>
  );
}
