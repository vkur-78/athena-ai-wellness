export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  mood_tag?: string;
  tags?: string[];
  ai_reflection?: string | null;
  reflection_enabled: boolean;
  created_at: string;
  date?: string;
  updated_at?: string;
}

export interface JournalCreatePayload {
  content: string;
  reflection_enabled?: boolean;
}

export interface JournalUpdatePayload {
  content?: string;
  reflection_enabled?: boolean;
}

export interface JournalDraft {
  content: string;
  lastModified: string;
}
