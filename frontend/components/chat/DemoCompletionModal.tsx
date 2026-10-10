"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, LogIn, Lock, Compass, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DemoCompletionModalProps {
  isOpen: boolean;
  promptsUsed?: number;
  promptLimit?: number;
  onClose?: () => void;
  onReturnToLogin?: () => void;
  onExploreAthena?: () => void;
}

export function DemoCompletionModal({
  isOpen,
  promptsUsed = 3,
  promptLimit = 3,
  onClose,
  onReturnToLogin,
  onExploreAthena,
}: DemoCompletionModalProps) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleReturnToLogin = () => {
    if (typeof onReturnToLogin === "function") {
      onReturnToLogin();
    } else {
      router.push("/login");
    }
  };

  const handleExploreAthena = () => {
    if (typeof onExploreAthena === "function") {
      onExploreAthena();
    } else if (typeof onClose === "function") {
      onClose();
      router.push("/");
    } else {
      router.push("/");
    }
  };

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <aside
      aria-label="Demo Limit Notice"
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-30 max-w-md w-[calc(100%-2rem)] p-1 animate-fade-in pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#7C5CFF]/40 bg-[#0d1226]/95 backdrop-blur-xl p-5 sm:p-6 text-left shadow-2xl shadow-[#7C5CFF]/30">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-36 w-36 rounded-full bg-[#7C5CFF]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-violet-600/20 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          aria-label="Close demo limit notification"
        >
          <X size={16} />
        </button>

        {/* Header row with logo and badge */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/40 bg-[#161f3d] shadow-sm">
            <Image
              src="/athena-logo.png"
              alt="Athena Logo"
              width={32}
              height={32}
              className="object-cover rounded-lg"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
            <Sparkles size={12} className="text-amber-400 shrink-0" />
            <span>
              {t("demo_limit_badge", "Demo Message Limit Reached (3 of 3)")}
            </span>
          </div>
        </div>

        {/* Headings */}
        <h3 className="text-base font-serif font-bold text-white tracking-tight mb-1.5">
          {t("demo_limit_title", "You've experienced three conversations in the Athena demo.")}
        </h3>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          {t("demo_limit_sub", "Create your own private sanctuary to continue with unlimited conversations, continuous memory, and a 30-day trial.")}
        </p>

        {/* CTAs: 1. Create Account, 2. Explore Athena, 3. Return to Login */}
        <div className="space-y-2">
          <Link
            href="/signup"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-violet-600 hover:from-[#6b4ce6] hover:to-violet-700 text-white font-semibold py-2.5 px-4 text-xs shadow-md shadow-[#7C5CFF]/30 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>{t("demo_limit_create_account", "Create Your Athena Account")}</span>
            <ArrowRight size={14} />
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExploreAthena}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white py-2 px-3 text-xs font-medium transition cursor-pointer"
            >
              <Compass size={13} className="shrink-0" />
              <span>{t("demo_limit_explore", "Explore Athena")}</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToLogin}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white py-2 px-3 text-xs font-medium transition cursor-pointer"
            >
              <LogIn size={13} className="shrink-0" />
              <span>{t("demo_limit_return_login", "Return to Login")}</span>
            </button>
          </div>
        </div>

        {/* Sanctuary privacy note */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <Lock size={11} className="text-[#7C5CFF]" />
          <span>Full 30-day trial • Private encrypted sanctuary • No card required</span>
        </div>
      </div>
    </aside>
  );
}
