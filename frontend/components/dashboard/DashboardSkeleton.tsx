"use client";

import React from "react";

export default function DashboardSkeleton() {
  const shimmer = "animate-pulse rounded-2xl bg-[#0B1228]/80 border border-[#7C5CFF]/15";

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-16 animate-in fade-in duration-200">
      {/* 1. Welcome Hero Skeleton */}
      <div className="sanctuary-glass p-6 sm:p-10 rounded-[28px] border border-[#7C5CFF]/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className={`h-5 w-36 ${shimmer}`} />
            <div className={`h-14 w-72 sm:w-96 ${shimmer}`} />
            <div className={`h-6 w-64 ${shimmer}`} />
            <div className="flex gap-3 pt-2">
              <div className={`h-8 w-36 rounded-full ${shimmer}`} />
              <div className={`h-8 w-48 rounded-full ${shimmer}`} />
            </div>
            <div className={`h-12 w-44 rounded-[20px] ${shimmer} mt-3`} />
          </div>
          <div className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full shrink-0 ${shimmer}`} />
        </div>
      </div>

      {/* 2. Emotional Snapshot Skeleton (4 Cards) */}
      <div className="space-y-4">
        <div className={`h-8 w-56 ${shimmer}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className={`h-44 rounded-[24px] ${shimmer}`} />
          <div className={`h-44 rounded-[24px] ${shimmer}`} />
          <div className={`h-44 rounded-[24px] ${shimmer}`} />
          <div className={`h-44 rounded-[24px] ${shimmer}`} />
        </div>
      </div>

      {/* 3. Weekly Replay Carousel Skeleton */}
      <div className="space-y-4">
        <div className={`h-8 w-48 ${shimmer}`} />
        <div className="flex gap-5 overflow-hidden">
          <div className={`w-[320px] sm:w-[360px] h-64 shrink-0 rounded-[26px] ${shimmer}`} />
          <div className={`w-[320px] sm:w-[360px] h-64 shrink-0 rounded-[26px] ${shimmer}`} />
          <div className={`w-[360px] sm:w-[420px] h-64 shrink-0 rounded-[26px] ${shimmer}`} />
        </div>
      </div>

      {/* 4. Continue Journey Skeleton (4 Action Cards) */}
      <div className="space-y-4">
        <div className={`h-8 w-52 ${shimmer}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className={`h-48 rounded-[26px] ${shimmer}`} />
          <div className={`h-48 rounded-[26px] ${shimmer}`} />
          <div className={`h-48 rounded-[26px] ${shimmer}`} />
          <div className={`h-48 rounded-[26px] ${shimmer}`} />
        </div>
      </div>

      {/* 5. Gentle Reflection Skeleton (2 Cards) */}
      <div className="space-y-4">
        <div className={`h-8 w-48 ${shimmer}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`h-36 rounded-[26px] ${shimmer}`} />
          <div className={`h-36 rounded-[26px] ${shimmer}`} />
        </div>
      </div>

      {/* 6. Weekly Timeline Ribbon Skeleton */}
      <div className="space-y-4">
        <div className={`h-8 w-44 ${shimmer}`} />
        <div className={`h-48 rounded-[28px] ${shimmer}`} />
      </div>
    </div>
  );
}
