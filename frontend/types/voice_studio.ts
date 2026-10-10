/**
 * Guided Voice Studio Types
 * Type definitions for voice coaching cues, session scripts, personas,
 * and player control states.
 */

export type SessionMode = "quick" | "guided" | "quiet";
export type TonePreference = "gentle" | "practical";

export interface VoiceCue {
  id: string;
  text: string;
  phase?: string;
  duration_seconds: number;
  pause_after_seconds: number;
  visual_cue?: string;
  region_highlight?: string;
  subtitle?: string;
  tone_variant?: string;
}

export interface GuidedSessionScript {
  practice_type: string;
  routine_id?: string | null;
  title: string;
  mode: SessionMode;
  estimated_duration_seconds: number;
  tone_preference: TonePreference;
  voice_style: string;
  cues: VoiceCue[];
  metadata?: Record<string, any>;
}

export interface VoicePersona {
  id: string;
  name: string;
  role: string;
  description: string;
  gender: string;
  openai_voice: string;
  tier: "standard" | "premium";
  is_unlocked: boolean;
  tags: string[];
  preview_text: string;
}

export interface VoiceScriptRequest {
  practice_type: string;
  routine_id?: string | null;
  mode?: SessionMode;
  tone_preference?: TonePreference;
  voice_style?: string;
  custom_seconds?: number;
}

export interface VoiceScriptResponse {
  script: GuidedSessionScript;
  available_personas: VoicePersona[];
}

export interface VoiceCoachControlsProps {
  mode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  isPlaying: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  onTogglePlayPause: () => void;
  onRestart: () => void;
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  voiceStyle: string;
  onVoiceChange: (voice: string) => void;
  personas: VoicePersona[];
  currentCue: VoiceCue | null;
  cueIndex: number;
  totalCues: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  className?: string;
}
