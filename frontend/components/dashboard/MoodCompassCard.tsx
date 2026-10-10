"use client";

import React, { useState, useMemo } from "react";
import { Compass, Sparkles, Check, Heart, Feather } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CheckinResponse } from "@/types/checkin";

interface MoodCompassCardProps {
  todayCheckin?: CheckinResponse | null;
  onOpenCheckinModal?: () => void;
  onSelectMood?: (mood: string) => void;
}

interface EmotionItem {
  id: string;
  label: string;
  description: string;
  angle: number; // in degrees for circular layout
  color: string;
  glow: string;
}

const FIVE_EMOTIONS: EmotionItem[] = [
  { id: "peaceful", label: "Peaceful", description: "At ease, tranquil", angle: 270, color: "text-emerald-500", glow: "rgba(16, 185, 129, 0.4)" }, // Top
  { id: "joyful", label: "Joyful", description: "Lighter, open", angle: 342, color: "text-amber-500", glow: "rgba(245, 158, 11, 0.4)" }, // Top-Right
  { id: "grounded", label: "Grounded", description: "Centered, steady", angle: 54, color: "text-teal-500", glow: "rgba(20, 184, 166, 0.4)" }, // Bottom-Right
  { id: "tender", label: "Tender", description: "Soft, needing care", angle: 126, color: "text-rose-400", glow: "rgba(244, 114, 182, 0.4)" }, // Bottom-Left
  { id: "stirred", label: "Stirred", description: "Carrying tension", angle: 198, color: "text-violet-400", glow: "rgba(167, 139, 250, 0.4)" }, // Top-Left
];

