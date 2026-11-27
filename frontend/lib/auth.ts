/**
 * Athena Authentication & Demo Session Isolation Manager
 * Enforces strict boundary between Demo Mode and Real Authenticated Users.
 */

import { supabase } from "./supabase";
import { clearApiCache } from "./apiCache";

export const DEMO_USER_ID = "59327d2b-6e65-456e-ab5a-148602a4bd75";

export interface AthenaUserCandidate {
  id?: string;
  email?: string;
  created_at?: string;
  aud?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

export interface SanctuaryResolvedSession {
  access_token: string;
  refresh_token?: string;
  user: AthenaUserCandidate;
}

/**
 * Safely returns or generates a persistent device ID for demo quota enforcement.
 */
export function getOrCreateDemoDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let deviceId = localStorage.getItem("athena_demo_device_id") || "";
    if (!deviceId) {
      deviceId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "dev_" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("athena_demo_device_id", deviceId);
    }
    return deviceId;
  } catch {
    return "";
  }
}

/**
 * Authoritatively check if a user object is the seeded Demo identity.
 * Only explicit demo accounts return true. Real user accounts ALWAYS return false.
 */
export function isExplicitDemoUser(user?: AthenaUserCandidate | null): boolean {
  if (!user) return false;
  if (user.id === DEMO_USER_ID) return true;
  if (user.email === "demo@athena.sanctuary") return true;
  if (user.email === "aarav.sharma.demo@athena.sanctuary") return true;
  if (user.email && user.email.includes("aarav.sharma.demo")) return true;
  if (user.user_metadata?.is_demo === true) return true;
  return false;
}

/**
 * Determine whether an explicit Demo session is currently active in THIS browser tab.
 * Isolated to sessionStorage so new tabs, external links, and browser restarts NEVER auto-login.
 */
export function isDemoSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem("athena_demo_mode") === "true" &&
      Boolean(sessionStorage.getItem("athena_demo_token"))
    );
  } catch {
    return false;
  }
}

function buildDefaultDemoUser(userId?: string, email?: string): AthenaUserCandidate {
  return {
    id: userId || DEMO_USER_ID,
    email: email || "aarav.sharma.demo@athena.sanctuary",
    aud: "authenticated",
    role: "authenticated",
    created_at: "2024-10-15T00:00:00Z",
    user_metadata: {
      full_name: "Aarav Sharma",
      is_demo: true,
    },
  };
}

/**
 * Persists an explicit demo session scoped strictly to sessionStorage (tab-isolated)
 * with minimal fallback support for API client requests. Never writes to sb-*-auth-token.
 */
export function persistDemoSession(data: {
  access_token: string;
  session_id?: string;
  user_id?: string;
  email?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const demoUser = buildDefaultDemoUser(data.user_id, data.email);
    sessionStorage.setItem("athena_demo_mode", "true");
    sessionStorage.setItem("athena_demo_token", data.access_token);
    sessionStorage.setItem("athena_demo_user", JSON.stringify(demoUser));
    if (data.session_id) {
      sessionStorage.setItem("athena_demo_session_id", data.session_id);
      localStorage.setItem("athena_demo_session_id", data.session_id);
    }
    // Transient localStorage fallback for API client without polluting real auth token
    localStorage.removeItem("athena_auth_token");
    localStorage.setItem("athena_demo_token", data.access_token);
  } catch (e) {
    console.warn("Could not persist demo session:", e);
  }
}

/**
 * Synchronizes a demo session response with Supabase when a real Supabase JWT/refresh pair
 * was issued, and persists the tab-isolated demo markers for both JWT and fallback tokens.
 */
export async function syncAndPersistDemoSession(data: {
  access_token: string;
  refresh_token?: string;
  session_id?: string;
  user_id?: string;
  email?: string;
}): Promise<string> {
  let finalAccessToken = data.access_token;
  let finalRefreshToken = data.refresh_token || data.access_token;
  const isJwt = finalAccessToken.split(".").length === 3;
  const hasSupabaseRefreshToken =
    isJwt && Boolean(data.refresh_token) && data.refresh_token !== data.access_token;

  if (hasSupabaseRefreshToken) {
    try {
      const { data: setSessionData } = await supabase.auth.setSession({
        access_token: finalAccessToken,
        refresh_token: finalRefreshToken,
      });
      if (setSessionData?.session?.access_token) {
        finalAccessToken = setSessionData.session.access_token;
        finalRefreshToken = setSessionData.session.refresh_token || finalRefreshToken;
      }
    } catch (setErr) {
      console.warn("[Demo Supabase Session Set Warning]:", setErr);
    }
  }

  persistDemoSession({
    access_token: finalAccessToken,
    session_id: data.session_id,
    user_id: data.user_id,
    email: data.email || "aarav.sharma.demo@athena.sanctuary",
  });

  return finalAccessToken;
}

