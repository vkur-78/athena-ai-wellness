"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Wind, Footprints, BookOpen, Feather } from "lucide-react";

export default function InsightsPracticeImpact() {
  const { isLight } = useTheme();

  // Circular rings for practice impact - strictly no bar charts!
  const practices = [
    {
      id: "breathing",
      name: "Breathing",
      percent: 82,
      subtitle: "Cortisol downshift",
      accent: "#84A98C", // Sage
      icon: Wind,
    },
    {
      id: "walking",
      name: "Walking",
      percent: 71,
      subtitle: "Somatic release",
      accent: "#F59E0B", // Amber
      icon: Footprints,
    },
    {
      id: "space",
      name: "Space Journal",
      percent: 89,
      subtitle: "Clarity restore",
      accent: "#A78BFA", // Lavender
      icon: BookOpen,
    },
    {
      id: "quiet",
      name: "Quiet Pause",
      percent: 78,
      subtitle: "Sensory silence",
      accent: "#7BAFD4", // Sky Blue
      icon: Feather,
    },
  ];

  return (
    <section aria-label="Practice Impact" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h2
            className={`text-xs font-sans uppercase tracking-widest font-semibold ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Practice Impact
          </h2>
          <p
            className={`text-xs font-sans italic ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Nervous system recovery rates calculated across 30 days.
          </p>
        </div>

        <span
          className={`text-[11px] font-sans ${
            isLight ? "text-[#726E65]" : "text-[#959BB4]"
          }`}
        >
          Circular Rings
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {practices.map((item) => {
          const Icon = item.icon;
          const radius = 26;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset =
            circumference - (item.percent / 100) * circumference;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-[24px] border backdrop-blur-xl transition-all duration-[220ms] flex flex-col items-center text-center hover:-translate-y-1 hover:scale-[1.02] ${
                isLight
                  ? "bg-[#F7F4EE]/90 border-[#E8DDC8] shadow-[0_4px_20px_-2px_rgba(44,38,30,0.05)] hover:shadow-[0_8px_28px_-4px_rgba(44,38,30,0.1)]"
                  : "bg-[#151A2E]/85 border-[#2E2157]/60 shadow-[0_4px_24px_-2px_rgba(15,18,32,0.7)] hover:shadow-[0_8px_32px_-4px_rgba(15,18,32,0.9),0_0_16px_rgba(167,139,250,0.18)]"
              }`}
            >
              {/* Circular SVG Ring */}
              <div className="relative flex items-center justify-center w-20 h-20 mb-3">
                <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className={isLight ? "text-stone-200/80" : "text-zinc-800/80"}
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke={item.accent}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 6px ${item.accent}40)`,
                    }}
                  />
                </svg>

                {/* Center % and Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-sm font-bold font-sans tracking-tight"
                    style={{ color: item.accent }}
                  >
                    {item.percent}%
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={13} style={{ color: item.accent }} />
                <span className="text-xs font-semibold font-sans text-[#232220] dark:text-[#F1EEF8]">
                  {item.name}
                </span>
              </div>

              <span
                className={`text-[10px] font-sans ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                {item.subtitle}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
