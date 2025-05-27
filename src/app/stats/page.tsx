'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addDays, parseISO, subMonths, addMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ChevronLeft, BarChart2, Flame, X, ChevronRight, Home, Calendar, Timer, LucideIcon, CheckCircle2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Nav from '@/components/Nav';
import { Task } from '@/types/rewards';
import Footer from '@/components/Footer';
import { Spinner } from '@/components/Spinner';
import { usePomodoroAnalytics } from '@/hooks/usePomodoroAnalytics';
import DateRangeSelector from '@/components/DateRangeSelector';

interface NavItemProps {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

function NavItem({ href, title, subtitle, icon: Icon }: NavItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const isActive = pathname === href;
  const handleClick = (e: React.MouseEvent) => {
    if (isActive) return; // Prevent loading if already on page
    e.preventDefault();
    setIsLoading(true);
    router.push(href);
  };
  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="w-8 h-8 animate-spin border-4 border-mint-400 border-t-transparent rounded-full" />
            <span className="text-white text-sm">Loading your next mission...</span>
          </div>
        </div>
      )}
      <Link 
        href={href}
        onClick={handleClick}
        className="flex flex-col items-start group relative"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400 group-hover:text-mint-400 transition-colors" />
          <span className="font-medium text-white group-hover:text-mint-400 transition-colors">{title}</span>
        </div>
        <span className="text-[10px] text-gray-400 group-hover:text-mint-400/80 transition-colors">{subtitle}</span>
        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-mint-400 group-hover:w-full transition-all duration-300" />
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-mint-400/20" />
      </Link>
    </>
  );
}

const CATEGORY_COLORS = {
  study: 'indigo',
  work: 'blue',
  chores: 'amber',
  'self-care': 'pink',
  other: 'gray',
};

// Utility: Get weeks in current month
function getWeeksInMonth(date: Date): { start: Date; end: Date }[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const weeks = [];
  let current = start;
  while (current <= end) {
    const weekStart = current;
    const weekEnd = addDays(weekStart, 6);
    weeks.push({
      start: weekStart,
      end: weekEnd > end ? end : weekEnd,
    });
    current = addDays(weekStart, 7);
  }
  return weeks;
}

// Utility: Group tasks by week
function groupTasksByWeek(tasks: Task[], monthStart: Date): Task[][] {
  const weeks = getWeeksInMonth(monthStart);
  return weeks.map(({ start, end }) => {
    const weekTasks = tasks.filter((task: Task) => {
      if (!task.deadline) return false;
      const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
      return taskDate >= start && taskDate <= end;
    });
    return weekTasks;
  });
}

// Utility: Group tasks by category
function groupTasksByCategory(tasks: Task[]): Record<string, number> {
  return tasks.reduce((acc: Record<string, number>, task: Task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});
}

// Utility: Get last month's completed tasks
function getLastMonthCompleted(tasks: Task[], monthStart: Date): number {
  const lastMonth = subMonths(monthStart, 1);
  return tasks.filter((task: Task) => {
    if (!task.deadline) return false;
    const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
    return task.completed && taskDate.getMonth() === lastMonth.getMonth() && taskDate.getFullYear() === lastMonth.getFullYear();
  }).length;
}

function LoadingOverlay() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner size={32} message="Loading your analytics..." />
    </div>
  );
}

