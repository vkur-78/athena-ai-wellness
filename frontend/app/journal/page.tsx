"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { JournalEntry } from "@/types/journal";
import {
  fetchJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  requestJournalReflection,
  fetchUserProfile,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import JournalCard from "@/components/journal/JournalCard";
import JournalEditor from "@/components/journal/JournalEditor";
import JournalReader from "@/components/journal/JournalReader";
import JournalReflectionModal from "@/components/journal/JournalReflectionModal";
import {
  Plus,
  Search,
  Feather,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEntitlement } from "@/context/EntitlementContext";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import Loading from "@/components/common/Loading";

export default function SpacePage() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "editor" | "reader">("list");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionModalEntry, setReflectionModalEntry] = useState<JournalEntry | null>(null);
  const scrollPosRef = useRef(0);

  // Restore scroll position when returning to timeline view
  useEffect(() => {
    if (viewMode === "list" && scrollPosRef.current > 0) {
      const saved = scrollPosRef.current;
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: "instant" });
      });
    }
  }, [viewMode]);

  // Strict Authentication Guard
  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/login");
          return;
        }
        if (!active) return;
        setUser(session.user);

        // Check onboarding baseline
        const profile = await fetchUserProfile(session.access_token);
        if (!active) return;
        if (profile && profile.onboarding_completed === false) {
          router.replace("/onboarding");
          return;
        }

        setAuthChecking(false);
      } catch (err) {
        console.error("Auth check error in Space:", err);
        router.replace("/login");
      }
    }
    checkAuth();
    return () => {
      active = false;
    };
  }, [router]);

  // Check for incoming pending draft from Check-in ("Save to Space")
  useEffect(() => {
    if (typeof window !== "undefined" && !authChecking) {
      try {
        const pending = localStorage.getItem("athena_journal_pending_draft");
        if (pending && pending.trim()) {
          localStorage.removeItem("athena_journal_pending_draft");
          setSelectedEntry({
            id: "",
            user_id: user?.id || "",
            content: pending,
            reflection_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setIsEditingExisting(false);
          setViewMode("editor");
        }
      } catch {}
    }
  }, [authChecking, user]);

  // Load Entries
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const data = await fetchJournalEntries();
      setEntries(data);
    } catch (e) {
      console.error("Failed to load Space entries:", e);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecking && user) {
      loadEntries();
    }
  }, [authChecking, user, loadEntries]);

  // Client-side gentle search filtering by text and date
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      const contentMatch = (e.content || "").toLowerCase().includes(q);
      const reflectionMatch = (e.ai_reflection || "").toLowerCase().includes(q);

      let dateMatch = false;
      if (e.created_at) {
        if (e.created_at.toLowerCase().includes(q)) dateMatch = true;
        try {
          const d = new Date(e.created_at);
          const formatted = new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            weekday: "long",
          }).format(d).toLowerCase();
          if (formatted.includes(q)) dateMatch = true;
        } catch {}
      }

      return contentMatch || reflectionMatch || dateMatch;
    });
  }, [entries, searchQuery]);

  const { isDemoMode } = useEntitlement();

  // Handle Save in Editor
  const handleSaveEntry = async (content: string) => {
    if (isDemoMode) {
      alert(t("demo_read_only_notice") || "Journal entries are read-only in demo mode. Create a free account to write and save your private thoughts.");
      return;
    }
    setIsSaving(true);
    try {
      if (isEditingExisting && selectedEntry) {
        // Updating existing entry
        const updated = await updateJournalEntry(selectedEntry.id, { content });
        setEntries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedEntry(updated);
        setIsEditingExisting(false);
        setViewMode("reader");
      } else {
        // Creating fresh entry
        const newEntry = await createJournalEntry({ content, reflection_enabled: false });
        setEntries((prev) => [newEntry, ...prev]);
        setSelectedEntry(newEntry);
        // Show gentle reflection prompt modal
        setReflectionModalEntry(newEntry);
      }
    } catch (err: any) {
      console.error("Save entry error:", err);
      throw err; // Allow editor to retain local draft safely
    } finally {
      setIsSaving(false);
    }
  };

  // Reflection Choice 1: Reflect together
  const handleReflectTogether = async () => {
    if (!reflectionModalEntry) return;
    setIsReflecting(true);
    try {
      const updated = await requestJournalReflection(reflectionModalEntry.id);
      setEntries((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedEntry(updated);
      setReflectionModalEntry(null);
      setViewMode("reader");
    } catch (err) {
      console.error("Thought reflection error:", err);
      setReflectionModalEntry(null);
      setViewMode("list");
    } finally {
      setIsReflecting(false);
    }
  };

  // Reflection Choice 2: Keep this private (Default)
  const handleKeepPrivate = () => {
    setReflectionModalEntry(null);
    setSelectedEntry(null);
    setViewMode("list");
  };

  // Handle Release (Delete) in Reader
  const handleDeleteEntry = async (entryId: string) => {
    if (isDemoMode) {
      alert(t("demo_read_only_notice") || "Journal entries are read-only in demo mode to protect sample data.");
      return;
    }
    const success = await deleteJournalEntry(entryId);
    if (success) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setSelectedEntry(null);
      setViewMode("list");
    }
  };

  // Handle On-Demand Thought from Reader
  const handleReaderRequestReflection = async (entryId: string) => {
    setIsReflecting(true);
    try {
      const updated = await requestJournalReflection(entryId);
      setEntries((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedEntry(updated);
    } catch (err) {
      console.error("Reader thought error:", err);
    } finally {
      setIsReflecting(false);
    }
  };

  if (authChecking || !user) {
    return (
      <Loading
        label="Opening Your Private Space..."
        sublabel="Preparing your unhurried writing canvas"
        fullScreen={true}
      />
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)] relative">
      <div className="sanctuary-aurora-bg space-room" />

      {/* Quiet Sanctuary Navigation */}
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Space Container */}
      <div data-tour="journal-area" className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* VIEW 1: Editor View */}
        {viewMode === "editor" && (
          <JournalEditor
            initialContent={isEditingExisting && selectedEntry ? selectedEntry.content : ""}
            userId={user.id}
            onSave={handleSaveEntry}
            onCancel={() => {
              if (isEditingExisting && selectedEntry) {
                setViewMode("reader");
              } else {
                setViewMode("list");
              }
            }}
            isSaving={isSaving}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {/* VIEW 2: Reader View */}
        {viewMode === "reader" && selectedEntry && (
          <JournalReader
            entry={selectedEntry}
            onBack={() => {
              setSelectedEntry(null);
              setIsEditingExisting(false);
              setViewMode("list");
            }}
            onEdit={() => {
              setIsEditingExisting(true);
              setViewMode("editor");
            }}
            onDelete={handleDeleteEntry}
            onRequestReflection={handleReaderRequestReflection}
            isReflecting={isReflecting}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {/* VIEW 3: List / Memory Timeline View */}
        {viewMode === "list" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header: Space (Therapist sanctuary tone) */}
            <div className="text-center space-y-2 pt-2">
              <h1
                className={`text-3xl sm:text-5xl font-serif font-normal tracking-tight transition-colors ${
                  isLight ? "text-stone-900" : "text-[#F8F7FF]"
                }`}
              >
                {t("space_title", "Space")}
              </h1>
              <p
                className={`text-sm sm:text-base italic max-w-md mx-auto leading-relaxed ${
                  isLight ? "text-stone-600" : "text-[#B8BDD6]"
                }`}
              >
                {t("space_subtitle", "A place to put things down.")}
              </p>
            </div>

            {/* Non-blocking Demo Exploration Banner */}
            {isDemoMode && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{t("demo_explore_banner_title") || "Demo Mode: Exploring Sample Journey"}</p>
                    <p className="text-xs text-amber-300/80">{t("demo_read_only_notice") || "Sample entries are read-only to preserve the exploration experience. Create your free account to keep your own private journal."}</p>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-medium whitespace-nowrap transition-colors"
                >
                  {t("demo_limit_create_account") || "Create Account"}
                </Link>
              </div>
            )}

            {/* Action Bar: New Reflection & Gentle Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    scrollPosRef.current = window.scrollY;
                  }
                  setIsEditingExisting(false);
                  setSelectedEntry(null);
                  setViewMode("editor");
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  isLight
                    ? "bg-[#6E4FE6] hover:bg-[#5D3FD3] text-white shadow-[0_4px_16px_rgba(110,79,230,0.25)] border border-[#6E4FE6]/40"
                    : "bg-[#7C5CFF] hover:bg-[#6b4bf0] text-white shadow-[0_0_16px_rgba(124,92,255,0.4)] border border-[#7C5CFF]/40"
                }`}
              >
                <Plus size={16} strokeWidth={2} />
                <span>{t("space_new_reflection", "+ New reflection")}</span>
              </button>

              {/* Gentle Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isLight ? "text-[#78716C]" : "text-[#BFAEFF]/60"
                  }`}
                  size={15}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("space_search_placeholder", "Search entries...")}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 pl-9 text-xs sm:text-sm outline-none transition-all ${
                    isLight
                      ? "bg-white border-[rgba(124,92,255,0.18)] focus:border-[#6E4FE6] focus:ring-2 focus:ring-[#6E4FE6]/15 text-[#1C1917] placeholder-[#78716C]"
                      : "sanctuary-glass border-[#7C5CFF]/20 text-[#F8F7FF] placeholder-[#B8BDD6]/50 focus:border-[#7C5CFF]/50"
                  }`}
                />
              </div>
            </div>

            {/* Entries List */}
            {loadingEntries ? (
              <div
                className={`py-16 text-center space-y-2 text-xs ${
                  isLight ? "text-stone-500" : "text-zinc-500"
                }`}
              >
                <Feather className="mx-auto animate-pulse" size={24} />
                <p>{t("space_loading", "Opening your private notebook...")}</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              // Softer Empty State: Rule 10 Phrasing
              <div
                className={`py-16 text-center rounded-[28px] border p-8 space-y-4 ${
                  isLight ? "border-[#e8e4dc] bg-white/70 shadow-sm" : "border-[#252733] bg-[#181922]/70 shadow-md"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 py-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3
                    className={`text-base font-medium font-serif ${
                      isLight ? "text-stone-800" : "text-zinc-200"
                    }`}
                  >
                    {searchQuery.trim() ? "No matching memories found" : t("space_empty_title", "Every small pause becomes part of your story.")}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm font-serif max-w-sm mx-auto leading-relaxed ${
                      isLight ? "text-stone-500" : "text-zinc-400"
                    }`}
                  >
                    {searchQuery.trim()
                      ? "Try searching with another word or clear your search."
                      : t("space_empty_subtitle", "Your space is waiting. Arrive whenever you are ready.")}
                  </p>
                </div>
                {!searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        scrollPosRef.current = window.scrollY;
                      }
                      setIsEditingExisting(false);
                      setSelectedEntry(null);
                      setViewMode("editor");
                    }}
                    className={`inline-flex items-center gap-2 rounded-[18px] py-2.5 px-5 text-xs font-serif font-medium shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      isLight
                        ? "bg-stone-900 hover:bg-stone-800 text-white"
                        : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}
                  >
                    <span>{t("space_write_thought", "Write one thought")}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`px-1 text-[11px] font-semibold uppercase tracking-wider ${
                    isLight ? "text-stone-500" : "text-zinc-500"
                  }`}
                >
                  {t("space_previous_entries", "Previous Reflections")} ({filteredEntries.length})
                </div>
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredEntries.map((entry) => (
                    <JournalCard
                      key={entry.id}
                      entry={entry}
                      theme={theme}
                      onOpen={(e) => {
                        if (typeof window !== "undefined") {
                          scrollPosRef.current = window.scrollY;
                        }
                        setSelectedEntry(e);
                        setViewMode("reader");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post-save Reflection Choice Modal */}
      <JournalReflectionModal
        isOpen={!!reflectionModalEntry}
        onReflectTogether={handleReflectTogether}
        onKeepPrivate={handleKeepPrivate}
        isReflecting={isReflecting}
        theme={theme}
      />
    </main>
  );
}
