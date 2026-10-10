export type Role = "user" | "assistant" | "system";

export type RiskLevel = "none" | "low" | "moderate" | "crisis";

export interface MemorySummary {
  user_name?: string | null;
  total_exchanges: number;
  companion_level?: number;
  total_insights: number;
  core_stressors: string[];
  coping_preferences: string[];
  thinking_patterns: string[];
  wellness_goals?: string[];
  milestones?: string[];
  guided_exercises?: string[];
  recurring_worries?: string[];
  repeated_people?: string[];
  repeated_situations?: string[];
  emotional_improvements?: string[];
  unresolved_topics?: string[];
  mood_logs?: Array<{ summary: string; logged_at?: string }>;
  voice_settings?: { voice?: string; speed?: number; auto_play?: boolean };
  key_memories: string[];
  recent_emotions: string[];
  last_updated?: string | null;
}

export interface MessageMetadata {
  risk?: RiskLevel;
  emotion?: string;
  secondary_emotion?: string | null;
  intensity?: "low" | "moderate" | "high";
  stage?: string;
  thinking_pattern?: string;
  focus?: string;
  therapy_approach?: string;
  suggested_exercise?: string | null;
  suggested_replies?: string[];
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  metadata?: MessageMetadata;
  isError?: boolean;
  audioUrl?: string;
  isVoiceMessage?: boolean;
  isStreaming?: boolean;
  liked?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  isPinned?: boolean;
  isArchived?: boolean;
  moodTag?: string;
}

