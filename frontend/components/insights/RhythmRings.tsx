"use client";

import React, { useMemo } from "react";
import { CircleDot, Sparkles, Activity, ShieldCheck, Feather, Heart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TherapeuticAnalytics } from "@/types/insights";

interface RhythmRingsProps {
  analytics: TherapeuticAnalytics | null;
  calmScore?: number;
}

interface RingItem {
  id: string;
  label: string;
  subtitle: string;
  displayValue: string | number;
  fraction: number; // 0 to 1 for stroke progress
  strokeColor: string;
  bgStrokeColor: string;
  glowColor: string;
  icon: React.ReactNode;
}

export default React.memo(function RhythmRings({
  analytics,
  calmScore = 86,
}: RhythmRingsProps) {
  const { isLight } = useTheme();

  // Compute 4 clean metric rings
  const rings: RingItem[] = useMemo(() => {
    // 1. Calm score (0-100)
    const calmVal = calmScore || 86;

    // 2. Energy tier (1-4)
    const energyPoints = analytics?.energy_rhythm || [];
    const steadyCount = energyPoints.filter((e) => e.level.toLowerCase().includes("steady") || e.level.toLowerCase().includes("light")).length;
    const energyTier = Math.max(1, Math.min(4, steadyCount || 3));

    // 3. Recovery habits (1-5)
    const recoveryCount = analytics?.recovery_balance?.length || 4;

    // 4. Reflection count (1-7)
    const reflectionCount = 5;

    return [
      {
        id: "ring-calm",
        label: "Calm",
        subtitle: "Baseline peace",
        displayValue: calmVal,
        fraction: calmVal / 100,
        strokeColor: isLight ? "#10b981" : "#34d399",
        bgStrokeColor: isLight ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)",
        glowColor: "rgba(52, 211, 153, 0.35)",
        icon: <Heart size={13} className="text-emerald-500" />,
      },
      {
        id: "ring-energy",
        label: "Energy",
        subtitle: "Active tier",
        displayValue: energyTier,
        fraction: energyTier / 4,
        strokeColor: isLight ? "#f59e0b" : "#fbbf24",
        bgStrokeColor: isLight ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.12)",
        glowColor: "rgba(251, 191, 36, 0.35)",
        icon: <Activity size={13} className="text-amber-500" />,
      },
      {
        id: "ring-recovery",
        label: "Recovery",
        subtitle: "Active habits",
        displayValue: recoveryCount,
        fraction: Math.min(1, recoveryCount / 5),
        strokeColor: isLight ? "#0d9488" : "#2dd4bf",
        bgStrokeColor: isLight ? "rgba(13, 148, 136, 0.15)" : "rgba(13, 148, 136, 0.12)",
        glowColor: "rgba(45, 212, 191, 0.35)",
        icon: <ShieldCheck size={13} className="text-teal-500" />,
      },
      {
        id: "ring-reflection",
        label: "Reflection",
        subtitle: "Mindful pauses",
        displayValue: reflectionCount,
        fraction: Math.min(1, reflectionCount / 7),
        strokeColor: isLight ? "#8b5cf6" : "#a78bfa",
        bgStrokeColor: isLight ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.12)",
        glowColor: "rgba(167, 139, 250, 0.35)",
        icon: <Feather size={13} className="text-violet-500" />,
      },
    ];
  }, [analytics, calmScore, isLight]);

  // Circumference for r=32: 2 * PI * 32 ~= 201
  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-7 transition-all duration-200 ${
        isLight
          ? "bg-[#fdfbf7]/90 border-stone-200/80 shadow-xs"
          : "bg-[#1a1b22]/90 border-[#292b36] shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <CircleDot size={15} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-serif font-semibold tracking-tight ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Today&apos;s Rhythm Rings
            </h3>
            <p
              className={`text-[11px] font-serif ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Four quiet dimensions of your daily presence
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-serif px-2.5 py-0.5 rounded-full border ${
            isLight
              ? "bg-white/80 border-stone-200 text-stone-600"
              : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
          }`}
        >
          Breathing rhythm
        </span>
      </div>

      {/* 4 Rings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        {rings.map((ring) => {
          const strokeDashoffset = circumference - ring.fraction * circumference;

          return (
            <div
              key={ring.id}
              className={`group flex flex-col items-center text-center p-4 rounded-[20px] border transition-all duration-200 hover:-translate-y-0.5 cursor-default ${
                isLight
                  ? "bg-white/85 hover:bg-white border-stone-200/80 shadow-xs hover:shadow-sm"
                  : "bg-[#20222a]/85 hover:bg-[#252832] border-[#2c2f3c] hover:border-[#3c4050] shadow-xs"
              }`}
            >
              {/* Circular Ring with Breathing Aura */}
              <div className="relative flex items-center justify-center h-24 w-24 mb-3 animate-ring-breathe">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
                  {/* Background Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke={ring.bgStrokeColor}
                    strokeWidth="5.5"
                  />
                  {/* Foreground Animated Progress Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke={ring.strokeColor}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 6px ${ring.glowColor})`,
                    }}
                  />
                </svg>

                {/* Single Number Display inside Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-xl sm:text-2xl font-serif font-semibold tracking-tight ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {ring.displayValue}
                  </span>
                </div>
              </div>

              {/* Ring Label & Context */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1.5">
                  {ring.icon}
                  <span
                    className={`text-xs sm:text-sm font-serif font-semibold ${
                      isLight ? "text-stone-900" : "text-zinc-100"
                    }`}
                  >
                    {ring.label}
                  </span>
                </div>
                <p
                  className={`text-[11px] font-serif ${
                    isLight ? "text-stone-500" : "text-zinc-400"
                  }`}
                >
                  {ring.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
