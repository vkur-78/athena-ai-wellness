import { MemorySummary } from "@/types/chat";
import { CheckinCreate, CheckinResponse, TodayCheckinStatus } from "@/types/checkin";
import { JournalEntry, JournalCreatePayload, JournalUpdatePayload } from "@/types/journal";
import { CalmStartResponse } from "@/types/calm";
import {
  StudioSessionCreate,
  StudioSession,
  RecentMoment,
  ExerciseDefinition,
  StudioHistoryResponse,
  StudioHistoryItem,
  StudioSessionStartRequest,
  StudioSessionUpdateRequest,
  StudioSessionCompleteRequest,
  StudioSessionAbandonRequest,
} from "@/types/studio";
import { INITIAL_STUDIO_EXERCISES, STUDIO_CATEGORIES } from "./studioExercises";
import {
  HomeReflectionPreview,
  WeeklyReflection,
  MonthlyReflection,
  ReflectionHistoryResponse,
  ReflectionSearchResponse,
} from "@/types/reflection";
import {
  TodayGuidanceResponse,
  BehaviorPatternsResponse,
  TherapeuticAnalytics,
  TriggerRecoveryResponse,
  RecoveryForecast,
  AdaptiveExperimentsResponse,
  EmotionalSeason,
  MilestonesResponse,
  KeepsakeData,
  PracticeImpactResponse,
  TriggerHeatmapResponse,
  RecoverySignalsResponse,
  AdaptiveWeeklyPlanResponse,
} from "@/types/insights";
import {
  BehaviorEvent,
  BehaviorEventCreate,
  DailySummary,
  WeeklySummary,
  UserPreferences,
  BehaviorDiscovery,
} from "@/types/behavior";
import { VoiceScriptRequest, VoiceScriptResponse, VoicePersona } from "@/types/voice_studio";
import { supabase } from "./supabase";

import { getCached, setCached, clearApiCache } from "./apiCache";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const API_URL = RAW_API_URL.replace(/\/+$/, "");

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    let devId = localStorage.getItem("athena_demo_device_id");
    if (!devId) {
      devId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "dev_" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("athena_demo_device_id", devId);
    }
    headers["X-Demo-Device-Id"] = devId;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
      return headers;
    }
    if (typeof window !== "undefined") {
      const isDemoMode = localStorage.getItem("athena_demo_mode") === "true";
      if (isDemoMode) {
        const demoToken = localStorage.getItem("athena_demo_token");
        if (demoToken) {
          headers["Authorization"] = `Bearer ${demoToken}`;
          return headers;
        }
      }
      const authToken = localStorage.getItem("athena_auth_token");
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        return headers;
      }
    }
  } catch (e) {
    console.warn("Could not retrieve auth session token:", e);
  }
  return headers;
}

export interface ApiResponse {
  reply: string;
  session_id: string;
  metadata?: {
    risk?: "none" | "low" | "moderate" | "crisis";
    emotion?: string;
    secondary_emotion?: string | null;
    intensity?: "low" | "moderate" | "high";
    stage?: string;
    thinking_pattern?: string;
    focus?: string;
    therapy_approach?: string;
    suggested_replies?: string[];
  };
  memory?: MemorySummary;
}

