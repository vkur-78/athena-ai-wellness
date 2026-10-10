"use client";

import React, { useState, useEffect } from "react";
import { CuratedExercise, StudioLanguage } from "@/lib/studioExerciseContent";
import { SUPPORTED_STUDIO_VOICES, StudioVoiceProvider, StudioVoiceLanguage } from "@/lib/voiceProvider";
import { Volume2, X, Sparkles, Check, ArrowRight, Play, Square } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface StudioGuideVoiceModalProps {
  exercise: CuratedExercise | null;
  isOpen: boolean;
  initialLanguage?: StudioLanguage;
  onClose: () => void;
  onStartPractice: (language: StudioLanguage) => void;
}

export function StudioGuideVoiceModal({
  exercise,
  isOpen,
  initialLanguage = "en",
  onClose,
  onStartPractice,
}: StudioGuideVoiceModalProps) {
  const { t, language: siteLang } = useLanguage();
  const [selectedVoice, setSelectedVoice] = useState<StudioLanguage>(initialLanguage);
  const [previewingVoice, setPreviewingVoice] = useState<StudioVoiceLanguage | null>(null);

  // Stop any active preview when modal unmounts or closes
  useEffect(() => {
    return () => {
      StudioVoiceProvider.stopPreview();
    };
  }, [isOpen]);

  if (!isOpen || !exercise) return null;

  // Filter strictly to the 6 production languages
  const availableLanguages = SUPPORTED_STUDIO_VOICES;

  const handleTogglePreview = (e: React.MouseEvent, voiceCode: StudioVoiceLanguage) => {
    e.stopPropagation();
    StudioVoiceProvider.unlockAudio();
    if (previewingVoice === voiceCode) {
      StudioVoiceProvider.stopPreview();
      setPreviewingVoice(null);
    } else {
      StudioVoiceProvider.stopPreview();
      setPreviewingVoice(voiceCode);
      StudioVoiceProvider.playPreview(
        voiceCode,
        () => setPreviewingVoice(voiceCode),
        () => setPreviewingVoice(null)
      );
    }
  };

  const handleBegin = () => {
    StudioVoiceProvider.stopPreview();
    StudioVoiceProvider.unlockAudio();
    setPreviewingVoice(null);
    onStartPractice(selectedVoice);
  };

  const handleClose = () => {
    StudioVoiceProvider.stopPreview();
    setPreviewingVoice(null);
    onClose();
  };

  const exerciseTitle = exercise.title[siteLang] || exercise.title.en;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your studio guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-6 sm:p-8 shadow-2xl text-[var(--text-primary)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,92,255,0.25),transparent_70%)] pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close guide selection"
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Exercise Header */}
        <div className="space-y-1 mb-6 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
            <Sparkles size={12} />
            <span>{t("studio_voice_guide", "Studio Voice Guide")}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-hero-serif font-bold text-[var(--text-primary)] pt-1">
            {exerciseTitle}
          </h3>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            {t("studio_voice_select_prompt", "Choose a calm, humanized voice guide for your unhurried practice.")}
          </p>
        </div>

        {/* Voice Selector Grid (Exactly 6 Languages) */}
        <div className="space-y-2 mb-8">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <Volume2 size={13} />
            <span>{t("studio_available_guides", "6 Guided Sanctuary Voices")}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {availableLanguages.map((voice) => {
              const isSelected = selectedVoice === voice.code;
              const isPreviewing = previewingVoice === voice.code;

              return (
                <div
                  key={voice.code}
                  onClick={() => setSelectedVoice(voice.code as StudioLanguage)}
                  className={`flex items-center justify-between p-3 rounded-[18px] border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-[0_0_16px_rgba(124,92,255,0.25)] text-[var(--text-primary)] scale-[1.01]"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-[var(--text-primary)]">
                      {voice.nativeName}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {voice.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 5-8s Voice Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePreview(e, voice.code as StudioVoiceLanguage)}
                      title={isPreviewing ? t("studio_preview_stop", "Stop") : t("studio_preview", "Preview voice")}
                      aria-label={`${voice.name} voice preview`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide border transition-all cursor-pointer ${
                        isPreviewing
                          ? "bg-rose-500/20 border-rose-500 text-rose-500 dark:text-rose-300 animate-pulse"
                          : "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      }`}
                    >
                      {isPreviewing ? <Square size={10} className="fill-current" /> : <Play size={10} className="fill-current" />}
                      <span>{isPreviewing ? t("studio_preview_stop", "Stop") : t("studio_preview", "Preview")}</span>
                    </button>

                    {/* Checkmark selection circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-[var(--border-strong)] bg-transparent"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action CTA */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
          >
            {t("btn_cancel", "Cancel")}
          </button>

          <button
            type="button"
            onClick={handleBegin}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#7C5CFF] to-indigo-600 text-white shadow-lg shadow-[#7C5CFF]/30 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span>{t("studio_begin", "Begin Practice")}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
