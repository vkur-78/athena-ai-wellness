export interface UserProfile {
  user_id?: string;
  display_name?: string;
  age_range?: string;
  life_stage?: string;
  routine?: string;
  sleep_hours?: number;
  sleep_pattern?: string;
  energy_pattern?: string;
  current_focus?: string[];
  emotional_patterns?: string[];
  support_style?: string;
  sensitive_topics?: string[];
  coping_methods?: string[];
  social_support?: string;
  communication_preference?: string;
  wellness_goal?: string;
  language?: string;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingState {
  step: number;
  display_name: string;
  life_stage: string;
  routine: string;
  sleep_hours: number;
  sleep_pattern: string;
  energy_pattern: string;
  current_focus: string[];
  emotional_patterns: string[];
  coping_methods: string[];
  support_style: string;
  sensitive_topics: string[];
  social_support: string;
  wellness_goal: string;
}