export async function sendMessage(
  sessionId: string,
  message: string,
  token?: string,
  userId?: string,
  internalContext?: string,
  conversationLanguage?: string
): Promise<ApiResponse> {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
  };

  try {
    const conversationLang =
      conversationLanguage ||
      (typeof window !== "undefined" ? localStorage.getItem("athena_conversation_lang") || undefined : undefined);

    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        message,
        user_id: userId,
        internal_context: internalContext,
        conversation_language: conversationLang,
      }),
    });

    if (!response.ok) {
      // Fallback check if mounted without prefix
      if (response.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({ session_id: sessionId, message, user_id: userId }),
        });
        if (fallbackRes.ok) {
          return await fallbackRes.json();
        }
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error (${response.status})`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("[API Error] Failed to send message:", err);
    throw err;
  }
}

export interface StreamCallbacks {
  onStart?: (data: { session_id?: string; metadata?: any }) => void;
  onToken?: (token: string) => void;
  onDone?: (data: ApiResponse) => void;
  onError?: (err: any) => void;
  signal?: AbortSignal;
}

export async function sendMessageStream(
  sessionId: string,
  message: string,
  token?: string,
  userId?: string,
  callbacks?: StreamCallbacks,
  internalContext?: string,
  conversationLanguage?: string
): Promise<void> {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
  };
  if (typeof window !== "undefined") {
    let devId = localStorage.getItem("athena_demo_device_id");
    if (!devId) {
      devId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "dev_" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("athena_demo_device_id", devId);
    }
    headers["X-Demo-Device-Id"] = devId;
  }

  try {
    const conversationLang =
      conversationLanguage ||
      (typeof window !== "undefined" ? localStorage.getItem("athena_conversation_lang") || undefined : undefined);

    let url = `${API_URL}/chat/stream`;
    let response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        message,
        user_id: userId,
        internal_context: internalContext,
        conversation_language: conversationLang,
      }),
      signal: callbacks?.signal,
    });

    if (!response.ok && response.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      response = await fetch(`${fallbackUrl}/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({ session_id: sessionId, message, user_id: userId }),
        signal: callbacks?.signal,
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error (${response.status})`);
    }

    if (!response.body) {
      throw new Error("No response body received from stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.replace("data: ", "").trim();
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === "start") {
              callbacks?.onStart?.(parsed);
            } else if (eventType === "token") {
              callbacks?.onToken?.(parsed.content || "");
            } else if (eventType === "done") {
              callbacks?.onDone?.(parsed);
            } else if (eventType === "error") {
              callbacks?.onError?.(parsed.error || "Streaming error");
            }
          } catch (e) {
            console.warn("Error parsing SSE data chunk:", e, dataStr);
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError" || callbacks?.signal?.aborted) {
      return;
    }
    console.error("[API Stream Error] Failed to stream chat:", err);
    callbacks?.onError?.(err);
    throw err;
  }
}


export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearSessionApi(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchUserConversations(token?: string, includeSample: boolean = false) {
  try {
    let authToken = token;
    if (!authToken) {
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token;
    }
    if (!authToken) return [];
    const headers: Record<string, string> = { Authorization: `Bearer ${authToken}` };
    if (typeof window !== "undefined") {
      const devId = localStorage.getItem("athena_demo_device_id");
      if (devId) headers["X-Demo-Device-Id"] = devId;
    }
    if (includeSample) {
      headers["X-Include-Sample"] = "true";
    }
    const res = await fetch(`${API_URL}/conversations?include_sample=${includeSample}`, {
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to load conversations:", e);
    return [];
  }
}

export async function fetchSampleConversations(token?: string) {
  try {
    let authToken = token;
    if (!authToken) {
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token;
    }
    if (!authToken) return [];
    const headers: Record<string, string> = { Authorization: `Bearer ${authToken}` };
    const res = await fetch(`${API_URL}/conversations/sample`, {
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to load sample conversations:", e);
    return [];
  }
}

export async function createConversationApi(title: string, token: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (typeof window !== "undefined") {
      const devId = localStorage.getItem("athena_demo_device_id");
      if (devId) headers["X-Demo-Device-Id"] = devId;
    }
    const res = await fetch(`${API_URL}/conversations`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Failed to create conversation:", e);
    return null;
  }
}

export async function deleteConversationApi(conversationId: string, token: string) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (typeof window !== "undefined") {
      const devId = localStorage.getItem("athena_demo_device_id");
      if (devId) headers["X-Demo-Device-Id"] = devId;
    }
    const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete conversation:", e);
    return false;
  }
}

export async function updateConversationTitleApi(conversationId: string, title: string, token: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (typeof window !== "undefined") {
      const devId = localStorage.getItem("athena_demo_device_id");
      if (devId) headers["X-Demo-Device-Id"] = devId;
    }
    const res = await fetch(`${API_URL}/conversations/${conversationId}/title`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ title }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchConversationMessages(conversationId: string, token: string) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (typeof window !== "undefined") {
      const devId = localStorage.getItem("athena_demo_device_id");
      if (devId) headers["X-Demo-Device-Id"] = devId;
    }
    const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch conversation messages:", e);
    return [];
  }
}

export async function fetchUserMemory(token?: string, sessionId?: string): Promise<MemorySummary | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const param = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const res = await fetch(`${API_URL}/memory${param}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.memory || null;
  } catch (e) {
    console.error("Failed to fetch user memory:", e);
    return null;
  }
}

export async function clearUserMemoryApi(token?: string, sessionId?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const param = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const res = await fetch(`${API_URL}/memory${param}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to clear user memory:", e);
    return false;
  }
}

export async function synthesizeSpeech(
  text: string,
  voice: string = "nova",
  token?: string,
  speed: number = 0.96,
  signal?: AbortSignal
): Promise<string> {
  try {
    if (signal?.aborted) return "";
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const res = await fetch(`${API_URL}/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ text, voice, speed }),
      signal,
    });

    if (!res.ok) {
      // Fallback check if mounted directly without /api prefix
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/voice/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ text, voice, speed }),
          signal,
        });
        if (fallbackRes.ok) {
          const blob = await fallbackRes.blob();
          return URL.createObjectURL(blob);
        }
      }
      throw new Error(`TTS failed (${res.status})`);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    if (err?.name === "AbortError" || signal?.aborted) {
      // Request aborted by voiceSessionManager.stopAll() - silent return
      return "";
    }
    console.error("[TTS API Error]:", err);
    throw err;
  }
}

