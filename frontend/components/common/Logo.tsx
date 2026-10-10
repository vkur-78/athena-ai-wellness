"use client";

import React from "react";
import { Feather } from "lucide-react";

interface AthenaLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function AthenaAvatar({
  size = "md",
  className = "",
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    xs: { box: "w-5 h-5 rounded-md", icon: 10 },
    sm: { box: "w-7 h-7 rounded-xl", icon: 13 },
    md: { box: "w-8 h-8 rounded-[14px]", icon: 15 },
    lg: { box: "w-10 h-10 rounded-2xl", icon: 18 },
  };

  const config = sizeMap[size];

  return (
    <div
      className={`flex items-center justify-center shrink-0 bg-gradient-to-br from-[#7C5CFF] to-indigo-800 text-white shadow-sm shadow-[#7C5CFF]/30 ${config.box} ${className}`}
      aria-label="Athena"
    >
      <Feather size={config.icon} className="transition-transform group-hover:rotate-6 duration-200" />
    </div>
  );
}

export default function Logo({
  size = "md",
  showText = true,
  className = "",
}: AthenaLogoProps) {
  const textSizes = {
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-xl sm:text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AthenaAvatar size={size} />
      {showText && (
        <span
          className={`font-semibold tracking-tight font-hero-serif text-[#F8F7FF] ${textSizes[size]}`}
        >
          Athena
        </span>
      )}
    </div>
  );
}