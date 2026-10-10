"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Feather,
  Sun,
  Moon,
  Heart,
  Compass,
  MessageSquare,
  Wind,
  BookOpen,
  User,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import CrisisModal from "@/components/common/CrisisModal";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEntitlement } from "@/context/EntitlementContext";
import LanguageSelector from "@/components/common/LanguageSelector";
import { useTour } from "@/context/TourContext";

interface SanctuaryNavProps {
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export default function SanctuaryNav({
  theme: themeProp,
  onToggleTheme,
}: SanctuaryNavProps) {
  const pathname = usePathname();
  const { toggleTheme: globalToggleTheme, isLight } = useTheme();
  const { t } = useLanguage();
  const { isDemoMode, isTrialActive, isPaid, isTrialExpired, trialDaysRemaining, openUpgradeModal } = useEntitlement();
  const { openInvitation } = useTour();
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeToggle = onToggleTheme || globalToggleTheme;

  // Athena Sanctuary Navigation: Home -> Insights -> Replay -> Conversation -> Studio -> Space -> Profile -> Care
  const navItems = [
    { label: t("nav_home", "Home"), href: "/", icon: Feather },
    { label: t("nav_insights", "Insights"), href: "/insights", icon: Compass },
    { label: t("nav_replay", "Replay"), href: "/replay", icon: Sparkles },
    { label: t("nav_conversation", "Conversation"), href: "/chat", icon: MessageSquare },
    { label: t("nav_studio", "Studio"), href: "/studio", icon: Wind },
    { label: t("nav_space", "Space"), href: "/journal", icon: BookOpen },
    { label: t("nav_profile", "Profile"), href: "/profile", icon: User },
    { label: t("nav_care", "Care"), href: "/care", icon: Heart },
  ];

  return (
    <>
      {/* 1. DESKTOP FLOATING TRANSLUCENT SANCTUARY NAVIGATION */}
      <header
        role="banner"
        className="sticky top-2.5 z-40 w-full px-3 sm:px-6 transition-all duration-[250ms] pointer-events-none"
      >
        <div
          className={`pointer-events-auto mx-auto max-w-[1240px] flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 rounded-[24px] border backdrop-blur-2xl transition-all duration-[250ms] ${
            isLight
              ? "bg-[#FFFFFF]/92 border-[rgba(124,92,255,0.13)] shadow-[0_6px_24px_-4px_rgba(28,25,23,0.06),0_1px_4px_rgba(124,92,255,0.04)] text-[#1C1917]"
              : "bg-[#0B1228]/85 border-[#7C5CFF]/20 shadow-[0_8px_32px_-4px_rgba(6,8,20,0.85),0_0_16px_rgba(124,92,255,0.12)] text-[#F8F7FF]"
          }`}
        >
          {/* Sanctuary Official Athena Brand Mark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/50 rounded-[20px] px-1 py-1 transition-all duration-[180ms] hover:scale-[1.02]"
            aria-label="Athena Sanctuary Home"
          >
            <div className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] overflow-hidden shadow-sm transition-transform duration-[220ms] group-hover:scale-105 border ${
              isLight ? "border-[#7C5CFF]/25 bg-[#FAF7F2] shadow-black/5" : "border-[#7C5CFF]/30 bg-[#0B1228] shadow-[#7C5CFF]/30"
            }`}>
              <Image
                src="/athena-logo.png"
                alt="Athena Logo"
                width={32}
                height={32}
                className="object-cover"
                priority
              />
            </div>
            <span className={`text-sm font-semibold tracking-tight font-hero-serif sm:text-base ${
              isLight ? "text-[#1C1917]" : "text-[#F8F7FF]"
            }`}>
              Athena
            </span>
            {mounted && (
              isDemoMode ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-medium bg-amber-500/10 border-amber-500/30 text-amber-300">
                  {t("demo_tag", "Sample Journey")}
                </span>
              ) : isPaid ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-medium bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#9D84FF]">
                  Athena Plus
                </span>
              ) : isTrialActive ? (
                <span
                  onClick={(e) => {
                    if (trialDaysRemaining <= 7) {
                      e.preventDefault();
                      openUpgradeModal();
                    }
                  }}
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-medium ${
                    trialDaysRemaining <= 7 ? "cursor-pointer hover:scale-105 transition" : ""
                  } ${
                    trialDaysRemaining <= 3
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  {trialDaysRemaining === 30
                    ? t("trial_full_access", "30 days of full access")
                    : `${t("trial_tag", "Trial")} • ${trialDaysRemaining} ${t("trial_days_remaining", "days remaining")}`}
                </span>
              ) : isTrialExpired ? (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    openUpgradeModal();
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-medium bg-rose-500/10 border-rose-500/30 text-rose-300 cursor-pointer hover:bg-rose-500/20 transition"
                >
                  {t("trial_ended_badge", "Trial Ended")}
                </span>
              ) : null
            )}
          </Link>

          {/* Desktop Center Links with Active Glowing Indigo Pill and Subtle Underline Glow */}
          <nav
            aria-label="Sanctuary Desktop Navigation"
            className="hidden md:flex items-center gap-0.5 lg:gap-1 py-0.5 px-0.5"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const isCare = item.href === "/care";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-[20px] text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/50 ${
                    isActive
                      ? "nav-tab-active"
                      : isCare
                      ? isLight
                        ? "text-rose-700 hover:text-rose-900 hover:bg-rose-100 hover:-translate-y-0.5 border border-rose-300 bg-rose-50"
                        : "text-rose-300 hover:text-white hover:bg-rose-500/20 hover:-translate-y-0.5 border border-rose-500/30 bg-rose-500/10"
                      : isLight
                      ? "text-[#524E5E] hover:text-[#1C1917] hover:bg-[#7C5CFF]/08 hover:-translate-y-0.5 border border-transparent"
                      : "text-[#B8BDD6] hover:text-[#F8F7FF] hover:bg-[#7C5CFF]/15 hover:-translate-y-0.5 border border-transparent"
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 transition-transform duration-180 group-hover:scale-110 ${
                      isActive
                        ? "text-[#F8F7FF]"
                        : isCare
                        ? "text-rose-400 group-hover:text-rose-300"
                        : "opacity-80 group-hover:opacity-100"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Tools: Guided Tour + Global Language Selector + Theme Mode Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openInvitation}
              className={`p-2 rounded-[20px] border text-xs transition-all duration-[180ms] hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/50 ${
                isLight
                  ? "border-[rgba(124,92,255,0.15)] bg-white/80 text-[#524E5E] hover:bg-[#F3EFE8] hover:text-[#1C1917]"
                  : "border-[#2E2157]/50 bg-[#1F253F]/60 text-[#959BB4] hover:text-white hover:bg-[#2E2157]/80"
              }`}
              title={t("tour_show_me", "Take a Guided Tour")}
              aria-label="Take a Guided Tour"
            >
              <HelpCircle size={14} />
            </button>

            <LanguageSelector isLight={isLight} />

            <button
              type="button"
              onClick={activeToggle}
              className={`p-2 rounded-[20px] border text-xs transition-all duration-[180ms] hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/50 ${
                isLight
                  ? "border-[rgba(124,92,255,0.15)] bg-white/80 text-[#524E5E] hover:bg-[#F3EFE8] hover:text-[#1C1917]"
                  : "border-[#2E2157]/50 bg-[#1F253F]/60 text-[#959BB4] hover:text-white hover:bg-[#2E2157]/80"
              }`}
              title={isLight ? "Sanctuary Night Mode" : "Ivory Mist Light Mode"}
              aria-label="Toggle theme"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM TRANSLUCENT SANCTUARY DOCK */}
      <nav
        aria-label="Sanctuary Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none"
      >
        <div
          className={`pointer-events-auto mx-auto max-w-md flex items-center justify-around rounded-[24px] border backdrop-blur-2xl transition-all duration-[250ms] p-1.5 ${
            isLight
              ? "bg-[#FFFFFF]/95 border-[rgba(124,92,255,0.15)] shadow-[0_8px_28px_-4px_rgba(28,25,23,0.10)] text-[#1C1917]"
              : "bg-[#151A2E]/92 border-[#2E2157]/60 shadow-[0_8px_32px_rgba(15,18,32,0.9)] text-[#F1EEF8]"
          }`}
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[48px] rounded-[20px] transition-all duration-[200ms] active:scale-95 ${
                  isActive
                    ? isLight
                      ? "bg-[#6E4FE6]/12 text-[#5D3FD3] font-semibold border border-[#6E4FE6]/25 shadow-xs"
                      : "bg-[#2E2157]/60 text-white font-semibold border border-violet-400/40 shadow-xs"
                    : isLight
                    ? "text-[#524E5E] hover:text-[#1C1917]"
                    : "text-[#959BB4] hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon
                    size={17}
                    className={`transition-transform duration-[180ms] ${
                      isActive
                        ? isLight
                          ? "text-[#5D3FD3] scale-110"
                          : "text-violet-300 scale-110"
                        : "opacity-80"
                    }`}
                  />
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full animate-pulse ${
                        isLight ? "bg-[#6E4FE6]" : "bg-violet-400"
                      }`}
                    />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] tracking-tight mt-1 font-sans text-center truncate max-w-[56px] sm:max-w-none leading-normal">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Accessible Calm Crisis Support Modal */}
      <CrisisModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />
    </>
  );
}
