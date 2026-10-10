"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { ArrowRight, Clock, Wind, Footprints, BookOpen } from "lucide-react";

export default function InsightsWeeklyGuidance() {
  const { isLight } = useTheme();

  // Exactly three cards instead of long blocks of text, each with one-tap action
  const guidanceCards = [
    {
      id: "tue",
      day: "Tuesday",
      title: "2-minute reset.",
      description: "Coherent breathing before afternoon calendar blocks.",
      actionLabel: "Start reset",
      href: "/studio?practice=breathe",
      icon: Wind,
      accent: "#84A98C", // Sage
    },
    {
      id: "thu",
      day: "Thursday",
      title: "5-minute horizon walk.",
      description: "Let your eyes soften on distant lines to reset mental fatigue.",
      actionLabel: "Mindful walk",
      href: "/studio?practice=walk",
      icon: Footprints,
      accent: "#F59E0B", // Amber
    },
    {
      id: "sat",
      day: "Saturday",
      title: "Space unburdening.",
      description: "Empty unresolved mental chatter without formatting pressure.",
      actionLabel: "Open journal",
      href: "/journal",
      icon: BookOpen,
      accent: "#A78BFA", // Lavender
    },
  ];

  return (
    <section aria-label="Weekly Guidance" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h2
            className={`text-xs font-sans uppercase tracking-widest font-semibold ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Weekly Guidance
          </h2>
          <p
            className={`text-xs font-sans italic ${
              isLight ? "text-[#726E65]" : "text-[#959BB4]"
            }`}
          >
            Three gentle anchors for the days ahead.
          </p>
        </div>

        <span
          className={`text-[11px] font-sans ${
            isLight ? "text-[#726E65]" : "text-[#959BB4]"
          }`}
        >
          One-tap resets
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {guidanceCards.map((g) => {
          const Icon = g.icon;

          return (
            <Link
              key={g.id}
              href={g.href}
              className={`p-5 sm:p-6 rounded-[24px] border backdrop-blur-xl transition-all duration-[220ms] flex flex-col justify-between group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] ${
                isLight
                  ? "bg-[#F7F4EE]/90 border-[#E8DDC8] shadow-[0_4px_20px_-2px_rgba(44,38,30,0.05)] hover:shadow-[0_8px_28px_-4px_rgba(44,38,30,0.1)]"
                  : "bg-[#151A2E]/85 border-[#2E2157]/60 shadow-[0_4px_24px_-2px_rgba(15,18,32,0.7)] hover:shadow-[0_8px_32px_-4px_rgba(15,18,32,0.9),0_0_16px_rgba(167,139,250,0.18)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-semibold tracking-wider uppercase font-sans"
                    style={{ color: g.accent }}
                  >
                    {g.day}
                  </span>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-[10px]"
                    style={{
                      backgroundColor: `${g.accent}15`,
                      color: g.accent,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                </div>

                <h3 className="text-base font-semibold tracking-tight font-sans text-[#232220] dark:text-[#F1EEF8] mb-1.5 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                  {g.title}
                </h3>

                <p
                  className={`text-xs font-sans leading-relaxed ${
                    isLight ? "text-[#726E65]" : "text-[#959BB4]"
                  }`}
                >
                  {g.description}
                </p>
              </div>

              {/* Bottom One-Tap Button */}
              <div className="pt-4 mt-4 border-t border-[#E8DDC8]/60 dark:border-[#2E2157]/60 flex items-center justify-between">
                <span
                  className="text-xs font-semibold font-sans flex items-center gap-1 group-hover:gap-1.5 transition-all"
                  style={{ color: g.accent }}
                >
                  <span>{g.actionLabel}</span>
                  <ArrowRight size={13} />
                </span>
                <span
                  className={`text-[10px] font-sans ${
                    isLight ? "text-stone-400" : "text-zinc-500"
                  }`}
                >
                  1 tap
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
