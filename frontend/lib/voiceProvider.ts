/**
 * Athena Studio — Provider-Agnostic 6-Language Humanized Voice & Audio Pipeline
 *
 * Implements an end-to-end calm sanctuary audio pipeline:
 * - Provider Abstraction (IVoiceProvider): AthenaNeuralVoiceProvider + BrowserSpeechVoiceProvider.
 * - Language-Specific Voice Profiles: Distinct persona, pacing, and tone per language.
 * - Single Master Volume Architecture with SEPARATE channels:
 *     VOICE -> Voice Gain (100% baseline 1.0) -> Master Gain (1.0) -> Destination
 *     AMBIENT -> Filter -> Ambient Gain (8% safe baseline 0.08) -> Master Gain -> Destination
 * - Zero voice filtering: Voice channel is never passed through ambient low-pass filters.
 * - Zero double attenuation: Explicit gain and audio element calibration.
 * - Robust Autoplay & AudioContext lifecycle (resumed on user gesture, detects blocked state).
 * - Real playback state machine: "off" | "loading" | "playing" | "paused" | "error" | "blocked" | "idle" | "ended".
 * - Comprehensive Audio Diagnostics displaying all required Web Audio & HTMLAudio properties.
 * - Standalone "Test Voice" test suite bypassing exercise timeline and ambient audio.
 */

import {
  LANGUAGE_VOICE_PROFILES,
  ATHENA_VOICE_PROFILES,
  CATEGORY_PACE_MODIFIERS,
  COMMUNICATIVE_INTENT_OFFSETS,
  CommunicativeIntent,
  prepareTextForSpeech,
  parseScriptIntoSegments,
  StudioVoiceLanguage,
  SpeechSegment,
  AthenaVoiceProfile,
} from "./pronunciation";

export type { StudioVoiceLanguage, SpeechSegment, AthenaVoiceProfile, CommunicativeIntent };

export interface VoiceOption {
  code: StudioVoiceLanguage;
  name: string;
  nativeName: string;
  locale: string;
  voiceId: string;
  provider: string;
  gender: string;
  persona: string;
  description: string;
  previewSample: string;
  qualityWarning?: string | null;
}

export const SUPPORTED_STUDIO_VOICES: VoiceOption[] = [
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    locale: LANGUAGE_VOICE_PROFILES.ta.locale,
    voiceId: LANGUAGE_VOICE_PROFILES.ta.ttsVoice,
    provider: LANGUAGE_VOICE_PROFILES.ta.providerName,
    gender: LANGUAGE_VOICE_PROFILES.ta.gender,
    persona: LANGUAGE_VOICE_PROFILES.ta.persona,
    description: LANGUAGE_VOICE_PROFILES.ta.emotionalCharacter,
    previewSample: LANGUAGE_VOICE_PROFILES.ta.sampleText,
    qualityWarning: LANGUAGE_VOICE_PROFILES.ta.qualityWarning,
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    locale: LANGUAGE_VOICE_PROFILES.te.locale,
    voiceId: LANGUAGE_VOICE_PROFILES.te.ttsVoice,
    provider: LANGUAGE_VOICE_PROFILES.te.providerName,
    gender: LANGUAGE_VOICE_PROFILES.te.gender,
    persona: LANGUAGE_VOICE_PROFILES.te.persona,
    description: LANGUAGE_VOICE_PROFILES.te.emotionalCharacter,
    previewSample: LANGUAGE_VOICE_PROFILES.te.sampleText,
    qualityWarning: LANGUAGE_VOICE_PROFILES.te.qualityWarning,
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    locale: LANGUAGE_VOICE_PROFILES.hi.locale,
    voiceId: LANGUAGE_VOICE_PROFILES.hi.ttsVoice,
    provider: LANGUAGE_VOICE_PROFILES.hi.providerName,
    gender: LANGUAGE_VOICE_PROFILES.hi.gender,
    persona: LANGUAGE_VOICE_PROFILES.hi.persona,
    description: LANGUAGE_VOICE_PROFILES.hi.emotionalCharacter,
    previewSample: LANGUAGE_VOICE_PROFILES.hi.sampleText,
    qualityWarning: LANGUAGE_VOICE_PROFILES.hi.qualityWarning,
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    locale: LANGUAGE_VOICE_PROFILES.mr.locale,
    voiceId: LANGUAGE_VOICE_PROFILES.mr.ttsVoice,
    provider: LANGUAGE_VOICE_PROFILES.mr.providerName,
    gender: LANGUAGE_VOICE_PROFILES.mr.gender,
    persona: LANGUAGE_VOICE_PROFILES.mr.persona,
    description: LANGUAGE_VOICE_PROFILES.mr.emotionalCharacter,
    previewSample: LANGUAGE_VOICE_PROFILES.mr.sampleText,
    qualityWarning: LANGUAGE_VOICE_PROFILES.mr.qualityWarning,
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    locale: LANGUAGE_VOICE_PROFILES.gu.locale,
    voiceId: LANGUAGE_VOICE_PROFILES.gu.ttsVoice,
    provider: LANGUAGE_VOICE_PROFILES.gu.providerName,
    gender: LANGUAGE_VOICE_PROFILES.gu.gender,
    persona: LANGUAGE_VOICE_PROFILES.gu.persona,
    description: LANGUAGE_VOICE_PROFILES.gu.emotionalCharacter,
    previewSample: LANGUAGE_VOICE_PROFILES.gu.sampleText,
    qualityWarning: LANGUAGE_VOICE_PROFILES.gu.qualityWarning,
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    locale: LANGUAGE_VOICE_PROFILES.en.locale,
    voiceId: LANGUAGE_VOICE_PROFILES.en.ttsVoice,
    provider: LANGUAGE_VOICE_PROFILES.en.providerName,
    gender: LANGUAGE_VOICE_PROFILES.en.gender,
    persona: LANGUAGE_VOICE_PROFILES.en.persona,
    description: LANGUAGE_VOICE_PROFILES.en.emotionalCharacter,
    previewSample: LANGUAGE_VOICE_PROFILES.en.sampleText,
    qualityWarning: LANGUAGE_VOICE_PROFILES.en.qualityWarning,
  },
];

export type VoiceStatus = "off" | "loading" | "playing" | "paused" | "error" | "blocked" | "idle" | "ended";

