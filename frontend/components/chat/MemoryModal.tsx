"use client";

import { useState } from "react";
import {
  X,
  Brain,
  Heart,
  Shield,
  Trash2,
  RefreshCw,
  Compass,
  Award,
  Target,
  Activity,
  CheckCircle2,
  Smile,
  Volume2,
  BookOpen,
  Feather,
  Sparkles,
} from "lucide-react";
import { MemorySummary } from "@/types/chat";
import { useTheme } from "@/context/ThemeContext";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemorySummary | null;
  onClearMemory: () => Promise<void>;
  userName?: string | null;
  isGuest?: boolean;
}

const COMPANION_LEVEL_TITLES: Record<number, string> = {
  1: "Mindful Beginner",
  2: "Empathetic Listener",
  3: "Supportive Guide",
  4: "Emotional Anchor",
  5: "Mindful Companion",
  6: "Resilience Ally",
  7: "Insightful Confidant",
  8: "Inner-Strength Mentor",
  9: "Holistic Sanctuary",
  10: "Transcendent Companion",
};

export default function MemoryModal({
  isOpen,
  onClose,
  memory,
  onClearMemory,
  userName,
}: MemoryModalProps) {
  const { isLight } = useTheme();
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "goals" | "psychology" | "context">("overview");

  if (!isOpen) return null;

  const handleClear = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset Athena's memory of your journey? This will clear learned goals, milestones, and coping anchors."
      )
    ) {
      setClearing(true);
      await onClearMemory();
      setClearing(false);
    }
  };

  const displayName = memory?.user_name || userName || "Friend";
  const companionLevel = Math.min(Math.max(memory?.companion_level || 1, 1), 10);
  const levelTitle = COMPANION_LEVEL_TITLES[companionLevel] || "Personal Companion";
  const progressPercent = Math.min((companionLevel / 10) * 100, 100);

  const tabs = [
    { id: "overview", label: "Companion Growth", icon: Feather },
    { id: "timeline", label: "Memory Timeline", icon: Sparkles },
    { id: "goals", label: "Goals & Practices", icon: Target },
    { id: "psychology", label: "Coping & Solace", icon: Heart },
    { id: "context", label: "Context & Story", icon: BookOpen },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl border shadow-2xl flex flex-col transition-colors duration-200 ${
          isLight
            ? "bg-[#fdfbf7] border-[#e7e5e4] text-stone-800"
            : "bg-[#1c1d22] border-[#2a2b33] text-zinc-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between ${
            isLight
              ? "border-[#e7e5e4] bg-[#f8f6f0]"
              : "border-[#24252c] bg-[#16171b]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                isLight
                  ? "bg-stone-100 border-stone-200 text-stone-700"
                  : "bg-violet-950/70 border-violet-800/40 text-violet-300"
              }`}
            >
              <Brain size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-base sm:text-lg font-semibold font-serif ${
                    isLight ? "text-stone-900" : "text-white"
                  }`}
                >
                  Athena&apos;s Living Memory
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                    isLight
                      ? "bg-stone-200/80 border-stone-300 text-stone-800"
                      : "bg-[#23242c] border-violet-800/30 text-violet-300"
                  }`}
                >
                  Level {companionLevel}
                </span>
              </div>
              <p
                className={`text-xs font-serif ${
                  isLight ? "text-stone-500" : "text-zinc-400"
                }`}
              >
                Personal mental wellness profile &amp; therapeutic continuity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-xl p-2 transition cursor-pointer ${
              isLight
                ? "text-stone-400 hover:bg-stone-200 hover:text-stone-900"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            aria-label="Close memory modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div
          className={`flex items-center gap-1 px-5 sm:px-6 pt-2 border-b overflow-x-auto no-scrollbar ${
            isLight
              ? "border-[#e7e5e4] bg-[#fdfbf7]"
              : "border-[#24252c] bg-[#1c1d22]"
          }`}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-t-xl transition whitespace-nowrap border-b-2 cursor-pointer ${
                  isActive
                    ? isLight
                      ? "border-stone-800 text-stone-900 bg-stone-100 font-semibold"
                      : "border-violet-400 text-violet-300 bg-violet-950/30 font-semibold"
                    : isLight
                    ? "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: OVERVIEW & GROWTH */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Companion Level Card */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                  isLight
                    ? "bg-[#f8f6f0] border-[#e7e5e4]"
                    : "bg-[#16171b] border-[#2a2b33]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award
                      className={isLight ? "text-stone-700" : "text-violet-400"}
                      size={18}
                    />
                    <div>
                      <h4
                        className={`text-sm font-semibold font-serif ${
                          isLight ? "text-stone-900" : "text-white"
                        }`}
                      >
                        Companion Level {companionLevel}: {levelTitle}
                      </h4>
                      <p
                        className={`text-[11px] font-serif ${
                          isLight ? "text-stone-500" : "text-zinc-400"
                        }`}
                      >
                        Speaking with {displayName} • {memory?.total_exchanges || 0} reflections
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-medium ${
                      isLight ? "text-stone-600" : "text-violet-300"
                    }`}
                  >
                    {progressPercent.toFixed(0)}% Harmony
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full rounded-full h-2 overflow-hidden ${
                    isLight ? "bg-stone-200" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isLight ? "bg-stone-700" : "bg-violet-400"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p
                  className={`text-xs font-serif italic leading-relaxed pt-0.5 ${
                    isLight ? "text-stone-600" : "text-zinc-300"
                  }`}
                >
                  As you share emotions and reflections, Athena deepens her attuned memory to support your therapeutic growth.
                </p>
              </div>

              {/* Key Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  className={`rounded-2xl border p-3 text-center ${
                    isLight
                      ? "bg-[#f8f6f0] border-[#e7e5e4]"
                      : "bg-[#16171b] border-[#2a2b33]"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-semibold ${
                      isLight ? "text-stone-500" : "text-zinc-400"
                    }`}
                  >
                    Exchanges
                  </span>
                  <p
                    className={`text-base sm:text-lg font-bold mt-0.5 ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {memory?.total_exchanges || 0}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-3 text-center ${
                    isLight
                      ? "bg-[#f8f6f0] border-[#e7e5e4]"
                      : "bg-[#16171b] border-[#2a2b33]"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-semibold ${
                      isLight ? "text-stone-500" : "text-violet-300"
                    }`}
                  >
                    Insights
                  </span>
                  <p
                    className={`text-base sm:text-lg font-bold mt-0.5 ${
                      isLight ? "text-stone-900" : "text-violet-200"
                    }`}
                  >
                    {memory?.total_insights || 0}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-3 text-center ${
                    isLight
                      ? "bg-[#f8f6f0] border-[#e7e5e4]"
                      : "bg-[#16171b] border-[#2a2b33]"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-semibold ${
                      isLight ? "text-stone-500" : "text-emerald-400"
                    }`}
                  >
                    Goals
                  </span>
                  <p
                    className={`text-base sm:text-lg font-bold mt-0.5 ${
                      isLight ? "text-stone-900" : "text-emerald-200"
                    }`}
                  >
                    {memory?.wellness_goals?.length || 0}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-3 text-center ${
                    isLight
                      ? "bg-[#f8f6f0] border-[#e7e5e4]"
                      : "bg-[#16171b] border-[#2a2b33]"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-semibold ${
                      isLight ? "text-stone-500" : "text-teal-400"
                    }`}
                  >
                    Practices
                  </span>
                  <p
                    className={`text-base sm:text-lg font-bold mt-0.5 ${
                      isLight ? "text-stone-900" : "text-teal-200"
                    }`}
                  >
                    {memory?.guided_exercises?.length || 0}
                  </p>
                </div>
              </div>

              {/* Emotional Flow History */}
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-violet-300"
                  }`}
                >
                  <Activity size={13} />
                  <span>Recent Emotional Flow</span>
                </h3>
                {memory?.recent_emotions && memory.recent_emotions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {memory.recent_emotions.map((emotion, idx) => (
                      <span
                        key={idx}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs capitalize ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLight ? "bg-stone-500" : "bg-violet-400"
                          }`}
                        />
                        {emotion}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    No emotional trajectory recorded yet. Check-ins will gently chart your flow here.
                  </p>
                )}
              </div>

              {/* Voice Setting */}
              <div
                className={`rounded-2xl border p-3.5 flex items-center justify-between ${
                  isLight
                    ? "bg-[#f8f6f0] border-[#e7e5e4]"
                    : "bg-[#16171b] border-[#2a2b33]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Volume2
                    className={isLight ? "text-stone-600" : "text-violet-400"}
                    size={16}
                  />
                  <div>
                    <h5
                      className={`text-xs font-medium ${
                        isLight ? "text-stone-900" : "text-white"
                      }`}
                    >
                      Athena Voice Persona
                    </h5>
                    <p
                      className={`text-[11px] font-serif ${
                        isLight ? "text-stone-500" : "text-zinc-400"
                      }`}
                    >
                      Empathetic neural cadence • Spoken responses available
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] rounded-full border px-2.5 py-1 ${
                    isLight
                      ? "bg-stone-200 border-stone-300 text-stone-800"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                >
                  Active
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: MEMORY TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-stone-700" : "text-[#BFAEFF]"
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>Memory Timeline &amp; Milestones</span>
                  </h3>
                  <span className="text-[11px] font-sans text-[#B8BDD6]/80 italic">
                    Meaningful chronological breakthroughs
                  </span>
                </div>

                <div className="relative pl-7 pt-3 space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-[2px] before:bg-[#7C5CFF]/30">
                  <div className="relative flex flex-col gap-1">
                    <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-[#7C5CFF] shadow-[0_0_10px_#7C5CFF]" />
                    <span className="text-xs font-semibold text-[#F8F7FF]">First Work Stress Discussion</span>
                    <span className="text-[11px] text-[#B8BDD6]">Noticed pressure around expectations and identified physical tension.</span>
                  </div>

                  <div className="relative flex flex-col gap-1">
                    <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-[#4ADE80] shadow-[0_0_10px_#4ADE80]" />
                    <span className="text-xs font-semibold text-[#F8F7FF]">First Breathing Success</span>
                    <span className="text-[11px] text-[#B8BDD6]">Re-anchored parasympathetic calm using coherent gentle rhythm.</span>
                  </div>

                  <div className="relative flex flex-col gap-1">
                    <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]" />
                    <span className="text-xs font-semibold text-[#F8F7FF]">First Positive Breakthrough</span>
                    <span className="text-[11px] text-[#B8BDD6]">Recognized inner resilience and set gentle emotional boundaries.</span>
                  </div>

                  <div className="relative flex flex-col gap-1">
                    <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-[#FB7185] shadow-[0_0_10px_#FB7185]" />
                    <span className="text-xs font-semibold text-[#F8F7FF]">Journal Milestone</span>
                    <span className="text-[11px] text-[#B8BDD6]">Established unhurried habit of releasing thoughts into quiet Space.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOALS & PRACTICES */}
          {activeTab === "goals" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-emerald-400"
                  }`}
                >
                  <Target size={13} />
                  <span>Active Wellness Intentions</span>
                </h3>
                {memory?.wellness_goals && memory.wellness_goals.length > 0 ? (
                  <div className="space-y-2">
                    {memory.wellness_goals.map((goal, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 text-xs flex items-start gap-2.5 ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    No intentions established yet. As you discuss goals like restful sleep or boundaries, Athena will hold space for them here.
                  </p>
                )}
              </div>

              {/* Guided Practices */}
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-teal-400"
                  }`}
                >
                  <Activity size={13} />
                  <span>Guided Practices Explored</span>
                </h3>
                {memory?.guided_exercises && memory.guided_exercises.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {memory.guided_exercises.map((exercise, idx) => (
                      <span
                        key={idx}
                        className={`rounded-xl border px-3 py-1.5 text-xs capitalize flex items-center gap-1.5 ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        🌱 {exercise}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    No practices recorded yet. Ask Athena for a breathing exercise or sensory grounding anytime.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COPING & SOLACE */}
          {activeTab === "psychology" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-emerald-400"
                  }`}
                >
                  <Heart size={13} />
                  <span>What Grounds You</span>
                </h3>
                {memory?.coping_preferences && memory.coping_preferences.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {memory.coping_preferences.map((item, idx) => (
                      <span
                        key={idx}
                        className={`rounded-xl border px-3 py-1.5 text-xs capitalize ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        🌿 {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    Athena hasn&apos;t catalogued specific coping anchors yet. Share what brings you solace (walks, journaling, music) so Athena remembers.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-amber-400"
                  }`}
                >
                  <Compass size={13} />
                  <span>Themes &amp; Pressures Explored</span>
                </h3>
                {memory?.core_stressors && memory.core_stressors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {memory.core_stressors.map((item, idx) => (
                      <span
                        key={idx}
                        className={`rounded-xl border px-3 py-1.5 text-xs capitalize ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        📌 {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    No recurring stressors catalogued yet. Athena holds space for challenges whenever you wish to speak about them.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONTEXT & PERSONAL STORY */}
          {activeTab === "context" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Recurring Worries */}
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-amber-400"
                  }`}
                >
                  <Compass size={13} />
                  <span>Recurring Worries &amp; Themes</span>
                </h3>
                {memory?.recurring_worries && memory.recurring_worries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {memory.recurring_worries.map((worry, idx) => (
                      <span
                        key={idx}
                        className={`rounded-xl border px-3 py-1.5 text-xs ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        ⚡ {worry}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    No recurring worries catalogued yet. Athena holds space when you are ready to discuss them.
                  </p>
                )}
              </div>

              {/* Repeated People */}
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-violet-400"
                  }`}
                >
                  <Heart size={13} />
                  <span>Significant People in Your Life</span>
                </h3>
                {memory?.repeated_people && memory.repeated_people.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {memory.repeated_people.map((person, idx) => (
                      <span
                        key={idx}
                        className={`rounded-xl border px-3 py-1.5 text-xs ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        👤 {person}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    People you speak of will be remembered with compassionate continuity here.
                  </p>
                )}
              </div>

              {/* Emotional Improvements & Breakthroughs */}
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-emerald-400"
                  }`}
                >
                  <Award size={13} />
                  <span>Observed Emotional Breakthroughs</span>
                </h3>
                {memory?.emotional_improvements && memory.emotional_improvements.length > 0 ? (
                  <div className="space-y-2">
                    {memory.emotional_improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 text-xs leading-relaxed flex items-start gap-2.5 ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        <span className="text-emerald-400">✨</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    Moments of grounding and emotional relief will be reflected here.
                  </p>
                )}
              </div>

              {/* Meaningful Life Context */}
              <div className="space-y-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-stone-600" : "text-indigo-400"
                  }`}
                >
                  <Shield size={13} />
                  <span>Meaningful Life Context</span>
                </h3>
                {memory?.key_memories && memory.key_memories.length > 0 ? (
                  <div className="space-y-2">
                    {memory.key_memories.map((fact, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 text-xs leading-relaxed flex items-start gap-2.5 ${
                          isLight
                            ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-800"
                            : "bg-[#16171b] border-[#2a2b33] text-zinc-200"
                        }`}
                      >
                        <span className="font-bold">•</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-xs italic rounded-xl p-3 border font-serif ${
                      isLight
                        ? "bg-[#f8f6f0] border-[#e7e5e4] text-stone-500"
                        : "bg-[#16171b] border-[#2a2b33] text-zinc-400"
                    }`}
                  >
                    Athena is listening attentively. Important life details and milestones will gently be held here.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between text-xs ${
            isLight
              ? "border-[#e7e5e4] bg-[#f8f6f0] text-stone-500"
              : "border-[#24252c] bg-[#16171b] text-zinc-400"
          }`}
        >
          <p className="text-[11px] flex items-center gap-1.5 font-serif">
            <Shield size={12} className="text-emerald-500" />
            <span>Therapeutic confidentiality • Encrypted &amp; private</span>
          </p>

          <button
            onClick={handleClear}
            disabled={clearing}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
              isLight
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-red-900/40 bg-red-950/20 text-red-300 hover:bg-red-900/40"
            }`}
          >
            {clearing ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            <span>Reset Memory</span>
          </button>
        </div>
      </div>
    </div>
  );
}
