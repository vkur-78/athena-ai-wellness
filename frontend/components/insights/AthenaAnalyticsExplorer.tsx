"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Flame,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  Calendar,
  Wind,
  Moon,
  Sun,
  Activity,
  Compass,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export type AnalyticsCategory = "time" | "practice" | "mood" | "weekly" | "recovery" | "habit";

export interface AnalyticsVisualization {
  type: "clock-ring" | "comparison-bars" | "sparkline" | "weekly-cards" | "recovery-flow" | "weekly-rhythm";
  data: any;
}

export interface AnalyticsRecord {
  id: string;
  category: AnalyticsCategory;
  question: string;
  iconName: "moon" | "sun" | "wind" | "trending" | "activity" | "compass" | "calendar" | "book";
  title: string;
  highlightStat: string;
  confidence: number;
  summary: string;
  visualization: AnalyticsVisualization;
  evidence: {
    checkins: number;
    sessions: number;
    journals: number;
    chatExchanges: number;
  };
  seeWhy: {
    timelineMoments: { time: string; event: string; delta: string }[];
    relatedPractice: { name: string; href: string; actionText: string };
    confidenceReason: string;
    previousPeriodDelta: string;
  };
  suggestions: string[];
}

const ANALYTICS_REGISTRY: Record<string, AnalyticsRecord> = {
  "When do I feel calmest?": {
    id: "calmest-time",
    category: "time",
    question: "When do I feel calmest?",
    iconName: "moon",
    title: "Calmest Time Window",
    highlightStat: "Evenings (6:00 PM – 9:00 PM)",
    confidence: 94,
    summary: "Your nervous system consistently settles into baseline calm after 6:00 PM on days with quieter sensory transitions.",
    visualization: {
      type: "clock-ring",
      data: {
        peakStartHour: 18,
        peakEndHour: 21,
        peakScore: 88,
        baselineScore: 68,
        peakLabel: "6 PM – 9 PM (Peak Rest)",
        secondaryLabel: "Rest of Day Baseline: 68%",
      },
    },
    evidence: {
      checkins: 18,
      sessions: 12,
      journals: 7,
      chatExchanges: 4,
    },
    seeWhy: {
      timelineMoments: [
        { time: "6:15 PM", event: "Sakura Garden Guided Breath", delta: "+1.8 pts calm" },
        { time: "7:00 PM", event: "Screen Dimming / Space Journal", delta: "+1.2 pts calm" },
        { time: "8:30 PM", event: "Evening Check-in: Restful & Still", delta: "Baseline 88%" },
      ],
      relatedPractice: {
        name: "Sakura Garden Breath",
        href: "/studio?practice=breathe",
        actionText: "Launch Evening Breath in Studio",
      },
      confidenceReason: "Calculated from 18 verified check-in rating vectors matching evening downshift timestamps.",
      previousPeriodDelta: "+14% calmer than previous 30-day baseline",
    },
    suggestions: ["What helps my evenings?", "Compare evenings with mornings"],
  },

  "Which practice helps me recover fastest?": {
    id: "fastest-recovery-practice",
    category: "practice",
    question: "Which practice helps me recover fastest?",
    iconName: "wind",
    title: "Fastest Recovery Modality",
    highlightStat: "Sakura Garden Guided Breath (-38% Tension)",
    confidence: 96,
    summary: "Guided 4-7-8 Breathing produces the steepest autonomic tension reduction, restoring emotional balance in under 8 minutes.",
    visualization: {
      type: "comparison-bars",
      data: [
        { name: "Sakura Guided Breath", reliefPct: 92, sessions: 14, avgTime: "6 min", color: "from-rose-400 to-pink-500" },
        { name: "Ancient Forest Walk", reliefPct: 84, sessions: 9, avgTime: "8 min", color: "from-emerald-400 to-teal-500" },
        { name: "Space Journal Pause", reliefPct: 81, sessions: 11, avgTime: "5 min", color: "from-cyan-400 to-blue-500" },
        { name: "Somatic Stretch & PMR", reliefPct: 76, sessions: 6, avgTime: "10 min", color: "from-amber-400 to-orange-500" },
      ],
    },
    evidence: {
      checkins: 22,
      sessions: 16,
      journals: 11,
      chatExchanges: 5,
    },
    seeWhy: {
      timelineMoments: [
        { time: "T+0m", event: "Pre-session Tension Rating: 4.2 / 5", delta: "High Activation" },
        { time: "T+6m", event: "Completed 4-7-8 Respiratory Cycle", delta: "-1.9 pts tension" },
        { time: "T+15m", event: "Post-session Sustained State: Calm", delta: "92% relief retained" },
      ],
      relatedPractice: {
        name: "Guided Breathing",
        href: "/studio?practice=breathe",
        actionText: "Start 4-7-8 Breath Session",
      },
      confidenceReason: "Evaluated across 16 studio completions with immediate pre/post somatic state tags.",
      previousPeriodDelta: "2.1x faster restoration speed vs unassisted rest",
    },
    suggestions: ["Which Studio world do I return to most?", "What usually follows journaling?"],
  },

  "Which time of day feels heaviest?": {
    id: "heaviest-time",
    category: "time",
    question: "Which time of day feels heaviest?",
    iconName: "sun",
    title: "Highest Cognitive Load Window",
    highlightStat: "Late Afternoon (2:30 PM – 4:45 PM)",
    confidence: 89,
    summary: "Workday transitions and accumulated screen fatigue peak between 2:30 PM and 4:45 PM before evening decompression.",
    visualization: {
      type: "clock-ring",
      data: {
        peakStartHour: 14,
        peakEndHour: 17,
        peakScore: 78,
        baselineScore: 42,
        peakLabel: "2:30 PM – 4:45 PM (Cognitive Peak)",
        secondaryLabel: "Morning & Night Load: 38%",
      },
    },
    evidence: {
      checkins: 19,
      sessions: 8,
      journals: 6,
      chatExchanges: 7,
    },
    seeWhy: {
      timelineMoments: [
        { time: "2:30 PM", event: "Consecutive task switching detected", delta: "Focus Strain" },
        { time: "3:45 PM", event: "Check-in: Tension rating 3.8 / 5", delta: "Peak daily strain" },
        { time: "4:30 PM", event: "Afternoon 3-min Somatic Pause", delta: "-0.8 pts drop" },
      ],
      relatedPractice: {
        name: "Midday Grounding",
        href: "/studio?practice=grounding",
        actionText: "Try Midday 3-Min Grounding",
      },
      confidenceReason: "Derived from timestamped daily check-ins and self-reported afternoon energy fluctuations.",
      previousPeriodDelta: "Peaks shifted 45 minutes earlier compared to last week",
    },
    suggestions: ["What helps me recover after work?", "When do I feel calmest?"],
  },

  "How has my mood changed this month?": {
    id: "monthly-mood-trend",
    category: "mood",
    question: "How has my mood changed this month?",
    iconName: "trending",
    title: "Monthly Emotional Trajectory",
    highlightStat: "+18% Uplift & Sustained Resilience",
    confidence: 93,
    summary: "Your daily emotional trajectory shows steady stabilization, with volatility dropping 32% since Week 1.",
    visualization: {
      type: "sparkline",
      data: {
        weeks: [
          { label: "Week 1", score: 62, status: "Volatile" },
          { label: "Week 2", score: 71, status: "Stabilizing" },
          { label: "Week 3", score: 79, status: "Grounded" },
          { label: "Week 4", score: 86, status: "Resilient" },
        ],
        points: [58, 64, 61, 70, 74, 69, 78, 82, 80, 85, 84, 88],
        growthDelta: "+18%",
        volatilityDelta: "-32%",
      },
    },
    evidence: {
      checkins: 28,
      sessions: 19,
      journals: 14,
      chatExchanges: 9,
    },
    seeWhy: {
      timelineMoments: [
        { time: "Week 1", event: "Baseline establish: fluctuating between 55–65%", delta: "62% avg" },
        { time: "Week 2", event: "Routine adoption: 4 regular studio breathing moments", delta: "+9% gain" },
        { time: "Week 4", event: "Consistent evening journaling habit established", delta: "86% peak" },
      ],
      relatedPractice: {
        name: "Restorative Studio Breathing",
        href: "/studio?practice=breathe",
        actionText: "Enter Guided Studio Breath",
      },
      confidenceReason: "Aggregated across 28 continuous daily pulse submissions over the current month.",
      previousPeriodDelta: "+18% overall mood index compared to prior month",
    },
    suggestions: ["How did this week compare with last week?", "Which practice helps me recover fastest?"],
  },

  "What usually happens before stressful evenings?": {
    id: "pre-stress-pattern",
    category: "recovery",
    question: "What usually happens before stressful evenings?",
    iconName: "activity",
    title: "Stress Precursor Sequence",
    highlightStat: "Late Working Past 6:30 PM & Skipped Hydration",
    confidence: 91,
    summary: "Evenings with elevated restlessness are preceded by uninterrupted desk sessions extending past 6:30 PM.",
    visualization: {
      type: "recovery-flow",
      data: {
        steps: [
          { title: "Continuous Desk Time", detail: "3+ hours without pause", tag: "Trigger", color: "border-amber-500/40 text-amber-300" },
          { title: "Skipped Transition", detail: "No boundary between work & home", tag: "Friction", color: "border-rose-500/40 text-rose-300" },
          { title: "Late Breath Pause", detail: "5-min Sakura Garden reset", tag: "Intervention", color: "border-teal-500/40 text-teal-300" },
          { title: "Evening Recovery", detail: "Calm restored by 8:15 PM", tag: "Resolution", color: "border-emerald-500/40 text-emerald-300" },
        ],
      },
    },
    evidence: {
      checkins: 17,
      sessions: 11,
      journals: 9,
      chatExchanges: 6,
    },
    seeWhy: {
      timelineMoments: [
        { time: "6:30 PM", event: "Unbroken screen time without buffer", delta: "Tension +1.4" },
        { time: "7:15 PM", event: "Restlessness check-in logged", delta: "Late recognition" },
        { time: "7:45 PM", event: "5-min breathing intervention", delta: "Recovery initiated" },
      ],
      relatedPractice: {
        name: "Space Journal Reflection",
        href: "/journal",
        actionText: "Set an Evening Transition Boundary",
      },
      confidenceReason: "Identified in 5 out of 6 recorded evening tension spikes this month.",
      previousPeriodDelta: "Intervention success rate improved from 45% to 83%",
    },
    suggestions: ["What helps me recover after work?", "When do I feel calmest?"],
  },

  "How did this week compare with last week?": {
    id: "weekly-comparison",
    category: "weekly",
    question: "How did this week compare with last week?",
    iconName: "calendar",
    title: "Week-Over-Week Cadence",
    highlightStat: "+14% Calm Score & 4 More Restorative Pauses",
    confidence: 95,
    summary: "This week showed higher consistency in morning presence, leading to significantly smoother afternoon recoveries.",
    visualization: {
      type: "weekly-cards",
      data: {
        prevWeek: {
          label: "Last Week",
          calmScore: 72,
          practices: 5,
          recoveryMins: 52,
          daysActive: 4,
        },
        currWeek: {
          label: "This Week",
          calmScore: 86,
          practices: 9,
          recoveryMins: 36,
          daysActive: 6,
        },
        improvements: [
          { label: "Calmness Index", delta: "+14%" },
          { label: "Recovery Speed", delta: "1.4x faster" },
          { label: "Sanctuary Pauses", delta: "+4 sessions" },
        ],
      },
    },
    evidence: {
      checkins: 13,
      sessions: 9,
      journals: 5,
      chatExchanges: 3,
    },
    seeWhy: {
      timelineMoments: [
        { time: "Mon–Wed", event: "3 consecutive morning check-ins before 9:00 AM", delta: "Strong start" },
        { time: "Thursday", event: "Quick recovery during afternoon deadline", delta: "Downshift in 36m" },
        { time: "Friday", event: "Weekly Replay completed", delta: "Reflection locked" },
      ],
      relatedPractice: {
        name: "Evening Space Contemplation",
        href: "/journal",
        actionText: "Open Space Reflection",
      },
      confidenceReason: "Calculated across 7 days of completed health metrics vs prior 7 days.",
      previousPeriodDelta: "Highest consistency score achieved this month",
    },
    suggestions: ["How has my mood changed this month?", "Which day feels easiest?"],
  },

  "What helps me recover after work?": {
    id: "post-work-recovery",
    category: "recovery",
    question: "What helps me recover after work?",
    iconName: "compass",
    title: "Post-Work Downshift Protocol",
    highlightStat: "Mindful Walking Followed by Space Journal",
    confidence: 92,
    summary: "Stepping away from screens for a 5-minute outdoor or sanctuary walk accelerates mental detachment by 2.4x.",
    visualization: {
      type: "recovery-flow",
      data: {
        steps: [
          { title: "Workday Close", detail: "5:30 PM screen shut down", tag: "Boundary", color: "border-blue-500/40 text-blue-300" },
          { title: "Mindful Walking", detail: "5-min physical movement", tag: "Somatic Shift", color: "border-teal-500/40 text-teal-300" },
          { title: "Space Journal", detail: "3 sentences unburdening thoughts", tag: "Mental Clear", color: "border-indigo-500/40 text-indigo-300" },
          { title: "Peaceful Evening", detail: "Downshifted into baseline calm", tag: "Grounded", color: "border-emerald-500/40 text-emerald-300" },
        ],
      },
    },
    evidence: {
      checkins: 16,
      sessions: 10,
      journals: 8,
      chatExchanges: 4,
    },
    seeWhy: {
      timelineMoments: [
        { time: "5:30 PM", event: "Workday boundary set", delta: "Cognitive release" },
        { time: "5:40 PM", event: "Walking practice in Ancient Forest", delta: "-1.5 tension pts" },
        { time: "6:00 PM", event: "Space Journal: Recorded 2 wins", delta: "Evening calm locked" },
      ],
      relatedPractice: {
        name: "Ancient Forest Walk",
        href: "/studio?practice=walk",
        actionText: "Walk Through Ancient Forest Trail",
      },
      confidenceReason: "Synthesized from 10 post-5 PM walking sessions cross-referenced with evening mood logs.",
      previousPeriodDelta: "2.4x faster downshift compared to remaining on laptop",
    },
    suggestions: ["When do I feel calmest?", "Which Studio world do I return to most?"],
  },

  "Which Studio world do I return to most?": {
    id: "favorite-world",
    category: "practice",
    question: "Which Studio world do I return to most?",
    iconName: "book",
    title: "Sanctuary Preference & Revisit Depth",
    highlightStat: "Sakura Garden (62% of All Studio Time)",
    confidence: 97,
    summary: "Sakura Garden remains your most trusted restorative environment, especially during evening transitions.",
    visualization: {
      type: "comparison-bars",
      data: [
        { name: "🌸 Sakura Garden", reliefPct: 94, sessions: 15, avgTime: "7.5 min", color: "from-pink-400 to-rose-500" },
        { name: "🌲 Ancient Forest", reliefPct: 82, sessions: 8, avgTime: "8.2 min", color: "from-emerald-400 to-teal-500" },
        { name: "🌊 Mountain Stream", reliefPct: 78, sessions: 4, avgTime: "5.0 min", color: "from-cyan-400 to-blue-500" },
        { name: "✨ Starry Nebula", reliefPct: 74, sessions: 3, avgTime: "6.0 min", color: "from-purple-400 to-indigo-500" },
      ],
    },
    evidence: {
      checkins: 20,
      sessions: 30,
      journals: 6,
      chatExchanges: 4,
    },
    seeWhy: {
      timelineMoments: [
        { time: "Total Sessions", event: "15 Sakura Garden sessions completed", delta: "112 mins total" },
        { time: "Average Completion", event: "96% completion without early exit", delta: "Highest focus" },
        { time: "Calm Gain", event: "Average +1.8 points calmness delta", delta: "Proven relief" },
      ],
      relatedPractice: {
        name: "Sakura Garden Realm",
        href: "/studio?world=sakura",
        actionText: "Enter Sakura Garden",
      },
      confidenceReason: "Direct session log records from the 3D Studio environment database.",
      previousPeriodDelta: "3.2x more visits than the next environment",
    },
    suggestions: ["Which practice helps me recover fastest?", "What helps my evenings?"],
  },

  // Dynamic Suggestion Targets
  "What helps my evenings?": {
    id: "evening-helpers",
    category: "recovery",
    question: "What helps my evenings?",
    iconName: "moon",
    title: "Evening Decompression Factors",
    highlightStat: "Dim Light + Space Journal + 4-7-8 Breath",
    confidence: 92,
    summary: "Days where screens are dimmed by 8:00 PM followed by a quick journal reflection produce 88% calm ratings.",
    visualization: {
      type: "comparison-bars",
      data: [
        { name: "Space Journaling", reliefPct: 89, sessions: 12, avgTime: "4 min", color: "from-indigo-400 to-blue-500" },
        { name: "4-7-8 Evening Breath", reliefPct: 86, sessions: 10, avgTime: "5 min", color: "from-pink-400 to-rose-500" },
        { name: "Gentle Somatic Stretch", reliefPct: 78, sessions: 5, avgTime: "7 min", color: "from-teal-400 to-emerald-500" },
      ],
    },
    evidence: {
      checkins: 15,
      sessions: 12,
      journals: 9,
      chatExchanges: 3,
    },
    seeWhy: {
      timelineMoments: [
        { time: "8:00 PM", event: "Space Journal entry written", delta: "Racing thoughts quieted" },
        { time: "8:30 PM", event: "4-7-8 Breath session completed", delta: "Heart rate downshifted" },
        { time: "9:00 PM", event: "Logged 'Peaceful' check-in state", delta: "Optimal rest readiness" },
      ],
      relatedPractice: {
        name: "Open Space Journal",
        href: "/journal",
        actionText: "Write a Brief Evening Entry",
      },
      confidenceReason: "Cross-correlated from 12 evening check-ins matching journal entry timestamps.",
      previousPeriodDelta: "+22% higher evening calm compared to screen-heavy evenings",
    },
    suggestions: ["When do I feel calmest?", "What usually happens before stressful evenings?"],
  },

  "Compare evenings with mornings": {
    id: "morning-vs-evening",
    category: "time",
    question: "Compare evenings with mornings",
    iconName: "compass",
    title: "Morning Clarity vs Evening Calm",
    highlightStat: "Mornings Drive Focus · Evenings Drive Depth",
    confidence: 90,
    summary: "Your morning energy is best suited for setting gentle intentions, while evenings show the deepest therapeutic downshift.",
    visualization: {
      type: "weekly-cards",
      data: {
        prevWeek: {
          label: "Morning State (7 AM – 11 AM)",
          calmScore: 74,
          practices: 6,
          recoveryMins: 12,
          daysActive: 5,
        },
        currWeek: {
          label: "Evening State (6 PM – 10 PM)",
          calmScore: 88,
          practices: 14,
          recoveryMins: 38,
          daysActive: 6,
        },
        improvements: [
          { label: "Calm Differential", delta: "+14% in Evening" },
          { label: "Introspection Depth", delta: "2.8x higher" },
          { label: "Practice Longevity", delta: "+4.2 min duration" },
        ],
      },
    },
    evidence: {
      checkins: 24,
      sessions: 18,
      journals: 12,
      chatExchanges: 5,
    },
    seeWhy: {
      timelineMoments: [
        { time: "8:00 AM", event: "Morning check-in: Focused, alert, forward-looking", delta: "Baseline 74%" },
        { time: "7:00 PM", event: "Evening check-in: Contemplative, receptive, settled", delta: "Peak 88%" },
      ],
      relatedPractice: {
        name: "Sanctuary Studio",
        href: "/studio",
        actionText: "Visit Studio at Your Preferred Time",
      },
      confidenceReason: "Derived from pairwise comparison of morning vs evening check-in sentiment scores.",
      previousPeriodDelta: "Evening downshift speed improved by 28% this month",
    },
    suggestions: ["When do I feel calmest?", "Which practice helps me recover fastest?"],
  },

  "Which day feels easiest?": {
    id: "easiest-day",
    category: "habit",
    question: "Which day feels easiest?",
    iconName: "calendar",
    title: "Weekly Emotional Rhythm",
    highlightStat: "Saturdays & Fridays Log Highest Calm",
    confidence: 91,
    summary: "Fridays and Saturdays consistently record your lowest tension ratings and highest somatic comfort scores.",
    visualization: {
      type: "weekly-rhythm",
      data: {
        days: [
          { day: "Mon", score: 68, active: false },
          { day: "Tue", score: 64, active: false },
          { day: "Wed", score: 71, active: false },
          { day: "Thu", score: 75, active: false },
          { day: "Fri", score: 85, active: true },
          { day: "Sat", score: 91, active: true },
          { day: "Sun", score: 82, active: false },
        ],
        peakDay: "Saturday (91% Calm)",
        challengingDay: "Tuesday (64% Calm)",
      },
    },
    evidence: {
      checkins: 26,
      sessions: 14,
      journals: 8,
      chatExchanges: 4,
    },
    seeWhy: {
      timelineMoments: [
        { time: "Friday Afternoon", event: "Anticipation of weekend rest eases tension", delta: "+12% gain" },
        { time: "Saturday Morning", event: "Unscheduled waking and outdoor presence", delta: "Peak 91% rating" },
      ],
      relatedPractice: {
        name: "Weekly Reflection",
        href: "/reflection/weekly",
        actionText: "Review Weekly Reflection Log",
      },
      confidenceReason: "Computed by grouping daily check-ins across the past 4 calendar weeks by day-of-week.",
      previousPeriodDelta: "Midweek recovery scores improved by 8% this week",
    },
    suggestions: ["How did this week compare with last week?", "When do I feel calmest?"],
  },
};

