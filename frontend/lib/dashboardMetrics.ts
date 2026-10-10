import { CheckinResponse } from "@/types/checkin";
import { RecentMoment } from "@/types/studio";
import { JournalEntry } from "@/types/journal";
import { getZonedDateString, getZonedWeekBounds, ATHENA_DEFAULT_TIMEZONE } from "@/lib/timezone";

/**
 * Normalizes any ISO or date string to local YYYY-MM-DD in user's configured timezone (Asia/Kolkata)
 */
export function toLocalDateString(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  return getZonedDateString(dateInput, ATHENA_DEFAULT_TIMEZONE);
}

/**
 * Calculate actual presence streak strictly from database check-ins.
 * Never uses placeholder numbers.
 * Example:
 * - Today completed + yesterday completed = 2 day streak
 * - Today not yet completed + yesterday completed = 1 day streak (waiting for today)
 * - Neither today nor yesterday = 0 day streak
 */
export function calculateActualStreak(
  checkinHistory: CheckinResponse[],
  todayCheckin: CheckinResponse | null
): number {
  const completedDates = new Set<string>();

  checkinHistory.forEach((c) => {
    const ds = toLocalDateString(c.date || c.created_at);
    if (ds) completedDates.add(ds);
  });

  if (todayCheckin) {
    const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || new Date());
    if (todayDs) completedDates.add(todayDs);
  }

  const today = new Date();
  const todayStr = toLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  let streak = 0;
  let currentDate = new Date(today);

  if (completedDates.has(todayStr)) {
    // Streak starts from today
    while (true) {
      const checkStr = toLocalDateString(currentDate);
      if (completedDates.has(checkStr)) {
        streak += 1;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (completedDates.has(yesterdayStr)) {
    // Today not yet done, but yesterday was: count backwards from yesterday
    currentDate = new Date(yesterday);
    while (true) {
      const checkStr = toLocalDateString(currentDate);
      if (completedDates.has(checkStr)) {
        streak += 1;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return streak;
}

/**
 * Calculates human-readable relative time of last activity.
 * Example: "Last visited 18 hours ago" or "Last visited 2 hours ago" or "First visit today"
 */
export function calculateLastVisit(
  checkinHistory: CheckinResponse[] = [],
  todayCheckin: CheckinResponse | null = null,
  recentMoments: RecentMoment[] = [],
  recentJournals: JournalEntry[] = [],
  conversations: any[] = []
): string {
  const timestamps: number[] = [];

  const addTime = (val: string | Date | undefined | null) => {
    if (!val) return;
    const t = new Date(val).getTime();
    if (!isNaN(t) && t <= Date.now()) {
      timestamps.push(t);
    }
  };

  if (todayCheckin) addTime(todayCheckin.created_at || todayCheckin.date);
  checkinHistory.forEach((c) => addTime(c.created_at || c.date));
  recentMoments.forEach((m) => addTime(m.created_at));
  recentJournals.forEach((j) => addTime(j.created_at));
  conversations.forEach((conv) => addTime(conv.updated_at || conv.created_at));

  if (timestamps.length === 0) {
    return "First visit today";
  }

  const latestTime = Math.max(...timestamps);
  const diffMs = Date.now() - latestTime;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 5) {
    return "Last visited just now";
  }
  if (diffMinutes < 60) {
    return `Last visited ${diffMinutes} min ago`;
  }
  if (diffHours === 1) {
    return "Last visited 1 hour ago";
  }
  if (diffHours < 24) {
    return `Last visited ${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return "Last visited yesterday";
  }
  return `Last visited ${diffDays} days ago`;
}

export interface WeekBounds {
  monday: Date;
  sunday: Date;
  today: Date;
  mondayStr: string;
  sundayStr: string;
  todayStr: string;
}

/**
 * Returns current week bounds based on Asia/Kolkata timezone.
 * Monday is the start of the week. Today is the maximum allowed completed date.
 * Future dates (e.g. Wednesday through Sunday when today is Tuesday) are NEVER counted as completed.
 */
export function getCurrentWeekBounds(): WeekBounds {
  const zoned = getZonedWeekBounds(ATHENA_DEFAULT_TIMEZONE);
  const now = new Date();

  return {
    monday: new Date(zoned.mondayStr + "T00:00:00"),
    sunday: new Date(zoned.sundayStr + "T23:59:59"),
    today: now,
    mondayStr: zoned.mondayStr,
    sundayStr: zoned.sundayStr,
    todayStr: zoned.todayStr,
  };
}

/**
 * Calculates check-ins strictly inside the current week (Monday <= date <= today).
 * Deduplicates by calendar day (one per day).
 * Future days are NEVER counted.
 */
export function calculateCurrentWeekCheckins(
  checkinHistory: CheckinResponse[] = [],
  todayCheckin: CheckinResponse | null = null
): {
  count: number;
  dates: string[];
  records: CheckinResponse[];
} {
  const bounds = getCurrentWeekBounds();
  const map = new Map<string, CheckinResponse>();

  checkinHistory.forEach((c) => {
    const ds = toLocalDateString(c.date || c.created_at);
    if (ds && ds >= bounds.mondayStr && ds <= bounds.todayStr) {
      if (!map.has(ds)) map.set(ds, c);
    }
  });

  if (todayCheckin) {
    const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || new Date());
    if (todayDs && todayDs >= bounds.mondayStr && todayDs <= bounds.todayStr) {
      map.set(todayDs, todayCheckin);
    }
  }

  const records = Array.from(map.values());
  return {
    count: records.length,
    dates: Array.from(map.keys()),
    records,
  };
}

/**
 * Filters journals to strictly the current week (Monday <= timestamp <= today).
 */
export function calculateCurrentWeekJournals(
  recentJournals: JournalEntry[] = []
): {
  count: number;
  records: JournalEntry[];
} {
  const bounds = getCurrentWeekBounds();
  const records = recentJournals.filter((j) => {
    if (!j.created_at) return false;
    const ds = toLocalDateString(j.created_at);
    return ds >= bounds.mondayStr && ds <= bounds.todayStr;
  });

  return {
    count: records.length,
    records,
  };
}

/**
 * Filters practices to strictly the current week (Monday <= timestamp <= today).
 */
export function calculateCurrentWeekPractices(
  recentMoments: RecentMoment[] = []
): {
  count: number;
  records: RecentMoment[];
} {
  const bounds = getCurrentWeekBounds();
  const records = recentMoments.filter((m) => {
    const timeVal = m.created_at || (m as any).started_at;
    if (!timeVal) return false;
    const ds = toLocalDateString(timeVal);
    return ds >= bounds.mondayStr && ds <= bounds.todayStr;
  });

  return {
    count: records.length,
    records,
  };
}

/**
 * Filters conversations to strictly the current week (Monday <= timestamp <= today).
 */
export function calculateCurrentWeekConversations(
  conversations: any[] = []
): {
  count: number;
  records: any[];
} {
  const bounds = getCurrentWeekBounds();
  const records = conversations.filter((c) => {
    const timeVal = c.updated_at || c.created_at;
    if (!timeVal) return false;
    const ds = toLocalDateString(timeVal);
    return ds >= bounds.mondayStr && ds <= bounds.todayStr;
  });

  return {
    count: records.length,
    records,
  };
}

/**
 * Real journal activity this week (Monday to Sunday)
 * Example: "2 entries this week" or "Your space is waiting."
 */
export function calculateJournalActivity(recentJournals: JournalEntry[] = []): {
  countThisWeek: number;
  displayText: string;
  isWaiting: boolean;
} {
  const { count: countThisWeek } = calculateCurrentWeekJournals(recentJournals);

  if (countThisWeek === 0) {
    return {
      countThisWeek: 0,
      displayText: "Your space is waiting.",
      isWaiting: true,
    };
  }

  return {
    countThisWeek,
    displayText: `${countThisWeek} ${countThisWeek === 1 ? "entry" : "entries"} this week`,
    isWaiting: false,
  };
}

/**
 * Real practice activity
 * Example: "Breathing • Yesterday" or "No practices yet this week"
 */
export function calculatePracticeActivity(recentMoments: RecentMoment[] = []): {
  displayText: string;
  subtext: string;
  hasPractice: boolean;
} {
  if (recentMoments.length === 0) {
    return {
      displayText: "No practices yet this week",
      subtext: "Studio is ready when you need a pause",
      hasPractice: false,
    };
  }

  const latest = recentMoments[0];
  const title = latest.title?.replace(/Practice|Exercise/gi, "").trim() || "Breathing";

  let relativeTime = "Recently";
  if (latest.created_at) {
    const now = new Date();
    const d = new Date(latest.created_at);
    const todayStr = toLocalDateString(now);
    const itemStr = toLocalDateString(d);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    if (itemStr === todayStr) {
      relativeTime = "Today";
    } else if (itemStr === yesterdayStr) {
      relativeTime = "Yesterday";
    } else {
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      relativeTime = diffDays > 1 ? `${diffDays} days ago` : "Earlier this week";
    }
  }

  return {
    displayText: `${title} • ${relativeTime}`,
    subtext: "Somatic grounding practice recorded",
    hasPractice: true,
  };
}

export type TimelineDotState =
  | "Completed"
  | "Journaled"
  | "Practice"
  | "Conversation"
  | "Missed"
  | "Upcoming";

export interface DayTimelineNode {
  name: string; // Mon, Tue, etc.
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean;
  state: TimelineDotState;
  activities: string[];
  mood?: string | null;
  timeLabel?: string | null;
}

/**
 * 7-Day Timeline Ribbon synced strictly with database records
 * States: Completed, Journaled, Practice, Conversation, Missed, Upcoming
 */
export function calculateWeeklyTimeline(
  checkinHistory: CheckinResponse[] = [],
  todayCheckin: CheckinResponse | null = null,
  recentMoments: RecentMoment[] = [],
  recentJournals: JournalEntry[] = [],
  conversations: any[] = []
): { days: DayTimelineNode[]; completedCount: number } {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Map checkins by YYYY-MM-DD
  const checkinMap = new Map<string, CheckinResponse>();
  checkinHistory.forEach((c) => {
    const ds = toLocalDateString(c.date || c.created_at);
    if (ds && !checkinMap.has(ds)) checkinMap.set(ds, c);
  });
  if (todayCheckin) {
    const todayDs = toLocalDateString(todayCheckin.date || todayCheckin.created_at || now);
    if (todayDs) checkinMap.set(todayDs, todayCheckin);
  }

  // Map moments by YYYY-MM-DD
  const momentMap = new Map<string, string>();
  recentMoments.forEach((m) => {
    const ds = toLocalDateString(m.created_at);
    if (ds && !momentMap.has(ds)) {
      momentMap.set(ds, m.title || "Studio Practice");
    }
  });

  // Map journals by YYYY-MM-DD
  const journalSet = new Set<string>();
  recentJournals.forEach((j) => {
    const ds = toLocalDateString(j.created_at);
    if (ds) journalSet.add(ds);
  });

  // Map conversations by YYYY-MM-DD
  const conversationSet = new Set<string>();
  conversations.forEach((conv) => {
    const ds = toLocalDateString(conv.updated_at || conv.created_at);
    if (ds) conversationSet.add(ds);
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayStr = toLocalDateString(now);

  const days: DayTimelineNode[] = dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toLocalDateString(d);

    const isToday = dateStr === todayStr;
    const isPast = d < now && !isToday;
    const isFuture = d > now && !isToday;

    const checkin = checkinMap.get(dateStr);
    const isCompleted = Boolean(checkin);
    const hasJournal = journalSet.has(dateStr);
    const practiceName = momentMap.get(dateStr);
    const hasPractice = Boolean(practiceName);
    const hasConversation = conversationSet.has(dateStr);

    const activities: string[] = [];
    if (isCompleted) activities.push("Check-in");
    if (hasJournal) activities.push("Journal");
    if (hasPractice) activities.push(practiceName || "Practice");
    if (hasConversation) activities.push("Conversation");

    // Dot primary state
    let state: TimelineDotState = "Upcoming";
    if (isCompleted) {
      state = "Completed";
    } else if (hasJournal) {
      state = "Journaled";
    } else if (hasPractice) {
      state = "Practice";
    } else if (hasConversation) {
      state = "Conversation";
    } else if (isPast) {
      state = "Missed";
    } else {
      state = "Upcoming";
    }

    let timeLabel: string | null = null;
    if (checkin?.created_at || checkin?.date) {
      try {
        const rawTime = new Date(checkin.created_at || checkin.date);
        timeLabel = rawTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      } catch {}
    }

    return {
      name,
      dateStr,
      isToday,
      isPast,
      isFuture,
      isCompleted,
      state,
      activities,
      mood: checkin?.mood || null,
      timeLabel,
    };
  });

  const completedCount = days.filter((d) => d.isCompleted).length;

  return { days, completedCount };
}

export interface GentleReflectionItem {
  id: string;
  text: string;
  source: "journal" | "practice" | "checkin" | "quiet";
}

/**
 * Section 5 — Gentle Reflection (Replaces "Observations")
 * Maximum 2 reflections generated strictly from real data. Never fabricate numbers.
 */
export function calculateGentleReflections(
  checkinHistory: CheckinResponse[] = [],
  todayCheckin: CheckinResponse | null = null,
  recentMoments: RecentMoment[] = [],
  recentJournals: JournalEntry[] = []
): GentleReflectionItem[] {
  const reflections: GentleReflectionItem[] = [];

  const now = new Date();
  const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const checkinsThisWeek = checkinHistory.filter((c) => {
    const rawDate = c.date || c.created_at;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    return d >= monday;
  }).length + (todayCheckin ? 1 : 0);

  // Real wins check:
  // 1. First journal after difficult day
  const hadDifficultCheckin = checkinHistory.some((c) => {
    const m = (c.mood || "").toLowerCase();
    return m.includes("stress") || m.includes("anx") || m.includes("heavy") || (c.stress_level && c.stress_level >= 3);
  });
  if (hadDifficultCheckin && recentJournals.length > 0) {
    reflections.push({
      id: "win-journal-after-stress",
      text: "First journal after difficult day",
      source: "journal",
    });
  }

  // 2. Three check-ins this week
  if (checkinsThisWeek >= 3 && reflections.length < 2) {
    reflections.push({
      id: "win-checkins-3",
      text: "Three check-ins this week",
      source: "checkin",
    });
  }

  // 3. Returned after a break
  let returnedAfterBreak = false;
  if (checkinHistory.length >= 2) {
    const dates = checkinHistory
      .map((c) => new Date(c.date || c.created_at || "").getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => b - a);
    if (dates.length >= 2 && dates[0] - dates[1] > 2 * 86400000) {
      returnedAfterBreak = true;
    }
  }
  if (returnedAfterBreak && reflections.length < 2) {
    reflections.push({
      id: "win-returned-after-break",
      text: "Returned after a break",
      source: "checkin",
    });
  }

  // 4. Two calming practices completed
  if (recentMoments.length >= 2 && reflections.length < 2) {
    reflections.push({
      id: "win-practices-2",
      text: "Two calming practices completed",
      source: "practice",
    });
  } else if (recentMoments.length === 1 && reflections.length < 2) {
    reflections.push({
      id: "win-practice-1",
      text: "Calming practice completed",
      source: "practice",
    });
  }

  // Fallback strictly according to Phase 8.2 prompt: "More entries unlock this insight."
  while (reflections.length < 2) {
    reflections.push({
      id: `fallback-${reflections.length}`,
      text: "More entries unlock this insight.",
      source: "quiet",
    });
  }

  // Strictly maximum 2 reflections
  return reflections.slice(0, 2);
}

