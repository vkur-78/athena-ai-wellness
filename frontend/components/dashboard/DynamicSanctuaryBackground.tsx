"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { TimeOfDayPeriod } from "@/types/dashboard";

interface DynamicSanctuaryBackgroundProps {
  forcePeriod?: TimeOfDayPeriod;
}

export default React.memo(function DynamicSanctuaryBackground({
  forcePeriod,
}: DynamicSanctuaryBackgroundProps) {
  const { isLight } = useTheme();

  // Compute time of day
  const period = useMemo<TimeOfDayPeriod>(() => {
    if (forcePeriod) return forcePeriod;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }, [forcePeriod]);

  // Atmospheric gradient based on period and theme
  const atmosphericGradient = useMemo(() => {
    if (isLight) {
      switch (period) {
        case "morning":
          // soft cream, pale lavender, warm sunlight glow
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(254, 225, 180, 0.55), rgba(233, 220, 252, 0.4) 42%, rgba(255, 253, 248, 0.95) 85%)";
        case "afternoon":
          // clearer sky, subtle warmth
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(210, 238, 255, 0.45), rgba(254, 243, 210, 0.32) 48%, rgba(248, 246, 240, 0.95) 85%)";
        case "evening":
          // lavender, peach horizon
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(254, 205, 185, 0.5), rgba(220, 195, 250, 0.35) 50%, rgba(248, 246, 240, 0.95) 85%)";
        case "night":
          // deep indigo, soft moonlight
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(200, 215, 255, 0.3), rgba(220, 215, 245, 0.18) 50%, rgba(248, 246, 240, 0.98) 85%)";
      }
    } else {
      switch (period) {
        case "morning":
          // soft cream & warm sunlight glow on dark canvas
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(245, 158, 11, 0.18), rgba(167, 139, 250, 0.12) 45%, rgba(18, 19, 22, 0.98) 80%)";
        case "afternoon":
          // clearer sky, subtle warmth on dark canvas
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(56, 189, 248, 0.15), rgba(245, 158, 11, 0.08) 50%, rgba(18, 19, 22, 0.98) 80%)";
        case "evening":
          // lavender, peach horizon
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(251, 146, 60, 0.2), rgba(168, 85, 247, 0.15) 50%, rgba(18, 19, 22, 0.98) 80%)";
        case "night":
          // deep indigo, soft moonlight
          return "radial-gradient(ellipse 95% 65% at 50% -10%, rgba(99, 102, 241, 0.22), rgba(129, 140, 248, 0.1) 48%, rgba(15, 16, 22, 0.98) 85%)";
      }
    }
  }, [isLight, period]);

  // Floating petals and soft light particles
  const floatingElements = useMemo(() => {
    const isNight = period === "night";
    const isMorning = period === "morning";
    const isEvening = period === "evening";

    return [
      { id: 1, type: "petal", left: "8%", top: "18%", size: 10, delay: "0s", duration: "16s", color: isNight ? "rgba(199, 210, 254, 0.35)" : isMorning ? "rgba(254, 205, 215, 0.5)" : "rgba(251, 191, 160, 0.45)" },
      { id: 2, type: "particle", left: "22%", top: "38%", size: 4, delay: "2.5s", duration: "12s", color: isNight ? "rgba(224, 231, 255, 0.55)" : "rgba(253, 224, 71, 0.4)" },
      { id: 3, type: "petal", left: "44%", top: "15%", size: 8, delay: "1.2s", duration: "19s", color: isNight ? "rgba(167, 139, 250, 0.3)" : "rgba(244, 114, 182, 0.35)" },
      { id: 4, type: "particle", left: "62%", top: "28%", size: 5, delay: "4s", duration: "14s", color: isNight ? "rgba(199, 210, 254, 0.5)" : "rgba(251, 191, 36, 0.35)" },
      { id: 5, type: "petal", left: "82%", top: "22%", size: 11, delay: "3s", duration: "18s", color: isNight ? "rgba(165, 180, 252, 0.3)" : isEvening ? "rgba(251, 146, 60, 0.35)" : "rgba(254, 215, 226, 0.45)" },
      { id: 6, type: "particle", left: "34%", top: "54%", size: 3, delay: "5.5s", duration: "13s", color: isNight ? "rgba(253, 230, 138, 0.4)" : "rgba(167, 139, 250, 0.35)" },
      { id: 7, type: "petal", left: "74%", top: "60%", size: 9, delay: "2s", duration: "17s", color: isNight ? "rgba(199, 210, 254, 0.35)" : "rgba(251, 168, 182, 0.4)" },
    ];
  }, [period]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Atmospheric Breathing Sky Gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out animate-gradient-breathe"
        style={{ backgroundImage: atmosphericGradient }}
      />

      {/* 2. Soft Horizon Moonlight / Warm Sunlight Glow */}
      <div
        className="absolute -top-20 left-0 right-0 h-96 opacity-40 animate-sanctuary-mist pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 120% 70% at 50% 0%, rgba(255, 255, 255, 0.7), transparent 75%)"
            : "radial-gradient(ellipse 120% 70% at 50% 0%, rgba(255, 255, 255, 0.05), transparent 75%)",
        }}
      />

      {/* 3. Drifting Petals & Soft Light Particles */}
      <div className="absolute inset-0">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className={`absolute ${
              el.type === "petal"
                ? "animate-petal-drift rounded-[40%_60%_70%_30%]"
                : el.id % 2 === 0
                ? "animate-sanctuary-mote-1 rounded-full"
                : "animate-sanctuary-mote-2 rounded-full"
            }`}
            style={{
              left: el.left,
              top: el.top,
              width: `${el.size}px`,
              height: el.type === "petal" ? `${el.size * 1.3}px` : `${el.size}px`,
              backgroundColor: el.color,
              boxShadow: `0 0 ${el.size * 2}px ${el.color}`,
              animationDelay: el.delay,
              animationDuration: el.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
});