export async function fetchVoiceSessionScript(
  params: VoiceScriptRequest,
  token?: string
): Promise<VoiceScriptResponse | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/voice/session-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(params),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/voice/session-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(params),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) {
      console.warn(`[Fetch Voice Script Error]: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Voice Script Exception]:", err);
    return null;
  }
}

export async function fetchVoicePersonas(token?: string): Promise<VoicePersona[]> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/voice/personas`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/voice/personas`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.personas || [];
      }
    }

    if (res.ok) {
      const data = await res.json();
      return data.personas || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function transcribeAudio(audioBlob: Blob, token?: string): Promise<string> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    const res = await fetch(`${API_URL}/voice/transcribe`, {
      method: "POST",
      headers: { ...authHeaders },
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/voice/transcribe`, {
          method: "POST",
          body: formData,
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          return data.text || "";
        }
      }
      throw new Error(`Transcription failed (${res.status})`);
    }

    const data = await res.json();
    return data.text || "";
  } catch (err) {
    console.error("[Transcription API Error]:", err);
    throw err;
  }
}

export async function fetchUserProfile(token?: string) {
  const cacheKey = `profile:${token || "current"}`;
  const cached = getCached<any>(cacheKey, 60000);
  if (cached) return cached;

  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    if (!authHeaders.Authorization) return null;

    const res = await fetch(`${API_URL}/profile`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/profile`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setCached(cacheKey, data);
          return data;
        }
      }
      return null;
    }

    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error("[Fetch Profile API Error]:", err);
    return null;
  }
}

export async function submitOnboardingProfile(profileData: any, token?: string) {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const res = await fetch(`${API_URL}/profile/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/profile/onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(profileData),
        });
        if (fallbackRes.ok) return await fallbackRes.json();
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Onboarding failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("[Submit Onboarding API Error]:", err);
    throw err;
  }
}

export async function patchUserProfile(profileData: any, token?: string) {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const res = await fetch(`${API_URL}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(profileData),
        });
        if (fallbackRes.ok) {
          clearApiCache();
          return await fallbackRes.json();
        }
      }
      throw new Error(`Profile update failed (${res.status})`);
    }

    clearApiCache();
    return await res.json();
  } catch (err) {
    console.error("[Patch Profile API Error]:", err);
    throw err;
  }
}

export async function registerUserApi(email: string, password: string) {
  const payload = { email: email.trim().toLowerCase(), password: password.trim() };
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    const err = await res.json().catch(() => ({}));
    let errorMsg = "";
    if (typeof err.detail === "string") {
      errorMsg = err.detail;
    } else if (Array.isArray(err.detail)) {
      errorMsg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(", ");
    } else if (err.message && typeof err.message === "string") {
      errorMsg = err.message;
    } else if (res.status >= 500) {
      errorMsg = "Sanctuary services are temporarily unavailable. Please try again in a moment.";
    }
    throw new Error(errorMsg || "Registration failed. Please check your details.");
  }

  return await res.json();
}

export async function loginUserApi(email: string, password: string) {
  const payload = { email: email.trim().toLowerCase(), password: password.trim() };
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    const err = await res.json().catch(() => ({}));
    let errorMsg = "";
    if (typeof err.detail === "string") {
      errorMsg = err.detail;
    } else if (Array.isArray(err.detail)) {
      errorMsg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(", ");
    } else if (err.message && typeof err.message === "string") {
      errorMsg = err.message;
    } else if (res.status >= 500) {
      errorMsg = "Sanctuary services are temporarily unavailable. Please try again in a moment.";
    }
    throw new Error(errorMsg || "Invalid email or password.");
  }

  return await res.json();
}

export async function fetchTodayCheckin(
  token?: string,
  clientDate?: string
): Promise<TodayCheckinStatus> {
  const cacheKey = `checkin_today:${clientDate || ""}:${token || "current"}`;
  const cached = getCached<TodayCheckinStatus>(cacheKey, 30000);
  if (cached) return cached;

  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    if (!authHeaders.Authorization) return { has_checkin: false, checkin: null };

    const dateParam = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    let res = await fetch(`${API_URL}/checkins/today${dateParam}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/checkins/today${dateParam}`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setCached(cacheKey, data);
          return data;
        }
      }
      return { has_checkin: false, checkin: null };
    }

    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error("[Fetch Today Checkin API Error]:", err);
    return { has_checkin: false, checkin: null };
  }
}

export async function submitDailyCheckin(
  data: CheckinCreate,
  token?: string
): Promise<CheckinResponse> {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
  const res = await fetch(`${API_URL}/checkins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (fallbackRes.ok) {
        clearApiCache("checkin");
        return await fallbackRes.json();
      }
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Check-in submission failed (${res.status})`);
  }

  clearApiCache("checkin");
  return await res.json();
}

export async function fetchCheckinHistory(
  limit: number = 30,
  token?: string
): Promise<CheckinResponse[]> {
  const cacheKey = `checkin_history:${limit}:${token || "current"}`;
  const cached = getCached<CheckinResponse[]>(cacheKey, 60000);
  if (cached) return cached;

  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    if (!authHeaders.Authorization) return [];

    let res = await fetch(`${API_URL}/checkins/history?limit=${limit}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/checkins/history?limit=${limit}`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setCached(cacheKey, data);
          return data;
        }
      }
      return [];
    }

    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error("[Fetch Checkin History Error]:", err);
    return [];
  }
}

export async function fetchJournalEntries(
  query?: string,
  token?: string,
  limit: number = 500
): Promise<JournalEntry[]> {
  const cacheKey = `journals:${query || ""}:${limit}:${token || "current"}`;
  const cached = getCached<JournalEntry[]>(cacheKey, 60000);
  if (cached) return cached;

  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    if (!authHeaders.Authorization) return [];

    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (limit) params.append("limit", String(limit));
    const qStr = params.toString() ? `?${params.toString()}` : "";
    let res = await fetch(`${API_URL}/journal${qStr}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/journal${qStr}`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setCached(cacheKey, data);
          return data;
        }
      }
      return [];
    }

    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error("[Fetch Journal Entries Error]:", err);
    return [];
  }
}

export async function createJournalEntry(
  payload: JournalCreatePayload,
  token?: string
): Promise<JournalEntry> {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
  const res = await fetch(`${API_URL}/journal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) {
        clearApiCache("journals");
        return await fallbackRes.json();
      }
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Journal creation failed (${res.status})`);
  }

  clearApiCache("journals");
  return await res.json();
}

export async function getJournalEntry(
  entryId: string,
  token?: string
): Promise<JournalEntry | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    if (!authHeaders.Authorization) return null;

    let res = await fetch(`${API_URL}/journal/${entryId}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/journal/${entryId}`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (fallbackRes.ok) return await fallbackRes.json();
      }
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[Get Journal Entry Error]:", err);
    return null;
  }
}

export async function updateJournalEntry(
  entryId: string,
  payload: JournalUpdatePayload,
  token?: string
): Promise<JournalEntry> {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
  const res = await fetch(`${API_URL}/journal/${entryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/journal/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Could not update journal entry");
  }

  return await res.json();
}

