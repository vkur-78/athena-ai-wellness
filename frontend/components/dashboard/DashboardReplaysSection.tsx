"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardReplaysSectionProps {
  isLight?: boolean;
}

export default function DashboardReplaysSection({ isLight = false }: DashboardReplaysSectionProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Compute current local week and month date labels
  const now = new Date();
  
  // Weekly range (Monday to Sunday)
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShortDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weeklyDateStr = `${formatShortDate(monday)} — ${formatShortDate(sunday)}`;

  // Monthly range
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthlyDateStr = `${formatShortDate(firstDayOfMonth)} — ${formatShortDate(lastDayOfMonth)}`;

  return (
    <section className="space-y-4 pt-2" aria-label="Athena Replays">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 border-b pb-3 border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#BFAEFF]">
            <Sparkles size={14} className="text-[#7C5CFF]" />
            <span>{t("home_your_replays", "YOUR REPLAYS")}</span>
          </div>
          <p
            className={`text-xs sm:text-sm mt-0.5 ${
              isLight ? "text-stone-600" : "text-[#B8BDD6]/80"
            }`}
          >
            {t("home_replays_sub", "Look back at the moments you created with Athena.")}
          </p>
        </div>
      </div>

      {/* Replay Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Weekly Replay */}
        <Link
          href="/replay/weekly"
          className={`group relative p-6 sm:p-7 rounded-[26px] border backdrop-blur-2xl transition-all duration-300 cursor-pointer overflow-hidden block ${
            isLight
              ? "bg-white border-[rgba(124,92,255,0.13)] hover:border-[#6E4FE6]/60 shadow-[0_4px_24px_-4px_rgba(28,25,23,0.05),0_1px_3px_rgba(124,92,255,0.03)] hover:shadow-[0_12px_36px_rgba(110,79,230,0.14)]"
              : "sanctuary-glass border-[#7C5CFF]/20 hover:border-[#7C5CFF]/70 hover:shadow-[0_16px_40px_rgba(124,92,255,0.22)] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          } hover:-translate-y-1`}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className={`absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
            isLight
              ? "bg-[radial-gradient(ellipse_at_center,rgba(110,79,230,0.12),transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_center,rgba(124,92,255,0.25),transparent_70%)]"
          }`} />

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[170px]">
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${
                isLight
                  ? "bg-[#6E4FE6]/10 text-[#603FE0] border-[#6E4FE6]/25"
                  : "bg-[#7C5CFF]/15 text-[#BFAEFF] border-[#7C5CFF]/30"
              }`}>
                <Calendar size={12} />
                <span>{t("home_weekly_replay", "WEEKLY REPLAY")}</span>
              </div>

              <h3
                className={`text-xl sm:text-2xl font-serif font-normal tracking-tight transition-colors ${
                  isLight ? "text-[#1C1917] group-hover:text-[#6E4FE6]" : "text-[#F8F7FF] group-hover:text-[#D5C7FF]"
                }`}
              >
                {t("home_weekly_replay_sub", "Your week with Athena")}
              </h3>

              <p className={`text-xs font-mono tracking-wide ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                {weeklyDateStr}
              </p>
            </div>

            <div
              className={`pt-4 flex items-center gap-2 text-xs font-semibold transition-colors ${
                isLight ? "text-[#6E4FE6] group-hover:text-[#5D3FD3]" : "text-[#BFAEFF] group-hover:text-white"
              }`}
            >
              <span>{t("home_view_week", "View your week →")}</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1.5 duration-200" />
            </div>
          </div>
        </Link>

        {/* Card 2: Monthly Replay */}
        <Link
          href="/replay/monthly"
          className={`group relative p-6 sm:p-7 rounded-[26px] border backdrop-blur-2xl transition-all duration-300 cursor-pointer overflow-hidden block ${
            isLight
              ? "bg-white border-[rgba(99,102,241,0.14)] hover:border-indigo-500/60 shadow-[0_4px_24px_-4px_rgba(28,25,23,0.05),0_1px_3px_rgba(99,102,241,0.03)] hover:shadow-[0_12px_36px_rgba(99,102,241,0.14)]"
              : "sanctuary-glass border-indigo-500/20 hover:border-indigo-400/70 hover:shadow-[0_16px_40px_rgba(99,102,241,0.22)] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          } hover:-translate-y-1`}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className={`absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
            isLight
              ? "bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25),transparent_70%)]"
          }`} />

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[170px]">
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${
                isLight
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 border border-indigo-500/30"
              }`}>
                <Sparkles size={12} />
                <span>{t("home_monthly_replay", "MONTHLY REPLAY")}</span>
              </div>

              <h3
                className={`text-xl sm:text-2xl font-serif font-normal tracking-tight transition-colors ${
                  isLight ? "text-[#1C1917] group-hover:text-indigo-700" : "text-[#F8F7FF] group-hover:text-indigo-200"
                }`}
              >
                {t("home_monthly_replay_sub", `Your ${monthName}`)}
              </h3>

              <p className={`text-xs font-mono tracking-wide ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/70"}`}>
                {monthlyDateStr}
              </p>
            </div>

            <div
              className={`pt-4 flex items-center gap-2 text-xs font-semibold transition-colors ${
                isLight ? "text-indigo-700 group-hover:text-indigo-900" : "text-indigo-300 group-hover:text-white"
              }`}
            >
              <span>{t("home_view_month", "View your month →")}</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1.5 duration-200" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
