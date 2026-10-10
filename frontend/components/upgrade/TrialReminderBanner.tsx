"use client";

import React, { useState, useEffect } from "react";
import { useEntitlement } from "@/context/EntitlementContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Sparkles, AlertCircle, Clock, X, ArrowRight } from "lucide-react";

export default function TrialReminderBanner() {
  const { isDemoMode, isPaid, isTrialActive, isTrialExpired, trialDaysRemaining, openUpgradeModal } =
    useEntitlement();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    // Never show to demo users or paid members
    if (isDemoMode || isPaid) {
      setDismissed(true);
      return;
    }

    // Only show if 7 days or fewer remain or if expired
    if (isTrialActive && trialDaysRemaining > 7) {
      setDismissed(true);
      return;
    }

    // Check sessionStorage to respect dismiss action for this session
    try {
      const dismissKey = isTrialExpired
        ? "athena_dismissed_trial_expired"
        : `athena_dismissed_trial_${trialDaysRemaining}`;
      const isDismissedSession = sessionStorage.getItem(dismissKey) === "true";
      setDismissed(isDismissedSession);
    } catch {
      setDismissed(false);
    }
  }, [isDemoMode, isPaid, isTrialActive, isTrialExpired, trialDaysRemaining]);

  if (dismissed || isDemoMode || isPaid) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const dismissKey = isTrialExpired
        ? "athena_dismissed_trial_expired"
        : `athena_dismissed_trial_${trialDaysRemaining}`;
      sessionStorage.setItem(dismissKey, "true");
    } catch {}
  };

  // 1. Expired state banner
  if (isTrialExpired) {
    return (
      <div
        role="region"
        aria-label="Trial Expiration Notice"
        className={`w-full border-b py-2.5 px-4 sm:px-6 transition-all duration-200 ${
          isLight
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : "bg-rose-950/40 border-rose-500/30 text-rose-200"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span className="font-medium truncate">
              {t(
                "upgrade_modal_subtitle",
                "Your 30-day free trial has ended. We'd be happy to help you explore the available upgrade options and continue your journey with Athena."
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openUpgradeModal}
              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{t("profile_contact_upgrade", "Contact to Upgrade")}</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Final Day Reminder
  if (trialDaysRemaining <= 1) {
    return (
      <div
        role="region"
        aria-label="Final Day Trial Notice"
        className={`w-full border-b py-2.5 px-4 sm:px-6 transition-all duration-200 ${
          isLight
            ? "bg-amber-50 border-amber-200 text-amber-950"
            : "bg-amber-950/40 border-amber-500/30 text-amber-200"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} className="text-amber-400 shrink-0" />
            <span className="font-medium truncate">
              {t(
                "trial_notice_final_day",
                "Today is the final day of your 30-day free trial. Contact the owner to continue your journey."
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openUpgradeModal}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{t("trial_explore_upgrade", "Explore Upgrade Options")}</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. 3 Days or fewer Reminder
  if (trialDaysRemaining <= 3) {
    const notice = t(
      "trial_notice_3_days",
      "Your trial ends in {days} days. Connect with us to ensure uninterrupted access to your sanctuary."
    ).replace("{days}", String(trialDaysRemaining));

    return (
      <div
        role="region"
        aria-label="Trial Ending Soon Notice"
        className={`w-full border-b py-2.5 px-4 sm:px-6 transition-all duration-200 ${
          isLight
            ? "bg-indigo-50 border-indigo-200 text-indigo-950"
            : "bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#D4C8FF]"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-[#9D84FF] shrink-0" />
            <span className="font-medium truncate">{notice}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openUpgradeModal}
              className="px-3 py-1 rounded-xl bg-[#7C5CFF] hover:bg-[#6e4fe6] text-white font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{t("trial_explore_upgrade", "Explore Upgrade Options")}</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. 7 Days or fewer Reminder
  const notice7 = t(
    "trial_notice_7_days",
    "You have {days} days remaining in your 30-day sanctuary trial. Explore upgrade options anytime."
  ).replace("{days}", String(trialDaysRemaining));

  return (
    <div
      role="region"
      aria-label="Trial Status Notice"
      className={`w-full border-b py-2 px-4 sm:px-6 transition-all duration-200 ${
        isLight
          ? "bg-stone-100 border-stone-200 text-stone-700"
          : "bg-white/[0.03] border-white/10 text-[#B8BDD6]"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Clock size={14} className="text-[var(--text-muted)] shrink-0" />
          <span className="truncate">{notice7}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openUpgradeModal}
            className="text-[var(--accent)] hover:underline font-medium transition cursor-pointer flex items-center gap-1"
          >
            <span>{t("trial_explore_upgrade", "Explore Upgrade Options")}</span>
            <ArrowRight size={12} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
