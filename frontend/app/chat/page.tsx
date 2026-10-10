"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/chat/Sidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import MemoryModal from "@/components/chat/MemoryModal";
import { DemoCompletionModal } from "@/components/chat/DemoCompletionModal";
import { useChat } from "@/hooks/useChat";
import { fetchUserProfile } from "@/lib/api";
import SanctuaryNav from "@/components/common/SanctuaryNav";
import { useTodayCheckIn } from "@/context/CheckInContext";
import { UserProfile } from "@/types/profile";
import { Feather, Lock, Compass, LogIn } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import Loading from "@/components/common/Loading";
import { clearAllSanctuarySessions } from "@/lib/auth";
import { useEntitlement } from "@/context/EntitlementContext";
import TrialExpiredView from "@/components/upgrade/TrialExpiredView";

export default function ChatPage() {
  const router = useRouter();
  const { theme, toggleTheme, isLight } = useTheme();
  const { todayCheckIn } = useTodayCheckIn();
  const { t } = useLanguage();
  const { isTrialExpired } = useEntitlement();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileChecking, setProfileChecking] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [demoModalDismissed, setDemoModalDismissed] = useState(false);
  const {
    user,
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
    toggleVoiceMode,
    stopAthenaVoice,
    toggleLikeMessage,
    isDemo,
    demoLimitReached,
    demoPromptsUsed,
  } = useChat();

  // Strict Authentication & Onboarding Completion Guard
  useEffect(() => {
    let active = true;
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else {
        fetchUserProfile()
          .then((profile) => {
            if (!active) return;
            if (profile && profile.onboarding_completed === false) {
              router.replace("/onboarding");
            } else {
              if (profile) setUserProfile(profile);
              setProfileChecking(false);
            }
          })
          .catch(() => {
            if (active) setProfileChecking(false);
          });
      }
    }
    return () => {
      active = false;
    };
  }, [authLoading, user, router]);

  // Loading Screen while verifying registered authentication & intake baseline
  if (authLoading || !user || profileChecking) {
    return (
      <Loading
        label="Entering Conversation Sanctuary..."
        sublabel="Connecting to your private therapeutic room"
        fullScreen={true}
      />
    );
  }

  return (
    <main
      className={`flex flex-col h-screen w-full overflow-hidden select-none transition-colors duration-300 ${
        isLight
          ? "bg-[#F8F7F4] text-[#18181B]"
          : "bg-[#060814] text-[#F8F7FF] sanctuary-aurora-bg conversation-room"
      }`}
    >
      {/* 1. Universal Sanctuary Navigation (Identical Across All Pages) */}
      <SanctuaryNav theme={theme} onToggleTheme={toggleTheme} />

      {/* 2. Conversation Sanctuary Workspace */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onNewChat={createNewSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onTogglePinSession={togglePinSession}
          onToggleArchiveSession={toggleArchiveSession}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          userMemory={userMemory}
          onOpenMemory={() => setMemoryModalOpen(true)}
          isDemo={isDemo}
        />

        {/* Main Chat Area */}
        <section
          data-tour="conversation-area"
          className={`flex flex-col flex-1 h-full min-w-0 transition-colors duration-300 ${
            isLight ? "bg-[#F8F7F4]" : "bg-transparent"
          }`}
        >
        <ChatHeader
          title={currentSession?.title}
          backendOnline={backendOnline}
          onClearChat={clearCurrentChat}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenMemory={() => setMemoryModalOpen(true)}
        />

        {isTrialExpired ? (
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <TrialExpiredView />
          </div>
        ) : (
          <ChatWindow
            messages={messages}
            loading={loading}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
            onSendPrompt={send}
            onRetry={retryLastMessage}
            onToggleLike={toggleLikeMessage}
            todayCheckIn={todayCheckIn}
            userGoals={userProfile?.wellness_goal ? [userProfile.wellness_goal] : undefined}
          />
        )}

        {isDemo && (
          <div className="flex items-center justify-between px-6 py-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-t border-amber-500/20 text-xs text-amber-300">
            <span className="font-medium tracking-tight">Athena Sample Journey</span>
            <span className="text-[11px] bg-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-medium">
              Demo Message {Math.min(3, demoPromptsUsed)} of 3
            </span>
          </div>
        )}

        {demoLimitReached ? (
          <div className="mx-4 sm:mx-6 mb-4 p-5 rounded-3xl border border-[#7C5CFF]/30 bg-gradient-to-r from-[#0d1226]/90 to-slate-900/90 backdrop-blur-xl text-center space-y-3 shadow-xl shadow-[#7C5CFF]/15">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
              <span>{t("demo_limit_badge", "Demo Message Limit Reached (3 of 3)")}</span>
            </div>
            <p className="text-sm font-semibold text-white tracking-tight">
              {t("demo_limit_title", "You've experienced three conversations in the Athena demo.")}
            </p>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              {t("demo_limit_sub", "Create your own private sanctuary to continue with unlimited conversations, continuous memory, and a 30-day trial.")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-violet-600 hover:from-[#6b4ce6] hover:to-violet-700 text-white text-xs font-semibold shadow-md shadow-[#7C5CFF]/30 transition hover:scale-[1.01]"
              >
                <span>{t("demo_limit_create_account", "Create Your Athena Account")}</span>
              </Link>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                <Compass size={13} />
                <span>{t("demo_limit_explore", "Explore Athena")}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearAllSanctuarySessions();
                  router.push("/login");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                <LogIn size={13} />
                <span>{t("demo_limit_return_login", "Return to Login")}</span>
              </button>
            </div>
          </div>
        ) : (
          <ChatInput
            onSend={send}
            loading={loading}
            disabled={demoLimitReached}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
            onStartVoice={stopAthenaVoice}
            voiceMode={voiceMode}
            onToggleVoiceMode={toggleVoiceMode}
          />
        )}
      </section>
      </div>

      {/* Living Memory Modal */}
      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        memory={userMemory}
        onClearMemory={clearMemory}
        userName={userMemory?.user_name || user?.email?.split("@")[0]}
        isGuest={false}
      />

      {/* Demo Limit Completion Floating Card */}
      <DemoCompletionModal
        isOpen={demoLimitReached && !demoModalDismissed}
        promptsUsed={demoPromptsUsed}
        promptLimit={3}
        onClose={() => setDemoModalDismissed(true)}
        onExploreAthena={() => router.push("/")}
        onReturnToLogin={async () => {
          await clearAllSanctuarySessions();
          router.push("/login");
        }}
      />
    </main>
  );
}