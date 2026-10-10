export interface BehaviorEvent {
  id: string;
  userId: string;
  timestamp: string;
  source: "studio" | "journal" | "chat" | "mood" | "dashboard" | "replay";
  type: string;
  metadata: Record<string, any>;
}

export interface BehaviorEventCreate {
  source: "studio" | "journal" | "chat" | "mood" | "dashboard" | "replay";
  type: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface DailySummary {
  date: string;
  mood: string | null;
  energy: number | null;
  tension: number | null;
  studioMinutes: number;
  journalWords: number;
  chatSessions: number;
  streak: number;
  calmScore: number;
  lastActive: string | null;
  recommendedNextStep: string | null;
}

export interface WeeklySummary {
  days: DailySummary[];
  totalStudioMinutes: number;
  totalJournalWords: number;
  activeDays: number;
  consistencyPct: number;
  dominantThemes: string[];
  calmScoreTrend: "steady" | "upward" | "winding down";
}

export interface UserPreferences {
  preferredVoice: string;
  preferredWorld: string;
  preferredCamera: "first_person" | "third_person";
  preferredJournalTime: "morning" | "afternoon" | "evening" | "night";
  preferredPracticeDuration: number;
  quietMode: boolean;
}

export interface BehaviorDiscovery {
  id: string;
  title: string;
  discovery: string;
  evidence: string;
  confidence: "This has appeared across several weeks." | "I've noticed this several times." | "I'm still learning this rhythm.";
  recommendedExperiment: string;
}