export async function deleteJournalEntry(
  entryId: string,
  token?: string
): Promise<boolean> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const res = await fetch(`${API_URL}/journal/${entryId}`, {
      method: "DELETE",
      headers: { ...authHeaders },
    });

    if (!res.ok) {
      if (res.status === 404 && API_URL.endsWith("/api")) {
        const fallbackUrl = API_URL.replace(/\/api$/, "");
        const fallbackRes = await fetch(`${fallbackUrl}/journal/${entryId}`, {
          method: "DELETE",
          headers: { ...authHeaders },
        });
        if (fallbackRes.ok) return true;
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Delete Journal Entry Error]:", err);
    return false;
  }
}

export async function requestJournalReflection(
  entryId: string,
  token?: string
): Promise<JournalEntry> {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
  const res = await fetch(`${API_URL}/journal/${entryId}/reflect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });

  if (!res.ok) {
    if (res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/journal/${entryId}/reflect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Could not generate reflection at this moment.");
  }

  return await res.json();
}



export async function fetchCalmStart(
  source: string = "direct",
  token?: string
): Promise<CalmStartResponse> {
  const fallbackResponse: CalmStartResponse = {
    opening_line: "I'm here with you.",
    pause_line: "We don't need to solve everything right now.",
    question: "What feels most supportive?",
    user_name: null,
    voice_guidance_intro:
      "I'm here with you. Take a soft breath. We don't need to solve everything right now. There is nothing to get right, and we will take our time.",
  };

  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/calm/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ source }),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/calm/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ source }),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) {
      return fallbackResponse;
    }

    return await res.json();
  } catch (err) {
    console.warn("[Calm Start API offline/fallback]:", err);
    return fallbackResponse;
  }
}

export async function recordStudioSession(
  sessionData: StudioSessionCreate,
  token?: string
): Promise<StudioSession | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(sessionData),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(sessionData),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) {
      console.warn(`[Record Studio Session Error]: status ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn("[Record Studio Session Exception]:", err);
    return null;
  }
}

export async function fetchRecentMoments(
  limit: number = 5,
  token?: string
): Promise<RecentMoment[]> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/recent?limit=${limit}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/recent?limit=${limit}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.moments || [];
      }
    }

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.moments || [];
  } catch (err) {
    console.warn("[Fetch Recent Moments Exception]:", err);
    return [];
  }
}