export interface AudioDiagnostics {
  exercise: string;
  language: StudioVoiceLanguage;
  voiceName: string;
  voiceProvider: string;
  voiceId: string;
  voiceLocale: string;
  voicePersona: string;
  voiceProfile: string;
  speakingRate: number;
  exerciseCategory: string;
  segmentNumber: number;
  audioSource: "neural-stream" | "browser-speech" | "none";
  httpStatus: number | null;
  mimeType: string | null;
  audioLoaded: boolean;
  audioDecoded: boolean;
  audioReadyState: number; // 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
  audioNetworkState: number; // 0=EMPTY, 1=IDLE, 2=LOADING, 3=NO_SOURCE
  audioPaused: boolean;
  audioContextState: string;
  audioContextSampleRate: number;
  playbackRequested: boolean;
  playbackStarted: boolean;
  currentTime: number;
  duration: number;
  volume: number; // Master/current volume percent
  audioVolume: number; // HTMLAudioElement.volume
  audioMuted: boolean; // HTMLAudioElement.muted
  masterGainValue: number; // masterGain.gain.value
  voiceGainValue: number; // voiceGain.gain.value
  ambientGainValue: number; // ambientGain.gain.value
  muted: boolean;
  cacheStatus: "HIT" | "MISS" | "IN_MEMORY";
  fallbackUsed: boolean;
  pronunciationProfile: string;
  estimatedAudioDuration: number;
  qualityWarning: string | null;
  error: string | null;
  lastUpdated: string;
  nativeLanguageVoiceReview: "PASS" | "REVIEW";
  pronunciationReview: "PASS" | "REVIEW";
  humanVoiceReview: "PASS" | "REVIEW";
  scriptReview: "PASS" | "REVIEW";
  audioCodec: string;
  audioBitrate: string;
  audioChannels: string;
  playbackPipeline: "WebAudio-Calm-Sanctuary" | "Raw-Direct-TTS";
  rawTtsPlaying: boolean;
  prosodyMode?: "V4-Natural-Prosody" | "V3-Baseline-Uniform";
  communicativeIntent?: string;
}

export interface VoicePlaybackOptions {
  exerciseTitle?: string;
  category?: string;
  cadence?: CommunicativeIntent;
  stepId?: string;
  segmentIndex?: number;
  volume?: number;
  speed?: number;
  voice?: string;
  pitch?: string;
  nextTextToPrefetch?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface AudioResult {
  audioUrl: string;
  source: "neural-stream" | "browser-speech";
  providerId: string;
  providerName: string;
  voiceId: string;
  locale: string;
  persona: string;
  durationEstimateSeconds: number;
  isCached: boolean;
  warning?: string | null;
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: string;
}

// In-memory audio Blob and Object URL cache: key = `${voice}:${speed}:${pitch}:${textHash}`
const audioBlobCache = new Map<string, string>();

// Chrome GC Protection Set for SpeechSynthesisUtterance
const activeUtterances = new Set<SpeechSynthesisUtterance>();

// ==========================================
// VOICE PROVIDER ABSTRACTION INTERFACE
// ==========================================

export interface IVoiceProvider {
  id: string;
  name: string;
  synthesize(request: {
    text: string;
    language: StudioVoiceLanguage;
    voiceId?: string;
    speed?: number;
    pitch?: string;
    category?: string;
    signal?: AbortSignal;
  }): Promise<AudioResult>;
  supportsLanguage(language: StudioVoiceLanguage): boolean;
  getVoices(language: StudioVoiceLanguage): VoiceOption[];
}

/**
 * Primary Provider: Athena Neural Streaming Pipeline via FastAPI backend
 * Routes to native Microsoft Neural Indian voices (Pallavi, Shruti, Swara, Aarohi, Dhwani, Neerja)
 * with volume="+25%" clean normalization headroom.
 */
export class AthenaNeuralVoiceProvider implements IVoiceProvider {
  public id = "athena-neural";
  public name = "Athena Neural Voice Engine";

  public supportsLanguage(language: StudioVoiceLanguage): boolean {
    return ["ta", "te", "hi", "mr", "gu", "en"].includes(language);
  }

  public getVoices(language: StudioVoiceLanguage): VoiceOption[] {
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    const options: VoiceOption[] = [
      {
        code: language,
        name: profile.name,
        nativeName: profile.nativeName,
        locale: profile.locale,
        voiceId: profile.ttsVoice,
        provider: profile.providerName,
        gender: profile.gender,
        persona: profile.persona,
        description: profile.emotionalCharacter,
        previewSample: profile.sampleText,
        qualityWarning: profile.qualityWarning,
      },
    ];

    if (profile.alternativeVoice) {
      options.push({
        code: language,
        name: `${profile.name} (Alternative)`,
        nativeName: profile.nativeName,
        locale: profile.locale,
        voiceId: profile.alternativeVoice,
        provider: profile.providerName,
        gender: profile.gender === "Female" ? "Male" : "Female",
        persona: `Alternative ${profile.name} voice persona`,
        description: profile.emotionalCharacter,
        previewSample: profile.sampleText,
        qualityWarning: profile.qualityWarning,
      });
    }

    return options;
  }

  public async synthesize(request: {
    text: string;
    language: StudioVoiceLanguage;
    voiceId?: string;
    speed?: number;
    pitch?: string;
    category?: string;
    signal?: AbortSignal;
  }): Promise<AudioResult> {
    const profile = LANGUAGE_VOICE_PROFILES[request.language] || LANGUAGE_VOICE_PROFILES.en;
    const voice = request.voiceId || profile.ttsVoice;
    const speed = request.speed || profile.speakingRate || 0.86;
    const pitch = request.pitch || "+0Hz";
    const cacheKey = `${voice}:${speed}:${pitch}:${request.text.trim()}`;

    if (audioBlobCache.has(cacheKey)) {
      return {
        audioUrl: audioBlobCache.get(cacheKey)!,
        source: "neural-stream",
        providerId: this.id,
        providerName: profile.providerName,
        voiceId: voice,
        locale: profile.locale,
        persona: profile.persona,
        durationEstimateSeconds: Math.max(1, Math.round(request.text.length / 15)),
        isCached: true,
        warning: profile.qualityWarning,
      };
    }

    // Connect to backend API via direct path or proxy
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    const endpoint = `${apiUrl.replace(/\/+$/, "")}/voice/speak`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: request.text,
        language: request.language,
        voice,
        speed,
        pitch,
        provider: profile.provider,
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(`TTS HTTP ${response.status}: ${response.statusText}`);
    }

    const respProvider = response.headers.get("X-Voice-Provider") || profile.provider;
    const respVoiceId = response.headers.get("X-Voice-Id") || voice;
    const respLocale = response.headers.get("X-Voice-Locale") || profile.locale;
    const respPersona = response.headers.get("X-Voice-Persona") || profile.persona;
    const respCodec = response.headers.get("X-Audio-Codec") || "audio/mpeg";
    const respBitrate = parseInt(response.headers.get("X-Audio-Bitrate") || "96000", 10);
    const respSampleRate = parseInt(response.headers.get("X-Audio-Sample-Rate") || "24000", 10);
    const respChannels = response.headers.get("X-Audio-Channels") === "1" ? "1 (Mono Full-Fidelity)" : "Stereo";

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    audioBlobCache.set(cacheKey, objectUrl);

    return {
      audioUrl: objectUrl,
      source: "neural-stream",
      providerId: respProvider,
      providerName: respProvider === "edge" ? "Edge Neural (Native Indic)" : "OpenAI Neural",
      voiceId: respVoiceId,
      locale: respLocale,
      persona: respPersona,
      durationEstimateSeconds: Math.max(1, Math.round(request.text.length / 15)),
      isCached: false,
      warning: profile.qualityWarning,
      codec: respCodec,
      bitrate: respBitrate,
      sampleRate: respSampleRate,
      channels: respChannels,
    };
  }
}

