"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CuratedExercise, StudioLanguage, ExerciseStepContent } from "@/lib/studioExerciseContent";
import {
  StudioVoiceProvider,
  StudioVoiceLanguage,
  VoiceStatus,
  AudioDiagnostics,
} from "@/lib/voiceProvider";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Sliders,
  Music,
  Activity,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface StudioSessionPlayerProps {
  exercise: CuratedExercise;
  language: StudioLanguage;
  onExit: () => void;
  onComplete: (data: {
    durationSeconds: number;
    language: StudioLanguage;
    exerciseId: string;
    exerciseName: string;
    category: string;
    pauseCount: number;
  }) => void;
}

// Localized phase names matching the exercise's active studio voice language (conversational & natural)
const PHASE_LABELS: Record<StudioLanguage, { inhale: string; hold: string; exhale: string; pause: string }> = {
  en: { inhale: "Inhale", hold: "Hold", exhale: "Exhale", pause: "Rest" },
  hi: { inhale: "सांस अंदर", hold: "रोकें", exhale: "सांस बाहर", pause: "विश्राम" },
  ta: { inhale: "மூச்சை உள்ளே", hold: "நிறுத்துங்கள்", exhale: "மூச்சை வெளியே", pause: "அமைதி" },
  te: { inhale: "శ్వాస లోపలికి", hold: "ఆపండి", exhale: "శ్వాస బయటకు", pause: "విశ్రాంతి" },
  mr: { inhale: "श्वास आत", hold: "थांबा", exhale: "श्वास बाहेर", pause: "विश्रांती" },
  gu: { inhale: "શ્વાસ અંદર", hold: "રોકો", exhale: "શ્વાસ બહાર", pause: "વિરામ" },
};

const REASSURANCE_DEFAULTS: Record<StudioLanguage, string> = {
  en: "You don't have to solve anything right now. Just allow yourself to be present.",
  hi: "अभी कुछ भी सोचने की ज़रूरत नहीं है। बस शांत रहिए।",
  ta: "இப்போ எதைப்பத்தியும் யோசிக்க வேண்டாம். அமைதியா இருங்க.",
  te: "ఇప్పుడు ఏమీ ఆలోచించకండి. కాసేపు ప్రశాంతంగా ఉండండి.",
  mr: "आता कशाचीही काळजी करू नका. फक्त मन शांत ठेवा.",
  gu: "અત્યારે કોઈ ચિંતા ન કરો. બસ શાંતિથી અહીં રહો.",
};

