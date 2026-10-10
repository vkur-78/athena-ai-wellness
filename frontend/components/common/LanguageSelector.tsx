"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { WebsiteLanguage, LanguageOption } from "@/lib/translations";

interface LanguageSelectorProps {
  isLight?: boolean;
}

export default function LanguageSelector({ isLight = false }: LanguageSelectorProps) {
  const { language, setLanguage, currentLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (code: WebsiteLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button: Compact Glass Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select website language"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[20px] text-xs font-medium border transition-all duration-[180ms] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/50 hover:scale-[1.02] active:scale-[0.98] ${
          isLight
            ? "border-[#E8DDC8] bg-[#F1EBDD]/80 text-[#232220] hover:bg-[#E8DDC8]"
            : "border-[#2E2157]/50 bg-[#1F253F]/60 text-[#B8BDD6] hover:text-white hover:bg-[#2E2157]/80 hover:border-[#7C5CFF]/40 shadow-xs"
        }`}
      >
        <Globe size={13} className={isLight ? "text-stone-600" : "text-[#BFAEFF]"} />
        <span className="font-semibold text-[11px] tracking-wide uppercase">
          {currentLanguage.code}
        </span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "opacity-60"}`}
        />
      </button>

      {/* Floating Animated Glass Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Website language options"
          className={`absolute right-0 mt-2 w-52 sm:w-56 rounded-[22px] border backdrop-blur-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden ${
            isLight
              ? "bg-[#FFFFFF]/95 border-stone-200 shadow-[0_12px_40px_rgba(24,24,27,0.12)] text-stone-900"
              : "bg-[#0C1126]/95 border-[#7C5CFF]/30 shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_24px_rgba(124,92,255,0.2)] text-[#F8F7FF]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 mb-1 border-b border-white/5 text-[11px] font-semibold uppercase tracking-wider text-[#BFAEFF]/80">
            <Globe size={12} />
            <span>{t("language_select", "Language")}</span>
          </div>

          {/* Languages list */}
          <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {languages.map((l: LanguageOption) => {
              const isSelected = l.code === language;
              return (
                <button
                  key={l.code}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[14px] text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-stone-900 text-white font-medium"
                        : "bg-[#7C5CFF] text-white font-medium shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                      : isLight
                      ? "text-stone-700 hover:bg-stone-100"
                      : "text-[#B8BDD6] hover:bg-[#7C5CFF]/15 hover:text-white"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-[13px]">{l.nativeName}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? "text-white/80" : "opacity-50"
                      }`}
                    >
                      {l.name}
                    </span>
                  </div>

                  {isSelected && <Check size={13} className="shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
