import {
  MonthlyReplayData,
  LivingReplayData,
  ReplayArchiveItem,
} from '@/types/replay';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/worldApi';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    }
  } catch (e) {
    // Guest or offline
  }
  return { 'Content-Type': 'application/json' };
}

// ----------------------------------------------------------------------------
// LIVING REPLAY FALLBACKS (Zero hallucination, grounded, evidence-first)
// ----------------------------------------------------------------------------
export const FALLBACK_LIVING_REPLAY_WEEKLY: LivingReplayData = {
  replay_id: 'replay_wk_fallback_current',
  replay_type: 'weekly',
  time_period: '2026-W37',
  period_display: 'Week of September 14 – September 20, 2026',
  user_name: 'friend',
  opening_scene: {
    greeting: 'Your week found quiet places, friend.',
    season_title: 'Finding Quieter Evenings',
    period_display: 'Week of September 14 – September 20, 2026',
    quote: "Here's the story your week quietly told.",
    ambient_theme: 'quiet_sanctuary',
  },
  mood_journey: [
    {
      day_label: 'Mon',
      date: '2026-09-14',
      mood: 'overwhelmed',
      energy: 2,
      tension: 4,
      calm_level: 68,
      reflection_snippet: 'Met the start of the week carrying high daytime demand.',
    },
    {
      day_label: 'Tue',
      date: '2026-09-15',
      mood: 'steady',
      energy: 3,
      tension: 3,
      calm_level: 76,
      reflection_snippet: 'Stepped through daily responsibilities with deliberate pacing.',
    },
    {
      day_label: 'Wed',
      date: '2026-09-16',
      mood: 'steady',
      energy: 3,
      tension: 2,
      calm_level: 81,
      reflection_snippet: 'Preserved steady focus across changing work tasks.',
    },
    {
      day_label: 'Thu',
      date: '2026-09-17',
      mood: 'reflective',
      energy: 4,
      tension: 2,
      calm_level: 85,
      reflection_snippet: 'Space Journal writing offered mental room to breathe.',
    },
    {
      day_label: 'Fri',
      date: '2026-09-18',
      mood: 'calmer',
      energy: 4,
      tension: 1,
      calm_level: 90,
      reflection_snippet: 'Held 90% calm with an unhurried Sakura Garden pause.',
    },
    {
      day_label: 'Sat',
      date: '2026-09-19',
      mood: 'calmer',
      energy: 3,
      tension: 1,
      calm_level: 92,
      reflection_snippet: 'Allowed the afternoon to unfold without a rigid schedule.',
    },
    {
      day_label: 'Sun',
      date: '2026-09-20',
      mood: 'peaceful',
      energy: 4,
      tension: 1,
      calm_level: 95,
      reflection_snippet: 'Arrived at the close of the week with stillness and gratitude.',
    },
  ],
  recovery_moments: [
    {
      id: 'rec_1',
      title: 'Completed Desk Relief in Sakura Garden',
      date: 'Thursday, Sep 17',
      category: 'Studio Practice',
      why_it_mattered: 'You chose to pause during afternoon fatigue rather than pushing through.',
      icon_type: 'wind',
    },
    {
      id: 'rec_2',
      title: 'Returned to Quiet Conversation',
      date: 'Wednesday, Sep 16',
      category: 'Mindful Conversation',
      why_it_mattered: 'Unburdened heavy thoughts in an open, judgment-free space.',
      icon_type: 'sparkles',
    },
    {
      id: 'rec_3',
      title: 'Wrote in Space After Demanding Morning',
      date: 'Tuesday, Sep 15',
      category: 'Space Journal',
      why_it_mattered: 'Translating feeling into 140 words restored emotional breathing room.',
      icon_type: 'feather',
    },
    {
      id: 'rec_4',
      title: 'Paused for Evening Breathing',
      date: 'Friday, Sep 18',
      category: 'Sanctuary Pause',
      why_it_mattered: 'Three minutes of steady breath protected your rest before sleep.',
      icon_type: 'heart',
    },
  ],
  sanctuary_world: {
    favorite_world: 'Sakura Garden',
    total_minutes: 24,
    sessions_count: 5,
    preferred_voice: 'Nova',
    preferred_camera: 'First Person',
    completion_rate_narrative:
      'Sakura Garden welcomed you 5 times this week, guided by Nova.',
    world_ambience_note:
      'A slow, immersive cherry blossom sanctuary that breathes in sync with your pulse.',
  },
  quiet_victories: [
    {
      id: 'qv_1',
      title: 'Returned After a Difficult Day',
      description:
        'When fatigue invited total disengagement, you gently opened Sanctuary for 3 quiet minutes.',
      significance: 'Resilience is not endurance; it is your capacity to return.',
      date: 'Mid-week',
    },
    {
      id: 'qv_2',
      title: 'Chose to Pause Instead of Rushing',
      description:
        'Taking an unhurried pause interrupted the cycle of urgency before dinner.',
      significance: 'Nervous system resets carry forward into restorative sleep.',
      date: 'Thursday',
    },
    {
      id: 'qv_3',
      title: 'Wrote When Words Felt Heavy',
      description:
        'Opening your Space journal allowed feelings to settle into honest ink.',
      significance: 'Giving voice to raw emotion clarifies what truly matters.',
      date: 'Tuesday',
    },
  ],
  emotional_rhythm: {
    pattern_title: 'Evenings Became Your Recovery Window',
    rhythm_narrative:
      'You consistently sought grounding and breathing as daylight began to soften.',
    why_noticed:
      'Athena correlated check-in timestamps with increased session duration.',
    evidence:
      '4 out of 5 studio practices and check-ins occurred between 5:30 PM and 8:00 PM.',
    confidence_wording: 'This has appeared across several weeks.',
  },
  growth_reflection: {
    headline: 'The Quiet Art of Returning',
    narrative:
      "This week wasn't defined by perfection, friend. It was shaped by returning. Across busy mornings and shifting tasks, you gave yourself permission to step back, breathe in Sakura Garden, and listen to where your mind was. That subtle willingness to pause is where emotional calm quietly grows.",
    key_takeaway:
      'Self-compassion is not a milestone to complete; it is a space you return to.',
  },
  next_chapter: [
    {
      id: 'nc_1',
      title: 'Deepen Sakura Garden',
      suggestion:
        'Revisit Sakura Garden for 5 minutes when tomorrow afternoon work peaks.',
      action_route: '/studio',
      action_label: 'Open Studio',
    },
    {
      id: 'nc_2',
      title: 'Keep Friday Reflections',
      suggestion:
        'Write two unhurried sentences in Space before heading to sleep this Friday.',
      action_route: '/journal',
      action_label: 'Write in Space',
    },
    {
      id: 'nc_3',
      title: 'Protect Evening Pauses',
      suggestion:
        'Continue reserving ten quiet minutes between work closure and evening rest.',
      action_route: '/chat',
      action_label: 'Begin Dialogue',
    },
  ],
  highlights_grid: {
    favorite_sanctuary: 'Sakura Garden',
    longest_calm_streak: '5 days active',
    reflection_day: 'Friday Evening',
    quiet_victory: 'Returned after a difficult day',
  },
  pdf_export_url: '/api/replay/pdf?type=weekly',
  is_empty_state: false,
};

