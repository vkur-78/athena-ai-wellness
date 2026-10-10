"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare, Feather, Wind, Heart, Sparkles, X, Plus } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface SanctuaryFabProps {
  onOpenCheckin?: () => void;
  onCheckinClick?: () => void;
  onOverwhelmedClick?: () => void;
}

export default function SanctuaryFab({
  onOpenCheckin,
  onCheckinClick,
  onOverwhelmedClick,
}: SanctuaryFabProps) {
  const { isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerCheckin = onCheckinClick || onOpenCheckin || (() => {});

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fabItems = [
    {
      label: "Conversation",
      icon: MessageSquare,
      href: "/chat",
      color: isLight
        ? "bg-violet-100 border-violet-200 text-violet-800 hover:bg-violet-200"
        : "bg-violet-950/80 border-violet-800/60 text-violet-300 hover:bg-violet-900",
    },
    {
      label: "3D Studio",
      icon: Wind,
      href: "/studio",
      color: isLight
        ? "bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200"
        : "bg-emerald-950/80 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900",
    },
    {
      label: "Private Space",
      icon: Feather,
      href: "/journal",
      color: isLight
        ? "bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200"
        : "bg-amber-950/80 border-amber-800/60 text-amber-300 hover:bg-amber-900",
    },
    {
      label: "Mood Pause",
      icon: Heart,
      onClick: () => {
        setIsOpen(false);
        triggerCheckin();
      },
      color: isLight
        ? "bg-rose-100 border-rose-200 text-rose-800 hover:bg-rose-200"
        : "bg-rose-950/80 border-rose-800/60 text-rose-300 hover:bg-rose-900",
    },
  ];

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40 select-none">
      {/* Dimmed backdrop when FAB is expanded */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-30 animate-in fade-in duration-200 pointer-events-auto"
        />
      )}

      {/* Radial / Staggered Action Items */}
      <div className="relative z-40 flex flex-col items-end gap-2.5 mb-3">
        {isOpen &&
          fabItems.map((item, idx) => {
            const Icon = item.icon;
            const content = (
              <div
                className={`flex items-center gap-2.5 p-2 rounded-2xl border shadow-lg backdrop-blur-xl transition-all duration-200 hover:scale-105 cursor-pointer ${item.color}`}
              >
                <span className="text-xs font-serif font-medium px-1">
                  {item.label}
                </span>
                <div className="h-7 w-7 rounded-xl flex items-center justify-center">
                  <Icon size={15} />
                </div>
              </div>
            );

            return (
              <div
                key={item.label}
                className="animate-in fade-in slide-in-from-bottom-3 duration-200"
                style={{ transitionDelay: `${idx * 40}ms` }}
              >
                {item.href ? (
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={item.onClick}>
                    {content}
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close Sanctuary Actions" : "Open Sanctuary Actions"}
        className={`relative z-40 flex h-13 w-13 items-center justify-center rounded-full border shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
          isOpen
            ? isLight
              ? "bg-stone-900 text-white border-stone-800 rotate-90"
              : "bg-white text-stone-900 border-stone-200 rotate-90"
            : isLight
            ? "bg-[#fdfbf7] border-stone-300 text-stone-800 hover:border-stone-400 shadow-stone-400/20"
            : "bg-[#1f2129] border-[#363848] text-violet-200 hover:border-violet-500/50 shadow-black/60"
        }`}
      >
        {isOpen ? <X size={20} /> : <Plus size={20} />}
      </button>
    </div>
  );
}
