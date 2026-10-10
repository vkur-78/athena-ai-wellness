"use client";

import React, { useState } from "react";
import Link from "next/link";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTheme } from "@/context/ThemeContext";
import {
  Heart,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Compass,
  Wind,
  Sparkles,
  ArrowRight,
  Eye,
  Hand,
  Ear,
  Smile,
  Flower2,
  ExternalLink,
  Info,
  MapPin,
  Building,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CarePage() {
  const { theme, toggleTheme, isLight } = useTheme();
  const { t } = useLanguage();
  const [activeGroundingStep, setActiveGroundingStep] = useState(0);

  const groundingSteps = [
    {
      count: "5",
      sense: "Things You See",
      icon: Eye,
      prompt:
        "Look around gently. Notice five colors, shapes, or quiet objects in the room.",
    },
    {
      count: "4",
      sense: "Things You Can Feel",
      icon: Hand,
      prompt:
        "Notice the weight of your feet on the floor, clothing against your skin, or chair supporting you.",
    },
    {
      count: "3",
      sense: "Sounds You Can Hear",
      icon: Ear,
      prompt:
        "Listen quietly. Perhaps a distant hum, a breeze, or the rhythm of your own breath.",
    },
    {
      count: "2",
      sense: "Things You Can Smell",
      icon: Flower2,
      prompt:
        "Breathe in softly. Notice the scent in the air, tea, or fresh coolness.",
    },
    {
      count: "1",
      sense: "Gentle Truth",
      icon: Smile,
      prompt:
        "Acknowledge one kind thought: You are here, breathing, and safe in this exact moment.",
    },
  ];

  return (
    <main className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--foreground)] relative overflow-x-hidden selection:bg-rose-500/30 transition-colors duration-300">
      {/* Background Atmosphere: Protective Rose-Indigo Sanctuary Aurora */}
      <div className="sanctuary-aurora-bg care-room" />

      {/* Universal Sanctuary Navigation */}
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Care Center Sanctuary */}
      <div data-tour="care-support" className="relative z-10 flex-1 w-full max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-in fade-in duration-300">
        {/* Header Reassurance Banner */}
        <section className="text-center space-y-4 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-medium shadow-[0_0_16px_rgba(244,63,94,0.18)]">
            <Heart size={13} className="text-rose-500 fill-rose-500/20" />
            <span>{t("care_safety_tag", "Immediate Safety & Support")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-[var(--text-primary)]">
            {t("care_title", "You Are Safe. You Are Not Alone.")}
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            {t("care_subtitle", "If you are carrying heavy emotional pain, compassionate human help is ready 24/7.")}
          </p>
        </section>

        {/* 1. Immediate 24/7 Crisis Lifelines (Verified Current Numbers) */}
        <section aria-label="Crisis Lifelines" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--accent)]">
              {t("care_lifelines_title", "Immediate Free & Confidential Lifelines (24/7)")}
            </h2>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Verified &amp; Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* India National Helplines */}
            <div className="p-6 sm:p-7 rounded-2xl border border-rose-500/30 bg-[var(--surface-elevated)] shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-300 flex items-center justify-center">
                    <PhoneCall size={18} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/35">
                    India 24/7
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                  Tele-MANAS &amp; Emergency (India)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  National Emergency: <strong>112</strong> (immediate assistance). Govt. of India Tele-MANAS: <strong>14416</strong> or <strong>1800-89-14416</strong> (24×7 free mental health). Vandrevala: <strong>+91 9999 666 555</strong>.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-rose-500/20 flex flex-col gap-2">
                <a
                  href="tel:112"
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.4)] transition cursor-pointer text-center"
                >
                  <PhoneCall size={13} className="shrink-0" />
                  <span>{t("care_emergency_call", "Call 112 (Emergency)")}</span>
                </a>
                <a
                  href="tel:14416"
                  className="flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-medium border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-200 transition cursor-pointer text-center"
                >
                  <PhoneCall size={13} className="shrink-0" />
                  <span>{t("care_telemanas_call", "Call Tele-MANAS (14416)")}</span>
                </a>
              </div>
            </div>

            {/* US & Canada Lifeline 988 */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center">
                    <PhoneCall size={18} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
                    US &amp; Canada
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                  Suicide &amp; Crisis Lifeline
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Call or text <strong>988</strong> anytime. Free, confidential support for people in suicidal crisis or emotional distress.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[var(--border)] flex items-center gap-2">
                <a
                  href="tel:988"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition cursor-pointer"
                >
                  <PhoneCall size={13} />
                  <span>Call 988</span>
                </a>
                <a
                  href="sms:988"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-medium border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] text-[var(--text-primary)] transition cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>Text 988</span>
                </a>
              </div>
            </div>

            {/* Worldwide & Crisis Text Line */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                    Worldwide &amp; Text
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                  Crisis Text Line &amp; Global
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Text <strong>HOME</strong> to <strong>741741</strong> (US/UK/Canada). UK Emergency: 111 / 999. Australia Lifeline: 13 11 14. Universal Emergency: 112.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[var(--border)]">
                <a
                  href="sms:741741?body=HOME"
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-medium border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] text-[var(--text-primary)] transition cursor-pointer"
                >
                  <span>Text HOME to 741741</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Professional Therapy Guidance & External Directory */}
        <section aria-label="Professional Therapy Guidance" className="space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] backdrop-blur-xl space-y-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] shrink-0 mt-0.5">
                <Info size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)]">
                  Professional Therapy &amp; Clinical Care Guidance
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Athena is a compassionate reflective companion designed for daily mindfulness and emotional tracking. Athena is <strong>not</strong> a licensed healthcare provider and does not provide clinical diagnoses, psychiatric treatment, or medical advice.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)]">
              <div className="text-xs font-medium text-[var(--text-primary)] mb-3 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={13} className="text-[var(--accent)]" />
                Accredited External Directories for Licensed Practitioners
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="https://www.psychologytoday.com/us/therapists"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      <span>Psychology Today</span>
                      <ExternalLink size={12} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
                      Filter licensed therapists by location, insurance, and specialty.
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--accent)] mt-2 block font-medium">
                    External directory
                  </span>
                </a>

                <a
                  href="https://openpathcollective.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      <span>Open Path Collective</span>
                      <ExternalLink size={12} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
                      Affordable, sliding-scale in-person and online psychotherapy.
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--accent)] mt-2 block font-medium">
                    External directory
                  </span>
                </a>

                <a
                  href="https://nimhans.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      <span>NIMHANS India</span>
                      <ExternalLink size={12} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
                      National Institute of Mental Health and Neurosciences clinical resources.
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--accent)] mt-2 block font-medium">
                    External clinical portal
                  </span>
                </a>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] mt-3 italic">
                * Note: Third-party directories are presented as external reference options only. Athena does not verify, endorse, or receive compensation from listed practitioners.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Instant Grounding Reconnect (5-4-3-2-1 Sensory Anchor) */}
        <section aria-label="Grounding Anchor" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--accent)]">
              Somatic Grounding Reconnect
            </h2>
            <span className="text-[11px] text-[var(--text-muted)]">
              Anchor your nervous system gently
            </span>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
              <div className="space-y-1.5 max-w-lg">
                <div className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)]">
                  <Compass size={14} />
                  <span className="font-semibold">5-4-3-2-1 Sensory Anchor</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[var(--text-primary)]">
                  Step {activeGroundingStep + 1} of 5: {groundingSteps[activeGroundingStep].sense}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
                  {groundingSteps[activeGroundingStep].prompt}
                </p>
              </div>

              {/* Step indicator buttons */}
              <div className="flex items-center gap-2">
                {groundingSteps.map((step, idx) => (
                  <button
                    key={step.count}
                    type="button"
                    onClick={() => setActiveGroundingStep(idx)}
                    className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center font-semibold text-xs transition-all duration-200 cursor-pointer ${
                      activeGroundingStep === idx
                        ? "bg-[var(--accent)] text-white border border-[var(--accent)] shadow-[0_0_16px_rgba(124,92,255,0.45)] scale-105"
                        : "bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span>{step.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Next Step Controls */}
            <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[var(--text-muted)] italic">
                Take as much time on each sensory step as feels kind to your body.
              </p>
              <div className="flex items-center gap-2">
                {activeGroundingStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveGroundingStep((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                  >
                    Previous
                  </button>
                )}
                {activeGroundingStep < groundingSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveGroundingStep((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_0_14px_rgba(124,92,255,0.35)] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Sensory Step</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Sparkles size={13} />
                    <span>You have anchored yourself gently</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Supportive Doors Out of Crisis (Clean Working Links Only) */}
        <section aria-label="Supportive Doors" className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Step into Conversation */}
          <Link
            href="/chat"
            className="p-6 sm:p-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)] hover:-translate-y-1 transition-all duration-200 group flex items-start gap-4 cursor-pointer shadow-lg"
          >
            <div className="h-11 w-11 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare size={19} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Sit Across from Athena
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Enter your private conversation sanctuary. Share thoughts at whatever pace feels manageable without judgment.
              </p>
            </div>
          </Link>

          {/* Step into Studio (Proper working route) */}
          <Link
            href="/studio"
            className="p-6 sm:p-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-200 group flex items-start gap-4 cursor-pointer shadow-lg"
          >
            <div className="h-11 w-11 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wind size={19} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)] group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                Restorative Studio
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Step into gentle somatic practices including mindful breathwork, progressive muscle relaxation, body scan, and yoga.
              </p>
            </div>
          </Link>
        </section>

        {/* Bottom breathing space */}
        <div className="h-8" />
      </div>
    </main>
  );
}
