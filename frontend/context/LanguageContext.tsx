"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  WebsiteLanguage,
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
  LanguageOption,
} from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { DEMO_USER_ID, isExplicitDemoUser } from "@/lib/auth";
import { fetchUserProfile, patchUserProfile } from "@/lib/api";

interface LanguageContextType {
  language: WebsiteLanguage;
  setLanguage: (lang: WebsiteLanguage) => void;
  currentLanguage: LanguageOption;
  languages: LanguageOption[];
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LANGUAGE_STORAGE_KEY = "athena_website_lang";
export const DEMO_LANGUAGE_STORAGE_KEY = "athena_demo_language";
export const GUEST_LANGUAGE_STORAGE_KEY = "athena_guest_language";
export const USER_LANG_STORAGE_PREFIX = "athena_lang_";

function isValidLanguage(val: any): val is WebsiteLanguage {
  return typeof val === "string" && SUPPORTED_LANGUAGES.some((l) => l.code === val);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<WebsiteLanguage>("en");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const activeUserIdRef = useRef<string | null>(null);
  const isDemoRef = useRef<boolean>(false);

  // Sync ref with state
  useEffect(() => {
    activeUserIdRef.current = activeUserId;
    isDemoRef.current = isDemoUser;
  }, [activeUserId, isDemoUser]);

  const applyDomLanguage = useCallback((lang: WebsiteLanguage) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute("data-lang", lang);
    }
  }, []);

  // Resolve and load the language for a given user context
  const resolveUserLanguage = useCallback(
    async (userId: string | null, isDemo: boolean, token?: string) => {
      if (typeof window === "undefined") return;

      if (isDemo) {
        // Scoped strictly to demo session
        const savedDemo = localStorage.getItem(DEMO_LANGUAGE_STORAGE_KEY);
        if (isValidLanguage(savedDemo)) {
          setLanguageState(savedDemo);
          applyDomLanguage(savedDemo);
        } else {
          setLanguageState("en");
          applyDomLanguage("en");
        }
        return;
      }

      if (userId) {
        // Authenticated registered user
        const scopedKey = `${USER_LANG_STORAGE_PREFIX}${userId}`;
        const savedUserLang = localStorage.getItem(scopedKey);

        if (isValidLanguage(savedUserLang)) {
          setLanguageState(savedUserLang);
          applyDomLanguage(savedUserLang);
        } else {
          // If no local preference yet, check if there's legacy preference for migration
          const legacy = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (isValidLanguage(legacy)) {
            localStorage.setItem(scopedKey, legacy);
            localStorage.removeItem(LANGUAGE_STORAGE_KEY);
            localStorage.removeItem("athena_language");
            setLanguageState(legacy);
            applyDomLanguage(legacy);
          } else {
            // New user defaults to English
            setLanguageState("en");
            applyDomLanguage("en");
          }
        }

        // Also fetch user profile from server to guarantee sync with backend persistence
        try {
          const profile = await fetchUserProfile(token);
          if (profile && isValidLanguage(profile.language)) {
            // Server preference takes precedence and updates user-scoped cache
            setLanguageState(profile.language);
            localStorage.setItem(scopedKey, profile.language);
            applyDomLanguage(profile.language);
          }
        } catch (e) {
          console.warn("[LanguageContext] Profile fetch sync skipped:", e);
        }
        return;
      }

      // Guest / unauthenticated visitor
      const guestLang = localStorage.getItem(GUEST_LANGUAGE_STORAGE_KEY);
      if (isValidLanguage(guestLang)) {
        setLanguageState(guestLang);
        applyDomLanguage(guestLang);
      } else {
        setLanguageState("en");
        applyDomLanguage("en");
      }
    },
    [applyDomLanguage]
  );

  // Initialize and subscribe to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuthAndLanguage() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const isDemo =
          localStorage.getItem("athena_demo_mode") === "true" ||
          session?.user?.id === DEMO_USER_ID ||
          isExplicitDemoUser(session?.user);

        const uid = isDemo ? DEMO_USER_ID : session?.user?.id || null;

        setActiveUserId(uid);
        setIsDemoUser(isDemo);
        activeUserIdRef.current = uid;
        isDemoRef.current = isDemo;

        await resolveUserLanguage(uid, isDemo, session?.access_token);
      } catch (err) {
        console.warn("[LanguageContext] Init error:", err);
      }
    }

    initAuthAndLanguage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      const isDemo =
        localStorage.getItem("athena_demo_mode") === "true" ||
        newSession?.user?.id === DEMO_USER_ID ||
        isExplicitDemoUser(newSession?.user);

      const uid = isDemo ? DEMO_USER_ID : newSession?.user?.id || null;

      // When switching accounts or logging out, discard previous in-memory state
      if (uid !== activeUserIdRef.current || isDemo !== isDemoRef.current) {
        setActiveUserId(uid);
        setIsDemoUser(isDemo);
        activeUserIdRef.current = uid;
        isDemoRef.current = isDemo;

        await resolveUserLanguage(uid, isDemo, newSession?.access_token);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveUserLanguage]);

  // setLanguage handles instant UI update + user-scoped persistence
  const setLanguage = useCallback(
    (lang: WebsiteLanguage) => {
      if (!isValidLanguage(lang)) return;

      setLanguageState(lang);
      applyDomLanguage(lang);

      try {
        const isDemo = isDemoRef.current || localStorage.getItem("athena_demo_mode") === "true";
        const uid = activeUserIdRef.current;

        if (isDemo) {
          // Demo user: store in demo-scoped key only
          localStorage.setItem(DEMO_LANGUAGE_STORAGE_KEY, lang);
        } else if (uid) {
          // Authenticated registered user: store in user-scoped key and backend profile
          const scopedKey = `${USER_LANG_STORAGE_PREFIX}${uid}`;
          localStorage.setItem(scopedKey, lang);
          // Persist to backend
          patchUserProfile({ language: lang }).catch((err) => {
            console.warn("[LanguageContext] Backend profile update error:", err);
          });
        } else {
          // Guest
          localStorage.setItem(GUEST_LANGUAGE_STORAGE_KEY, lang);
        }

        // Clean up legacy unscoped keys
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.removeItem("athena_language");
      } catch (err) {
        console.warn("[LanguageContext] Save error:", err);
      }
    },
    [applyDomLanguage]
  );

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = useCallback(
    (key: string, fallback?: string, params?: Record<string, string | number>): string => {
      const activeDict = UI_TRANSLATIONS[language];
      let str = "";
      if (activeDict && activeDict[key]) {
        str = activeDict[key];
      } else {
        // Fallback to English
        const enDict = UI_TRANSLATIONS["en"];
        if (enDict && enDict[key]) {
          str = enDict[key];
        } else {
          str = fallback !== undefined ? fallback : key;
        }
      }

      if (params && typeof str === "string") {
        Object.entries(params).forEach(([pKey, pVal]) => {
          str = str.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
        });
      }

      return str;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguage,
      languages: SUPPORTED_LANGUAGES,
      t,
    }),
    [language, setLanguage, currentLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
