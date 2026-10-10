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
  user_metadata?: Record<string, any>;
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
 * Remove all transient demo session markers from browser storage.
 * Preserves anonymous device ID (athena_demo_device_id) for server-side demo quota enforcement.
 */
export function clearDemoSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("athena_demo_mode");
    localStorage.removeItem("athena_demo_token");
    localStorage.removeItem("athena_demo_session_id");
    sessionStorage.removeItem("athena_demo_mode");
    sessionStorage.removeItem("athena_demo_token");
    sessionStorage.removeItem("athena_demo_session_id");
    localStorage.removeItem("athena_website_lang");
    localStorage.removeItem("athena_language");
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
  user_metadata?: Record<string, any>;
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

