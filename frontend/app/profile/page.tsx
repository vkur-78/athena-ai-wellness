"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearAllSanctuarySessions } from "@/lib/auth";
import { fetchUserProfile, fetchCheckinHistory } from "@/lib/api";
import { calculateActualStreak } from "@/lib/dashboardMetrics";
import { voiceSessionManager } from "@/lib/voiceSessionManager";
import { UserProfile } from "@/types/profile";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import {
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  Lock,
  Feather,
  Sparkles,
  Flame,
  Bell,
  Check,
  Globe,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEntitlement } from "@/context/EntitlementContext";
import Link from "next/link";
import Loading from "@/components/common/Loading";

export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();
  const { language, setLanguage, languages, t } = useLanguage();
  const { isDemoMode, isPaid, isTrialActive, isTrialExpired, trialDaysRemaining, openUpgradeModal } = useEntitlement();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>("20:30");
  const [reminderSaved, setReminderSaved] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function verifyAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/login");
          return;
        }

        if (!active) return;
        setUser(session.user);

        const [prof, history] = await Promise.allSettled([
          fetchUserProfile(session.access_token),
          fetchCheckinHistory(14, session.access_token),
        ]);

        if (!active) return;

        if (prof.status === "fulfilled" && prof.value) {
          setProfile(prof.value);
        }

        if (history.status === "fulfilled" && Array.isArray(history.value)) {
          setStreakDays(calculateActualStreak(history.value, null));
        }

        setAuthLoading(false);
      } catch (err) {
        console.error("Profile auth error:", err);
        router.replace("/login");
      }
    }

    verifyAuth();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    voiceSessionManager.stopAll();
    await clearAllSanctuarySessions();
    router.replace("/login");
  };

  const handleSaveReminder = () => {
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2000);
  };

  if (authLoading || !user) {
    return (
      <Loading
        label="Opening Your Sanctuary Profile..."
        sublabel="Gathering your presence rhythm and preferences"
        fullScreen={true}
      />
    );
  }

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Sanctuary Member";

  return (
    <main
      className={`relative min-h-screen w-full flex flex-col transition-colors duration-300 ${
        isLight
          ? "bg-[#FAF7F2] text-[#1C1917]"
          : "bg-[#060814] text-[#F8F7FF]"
      }`}
    >
      {/* Background Atmosphere */}
      <div className="sanctuary-aurora-bg" />

      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      <div data-tour="profile-privacy" className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <h1
            className={`text-3xl sm:text-5xl font-semibold tracking-tight transition-colors ${
              isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
            }`}
          >
            {t("profile_title", "Profile & Settings")}
          </h1>
          <p
            className={`text-sm max-w-md mx-auto leading-relaxed ${
              isLight ? "text-[#524E5E]" : "text-[#B8BDD6]"
            }`}
          >
            {t("profile_subtitle", "Your sacred space, presence rhythm, and gentle care preferences.")}
          </p>
        </div>

        {/* Non-blocking Demo Exploration Banner */}
        {isDemoMode && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t("demo_explore_banner_title") || "Demo Mode: Exploring Sample Profile"}</p>
                <p className="text-xs text-amber-300/80">{t("demo_read_only_notice") || "Sample profile settings are read-only. Create your free account to personalize your wellness sanctuary."}</p>
              </div>
            </div>
            <Link
              href="/signup"
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-medium whitespace-nowrap transition-colors"
            >
              {t("demo_limit_create_account") || "Create Account"}
            </Link>
          </div>
        )}

        {/* 1. Identity & Streak Card */}
        <section
          aria-label="Sanctuary Member Identity"
          className={`rounded-[26px] border p-6 sm:p-7 space-y-4 backdrop-blur-xl transition-all duration-[220ms] ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
              : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-[18px] flex items-center justify-center font-semibold text-lg border ${
                  isLight
                    ? "bg-[#6E4FE6]/10 border-[#6E4FE6]/25 text-[#6E4FE6]"
                    : "bg-[#7C5CFF] border-[#7C5CFF]/50 text-white shadow-[0_0_14px_rgba(124,92,255,0.4)]"
                }`}
              >
                {displayName[0].toUpperCase()}
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold tracking-tight ${
                    isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
                  }`}
                >
                  {displayName}
                </h2>
                <p className={`text-xs ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Streak Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${
                isLight
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              }`}
            >
              <Flame size={13} className="text-amber-500 fill-amber-500" />
              <span>{streakDays} {t("profile_days_presence", "days of presence")}</span>
            </div>
          </div>

          {profile?.support_style && (
            <div
              className={`pt-3 border-t text-xs flex items-center gap-2 ${
                isLight ? "border-stone-100 text-stone-600" : "border-[#7C5CFF]/15 text-[#BFAEFF]"
              }`}
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>{t("profile_care_style", "Care style:")} {profile.support_style}</span>
            </div>
          )}
        </section>

        {/* Sanctuary Trial & Membership Card */}
        <section
          aria-label="Sanctuary Trial and Membership"
          className={`rounded-[26px] border p-6 sm:p-7 space-y-4 transition-all duration-200 ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
              : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-[16px] border text-xs shrink-0 ${
                  isLight
                    ? "bg-[#7C5CFF]/10 border-[#7C5CFF]/20 text-[#6E4FE6]"
                    : "bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#9D84FF]"
                }`}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold tracking-tight ${
                    isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
                  }`}
                >
                  {t("profile_trial_card_title", "Sanctuary Trial & Membership")}
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                  {isDemoMode
                    ? t("demo_badge", "Demo Mode · Sample 24-Month Journey")
                    : isPaid
                    ? t("profile_membership_active_plus", "Athena Plus Member • Full Access")
                    : isTrialActive
                    ? `${t("profile_membership_trial_active", "30-Day Sanctuary Trial Active")} • ${trialDaysRemaining} ${t("trial_days_remaining", "days remaining")}`
                    : t("profile_membership_trial_expired", "30-Day Free Trial Ended")}
                </p>
              </div>
            </div>

            {!isDemoMode && !isPaid && (
              <button
                type="button"
                onClick={openUpgradeModal}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                  isTrialExpired
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : trialDaysRemaining <= 3
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-[#7C5CFF] hover:bg-[#6e4fe6] text-white"
                }`}
              >
                <span>{isTrialExpired ? t("profile_contact_upgrade", "Contact to Upgrade") : t("trial_explore_upgrade", "Explore Upgrade Options")}</span>
              </button>
            )}
          </div>
        </section>

        {/* 2. Mindful Reminders Card */}
        <section
          aria-label="Mindful Reminders"
          className={`rounded-[26px] border p-6 sm:p-7 space-y-4 transition-all duration-200 ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
              : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-[14px] border text-xs ${
                  isLight
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <Bell size={14} />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold tracking-tight ${
                    isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
                  }`}
                >
                  {t("profile_mindful_reminders", "Mindful Reminders")}
                </h3>
                <p className={`text-xs ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                  {t("profile_mindful_reminders_desc", "A gentle invitation to pause and check in with yourself.")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRemindersEnabled((prev) => !prev)}
              aria-label="Toggle reminders"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-hidden ${
                remindersEnabled
                  ? isLight
                    ? "bg-[#6E4FE6]"
                    : "bg-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                  : "bg-stone-300 dark:bg-[#060814]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  remindersEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {remindersEnabled && (
            <div className={`pt-3 border-t flex items-center justify-between gap-3 ${isLight ? "border-stone-100" : "border-[#7C5CFF]/15"}`}>
              <span className={`text-xs ${isLight ? "text-[#524E5E]" : "text-[#B8BDD6]"}`}>
                {t("profile_daily_pause_time", "Daily pause time")}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className={`rounded-xl border py-1.5 px-3 text-xs font-mono transition focus:outline-hidden ${
                    isLight
                      ? "border-stone-200 bg-[#FAF7F2] text-[#1C1917]"
                      : "border-[#7C5CFF]/30 bg-[#060814] text-[#F8F7FF]"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSaveReminder}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 cursor-pointer ${
                    isLight
                      ? "bg-[#6E4FE6] text-white hover:bg-[#5D3FD3]"
                      : "bg-[#7C5CFF] text-white hover:bg-[#6b4bf0] shadow-[0_0_12px_rgba(124,92,255,0.35)]"
                  }`}
                >
                  {reminderSaved ? <Check size={12} /> : t("common_save", "Save")}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2.5 Website Language Card */}
        <section
          aria-label="Website Language"
          className={`rounded-[26px] border p-6 sm:p-7 space-y-4 transition-all duration-200 ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
              : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe size={16} className={isLight ? "text-[#6E4FE6]" : "text-[#BFAEFF]"} />
                <h3
                  className={`text-sm font-semibold tracking-tight ${
                    isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
                  }`}
                >
                  {t("profile_language", "Website Language")}
                </h3>
              </div>
              <p className={`text-xs mt-1 ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                {t("profile_language_desc", "Choose the primary language for Athena's interface, navigation, and reflections.")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {languages.map((l) => {
              const isSelected = l.code === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-[#6E4FE6] border-[#6E4FE6] text-white shadow-xs font-semibold"
                        : "bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-[0_0_14px_rgba(124,92,255,0.4)]"
                      : isLight
                      ? "border-stone-200/90 bg-[#FAF7F2] text-[#1C1917] hover:bg-[#F3EFE8]"
                      : "border-white/10 bg-white/[0.03] text-[#B8BDD6] hover:bg-[#7C5CFF]/15 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-[13px]">{l.nativeName}</span>
                    <span className={`text-[10px] ${isSelected ? "text-white/80" : "opacity-50"}`}>{l.name}</span>
                  </div>
                  {isSelected && <Check size={13} className="shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Reading Atmosphere / Themes Card */}
        <section
          aria-label="Reading Atmosphere"
          className={`rounded-[26px] border p-6 sm:p-7 space-y-4 transition-all duration-200 ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
              : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
                }`}
              >
                {t("profile_reading_atmosphere", "Reading Atmosphere")}
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                {isLight
                  ? t("profile_reading_atmosphere_desc_light", "Soft Daylight — Warm ivory paper tone for daytime contemplation")
                  : t("profile_reading_atmosphere_desc_dark", "Sanctuary Night — Soft midnight tranquil atmosphere")}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium border transition-all duration-200 active:scale-95 cursor-pointer ${
                isLight
                  ? "border-[rgba(124,92,255,0.15)] bg-[#FAF7F2] text-[#1C1917] hover:bg-[#F3EFE8]"
                  : "border-[#7C5CFF]/30 bg-[#0B1228] text-[#F8F7FF] hover:bg-[#7C5CFF]/20 shadow-[0_0_12px_rgba(124,92,255,0.15)]"
              }`}
            >
              {isLight ? (
                <>
                  <Moon size={13} />
                  <span>{t("profile_sanctuary_night", "Sanctuary Night")}</span>
                </>
              ) : (
                <>
                  <Sun size={13} />
                  <span>{t("profile_soft_daylight", "Soft Daylight")}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 4. Sacred Privacy Pledge Card */}
        <section
          aria-label="Sacred Privacy Pledge"
          className={`rounded-[26px] border p-6 sm:p-7 space-y-2.5 transition-all duration-200 ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.11)] shadow-[0_4px_24px_-2px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.02)]"
              : "sanctuary-glass border-[#7C5CFF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-[#4ADE80] uppercase tracking-wider">
            <ShieldCheck size={15} />
            <span>{t("profile_sacred_privacy", "Sacred Privacy Guarantee")}</span>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-[#524E5E]" : "text-[#B8BDD6]"}`}>
            {t("profile_privacy_body", "Your words, journal entries, and conversations belong solely to you. Athena never sells or shares your mental wellness reflections with advertisers or third parties.")}
          </p>
        </section>

        {/* Rest & Sign Out */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl border text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
              isLight
                ? "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200"
                : "border-[#7C5CFF]/20 bg-[#0B1228]/80 text-[#B8BDD6] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10"
            }`}
          >
            <LogOut size={14} />
            <span>{t("profile_sign_out", "Rest and sign out")}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
