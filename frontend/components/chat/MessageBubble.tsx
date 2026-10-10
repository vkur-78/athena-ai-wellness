"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Heart,
  PhoneCall,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  Feather,
} from "lucide-react";
import { Message } from "@/types/chat";
import AudioPlayer from "./AudioPlayer";
import { synthesizeSpeech } from "@/lib/api";

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  onToggleLike?: (messageId: string) => void;
}

// Sanctuary therapy paragraph renderer with comfortable pacing & line-height 1.8
function renderSanctuaryContent(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${keyPrefix}`}
          className="my-3 ml-4 list-disc space-y-1.5 text-inherit"
        >
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line creates breathing room
    if (!trimmed) {
      flushList(`flush-${idx}`);
      return;
    }

    // Bullet points: -, *, •
    const bulletMatch = line.match(/^\s*([*•\-]|(\+))\s+(.*)$/);
    if (bulletMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${idx}`} className="leading-[1.8] text-inherit">
          {renderInlineSanctuary(bulletMatch[3])}
        </li>
      );
      return;
    }

    // Numbered list
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushList(`flush-num-${idx}`);
      elements.push(
        <div
          key={`num-${idx}`}
          className="my-2 flex items-start gap-2 text-inherit"
        >
          <span className="font-semibold text-[#7C5CFF] dark:text-[#BFAEFF] shrink-0">
            {numberedMatch[1]}.
          </span>
          <span className="leading-[1.8]">
            {renderInlineSanctuary(numberedMatch[2])}
          </span>
        </div>
      );
      return;
    }

    // Standard paragraph with generous line-height and paragraph spacing
    flushList(`flush-p-${idx}`);
    elements.push(
      <p key={`p-${idx}`} className="leading-[1.8] my-3 text-inherit">
        {renderInlineSanctuary(line)}
      </p>
    );
  });

  flushList("final");
  return elements;
}

