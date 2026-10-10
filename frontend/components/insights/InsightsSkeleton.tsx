"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function InsightsSkeleton() {
  const { isLight } = useTheme();

  const shimmerClass = isLight
    ? "bg-gradient-to-r from-stone-200/40 via-stone-200/70 to-stone-200/40 animate-pulse rounded-2xl"
    : "bg-gradient-to-r from-[#20222a]/50 via-[#2a2d38]/70 to-[#20222a]/50 animate-pulse rounded-2xl";

  const cardBase = isLight
    ? "bg-[#fdfbf7]/80 border-[#e7e5e4] shadow-xs"
    : "bg-[#181920]/80 border-[#272834] shadow-xs";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* 1. Header & Live Context Skeleton */}
      <div className="space-y-2">
        <div className={`h-4 w-44 rounded-full ${shimmerClass}`} />
        <div className={`h-8 w-72 rounded-xl ${shimmerClass}`} />
        <div className={`h-4 w-96 max-w-full rounded-lg ${shimmerClass}`} />
      </div>

      {/* 2. Emotional River Centerpiece Skeleton */}
      <div className={`rounded-[28px] border p-6 sm:p-7 space-y-4 ${cardBase}`}>
        <div className="flex justify-between items-center pb-3 border-b border-inherit">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-xl ${shimmerClass}`} />
            <div className={`h-4 w-36 ${shimmerClass}`} />
          </div>
          <div className={`h-6 w-24 rounded-full ${shimmerClass}`} />
        </div>
        <div className={`h-48 w-full rounded-2xl ${shimmerClass}`} />
      </div>

      {/* 3. Rhythm Rings (4 Rings) Skeleton */}
      <div className={`rounded-[28px] border p-6 sm:p-7 space-y-4 ${cardBase}`}>
        <div className="flex justify-between items-center pb-3 border-b border-inherit">
          <div className={`h-4 w-44 ${shimmerClass}`} />
          <div className={`h-6 w-28 rounded-full ${shimmerClass}`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 p-3">
              <div className={`h-24 w-24 rounded-full ${shimmerClass}`} />
              <div className={`h-3 w-16 ${shimmerClass}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. AI Discovery Cards (4 Cards) Skeleton */}
      <div className="space-y-4">
        <div className={`h-4 w-40 ${shimmerClass}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`rounded-[28px] border p-5 sm:p-6 space-y-3 ${cardBase}`}>
              <div className="flex justify-between">
                <div className={`h-7 w-7 rounded-xl ${shimmerClass}`} />
                <div className={`h-5 w-24 rounded-full ${shimmerClass}`} />
              </div>
              <div className={`h-4 w-full ${shimmerClass}`} />
              <div className={`h-4 w-3/4 ${shimmerClass}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Pattern Garden Grid Skeleton (Heat Garden + Constellations) */}
      <div className="space-y-6">
        <div className={`h-64 rounded-[28px] border p-6 ${cardBase} ${shimmerClass}`} />
        <div className={`h-64 rounded-[28px] border p-6 ${cardBase} ${shimmerClass}`} />
      </div>

      {/* 6. Practice Impact Lab Skeleton */}
      <div className={`rounded-[28px] border p-6 sm:p-7 ${cardBase} space-y-3`}>
        <div className={`h-4 w-36 ${shimmerClass}`} />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-5 w-full rounded-full ${shimmerClass}`} />
          ))}
        </div>
      </div>

      {/* 7. Recovery Journey Flow Skeleton */}
      <div className={`rounded-[28px] border p-6 sm:p-7 ${cardBase} space-y-3`}>
        <div className={`h-4 w-44 ${shimmerClass}`} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-24 rounded-2xl ${shimmerClass}`} />
          ))}
        </div>
      </div>

      {/* 8. Seasonal Compass & Tiny Wins Skeleton */}
      <div className={`rounded-[28px] border p-8 flex flex-col items-center gap-4 ${cardBase}`}>
        <div className={`h-4 w-48 ${shimmerClass}`} />
        <div className={`h-48 w-48 rounded-full ${shimmerClass}`} />
      </div>

      {/* 9. Athena Analytics Explorer Skeleton */}
      <div className={`rounded-[28px] border p-6 sm:p-8 ${cardBase} space-y-5`}>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className={`h-4 w-32 rounded-full ${shimmerClass}`} />
            <div className={`h-6 w-64 rounded-xl ${shimmerClass}`} />
          </div>
          <div className={`h-6 w-36 rounded-full ${shimmerClass}`} />
        </div>
        {/* Chips row skeleton */}
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-8 w-36 rounded-full ${shimmerClass}`} />
          ))}
        </div>
        {/* Card skeleton */}
        <div className={`h-44 w-full rounded-2xl ${shimmerClass}`} />
      </div>
    </div>
  );
}
