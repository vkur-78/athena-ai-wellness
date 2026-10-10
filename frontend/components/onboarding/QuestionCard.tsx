"use client";

import { ReactNode } from "react";
import { Sparkles, Info } from "lucide-react";

interface QuestionCardProps {
  heading: string;
  explanation: string;
  badge?: string;
  children: ReactNode;
}

export default function QuestionCard({
  heading,
  explanation,
  badge = "Sanctuary Baseline",
  children,
}: QuestionCardProps) {
  return (
    <div className="w-full max-w-xl mx-auto rounded-[20px] border border-[var(--border)] bg-[var(--surface-elevated)] backdrop-blur-2xl p-5 sm:p-7 shadow-xl text-[var(--text-primary)] transition-all duration-[280ms] animate-in fade-in duration-[280ms]">
      {/* Header section with vertical rhythm */}
      <div className="space-y-2.5 mb-4 sm:mb-6 text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--border-strong)] px-3 py-1 text-[11px] font-medium text-[var(--accent)]">
          <Sparkles size={11} className="text-[var(--accent)]" />
          <span>{badge}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-serif font-semibold tracking-tight text-[var(--text-primary)] leading-snug">
          {heading}
        </h2>

        <div className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-muted)] rounded-[16px] p-3.5 border border-[var(--border)]">
          <Info size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
          <p className="font-serif leading-relaxed">{explanation}</p>
        </div>
      </div>

      {/* Main Interactive Controls */}
      <div>{children}</div>
    </div>
  );
}
