/**
 * Athena Studio — Speech Service Client & Provider Abstraction
 *
 * Requirements:
 * 1. Clean internal interface:
 *    generateSpeech({ text, language, locale, voice, model, speed, provider })
 * 2. Swappable architecture:
 *    Studio -> SpeechService -> Provider Adapter -> TTS Provider
 * 3. Studio does not care which provider generates audio.
 * 4. Raw direct playback (no Web Audio, no reverb, no filters, no ambient mix).
 * 5. Frozen baseline comparison retention.
 */

import {
  STUDIO_VOICE_BASELINE,
  CANDIDATE_VOICE_ALTERNATIVES,
  NATIVE_EVALUATION_SCRIPTS,
  StudioVoiceLanguage,
  VoiceCandidate,
} from "./pronunciation";

export interface GenerateSpeechOptions {
  text: string;
  language: StudioVoiceLanguage;
  locale?: string;
  voice?: string;
  model?: string;
  speed?: number;
  pitch?: string;
  provider?: string;
  signal?: AbortSignal;
}

export interface SynthesizedSpeechResult {
  audioUrl: string;
  audioBlob: Blob;
  provider: string;
  model: string;
  voiceId: string;
  language: string;
  locale: string;
  speed: number;
  durationEstimateSeconds: number;
  sizeBytes: number;
}

export interface TTSProviderInfo {
  id: string;
  name: string;
  models: string[];
  is_configured: boolean;
}

class SpeechServiceClient {
  private activeRawAudio: HTMLAudioElement | null = null;
  private cache: Map<string, SynthesizedSpeechResult> = new Map();

  /**
   * Universal internal speech generation interface
   */
  public async generateSpeech(
    options: GenerateSpeechOptions
  ): Promise<SynthesizedSpeechResult> {
    const {
      text,
      language,
      locale,
      voice,
      model,
      speed,
      pitch = "+0Hz",
      provider = "auto",
      signal,
    } = options;

    const cacheKey = `${provider}:${model || "def"}:${voice || "def"}:${speed || "def"}:${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    const endpoint = `${apiUrl.replace(/\/+$/, "")}/voice/speak`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language,
        locale,
        voice,
        model,
        speed,
        pitch,
        provider,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Speech synthesis failed: HTTP ${response.status} (${response.statusText})`);
    }

    const respProvider = response.headers.get("X-Voice-Provider") || provider;
    const respModel = response.headers.get("X-Voice-Model") || model || "default";
    const respVoiceId = response.headers.get("X-Voice-Id") || voice || "default";
    const respLocale = response.headers.get("X-Voice-Locale") || locale || "en-IN";
    const respSpeed = parseFloat(response.headers.get("X-Voice-Speed") || String(speed || 1.0));

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);

    const result: SynthesizedSpeechResult = {
      audioUrl,
      audioBlob: blob,
      provider: respProvider,
      model: respModel,
      voiceId: respVoiceId,
      language,
      locale: respLocale,
      speed: respSpeed,
      durationEstimateSeconds: Math.max(1, Math.round(text.length / 14)),
      sizeBytes: blob.size,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Requirement 2: Play raw generated file directly
   * Absolutely NO Athena audio effects, NO ambient mixing, NO Web Audio filters/reverb.
   */
  public playRawAudio(
    audioSource: string | Blob,
    onEnded?: () => void,
    onError?: (err: any) => void
  ): HTMLAudioElement {
    this.stopRawAudio();

    const url = typeof audioSource === "string" ? audioSource : URL.createObjectURL(audioSource);
    const audio = new Audio();
    audio.src = url;
    audio.preload = "auto";
    audio.volume = 1.0;

    audio.onended = () => {
      this.activeRawAudio = null;
      onEnded?.();
    };

    audio.onerror = (e) => {
      this.activeRawAudio = null;
      onError?.(e);
    };

    this.activeRawAudio = audio;
    audio.play().catch((err) => {
      console.warn("[SpeechService] Raw audio autoplay blocked or interrupted:", err);
      onError?.(err);
    });

    return audio;
  }

  /**
   * Stop any active raw playback
   */
  public stopRawAudio(): void {
    if (this.activeRawAudio) {
      try {
        this.activeRawAudio.pause();
        this.activeRawAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.activeRawAudio = null;
    }
  }

  /**
   * Returns current raw playing state
   */
  public isRawAudioPlaying(): boolean {
    return Boolean(this.activeRawAudio && !this.activeRawAudio.paused);
  }

  /**
   * Access frozen baseline
   */
  public getBaseline() {
    return STUDIO_VOICE_BASELINE;
  }

  /**
   * Access candidate alternatives
   */
  public getCandidates(lang: StudioVoiceLanguage) {
    return CANDIDATE_VOICE_ALTERNATIVES[lang] || CANDIDATE_VOICE_ALTERNATIVES.en;
  }

  /**
   * Access native authentic script for language
   */
  public getNativeScript(lang: StudioVoiceLanguage): string {
    return NATIVE_EVALUATION_SCRIPTS[lang] || NATIVE_EVALUATION_SCRIPTS.en;
  }
}

export const speechService = new SpeechServiceClient();