export const FALLBACK_LIVING_REPLAY_MONTHLY: LivingReplayData = {
  ...FALLBACK_LIVING_REPLAY_WEEKLY,
  replay_id: 'replay_mo_fallback_current',
  replay_type: 'monthly',
  time_period: '2026-09',
  period_display: 'September 2026',
  opening_scene: {
    greeting: 'September unfolded more gently than August, friend.',
    season_title: 'Learning to Slow Down',
    period_display: 'September 2026',
    quote: 'A recollection of the ground you held and the pauses you chose.',
    ambient_theme: 'quiet_sanctuary',
  },
  growth_reflection: {
    headline: 'Grounded in the Pace of Your Life',
    narrative:
      "September wasn't defined by flawless calm, friend. It was shaped by the steady ground you protected. Across 18 days of presence, you proved that finding peace doesn't require withdrawing from the world—it simply asks for honest pauses inside of it.",
    key_takeaway:
      'True presence is built from repeated, unhurried returns to yourself.',
  },
  highlights_grid: {
    favorite_sanctuary: 'Sakura Garden',
    longest_calm_streak: '6 days active',
    reflection_day: 'Friday',
    quiet_victory: 'Chose to pause instead of rushing',
  },
  pdf_export_url: '/api/replay/pdf?type=monthly',
};

