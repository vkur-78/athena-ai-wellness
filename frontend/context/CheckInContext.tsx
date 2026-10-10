"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { CheckinResponse } from "@/types/checkin";
import { fetchTodayCheckin, submitDailyCheckin } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export interface TodayCheckInData {
  completed: boolean;
  checkin_completed_today: boolean;
  last_checkin_date: string;
  mood: string;
  emotion: string;
  timestamp: string;
  energy: number;
  stress?: number;
  sleep?: number;
  notes?: string;
  reflection?: string;
}

interface CheckInContextType {
  todayCheckIn: TodayCheckInData | null;
  hasCheckedInToday: boolean;
  isLoading: boolean;
  submitCheckIn: (data: {
    mood: string;
    emotion?: string;
    energy?: number;
    stress?: number;
    sleep?: number;
    notes?: string;
    language?: string;
  }) => Promise<{ success: boolean; reflection: string }>;
  refreshCheckInStatus: () => Promise<void>;
  dismissCheckIn: () => void;
}

const CheckInContext = createContext<CheckInContextType | undefined>(undefined);

// Helper to get today's calendar date in local timezone YYYY-MM-DD
export function getLocalTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Generate an empathetic, context-aware Athena reflection in 300–800ms
export function generateAthenaReflection(
  mood: string,
  energy: number,
  notes?: string,
  lang: string = "en"
): string {
  const l = (lang || "en").toLowerCase();
  const m = mood.toLowerCase();
  const hasLowEnergy = energy <= 2;
  const isDifficult = m === "stirred" || m === "low" || m === "very difficult" || m === "tender";

  if (l === "hi") {
    if (isDifficult || hasLowEnergy) {
      return "आज मन थोड़ा भारी या संवेदनशील लग रहा है। अपने साथ पूरी कोमलता बरतें—हर बात को तुरंत सुलझाना ज़रूरी नहीं।";
    }
    return "आज रुककर अपने भीतर झांकने के लिए धन्यवाद। मन की यह स्थिरता आने वाले पलों में आपको सहज और शांत रखेगी।";
  }
  if (l === "ta") {
    if (isDifficult || hasLowEnergy) {
      return "இன்று மனம் சற்றே சோர்வாக அல்லது மென்மையாக உணரலாம். உங்கள் மீது கருணை காட்டுங்கள்—எல்லாவற்றையும் அவசரமாக தீர்க்க வேண்டியதில்லை.";
    }
    return "இன்று உங்களை கவனித்துக் கொண்டதற்கு நன்றி. இந்த அமைதியான தெளிவு உங்கள் நாளை மென்மையாகவும் சமநிலையாகவும் வழிநடத்தட்டும்.";
  }
  if (l === "te") {
    if (isDifficult || hasLowEnergy) {
      return "ఈ రోజు మనసు కాస్త భారంగా అనిపించవచ్చు. మీ పట్ల దయగా ఉండండి—ప్రతి విషయాన్ని వెంటనే పరిష్కరించాల్సిన అవసరం లేదు.";
    }
    return "ఈ రోజు మీ భావాలను గమనించినందుకు ధన్యవాదాలు. ఈ ప్రశాంతత మీ రోజంతా నెమ్మదిగా, స్థిరంగా సాగేలా చేస్తుంది.";
  }
  if (l === "mr") {
    if (isDifficult || hasLowEnergy) {
      return "आज मन थोडे जड किंवा संवेदनशील वाटत आहे. स्वतःशी अत्यंत ममतेने वागा—सगळे काही लगेच सोडवण्याची घाई नको.";
    }
    return "आज स्वतःसाठी वेळ काढून मन जाणून घेतल्याबद्दल धन्यवाद. ही शांतता दिवसभर तुम्हाला स्थिर आणि सहज ठेवेल.";
  }
  if (l === "gu") {
    if (isDifficult || hasLowEnergy) {
      return "આજે મન થોડું ભારે કે સંવેદનશીલ લાગી શકે છે. તમારી જાત પ્રત્યે નમ્ર રહો—બધું તરત જ ઉકેલવું જરૂરી નથી.";
    }
    return "આજે તમારી લાગણીઓને સમજવા માટે થોભવા બદલ આભાર. આ શાંતિ દિવસ દરમિયાન તમને સ્થિર અને હળવા રાખશે.";
  }

  // English default
  if (notes && notes.trim().length > 5) {
    if (isDifficult) {
      return `I hear what you shared about "${notes.trim().slice(0, 40)}${notes.length > 40 ? "..." : ""}". Holding tension takes quiet courage. Giving yourself grace today matters more than pushing through.`;
    }
    return `Thank you for putting "${notes.trim().slice(0, 40)}${notes.length > 40 ? "..." : ""}" into words. Holding space for how you feel allows everything else to soften into place.`;
  }

  if (m === "stirred" || m === "low" || m === "very difficult") {
    if (hasLowEnergy) {
      return "I noticed today feels heavier than usual. Since your energy feels lower, protecting your afternoon and stepping lightly may matter far more than pushing through.";
    }
    return "There feels like active motion or tension in your thoughts today. You do not need to solve it all right now—let yourself breathe and take one quiet step at a time.";
  }

  if (m === "tender") {
    return "You are carrying a tender, sensitive feeling today. Treat your time and attention with extra gentleness—you deserve a soft space to rest.";
  }

  if (m === "peaceful" || m === "grounded") {
    if (energy >= 4) {
      return "You are carrying a grounded, steady clarity today. Carry this calm warmth with you through whatever your afternoon invites.";
    }
    return "There is a calm, steady rhythm to your day. Honoring where you are right now brings quiet stability to everything you touch.";
  }

  if (m === "joyful" || m === "great") {
    return "It feels like you have a light, open warmth today. Welcome this spaciousness, and let it nourish your mind and spirit.";
  }

  // Fallback for Good or Okay
  if (hasLowEnergy) {
    return "Your energy is gentle and resting today. Listen to what your body is asking for, and allow quiet moments between tasks.";
  }
  return "Thank you for pausing and checking in with yourself today. Honoring your present state creates a grounded foundation for the hours ahead.";
}

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const [todayCheckIn, setTodayCheckIn] = useState<TodayCheckInData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = useMemo(() => getLocalTodayDateString(), []);
  const storageKey = `athena_today_checkin_${todayStr}`;

  // 1. Instant Synchronous/Hydration read from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.completed) {
          setTodayCheckIn(parsed);
          setIsLoading(false);
          return;
        }
      }
      const lastDate = localStorage.getItem("last_checkin_date");
      const completedToday = localStorage.getItem("checkin_completed_today") === "true";
      if (lastDate === todayStr && completedToday) {
        const mood = localStorage.getItem("mood") || "Good";
        const energy = Number(localStorage.getItem("energy")) || 3;
        const stress = Number(localStorage.getItem("stress")) || 2;
        const sleep = Number(localStorage.getItem("sleep")) || 7;
        const timestamp = localStorage.getItem("timestamp") || "Today";
        setTodayCheckIn({
          completed: true,
          checkin_completed_today: true,
          last_checkin_date: todayStr,
          mood,
          emotion: mood.toLowerCase(),
          timestamp,
          energy,
          stress,
          sleep,
          reflection: generateAthenaReflection(mood, energy),
        });
        setIsLoading(false);
      }
    } catch {
      // Safe ignore in restricted environments
    }
  }, [storageKey, todayStr]);

  // 2. Fetch from backend to ensure cross-device consistency
  const refreshCheckInStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const status = await fetchTodayCheckin(session.access_token, todayStr);
      if (status && status.has_checkin && status.checkin) {
        const c = status.checkin;
        const normalized: TodayCheckInData = {
          completed: true,
          checkin_completed_today: true,
          last_checkin_date: todayStr,
          mood: c.mood || "Good",
          emotion: c.mood?.toLowerCase() || "good",
          timestamp: c.created_at || new Date().toISOString(),
          energy: c.energy_level || 3,
          stress: c.stress_level || 2,
          sleep: (c as any).sleep_hours || 7,
          notes: c.reflection_text || undefined,
          reflection: c.ai_reflection || generateAthenaReflection(c.mood || "Good", c.energy_level || 3, c.reflection_text || undefined),
        };
        setTodayCheckIn(normalized);
        try {
          localStorage.setItem(storageKey, JSON.stringify(normalized));
          localStorage.setItem("last_checkin_date", todayStr);
          localStorage.setItem("checkin_completed_today", "true");
          localStorage.setItem("mood", normalized.mood);
          localStorage.setItem("energy", String(normalized.energy));
          localStorage.setItem("stress", String(normalized.stress ?? 2));
          localStorage.setItem("sleep", String(normalized.sleep ?? 7));
          localStorage.setItem("timestamp", normalized.timestamp);
        } catch {}
      }
    } catch (err) {
      console.warn("[CheckInContext] Sync check warning:", err);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, todayStr]);

  useEffect(() => {
    refreshCheckInStatus();
  }, [refreshCheckInStatus]);

  // 3. Instant Submit Check-In: 0-200ms local completion, 300-800ms reflection ready
  const submitCheckIn = useCallback(
    async ({
      mood,
      emotion,
      energy = 3,
      stress = 2,
      sleep = 7,
      notes,
      language = "en",
    }: {
      mood: string;
      emotion?: string;
      energy?: number;
      stress?: number;
      sleep?: number;
      notes?: string;
      language?: string;
    }) => {
      const formattedTimestamp = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      const generatedReflection = generateAthenaReflection(mood, energy, notes, language);

      const optimisticData: TodayCheckInData = {
        completed: true,
        checkin_completed_today: true,
        last_checkin_date: todayStr,
        mood,
        emotion: emotion || mood.toLowerCase(),
        timestamp: formattedTimestamp,
        energy,
        stress,
        sleep,
        notes,
        reflection: generatedReflection,
      };

      // Instantly set state and localStorage so all pages recognize it immediately
      setTodayCheckIn(optimisticData);
      try {
        localStorage.setItem(storageKey, JSON.stringify(optimisticData));
        localStorage.setItem("last_checkin_date", todayStr);
        localStorage.setItem("checkin_completed_today", "true");
        localStorage.setItem("mood", mood);
        localStorage.setItem("energy", String(energy));
        localStorage.setItem("stress", String(stress));
        localStorage.setItem("sleep", String(sleep));
        localStorage.setItem("timestamp", formattedTimestamp);
      } catch {}

      let finalReflection = generatedReflection;

      // Fire async backend synchronization
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const serverRes = await submitDailyCheckin(
          {
            date: todayStr,
            mood,
            energy_level: energy,
            stress_level: stress,
            reflection_text: notes?.trim() || undefined,
            language: language || "en",
          },
          session?.access_token
        );

        if (serverRes?.ai_reflection) {
          finalReflection = serverRes.ai_reflection;
          const updatedWithServer: TodayCheckInData = {
            ...optimisticData,
            reflection: serverRes.ai_reflection,
          };
          setTodayCheckIn(updatedWithServer);
          try {
            localStorage.setItem(storageKey, JSON.stringify(updatedWithServer));
          } catch {}
        }
      } catch (err) {
        console.warn("[CheckInContext] Background sync offline fallback:", err);
        // Queue to resilient offline queue
        try {
          const { queueOfflineEvent } = await import("@/lib/offlineQueue");
          queueOfflineEvent({
            source: "mood",
            type: "checkin_submitted",
            metadata: {
              date: todayStr,
              mood,
              energy_level: energy,
              stress_level: stress,
              reflection_text: notes?.trim() || undefined,
              language: language || "en",
            },
            timestamp: new Date().toISOString(),
          });
        } catch {}
      }

      return {
        success: true,
        reflection: finalReflection,
      };
    },
    [storageKey, todayStr]
  );

  const dismissCheckIn = useCallback(() => {
    // For edge cases if user dismisses snapshot view
  }, []);

  const value = useMemo<CheckInContextType>(
    () => ({
      todayCheckIn,
      hasCheckedInToday: Boolean(todayCheckIn?.completed),
      isLoading,
      submitCheckIn,
      refreshCheckInStatus,
      dismissCheckIn,
    }),
    [todayCheckIn, isLoading, submitCheckIn, refreshCheckInStatus, dismissCheckIn]
  );

  return (
    <CheckInContext.Provider value={value}>
      {children}
    </CheckInContext.Provider>
  );
}

export function useTodayCheckIn(): CheckInContextType {
  const context = useContext(CheckInContext);
  if (!context) {
    throw new Error("useTodayCheckIn must be used within a CheckInProvider");
  }
  return context;
}
