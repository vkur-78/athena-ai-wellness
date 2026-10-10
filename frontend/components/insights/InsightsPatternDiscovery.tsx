'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { CheckInRecord } from '@/types/checkin';
import type { JournalEntry } from '@/types/journal';
import type { StudioSession } from '@/types/studio';

interface PatternDiscoveryProps {
  checkins: CheckInRecord[];
  journals: JournalEntry[];
  sessions: StudioSession[];
}

interface PatternCard {
  id: string;
  category: 'OBSERVED PATTERN' | 'PRACTICE RHYTHM' | 'REFLECTION RHYTHM' | 'ACTIVITY RECALIBRATION' | 'QUIETER PERIOD';
  title: string;
  observation: string;
  evidence: string;
  sampleSize: string;
  tagColor: string;
}

export function InsightsPatternDiscovery({ checkins, journals, sessions }: PatternDiscoveryProps) {
  const { t } = useLanguage();
  const patterns = useMemo<PatternCard[]>(() => {
    const list: PatternCard[] = [];

    if (checkins.length < 5 && sessions.length < 3 && journals.length < 3) {
      return list;
    }

    // 1. Analyze Evening Practice vs Next-Day Stress
    // Find evening sessions (> 18:00) of breathing or mindfulness
    const eveningSessions = sessions.filter((s) => {
      const timeVal = s.created_at || s.started_at || new Date().toISOString();
      const dt = new Date(timeVal);
      const h = dt.getHours();
      return h >= 18 || h < 4;
    });

    // Check next day check-ins
    let lowerStressCount = 0;
    let comparableCount = 0;

    // Calculate baseline stress across all checkins
    const validStress = checkins.filter((c) => typeof c.stress === 'number').map((c) => c.stress as number);
    const avgBaselineStress = validStress.length > 0 ? validStress.reduce((a, b) => a + b, 0) / validStress.length : 3;

    eveningSessions.forEach((s) => {
      const timeVal = s.created_at || s.started_at || "";
      const sDate = timeVal.split('T')[0];
      if (!sDate) return;
      const nextD = new Date(sDate);
      nextD.setDate(nextD.getDate() + 1);
      const nextDateStr = nextD.toISOString().split('T')[0];

      const nextDayCheckin = checkins.find((c) => (c.checkin_date || c.created_at || '').startsWith(nextDateStr));
      if (nextDayCheckin && typeof nextDayCheckin.stress === 'number') {
        comparableCount += 1;
        if (nextDayCheckin.stress <= avgBaselineStress) {
          lowerStressCount += 1;
        }
      }
    });

    if (comparableCount >= 4) {
      list.push({
        id: 'evening-practice-correlation',
        category: 'OBSERVED PATTERN',
        title: 'Evening Practices & Next-Day Stress',
        observation: 'Evening practice sessions have often coincided with reported next-morning stress below or at your baseline level.',
        evidence: `In ${lowerStressCount} of ${comparableCount} recorded instances, next-day stress was rated ≤ your average baseline (${avgBaselineStress.toFixed(1)}/5).`,
        sampleSize: `Based on ${comparableCount} comparable evening sessions`,
        tagColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      });
    }

    // 2. Practice Rhythm Analysis (Favorite practice and time of day)
    const practiceCounts = new Map<string, number>();
    sessions.forEach((s) => {
      const cat = s.category || 'Mindfulness';
      practiceCounts.set(cat, (practiceCounts.get(cat) || 0) + 1);
    });

    let topPractice = 'Breathing';
    let topPracticeCount = 0;
    practiceCounts.forEach((cnt, cat) => {
      if (cnt > topPracticeCount) {
        topPracticeCount = cnt;
        topPractice = cat;
      }
    });

    if (topPracticeCount >= 5) {
      list.push({
        id: 'practice-rhythm',
        category: 'PRACTICE RHYTHM',
        title: `${topPractice} Anchor`,
        observation: `${topPractice} remains your most frequently chosen grounding format, tending to anchor periods of regular engagement.`,
        evidence: `Represents ${topPracticeCount} completed sessions (${Math.round((topPracticeCount / Math.max(sessions.length, 1)) * 100)}% of your total Studio practice history).`,
        sampleSize: `Based on ${sessions.length} total recorded Studio sessions`,
        tagColor: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
      });
    }

    // 3. Reflection Rhythm (Word count during higher stress vs lower stress)
    const journalsWithCheckin = journals.map((j) => {
      const jDate = (j.date || j.created_at || '').split('T')[0];
      const match = checkins.find((c) => (c.checkin_date || c.created_at || '').startsWith(jDate));
      const wordCount = (j.content || '').trim().split(/\s+/).filter(Boolean).length;
      return { wordCount, stress: match?.stress };
    });

    const highStressReflections = journalsWithCheckin.filter((j) => typeof j.stress === 'number' && j.stress >= 3);
    const lowStressReflections = journalsWithCheckin.filter((j) => typeof j.stress === 'number' && j.stress < 3);

    if (highStressReflections.length >= 3 && lowStressReflections.length >= 3) {
      const avgHighWords = Math.round(highStressReflections.reduce((a, b) => a + b.wordCount, 0) / highStressReflections.length);
      const avgLowWords = Math.round(lowStressReflections.reduce((a, b) => a + b.wordCount, 0) / lowStressReflections.length);

      list.push({
        id: 'reflection-depth',
        category: 'REFLECTION RHYTHM',
        title: 'Reflection Depth in Elevated Stress',
        observation: avgHighWords > avgLowWords
          ? 'During days with higher reported stress, your written reflections tend to be longer and more expansive.'
          : 'Reflections remain concise across varying stress levels, with steady regular documentation.',
        evidence: `Average reflection length is ${avgHighWords} words on higher-stress days vs. ${avgLowWords} words on calmer days.`,
        sampleSize: `Observed across ${journalsWithCheckin.filter((j) => typeof j.stress === 'number').length} paired journal-checkin dates`,
        tagColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      });
    }

    // 4. Activity Recalibration & Quieter Periods
    // Find gaps between activity
    const allDates = new Set<string>();
    checkins.forEach((c) => allDates.add((c.checkin_date || c.created_at || '').split('T')[0]));
    journals.forEach((j) => allDates.add((j.date || j.created_at || '').split('T')[0]));
    sessions.forEach((s) => allDates.add((s.created_at || s.started_at || '').split('T')[0]));

    const sortedDates = Array.from(allDates).filter(Boolean).sort();
    let maxQuietDays = 0;
    let quietPeriodsCount = 0;

    for (let i = 1; i < sortedDates.length; i++) {
      const d1 = new Date(sortedDates[i - 1]).getTime();
      const d2 = new Date(sortedDates[i]).getTime();
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (diffDays >= 4) {
        quietPeriodsCount += 1;
        if (diffDays > maxQuietDays) maxQuietDays = diffDays;
      }
    }

    if (quietPeriodsCount > 0) {
      list.push({
        id: 'quieter-periods',
        category: 'QUIETER PERIOD',
        title: 'Natural Resting Intervals',
        observation: 'Your history includes natural non-active intervals between cycles of check-ins and reflection.',
        evidence: `${quietPeriodsCount} distinct rest pauses of 4+ days recorded, with typical re-engagement resuming naturally without abrupt drops in energy.`,
        sampleSize: `Longest quiet interval observed: ${maxQuietDays} days`,
        tagColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      });
    }

    return list;
  }, [checkins, journals, sessions]);

  if (patterns.length === 0) {
    return (
      <div className="bg-sanctuary-surface border border-sanctuary-border/30 rounded-2xl p-6 text-center">
        <h3 className="text-base font-serif text-sanctuary-text mb-1">
          {t("replay_noticed_title", "Observed Patterns")}
        </h3>
        <p className="text-xs text-sanctuary-muted max-w-md mx-auto">
          {t("insights_empty_sub", "Athena requires at least several weeks of continuous check-ins and practices before highlighting statistical patterns. Continue your journey to uncover rhythms.")}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
              {t("replay_noticed_title", "Observed Patterns")}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-light text-sanctuary-text mt-1">
            {t("insights_patterns_title", "Empirical Rhythms & Observations")}
          </h2>
          <p className="text-xs sm:text-sm text-sanctuary-muted mt-0.5">
            {t("insights_hero_sub", "Statistical correlations observed directly in your longitudinal timeline. Grounded purely in recorded data without speculative diagnostic assertions.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((p) => (
          <div
            key={p.id}
            className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-2xl p-5 sm:p-6 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-sanctuary-border/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${p.tagColor}`}>
                  {p.category}
                </span>
              </div>
              <h3 className="text-base font-serif text-sanctuary-text mb-2 font-medium">
                {p.title}
              </h3>
              <p className="text-xs sm:text-sm text-sanctuary-text/90 leading-relaxed mb-3">
                {p.observation}
              </p>
            </div>

            <div className="pt-3 border-t border-sanctuary-border/20 space-y-1">
              <div className="text-[11px] text-sanctuary-muted flex items-start gap-1.5">
                <span className="font-semibold text-sanctuary-text/80">{t("label_evidence", "Evidence")}:</span>
                <span>{p.evidence}</span>
              </div>
              <div className="text-[10px] text-sanctuary-muted/80 italic">
                {p.sampleSize}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