export function StudioSessionPlayer({
  exercise,
  language,
  onExit,
  onComplete,
}: StudioSessionPlayerProps) {
  const { t } = useLanguage();

  // Session State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 0.8, 1.0, 1.2
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [pauseCount, setPauseCount] = useState<number>(0);

  // Live Audio Pipeline State & Diagnostics
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(StudioVoiceProvider.getVoiceStatus());
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics>(StudioVoiceProvider.getDiagnostics());
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [isVoiceTesting, setIsVoiceTesting] = useState<boolean>(false);

  // Audio Volumes (Separate Voice & Ambience)
  const [voiceVolume, setVoiceVolState] = useState<number>(StudioVoiceProvider.getVoiceVolume());
  const [ambientVolume, setAmbientVolState] = useState<number>(StudioVoiceProvider.getAmbientVolume());
  const [showVolumeControls, setShowVolumeControls] = useState<boolean>(false);

  const totalDuration = exercise.duration_seconds;

  // Single Source of Truth: Cumulative timeline offsets for step indexing
  const stepBoundaries = useMemo(() => {
    let acc = 0;
    return exercise.steps.map((step) => {
      const start = acc;
      acc += step.duration_seconds;
      return { step, start, end: acc };
    });
  }, [exercise.steps]);

  // Derive current and next step from authoritative elapsed seconds
  const currentStepIndex = useMemo(() => {
    const idx = stepBoundaries.findIndex((b) => elapsedSeconds >= b.start && elapsedSeconds < b.end);
    return idx >= 0 ? idx : stepBoundaries.length - 1;
  }, [stepBoundaries, elapsedSeconds]);

  const currentStepInfo = stepBoundaries[currentStepIndex] || {
    step: exercise.steps[0],
    start: 0,
    end: totalDuration,
  };
  const currentStep = currentStepInfo.step;
  const nextStep = exercise.steps[currentStepIndex + 1] || null;

  const stepElapsed = Math.max(0, elapsedSeconds - currentStepInfo.start);
  const stepRemaining = Math.max(0, currentStep.duration_seconds - stepElapsed);

  // Determine current phase from step content
  const currentPhase: "inhale" | "hold" | "exhale" | "pause" = useMemo(() => {
    const enText = (currentStep.text.en || "").toLowerCase();
    if (enText.includes("inhale") || enText.includes("breath in")) return "inhale";
    if (enText.includes("hold") || enText.includes("pause gently") || enText.includes("stay here")) return "hold";
    if (enText.includes("exhale") || enText.includes("release") || enText.includes("breath out")) return "exhale";
    return "pause";
  }, [currentStep]);

  // Reference for voice narration to prevent repeats within same step
  const lastSpokenStepIdRef = useRef<string | null>(null);

  // Subscribe to real-time audio pipeline updates
  useEffect(() => {
    const unsubDiag = StudioVoiceProvider.subscribeDiagnostics((diag) => {
      setDiagnostics(diag);
    });
    const unsubStatus = StudioVoiceProvider.subscribeStatus((st) => {
      setVoiceStatus(st);
    });

    StudioVoiceProvider.startAmbience();

    return () => {
      unsubDiag();
      unsubStatus();
      StudioVoiceProvider.stopAmbience();
      StudioVoiceProvider.cancel();
    };
  }, []);

  // Update Voice & Ambient volume changes
  const handleVoiceVolumeChange = (newVol: number) => {
    setVoiceVolState(newVol);
    StudioVoiceProvider.setVoiceVolume(newVol);
  };

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolState(newVol);
    StudioVoiceProvider.setAmbientVolume(newVol);
  };

  // Voice narration helper using Humanized StudioVoiceProvider in chosen language
  const speakStepVoice = useCallback(
    (step: ExerciseStepContent, prefetchNext?: ExerciseStepContent | null) => {
      if (!voiceEnabled) return;
      if (step.silent) return;

      const langVoiceText = step.voice_text?.[language];
      if (langVoiceText === "") return; // Explicit silence requested for this step

      const textToSpeak =
        langVoiceText !== undefined
          ? langVoiceText
          : (step.text?.[language] || step.voice_text?.en || step.text?.en || "");
      if (!textToSpeak.trim()) return;

      const nextText =
        prefetchNext && !prefetchNext.silent
          ? prefetchNext.voice_text?.[language] !== undefined
            ? prefetchNext.voice_text[language]
            : prefetchNext.text?.[language] || prefetchNext.voice_text?.en || prefetchNext.text?.en
          : undefined;

      StudioVoiceProvider.speakInstruction(textToSpeak, language as StudioVoiceLanguage, {
        exerciseTitle: exercise.title[language] || exercise.title.en,
        category: exercise.category,
        stepId: step.id,
        speed: playbackSpeed !== 1.0 ? playbackSpeed : undefined,
        cadence: step.cadence,
        nextTextToPrefetch: nextText && nextText.trim() ? nextText : undefined,
      });
    },
    [voiceEnabled, language, playbackSpeed, exercise.title, exercise.category]
  );

  // Sync mute state with StudioVoiceProvider
  useEffect(() => {
    StudioVoiceProvider.setVoiceMuted(!voiceEnabled);
  }, [voiceEnabled]);

  // Trigger voice when phase/step changes (Single Source of Truth)
  useEffect(() => {
    if (isRunning && !isPaused && !isCompleted) {
      if (lastSpokenStepIdRef.current !== currentStep.id) {
        lastSpokenStepIdRef.current = currentStep.id;
        speakStepVoice(currentStep, nextStep);
      }
    }
  }, [currentStep, nextStep, isRunning, isPaused, isCompleted, speakStepVoice]);

  // Main Authoritative Clock Loop (Decoupled from audio creation)
  useEffect(() => {
    if (!isRunning || isPaused || isCompleted) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          setIsCompleted(true);
          setIsRunning(false);
          StudioVoiceProvider.cancel();
          StudioVoiceProvider.stopAmbience();
          return totalDuration;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, isCompleted, totalDuration]);

  // Tab Inactivity Safety: Auto-pause when browser tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && !isPaused && !isCompleted) {
        setIsPaused(true);
        StudioVoiceProvider.pause();
        StudioVoiceProvider.pauseAmbience();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, isPaused, isCompleted]);

  // Pause / Resume Handlers
  const handleTogglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      StudioVoiceProvider.resume();
      StudioVoiceProvider.resumeAmbience();
    } else {
      // Pause
      setIsPaused(true);
      setPauseCount((p) => p + 1);
      StudioVoiceProvider.pause();
      StudioVoiceProvider.pauseAmbience();
    }
  };

  // Restart Handler
  const handleRestart = () => {
    StudioVoiceProvider.cancel();
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsRunning(true);
    setIsCompleted(false);
    lastSpokenStepIdRef.current = null;
    StudioVoiceProvider.startAmbience();
    speakStepVoice(exercise.steps[0], exercise.steps[1]);
  };

  // Skip Step Handlers
  const handleSkipBackward = () => {
    const currentIndex = stepBoundaries.findIndex((b) => b.step.id === currentStep.id);
    if (currentIndex > 0) {
      StudioVoiceProvider.cancel();
      const prevBoundary = stepBoundaries[currentIndex - 1];
      setElapsedSeconds(prevBoundary.start);
      lastSpokenStepIdRef.current = null;
    } else {
      handleRestart();
    }
  };

  const handleSkipForward = () => {
    const currentIndex = stepBoundaries.findIndex((b) => b.step.id === currentStep.id);
    if (currentIndex < stepBoundaries.length - 1) {
      StudioVoiceProvider.cancel();
      const nextBoundary = stepBoundaries[currentIndex + 1];
      setElapsedSeconds(nextBoundary.start);
      lastSpokenStepIdRef.current = null;
    } else {
      // Near end
      setIsCompleted(true);
      setIsRunning(false);
      StudioVoiceProvider.cancel();
      StudioVoiceProvider.stopAmbience();
    }
  };

  // Toggle Voice Speed (0.8x -> 1.0x -> 1.2x)
  const handleToggleSpeed = () => {
    const speeds = [0.8, 1.0, 1.2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    // Refresh current step with new speed
    lastSpokenStepIdRef.current = null;
  };

  // Test Voice Direct Audibility Helper (Requirement 9)
  const handleTestVoice = async () => {
    setIsVoiceTesting(true);
    setShowDiagnostics(true);
    try {
      await StudioVoiceProvider.testVoice(language);
    } finally {
      setIsVoiceTesting(false);
    }
  };

  // Toggle Voice On/Off or Retry Failed Playback
  const handleToggleVoice = () => {
    if (voiceStatus === "error" || voiceStatus === "blocked") {
      // Retry speaking current step with fresh unlock
      StudioVoiceProvider.unlockAudio();
      setVoiceEnabled(true);
      lastSpokenStepIdRef.current = null;
      speakStepVoice(currentStep, nextStep);
      return;
    }

    if (voiceEnabled) {
      setVoiceEnabled(false);
      StudioVoiceProvider.setVoiceMuted(true);
    } else {
      setVoiceEnabled(true);
      StudioVoiceProvider.setVoiceMuted(false);
      lastSpokenStepIdRef.current = null;
      speakStepVoice(currentStep, nextStep);
    }
  };

  // Fire onComplete when completed
  useEffect(() => {
    if (isCompleted) {
      onComplete({
        durationSeconds: totalDuration,
        language,
        exerciseId: exercise.id,
        exerciseName: exercise.title.en,
        category: exercise.category,
        pauseCount,
      });
    }
  }, [isCompleted, onComplete, totalDuration, language, exercise.id, exercise.title.en, exercise.category, pauseCount]);

  // Clean exit handler
  const handleExit = () => {
    StudioVoiceProvider.cancel();
    StudioVoiceProvider.stopAmbience();
    onExit();
  };

  // Format MM:SS helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalRemaining = Math.max(0, totalDuration - elapsedSeconds);
  const reassuranceText =
    currentStep.reassurance?.[language] ||
    REASSURANCE_DEFAULTS[language] ||
    REASSURANCE_DEFAULTS.en;

  const phaseLabel = PHASE_LABELS[language]?.[currentPhase] || PHASE_LABELS.en[currentPhase];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#060814] text-[#F8F7FF] flex flex-col justify-between p-6 sm:p-10 overflow-y-auto selection:bg-[#7C5CFF]/30 select-none animate-in fade-in duration-300"
      role="region"
      aria-label="Studio Guided Session"
    >
      {/* 1. Top Bar: Exit Studio, Mix & Audio Diagnostics */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleExit}
          className="text-xs sm:text-sm font-sans tracking-wide text-[#94A3B8] hover:text-[#F8F7FF] transition-colors py-1.5 px-3 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]"
        >
          <X size={14} />
          <span>{t("studio_exit", "Exit Studio")}</span>
        </button>

        {/* Audio Mix, Diagnostics & Status Indicator */}
        <div className="flex items-center gap-2">
          {/* Direct Voice Test (Requirement 9) */}
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isVoiceTesting}
            title='Direct Voice Audibility Test: "Take a slow breath in... and gently breathe out."'
            className={`px-2.5 py-1 rounded-full border text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              isVoiceTesting
                ? "bg-[#7C5CFF]/30 border-[#7C5CFF] text-[#BFAEFF] animate-pulse"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
            }`}
          >
            <Volume2 size={12} className={isVoiceTesting ? "animate-bounce" : ""} />
            <span>{isVoiceTesting ? "TESTING..." : "TEST VOICE"}</span>
          </button>

          {/* Diagnostics Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            title="Athena Audio Diagnostics"
            className={`p-1.5 rounded-full border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              showDiagnostics
                ? "bg-[#7C5CFF]/30 border-[#7C5CFF] text-[#BFAEFF]"
                : "bg-white/[0.03] border-white/10 text-[#94A3B8] hover:text-white"
            }`}
          >
            <Activity size={13} />
            <span className="text-[11px] font-mono pr-1">Diag</span>
          </button>

          {/* Audio Mix Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowVolumeControls((prev) => !prev)}
            title="Audio mix (Voice & Ambience)"
            className={`p-1.5 rounded-full border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              showVolumeControls
                ? "bg-[#7C5CFF]/30 border-[#7C5CFF] text-[#BFAEFF]"
                : "bg-white/[0.03] border-white/10 text-[#94A3B8] hover:text-white"
            }`}
          >
            <Sliders size={13} />
            <span className="text-[11px] font-mono pr-1">Mix</span>
          </button>

          {/* Minimal Session State Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] pl-2 border-l border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isCompleted
                  ? "bg-[#4ADE80]"
                  : isPaused
                  ? "bg-[#FBBF24]"
                  : "bg-[#7C5CFF] animate-pulse"
              }`}
            />
            <span>
              {isCompleted
                ? t("studio_done", "Complete")
                : isPaused
                ? t("studio_pause", "Paused")
                : "Running"}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Audio Diagnostics Drawer */}
      {showDiagnostics && (
        <div className="w-full max-w-lg mx-auto my-2 p-4 rounded-2xl bg-[#090D1F]/95 border border-[#7C5CFF]/40 shadow-2xl backdrop-blur-xl text-left text-xs font-mono space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[#BFAEFF] font-semibold tracking-wider uppercase text-[11px]">
            <span className="flex items-center gap-1.5">
              <Activity size={12} className="text-[#7C5CFF]" />
              Athena Audio Diagnostics
            </span>
            <button onClick={() => setShowDiagnostics(false)} className="text-[#94A3B8] hover:text-white cursor-pointer">
              ✕
            </button>
          </div>

          {/* Requirement 9: Dedicated Voice Test Card */}
          <div className="p-3 rounded-xl bg-black/60 border border-[#7C5CFF]/30 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="text-[#BFAEFF] font-bold tracking-wider uppercase text-[11px]">
                Voice Test
              </span>
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={isVoiceTesting}
                className="px-2 py-0.5 rounded bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-[10px] font-medium cursor-pointer"
              >
                {isVoiceTesting ? "Playing..." : "Run Test"}
              </button>
            </div>
            <div className="space-y-1 pt-1 text-[11px] text-[#CBD5E1]">
              <div className="flex items-center justify-between">
                <span>Audio loaded:</span>
                <span className={diagnostics.audioLoaded ? "text-emerald-400 font-bold" : "text-[#94A3B8]"}>
                  {diagnostics.audioLoaded ? "✓" : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Audio decoded:</span>
                <span className={diagnostics.audioDecoded ? "text-emerald-400 font-bold" : "text-[#94A3B8]"}>
                  {diagnostics.audioDecoded ? "✓" : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Audio playing:</span>
                <span className={diagnostics.playbackStarted ? "text-emerald-400 font-bold" : "text-[#94A3B8]"}>
                  {diagnostics.playbackStarted ? "✓" : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Audio volume:</span>
                <span className="font-mono text-white">{diagnostics.audioVolume.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Voice gain:</span>
                <span className="font-mono text-white">{diagnostics.voiceGainValue.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Master gain:</span>
                <span className="font-mono text-white">{diagnostics.masterGainValue.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AudioContext:</span>
                <span className={`font-mono font-bold ${diagnostics.audioContextState === "running" ? "text-emerald-400" : "text-amber-400"}`}>
                  {diagnostics.audioContextState}
                </span>
              </div>
            </div>
          </div>

          {/* Full Audio Chain Telemetry (Requirements 1 & 13) */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 text-[11px]">
            <div className="text-[10px] uppercase tracking-wider text-[#BFAEFF] font-semibold border-b border-white/10 pb-1">
              Audio Pipeline Diagnostics:
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[#B8BDD6]">
              <div><span className="text-[#94A3B8]">audio.volume:</span> {diagnostics.audioVolume.toFixed(2)}</div>
              <div>
                <span className="text-[#94A3B8]">audio.muted:</span>{" "}
                <span className={diagnostics.audioMuted ? "text-rose-400 font-bold" : "text-emerald-400"}>
                  {diagnostics.audioMuted ? "true" : "false"}
                </span>
              </div>
              <div><span className="text-[#94A3B8]">masterGain.gain.value:</span> {diagnostics.masterGainValue.toFixed(2)}</div>
              <div><span className="text-[#94A3B8]">voiceGain.gain.value:</span> {diagnostics.voiceGainValue.toFixed(2)}</div>
              <div><span className="text-[#94A3B8]">ambientGain.gain.value:</span> {diagnostics.ambientGainValue.toFixed(2)}</div>
              <div>
                <span className="text-[#94A3B8]">AudioContext.state:</span>{" "}
                <span className={diagnostics.audioContextState === "running" ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {diagnostics.audioContextState}
                </span>
              </div>
              <div><span className="text-[#94A3B8]">AudioContext.sampleRate:</span> {diagnostics.audioContextSampleRate} Hz</div>
              <div><span className="text-[#94A3B8]">audio.currentTime:</span> {diagnostics.currentTime.toFixed(1)}s</div>
              <div><span className="text-[#94A3B8]">audio.duration:</span> {diagnostics.duration.toFixed(1)}s</div>
              <div>
                <span className="text-[#94A3B8]">audio.paused:</span>{" "}
                <span className={diagnostics.audioPaused ? "text-amber-400" : "text-emerald-400"}>
                  {diagnostics.audioPaused ? "true" : "false"}
                </span>
              </div>
              <div><span className="text-[#94A3B8]">audio.readyState:</span> {diagnostics.audioReadyState}</div>
              <div><span className="text-[#94A3B8]">audio.networkState:</span> {diagnostics.audioNetworkState}</div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1 text-[10px]">
              <div>
                <span className="text-[#94A3B8]">Output level configuration:</span>{" "}
                <span className="text-white">Voice {Math.round(diagnostics.voiceGainValue * 100)}% | Ambient {Math.round(diagnostics.ambientGainValue * 100)}% | Master {Math.round(diagnostics.masterGainValue * 100)}%</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Actual audio element volume:</span>{" "}
                <span className="text-white">{diagnostics.audioVolume.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Gain configuration:</span>{" "}
                <span className="text-white">VoiceGain={diagnostics.voiceGainValue.toFixed(2)}, MasterGain={diagnostics.masterGainValue.toFixed(2)}, AmbientGain={diagnostics.ambientGainValue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Mute status:</span>{" "}
                <span className={diagnostics.muted ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                  {diagnostics.muted ? "VOICE MUTED" : "VOICE UNMUTED"}
                </span>
                {" · "}
                <span className="text-slate-300">
                  {StudioVoiceProvider.isAmbienceMuted() ? "Ambient Muted" : "Ambient Active"}
                </span>
              </div>
              <div><span className="text-[#94A3B8]">Provider / Engine:</span> {diagnostics.voiceProvider} ({diagnostics.audioSource})</div>
              <div><span className="text-[#94A3B8]">Voice Persona / ID:</span> {diagnostics.voiceId}</div>
            </div>
          </div>

          {/* Qualitative Quality Reviews (Zero Fabricated Numeric Scores) */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-[10px] font-mono">
            <div className="text-[10px] uppercase tracking-wider text-[#BFAEFF] font-semibold">
              Linguistic & Voice Quality Validation:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/5 border border-white/5">
                <span className="text-[#B8BDD6]">Native Voice:</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${diagnostics.nativeLanguageVoiceReview === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {diagnostics.nativeLanguageVoiceReview}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/5 border border-white/5">
                <span className="text-[#B8BDD6]">Pronunciation:</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${diagnostics.pronunciationReview === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {diagnostics.pronunciationReview}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/5 border border-white/5">
                <span className="text-[#B8BDD6]">Human Voice:</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${diagnostics.humanVoiceReview === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {diagnostics.humanVoiceReview}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/5 border border-white/5">
                <span className="text-[#B8BDD6]">Script:</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${diagnostics.scriptReview === "PASS" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {diagnostics.scriptReview}
                </span>
              </div>
            </div>
          </div>

          {diagnostics.qualityWarning && (
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-1.5 leading-snug">
              <AlertTriangle size={13} className="shrink-0 text-amber-400 mt-0.5" />
              <span><strong>VOICE QUALITY ADVISORY:</strong> {diagnostics.qualityWarning}</span>
            </div>
          )}

          {diagnostics.error && (
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span>Error: {diagnostics.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Audio Mix Modal/Popover */}
      {showVolumeControls && (
        <div className="w-full max-w-md mx-auto my-2 p-4 rounded-2xl bg-[#0B1228]/95 border border-[#7C5CFF]/30 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#BFAEFF] font-semibold uppercase tracking-wider">
            <span>Audio Balance</span>
            <button
              onClick={() => setShowVolumeControls(false)}
              className="text-[#94A3B8] hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Voice Volume Control (Priority: 1.0) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white">
                <Volume2 size={13} className="text-[#7C5CFF]" />
                {t("studio_voice_volume", "Voice Volume (Narration)")}
              </span>
              <span className="font-mono text-[11px] text-[#B8BDD6]">
                {Math.round(voiceVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceVolume}
              onChange={(e) => handleVoiceVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-[#7C5CFF] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Ambient Room Tone Synthesizer Volume Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white">
                <Music size={13} className="text-cyan-400" />
                {t("studio_ambient_volume", "Ambient Sound (Atmosphere)")}
              </span>
              <span className="font-mono text-[11px] text-[#B8BDD6]">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Center Room */}
      <main className="w-full max-w-xl mx-auto flex flex-col items-center justify-center my-auto py-6 text-center space-y-6 sm:space-y-7">
        {/* Title Header */}
        <div className="space-y-1">
          <h1 className="text-sm sm:text-base font-mono uppercase tracking-[0.2em] text-[#BFAEFF] font-medium">
            {exercise.title[language] || exercise.title.en}
          </h1>
          <p className="text-xs font-sans text-[#94A3B8] tracking-wider uppercase">
            {exercise.categoryLabel[language] || exercise.categoryLabel.en} · {exercise.duration_label}
          </p>
        </div>

        {/* Dynamic Breathing Orb Centerpiece (Synchronized to timeline) */}
        <div className="relative my-2 sm:my-3 flex items-center justify-center">
          {/* Outer diffuse halo */}
          <div
            className={`absolute rounded-full transition-all duration-[2400ms] ${
              isPaused
                ? "w-36 h-36 bg-[#7C5CFF]/10 blur-xl"
                : currentPhase === "inhale"
                ? "w-60 h-60 bg-[#7C5CFF]/30 blur-2xl scale-125"
                : currentPhase === "hold"
                ? "w-60 h-60 bg-indigo-500/30 blur-2xl scale-125"
                : currentPhase === "exhale"
                ? "w-36 h-36 bg-cyan-500/20 blur-xl scale-95"
                : "w-40 h-40 bg-[#7C5CFF]/15 blur-xl"
            }`}
          />

          {/* Main Breathing Sphere */}
          <div
            className={`relative rounded-full border border-white/20 transition-all duration-[2400ms] flex flex-col items-center justify-center text-center ${
              isPaused
                ? "w-32 h-32 bg-gradient-to-br from-[#7C5CFF]/20 to-indigo-950/40"
                : currentPhase === "inhale"
                ? "w-44 h-44 bg-gradient-to-br from-[#7C5CFF]/40 via-indigo-600/30 to-[#0B1228] shadow-[0_0_40px_rgba(124,92,255,0.4)] scale-110"
                : currentPhase === "hold"
                ? "w-44 h-44 bg-gradient-to-br from-indigo-500/40 via-[#7C5CFF]/30 to-[#0B1228] shadow-[0_0_35px_rgba(99,102,241,0.4)] scale-110"
                : currentPhase === "exhale"
                ? "w-32 h-32 bg-gradient-to-br from-cyan-600/25 via-[#7C5CFF]/20 to-[#0B1228] shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-90"
                : "w-36 h-36 bg-gradient-to-br from-[#7C5CFF]/20 to-indigo-950/40"
            }`}
          >
            <span className="text-[12px] uppercase tracking-widest font-sans text-[#BFAEFF] font-semibold">
              {phaseLabel}
            </span>
            <span className="text-xl sm:text-2xl font-mono text-white font-light mt-1">
              {stepRemaining}s
            </span>
          </div>
        </div>

        {/* Primary Instruction (Native Spoken Script) */}
        <div className="space-y-3 px-4 min-h-[90px] flex flex-col items-center justify-center">
          <p className="text-lg sm:text-2xl font-hero-serif text-[#F8F7FF] leading-relaxed tracking-tight max-w-lg transition-all duration-300">
            {currentStep.text[language] || currentStep.text.en}
          </p>
        </div>

        {/* Session Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Skip Backward */}
            <button
              type="button"
              onClick={handleSkipBackward}
              disabled={isCompleted}
              className="p-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] text-[#B8BDD6] hover:text-[#F8F7FF] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous phase"
              aria-label="Previous phase"
            >
              <SkipBack size={15} />
            </button>

            {/* Pause / Resume Button */}
            <button
              type="button"
              onClick={handleTogglePause}
              disabled={isCompleted}
              className={`px-6 py-2.5 rounded-full border text-sm font-medium tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                isPaused
                  ? "bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.4)]"
                  : "bg-white/5 border-white/15 text-[#F8F7FF] hover:bg-white/10 hover:border-white/25"
              }`}
              aria-label={isPaused ? "Resume session" : "Pause session"}
            >
              {isPaused ? <Play size={14} className="fill-current" /> : <Pause size={14} />}
              <span>{isPaused ? t("studio_resume", "Resume") : t("studio_pause", "Pause")}</span>
            </button>

            {/* Skip Forward */}
            <button
              type="button"
              onClick={handleSkipForward}
              disabled={isCompleted}
              className="p-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] text-[#B8BDD6] hover:text-[#F8F7FF] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next phase"
              aria-label="Next phase"
            >
              <SkipForward size={15} />
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] text-[#B8BDD6] hover:text-[#F8F7FF] transition-all cursor-pointer"
              title="Restart practice"
              aria-label="Restart practice"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Voice Controls: Dynamic Status Button & Speed Selector (Requirement 13) */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleToggleVoice}
              title={
                voiceStatus === "error"
                  ? "Voice couldn't start. Tap to try again."
                  : voiceStatus === "loading"
                  ? "Loading audio guide..."
                  : voiceStatus === "blocked"
                  ? "Autoplay blocked by browser. Tap to unlock."
                  : voiceEnabled
                  ? "Mute voice guide"
                  : "Enable voice guide"
              }
              className={`px-3 py-1 rounded-full text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer border ${
                voiceStatus === "error"
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                  : voiceStatus === "loading"
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                  : voiceStatus === "blocked"
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                  : voiceStatus === "paused"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : !voiceEnabled || voiceStatus === "off"
                  ? "bg-white/[0.03] border-white/10 text-[#94A3B8] hover:text-[#F8F7FF]"
                  : voiceStatus === "playing"
                  ? "bg-[rgba(124,92,255,0.15)] border-[rgba(124,92,255,0.3)] text-[#BFAEFF]"
                  : "bg-white/[0.03] border-white/10 text-[#94A3B8] hover:text-[#F8F7FF]"
              }`}
            >
              {voiceStatus === "error" ? (
                <>
                  <AlertTriangle size={13} className="text-rose-400" />
                  <span>VOICE ERROR</span>
                </>
              ) : voiceStatus === "blocked" ? (
                <>
                  <AlertTriangle size={13} className="text-amber-400" />
                  <span>VOICE BLOCKED</span>
                </>
              ) : voiceStatus === "loading" ? (
                <>
                  <Loader2 size={13} className="animate-spin text-amber-300" />
                  <span>VOICE LOADING</span>
                </>
              ) : voiceStatus === "paused" ? (
                <>
                  <Volume2 size={13} className="text-amber-400" />
                  <span>VOICE PAUSED</span>
                </>
              ) : !voiceEnabled || voiceStatus === "off" ? (
                <>
                  <VolumeX size={13} />
                  <span>VOICE OFF</span>
                </>
              ) : voiceStatus === "playing" ? (
                <>
                  <Volume2 size={13} className="text-[#BFAEFF]" />
                  <span>VOICE PLAYING</span>
                </>
              ) : (
                <>
                  <Volume2 size={13} className="text-[#94A3B8]" />
                  <span>VOICE READY</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleSpeed}
              className="px-2.5 py-1 rounded-full text-xs font-mono text-[#94A3B8] hover:text-[#F8F7FF] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              title="Playback pacing"
            >
              {playbackSpeed}×
            </button>
          </div>
        </div>

        {/* Quiet Subtle Divider */}
        <div className="w-full max-w-[200px] h-px bg-white/10" />

        {/* Reassurance Anchor */}
        <div className="px-4">
          <p className="text-xs sm:text-sm font-sans text-[#94A3B8] leading-relaxed max-w-sm">
            {reassuranceText}
          </p>
        </div>
      </main>

      {/* 3. Bottom Progress Bar & Remaining Time */}
      <footer className="w-full max-w-md mx-auto space-y-3 pb-4">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
          <span>{formatTime(elapsedSeconds)}</span>
          <span>{formatTime(totalRemaining)} remaining</span>
        </div>

        {/* Thin 2px Restrained Progress Line */}
        <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#A78BFA] transition-all duration-300"
            style={{ width: `${Math.min(100, (elapsedSeconds / totalDuration) * 100)}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
