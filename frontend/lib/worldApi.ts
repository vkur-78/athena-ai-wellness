import { WorldState, WorldEnvironment, WorldMemory, AmbiencePreferences } from '@/types/world';
import { supabase } from '@/lib/supabase';

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || '/api';
  const clean = raw.replace(/\/+$/, '');
  if (clean.endsWith('/api')) {
    return clean;
  }
  return `${clean}/api`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    }
  } catch (e) {
    // Guest or unauthenticated session
  }
  return { 'Content-Type': 'application/json' };
}

export const DEFAULT_AMBIENCE_PREFS: AmbiencePreferences = {
  master: 0.5,
  wind: 0.3,
  birds: 0.2,
  water: 0.2,
  rain: 0.0,
  crickets: 0.0,
  muted: false,
};

export const DEFAULT_WORLD_STATE: WorldState = {
  user_id: 'guest_sanctuary',
  unlocked_objects: ['tree', 'lake'],
  new_whispers: [],
  season: 'spring',
  time_of_day: 'afternoon',
  local_hour: 14,
  world_seed: 42,
  ambience_preferences: DEFAULT_AMBIENCE_PREFS,
};

export async function fetchWorldState(userId?: string, localHour?: number): Promise<WorldState> {
  const hour = localHour ?? new Date().getHours();
  const base = getApiBaseUrl();
  const query = userId
    ? `?user_id=${encodeURIComponent(userId)}&hour=${hour}`
    : `?hour=${hour}`;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/world/state${query}`, { headers });
    if (!res.ok) {
      console.warn(`[worldApi] /world/state status ${res.status}, using safe fallback.`);
      return { ...DEFAULT_WORLD_STATE, local_hour: hour };
    }
    const data = await res.json();
    return {
      ...DEFAULT_WORLD_STATE,
      ...data,
      ambience_preferences: {
        ...DEFAULT_AMBIENCE_PREFS,
        ...(data.ambience_preferences || {}),
      },
    };
  } catch (err) {
    console.warn('[worldApi] fetchWorldState error, using safe fallback:', err);
    return { ...DEFAULT_WORLD_STATE, local_hour: hour };
  }
}

export async function acknowledgeUnlocks(userId?: string, unlockIds: string[] = []): Promise<boolean> {
  if (!unlockIds.length) return true;
  const base = getApiBaseUrl();
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/world/acknowledge${query}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ unlock_ids: unlockIds }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[worldApi] acknowledgeUnlocks failed:', err);
    return false;
  }
}

export async function fetchWorldMemories(userId?: string): Promise<WorldMemory[]> {
  const base = getApiBaseUrl();
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/world/memories${query}`, { headers });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn('[worldApi] fetchWorldMemories error:', err);
    return [];
  }
}

export async function fetchWorldEnvironment(localHour?: number): Promise<WorldEnvironment> {
  const hour = localHour ?? new Date().getHours();
  const base = getApiBaseUrl();
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/world/environment?hour=${hour}`, { headers });
    if (!res.ok) {
      return {
        time_of_day: 'afternoon',
        season: 'spring',
        weather: 'clear',
        ambient_description: 'Gentle daylight filters through the sanctuary canopy.',
        local_hour: hour,
      };
    }
    return await res.json();
  } catch (err) {
    return {
      time_of_day: 'afternoon',
      season: 'spring',
      weather: 'clear',
      ambient_description: 'Gentle daylight filters through the sanctuary canopy.',
      local_hour: hour,
    };
  }
}

export async function saveAmbiencePreferences(
  userId: string = 'default_user',
  preferences: AmbiencePreferences
): Promise<boolean> {
  const base = getApiBaseUrl();
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/world/ambience${query}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(preferences),
    });
    return res.ok;
  } catch (err) {
    console.warn('[worldApi] saveAmbiencePreferences error:', err);
    return false;
  }
}