export default function StatsPage() {
  const { tasks, isLoading } = useTasks();
  const { user, signOut } = useAuth();
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [statsView, setStatsView] = useState<'completion' | 'streak'>('completion');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { monthly: pomodoroStats, loading: pomodoroLoading } = usePomodoroAnalytics(user?.id ?? null, undefined, monthStart);

  const username = user?.email ? user.email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[0].split('.')[0].slice(1) : 'there';

  const handlePrevMonth = () => {
    setMonthStart(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setMonthStart(prev => addMonths(prev, 1));
  };

  const handleResetMonth = () => {
    setMonthStart(startOfMonth(new Date()));
  };

  const monthlyTaskStats = useMemo(() => {
    const startDate = startOfMonth(monthStart);
    const endDate = endOfMonth(monthStart);
    const days = [];
    
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
        return format(taskDate, 'yyyy-MM-dd') === dateStr;
      });
      
      const completedTasks = dayTasks.filter(task => task.completed);
      const storedTasks = dayTasks.filter(task => !task.completed);
      
      // Calculate urgency distribution
      const urgencyStats = {
        high: dayTasks.filter(task => task.urgency === 'high').length,
        medium: dayTasks.filter(task => task.urgency === 'medium').length,
        low: dayTasks.filter(task => task.urgency === 'low').length
      };

      // Calculate category distribution
      const categoryStats = {
        study: dayTasks.filter(task => task.category === 'study').length,
        work: dayTasks.filter(task => task.category === 'work').length,
        chores: dayTasks.filter(task => task.category === 'chores').length,
        selfCare: dayTasks.filter(task => task.category === 'self-care').length,
        other: dayTasks.filter(task => task.category === 'other').length
      };

      days.push({
        date,
        total: dayTasks.length,
        completed: completedTasks.length,
        stored: storedTasks.length,
        urgencyStats,
        categoryStats,
        completionRate: dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0
      });
    }

    return days;
  }, [tasks, monthStart]);

  const streakData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), -i)).reverse();
    return last14Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
        return format(taskDate, 'yyyy-MM-dd') === dateStr;
      });
      return {
        date,
        completed: dayTasks.some(task => task.completed),
        total: dayTasks.length
      };
    });
  }, [tasks]);

  const weeks = getWeeksInMonth(monthStart);
  const tasksByWeek = groupTasksByWeek(tasks, monthStart);
  const completedByWeek = tasksByWeek.map(weekTasks => weekTasks.filter(t => t.completed).length);
  const maxCompleted = Math.max(...completedByWeek, 1);
  const weekLabels = weeks.map((_, i) => `Week ${i + 1}`);
  const pixelsPerTask = 18;
  const maxBarHeight = 180; // px, matches h-48
  const totalByWeek = tasksByWeek.map(weekTasks => weekTasks.length);
  const maxTotal = Math.max(...totalByWeek, 1);

  const thisMonthCompleted = tasks.filter(task => {
    if (!task.deadline) return false;
    const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
    return task.completed && taskDate.getMonth() === monthStart.getMonth() && taskDate.getFullYear() === monthStart.getFullYear();
  }).length;
  const lastMonthCompleted = getLastMonthCompleted(tasks, monthStart);
  const maxGauge = Math.max(thisMonthCompleted, lastMonthCompleted, 1);

  const monthTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
    return taskDate.getMonth() === monthStart.getMonth() && taskDate.getFullYear() === monthStart.getFullYear();
  });
  const categoryCounts = groupTasksByCategory(monthTasks);
  const categoryList = Object.entries(categoryCounts);
  const totalCategory = categoryList.reduce((sum, [, count]) => sum + count, 0);
  const donutColors = {
    study: '#6366f1', // indigo
    work: '#06b6d4', // cyan
    chores: '#f59e42', // amber
    'self-care': '#ec4899', // pink
    other: '#64748b', // gray
  };
  const donutIcons = {
    study: <svg width="16" height="16" fill="none"><rect x="3" y="7" width="10" height="2" rx="1" fill="#6366f1"/></svg>,
    work: <svg width="16" height="16" fill="none"><rect x="3" y="7" width="10" height="2" rx="1" fill="#06b6d4"/></svg>,
    chores: <svg width="16" height="16" fill="none"><rect x="3" y="7" width="10" height="2" rx="1" fill="#f59e42"/></svg>,
    'self-care': <svg width="16" height="16" fill="none"><rect x="3" y="7" width="10" height="2" rx="1" fill="#ec4899"/></svg>,
    other: <svg width="16" height="16" fill="none"><rect x="3" y="7" width="10" height="2" rx="1" fill="#64748b"/></svg>,
  };

  function DonutGauge({ value, max, color }: { value: number; max: number; color: string }) {
    const radius = 38;
    const stroke = 10;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const percent = Math.min(value / max, 1);
    const offset = circumference * (1 - percent);
    return (
      <svg width={radius * 2} height={radius * 2} className="block">
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="#3b2a5a"
          strokeWidth={stroke}
          opacity={0.25}
        />
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
          style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.4))' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          className="fill-white font-bold text-lg select-none"
        >
          {value}
        </text>
      </svg>
    );
  }

  function DonutCategoryChart({ data, total }: { data: [string, number][]; total: number }) {
    const radius = 38;
    const stroke = 12;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    let prev = 0;
    return (
      <svg width={radius * 2} height={radius * 2} className="block">
        {data.map(([cat, count], i) => {
          const percent = count / total;
          const arc = circumference * percent;
          const dasharray = `${arc} ${circumference - arc}`;
          const dashoffset = -prev;
          prev += arc;
          return (
            <circle
              key={cat}
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="none"
              stroke={donutColors[cat as keyof typeof donutColors] || '#64748b'}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.3))' }}
            />
          );
        })}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          className="fill-white font-bold text-lg select-none"
        >
          {total}
        </text>
      </svg>
    );
  }

  // --- Weekly Section Refactor ---
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStart = weeks[0]?.start || new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayStats = weekDates.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = toZonedTime(parseISO(task.deadline), 'UTC');
      return format(taskDate, 'yyyy-MM-dd') === dateStr;
    });
    const completed = dayTasks.filter(t => t.completed).length;
    return {
      date: day,
      dateStr,
      label: weekDays[day.getDay()],
      total: dayTasks.length,
      completed,
      isToday: dateStr === todayStr,
      tasks: dayTasks,
    };
  });
  const maxDayTotal = Math.max(...dayStats.map(d => d.total), 1);

  // --- Weekly Section UI ---
  <div className="bg-white/5 rounded-3xl shadow-lg p-6 flex flex-col hover:ring-1 hover:ring-purple-400/20 transition mb-8">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-semibold text-white/60">Weekly Analytics</h3>
      <span className="text-xs text-white/40">{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</span>
    </div>
    {/* Scrollable row of days */}
    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
      {dayStats.map((stat, i) => (
        stat.total > 0 ? (
          <motion.div
            key={stat.dateStr}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex flex-col items-center bg-gradient-to-br from-[#412f61] to-[#4a0575] rounded-2xl px-4 py-3 min-w-[90px] shadow-md hover:shadow-purple-500/30 transition-all duration-200 relative group ${stat.isToday ? 'ring-2 ring-purple-400/60 animate-pulse' : ''}`}
          >
            <div className="flex items-center w-full justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Calendar size={13} className="text-purple-300" /> {stat.label}
              </span>
              {stat.isToday && <span className="ml-1 text-xs text-mint-400">Today</span>}
            </div>
            <div className="flex items-center w-full justify-between">
              <span className="text-xs text-white/70">{format(stat.date, 'MMM d')}</span>
              {stat.completed === stat.total && stat.total > 0 && (
                <Flame size={14} className="text-orange-400 ml-1" />
              )}
            </div>
            <div className="flex items-center w-full mt-2">
              <span className="text-xs font-bold text-white mr-2">{stat.completed}/{stat.total}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-mint-400 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.total ? (stat.completed / stat.total) * 100 : 0)}%` }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div
            key={stat.dateStr}
            className="flex flex-col items-center justify-center min-w-[50px] px-2 py-2 rounded-xl bg-white/10 opacity-50 text-xs text-white/50 select-none"
          >
            <Calendar size={12} className="mb-1" />
            {stat.label}
          </div>
        )
      ))}
    </div>
    {/* Weekly highlight */}
    <div className="mt-4 text-sm text-mint-400 font-semibold">
      {(() => {
        const best = dayStats.reduce((a, b) => (a.completed > b.completed ? a : b), dayStats[0]);
        if (best.completed > 0) {
          return `This week's highlight: You crushed ${best.label} (${best.completed} completed!)`;
        }
        return 'No tasks completed yet this week.';
      })()}
    </div>
  </div>

  if (pomodoroLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="mb-6">
            <Link href="/profile" className="inline-flex items-center gap-2 text-mint-400 hover:underline text-sm font-medium mb-4">
              Back to Profile
            </Link>
          </div>
          <div className="bg-white/5 rounded-2xl shadow-lg p-8 border border-white/10">
            <Spinner size={48} message="Loading your analytics..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sticky top-0 z-20 bg-gradient-to-b from-gray-900/90 via-purple-900/80 to-transparent backdrop-blur-md py-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 md:px-4 lg:px-8">
          <div className="w-full flex flex-col gap-2 items-center justify-center sm:flex-row sm:gap-4 sm:items-center sm:w-auto sm:justify-start">
            <div className="w-full flex justify-center sm:w-auto sm:block">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#412f61] via-[#4a0575] to-[#2d1846] text-white font-extrabold shadow-[0_4px_16px_0_rgba(64,0,128,0.18)] border border-white/10 transition-all duration-150 whitespace-nowrap
                  hover:shadow-[0_8px_24px_0_rgba(128,0,255,0.25)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-mint-400"
                style={{ boxShadow: '0 2px 8px 0 #2d1846, inset 0 2px 8px 0 #4a0575' }}
              >
                Back to Profile
              </Link>
            </div>
            <div className="w-full flex justify-center sm:w-auto sm:block">
              <DateRangeSelector
                mode="month"
                monthStart={monthStart}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </div>
          </div>
          <div className="w-full flex flex-col items-center gap-2 justify-center sm:flex-row sm:items-center sm:gap-4 sm:justify-end flex-wrap">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-mint-400/10 text-mint-300 font-semibold text-base">
              <Timer size={18} className="text-mint-400" />
              Focus: <span className="ml-1 text-white font-bold">{Math.round(pomodoroStats.totalMinutes / 60)}h {Math.round(pomodoroStats.totalMinutes % 60)}m</span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-400/10 text-pink-300 font-semibold text-base">
              <span role="img" aria-label="Pomodoro">🍅</span>
              Pomodoros: <span className="ml-1 text-white font-bold">{pomodoroStats.totalSessions}</span>
            </span>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl shadow-lg p-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Weekly Task Completion (Bar Chart) */}
            <div className="bg-white/5 rounded-3xl shadow-lg p-6 flex flex-col items-center hover:ring-1 hover:ring-purple-400/20 transition">
              <h3 className="text-lg font-bold text-purple-300 mb-4">Weekly Task Completion</h3>
              <div className="w-full flex items-end justify-between h-48 gap-3">
                {completedByWeek.map((count, i) => {
                  const maxCount = Math.max(...completedByWeek, 1);
                  const barHeight = Math.max((count / maxCount) * maxBarHeight, 12);
                  return (
                    <div key={i} className="flex flex-col items-center group flex-1">
                      {/* Animated bar */}
                      <div
                        className={`w-8 md:w-10 rounded-t-xl bg-gradient-to-t from-purple-500 via-purple-400 to-mint-300 shadow-md transition-all duration-700 hover:shadow-lg hover:brightness-110 hover:ring-2 hover:ring-purple-400/40 relative`}
                        style={{ height: `${barHeight}px` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-xl bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/10 z-10">
                          {count} completed
                        </div>
                      </div>
                      <span className="mt-2 text-xs text-white/70">{weekLabels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Weekly Task Volume (Horizontal Bar Chart) */}
            <div className="bg-white/5 rounded-3xl shadow-lg p-6 flex flex-col items-center hover:ring-1 hover:ring-purple-400/20 transition">
              <h3 className="text-lg font-bold text-purple-300 mb-4">Weekly Task Volume</h3>
              <div className="w-full flex flex-col gap-4">
                {totalByWeek.map((count, i) => {
                  const barWidth = Math.max((count / maxTotal) * 100, 5); // percent, min 5%
                  return (
                    <div key={i} className="flex items-center group">
                      <span className="w-16 text-xs text-white/70 mr-2">{weekLabels[i]}</span>
                      <div className="relative flex-1 h-8 flex items-center">
                        <div
                          className={`h-6 rounded-xl bg-gradient-to-r from-purple-500 via-purple-400 to-mint-300 shadow-md transition-all duration-700 hover:shadow-lg hover:brightness-110 hover:ring-2 hover:ring-purple-400/40`}
                          style={{ width: `${barWidth}%`, minWidth: '16px' }}
                        >
                          {/* Tooltip */}
                          <div className="absolute left-1/2 -top-8 -translate-x-1/2 px-2 py-1 rounded-xl bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/10 z-10">
                            {count} tasks
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Compare with Last Month (Gauge/Donut) */}
            <div className="bg-white/5 rounded-3xl shadow-lg p-6 flex flex-col items-center hover:ring-1 hover:ring-purple-400/20 transition">
              <h3 className="text-lg font-bold text-purple-300 mb-4">Compare with Last Month</h3>
              <div className="flex gap-8 w-full justify-center">
                {/* This Month Gauge */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-sm text-white/70 mb-2">This Month</span>
                  <div className="hover:scale-105 transition-transform">
                    <DonutGauge value={thisMonthCompleted} max={maxGauge} color="#a855f7" />
                  </div>
                </div>
                {/* Last Month Gauge */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-sm text-white/70 mb-2">Last Month</span>
                  <div className="hover:scale-105 transition-transform">
                    <DonutGauge value={lastMonthCompleted} max={maxGauge} color="#5eead4" />
                  </div>
                </div>
              </div>
            </div>
            {/* Task Volume by Category (Donut Chart) */}
            <div className="bg-white/5 rounded-3xl shadow-lg p-6 flex flex-col items-center hover:ring-1 hover:ring-purple-400/20 transition">
              <h3 className="text-lg font-bold text-purple-300 mb-4">Task Volume by Category</h3>
              <div className="flex flex-col items-center w-full">
                <DonutCategoryChart data={categoryList} total={totalCategory} />
                <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs mx-auto">
                  {categoryList.map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center">
                        {donutIcons[cat as keyof typeof donutIcons]}
                      </span>
                      <span className="text-xs text-white/80 capitalize flex-1">{cat.replace('-', ' ')}</span>
                      <span className="text-xs text-white/60">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 