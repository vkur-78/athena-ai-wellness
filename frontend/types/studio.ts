// Athena Studio V1 - Production Audio Guidance & Synchronized Exercise Types

export type CompletionStatus = "STARTED" | "COMPLETED" | "ABANDONED" | "started" | "paused" | "completed" | "abandoned";
export type InstructionMode = "TEXT" | "VOICE" | "BOTH";
export type StudioCategory = "ALL" | "RESET" | "BREATHE" | "GROUND" | "FOCUS" | "WIND DOWN" | "REFLECT";

export interface ExerciseStep {
  id: string | number;
  exercise_id?: string;
  step_order: number;
  order?: number;
  instruction_text: string;
  text: string;
  voice_text?: string;
  audio_url?: string | null;
  duration_seconds: number;
  pause_after_seconds: number;
  instruction_type?: string;
}

export interface ExerciseDefinition {
  id: string;
  slug: string;
  title: string;
  category: "RESET" | "BREATHE" | "GROUND" | "FOCUS" | "WIND DOWN" | "REFLECT" | string;
  duration_seconds: number;
  duration_minutes: number;
  duration_label: string;
  purpose: string;
  description: string;
  difficulty: "Gentle" | "Easy" | "Moderate" | string;
  active?: boolean;
  caution?: string | null;
  steps: ExerciseStep[];
  default_pacing?: {
    inhale: number;
    hold1: number;
    exhale: number;
    hold2: number;
  } | null;
}

export interface ExerciseListResponse {
  exercises: ExerciseDefinition[];
  categories: string[];
}

export interface StudioSessionStartRequest {
  exercise_id: string;
  exercise_name: string;
  exercise_category: string;
  instruction_mode?: InstructionMode | string;
  voice_used?: boolean;
  voice_enabled?: boolean;
  playback_speed?: number;
  total_steps?: number;
  planned_duration_seconds?: number;
}

export interface StudioSessionUpdateRequest {
  steps_completed?: number;
  last_step?: number;
  duration_seconds?: number;
  playback_speed?: number;
  session_status?: string;
  notes?: string;
  before_mood?: string;
  after_mood?: string;
  pause_count?: number;
  last_phase?: number;
  last_position_seconds?: number;
}

export interface StudioSessionCompleteRequest {
  duration_seconds: number;
  steps_completed?: number;
  total_steps?: number;
  voice_used?: boolean;
  voice_enabled?: boolean;
  playback_speed?: number;
  instruction_mode?: string;
  before_mood?: string;
  after_mood?: string;
  notes?: string;
  planned_duration_seconds?: number;
  pause_count?: number;
  last_phase?: number;
  last_position_seconds?: number;
  session_status?: string;
}

export interface StudioSessionAbandonRequest {
  duration_seconds: number;
  steps_completed?: number;
  last_step?: number;
  total_steps?: number;
  reason?: string;
  planned_duration_seconds?: number;
  pause_count?: number;
  last_phase?: number;
  last_position_seconds?: number;
  session_status?: string;
}

export interface StudioSessionCreate {
  exercise_id?: string;
  exercise_name?: string;
  exercise_category?: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  completion_status?: CompletionStatus | string;
  session_status?: string;
  instruction_mode?: InstructionMode | string;
  voice_used?: boolean;
  voice_enabled?: boolean;
  playback_speed?: number;
  session_id?: string;
  before_mood?: string;
  after_mood?: string;
  notes?: string;
  early_exit?: boolean;
  completion_percentage?: number;
  steps_completed?: number;
  last_step?: number;
  total_steps?: number;
  language?: string;
  selected_language?: string;

  // Legacy fields for backwards compatibility
  practice_type?: string;
  routine?: string | null;
  planned_duration?: number | null;
  actual_duration?: number;
  completed?: boolean;
  paused?: boolean;
  pause_count?: number;
  pauses_count?: number;
  resumed?: boolean;
  pace?: string;
  repeated_instruction?: number;
  exited_early?: boolean;
  camera_mode?: string;
  exit_reason?: string;
  practice_mode?: string;
  voice_style?: string;
  ended_at?: string;
}

export interface StudioSession {
  id: string;
  user_id: string;
  exercise_id?: string;
  exercise_name?: string;
  exercise_category?: string;
  category?: string;
  started_at: string;
  created_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  duration_minutes?: number;
  completion_status?: CompletionStatus | string;
  session_status?: string;
  instruction_mode?: InstructionMode | string;
  voice_used?: boolean;
  voice_enabled?: boolean;
  playback_speed?: number;
  session_id?: string;
  before_mood?: string;
  after_mood?: string;
  notes?: string;
  early_exit?: boolean;
  completion_percentage?: number;
  steps_completed?: number;
  last_step?: number;
  total_steps?: number;
  completed?: boolean;
}

export interface StudioHistoryItem {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_category: string;
  category?: string;
  started_at: string;
  created_at?: string;
  completed_at?: string | null;
  duration_seconds: number;
  duration_minutes?: number;
  completion_status: CompletionStatus | string;
  session_status: string;
  instruction_mode: string;
  steps_completed: number;
  last_step: number;
  total_steps: number;
  voice_enabled: boolean;
  playback_speed: number;
  before_mood?: string | null;
  after_mood?: string | null;
  notes?: string | null;
  display_date: string;
  planned_duration_seconds?: number;
  pause_count?: number;
  last_phase?: number;
  last_position_seconds?: number;
}

export interface RecommendedExerciseInfo {
  exercise: ExerciseDefinition;
  reason?: string;
}

export interface StudioHistoryResponse {
  sessions: StudioHistoryItem[];
  total_completed: number;
  total_minutes: number;
  today_completed_count: number;
  today_activity_label: string;
  recommended_exercise?: RecommendedExerciseInfo | ExerciseDefinition | null;
}

export interface RecentMoment {
  id: string;
  title?: string;
  practice_title?: string;
  created_at?: string;
  exercise_id?: string;
  exercise_name?: string;
  exercise_category?: string;
  category?: string;
  practice_type?: string;
  routine?: string | null;
  moment_text: string;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  duration_minutes?: number;
  completion_status?: CompletionStatus | string;
}
