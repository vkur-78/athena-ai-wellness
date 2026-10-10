"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Feather, Check, Loader2, Sun, Moon, AlertCircle, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface JournalEditorProps {
  initialContent?: string;
  userId: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export default function JournalEditor({
  initialContent = "",
  userId,
  onSave,
  onCancel,
  isSaving = false,
  onToggleTheme,
}: JournalEditorProps) {
  const { isLight, toggleTheme } = useTheme();
  const draftStorageKey = `athena_journal_draft_${userId}`;
  const [content, setContent] = useState<string>(initialContent);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [content]);

  // Restore draft if editing new entry and local draft exists
  useEffect(() => {
    if (!initialContent && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(draftStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.content && parsed.content.trim()) {
            setContent(parsed.content);
            setDraftStatus("Restored from your private draft");
          }
        }
      } catch (e) {
        console.warn("Could not restore draft:", e);
      }
    }
  }, [initialContent, draftStorageKey]);

  // Dynamic Auto-growing textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, 320)}px`;
    }
  }, [content]);

  // Auto-save draft locally on keystroke
  const handleContentChange = (val: string) => {
    setContent(val);
    setErrorMessage(null);

    if (!initialContent && typeof window !== "undefined") {
      try {
        if (val.trim()) {
          localStorage.setItem(
            draftStorageKey,
            JSON.stringify({ content: val, lastModified: new Date().toISOString() })
          );
          setDraftStatus("Words resting safely in draft");
        } else {
          localStorage.removeItem(draftStorageKey);
          setDraftStatus(null);
        }
      } catch (e) {
        console.warn("Draft auto-save error:", e);
      }
    }
  };

  const handleSaveMoment = async () => {
    if (!content.trim() || isSaving) return;
    setErrorMessage(null);

    try {
      // Append mood tag gently if selected
      const finalContent = selectedMood
        ? `${content.trim()}\n\n[Presence: ${selectedMood}]`
        : content.trim();

      await onSave(finalContent);
      if (!initialContent && typeof window !== "undefined") {
        try {
          localStorage.removeItem(draftStorageKey);
        } catch {}
      }
    } catch (err: any) {
      console.error("[Save Moment Error]:", err);
      setErrorMessage(
        "We could not reach the server right now, but your words remain safely preserved in your local draft."
      );
    }
  };

  // Phase 8.0: Mood appears AFTER writing (not before!)
  const hasWrittenEnough = content.trim().length >= 15;

  const moodChoices = [
    { label: "Peaceful", color: "border-emerald-400/40 text-emerald-700 dark:text-emerald-300" },
    { label: "Grounded", color: "border-amber-400/40 text-amber-700 dark:text-amber-300" },
    { label: "Tender", color: "border-purple-400/40 text-purple-700 dark:text-purple-300" },
    { label: "Stirred", color: "border-sky-400/40 text-sky-700 dark:text-sky-300" },
    { label: "Releasing", color: "border-rose-400/40 text-rose-700 dark:text-rose-300" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-in fade-in duration-300">
      {/* Top Navigation & Status Bar */}
      <div
        className={`flex items-center justify-between gap-4 pb-3 border-b transition-colors ${
          isLight ? "border-[#E8DDC8]" : "border-[#2E2157]/60"
        }`}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={`flex items-center gap-2 text-xs font-sans transition-colors cursor-pointer disabled:opacity-50 ${
            isLight
              ? "text-[#726E65] hover:text-[#232220]"
              : "text-[#959BB4] hover:text-[#F1EEF8]"
          }`}
        >
          <ArrowLeft size={15} />
          <span>Return to Space</span>
        </button>

        <div className="flex items-center gap-3">
          {draftStatus && (
            <div
              className={`flex items-center gap-1.5 text-[11px] font-sans transition-colors ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              <Check size={12} className="text-emerald-500" />
              <span>{draftStatus}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme || toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] text-xs font-sans border transition-all duration-[180ms] cursor-pointer ${
              isLight
                ? "border-[#E8DDC8] bg-[#F1EBDD] text-[#232220] hover:bg-[#E8DDC8]"
                : "border-[#2E2157] bg-[#151A2E] text-[#F1EEF8] hover:bg-[#2E2157]"
            }`}
          >
            {isLight ? (
              <>
                <Moon size={13} />
                <span>Sanctuary Night</span>
              </>
            ) : (
              <>
                <Sun size={13} />
                <span>Ivory Mist</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Offline / Error Banner */}
      {errorMessage && (
        <div
          className={`flex items-start gap-2.5 p-4 rounded-[20px] border text-xs font-sans leading-relaxed animate-in fade-in ${
            isLight
              ? "bg-amber-50/80 border-amber-200 text-amber-900"
              : "bg-amber-950/30 border-amber-800/50 text-amber-200"
          }`}
        >
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Large Writing Canvas - Minimal distractions with serene digital lighting */}
      <div
        className={`rounded-[28px] border p-7 sm:p-11 backdrop-blur-2xl transition-all duration-[220ms] relative overflow-hidden ${
          isLight
            ? "bg-[#FFFFFF] border-[rgba(24,24,27,0.08)] shadow-[0_8px_32px_-4px_rgba(44,38,30,0.06)]"
            : "sanctuary-glass border-[#7C5CFF]/25 shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_32px_rgba(124,92,255,0.1)]"
        }`}
      >
        {/* Soft digital lighting overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(124,92,255,0.12),transparent_75%)]" />

        <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider mb-6 text-[#BFAEFF]">
          <div className="flex items-center gap-2">
            <Feather size={14} />
            <span>{initialContent ? "Editing Moment" : "Space Canvas"}</span>
          </div>
          <span className={`text-[11px] font-normal normal-case tracking-normal ${
            isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
          }`}>
            {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Large writing area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="What has been on your mind? Write whatever feels present right now..."
          autoFocus
          className={`relative z-10 w-full resize-none bg-transparent border-0 p-0 text-base sm:text-lg leading-[1.85] tracking-normal focus:outline-none transition-colors ${
            isLight
              ? "text-[#232220] placeholder:text-stone-400"
              : "text-[#F8F7FF] placeholder-[#B8BDD6]/50"
          }`}
          style={{ minHeight: "380px" }}
        />

        {/* Words Counter Footer */}
        <div className={`relative z-10 flex items-center justify-between pt-4 mt-4 border-t text-xs ${
          isLight ? "border-stone-200 text-stone-500" : "border-white/5 text-[#B8BDD6]/60"
        }`}>
          <span className="font-mono tracking-tight">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          <span className="italic text-[11px]">A place to put things down.</span>
        </div>
      </div>

      {/* Mood Appears After Writing (Phase 8.0 Sanctuary Rule) */}
      {hasWrittenEnough && (
        <div
          className={`p-5 rounded-[24px] border backdrop-blur-xl transition-all duration-[250ms] animate-in fade-in slide-in-from-bottom-2 ${
            isLight
              ? "bg-[#F1EBDD]/70 border-[#E8DDC8]"
              : "sanctuary-glass border-[#7C5CFF]/20"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#BFAEFF] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>How does this feeling sit with you right now?</span>
              </span>
              <p
                className={`text-xs italic ${
                  isLight ? "text-stone-600" : "text-[#B8BDD6]/70"
                }`}
              >
                Optional gentle tag for your inner reflection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {moodChoices.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setSelectedMood(selectedMood === m.label ? null : m.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-[180ms] cursor-pointer ${m.color} ${
                    selectedMood === m.label
                      ? isLight
                        ? "bg-[#232220] text-white border-transparent shadow-xs"
                        : "bg-[#7C5CFF] text-white border-transparent shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                      : isLight
                      ? "bg-white/60 hover:bg-white"
                      : "bg-[#0B1228]/60 hover:bg-[#7C5CFF]/20 text-[#B8BDD6]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveMoment}
          disabled={!content.trim() || isSaving}
          className={`flex items-center gap-2.5 rounded-2xl py-3.5 px-8 font-semibold text-sm transition-all duration-[220ms] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            isLight
              ? "bg-[#232220] hover:bg-stone-800 text-[#F7F4EE] shadow-lg shadow-stone-900/10"
              : "bg-[#7C5CFF] hover:bg-[#6b4bf0] text-white shadow-[0_0_20px_rgba(124,92,255,0.45)] border border-[#7C5CFF]/40"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin text-white" />
              <span>Saving your words...</span>
            </>
          ) : (
            <>
              <span>Save this moment</span>
              <Feather size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
