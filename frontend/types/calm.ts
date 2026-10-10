export type CalmPath =
  | "menu"
  | "breathe"
  | "ground"
  | "quiet"
  | "chat"
  | "exit";

export type BreathingDuration = 60 | 120 | 300;

export type GroundingStepNumber = 5 | 4 | 3 | 2 | 1;

export interface GroundingStepInfo {
  step: GroundingStepNumber;
  sense: string;
  count: number;
  prompt: string;
  subPrompt: string;
  examples: string[];
}

export interface CalmStartResponse {
  opening_line: string;
  pause_line: string;
  question: string;
  user_name?: string | null;
  voice_guidance_intro?: string | null;
}

export interface GroundingState {
  currentStepIndex: number;
  completed: boolean;
  notes: Record<number, string[]>;
}
