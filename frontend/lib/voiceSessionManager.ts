/**
 * Central Voice Session Manager & Single Voice Controller
 *
 * Single authority for all audio playback and speech synthesis in Athena Studio.
 * Enforces a strict state machine to eliminate dual voice playback (male + female echoing):
 * - States: idle, loading, playing-openai, playing-browser, paused, stopped
 * - Priority: OpenAI TTS (Nova) is strictly primary; browser SpeechSynthesis is strictly fallback.
 * - Deduplication: Locks instruction by unique instructionId to prevent duplicate playback.
 * - Parallel execution is impossible: never allows browser speech while OpenAI audio is loading or playing.
 */

import { synthesizeSpeech } from "./api";

export type VoiceState =
  | "idle"
  | "loading"
  | "playing-openai"
  | "playing-browser"
  | "paused"
  | "stopped";

export interface SpeakInstructionOptions {
  sessionId: string;
  instructionId: string;
  text: string;
  voiceStyle?: string;
  speed?: number;
  onStart?: (source: "openai" | "browser") => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export type SpeakingStateListener = (isSpeaking: boolean, instructionId: string | null) => void;

class VoiceSessionManager {
  private currentSessionId: string | null = null;
  private currentInstructionId: string | null = null;
  private state: VoiceState = "idle";

  private activeAudio: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private timers: Set<NodeJS.Timeout | number> = new Set();
  private abortController: AbortController | null = null;
  private cleanups: Set<() => void> = new Set();
  private isSessionActive: boolean = false;
  private isSessionPaused: boolean = false;
  private speakingListeners: Set<SpeakingStateListener> = new Set();

  public onSpeakingChange(listener: SpeakingStateListener): () => void {
    this.speakingListeners.add(listener);
    listener(this.isSpeaking(), this.currentInstructionId);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  public isSpeaking(): boolean {
    return this.state === "playing-openai" || this.state === "playing-browser";
  }

  private notifySpeakingState(isSpeaking: boolean): void {
    this.speakingListeners.forEach((l) => {
      try {
        l(isSpeaking, this.currentInstructionId);
      } catch (err) {
        console.warn("[VoiceManager] speakingListener error:", err);
      }
    });
  }

  /**
   * Starts a new guided session.
   * Immediately stops and destroys any previous session to ensure single-session isolation.
   */
  public startSession(sessionId: string): string {
    // Kill any existing session
    this.stopAll();

    this.currentSessionId = sessionId;
    this.currentInstructionId = null;
    this.isSessionActive = true;
    this.isSessionPaused = false;
    this.state = "idle";
    this.abortController = new AbortController();

    return sessionId;
  }

  /**
   * Stops the specified session if it matches the current active session.
   */
  public stopSession(sessionId?: string): void {
    if (!sessionId || sessionId === this.currentSessionId) {
      this.stopAll();
    }
  }

  /**
   * Primary Entry Point: Speaks an instruction with guaranteed single-voice fidelity.
   * OpenAI TTS is primary. Browser SpeechSynthesis is fallback only.
   */
  public async speakInstruction(options: SpeakInstructionOptions): Promise<void> {
    // 1. Lock Check: If already loading or playing this exact instruction, ignore duplicate call
    if (
      this.currentInstructionId === options.instructionId &&
      (this.state === "loading" || this.state === "playing-openai" || this.state === "playing-browser")
    ) {
      return;
    }

    // 2. Session Validity Check
    if (!this.isCurrentSession(options.sessionId)) {
      return;
    }

    // 3. Stop all previous audio/speech before beginning new instruction
    this.stopAllAudioAndSpeech();
    this.clearQueue();

    this.currentInstructionId = options.instructionId;
    this.state = "loading";

    // 4. Primary Attempt: OpenAI TTS
    let audioUrl = "";
    try {
      audioUrl = await synthesizeSpeech(
        options.text,
        options.voiceStyle || "nova",
        undefined,
        options.speed || 0.96,
        this.getAbortSignal()
      );
    } catch (err) {
      console.warn("[VoiceManager] OpenAI TTS request failed:", err);
    }

    // Post-await validity guard: Verify session hasn't changed or stopped while waiting for TTS
    if (
      !this.isCurrentSession(options.sessionId) ||
      this.currentInstructionId !== options.instructionId ||
      !this.isSessionActive ||
      (this.state as VoiceState) === "stopped"
    ) {
      return;
    }

    // 5. If OpenAI succeeded and returned an audio URL, play it
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = options.speed || 0.96;
      this.activeAudio = audio;
      this.state = "playing-openai";

      audio.onended = () => {
        if (
          this.currentInstructionId === options.instructionId &&
          this.state === "playing-openai"
        ) {
          this.state = "idle";
          this.activeAudio = null;
          this.notifySpeakingState(false);
          options.onEnd?.();
        }
      };

      audio.onerror = () => {
        // Fallback to browser only if this instruction is still valid and not playing
        if (
          this.isCurrentSession(options.sessionId) &&
          this.currentInstructionId === options.instructionId &&
          this.state === "playing-openai"
        ) {
          this.activeAudio = null;
          this.playBrowserFallback(options);
        }
      };

      try {
        await audio.play();
        this.notifySpeakingState(true);
        options.onStart?.("openai");
        return;
      } catch (playErr) {
        console.warn("[VoiceManager] audio.play() blocked/failed, attempting browser fallback:", playErr);
        this.activeAudio = null;
      }
    }

    // 6. Secondary Fallback: Browser SpeechSynthesis (ONLY if OpenAI failed/blocked AND not playing OpenAI)
    if (
      this.isCurrentSession(options.sessionId) &&
      this.currentInstructionId === options.instructionId &&
      this.isSessionActive &&
      (this.state as VoiceState) !== "stopped" &&
      !this.isPlayingOpenAI()
    ) {
      this.playBrowserFallback(options);
    }
  }

