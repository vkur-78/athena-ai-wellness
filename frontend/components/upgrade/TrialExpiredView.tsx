"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { clearAllSanctuarySessions } from "@/lib/auth";
import {
  Sparkles,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { BUSINESS_EMAIL, BUSINESS_PHONE, BUSINESS_PHONE_TEL } from "./UpgradeModal";

interface TrialExpiredViewProps {
  onBrowseReadOnly?: () => void;
}

export default function TrialExpiredView({ onBrowseReadOnly }: TrialExpiredViewProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { openUpgradeModal } = useEntitlement();

  const handleSignOut = async () => {
    await clearAllSanctuarySessions();
    window.location.href = "/login";
  };

  return (
    <div className="w-full max-w-xl mx-auto py-10 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`rounded-[32px] border p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all ${
          isLight
            ? "bg-[#FAF7F2] border-[rgba(124,92,255,0.2)] text-[#1C1917]"
            : "bg-[#0B1026] border-[#7C5CFF]/30 text-[#F8F7FF]"
        }`}
      >
        {/* Top Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Sparkles size={14} />
            <span>{t("trial_ended_badge", "Trial Ended")}</span>
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-center font-hero-serif leading-snug">
          {t("upgrade_modal_title", "Continue Your Athena Journey")}
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-center text-[var(--text-secondary)]">
          {t(
            "upgrade_modal_subtitle",
            "Your 30-day free trial has ended. We'd be happy to help you explore the available upgrade options and continue your journey with Athena."
          )}
        </p>

        <p className="mt-2 text-xs sm:text-sm text-center font-medium text-[var(--accent)]">
          {t("upgrade_modal_prompt", "Contact us to discuss your upgrade and the next steps.")}
        </p>

        {/* Contact Info Box */}
        <div
          className={`mt-6 rounded-2xl border p-5 space-y-3.5 ${
            isLight
              ? "bg-white border-stone-200 shadow-sm"
              : "bg-[#060814]/80 border-[#7C5CFF]/20"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#7C5CFF]/15 text-[#7C5CFF]">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  {t("upgrade_business_email_label", "Verified Business Email")}
                </p>
                <a
                  href={`mailto:${BUSINESS_EMAIL}?subject=Athena%20Sanctuary%20Upgrade%20Inquiry`}
                  className="text-sm font-semibold hover:text-[var(--accent)] transition"
                >
                  {BUSINESS_EMAIL}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  {t("upgrade_business_phone_label", "Verified Business Phone")}
                </p>
                <a
                  href={`tel:${BUSINESS_PHONE_TEL}`}
                  className="text-sm font-semibold hover:text-[var(--accent)] transition"
                >
                  +91 {BUSINESS_PHONE}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`mailto:${BUSINESS_EMAIL}?subject=Athena%20Sanctuary%20Upgrade%20Inquiry`}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Mail size={15} />
            <span>{t("upgrade_email_support", "Email Support")}</span>
          </a>

          <a
            href={`tel:${BUSINESS_PHONE_TEL}`}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Phone size={15} />
            <span>{t("upgrade_call_support", "Call Support")}</span>
          </a>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-2">
          {onBrowseReadOnly && (
            <button
              type="button"
              onClick={onBrowseReadOnly}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition py-1.5 px-2 rounded-xl cursor-pointer"
            >
              <BookOpen size={14} />
              <span>{t("upgrade_keep_exploring", "Browse Sanctuary (Read-Only)")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition py-1.5 px-2 rounded-xl ml-auto cursor-pointer"
          >
            <LogOut size={13} />
            <span>{t("upgrade_sign_out", "Sign Out")}</span>
          </button>
        </div>

        {/* Data Reassurance */}
        <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
          <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              "upgrade_data_preserved_notice",
              "Your existing account, journal entries, check-in history, reflections, and conversations remain completely safe and preserved."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
