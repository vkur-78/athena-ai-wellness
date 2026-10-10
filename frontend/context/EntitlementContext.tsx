"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type EntitlementMode = "DEMO" | "TRIAL_30_DAYS" | "ATHENA_FREE" | "ATHENA_PLUS";

export interface EntitlementContextType {
  mode: EntitlementMode;
  isDemoMode: boolean;
  isTrialActive: boolean;
  isPaid: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  canAccess: (feature: string) => boolean;
  activateDemoMode: () => void;
  exitDemoMode: () => Promise<void>;
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

import { isExplicitDemoUser, clearDemoSessionStorage, clearAllSanctuarySessions } from "@/lib/auth";

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [backendDaysRemaining, setBackendDaysRemaining] = useState<number | null>(null);
  const [backendTrialActive, setBackendTrialActive] = useState<boolean | null>(null);
  const [backendIsPaid, setBackendIsPaid] = useState<boolean>(false);
  const [backendEntitlementMode, setBackendEntitlementMode] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  const openUpgradeModal = useCallback(() => setIsUpgradeModalOpen(true), []);
  const closeUpgradeModal = useCallback(() => setIsUpgradeModalOpen(false), []);

  // Check auth & profile on mount and session change
  useEffect(() => {
    let active = true;

    async function evaluateEntitlement() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        const isSeededDemo = isExplicitDemoUser(session?.user);

        // 1. REAL AUTHENTICATED USER: Authenticated identity strictly takes precedence
        if (session?.user && !isSeededDemo) {
          setIsDemoMode(false);
          clearDemoSessionStorage();

          if (session.user.created_at) {
            setCreatedAt(session.user.created_at);
          }

          // Fetch authoritative profile trial if token exists
          if (session.access_token) {
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
              const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/profile`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              if (res.ok) {
                const prof = await res.json();
                if (active && prof) {
                  if (typeof prof.trial_days_remaining === "number") {
                    setBackendDaysRemaining(prof.trial_days_remaining);
                  }
                  if (typeof prof.trial_active === "boolean") {
                    setBackendTrialActive(prof.trial_active);
                  }
                  if (prof.is_paid === true || prof.entitlement_mode === "ATHENA_PLUS") {
                    setBackendIsPaid(true);
                  }
                  if (prof.entitlement_mode) {
                    setBackendEntitlementMode(prof.entitlement_mode);
                  }
                  if (prof.created_at) {
                    setCreatedAt(prof.created_at);
                  }
                }
              }
            } catch {}
          }
          return;
        }

        // 2. EXPLICIT DEMO USER: Either explicit Aarav session or unauthenticated visitor with explicit demo flag
        const demoFlag = typeof window !== "undefined" && localStorage.getItem("athena_demo_mode") === "true";
        if (isSeededDemo || (demoFlag && !session?.user)) {
          setIsDemoMode(true);
          try {
            localStorage.setItem("athena_demo_mode", "true");
          } catch {}
          return;
        }

        // 3. UNAUTHENTICATED VISITOR: Default clean state
        setIsDemoMode(false);
      } catch {}
    }

    evaluateEntitlement();

    // Subscribe to auth state transitions in real time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        evaluateEntitlement();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Compute 30-Day Trial duration based on user created_at or backend authority
  const { isTrialActive, trialDaysRemaining } = useMemo(() => {
    if (isDemoMode) {
      return { isTrialActive: false, trialDaysRemaining: 0 };
    }
    if (backendIsPaid || backendEntitlementMode === "ATHENA_PLUS") {
      return { isTrialActive: false, trialDaysRemaining: 0 };
    }
    if (backendDaysRemaining !== null && backendTrialActive !== null) {
      return { isTrialActive: backendTrialActive, trialDaysRemaining: backendDaysRemaining };
    }
    if (!createdAt) {
      return { isTrialActive: true, trialDaysRemaining: 30 };
    }
    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const daysSince = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 30 - daysSince);
    return {
      isTrialActive: remaining > 0,
      trialDaysRemaining: remaining,
    };
  }, [isDemoMode, backendIsPaid, backendEntitlementMode, backendDaysRemaining, backendTrialActive, createdAt]);

  const isPaid = !isDemoMode && (backendIsPaid || backendEntitlementMode === "ATHENA_PLUS");
  const isTrialExpired = !isDemoMode && !isPaid && !isTrialActive;

  // Determine current effective entitlement mode
  const mode: EntitlementMode = useMemo(() => {
    if (isDemoMode) return "DEMO";
    if (isPaid) return "ATHENA_PLUS";
    if (isTrialActive) return "TRIAL_30_DAYS";
    return "ATHENA_FREE";
  }, [isDemoMode, isPaid, isTrialActive]);

  // Clean, extensible entitlement check
  const canAccess = useCallback(
    (feature: string): boolean => {
      // Demo, Active Trial, and Athena Plus have 100% full access
      if (mode === "DEMO" || mode === "TRIAL_30_DAYS" || mode === "ATHENA_PLUS") {
        return true;
      }

      // Athena Free allows all basic wellness read tools
      const freeFeatures = [
        "checkin_view",
        "journal_view",
        "conversations_view",
        "insights_basic",
        "replay_basic",
        "care",
        "profile",
        "language",
      ];
      return freeFeatures.includes(feature);
    },
    [mode]
  );

  const activateDemoMode = useCallback(() => {
    try {
      localStorage.setItem("athena_demo_mode", "true");
    } catch {}
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(async () => {
    await clearAllSanctuarySessions();
    setIsDemoMode(false);
    window.location.href = "/login";
  }, []);

  const value = useMemo<EntitlementContextType>(
    () => ({
      mode,
      isDemoMode,
      isTrialActive,
      isPaid,
      isTrialExpired,
      trialDaysRemaining,
      canAccess,
      activateDemoMode,
      exitDemoMode,
      isUpgradeModalOpen,
      openUpgradeModal,
      closeUpgradeModal,
    }),
    [
      mode,
      isDemoMode,
      isTrialActive,
      isPaid,
      isTrialExpired,
      trialDaysRemaining,
      canAccess,
      activateDemoMode,
      exitDemoMode,
      isUpgradeModalOpen,
      openUpgradeModal,
      closeUpgradeModal,
    ]
  );

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement(): EntitlementContextType {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error("useEntitlement must be used within an EntitlementProvider");
  }
  return context;
}