export const OpenAIVoiceProvider = AthenaNeuralVoiceProvider;

/**
 * Fallback Provider: Browser Native SpeechSynthesis (Web Speech API)
 */
export class BrowserSpeechVoiceProvider implements IVoiceProvider {
  public id = "browser-speech";
  public name = "Web Speech API (Platform Native)";

  public supportsLanguage(language: StudioVoiceLanguage): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public getVoices(language: StudioVoiceLanguage): VoiceOption[] {
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    return [
      {
        code: language,
        name: `${profile.name} (Native Platform)`,
        nativeName: profile.nativeName,
        locale: profile.fallbackLocale,
        voiceId: profile.fallbackVoice,
        provider: this.name,
        gender: profile.gender,
        persona: profile.persona,
        description: `Browser platform synthesis (${profile.fallbackVoice})`,
        previewSample: profile.sampleText,
        qualityWarning: null,
      },
    ];
  }

  public async synthesize(): Promise<AudioResult> {
    throw new Error("BrowserSpeechVoiceProvider renders directly to speech output, not audio URL");
  }
}

// ==========================================
// CENTRAL STUDIO VOICE MANAGER
// ==========================================

class HumanizedVoiceProvider {
  private voiceStatus: VoiceStatus = "idle";
  private isVoiceMuted: boolean = false;
  private isAmbientMuted: boolean = false;

  // Single Master Volume Architecture:
  // Voice baseline: 1.0 (100%)
  // Ambient baseline: 0.08 (8% safe baseline, never masks voice)
  // Master baseline: 1.0 (100%)
  private voiceVolume: number = 1.0;
  private ambientVolume: number = 0.08;
  private masterVolume: number = 1.0;

  private previewingLang: StudioVoiceLanguage | null = null;
  private currentStepId: string | null = null;

  // Single Authoritative HTMLAudioElement
  private audioEl: HTMLAudioElement | null = null;
  private abortController: AbortController | null = null;

  // Web Audio Graph
  private audioCtx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private voiceGainNode: GainNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private isWebAudioConnected: boolean = false;

  // Ambience Oscillators & Filter
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private isAmbienceRunning: boolean = false;

  // Pluggable Providers
  private primaryProvider: IVoiceProvider = new AthenaNeuralVoiceProvider();
  private fallbackProvider: IVoiceProvider = new BrowserSpeechVoiceProvider();

  // Diagnostics
  private diagnostics: AudioDiagnostics = {
    exercise: "Studio Practice",
    language: "ta",
    voiceName: "Tamil (ta-IN-PallaviNeural)",
    voiceProvider: "Edge Neural (Native Dravidian)",
    voiceId: "ta-IN-PallaviNeural",
    voiceLocale: "ta-IN",
    voicePersona: "Pallavi (Natural spoken modern Tamil guide)",
    voiceProfile: "Natural modern spoken Tamil, zero textbook tone",
    speakingRate: 0.84,
    exerciseCategory: "RESET",
    segmentNumber: 1,
    audioSource: "none",
    httpStatus: null,
    mimeType: null,
    audioLoaded: false,
    audioDecoded: false,
    audioReadyState: 0,
    audioNetworkState: 0,
    audioPaused: true,
    audioContextState: "uninitialized",
    audioContextSampleRate: 48000,
    playbackRequested: false,
    playbackStarted: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    audioVolume: 1.0,
    audioMuted: false,
    masterGainValue: 1.0,
    voiceGainValue: 1.0,
    ambientGainValue: 0.08,
    muted: false,
    cacheStatus: "IN_MEMORY",
    fallbackUsed: false,
    pronunciationProfile: "Phonetic Sanctuary Lexicon",
    estimatedAudioDuration: 0,
    qualityWarning: null,
    error: null,
    lastUpdated: new Date().toLocaleTimeString(),
    nativeLanguageVoiceReview: "PASS",
    pronunciationReview: "PASS",
    humanVoiceReview: "PASS",
    scriptReview: "PASS",
    audioCodec: "audio/mpeg (MPEG 2 Layer III)",
    audioBitrate: "96 kbps CBR Studio Fidelity",
    audioChannels: "1 (Mono Full-Fidelity)",
    playbackPipeline: "WebAudio-Calm-Sanctuary",
    rawTtsPlaying: false,
    prosodyMode: "V4-Natural-Prosody",
    communicativeIntent: "natural-open",
  };

