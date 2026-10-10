"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTheme } from "@/context/ThemeContext";
import { useTodayCheckIn } from "@/context/CheckInContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEntitlement } from "@/context/EntitlementContext";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import {
  fetchTodayCheckin,
  fetchCheckinHistory,
  fetchStudioHistory,
  fetchRecentMoments,
  fetchJournalEntries,
} from "@/lib/api";
import { CheckinResponse, CheckInRecord } from "@/types/checkin";
import { RecentMoment, StudioHistoryItem, StudioSession } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import {
  getZonedDateRange,
  toLocalDateString,
  ATHENA_DEFAULT_TIMEZONE,
} from "@/lib/timezone";

// Upgraded Analytical Workspace Components
import InsightsHeroCard from "@/components/insights/InsightsHeroCard";
import InsightsTrendAnalysis from "@/components/insights/InsightsTrendAnalysis";
import InsightsMonthlyMatrix from "@/components/insights/InsightsMonthlyMatrix";
import InsightsCalendarHeatmap from "@/components/insights/InsightsCalendarHeatmap";
import InsightsPracticeBreakdown from "@/components/insights/InsightsPracticeBreakdown";
import InsightsJournalAnalytics from "@/components/insights/InsightsJournalAnalytics";
import { InsightsLongitudinalJourney } from "@/components/insights/InsightsLongitudinalJourney";
import { InsightsPatternDiscovery } from "@/components/insights/InsightsPatternDiscovery";

type InsightsTimeRange = "30D" | "90D" | "6M" | "1Y" | "ALL";

