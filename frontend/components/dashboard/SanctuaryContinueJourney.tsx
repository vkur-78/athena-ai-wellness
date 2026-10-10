"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Wind, BookOpen, ArrowUpRight } from "lucide-react";

export default function SanctuaryContinueJourney() {
  const destinations = [
    {
      id: "conversation",
      title: "Conversation",
      sentence: "Sit across from Athena without pressure or judgment.",
      duration: "8–20 min",
      href: "/chat",
      icon: MessageSquare,
      accentBg: "bg-[#7C5CFF]/15 text-[#BFAEFF] border-[#7C5CFF]/30",
    },
    {
      id: "studio",
      title: "Studio",
      sentence: "Enter a soothing room to re-anchor your nervous system.",
      duration: "5 min",
      href: "/studio",
      icon: Wind,
      accentBg: "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30",
    },
    {
      id: "journal",
      title: "Journal",
      sentence: "Open a quiet space for thoughts that don't need fixing.",
      duration: "3 min",
      href: "/journal",
      icon: BookOpen,
      accentBg: "bg-[#BFAEFF]/15 text-[#BFAEFF] border-[#BFAEFF]/30",
    },
  ];

  return (
    <section aria-label="Continue Journey" className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-hero-serif font-bold tracking-tight text-[#F8F7FF]">
            Continue Journey
          </h2>
          <p className="text-[12px] sm:text-[13px] font-sans text-[#B8BDD6]">
            Three gentle paths designed to meet you where you are right now.
          </p>
        </div>
      </div>

      {/* 3 Compact Glass Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {destinations.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className="sanctuary-glass group flex flex-col justify-between p-5 sm:p-6 rounded-[22px] border border-[#7C5CFF]/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(248,247,255,0.08)] transition-all duration-[220ms] hover:-translate-y-1 hover:border-[#7C5CFF]/45 hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.75),0_0_20px_rgba(124,92,255,0.2)] cursor-pointer"
            >
              <div>
                {/* Top: Icon + Arrow */}
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-[220ms] group-hover:scale-105 shadow-xs ${card.accentBg}`}
                  >
                    <Icon size={18} />
                  </div>

                  <span className="p-1 rounded-full text-[#B8BDD6] group-hover:text-[#F8F7FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-[180ms]">
                    <ArrowUpRight size={15} />
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-[18px] sm:text-[19px] font-hero-serif font-semibold tracking-tight text-[#F8F7FF] mb-1 group-hover:text-[#BFAEFF] transition-colors">
                  {card.title}
                </h3>

                {/* Sentence */}
                <p className="text-[12px] font-sans text-[#B8BDD6] leading-relaxed">
                  {card.sentence}
                </p>
              </div>

              {/* Duration Tag */}
              <div className="pt-3.5 mt-3 border-t border-[#7C5CFF]/15 flex items-center justify-between text-[11px] font-sans text-[#959BB4]">
                <span>Paced visit</span>
                <span className="text-[#BFAEFF] font-medium">{card.duration}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
