export interface MomentThatMattered {
  date: string;
  title: string;
  reflection: string;
  category?: string;
}

export interface WeeklyReflectionSections {
  one_sentence: string;
  story_of_week: string[];
  moments_that_mattered: MomentThatMattered[];
  quiet_patterns: string[];
  what_helped: string[];
  one_invitation: string;
  closing: string;
  insight_categories?: string[];
  companion_notes?: string[];
  is_empty_state?: boolean;
  empty_state_notice?: string;
  full_text?: string;
}

export interface WeeklyReflection {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  formatted_dates: string;
  content: WeeklyReflectionSections;
  generated_at: string;
}

export interface MonthlyReflectionSections {
  month: string;
  month_theme: string;
  your_journey: string[];
  meaningful_moments: MomentThatMattered[];
  what_changed: string[];
  helpful_habits: string[];
  areas_deserve_gentleness: string[];
  looking_forward: string;
  closing: string;
  is_empty_state?: boolean;
  full_text?: string;
}

export interface MonthlyReflection {
  id: string;
  user_id: string;
  month: string;
  content: MonthlyReflectionSections;
  pdf_url?: string;
  generated_at: string;
}

export interface HomeReflectionPreview {
  title: string;
  preview_sentence: string;
  week_label: string;
  has_reflection: boolean;
  reflection_id?: string;
  action_label: string;
}

export interface ReflectionSearchResultItem {
  source: string; // 'conversation' | 'journal' | 'studio' | 'reflection'
  title: string;
  date: string;
  snippet: string;
  link: string;
}

export interface ReflectionSearchResponse {
  query: string;
  total: number;
  results: ReflectionSearchResultItem[];
}

export interface ReflectionHistoryItem {
  id: string;
  type: string; // 'weekly' | 'monthly'
  title: string;
  date_label: string;
  preview_sentence: string;
  created_at: string;
}

export interface ReflectionHistoryResponse {
  weekly: ReflectionHistoryItem[];
  monthly: ReflectionHistoryItem[];
}
