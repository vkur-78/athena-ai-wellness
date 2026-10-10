"use client";

import { Feather } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function TypingIndicator() {
  const { isLight } = useTheme();

  return (
    <div
      className={`flex items-center gap-3.5 rounded-[24px] border px-5 py-3 text-xs w-fit shadow-md transition-all duration-[220ms] animate-in fade-in slide-in-from-bottom-2 ${
        isLight
          ? "bg-[#FFFFFF] border-[rgba(24,24,27,0.1)] text-[#18181B]"
          : "sanctuary-glass border-[#7C5CFF]/30 text-[#F8F7FF] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65),0_0_16px_rgba(124,92,255,0.15)]"
      }`}
    >
      <div
        className={`flex items-center gap-2 font-medium font-sans italic ${
          isLight ? "text-violet-700" : "text-[#BFAEFF]"
        }`}
      >
        <Feather size={14} className="animate-pulse text-[#7C5CFF]" />
        <span>Athena is listening &amp; reflecting...</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s] ${
            isLight ? "bg-violet-500" : "bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]"
          }`}
        />
        <span
          className={`h-2 w-2 rounded-full animate-bounce [animation-delay:-0.15s] ${
            isLight ? "bg-violet-500" : "bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]"
          }`}
        />
        <span
          className={`h-2 w-2 rounded-full animate-bounce ${
            isLight ? "bg-violet-500" : "bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]"
          }`}
        />
      </div>
    </div>
  );
}