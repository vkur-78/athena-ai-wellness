"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchCheckinHistory,
  fetchStudioHistory,
  fetchRecentMoments,
  fetchJournalEntries,
  fetchCurrentMonthlyReflection,
} from "@/lib/api";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment, StudioHistoryItem, StudioSession } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { MonthlyReflection } from "@/types/reflection";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Wind,
  BookOpen,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Compass,
  Download,
  Loader2,
  FileText,
  Check,
} from "lucide-react";
import AthenaMonthSelector, { formatLocalizedMonthKey } from "@/components/replay/AthenaMonthSelector";

function MonthlyReplayContent() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<CheckinResponse[]>([]);
  const [studioSessions, setStudioSessions] = useState<any[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [reflection, setReflection] = useState<MonthlyReflection | null>(null);

  // Month selector state: YYYY-MM
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function loadMonthlyData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/login");
          return;
        }

        const token = session.access_token;
        const [historyRes, studioRes, momentsRes, journalsRes, reflRes] =
          await Promise.allSettled([
            fetchCheckinHistory(1000, token),
            fetchStudioHistory(1000),
            fetchRecentMoments(20, token),
            fetchJournalEntries("", token, 1000),
            fetchCurrentMonthlyReflection(token),
          ]);

        if (!active) return;

        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value)) {
          setCheckins(historyRes.value);
        }

        const combinedPractices: (RecentMoment | StudioHistoryItem)[] = [];
        if (studioRes.status === "fulfilled" && studioRes.value?.sessions) {
          combinedPractices.push(...studioRes.value.sessions);
        }
        if (momentsRes.status === "fulfilled" && Array.isArray(momentsRes.value)) {
          momentsRes.value.forEach((m) => {
            if (!combinedPractices.some((p) => p.id === m.id)) {
              combinedPractices.push(m);
            }
          });
        }
        setStudioSessions(combinedPractices);

        if (journalsRes.status === "fulfilled" && Array.isArray(journalsRes.value)) {
          setJournals(journalsRes.value);
        }
        if (reflRes.status === "fulfilled" && reflRes.value) {
          setReflection(reflRes.value);
        }

        setLoading(false);
      } catch (err) {
        console.warn("Could not load monthly replay data:", err);
        if (active) setLoading(false);
      }
    }

    loadMonthlyData();
    return () => {
      active = false;
    };
  }, [router]);

  // Discover all months available in user records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    checkins.forEach((c) => {
      const d = (c.date || c.created_at || "").slice(0, 7);
      if (d) set.add(d);
    });
    journals.forEach((j) => {
      const d = (j.date || j.created_at || "").slice(0, 7);
      if (d) set.add(d);
    });
    studioSessions.forEach((s) => {
      const d = (s.created_at || s.started_at || "").slice(0, 7);
      if (d) set.add(d);
    });

    const list = Array.from(set).sort().reverse();
    return list;
  }, [checkins, journals, studioSessions]);

  // Default to the most recent month with activity, or current calendar month
  const activeMonth = useMemo(() => {
    if (selectedMonthKey) return selectedMonthKey;
    if (availableMonths.length > 0) return availableMonths[0];
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [selectedMonthKey, availableMonths]);

  // Previous month key for comparison
  const previousMonth = useMemo(() => {
    const [yStr, mStr] = activeMonth.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const prevDate = new Date(y, m - 2, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  }, [activeMonth]);

  // Format month name (e.g., "SEPTEMBER 2026")
  const activeMonthLabel = useMemo(() => {
    return formatLocalizedMonthKey(activeMonth, language).toUpperCase();
  }, [activeMonth, language]);

  // Days in active month
  const daysInActiveMonth = useMemo(() => {
    const [yStr, mStr] = activeMonth.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const lastDay = new Date(y, m, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const dayNum = i + 1;
      return `${activeMonth}-${String(dayNum).padStart(2, "0")}`;
    });
  }, [activeMonth]);

  // Active month records
  const monthCheckins = useMemo(() => {
    return checkins.filter((c) => (c.date || c.created_at || "").startsWith(activeMonth));
  }, [checkins, activeMonth]);

  const monthJournals = useMemo(() => {
    return journals.filter((j) => (j.date || j.created_at || "").startsWith(activeMonth));
  }, [journals, activeMonth]);

  const monthSessions = useMemo(() => {
    return studioSessions.filter((s) => (s.created_at || s.started_at || "").startsWith(activeMonth));
  }, [studioSessions, activeMonth]);

  const monthMinutes = useMemo(() => {
    return monthSessions.reduce((acc, s) => {
      const sec = s.duration_seconds || (s.duration_minutes ? s.duration_minutes * 60 : 300);
      return acc + Math.round(sec / 60);
    }, 0);
  }, [monthSessions]);

  // Previous month records (for comparison)
  const prevMonthCheckins = useMemo(() => {
    return checkins.filter((c) => (c.date || c.created_at || "").startsWith(previousMonth));
  }, [checkins, previousMonth]);

  const prevMonthJournals = useMemo(() => {
    return journals.filter((j) => (j.date || j.created_at || "").startsWith(previousMonth));
  }, [journals, previousMonth]);

  const prevMonthSessions = useMemo(() => {
    return studioSessions.filter((s) => (s.created_at || s.started_at || "").startsWith(previousMonth));
  }, [studioSessions, previousMonth]);

  const prevMonthMinutes = useMemo(() => {
    return prevMonthSessions.reduce((acc, s) => {
      const sec = s.duration_seconds || (s.duration_minutes ? s.duration_minutes * 60 : 300);
      return acc + Math.round(sec / 60);
    }, 0);
  }, [prevMonthSessions]);

  // Practice Mix Breakdown
  const practiceMix = useMemo(() => {
    const map = new Map<string, { count: number; minutes: number }>();
    monthSessions.forEach((s) => {
      const cat = s.category || "Mindfulness";
      const min = Math.round((s.duration_seconds || 300) / 60);
      const curr = map.get(cat) || { count: 0, minutes: 0 };
      map.set(cat, { count: curr.count + 1, minutes: curr.minutes + min });
    });

    const totalMin = Math.max(monthMinutes, 1);
    return Array.from(map.entries())
      .map(([name, val]) => ({
        name,
        count: val.count,
        minutes: val.minutes,
        pct: Math.round((val.minutes / totalMin) * 100),
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [monthSessions, monthMinutes]);

  // Monthly Highlights (Evidence-based)
  const highlights = useMemo(() => {
    // 1. Most active week (group days into 7-day chunks)
    let bestWeekLabel = "";
    let bestWeekCount = 0;
    let bestWeekDetails = { checkins: 0, journals: 0, sessions: 0 };

    const weeks = [
      { start: 1, end: 7, label: "Days 1–7" },
      { start: 8, end: 14, label: "Days 8–14" },
      { start: 15, end: 21, label: "Days 15–21" },
      { start: 22, end: 31, label: "Days 22–End" },
    ];

    weeks.forEach((w) => {
      const wCheckins = monthCheckins.filter((c) => {
        const d = parseInt((c.date || c.created_at || "").slice(8, 10), 10);
        return d >= w.start && d <= w.end;
      }).length;
      const wJournals = monthJournals.filter((j) => {
        const d = parseInt((j.date || j.created_at || "").slice(8, 10), 10);
        return d >= w.start && d <= w.end;
      }).length;
      const wSessions = monthSessions.filter((s) => {
        const d = parseInt((s.created_at || s.started_at || "").slice(8, 10), 10);
        return d >= w.start && d <= w.end;
      }).length;

      const total = wCheckins + wJournals + wSessions;
      if (total > bestWeekCount) {
        bestWeekCount = total;
        bestWeekLabel = `${w.label} of ${activeMonthLabel.split(" ")[0]}`;
        bestWeekDetails = { checkins: wCheckins, journals: wJournals, sessions: wSessions };
      }
    });

    // 2. Most used practice
    const topPractice = practiceMix.length > 0 ? practiceMix[0] : null;

    // 3. Quietest period (consecutive days without recorded checkin, journal or session)
    const activeDaySet = new Set<string>();
    monthCheckins.forEach((c) => activeDaySet.add((c.date || c.created_at || "").slice(0, 10)));
    monthJournals.forEach((j) => activeDaySet.add((j.date || j.created_at || "").slice(0, 10)));
    monthSessions.forEach((s) => activeDaySet.add((s.created_at || s.started_at || "").slice(0, 10)));

    let longestQuietSpan = 0;
    let quietSpanRange = "";
    let currentSpan = 0;
    let currentSpanStart = 1;

    daysInActiveMonth.forEach((dStr, idx) => {
      const dayNum = idx + 1;
      if (!activeDaySet.has(dStr)) {
        if (currentSpan === 0) currentSpanStart = dayNum;
        currentSpan += 1;
        if (currentSpan > longestQuietSpan) {
          longestQuietSpan = currentSpan;
          const monthShort = activeMonthLabel.split(" ")[0].slice(0, 3);
          quietSpanRange = `${monthShort} ${currentSpanStart}–${dayNum}`;
        }
      } else {
        currentSpan = 0;
      }
    });

    return {
      bestWeek: bestWeekCount > 0 ? { label: bestWeekLabel, ...bestWeekDetails } : null,
      topPractice,
      quietPeriod: longestQuietSpan >= 2 ? { range: quietSpanRange, days: longestQuietSpan } : null,
    };
  }, [
    monthCheckins,
    monthJournals,
    monthSessions,
    practiceMix,
    daysInActiveMonth,
    activeMonthLabel,
  ]);

  // "One Thing To Take With You" (Evidence-backed observation derived strictly from month data)
  const oneThingInsight = useMemo(() => {
    // Check if evening practice was prevalent
    const eveningSessions = monthSessions.filter((s) => {
      const h = new Date(s.created_at || s.started_at).getHours();
      return h >= 18 || h < 4;
    });

    if (eveningSessions.length >= 3 && practiceMix.length > 0) {
      return {
        quote: `You returned to ${practiceMix[0].name.toLowerCase()} more consistently this month, especially during evening hours.`,
        basis: `Based on ${eveningSessions.length} evening practice sessions in ${activeMonthLabel.split(" ")[0]}.`,
      };
    }

    if (monthJournals.length >= 4) {
      const totalWords = monthJournals.reduce(
        (acc, j) => acc + (j.content || "").trim().split(/\s+/).filter(Boolean).length,
        0
      );
      return {
        quote: "You gave yourself dedicated room to put complex thoughts into written words this month.",
        basis: `Based on ${monthJournals.length} reflections comprising ${totalWords.toLocaleString()} total words.`,
      };
    }

    if (monthCheckins.length >= 7) {
      return {
        quote: "Your rhythm of tuning into your physical and emotional state provided a steady anchor across the weeks.",
        basis: `Based on ${monthCheckins.length} recorded daily check-ins.`,
      };
    }

    return {
      quote: "Every intentional moment of presence is a step in understanding your personal rhythm.",
      basis: `Recorded across your active days in ${activeMonthLabel.split(" ")[0]}.`,
    };
  }, [monthSessions, practiceMix, monthJournals, monthCheckins, activeMonthLabel]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-sanctuary-bg text-sanctuary-text">
        <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-sanctuary-muted">
            <div className="w-7 h-7 rounded-full border-2 border-sanctuary-primary/30 border-t-sanctuary-primary animate-spin" />
            <span>Composing your personal monthly story...</span>
          </div>
        </div>
      </div>
    );
  }

  const isNewUser =
    monthCheckins.length === 0 && monthJournals.length === 0 && monthSessions.length === 0;

  const handleDownloadPdf = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    setPdfError(null);
    setPdfSuccess(false);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token =
        session?.access_token ||
        (typeof window !== "undefined" && localStorage.getItem("athena_demo_mode") === "true"
          ? localStorage.getItem("athena_demo_token") || ""
          : (typeof window !== "undefined" ? localStorage.getItem("athena_auth_token") || "" : ""));

      const res = await fetch(`/api/replay/monthly/pdf?month=${activeMonth}&lang=${language}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`PDF generation returned HTTP ${res.status}`);
      }

      // Read sanitized filename from Content-Disposition header if available
      let filename = `Athena-Sanctuary-Report-${activeMonth.replace("-", "_")}.pdf`;
      const disposition = res.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err: any) {
      console.error("[Download Monthly PDF Error]:", err);
      setPdfError(t("replay_pdf_failed", "Download failed — click to retry"));
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-sanctuary-bg text-sanctuary-text selection:bg-sanctuary-primary/20 transition-colors duration-300">
      <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      <main data-tour="monthly-replay" className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-sanctuary-border/30 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-sanctuary-primary">
              {t("nav_monthly_replay", "Monthly Replay")}
            </span>
            <span className="text-sanctuary-border opacity-40">•</span>
            <Link
              href="/replay/weekly"
              className="inline-flex items-center gap-1.5 text-xs text-sanctuary-muted hover:text-sanctuary-text transition-colors"
            >
              <Sparkles size={12} className="text-sanctuary-primary" />
              <span>{t("replay_switch_to_weekly", "Weekly Story")}</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Proper Athena-styled Popover Month Selector */}
            {availableMonths.length > 0 && (
              <AthenaMonthSelector
                availableMonths={availableMonths}
                activeMonth={activeMonth}
                onMonthChange={(m) => setSelectedMonthKey(m)}
              />
            )}

            {/* Download Sanctuary PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition cursor-pointer select-none ${
                pdfGenerating
                  ? "bg-sanctuary-primary/10 border-sanctuary-primary/30 text-sanctuary-primary cursor-wait"
                  : pdfSuccess
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-sanctuary-surface border-sanctuary-border/60 hover:bg-sanctuary-surface-hover hover:border-sanctuary-primary/40 text-sanctuary-text active:scale-95"
              }`}
              title={t("replay_download_monthly_pdf", "Download Sanctuary PDF")}
              aria-label={t("replay_download_monthly_pdf", "Download Sanctuary PDF")}
            >
              {pdfGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin text-sanctuary-primary" />
                  <span>{t("replay_pdf_generating", "Preparing your Sanctuary Report...")}</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span>{t("replay_pdf_ready", "Sanctuary Report Ready")}</span>
                </>
              ) : (
                <>
                  <Download size={13} className="text-sanctuary-primary" />
                  <span>{t("replay_download_monthly_pdf", "Download Sanctuary PDF")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
            <span>{pdfError}</span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="underline font-semibold hover:text-rose-200 cursor-pointer ml-3"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Spotify-Style Hero Story Opening */}
        <section className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-sanctuary-primary/10 text-sanctuary-primary border border-sanctuary-primary/30">
            <Sparkles size={12} />
            <span>{t("nav_monthly_replay", "Monthly Replay")}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-light text-sanctuary-text tracking-tight uppercase">
            {t("replay_your_month_title", "YOUR MONTH WITH ATHENA")}
            <span className="block text-sanctuary-primary font-normal mt-1 text-xl sm:text-3xl lg:text-4xl font-sans">
              {activeMonthLabel}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-sanctuary-muted max-w-lg mx-auto font-light">
            {t("replay_your_month_sub", "A broader look at your rhythm, turning points, and sanctuary growth.")}
          </p>

          {/* 4 Large Spotify-Style Hero Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4 max-w-3xl mx-auto">
            <div className="bg-sanctuary-surface/90 border border-sanctuary-border/40 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-xs">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-400">
                {monthCheckins.length}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-sanctuary-muted mt-0.5 font-medium">
                {t("kpi_checkins", "Check-ins")}
              </div>
            </div>

            <div className="bg-sanctuary-surface/90 border border-sanctuary-border/40 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-xs">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-indigo-400">
                {monthJournals.length}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-sanctuary-muted mt-0.5 font-medium">
                {t("kpi_journals", "Journals")}
              </div>
            </div>

            <div className="bg-sanctuary-surface/90 border border-sanctuary-border/40 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-xs">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-400">
                {monthSessions.length}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-sanctuary-muted mt-0.5 font-medium">
                {t("kpi_practice", "Practice")}
              </div>
            </div>

            <div className="bg-sanctuary-surface/90 border border-sanctuary-border/40 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-xs">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-teal-400">
                {monthMinutes}m
              </div>
              <div className="text-[11px] uppercase tracking-wider text-sanctuary-muted mt-0.5 font-medium">
                {t("chart_minutes", "Minutes")}
              </div>
            </div>
          </div>
        </section>

        {isNewUser ? (
          <div className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-8 text-center max-w-md mx-auto space-y-3">
            <p className="text-sm text-sanctuary-muted">
              No activity recorded for {activeMonthLabel.split(" ")[0]}. As you check in, reflect, and complete Studio sessions, your personal monthly keepsakes will be created here.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 2. Chapter: YOUR RHYTHM (Activity Calendar Timeline) */}
            <section className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
                    Chapter I
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif text-sanctuary-text font-medium mt-0.5">
                    Your Rhythm Across {activeMonthLabel.split(" ")[0]}
                  </h2>
                </div>
                <span className="text-xs text-sanctuary-muted font-mono">
                  {daysInActiveMonth.length} Days
                </span>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2 pt-2">
                {daysInActiveMonth.map((dStr, idx) => {
                  const dayNum = idx + 1;
                  const cCount = monthCheckins.filter((c) =>
                    (c.date || c.created_at || "").startsWith(dStr)
                  ).length;
                  const jCount = monthJournals.filter((j) =>
                    (j.date || j.created_at || "").startsWith(dStr)
                  ).length;
                  const sCount = monthSessions.filter((s) =>
                    (s.created_at || s.started_at || "").startsWith(dStr)
                  ).length;
                  const total = cCount + jCount + sCount;

                  return (
                    <div
                      key={dStr}
                      className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        total > 0
                          ? "bg-sanctuary-primary/10 border-sanctuary-primary/40 shadow-xs"
                          : "bg-sanctuary-bg/40 border-sanctuary-border/20 opacity-50"
                      }`}
                    >
                      <span className="text-xs font-semibold text-sanctuary-text">{dayNum}</span>
                      <div className="flex gap-0.5 mt-1.5">
                        {cCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {jCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                        {sCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>

                      {/* Tooltip */}
                      <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col z-20 bg-sanctuary-surface border border-sanctuary-border rounded-lg p-2 shadow-lg text-[10px] whitespace-nowrap">
                        <span className="font-semibold text-sanctuary-text">{dStr}</span>
                        <span>Check-ins: {cCount}</span>
                        <span>Journals: {jCount}</span>
                        <span>Practices: {sCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 text-xs text-sanctuary-muted mt-4 pt-4 border-t border-sanctuary-border/20">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Check-in
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" /> Reflection
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Practice
                </span>
              </div>
            </section>

            {/* 3. Chapter: YOUR ENERGY & STRESS (Trend Lines) */}
            <section className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
                    Chapter II
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif text-sanctuary-text font-medium mt-0.5">
                    {t("chart_energy_stress_title", "Energy & Stress Flow")}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> {t("chart_energy", "Energy")}
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-purple-400" /> {t("chart_stress", "Stress")}
                  </span>
                </div>
              </div>

              {/* Sparkline / Step Bars across the Month */}
              <div className="relative pt-4 pb-2">
                <div className="grid gap-1 sm:gap-2 items-end h-36" style={{ gridTemplateColumns: `repeat(${daysInActiveMonth.length}, minmax(0, 1fr))` }}>
                  {daysInActiveMonth.map((dStr, idx) => {
                    const c = monthCheckins.find((rec) =>
                      (rec.date || rec.created_at || "").startsWith(dStr)
                    );
                    const eRaw = (c as any)?.energy ?? c?.energy_level;
                    const sRaw = (c as any)?.stress ?? c?.stress_level;
                    const eVal = typeof eRaw === "number" ? Math.max(1, Math.min(5, eRaw)) : null;
                    const sVal = typeof sRaw === "number" ? Math.max(1, Math.min(5, sRaw)) : null;

                    return (
                      <div
                        key={dStr}
                        className="group relative flex flex-col justify-end items-center h-full"
                      >
                        {/* Energy Bar */}
                        {eVal !== null && (
                          <div
                            className="w-1.5 bg-amber-400/80 rounded-t-sm"
                            style={{ height: `${(eVal / 5) * 100}%` }}
                          />
                        )}
                        {/* Stress indicator pip */}
                        {sVal !== null && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1"
                            title={`Stress: ${sVal}/5`}
                          />
                        )}

                        {/* Tooltip */}
                        {c && (
                          <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col z-20 bg-sanctuary-surface border border-sanctuary-border rounded-lg p-2 shadow-lg text-[10px] whitespace-nowrap">
                            <span className="font-semibold text-sanctuary-text">{dStr}</span>
                            <span>Energy: {eVal ?? "—"}/5</span>
                            <span>Stress: {sVal ?? "—"}/5</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 4. Chapter: YOUR PRACTICE MIX */}
            <section className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
              <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
                Chapter III
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-sanctuary-text font-medium mt-0.5 mb-6">
                Your Practice Mix
              </h2>

              {practiceMix.length === 0 ? (
                <p className="text-xs text-sanctuary-muted">No Studio sessions logged this month.</p>
              ) : (
                <div className="space-y-4">
                  {practiceMix.map((p) => (
                    <div key={p.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-sanctuary-text">{p.name}</span>
                        <span className="text-sanctuary-muted">
                          {p.count} session{p.count === 1 ? "" : "s"} · {p.minutes} min ({p.pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-sanctuary-bg/70 rounded-full overflow-hidden border border-sanctuary-border/30">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. MONTHLY HIGHLIGHTS (Spotify-Style "Your Most..." Moments) */}
            <section className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
              <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
                Chapter IV
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-sanctuary-text font-medium mt-0.5 mb-6">
                Monthly Highlights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Most Active Week */}
                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30 space-y-2">
                  <div className="text-[10px] uppercase font-semibold text-sanctuary-primary tracking-wider">
                    Most Active Period
                  </div>
                  <div className="text-base font-serif font-medium text-sanctuary-text">
                    {highlights.bestWeek ? highlights.bestWeek.label : "Even Distribution"}
                  </div>
                  {highlights.bestWeek && (
                    <div className="text-xs text-sanctuary-muted">
                      {highlights.bestWeek.checkins} check-ins · {highlights.bestWeek.journals} journals · {highlights.bestWeek.sessions} practices
                    </div>
                  )}
                </div>

                {/* Most Used Practice */}
                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30 space-y-2">
                  <div className="text-[10px] uppercase font-semibold text-teal-400 tracking-wider">
                    Most Used Practice
                  </div>
                  <div className="text-base font-serif font-medium text-sanctuary-text">
                    {highlights.topPractice ? highlights.topPractice.name : "None logged"}
                  </div>
                  {highlights.topPractice && (
                    <div className="text-xs text-sanctuary-muted">
                      {highlights.topPractice.count} sessions · {highlights.topPractice.minutes} minutes
                    </div>
                  )}
                </div>

                {/* Quiet Period */}
                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30 space-y-2">
                  <div className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                    Quietest Period
                  </div>
                  <div className="text-base font-serif font-medium text-sanctuary-text">
                    {highlights.quietPeriod ? highlights.quietPeriod.range : "Daily Continuity"}
                  </div>
                  <div className="text-xs text-sanctuary-muted">
                    {highlights.quietPeriod
                      ? `${highlights.quietPeriod.days} consecutive resting days`
                      : "Regular activity maintained throughout"}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Chapter: THIS MONTH vs LAST MONTH */}
            <section className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
              <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
                Chapter V
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-sanctuary-text font-medium mt-0.5 mb-6">
                Month-Over-Month Comparison
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30">
                  <span className="text-[11px] text-sanctuary-muted uppercase font-semibold">Check-ins</span>
                  <div className="text-xl font-bold font-mono text-sanctuary-text mt-1 flex items-center gap-1.5">
                    <span>{monthCheckins.length}</span>
                    <span className="text-xs font-normal text-sanctuary-muted font-sans">
                      vs {prevMonthCheckins.length}
                    </span>
                    {monthCheckins.length > prevMonthCheckins.length ? (
                      <ArrowUpRight size={14} className="text-emerald-400" />
                    ) : monthCheckins.length < prevMonthCheckins.length ? (
                      <ArrowDownRight size={14} className="text-sanctuary-muted" />
                    ) : (
                      <Minus size={14} className="text-sanctuary-muted" />
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30">
                  <span className="text-[11px] text-sanctuary-muted uppercase font-semibold">Reflections</span>
                  <div className="text-xl font-bold font-mono text-sanctuary-text mt-1 flex items-center gap-1.5">
                    <span>{monthJournals.length}</span>
                    <span className="text-xs font-normal text-sanctuary-muted font-sans">
                      vs {prevMonthJournals.length}
                    </span>
                    {monthJournals.length > prevMonthJournals.length ? (
                      <ArrowUpRight size={14} className="text-emerald-400" />
                    ) : monthJournals.length < prevMonthJournals.length ? (
                      <ArrowDownRight size={14} className="text-sanctuary-muted" />
                    ) : (
                      <Minus size={14} className="text-sanctuary-muted" />
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30">
                  <span className="text-[11px] text-sanctuary-muted uppercase font-semibold">Practices</span>
                  <div className="text-xl font-bold font-mono text-sanctuary-text mt-1 flex items-center gap-1.5">
                    <span>{monthSessions.length}</span>
                    <span className="text-xs font-normal text-sanctuary-muted font-sans">
                      vs {prevMonthSessions.length}
                    </span>
                    {monthSessions.length > prevMonthSessions.length ? (
                      <ArrowUpRight size={14} className="text-emerald-400" />
                    ) : monthSessions.length < prevMonthSessions.length ? (
                      <ArrowDownRight size={14} className="text-sanctuary-muted" />
                    ) : (
                      <Minus size={14} className="text-sanctuary-muted" />
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sanctuary-bg/50 border border-sanctuary-border/30">
                  <span className="text-[11px] text-sanctuary-muted uppercase font-semibold">Practice Time</span>
                  <div className="text-xl font-bold font-mono text-sanctuary-text mt-1 flex items-center gap-1.5">
                    <span>{monthMinutes}m</span>
                    <span className="text-xs font-normal text-sanctuary-muted font-sans">
                      vs {prevMonthMinutes}m
                    </span>
                    {monthMinutes > prevMonthMinutes ? (
                      <ArrowUpRight size={14} className="text-emerald-400" />
                    ) : monthMinutes < prevMonthMinutes ? (
                      <ArrowDownRight size={14} className="text-sanctuary-muted" />
                    ) : (
                      <Minus size={14} className="text-sanctuary-muted" />
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Final Reflection: ONE THING TO TAKE WITH YOU */}
            <section className="bg-gradient-to-br from-sanctuary-surface to-sanctuary-surface/80 border border-sanctuary-primary/30 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-sanctuary-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-sanctuary-primary/10 text-sanctuary-primary border border-sanctuary-primary/20">
                  One Thing to Take With You
                </div>

                <blockquote className="text-xl sm:text-2xl font-serif font-light text-sanctuary-text leading-relaxed">
                  "{oneThingInsight.quote}"
                </blockquote>

                <div className="text-xs text-sanctuary-muted italic pt-2">
                  {oneThingInsight.basis}
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  );
}

export default function MonthlyReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sanctuary-bg text-sanctuary-text">
          <div className="w-8 h-8 rounded-full border-2 border-sanctuary-primary/30 border-t-sanctuary-primary animate-spin" />
        </div>
      }
    >
      <MonthlyReplayContent />
    </Suspense>
  );
}