export default React.memo(function MoodCompassCard({
  todayCheckin,
  onOpenCheckinModal,
  onSelectMood,
}: MoodCompassCardProps) {
  const { isLight } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(
    todayCheckin?.mood ? todayCheckin.mood.toLowerCase() : null
  );
  const [isRippling, setIsRippling] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);

  // Sync if todayCheckin changes
  React.useEffect(() => {
    if (todayCheckin?.mood) {
      setSelectedId(todayCheckin.mood.toLowerCase());
    }
  }, [todayCheckin]);

  const handleSelect = (emotion: EmotionItem) => {
    setSelectedId(emotion.id);
    setIsRippling(true);
    setShowAffirmation(true);

    if (onSelectMood) {
      onSelectMood(emotion.id);
    }

    setTimeout(() => {
      setIsRippling(false);
    }, 600);
  };

  const selectedEmotion = useMemo(
    () => FIVE_EMOTIONS.find((e) => e.id === selectedId),
    [selectedId]
  );

  return (
    <div
      role="region"
      aria-label="Mood Compass"
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 transition-all duration-300 ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fdfcf9]/90 to-[#faf6f0]/95 border-stone-200/90 shadow-sm"
          : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#14151a]/95 border-[#2b2d38] shadow-md"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs shadow-xs ${
              isLight
                ? "bg-amber-50 border-amber-200/80 text-amber-700"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <Compass size={14} className="text-amber-500 animate-compass-slow" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-semibold tracking-tight">Mood Compass</h3>
            <p className="text-[11px] opacity-60">Arrive and align with present feeling</p>
          </div>
        </div>

        {onOpenCheckinModal && (
          <button
            type="button"
            onClick={onOpenCheckinModal}
            className={`px-3 py-1 rounded-full text-xs font-serif transition-colors duration-180 cursor-pointer border ${
              isLight
                ? "border-stone-200 hover:bg-stone-100 text-stone-700"
                : "border-zinc-800 hover:bg-zinc-800/60 text-zinc-300"
            }`}
          >
            {todayCheckin ? "Deepen Reflection" : "Full Check-in"}
          </button>
        )}
      </div>

      {/* Compass Interactive Area */}
      <div className="relative py-6 sm:py-8 flex flex-col items-center justify-center">
        {/* Circular Ring Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Subtle Outer Ring with Breathing Animation */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 rounded-full border border-dashed animate-ring-breathe transition-colors pointer-events-none ${
              isLight ? "border-stone-300/80" : "border-zinc-700/60"
            }`}
          />

          {/* Secondary Concentric Guide Ring */}
          <div
            aria-hidden="true"
            className={`absolute inset-8 rounded-full border border-dotted opacity-40 pointer-events-none ${
              isLight ? "border-amber-300" : "border-violet-500"
            }`}
          />

          {/* Ripple animation layer on select */}
          {isRippling && (
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-full border-2 border-amber-400/60 animate-ripple-soft pointer-events-none"
            />
          )}

          {/* Center Stage: Current Emotional State */}
          <div
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-center p-3 transition-all duration-300 shadow-md ${
              isLight
                ? "bg-gradient-to-br from-white to-[#fbf9f4] border border-stone-200 text-stone-900"
                : "bg-gradient-to-br from-[#21232d] to-[#181920] border border-[#323544] text-white"
            }`}
            style={{
              boxShadow: selectedEmotion
                ? `0 0 24px ${selectedEmotion.glow}`
                : undefined,
            }}
          >
            {selectedEmotion ? (
              <>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-serif">State</span>
                <span className="text-base sm:text-lg font-serif font-semibold mt-0.5 capitalize">
                  {selectedEmotion.label}
                </span>
                <span className="text-[10px] opacity-70 mt-0.5 line-clamp-1">
                  {selectedEmotion.description}
                </span>
              </>
            ) : (
              <>
                <Feather size={16} className="text-amber-500 mb-1 opacity-80" />
                <span className="text-xs font-serif font-medium leading-tight">
                  How are you feeling?
                </span>
                <span className="text-[10px] opacity-60 mt-0.5">Tap an emotion</span>
              </>
            )}
          </div>

          {/* Five Emotion Buttons around the Ring */}
          {FIVE_EMOTIONS.map((emotion) => {
            const isSelected = selectedId === emotion.id;
            // Radius in percentage: 50% center + ~40% offset
            const radius = 108; // pixels in radius
            const radians = (emotion.angle * Math.PI) / 180;
            const x = Math.round(radius * Math.cos(radians));
            const y = Math.round(radius * Math.sin(radians));

            return (
              <button
                key={emotion.id}
                type="button"
                onClick={() => handleSelect(emotion)}
                aria-label={`Select emotional state: ${emotion.label}`}
                aria-pressed={isSelected}
                className={`absolute z-20 flex flex-col items-center justify-center px-3 py-1.5 rounded-full text-xs font-serif font-medium transition-all duration-180 active:scale-95 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isSelected
                    ? isLight
                      ? "scale-110 bg-stone-900 text-white shadow-lg border border-stone-800"
                      : "scale-110 bg-violet-600 text-white shadow-lg shadow-violet-950/60 border border-violet-400/50"
                    : isLight
                    ? "bg-white/95 text-stone-700 hover:text-stone-950 hover:bg-stone-50 border border-stone-200/90 shadow-xs hover:scale-105"
                    : "bg-[#1f2029]/95 text-zinc-300 hover:text-white hover:bg-[#282a36] border border-[#2d303f] shadow-xs hover:scale-105"
                }`}
                style={{
                  transform: `translate(${x}px, ${y}px) ${isSelected ? "scale(1.12)" : ""}`,
                  boxShadow: isSelected ? `0 0 16px ${emotion.glow}` : undefined,
                }}
              >
                <span>{emotion.label}</span>
              </button>
            );
          })}
        </div>

        {/* Affirmation Area */}
        <div className="mt-4 h-7 flex items-center justify-center">
          {showAffirmation || todayCheckin ? (
            <div className="flex items-center gap-1.5 text-xs font-serif text-emerald-600 dark:text-emerald-400 animate-replay-fade">
              <Check size={13} className="shrink-0" />
              <span>Thank you for checking in. I&apos;ll keep today&apos;s rhythm gentle.</span>
            </div>
          ) : (
            <p className="text-xs font-serif opacity-60">
              Center your emotional rhythm with one honest touch.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