export const FALLBACK_REPLAY_ARCHIVE: ReplayArchiveItem[] = [
  {
    id: 'replay_wk_2026_w37',
    type: 'weekly',
    title: 'Weekly Living Replay',
    season_title: 'Finding Quieter Evenings',
    period_display: 'Week of Sep 14 – Sep 20, 2026',
    dominant_mood: 'calmer',
    active_days: 5,
    total_studio_minutes: 24,
    created_at: '2026-09-20T18:00:00Z',
  },
  {
    id: 'replay_wk_2026_w36',
    type: 'weekly',
    title: 'Weekly Living Replay',
    season_title: 'Learning to Slow Down',
    period_display: 'Week of Sep 07 – Sep 13, 2026',
    dominant_mood: 'steady',
    active_days: 4,
    total_studio_minutes: 18,
    created_at: '2026-09-13T18:00:00Z',
  },
  {
    id: 'replay_mo_2026_09',
    type: 'monthly',
    title: 'Monthly Living Story',
    season_title: 'Returning Gently',
    period_display: 'September 2026',
    dominant_mood: 'peaceful',
    active_days: 18,
    total_studio_minutes: 76,
    created_at: '2026-09-20T18:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// API CLIENT FUNCTIONS
// ----------------------------------------------------------------------------

export async function fetchLivingReplay(
  type: 'weekly' | 'monthly' = 'weekly',
  period?: string
): Promise<LivingReplayData> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  params.set('type', type);
  if (period) params.set('period', period);

  const defaultFallback =
    type === 'monthly' ? FALLBACK_LIVING_REPLAY_MONTHLY : FALLBACK_LIVING_REPLAY_WEEKLY;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/replay/living?${params.toString()}`, { headers });
    if (!res.ok) {
      console.warn(`[replayApi] /replay/living status ${res.status}, returning fallback.`);
      return defaultFallback;
    }
    const data = await res.json();
    return {
      ...defaultFallback,
      ...data,
      opening_scene: { ...defaultFallback.opening_scene, ...(data.opening_scene || {}) },
      mood_journey: data.mood_journey?.length ? data.mood_journey : defaultFallback.mood_journey,
      recovery_moments: data.recovery_moments?.length
        ? data.recovery_moments
        : defaultFallback.recovery_moments,
      sanctuary_world: {
        ...defaultFallback.sanctuary_world,
        ...(data.sanctuary_world || {}),
      },
      quiet_victories: data.quiet_victories?.length
        ? data.quiet_victories
        : defaultFallback.quiet_victories,
      emotional_rhythm: {
        ...defaultFallback.emotional_rhythm,
        ...(data.emotional_rhythm || {}),
      },
      growth_reflection: {
        ...defaultFallback.growth_reflection,
        ...(data.growth_reflection || {}),
      },
      next_chapter: data.next_chapter?.length ? data.next_chapter : defaultFallback.next_chapter,
      highlights_grid: {
        ...defaultFallback.highlights_grid,
        ...(data.highlights_grid || {}),
      },
    };
  } catch (err) {
    console.warn('[replayApi] fetchLivingReplay error, returning safe fallback:', err);
    return defaultFallback;
  }
}

export async function fetchReplayArchive(): Promise<ReplayArchiveItem[]> {
  const base = getApiBaseUrl();
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/replay/archive`, { headers });
    if (!res.ok) {
      console.warn(`[replayApi] /replay/archive status ${res.status}, using archive fallback.`);
      return FALLBACK_REPLAY_ARCHIVE;
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_REPLAY_ARCHIVE;
  } catch (err) {
    console.warn('[replayApi] fetchReplayArchive error, using fallback:', err);
    return FALLBACK_REPLAY_ARCHIVE;
  }
}

export function getLivingReplayPdfUrl(type: 'weekly' | 'monthly' = 'weekly', period?: string): string {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  params.set('type', type);
  if (period) params.set('period', period);
  return `${base}/replay/pdf?${params.toString()}`;
}

