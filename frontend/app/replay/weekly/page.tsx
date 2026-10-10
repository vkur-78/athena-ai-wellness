"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchCheckinHistory,
  fetchRecentMoments,
  fetchStudioHistory,
  fetchJournalEntries,
  fetchUserConversations,
  fetchTodayCheckin,
} from "@/lib/api";
import { CheckinResponse } from "@/types/checkin";
import { RecentMoment, StudioHistoryItem } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wind,
  BookOpen,
  Calendar,
  CheckCircle2,
  Compass,
  Download,
  Loader2,
  Check,
} from "lucide-react";

/**
 * Calculates calendar week boundaries (Monday to Sunday) in Asia/Kolkata timezone.
 * offsetWeeks: 0 = current week, -1 = last week, -2 = 2 weeks ago, etc.
 */
function getKolkataWeekBounds(offsetWeeks: number = 0) {
  const now = new Date();
  // Format current date in IST
  const istDateStr = now.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istDateStr);

  const day = istDate.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(istDate);
  monday.setDate(istDate.getDate() - diffToMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayStr}`;
  };

  const mondayStr = formatYMD(monday);
  const sundayStr = formatYMD(sunday);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = `${monthNames[monday.getMonth()]} ${String(monday.getDate()).padStart(2, "0")} – ${monthNames[sunday.getMonth()]} ${String(sunday.getDate()).padStart(2, "0")}, ${sunday.getFullYear()}`;

  return { monday, sunday, mondayStr, sundayStr, label };
}

function WeeklyReplayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [offsetWeeks, setOffsetWeeks] = useState<number>(() => {
    const p = searchParams.get("offset");
    return p !== null && !isNaN(Number(p)) ? Number(p) : 0;
  });

  // Stored Historical Data
  const [checkins, setCheckins] = useState<CheckinResponse[]>([]);
  const [practices, setPractices] = useState<(RecentMoment | StudioHistoryItem)[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Active Tooltip on Energy & Stress
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  // PDF Export State
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;
    try {
      setDownloadingPdf(true);
      setPdfError(null);
      setPdfSuccess(false);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token =
        session?.access_token ||
        (typeof window !== "undefined" && localStorage.getItem("athena_demo_mode") === "true"
          ? localStorage.getItem("athena_demo_token") || ""
          : (typeof window !== "undefined" ? localStorage.getItem("athena_auth_token") || "" : ""));

      const res = await fetch(
        `/api/replay/pdf?type=weekly&lang=${language}&period=${encodeURIComponent(weekBounds.mondayStr)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error(`PDF generation returned status ${res.status}`);
      }

      let filename = `Athena-Sanctuary-Report-Weekly-${weekBounds.mondayStr}.pdf`;
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
      window.URL.revokeObjectURL(url);
      a.remove();

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err: any) {
      console.error("Failed to download weekly PDF:", err);
      setPdfError(err?.message || "Could not generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        const token = session.access_token;
        const [cRes, mRes, sRes, jRes, convRes, tRes] = await Promise.allSettled([
          fetchCheckinHistory(1000, token),
          fetchRecentMoments(20, token),
          fetchStudioHistory(1000),
          fetchJournalEntries("", token, 1000),
          fetchUserConversations(token),
          fetchTodayCheckin(token),
        ]);

        if (!active) return;

        let allC: CheckinResponse[] = [];
        if (cRes.status === "fulfilled" && Array.isArray(cRes.value)) {
          allC = [...cRes.value];
        }
        if (tRes.status === "fulfilled" && tRes.value?.checkin) {
          const tCheckin = tRes.value.checkin;
          const tDate = toLocalDateString(tCheckin.date || tCheckin.created_at);
          if (!allC.some((c) => toLocalDateString(c.date || c.created_at) === tDate)) {
            allC.push(tCheckin);
          }
        }
        setCheckins(allC);

        const allPractices: (RecentMoment | StudioHistoryItem)[] = [];
        if (sRes.status === "fulfilled" && sRes.value?.sessions) {
          allPractices.push(...sRes.value.sessions);
        }
        if (mRes.status === "fulfilled" && Array.isArray(mRes.value)) {
          mRes.value.forEach((m) => {
            if (!allPractices.some((p) => p.id === m.id)) {
              allPractices.push(m);
            }
          });
        }
        setPractices(allPractices);

        if (jRes.status === "fulfilled" && Array.isArray(jRes.value)) {
          setJournals(jRes.value);
        }
        if (convRes.status === "fulfilled" && Array.isArray(convRes.value)) {
          setConversations(convRes.value);
        }
      } catch (err) {
        console.error("Failed to load weekly replay data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [router]);

  // Current Target Week Bounds
  const weekBounds = useMemo(() => getKolkataWeekBounds(offsetWeeks), [offsetWeeks]);

  const handlePrevWeek = () => {
    setOffsetWeeks((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    if (offsetWeeks < 0) {
      setOffsetWeeks((prev) => prev + 1);
    }
  };

  // Filter Data strictly for the selected calendar week
  const weekCheckins = useMemo(() => {
    return checkins.filter((c) => {
      const ds = toLocalDateString(c.date || c.created_at);
      return ds >= weekBounds.mondayStr && ds <= weekBounds.sundayStr;
    });
  }, [checkins, weekBounds]);

  const weekPractices = useMemo(() => {
    return practices.filter((p: any) => {
      const ds = toLocalDateString(p.created_at || p.completed_at || p.started_at);
      return ds >= weekBounds.mondayStr && ds <= weekBounds.sundayStr;
    });
  }, [practices, weekBounds]);

  const weekJournals = useMemo(() => {
    return journals.filter((j) => {
      const ds = toLocalDateString(j.date || j.created_at);
      return ds >= weekBounds.mondayStr && ds <= weekBounds.sundayStr;
    });
  }, [journals, weekBounds]);

  const weekConversations = useMemo(() => {
    return conversations.filter((c) => {
      const ds = toLocalDateString(c.updated_at || c.created_at);
      return ds >= weekBounds.mondayStr && ds <= weekBounds.sundayStr;
    });
  }, [conversations, weekBounds]);

  // Aggregate Metrics for this week
  const activeDaysSet = useMemo(() => {
    const s = new Set<string>();
    weekCheckins.forEach((c) => s.add(toLocalDateString(c.date || c.created_at)));
    weekPractices.forEach((p: any) => s.add(toLocalDateString(p.created_at || p.completed_at || p.started_at)));
    weekJournals.forEach((j) => s.add(toLocalDateString(j.date || j.created_at)));
    weekConversations.forEach((c) => s.add(toLocalDateString(c.updated_at || c.created_at)));
    return s;
  }, [weekCheckins, weekPractices, weekJournals, weekConversations]);

  const totalPracticeMinutes = useMemo(() => {
    return weekPractices.reduce((acc, p: any) => {
      const sec = p.duration_seconds || (p.duration_minutes ? p.duration_minutes * 60 : 300);
      return acc + Math.round(sec / 60);
    }, 0);
  }, [weekPractices]);

  const practiceCategoryBreakdown = useMemo(() => {
    const cats: Record<string, { count: number; minutes: number }> = {};
    weekPractices.forEach((p: any) => {
      const raw = p.exercise_category || p.category || "Mindfulness";
      const cat = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      const sec = p.duration_seconds || (p.duration_minutes ? p.duration_minutes * 60 : 300);
      const mins = Math.round(sec / 60);
      if (!cats[cat]) cats[cat] = { count: 0, minutes: 0 };
      cats[cat].count += 1;
      cats[cat].minutes += mins;
    });
    return Object.entries(cats).sort((a, b) => b[1].minutes - a[1].minutes);
  }, [weekPractices]);

  const totalJournalWords = useMemo(() => {
    return weekJournals.reduce((acc, j) => {
      const rawWc = (j as any).word_count;
      if (typeof rawWc === "number") return acc + rawWc;
      const text = `${j.title || ""} ${j.content || ""}`.trim();
      return acc + (text ? text.split(/\s+/).filter(Boolean).length : 0);
    }, 0);
  }, [weekJournals]);

  // Construct 7 Days Sequence for Rhythm & Chart (Mon to Sun)
  const dayNames = [
    { key: "common_mon", fallback: "Mon" },
    { key: "common_tue", fallback: "Tue" },
    { key: "common_wed", fallback: "Wed" },
    { key: "common_thu", fallback: "Thu" },
    { key: "common_fri", fallback: "Fri" },
    { key: "common_sat", fallback: "Sat" },
    { key: "common_sun", fallback: "Sun" },
  ];

  const daysTimeline = useMemo(() => {
    const [y, m, d] = weekBounds.mondayStr.split("-").map(Number);
    const monDate = new Date(y, m - 1, d);

    return dayNames.map((dObj, idx) => {
      const curDate = new Date(monDate);
      curDate.setDate(monDate.getDate() + idx);
      const ds = toLocalDateString(curDate);

      const dayCheckin = weekCheckins.find(
        (c) => toLocalDateString(c.date || c.created_at) === ds
      );
      const dayPractices = weekPractices.filter(
        (p: any) => toLocalDateString(p.created_at || p.completed_at || p.started_at) === ds
      );
      const dayJournals = weekJournals.filter(
        (j) => toLocalDateString(j.date || j.created_at) === ds
      );

      const energyRaw = dayCheckin
        ? Number((dayCheckin as any).energy ?? dayCheckin.energy_level ?? 3)
        : null;
      const stressRaw = dayCheckin
        ? Number((dayCheckin as any).stress ?? dayCheckin.stress_level ?? 3)
        : null;

      return {
        idx,
        dayName: t(dObj.key, dObj.fallback),
        dateStr: ds,
        displayDate: `${curDate.getDate()} ${curDate.toLocaleDateString("en-US", { month: "short" })}`,
        hasCheckin: Boolean(dayCheckin),
        energy: energyRaw !== null ? Math.max(1, Math.min(5, energyRaw)) : null,
        stress: stressRaw !== null ? Math.max(1, Math.min(5, stressRaw)) : null,
        mood: dayCheckin?.mood || null,
        reflectionText: dayCheckin?.reflection_text || dayCheckin?.ai_reflection || null,
        practicesCount: dayPractices.length,
        journalsCount: dayJournals.length,
        hasActivity: Boolean(dayCheckin || dayPractices.length > 0 || dayJournals.length > 0),
      };
    });
  }, [weekBounds.mondayStr, weekCheckins, weekPractices, weekJournals, t]);

  // SVG Chart Geometry for Energy & Stress across 7 Days
  const svgWidth = 720;
  const svgHeight = 220;
  const padding = { top: 24, right: 36, bottom: 36, left: 44 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const chartPoints = useMemo(() => {
    const xStep = chartW / 6;
    return daysTimeline.map((item, idx) => {
      const x = padding.left + idx * xStep;
      const energyY =
        item.energy !== null ? padding.top + (5 - item.energy) * (chartH / 4) : null;
      const stressY =
        item.stress !== null ? padding.top + (5 - item.stress) * (chartH / 4) : null;

      return {
        ...item,
        x,
        energyY,
        stressY,
      };
    });
  }, [daysTimeline, chartW, chartH, padding.left, padding.top]);

  // Construct SVG paths with breaks on missing days
  const { energyPath, stressPath } = useMemo(() => {
    function buildSegments(getY: (p: typeof chartPoints[0]) => number | null) {
      const segs: string[] = [];
      let currentSeg: { x: number; y: number }[] = [];

      chartPoints.forEach((p) => {
        const y = getY(p);
        if (y !== null) {
          currentSeg.push({ x: p.x, y });
        } else {
          if (currentSeg.length > 0) {
            segs.push(pathToSvg(currentSeg));
            currentSeg = [];
          }
        }
      });
      if (currentSeg.length > 0) {
        segs.push(pathToSvg(currentSeg));
      }
      return segs.join(" ");
    }

    function pathToSvg(points: { x: number; y: number }[]) {
      if (points.length === 0) return "";
      if (points.length === 1) return `M ${points[0].x - 1} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
      return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, "");
    }

    return {
      energyPath: buildSegments((p) => p.energyY),
      stressPath: buildSegments((p) => p.stressY),
    };
  }, [chartPoints]);

  // Synthesize evidence-backed Athena Noticed takeaway
  const noticedInsight = useMemo(() => {
    if (activeDaysSet.size === 0) return null;

    if (totalPracticeMinutes >= 20 && weekPractices.length >= 2) {
      const topCat = practiceCategoryBreakdown[0]?.[0] || "Breathing";
      return {
        title: t("replay_takeaway_title", "ONE THING ATHENA NOTICED"),
        text: `You dedicated ${totalPracticeMinutes} minutes across ${weekPractices.length} sessions this week, with a consistent preference for ${topCat}. Your presence appeared especially intentional during transition periods.`,
        evidence: t("replay_evidence_tag", "Evidence: {count} recorded events", {
          count: weekPractices.length,
        }),
      };
    }

    if (weekCheckins.length >= 3) {
      const avgEnergy = (
        weekCheckins.reduce(
          (acc, c) => acc + Number((c as any).energy ?? c.energy_level ?? 3),
          0
        ) / weekCheckins.length
      ).toFixed(1);
      return {
        title: t("replay_takeaway_title", "ONE THING ATHENA NOTICED"),
        text: `You checked in ${weekCheckins.length} times throughout this week, recording an average energy level of ${avgEnergy} / 5. Consistent daily awareness helped anchor your nervous system baseline.`,
        evidence: t("replay_evidence_tag", "Evidence: {count} recorded events", {
          count: weekCheckins.length,
        }),
      };
    }

    if (weekJournals.length >= 1) {
      return {
        title: t("replay_takeaway_title", "ONE THING ATHENA NOTICED"),
        text: `You put thoughts into written words ${weekJournals.length} times this week (${totalJournalWords} words). Writing in Space coincided with periods of emotional clarification.`,
        evidence: t("replay_evidence_tag", "Evidence: {count} recorded events", {
          count: weekJournals.length,
        }),
      };
    }

    return {
      title: t("replay_takeaway_title", "ONE THING ATHENA NOTICED"),
      text: "Even during a quiet week, your moments of returning to yourself form the foundation of ongoing resilience.",
      evidence: t("replay_evidence_tag", "Evidence: {count} recorded events", {
        count: activeDaysSet.size,
      }),
    };
  }, [
    activeDaysSet.size,
    totalPracticeMinutes,
    weekPractices.length,
    practiceCategoryBreakdown,
    weekCheckins,
    weekJournals.length,
    totalJournalWords,
    t,
  ]);

  const isCurrentWeek = offsetWeeks === 0;
  const hasWeekData =
    weekCheckins.length > 0 || weekPractices.length > 0 || weekJournals.length > 0;

  if (loading) {
    return (
      <div className="relative min-h-screen w-full flex flex-col bg-[var(--sanctuary-bg-primary)] text-[var(--sanctuary-text-primary)]">
        <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-[var(--sanctuary-text-muted)]">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <span>{t("common_loading", "Loading your sanctuary retrospective...")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[var(--sanctuary-bg-primary)] text-[var(--sanctuary-text-primary)]">
      <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      <main data-tour="weekly-replay" className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-20 space-y-6 sm:space-y-8 animate-athena-fade">
        {/* TOP CONTROLS & TIMELINE NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] shadow-xs">
          {/* Week Selector Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--sanctuary-border)] hover:bg-[var(--sanctuary-surface-hover)] text-xs font-semibold text-[var(--sanctuary-text-primary)] transition cursor-pointer"
              title="View previous week"
            >
              <ChevronLeft size={14} />
              <span>{t("replay_prev_week", "← Previous Week")}</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--sanctuary-surface-elevated)] border border-[var(--sanctuary-border-strong)] text-xs font-semibold text-[var(--sanctuary-text-primary)]">
              <Calendar size={13} className="text-indigo-400" />
              <span>{weekBounds.label}</span>
              {isCurrentWeek && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                  {t("common_today", "Current")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isCurrentWeek
                  ? "opacity-35 cursor-not-allowed border-[var(--sanctuary-border)] text-[var(--sanctuary-text-muted)]"
                  : "border-[var(--sanctuary-border)] hover:bg-[var(--sanctuary-surface-hover)] text-[var(--sanctuary-text-primary)]"
              }`}
              title={isCurrentWeek ? "Future weeks cannot be viewed" : "View next week"}
            >
              <span>{t("replay_next_week", "Next Week →")}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Toggle between Weekly and Monthly Retrospective & PDF Download */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                downloadingPdf
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 cursor-wait"
                  : pdfSuccess
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200"
              }`}
              title={t("replay_download_weekly_pdf", "Download Sanctuary PDF")}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={13} className="animate-spin text-indigo-400" />
                  <span>{t("replay_pdf_generating", "Preparing your Sanctuary Report...")}</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span>{t("replay_pdf_ready", "Sanctuary Report Ready")}</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>{t("replay_download_weekly_pdf", "Download Sanctuary PDF")}</span>
                </>
              )}
            </button>

            <Link
              href="/replay"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--sanctuary-border)] hover:bg-[var(--sanctuary-surface-hover)] text-xs font-medium text-[var(--sanctuary-text-secondary)] hover:text-[var(--sanctuary-text-primary)] transition"
            >
              <Compass size={13} />
              <span>{t("replay_switch_to_monthly", "View Monthly Story")}</span>
            </Link>
          </div>
        </div>

        {pdfError && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between">
            <span>{pdfError}</span>
            <button
              onClick={handleDownloadPdf}
              className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold cursor-pointer"
            >
              {t("replay_pdf_failed", "Download failed — click to retry")}
            </button>
          </div>
        )}

        {/* HERO TITLE & HIGHLIGHT PILLS */}
        <section className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
            <Sparkles size={12} />
            <span>{t("nav_weekly_replay", "Weekly Replay")}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-light text-[var(--sanctuary-text-primary)] tracking-tight">
            {t("replay_your_week_title", "YOUR WEEK WITH ATHENA")}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sanctuary-text-muted)] max-w-xl mx-auto">
            {t("replay_your_week_sub", "A quiet retrospective of your presence, rhythm, and reflections.")}
          </p>

          {/* 5 Compact Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4 max-w-3xl mx-auto">
            <div className="p-3 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] text-center">
              <div className="text-xl font-bold font-mono text-emerald-400">{weekCheckins.length}</div>
              <div className="text-[11px] font-medium text-[var(--sanctuary-text-secondary)] mt-0.5">
                {t("kpi_checkins", "Check-ins")}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] text-center">
              <div className="text-xl font-bold font-mono text-sky-400">{weekJournals.length}</div>
              <div className="text-[11px] font-medium text-[var(--sanctuary-text-secondary)] mt-0.5">
                {t("kpi_journals", "Journals")}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] text-center">
              <div className="text-xl font-bold font-mono text-purple-400">{weekPractices.length}</div>
              <div className="text-[11px] font-medium text-[var(--sanctuary-text-secondary)] mt-0.5">
                {t("kpi_practice", "Practice")}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] text-center">
              <div className="text-xl font-bold font-mono text-amber-400">{totalPracticeMinutes}m</div>
              <div className="text-[11px] font-medium text-[var(--sanctuary-text-secondary)] mt-0.5">
                {t("chart_minutes", "Minutes")}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] text-center">
              <div className="text-xl font-bold font-mono text-indigo-300">{activeDaysSet.size} / 7</div>
              <div className="text-[11px] font-medium text-[var(--sanctuary-text-secondary)] mt-0.5">
                {t("kpi_active_days", "Active Days")}
              </div>
            </div>
          </div>
        </section>

        {/* EMPTY STATE GUARD IF ZERO ACTIVITY THIS WEEK */}
        {!hasWeekData ? (
          <div className="py-16 text-center space-y-3.5 p-8 rounded-3xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center mx-auto">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-semibold text-[var(--sanctuary-text-primary)]">
              {t("replay_empty_week_title", "Nothing recorded for this week yet.")}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--sanctuary-text-muted)] max-w-md mx-auto leading-relaxed">
              {t(
                "replay_empty_week_desc",
                "This week remained quiet. Athena is here whenever you choose to return."
              )}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/studio"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
              >
                {t("nav_studio", "Studio")}
              </Link>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl border border-[var(--sanctuary-border)] hover:bg-[var(--sanctuary-surface-hover)] text-xs font-semibold text-[var(--sanctuary-text-primary)] transition"
              >
                {t("home_checkin", "Check in")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* SECTION 1: YOUR RHYTHM (7-DAY ACTIVITY VISUALIZATION) */}
            <section className="p-5 sm:p-6 rounded-3xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[var(--sanctuary-border)] pb-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--sanctuary-text-primary)]">
                    {t("replay_your_rhythm_title", "YOUR RHYTHM")}
                  </h2>
                  <p className="text-xs text-[var(--sanctuary-text-muted)]">
                    {t(
                      "replay_your_rhythm_sub",
                      "How you engaged across daily practices and check-ins"
                    )}
                  </p>
                </div>
                <div className="text-xs text-[var(--sanctuary-text-secondary)] font-mono">
                  {activeDaysSet.size} of 7 days active
                </div>
              </div>

              {/* 7-Day Day-by-Day Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 pt-1">
                {daysTimeline.map((d) => (
                  <div
                    key={d.dateStr}
                    className={`p-3 rounded-2xl border transition-all ${
                      d.hasActivity
                        ? "border-indigo-500/30 bg-indigo-500/5"
                        : "border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface-elevated)]/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--sanctuary-text-secondary)]">
                      <span>{d.dayName}</span>
                      <span className="text-[10px] font-mono text-[var(--sanctuary-text-muted)]">
                        {d.displayDate}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {d.hasCheckin ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                          <CheckCircle2 size={11} />
                          <span>{d.mood || "Checked in"}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-[var(--sanctuary-text-muted)]">
                          {t("chart_nothing_recorded", "Nothing recorded")}
                        </div>
                      )}

                      {d.practicesCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-300 font-medium">
                          <Wind size={10} />
                          <span>
                            {d.practicesCount} {t("chart_sessions", "sessions")}
                          </span>
                        </div>
                      )}

                      {d.journalsCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-sky-300 font-medium">
                          <BookOpen size={10} />
                          <span>
                            {d.journalsCount} {t("chart_entries", "entries")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 2: ENERGY & STRESS LINE CHART */}
            <section className="p-5 sm:p-6 rounded-3xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--sanctuary-border)] pb-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--sanctuary-text-primary)]">
                    {t("chart_energy_stress_title", "ENERGY & STRESS")}
                  </h2>
                  <p className="text-xs text-[var(--sanctuary-text-muted)]">
                    {t(
                      "chart_energy_stress_sub",
                      "How your reported energy and stress have moved over time."
                    )}
                  </p>
                </div>

                {/* Series Legend */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[var(--sanctuary-text-secondary)] font-medium">
                      {t("chart_energy", "Energy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-[var(--sanctuary-text-secondary)] font-medium">
                      {t("chart_stress", "Stress")}
                    </span>
                  </div>
                </div>
              </div>

              {/* SVG 7-Day Chart */}
              <div className="relative w-full overflow-hidden pt-2">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto select-none overflow-visible"
                >
                  {/* Grid Lines Y: 5 down to 1 */}
                  {[5, 4, 3, 2, 1].map((val) => {
                    const y = padding.top + (5 - val) * (chartH / 4);
                    return (
                      <g key={val} className="opacity-40">
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + chartW}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray={val === 3 ? "none" : "2 2"}
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 3}
                          textAnchor="end"
                          className="text-[10px] font-mono fill-[var(--sanctuary-text-muted)]"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Energy Line Segment */}
                  {energyPath && (
                    <path
                      d={energyPath}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Stress Line Segment */}
                  {stressPath && (
                    <path
                      d={stressPath}
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {chartPoints.map((pt) => (
                    <g key={pt.dateStr}>
                      {pt.energyY !== null && (
                        <circle
                          cx={pt.x}
                          cy={pt.energyY}
                          r={hoveredDay?.dateStr === pt.dateStr ? 6 : 4}
                          className="fill-emerald-400 stroke-[var(--sanctuary-surface)] stroke-2 cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredDay(pt)}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      )}
                      {pt.stressY !== null && (
                        <circle
                          cx={pt.x}
                          cy={pt.stressY}
                          r={hoveredDay?.dateStr === pt.dateStr ? 6 : 4}
                          className="fill-rose-400 stroke-[var(--sanctuary-surface)] stroke-2 cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredDay(pt)}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      )}

                      {/* X-axis tick */}
                      <text
                        x={pt.x}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        className="text-[10px] font-medium fill-[var(--sanctuary-text-secondary)]"
                      >
                        {pt.dayName}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Floating Tooltip */}
                {hoveredDay && (
                  <div
                    className="absolute z-20 pointer-events-none p-2.5 rounded-xl border border-[var(--sanctuary-border-strong)] bg-[var(--sanctuary-surface-elevated)] shadow-lg text-xs space-y-1"
                    style={{
                      left: `${(hoveredDay.x / svgWidth) * 100}%`,
                      top: "20px",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="font-semibold text-[var(--sanctuary-text-primary)]">
                      {hoveredDay.dayName} ({hoveredDay.displayDate})
                    </div>
                    {hoveredDay.energy !== null && (
                      <div className="text-emerald-400 font-medium">
                        {t("chart_energy", "Energy")}: {hoveredDay.energy} / 5
                      </div>
                    )}
                    {hoveredDay.stress !== null && (
                      <div className="text-rose-400 font-medium">
                        {t("chart_stress", "Stress")}: {hoveredDay.stress} / 5
                      </div>
                    )}
                    {hoveredDay.mood && (
                      <div className="text-[var(--sanctuary-text-muted)] italic">
                        &quot;{hoveredDay.mood}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 3 & 4: PRACTICE & REFLECTION DUAL COLUMNS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Practice Breakdown */}
              <section className="p-5 sm:p-6 rounded-3xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] shadow-xs space-y-4">
                <div className="border-b border-[var(--sanctuary-border)] pb-3">
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--sanctuary-text-primary)]">
                    {t("replay_your_practice_title", "YOUR PRACTICE")}
                  </h2>
                  <p className="text-xs text-[var(--sanctuary-text-muted)]">
                    {t(
                      "replay_your_practice_sub",
                      "Sessions and minutes dedicated to somatic calm"
                    )}
                  </p>
                </div>

                {practiceCategoryBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--sanctuary-text-muted)]">
                    No studio sessions recorded this week.
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {practiceCategoryBreakdown.map(([cat, info]) => {
                      const maxMins = practiceCategoryBreakdown[0][1].minutes || 1;
                      const pct = Math.max(10, Math.round((info.minutes / maxMins) * 100));

                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[var(--sanctuary-text-primary)]">
                              {cat}
                            </span>
                            <span className="font-mono text-[var(--sanctuary-text-secondary)]">
                              {info.count} {t("chart_sessions", "sessions")} • {info.minutes}m
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--sanctuary-surface-elevated)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Reflection Rhythm */}
              <section className="p-5 sm:p-6 rounded-3xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface)] shadow-xs space-y-4">
                <div className="border-b border-[var(--sanctuary-border)] pb-3">
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--sanctuary-text-primary)]">
                    {t("replay_your_reflection_title", "YOUR REFLECTION")}
                  </h2>
                  <p className="text-xs text-[var(--sanctuary-text-muted)]">
                    {t(
                      "replay_your_reflection_sub",
                      "Thoughts given room to unfold in Space"
                    )}
                  </p>
                </div>

                {weekJournals.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--sanctuary-text-muted)]">
                    No written reflections recorded this week.
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1 max-h-56 overflow-y-auto pr-1">
                    {weekJournals.slice(0, 5).map((j, i) => (
                      <div
                        key={j.id || i}
                        className="p-3 rounded-2xl border border-[var(--sanctuary-border)] bg-[var(--sanctuary-surface-elevated)] space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-[var(--sanctuary-text-primary)]">
                          <span>{j.title || "Reflective Pause"}</span>
                          <span className="text-[10px] text-[var(--sanctuary-text-muted)] font-mono">
                            {new Date(j.created_at || (j as any).entry_date || Date.now()).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--sanctuary-text-secondary)] line-clamp-2 leading-relaxed">
                          {j.content || "A quiet entry resting safely in Space."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* SECTION 5: ONE THING ATHENA NOTICED */}
            {noticedInsight && (
              <section className="p-5 sm:p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
                    <Sparkles size={14} />
                    <span>{noticedInsight.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300/80 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {noticedInsight.evidence}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--sanctuary-text-primary)] leading-relaxed">
                  {noticedInsight.text}
                </p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function WeeklyReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--sanctuary-bg-primary)]">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      }
    >
      <WeeklyReplayContent />
    </Suspense>
  );
}
