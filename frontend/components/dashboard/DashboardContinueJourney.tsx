"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Wind, BookOpen, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardContinueJourneyProps {
  isLight?: boolean;
}

export default function DashboardContinueJourney({ isLight = false }: DashboardContinueJourneyProps) {
  const { t } = useLanguage();

  const destinations = [
    {
      id: "conversation",
      title: t("nav_conversation", "Conversation"),
      description: t("journey_conv_desc", "Continue talking with Athena in a quiet, private dialogue."),
      href: "/chat",
      actionLabel: t("home_talk_athena", "Talk with Athena"),
      icon: MessageSquare,
      accent: "#7C5CFF",
      iconStyle: isLight
        ? "bg-[#6E4FE6]/10 text-[#6E4FE6] border-[#6E4FE6]/25"
        : "bg-[#7C5CFF]/15 text-[#7C5CFF] dark:text-[#BFAEFF] border-[#7C5CFF]/30",
      buttonStyle: isLight ? "text-[#6E4FE6] group-hover:text-[#5D3FD3]" : "text-[#BFAEFF] group-hover:text-white",
    },
    {
      id: "studio",
      title: t("nav_studio", "Studio"),
      description: t("journey_studio_desc", "Start a timed guided voice practice to settle your breath and body."),
      href: "/studio",
      actionLabel: t("studio_begin", "Start a practice"),
      icon: Wind,
      accent: "#2DD4BF",
      iconStyle: isLight
        ? "bg-teal-50 text-teal-700 border-teal-200"
        : "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30",
      buttonStyle: isLight ? "text-teal-700 group-hover:text-teal-900" : "text-teal-400 group-hover:text-teal-300",
    },
    {
      id: "space",
      title: t("nav_space", "Space"),
      description: t("journey_space_desc", "Write something down in your unhurried sanctuary journal."),
      href: "/journal",
      actionLabel: t("home_open_space", "Open Space"),
      icon: BookOpen,
      accent: "#60A5FA",
      iconStyle: isLight
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
      buttonStyle: isLight ? "text-blue-700 group-hover:text-blue-900" : "text-blue-400 group-hover:text-blue-300",
    },
  ];

  return (
    <section aria-label="Continue Your Journey" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className={`text-xs uppercase tracking-wider font-semibold ${isLight ? "text-[#524E5E]" : "text-[#B8BDD6]/70"}`}>
          {t("journey_continue_title", "Continue Your Journey")}
        </h2>
        <span className={`text-xs ${isLight ? "text-[#78716C]" : "text-[#B8BDD6]/50"}`}>
          {t("journey_core_practices", "3 core practices")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {destinations.map((dest) => {
          const Icon = dest.icon;

          return (
            <Link
              key={dest.id}
              href={dest.href}
              className={`group p-4.5 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 cursor-pointer ${
                isLight
                  ? "bg-white border-[rgba(124,92,255,0.11)] hover:border-[rgba(110,79,230,0.35)] shadow-[0_2px_14px_-2px_rgba(28,25,23,0.04),0_1px_3px_rgba(124,92,255,0.02)] hover:shadow-md"
                  : "bg-[#0B1228]/60 border-white/10 hover:border-white/20 hover:bg-[#7C5CFF]/5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
              }`}
            >
              <div className="space-y-2">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${dest.iconStyle}`}>
                  <Icon size={16} />
                </div>
                <h3 className={`text-sm font-medium transition-colors ${
                  isLight ? "text-[#1C1917] group-hover:text-[#6E4FE6]" : "text-[#F8F7FF] group-hover:text-[#BFAEFF]"
                }`}>
                  {dest.title}
                </h3>
                <p className={`text-xs leading-relaxed font-light ${
                  isLight ? "text-[#524E5E]" : "text-[#B8BDD6]/70"
                }`}>
                  {dest.description}
                </p>
              </div>

              <div className={`pt-4 flex items-center justify-between text-xs font-medium border-t mt-3 ${
                isLight ? "border-stone-100" : "border-white/5"
              }`}>
                <span className={dest.buttonStyle}>{dest.actionLabel}</span>
                <ArrowRight size={13} className={`group-hover:translate-x-1 transition-transform ${
                  isLight ? "text-[#6E4FE6]" : "text-[#B8BDD6]/50"
                }`} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
