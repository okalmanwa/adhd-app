import React from 'react';
import { Task } from '@/types/rewards';
import WeeklyPlannerHeader from '../weekly-planner/WeeklyPlannerHeader';
import WeeklyPlannerGrid from '../weekly-planner/WeeklyPlannerGrid';
import MonthlyPlannerHeader from '../monthly-planner/MonthlyPlannerHeader';
import MonthlyPlannerGrid from '../monthly-planner/MonthlyPlannerGrid';

type ViewMode = 'week' | 'month';

interface PlannerLayoutProps {
  viewMode: ViewMode;
  weekStart: Date;
  monthStart: Date;
  displayDays: Date[];
  groupedTasks: { [key: string]: Task[] };
  activeTask: Task | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  handleNextMonthPage?: () => void;
  handlePrevMonthPage?: () => void;
  monthPage?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
}

export default function PlannerLayout({
  viewMode,
  weekStart,
  monthStart,
  displayDays,
  groupedTasks,
  activeTask,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
  onTaskEdit,
  onTaskDelete,
  onTaskComplete,
  onDragStart,
  onDragEnd,
  handleNextMonthPage,
  handlePrevMonthPage,
  monthPage,
  hasPrevPage,
  hasNextPage,
}: PlannerLayoutProps) {
  return (
    <>
      <div className="mb-8">
        {viewMode === 'week' ? (
          <WeeklyPlannerHeader
            viewMode={viewMode}
            weekStart={weekStart}
            monthStart={monthStart}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
          />
        ) : (
          <MonthlyPlannerHeader
            monthStart={monthStart}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
          />
        )}
      </div>

      {viewMode === 'week' ? (
        <WeeklyPlannerGrid
          displayDays={displayDays}
          groupedTasks={groupedTasks}
          monthStart={monthStart}
          viewMode={viewMode}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskComplete={onTaskComplete}
        />
      ) : (
        <MonthlyPlannerGrid
          displayDays={displayDays}
          groupedTasks={groupedTasks}
          monthStart={monthStart}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskComplete={onTaskComplete}
          handleNextMonthPage={handleNextMonthPage}
          handlePrevMonthPage={handlePrevMonthPage}
          monthPage={monthPage}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
        />
      )}
    </>
  );
} 