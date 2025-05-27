'use client';

import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyPlannerHeaderProps {
  monthStart: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthlyPlannerHeader({
  monthStart,
  onPrevMonth,
  onNextMonth,
}: MonthlyPlannerHeaderProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="mb-8">
      <div className="sticky top-4 z-20 inline-flex items-center justify-between backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 mb-6 shadow-lg border border-white/10 w-fit mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sky-100 font-bold text-lg sm:text-xl md:text-2xl px-3 py-1 rounded-lg w-fit flex-grow-0 mx-auto text-center">
            {months[monthStart.getMonth()]} {monthStart.getFullYear()}
          </span>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 