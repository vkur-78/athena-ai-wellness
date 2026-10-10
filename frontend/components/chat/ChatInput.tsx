"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  CornerDownLeft,
  Mic,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Radio,
  Feather,
  Wind,
} from "lucide-react";
import { transcribeAudio } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface ChatInputProps {
  onSend: (text: string, audioUrl?: string) => void;
  loading?: boolean;
  disabled?: boolean;
  voiceMode?: boolean;
  onToggleVoiceMode?: () => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  onStartVoice?: () => void;
  onOpenCalmMode?: () => void;
}

type RecordingState = "idle" | "recording" | "review";

export default function ChatInput({
  onSend,
  loading,
  disabled,
  voiceMode = true,
  onToggleVoiceMode,
  isStreaming = false,
  onStopStreaming,
  onStartVoice,
  onOpenCalmMode,
}: ChatInputProps) {
  const { isLight } = useTheme();
  const [text, setText] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("athena_chat_draft") || "";
      } catch {
        return "";
      }
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (text) {
          localStorage.setItem("athena_chat_draft", text);
        } else {
          localStorage.removeItem("athena_chat_draft");
        }
      } catch {}
    }
  }, [text]);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioVolumeBars, setAudioVolumeBars] = useState<number[]>([20, 35, 15, 45, 25, 60, 30, 40, 20]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribingStatus, setTranscribingStatus] = useState("Transcribing spoken thoughts...");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Review state
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Parallel Web Speech backup for instant fallback transcription
  const recognitionRef = useRef<any>(null);
  const speechFallbackTextRef = useRef<string>("");

  // Auto-resize textarea on input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, [previewAudioUrl]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const startRecording = async () => {
    // Interrupt any active Athena voice speech immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("athena:stop-voice"));
    }
    onStartVoice?.();

    setVoiceError(null);
    audioChunksRef.current = [];
    speechFallbackTextRef.current = "";
    setRecordSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const updateVisualizer = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            const step = Math.floor(dataArray.length / 9) || 1;
            const newBars = Array.from({ length: 9 }, (_, i) => {
              const val = dataArray[i * step] || 0;
              return Math.max(15, Math.min(100, Math.floor((val / 255) * 100)));
            });
            setAudioVolumeBars(newBars);
          }
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();
      } catch (err) {
        console.warn("Audio visualizer fallback:", err);
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = "en-US";
          recognizer.onresult = (event: any) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + " ";
            }
            speechFallbackTextRef.current = transcript.trim();
          };
          recognizer.start();
          recognitionRef.current = recognizer;
        } catch (e) {
          console.warn("SpeechRecognition fallback couldn't start:", e);
        }
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone permission/access error:", err);
      setVoiceError("Unable to access microphone. Please allow mic permissions.");
      setRecordingState("idle");
    }
  };

  const cleanupAudioNodes = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanupAudioNodes();
    audioChunksRef.current = [];
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }
    setPreviewBlob(null);
    setPreviewText("");
    setRecordingState("idle");
  };

  const stopAndReview = () => {
    if (recordSeconds < 1) {
      setVoiceError("Recording was too short. Speak a bit longer.");
      cancelRecording();
      return;
    }

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    cleanupAudioNodes();

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewAudioUrl(url);
      setRecordingState("review");

      setIsTranscribing(true);
      setTranscribingStatus("Transcribing spoken thoughts...");
      try {
        let transcribed = "";
        try {
          transcribed = await transcribeAudio(blob);
        } catch {
          transcribed = speechFallbackTextRef.current;
        }

        const finalText = transcribed.trim() || speechFallbackTextRef.current.trim();
        setPreviewText(finalText);
      } catch {
        setPreviewText(speechFallbackTextRef.current.trim());
      } finally {
        setIsTranscribing(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const stopAndSendDirectly = () => {
    if (recordSeconds < 1) {
      setVoiceError("Voice recording was too brief. Please speak for at least 1-2 seconds.");
      cancelRecording();
      return;
    }

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    cleanupAudioNodes();
    setIsTranscribing(true);
    setTranscribingStatus("Finalizing voice note with Athena...");

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(blob);

      try {
        let transcribed = "";
        try {
          transcribed = await transcribeAudio(blob);
        } catch {
          transcribed = speechFallbackTextRef.current;
        }

        const finalText = transcribed.trim() || speechFallbackTextRef.current.trim();

        if (!finalText) {
          setVoiceError("Could not detect speech. Please try again or type your message.");
          setRecordingState("idle");
          setIsTranscribing(false);
          return;
        }

        onSend(finalText, audioUrl);
        setRecordingState("idle");
      } catch (err: any) {
        console.error("Transcription error:", err);
        setVoiceError("Unable to transcribe recording. Please try typing your message.");
        setRecordingState("idle");
      } finally {
        setIsTranscribing(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const sendFromReview = () => {
    const textToSend = previewText.trim() || speechFallbackTextRef.current.trim();
    if (!textToSend && !previewAudioUrl) {
      setVoiceError("No voice message content to send.");
      return;
    }

    onSend(textToSend || "Voice recording message", previewAudioUrl || undefined);
    setRecordingState("idle");
    setPreviewAudioUrl(null);
    setPreviewBlob(null);
    setPreviewText("");
  };

  const togglePreviewPlay = () => {
    if (!previewAudioUrl) return;
    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      return;
    }

    const audio = previewAudioRef.current || new Audio(previewAudioUrl);
    previewAudioRef.current = audio;
    audio.onended = () => setIsPreviewPlaying(false);
    audio.play().then(() => setIsPreviewPlaying(true)).catch(() => setIsPreviewPlaying(false));
  };

  const isSubmittingRef = useRef(false);

  function handleSend() {
    if (recordingState !== "idle") return;
    const trimmed = text.trim();
    if (!trimmed || loading || disabled || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    onSend(trimmed);
    setText("");
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("athena_chat_draft");
      } catch {}
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 400);
  }

  return (
    <footer
      className={`px-4 pt-2 pb-4 sm:px-6 transition-colors duration-250 ${
        isLight
          ? "bg-gradient-to-t from-[#F8F7F4]/95 via-[#F8F7F4]/70 to-transparent backdrop-blur-md"
          : "bg-gradient-to-t from-[#060814]/95 via-[#060814]/70 to-transparent backdrop-blur-md"
      }`}
    >
      <div className="max-w-[740px] mx-auto space-y-2">
        {/* Status Alerts & Transcribing Indicator */}
        {(isTranscribing || voiceError) && (
          <div className="flex items-center justify-between min-h-[20px] px-1">
            {isTranscribing && (
              <div
                className={`flex items-center gap-2 text-xs animate-pulse ${
                  isLight ? "text-stone-600" : "text-[#BFAEFF]"
                }`}
              >
                <Loader2 size={12} className="animate-spin" />
                <span>{transcribingStatus}</span>
              </div>
            )}

            {voiceError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle size={13} />
                <span>{voiceError}</span>
              </div>
            )}
          </div>
        )}

        {/* 1. ACTIVE VOICE RECORDING BAR */}
        {recordingState === "recording" && (
          <div
            className={`rounded-3xl border p-3.5 shadow-lg transition-all duration-200 animate-in fade-in zoom-in-95 ${
              isLight
                ? "bg-[#fdfbf7] border-amber-300/80 text-stone-800"
                : "sanctuary-glass border-[#7C5CFF]/40 text-[#F8F7FF] shadow-[0_0_24px_rgba(124,92,255,0.2)]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Recording Status & Timer */}
              <div className="flex items-center gap-3">
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-2xl border ${
                    isLight
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-[#7C5CFF]/20 border-[#7C5CFF]/40 text-[#BFAEFF]"
                  }`}
                >
                  <Radio size={18} className="animate-pulse" />
                  <span
                    className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full animate-ping ${
                      isLight ? "bg-amber-500" : "bg-[#7C5CFF]"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isLight ? "text-stone-700" : "text-[#F8F7FF]"
                      }`}
                    >
                      Listening
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-mono font-medium ${
                        isLight
                          ? "bg-stone-200 text-stone-800"
                          : "bg-[#0B1228] text-[#BFAEFF] border border-[#7C5CFF]/30"
                      }`}
                    >
                      {formatTime(recordSeconds)}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isLight ? "text-stone-500" : "text-[#B8BDD6]"
                    }`}
                  >
                    Speak whatever is present right now.
                  </p>
                </div>
              </div>

              {/* Live Audio Visualizer Bars */}
              <div
                className={`hidden sm:flex items-center gap-1 h-6 px-3 rounded-2xl border ${
                  isLight
                    ? "bg-[#f2eee6] border-[#e7e5e4]"
                    : "bg-[#0B1228]/80 border-[#7C5CFF]/20"
                }`}
              >
                {audioVolumeBars.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isLight ? "bg-stone-500" : "bg-[#7C5CFF]"
                    }`}
                  />
                ))}
              </div>

              {/* Controls: Discard, Stop & Review, Stop & Send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                    isLight
                      ? "border-stone-200 bg-stone-100 text-stone-500 hover:text-red-700 hover:bg-stone-200"
                      : "border-[#7C5CFF]/20 bg-[#0B1228]/60 text-[#B8BDD6] hover:text-rose-400 hover:bg-rose-500/10"
                  }`}
                  title="Discard recording"
                >
                  <Trash2 size={14} />
                </button>

                <button
                  type="button"
                  onClick={stopAndReview}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    isLight
                      ? "border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200"
                      : "border-[#7C5CFF]/30 bg-[#0B1228] text-[#F8F7FF] hover:bg-[#7C5CFF]/20"
                  }`}
                  title="Review voice recording before sending"
                >
                  <Square size={12} />
                  <span className="hidden sm:inline">Review</span>
                </button>

                <button
                  type="button"
                  onClick={stopAndSendDirectly}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer active:scale-95 ${
                    isLight
                      ? "bg-stone-800 hover:bg-stone-900"
                      : "bg-[#7C5CFF] hover:bg-[#6b4bf0] shadow-[0_0_16px_rgba(124,92,255,0.4)]"
                  }`}
                  title="Send voice note to Athena"
                >
                  <Send size={13} />
                  <span>Send Voice</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. REVIEW RECORDING BAR */}
        {recordingState === "review" && (
          <div
            className={`rounded-3xl border p-3.5 shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-200 ${
              isLight
                ? "bg-[#fdfbf7] border-[#e7e5e4] text-stone-800"
                : "sanctuary-glass border-[#7C5CFF]/30 text-[#F8F7FF]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-2 text-xs font-semibold ${
                  isLight ? "text-stone-800" : "text-[#BFAEFF]"
                }`}
              >
                <Volume2 size={15} />
                <span>Recorded Voice ({formatTime(recordSeconds)})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs transition cursor-pointer ${
                    isLight
                      ? "text-stone-500 hover:text-red-700 hover:bg-stone-100"
                      : "text-[#B8BDD6] hover:text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  <Trash2 size={13} />
                  <span>Discard</span>
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs transition cursor-pointer ${
                    isLight
                      ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      : "text-[#B8BDD6] hover:text-[#F8F7FF] hover:bg-[#7C5CFF]/15"
                  }`}
                >
                  <RotateCcw size={13} />
                  <span>Re-record</span>
                </button>
              </div>
            </div>

            {/* Audio Preview & Editable Transcription */}
            <div
              className={`flex items-center gap-3 border rounded-2xl p-2.5 ${
                isLight
                  ? "bg-[#f8f6f0] border-[#e7e5e4]"
                  : "bg-[#060814]/70 border-[#7C5CFF]/20"
              }`}
            >
              <button
                type="button"
                onClick={togglePreviewPlay}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition cursor-pointer ${
                  isLight
                    ? "bg-stone-800 text-white"
                    : "bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                }`}
                title={isPreviewPlaying ? "Pause preview" : "Listen to recording"}
              >
                {isPreviewPlaying ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} className="translate-x-[1px]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-[11px] mb-0.5 ${
                    isLight ? "text-stone-500" : "text-[#B8BDD6]"
                  }`}
                >
                  Transcribed thought:
                </p>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder={
                    isTranscribing ? "Transcribing speech..." : "Transcribed text"
                  }
                  className={`w-full bg-transparent text-xs sm:text-sm outline-none ${
                    isLight
                      ? "text-stone-900 placeholder-stone-400"
                      : "text-[#F8F7FF] placeholder-[#B8BDD6]/50"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={sendFromReview}
                disabled={loading || isTranscribing}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? "bg-stone-800 hover:bg-stone-900 text-white"
                    : "bg-[#7C5CFF] hover:bg-[#6b4bf0] text-white shadow-[0_0_16px_rgba(124,92,255,0.4)]"
                }`}
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. NORMAL TEXT INPUT BAR — Floating sanctuary glass composer */}
        {recordingState === "idle" && (
          <div
            className={`relative flex items-end gap-2.5 rounded-[26px] border p-2 sm:p-2.5 transition-all duration-200 shadow-md ${
              isLight
                ? "bg-[#FFFFFF] border-[rgba(24,24,27,0.1)] focus-within:border-[#7C5CFF] focus-within:shadow-[0_0_20px_rgba(124,92,255,0.15)]"
                : "sanctuary-glass border-[#7C5CFF]/25 focus-within:border-[#7C5CFF]/60 focus-within:shadow-[0_0_24px_rgba(124,92,255,0.22)]"
            }`}
          >
            <textarea
              id="chat-message-input"
              ref={textareaRef}
              rows={1}
              value={text}
              enterKeyHint="send"
              onChange={(e) => setText(e.target.value)}
              disabled={loading || disabled || isTranscribing}
              placeholder={
                disabled
                  ? "Athena demo limit reached (3/3 prompts used). Create your account to continue."
                  : loading
                  ? "Athena is reflecting on your message..."
                  : "Share whatever feels present right now..."
              }
              className={`flex-1 resize-none bg-transparent px-3 py-2 text-sm sm:text-base outline-none leading-relaxed disabled:opacity-60 font-sans ${
                isLight
                  ? "text-stone-900 placeholder-stone-400"
                  : "text-[#F8F7FF] placeholder-[#B8BDD6]/50"
              }`}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.keyCode === 13) && !e.shiftKey) {
                  if (e.nativeEvent?.isComposing) return;
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Record Voice Mic Button with floating pill style */}
            <button
              type="button"
              onClick={startRecording}
              disabled={loading || disabled || isTranscribing}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer ${
                isLight
                  ? "border-stone-200 bg-stone-100/80 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                  : "border-[#7C5CFF]/20 bg-[#0B1228]/80 text-[#BFAEFF] hover:text-[#F8F7FF] hover:border-[#7C5CFF]/45 hover:bg-[#7C5CFF]/20"
              }`}
              title="Record spoken thoughts"
              aria-label="Record voice"
            >
              <Mic size={16} />
            </button>

            {/* Send / Stop Button */}
            {isStreaming && onStopStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-sm ${
                  isLight
                    ? "bg-stone-800 hover:bg-stone-900 text-white"
                    : "bg-[#7C5CFF] hover:bg-[#6b4bf0] text-white shadow-[0_0_16px_rgba(124,92,255,0.4)]"
                }`}
                title="Pause Athena"
                aria-label="Pause Athena"
              >
                <Square size={13} className="fill-current" />
              </button>
            ) : (
              <button
                id="send-message-button"
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || loading || disabled || isTranscribing}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isLight
                    ? "bg-stone-800 hover:bg-stone-900 text-white shadow-sm"
                    : "bg-[#7C5CFF] hover:bg-[#6b4bf0] text-white shadow-[0_0_18px_rgba(124,92,255,0.45)] border border-[#7C5CFF]/40"
                }`}
                title="Send message"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : (
                  <Send size={15} className="translate-x-[-0.5px] translate-y-[0.5px]" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Footer: Confidentiality & Quiet Response Mode toggle */}
        <div
          className={`flex items-center justify-between px-2 pt-0.5 text-[11px] ${
            isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
              <span>Private &amp; Confidential</span>
            </p>

            {/* Response Mode: Text & Voice vs Text Only Toggle */}
            {onToggleVoiceMode && (
              <button
                type="button"
                onClick={onToggleVoiceMode}
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-medium transition-colors duration-150 cursor-pointer ${
                  voiceMode
                    ? isLight
                      ? "border-stone-300 bg-stone-100 text-stone-700"
                      : "border-[#7C5CFF]/40 bg-[#7C5CFF]/15 text-[#BFAEFF]"
                    : isLight
                    ? "border-transparent text-stone-400 hover:text-stone-600"
                    : "border-transparent text-[#B8BDD6]/50 hover:text-[#B8BDD6]"
                }`}
                title="Toggle whether Athena replies with automatic spoken voice"
              >
                {voiceMode ? <Volume2 size={10} /> : <VolumeX size={10} />}
                <span>{voiceMode ? "Voice & Text" : "Text Only"}</span>
              </button>
            )}

          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] opacity-75">
            <CornerDownLeft size={9} /> Enter to send
          </span>
        </div>
      </div>
    </footer>
  );
}