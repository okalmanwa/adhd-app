'use client';

import React from 'react';
import { format, addDays, isSameWeek, isToday, startOfWeek, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type ViewMode = 'week' | 'month';

interface WeeklyPlannerHeaderProps {
  viewMode: ViewMode;
  weekStart: Date;
  monthStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function WeeklyPlannerHeader({
  viewMode,
  weekStart,
  monthStart,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
  onToday,
}: WeeklyPlannerHeaderProps) {
  const isCurrentWeek = isSameWeek(weekStart, new Date());
  const isCurrentMonth = isSameWeek(monthStart, new Date());

  const renderDateRange = () => {
    const startMonth = format(weekStart, 'MMM');
    const endMonth = format(addDays(weekStart, 6), 'MMM');
    const startDay = format(weekStart, 'd');
    const endDay = format(addDays(weekStart, 6), 'd');
    const year = format(weekStart, 'yyyy');

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}–${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay}–${endMonth} ${endDay}, ${year}`;
  };

  return (
    <div className="mb-8">
      <div className="sticky top-4 z-20 flex items-center justify-center gap-4 backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 mb-6 shadow-lg border border-white/10 w-full sm:w-fit mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={viewMode === 'week' ? onPrevWeek : onPrevMonth}
            className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg active:scale-95"
            aria-label={viewMode === 'week' ? "Previous week" : "Previous month"}
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={onToday}
            className={`px-4 py-2 rounded-lg transition-all ${
              (viewMode === 'week' ? isCurrentWeek : isCurrentMonth)
                ? 'bg-sky-500/30 text-sky-100' 
                : 'bg-white/10 text-sky-300 hover:bg-white/20'
            }`}
          >
            {viewMode === 'week' ? renderDateRange() : format(monthStart, 'MMMM yyyy')}
          </button>

          <button
            onClick={viewMode === 'week' ? onNextWeek : onNextMonth}
            className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg active:scale-95"
            aria-label={viewMode === 'week' ? "Next week" : "Next month"}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 