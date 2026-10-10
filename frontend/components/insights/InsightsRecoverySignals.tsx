"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Wind, BookOpen, Footprints, MessageSquare, Sparkles } from "lucide-react";

export default function InsightsRecoverySignals() {
  const { isLight } = useTheme();
  const [selectedSignal, setSelectedSignal] = useState<string>("Breathing");

  // Animated chips: Breathing, Space, Walking, Conversation
  // Chips grow slightly and pulse if they helped recently
  const signals = [
    {
      id: "Breathing",
      label: "Breathing Practice",
      helpedRecently: true,
      scaleClass: "scale-105",
      effect: "Reduced acute stress response in 92% of observed episodes.",
      recentMoment: "Helped yesterday during 4 PM transition",
      accent: "#84A98C", // Sage
      icon: Wind,
    },
    {
      id: "Space",
      label: "Space Journal",
      helpedRecently: true,
      scaleClass: "scale-105",
      effect: "Externalizing worries into writing shortened sleep latency by 22 min.",
      recentMoment: "Helped 2 days ago before bedtime",
      accent: "#A78BFA", // Lavender
      icon: BookOpen,
    },
    {
      id: "Walking",
      label: "Mindful Walking",
      helpedRecently: false,
      scaleClass: "scale-100",
      effect: "Undulating outdoor horizon groundings renewed emotional patience.",
      recentMoment: "Helped 4 days ago",
      accent: "#F59E0B", // Amber
      icon: Footprints,
    },
    {
      id: "Conversation",
      label: "Therapist Conversation",
      helpedRecently: true,
      scaleClass: "scale-105",
      effect: "Validating emotional conflict removed unhelpful internal self-blame.",
      recentMoment: "Helped yesterday morning",
      accent: "#7BAFD4", // Sky Blue
      icon: MessageSquare,
    },
  ];

  const active = signals.find((s) => s.id === selectedSignal) || signals[0];

  return (
    <section aria-label="Recovery Signals" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h2
            className={`text-xs font-sans uppercase tracking-widest font-semibold ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Recovery Signals
          </h2>
          <p
            className={`text-xs font-sans italic ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Modalities that successfully restored your nervous system.
          </p>
        </div>

        <span
          className={`text-[11px] font-sans ${
            isLight ? "text-[#726E65]" : "text-[#959BB4]"
          }`}
        >
          Expanded chip = helped recently
        </span>
      </div>

      {/* Animated Chips row */}
      <div className="flex flex-wrap items-center gap-3 py-2">
        {signals.map((s) => {
          const Icon = s.icon;
          const isSelected = s.id === selectedSignal;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSignal(s.id)}
              className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all duration-[220ms] cursor-pointer ${
                s.helpedRecently ? `${s.scaleClass} shadow-md` : ""
              } ${
                isSelected
                  ? isLight
                    ? "bg-[#F1EBDD] border-[#E8DDC8] text-[#232220] ring-2 ring-violet-500/20"
                    : "bg-[#2E2157]/50 border-violet-400/50 text-[#F1EEF8] ring-2 ring-violet-500/40"
                  : isLight
                  ? "bg-[#F7F4EE]/90 border-[#E8DDC8] text-[#726E65] hover:bg-[#F1EBDD]"
                  : "bg-[#151A2E]/85 border-[#2E2157]/60 text-[#959BB4] hover:bg-[#1F253F]"
              }`}
            >
              {/* Subtle halo if helped recently */}
              {s.helpedRecently && (
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: s.accent,
                    boxShadow: `0 0 8px ${s.accent}`,
                  }}
                />
              )}

              <Icon size={14} style={{ color: s.accent }} />
              <span className="text-xs font-semibold font-sans">
                {s.id}
              </span>

              {s.helpedRecently && (
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.2 rounded-full ${
                    isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-950/60 text-emerald-300"
                  }`}
                >
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail Narrative for Selected Signal */}
      <div
        className={`p-4 rounded-[20px] border text-xs font-sans leading-relaxed transition-all duration-200 ${
          isLight
            ? "bg-[#F1EBDD]/60 border-[#E8DDC8] text-[#232220]"
            : "bg-[#1F253F]/60 border-[#2E2157] text-[#F1EEF8]"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-xs" style={{ color: active.accent }}>
            {active.label}
          </span>
          <span className="text-[11px] opacity-75 font-sans italic">
            {active.recentMoment}
          </span>
        </div>
        <p>{active.effect}</p>
      </div>
    </section>
  );
}