function renderInlineSanctuary(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong
          key={`b-${match.index}`}
          className="font-semibold text-inherit"
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em
          key={`i-${match.index}`}
          className="italic font-hero-serif text-[#7C5CFF] dark:text-[#BFAEFF]"
        >
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

function MessageBubbleComponent({
  message,
  onRetry,
  onSelectSuggestion,
  onToggleLike,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(message.liked || false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === "user";
  const isVoiceMessage = message.isVoiceMessage || Boolean(message.audioUrl);
  const isCrisis = message.metadata?.risk === "crisis";

  // Remembered playback rate from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("athena_playback_rate");
      if (savedRate) {
        const parsed = parseFloat(savedRate);
        if (!isNaN(parsed) && parsed > 0) {
          setPlaybackRate(parsed);
        }
      }
    }
  }, []);

  // Listen for voice interruption signal from ChatInput or other players
  useEffect(() => {
    const handleStopVoice = () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setIsPlayingVoice(false);
    };

    window.addEventListener("athena:stop-voice", handleStopVoice);
    return () => {
      window.removeEventListener("athena:stop-voice", handleStopVoice);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  // Sync liked state with prop
  useEffect(() => {
    if (message.liked !== undefined) {
      setLiked(message.liked);
    }
  }, [message.liked]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleToggleLike = () => {
    setLiked((prev) => !prev);
    onToggleLike?.(message.id);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (typeof window !== "undefined") {
      localStorage.setItem("athena_playback_rate", String(nextRate));
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.playbackRate = nextRate;
    }
  };

  const handleToggleVoice = async () => {
    if (isPlayingVoice) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingVoice(false);
      return;
    }

    window.dispatchEvent(new CustomEvent("athena:stop-voice"));

    const registerAudio = (audio: HTMLAudioElement) => {
      activeAudioRef.current = audio;
      audio.playbackRate = playbackRate;
      audio.onended = () => {
        setIsPlayingVoice(false);
        activeAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingVoice(false);
        activeAudioRef.current = null;
      };
      setIsPlayingVoice(true);
    };

    const fallbackSpeech = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const cleanText = message.content.replace(/[*#_~`>]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = playbackRate;
        utterance.onstart = () => setIsPlayingVoice(true);
        utterance.onend = () => setIsPlayingVoice(false);
        utterance.onerror = () => setIsPlayingVoice(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingVoice(false);
      }
    };

    if (message.audioUrl) {
      try {
        const audio = new Audio(message.audioUrl);
        registerAudio(audio);
        await audio.play();
        return;
      } catch (playErr) {
        console.warn("Direct audio playback failed, falling back to speech synthesis:", playErr);
        fallbackSpeech();
        return;
      }
    }

    setIsVoiceLoading(true);
    try {
      const url = await synthesizeSpeech(message.content);
      setIsVoiceLoading(false);
      const audio = new Audio(url);
      registerAudio(audio);
      await audio.play();
    } catch (e) {
      console.warn("Backend TTS failed, using browser speech synthesis:", e);
      setIsVoiceLoading(false);
      fallbackSpeech();
    }
  };

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group flex flex-col gap-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      {/* Simplified Sender Header: Athena • [time] */}
      <div className="flex items-center gap-2 px-1 text-xs font-sans text-[var(--text-muted)]">
        {!isUser ? (
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#7C5CFF] to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(124,92,255,0.3)]">
              <Feather size={10} />
            </div>
            <span>Athena</span>
          </div>
        ) : isVoiceMessage ? (
          <span className="flex items-center gap-1 font-medium text-[#7C5CFF] dark:text-[#BFAEFF]">
            <Mic size={12} />
            <span>Spoken Voice</span>
          </span>
        ) : null}

        <span suppressHydrationWarning className="text-[11px] opacity-75">
          {formattedTime}
        </span>

        {/* Emotion Badge if present */}
        {message.metadata?.emotion && message.metadata.emotion !== "neutral" && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize flex items-center gap-1 border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 text-[#7C5CFF] dark:text-[#BFAEFF]">
            <Heart size={9} className="opacity-70" />
            {message.metadata.emotion}
          </span>
        )}
      </div>

      {/* Main Bubble: Compact & Elegant for user, Conversational for Athena */}
      <div
        className={`relative text-sm sm:text-[15px] leading-[1.8] transition-all ${
          isUser
            ? "max-w-[560px] sanctuary-user-bubble px-4.5 py-3 sm:px-5 sm:py-3.5"
            : message.isError
            ? "max-w-[700px] rounded-2xl border border-red-900/40 bg-red-950/20 text-red-200 p-6 sm:p-7"
            : isCrisis
            ? "max-w-[700px] rounded-2xl border border-amber-500/30 bg-[#16131c] text-[#F8F7FF] p-6 sm:p-7 shadow-xs"
            : "max-w-[700px] sanctuary-therapist-bubble p-6 sm:p-7"
        }`}
      >
        {/* User Voice Audio Player */}
        {isUser && message.audioUrl && (
          <div className="mb-3">
            <AudioPlayer
              src={message.audioUrl}
              title="Your Recorded Voice"
              variant="user"
            />
          </div>
        )}

        {/* Text Content in printed letter pacing */}
        <div className="font-normal font-sans text-sm sm:text-[15px] leading-[1.8] space-y-2">
          {renderSanctuaryContent(message.content)}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 translate-y-[2px] rounded-full bg-[#7C5CFF] animate-pulse" />
          )}
        </div>

        {/* Crisis Safety Intervention Card */}
        {isCrisis && (
          <div className="mt-4 rounded-2xl border border-rose-500/35 bg-gradient-to-b from-rose-950/30 to-[#0B1228]/95 p-4 sm:p-5 space-y-3.5 text-zinc-100 shadow-xl shadow-rose-950/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 uppercase tracking-wider">
              <AlertTriangle size={15} className="text-rose-400" />
              <span>Immediate Support & Emergency Resources Available 24/7</span>
            </div>

            <p className="text-xs text-[#B8BDD6] leading-relaxed">
              I'm really glad you told me. You don't have to handle this alone. Please connect with human care right now:
            </p>

            {/* Emergency & Helpline Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* 112 Emergency */}
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-md shadow-rose-700/20"
              >
                <PhoneCall size={14} />
                Call 112 (Emergency - India)
              </a>

              {/* Tele-MANAS */}
              <a
                href="tel:14416"
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-md shadow-indigo-700/20"
              >
                <PhoneCall size={14} />
                Tele-MANAS: 14416 (24/7 Free)
              </a>

              {/* 988 Lifeline */}
              <a
                href="tel:988"
                className="flex items-center justify-center gap-2 rounded-xl py-2 px-3 font-medium border border-white/20 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
              >
                <PhoneCall size={13} />
                Call / Text 988 (Lifeline US/CA)
              </a>

              {/* Crisis Text Line */}
              <a
                href="sms:741741?body=HOME"
                className="flex items-center justify-center gap-2 rounded-xl py-2 px-3 font-medium border border-white/20 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
              >
                Text HOME to 741741
              </a>
            </div>

            {/* Permission-Based Nearby Care Action */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const url = `https://www.google.com/maps/search/hospital+or+emergency+near+me/@${pos.coords.latitude},${pos.coords.longitude},14z`;
                        window.open(url, "_blank");
                      },
                      () => {
                        alert("Location permission was denied. You can still call 112 or Tele-MANAS at 14416 anytime.");
                      }
                    );
                  } else {
                    window.open("https://www.google.com/maps/search/hospital+emergency+near+me", "_blank");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/15 text-[#BFAEFF] hover:text-white transition-colors cursor-pointer"
              >
                <span>Find nearby emergency help (requires location)</span>
              </button>

              <span className="text-[#B8BDD6]/70 italic">
                Athena remains right here with you.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons as floating pills with unified spacing & styling */}
        {!isUser && !message.isError && !message.isStreaming && (
          <div className="mt-5 flex items-center justify-between border-t border-[#7C5CFF]/15 pt-3.5 text-xs">
            <div className="flex items-center gap-2">
              {/* Voice Listen Pill */}
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isVoiceLoading}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer border ${
                  isPlayingVoice
                    ? "bg-[#7C5CFF] border-[#7C5CFF] text-[#F8F7FF] shadow-[0_0_12px_rgba(124,92,255,0.4)]"
                    : "border-[#7C5CFF]/25 bg-[#7C5CFF]/15 text-[#BFAEFF] hover:bg-[#7C5CFF]/25 hover:text-[#F8F7FF]"
                }`}
                title={isPlayingVoice ? "Stop voice audio" : "Listen to Athena speaking"}
              >
                {isVoiceLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : isPlayingVoice ? (
                  <>
                    <VolumeX size={12} className="animate-pulse" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={12} />
                    <span>Listen</span>
                  </>
                )}
              </button>

              {/* Playback speed pill */}
              <button
                type="button"
                onClick={cycleSpeed}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-sans font-medium border border-[#7C5CFF]/25 bg-[#0B1228]/80 text-[#B8BDD6] hover:text-[#F8F7FF] transition cursor-pointer"
                title="Remembered playback speed"
              >
                {playbackRate}x
              </button>

              {/* Like Pill */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer border ${
                  liked
                    ? "text-[#FB7185] bg-[#FB7185]/20 border-[#FB7185]/40"
                    : "border-[#7C5CFF]/25 bg-[#7C5CFF]/15 text-[#BFAEFF] hover:bg-[#7C5CFF]/25 hover:text-[#F8F7FF]"
                }`}
                title={liked ? "Liked response" : "Like response"}
              >
                <Heart
                  size={12}
                  className={liked ? "fill-current text-[#FB7185]" : ""}
                />
                <span>{liked ? "Liked" : "Like"}</span>
              </button>
            </div>

            {/* Copy Pill */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-[#7C5CFF]/25 bg-[#7C5CFF]/15 text-[#BFAEFF] hover:bg-[#7C5CFF]/25 hover:text-[#F8F7FF] transition-all cursor-pointer"
              title="Copy text"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-[#4ADE80]">
                  <Check size={12} />
                  <span>Copied quietly</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy size={12} />
                  <span>Copy</span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Error Retry Option */}
        {message.isError && onRetry && (
          <div className="mt-3 flex items-center justify-end">
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 rounded-xl border border-red-800/50 bg-red-950/60 text-red-200 hover:bg-red-900/60 px-3 py-1.5 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(MessageBubbleComponent, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.message.liked === nextProps.message.liked &&
    prevProps.message.audioUrl === nextProps.message.audioUrl &&
    prevProps.message.isError === nextProps.message.isError
  );
});