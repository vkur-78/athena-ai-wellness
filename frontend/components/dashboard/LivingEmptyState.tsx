"use client";

import React from "react";
import Link from "next/link";
import { Wind, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface LivingEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  showDots?: boolean;
}

export default React.memo(function LivingEmptyState({
  title = "Every small pause becomes part of your story.",
  description = "Take a gentle breath whenever you feel called. Your sanctuary is here.",
  actionLabel = "Begin 2-min Guided Breath",
  actionHref = "/studio?practice=breathe",
  onAction,
  showDots = true,
}: LivingEmptyStateProps) {
  const { isLight } = useTheme();

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4 transition-all duration-200 ${
        isLight
          ? "bg-[#ffffff]/80 border-[#e8e4dc] shadow-sm"
          : "bg-[#181922]/80 border-[#252733] shadow-md"
      }`}
    >
      {/* Tiny Animated Breathing Dots */}
      {showDots && (
        <div className="flex items-center gap-1.5 py-1" aria-hidden="true">
          <span
            className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
            style={{ animationDuration: "2.4s" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"
            style={{ animationDuration: "2.8s", animationDelay: "0.4s" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"
            style={{ animationDuration: "3.2s", animationDelay: "0.8s" }}
          />
        </div>
      )}

      {/* Warm Guidance Text */}
      <div className="space-y-1.5 max-w-md">
        <h4
          className={`text-base font-serif font-medium tracking-tight ${
            isLight ? "text-stone-900" : "text-white"
          }`}
        >
          {title}
        </h4>
        <p
          className={`text-xs font-serif leading-relaxed ${
            isLight ? "text-stone-500" : "text-zinc-400"
          }`}
        >
          {description}
        </p>
      </div>

      {/* Suggested Action */}
      {actionLabel && (
        <div className="pt-1">
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-[18px] text-xs font-serif font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                isLight
                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-xs"
              }`}
            >
              <span>{actionLabel}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <Link
              href={actionHref}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-[18px] text-xs font-serif font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                isLight
                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-xs"
              }`}
            >
              <span>{actionLabel}</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
});
