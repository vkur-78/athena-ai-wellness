/**
 * Athena Intelligent Cache System (Phase 7.4)
 * Client-side Stale-While-Revalidate (SWR) cache with localStorage persistence.
 * Guarantees 0ms initial render for cached summaries and silent background revalidation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const CACHE_KEYS = {
  TODAY_SUMMARY: "athena_cache_today_summary",
  WEEKLY_SUMMARY: "athena_cache_weekly_summary",
  PREFERENCES: "athena_cache_user_preferences",
  DISCOVERIES: "athena_cache_behavior_discoveries",
  STREAK: "athena_cache_streak",
  LATEST_MOMENT: "athena_cache_latest_moment",
  LATEST_JOURNAL: "athena_cache_latest_journal",
};

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  // 1. Check memory cache first
  const mem = memoryCache.get(key);
  if (mem) {
    return mem.data;
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    memoryCache.set(key, entry);
    return entry.data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  if (typeof window === "undefined") return;

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };

  memoryCache.set(key, entry);
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn(`[Athena Cache] localStorage write warning for key ${key}:`, e);
  }
}

export function invalidateCached(key: string): void {
  memoryCache.delete(key);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

/**
 * Executes Stale-While-Revalidate:
 * 1. Returns cached copy immediately if present (0ms UI latency).
 * 2. Asynchronously fetches latest data and invokes onRevalidate when changed.
 */
export async function swrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  onRevalidate?: (freshData: T) => void,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = getCached<T>(key);

  const fetchPromise = fetcher()
    .then((fresh) => {
      setCached(key, fresh, ttlMs);
      if (onRevalidate) {
        onRevalidate(fresh);
      }
      return fresh;
    })
    .catch((err) => {
      if (cached !== null) {
        console.warn(`[Athena Cache] Network revalidation failed for ${key}, using cached copy:`, err);
        return cached;
      }
      throw err;
    });

  if (cached !== null) {
    // Return stale immediately; background promise keeps running
    return cached;
  }

  return await fetchPromise;
}
