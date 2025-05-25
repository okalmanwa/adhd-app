import React from 'react';
import { format, isSameMonth } from 'date-fns';
import DayColumn from '../DayColumn';
import { Task } from '@/types/rewards';

interface MonthlyPlannerGridProps {
  displayDays: Date[]; // This should be the 15 visible days
  groupedTasks: { [key: string]: Task[] };
  monthStart: Date;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  handleNextMonthPage?: () => void;
  handlePrevMonthPage?: () => void;
  monthPage?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
}

function MonthlyPlannerGrid({
  displayDays,
  groupedTasks,
  monthStart,
  onTaskEdit,
  onTaskDelete,
  onTaskComplete,
  handleNextMonthPage,
  handlePrevMonthPage,
  monthPage,
  hasPrevPage,
  hasNextPage,
}: MonthlyPlannerGridProps) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-fr gap-4 max-w-[90rem] mx-auto">
        {displayDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = groupedTasks[dateStr] || [];
          const isCurrentMonth = day.getMonth() === monthStart.getMonth();
          return (
            <DayColumn
              key={dateStr}
              day={day}
              tasks={dayTasks}
              isCompact={true}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              onTaskComplete={onTaskComplete}
              isCurrentMonth={isCurrentMonth}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-4">
        <button onClick={handlePrevMonthPage} disabled={!hasPrevPage} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">
          Previous
        </button>
        <button onClick={handleNextMonthPage} disabled={!hasNextPage} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}

export default React.memo(MonthlyPlannerGrid); 