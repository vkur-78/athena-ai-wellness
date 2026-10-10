"use client";

import { Check } from "lucide-react";
import clsx from "clsx";

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}

export default function OptionCard({
  label,
  description,
  selected,
  onClick,
  multi = false,
}: OptionCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-pressed={selected}
      className={clsx(
        "w-full text-left flex items-center justify-between gap-3 min-h-[56px] rounded-[20px] p-4 sm:p-4.5 transition-all duration-[220ms] cursor-pointer border select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        selected
          ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg -translate-y-1 scale-[1.01]"
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] hover:-translate-y-0.5 active:translate-y-0"
      )}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug font-serif">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed">{description}</p>
        )}
      </div>

      <div
        className={clsx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[8px] border transition-all duration-150",
          selected
            ? "border-white bg-white/20 text-white"
            : multi
            ? "border-[var(--border-strong)] bg-[var(--surface-muted)]"
            : "border-[var(--border-strong)] bg-[var(--surface-muted)] rounded-full"
        )}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </div>
    </button>
  );
}
