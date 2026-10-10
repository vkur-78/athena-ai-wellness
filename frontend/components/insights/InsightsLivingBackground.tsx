"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

export default React.memo(function InsightsLivingBackground() {
  const { isLight } = useTheme();

  // Subtle ambient floating particles for quiet contemplative atmosphere
  const particles = useMemo(() => [
    { id: 1, left: "15%", top: "14%", size: 4, delay: "0s", duration: "16s", color: isLight ? "rgba(167, 139, 250, 0.35)" : "rgba(167, 139, 250, 0.25)" },
    { id: 2, left: "34%", top: "42%", size: 3, delay: "3s", duration: "18s", color: isLight ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.2)" },
    { id: 3, left: "62%", top: "22%", size: 5, delay: "1.5s", duration: "15s", color: isLight ? "rgba(52, 211, 153, 0.3)" : "rgba(52, 211, 153, 0.2)" },
    { id: 4, left: "82%", top: "36%", size: 4, delay: "4s", duration: "19s", color: isLight ? "rgba(167, 139, 250, 0.35)" : "rgba(167, 139, 250, 0.25)" },
    { id: 5, left: "48%", top: "68%", size: 3, delay: "6s", duration: "17s", color: isLight ? "rgba(244, 114, 182, 0.3)" : "rgba(244, 114, 182, 0.18)" },
  ], [isLight]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Slow, Gentle Ambient Radial Gradient Drift */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{
          backgroundImage: isLight
            ? "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(224, 231, 255, 0.35), rgba(254, 243, 199, 0.18) 45%, transparent 75%)"
            : "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(139, 92, 246, 0.12), rgba(16, 185, 129, 0.05) 45%, transparent 75%)",
        }}
      />

      {/* 2. Soft Horizon Luster */}
      <div
        className="absolute -top-12 left-0 right-0 h-72 opacity-30 animate-sanctuary-mist pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255, 255, 255, 0.5), transparent 70%)"
            : "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255, 255, 255, 0.03), transparent 70%)",
        }}
      />

      {/* 3. Sparse Contemplative Motes */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${
              p.id % 2 === 0 ? "animate-sanctuary-mote-1" : "animate-sanctuary-mote-2"
            }`}
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
});
