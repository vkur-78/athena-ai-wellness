"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { submitOnboardingProfile, fetchUserProfile } from "@/lib/api";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import QuestionCard from "@/components/onboarding/QuestionCard";
import OptionCard from "@/components/onboarding/OptionCard";
import SliderControl from "@/components/onboarding/SliderControl";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight, Sparkles, CheckCircle2, Loader2, HeartHandshake, Heart } from "lucide-react";

const TOTAL_QUESTIONS = 12;
const STORAGE_DRAFT_KEY = "athena_onboarding_draft_v1";

export default function OnboardingPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [authChecking, setAuthChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingReflection, setOnboardingReflection] = useState<string | null>(null);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [routine, setRoutine] = useState("");
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepPattern, setSleepPattern] = useState("");
  const [energyPattern, setEnergyPattern] = useState("");
  const [currentFocus, setCurrentFocus] = useState<string[]>([]);
  const [emotionalPatterns, setEmotionalPatterns] = useState<string[]>([]);
  const [copingMethods, setCopingMethods] = useState<string[]>([]);
  const [supportStyle, setSupportStyle] = useState("");
  const [sensitiveTopics, setSensitiveTopics] = useState<string[]>([]);
  const [socialSupport, setSocialSupport] = useState("");
  const [wellnessGoal, setWellnessGoal] = useState("");

  const isTransitioningRef = useRef(false);

  // Helper to safely restore draft
  const restoreDraft = () => {
    if (typeof window === "undefined") return;
    try {
      const draft = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= TOTAL_QUESTIONS + 1) {
          setStep(parsed.step);
        }
        if (typeof parsed.displayName === "string") setDisplayName(parsed.displayName);
        if (typeof parsed.lifeStage === "string") setLifeStage(parsed.lifeStage);
        if (typeof parsed.routine === "string") setRoutine(parsed.routine);
        if (typeof parsed.sleepHours === "number" && !isNaN(parsed.sleepHours)) setSleepHours(parsed.sleepHours);
        if (typeof parsed.sleepPattern === "string") setSleepPattern(parsed.sleepPattern);
        if (typeof parsed.energyPattern === "string") setEnergyPattern(parsed.energyPattern);
        if (Array.isArray(parsed.currentFocus)) setCurrentFocus(parsed.currentFocus.filter((x: any) => typeof x === "string"));
        if (Array.isArray(parsed.emotionalPatterns)) setEmotionalPatterns(parsed.emotionalPatterns.filter((x: any) => typeof x === "string"));
        if (Array.isArray(parsed.copingMethods)) setCopingMethods(parsed.copingMethods.filter((x: any) => typeof x === "string"));
        if (typeof parsed.supportStyle === "string") setSupportStyle(parsed.supportStyle);
        if (Array.isArray(parsed.sensitiveTopics)) setSensitiveTopics(parsed.sensitiveTopics.filter((x: any) => typeof x === "string"));
        if (typeof parsed.socialSupport === "string") setSocialSupport(parsed.socialSupport);
        if (typeof parsed.wellnessGoal === "string") setWellnessGoal(parsed.wellnessGoal);
      }
    } catch (draftErr) {
      console.warn("Draft restore failed:", draftErr);
    }
  };

  // Auth & Existing Profile Check
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let token = session?.access_token;
        if (!token && typeof window !== "undefined") {
          token = localStorage.getItem("athena_auth_token") || "";
        }
        if (!session && !token) {
          // If session is momentarily not ready, wait briefly for auth state to populate
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return;
            const currentToken = currentSession?.access_token || (typeof window !== "undefined" ? localStorage.getItem("athena_auth_token") : null);
            if (currentToken) {
              await verifyExistingProfile(currentSession || { access_token: currentToken });
            } else {
              router.replace("/login");
            }
          });

          // Fallback timeout in case onAuthStateChange does not fire
          const timeoutId = setTimeout(async () => {
            if (mounted && authChecking) {
              const { data: retryData } = await supabase.auth.getSession();
              const retryToken = retryData?.session?.access_token || (typeof window !== "undefined" ? localStorage.getItem("athena_auth_token") : null);
              if (retryToken && mounted) {
                await verifyExistingProfile(retryData?.session || { access_token: retryToken });
              } else if (mounted) {
                router.replace("/login");
              }
            }
          }, 1200);

          return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
          };
        }

        await verifyExistingProfile(session || { access_token: token });
      } catch (err) {
        console.warn("Auth check error, proceeding with onboarding:", err);
        if (mounted) {
          restoreDraft();
          setAuthChecking(false);
        }
      }
    }

    async function verifyExistingProfile(session: any) {
      if (!session) return;
      try {
        const profile = await fetchUserProfile(session.access_token);
        if (profile?.onboarding_completed && mounted) {
          window.location.href = "/";
          return;
        }
      } catch (e) {
        console.warn("Profile check failed, continuing onboarding:", e);
      }

      restoreDraft();
      if (mounted) setAuthChecking(false);
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Sync draft to localStorage on state changes
  useEffect(() => {
    if (authChecking) return;
    try {
      const stateToSave = {
        step,
        displayName,
        lifeStage,
        routine,
        sleepHours,
        sleepPattern,
        energyPattern,
        currentFocus: Array.isArray(currentFocus) ? currentFocus : [],
        emotionalPatterns: Array.isArray(emotionalPatterns) ? emotionalPatterns : [],
        copingMethods: Array.isArray(copingMethods) ? copingMethods : [],
        supportStyle,
        sensitiveTopics: Array.isArray(sensitiveTopics) ? sensitiveTopics : [],
        socialSupport,
        wellnessGoal,
      };
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore localStorage quota errors
    }
  }, [
    authChecking,
    step,
    displayName,
    lifeStage,
    routine,
    sleepHours,
    sleepPattern,
    energyPattern,
    currentFocus,
    emotionalPatterns,
    copingMethods,
    supportStyle,
    sensitiveTopics,
    socialSupport,
    wellnessGoal,
  ]);

  // Multi-select toggle helpers
  const toggleMulti = (list: string[], setList: (l: string[]) => void, item: string) => {
    const safeList = Array.isArray(list) ? list : [];
    if (safeList.includes(item)) {
      setList(safeList.filter((x) => x !== item));
    } else {
      setList([...safeList, item]);
    }
  };

  const handleNext = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 250);

    setStep((prev) => {
      const nextStep = prev + 1;
      return nextStep <= TOTAL_QUESTIONS + 1 ? nextStep : prev;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkip = () => {
    handleNext();
  };

  const handlePrevious = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 250);

    setStep((prev) => (prev > 1 ? prev - 1 : 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keyboard navigation: Enter advances step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  const getLocalizedOnboardingFallback = (lang: string): string => {
    const l = (lang || "en").toLowerCase();
    switch (l) {
      case "hi":
        return "एथेना में आपका स्वागत है। अपनी प्राथमिकताओं और संकल्पों को साझा करने के लिए धन्यवाद। हम आपकी गति से आगे बढ़ेंगे और आपके हर अनुभव का सम्मान करेंगे।";
      case "ta":
        return "அதீனாவிற்கு நல்வரவு. உங்கள் விருப்பங்களையும் நோக்கங்களையும் என்னுடன் பகிர்ந்ததற்கு நன்றி. உங்கள் வசதிக்கேற்ப, அமைதியாக நாம் இணைந்து பயணிப்போம்.";
      case "te":
        return "ఎథీనాకు స్వాగతం. మీ ప్రాధాన్యతలను మరియు ఉద్దేశాలను మాతో పంచుకున్నందుకు ధన్యవాదాలు. మీ వేగానికి అనుగుణంగా, ప్రశాంతంగా కలిసి ముందుకు సాగుదాం.";
      case "mr":
        return "अथेनामध्ये आपले स्वागत आहे. तुमची उद्दिष्टे आणि मन मोकळेपणाने मांडल्याबद्दल धन्यवाद. आपण आपल्या गतीने, शांतपणे पुढे जाऊ.";
      case "gu":
        return "એથેનામાં આપનું સ્વાગત છે. તમારા સંકલ્પો અને પ્રાથમિકતાઓ શેર કરવા બદલ આભાર. આપણે તમારી અનુકૂળ ગતિએ, શાંતિથી સાથે આગળ વધીશું.";
      default:
        return "Welcome to Athena. Thank you for sharing your rhythms and intentions with me. We will move at your pace, holding space for whatever you bring to your sanctuary.";
    }
  };

  const performOnboardingSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setIsGeneratingReflection(true);
    setErrorMsg(null);

    const fallback = getLocalizedOnboardingFallback(language);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        display_name: typeof displayName === "string" ? displayName.trim() || undefined : undefined,
        life_stage: lifeStage || undefined,
        routine: routine || undefined,
        sleep_hours: typeof sleepHours === "number" ? sleepHours : 7,
        sleep_pattern: sleepPattern || undefined,
        energy_pattern: energyPattern || undefined,
        current_focus: Array.isArray(currentFocus) ? currentFocus : [],
        emotional_patterns: Array.isArray(emotionalPatterns) ? emotionalPatterns : [],
        coping_methods: Array.isArray(copingMethods) ? copingMethods : [],
        support_style: supportStyle || undefined,
        sensitive_topics: Array.isArray(sensitiveTopics) ? sensitiveTopics : [],
        social_support: socialSupport || undefined,
        wellness_goal: wellnessGoal || undefined,
        language: language || "en",
        onboarding_completed: true,
      };

      const res = await submitOnboardingProfile(payload, session?.access_token);
      setOnboardingReflection(res?.onboarding_reflection || fallback);
    } catch (err: any) {
      console.warn("Onboarding submission fallback:", err);
      // Graceful fallback: do not block onboarding if AI or network hiccups
      setOnboardingReflection(fallback);
    } finally {
      setIsGeneratingReflection(false);
      setSubmitting(false);
    }
  };

  // Automatically trigger onboarding submit & reflection when entering Step 13
  useEffect(() => {
    if (step > TOTAL_QUESTIONS && !onboardingReflection && !submitting) {
      performOnboardingSubmit();
    }
  }, [step]);

  const handleEnterSanctuary = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_DRAFT_KEY);
      }
    } catch {}
    window.location.href = "/";
  };

  if (authChecking) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
        <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)] animate-pulse mb-3">
            <Sparkles size={22} className="text-[var(--accent)]" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Preparing your sanctuary intake...</p>
        </div>
      </main>
    );
  }

  // Completion Screen (Screen 13): Welcome AI Reflection
  if (step > TOTAL_QUESTIONS) {
    return (
      <main className="relative min-h-screen flex items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)]">
        <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] backdrop-blur-2xl p-8 sm:p-10 text-center space-y-6 shadow-2xl pointer-events-auto animate-in fade-in duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)] shadow-xs">
            <CheckCircle2 size={30} className="text-[var(--accent)]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
              {t("onboarding_reflection_title", "Athena's Welcome Reflection")}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
              {t("onboarding_reflection_sub", "A thoughtful pause honoring your intentions and care rhythm.")}
            </p>
          </div>

          {/* AI Reflection Card */}
          <div className="rounded-[22px] border border-[#7C5CFF]/25 bg-[var(--surface-sunken)]/60 p-6 sm:p-7 text-left space-y-4 shadow-sm relative overflow-hidden transition-all duration-[280ms]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500 dark:text-violet-400">
              <Heart size={14} className="fill-current opacity-70" />
              <span className="font-serif">Athena</span>
            </div>

            {isGeneratingReflection ? (
              <div className="flex items-center gap-2 py-4 px-1 text-sm font-serif italic opacity-75 animate-pulse">
                <span className="text-xs">{t("onboarding_preparing", "Athena is preparing your welcome reflection...")}</span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-[280ms]">
                <p className="text-sm sm:text-base font-serif italic leading-relaxed text-zinc-100">
                  &ldquo;{onboardingReflection || getLocalizedOnboardingFallback(language)}&rdquo;
                </p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="rounded-[18px] border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleEnterSanctuary}
              className="w-full flex items-center justify-center gap-2 rounded-[18px] bg-[#7C5CFF] hover:bg-[#6b4bf0] text-white border border-[#7C5CFF]/50 py-4 text-sm font-semibold shadow-[0_0_20px_rgba(124,92,255,0.35)] transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>{t("onboarding_enter_sanctuary", "Enter Your Sanctuary")}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#959BB4]">
            <HeartHandshake size={13} className="text-[#BFAEFF]" />
            <span>Private, encrypted, and adaptable to your pace at all times.</span>
          </div>
        </div>
      </main>
    );
  }

  // Safe active step clamp
  const safeStep = Math.max(1, Math.min(TOTAL_QUESTIONS, Number(step) || 1));

  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] px-4 py-4 sm:py-6">
      <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex-1 flex flex-col pb-36 sm:pb-40">
        <OnboardingProgress
          currentStep={safeStep}
          totalSteps={TOTAL_QUESTIONS}
          onPrevious={handlePrevious}
          canGoBack={safeStep > 1}
        />

        {/* Dynamic Question Render */}
        <div className="transition-all duration-300 flex-1">
          {/* Screen 1: Name */}
          {safeStep === 1 && (
            <QuestionCard
              heading="What would you like Athena to call you?"
              explanation="A name makes our conversations feel more personal."
              badge="Personal Connection"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your first name or preferred nickname"
                  className="w-full rounded-[16px] border border-[var(--input-border)] bg-[var(--input-background)] py-3.5 px-5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  You can change this anytime from your sanctuary settings.
                </p>
              </div>
            </QuestionCard>
          )}

          {/* Screen 2: Life Stage */}
          {safeStep === 2 && (
            <QuestionCard
              heading="Which option feels closest to your current stage of life?"
              explanation="This helps me frame suggestions and examples around your actual day-to-day world."
              badge="Daily Context"
            >
              <div className="space-y-2.5">
                {[
                  "Student",
                  "Working Professional",
                  "Looking for Work",
                  "Running a Business",
                  "At Home",
                  "Something Else",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={lifeStage === opt}
                    onClick={() => setLifeStage(opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 3: Routine */}
          {safeStep === 3 && (
            <QuestionCard
              heading="Which description feels most like your recent days?"
              explanation="Understanding your current pace helps me match the right level of structure and energy."
              badge="Rhythm & Routine"
            >
              <div className="space-y-2.5">
                {[
                  "My days feel structured.",
                  "I stay busy but manage.",
                  "Every day feels unpredictable.",
                  "I often feel overwhelmed.",
                  "I'm just getting through the day.",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={routine === opt}
                    onClick={() => setRoutine(opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 4: Sleep */}
          {safeStep === 4 && (
            <QuestionCard
              heading="Sleep can shape how we feel during the day."
              explanation="Sleep quality directly impacts emotional resilience and mental clarity."
              badge="Physical Foundation"
            >
              <div className="space-y-5">
                <SliderControl
                  value={sleepHours}
                  onChange={setSleepHours}
                  min={0}
                  max={12}
                  step={0.5}
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    How does waking up typically feel?
                  </label>
                  <div className="space-y-2">
                    {[
                      "I wake feeling refreshed.",
                      "I'm usually tired.",
                      "I struggle falling asleep.",
                      "I wake during the night.",
                    ].map((opt) => (
                      <OptionCard
                        key={opt}
                        label={opt}
                        selected={sleepPattern === opt}
                        onClick={() => setSleepPattern(opt)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </QuestionCard>
          )}

          {/* Screen 5: Energy Pattern */}
          {safeStep === 5 && (
            <QuestionCard
              heading="When do you usually feel your best?"
              explanation="Knowing your natural rhythm helps me know when you have the most mental bandwidth."
              badge="Natural Rhythm"
            >
              <div className="space-y-2.5">
                {[
                  "Morning",
                  "Afternoon",
                  "Evening",
                  "Late Night",
                  "It changes every day",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={energyPattern === opt}
                    onClick={() => setEnergyPattern(opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 6: Current Focus (Multi-select) */}
          {safeStep === 6 && (
            <QuestionCard
              heading="What's been taking up the most space in your mind lately?"
              explanation="Focusing on what's top-of-mind right now lets us address what matters most to you."
              badge="Mind Space (Select All That Apply)"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Studies",
                  "Work",
                  "Relationships",
                  "Family",
                  "Money",
                  "Health",
                  "Future",
                  "Confidence",
                  "Finding balance",
                  "Something else",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    multi
                    selected={(currentFocus || []).includes(opt)}
                    onClick={() => toggleMulti(currentFocus, setCurrentFocus, opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 7: Emotional Stress Reaction (Multi-select) */}
          {safeStep === 7 && (
            <QuestionCard
              heading="When life feels difficult, what usually happens for you?"
              explanation="Recognizing your natural emotional stress reactions helps me support you with greater care."
              badge="Stress Tendencies (Select All That Apply)"
            >
              <div className="space-y-2.5">
                {[
                  "My thoughts start racing.",
                  "I overthink conversations.",
                  "I feel emotionally drained.",
                  "I become quiet.",
                  "I avoid people.",
                  "I become restless.",
                  "I lose motivation.",
                  "I don't really know.",
                  "I'd rather not answer.",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    multi
                    selected={(emotionalPatterns || []).includes(opt)}
                    onClick={() => toggleMulti(emotionalPatterns, setEmotionalPatterns, opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 8: Coping Methods (Multi-select) */}
          {safeStep === 8 && (
            <QuestionCard
              heading="How do you usually respond when you're stressed?"
              explanation="This reveals your natural coping habits so I can suggest things you actually resonate with."
              badge="Natural Coping Outlets"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Listen to music",
                  "Sleep",
                  "Talk to someone",
                  "Stay alone",
                  "Exercise",
                  "Watch videos",
                  "Write things down",
                  "Keep working",
                  "I don't really have a way",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    multi
                    selected={(copingMethods || []).includes(opt)}
                    onClick={() => toggleMulti(copingMethods, setCopingMethods, opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 9: Support Style */}
          {safeStep === 9 && (
            <QuestionCard
              heading="What kind of support feels most helpful?"
              explanation="This directly shapes how Athena communicates and interacts with you."
              badge="Therapeutic Stance"
            >
              <div className="space-y-2.5">
                {[
                  {
                    label: "Someone who mostly listens.",
                    desc: "Expansive space to vent without unsolicited advice.",
                  },
                  {
                    label: "Gentle encouragement.",
                    desc: "Warm validation, resilience reminders, and kind presence.",
                  },
                  {
                    label: "Practical advice.",
                    desc: "Concrete solutions, grounded perspectives, and actionable tips.",
                  },
                  {
                    label: "Step-by-step guidance.",
                    desc: "Structured exercises, guided breathing, and clear pacing.",
                  },
                  {
                    label: "A calm conversation.",
                    desc: "Relaxed dialogue like talking to a thoughtful, calm friend.",
                  },
                  {
                    label: "A mix of everything.",
                    desc: "Adaptive support depending on what you bring to the session.",
                  },
                ].map((item) => (
                  <OptionCard
                    key={item.label}
                    label={item.label}
                    description={item.desc}
                    selected={supportStyle === item.label}
                    onClick={() => setSupportStyle(item.label)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 10: Sensitive Boundaries (Multi-select) */}
          {safeStep === 10 && (
            <QuestionCard
              heading="Are there any conversations you'd like me to approach with extra care?"
              explanation="You never have to explain anything you're not ready to. Setting boundaries keeps this space safe."
              badge="Gentle Boundaries (Optional)"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Family experiences",
                  "Relationships",
                  "Loss",
                  "Health",
                  "Childhood memories",
                  "Personal fears",
                  "Unexpected memories",
                  "No preference",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    multi
                    selected={(sensitiveTopics || []).includes(opt)}
                    onClick={() => {
                      const safeTopics = Array.isArray(sensitiveTopics) ? sensitiveTopics : [];
                      if (opt === "No preference") {
                        setSensitiveTopics(["No preference"]);
                      } else {
                        const filtered = safeTopics.filter((x) => x !== "No preference");
                        toggleMulti(filtered, setSensitiveTopics, opt);
                      }
                    }}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 11: Circle of Support */}
          {safeStep === 11 && (
            <QuestionCard
              heading="Who do you usually lean on when life gets difficult?"
              explanation="Understanding your circle of support helps me suggest healthy social connection or self-reliance."
              badge="Support Network"
            >
              <div className="space-y-2.5">
                {[
                  "Family",
                  "Friends",
                  "Partner",
                  "Teacher",
                  "Therapist",
                  "Online communities",
                  "Mostly myself",
                  "I don't really have anyone",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={socialSupport === opt}
                    onClick={() => setSocialSupport(opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Screen 12: North Star Wellness Goal */}
          {safeStep === 12 && (
            <QuestionCard
              heading="What would make you feel that Athena has genuinely helped you?"
              explanation="Setting an anchor goal gives us a shared north star for our journey together."
              badge="Long-term Coaching Goal"
            >
              <div className="space-y-2.5">
                {[
                  "Feel calmer.",
                  "Sleep better.",
                  "Handle stress better.",
                  "Understand myself.",
                  "Build confidence.",
                  "Feel less alone.",
                  "Create healthier habits.",
                  "Keep moving forward.",
                ].map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={wellnessGoal === opt}
                    onClick={() => setWellnessGoal(opt)}
                  />
                ))}
              </div>
            </QuestionCard>
          )}
        </div>
      </div>

      {/* Docked Navigation Action Strip: Always visible and easily usable across all viewports */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--background)]/95 backdrop-blur-xl pt-3 pb-4 sm:pb-6 border-t border-[var(--border)] px-4">
        <div className="w-full max-w-xl mx-auto space-y-2.5">
          <button
            id="onboarding-continue-button"
            type="button"
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 rounded-[20px] bg-violet-600 hover:bg-violet-500 text-white font-serif font-medium py-3.5 sm:py-4 px-6 text-sm sm:text-base shadow-xl shadow-violet-950/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all duration-[220ms] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          >
            <span>{safeStep === TOTAL_QUESTIONS ? "Finish Intake" : "Continue"}</span>
            <ArrowRight size={16} />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-serif text-zinc-400 hover:text-zinc-200 transition-colors py-1 px-4 rounded-full hover:bg-zinc-900/60 cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
