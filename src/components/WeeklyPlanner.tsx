'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isWithinInterval, startOfDay, endOfDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, setMonth, subDays, parse, isSameMonth } from 'date-fns';
import { Task, Urgency } from '@/types/rewards';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import DayColumn from './DayColumn';
import { Calendar, X, Save, Trash2, Plus, ChevronLeft, ChevronRight, BarChart2, Flame, Timer } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useRouter } from 'next/navigation';
import { QuestBuilder } from '@/components/QuestBuilder';
import { Spinner } from '@/components/Spinner';
import WeeklyPlannerGrid from './weekly-planner/WeeklyPlannerGrid';
import WeeklyPlannerHeader from './weekly-planner/WeeklyPlannerHeader';
import WeeklyPlannerDndContext from './weekly-planner/WeeklyPlannerDndContext';
import WeeklyPlannerTaskEditor from './weekly-planner/WeeklyPlannerTaskEditor';
import PlannerLayout from './planner/PlannerLayout';
import { TaskCompletionAnimation } from '@/components/TaskCompletionAnimation';

type ViewMode = 'week' | 'month';

interface WeeklyPlannerProps {
  initialViewMode?: ViewMode;
}

interface DayStats {
  date: Date;
  total: number;
  completed: number;
  stored: number;
  urgencyStats: {
    high: number;
    medium: number;
    low: number;
  };
  categoryStats: {
    study: number;
    work: number;
    chores: number;
    'self-care': number;
    other: number;
  };
  completionRate: number;
}

// Helper to format date for datetime-local input in local time
function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes())
  );
}

