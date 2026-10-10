"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  MessageSquare,
  Search,
  LogOut,
  Trash2,
  Brain,
  X,
  Feather,
  Pencil,
  Check,
  Pin,
  Archive,
  Clock,
  Sparkles,
} from "lucide-react";
import { ChatSession } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { clearAllSanctuarySessions } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { voiceSessionManager } from "@/lib/voiceSessionManager";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: (title?: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onTogglePinSession?: (id: string) => void;
  onToggleArchiveSession?: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
  userMemory?: any;
  onOpenMemory?: () => void;
  isDemo?: boolean;
}

type DateGroup = "Today" | "Yesterday" | "This Week" | "Last Week" | "Earlier";

function getDateGroup(dateStr: string): DateGroup {
  const d = new Date(dateStr);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const thisWeekStart = todayStart - 6 * 86400000;
  const lastWeekStart = todayStart - 13 * 86400000;

  const time = d.getTime();
  if (time >= todayStart) return "Today";
  if (time >= yesterdayStart) return "Yesterday";
  if (time >= thisWeekStart) return "This Week";
  if (time >= lastWeekStart) return "Last Week";
  return "Earlier";
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getFirstLinePreview(session: ChatSession): string {
  const userMsg = session.messages.find((m) => m.role === "user");
  const assistantMsg = session.messages.find((m) => m.role === "assistant" && m.metadata?.stage !== "greeting");
  const target = userMsg || assistantMsg || session.messages[0];
  if (!target || !target.content) return "Quiet pause together";
  const firstLine = target.content.split("\n")[0].trim();
  return firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine;
}

function getMoodChip(session: ChatSession): string | null {
  if (session.moodTag) return session.moodTag;
  for (let i = session.messages.length - 1; i >= 0; i--) {
    const meta = session.messages[i].metadata;
    if (meta?.emotion) return meta.emotion;
  }
  return null;
}

function highlightMatch(text: string, query: string, isLight: boolean) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className={`rounded px-0.5 font-medium ${
          isLight ? "bg-amber-200/90 text-stone-900" : "bg-[#7C5CFF]/40 text-[#F8F7FF]"
        }`}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onToggleArchiveSession,
  isOpen,
  onClose,
  user,
  userMemory,
  onOpenMemory,
  isDemo = false,
}: SidebarProps) {
  const router = useRouter();
  const { isLight } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  async function handleLogout() {
    voiceSessionManager.stopAll();
    await clearAllSanctuarySessions();
    router.replace("/login");
  }

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Filtered, deduped, and search matching
  const searchableSessions = useMemo(() => {
    const pool = sessions.filter((s) => (showArchived ? s.isArchived : !s.isArchived));

    // Deduplicate empty placeholder "New Conversation" sessions
    let hasKeptEmptyNew = false;
    const deduped: ChatSession[] = [];

    for (const s of pool) {
      const isPlaceholder = (s.title === "New Conversation" || !s.title) && (!s.messages || s.messages.length === 0);
      if (isPlaceholder) {
        if (s.id === activeSessionId || !hasKeptEmptyNew) {
          deduped.push(s);
          hasKeptEmptyNew = true;
        }
      } else {
        deduped.push(s);
      }
    }

    return deduped;
  }, [sessions, showArchived, activeSessionId]);

  const matchedSessions = useMemo(() => {
    if (!trimmedQuery) return searchableSessions;
    return searchableSessions.filter((session) => {
      if (session.title.toLowerCase().includes(trimmedQuery)) return true;
      return session.messages.some((m) => m.content.toLowerCase().includes(trimmedQuery));
    });
  }, [searchableSessions, trimmedQuery]);

  // Split into Pinned vs Date-grouped Recent (Auto-sorted by date descending)
  const { pinnedSessions, groupedRecentSessions } = useMemo(() => {
    const pinned: ChatSession[] = [];
    const groups: Record<DateGroup, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "Last Week": [],
      Earlier: [],
    };

    const sortByDate = (a: ChatSession, b: ChatSession) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    };

    matchedSessions.forEach((session) => {
      if (session.isPinned && !showArchived) {
        pinned.push(session);
      } else {
        const group = getDateGroup(session.updatedAt || session.createdAt);
        groups[group].push(session);
      }
    });

    pinned.sort(sortByDate);
    (Object.keys(groups) as DateGroup[]).forEach((key) => {
      groups[key].sort(sortByDate);
    });

    return { pinnedSessions: pinned, groupedRecentSessions: groups };
  }, [matchedSessions, showArchived]);

  const startEditing = (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (sessionId: string) => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      onRenameSession?.(sessionId, trimmed);
    }
    setEditingId(null);
    setEditTitle("");
  };

  const insightCount = userMemory?.total_insights ?? 4;

  const renderConversationItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingId === session.id;
    const preview = getFirstLinePreview(session);
    const timeAgo = formatRelativeTime(session.updatedAt || session.createdAt);
    const mood = getMoodChip(session);

    return (
      <div
        key={session.id}
        className={`group relative flex flex-col rounded-xl px-2.5 py-2 transition-all duration-150 cursor-pointer ${
          isActive
            ? isLight
              ? "bg-[#EDE8DF]/90 text-stone-900 border border-stone-300 font-medium shadow-xs"
              : "bg-[#7C5CFF]/20 text-[#F8F7FF] border border-[#7C5CFF]/45 font-medium shadow-[0_0_16px_rgba(124,92,255,0.18)]"
            : isLight
            ? "text-stone-700 hover:bg-[#EDE8DF]/50 hover:text-stone-900"
            : "text-[#B8BDD6] hover:bg-[#7C5CFF]/10 hover:text-[#F8F7FF] hover:-translate-y-0.5"
        }`}
        onClick={() => {
          if (!isEditing) {
            onSelectSession(session.id);
            onClose?.();
          }
        }}
      >
        <div className="flex items-center justify-between w-full gap-2">
          {isEditing ? (
            <div className="flex items-center flex-1 gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveEditing(session.id);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingId(null);
                  }
                }}
                onBlur={() => saveEditing(session.id)}
                className={`w-full bg-transparent px-2 py-0.5 text-xs outline-none rounded border ${
                  isLight
                    ? "border-stone-400 bg-white text-stone-900"
                    : "border-[#7C5CFF] bg-[#060814] text-[#F8F7FF]"
                }`}
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveEditing(session.id);
                }}
                className="p-1 rounded text-[#BFAEFF] hover:bg-[#7C5CFF]/20 cursor-pointer"
                title="Save title"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <>
              {/* Left: Message Icon + Title */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare
                  size={13}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? isLight
                        ? "text-stone-800"
                        : "text-[#BFAEFF]"
                      : isLight
                      ? "text-stone-400 group-hover:text-stone-600"
                      : "text-[#B8BDD6]/60 group-hover:text-[#F8F7FF]"
                  }`}
                />
                <span className="truncate text-xs font-medium">
                  {trimmedQuery ? highlightMatch(session.title, trimmedQuery, isLight) : session.title}
                </span>
              </div>

              {/* Relative Time Stamp & Smooth Non-Flashing Hover Actions Container */}
              <div className="relative shrink-0 flex items-center justify-end h-5 min-w-[54px]">
                {/* Time Stamp (Smoothly fades out on hover) */}
                <span
                  className={`text-[10px] font-sans transition-all duration-200 group-hover:opacity-0 group-hover:pointer-events-none ${
                    isLight ? "text-stone-400" : "text-[#B8BDD6]/60"
                  }`}
                >
                  {timeAgo}
                </span>

                {/* Hover Actions: Rename, Pin, Archive, Delete (Smoothly fades in without flashing or layout jump) */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pin Action */}
                  <button
                    type="button"
                    onClick={() => onTogglePinSession?.(session.id)}
                    className={`rounded p-1 transition cursor-pointer ${
                      session.isPinned
                        ? "text-[#7C5CFF] hover:text-[#BFAEFF]"
                        : isLight
                        ? "text-stone-400 hover:text-stone-800 hover:bg-stone-200"
                        : "text-[#B8BDD6]/60 hover:text-[#F8F7FF] hover:bg-[#7C5CFF]/20"
                    }`}
                    title={session.isPinned ? "Unpin conversation" : "Pin conversation"}
                  >
                    <Pin size={11} className={session.isPinned ? "fill-current" : ""} />
                  </button>

                  {/* Rename Action */}
                  <button
                    type="button"
                    onClick={(e) => startEditing(session, e)}
                    className={`rounded p-1 transition cursor-pointer ${
                      isLight
                        ? "text-stone-400 hover:text-stone-800 hover:bg-stone-200"
                        : "text-[#B8BDD6]/60 hover:text-[#F8F7FF] hover:bg-[#7C5CFF]/20"
                    }`}
                    title="Rename"
                  >
                    <Pencil size={11} />
                  </button>

                  {/* Archive Action */}
                  <button
                    type="button"
                    onClick={() => onToggleArchiveSession?.(session.id)}
                    className={`rounded p-1 transition cursor-pointer ${
                      session.isArchived
                        ? "text-amber-400 hover:text-amber-300"
                        : isLight
                        ? "text-stone-400 hover:text-stone-800 hover:bg-stone-200"
                        : "text-[#B8BDD6]/60 hover:text-[#F8F7FF] hover:bg-[#7C5CFF]/20"
                    }`}
                    title={session.isArchived ? "Unarchive" : "Archive"}
                  >
                    <Archive size={11} />
                  </button>

                  {/* Delete Action */}
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    className={`rounded p-1 transition cursor-pointer ${
                      isLight
                        ? "text-stone-400 hover:text-rose-600 hover:bg-stone-200"
                        : "text-[#B8BDD6]/60 hover:text-rose-400 hover:bg-rose-500/10"
                    }`}
                    title="Release conversation"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* First Line Preview + Mood Chip */}
        {!isEditing && (
          <div className="flex items-center justify-between gap-1.5 pt-1 pl-5">
            <span
              className={`text-[10px] truncate max-w-[170px] ${
                isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
              }`}
            >
              {preview}
            </span>

            {mood && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full border shrink-0 capitalize ${
                  isLight
                    ? "bg-stone-100 border-stone-200 text-stone-600"
                    : "bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#BFAEFF]"
                }`}
              >
                {mood}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const todaySessions = useMemo(() => {
    return groupedRecentSessions["Today"] || [];
  }, [groupedRecentSessions]);

  const yesterdaySessions = useMemo(() => {
    return groupedRecentSessions["Yesterday"] || [];
  }, [groupedRecentSessions]);

  const earlierSessions = useMemo(() => {
    return [
      ...(groupedRecentSessions["This Week"] || []),
      ...(groupedRecentSessions["Last Week"] || []),
      ...(groupedRecentSessions["Earlier"] || []),
    ];
  }, [groupedRecentSessions]);

  const sidebarContent = (
    <div
      className={`flex h-full flex-col transition-colors duration-300 ${
        isLight
          ? "bg-[#FAF8F5] text-[#232220] border-r border-[rgba(24,24,27,0.08)]"
          : "bg-[#0B1228]/85 backdrop-blur-2xl text-[#B8BDD6] border-r border-[#7C5CFF]/15"
      }`}
    >
      {/* 1. Header: New Conversation (No duplicate Athena brand header) */}
      <div className={`p-3.5 border-b ${isLight ? "border-[rgba(24,24,27,0.08)]" : "border-[#7C5CFF]/15"}`}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <button
            onClick={() => {
              onNewChat();
              onClose?.();
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              isLight
                ? "bg-[#EDE8DF] hover:bg-[#E4DED3] text-stone-900 border border-[#DED7CA]"
                : "bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/30 text-[#F8F7FF] border border-[#7C5CFF]/40 shadow-[0_0_14px_rgba(124,92,255,0.15)] hover:-translate-y-0.5"
            }`}
          >
            <Plus size={15} />
            <span>+ New Conversation</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className={`md:hidden rounded-xl p-2 transition-colors shrink-0 ${
                isLight
                  ? "text-stone-500 hover:bg-stone-200 hover:text-stone-900"
                  : "text-[#B8BDD6] hover:bg-[#7C5CFF]/20 hover:text-[#F8F7FF]"
              }`}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 2. Search Conversations */}
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border transition-all ${
            isLight
              ? "bg-[#F2EEE6] border-[#E7E5E4] text-stone-700 focus-within:border-stone-400"
              : "bg-[#060814]/60 border-[#7C5CFF]/20 text-[#F8F7FF] focus-within:border-[#7C5CFF]/50 focus-within:shadow-[0_0_12px_rgba(124,92,255,0.15)]"
          }`}
        >
          <Search size={13} className={isLight ? "text-stone-400" : "text-[#BFAEFF]/60"} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={`w-full bg-transparent outline-none text-xs ${
              isLight
                ? "text-stone-800 placeholder-stone-400"
                : "text-[#F8F7FF] placeholder-[#B8BDD6]/50"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#959BB4] hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 4 & 5. Pinned & Recent Auto-Sorted Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Pinned Conversations */}
        {pinnedSessions.length > 0 && (
          <div className="space-y-1">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                isLight ? "text-stone-600" : "text-[#BFAEFF]/80"
              }`}
            >
              <Pin size={10} className="fill-current text-[#7C5CFF]" />
              <span>Pinned ({pinnedSessions.length})</span>
            </div>
            <div className="space-y-1">
              {pinnedSessions.map(renderConversationItem)}
            </div>
          </div>
        )}

        {/* Date Grouped Recent Conversations */}
        {matchedSessions.length === 0 ? (
          <div
            className={`p-4 text-center text-xs ${
              isLight ? "text-stone-400" : "text-[#B8BDD6]/60"
            }`}
          >
            {trimmedQuery ? "No conversations match your search." : "No conversations yet."}
          </div>
        ) : (
          <>
            {todaySessions.length > 0 && (
              <div className="space-y-1">
                <div
                  className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    isLight ? "text-stone-600" : "text-[#BFAEFF]/80"
                  }`}
                >
                  TODAY
                </div>
                <div className="space-y-1">
                  {todaySessions.map(renderConversationItem)}
                </div>
              </div>
            )}

            {yesterdaySessions.length > 0 && (
              <div className="space-y-1 pt-2">
                <div
                  className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    isLight ? "text-stone-600" : "text-[#BFAEFF]/80"
                  }`}
                >
                  YESTERDAY
                </div>
                <div className="space-y-1">
                  {yesterdaySessions.map(renderConversationItem)}
                </div>
              </div>
            )}

            {earlierSessions.length > 0 && (
              <div className="space-y-1 pt-2">
                <div
                  className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    isLight ? "text-stone-600" : "text-[#BFAEFF]/80"
                  }`}
                >
                  EARLIER
                </div>
                <div className="space-y-1">
                  {earlierSessions.map(renderConversationItem)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Optional: Archived Toggle */}
        <div className="pt-2 px-1">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={`text-[10px] font-medium transition-colors cursor-pointer hover:underline ${
              isLight ? "text-stone-500" : "text-[#B8BDD6]/60 hover:text-[#BFAEFF]"
            }`}
          >
            {showArchived ? "← Back to Active Conversations" : "View Archived Conversations"}
          </button>
        </div>

        {/* Demo Mode Notice & Sample Archive Link */}
        {isDemo && (
          <div className="mt-3 pt-3 px-2 border-t border-amber-500/20 text-xs space-y-1">
            <div className="text-[10px] text-amber-300 font-medium flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400" />
              <span>Active Demo Session</span>
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Interactive demo messages are saved for this device. Full 24-month sample history is preserved in Replay.
            </p>
            <Link
              href="/replay/weekly"
              className="inline-block pt-1 text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Explore Sample Journey Archive →
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: 280px therapist notebook width */}
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col h-full z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-50 w-[280px] max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}