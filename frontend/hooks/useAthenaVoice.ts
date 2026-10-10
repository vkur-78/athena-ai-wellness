"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { voiceSessionManager } from "@/lib/voiceSessionManager";

export interface UseAthenaVoiceOptions {
  voiceEnabled?: boolean;
  speed?: number; // 0.75 | 1.0 | 1.25
  voiceStyle?: string;
}

export function useAthenaVoice({
  voiceEnabled = true,
  speed = 1.0,
  voiceStyle = "nova",
}: UseAthenaVoiceOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const sessionIdRef = useRef<string>(`studio_voice_${Date.now()}`);
  const currentInstructionRef = useRef<string | null>(null);
  const isEnabledRef = useRef(voiceEnabled);
  const speedRef = useRef(speed);
  const voiceStyleRef = useRef(voiceStyle);

  useEffect(() => {
    isEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) {
      voiceSessionManager.stopAll();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [voiceEnabled]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    voiceStyleRef.current = voiceStyle;
  }, [voiceStyle]);

  // Listen to central voice manager state changes
  useEffect(() => {
    const unsub = voiceSessionManager.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsub();
      voiceSessionManager.stopAll();
    };
  }, []);

  const speakInstruction = useCallback(
    (
      text: string,
      options?: {
        instructionId?: string;
        onEnd?: () => void;
        onError?: (err: any) => void;
      }
    ) => {
      if (!isEnabledRef.current || !text) {
        options?.onEnd?.();
        return;
      }

      const instructionId =
        options?.instructionId || `inst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      currentInstructionRef.current = text;
      setIsPaused(false);

      try {
        voiceSessionManager.speakInstruction({
          sessionId: sessionIdRef.current,
          instructionId,
          text,
          voiceStyle: voiceStyleRef.current,
          speed: speedRef.current,
          onStart: () => {
            setIsSpeaking(true);
            setIsPaused(false);
            setVoiceError(null);
          },
          onEnd: () => {
            setIsSpeaking(false);
            setIsPaused(false);
            options?.onEnd?.();
          },
          onError: (err) => {
            console.warn("[AthenaVoice] Voice guidance encountered an error:", err);
            setIsSpeaking(false);
            setVoiceError("Voice isn't available right now. You can continue with the written instructions.");
            options?.onError?.(err);
          },
        });
      } catch (err) {
        console.warn("[AthenaVoice] Synchronous voice invocation failed:", err);
        setIsSpeaking(false);
        setVoiceError("Voice isn't available right now. You can continue with the written instructions.");
        options?.onError?.(err);
      }
    },
    []
  );

  const pauseVoice = useCallback(() => {
    try {
      voiceSessionManager.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    } catch {}
  }, []);

  const resumeVoice = useCallback(() => {
    try {
      voiceSessionManager.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } catch {}
  }, []);

  const stopVoice = useCallback(() => {
    try {
      voiceSessionManager.stopAll();
      setIsSpeaking(false);
      setIsPaused(false);
    } catch {}
  }, []);

  const replayInstruction = useCallback(
    (
      text: string,
      options?: {
        onEnd?: () => void;
        onError?: (err: any) => void;
      }
    ) => {
      stopVoice();
      speakInstruction(text, options);
    },
    [speakInstruction, stopVoice]
  );

  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
  }, []);

  return {
    isSpeaking,
    isPaused,
    voiceError,
    clearVoiceError,
    speakInstruction,
    pauseVoice,
    resumeVoice,
    stopVoice,
    replayInstruction,
  };
}
