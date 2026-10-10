"use client";

import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { Message } from "@/types/chat";
import { TodayCheckInData } from "@/context/CheckInContext";
import { Feather, Square } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  onSendPrompt?: (text: string) => void;
  onRetry?: () => void;
  onToggleLike?: (messageId: string) => void;
  todayCheckIn?: TodayCheckInData | null;
  userGoals?: string[];
}

export default function ChatWindow({
  messages,
  loading,
  isStreaming = false,
  onStopStreaming,
  onSendPrompt,
  onRetry,
  onToggleLike,
  todayCheckIn,
  userGoals,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);

  // Monitor user scroll position to avoid yanking when user scrolls up
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  // Check if a new message was added
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        shouldAutoScrollRef.current = true;
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Smooth scroll
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isStreaming]);

  const hasCheckedIn = Boolean(todayCheckIn && todayCheckIn.completed);
  const showStarters = messages.length <= 1 && !hasCheckedIn;
  const activeStreamingMsg = messages.find((m) => m.isStreaming);
  const showTypingIndicator = loading && (!activeStreamingMsg || !activeStreamingMsg.content.trim());

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto px-4 pt-4 pb-4 sm:px-8 sm:pt-6 sm:pb-6 transition-colors duration-300 bg-transparent"
    >
      {/* Maximum readable width: 700-760px (like reading a therapy letter) */}
      <div className="max-w-[740px] mx-auto flex flex-col gap-6 sm:gap-7">
        {/* Small elegant welcome state matching Section 22 */}
        {messages.length === 0 ? (
          <div className="my-auto py-20 text-center max-w-md mx-auto space-y-3 animate-in fade-in duration-300">
            <h2 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
              I&apos;m here.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed">
              What&apos;s present for you right now?
            </p>
          </div>
        ) : null}

        {/* Message Bubble List */}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onRetry={onRetry}
            onSelectSuggestion={onSendPrompt}
            onToggleLike={onToggleLike}
          />
        ))}

        {/* Typing indicator */}
        {showTypingIndicator && <TypingIndicator />}

        {/* Floating Pause Button while Streaming */}
        {isStreaming && onStopStreaming && (
          <div className="sticky bottom-2 flex justify-center z-10">
            <button
              type="button"
              onClick={onStopStreaming}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-sans font-medium border border-[#7C5CFF]/30 bg-[#0B1228]/90 text-[#F8F7FF] shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Square size={12} className="fill-current text-[#7C5CFF]" />
              <span>Pause Athena</span>
            </button>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}