const DEFAULT_CHIP_LIST = [
  "When do I feel calmest?",
  "Which practice helps me recover fastest?",
  "Which time of day feels heaviest?",
  "How has my mood changed this month?",
  "What usually happens before stressful evenings?",
  "How did this week compare with last week?",
  "What helps me recover after work?",
  "Which Studio world do I return to most?",
];

interface Props {
  hasInsufficientData?: boolean;
}

export default React.memo(function AthenaAnalyticsExplorer({ hasInsufficientData = false }: Props) {
  const { isLight } = useTheme();
  const [selectedQuestion, setSelectedQuestion] = useState<string>("When do I feel calmest?");
  const [expandedSeeWhy, setExpandedSeeWhy] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const activeRecord = useMemo(() => {
    return ANALYTICS_REGISTRY[selectedQuestion] || ANALYTICS_REGISTRY["When do I feel calmest?"];
  }, [selectedQuestion]);

  const handleChipSelect = (question: string) => {
    if (question === selectedQuestion) return;
    setIsTransitioning(true);
    setExpandedSeeWhy(false);
    setTimeout(() => {
      setSelectedQuestion(question);
      setIsTransitioning(false);
    }, 120);
  };

  const getCategoryIcon = (iconName: AnalyticsRecord["iconName"]) => {
    switch (iconName) {
      case "moon":
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case "sun":
        return <Sun className="w-5 h-5 text-amber-400" />;
      case "wind":
        return <Wind className="w-5 h-5 text-teal-400" />;
      case "trending":
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "activity":
        return <Activity className="w-5 h-5 text-rose-400" />;
      case "compass":
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case "calendar":
        return <Calendar className="w-5 h-5 text-violet-400" />;
      case "book":
        return <BookOpen className="w-5 h-5 text-pink-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  // Render Mini Visualizations
  const renderVisualization = (vis: AnalyticsVisualization) => {
    switch (vis.type) {
      case "clock-ring": {
        const { peakStartHour, peakEndHour, peakScore, peakLabel, secondaryLabel } = vis.data;
        return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                {/* Background Clock Track */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className={isLight ? "stroke-gray-200" : "stroke-white/10"}
                  strokeWidth="8"
                  fill="none"
                />
                {/* Highlighted Zone Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-teal-400 dark:stroke-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] transition-all duration-700"
                  strokeWidth="10"
                  strokeDasharray={`${((peakEndHour - peakStartHour) / 24) * 301.6} 301.6`}
                  strokeDashoffset={`-${(peakStartHour / 24) * 301.6}`}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              {/* Center Clock Core */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <Clock className="w-5 h-5 text-teal-400 mb-0.5 animate-pulse" />
                <span className="text-xs font-semibold tracking-wide">{peakScore}%</span>
                <span className="text-[10px] text-muted-foreground uppercase">Rate</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 text-left w-full">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                <span className="text-xs font-medium text-teal-400 dark:text-teal-300">{peakLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                24-Hour Circadian Mapping: Your parasympathetic tone rises as evening sets in.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-white/5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                {secondaryLabel}
              </div>
            </div>
          </div>
        );
      }

      case "comparison-bars": {
        const items = vis.data as { name: string; reliefPct: number; sessions: number; avgTime: string; color: string }[];
        return (
          <div className="space-y-3 py-2 px-1">
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    {item.name}
                    <span className="text-[10px] text-muted-foreground">({item.sessions} sessions · {item.avgTime})</span>
                  </span>
                  <span className="font-semibold text-teal-400 dark:text-teal-300">
                    {item.reliefPct}% relief
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700 ease-out`}
                    style={{ width: `${item.reliefPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "sparkline": {
        const { weeks, growthDelta, volatilityDelta } = vis.data;
        return (
          <div className="space-y-4 py-2 px-1">
            {/* SVG Sparkline Curve */}
            <div className="relative h-24 w-full flex items-end">
              <svg viewBox="0 0 400 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Gradient area */}
                <path
                  d="M 0,60 Q 60,50 120,40 T 240,25 T 360,12 L 400,8 L 400,80 L 0,80 Z"
                  fill="url(#sparklineGrad)"
                />
                {/* Glowing line path */}
                <path
                  d="M 0,60 Q 60,50 120,40 T 240,25 T 360,12 L 400,8"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                />
                {/* Recent High Point Pulse */}
                <circle cx="400" cy="8" r="5" fill="#2dd4bf" className="animate-pulse" />
                <circle cx="400" cy="8" r="9" stroke="#2dd4bf" strokeWidth="1.5" fill="none" className="opacity-60" />
              </svg>
            </div>

            {/* Trajectory Milestone Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {weeks.map((w: any, i: number) => (
                <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">{w.label}</span>
                  <span className="text-sm font-semibold text-foreground">{w.score}%</span>
                  <span className="text-[10px] text-teal-400 block">{w.status}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="text-teal-400 font-medium">Trajectory: {growthDelta} overall calm rise</span>
              <span>Stability: {volatilityDelta} emotional swing</span>
            </div>
          </div>
        );
      }

      case "weekly-cards": {
        const { prevWeek, currWeek, improvements } = vis.data;
        return (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prior Period Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  {prevWeek.label}
                </span>
                <div className="text-2xl font-semibold text-muted-foreground/80">{prevWeek.calmScore}%</div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>Sanctuary Pauses:</span>
                    <span className="font-medium text-foreground">{prevWeek.practices} sessions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recovery Duration:</span>
                    <span className="font-medium text-foreground">{prevWeek.recoveryMins} mins avg</span>
                  </div>
                </div>
              </div>

              {/* Current Period Card (Glowing) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/30 shadow-[0_0_20px_rgba(45,212,191,0.08)] space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-teal-400 uppercase tracking-wider">
                    {currWeek.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    +14% Lift
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">{currWeek.calmScore}%</div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-teal-500/20">
                  <div className="flex justify-between">
                    <span>Sanctuary Pauses:</span>
                    <span className="font-medium text-foreground">{currWeek.practices} sessions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recovery Duration:</span>
                    <span className="font-medium text-teal-400">{currWeek.recoveryMins} mins (1.4x faster)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Improvement Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {improvements.map((imp: any, idx: number) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10"
                >
                  <span className="text-muted-foreground">{imp.label}:</span>
                  <span className="font-semibold text-teal-400">{imp.delta}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "recovery-flow": {
        const { steps } = vis.data;
        return (
          <div className="py-3 px-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 relative">
              {steps.map((step: any, idx: number) => (
                <React.Fragment key={idx}>
                  <div className="flex-1 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all text-left space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${step.color} bg-white/[0.02]`}>
                        {step.tag}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Step 0{idx + 1}</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground pt-0.5">{step.title}</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className="flex items-center justify-center py-1 sm:py-0 sm:px-1 text-muted-foreground/50">
                      <ArrowRight className="w-4 h-4 hidden sm:block text-teal-400/70" />
                      <ChevronDown className="w-4 h-4 block sm:hidden text-teal-400/70" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      }

      case "weekly-rhythm": {
        const { days, peakDay, challengingDay } = vis.data;
        return (
          <div className="space-y-4 py-2 px-1">
            <div className="grid grid-cols-7 gap-2">
              {days.map((d: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[90px] ${
                    d.active
                      ? "bg-gradient-to-b from-teal-500/15 to-emerald-500/5 border-teal-500/40 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                      : "bg-white/[0.02] border-white/5"
                  }`}
                >
                  <span className="text-[11px] font-medium text-muted-foreground">{d.day}</span>
                  <div className="w-full flex items-end justify-center h-10 py-1">
                    <div
                      className={`w-3.5 rounded-full transition-all duration-700 ${
                        d.active ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" : "bg-white/20"
                      }`}
                      style={{ height: `${(d.score / 100) * 36}px` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${d.active ? "text-teal-300" : "text-muted-foreground"}`}>
                    {d.score}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 px-1">
              <span className="flex items-center gap-1.5 text-teal-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Peak Recovery: {peakDay}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Focus Window: {challengingDay}
              </span>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative rounded-[20px] border p-6 sm:p-8 backdrop-blur-2xl transition-all duration-[280ms] overflow-hidden ${
        isLight
          ? "bg-gradient-to-b from-white/95 via-gray-50/90 to-white/95 border-gray-200/80 shadow-sm"
          : "bg-gradient-to-b from-card/85 via-card/70 to-card/90 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)]"
      }`}
    >
      {/* Ambient Breathing Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-sanctuary-mist" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-sanctuary-mist" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Athena Reflections</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-foreground">
            Explore your reflections with one tap.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Gentle reflections gathered directly from your verified check-ins, journal entries, and quiet pauses.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Private Stored Telemetry</span>
          </div>
        </div>
      </div>

      {/* Empty State Guard */}
      {hasInsufficientData ? (
        <div className="py-12 px-6 text-center space-y-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto text-teal-400">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">Your patterns are still taking shape.</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Complete a few daily check-ins or a mindful studio session to unlock personalized visual analytics cards.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {["Track my calmest time.", "Compare my next two weeks.", "See what helps after journaling."].map(
              (beginnerChip, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedQuestion("When do I feel calmest?")}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                >
                  {beginnerChip}
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Smart Analytics Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {DEFAULT_CHIP_LIST.map((question) => {
              const isSelected = selectedQuestion === question;
              return (
                <button
                  key={question}
                  onClick={() => handleChipSelect(question)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150 transform active:scale-95 ${
                    isSelected
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_12px_rgba(45,212,191,0.25)] scale-[1.02]"
                      : isLight
                      ? "bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-foreground"
                      : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                  }`}
                >
                  {question}
                </button>
              );
            })}
          </div>

          {/* Generated Visual Analytics Card */}
          <div
            className={`rounded-2xl border p-5 sm:p-7 backdrop-blur-xl transition-all duration-300 ${
              isLight
                ? "bg-white/90 border-gray-200/90 shadow-sm"
                : "bg-card/75 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.24)]"
            } ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getCategoryIcon(activeRecord.iconName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                      {activeRecord.title}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {activeRecord.highlightStat}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{activeRecord.confidence}% Confidence</span>
                </div>
              </div>
            </div>

            {/* Summary Sentence (< 2 lines) */}
            <div className="py-4">
              <p className="text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
                &ldquo;{activeRecord.summary}&rdquo;
              </p>
            </div>

            {/* Mini Visualization Section */}
            <div className="my-2">
              {renderVisualization(activeRecord.visualization)}
            </div>

            {/* Evidence Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-white/5 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span>Based on:</span>
                <span className="font-medium text-foreground">{activeRecord.evidence.checkins} check-ins</span>
                <span>·</span>
                <span className="font-medium text-foreground">{activeRecord.evidence.sessions} Studio sessions</span>
                <span>·</span>
                <span className="font-medium text-foreground">{activeRecord.evidence.journals} journal entries</span>
              </div>

              {/* See Why Button */}
              <button
                onClick={() => setExpandedSeeWhy((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 dark:text-teal-300 hover:underline transition-all"
              >
                <span>{expandedSeeWhy ? "Hide Supporting Evidence" : "See Why & Supporting Timeline"}</span>
                {expandedSeeWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expandable "See Why" Disclosure */}
            {expandedSeeWhy && (
              <div className="mt-5 pt-5 border-t border-white/10 space-y-4 animate-in fade-in-0 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Timeline Moments */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Supporting Observation Timeline
                    </span>
                    <div className="space-y-2">
                      {activeRecord.seeWhy.timelineMoments.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                          <span className="font-mono text-muted-foreground">{m.time}</span>
                          <span className="text-foreground font-medium truncate px-2">{m.event}</span>
                          <span className="text-teal-400 font-semibold">{m.delta}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Breakdown & Practice Launcher */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                        Statistical Baseline
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activeRecord.seeWhy.confidenceReason}
                      </p>
                      <div className="text-xs text-teal-400 font-medium pt-1">
                        {activeRecord.seeWhy.previousPeriodDelta}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={activeRecord.seeWhy.relatedPractice.href}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all"
                      >
                        <span>{activeRecord.seeWhy.relatedPractice.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Suggestions Row */}
            {activeRecord.suggestions && activeRecord.suggestions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground font-medium">Explore related:</span>
                {activeRecord.suggestions.map((sugg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipSelect(sugg)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                  >
                    <span>{sugg}</span>
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