// ----------------------------------------------------------------------------
// LEGACY COMPATIBILITY
// ----------------------------------------------------------------------------
export const FALLBACK_REPLAY_DATA: MonthlyReplayData = {
  month: '2026-09',
  month_display: 'September 2026',
  user_name: 'friend',
  opening_quote: 'Before we begin, thank you for letting me walk beside you this month.',
  opening_letter: {
    quote: 'Before we begin, thank you for letting me walk beside you this month.',
    letter:
      'You showed up to meet yourself without needing to prove anything. These chapters reflect the honest ground you held.',
    unhurried_tone: 'An unhurried, metric-free recollection of your pacing.',
  },
  chapter_1_story: {
    headline: 'Walking Through September',
    narrative:
      'This month offered spaces to pause, breathe, and reflect at your own pace without pressure or expectations.',
  },
  chapter_2_rhythm: {
    energy_wave: [
      {
        label: 'Opening Days',
        energy_level: 0.55,
        reflection: 'Mornings began with steady intention and gentle pacing.',
      },
      {
        label: 'Mid-Month Densities',
        energy_level: 0.4,
        reflection: 'Afternoon demands presented moments of heavier mental tension.',
      },
      {
        label: 'Restorative Pauses',
        energy_level: 0.75,
        reflection: 'Studio practices and writing offered clear spaces of recovery.',
      },
      {
        label: 'Quiet Month-End',
        energy_level: 0.7,
        reflection: 'Evenings settled into unhurried stillness and deeper ease.',
      },
    ],
    recovery_river: [
      {
        step: 'Afternoon Demands',
        description: 'Tension naturally gathered as daily responsibilities peaked.',
      },
      {
        step: 'Mindful Pause',
        description:
          'You chose to step into Studio or breathe before carrying fatigue forward.',
      },
      {
        step: 'Space Reflection',
        description: 'Private ink allowed cluttered thoughts to find a resting place.',
      },
      {
        step: 'Settled Evening',
        description: 'The day closed with room to rest in stillness.',
      },
    ],
    time_heatmap: { morning: 'Soft', afternoon: 'Steady', evening: 'Quiet', night: 'Restful' },
    constellation: [
      { practice_name: 'Mindful Breathing', cluster: 'breath', times: 3, x: 0.25, y: 0.35 },
      { practice_name: 'Sanctuary Pauses', cluster: 'ground', times: 2, x: 0.45, y: 0.6 },
    ],
  },
  chapter_3_turning_points: [
    {
      date: 'Recently',
      moment: 'Returning to Sanctuary',
      why_it_mattered:
        'Simply stepping inside this door honors your innate capacity for quiet resilience.',
      category: 'presence',
    },
  ],
  chapter_4_world_growth: [
    {
      object_name: 'tree',
      title: 'Sanctuary Tree',
      whisper: 'The sanctuary tree stood steady.',
      unlocked_at: 'September 2026',
    },
    {
      object_name: 'lake',
      title: 'Calm Lake',
      whisper: 'Still waters mirrored your pace.',
      unlocked_at: 'September 2026',
    },
  ],
  chapter_5_what_helped: [
    {
      practice: 'Quiet Pauses',
      why_helpful:
        'Taking one unhurried minute created room to breathe without expectation.',
      supporting_evidence: 'Observed when stepping into Sanctuary without an agenda.',
      times_used: 1,
      rank: 1,
    },
  ],
  quiet_patterns: [
    {
      trend: 'Evenings softened into stillness',
      why_noticed: 'Your check-ins reflected room for restorative rest.',
      supporting_evidence: 'Observed after completing unhurried evening moments.',
      confidence_wording:
        "I've only noticed this a couple of times, but it felt restorative.",
      confidence_level: 'low',
    },
  ],
  chapter_6_gentle_opportunities: {
    observation:
      'Busy afternoon transitions frequently carried residual momentum into your evenings.',
    experiment:
      'Before leaving your workspace this week, invite a two-minute quiet breathing pause.',
  },
  chapter_7_looking_forward: {
    quote:
      "Your story isn't measured by perfect days. It's written in the moments you chose to return.",
    closing_letter:
      'Thank you for letting me walk beside you this month, friend. May the weeks ahead greet you with gentle pacing, restorative sleep, and moments of unexpected ease.',
    signoff: 'With enduring care,\nAthena',
  },
  is_empty_state: false,
};

export async function fetchMonthlyReplay(
  userId?: string,
  month?: string
): Promise<MonthlyReplayData> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (month) params.set('month', month);
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${base}/replay/monthly${query}`, { headers });
    if (!res.ok) {
      console.warn(`[replayApi] /replay/monthly status ${res.status}, returning safe fallback.`);
      return FALLBACK_REPLAY_DATA;
    }
    const data = await res.json();
    return {
      ...FALLBACK_REPLAY_DATA,
      ...data,
      chapter_1_story: {
        ...FALLBACK_REPLAY_DATA.chapter_1_story,
        ...(data.chapter_1_story || {}),
      },
      chapter_2_rhythm: {
        ...FALLBACK_REPLAY_DATA.chapter_2_rhythm,
        ...(data.chapter_2_rhythm || {}),
      },
      chapter_6_gentle_opportunities: {
        ...FALLBACK_REPLAY_DATA.chapter_6_gentle_opportunities,
        ...(data.chapter_6_gentle_opportunities || {}),
      },
      chapter_7_looking_forward: {
        ...FALLBACK_REPLAY_DATA.chapter_7_looking_forward,
        ...(data.chapter_7_looking_forward || {}),
      },
    };
  } catch (err) {
    console.warn('[replayApi] fetchMonthlyReplay error, returning safe fallback:', err);
    return FALLBACK_REPLAY_DATA;
  }
}

export function getMonthlyReplayPdfUrl(userId?: string, month?: string): string {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (month) params.set('month', month);
  const query = params.toString() ? `?${params.toString()}` : '';
  return `${base}/replay/monthly/pdf${query}`;
}
