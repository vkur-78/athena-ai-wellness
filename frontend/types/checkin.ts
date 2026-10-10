export type MoodType = "Great" | "Good" | "Okay" | "Low" | "Very Difficult";

export interface CheckinCreate {
  mood: MoodType | string;
  energy_level: number;
  stress_level: number;
  reflection_text?: string;
  date?: string;
  language?: string;
}

export interface CheckinResponse {
  id: string;
  user_id: string;
  date: string;
  mood: MoodType | string;
  energy_level: number;
  stress_level: number;
  reflection_text?: string | null;
  ai_reflection?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInRecord {
  id: string;
  checkin_date?: string;
  date?: string;
  energy?: number;
  stress?: number;
  energy_level?: number;
  stress_level?: number;
  mood?: string;
  notes?: string | null;
  reflection_text?: string | null;
  ai_reflection?: string | null;
  created_at?: string;
}

export interface TodayCheckinStatus {
  has_checkin: boolean;
  checkin?: CheckinResponse | null;
}

export interface CheckinDraft {
  step: number;
  date: string;
  mood: MoodType | string | null;
  energy_level: number;
  stress_level: number;
  reflection_text: string;
}
