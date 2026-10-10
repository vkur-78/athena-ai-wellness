"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  isLight: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "athena_theme";
const LEGACY_STORAGE_KEY = "athena_journal_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage (default to light / Quiet Parchment)
  useEffect(() => {
    try {
      const stored =
        (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ||
        (localStorage.getItem(LEGACY_STORAGE_KEY) as ThemeMode | null);
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      } else {
        // Quiet Parchment default for sanctuary feel
        setThemeState("light");
      }
    } catch {
      setThemeState("light");
    }
    setMounted(true);
  }, []);

  // Synchronize class and attributes on <html> and <body>
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(LEGACY_STORAGE_KEY, theme);
    } catch {
      // ignore in restricted environments
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "light") {
      root.classList.remove("dark", "theme-night");
      root.classList.add("light", "theme-parchment");
      document.body.classList.remove("theme-night", "bg-[#060814]", "text-[#F8F7FF]");
      document.body.classList.add("theme-parchment", "bg-[#FAF7F2]", "text-[#1C1917]");
    } else {
      root.classList.remove("light", "theme-parchment");
      root.classList.add("dark", "theme-night");
      document.body.classList.remove("theme-parchment", "bg-[#FAF7F2]", "text-[#1C1917]");
      document.body.classList.add("theme-night", "bg-[#060814]", "text-[#F8F7FF]");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const value: ThemeContextType = {
    theme,
    isLight: theme === "light",
    isDark: theme === "dark",
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Provide a safe fallback if used outside provider during initial render/tests
    return {
      theme: "light",
      isLight: true,
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
