"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  fetchUserProfile,
  fetchTodayCheckin,
  fetchCheckinHistory,
  fetchRecentMoments,
  fetchStudioHistory,
  fetchJournalEntries,
  fetchUserConversations,
  syncOfflineEvents,
} from "@/lib/api";
import { initOfflineSyncListener } from "@/lib/offlineQueue";
import { UserProfile } from "@/types/profile";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { useTheme } from "@/context/ThemeContext";
import { useTodayCheckIn } from "@/context/CheckInContext";
import { useLanguage } from "@/context/LanguageContext";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import DailyCheckInModal from "@/components/checkin/DailyCheckInModal";
import CrisisModal from "@/components/common/CrisisModal";

// Power BI / YouTube Studio / Spotify Inspired Personal Analytics Components
import DashboardSummaryRow from "@/components/dashboard/DashboardSummaryRow";
import DashboardMoodTrendChart from "@/components/dashboard/DashboardMoodTrendChart";
import DashboardWeeklyActivityChart from "@/components/dashboard/DashboardWeeklyActivityChart";
import DashboardRhythmTimeline from "@/components/dashboard/DashboardRhythmTimeline";
import DashboardPracticeTimeChart from "@/components/dashboard/DashboardPracticeTimeChart";
import DashboardReflectionRhythm from "@/components/dashboard/DashboardReflectionRhythm";
import DashboardRecentAndQuickLook from "@/components/dashboard/DashboardRecentAndQuickLook";
import DashboardAthenaNoticed from "@/components/dashboard/DashboardAthenaNoticed";
import DashboardReplaysSection from "@/components/dashboard/DashboardReplaysSection";
import DashboardContinueJourney from "@/components/dashboard/DashboardContinueJourney";

import {
  getZonedTimeParts,
  getZonedDateRange,
  toLocalDateString,
  ATHENA_DEFAULT_TIMEZONE,
} from "@/lib/timezone";
import { calculateActualStreak } from "@/lib/dashboardMetrics";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEntitlement } from "@/context/EntitlementContext";