export default function InsightsPage() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();
  const { todayCheckIn } = useTodayCheckIn();
  const { t } = useLanguage();
  const { isDemoMode } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Time Filter State
  const [timeRange, setTimeRange] = useState<InsightsTimeRange>("ALL");

  // Power BI Drill-Down States
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedPracticeCategory, setSelectedPracticeCategory] = useState<string | null>(null);

  // Raw Data from Backend (Full 24-month horizon)
  const [todayCheckin, setTodayCheckin] = useState<CheckinResponse | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckinResponse[]>([]);
  const [studioSessions, setStudioSessions] = useState<(RecentMoment | StudioHistoryItem)[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Load Data
  useEffect(() => {
    let active = true;

    async function loadInsightsData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        if (!active) return;
        setUser(session.user);

        const token = session.access_token;
        const d = new Date();
        const clientDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const [todayRes, historyRes, studioRes, recentMomentsRes, journalsRes] =
          await Promise.allSettled([
            fetchTodayCheckin(token, clientDate),
            fetchCheckinHistory(500, token),
            fetchStudioHistory(300),
            fetchRecentMoments(20, token),
            fetchJournalEntries("", token, 300),
          ]);

        if (!active) return;

        if (todayRes.status === "fulfilled" && todayRes.value?.has_checkin && todayRes.value.checkin) {
          setTodayCheckin(todayRes.value.checkin);
        }
        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value)) {
          setCheckinHistory(historyRes.value);
        }

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
          setJournalEntries(journalsRes.value);
        }

        setLoading(false);
      } catch (err) {
        console.error("[Insights Load Error]:", err);
        if (active) setLoading(false);
      }
    }

    loadInsightsData();

    return () => {
      active = false;
    };
  }, [router]);

  // Normalize check-ins into standardized CheckInRecord[]
  const allCheckinRecords = useMemo<CheckInRecord[]>(() => {
    const list: CheckInRecord[] = [];
    const dateSet = new Set<string>();

    if (todayCheckIn && todayCheckIn.completed) {
      const todayDs = (todayCheckIn.timestamp || new Date().toISOString()).slice(0, 10);
      list.push({
        id: "today-live",
        checkin_date: todayDs,
        energy: todayCheckIn.energy,
        stress: todayCheckIn.stress,
        notes: todayCheckIn.notes,
        created_at: todayCheckIn.timestamp,
      });
      dateSet.add(todayDs);
    } else if (todayCheckin) {
      const todayDs = (todayCheckin.date || todayCheckin.created_at || "").slice(0, 10);
      if (todayDs) {
        list.push({
          id: todayCheckin.id || "today-saved",
          checkin_date: todayDs,
          energy: todayCheckin.energy_level,
          stress: todayCheckin.stress_level,
          notes: todayCheckin.reflection_text,
          created_at: todayCheckin.created_at,
        });
        dateSet.add(todayDs);
      }
    }

    checkinHistory.forEach((c) => {
      const ds = (c.date || c.created_at || "").slice(0, 10);
      if (ds && !dateSet.has(ds)) {
        dateSet.add(ds);
        list.push({
          id: c.id,
          checkin_date: ds,
          energy: c.energy_level,
          stress: c.stress_level,
          notes: c.reflection_text,
          created_at: c.created_at,
        });
      }
    });

    return list.sort((a, b) => (b.checkin_date || "").localeCompare(a.checkin_date || ""));
  }, [todayCheckIn, todayCheckin, checkinHistory]);

  // Normalize Studio Sessions into standardized StudioSession[]
  const allStudioSessions = useMemo<StudioSession[]>(() => {
    return studioSessions.map((s: any) => ({
      id: s.id,
      user_id: user?.id || "",
      category: s.category || s.practice_type || "Mindfulness",
      technique: s.technique || s.practice_name || s.title || "Session",
      duration_seconds: s.duration_seconds || (s.duration_minutes ? s.duration_minutes * 60 : 300),
      duration_minutes: s.duration_minutes || (s.duration_seconds ? Math.round(s.duration_seconds / 60) : 5),
      created_at: s.created_at || s.started_at || s.completed_at || new Date().toISOString(),
      started_at: s.started_at || s.created_at,
      completed_at: s.completed_at,
    }));
  }, [studioSessions, user?.id]);

  // Cutoff dates for timeRange
  const rangeCutoffDateStr = useMemo(() => {
    if (timeRange === "ALL") return "2020-01-01";
    const now = new Date();
    let days = 30;
    if (timeRange === "90D") days = 90;
    if (timeRange === "6M") days = 180;
    if (timeRange === "1Y") days = 365;

    const target = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return target.toISOString().split("T")[0];
  }, [timeRange]);

  // Sliced data based on timeRange AND optional Power BI drill-down (selectedMonth)
  const scopedCheckins = useMemo(() => {
    return allCheckinRecords.filter((c) => {
      const ds = c.checkin_date || "";
      if (selectedMonth) {
        return ds.startsWith(selectedMonth);
      }
      return ds >= rangeCutoffDateStr;
    });
  }, [allCheckinRecords, rangeCutoffDateStr, selectedMonth]);

  const scopedJournals = useMemo(() => {
    return journalEntries.filter((j) => {
      const ds = (j.date || j.created_at || "").slice(0, 10);
      if (selectedMonth) {
        return ds.startsWith(selectedMonth);
      }
      return ds >= rangeCutoffDateStr;
    });
  }, [journalEntries, rangeCutoffDateStr, selectedMonth]);

  const scopedSessions = useMemo(() => {
    return allStudioSessions.filter((s) => {
      const ds = (s.created_at || s.started_at || "").slice(0, 10);
      const matchesMonth = selectedMonth ? ds.startsWith(selectedMonth) : ds >= rangeCutoffDateStr;
      if (!matchesMonth) return false;
      if (selectedPracticeCategory) {
        return (s.category || "").toLowerCase() === selectedPracticeCategory.toLowerCase();
      }
      return true;
    });
  }, [allStudioSessions, rangeCutoffDateStr, selectedMonth, selectedPracticeCategory]);

  // Calculate periods supported by actual data (Hook executed unconditionally)
  const availableTimeRanges = useMemo<InsightsTimeRange[]>(() => {
    const timestamps: number[] = [];
    allCheckinRecords.forEach((c) => {
      if (c.checkin_date) timestamps.push(new Date(c.checkin_date).getTime());
    });
    journalEntries.forEach((j) => {
      const t = j.date || j.created_at;
      if (t) timestamps.push(new Date(t).getTime());
    });
    allStudioSessions.forEach((s) => {
      const t = s.created_at || s.started_at;
      if (t) timestamps.push(new Date(t).getTime());
    });

    if (timestamps.length === 0) return ["30D", "ALL"];
    const earliest = Math.min(...timestamps);
    const spanDays = Math.ceil((Date.now() - earliest) / (1000 * 60 * 60 * 24));

    if (spanDays < 45) return ["30D", "ALL"];
    if (spanDays < 120) return ["30D", "90D", "ALL"];
    if (spanDays < 250) return ["30D", "90D", "6M", "ALL"];
    return ["30D", "90D", "6M", "1Y", "ALL"];
  }, [allCheckinRecords, journalEntries, allStudioSessions]);

  const isNewUser = allCheckinRecords.length < 2 && allStudioSessions.length < 2 && journalEntries.length < 2;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-sanctuary-bg text-sanctuary-text">
        <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-sanctuary-muted">
            <div className="w-7 h-7 rounded-full border-2 border-sanctuary-primary/30 border-t-sanctuary-primary animate-spin" />
            <span>Assembling your personal analytics workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex flex-col bg-sanctuary-bg text-sanctuary-text`}>
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      <main data-tour="insights-overview" className="relative z-10 flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 animate-athena-fade">
        {/* Workspace Top Header & Time Filter Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sanctuary-border/40 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-sanctuary-primary shadow-sm shadow-sanctuary-primary/50"></span>
              <span className="text-[11px] uppercase tracking-widest font-semibold text-sanctuary-primary">
                {t("nav_patterns", "Your Patterns")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-light text-sanctuary-text mt-0.5">
              {t("insights_hero_title", "Your patterns, over time.")}
            </h1>
            <p className="text-xs sm:text-sm text-sanctuary-muted mt-0.5 max-w-2xl">
              {t("insights_hero_sub", "See what your own history reveals — gently, clearly, and without judgment.")}
            </p>
          </div>

          {/* Time Filter Controls - Only allow periods supported by actual data */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-sanctuary-surface/80 p-1 rounded-xl border border-sanctuary-border/40 shadow-xs text-xs">
              {availableTimeRanges.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setTimeRange(r);
                    setSelectedMonth(null); // Reset month drill-down when range changes
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    timeRange === r && !selectedMonth
                      ? "bg-sanctuary-primary text-white shadow-xs font-semibold"
                      : "text-sanctuary-muted hover:text-sanctuary-text"
                  }`}
                >
                  {r === "ALL" ? "All Time" : r}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isDemoMode && (
          <aside
            aria-label="Demo Insights Exploration Notice"
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

        {/* Drill-down Active Banner (Power BI Style) */}
        {(selectedMonth || selectedPracticeCategory) && (
          <div className="bg-sanctuary-primary/10 border border-sanctuary-primary/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-sanctuary-text animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sanctuary-primary animate-pulse" />
              <span>
                <strong>Drill-down active:</strong> Filtering analytics to{" "}
                {selectedMonth && (
                  <span className="font-semibold text-sanctuary-primary mr-1">
                    Month {selectedMonth}
                  </span>
                )}
                {selectedPracticeCategory && (
                  <span className="font-semibold text-teal-400">
                    Category: {selectedPracticeCategory}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(null);
                setSelectedPracticeCategory(null);
              }}
              className="text-xs font-medium underline text-sanctuary-primary hover:text-sanctuary-text transition-colors"
            >
              Reset to {timeRange} Overview
            </button>
          </div>
        )}

        {isNewUser ? (
          /* Empty / New User Experience */
          <div className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sanctuary-primary/10 border border-sanctuary-primary/30 flex items-center justify-center text-2xl">
              🌿
            </div>
            <h2 className="text-xl font-serif text-sanctuary-text font-medium">
              {t("insights_empty_title", "Your patterns will appear as your history grows.")}
            </h2>
            <p className="text-xs sm:text-sm text-sanctuary-muted leading-relaxed">
              {t("insights_empty_sub", "After a few check-ins, written reflections, and Studio practices, Athena will begin visualizing longitudinal trends, energy rhythms, and practice correlations here.")}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/checkin")}
                className="px-4 py-2 rounded-xl bg-sanctuary-primary text-white text-xs font-medium shadow-sm hover:opacity-95"
              >
                Log Today's Check-in
              </button>
              <button
                type="button"
                onClick={() => router.push("/studio")}
                className="px-4 py-2 rounded-xl border border-sanctuary-border/50 text-sanctuary-text text-xs font-medium hover:bg-sanctuary-surface/80"
              >
                Explore Studio
              </button>
            </div>
          </div>
        ) : (
          /* Rich Analytical Workspace */
          <div className="space-y-8">
            {/* A. Hero Analytics Card with Storytelling & Period Comparisons */}
            <InsightsHeroCard
              timeRange={timeRange}
              selectedMonth={selectedMonth}
              checkins={scopedCheckins}
              journals={scopedJournals}
              sessions={scopedSessions}
              allCheckins={allCheckinRecords}
              allJournals={journalEntries}
              allSessions={allStudioSessions}
            />

            {/* 1. Longitudinal Journey (24-Month Stacked Timeline with 6M/1Y/2Y controls) */}
            <InsightsLongitudinalJourney
              checkins={allCheckinRecords}
              journals={journalEntries}
              sessions={allStudioSessions}
              selectedMonth={selectedMonth}
              onSelectMonth={(month) => setSelectedMonth(month)}
            />

            {/* 2. Primary Trend Analysis (Interactive Energy vs Stress with Moving Average) */}
            <InsightsTrendAnalysis checkins={scopedCheckins} />

            {/* 3. Monthly Drill-down Matrix & Practice Performance Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Monthly Comparison Table with Click-to-Drill */}
              <div className="lg:col-span-7">
                <InsightsMonthlyMatrix
                  checkins={allCheckinRecords}
                  journals={journalEntries}
                  sessions={allStudioSessions}
                  selectedMonth={selectedMonth}
                  onSelectMonth={(month) => setSelectedMonth(month)}
                />
              </div>

              {/* Practice Breakdown & Distribution */}
              <div className="lg:col-span-5">
                <InsightsPracticeBreakdown
                  sessions={scopedSessions}
                  onFilterCategory={(cat) =>
                    setSelectedPracticeCategory(cat === selectedPracticeCategory ? null : cat)
                  }
                  activeCategory={selectedPracticeCategory}
                />
              </div>
            </div>

            {/* 4. Large Interactive Calendar Heatmap with Day Popover */}
            <InsightsCalendarHeatmap
              checkins={scopedCheckins}
              journals={scopedJournals}
              sessions={scopedSessions}
            />

            {/* 5. Reflection Depth & Journaling Analytics */}
            <InsightsJournalAnalytics
              journals={scopedJournals}
              checkins={scopedCheckins}
            />

            {/* 6. Empirical Pattern Discovery (Real Statistical Correlations with Sample Sizes) */}
            <InsightsPatternDiscovery
              checkins={allCheckinRecords}
              journals={journalEntries}
              sessions={allStudioSessions}
            />
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  );
}