export default function WeeklyPlanner({ initialViewMode = 'week' }: WeeklyPlannerProps) {
  const router = useRouter();
  const { tasks, isLoading, updateTask, deleteTask, completeTask, createTask, forceRefresh } = useTasks();
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    deadline: format(new Date(), 'yyyy-MM-dd'),
    urgency: 'medium',
    category: 'study',
    estimated_minutes: 30,
    completed: false,
    obstacles: [],
    hero: 'You',
    avatar: 'adventurer:default',
    win_condition: '',
    reward: '',
    notes: '',
    user_id: '' // This will be set by the backend
  });
  const [statsView, setStatsView] = useState<'completion' | 'streak'>('completion');
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [monthPage, setMonthPage] = useState(0);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 10,
      },
    })
  );

  // Force refresh tasks when navigating weeks/months/views to ensure guest tasks sync and display correctly
  useEffect(() => {
    forceRefresh();
    // This is needed because localStorage changes (for guests) are not always picked up by React state on navigation
  }, [weekStart, monthStart, viewMode]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfMonth(monthStart);
    const lastWeekStart = startOfWeek(end, { weekStartsOn: 1 });
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: totalDays }, (_, i) => addDays(start, i));
  }, [monthStart]);

  const displayDays = viewMode === 'week' ? weekDays : monthDays;

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    displayDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      groups[dateStr] = [];
    });

    tasks.forEach(task => {
      if (task.end_time && !task.completed) {
        let taskDate: Date | null = null;
        try {
          // Always parse as ISO string (UTC) for consistency
          taskDate = typeof task.end_time === 'string' ? new Date(task.end_time) : null;
          if (!taskDate || isNaN(taskDate.getTime())) {
            // Fallback: try parsing with date-fns if needed
            taskDate = parse(task.end_time as string, "yyyy-MM-dd'T'HH:mm:ss.SSS", new Date());
          }
          if (!taskDate || isNaN(taskDate.getTime())) {
            console.warn('Invalid date for task:', task);
            return;
          }
          // Always use UTC date string for grouping
        const dateStr = format(taskDate, 'yyyy-MM-dd');
        if (groups[dateStr] && (!activeTask || task.id !== activeTask.id)) {
          groups[dateStr].push(task);
          }
        } catch (error) {
          console.warn('Error processing task:', { task, error });
        }
      }
    });

    return groups;
  }, [tasks, displayDays, activeTask]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonth = parseInt(e.target.value);
    const newDate = new Date(monthStart);
    newDate.setMonth(selectedMonth);
    setMonthStart(startOfMonth(newDate));
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    try {
      setIsSaving(true);
      const localDateEdit = typeof updatedTask.deadline === 'string' && updatedTask.deadline
        ? new Date(updatedTask.deadline)
        : new Date();
      if (isNaN(localDateEdit.getTime())) throw new Error('Invalid date');
      updatedTask.deadline = localDateEdit.toISOString();
      await updateTask(updatedTask.id, updatedTask);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskComplete = async (task: Task) => {
    try {
      setIsSaving(true);
      await completeTask(task.id);
      setCompletedTask(task);
      setShowCompletionAnimation(true);
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskDelete = async (task: Task) => {
    try {
      setIsSaving(true);
      await deleteTask(task.id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevWeek = () => {
    setWeekStart(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setWeekStart(prev => addDays(prev, 7));
  };

  const handleResetWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setViewMode('week');
  };

  const handleResetMonth = () => {
    setMonthStart(startOfMonth(new Date()));
    setViewMode('month');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    const targetDateStr = over.id as string;

    if (task && task.end_time) {
      // Get the current task's date (keeping the time)
      const currentDate = new Date(task.end_time);
      // Parse the target date and set the same time
      const targetDate = parse(targetDateStr, 'yyyy-MM-dd', new Date());
      targetDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds());

      // Only update if the date actually changed
      if (format(currentDate, 'yyyy-MM-dd') !== format(targetDate, 'yyyy-MM-dd')) {
      const updatedTask = {
        ...task,
          end_time: format(targetDate, "yyyy-MM-dd'T'HH:mm:ss.SSS")
      };
      await handleTaskUpdate(updatedTask);
      }
    }
  };

  const handleCreateTask = async () => {
    setIsCreatingTask(true);
  };

  const handlePrevMonth = () => {
    setMonthStart(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setMonthStart(prev => addMonths(prev, 1));
  };

  const taskStats = useMemo(() => {
    const stats = weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.end_time) return false;
        const taskDate = new Date(task.end_time);
        return format(taskDate, 'yyyy-MM-dd') === dateStr;
      });
      
      const completedTasks = dayTasks.filter(task => task.completed);
      const storedTasks = dayTasks.filter(task => !task.completed);
      
      // Calculate urgency distribution
      const urgencyStats = {
        high: storedTasks.filter(task => task.urgency === 'high').length,
        medium: storedTasks.filter(task => task.urgency === 'medium').length,
        low: storedTasks.filter(task => task.urgency === 'low').length
      };

      // Calculate category distribution
      const categoryStats = {
        study: storedTasks.filter(task => task.category === 'study').length,
        work: storedTasks.filter(task => task.category === 'work').length,
        chores: storedTasks.filter(task => task.category === 'chores').length,
        'self-care': storedTasks.filter(task => task.category === 'self-care').length,
        other: storedTasks.filter(task => task.category === 'other').length
      };

      return {
        date: day,
        total: dayTasks.length,
        completed: completedTasks.length,
        stored: storedTasks.length,
        urgencyStats,
        categoryStats,
        completionRate: dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0
      };
    });

    return stats;
  }, [tasks, weekDays]);

  const streakData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), i)).reverse();
    return last14Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.end_time) return false;
        const taskDate = new Date(task.end_time);
        return format(taskDate, 'yyyy-MM-dd') === dateStr;
      });
      return {
        date,
        completed: dayTasks.some(task => task.completed),
        total: dayTasks.length
      };
    });
  }, [tasks]);

  const handleHome = () => {
    router.push('/');
  };

  const MAX_DAYS_PER_PAGE = 15;
  const today = new Date();
  const isCurrentMonth = isSameMonth(today, monthStart);

  const initialStartIndex = useMemo(() => {
    if (isCurrentMonth) {
      const todayIndex = displayDays.findIndex(day => format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
      return Math.max(0, todayIndex - Math.floor(MAX_DAYS_PER_PAGE / 2));
    }
    return 0;
  }, [displayDays, isCurrentMonth, today]);

  useEffect(() => {
    setMonthPage(0);
  }, [monthStart, initialStartIndex]);

  // Calculate the maximum allowed monthPage so that startIndex never goes below 0
  const maxMonthPageBack = useMemo(() => {
    if (!isCurrentMonth) return 0;
    // How many pages can we go back before startIndex would be < 0?
    return Math.floor(initialStartIndex / MAX_DAYS_PER_PAGE);
  }, [isCurrentMonth, initialStartIndex, MAX_DAYS_PER_PAGE]);

  const handlePrevMonthPage = () => {
    setMonthPage((p) => {
      if (isCurrentMonth) {
        return Math.max(0, p - 1, -maxMonthPageBack);
      }
      return Math.max(0, p - 1);
    });
  };

  const handleNextMonthPage = () => {
    if (startIndex + MAX_DAYS_PER_PAGE < displayDays.length) {
      setMonthPage((p) => p + 1);
    }
  };

  const startIndex = Math.max(0, initialStartIndex + (monthPage * MAX_DAYS_PER_PAGE));
  const visibleDaysMonth = displayDays.slice(startIndex, startIndex + MAX_DAYS_PER_PAGE);
  const visibleGroupedTasksMonth = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    visibleDaysMonth.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      groups[dateStr] = [];
    });
    tasks.forEach(task => {
      if (task.deadline && !task.completed) {
        let taskDate: Date | null = null;
        try {
          taskDate = typeof task.deadline === 'string' ? new Date(task.deadline) : null;
          if (!taskDate || isNaN(taskDate.getTime())) {
            taskDate = parse(task.deadline as string, "yyyy-MM-dd'T'HH:mm:ss.SSS", new Date());
          }
          if (!taskDate || isNaN(taskDate.getTime())) {
            return;
          }
          const dateStr = format(taskDate, 'yyyy-MM-dd');
          if (groups[dateStr] && (!activeTask || task.id !== activeTask.id)) {
            groups[dateStr].push(task);
          }
        } catch (error) {
          return;
        }
      }
    });
    return groups;
  }, [tasks, visibleDaysMonth, activeTask]);

  const hasPrevPage = monthPage > 0 && startIndex > 0;
  const hasNextPage = startIndex + MAX_DAYS_PER_PAGE < displayDays.length;

  let visibleDays = displayDays;
  let visibleGroupedTasks = groupedTasks;
  let nextMonthPageHandler, prevMonthPageHandler, prevPage, nextPage;
  if (viewMode === 'month') {
    visibleDays = visibleDaysMonth;
    visibleGroupedTasks = visibleGroupedTasksMonth;
    nextMonthPageHandler = handleNextMonthPage;
    prevMonthPageHandler = handlePrevMonthPage;
    prevPage = hasPrevPage;
    nextPage = hasNextPage;
  }

  const handleAnimationComplete = () => {
    setShowCompletionAnimation(false);
    setCompletedTask(null);
  };

  const handleToday = () => {
    if (viewMode === 'week') {
      setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else {
      setMonthStart(startOfMonth(new Date()));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={48} message="Loading your planner..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="max-w-[90rem] mx-auto">
        <WeeklyPlannerDndContext
          displayDays={visibleDays}
          groupedTasks={visibleGroupedTasks}
          monthStart={monthStart}
          viewMode={viewMode}
          activeTask={activeTask}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onTaskComplete={handleTaskComplete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <PlannerLayout
            viewMode={viewMode}
            weekStart={weekStart}
            monthStart={monthStart}
            displayDays={visibleDays}
            groupedTasks={visibleGroupedTasks}
            activeTask={activeTask}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  onTaskComplete={handleTaskComplete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            handleNextMonthPage={nextMonthPageHandler}
            handlePrevMonthPage={prevMonthPageHandler}
            monthPage={monthPage}
            hasPrevPage={prevPage}
            hasNextPage={nextPage}
          />
        </WeeklyPlannerDndContext>

        <WeeklyPlannerTaskEditor
          editingTask={editingTask}
          viewMode={viewMode}
          selectedDate={viewMode === 'month' ? monthStart : weekStart}
          onTaskUpdate={async (task) => {
            await updateTask(task.id, task);
            }}
            onClose={() => setEditingTask(null)}
          />
      </div>
      <AnimatePresence>
        {showCompletionAnimation && completedTask && (
          <TaskCompletionAnimation task={completedTask} onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>
    </div>
  );
} 