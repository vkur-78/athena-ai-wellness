/**
 * TypeScript Type Definitions for Athena Phase 4.2: Behavior Intelligence System
 * Therapeutic companion workspace models with natural language analytics,
 * deterministic reasoning structures, and zero clinical or gamified metrics.
 */

export interface TodayGuidanceResponse {
  greeting: string;
  guidance: string;
  action_label?: string;
  action_type?: string; // "studio" | "chat" | "journal"
  action_target?: string;
  context_reason?: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface BehaviorPatternCard {
  id: string;
  category: string;
  title: string;
  explanation: string;
  confidence_language: string; // e.g. "This pattern has appeared across several weeks."
  supporting_moments: string[];
  suggested_experiment: string;
  created_at: string;
}

export interface BehaviorPatternsResponse {
  patterns: BehaviorPatternCard[];
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface EnergyRhythmPoint {
  period: string; // "Morning", "Midday", "Evening", "Night"
  level: string;  // "Lighter", "Steady", "Heavier"
  narrative: string;
}

export interface StressRecoveryFlow {
  title: string;
  steps: string[];
  timestamp_context: string;
  outcome_narrative: string;
}

export interface RecoveryBalanceItem {
  practice: string;
  settled_narrative: string;
  times_used: number;
  weight: number;
}

export interface TimeOfDayHeatmap {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
  quietest_period: string;
  narrative: string;
}

export interface TherapeuticAnalytics {
  energy_rhythm: EnergyRhythmPoint[];
  stress_recovery_flow: StressRecoveryFlow;
  recovery_balance: RecoveryBalanceItem[];
  time_of_day_heatmap: TimeOfDayHeatmap;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface TriggerRecoveryItem {
  id: string;
  trigger: string;
  helped_afterward: string;
  supporting_moments: string[];
  recovery_pattern: string;
  future_experiment: string;
}

export interface TriggerRecoveryResponse {
  pathways: TriggerRecoveryItem[];
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface RecoveryForecast {
  forecast_text: string;
  actions: string[];
  context_reason: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface AdaptiveExperiment {
  id: string;
  title: string;
  why_this_experiment: string;
  progress: Record<string, string>; // { "Monday": "completed", "Tuesday": "skipped", ... }
  feedback?: "helped" | "neutral" | "not_helped" | null;
  feedback_status: string; // "pending" | "submitted"
}

export interface AdaptiveExperimentsResponse {
  experiments: AdaptiveExperiment[];
  athena_learning_note: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface ExperimentFeedbackPayload {
  feedback: "helped" | "neutral" | "not_helped";
}

export interface EmotionalSeason {
  season_title: string;
  why_this_season: string;
  evidence_summary: string[];
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface MilestoneMemory {
  id: string;
  title: string;
  description: string;
  created_at: string;
  memory_type: string; // "first_pause" | "breakthrough" | "resilience" | "consistency"
}

export interface MilestonesResponse {
  milestones: MilestoneMemory[];
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface KeepsakeData {
  month: string;
  cover_quote: string;
  chapter1_story: {
    beginning?: string;
    middle?: string;
    ending?: string;
  };
  chapter2_turning_points: Array<{
    date: string;
    event: string;
    note: string;
  }>;
  chapter3_recovery_map: Array<{
    trigger: string;
    helped: string;
    outcome: string;
  }>;
  chapter4_helpful_habits: string[];
  chapter5_experiments: string[];
  final_letter: string;
  pdf_url?: string | null;
  is_empty_state?: boolean;
  empty_message?: string;
}

// ============================================================================
// PHASE 7.2: FLAGSHIP BEHAVIOR INTELLIGENCE TYPES
// ============================================================================

export interface PracticeImpactItem {
  practice_id: string;
  practice_name: string;
  sessions_completed: number;
  average_duration: string;
  completion_rate: string;
  observed_recovery_trend: string;
}

export interface PracticeImpactResponse {
  practices: PracticeImpactItem[];
  summary_sentence: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface TriggerCategoryItem {
  id: string;
  category: string; // "Work" | "Sleep" | "Relationships" | "Health" | "Family" | "Self-pressure"
  intensity_level: number; // 1 to 4
  intensity_label: string;
  supporting_moments: string[];
  journal_excerpts: string[];
  helpful_practices: Array<{ id: string; name: string; type: string }>;
}

export interface TriggerHeatmapResponse {
  categories: TriggerCategoryItem[];
  calming_summary: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface RecoverySignalItem {
  id: string;
  signal_text: string;
  evidence: string;
  confidence: "High" | "Medium" | "Low" | string;
  confidence_language: string;
  supporting_moments: string[];
}

export interface RecoverySignalsResponse {
  signals: RecoverySignalItem[];
  learning_note: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

export interface AdaptiveWeeklyPlanItem {
  id: string;
  day: string;
  title: string;
  description: string;
  action_type: "studio" | "journal" | "chat" | string;
  action_target: string;
  is_completed: boolean;
}

export interface AdaptiveWeeklyPlanResponse {
  plan_items: AdaptiveWeeklyPlanItem[];
  planner_note: string;
  is_empty_state?: boolean;
  empty_message?: string;
}

