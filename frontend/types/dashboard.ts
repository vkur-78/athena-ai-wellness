/**
 * Athena Phase 9.0 — Dashboard Living Sanctuary Types
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface SanctuaryAtmosphere {
  period: TimeOfDayPeriod;
  season: Season;
  greetingTime: string;
  seasonLabel: string;
  atmosphereLabel: string;
  subtleGradient: string;
}

export interface EmotionalPulseData {
  hasCheckin: boolean;
  mood: string;
  moodEmoji: string;
  energyLabel: 'Gentle Rest' | 'Steady Calm' | 'Balanced Flow' | 'Vibrant Energy';
  energyLevel: number; // 1 to 4
  calmScore: number; // 0 to 100
  lastEmotionalShift: string;
  lastReflectionTimeStr: string;
}

export interface DailyFocusItem {
  id: string;
  title: string;
  subtitle: string;
  guidance: string;
  category: 'somatic' | 'presence' | 'breath' | 'perspective';
  actionLabel: string;
  durationMinutes: number;
}

export type SanctuaryBeadStatus = 'completed' | 'today' | 'partial' | 'future' | 'missed';

export interface SanctuaryBead {
  dayLetter: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  dateStr: string; // YYYY-MM-DD
  status: SanctuaryBeadStatus;
  mood?: string;
  moodEmoji?: string;
  activitySummary?: string;
  reflectionSnippet?: string;
}

export interface SanctuaryGrowthStage {
  streakDays: number;
  stageName: string;
  description: string;
  visualIcon: 'lantern' | 'stream' | 'tree' | 'horizon';
  progressPercentage: number;
  nextMilestoneDays: number;
}
