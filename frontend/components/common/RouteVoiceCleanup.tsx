"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { voiceSessionManager } from "@/lib/voiceSessionManager";
import { supabase } from "@/lib/supabase";

/**
 * RouteVoiceCleanup
 *
 * Global watchdog component mounted at the RootLayout level.
 * Triggers voiceSessionManager.stopAll() on:
 * 1. Any Next.js client-side route navigation
 * 2. Supabase auth SIGNED_OUT event (immediate logout kill switch)
 * 3. Browser tab close, reload, or pagehide
 */
export default function RouteVoiceCleanup() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  // 1. Navigation Route Change Trigger
  useEffect(() => {
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      voiceSessionManager.stopAll();
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  // 2. Auth Logout & Browser Lifecycle Triggers
  useEffect(() => {
    // Supabase auth change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        voiceSessionManager.stopAll();
      }
    });

    // Browser unload or tab switch/close
    const handleUnload = () => {
      voiceSessionManager.stopAll();
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  // 3. Dev-mode phantom font cleanup (prevents document.fonts.ready hanging on unloaded dev fonts)
  useEffect(() => {
    const cleanFonts = () => {
      if (typeof document !== "undefined" && (document as any).fonts) {
        try {
          (document as any).fonts.clear();
        } catch (_) {}
      }
    };
    cleanFonts();
    const timer = setInterval(cleanFonts, 300);
    return () => clearInterval(timer);
  }, [pathname]);

  return null;
}