/**
 * Resolves the active session for protected sanctuary pages:
 * 1. Real Supabase authenticated session
 * 2. Tab-isolated Demo session (only when explicitly activated in this tab's sessionStorage)
 * 3. Real registered member local fallback (athena_auth_token + non-demo sb-*-auth-token)
 */
export async function resolveSanctuarySession(): Promise<SanctuaryResolvedSession | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    if (isExplicitDemoUser(session.user)) {
      if (isDemoSessionActive()) {
        return session as unknown as SanctuaryResolvedSession;
      }
      clearDemoSessionStorage();
      try {
        await supabase.auth.signOut();
      } catch {}
      return null;
    }
    return session as unknown as SanctuaryResolvedSession;
  }

  if (typeof window === "undefined") return null;

  if (isDemoSessionActive()) {
    try {
      const demoToken = sessionStorage.getItem("athena_demo_token");
      if (demoToken) {
        let demoUser = buildDefaultDemoUser();
        const rawDemoUser = sessionStorage.getItem("athena_demo_user");
        if (rawDemoUser) {
          try {
            const parsedUser = JSON.parse(rawDemoUser) as AthenaUserCandidate;
            if (parsedUser?.id) {
              demoUser = parsedUser;
            }
          } catch {}
        }
        return {
          access_token: demoToken,
          user: demoUser,
        };
      }
    } catch {}
  }

  try {
    const athenaToken = localStorage.getItem("athena_auth_token");
    if (athenaToken) {
      const projectRef =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i)?.[1] ||
        "yvmqdlqpfuirapznbmrj";
      const rawStored =
        localStorage.getItem(`sb-${projectRef}-auth-token`) ||
        localStorage.getItem("sb-yvmqdlqpfuirapznbmrj-auth-token");
      if (rawStored) {
        const parsed = JSON.parse(rawStored) as SanctuaryResolvedSession;
        if (parsed?.user && !isExplicitDemoUser(parsed.user)) {
          return parsed;
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Remove all transient demo session markers from browser storage.
 * Preserves anonymous device ID (athena_demo_device_id) for server-side demo quota enforcement.
 */
export function clearDemoSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("athena_demo_mode");
    sessionStorage.removeItem("athena_demo_token");
    sessionStorage.removeItem("athena_demo_session_id");
    sessionStorage.removeItem("athena_demo_user");
    localStorage.removeItem("athena_demo_mode");
    localStorage.removeItem("athena_demo_token");
    localStorage.removeItem("athena_demo_session_id");
    localStorage.removeItem("athena_website_lang");
    localStorage.removeItem("athena_language");

    // Purge any leaked demo session from Supabase local storage key
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (isExplicitDemoUser(parsed?.user)) {
              localStorage.removeItem(key);
            }
          }
        } catch {}
      }
    }
  } catch {}
  clearApiCache();
}

/**
 * Persists an authenticated Athena session locally across both Supabase JS client storage
 * and Athena API token storage so that all client and API calls succeed seamlessly.
 */
export function persistAthenaSession(data: {
  access_token: string;
  refresh_token?: string;
  user_id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): void {
  if (typeof window === "undefined") return;
  try {
    const projectRef =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i)?.[1] ||
      "yvmqdlqpfuirapznbmrj";
    const authKey = `sb-${projectRef}-auth-token`;

    const sessionObj = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 30,
      expires_in: 86400 * 30,
      token_type: "bearer",
      user: {
        id: data.user_id || "user_" + Math.random().toString(36).slice(2),
        email: data.email || "",
        aud: "authenticated",
        role: "authenticated",
        user_metadata: data.user_metadata || {},
      },
    };

    localStorage.setItem(authKey, JSON.stringify(sessionObj));
    localStorage.setItem("sb-yvmqdlqpfuirapznbmrj-auth-token", JSON.stringify(sessionObj));
    localStorage.setItem("athena_auth_token", data.access_token);
  } catch (e) {
    console.warn("Could not persist Athena session to localStorage:", e);
  }
}

/**
 * Full logout helper that clears demo states, tokens, caches, and terminates Supabase auth.
 */
export async function clearAllSanctuarySessions(): Promise<void> {
  clearDemoSessionStorage();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("athena_auth_token");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  }
  try {
    await supabase.auth.signOut();
  } catch {}
}

