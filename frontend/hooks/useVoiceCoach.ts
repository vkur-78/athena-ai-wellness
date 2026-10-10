"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  VoiceCue,
  GuidedSessionScript,
  VoicePersona,
  SessionMode,
  TonePreference,
} from "@/types/voice_studio";
import { fetchVoiceSessionScript, synthesizeSpeech, fetchVoicePersonas } from "@/lib/api";
import { voiceSessionManager } from "@/lib/voiceSessionManager";

export interface UseVoiceCoachOptions {
  practiceType: string;
  routineId?: string | null;
  initialMode?: SessionMode;
  initialVoice?: string;
  initialTone?: TonePreference;
  autoPlay?: boolean;
  onCueChange?: (cue: VoiceCue, index: number) => void;
  onComplete?: (stats: {
    actualSeconds: number;
    pausesCount: number;
    resumed: boolean;
    voiceUsed: boolean;
  }) => void;
}

const DEFAULT_PERSONAS: VoicePersona[] = [
  {
    id: "nova",
    name: "Athena Warm",
    role: "Compassionate Therapist",
    description: "Warm, empathetic presence designed for soothing anxiety.",
    gender: "female",
    openai_voice: "nova",
    tier: "standard",
    is_unlocked: true,
    tags: ["warm", "empathetic"],
    preview_text: "I am here with you. Take a slow, gentle breath.",
  },
  {
    id: "echo",
    name: "Sol Calm",
    role: "Grounded Anchor",
    description: "Deep, steady, and stabilizing voice.",
    gender: "male",
    openai_voice: "echo",
    tier: "standard",
    is_unlocked: true,
    tags: ["grounded", "calm"],
    preview_text: "Steady and supported. Feel the solid earth beneath you.",
  },
  {
    id: "shimmer",
    name: "Zephyr Gentle",
    role: "Whisper Somatic",
    description: "Whisper-soft, ethereal pacing ideal for sleep.",
    gender: "female",
    openai_voice: "shimmer",
    tier: "premium",
    is_unlocked: true,
    tags: ["whisper", "sleep"],
    preview_text: "Softly releasing every expectation into the quiet.",
  },
  {
    id: "onyx",
    name: "Sage Steady",
    role: "Resonant Guide",
    description: "Deep resonant cadence with calm authority.",
    gender: "male",
    openai_voice: "onyx",
    tier: "premium",
    is_unlocked: true,
    tags: ["deep", "resonant"],
    preview_text: "Deep, unhurried space to let your thoughts settle.",
  },
  {
    id: "alloy",
    name: "Aura Light",
    role: "Balanced & Clear",
    description: "Crisp, modern, and neutral clarity.",
    gender: "female",
    openai_voice: "alloy",
    tier: "standard",
    is_unlocked: true,
    tags: ["clear", "modern"],
    preview_text: "Present, clear, and attentive to this very moment.",
  },
  {
    id: "fable",
    name: "Fable Curious",
    role: "Mindful Narrator",
    description: "Expressive and gently melodic voice.",
    gender: "neutral",
    openai_voice: "fable",
    tier: "premium",
    is_unlocked: true,
    tags: ["melodic", "story"],
    preview_text: "Notice what arises when we pause together.",
  },
];

