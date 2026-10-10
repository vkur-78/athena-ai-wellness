'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MonthlyReplayData } from '@/types/replay';
import { OpeningLetterChapter } from './OpeningLetterChapter';
import { Chapter1Story } from './Chapter1Story';
import { Chapter3TurningPoints } from './Chapter3TurningPoints';
import { Chapter5HelpfulPractices } from './Chapter5HelpfulPractices';
import { QuietPatternsChapter } from './QuietPatternsChapter';
import { Chapter6GentleOpportunities } from './Chapter6GentleOpportunities';
import { Chapter7LookingForward } from './Chapter7LookingForward';

interface MonthlyReplayExperienceProps {
  replay: MonthlyReplayData;
}

const CHAPTER_NAMES = [
  'Opening Letter',
  "Your Month's Story",
  'Turning Points',
  'Helpful Habits',
  'Quiet Patterns',
  'Gentle Growth',
  'Keepsake Ending',
];

export const MonthlyReplayExperience: React.FC<MonthlyReplayExperienceProps> = ({ replay }) => {
  const [currentChapter, setCurrentChapter] = useState<number>(1); // Chapters 1..7 (No autoplay)
  const totalChapters = 7;

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex flex-col justify-between overflow-x-hidden bg-slate-950 text-slate-100 select-none">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[400px] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header & Chapter Progress Bars */}
      <div className="relative z-20 px-6 pt-6 pb-2 max-w-4xl mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/reflection/monthly"
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <span>←</span>
            <span>Monthly Reflection</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-serif italic text-slate-300">{replay.month_display}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-emerald-400">
              {CHAPTER_NAMES[currentChapter - 1]}
            </span>
          </div>
        </div>

        {/* Progress Bars (1 to 7) */}
        <div className="grid grid-cols-7 gap-1.5 w-full">
          {Array.from({ length: totalChapters }).map((_, idx) => {
            const chapterNum = idx + 1;
            const isCompleted = currentChapter > chapterNum;
            const isCurrent = currentChapter === chapterNum;

            return (
              <button
                key={idx}
                onClick={() => setCurrentChapter(chapterNum)}
                className="group relative h-2 rounded-full overflow-hidden bg-slate-800 transition-all cursor-pointer hover:bg-slate-700"
                title={`Chapter ${chapterNum}: ${CHAPTER_NAMES[idx]}`}
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? 'w-full bg-emerald-400'
                      : isCurrent
                      ? 'w-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                      : 'w-0 bg-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chapter Content Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        {/* Chapter 1: Opening Letter */}
        {currentChapter === 1 && (
          <OpeningLetterChapter
            letter={replay.opening_letter}
            userName={replay.user_name}
            monthDisplay={replay.month_display}
            onBegin={() => setCurrentChapter(2)}
          />
        )}

        {/* Chapter 2: Your Month's Story */}
        {currentChapter === 2 && (
          <Chapter1Story
            story={replay.chapter_1_story}
            userName={replay.user_name}
            monthDisplay={replay.month_display}
          />
        )}

        {/* Chapter 3: Turning Points */}
        {currentChapter === 3 && (
          <Chapter3TurningPoints turningPoints={replay.chapter_3_turning_points} />
        )}

        {/* Chapter 4: Helpful Habits */}
        {currentChapter === 4 && (
          <Chapter5HelpfulPractices practices={replay.chapter_5_what_helped} />
        )}

        {/* Chapter 5: Quiet Patterns */}
        {currentChapter === 5 && (
          <QuietPatternsChapter patterns={replay.quiet_patterns} />
        )}

        {/* Chapter 6: Gentle Growth */}
        {currentChapter === 6 && (
          <Chapter6GentleOpportunities opportunity={replay.chapter_6_gentle_opportunities} />
        )}

        {/* Chapter 7: Keepsake Ending */}
        {currentChapter === 7 && (
          <Chapter7LookingForward
            data={replay.chapter_7_looking_forward}
            userName={replay.user_name}
            month={replay.month}
            onRestart={() => setCurrentChapter(1)}
          />
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="relative z-20 px-6 py-6 max-w-4xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => setCurrentChapter((prev) => Math.max(1, prev - 1))}
          disabled={currentChapter <= 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span>←</span>
          <span>Previous</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          Chapter {currentChapter} of {totalChapters}
        </span>

        <button
          onClick={() => setCurrentChapter((prev) => Math.min(totalChapters, prev + 1))}
          disabled={currentChapter >= totalChapters}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/25"
        >
          <span>Next</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
