// Athena Phase 7.5: Living Replay Types

export interface OpeningSceneData {
  greeting: string;
  season_title: string;
  period_display: string;
  quote: string;
  ambient_theme?: string;
}

export interface MoodJourneyFlowPoint {
  day_label: string; // "Mon", "Tue", etc.
  date: string; // "YYYY-MM-DD"
  mood: string; // "overwhelmed" | "steady" | "reflective" | "calmer" | "peaceful"
  energy: number; // 1-5
  tension: number; // 1-5
  calm_level: number; // 1-100
  reflection_snippet?: string;
}

export interface RecoveryMomentCard {
  id: string;
  title: string;
  date: string;
  category: string; // "Studio Practice" | "Space Journal" | "Sanctuary Pause" | "Mindful Conversation"
  why_it_mattered: string;
  icon_type?: 'feather' | 'wind' | 'heart' | 'sparkles' | string;
}

export interface SanctuaryWorldData {
  favorite_world: string;
  total_minutes: number;
  sessions_count: number;
  preferred_voice: string;
  preferred_camera: string;
  completion_rate_narrative: string;
  world_ambience_note: string;
}

export interface QuietVictoryCard {
  id: string;
  title: string;
  description: string;
  significance: string;
  date?: string;
}

export interface EmotionalRhythmData {
  pattern_title: string;
  rhythm_narrative: string;
  why_noticed: string;
  evidence: string;
  confidence_wording: string;
}

export interface GrowthReflectionData {
  headline: string;
  narrative: string;
  key_takeaway: string;
}

export interface NextChapterItem {
  id: string;
  title: string;
  suggestion: string;
  action_route: string; // "/studio" | "/journal" | "/chat"
  action_label: string;
}

export interface HighlightsGrid {
  favorite_sanctuary: string;
  longest_calm_streak: string;
  reflection_day: string;
  quiet_victory: string;
}

export interface ReplayChapterItem {
  id?: string;
  title: string;
  narration_text?: string;
  duration_seconds?: number;
  [key: string]: any;
}

export interface LivingReplayData {
  replay_id: string;
  replay_type: 'weekly' | 'monthly';
  time_period: string; // "2026-W37" or "2026-09"
  period_display: string;
  user_name: string;
  title?: string;
  week_number?: number | string;
  chapters?: ReplayChapterItem[];
  opening_scene: OpeningSceneData;
  mood_journey: MoodJourneyFlowPoint[];
  recovery_moments: RecoveryMomentCard[];
  sanctuary_world: SanctuaryWorldData;
  quiet_victories: QuietVictoryCard[];
  emotional_rhythm: EmotionalRhythmData;
  growth_reflection: GrowthReflectionData;
  next_chapter: NextChapterItem[];
  highlights_grid: HighlightsGrid;
  pdf_export_url?: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface ReplayArchiveItem {
  id: string;
  type: 'weekly' | 'monthly';
  title: string;
  season_title: string;
  period_display: string;
  dominant_mood: string;
  active_days: number;
  total_studio_minutes: number;
  created_at: string;
}

// Reusable Dynamic Card Props
export interface MemoryCardProps {
  title: string;
  date: string;
  category?: string;
  whyItMattered: string;
  iconType?: 'feather' | 'wind' | 'heart' | 'sparkles' | string;
  className?: string;
}

export interface PatternCardProps {
  discovery: string;
  confidence: string;
  evidence: string;
  title?: string;
  whyNoticed?: string;
  className?: string;
}

export interface StudioCardProps {
  world: string;
  totalMinutes: number;
  sessionsCount?: number;
  preferredVoice?: string;
  preferredPerspective?: string;
  narrative?: string;
  ambienceNote?: string;
  className?: string;
}

export interface ReflectionCardProps {
  headline: string;
  narrative: string;
  keyTakeaway?: string;
  className?: string;
}

export interface CelebrationCardProps {
  title: string;
  description: string;
  significance?: string;
  tag?: string;
  date?: string;
  className?: string;
}

// ----------------------------------------------------------------------------
// Backwards Compatibility for Legacy Monthly Replay Types
// ----------------------------------------------------------------------------
export interface OpeningLetter {
  quote: string;
  letter: string;
  unhurried_tone: string;
}

export interface Chapter1Story {
  headline: string;
  narrative: string;
}

export interface EmotionalWavePoint {
  label: string;
  energy_level: number;
  reflection: string;
}

export interface RecoveryRiverStep {
  step: string;
  description: string;
}

export interface StudioStar {
  practice_name: string;
  cluster: string;
  times: number;
  x: number;
  y: number;
}

export interface Chapter2Rhythm {
  energy_wave: EmotionalWavePoint[];
  recovery_river: RecoveryRiverStep[];
  time_heatmap: Record<string, string>;
  constellation: StudioStar[];
}

export interface TurningPointCard {
  date: string;
  moment: string;
  why_it_mattered: string;
  category: string;
}

export interface WorldGrowthItem {
  object_name: string;
  title: string;
  whisper: string;
  unlocked_at: string;
}

export interface HelpfulPracticeItem {
  practice: string;
  why_helpful: string;
  supporting_evidence?: string;
  times_used: number;
  rank?: number;
}

export interface QuietPattern {
  trend: string;
  why_noticed: string;
  supporting_evidence: string;
  confidence_wording: string;
  confidence_level?: 'low' | 'moderate' | 'steady';
}

export interface GentleOpportunity {
  observation: string;
  experiment: string;
}

export interface MonthlyReplayData {
  month: string;
  month_display: string;
  user_name: string;
  opening_quote: string;
  opening_letter?: OpeningLetter;
  chapter_1_story: Chapter1Story;
  chapter_2_rhythm: Chapter2Rhythm;
  chapter_3_turning_points: TurningPointCard[];
  chapter_4_world_growth: WorldGrowthItem[];
  chapter_5_what_helped: HelpfulPracticeItem[];
  quiet_patterns?: QuietPattern[];
  chapter_6_gentle_opportunities: GentleOpportunity;
  chapter_7_looking_forward: {
    letter?: string;
    focus_area?: string;
    quote?: string;
    closing_letter?: string;
    signoff?: string;
    [key: string]: string | undefined;
  };
  is_empty_state?: boolean;
}