export function useVoiceCoach({
  practiceType,
  routineId = null,
  initialMode = "guided",
  initialVoice = "nova",
  initialTone = "gentle",
  autoPlay = true,
  onCueChange,
  onComplete,
}: UseVoiceCoachOptions) {
  const sessionIdRef = useRef<string>(
    `${practiceType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );

  const [script, setScript] = useState<GuidedSessionScript | null>(null);
  const [personas, setPersonas] = useState<VoicePersona[]>(DEFAULT_PERSONAS);
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [voiceStyle, setVoiceStyle] = useState<string>(initialVoice);
  const [tone, setTone] = useState<TonePreference>(initialTone);
  const [speed, setSpeed] = useState<number>(0.9);

  const [currentCueIndex, setCurrentCueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isWaitingPause, setIsWaitingPause] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [pausesCount, setPausesCount] = useState<number>(0);
  const [resumed, setResumed] = useState<boolean>(false);
  const [actualSeconds, setActualSeconds] = useState<number>(0);
  const [voiceEverUsed, setVoiceEverUsed] = useState<boolean>(false);
  const [hasFinished, setHasFinished] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingCueRef = useRef<boolean>(false);

  // Stop active audio and web speech
  const stopCurrentSpeech = useCallback(() => {
    voiceSessionManager.clearQueue();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.removeAttribute("src");
        audioRef.current.src = "";
        audioRef.current.load();
      } catch {}
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (pauseTimerRef.current) {
      voiceSessionManager.clearTimer(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    isExecutingCueRef.current = false;
    setIsSpeaking(false);
    setIsWaitingPause(false);
  }, []);

  // Fetch session script whenever practiceType, routineId, mode, or tone changes
  const loadScript = useCallback(async () => {
    stopCurrentSpeech();
    // Register current session with manager
    voiceSessionManager.startSession(sessionIdRef.current);

    try {
      const resp = await fetchVoiceSessionScript({
        practice_type: practiceType,
        routine_id: routineId,
        mode,
        tone_preference: tone,
        voice_style: voiceStyle,
      });

      if (!voiceSessionManager.isCurrentSession(sessionIdRef.current)) return;

      if (resp && resp.script) {
        setScript(resp.script);
        if (resp.available_personas && resp.available_personas.length > 0) {
          setPersonas(resp.available_personas);
        }
        setCurrentCueIndex(0);
        setHasFinished(false);
      }
    } catch (err) {
      console.warn("[useVoiceCoach] Failed to fetch script:", err);
    }
  }, [practiceType, routineId, mode, tone, voiceStyle, stopCurrentSpeech]);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  // Load available personas once on mount
  useEffect(() => {
    fetchVoicePersonas().then((pList) => {
      if (pList && pList.length > 0) {
        setPersonas(pList);
      }
    });
  }, []);

  // Elapsed time tracker
  useEffect(() => {
    if (isPlaying && !isPaused && !hasFinished) {
      const timer = setInterval(() => {
        setActualSeconds((s) => s + 1);
      }, 1000);
      elapsedTimerRef.current = timer;
      voiceSessionManager.registerTimer(timer);
    } else {
      if (elapsedTimerRef.current) {
        voiceSessionManager.clearTimer(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) {
        voiceSessionManager.clearTimer(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [isPlaying, isPaused, hasFinished]);

  const actualSecondsRef = useRef<number>(0);
  actualSecondsRef.current = actualSeconds;

  // Execute a single cue with audio synthesis and natural pause
  const executeCue = useCallback(
    async (cue: VoiceCue, cueIdx: number, totalCuesCount: number) => {
      const currentSession = sessionIdRef.current;
      if (!voiceSessionManager.isCurrentSession(currentSession)) return;
      if (isExecutingCueRef.current) return;
      isExecutingCueRef.current = true;

      stopCurrentSpeech();
      setIsSpeaking(true);
      setIsWaitingPause(false);

      if (onCueChange) {
        onCueChange(cue, cueIdx);
      }

      const proceedToPause = () => {
        if (!voiceSessionManager.isCurrentSession(currentSession)) return;
        setIsSpeaking(false);
        setIsWaitingPause(true);
        isExecutingCueRef.current = false;

        const naturalPauseMs = Math.max(800, cue.pause_after_seconds * 1000);
        const timer = setTimeout(() => {
          if (!voiceSessionManager.isCurrentSession(currentSession)) return;
          setIsWaitingPause(false);
          if (cueIdx + 1 < totalCuesCount) {
            setCurrentCueIndex(cueIdx + 1);
          } else {
            // End of script
            setIsPlaying(false);
            setHasFinished(true);
            if (onComplete) {
              onComplete({
                actualSeconds: actualSecondsRef.current,
                pausesCount,
                resumed,
                voiceUsed: !isMuted,
              });
            }
          }
        }, naturalPauseMs);

        pauseTimerRef.current = timer;
        voiceSessionManager.registerTimer(timer);
      };

      if (isMuted) {
        // Just simulate silent duration
        const silentDurationMs = Math.max(1500, (cue.duration_seconds / speed) * 1000);
        const timer = setTimeout(() => {
          if (!voiceSessionManager.isCurrentSession(currentSession)) return;
          proceedToPause();
        }, silentDurationMs);

        pauseTimerRef.current = timer;
        voiceSessionManager.registerTimer(timer);
        return;
      }

      setVoiceEverUsed(true);

      // Single Voice Controller Authority: OpenAI Primary, Browser Fallback
      const instructionId = `${currentSession}-cue-${cue.id}-${cueIdx}`;
      await voiceSessionManager.speakInstruction({
        sessionId: currentSession,
        instructionId,
        text: cue.text,
        voiceStyle,
        speed,
        onStart: () => {
          setIsSpeaking(true);
          setIsWaitingPause(false);
        },
        onEnd: () => {
          proceedToPause();
        },
      });
    },
    [
      isMuted,
      speed,
      voiceStyle,
      onCueChange,
      onComplete,
      pausesCount,
      resumed,
      stopCurrentSpeech,
    ]
  );

  // Cue queue runner
  useEffect(() => {
    if (!script || !script.cues || script.cues.length === 0) return;
    if (!isPlaying || isPaused || hasFinished) return;

    const currentCue = script.cues[currentCueIndex];
    if (currentCue) {
      executeCue(currentCue, currentCueIndex, script.cues.length);
    }
  }, [script, currentCueIndex, isPlaying, isPaused, hasFinished, executeCue]);

  // Autoplay on script load if enabled
  useEffect(() => {
    if (autoPlay && script && script.cues.length > 0 && !isPlaying && !hasFinished && currentCueIndex === 0) {
      setIsPlaying(true);
    }
  }, [autoPlay, script, isPlaying, hasFinished, currentCueIndex]);

  // Controls
  const play = useCallback(() => {
    voiceSessionManager.startSession(sessionIdRef.current);
    if (hasFinished) {
      setCurrentCueIndex(0);
      setHasFinished(false);
    }
    setIsPlaying(true);
    setIsPaused(false);
  }, [hasFinished]);

  const pause = useCallback(() => {
    stopCurrentSpeech();
    voiceSessionManager.pause();
    setIsPaused(true);
    setPausesCount((p) => p + 1);
  }, [stopCurrentSpeech]);

  const resume = useCallback(() => {
    voiceSessionManager.startSession(sessionIdRef.current);
    setIsPaused(false);
    setResumed(true);
    setIsPlaying(true);
    isExecutingCueRef.current = false;
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!isPlaying) {
      play();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPlaying, isPaused, play, resume, pause]);

  const restart = useCallback(() => {
    stopCurrentSpeech();
    voiceSessionManager.startSession(sessionIdRef.current);
    isExecutingCueRef.current = false;
    setCurrentCueIndex(0);
    setActualSeconds(0);
    setHasFinished(false);
    setIsPaused(false);
    setIsPlaying(true);
  }, [stopCurrentSpeech]);

  const skipStep = useCallback(
    (direction: "next" | "prev" = "next") => {
      stopCurrentSpeech();
      isExecutingCueRef.current = false;
      if (!script || !script.cues) return;

      if (direction === "next") {
        if (currentCueIndex + 1 < script.cues.length) {
          setCurrentCueIndex((i) => i + 1);
        } else {
          setHasFinished(true);
          setIsPlaying(false);
        }
      } else {
        if (currentCueIndex > 0) {
          setCurrentCueIndex((i) => i - 1);
        }
      }
    },
    [script, currentCueIndex, stopCurrentSpeech]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopCurrentSpeech();
      }
      return next;
    });
  }, [stopCurrentSpeech]);

  const changeMode = useCallback(
    (newMode: SessionMode) => {
      if (newMode === mode) return;
      stopCurrentSpeech();
      setMode(newMode);
    },
    [mode, stopCurrentSpeech]
  );

  const changeVoice = useCallback(
    (newVoice: string) => {
      setVoiceStyle(newVoice);
    },
    []
  );

  const changeSpeed = useCallback((newSpeed: number) => {
    const clamped = Math.max(0.8, Math.min(newSpeed, 1.2));
    setSpeed(clamped);
  }, []);

  // Active cue and persona
  const currentCue = script?.cues?.[currentCueIndex] || null;
  const activePersona = personas.find((p) => p.id === voiceStyle) || personas[0] || null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentSpeech();
      voiceSessionManager.stopSession(sessionIdRef.current);
      if (elapsedTimerRef.current) {
        voiceSessionManager.clearTimer(elapsedTimerRef.current);
      }
    };
  }, [stopCurrentSpeech]);

  return {
    script,
    currentCue,
    currentCueIndex,
    totalCues: script?.cues?.length || 0,
    isPlaying,
    isSpeaking,
    isWaitingPause,
    isPaused,
    isMuted,
    pausesCount,
    resumed,
    actualSeconds,
    voiceUsed: voiceEverUsed && !isMuted,
    speed,
    mode,
    voiceStyle,
    tone,
    activePersona,
    personas,
    hasFinished,
    // Methods
    play,
    pause,
    resume,
    togglePlayPause,
    restart,
    skipStep,
    toggleMute,
    setMode: changeMode,
    setVoice: changeVoice,
    setSpeed: changeSpeed,
    setTone,
    reloadScript: loadScript,
  };
}
