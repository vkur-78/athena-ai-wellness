"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Message, ChatSession, MemorySummary } from "@/types/chat";
import {
  sendMessageStream,
  checkBackendHealth,
  clearSessionApi,
  fetchUserConversations,
  createConversationApi,
  deleteConversationApi,
  updateConversationTitleApi,
  fetchConversationMessages,
  fetchUserMemory,
  clearUserMemoryApi,
  synthesizeSpeech,
  fetchDemoStatus,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { isExplicitDemoUser, clearDemoSessionStorage } from "@/lib/auth";

export function generateConversationTitle(messageText: string): string {
  if (!messageText || !messageText.trim()) return "New Conversation";

  // Clean quotes and excessive whitespace
  let text = messageText.replace(/["'""'']/g, "").trim();
  const lower = text.toLowerCase();

  // Primary contextual cases (Requirement 21)
  if (lower.includes("overwhelm") && lower.includes("work")) {
    return "Feeling Overwhelmed After Work";
  }
  if ((lower.includes("switch off") || lower.includes("switching off") || lower.includes("unwind")) && (lower.includes("night") || lower.includes("tonight") || lower.includes("evening"))) {
    return "Trouble Switching Off Tonight";
  }
  if (lower.includes("morning check-in") || lower.includes("morning checkin") || (lower.includes("morning") && lower.includes("start"))) {
    return "Morning Check-In";
  }
  if (lower.includes("reflection") || lower.includes("reflect on today") || lower.includes("reflecting on")) {
    return "Reflection";
  }

  // Thematic matches
  if (
    lower.includes("stressed about work") ||
    lower.includes("work stress") ||
    (lower.includes("work") && (lower.includes("stress") || lower.includes("pressure") || lower.includes("job") || lower.includes("boss")))
  ) {
    return "Work Stress";
  }
  if (
    lower.includes("couldn't sleep") ||
    lower.includes("could not sleep") ||
    lower.includes("trouble sleeping") ||
    lower.includes("cant sleep") ||
    lower.includes("can't sleep") ||
    lower === "sleep" ||
    (lower.includes("sleep") && lower.split(/\s+/).length <= 5)
  ) {
    return "Sleep";
  }
  if (
    lower.includes("family has been difficult") ||
    lower.includes("difficult family") ||
    lower === "family" ||
    (lower.includes("family") && lower.split(/\s+/).length <= 6)
  ) {
    return "Family";
  }
  if (
    lower.includes("feeling anxious today") ||
    lower.includes("anxious today") ||
    (lower.includes("anxiety") && lower.includes("today"))
  ) {
    return "Anxiety Today";
  }

  // Broader topic checks
  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("exhausted") || lower.includes("tired")) {
    return "Sleep";
  }
  if (lower.includes("family") || lower.includes("parents") || lower.includes("mother") || lower.includes("father") || lower.includes("sibling")) {
    return "Family";
  }
  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("panic")) {
    return "Anxiety Today";
  }
  if (lower.includes("work") || lower.includes("career") || lower.includes("office") || lower.includes("boss")) {
    return "Work Stress";
  }
  if (lower.includes("overwhelm") || lower.includes("too much") || lower.includes("burnout")) {
    return "Feeling Overwhelmed";
  }
  if (lower.includes("sad") || lower.includes("grief") || lower.includes("lonely") || lower.includes("loss")) {
    return "Gentle Solace";
  }

  // Conversational preamble stripping (handles "Hello, can we talk about...")
  let clean = text;
  for (let i = 0; i < 3; i++) {
    clean = clean
      .replace(/^(hello|hi|hey|good morning|good evening)[,!\s]+/i, "")
      .replace(
        /^(can we talk about|i want to talk about|let's talk about|talk about|today was|i am feeling|i feel like|i feel|i have been struggling with|im feeling|i'm feeling|i am|i'm)\s+/i,
        ""
      )
      .trim();
  }
  clean = clean.replace(/[.?!,:;].*$/, "").trim();

  if (!clean) return "New Conversation";

  const words = clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const result = words.join(" ");
  if (result.length > 30) {
    return result.slice(0, 30).trim();
  }
  return result || "New Conversation";
}

const STORAGE_KEY = "athena_chat_sessions_v1";
const ACTIVE_SESSION_KEY = "athena_active_session_id_v1";

export function getCachedTodayCheckin() {
  if (typeof window === "undefined") return null;
  try {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const raw = localStorage.getItem(`athena_today_checkin_${todayStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.completed || parsed.mood)) return parsed;
    }
    const lastDate = localStorage.getItem("last_checkin_date");
    if (lastDate === todayStr) {
      return {
        completed: true,
        mood: localStorage.getItem("mood") || "Good",
        notes: localStorage.getItem("notes") || undefined,
        energy: Number(localStorage.getItem("energy")) || 3,
      };
    }
  } catch {}
  return null;
}

export function getInitialGreetingMessage(todayCheckin?: any): Message {
  const checkin = todayCheckin || getCachedTodayCheckin();

  if (checkin && (checkin.completed || checkin.mood)) {
    const moodName = String(checkin.mood).toLowerCase();
    const notes = checkin.notes ? String(checkin.notes).trim() : null;

    let moodSentence = "I'm here with you today.";
    if (moodName.includes("great") || moodName.includes("joy")) {
      moodSentence = "I'm glad today has offered a little breathing room.";
    } else if (moodName.includes("good") || moodName.includes("peace")) {
      moodSentence = "Let's protect this steady feeling.";
    } else if (moodName.includes("okay") || moodName.includes("ground")) {
      moodSentence = "We don't have to force today to be better.";
    } else if (moodName.includes("low") || moodName.includes("tender")) {
      moodSentence = "I'm here. Let's keep today small.";
    } else if (moodName.includes("difficult") || moodName.includes("stir")) {
      moodSentence = "Thank you for staying with me. We can take this one step at a time.";
    }

    let memoryFollowUp = "Where would you like to begin?";
    if (notes) {
      memoryFollowUp = `Earlier you mentioned that "${notes}". Has that shifted at all?`;
    }

    const content = `Welcome back.\n\n${moodSentence}\n\n${memoryFollowUp}`;

    return {
      id: "welcome-msg",
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
      metadata: {
        risk: "none",
        emotion: moodName,
        stage: "continuous_greeting",
        therapy_approach: "holding space",
      },
    };
  }

  // Checked for recent journal context if no checkin
  let recentJournalTopic: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const draft = localStorage.getItem("athena_journal_pending_draft");
      if (draft && draft.length > 5) {
        recentJournalTopic = draft.slice(0, 80).replace(/\n/g, " ").trim();
      }
    } catch {}
  }

  const defaultContent = recentJournalTopic
    ? `Welcome back.\n\nI'm holding space with you today. Earlier you reflected in Space on "${recentJournalTopic}...".\n\nHas anything shifted since then?`
    : `Welcome back.\n\nI'm here with you in this quiet space. We don't have to force anything today—we can take things one gentle step at a time.\n\nWhere would you like to begin?`;

  return {
    id: "welcome-msg",
    role: "assistant",
    content: defaultContent,
    createdAt: new Date().toISOString(),
    metadata: {
      risk: "none",
      emotion: "calm",
      stage: "greeting",
      therapy_approach: "holding space",
    },
  };
}

function createInitialSession(id: string = "session-1", title: string = "New Conversation"): ChatSession {
  return {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

export function useChat() {
  const [user, setUser] = useState<User | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-1");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [userMemory, setUserMemory] = useState<MemorySummary | null>(null);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState(false);
  const [demoLimitReached, setDemoLimitReached] = useState(false);
  const [demoPromptsUsed, setDemoPromptsUsed] = useState(0);

  const voiceModeRef = useRef(voiceMode);
  voiceModeRef.current = voiceMode;
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop any active Athena speech immediately (Voice interruption coordinator)
  const stopAthenaVoice = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch {}
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("athena:stop-voice"));
    }
  }, []);

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((prev) => {
      const next = !prev;
      if (!next) {
        stopAthenaVoice();
      }
      return next;
    });
  }, [stopAthenaVoice]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      stopAthenaVoice();
    };
  }, [stopAthenaVoice]);

  const token =
    authSession?.access_token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("athena_demo_token") ||
        (() => {
          try {
            const raw = localStorage.getItem("sb-yvmqdlqpfuirapznbmrj-auth-token");
            return raw ? JSON.parse(raw).access_token : undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined);
  const tokenRef = useRef<string | undefined>(token);
  tokenRef.current = token;

  const userRef = useRef<User | null>(user);
  userRef.current = user;

  // Initialize Supabase Auth & subscribe
  useEffect(() => {
    const handleAuthResolution = (session: Session | null) => {
      setAuthSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);

      const isSeededDemo = isExplicitDemoUser(session?.user);

      // 1. Real Authenticated User: Never subject to demo limit
      if (session?.user && !isSeededDemo) {
        setIsDemo(false);
        setDemoLimitReached(false);
        clearDemoSessionStorage();
        return;
      }

      // 2. Explicit Demo User: Subject to 3-prompt limit
      const demoFlag = typeof window !== "undefined" && localStorage.getItem("athena_demo_mode") === "true";
      if (isSeededDemo || (demoFlag && !session?.user)) {
        setIsDemo(true);
        const demoToken = session?.access_token || (typeof window !== "undefined" ? localStorage.getItem("athena_demo_token") || "" : "");
        fetchDemoStatus(demoToken).then((status) => {
          setDemoPromptsUsed(status.prompts_used);
          if (status.prompts_used >= 3 || status.remaining_prompts <= 0 || status.status === "exhausted") {
            setDemoLimitReached(true);
          }
        });
        return;
      }

      // 3. Clean fallback
      setIsDemo(false);
      setDemoLimitReached(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthResolution(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthResolution(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load conversations based on auth state & restore persisted active session
  useEffect(() => {
    let active = true;

    async function initSessions() {
      const savedActiveId =
        typeof window !== "undefined" ? localStorage.getItem(ACTIVE_SESSION_KEY) : null;

      if (token && user) {
        // Logged-in user: sync with Supabase backend
        try {
          const serverConvs = await fetchUserConversations(token, false);
          if (!active) return;

          if (serverConvs && serverConvs.length > 0) {
            const mappedSessions: ChatSession[] = await Promise.all(
              serverConvs.map(async (c: any) => {
                const dbMsgs = await fetchConversationMessages(c.id, token);
                const formattedMsgs: Message[] =
                  dbMsgs && dbMsgs.length > 0
                    ? dbMsgs.map((m: any) => ({
                        id: String(m.id || crypto.randomUUID()),
                        role: m.role,
                        content: m.content,
                        createdAt: m.created_at || new Date().toISOString(),
                      }))
                    : [{ ...getInitialGreetingMessage(), id: `welcome-${c.id}` }];

                return {
                  id: c.id,
                  title: c.title || "Conversation",
                  createdAt: c.created_at,
                  updatedAt: c.created_at,
                  messages: formattedMsgs,
                };
              })
            );

            if (!active) return;
            setSessions(mappedSessions);

            // Reopen saved active session if found, else default to first
            const matchedSession =
              savedActiveId && mappedSessions.find((s) => s.id === savedActiveId);
            setActiveSessionId(matchedSession ? matchedSession.id : mappedSessions[0].id);
          } else {
            // Create first conversation on server
            const newConv = await createConversationApi("New Conversation", token);
            if (!active) return;
            const freshSession = createInitialSession(newConv?.id || `conv-${Date.now()}`);
            setSessions([freshSession]);
            setActiveSessionId(freshSession.id);
          }

          // Fetch user's persistent living memory
          const mem = await fetchUserMemory(token);
          if (active && mem) setUserMemory(mem);
        } catch (err) {
          console.error("Failed to load user conversations from backend:", err);
        }
      } else {
        // Guest mode: load from localStorage
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed: ChatSession[] = JSON.parse(saved);
            if (parsed.length > 0) {
              setSessions(parsed);
              const matched =
                savedActiveId && parsed.find((s) => s.id === savedActiveId);
              setActiveSessionId(matched ? matched.id : parsed[0].id);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to load local chat sessions:", e);
        }

        const initial = createInitialSession();
        setSessions([initial]);
        setActiveSessionId(initial.id);
      }
    }

    initSessions();

    return () => {
      active = false;
    };
  }, [token, user?.id]);

  // Persist active session ID across navigation and reload
  useEffect(() => {
    if (activeSessionId) {
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      } catch (e) {
        console.error("Failed to save active session ID:", e);
      }
    }
  }, [activeSessionId]);

  // Sync sessions to localStorage when in guest mode
  useEffect(() => {
    if (!token && sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed to save chat sessions:", e);
      }
    }
  }, [sessions, token]);

  // Periodic health check & memory refresh
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const isOnline = await checkBackendHealth();
      if (mounted) setBackendOnline(isOnline);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createInitialSession();
  const messages = currentSession?.messages || [];

  const createNewSession = useCallback(
    async (title: string = "New Conversation") => {
      let newId = `session-${Date.now()}`;

      if (tokenRef.current) {
        try {
          const newConv = await createConversationApi(title, tokenRef.current);
          if (newConv?.id) newId = newConv.id;
        } catch (e) {
          console.error("Failed to create server conversation:", e);
        }
      }

      const newSession: ChatSession = {
        id: newId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [{ ...getInitialGreetingMessage(), id: crypto.randomUUID() }],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
      return newId;
    },
    []
  );

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, title: trimmed, updatedAt: new Date().toISOString() }
            : s
        )
      );

      if (tokenRef.current) {
        try {
          await updateConversationTitleApi(sessionId, trimmed, tokenRef.current);
        } catch (e) {
          console.error("Failed to update conversation title:", e);
        }
      }
    },
    []
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (tokenRef.current) {
        deleteConversationApi(sessionId, tokenRef.current).catch(() => {});
      } else {
        clearSessionApi(sessionId).catch(() => {});
      }

      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (filtered.length === 0) {
          const fresh = createInitialSession();
          setActiveSessionId(fresh.id);
          return [fresh];
        }
        if (activeSessionId === sessionId) {
          setActiveSessionId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeSessionId]
  );

  const clearCurrentChat = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: "New Conversation",
              messages: [],
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
    clearSessionApi(activeSessionId).catch(() => {});
  }, [activeSessionId]);

  const togglePinSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s
      )
    );
  }, []);

  const toggleArchiveSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, isArchived: !s.isArchived } : s
      )
    );
  }, []);

  // Graceful cancellation of streaming ("Stop" button)
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setIsStreaming(false);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: s.messages.map((m) => {
                if (m.isStreaming) {
                  const stoppedContent = m.content
                    ? `${m.content.trim()}\n\n*Athena paused here.*`
                    : "*Athena paused here.*";
                  return {
                    ...m,
                    content: stoppedContent,
                    isStreaming: false,
                  };
                }
                return m;
              }),
            }
          : s
      )
    );
  }, [activeSessionId]);

  const toggleLikeMessage = useCallback(
    (messageId: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === messageId ? { ...m, liked: !m.liked } : m
                ),
              }
            : s
        )
      );
    },
    [activeSessionId]
  );

  const send = async (content: string, audioUrl?: string, internalContext?: string) => {
    if (!content || !content.trim() || loading || !tokenRef.current) return;
    if (demoLimitReached || (isDemo && demoPromptsUsed >= 3)) {
      setDemoLimitReached(true);
      return;
    }

    // Interrupt any ongoing Athena speech when user speaks/sends
    stopAthenaVoice();

    const trimmed = content.trim();
    const isVoice = !!audioUrl;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      audioUrl: audioUrl,
      isVoiceMessage: isVoice,
    };

    // Part 2: Automatic Conversation Titles derived from first user message
    const currentTitle = currentSession?.title || "New Conversation";
    let updatedTitle = currentTitle;
    const isFirstUserMessage = !currentSession?.messages.some((m) => m.role === "user");
    if (currentTitle === "New Conversation" && isFirstUserMessage) {
      updatedTitle = generateConversationTitle(trimmed);
      if (tokenRef.current) {
        updateConversationTitleApi(activeSessionId, updatedTitle, tokenRef.current).catch(() => {});
      }
    }

    const assistantMsgId = crypto.randomUUID();
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, userMessage, initialAssistantMessage],
            }
          : s
      )
    );

    setLoading(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = "";
    let streamMetadata: any = undefined;

    try {
      await sendMessageStream(
        activeSessionId,
        trimmed,
        tokenRef.current,
        userRef.current?.id,
        {
          signal: controller.signal,
          onStart: (data) => {
            if (data?.metadata) {
              streamMetadata = data.metadata;
            }
          },
          onToken: (tokenText) => {
            accumulatedContent += tokenText;
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              metadata: streamMetadata,
                              isStreaming: true,
                            }
                          : m
                      ),
                    }
                  : s
              )
            );
          },
          onDone: (data) => {
            if (data?.memory) {
              setUserMemory(data.memory);
            }
            const finalContent = data?.reply || accumulatedContent;

            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: finalContent,
                              isStreaming: false,
                              metadata: data?.metadata || streamMetadata,
                            }
                          : m
                      ),
                    }
                  : s
              )
            );

            // Pre-synthesize voice response if available
            synthesizeSpeech(finalContent)
              .then((aiAudioUrl) => {
                if (aiAudioUrl) {
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMsgId
                                ? { ...m, audioUrl: aiAudioUrl }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }
              })
            // Refresh demo status after prompt completes
            if (isDemo) {
              const demoToken = tokenRef.current || (typeof window !== "undefined" ? localStorage.getItem("athena_demo_token") || "" : "");
              fetchDemoStatus(demoToken).then((status) => {
                setDemoPromptsUsed(status.prompts_used);
                if (status.prompts_used >= 3 || status.remaining_prompts <= 0 || status.status === "exhausted") {
                  setTimeout(() => {
                    setDemoLimitReached(true);
                  }, 1200);
                }
              });
            }
          },
          onError: (err) => {
            console.error("[useChat stream error]:", err);
            const errStr = String(err || "");
            if (errStr.includes("DEMO_LIMIT_REACHED") || errStr.includes("demo is complete")) {
              setDemoLimitReached(true);
              setDemoPromptsUsed(3);
            }
          },
        },
        internalContext
      );
    } catch (err: any) {
      if (controller.signal.aborted) {
        // Handled cleanly by stopStreaming
        return;
      }
      if (err?.message?.includes("DEMO_LIMIT_REACHED") || err?.status === 403) {
        setDemoLimitReached(true);
        setDemoPromptsUsed(3);
        setLoading(false);
        setIsStreaming(false);
        return;
      }
      console.error("[useChat] error:", err);

      // If nothing was streamed yet, show error message
      if (!accumulatedContent) {
        const errorMessage: Message = {
          id: assistantMsgId,
          role: "assistant",
          content:
            "I apologize, but I encountered a momentary connection issue. Please ensure the backend server is running, or tap below to retry.",
          createdAt: new Date().toISOString(),
          isError: true,
          isStreaming: false,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? errorMessage : m
                  ),
                }
              : s
          )
        );
      } else {
        // Retain partial response with notice
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: `${accumulatedContent.trim()}\n\n*Athena paused here.*`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.filter((m) => !m.isError),
              }
            : s
        )
      );
      send(lastUserMsg.content);
    }
  };

  const clearMemory = async () => {
    await clearUserMemoryApi(tokenRef.current, activeSessionId);
    setUserMemory(null);
  };

  return {
    user,
    token,
    authLoading,
    sessions,
    activeSessionId,
    currentSession,
    messages,
    loading,
    isStreaming,
    backendOnline,
    userMemory,
    memoryModalOpen,
    setMemoryModalOpen,
    send,
    stopStreaming,
    createNewSession,
    selectSession,
    renameSession,
    deleteSession,
    togglePinSession,
    toggleArchiveSession,
    clearCurrentChat,
    retryLastMessage,
    clearMemory,
    voiceMode,
    setVoiceMode,
    toggleVoiceMode,
    stopAthenaVoice,
    toggleLikeMessage,
    isDemo,
    demoLimitReached,
    demoPromptsUsed,
    setDemoLimitReached,
  };
}