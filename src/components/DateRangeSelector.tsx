import React from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type DateRangeMode = 'week' | 'month';

interface DateRangeSelectorProps {
  mode: DateRangeMode;
  weekStart?: Date;
  monthStart?: Date;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export default function DateRangeSelector({
  mode,
  weekStart,
  monthStart,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
}: DateRangeSelectorProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="inline-flex items-center justify-between bg-transparent rounded-xl min-h-[44px] h-auto px-0 py-0 w-fit mx-auto">
      {mode === 'month' && monthStart ? (
        <div className="flex items-center gap-2 min-h-[44px]">
          <button
            onClick={onPrevMonth}
            className="px-3 py-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg min-h-[40px] flex items-center"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sky-100 font-bold text-lg sm:text-xl md:text-2xl px-3 py-1 rounded-lg flex-grow-0 mx-auto text-center min-h-[40px] flex items-center justify-center min-w-[120px] sm:min-w-[180px] md:min-w-[220px]">
            {months[monthStart.getMonth()]} {monthStart.getFullYear()}
          </span>
          <button
            onClick={onNextMonth}
            className="px-3 py-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg min-h-[40px] flex items-center"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : mode === 'week' && weekStart ? (
        <div className="flex items-center gap-2 min-h-[44px]">
          <button
            onClick={onPrevWeek}
            className="px-3 py-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg min-h-[40px] flex items-center"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sky-100 font-bold text-lg sm:text-xl md:text-2xl px-3 py-1 rounded-lg flex-grow-0 mx-auto text-center min-h-[40px] flex items-center justify-center min-w-[120px] sm:min-w-[180px] md:min-w-[220px]">
            {format(weekStart, 'MMMM d')}–{format(addDays(weekStart, 6), 'd')}
          </span>
          <button
            onClick={onNextWeek}
            className="px-3 py-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg min-h-[40px] flex items-center"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </div>
  );
} 