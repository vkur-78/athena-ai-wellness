"use client";

import React from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

interface LoadingProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

export default function Loading({
  label = "Entering sanctuary...",
  sublabel = "Finding a quiet space for your thoughts",
  fullScreen = true,
}: LoadingProps) {
  const { isLight } = useTheme();

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center select-none animate-in fade-in duration-300">
      {/* Official Athena Brand Mark with Gentle Pulse */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Subtle ambient halo */}
        <div className="absolute w-20 h-20 rounded-full bg-[#7C5CFF]/25 blur-xl animate-pulse" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-xl shadow-[#7C5CFF]/35 border border-[#7C5CFF]/40 bg-[#0B1228] animate-pulse duration-1000">
          <Image
            src="/athena-logo.png"
            alt="Athena Logo"
            width={64}
            height={64}
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Calming text */}
      <p
        className={`text-sm font-medium tracking-tight font-sans ${
          isLight ? "text-stone-800" : "text-[#F8F7FF]"
        }`}
      >
        {label}
      </p>

      {sublabel && (
        <p
          className={`text-xs mt-1.5 max-w-xs font-sans leading-relaxed ${
            isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
          }`}
        >
          {sublabel}
        </p>
      )}
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
        isLight ? "bg-[#F7F4EE]/95" : "bg-[#060814]/95"
      } backdrop-blur-md`}
    >
      {content}
    </div>
  );
}
