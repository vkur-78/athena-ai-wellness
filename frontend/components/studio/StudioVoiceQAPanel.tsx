"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LANGUAGE_VOICE_PROFILES,
  STUDIO_VOICE_BASELINE,
  CANDIDATE_VOICE_ALTERNATIVES,
  NATIVE_EVALUATION_SCRIPTS,
  StudioVoiceLanguage,
  AthenaVoiceProfile,
  VoiceCandidate,
} from "@/lib/pronunciation";
import { speechService, SynthesizedSpeechResult } from "@/lib/speechService";
import {
  Headphones,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sliders,
  Volume2,
  X,
  Layers,
  Radio,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";

interface StudioVoiceQAPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EVALUATION_CRITERIA = [
  { key: "A", name: "Natural Breathing", desc: "Audible organic respiratory inspiration vs silence cuts" },
  { key: "B", name: "Natural Pitch Movement", desc: "Smooth organic F0 variability vs robotic quantized pitch tiers" },
  { key: "C", name: "Sentence Endings", desc: "Gentle natural relaxation vs predictable AI vocoder cadence fall" },
  { key: "D", name: "Emotional Expression", desc: "Warm soothing human empathy vs dispassionate automated reading" },
  { key: "E", name: "Conversational Rhythm", desc: "Varied cadence with reflective slowing vs uniform machine tempo" },
  { key: "F", name: "Appropriate Emphasis", desc: "Stresses mindfulness cues naturally vs mechanical syllable accent" },
  { key: "G", name: "Natural Pauses", desc: "Breathable silence durations vs abrupt artificial clipping" },
  { key: "H", name: "Human Transitions", desc: "Fluid vocal tract coarticulation vs discrete phoneme stitching" },
  { key: "I", name: "Synthetic Resonance", desc: "Absence of 24kHz metallic buzzing or phase artifacts" },
  { key: "J", name: "AI Character", desc: "Sounds like a human guide in a room vs corporate GPS/telephony" },
];

export function StudioVoiceQAPanel({ isOpen, onClose }: StudioVoiceQAPanelProps) {
  const [selectedLang, setSelectedLang] = useState<StudioVoiceLanguage>("en");
  const [provider, setProvider] = useState<"edge" | "openai">("edge");
  const [model, setModel] = useState<string>("edge-neural");
  const [voice, setVoice] = useState<string>("en-IN-NeerjaExpressiveNeural");
  const [speed, setSpeed] = useState<number>(0.96);

  // Script text state
  const [scriptMode, setScriptMode] = useState<"universal" | "native" | "custom">("universal");
  const [scriptText, setScriptText] = useState<string>(NATIVE_EVALUATION_SCRIPTS.en);

  // Audio / Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastGenerated, setLastGenerated] = useState<SynthesizedSpeechResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCandidateId, setActiveCandidateId] = useState<string>("baseline");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quality gate status
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({
    A: false,
    B: true,
    C: false,
    D: false,
    E: false,
    F: true,
    G: true,
    H: false,
    I: false,
    J: false,
  });

  const candidates = CANDIDATE_VOICE_ALTERNATIVES[selectedLang] || CANDIDATE_VOICE_ALTERNATIVES.en;
  const baselineInfo = STUDIO_VOICE_BASELINE.voices[selectedLang];

  // Set default candidate on language change
  useEffect(() => {
    const defaultCandidate = candidates.baseline;
    setActiveCandidateId("baseline");
    setProvider(defaultCandidate.provider);
    setModel(defaultCandidate.model);
    setVoice(defaultCandidate.voice);
    setSpeed(defaultCandidate.speed);

    if (scriptMode === "native") {
      setScriptText(NATIVE_EVALUATION_SCRIPTS[selectedLang]);
    } else if (scriptMode === "universal") {
      setScriptText(NATIVE_EVALUATION_SCRIPTS.en);
    }
    setErrorMsg(null);
  }, [selectedLang]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      speechService.stopRawAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Apply candidate preset
  const handleSelectCandidate = (cand: VoiceCandidate) => {
    setActiveCandidateId(cand.id);
    setProvider(cand.provider);
    setModel(cand.model);
    setVoice(cand.voice);
    setSpeed(cand.speed);
    setErrorMsg(null);
  };

  // Generate speech directly
  const handleGenerate = async (): Promise<SynthesizedSpeechResult | null> => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await speechService.generateSpeech({
        text: scriptText,
        language: selectedLang,
        voice,
        provider,
        model,
        speed,
      });
      setLastGenerated(res);
      return res;
    } catch (err: any) {
      console.error("[VoiceLab] Generation failed:", err);
      setErrorMsg(err.message || "Speech synthesis failed");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Requirement 2: Test RAW TTS Voice directly
  const handlePlayRaw = async () => {
    speechService.stopRawAudio();
    setIsPlaying(false);

    let audioToPlay = lastGenerated;
    if (!audioToPlay) {
      audioToPlay = await handleGenerate();
      if (!audioToPlay) return;
    }

    setIsPlaying(true);
    const audio = speechService.playRawAudio(
      audioToPlay.audioUrl,
      () => setIsPlaying(false),
      (err) => {
        setIsPlaying(false);
        setErrorMsg("Audio playback error: " + (err?.message || "Check browser autoplay"));
      }
    );
    audioRef.current = audio;
  };

  const handleStop = () => {
    speechService.stopRawAudio();
    setIsPlaying(false);
  };

  const handleReplay = () => {
    speechService.stopRawAudio();
    setIsPlaying(false);
    setTimeout(() => {
      handlePlayRaw();
    }, 50);
  };

  // Available voices for chosen provider & language
  const availableVoices =
    provider === "edge"
      ? [
          { id: candidates.baseline.voice, label: `${candidates.baseline.voice} (Baseline Primary)` },
          { id: candidates.alt_a.voice, label: `${candidates.alt_a.voice} (Alternative)` },
          ...(selectedLang === "en"
            ? [
                { id: "en-US-AvaMultilingualNeural", label: "en-US-AvaMultilingualNeural (Global Conversational)" },
                { id: "en-IN-NeerjaNeural", label: "en-IN-NeerjaNeural (Standard Indian)" },
              ]
            : []),
        ]
      : [
          { id: "nova", label: "nova (Conversational, warm, natural female)" },
          { id: "shimmer", label: "shimmer (Soft, calming, airy female)" },
          { id: "alloy", label: "alloy (Neutral, balanced)" },
          { id: "echo", label: "echo (Gentle, warm male)" },
          { id: "fable", label: "fable (Expressive British male)" },
          { id: "onyx", label: "onyx (Deep, grounded male)" },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-athena-fade overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[var(--surface-elevated,#12131C)] border border-[var(--border-strong,#2B2D42)] rounded-3xl shadow-2xl p-5 sm:p-7 text-[var(--text-primary,#F3F4F6)] space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border,#1F202E)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Headphones size={12} />
              <span>Studio Voice V5 — Under-the-Hood Quality Lab</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-hero-serif font-bold text-white tracking-tight">
              Underlying TTS Voice & Model Investigation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary,#9CA3AF)]">
              Direct raw synthesis testing to isolate voice model limitations from Athena's audio effects.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Close Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Frozen Baseline Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
          <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300">
              Requirement 1: STUDIO_VOICE_BASELINE Frozen
            </div>
            <div>
              Current baseline voice for <span className="font-mono font-bold text-white">{selectedLang.toUpperCase()}</span>:{" "}
              <span className="font-mono text-amber-100">{baselineInfo}</span> ({STUDIO_VOICE_BASELINE.provider.toUpperCase()} Neural @ {STUDIO_VOICE_BASELINE.speeds[selectedLang]}x).
              This configuration remains preserved for objective A/B comparison.
            </div>
          </div>
        </div>

        {/* 1. Language Tabs (Separate Testing) */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-mono tracking-wider text-gray-400 flex items-center justify-between">
            <span>1. Select Language (Tested Separately)</span>
            <span className="text-[11px] text-purple-300">Requirement 6 & 7: Independent Persona</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(["en", "hi", "ta", "te", "mr", "gu"] as StudioVoiceLanguage[]).map((code) => {
              const prof = LANGUAGE_VOICE_PROFILES[code];
              const isSelected = selectedLang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedLang(code)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(124,92,255,0.25)]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-semibold">{prof.name}</div>
                  <div className="text-[11px] font-mono opacity-70">{prof.nativeName}</div>
                  {code === "ta" && (
                    <span className="mt-1 inline-block text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded">
                      Req 9 Focus
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Candidate Presets (A/B Test Buttons) */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-mono tracking-wider text-gray-400 flex items-center justify-between">
            <span>2. Candidate Voice Comparison (Requirement 4)</span>
            <span className="text-[11px] text-gray-400">Same script • Same approximate speed • Zero effects</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {(["baseline", "alt_a", "alt_b", "alt_c"] as const).map((candKey) => {
              const cand = candidates[candKey];
              const isSelected = activeCandidateId === cand.id;
              return (
                <button
                  key={candKey}
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-600/25 border-indigo-400 text-white shadow-md ring-1 ring-indigo-400"
                      : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className={isSelected ? "text-indigo-300 font-bold" : "text-gray-400"}>
                        {cand.label}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-black/40 border border-white/10">
                        {cand.provider}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-white truncate">{cand.voice}</div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {cand.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Detailed Parameter Controls */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Provider */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-gray-400">Voice Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  const newProv = e.target.value as "edge" | "openai";
                  setProvider(newProv);
                  if (newProv === "openai") {
                    setModel("tts-1-hd");
                    setVoice("nova");
                  } else {
                    setModel("edge-neural");
                    setVoice(candidates.baseline.voice);
                  }
                }}
                className="w-full bg-[#181926] border border-white/15 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="edge">Edge Neural TTS</option>
                <option value="openai">OpenAI Neural TTS</option>
              </select>
            </div>

            {/* Model */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-gray-400">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#181926] border border-white/15 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-purple-400"
              >
                {provider === "edge" ? (
                  <option value="edge-neural">edge-neural (Microsoft FastSpeech2 Vocoder)</option>
                ) : (
                  <>
                    <option value="tts-1-hd">tts-1-hd (High Definition 128kbps)</option>
                    <option value="tts-1">tts-1 (Standard Latency)</option>
                  </>
                )}
              </select>
            </div>

            {/* Voice */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-gray-400">Voice ID</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-[#181926] border border-white/15 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-purple-400 truncate"
              >
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>Speed</span>
                <span className="text-white font-bold">{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.20"
                step="0.01"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer mt-2"
              />
            </div>
          </div>
        </div>

        {/* 4. Textarea / Script Controls */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs uppercase font-mono tracking-wider text-gray-400 flex items-center gap-2">
              <FileText size={13} />
              <span>3. Evaluation Script (Requirement 4 & 10)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setScriptMode("universal");
                  setScriptText(NATIVE_EVALUATION_SCRIPTS.en);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  scriptMode === "universal"
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Standard Test Script
              </button>
              <button
                type="button"
                onClick={() => {
                  setScriptMode("native");
                  setScriptText(NATIVE_EVALUATION_SCRIPTS[selectedLang]);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  scriptMode === "native"
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Native Calm ({selectedLang.toUpperCase()})
              </button>
            </div>
          </div>

          <textarea
            rows={5}
            value={scriptText}
            onChange={(e) => {
              setScriptText(e.target.value);
              setScriptMode("custom");
            }}
            className="w-full bg-[#0D0E15] border border-white/15 rounded-2xl p-3.5 text-xs sm:text-sm text-white font-serif leading-relaxed focus:outline-none focus:border-purple-400"
            placeholder="Type or paste evaluation script..."
          />
        </div>

        {/* 5. Action Buttons (Requirement 4 & 2: Raw direct audio) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Radio size={14} />
                  <span>[Generate]</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePlayRaw}
              disabled={isGenerating}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                isPlaying
                  ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Play size={14} />
              <span>{isPlaying ? "Playing Raw..." : "[Play]"}</span>
            </button>

            <button
              type="button"
              onClick={handleStop}
              disabled={!isPlaying}
              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
            >
              <Square size={13} />
              <span>[Stop]</span>
            </button>

            <button
              type="button"
              onClick={handleReplay}
              disabled={!lastGenerated}
              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>[Replay]</span>
            </button>
          </div>

          {/* Status info */}
          {lastGenerated && (
            <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {lastGenerated.provider.toUpperCase()} • {lastGenerated.sizeBytes} B • RAW audio ready
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 6. Human Evaluation Checklist (A through J Criteria) */}
        <div className="p-4 rounded-2xl bg-[#0F101A] border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span>Requirement 8: Beyond Pronunciation — 10 Quality Pillars</span>
            </div>
            <span className="text-[11px] font-mono text-purple-300">Listen for genuine human delivery</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {EVALUATION_CRITERIA.map((crit) => {
              const isPass = checkedCriteria[crit.key];
              return (
                <div
                  key={crit.key}
                  onClick={() =>
                    setCheckedCriteria((prev) => ({ ...prev, [crit.key]: !prev[crit.key] }))
                  }
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    isPass
                      ? "bg-purple-900/15 border-purple-500/30 text-white"
                      : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                      isPass ? "bg-purple-600 border-purple-500 text-white" : "border-gray-600"
                    }`}
                  >
                    {isPass && <CheckCircle2 size={12} />}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">
                      {crit.key}. {crit.name}
                    </div>
                    <div className="text-[11px] text-gray-400 leading-tight">{crit.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info on Quality Gate */}
        <div className="pt-2 text-[11px] font-mono text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5">
          <span>Requirement 15: Quality Gate — NATURAL HUMAN-LIKE DELIVERY</span>
          <span>Requirement 12: Zero Fake Human FX (No reverb/distortion)</span>
        </div>
      </div>
    </div>
  );
}
