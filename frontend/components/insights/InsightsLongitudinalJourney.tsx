'use client';

import React, { useState, useMemo } from 'react';
import type { CheckInRecord } from '@/types/checkin';
import type { JournalEntry } from '@/types/journal';
import type { StudioSession } from '@/types/studio';

interface LongitudinalJourneyProps {
  checkins: CheckInRecord[];
  journals: JournalEntry[];
  sessions: StudioSession[];
  onSelectMonth?: (monthKey: string | null) => void;
  selectedMonth?: string | null;
}

export function InsightsLongitudinalJourney({
  checkins,
  journals,
  sessions,
  onSelectMonth,
  selectedMonth,
}: LongitudinalJourneyProps) {
  const [range, setRange] = useState<'6M' | '1Y' | '2Y'>('2Y');
  const [activeMetric, setActiveMetric] = useState<'all' | 'checkins' | 'journals' | 'studio' | 'minutes'>('all');

  // Group by year-month: YYYY-MM
  const monthlyData = useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      label: string;
      checkins: number;
      journals: number;
      sessions: number;
      minutes: number;
      avgEnergy: number | null;
      avgStress: number | null;
      energySum: number;
      stressSum: number;
      energyCount: number;
      stressCount: number;
    }>();

    // Determine current cutoff based on range
    const now = new Date();
    let monthsToInclude = 24;
    if (range === '6M') monthsToInclude = 6;
    if (range === '1Y') monthsToInclude = 12;

    // Generate list of months going back monthsToInclude
    const monthsList: string[] = [];
    for (let i = monthsToInclude - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsList.push(key);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: range === '6M' ? undefined : '2-digit' });
      map.set(key, {
        monthKey: key,
        label,
        checkins: 0,
        journals: 0,
        sessions: 0,
        minutes: 0,
        avgEnergy: null,
        avgStress: null,
        energySum: 0,
        stressSum: 0,
        energyCount: 0,
        stressCount: 0,
      });
    }

    checkins.forEach((c) => {
      const dateStr = c.checkin_date || c.created_at;
      if (!dateStr) return;
      const key = dateStr.substring(0, 7);
      const entry = map.get(key);
      if (entry) {
        entry.checkins += 1;
        if (typeof c.energy === 'number') {
          entry.energySum += c.energy;
          entry.energyCount += 1;
        }
        if (typeof c.stress === 'number') {
          entry.stressSum += c.stress;
          entry.stressCount += 1;
        }
      }
    });

    journals.forEach((j) => {
      const dateStr = j.date || j.created_at;
      if (!dateStr) return;
      const key = dateStr.substring(0, 7);
      const entry = map.get(key);
      if (entry) {
        entry.journals += 1;
      }
    });

    sessions.forEach((s) => {
      const dateStr = s.created_at || s.started_at;
      if (!dateStr) return;
      const key = dateStr.substring(0, 7);
      const entry = map.get(key);
      if (entry) {
        entry.sessions += 1;
        entry.minutes += Math.round((s.duration_seconds || 0) / 60);
      }
    });

    return monthsList.map((key) => {
      const item = map.get(key)!;
      return {
        ...item,
        avgEnergy: item.energyCount > 0 ? Number((item.energySum / item.energyCount).toFixed(1)) : null,
        avgStress: item.stressCount > 0 ? Number((item.stressSum / item.stressCount).toFixed(1)) : null,
        totalActivity: item.checkins + item.journals + item.sessions,
      };
    });
  }, [checkins, journals, sessions, range]);

  const maxActivity = Math.max(...monthlyData.map((d) => d.totalActivity), 1);
  const maxMinutes = Math.max(...monthlyData.map((d) => d.minutes), 1);

  // Summary counts across this view
  const totalCheckins = monthlyData.reduce((acc, d) => acc + d.checkins, 0);
  const totalJournals = monthlyData.reduce((acc, d) => acc + d.journals, 0);
  const totalSessions = monthlyData.reduce((acc, d) => acc + d.sessions, 0);
  const totalMinutes = monthlyData.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <section className="bg-sanctuary-surface border border-sanctuary-border/40 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400"></span>
            <span className="text-[11px] font-semibold tracking-wider text-sanctuary-primary uppercase">
              Longitudinal Journey
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-light text-sanctuary-text mt-1">
            24-Month Long-Term Rhythm
          </h2>
          <p className="text-xs sm:text-sm text-sanctuary-muted mt-0.5">
            Reflecting periods of active engagement, quiet recalibration, and evolving practice across your entire history.
          </p>
        </div>

        {/* Range Controls */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-sanctuary-bg/70 p-1 rounded-xl border border-sanctuary-border/30 text-xs">
            {(['6M', '1Y', '2Y'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  range === r
                    ? 'bg-sanctuary-surface text-sanctuary-text shadow-sm border border-sanctuary-border/50'
                    : 'text-sanctuary-muted hover:text-sanctuary-text'
                }`}
              >
                {r === '2Y' ? '2 Years' : r === '1Y' ? '1 Year' : '6 Months'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
        <span className="text-sanctuary-muted mr-1 font-medium">Highlight:</span>
        <button
          type="button"
          onClick={() => setActiveMetric('all')}
          className={`px-2.5 py-1 rounded-lg border transition-all ${
            activeMetric === 'all'
              ? 'bg-sanctuary-primary/10 border-sanctuary-primary/40 text-sanctuary-primary font-medium'
              : 'border-sanctuary-border/30 text-sanctuary-muted hover:text-sanctuary-text'
          }`}
        >
          All Activity Stack
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('checkins')}
          className={`px-2.5 py-1 rounded-lg border transition-all ${
            activeMetric === 'checkins'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-medium'
              : 'border-sanctuary-border/30 text-sanctuary-muted hover:text-sanctuary-text'
          }`}
        >
          ● Check-ins ({totalCheckins})
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('journals')}
          className={`px-2.5 py-1 rounded-lg border transition-all ${
            activeMetric === 'journals'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 font-medium'
              : 'border-sanctuary-border/30 text-sanctuary-muted hover:text-sanctuary-text'
          }`}
        >
          ● Reflections ({totalJournals})
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('studio')}
          className={`px-2.5 py-1 rounded-lg border transition-all ${
            activeMetric === 'studio'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-medium'
              : 'border-sanctuary-border/30 text-sanctuary-muted hover:text-sanctuary-text'
          }`}
        >
          ● Studio ({totalSessions})
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('minutes')}
          className={`px-2.5 py-1 rounded-lg border transition-all ${
            activeMetric === 'minutes'
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-400 font-medium'
              : 'border-sanctuary-border/30 text-sanctuary-muted hover:text-sanctuary-text'
          }`}
        >
          ⏱ Practice Minutes ({totalMinutes}m)
        </button>
      </div>

      {/* Main Interactive Bar Chart */}
      <div className="relative pt-4 pb-2">
        <div className="grid gap-1 sm:gap-2 items-end h-56 sm:h-64" style={{ gridTemplateColumns: `repeat(${monthlyData.length}, minmax(0, 1fr))` }}>
          {monthlyData.map((d) => {
            const isSelected = selectedMonth === d.monthKey;
            const hasActivity = d.totalActivity > 0;

            // Heights
            const checkinH = (d.checkins / maxActivity) * 100;
            const journalH = (d.journals / maxActivity) * 100;
            const studioH = (d.sessions / maxActivity) * 100;
            const minutesH = (d.minutes / maxMinutes) * 100;

            return (
              <div
                key={d.monthKey}
                onClick={() => onSelectMonth && onSelectMonth(isSelected ? null : d.monthKey)}
                className={`group relative flex flex-col items-center h-full justify-end cursor-pointer transition-all duration-200 ${
                  isSelected ? 'scale-[1.03]' : 'hover:scale-[1.02]'
                }`}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col z-30 bg-sanctuary-surface/95 border border-sanctuary-border rounded-xl p-2.5 shadow-xl text-[11px] whitespace-nowrap min-w-[140px] backdrop-blur-md">
                  <div className="font-semibold text-sanctuary-text border-b border-sanctuary-border/30 pb-1 mb-1.5 flex justify-between items-center">
                    <span>{d.label}</span>
                    <span className="text-[10px] text-sanctuary-muted font-normal">Click to drill down</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-400/90 py-0.5">
                    <span>Check-ins:</span>
                    <span className="font-semibold">{d.checkins}</span>
                  </div>
                  <div className="flex justify-between items-center text-indigo-400/90 py-0.5">
                    <span>Reflections:</span>
                    <span className="font-semibold">{d.journals}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400/90 py-0.5">
                    <span>Studio sessions:</span>
                    <span className="font-semibold">{d.sessions}</span>
                  </div>
                  <div className="flex justify-between items-center text-teal-400/90 py-0.5 border-t border-sanctuary-border/20 pt-1 mt-0.5">
                    <span>Practice minutes:</span>
                    <span className="font-semibold">{d.minutes}m</span>
                  </div>
                  {(d.avgEnergy !== null || d.avgStress !== null) && (
                    <div className="text-[10px] text-sanctuary-muted mt-1 pt-1 border-t border-sanctuary-border/20 flex justify-between">
                      <span>Avg Energy: {d.avgEnergy ?? '—'}</span>
                      <span>Avg Stress: {d.avgStress ?? '—'}</span>
                    </div>
                  )}
                </div>

                {/* Stacked or Single Bar */}
                <div
                  className={`w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all ${
                    isSelected ? 'ring-2 ring-sanctuary-primary ring-offset-2 ring-offset-sanctuary-bg' : ''
                  }`}
                  style={{ height: '100%' }}
                >
                  {activeMetric === 'minutes' ? (
                    <div
                      className="w-full bg-gradient-to-t from-teal-600/80 to-teal-400 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(minutesH, hasActivity ? 4 : 0)}%` }}
                    />
                  ) : activeMetric === 'checkins' ? (
                    <div
                      className="w-full bg-gradient-to-t from-amber-600/80 to-amber-400 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(checkinH, d.checkins > 0 ? 4 : 0)}%` }}
                    />
                  ) : activeMetric === 'journals' ? (
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600/80 to-indigo-400 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(journalH, d.journals > 0 ? 4 : 0)}%` }}
                    />
                  ) : activeMetric === 'studio' ? (
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600/80 to-emerald-400 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(studioH, d.sessions > 0 ? 4 : 0)}%` }}
                    />
                  ) : (
                    // Stacked: Checkins (bottom) + Journals (mid) + Studio (top)
                    <div
                      className="w-full flex flex-col-reverse justify-start rounded-t-sm overflow-hidden"
                      style={{ height: `${Math.max((d.totalActivity / maxActivity) * 100, hasActivity ? 4 : 0)}%` }}
                    >
                      {d.checkins > 0 && (
                        <div
                          className="w-full bg-amber-500/80 hover:bg-amber-400 transition-colors"
                          style={{ height: `${(d.checkins / d.totalActivity) * 100}%` }}
                        />
                      )}
                      {d.journals > 0 && (
                        <div
                          className="w-full bg-indigo-500/80 hover:bg-indigo-400 transition-colors"
                          style={{ height: `${(d.journals / d.totalActivity) * 100}%` }}
                        />
                      )}
                      {d.sessions > 0 && (
                        <div
                          className="w-full bg-emerald-500/80 hover:bg-emerald-400 transition-colors"
                          style={{ height: `${(d.sessions / d.totalActivity) * 100}%` }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Indicator Pill */}
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-sanctuary-primary mt-1" />
                )}

                {/* X-axis Label */}
                <span className={`text-[9px] sm:text-[10px] mt-1 text-center truncate w-full ${
                  isSelected ? 'font-bold text-sanctuary-primary' : 'text-sanctuary-muted'
                }`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-down Helper */}
      <div className="mt-4 pt-4 border-t border-sanctuary-border/20 flex flex-wrap items-center justify-between text-xs text-sanctuary-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/80" />
            <span>Reflection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
            <span>Studio</span>
          </div>
        </div>

        {selectedMonth ? (
          <div className="flex items-center gap-2 text-sanctuary-primary">
            <span>Filtering insights to <strong>{selectedMonth}</strong></span>
            <button
              type="button"
              onClick={() => onSelectMonth && onSelectMonth(null)}
              className="underline text-[11px] hover:text-sanctuary-text"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <span className="text-[11px] italic">Tip: Click any month to cross-filter the matrix & metrics below</span>
        )}
      </div>
    </section>
  );
}