export async function fetchStudioReflection(
  practiceType: string,
  routine?: string | null,
  completed: boolean = true,
  token?: string
): Promise<string> {
  const fallbackSentence = "Thank you for honoring your pace today.";
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/reflection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        practice_type: practiceType,
        routine,
        completed,
      }),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/reflection`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ practice_type: practiceType, routine, completed }),
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.gentle_sentence || fallbackSentence;
      }
    }

    if (!res.ok) {
      return fallbackSentence;
    }

    const data = await res.json();
    return data.gentle_sentence || fallbackSentence;
  } catch (err) {
    console.warn("[Fetch Studio Reflection Exception]:", err);
    return fallbackSentence;
  }
}

export async function fetchStudioExercises(): Promise<{
  exercises: ExerciseDefinition[];
  categories: string[];
}> {
  try {
    const authHeaders = await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/exercises`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/exercises`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[Fetch Studio Exercises Exception]:", err);
  }

  // Resilient fallback to local definitions
  return {
    exercises: INITIAL_STUDIO_EXERCISES,
    categories: STUDIO_CATEGORIES,
  };
}

export async function startStudioSessionApi(
  data: StudioSessionStartRequest
): Promise<StudioSession | null> {
  try {
    const authHeaders = await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    console.warn("[Start Studio Session Exception]:", err);
    return null;
  }
}

export async function updateStudioSessionApi(
  sessionId: string,
  data: StudioSessionUpdateRequest
): Promise<StudioSession | null> {
  try {
    const authHeaders = await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/sessions/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    console.warn("[Update Studio Session Exception]:", err);
    return null;
  }
}

export async function completeStudioSessionApi(
  sessionId: string,
  data: StudioSessionCompleteRequest
): Promise<StudioSession | null> {
  try {
    const authHeaders = await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (res.ok) {
      clearApiCache("studio_");
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn("[Complete Studio Session Exception]:", err);
    return null;
  }
}

export async function abandonStudioSessionApi(
  sessionId: string,
  data: StudioSessionAbandonRequest
): Promise<StudioSession | null> {
  try {
    const authHeaders = await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/sessions/${sessionId}/abandon`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/sessions/${sessionId}/abandon`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (fallbackRes.ok) {
        clearApiCache("studio_");
        return await fallbackRes.json();
      }
    }

    if (res.ok) {
      clearApiCache("studio_");
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn("[Abandon Studio Session Exception]:", err);
    return null;
  }
}

export async function fetchStudioHistory(limit: number = 50): Promise<StudioHistoryResponse> {
  const cacheKey = `studio_history:${limit}`;
  const cached = getCached<StudioHistoryResponse>(cacheKey, 60000);
  if (cached) return cached;

  const emptyHistory: StudioHistoryResponse = {
    sessions: [],
    total_completed: 0,
    total_minutes: 0,
    today_completed_count: 0,
    today_activity_label: "Nothing practiced yet today.",
    recommended_exercise: null,
  };

  try {
    const authHeaders = await getAuthHeaders();
    let res = await fetch(`${API_URL}/studio/history?limit=${limit}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/studio/history?limit=${limit}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        setCached(cacheKey, data);
        return data;
      }
    }

    if (res.ok) {
      const data = await res.json();
      setCached(cacheKey, data);
      return data;
    }
    return emptyHistory;
  } catch (err) {
    console.warn("[Fetch Studio History Exception]:", err);
    return emptyHistory;
  }
}

// ---------------------------------------------------------------------------
// Reflection & Monthly Report System Client
// ---------------------------------------------------------------------------

export async function fetchHomeReflectionPreview(
  token?: string
): Promise<HomeReflectionPreview> {
  const fallbackPreview: HomeReflectionPreview = {
    title: "This Week's Reflection",
    preview_sentence: "There were moments this week where writing created a little breathing room.",
    week_label: "This Week",
    has_reflection: true,
    action_label: "Continue Reading ->",
  };

  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/reflection/home`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/home`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return fallbackPreview;
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Home Reflection Preview Exception]:", err);
    return fallbackPreview;
  }
}

export async function fetchCurrentWeeklyReflection(
  token?: string
): Promise<WeeklyReflection | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/reflection/weekly/current`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/weekly/current`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Current Weekly Reflection Exception]:", err);
    return null;
  }
}

export async function fetchCurrentMonthlyReflection(
  token?: string,
  month?: string
): Promise<MonthlyReflection | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    let res = await fetch(`${API_URL}/reflection/monthly/current${query}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/monthly/current${query}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Current Monthly Reflection Exception]:", err);
    return null;
  }
}

export async function generateWeeklyReflection(
  token?: string,
  force: boolean = false
): Promise<WeeklyReflection | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/reflection/generate-weekly`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ force }),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/generate-weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ force }),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Generate Weekly Reflection Exception]:", err);
    return null;
  }
}

