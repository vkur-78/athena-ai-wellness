"use client";

import React, { useMemo } from "react";
import { toLocalDateString } from "@/lib/dashboardMetrics";
import { formatZonedDate, ATHENA_DEFAULT_TIMEZONE } from "@/lib/timezone";
import { MessageSquare } from "lucide-react";

interface InsightsConversationActivityProps {
  conversations: any[];
  allDates: string[];
  isLight?: boolean;
}

export default function InsightsConversationActivity({
  conversations,
  allDates,
  isLight = false,
}: InsightsConversationActivityProps) {
  // Aggregate conversations and message count by date
  const dailyData = useMemo(() => {
    const map = new Map<string, { count: number; messages: number }>();

    conversations.forEach((conv) => {
      const timeVal = conv.updated_at || conv.created_at;
      if (!timeVal) return;
      const ds = toLocalDateString(timeVal);
      if (!ds) return;

      const msgCount = Array.isArray(conv.messages)
        ? conv.messages.length
        : typeof conv.message_count === "number"
        ? conv.message_count
        : 1;

      const existing = map.get(ds) || { count: 0, messages: 0 };
      existing.count += 1;
      existing.messages += msgCount;
      map.set(ds, existing);
    });

    return allDates.map((dateStr) => {
      const data = map.get(dateStr) || { count: 0, messages: 0 };
      return {
        dateStr,
        displayDate: formatZonedDate(dateStr, ATHENA_DEFAULT_TIMEZONE),
        conversations: data.count,
        messages: data.messages,
      };
    });
  }, [conversations, allDates]);

  const totalConversations = useMemo(() => {
    return dailyData.reduce((acc, d) => acc + d.conversations, 0);
  }, [dailyData]);

  const totalMessages = useMemo(() => {
    return dailyData.reduce((acc, d) => acc + d.messages, 0);
  }, [dailyData]);

  const maxConversations = useMemo(() => {
    return Math.max(...dailyData.map((d) => d.conversations), 1);
  }, [dailyData]);

  if (totalConversations === 0) {
    return (
      <div
        className={`p-5 sm:p-6 rounded-3xl border space-y-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200/90 shadow-sm"
            : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`text-sm uppercase tracking-wider font-semibold ${isLight ? "text-stone-700" : "text-[#B8BDD6]/80"}`}>
            Conversation Activity
          </h2>
          <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>0 conversations</span>
        </div>
        <p className={`text-xs leading-relaxed py-6 text-center ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
          No conversations recorded in this period. Start a conversation with Athena to begin your reflection trail.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Conversation Activity"
      className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between transition-colors ${
        isLight
          ? "bg-white border-stone-200/90 shadow-sm"
          : "border-white/10 bg-[#0B1228]/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-sm uppercase tracking-wider font-semibold ${isLight ? "text-stone-700" : "text-[#B8BDD6]/80"}`}>
              Conversation Activity
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-[#B8BDD6]/60"}`}>
              Daily dialogues and message exchange volume
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 text-xs font-semibold text-[#7C5CFF] dark:text-[#BFAEFF]">
            <MessageSquare size={12} />
            <span>{totalConversations} {totalConversations === 1 ? "dialogue" : "dialogues"}</span>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className={`h-36 flex items-end gap-1 sm:gap-2 border-b pb-2 pt-4 ${isLight ? "border-stone-100" : "border-white/10"}`}>
          {dailyData.map((day) => {
            const heightPct = day.conversations > 0 ? Math.max((day.conversations / maxConversations) * 100, 15) : 0;

            return (
              <div
                key={day.dateStr}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {day.conversations > 0 ? (
                  <div
                    className="w-full max-w-[20px] rounded-t-lg bg-[#7C5CFF] group-hover:bg-[#9075FF] transition-all duration-200"
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <span className={`text-[10px] ${isLight ? "text-stone-300" : "text-[#B8BDD6]/20"}`}>·</span>
                )}

                {/* Tooltip on hover */}
                <div
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-lg text-[10px] whitespace-nowrap shadow-lg space-y-0.5 ${
                    isLight
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-[#0B1228] border border-white/20 text-white"
                  }`}
                >
                  <div className="font-semibold text-violet-300">{day.displayDate}</div>
                  <div>{day.conversations} {day.conversations === 1 ? "conversation" : "conversations"}</div>
                  <div className="text-stone-300 dark:text-[#B8BDD6]/70">{day.messages} messages</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-3 flex items-center justify-between text-xs pt-2 border-t ${isLight ? "border-stone-100 text-stone-600" : "border-white/5 text-[#B8BDD6]/60"}`}>
        <span>Total messages exchanged:</span>
        <span className={`font-semibold ${isLight ? "text-stone-900" : "text-[#F8F7FF]"}`}>{totalMessages}</span>
      </div>
    </section>
  );
}
