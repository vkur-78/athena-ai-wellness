export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface AmbiencePreferences {
  master: number;
  wind: number;
  birds: number;
  water: number;
  rain: number;
  crickets: number;
  muted: boolean;
}

export interface WorldUnlock {
  id: string;
  object_type: string;
  title: string;
  whisper: string;
  unlocked_at: string;
  source_event: string;
}

export interface WorldState {
  user_id: string;
  unlocked_objects: string[];
  new_whispers: WorldUnlock[];
  season: Season;
  time_of_day: TimeOfDay;
  local_hour: number;
  world_seed: number;
  ambience_preferences: AmbiencePreferences;
}

export interface WorldEnvironment {
  time_of_day: TimeOfDay;
  season: Season;
  weather: string;
  ambient_description: string;
  local_hour: number;
}

export interface WorldMemory {
  object_id: string;
  title: string;
  memory_text: string;
  unlocked_at?: string | null;
}
