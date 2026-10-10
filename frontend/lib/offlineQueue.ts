/**
 * Athena Offline Resilience System (Phase 7.4)
 * Queues user behavior events, mood check-ins, and studio completions when offline.
 * Automatically synchronizes with the backend once connectivity is restored.
 */

import { BehaviorEventCreate } from "@/types/behavior";

const OFFLINE_QUEUE_KEY = "athena_offline_events_queue";

export function getOfflineQueue(): BehaviorEventCreate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineEvent(event: BehaviorEventCreate): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue();
    const withTs = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    queue.push(withTs);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch (err) {
    console.warn("[Offline Queue] Failed to enqueue event:", err);
  }
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {}
}

export async function flushOfflineQueue(
  syncBatchFn: (events: BehaviorEventCreate[]) => Promise<number>
): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  try {
    const count = await syncBatchFn(queue);
    clearOfflineQueue();
    return count;
  } catch (err) {
    console.warn("[Offline Queue] Flush attempt failed, will retry later:", err);
    return 0;
  }
}

let syncListenerInitialized = false;

export function initOfflineSyncListener(
  syncBatchFn: (events: BehaviorEventCreate[]) => Promise<number>
): void {
  if (typeof window === "undefined" || syncListenerInitialized) return;

  window.addEventListener("online", () => {
    flushOfflineQueue(syncBatchFn);
  });

  // Attempt initial flush on mount if online
  if (navigator.onLine) {
    flushOfflineQueue(syncBatchFn);
  }

  syncListenerInitialized = true;
}
