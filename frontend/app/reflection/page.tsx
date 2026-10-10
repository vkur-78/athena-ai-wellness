"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  fetchCurrentWeeklyReflection,
  generateWeeklyReflection,
  fetchReflectionHistory,
  searchReflectionUniverse,
} from "@/lib/api";
import {
  WeeklyReflection,
  ReflectionHistoryResponse,
  ReflectionSearchResultItem,
} from "@/types/reflection";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTheme } from "@/context/ThemeContext";
import {
  ArrowLeft,
  Search,
  Compass,
  Sparkles,
  Heart,
  Feather,
  Mail,
  RotateCcw,
  BookOpen,
  Check,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function ReflectionHubPage() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();

  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [history, setHistory] = useState<ReflectionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  // Natural Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ReflectionSearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (active && token) {
          setAuthToken(token);
        }

        const [weeklyData, histData] = await Promise.all([
          fetchCurrentWeeklyReflection(token),
          fetchReflectionHistory(token),
        ]);

        if (active) {
          setReflection(weeklyData);
          setHistory(histData);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[Reflection Hub Load Error]:", err);
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await generateWeeklyReflection(authToken, true);
      if (refreshed) {
        setReflection(refreshed);
      }
    } catch (err) {
      console.warn("[Refresh Reflection Error]:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    try {
      const res = await searchReflectionUniverse(searchQuery, authToken);
      setSearchResults(res.results || []);
      setHasSearched(true);
    } catch (err) {
      console.warn("[Search Error]:", err);
    } finally {
      setSearching(false);
    }
  };

  const content = reflection?.content;
  const companionNotes = content?.companion_notes || [
    "You kept returning.",
    "You made room for quieter evenings.",
    "You didn't have to do everything alone.",
  ];

  return (
    <main
      className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${
        isLight
          ? "bg-[#f8f6f0] text-stone-900 selection:bg-stone-200"
          : "bg-[#121316] text-zinc-100 selection:bg-violet-900/40"
      }`}
    >
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-14">
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between pb-8">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-serif transition-colors ${
              isLight
                ? "text-stone-600 hover:text-stone-900"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            <ArrowLeft size={16} />
            <span>Return Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/reflection/monthly"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-serif transition-all duration-200 ${
                isLight
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                  : "bg-[#282421] hover:bg-[#342f2b] text-amber-200 border-amber-800/40"
              }`}
            >
              <Mail size={12} />
              <span>Monthly Keepsake</span>
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-serif transition-all duration-200 ${
                isLight
                  ? "bg-[#ede8df] hover:bg-[#e4ded3] text-stone-700 border-[#ded7ca]"
                  : "bg-[#23242c] hover:bg-[#2c2d38] text-violet-300 border-violet-800/30"
              } ${refreshing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              title="Re-observe and refresh reflection from verified activity"
            >
              <RotateCcw
                size={12}
                className={refreshing ? "animate-spin" : ""}
              />
              <span>{refreshing ? "Listening..." : "Gently Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Reflection Search Bar */}
        <section className="pb-10">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across conversations, Space, Studio, and reflections..."
                className={`w-full rounded-2xl border py-3 pl-11 pr-24 text-xs sm:text-sm font-serif outline-none transition-all duration-200 ${
                  isLight
                    ? "bg-[#fdfbf7] border-[#e7e5e4] focus:border-stone-400 placeholder:text-stone-400 text-stone-900"
                    : "bg-[#1c1d22] border-[#2a2b33] focus:border-[#424452] placeholder:text-zinc-500 text-zinc-100"
                }`}
              />
              <Search
                size={16}
                className={`absolute left-3.5 ${
                  isLight ? "text-stone-400" : "text-zinc-500"
                }`}
              />
              <button
                type="submit"
                disabled={searching}
                className={`absolute right-2 px-3 py-1.5 rounded-xl text-xs font-serif font-medium transition-colors cursor-pointer ${
                  isLight
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "bg-[#282937] hover:bg-[#343547] text-violet-200"
                }`}
              >
                {searching ? "Finding..." : "Search"}
              </button>
            </div>
          </form>

          {/* Search Results Display */}
          {hasSearched && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-serif text-stone-500 dark:text-zinc-400 px-1">
                <span>
                  Found {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for &ldquo;{searchQuery}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setHasSearched(false);
                    setSearchResults([]);
                  }}
                  className="hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div
                  className={`p-6 rounded-2xl border text-center text-xs font-serif italic ${
                    isLight
                      ? "bg-[#fdfbf7] border-[#e7e5e4] text-stone-500"
                      : "bg-[#1c1d22] border-[#2a2b33] text-zinc-400"
                  }`}
                >
                  No specific moments found for that search. Try searching for &ldquo;breathing&rdquo;, &ldquo;quiet&rdquo;, or &ldquo;space&rdquo;.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {searchResults.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.link}
                      className={`block p-4 rounded-2xl border transition-all ${
                        isLight
                          ? "bg-[#fdfbf7] border-[#e7e5e4] hover:border-stone-400"
                          : "bg-[#1c1d22] border-[#2a2b33] hover:border-[#3a3c48]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-wider text-stone-500 dark:text-zinc-400 pb-1">
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                          {item.source}
                        </span>
                        <span>{item.date}</span>
                      </div>
                      <h4
                        className={`text-sm font-serif font-semibold ${
                          isLight ? "text-stone-900" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p
                        className={`text-xs font-serif mt-1 ${
                          isLight ? "text-stone-600" : "text-zinc-400"
                        }`}
                      >
                        {item.snippet}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center space-y-4 animate-pulse">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isLight
                  ? "bg-[#ede8df] border-[#ded7ca] text-stone-700"
                  : "bg-[#232530] border-violet-800/30 text-violet-300"
              }`}
            >
              <Compass size={22} className="animate-spin" />
            </div>
            <p
              className={`text-sm font-serif italic ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              Opening your private reading room...
            </p>
          </div>
        ) : (
          <div className="space-y-14 animate-in fade-in duration-500">
            {/* COMPANION NOTES (3 Memorable Observations) */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-3 px-4 rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 bg-stone-100/40 dark:bg-[#18191f]/40">
              {companionNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs sm:text-sm font-serif italic text-stone-600 dark:text-zinc-400"
                >
                  <Sparkles size={12} className="text-amber-500 shrink-0" />
                  <span>&ldquo;{note}&rdquo;</span>
                </div>
              ))}
            </div>

            {/* HONEST EMPTY STATE NOTICE (if applicable) */}
            {content?.is_empty_state && content?.empty_state_notice && (
              <div
                className={`p-6 rounded-3xl border text-center space-y-2 ${
                  isLight
                    ? "bg-amber-50/50 border-amber-200/80 text-amber-900"
                    : "bg-[#26221f] border-amber-800/30 text-amber-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-semibold">
                  <Feather size={14} />
                  <span>Sanctuary Baseline</span>
                </div>
                <p className="text-xs sm:text-sm font-serif leading-relaxed max-w-lg mx-auto">
                  {content.empty_state_notice}
                </p>
              </div>
            )}

            {/* SECTION 1 — YOUR WEEK IN ONE SENTENCE */}
            <section className="text-center space-y-3 pt-2">
              <span
                className={`text-[11px] font-serif uppercase tracking-widest px-3 py-1 rounded-full border ${
                  isLight
                    ? "bg-stone-100 border-stone-200 text-stone-600"
                    : "bg-[#23242c] border-[#363844] text-zinc-400"
                }`}
              >
                {reflection?.formatted_dates || "This Week"}
              </span>

              <h1
                className={`text-2xl sm:text-4xl font-serif font-medium leading-relaxed tracking-tight max-w-2xl mx-auto ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                &ldquo;{content?.one_sentence}&rdquo;
              </h1>
            </section>

            {/* SECTION 2 — THE STORY OF YOUR WEEK (Three Thoughtful Paragraphs) */}
            <section
              className="space-y-6 pt-2"
              aria-labelledby="story-heading"
            >
              <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-stone-500 dark:text-zinc-400 border-b border-stone-200/80 dark:border-zinc-800/80 pb-2">
                <BookOpen size={14} />
                <h2 id="story-heading" className="font-semibold">
                  The Story of Your Week
                </h2>
              </div>

              <div className="space-y-5">
                {(content?.story_of_week || []).map((paragraph, idx) => (
                  <p
                    key={idx}
                    className={`text-sm sm:text-base font-serif leading-relaxed text-justify sm:text-left ${
                      isLight ? "text-stone-800" : "text-zinc-200"
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {/* SECTION 3 — MOMENTS THAT MATTERED ⭐ (Interactive Moment Cards) */}
            <section className="space-y-5" aria-labelledby="moments-heading">
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                  <Sparkles size={14} className="text-amber-500" />
                  <h2 id="moments-heading" className="font-semibold">
                    Moments That Mattered ⭐
                  </h2>
                </div>
                <span className="text-[11px] font-serif italic text-stone-400 dark:text-zinc-500">
                  Real pauses, verified from your activity
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(content?.moments_that_mattered || []).map((m, idx) => (
                  <div
                    key={idx}
                    className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                      isLight
                        ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
                        : "bg-[#1c1d22] border-[#2a2b33] shadow-xs"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-serif font-medium ${
                            isLight ? "text-stone-500" : "text-zinc-400"
                          }`}
                        >
                          {m.date}
                        </span>
                        {m.category && (
                          <span
                            className={`text-[10px] font-serif uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isLight
                                ? "bg-stone-100 border-stone-200 text-stone-600"
                                : "bg-[#23242c] border-[#363844] text-zinc-400"
                            }`}
                          >
                            {m.category}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base font-serif font-semibold ${
                          isLight ? "text-stone-900" : "text-white"
                        }`}
                      >
                        {m.title}
                      </h3>

                      <p
                        className={`text-xs sm:text-sm font-serif leading-relaxed ${
                          isLight ? "text-stone-700" : "text-zinc-300"
                        }`}
                      >
                        {m.reflection}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4 — QUIET PATTERNS & CATEGORIES */}
            <section
              className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${
                isLight
                  ? "bg-[#fdfbf7] border-[#e7e5e4] shadow-xs"
                  : "bg-[#1c1d22] border-[#2a2b33] shadow-xs"
              }`}
              aria-labelledby="patterns-heading"
            >
              <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-zinc-800/70 pb-2">
                <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                  <Compass size={14} />
                  <h2 id="patterns-heading" className="font-semibold">
                    Quiet Patterns
                  </h2>
                </div>
                <span className="text-[11px] font-serif italic text-stone-400 dark:text-zinc-500">
                  Evidence-backed observations
                </span>
              </div>

              {/* Insight Categories Tags */}
              {content?.insight_categories && content.insight_categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {content.insight_categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] font-serif px-2.5 py-1 rounded-full border ${
                        isLight
                          ? "bg-stone-100/90 border-stone-200 text-stone-700"
                          : "bg-[#252631] border-[#363844] text-zinc-300"
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <ul className="space-y-3 pt-1">
                {(content?.quiet_patterns || []).map((pattern, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm font-serif leading-relaxed"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 ${
                        isLight ? "bg-stone-400" : "bg-zinc-500"
                      }`}
                    />
                    <span className={isLight ? "text-stone-800" : "text-zinc-200"}>
                      {pattern}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* SECTION 5 — WHAT HELPED (Practical Interventions) */}
            <section className="space-y-4" aria-labelledby="helped-heading">
              <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-stone-500 dark:text-zinc-400 border-b border-stone-200/80 dark:border-zinc-800/80 pb-2">
                <Check size={14} className="text-emerald-500" />
                <h2 id="helped-heading" className="font-semibold">
                  What Helped
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(content?.what_helped || []).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      isLight
                        ? "bg-[#fdfbf7] border-[#e7e5e4]"
                        : "bg-[#1c1d22] border-[#2a2b33]"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isLight
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                      }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-serif leading-relaxed ${
                        isLight ? "text-stone-800" : "text-zinc-200"
                      }`}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 6 — ONE GENTLE INVITATION */}
            <section
              className={`rounded-3xl border p-6 sm:p-8 space-y-3 ${
                isLight
                  ? "bg-rose-50/40 border-rose-200/70"
                  : "bg-[#251e22] border-rose-900/30"
              }`}
              aria-labelledby="invitation-heading"
            >
              <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-rose-700 dark:text-rose-300">
                <Heart size={14} />
                <h2 id="invitation-heading" className="font-semibold">
                  One Gentle Invitation
                </h2>
              </div>
              <p
                className={`text-sm sm:text-base font-serif italic leading-relaxed ${
                  isLight ? "text-stone-900" : "text-rose-100"
                }`}
              >
                &ldquo;{content?.one_invitation}&rdquo;
              </p>
              <p
                className={`text-[11px] font-serif ${
                  isLight ? "text-stone-500" : "text-rose-300/70"
                }`}
              >
                Only one suggestion. Never homework or obligation.
              </p>
            </section>

            {/* SECTION 7 — CLOSING LETTER */}
            <section
              className="text-center pt-8 pb-4 space-y-3 border-t border-stone-200/80 dark:border-zinc-800/80"
              aria-labelledby="closing-heading"
            >
              <h2 id="closing-heading" className="sr-only">
                Closing Letter
              </h2>
              <div
                className={`text-sm sm:text-base font-serif italic leading-relaxed whitespace-pre-line max-w-lg mx-auto ${
                  isLight ? "text-stone-700" : "text-zinc-300"
                }`}
              >
                {content?.closing}
              </div>
              <p
                className={`text-xs font-serif tracking-wide uppercase pt-4 ${
                  isLight ? "text-stone-400" : "text-zinc-500"
                }`}
              >
                Athena Sanctuary
              </p>
            </section>

            {/* GATEWAY TO MONTHLY REFLECTION */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                isLight
                  ? "bg-amber-50/40 border-amber-200/80"
                  : "bg-[#25221f] border-amber-800/40"
              }`}
            >
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-serif uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <Mail size={14} />
                  <span className="font-semibold">Athena Signature Feature</span>
                </div>
                <h3
                  className={`text-lg font-serif font-semibold ${
                    isLight ? "text-stone-900" : "text-white"
                  }`}
                >
                  Monthly Keepsake Report
                </h3>
                <p
                  className={`text-xs sm:text-sm font-serif max-w-md ${
                    isLight ? "text-stone-600" : "text-zinc-300"
                  }`}
                >
                  Receive a beautifully written personal letter synthesizing your entire month, complete with a 6-page keepsake PDF document.
                </p>
              </div>

              <Link
                href="/reflection/monthly"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-serif font-semibold transition-all shrink-0 cursor-pointer ${
                  isLight
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "bg-[#332c26] hover:bg-[#423932] text-amber-200 border border-amber-700/40"
                }`}
              >
                <span>Open Monthly Keepsake</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* PAST REFLECTION HISTORY */}
            {history && (history.weekly.length > 1 || history.monthly.length > 0) && (
              <section className="space-y-4 pt-4 border-t border-stone-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                  <Calendar size={14} />
                  <h3 className="font-semibold">Reflection Archives</h3>
                </div>

                <div className="space-y-2">
                  {history.weekly.slice(1, 5).map((w, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-serif ${
                        isLight
                          ? "bg-[#fdfbf7] border-[#e7e5e4]"
                          : "bg-[#1c1d22] border-[#2a2b33]"
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">{w.title}</span>
                        <span className="text-stone-500 dark:text-zinc-400 text-xs italic">
                          &ldquo;{w.preview_sentence}&rdquo;
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 dark:text-zinc-500 shrink-0 ml-4">
                        {w.date_label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
