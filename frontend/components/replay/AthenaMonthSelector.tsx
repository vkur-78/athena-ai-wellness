"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const MONTH_NAMES: Record<string, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  ta: ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
  te: ["జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్", "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"],
  mr: ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"],
  gu: ["જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઇ", "ઑગસ્ટ", "સપ્ટેમ્બર", "ઑક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"],
};

export function formatLocalizedMonthKey(monthKey: string, langCode: string = "en"): string {
  if (!monthKey || !monthKey.includes("-")) return monthKey;
  const [yearStr, monthStr] = monthKey.split("-");
  const monthIdx = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);
  const lang = (langCode || "en").toLowerCase();
  const list = MONTH_NAMES[lang] || MONTH_NAMES.en;
  const monthName = list[monthIdx] || list[0];
  return `${monthName} ${year}`;
}

interface AthenaMonthSelectorProps {
  availableMonths: string[]; // List of YYYY-MM in descending order (e.g. ['2026-09', '2026-08', ...])
  activeMonth: string; // Currently active YYYY-MM
  onMonthChange: (month: string) => void;
  className?: string;
}

export default function AthenaMonthSelector({
  availableMonths,
  activeMonth,
  onMonthChange,
  className = "",
}: AthenaMonthSelectorProps) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Month navigation boundary checks
  const curMonthIdx = availableMonths.indexOf(activeMonth);
  // availableMonths is descending: index 0 is newest, index length - 1 is oldest
  const hasNextMonth = curMonthIdx > 0;
  const hasPrevMonth = curMonthIdx >= 0 && curMonthIdx < availableMonths.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrevMonth) {
      onMonthChange(availableMonths[curMonthIdx + 1]);
    }
  }, [hasPrevMonth, availableMonths, curMonthIdx, onMonthChange]);

  const handleNext = useCallback(() => {
    if (hasNextMonth) {
      onMonthChange(availableMonths[curMonthIdx - 1]);
    }
  }, [hasNextMonth, availableMonths, curMonthIdx, onMonthChange]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent | TouchEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("touchstart", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeLabel = formatLocalizedMonthKey(activeMonth, language);

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Previous Month Button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={!hasPrevMonth}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none ${
          !hasPrevMonth
            ? "opacity-35 cursor-not-allowed border-sanctuary-border/30 text-sanctuary-muted"
            : "border-sanctuary-border/50 hover:bg-sanctuary-surface text-sanctuary-text active:scale-95"
        }`}
        title={hasPrevMonth ? t("replay_prev_month", "← Previous Month") : t("replay_no_earlier_months", "No earlier history")}
        aria-label={t("replay_prev_month", "Previous Month")}
      >
        <ChevronLeft size={13} />
        <span className="hidden sm:inline">{t("replay_prev_month", "← Previous Month")}</span>
      </button>

      {/* Popover Trigger */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 bg-sanctuary-surface border rounded-xl px-3.5 py-1.5 text-xs text-sanctuary-text font-semibold transition shadow-xs cursor-pointer select-none ${
            isOpen
              ? "border-sanctuary-primary ring-2 ring-sanctuary-primary/20 bg-sanctuary-surface-hover"
              : "border-sanctuary-border/60 hover:border-sanctuary-border hover:bg-sanctuary-surface-hover"
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={t("replay_select_month", "Select Month")}
        >
          <Calendar size={13} className="text-sanctuary-primary shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-none">{activeLabel}</span>
          <ChevronDown
            size={13}
            className={`text-sanctuary-muted transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-sanctuary-primary" : ""
            }`}
          />
        </button>

        {/* Popover Dropdown Menu */}
        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-64 max-w-[90vw] z-50 rounded-2xl bg-sanctuary-surface/95 border border-sanctuary-border/60 shadow-xl backdrop-blur-xl p-2 animate-in fade-in zoom-in-95 duration-150"
            role="listbox"
            tabIndex={-1}
          >
            <div className="px-2.5 py-1.5 border-b border-sanctuary-border/30 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-sanctuary-muted uppercase">
                {t("replay_available_history", "Recorded Months")}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-sanctuary-primary/10 text-sanctuary-primary font-medium">
                {availableMonths.length}
              </span>
            </div>

            {/* Internal Scrolling Only */}
            <div className="max-h-56 overflow-y-auto mt-1 space-y-1 overscroll-contain pr-0.5">
              {availableMonths.map((m) => {
                const isSelected = m === activeMonth;
                const label = formatLocalizedMonthKey(m, language);

                return (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onMonthChange(m);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-sanctuary-primary/15 text-sanctuary-primary font-semibold border border-sanctuary-primary/30"
                        : "text-sanctuary-text hover:bg-sanctuary-surface-hover/80 font-medium"
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check size={13} className="text-sanctuary-primary shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Next Month Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!hasNextMonth}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none ${
          !hasNextMonth
            ? "opacity-35 cursor-not-allowed border-sanctuary-border/30 text-sanctuary-muted"
            : "border-sanctuary-border/50 hover:bg-sanctuary-surface text-sanctuary-text active:scale-95"
        }`}
        title={hasNextMonth ? t("replay_next_month", "Next Month →") : t("replay_latest_month", "Latest month recorded")}
        aria-label={t("replay_next_month", "Next Month")}
      >
        <span className="hidden sm:inline">{t("replay_next_month", "Next Month →")}</span>
        <ChevronRight size={13} />
      </button>
    </div>
  );
}
