'use client';

import React from 'react';
import { format, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyPlannerHeaderProps {
  monthStart: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function MonthlyPlannerHeader({
  monthStart,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthlyPlannerHeaderProps) {
  const isCurrentMonth = isSameMonth(monthStart, new Date());

  return (
    <div className="mb-8">
      <div className="sticky top-4 z-20 flex items-center justify-center gap-4 backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 mb-6 shadow-lg border border-white/10 w-full sm:w-fit mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={onToday}
            className={`px-4 py-2 rounded-lg transition-all ${
              isCurrentMonth
                ? 'bg-sky-500/30 text-sky-100' 
                : 'bg-white/10 text-sky-300 hover:bg-white/20'
            }`}
          >
            {format(monthStart, 'MMMM yyyy')}
          </button>

          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 