export async function generateMonthlyReflection(
  token?: string,
  force: boolean = false,
  targetDate?: string
): Promise<MonthlyReflection | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/reflection/generate-monthly`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ force, target_date: targetDate }),
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/generate-monthly`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ force, target_date: targetDate }),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Generate Monthly Reflection Exception]:", err);
    return null;
  }
}

export async function downloadMonthlyPdfBlob(
  token?: string,
  month?: string
): Promise<Blob | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    let res = await fetch(`${API_URL}/reflection/monthly/pdf${query}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/monthly/pdf${query}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.blob();
    }

    if (!res.ok) return null;
    return await res.blob();
  } catch (err) {
    console.warn("[Download Monthly PDF Exception]:", err);
    return null;
  }
}

export async function fetchReflectionHistory(
  token?: string
): Promise<ReflectionHistoryResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/reflection/history`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/history`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return { weekly: [], monthly: [] };
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Reflection History Exception]:", err);
    return { weekly: [], monthly: [] };
  }
}

export async function searchReflectionUniverse(
  query: string,
  token?: string
): Promise<ReflectionSearchResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/reflection/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { ...authHeaders },
    });

    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/reflection/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    if (!res.ok) return { query, total: 0, results: [] };
    return await res.json();
  } catch (err) {
    console.warn("[Search Reflection Exception]:", err);
    return { query, total: 0, results: [] };
  }
}

// ============================================================================
// ATHENA PHASE 4: INTELLIGENCE CENTER APIS
// ============================================================================

export async function fetchTodayGuidance(
  token?: string,
  clientHour?: number
): Promise<TodayGuidanceResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const hourParam = clientHour !== undefined ? `?hour=${clientHour}` : "";
    let res = await fetch(`${API_URL}/insights/today${hourParam}`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/today${hourParam}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch today's guidance");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Today Guidance Error]:", err);
    return {
      greeting: "Welcome to Athena.",
      guidance: "As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
      action_label: "Begin a quiet conversation",
      action_type: "chat",
      action_target: "chat",
      is_empty_state: true,
      empty_message: "As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchBehaviorPatterns(
  token?: string
): Promise<BehaviorPatternsResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/patterns`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/patterns`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch behavior patterns");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Patterns Error]:", err);
    return {
      patterns: [],
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchTherapeuticAnalytics(
  token?: string
): Promise<TherapeuticAnalytics> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/rhythm`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/rhythm`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch therapeutic analytics");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Analytics Error]:", err);
    return {
      energy_rhythm: [
        { period: "Morning", level: "Steady", narrative: "Mornings open with purposeful focus before daily demands pick up." },
        { period: "Midday", level: "Heavier", narrative: "Afternoon transitions typically present the highest mental load." },
        { period: "Evening", level: "Lighter", narrative: "Evenings show clear signs of intentional deceleration and recovery." },
        { period: "Night", level: "Steady", narrative: "Quiet hours settle into restful reflection." },
      ],
      stress_recovery_flow: {
        title: "Verified Recovery Flow",
        steps: ["Work tension", "Desk Relief", "Space Journal", "Calmer evening"],
        timestamp_context: "Tuesday · 6:15 PM",
        outcome_narrative: "A deliberate pause between afternoon friction and evening rest created space to decompress.",
      },
      recovery_balance: [
        { practice: "Journal in Space", settled_narrative: "Writing became one of the places where your mind seemed to settle.", times_used: 1, weight: 0.5 },
        { practice: "Mindful Breathing", settled_narrative: "Short physiological pauses helped your nervous system settle and breathe before speaking.", times_used: 1, weight: 0.5 },
      ],
      time_of_day_heatmap: {
        morning: "Steady grounding",
        afternoon: "Transition load",
        evening: "Quieter deceleration",
        night: "Restful reflection",
        quietest_period: "Evening",
        narrative: "Evenings often became your quieter space, with activities centering on winding down.",
      },
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchTriggerRecoveryMap(
  token?: string
): Promise<TriggerRecoveryResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/recovery-map`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/recovery-map`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch trigger recovery map");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Recovery Map Error]:", err);
    return {
      pathways: [],
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchRecoveryForecast(
  token?: string
): Promise<RecoveryForecast> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/forecast`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/forecast`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch recovery forecast");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Forecast Error]:", err);
    return {
      forecast_text: "You often choose quieter activities on Sunday evenings to prepare for the week ahead.",
      actions: ["Start Wind-Down", "Journal First", "Not Tonight"],
      context_reason: "Weekly transition pattern",
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchAdaptiveExperiments(
  token?: string
): Promise<AdaptiveExperimentsResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/experiments`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/experiments`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch adaptive experiments");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Experiments Error]:", err);
    return {
      experiments: [],
      athena_learning_note: "Athena updates future recommendations based on what actually felt helpful for you.",
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function sendExperimentFeedback(
  experimentId: string,
  feedback: "helped" | "neutral" | "not_helped",
  token?: string
): Promise<{ status: string; experiment_id: string; feedback: string; message: string }> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/experiments/${encodeURIComponent(experimentId)}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ feedback }),
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/experiments/${encodeURIComponent(experimentId)}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ feedback }),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to record experiment feedback");
    return await res.json();
  } catch (err) {
    console.warn("[Send Feedback Error]:", err);
    return {
      status: "success",
      experiment_id: experimentId,
      feedback,
      message: "Athena has adapted future experiment recommendations based on your feedback.",
    };
  }
}

export async function fetchEmotionalSeason(
  token?: string
): Promise<EmotionalSeason> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/season`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/season`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch emotional season");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Season Error]:", err);
    return {
      season_title: "Building Stability",
      why_this_season: "Your sanctuary journey is beginning to take root.",
      evidence_summary: ["Initial conversations and practices welcomed."],
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchMilestones(
  token?: string
): Promise<MilestonesResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/milestones`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/milestones`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch milestones");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Milestones Error]:", err);
    return {
      milestones: [],
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export async function fetchPracticeImpact(
  token?: string
): Promise<PracticeImpactResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/practice-impact`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/practice-impact`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch practice impact");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Practice Impact Error]:", err);
    return {
      practices: [],
      summary_sentence: "Your first few Studio sessions will reveal which practices create the most relief for you.",
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. Complete Studio practices to see verified recovery impact.",
    };
  }
}

export async function fetchTriggerHeatmap(
  token?: string
): Promise<TriggerHeatmapResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/trigger-heatmap`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/trigger-heatmap`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch trigger heatmap");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Trigger Heatmap Error]:", err);
    return {
      categories: [],
      calming_summary: "Your trigger rhythm heatmap will emerge as daily check-ins and Space entries grow.",
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. Complete check-ins to map recurring stressors.",
    };
  }
}

export async function fetchRecoverySignals(
  token?: string
): Promise<RecoverySignalsResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/recovery-signals`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/recovery-signals`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch recovery signals");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Recovery Signals Error]:", err);
    return {
      signals: [],
      learning_note: "Athena updates future recommendations based on what actually felt helpful for you.",
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. Recovery signals will appear as you engage with practices.",
    };
  }
}

export async function fetchAdaptiveWeeklyPlan(
  token?: string
): Promise<AdaptiveWeeklyPlanResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/insights/weekly-plan`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/insights/weekly-plan`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch adaptive weekly plan");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Adaptive Weekly Plan Error]:", err);
    return {
      plan_items: [],
      planner_note: "Maximum 3 grounded suggestions based on observed habits. Never repetitive.",
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. Complete a first pause to begin your weekly plan.",
    };
  }
}

export async function generateKeepsake(
  month?: string,
  token?: string
): Promise<KeepsakeData> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const monthParam = month ? `?month=${encodeURIComponent(month)}` : "";
    let res = await fetch(`${API_URL}/keepsake/generate${monthParam}`, {
      method: "POST",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/keepsake/generate${monthParam}`, {
        method: "POST",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to generate keepsake");
    return await res.json();
  } catch (err) {
    console.warn("[Generate Keepsake Error]:", err);
    return {
      month: month || "Current Month",
      cover_quote: "A month of quiet beginnings.",
      chapter1_story: {
        beginning: "Your sanctuary journey has just begun.",
        middle: "We are creating room for your thoughts and pauses.",
        ending: "Each day offers an open sanctuary to return to.",
      },
      chapter2_turning_points: [],
      chapter3_recovery_map: [],
      chapter4_helpful_habits: ["You created room for yourself."],
      chapter5_experiments: ["Explore a one-minute breathing pause."],
      final_letter: "Thank you for walking with me as we begin this journey.\n\nWarmly,\nAthena",
      pdf_url: null,
      is_empty_state: true,
      empty_message: "We're still learning your rhythm. As conversations, Studio sessions, and journal entries grow, Athena will begin noticing patterns that are uniquely yours.",
    };
  }
}

