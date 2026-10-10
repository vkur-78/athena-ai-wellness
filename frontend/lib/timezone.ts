/**
 * Athena Centralized Timezone & Calendar Engine
 * Strictly enforces user's configured timezone (Default: "Asia/Kolkata").
 * Guaranteed zero future date counting, zero UTC week offset misalignments.
 */

export const ATHENA_DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns formatted date string 'YYYY-MM-DD' in the target timezone
 */
export function getZonedDateString(
  dateInput?: string | number | Date | null,
  timeZone: string = ATHENA_DEFAULT_TIMEZONE
): string {
  if (!dateInput) {
    const now = new Date();
    return formatToYMD(now, timeZone);
  }
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return formatToYMD(date, timeZone);
}

function formatToYMD(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date); // en-CA formats as YYYY-MM-DD
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns parts of the current zoned time: hour, minute, dayOfWeek (0=Sun, 1=Mon, ..., 6=Sat)
 */
export function getZonedTimeParts(
  dateInput?: string | number | Date | null,
  timeZone: string = ATHENA_DEFAULT_TIMEZONE
): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  timeOfDay: "Morning" | "Afternoon" | "Evening" | "Night";
} {
  const date = !dateInput
    ? new Date()
    : typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : dateInput;

  const validDate = isNaN(date.getTime()) ? new Date() : date;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    });

    const parts = formatter.formatToParts(validDate);
    let year = validDate.getFullYear();
    let month = validDate.getMonth() + 1;
    let day = validDate.getDate();
    let hour = validDate.getHours();
    let minute = validDate.getMinutes();
    let weekdayStr = "Mon";

    for (const p of parts) {
      if (p.type === "year") year = parseInt(p.value, 10);
      if (p.type === "month") month = parseInt(p.value, 10);
      if (p.type === "day") day = parseInt(p.value, 10);
      if (p.type === "hour") hour = parseInt(p.value, 10);
      if (p.type === "minute") minute = parseInt(p.value, 10);
      if (p.type === "weekday") weekdayStr = p.value;
    }

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = weekdayMap[weekdayStr] ?? 1;

    let timeOfDay: "Morning" | "Afternoon" | "Evening" | "Night";
    if (hour >= 5 && hour < 12) {
      timeOfDay = "Morning";
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = "Afternoon";
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = "Evening";
    } else {
      timeOfDay = "Night";
    }

    return { year, month, day, hour, minute, dayOfWeek, timeOfDay };
  } catch {
    const hour = validDate.getHours();
    let timeOfDay: "Morning" | "Afternoon" | "Evening" | "Night";
    if (hour >= 5 && hour < 12) timeOfDay = "Morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "Evening";
    else timeOfDay = "Night";

    return {
      year: validDate.getFullYear(),
      month: validDate.getMonth() + 1,
      day: validDate.getDate(),
      hour,
      minute: validDate.getMinutes(),
      dayOfWeek: validDate.getDay(),
      timeOfDay,
    };
  }
}

export interface ZonedWeekDay {
  name: string; // 'Mon', 'Tue', ...
  fullName: string; // 'Monday', ...
  dateStr: string; // 'YYYY-MM-DD'
  isPastOrToday: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface ZonedWeekBounds {
  mondayStr: string;
  sundayStr: string;
  todayStr: string;
  days: ZonedWeekDay[];
}

/**
 * Returns current week bounds in the target timezone with Monday as the start.
 * Future days are explicitly flagged with isFuture: true and isPastOrToday: false.
 */
export function getZonedWeekBounds(timeZone: string = ATHENA_DEFAULT_TIMEZONE): ZonedWeekBounds {
  const parts = getZonedTimeParts(new Date(), timeZone);
  const todayStr = getZonedDateString(new Date(), timeZone);

  // Day of week: 0=Sun, 1=Mon, ..., 6=Sat
  // Offset to Monday: if Mon(1)->0, Tue(2)->-1, ..., Sun(0)->-6
  const mondayOffset = parts.dayOfWeek === 0 ? -6 : 1 - parts.dayOfWeek;

  // Approximate today's date in local time
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const days: ZonedWeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const offset = mondayOffset + i;
    const dayDate = new Date(base.getTime() + offset * 86400000);
    const dateStr = formatToYMD(dayDate, timeZone);
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isPastOrToday = dateStr <= todayStr;

    days.push({
      name: dayNames[i],
      fullName: fullDayNames[i],
      dateStr,
      isPastOrToday,
      isToday,
      isFuture,
    });
  }

  const mondayStr = days[0].dateStr;
  const sundayStr = days[6].dateStr;

  return {
    mondayStr,
    sundayStr,
    todayStr,
    days,
  };
}

/**
 * Format relative or localized time in Asia/Kolkata
 */
export function formatZonedTime(
  dateInput: string | number | Date,
  timeZone: string = ATHENA_DEFAULT_TIMEZONE
): string {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

/**
 * Format localized date in Asia/Kolkata, e.g. "Sep 29, 2026"
 */
export function formatZonedDate(
  dateInput: string | number | Date,
  timeZone: string = ATHENA_DEFAULT_TIMEZONE
): string {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
}

/**
 * Returns date range bounds for a given number of days ending today in user timezone.
 * Guarantees zero future dates.
 */
export function getZonedDateRange(
  daysBack: number,
  timeZone: string = ATHENA_DEFAULT_TIMEZONE
): {
  startDateStr: string;
  endDateStr: string;
  allDates: string[];
} {
  const todayStr = getZonedDateString(new Date(), timeZone);
  const parts = getZonedTimeParts(new Date(), timeZone);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  const allDates: string[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400000);
    const ds = formatToYMD(d, timeZone);
    allDates.push(ds);
  }

  return {
    startDateStr: allDates[0] || todayStr,
    endDateStr: todayStr,
    allDates,
  };
}

/**
 * Returns YYYY-MM-DD date string in user's configured timezone
 */
export function toLocalDateString(
  dateInput?: string | number | Date | null,
  timeZone: string = ATHENA_DEFAULT_TIMEZONE
): string {
  return getZonedDateString(dateInput, timeZone);
}

let cachedServerTime: { today: string; serverTime: string; fetchedAt: number } | null = null;

export async function syncServerDate(apiUrl?: string): Promise<string> {
  if (cachedServerTime && Date.now() - cachedServerTime.fetchedAt < 60000) {
    return cachedServerTime.today;
  }
  try {
    const base = apiUrl || process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(`${base.replace(/\/+$/, "")}/system/time`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.today) {
        cachedServerTime = {
          today: data.today,
          serverTime: data.server_time_ist,
          fetchedAt: Date.now(),
        };
        return data.today;
      }
    }
  } catch (err) {
    console.warn("[Server Time Sync Warning]:", err);
  }
  return getZonedDateString(new Date(), ATHENA_DEFAULT_TIMEZONE);
}

export function getServerTodayString(): string {
  if (cachedServerTime) {
    return cachedServerTime.today;
  }
  return getZonedDateString(new Date(), ATHENA_DEFAULT_TIMEZONE);
}


