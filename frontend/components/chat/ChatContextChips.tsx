"use client";

import React, { useState } from "react";
import { X, Sparkles, Heart, BookOpen, Moon, Compass, Wind } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TodayCheckInData } from "@/context/CheckInContext";

interface ChatContextChipsProps {
  todayCheckIn?: TodayCheckInData | null;
  hasRecentJournal?: boolean;
  userGoals?: string[];
  onRemoveChip?: (chipId: string) => void;
}

interface ContextChipItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function ChatContextChips({
  todayCheckIn,
  hasRecentJournal = true,
  userGoals,
  onRemoveChip,
}: ChatContextChipsProps) {
  const { isLight } = useTheme();

  // Initialize active chips based on available context
  const [removedChipIds, setRemovedChipIds] = useState<Set<string>>(new Set());

  const availableChips: ContextChipItem[] = [];

  if (todayCheckIn && todayCheckIn.completed) {
    availableChips.push({
      id: "today_mood",
      label: `Today's Mood: ${todayCheckIn.mood}`,
      icon: <Heart size={11} className="text-amber-500 fill-amber-500/20" />,
    });
  }

  if (hasRecentJournal) {
    availableChips.push({
      id: "recent_journal",
      label: "Recent Journal",
      icon: <BookOpen size={11} className="text-violet-400" />,
    });
  }

  if (userGoals && userGoals.length > 0) {
    userGoals.forEach((goal, idx) => {
      availableChips.push({
        id: `goal_${idx}`,
        label: goal,
        icon: <Compass size={11} className="text-teal-400" />,
      });
    });
  } else {
    // Default contextual goals if none set
    availableChips.push(
      {
        id: "work_stress",
        label: "Work Stress",
        icon: <Wind size={11} className="text-teal-400" />,
      },
      {
        id: "better_sleep",
        label: "Better Sleep",
        icon: <Moon size={11} className="text-indigo-400" />,
      }
    );
  }

  const activeChips = availableChips.filter((c) => !removedChipIds.has(c.id));

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovedChipIds((prev) => new Set([...prev, id]));
    if (onRemoveChip) onRemoveChip(id);
  };

  if (activeChips.length === 0) return null;

  return (
    <div
      aria-label="Athena active conversation context"
      className="flex items-center gap-1.5 flex-wrap py-1.5 px-1 animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-1 text-[11px] font-serif opacity-60 pr-1 select-none">
        <Sparkles size={11} className="text-amber-500" />
        <span className="hidden sm:inline">Athena is considering:</span>
        <span className="sm:hidden">Context:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {activeChips.map((chip) => (
          <div
            key={chip.id}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-serif border transition-all duration-150 animate-in fade-in zoom-in-95 ${
              isLight
                ? "bg-white/90 hover:bg-stone-50 border-stone-200/90 text-stone-700 shadow-2xs"
                : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 shadow-2xs"
            }`}
            title="Athena is taking this into account. Click × to remove."
          >
            <span className="shrink-0">{chip.icon}</span>
            <span className="text-[11px] font-medium leading-none">{chip.label}</span>
            <button
              type="button"
              onClick={(e) => handleDismiss(chip.id, e)}
              className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                isLight
                  ? "hover:bg-stone-200 text-stone-400 hover:text-stone-700"
                  : "hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200"
              }`}
              aria-label={`Remove ${chip.label} from context`}
              title="Remove from context"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
