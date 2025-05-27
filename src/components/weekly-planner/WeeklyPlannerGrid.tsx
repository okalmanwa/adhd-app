'use client';

import React from 'react';
import { format } from 'date-fns';
import DayColumn from '../DayColumn';
import { Task } from '@/types/rewards';

type ViewMode = 'week' | 'month';

interface WeeklyPlannerGridProps {
  displayDays: Date[];
  groupedTasks: { [key: string]: Task[] };
  monthStart: Date;
  viewMode: ViewMode;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
}

export default function WeeklyPlannerGrid({
  displayDays,
  groupedTasks,
  monthStart,
  viewMode,
  onTaskEdit,
  onTaskDelete,
  onTaskComplete,
}: WeeklyPlannerGridProps) {
  return (
    <div className={
      viewMode === 'week'
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 auto-rows-fr gap-4 max-w-[90rem] mx-auto'
    }>
      {displayDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = groupedTasks[dateStr] || [];
        const isCurrentMonth = day.getMonth() === monthStart.getMonth();
        return (
          <DayColumn
            key={dateStr}
            day={day}
            tasks={dayTasks}
            isCompact={viewMode === 'month'}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            onTaskComplete={onTaskComplete}
            isCurrentMonth={isCurrentMonth}
          />
        );
      })}
    </div>
  );
} 