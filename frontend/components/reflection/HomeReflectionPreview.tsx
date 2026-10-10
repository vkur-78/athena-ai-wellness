"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, ArrowRight, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { fetchHomeReflectionPreview } from "@/lib/api";
import { HomeReflectionPreview as HomePreviewType } from "@/types/reflection";

interface HomeReflectionPreviewProps {
  token?: string;
}

export default function HomeReflectionPreview({ token }: HomeReflectionPreviewProps) {
  const { isLight } = useTheme();
  const [preview, setPreview] = useState<HomePreviewType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPreview() {
      try {
        const res = await fetchHomeReflectionPreview(token);
        if (active) {
          setPreview(res);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[HomeReflectionPreview Error]:", err);
        if (active) setLoading(false);
      }
    }

    loadPreview();
    return () => {
      active = false;
    };
  }, [token]);

  const previewSentence =
    preview?.preview_sentence ||
    "There were moments this week where writing created a little breathing room.";
  const weekLabel = preview?.week_label || "This Week";

  return (
    <section
      aria-labelledby="home-reflection-preview-title"
      className="w-full pt-1 animate-in fade-in duration-300"
    >
      <div
        className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group ${
          isLight
            ? "bg-[#fdfbf7] border-[#e7e5e4] hover:border-stone-400 shadow-sm"
            : "bg-[#1c1d22] border-[#2a2b33] hover:border-[#3a3c48] shadow-xs"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                  isLight
                    ? "bg-stone-100 border-stone-200 text-stone-700"
                    : "bg-[#23242c] border-[#363844] text-violet-300"
                }`}
              >
                <Compass size={16} />
              </div>
              <h2
                id="home-reflection-preview-title"
                className={`text-xs sm:text-sm font-serif font-semibold tracking-wide uppercase ${
                  isLight ? "text-stone-700" : "text-zinc-300"
                }`}
              >
                This Week&apos;s Reflection
              </h2>
            </div>
            <span
              className={`text-[11px] font-serif px-3 py-1 rounded-full border ${
                isLight
                  ? "bg-stone-100/90 border-stone-200 text-stone-600"
                  : "bg-[#23242c] border-[#363844] text-zinc-400"
              }`}
            >
              {weekLabel}
            </span>
          </div>

          <p
            className={`text-base sm:text-lg font-serif italic leading-relaxed ${
              isLight ? "text-stone-800" : "text-zinc-100"
            }`}
          >
            &ldquo;{previewSentence}&rdquo;
          </p>
        </div>

        <div className="pt-6 flex items-center justify-between">
          <Link
            href="/insights"
            className={`inline-flex items-center gap-2 rounded-[20px] py-2.5 px-5 text-xs sm:text-sm font-serif font-medium transition-all duration-[220ms] active:scale-[0.98] duration-[180ms] cursor-pointer ${
              isLight
                ? "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_14px_rgba(139,92,246,0.3)]"
            }`}
            aria-label="View Athena Reflections"
          >
            <span>View Reflections</span>
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <span
            className={`text-[11px] font-serif italic ${
              isLight ? "text-stone-400" : "text-zinc-500"
            }`}
          >
            Private Sanctuary living companion
          </span>
        </div>
      </div>
    </section>
  );
}
