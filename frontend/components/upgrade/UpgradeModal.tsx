"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { clearAllSanctuarySessions } from "@/lib/auth";
import {
  Sparkles,
  Mail,
  Phone,
  Copy,
  Check,
  ShieldCheck,
  X,
  LogOut,
  ArrowRight
} from "lucide-react";

export const BUSINESS_EMAIL = "vp701049@gmail.com";
export const BUSINESS_PHONE = "8879302705";
export const BUSINESS_PHONE_TEL = "+918879302705";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatoryExpired?: boolean;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  isMandatoryExpired = false,
}: UpgradeModalProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { trialDaysRemaining, isTrialActive, isPaid } = useEntitlement();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyContact = async () => {
    try {
      const text = `Athena Sanctuary Upgrade Support\nEmail: ${BUSINESS_EMAIL}\nPhone: +91 ${BUSINESS_PHONE}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSignOut = async () => {
    await clearAllSanctuarySessions();
    window.location.href = "/login";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isMandatoryExpired) onClose();
        }}
      />

      {/* Modal Surface */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-[28px] border p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)] transition-all animate-in zoom-in-95 duration-200 ${
          isLight
            ? "bg-[#FAF7F2] border-[rgba(124,92,255,0.2)] text-[#1C1917]"
            : "bg-[#0B1026] border-[#7C5CFF]/30 text-[#F8F7FF]"
        }`}
      >
        {/* Close Button (only if not strictly expired lockout) */}
        {!isMandatoryExpired && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`absolute top-5 right-5 p-2 rounded-full transition cursor-pointer ${
              isLight
                ? "text-stone-500 hover:text-stone-900 hover:bg-stone-200"
                : "text-[#B8BDD6] hover:text-white hover:bg-white/10"
            }`}
          >
            <X size={18} />
          </button>
        )}

        {/* Badge Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#7C5CFF]/15 text-[#9D84FF] border border-[#7C5CFF]/30">
            <Sparkles size={13} className="text-[#9D84FF]" />
            {isTrialActive
              ? t("trial_explore_upgrade", "Explore Upgrade Options")
              : t("trial_ended_badge", "Trial Ended")}
          </span>
          {isTrialActive && trialDaysRemaining > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {trialDaysRemaining} {t("trial_days_remaining", "days remaining")}
            </span>
          )}
        </div>

        {/* Heading */}
        <h2
          id="upgrade-modal-title"
          className="text-2xl sm:text-3xl font-semibold tracking-tight font-hero-serif leading-snug"
        >
          {t("upgrade_modal_title", "Continue Your Athena Journey")}
        </h2>

        {/* Subtitle / Explanation */}
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t(
            "upgrade_modal_subtitle",
            "Your 30-day free trial has ended. We'd be happy to help you explore the available upgrade options and continue your journey with Athena."
          )}
        </p>

        <p className="mt-2 text-xs font-medium text-[var(--accent)]">
          {t("upgrade_modal_prompt", "Contact us to discuss your upgrade and the next steps.")}
        </p>

        {/* Contact Info Card */}
        <div
          className={`mt-5 rounded-2xl border p-4 sm:p-5 space-y-3 ${
            isLight
              ? "bg-white border-stone-200 shadow-sm"
              : "bg-[#060814]/80 border-[#7C5CFF]/20"
          }`}
        >
          {/* Email row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#7C5CFF]/15 text-[#7C5CFF] shrink-0">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  {t("upgrade_business_email_label", "Verified Business Email")}
                </p>
                <a
                  href={`mailto:${BUSINESS_EMAIL}?subject=Athena%20Sanctuary%20Upgrade%20Inquiry`}
                  className="text-sm font-semibold hover:text-[var(--accent)] transition truncate block"
                >
                  {BUSINESS_EMAIL}
                </a>
              </div>
            </div>
          </div>

          {/* Phone row */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  {t("upgrade_business_phone_label", "Verified Business Phone")}
                </p>
                <a
                  href={`tel:${BUSINESS_PHONE_TEL}`}
                  className="text-sm font-semibold hover:text-[var(--accent)] transition truncate block"
                >
                  +91 {BUSINESS_PHONE}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={`mailto:${BUSINESS_EMAIL}?subject=Athena%20Sanctuary%20Upgrade%20Inquiry&body=Hello%20Athena%20Team%2C%0A%0AI%20would%20like%20to%20discuss%20upgrading%20my%20sanctuary%20account.`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Mail size={15} />
            <span>{t("upgrade_email_support", "Email Support")}</span>
          </a>

          <a
            href={`tel:${BUSINESS_PHONE_TEL}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Phone size={15} />
            <span>{t("upgrade_call_support", "Call Support")}</span>
          </a>
        </div>

        {/* Copy Details & Secondary Actions */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopyContact}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition py-1.5 px-2 rounded-xl cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  {t("upgrade_contact_copied", "Contact details copied to clipboard")}
                </span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>{t("upgrade_copy_contact", "Copy Contact Details")}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition py-1.5 px-2 rounded-xl cursor-pointer"
          >
            <LogOut size={13} />
            <span>{t("upgrade_sign_out", "Sign Out")}</span>
          </button>
        </div>

        {/* Data Preservation Reassurance Notice */}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-start gap-2 text-[11px] text-[var(--text-muted)]">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              "upgrade_data_preserved_notice",
              "Your existing account, journal entries, check-in history, reflections, and conversations remain completely safe and preserved."
            )}
          </p>
        </div>

        {isMandatoryExpired && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition underline underline-offset-4 cursor-pointer"
            >
              {t("upgrade_keep_exploring", "Browse Sanctuary (Read-Only)")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