export function getKeepsakePdfUrl(userId?: string, month?: string): string {
  const params = new URLSearchParams();
  if (userId) params.append("user_id", userId);
  if (month) params.append("month", month);
  return `${API_URL}/keepsake/pdf?${params.toString()}`;
}

// =============================================================================
// PHASE 7.3 & 7.4 UNIFIED BEHAVIOR PIPELINE & INTELLIGENT LOADING API
// =============================================================================

export async function fetchBehaviorToday(
  token?: string,
  dateOverride?: string
): Promise<DailySummary> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const query = dateOverride ? `?date=${encodeURIComponent(dateOverride)}` : "";
    let res = await fetch(`${API_URL}/behavior/today${query}`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/behavior/today${query}`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch today's behavior summary");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Behavior Today Error]:", err);
    return {
      date: dateOverride || new Date().toISOString().split("T")[0],
      mood: null,
      energy: null,
      tension: null,
      studioMinutes: 0,
      journalWords: 0,
      chatSessions: 0,
      streak: 1,
      calmScore: 84,
      lastActive: null,
      recommendedNextStep: "Take a quiet moment to breathe.",
    };
  }
}

export async function fetchBehaviorWeek(
  token?: string
): Promise<WeeklySummary> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/behavior/week`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/behavior/week`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch weekly summary");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Behavior Week Error]:", err);
    return {
      days: [],
      totalStudioMinutes: 0,
      totalJournalWords: 0,
      activeDays: 0,
      consistencyPct: 0,
      dominantThemes: ["mindful presence"],
      calmScoreTrend: "steady",
    };
  }
}

export async function fetchBehaviorPreferences(
  token?: string
): Promise<UserPreferences> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/behavior/preferences`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/behavior/preferences`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch user preferences");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Behavior Preferences Error]:", err);
    return {
      preferredVoice: "Nova",
      preferredWorld: "Sakura Garden",
      preferredCamera: "first_person",
      preferredJournalTime: "evening",
      preferredPracticeDuration: 5,
      quietMode: false,
    };
  }
}

export async function fetchBehaviorDiscoveries(
  token?: string
): Promise<BehaviorDiscovery[]> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/behavior/discoveries`, {
      method: "GET",
      headers: { ...authHeaders },
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/behavior/discoveries`, {
        method: "GET",
        headers: { ...authHeaders },
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) throw new Error("Failed to fetch behavior discoveries");
    return await res.json();
  } catch (err) {
    console.warn("[Fetch Behavior Discoveries Error]:", err);
    return [
      {
        id: "disc_learning",
        title: "Learning Your Rhythm",
        discovery: "Athena is observing how you move through your days.",
        evidence: "A few check-ins, journal notes, or pauses will reveal your natural patterns.",
        confidence: "I'm still learning this rhythm.",
        recommendedExperiment: "Try a 3-minute breath pause when your workday concludes.",
      },
    ];
  }
}

export async function recordBehaviorEvent(
  event: BehaviorEventCreate,
  token?: string
): Promise<BehaviorEvent | null> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/behavior/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(event),
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/behavior/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(event),
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    // Queue offline if network error
    try {
      const { queueOfflineEvent } = await import("./offlineQueue");
      queueOfflineEvent(event);
    } catch {}
    return null;
  }
}

export async function syncOfflineEvents(
  events: BehaviorEventCreate[],
  token?: string
): Promise<number> {
  if (!events || events.length === 0) return 0;
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    let res = await fetch(`${API_URL}/behavior/events/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ events }),
    });
    if (!res.ok && res.status === 404 && API_URL.endsWith("/api")) {
      const fallbackUrl = API_URL.replace(/\/api$/, "");
      const fallbackRes = await fetch(`${fallbackUrl}/behavior/events/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ events }),
      });
      if (fallbackRes.ok) {
        const d = await fallbackRes.json();
        return d.count || events.length;
      }
    }
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || events.length;
  } catch (err) {
    console.warn("[Sync Offline Events Error]:", err);
    return 0;
  }
}

export interface DemoStatusResponse {
  exists: boolean;
  status: string;
  is_demo: boolean;
  prompts_used: number;
  prompt_limit: number;
  remaining_prompts: number;
  remaining: number;
  expires_at?: string;
}

export async function fetchDemoStatus(token?: string): Promise<DemoStatusResponse> {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
    const tokenVal = token || (authHeaders.Authorization ? authHeaders.Authorization.replace("Bearer ", "") : "");
    const devId = typeof window !== "undefined" ? localStorage.getItem("athena_demo_device_id") || "" : "";
    const headers: Record<string, string> = { ...authHeaders };
    if (devId) headers["X-Demo-Device-Id"] = devId;

    const res = await fetch(
      `${API_URL}/auth/demo-status?token=${encodeURIComponent(tokenVal)}&device_id=${encodeURIComponent(devId)}`,
      { headers }
    );
    if (res.ok) {
      const data = await res.json();
      const used = data.prompts_used ?? 0;
      const limit = data.prompt_limit ?? 3;
      const rem = data.remaining_prompts ?? data.remaining ?? Math.max(0, limit - used);
      return {
        exists: data.exists ?? true,
        status: data.status || "active",
        is_demo: data.is_demo ?? true,
        prompts_used: used,
        prompt_limit: limit,
        remaining_prompts: rem,
        remaining: rem,
        expires_at: data.expires_at,
      };
    }
  } catch (err) {
    console.warn("[Fetch Demo Status Error]:", err);
  }
  return {
    exists: false,
    status: "none",
    is_demo: false,
    prompts_used: 0,
    prompt_limit: 3,
    remaining_prompts: 3,
    remaining: 3,
  };
}