  /**
   * Browser SpeechSynthesis fallback with female calm voice preference.
   */
  private playBrowserFallback(options: SpeakInstructionOptions): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.state = "idle";
      const timer = setTimeout(() => {
        if (this.currentInstructionId === options.instructionId) {
          options.onEnd?.();
        }
      }, 2000);
      this.registerTimer(timer);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.rate = (options.speed || 0.96) * 0.88;
      utterance.pitch = 0.95;

      // Select calming female voice across Windows (Zira, Jenny, Aria) and Mac/Chrome (Samantha, Google US)
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          name.includes("zira") ||
          name.includes("jenny") ||
          name.includes("aria") ||
          name.includes("samantha") ||
          name.includes("serena") ||
          name.includes("victoria") ||
          name.includes("karen") ||
          name.includes("natural") ||
          name.includes("female")
        );
      });
      if (preferred) utterance.voice = preferred;

      this.activeUtterance = utterance;
      this.state = "playing-browser";

      utterance.onstart = () => {
        this.notifySpeakingState(true);
        options.onStart?.("browser");
      };

      utterance.onend = () => {
        if (
          this.currentInstructionId === options.instructionId &&
          this.state === "playing-browser"
        ) {
          this.state = "idle";
          this.activeUtterance = null;
          this.notifySpeakingState(false);
          options.onEnd?.();
        }
      };

      utterance.onerror = () => {
        if (
          this.currentInstructionId === options.instructionId &&
          this.state === "playing-browser"
        ) {
          this.state = "idle";
          this.activeUtterance = null;
          this.notifySpeakingState(false);
          options.onEnd?.();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[VoiceManager] SpeechSynthesis fallback error:", err);
      this.state = "idle";
      this.notifySpeakingState(false);
      options.onEnd?.();
    }
  }

  /**
   * Stops active audio element and browser speech synthesis immediately.
   */
  private stopAllAudioAndSpeech(): void {
    if (this.isSpeaking()) {
      this.notifySpeakingState(false);
    }
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio.onended = null;
        this.activeAudio.onerror = null;
        this.activeAudio.removeAttribute("src");
        this.activeAudio.src = "";
        this.activeAudio.load();
      } catch {}
      this.activeAudio = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
  }

  /**
   * The Global Kill Switch.
   * Immediately terminates all audio, cancels speech synthesis, aborts HTTP requests,
   * clears timers, executes cleanups, and resets session state.
   */
  public stopAll(): void {
    this.isSessionActive = false;
    this.isSessionPaused = false;
    this.currentSessionId = null;
    this.currentInstructionId = null;
    this.state = "stopped";

    // 1. Abort in-flight network requests (e.g. OpenAI TTS fetch)
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {}
      this.abortController = null;
    }

    // 2. Cancel and destroy active Audio & Speech
    this.stopAllAudioAndSpeech();

    // 3. Clear all registered timers and intervals
    this.timers.forEach((t) => {
      try {
        clearTimeout(t as any);
        clearInterval(t as any);
      } catch {}
    });
    this.timers.clear();

    // 4. Execute custom cleanups (e.g. Web Audio synthesizers)
    this.cleanups.forEach((cleanupFn) => {
      try {
        cleanupFn();
      } catch {}
    });
    this.cleanups.clear();

    // 5. Broadcast event for chat and audio players
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("athena:stop-voice"));
      } catch {}
    }
  }

  /**
   * Pauses active audio and speech synthesis.
   */
  public pause(): void {
    if (!this.isSessionActive) return;
    this.isSessionPaused = true;
    this.state = "paused";

    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
      } catch {}
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  }

  /**
   * Resumes paused audio or speech synthesis.
   */
  public resume(): void {
    if (!this.isSessionActive) return;
    this.isSessionPaused = false;

    if (this.activeAudio && this.activeAudio.src) {
      try {
        this.state = "playing-openai";
        this.activeAudio.play().catch(() => {});
      } catch {}
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        this.state = "playing-browser";
        window.speechSynthesis.resume();
      } catch {}
    } else {
      this.state = "idle";
    }
  }

  /**
   * Clears all queued timers without resetting the session identifier.
   */
  public clearQueue(): void {
    this.timers.forEach((t) => {
      try {
        clearTimeout(t as any);
        clearInterval(t as any);
      } catch {}
    });
    this.timers.clear();
  }

  /**
   * State Checkers
   */
  public getState(): VoiceState {
    return this.state;
  }

  public isPlayingOpenAI(): boolean {
    return this.state === "playing-openai";
  }

  public isPlayingBrowser(): boolean {
    return this.state === "playing-browser";
  }

  public isPlaying(): boolean {
    return (
      (this.state === "playing-openai" || this.state === "playing-browser") &&
      !this.isSessionPaused
    );
  }

  public isCurrentSession(sessionId: string): boolean {
    return this.isSessionActive && this.currentSessionId === sessionId;
  }

  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public getCurrentInstructionId(): string | null {
    return this.currentInstructionId;
  }

  public getAbortSignal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }

  public registerAudio(audio: HTMLAudioElement, sessionId?: string): boolean {
    if (sessionId && !this.isCurrentSession(sessionId)) {
      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.src = "";
        audio.load();
      } catch {}
      return false;
    }

    if (this.activeAudio && this.activeAudio !== audio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.removeAttribute("src");
        this.activeAudio.src = "";
        this.activeAudio.load();
      } catch {}
    }

    this.activeAudio = audio;
    return true;
  }

  public registerUtterance(utterance: SpeechSynthesisUtterance, sessionId?: string): boolean {
    if (sessionId && !this.isCurrentSession(sessionId)) {
      return false;
    }
    this.activeUtterance = utterance;
    return true;
  }

  public registerTimer(timer: NodeJS.Timeout | number): NodeJS.Timeout | number {
    this.timers.add(timer);
    return timer;
  }

  public clearTimer(timer: NodeJS.Timeout | number): void {
    this.timers.delete(timer);
    try {
      clearTimeout(timer as any);
      clearInterval(timer as any);
    } catch {}
  }

  public registerCleanup(cleanupFn: () => void): () => void {
    this.cleanups.add(cleanupFn);
    return () => {
      this.cleanups.delete(cleanupFn);
    };
  }
}

export const voiceSessionManager = new VoiceSessionManager();
