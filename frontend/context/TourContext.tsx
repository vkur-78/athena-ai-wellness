"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface TourStep {
  id: string;
  step: number;
  route: string;
  target: string;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "home",
    step: 1,
    route: "/",
    target: "[data-tour='home-overview']",
    titleKey: "tour_step_home_title",
    titleFallback: "1. Home Sanctuary",
    descKey: "tour_step_home_desc",
    descFallback:
      "This is your personal command center. Your recent check-ins, practices, reflections and activity come together here.",
  },
  {
    id: "checkin",
    step: 2,
    route: "/",
    target: "[data-tour='daily-checkin']",
    titleKey: "tour_step_checkin_title",
    titleFallback: "2. Daily Check-in",
    descKey: "tour_step_checkin_desc",
    descFallback:
      "Take a moment to record how you're feeling today. Your check-ins help Athena understand your journey over time.",
  },
  {
    id: "space",
    step: 3,
    route: "/journal",
    target: "[data-tour='journal-area']",
    titleKey: "tour_step_journal_title",
    titleFallback: "3. Space / Journal",
    descKey: "tour_step_journal_desc",
    descFallback:
      "Write freely about what's on your mind. Your reflections stay within your Athena experience.",
  },
  {
    id: "conversation",
    step: 4,
    route: "/chat",
    target: "[data-tour='conversation-area']",
    titleKey: "tour_step_chat_title",
    titleFallback: "4. Athena Conversation",
    descKey: "tour_step_chat_desc",
    descFallback:
      "Talk with Athena when you want to reflect, think something through, or simply put your thoughts into words.",
  },
  {
    id: "studio",
    step: 5,
    route: "/studio",
    target: "[data-tour='studio-area']",
    titleKey: "tour_step_studio_title",
    titleFallback: "5. The Studio",
    descKey: "tour_step_studio_desc",
    descFallback:
      "Explore guided practices for breathing, grounding, reflection and quiet moments.",
  },
  {
    id: "insights",
    step: 6,
    route: "/insights",
    target: "[data-tour='insights-overview']",
    titleKey: "tour_step_insights_title",
    titleFallback: "6. Longitudinal Insights",
    descKey: "tour_step_insights_desc",
    descFallback:
      "As your history grows, Athena helps you notice patterns across your check-ins, journaling and practices.",
  },
  {
    id: "weekly",
    step: 7,
    route: "/replay/weekly",
    target: "[data-tour='weekly-replay']",
    titleKey: "tour_step_weekly_title",
    titleFallback: "7. Weekly Replay",
    descKey: "tour_step_weekly_desc",
    descFallback: "Take a step back and revisit how your week unfolded.",
  },
  {
    id: "monthly",
    step: 8,
    route: "/replay/monthly",
    target: "[data-tour='monthly-replay']",
    titleKey: "tour_step_monthly_title",
    titleFallback: "8. Monthly Replay",
    descKey: "tour_step_monthly_desc",
    descFallback:
      "See your month as a story built from the moments you actually recorded.",
  },
  {
    id: "profile",
    step: 9,
    route: "/profile",
    target: "[data-tour='profile-privacy']",
    titleKey: "tour_step_profile_title",
    titleFallback: "9. Profile & Privacy",
    descKey: "tour_step_profile_desc",
    descFallback:
      "Control how Athena looks, speaks and handles your personal data.",
  },
  {
    id: "care",
    step: 10,
    route: "/care",
    target: "[data-tour='care-support']",
    titleKey: "tour_step_care_title",
    titleFallback: "10. Care & Support",
    descKey: "tour_step_care_desc",
    descFallback:
      "If you ever need immediate support, Athena keeps trusted support resources close at hand.",
  },
];

interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  currentStepData: TourStep | null;
  totalSteps: number;
  showInvitation: boolean;
  isCompleted: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  openInvitation: () => void;
  dismissInvitation: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showInvitation, setShowInvitation] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Check initial invitation on first meaningful entry (home page only)
  useEffect(() => {
    try {
      const isHome = pathname === "/" || pathname === "/home";
      const dismissed = localStorage.getItem("athena_tour_dismissed");
      if (isHome && !dismissed) {
        // Show gentle invitation after brief pause
        const timer = setTimeout(() => {
          setShowInvitation(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [pathname]);

  const currentStepData = isTourActive && currentStep >= 1 && currentStep <= TOUR_STEPS.length
    ? TOUR_STEPS[currentStep - 1]
    : null;

  const navigateToStepRoute = useCallback(
    (stepNum: number) => {
      const targetStep = TOUR_STEPS[stepNum - 1];
      if (!targetStep) return;

      const currentPath = pathname || "/";
      const targetRoute = targetStep.route;

      // Handle root vs /home equivalence
      const isSameRoute =
        currentPath === targetRoute ||
        (targetRoute === "/" && (currentPath === "/" || currentPath === "/home"));

      if (!isSameRoute) {
        router.push(targetRoute);
      }
    },
    [pathname, router]
  );

  const startTour = useCallback(() => {
    setShowInvitation(false);
    setIsCompleted(false);
    setCurrentStep(1);
    setIsTourActive(true);
    navigateToStepRoute(1);
  }, [navigateToStepRoute]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length) {
      const nextNum = currentStep + 1;
      setCurrentStep(nextNum);
      navigateToStepRoute(nextNum);
    } else {
      // Completed step 10
      setIsTourActive(false);
      setIsCompleted(true);
      try {
        localStorage.setItem("athena_tour_dismissed", "true");
      } catch {}
    }
  }, [currentStep, navigateToStepRoute]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      const prevNum = currentStep - 1;
      setCurrentStep(prevNum);
      navigateToStepRoute(prevNum);
    }
  }, [currentStep, navigateToStepRoute]);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setShowInvitation(false);
    setIsCompleted(false);
    try {
      localStorage.setItem("athena_tour_dismissed", "true");
    } catch {}
  }, []);

  const completeTour = useCallback(() => {
    setIsCompleted(false);
    setIsTourActive(false);
    try {
      localStorage.setItem("athena_tour_dismissed", "true");
    } catch {}
  }, []);

  const openInvitation = useCallback(() => {
    setShowInvitation(true);
  }, []);

  const dismissInvitation = useCallback(() => {
    setShowInvitation(false);
    try {
      localStorage.setItem("athena_tour_dismissed", "true");
    } catch {}
  }, []);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        currentStepData,
        totalSteps: TOUR_STEPS.length,
        showInvitation,
        isCompleted,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        openInvitation,
        dismissInvitation,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
