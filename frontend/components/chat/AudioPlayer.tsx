"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, Volume2, Loader2, Gauge, Feather } from "lucide-react";
import { synthesizeSpeech } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface AudioPlayerProps {
  src?: string;
  text?: string;
  title?: string;
  autoPlay?: boolean;
  variant?: "assistant" | "user";
  onPlayStateChange?: (playing: boolean) => void;
}

export default function AudioPlayer({
  src,
  text,
  title = "Athena Voice",
  autoPlay = false,
  variant = "assistant",
  onPlayStateChange,
}: AudioPlayerProps) {
  const { isLight } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(src);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (src) {
      setAudioUrl(src);
    }
  }, [src]);

  // Load remembered playback rate
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("athena_playback_rate");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) {
          setPlaybackRate(parsed);
        }
      }
    }
  }, []);

  // Global voice interruption listener
  useEffect(() => {
    const handleStopVoice = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    window.addEventListener("athena:stop-voice", handleStopVoice);
    return () => {
      window.removeEventListener("athena:stop-voice", handleStopVoice);
    };
  }, []);

  // Notify parent of play state change
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Initialize or update audio object
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackRate;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      console.warn("Audio playback error, will allow fallback");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn("Autoplay was blocked by browser policy:", e);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl, autoPlay]);

  // Update playback rate when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayback = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Silence any other active audio instances first
    window.dispatchEvent(new CustomEvent("athena:stop-voice"));

    if (audioRef.current && audioUrl) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        console.warn("Audio playback failed, attempting synthesize/speech fallback:", err);
      }
    }

    // If no audio URL is available yet, synthesize it
    if (!audioUrl && text) {
      setLoading(true);
      try {
        const url = await synthesizeSpeech(text);
        setAudioUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = playbackRate;
        audio.onended = () => setIsPlaying(false);
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn("Backend TTS failed, using browser SpeechSynthesis fallback:", e);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const cleanText = text.replace(/[*#_~`>]/g, "");
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = playbackRate;
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback if browser speech synthesis was running
    if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_~`>]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = playbackRate;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (typeof window !== "undefined") {
      localStorage.setItem("athena_playback_rate", String(nextRate));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isUser = variant === "user";

  return (
    <div
      className={`rounded-2xl border p-2.5 sm:p-3 transition-all ${
        isUser
          ? isLight
            ? "bg-[#ede8df] border-[#ded7ca] text-stone-800"
            : "bg-[#282a36] border-[#383a48] text-zinc-100"
          : isLight
          ? "bg-[#fdfbf7] border-[#e7e5e4] text-stone-800 shadow-xs"
          : "bg-[#1c1d22] border-[#2a2b33] text-zinc-100 shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-xl ${
              isLight
                ? "bg-stone-200 text-stone-700"
                : "bg-violet-950/70 border border-violet-800/40 text-violet-300"
            }`}
          >
            {isUser ? <Volume2 size={13} /> : <Feather size={13} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                {title}
              </span>
              {isPlaying && (
                <span className="flex items-center gap-0.5 h-3">
                  <span
                    className={`w-0.5 h-3 rounded-full animate-pulse ${
                      isLight ? "bg-stone-600" : "bg-violet-400"
                    }`}
                  />
                  <span
                    className={`w-0.5 h-2 rounded-full animate-pulse delay-75 ${
                      isLight ? "bg-stone-500" : "bg-purple-300"
                    }`}
                  />
                  <span
                    className={`w-0.5 h-3.5 rounded-full animate-pulse delay-150 ${
                      isLight ? "bg-stone-600" : "bg-violet-400"
                    }`}
                  />
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-serif block ${
                isLight ? "text-stone-500" : "text-zinc-400"
              }`}
            >
              {isPlaying ? "Playing voice audio..." : "Voice message ready"}
            </span>
          </div>
        </div>

        {/* Speed toggle pill */}
        <button
          type="button"
          onClick={cycleSpeed}
          className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium border transition cursor-pointer ${
            isLight
              ? "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200"
              : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-white"
          }`}
          title="Change playback speed"
        >
          <Gauge size={11} />
          <span>{playbackRate}x</span>
        </button>
      </div>

      {/* Play Controls & Scrubber */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Play / Pause Toggle */}
        <button
          type="button"
          onClick={togglePlayback}
          disabled={loading}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition cursor-pointer ${
            isPlaying
              ? isLight
                ? "bg-stone-800 text-white"
                : "bg-violet-600 text-white shadow-xs"
              : isLight
              ? "bg-stone-200 hover:bg-stone-300 text-stone-800"
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          }`}
          title={isPlaying ? "Pause voice" : "Play / Resume voice"}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={13} />
          ) : (
            <Play size={13} className="translate-x-[1px]" />
          )}
        </button>

        {/* Stop Button during or after playback */}
        {(isPlaying || currentTime > 0) && (
          <button
            type="button"
            onClick={handleStop}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition cursor-pointer border ${
              isLight
                ? "border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title="Stop audio playback"
          >
            <Square size={11} className="fill-current" />
          </button>
        )}

        {/* Progress scrub bar */}
        <div className="flex-1 space-y-1">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className={`group relative h-2 w-full rounded-full cursor-pointer overflow-hidden transition-all hover:h-2.5 ${
              isLight ? "bg-stone-200" : "bg-zinc-800"
            }`}
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                isLight ? "bg-stone-700" : "bg-violet-400"
              }`}
            />
          </div>

          <div
            className={`flex items-center justify-between text-[10px] ${
              isLight ? "text-stone-500" : "text-zinc-400"
            }`}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : text ? "Ready" : "0:00"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