type DateRangeOption = 7 | 30 | 90 | 180 | 365;

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();
  const { todayCheckIn } = useTodayCheckIn();
  const { t, language } = useLanguage();
  const { isDemoMode } = useEntitlement();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Selected date range: 7, 30, 90, 180 (6M), or 365 (1Y)
  const [dateRangeDays, setDateRangeDays] = useState<DateRangeOption>(30);

  // Modals
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCareModal, setShowCareModal] = useState(false);

  // Raw persisted records
  const [todayCheckin, setTodayCheckin] = useState<CheckinResponse | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckinResponse[]>([]);
  const [studioSessions, setStudioSessions] = useState<(RecentMoment | StudioHistoryItem)[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let currentSession: any = session;
        if (!currentSession?.user && typeof window !== "undefined") {
          const athenaToken = localStorage.getItem("athena_auth_token");
          if (athenaToken) {
            const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i)?.[1] || "yvmqdlqpfuirapznbmrj";
            const rawStored = localStorage.getItem(`sb-${projectRef}-auth-token`) || localStorage.getItem("sb-yvmqdlqpfuirapznbmrj-auth-token");
            if (rawStored) {
              try {
                currentSession = JSON.parse(rawStored);
              } catch {}
            }
          }
        }

        if (!currentSession?.user) {
          router.replace("/login");
          return;
        }

        if (!active) return;
        setUser(currentSession.user);

        const token = currentSession.access_token;
        const d = new Date();
        const clientDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        initOfflineSyncListener((events) => syncOfflineEvents(events, token));

        // Fast parallel fetch across full history for mature users
        const [
          profRes,
          todayRes,
          historyRes,
          studioRes,
          recentMomentsRes,
          journalsRes,
          convsRes,
        ] = await Promise.allSettled([
          fetchUserProfile(token),
          fetchTodayCheckin(token, clientDate),
          fetchCheckinHistory(35, token),
          fetchStudioHistory(30),
          fetchRecentMoments(8, token),
          fetchJournalEntries("", token, 20),
          fetchUserConversations(token),
        ]);

        if (!active) return;

        if (profRes.status === "fulfilled" && profRes.value) {
          if (profRes.value.onboarding_completed === false) {
            router.replace("/onboarding");
            return;
          }
          setProfile(profRes.value);
        }

        if (todayRes.status === "fulfilled" && todayRes.value?.has_checkin && todayRes.value.checkin) {
          setTodayCheckin(todayRes.value.checkin);
        }

        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value)) {
          setCheckinHistory(historyRes.value);
        }

        // Combine Studio history & recent moments cleanly
        const combinedPractices: (RecentMoment | StudioHistoryItem)[] = [];
        if (studioRes.status === "fulfilled" && studioRes.value?.sessions) {
          combinedPractices.push(...studioRes.value.sessions);
        }
        if (recentMomentsRes.status === "fulfilled" && Array.isArray(recentMomentsRes.value)) {
          recentMomentsRes.value.forEach((m) => {
            if (!combinedPractices.some((p) => p.id === m.id)) {
              combinedPractices.push(m);
            }
          });
        }
        setStudioSessions(combinedPractices);

        if (journalsRes.status === "fulfilled" && Array.isArray(journalsRes.value)) {
          setRecentJournals(journalsRes.value);
        }

        if (convsRes.status === "fulfilled" && Array.isArray(convsRes.value)) {
          setConversations(convsRes.value);
        }

        setAuthLoading(false);
      } catch (err) {
        console.error("[Dashboard Load Error]:", err);
        if (active) router.replace("/login");
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  // Handle successful check-in
  const handleCheckinComplete = useCallback((checkin: CheckinResponse) => {
    setTodayCheckin(checkin);
    setShowCheckinModal(false);
    setCheckinHistory((prev) => {
      const filtered = prev.filter((c) => c.date !== checkin.date);
      return [checkin, ...filtered];
    });
  }, []);

  // Effective today's checkin
  const effectiveTodayCheckin = useMemo<CheckinResponse | null>(() => {
    if (todayCheckIn && todayCheckIn.completed) {
      return {
        id: "today-checkin",
        user_id: user?.id || "user",
        date: todayCheckIn.timestamp,
        mood: todayCheckIn.mood,
        energy_level: todayCheckIn.energy,
        stress_level: todayCheckIn.stress || 2,
        reflection_text: todayCheckIn.notes || null,
        ai_reflection: todayCheckIn.reflection || null,
        created_at: todayCheckIn.timestamp,
      };
    }
    return todayCheckin;
  }, [todayCheckIn, todayCheckin, user?.id]);

  // Combined verified checkin list (history + today)
  const allCheckins = useMemo(() => {
    const list = [...checkinHistory];
    if (effectiveTodayCheckin) {
      const todayDs = (effectiveTodayCheckin.date || effectiveTodayCheckin.created_at || "").slice(0, 10);
      const exists = list.some((c) => (c.date || c.created_at || "").slice(0, 10) === todayDs);
      if (!exists) list.push(effectiveTodayCheckin);
    }
    return list;
  }, [checkinHistory, effectiveTodayCheckin]);

  // Calculate user total history span for adaptive date range controls
  const availableRanges = useMemo<DateRangeOption[]>(() => {
    const timestamps: number[] = [];
    allCheckins.forEach((c) => {
      const ds = c.date || c.created_at;
      if (ds) timestamps.push(new Date(ds).getTime());
    });
    recentJournals.forEach((j) => {
      if (j.created_at) timestamps.push(new Date(j.created_at).getTime());
    });
    studioSessions.forEach((p) => {
      const tVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (tVal) timestamps.push(new Date(tVal).getTime());
    });

    if (timestamps.length === 0) return [7, 30];
    const earliest = Math.min(...timestamps);
    const spanDays = Math.ceil((Date.now() - earliest) / 86400000);

    if (spanDays < 20) return [7, 30];
    if (spanDays < 75) return [7, 30, 90];
    if (spanDays < 160) return [7, 30, 90, 180];
    return [7, 30, 90, 180, 365];
  }, [allCheckins, recentJournals, studioSessions]);

  // Current Date range bounds strictly in Asia/Kolkata
  const dateRangeBounds = useMemo(() => {
    return getZonedDateRange(dateRangeDays, ATHENA_DEFAULT_TIMEZONE);
  }, [dateRangeDays]);

  // Previous Date range bounds [start - dateRangeDays, start - 1 day]
  const previousDateRangeBounds = useMemo(() => {
    const curStart = new Date(dateRangeBounds.startDateStr + "T00:00:00");
    const prevEnd = new Date(curStart);
    prevEnd.setDate(curStart.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - (dateRangeDays - 1));
    return {
      startDateStr: toLocalDateString(prevStart),
      endDateStr: toLocalDateString(prevEnd),
    };
  }, [dateRangeBounds.startDateStr, dateRangeDays]);

  // Filter current period datasets
  const filteredCheckins = useMemo(() => {
    return allCheckins.filter((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      return ds >= dateRangeBounds.startDateStr && ds <= dateRangeBounds.endDateStr;
    });
  }, [allCheckins, dateRangeBounds]);

  const filteredJournals = useMemo(() => {
    return recentJournals.filter((j) => {
      if (!j.created_at) return false;
      const ds = toLocalDateString(j.created_at);
      return ds >= dateRangeBounds.startDateStr && ds <= dateRangeBounds.endDateStr;
    });
  }, [recentJournals, dateRangeBounds]);

  const filteredPractices = useMemo(() => {
    return studioSessions.filter((p) => {
      const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (!timeVal) return false;
      const ds = toLocalDateString(timeVal);
      return ds >= dateRangeBounds.startDateStr && ds <= dateRangeBounds.endDateStr;
    });
  }, [studioSessions, dateRangeBounds]);

  const totalPracticeMinutes = useMemo(() => {
    const totalSecs = filteredPractices.reduce(
      (acc, p) => acc + Number(p.duration_seconds || (p as any).actual_duration || 0),
      0
    );
    return Math.round(totalSecs / 60);
  }, [filteredPractices]);

  // Filter previous period datasets
  const previousCheckins = useMemo(() => {
    return allCheckins.filter((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      return ds >= previousDateRangeBounds.startDateStr && ds <= previousDateRangeBounds.endDateStr;
    });
  }, [allCheckins, previousDateRangeBounds]);

  const previousJournals = useMemo(() => {
    return recentJournals.filter((j) => {
      if (!j.created_at) return false;
      const ds = toLocalDateString(j.created_at);
      return ds >= previousDateRangeBounds.startDateStr && ds <= previousDateRangeBounds.endDateStr;
    });
  }, [recentJournals, previousDateRangeBounds]);

  const previousPractices = useMemo(() => {
    return studioSessions.filter((p) => {
      const timeVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      if (!timeVal) return false;
      const ds = toLocalDateString(timeVal);
      return ds >= previousDateRangeBounds.startDateStr && ds <= previousDateRangeBounds.endDateStr;
    });
  }, [studioSessions, previousDateRangeBounds]);

  const previousPracticeMinutes = useMemo(() => {
    const totalSecs = previousPractices.reduce(
      (acc, p) => acc + Number(p.duration_seconds || (p as any).actual_duration || 0),
      0
    );
    return Math.round(totalSecs / 60);
  }, [previousPractices]);

  // Active days in window
  const activeDaysInWindow = useMemo(() => {
    const days = new Set<string>();
    filteredCheckins.forEach((c) => days.add(toLocalDateString(c.date || c.created_at)));
    filteredJournals.forEach((j) => days.add(toLocalDateString(j.created_at)));
    filteredPractices.forEach((p) => {
      const tVal = (p as any).completed_at || (p as any).started_at || (p as any).created_at;
      days.add(toLocalDateString(tVal));
    });
    return days.size;
  }, [filteredCheckins, filteredJournals, filteredPractices]);

  // Calculate honest unbroken streak
  const streak = useMemo(() => {
    return calculateActualStreak(allCheckins, effectiveTodayCheckin);
  }, [allCheckins, effectiveTodayCheckin]);

  // Timezone-aware Greeting with real display name
  const timeParts = useMemo(() => getZonedTimeParts(new Date(), ATHENA_DEFAULT_TIMEZONE), []);
  const greeting = useMemo(() => {
    if (timeParts.timeOfDay === "Morning") return t("greeting_morning", "Good morning");
    if (timeParts.timeOfDay === "Afternoon") return t("greeting_afternoon", "Good afternoon");
    if (timeParts.timeOfDay === "Evening") return t("greeting_evening", "Good evening");
    return t("greeting_night", "Good evening");
  }, [timeParts.timeOfDay, t]);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "friend";

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#060814] text-[#F8F7FF]">
        <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-[#B8BDD6]/70">
            <div className="w-6 h-6 rounded-full border-2 border-[#7C5CFF]/30 border-t-[#7C5CFF] animate-spin" />
            <span>Opening your sanctuary...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col selection:bg-[#7C5CFF]/30 transition-colors duration-300 ${
        isLight
          ? "bg-[#F8F7F4] text-[#18181B]"
          : "bg-[#060814] text-[#F8F7FF]"
      }`}
    >
      {!isLight && (
        <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
      )}

      {/* 1. Global Translucent Sanctuary Navigation */}
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      {/* 2. Main Analytics Command Center */}
      <main className="relative z-10 flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-16 space-y-5 sm:space-y-6">
        {/* Top Area: Greeting + Contextual Subtitle + Time Range Control */}
        <header data-tour="home-overview" className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-4 border-inherit">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] font-mono">
                {t("nav_dashboard", "Dashboard")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium tracking-tight text-[var(--text-primary)]">
              {greeting}, {displayName}.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {t("dashboard_hero_sub", "Here's your Athena rhythm lately · Clear, grounded personal analytics")}
            </p>
          </div>

          {/* Action Row: Check in button & Time Range Controls */}
          <div data-tour="daily-checkin" className="flex flex-wrap items-center gap-3">
            {todayCheckin ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs">
                <CheckCircle2 size={14} />
                <span>{t("home_checked_in_today", "Checked in today")}</span>
                <span className="opacity-40">•</span>
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(true)}
                  className="underline hover:text-[var(--text-primary)] transition cursor-pointer"
                >
                  {t("btn_edit", "Edit")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCheckinModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_4px_16px_rgba(110,79,230,0.28)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t("home_checkin", "Check in")}</span>
                <ArrowRight size={13} />
              </button>
            )}

            {/* Time Range Selector: 7D, 30D, 90D, 6M, 1Y */}
            <div className="flex items-center rounded-xl p-1 border border-[var(--border)] bg-[var(--surface-muted)] text-xs shadow-xs">
              {availableRanges.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDateRangeDays(days)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    dateRangeDays === days
                      ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                      : isLight
                      ? "text-[#524E5E] hover:text-[#1C1917] hover:bg-black/5"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {days === 180 ? "6M" : days === 365 ? "1Y" : `${days}D`}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isDemoMode && (
          <aside
            aria-label="Demo Exploration Banner"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent text-xs text-amber-200"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>
                <strong className="font-semibold text-amber-300">
                  {t("demo_explore_banner_title", "Demo Exploration Mode")}:
                </strong>{" "}
                {t(
                  "demo_explore_banner_sub",
                  "You are exploring the sample journey dataset. All modules are open for read-only exploration."
                )}
              </span>
            </div>
            <Link
              href="/signup"
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-violet-600 hover:from-[#6b4ce6] text-white font-semibold text-xs shadow-sm transition hover:scale-[1.01]"
            >
              {t("demo_limit_create_account", "Create Your Athena Account")}
            </Link>
          </aside>
        )}

        {/* Section 3: Sophisticated KPI Strip with Sparklines & Previous-Period Comparison */}
        <DashboardSummaryRow
          currentCheckins={filteredCheckins}
          previousCheckins={previousCheckins}
          currentJournals={filteredJournals}
          previousJournals={previousJournals}
          currentPractices={filteredPractices}
          previousPractices={previousPractices}
          currentPracticeMinutes={totalPracticeMinutes}
          previousPracticeMinutes={previousPracticeMinutes}
          activeDays={activeDaysInWindow}
          totalWindowDays={dateRangeDays}
          currentStreak={streak}
          isLight={isLight}
        />

        {/* Section 4: Main Hero Chart — Energy & Stress Over Time (1-5 Scale) */}
        <DashboardMoodTrendChart
          checkins={filteredCheckins}
          dateRangeDays={dateRangeDays}
          allDates={dateRangeBounds.allDates}
          isLight={isLight}
          onOpenCheckinModal={() => setShowCheckinModal(true)}
        />

        {/* Section 5: Weekly Activity Analytics */}
        <DashboardWeeklyActivityChart
          checkins={filteredCheckins}
          journals={filteredJournals}
          practices={filteredPractices}
          dateRangeDays={dateRangeDays}
          isLight={isLight}
        />

        {/* Section 6: Active-Day Rhythm Heatmap ("Your Athena Rhythm") */}
        <DashboardRhythmTimeline
          checkins={allCheckins}
          journals={recentJournals}
          practices={studioSessions}
          dateRangeDays={dateRangeDays}
          allDates={dateRangeBounds.allDates}
          isLight={isLight}
        />

        {/* Two-Column Grid: Section 7 Practice Mix & Section 8 Reflection Rhythm */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          <div className="lg:col-span-6 flex flex-col">
            <DashboardPracticeTimeChart
              practices={filteredPractices}
              isLight={isLight}
            />
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <DashboardReflectionRhythm
              journals={filteredJournals}
              dateRangeDays={dateRangeDays}
              isLight={isLight}
            />
          </div>
        </div>

        {/* Section 9: Something Athena Noticed (One Evidence-Based Observation) */}
        <DashboardAthenaNoticed
          checkins={filteredCheckins}
          practices={filteredPractices}
          journals={filteredJournals}
          isLight={isLight}
        />

        {/* Section 10: Chronological Activity Timeline & "What Changed?" Comparison */}
        <DashboardRecentAndQuickLook
          currentCheckins={filteredCheckins}
          previousCheckins={previousCheckins}
          currentJournals={filteredJournals}
          previousJournals={previousJournals}
          currentPractices={filteredPractices}
          previousPractices={previousPractices}
          dateRangeDays={dateRangeDays}
          isLight={isLight}
        />

        {/* Section 11: Replays Section (In-tab routing to Weekly & Monthly stories) */}
        <DashboardReplaysSection isLight={isLight} />

        {/* Section 12: Continue Your Journey */}
        <DashboardContinueJourney isLight={isLight} />
      </main>

      {/* Daily Check-in Modal */}
      {user && (
        <DailyCheckInModal
          isOpen={showCheckinModal}
          userId={user.id}
          onComplete={handleCheckinComplete}
        />
      )}

      {/* Care Center Modal */}
      <CrisisModal
        isOpen={showCareModal}
        onClose={() => setShowCareModal(false)}
      />
    </div>
  );
}