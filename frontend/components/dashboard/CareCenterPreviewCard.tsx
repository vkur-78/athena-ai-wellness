"use client";

import React from "react";
import { Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface CareCenterPreviewCardProps {
  onOpenCareCenter: () => void;
}

export default React.memo(function CareCenterPreviewCard({
  onOpenCareCenter,
}: CareCenterPreviewCardProps) {
  const { isLight } = useTheme();

  return (
    <div
      role="region"
      aria-label="Care Center Trust Card"
      className={`relative overflow-hidden rounded-[28px] border p-5 transition-all duration-200 ${
        isLight
          ? "bg-gradient-to-br from-rose-50/50 via-white/95 to-[#faf6f0]/95 border-rose-200/70 shadow-xs hover:border-rose-300"
          : "bg-gradient-to-br from-rose-950/20 via-[#1a1b22]/95 to-[#14151a]/95 border-rose-900/30 shadow-sm hover:border-rose-800/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 p-2.5 rounded-2xl border text-xs shadow-xs ${
            isLight
              ? "bg-rose-100/70 border-rose-200 text-rose-700"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <Heart size={15} className="fill-current" />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="text-sm font-serif font-semibold tracking-tight">
            Support is always within reach.
          </h4>
          <p className="text-xs opacity-70 leading-relaxed font-serif">
            A gentle hand if you or someone you cherish ever needs grounded care and warm human guidance.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCareCenter}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[18px] text-xs font-serif font-medium transition-all duration-180 active:scale-95 cursor-pointer ${
                isLight
                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white shadow-xs"
              }`}
            >
              <span>Open Care Center</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
