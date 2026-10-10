"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, MessageSquare, BookOpen, Clock, Heart, Check, BatteryMedium } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { TodayCheckInData } from "@/context/CheckInContext";

interface TodayEmotionalSnapshotProps {
  checkIn: TodayCheckInData;
}

export default function TodayEmotionalSnapshot({ checkIn }: TodayEmotionalSnapshotProps) {
  const router = useRouter();
  const { isLight } = useTheme();
  const [savedToSpace, setSavedToSpace] = useState(false);

  const getEnergyLabel = (val: number) => {
    const labels: Record<number, string> = {
      1: "Gentle / Rest Needed",
      2: "Low / Deliberate",
      3: "Steady / Centered",
      4: "Good / Capable",
      5: "Abundant / Vibrant",
    };
    return labels[val] || `${val}/5`;
  };

  const getMoodEmoji = (mood: string) => {
    const m = mood.toLowerCase();
    if (m.includes("peace")) return "🌿";
    if (m.includes("joy") || m.includes("great")) return "✨";
    if (m.includes("ground")) return "🏔️";
    if (m.includes("tender")) return "🌸";
    if (m.includes("stir")) return "🌊";
    if (m.includes("low")) return "🌧️";
    if (m.includes("difficult")) return "🌪️";
    return "🍃";
  };

  const handleSaveToSpace = () => {
    try {
      const draftContent = `Today's Emotional Check-in (${checkIn.mood} mood, ${getEnergyLabel(checkIn.energy)} energy):\n\n"${checkIn.reflection || ''}"${checkIn.notes ? `\n\nPersonal note: ${checkIn.notes}` : ''}`;
      localStorage.setItem("athena_journal_pending_draft", draftContent);
      setSavedToSpace(true);
      setTimeout(() => {
        router.push("/journal");
      }, 300);
    } catch {
      router.push("/journal");
    }
  };

  const handleContinueConversation = () => {
    router.push("/chat");
  };

  // Part 9 Therapist Language System
  const fallbackTherapistReflection = useMemo(() => {
    const m = (checkIn.mood || "").toLowerCase();
    const energy = checkIn.energy || 3;

    if (energy <= 2) {
      return "Since your energy feels lower, let's keep today gentle.";
    }
    if (m.includes("great") || m.includes("joy")) {
      return "I'm glad today has offered a little breathing room.";
    }
    if (m.includes("good") || m.includes("peace")) {
      return "Let's protect this steady feeling.";
    }
    if (m.includes("okay") || m.includes("ground")) {
      return "We don't have to force today to be better.";
    }
    if (m.includes("low") || m.includes("tender")) {
      return "I'm here. Let's keep today small.";
    }
    if (m.includes("difficult") || m.includes("stir")) {
      return "Thank you for staying with me. We can take this one step at a time.";
    }
    return "I'm here with you today.";
  }, [checkIn.mood, checkIn.energy]);

  const activeReflection = checkIn.reflection || fallbackTherapistReflection;

  return (
    <section
      aria-label="Today's Emotional Snapshot"
      className={`relative overflow-hidden rounded-[20px] border p-6 sm:p-7 transition-all duration-[280ms] shadow-sm animate-in fade-in duration-[280ms] ${
        isLight
          ? "bg-gradient-to-br from-white/95 via-[#fcfaf7]/90 to-[#f6f2ea]/95 border-[#e8e4dc]"
          : "bg-gradient-to-br from-[#1c1d25]/95 via-[#181922]/90 to-[#13141a]/95 border-[#282a36]"
      }`}
    >
      {/* Background Soft Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.1) 70%, transparent 100%)"
            : "radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, rgba(139, 92, 246, 0.08) 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 space-y-5">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-[14px] border ${
                isLight
                  ? "bg-emerald-50 border-emerald-200/80 text-emerald-700"
                  : "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
              }`}
            >
              <Check size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold font-serif tracking-tight">
                  Thank you for checking in.
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Recorded
                </span>
              </div>
              <p className={`text-xs font-serif ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
                I&apos;m here with you today.
              </p>
            </div>
          </div>

          {/* Time Checked In Badge */}
          <div
            className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 text-xs border ${
              isLight
                ? "bg-stone-100/80 border-stone-200 text-stone-600"
                : "bg-zinc-800/60 border-zinc-700/60 text-zinc-300"
            }`}
          >
            <Clock size={13} className="opacity-70" />
            <span>Checked in {checkIn.timestamp || "Today"}</span>
          </div>
        </div>

        {/* Snapshot Metrics Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mood Pill */}
          <div
            className={`flex items-center gap-3 rounded-[20px] border p-3.5 transition-colors ${
              isLight
                ? "bg-white/90 border-[#e8e4dc]"
                : "bg-zinc-900/60 border-[#2b2d39]"
            }`}
          >
            <div className="text-2xl shrink-0">{getMoodEmoji(checkIn.mood)}</div>
            <div className="min-w-0">
              <span className={`block text-[11px] font-medium uppercase tracking-wider ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
                Current Mood
              </span>
              <span className="font-serif font-semibold text-sm sm:text-base capitalize">
                {checkIn.mood}
              </span>
            </div>
          </div>

          {/* Energy Pill */}
          <div
            className={`flex items-center gap-3 rounded-[20px] border p-3.5 transition-colors ${
              isLight
                ? "bg-white/90 border-[#e8e4dc]"
                : "bg-zinc-900/60 border-[#2b2d39]"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                isLight ? "bg-amber-50 text-amber-600" : "bg-amber-950/40 text-amber-400"
              }`}
            >
              <BatteryMedium size={20} />
            </div>
            <div className="min-w-0">
              <span className={`block text-[11px] font-medium uppercase tracking-wider ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
                Energy Level
              </span>
              <span className="font-serif font-semibold text-sm sm:text-base">
                {getEnergyLabel(checkIn.energy)}
              </span>
            </div>
          </div>
        </div>

        {/* Soft Elevated Card: Athena Reflection */}
        <div
          className={`relative rounded-[20px] border p-5 sm:p-6 transition-all shadow-xs ${
            isLight
              ? "bg-[#ffffff] border-[#e2ddd3] text-stone-800"
              : "bg-[#161720] border-[#292b37] text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-violet-400">
            <Heart size={14} className="fill-current opacity-70" />
            <span className="font-serif">Athena</span>
          </div>

          <p className="text-sm sm:text-base font-serif italic leading-relaxed">
            &ldquo;{activeReflection}&rdquo;
          </p>

          {checkIn.notes && (
            <p className={`mt-3 text-xs border-t pt-2.5 font-sans ${isLight ? "border-stone-200 text-stone-600" : "border-zinc-800 text-zinc-400"}`}>
              <span className="font-medium">Your note: </span>
              <span>{checkIn.notes}</span>
            </p>
          )}
        </div>

        {/* Part 10 Buttons: Primary soft violet glow, Secondary transparent with border */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSaveToSpace}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-[20px] py-3.5 px-5 text-xs sm:text-sm font-serif font-medium border transition-all duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer ${
              savedToSpace
                ? "bg-emerald-600 text-white border-emerald-600"
                : isLight
                ? "bg-transparent hover:bg-stone-100 text-stone-800 border-stone-300"
                : "bg-transparent hover:bg-white/5 text-zinc-200 border-zinc-700"
            }`}
          >
            {savedToSpace ? (
              <>
                <Check size={16} />
                <span>Saved to Space</span>
              </>
            ) : (
              <>
                <BookOpen size={16} className="text-amber-500" />
                <span>Save to Space</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleContinueConversation}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-[20px] py-3.5 px-5 text-xs sm:text-sm font-serif font-medium transition-all duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer ${
              isLight
                ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md"
                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]"
            }`}
          >
            <MessageSquare size={16} />
            <span>Continue Conversation</span>
          </button>
        </div>
      </div>
    </section>
  );
}