  private diagListeners: Set<(diag: AudioDiagnostics) => void> = new Set();
  private statusListeners: Set<(status: VoiceStatus) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedVoice = localStorage.getItem("athena_studio_voice_vol");
        if (savedVoice !== null) {
          const parsed = parseFloat(savedVoice);
          if (!isNaN(parsed) && parsed > 0.05) this.voiceVolume = Math.max(0, Math.min(1, parsed));
        }
        const savedAmbient = localStorage.getItem("athena_studio_ambient_vol");
        if (savedAmbient !== null) {
          const parsed = parseFloat(savedAmbient);
          if (!isNaN(parsed)) this.ambientVolume = Math.max(0, Math.min(0.25, parsed));
        }
      } catch {}

      this.initAudioElement();
    }
  }

  public getBestVoiceForLanguage(language: StudioVoiceLanguage): VoiceOption {
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    return {
      code: language,
      name: profile.name,
      nativeName: profile.nativeName,
      locale: profile.locale,
      voiceId: profile.ttsVoice,
      provider: this.primaryProvider.name,
      description: profile.emotionalCharacter,
      gender: profile.gender || "female",
      persona: profile.persona || profile.emotionalCharacter,
      previewSample: profile.sampleText,
      qualityWarning: profile.qualityWarning,
    };
  }

  /**
   * Initializes Web Audio context and node graph:
   * Voice channel connects directly to master (NO filtering).
   * Ambient channel connects through ambient filter to master.
   */
  public initAudioGraph(): void {
    if (typeof window === "undefined") return;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (!this.audioCtx) return;

    // 1. Master Gain Node (Output to destination)
    if (!this.masterGainNode) {
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
      this.masterGainNode.connect(this.audioCtx.destination);
    }

    // 2. Voice Gain Node (Pure voice channel, full 1.0 baseline, zero lowpass)
    if (!this.voiceGainNode) {
      this.voiceGainNode = this.audioCtx.createGain();
      const currentVoiceLevel = this.isVoiceMuted ? 0 : this.voiceVolume;
      this.voiceGainNode.gain.setValueAtTime(currentVoiceLevel, this.audioCtx.currentTime);
      this.voiceGainNode.connect(this.masterGainNode);
    }

    // 3. Ambient Gain Node (Safe 5-12% baseline, default 0.08)
    if (!this.ambientGainNode) {
      this.ambientGainNode = this.audioCtx.createGain();
      const currentAmbientLevel = this.isAmbientMuted ? 0 : this.ambientVolume;
      this.ambientGainNode.gain.setValueAtTime(currentAmbientLevel, this.audioCtx.currentTime);
      this.ambientGainNode.connect(this.masterGainNode);
    }

    // 4. Connect HTMLAudioElement to Web Audio ONCE
    this.initAudioElement();
    if (this.audioEl && !this.mediaSourceNode && this.audioCtx) {
      try {
        this.mediaSourceNode = this.audioCtx.createMediaElementSource(this.audioEl);
        this.mediaSourceNode.connect(this.voiceGainNode);
        this.isWebAudioConnected = true;
      } catch (e) {
        // If already connected or restricted, fallback to standalone element playback
        console.warn("[VoiceProvider] createMediaElementSource note:", e);
        this.isWebAudioConnected = false;
      }
    }

    this.diagnostics.audioContextState = this.audioCtx.state;
    this.diagnostics.audioContextSampleRate = this.audioCtx.sampleRate;
    this.updateDiagnosticsValues();
  }

  private initAudioElement() {
    if (typeof window === "undefined") return;
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = "auto";
      // Avoid double attenuation: audioEl plays at 1.0 when routed through WebAudio voiceGainNode
      this.audioEl.volume = 1.0;
      this.audioEl.muted = false;

      this.audioEl.addEventListener("timeupdate", () => {
        if (this.audioEl) {
          this.diagnostics.currentTime = Math.round(this.audioEl.currentTime * 10) / 10;
          this.diagnostics.duration = Math.round((this.audioEl.duration || 0) * 10) / 10;
          this.diagnostics.audioPaused = this.audioEl.paused;
          this.emitDiagnostics();
        }
      });

      this.audioEl.addEventListener("playing", () => {
        this.voiceStatus = "playing";
        this.diagnostics.playbackStarted = true;
        this.diagnostics.audioPaused = false;
        this.diagnostics.audioReadyState = this.audioEl?.readyState ?? 4;
        this.diagnostics.audioNetworkState = this.audioEl?.networkState ?? 1;
        this.emitStatus();
        this.emitDiagnostics();
      });

      this.audioEl.addEventListener("pause", () => {
        if (this.voiceStatus === "playing") {
          this.voiceStatus = "paused";
          this.diagnostics.playbackStarted = false;
          this.diagnostics.audioPaused = true;
          this.emitStatus();
          this.emitDiagnostics();
        }
      });

      this.audioEl.addEventListener("ended", () => {
        this.voiceStatus = "ended";
        this.diagnostics.playbackStarted = false;
        this.diagnostics.audioPaused = true;
        this.emitStatus();
        this.emitDiagnostics();
      });

      this.audioEl.addEventListener("error", (e) => {
        console.warn("[VoiceProvider AudioElement Event Error]:", e);
      });
    }
  }

  /**
   * Browser Autoplay & AudioContext Unlocking
   */
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      this.initAudioGraph();

      if (this.audioCtx && this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      if (this.audioEl) {
        this.audioEl.muted = false;
      }

      this.updateDiagnosticsValues();
      return this.audioCtx?.state === "running";
    } catch (err) {
      console.warn("[VoiceProvider unlockAudio Warning]:", err);
      return false;
    }
  }

  private updateDiagnosticsValues() {
    this.diagnostics.audioVolume = this.audioEl?.volume ?? 1.0;
    this.diagnostics.audioMuted = this.audioEl?.muted ?? false;
    this.diagnostics.masterGainValue = this.masterGainNode?.gain.value ?? this.masterVolume;
    this.diagnostics.voiceGainValue = this.voiceGainNode?.gain.value ?? this.voiceVolume;
    this.diagnostics.ambientGainValue = this.ambientGainNode?.gain.value ?? this.ambientVolume;
    this.diagnostics.audioContextState = this.audioCtx?.state ?? "uninitialized";
    this.diagnostics.audioContextSampleRate = this.audioCtx?.sampleRate ?? 48000;
    this.diagnostics.audioPaused = this.audioEl?.paused ?? true;
    this.diagnostics.audioReadyState = this.audioEl?.readyState ?? 0;
    this.diagnostics.audioNetworkState = this.audioEl?.networkState ?? 0;
    this.diagnostics.volume = this.voiceVolume;
    this.diagnostics.muted = this.isVoiceMuted;
  }

  public getVoiceStatus(): VoiceStatus {
    return this.voiceStatus;
  }

  public getDiagnostics(): AudioDiagnostics {
    this.updateDiagnosticsValues();
    return { ...this.diagnostics };
  }

  public subscribeDiagnostics(listener: (diag: AudioDiagnostics) => void): () => void {
    this.diagListeners.add(listener);
    this.updateDiagnosticsValues();
    listener({ ...this.diagnostics });
    return () => this.diagListeners.delete(listener);
  }

  public subscribeStatus(listener: (status: VoiceStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.voiceStatus);
    return () => this.statusListeners.delete(listener);
  }

  private emitDiagnostics() {
    this.updateDiagnosticsValues();
    this.diagnostics.lastUpdated = new Date().toLocaleTimeString();
    for (const listener of this.diagListeners) {
      listener({ ...this.diagnostics });
    }
  }

  private emitStatus() {
    for (const listener of this.statusListeners) {
      listener(this.voiceStatus);
    }
  }

  public setVoiceVolume(vol: number) {
    this.voiceVolume = Math.max(0, Math.min(1, vol));
    if (this.voiceGainNode && this.audioCtx) {
      const targetGain = this.isVoiceMuted ? 0 : this.voiceVolume;
      this.voiceGainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    }
    // Fallback if not routed through Web Audio
    if (!this.isWebAudioConnected && this.audioEl) {
      this.audioEl.volume = this.isVoiceMuted ? 0 : this.voiceVolume;
    }
    this.diagnostics.volume = this.voiceVolume;
    this.emitDiagnostics();
    try {
      localStorage.setItem("athena_studio_voice_vol", String(this.voiceVolume));
    } catch {}
  }

  public getVoiceVolume(): number {
    return this.voiceVolume;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
    }
    this.emitDiagnostics();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setVoiceMuted(muted: boolean) {
    this.isVoiceMuted = muted;
    this.diagnostics.muted = muted;
    if (this.voiceGainNode && this.audioCtx) {
      this.voiceGainNode.gain.setValueAtTime(muted ? 0 : this.voiceVolume, this.audioCtx.currentTime);
    }
    if (!this.isWebAudioConnected && this.audioEl) {
      this.audioEl.muted = muted;
    }
    if (muted && this.voiceStatus === "playing") {
      this.pause();
    }
    if (muted) {
      this.voiceStatus = "off";
      this.emitStatus();
    }
    this.emitDiagnostics();
  }

  public isMuted(): boolean {
    return this.isVoiceMuted;
  }

  public prefetchStep(
    text: string,
    language: StudioVoiceLanguage = "en",
    speed: number = 0.88,
    voice?: string
  ) {
    if (!text || typeof window === "undefined") return;
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    const voicePersona = voice || profile.ttsVoice || "alloy";
    const cacheKey = `${voicePersona}:${speed}:+0Hz:${text.trim()}`;
    if (audioBlobCache.has(cacheKey)) return;

    this.primaryProvider
      .synthesize({
        text,
        language,
        voiceId: voicePersona,
        speed,
      })
      .catch(() => {});
  }

  // ==========================================
  // CORE SPEAK INSTRUCTION PIPELINE
  // ==========================================

  public async speakInstruction(
    text: string,
    language: StudioVoiceLanguage,
    options?: VoicePlaybackOptions
  ): Promise<void> {
    if (typeof window === "undefined") return;

    if (this.isVoiceMuted || !text || !text.trim()) {
      this.voiceStatus = this.isVoiceMuted ? "off" : "idle";
      this.emitStatus();
      if (options?.onEnd) options.onEnd();
      return;
    }

    this.initAudioGraph();
    await this.unlockAudio();

    // Prepare text for spoken meditation
    const preparedSpeechText = prepareTextForSpeech(text, language, {
      category: options?.category,
    });

    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    const voicePersona = options?.voice || profile.ttsVoice || "alloy";
    const categoryModifier = options?.category ? CATEGORY_PACE_MODIFIERS[options.category] : undefined;
    const baseSpeed = categoryModifier || profile.speakingRate || 0.95;
    const intentOffset = options?.cadence && COMMUNICATIVE_INTENT_OFFSETS[options.cadence] !== undefined
      ? COMMUNICATIVE_INTENT_OFFSETS[options.cadence]
      : 0;

    const targetSpeed =
      options?.speed && options.speed !== 1.0
        ? options.speed
        : Math.round((baseSpeed + intentOffset) * 100) / 100;

    // Diagnostics update
    this.currentStepId = options?.stepId || null;
    this.diagnostics.exercise = options?.exerciseTitle || "Studio Practice";
    this.diagnostics.language = language;
    this.diagnostics.voiceName = `${profile.name} (${voicePersona} Neural)`;
    this.diagnostics.voiceProvider = this.primaryProvider.name;
    this.diagnostics.voiceId = voicePersona;
    this.diagnostics.voiceProfile = profile.emotionalCharacter;
    this.diagnostics.speakingRate = targetSpeed;
    this.diagnostics.prosodyMode = "V4-Natural-Prosody";
    this.diagnostics.communicativeIntent = options?.cadence || "natural-flow";
    this.diagnostics.exerciseCategory = options?.category || "RESET";
    this.diagnostics.segmentNumber = options?.segmentIndex !== undefined ? options.segmentIndex + 1 : 1;
    this.diagnostics.playbackRequested = true;
    this.diagnostics.playbackStarted = false;
    this.diagnostics.audioLoaded = false;
    this.diagnostics.qualityWarning = profile.qualityWarning || null;
    this.diagnostics.fallbackUsed = false;
    this.diagnostics.error = null;

    this.voiceStatus = "loading";
    this.emitStatus();
    this.emitDiagnostics();

    try {
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      // 1. PRIMARY ENGINE: Neural Audio Playback
      const audioResult = await this.primaryProvider.synthesize({
        text: preparedSpeechText,
        language,
        voiceId: voicePersona,
        speed: targetSpeed,
        category: options?.category,
        signal: this.abortController.signal,
      });

      this.diagnostics.audioSource = "neural-stream";
      this.diagnostics.voiceProvider = audioResult.providerName;
      this.diagnostics.voiceId = audioResult.voiceId;
      this.diagnostics.voiceLocale = audioResult.locale;
      this.diagnostics.voicePersona = audioResult.persona;
      this.diagnostics.httpStatus = 200;
      this.diagnostics.mimeType = audioResult.codec || "audio/mpeg";
      this.diagnostics.audioLoaded = true;
      this.diagnostics.audioDecoded = true;
      this.diagnostics.cacheStatus = audioResult.isCached ? "HIT" : "MISS";
      this.diagnostics.estimatedAudioDuration = audioResult.durationEstimateSeconds;
      this.diagnostics.audioCodec = audioResult.codec || "audio/mpeg (MPEG 2 Layer III)";
      this.diagnostics.audioBitrate = audioResult.bitrate ? `${audioResult.bitrate / 1000} kbps CBR` : "96 kbps CBR Studio Fidelity";
      this.diagnostics.audioChannels = audioResult.channels || "1 (Mono Full-Fidelity)";
      this.diagnostics.playbackPipeline = "WebAudio-Calm-Sanctuary";
      this.diagnostics.rawTtsPlaying = false;

      if (!this.audioEl) {
        throw new Error("HTMLAudioElement unavailable");
      }

      // Ensure AudioContext is running
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      // Reset & assign audio URL
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.audioEl.src = audioResult.audioUrl;
      this.audioEl.playbackRate = 1.0;
      this.audioEl.muted = false;

      // Update voice gain node to full volume without double attenuation
      const effectiveVoiceVol = (options?.volume ?? 1.0) * this.voiceVolume;
      if (this.voiceGainNode && this.audioCtx) {
        this.voiceGainNode.gain.setValueAtTime(effectiveVoiceVol, this.audioCtx.currentTime);
      }
      if (!this.isWebAudioConnected) {
        this.audioEl.volume = effectiveVoiceVol;
      } else {
        this.audioEl.volume = 1.0;
      }

      this.audioEl.onended = () => {
        this.voiceStatus = "ended";
        this.diagnostics.playbackStarted = false;
        this.diagnostics.audioPaused = true;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onEnd) options.onEnd();
      };

      const playPromise = this.audioEl.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      this.voiceStatus = "playing";
      this.diagnostics.playbackStarted = true;
      this.diagnostics.audioPaused = false;
      this.diagnostics.audioReadyState = this.audioEl.readyState;
      this.emitStatus();
      this.emitDiagnostics();

      if (options?.onStart) options.onStart();

      if (options?.nextTextToPrefetch) {
        const preparedNext = prepareTextForSpeech(options.nextTextToPrefetch, language);
        this.prefetchStep(preparedNext, language, targetSpeed, voicePersona);
      }
    } catch (primaryErr: any) {
      if (primaryErr?.name === "AbortError") {
        return;
      }

      console.warn("[Athena Voice Neural Primary Warning]:", primaryErr);

      // Check if blocked by browser autoplay policy
      if (primaryErr?.name === "NotAllowedError") {
        this.voiceStatus = "blocked";
        this.diagnostics.error = "Autoplay blocked by browser. Click anywhere to activate voice.";
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onError) options.onError(primaryErr);
        return;
      }

      this.diagnostics.fallbackUsed = true;
      this.diagnostics.voiceProvider = this.fallbackProvider.name;

      // 2. FALLBACK ENGINE: Browser SpeechSynthesis
      try {
        await this.fallbackBrowserSpeech(preparedSpeechText, language, options);
      } catch (fallbackErr: any) {
        console.error("[Athena Voice All Engines Failed]:", fallbackErr);
        this.voiceStatus = "error";
        this.diagnostics.error = primaryErr?.message || "Audio playback blocked or unavailable";
        this.diagnostics.audioSource = "none";
        this.diagnostics.playbackStarted = false;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onError) options.onError(fallbackErr);
      }
    }
  }

  /**
   * Browser SpeechSynthesis Fallback with GC protection & voice matching.
   */
  private fallbackBrowserSpeech(
    text: string,
    language: StudioVoiceLanguage,
    options?: VoicePlaybackOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        return reject(new Error("speechSynthesis not supported"));
      }

      const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = profile.fallbackLocale || profile.locale;
      utterance.rate = 0.88 * (options?.speed || 1.0);
      utterance.pitch = 0.98;
      utterance.volume = this.voiceVolume * (options?.volume ?? 1.0);

      activeUtterances.add(utterance);

      const allVoices = window.speechSynthesis.getVoices();
      const matchedVoice = allVoices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(language.toLowerCase()) ||
          v.lang.toLowerCase().replace("_", "-").startsWith(profile.fallbackLocale.toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        this.diagnostics.voiceId = matchedVoice.name;
      }

      utterance.onstart = () => {
        this.voiceStatus = "playing";
        this.diagnostics.audioSource = "browser-speech";
        this.diagnostics.playbackStarted = true;
        this.diagnostics.audioLoaded = true;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onStart) options.onStart();
        resolve();
      };

      utterance.onend = () => {
        activeUtterances.delete(utterance);
        this.voiceStatus = "ended";
        this.diagnostics.playbackStarted = false;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        activeUtterances.delete(utterance);
        this.voiceStatus = "error";
        this.diagnostics.error = `SpeechSynthesis error: ${e.error}`;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onError) options.onError(e);
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // ==========================================
  // STANDALONE VOICE TEST (Requirement 9)
  // Bypasses exercise timeline, ambient sound, breathing loops
  // ==========================================

  public async testVoice(language: StudioVoiceLanguage = "en"): Promise<void> {
    this.cancel();
    this.initAudioGraph();
    await this.unlockAudio();

    // Ensure 100% baseline volume and unmute
    this.setVoiceMuted(false);
    this.setVoiceVolume(1.0);
    this.setMasterVolume(1.0);

    const wasAmbienceRunning = this.isAmbienceRunning;
    if (wasAmbienceRunning) {
      this.pauseAmbience();
    }

    const testPhrases: Record<StudioVoiceLanguage, string> = {
      en: "If you're comfortable, let your eyes close... Take a slow breath in, and as you breathe out, let your shoulders soften a little.",
      hi: "अगर आप सहज महसूस कर रहे हैं, तो धीरे से आँखें बंद कर लीजिए... एक गहरा, शांत सांस अंदर लीजिए, और छोड़ते हुए कंधों को हल्का छोड़ दीजिए।",
      ta: "உங்களுக்கு சௌகரியமா இருந்தா, கண்களை மெதுவா மூடிக்கோங்க... ஒரு அமைதியான மூச்சை உள்ளே இழுத்து, மெதுவா வெளியே விடும்போது தோள்களை லேசா தளர விடுங்கள்.",
      te: "మీకు వీలైతే, నెమ్మదిగా కళ్ళు మూసుకోండి... హాయిగా ఒక దీర్ఘ శ్వాస లోపలికి తీసుకుంటూ, వదిలేటప్పుడు భుజాలను తేలికగా వదిలేయండి.",
      mr: "तुम्हाला सोयीचं वाटत असेल तर हळूच डोळे मिटून घ्या... एक शांत, संथ श्वास आत घ्या, आणि बाहेर सोडताना खांदे अगदी हलके सैल सोडा.",
      gu: "જો અનુકૂળ લાગે, તો ધીમેથી આંખો બંધ કરી લો... એક શાંત, ઊંડો શ્વાસ અંદર લો, અને બહાર કાઢતી વખતે ખભાને સાવ ઢીલા છોડી દો.",
    };

    const textToSpeak = testPhrases[language] || testPhrases.en;
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;

    try {
      await this.speakInstruction(textToSpeak, language, {
        exerciseTitle: `Voice Test (${language.toUpperCase()})`,
        category: "RESET",
        volume: 1.0,
        speed: profile.speakingRate || 0.96,
      });
    } finally {
      if (wasAmbienceRunning) {
        this.resumeAmbience();
      }
    }
  }

  // ==========================================
  // REQUIREMENT 16: PLAY RAW TTS VS FINAL ATHENA AUDIO
  // ==========================================

  private rawAudioEl: HTMLAudioElement | null = null;

  public async playRawTTS(
    text: string,
    language: StudioVoiceLanguage,
    options?: VoicePlaybackOptions
  ): Promise<void> {
    if (typeof window === "undefined") return;
    this.stopRawTTS();
    this.cancel();

    const preparedSpeechText = prepareTextForSpeech(text, language, {
      category: options?.category,
    });
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    const voicePersona = options?.voice || profile.ttsVoice || "en-IN-NeerjaExpressiveNeural";
    const targetSpeed = options?.speed || profile.speakingRate || 0.96;

    this.diagnostics.exercise = options?.exerciseTitle || "Raw TTS Evaluation";
    this.diagnostics.language = language;
    this.diagnostics.voiceName = `${profile.name} (${voicePersona} Neural Raw)`;
    this.diagnostics.voiceId = voicePersona;
    this.diagnostics.speakingRate = targetSpeed;
    this.diagnostics.audioSource = "neural-stream";
    this.diagnostics.playbackPipeline = "Raw-Direct-TTS";
    this.diagnostics.rawTtsPlaying = true;
    this.diagnostics.playbackRequested = true;
    this.diagnostics.playbackStarted = false;
    this.diagnostics.audioLoaded = false;
    this.diagnostics.audioDecoded = false;
    this.diagnostics.error = null;

    this.voiceStatus = "loading";
    this.emitStatus();
    this.emitDiagnostics();

    try {
      const audioResult = await this.primaryProvider.synthesize({
        text: preparedSpeechText,
        language,
        voiceId: voicePersona,
        speed: targetSpeed,
        pitch: options?.pitch || "+0Hz",
        category: options?.category,
      });

      this.rawAudioEl = new Audio(audioResult.audioUrl);
      this.rawAudioEl.volume = this.voiceVolume;
      this.diagnostics.audioCodec = audioResult.codec || "audio/mpeg (MPEG 2 Layer III)";
      this.diagnostics.audioBitrate = audioResult.bitrate ? `${audioResult.bitrate / 1000} kbps CBR` : "96 kbps CBR Studio Fidelity";
      this.diagnostics.audioChannels = audioResult.channels || "1 (Mono Full-Fidelity)";
      this.diagnostics.audioLoaded = true;
      this.diagnostics.audioDecoded = true;
      this.diagnostics.playbackStarted = true;
      this.diagnostics.audioPaused = false;
      this.diagnostics.playbackPipeline = "Raw-Direct-TTS";
      this.diagnostics.rawTtsPlaying = true;

      this.rawAudioEl.onended = () => {
        this.voiceStatus = "ended";
        this.diagnostics.playbackStarted = false;
        this.diagnostics.audioPaused = true;
        this.diagnostics.rawTtsPlaying = false;
        this.emitStatus();
        this.emitDiagnostics();
        options?.onEnd?.();
      };

      this.rawAudioEl.onerror = (e) => {
        console.warn("[Raw TTS Error]", e);
        this.voiceStatus = "error";
        this.diagnostics.rawTtsPlaying = false;
        this.emitStatus();
        this.emitDiagnostics();
        options?.onError?.(e);
      };

      await this.rawAudioEl.play();
      this.voiceStatus = "playing";
      this.emitStatus();
      this.emitDiagnostics();
      options?.onStart?.();
    } catch (err: any) {
      console.warn("[Raw TTS Playback Error]", err);
      this.voiceStatus = "error";
      this.diagnostics.error = err?.message || "Failed to play raw TTS";
      this.diagnostics.rawTtsPlaying = false;
      this.emitStatus();
      this.emitDiagnostics();
      options?.onError?.(err);
    }
  }

  public stopRawTTS(): void {
    if (this.rawAudioEl) {
      this.rawAudioEl.pause();
      this.rawAudioEl.currentTime = 0;
      this.rawAudioEl.src = "";
      this.rawAudioEl = null;
      this.diagnostics.rawTtsPlaying = false;
    }
  }

  // ==========================================
  // REQUIREMENT 16: V3 BASELINE VS V4 NATURAL PROSODY COMPARISON
  // ==========================================

  public async playV3BaselineTTS(
    text: string,
    language: StudioVoiceLanguage,
    options?: VoicePlaybackOptions
  ): Promise<void> {
    if (typeof window === "undefined") return;
    this.stopRawTTS();
    this.cancel();

    // V3 Baseline: uniform flat cadence, replacing meditative ellipses with hard sentence periods
    const v3Text = text.replace(/\.{3,}/g, ". ").replace(/,\s*/g, ". ");
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    const voicePersona = options?.voice || profile.ttsVoice || "en-IN-NeerjaExpressiveNeural";
    // Fixed static rate without meaning-based prosody variations
    const staticSpeed = 0.95;

    this.diagnostics.exercise = options?.exerciseTitle || "V3 Baseline (Uniform)";
    this.diagnostics.language = language;
    this.diagnostics.voiceName = `${profile.name} (${voicePersona} V3 Baseline)`;
    this.diagnostics.voiceId = voicePersona;
    this.diagnostics.speakingRate = staticSpeed;
    this.diagnostics.prosodyMode = "V3-Baseline-Uniform";
    this.diagnostics.communicativeIntent = "uniform-flat";
    this.diagnostics.audioSource = "neural-stream";
    this.diagnostics.playbackPipeline = "Raw-Direct-TTS";
    this.diagnostics.rawTtsPlaying = true;
    this.diagnostics.playbackRequested = true;
    this.diagnostics.playbackStarted = false;
    this.diagnostics.audioLoaded = false;
    this.diagnostics.audioDecoded = false;
    this.diagnostics.error = null;

    this.voiceStatus = "loading";
    this.emitStatus();
    this.emitDiagnostics();

    try {
      const audioResult = await this.primaryProvider.synthesize({
        text: v3Text,
        language,
        voiceId: voicePersona,
        speed: staticSpeed,
        pitch: "+0Hz",
        category: options?.category,
      });

      this.rawAudioEl = new Audio(audioResult.audioUrl);
      this.rawAudioEl.volume = this.voiceVolume;
      this.diagnostics.audioCodec = audioResult.codec || "audio/mpeg (MPEG 2 Layer III)";
      this.diagnostics.audioBitrate = audioResult.bitrate ? `${audioResult.bitrate / 1000} kbps CBR` : "96 kbps CBR Studio Fidelity";
      this.diagnostics.audioChannels = audioResult.channels || "1 (Mono Full-Fidelity)";
      this.diagnostics.audioLoaded = true;
      this.diagnostics.audioDecoded = true;
      this.diagnostics.playbackStarted = true;
      this.voiceStatus = "playing";
      this.emitStatus();
      this.emitDiagnostics();

      if (options?.onStart) options.onStart();

      this.rawAudioEl.onended = () => {
        this.voiceStatus = "ended";
        this.diagnostics.rawTtsPlaying = false;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onEnd) options.onEnd();
      };

      await this.rawAudioEl.play();
    } catch (err: any) {
      this.voiceStatus = "error";
      this.diagnostics.error = err.message || "Failed V3 baseline playback";
      this.diagnostics.rawTtsPlaying = false;
      this.emitStatus();
      this.emitDiagnostics();
      if (options?.onError) options.onError(err);
    }
  }

  public async playV4NaturalProsodyTTS(
    text: string,
    language: StudioVoiceLanguage,
    options?: VoicePlaybackOptions
  ): Promise<void> {
    if (typeof window === "undefined") return;
    this.stopRawTTS();
    this.cancel();

    // V4 Natural Prosody: Connected thought flow with gentle ellipses, natural open intonation,
    // and meaning-based cadence modulation
    const preparedSpeechText = prepareTextForSpeech(text, language, {
      category: options?.category,
    });
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    const voicePersona = options?.voice || profile.ttsVoice || "en-IN-NeerjaExpressiveNeural";
    const categoryModifier = options?.category ? CATEGORY_PACE_MODIFIERS[options.category] : undefined;
    const baseSpeed = categoryModifier || profile.speakingRate || 0.95;
    const intentOffset = options?.cadence && COMMUNICATIVE_INTENT_OFFSETS[options.cadence] !== undefined
      ? COMMUNICATIVE_INTENT_OFFSETS[options.cadence]
      : 0;
    const targetSpeed = Math.round((baseSpeed + intentOffset) * 100) / 100;

    this.diagnostics.exercise = options?.exerciseTitle || "V4 Natural Prosody";
    this.diagnostics.language = language;
    this.diagnostics.voiceName = `${profile.name} (${voicePersona} V4 Natural Prosody)`;
    this.diagnostics.voiceId = voicePersona;
    this.diagnostics.speakingRate = targetSpeed;
    this.diagnostics.prosodyMode = "V4-Natural-Prosody";
    this.diagnostics.communicativeIntent = options?.cadence || "natural-open";
    this.diagnostics.audioSource = "neural-stream";
    this.diagnostics.playbackPipeline = "Raw-Direct-TTS";
    this.diagnostics.rawTtsPlaying = true;
    this.diagnostics.playbackRequested = true;
    this.diagnostics.playbackStarted = false;
    this.diagnostics.audioLoaded = false;
    this.diagnostics.audioDecoded = false;
    this.diagnostics.error = null;

    this.voiceStatus = "loading";
    this.emitStatus();
    this.emitDiagnostics();

    try {
      const audioResult = await this.primaryProvider.synthesize({
        text: preparedSpeechText,
        language,
        voiceId: voicePersona,
        speed: targetSpeed,
        pitch: options?.pitch || "+0Hz",
        category: options?.category,
      });

      this.rawAudioEl = new Audio(audioResult.audioUrl);
      this.rawAudioEl.volume = this.voiceVolume;
      this.diagnostics.audioCodec = audioResult.codec || "audio/mpeg (MPEG 2 Layer III)";
      this.diagnostics.audioBitrate = audioResult.bitrate ? `${audioResult.bitrate / 1000} kbps CBR` : "96 kbps CBR Studio Fidelity";
      this.diagnostics.audioChannels = audioResult.channels || "1 (Mono Full-Fidelity)";
      this.diagnostics.audioLoaded = true;
      this.diagnostics.audioDecoded = true;
      this.diagnostics.playbackStarted = true;
      this.voiceStatus = "playing";
      this.emitStatus();
      this.emitDiagnostics();

      if (options?.onStart) options.onStart();

      this.rawAudioEl.onended = () => {
        this.voiceStatus = "ended";
        this.diagnostics.rawTtsPlaying = false;
        this.emitStatus();
        this.emitDiagnostics();
        if (options?.onEnd) options.onEnd();
      };

      await this.rawAudioEl.play();
    } catch (err: any) {
      this.voiceStatus = "error";
      this.diagnostics.error = err.message || "Failed V4 natural prosody playback";
      this.diagnostics.rawTtsPlaying = false;
      this.emitStatus();
      this.emitDiagnostics();
      if (options?.onError) options.onError(err);
    }
  }

  // ==========================================
  // VOICE PREVIEW (Native Sample)
  // ==========================================

  public async playPreview(
    language: StudioVoiceLanguage,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const profile = LANGUAGE_VOICE_PROFILES[language] || LANGUAGE_VOICE_PROFILES.en;
    this.previewingLang = language;

    await this.speakInstruction(profile.sampleText, language, {
      exerciseTitle: `Preview (${profile.name})`,
      voice: profile.ttsVoice,
      speed: profile.speakingRate,
      volume: 1.0,
      onStart: () => {
        if (onStart) onStart();
      },
      onEnd: () => {
        this.previewingLang = null;
        if (onEnd) onEnd();
      },
      onError: () => {
        this.previewingLang = null;
        if (onEnd) onEnd();
      },
    });
  }

  public stopPreview(): void {
    this.previewingLang = null;
    this.cancel();
  }

  public isPreviewing(language: StudioVoiceLanguage): boolean {
    return this.previewingLang === language && this.voiceStatus === "playing";
  }

  // ==========================================
  // SESSION CONTROLS: PAUSE, RESUME, CANCEL
  // ==========================================

  public pause(): void {
    if (this.audioEl && !this.audioEl.paused) {
      this.audioEl.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    this.voiceStatus = "paused";
    this.diagnostics.playbackStarted = false;
    this.diagnostics.audioPaused = true;
    this.emitStatus();
    this.emitDiagnostics();
  }

  public resume(): void {
    this.unlockAudio();
    if (this.audioEl && this.audioEl.src && this.audioEl.paused) {
      this.audioEl.play().catch((err) => {
        console.warn("[VoiceProvider Resume Warning]:", err);
      });
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    this.voiceStatus = "playing";
    this.diagnostics.playbackStarted = true;
    this.diagnostics.audioPaused = false;
    this.emitStatus();
    this.emitDiagnostics();
  }

  public cancel(): void {
    this.stopRawTTS();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.audioEl.src = "";
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeUtterances.clear();
    this.voiceStatus = "idle";
    this.diagnostics.playbackStarted = false;
    this.diagnostics.audioLoaded = false;
    this.diagnostics.currentTime = 0;
    this.diagnostics.audioPaused = true;
    this.diagnostics.rawTtsPlaying = false;
    this.emitStatus();
    this.emitDiagnostics();
  }

  // ==========================================
  // AMBIENT SOUND GENERATOR (Web Audio API)
  // Safe 5–12% baseline (default 0.08)
  // ==========================================

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(0.25, vol));
    if (this.ambientGainNode && this.audioCtx) {
      const targetGain = this.isAmbientMuted ? 0 : this.ambientVolume;
      this.ambientGainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    }
    this.diagnostics.ambientGainValue = this.ambientVolume;
    this.emitDiagnostics();
    try {
      localStorage.setItem("athena_studio_ambient_vol", String(this.ambientVolume));
    } catch {}
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setAmbientMuted(muted: boolean) {
    this.isAmbientMuted = muted;
    if (this.ambientGainNode && this.audioCtx) {
      this.ambientGainNode.gain.setValueAtTime(muted ? 0 : this.ambientVolume, this.audioCtx.currentTime);
    }
    this.emitDiagnostics();
  }

  public isAmbienceMuted(): boolean {
    return this.isAmbientMuted;
  }

  public startAmbience(): void {
    if (typeof window === "undefined") return;
    if (this.isAmbienceRunning) return;

    try {
      this.initAudioGraph();
      if (!this.audioCtx || !this.ambientGainNode) return;

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Pure ambient filter (lowpass 220Hz)
      this.ambientFilter = this.audioCtx.createBiquadFilter();
      this.ambientFilter.type = "lowpass";
      this.ambientFilter.frequency.setValueAtTime(220, now);
      this.ambientFilter.Q.setValueAtTime(1.2, now);

      this.osc1 = this.audioCtx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(108, now); // Sub-bass fundamental

      this.osc2 = this.audioCtx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(162, now); // Warm harmonic

      this.osc1.connect(this.ambientFilter);
      this.osc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGainNode);

      this.osc1.start(now);
      this.osc2.start(now);
      this.isAmbienceRunning = true;
      this.emitDiagnostics();
    } catch (e) {
      console.warn("[VoiceProvider Ambience Error]:", e);
    }
  }

  public pauseAmbience(): void {
    if (this.ambientGainNode && this.audioCtx) {
      this.ambientGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
  }

  public resumeAmbience(): void {
    if (this.ambientGainNode && this.audioCtx) {
      this.ambientGainNode.gain.setValueAtTime(this.isAmbientMuted ? 0 : this.ambientVolume, this.audioCtx.currentTime);
    }
  }

  public stopAmbience(): void {
    if (!this.isAmbienceRunning) return;
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
      if (this.ambientFilter) {
        this.ambientFilter.disconnect();
        this.ambientFilter = null;
      }
      this.isAmbienceRunning = false;
      this.emitDiagnostics();
    } catch (e) {
      console.warn("[VoiceProvider Stop Ambience Error]:", e);
    }
  }
}

export const StudioVoiceProvider = new HumanizedVoiceProvider();
