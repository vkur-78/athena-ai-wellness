"use client";

import React from "react";
import { Menu, Trash2, Brain } from "lucide-react";

interface ChatHeaderProps {
  title?: string;
  backendOnline?: boolean | null;
  onClearChat?: () => void;
  onToggleSidebar?: () => void;
  onOpenMemory?: () => void;
}

export default function ChatHeader({
  title = "Today's Conversation",
  backendOnline,
  onClearChat,
  onToggleSidebar,
  onOpenMemory,
}: ChatHeaderProps) {
  return (
    <header className="px-4 py-2 sm:px-8 sm:py-2.5 flex items-center justify-between z-10 border-b border-[var(--border)] bg-transparent text-[var(--text-primary)]">
      {/* Mobile Drawer Trigger + Conversation Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
          title="Toggle Conversations"
          aria-label="Toggle conversations"
        >
          <Menu size={15} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-md font-sans">
            {title}
          </h1>
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              backendOnline === false
                ? "bg-[#FBBF24]"
                : "bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]"
            }`}
            title={backendOnline === false ? "Connecting..." : "Athena present"}
          />
        </div>
      </div>

      {/* Discreet Secondary Tools: Memory & Clear */}
      <div className="flex items-center gap-1.5">
        {onOpenMemory && (
          <button
            type="button"
            onClick={onOpenMemory}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
            title="Living Memory"
          >
            <Brain size={12} className="text-[var(--accent)]" />
            <span className="hidden sm:inline">Memory</span>
          </button>
        )}

        {onClearChat && (
          <button
            type="button"
            onClick={onClearChat}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Clear this conversation"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </header>
  );
}