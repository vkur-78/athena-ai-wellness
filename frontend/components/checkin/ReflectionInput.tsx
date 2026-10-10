"use client";

import { useEffect, useRef } from "react";
import { MessageSquareQuote } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import clsx from "clsx";

interface ReflectionInputProps {
  value: string;
  onChange: (val: string) => void;
}

export default function ReflectionInput({
  value,
  onChange,
}: ReflectionInputProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(
        textareaRef.current.scrollHeight,
        110
      )}px`;
    }
  }, [value]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className={clsx("text-xl sm:text-2xl font-semibold tracking-tight", isLight ? "text-stone-900" : "text-white")}>
          Would you like to leave a thought about today?
        </h2>
        <p className={clsx("text-xs sm:text-sm max-w-md mx-auto", isLight ? "text-stone-500" : "text-zinc-400")}>
          Whatever is resting on your mind right now. This is completely optional.
        </p>
      </div>

      <div
        className={clsx(
          "rounded-3xl p-5 sm:p-6 space-y-3 border transition-colors",
          isLight
            ? "border-stone-200/90 bg-stone-50/80 shadow-md shadow-stone-200/50"
            : "border-zinc-800/90 bg-zinc-950/70 backdrop-blur-sm shadow-xl shadow-black/40"
        )}
      >
        <div className="flex items-center justify-between text-xs">
          <div className={clsx("flex items-center gap-2 font-medium", isLight ? "text-violet-700" : "text-violet-400")}>
            <MessageSquareQuote size={15} />
            <span>Personal Note</span>
          </div>
          <span className={clsx("italic", isLight ? "text-stone-400" : "text-zinc-500")}>Optional</span>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder="It can be one sentence..."
            maxLength={500}
            className={clsx(
              "w-full resize-none rounded-2xl border p-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all leading-relaxed",
              isLight
                ? "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-violet-500"
                : "bg-zinc-900/60 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70"
            )}
          />
        </div>

        <div className={clsx("flex justify-between items-center text-[11px] pt-1", isLight ? "text-stone-400" : "text-zinc-500")}>
          <span>Even a few words help anchor your day.</span>
          <span>{value.length} / 500</span>
        </div>
      </div>
    </div>
  );
}
