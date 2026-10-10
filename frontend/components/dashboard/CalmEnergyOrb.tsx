"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface CalmEnergyOrbProps {
  todayCheckin?: CheckinResponse | null;
  checkinHistory?: CheckinResponse[];
  onOpenInsights?: () => void;
}

type BalanceState = "Steady" | "Restoring" | "Light" | "Quiet" | "Grounded";

export default React.memo(function CalmEnergyOrb({
  todayCheckin,
  checkinHistory = [],
  onOpenInsights,
}: CalmEnergyOrbProps) {
  const router = useRouter();
  const { isLight } = useTheme();

  // Determine emotional balance state from checkin data
  const { stateWord, stateSentence, orbGradient, haloGlow } = useMemo(() => {
    let state: BalanceState = "Grounded";
    let sentence = "A quiet equilibrium is settling into your day.";
    let gradient = "radial-gradient(circle, rgba(167, 139, 250, 0.9) 0%, rgba(139, 92, 246, 0.7) 45%, rgba(99, 102, 241, 0.4) 75%, transparent 100%)";
    let glow = "rgba(167, 139, 250, 0.4)";

    const stress = todayCheckin?.stress_level;
    const mood = todayCheckin?.mood?.toLowerCase();

    if (stress === 1 || mood === "joyful" || mood === "good") {
      state = "Light";
      sentence = "Your energy feels open, unburdened, and present.";
      gradient = "radial-gradient(circle, rgba(253, 230, 138, 0.95) 0%, rgba(251, 191, 36, 0.75) 40%, rgba(245, 158, 11, 0.4) 75%, transparent 100%)";
      glow = "rgba(251, 191, 36, 0.4)";
    } else if (stress === 2 || mood === "calm" || mood === "peaceful") {
      state = "Steady";
      sentence = "Your energy has stayed steadier than yesterday.";
      gradient = "radial-gradient(circle, rgba(167, 243, 208, 0.95) 0%, rgba(52, 211, 153, 0.75) 45%, rgba(16, 185, 129, 0.4) 75%, transparent 100%)";
      glow = "rgba(52, 211, 153, 0.4)";
    } else if (stress === 3 || mood === "reflective") {
      state = "Grounded";
      sentence = "Holding an anchored, calm rhythm through the hours.";
      gradient = "radial-gradient(circle, rgba(167, 139, 250, 0.95) 0%, rgba(139, 92, 246, 0.7) 45%, rgba(99, 102, 241, 0.4) 75%, transparent 100%)";
      glow = "rgba(167, 139, 250, 0.4)";
    } else if (stress === 4 || mood === "tired") {
      state = "Quiet";
      sentence = "Energy is resting softly; honoring the need to slow down.";
      gradient = "radial-gradient(circle, rgba(199, 210, 254, 0.95) 0%, rgba(129, 140, 248, 0.7) 45%, rgba(79, 70, 229, 0.35) 75%, transparent 100%)";
      glow = "rgba(129, 140, 248, 0.35)";
    } else if (stress === 5 || mood === "anxious" || mood === "overwhelmed") {
      state = "Restoring";
      sentence = "Sanctuary is holding space while your heart gently re-centers.";
      gradient = "radial-gradient(circle, rgba(254, 205, 215, 0.95) 0%, rgba(244, 114, 182, 0.75) 45%, rgba(225, 29, 72, 0.35) 75%, transparent 100%)";
      glow = "rgba(244, 114, 182, 0.4)";
    }

    return {
      stateWord: state,
      stateSentence: sentence,
      orbGradient: gradient,
      haloGlow: glow,
    };
  }, [todayCheckin]);

  const handleTap = () => {
    if (onOpenInsights) {
      onOpenInsights();
    } else {
      router.push("/insights");
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTap();
        }
      }}
      aria-label={`Calm Energy Orb: ${stateWord}. Tap to open Insights.`}
      className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-sm hover:shadow-md hover:border-stone-300"
          : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-md hover:shadow-lg hover:border-[#3d4050]"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-serif tracking-widest opacity-60">Emotional Balance</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-serif opacity-70 group-hover:opacity-100 transition-opacity">
          <span>Insights</span>
          <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-180" />
        </div>
      </div>

      {/* Floating Glowing Orb Centerpiece */}
      <div className="py-4 flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer Soft Halo */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-300"
            style={{ backgroundColor: haloGlow }}
          />

          {/* Middle Diffuse Ring */}
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full blur-md opacity-70 animate-ring-breathe"
            style={{ backgroundColor: haloGlow }}
          />

          {/* Living Orb Core with layered gradient & slow breathing */}
          <div
            className="relative z-10 w-24 h-24 rounded-full animate-orb-breathe shadow-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300"
            style={{
              backgroundImage: orbGradient,
              boxShadow: `0 0 32px ${haloGlow}`,
            }}
          >
            {/* Subtle Inner Sheen */}
            <div
              aria-hidden="true"
              className="absolute top-1.5 left-3 w-8 h-4 rounded-full bg-white/40 blur-[1px] rotate-[-25deg] pointer-events-none"
            />
          </div>
        </div>

        {/* Balance State Word */}
        <h4 className="mt-3 text-lg font-serif font-semibold tracking-tight text-center">
          {stateWord}
        </h4>

        {/* Narrative Sentence */}
        <p className={`mt-1 text-xs text-center leading-relaxed font-serif ${isLight ? "text-stone-600" : "text-zinc-300"}`}>
          {stateSentence}
        </p>
      </div>
    </div>
  );
});
