"use client";

import { useTasks } from '@/hooks/useTasks';
import Nav from '@/components/Nav';
import { useMemo, useState } from 'react';
import { startOfWeek, addDays, format, subWeeks, addWeeks, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Spinner } from '@/components/Spinner';
import { usePomodoroAnalytics } from '@/hooks/usePomodoroAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import DateRangeSelector from '@/components/DateRangeSelector';

const donutColors: Record<string, string> = {
  study: '#6366f1', // indigo
  work: '#06b6d4', // cyan
  chores: '#f59e42', // amber
  'self-care': '#ec4899', // pink
  other: '#64748b', // gray
};

function DonutCategoryChart({ data, total }: { data: [string, number][]; total: number }) {
  const radius = 28;
  const stroke = 10;
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
            stroke={donutColors[cat] || '#64748b'}
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
        className="fill-white font-bold text-base select-none"
      >
        {total}
      </text>
    </svg>
  );
}

// Loading Animation Component
function LoadingOverlay() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner size={32} message="Loading your analytics..." />
    </div>
  );
}

export default function WeeklyAnalyticsPage() {
  const { tasks, isLoading } = useTasks();
  const { user } = useAuth();
  const [weekStartState, setWeekStartState] = useState(() => {
    // Use a stable initial value for SSR
    const now = new Date();
    return startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate()), { weekStartsOn: 1 });
  });
  const { weekly: pomodoroStats, loading: pomodoroLoading } = usePomodoroAnalytics(user?.id ?? null, weekStartState);

  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStartState, i))
  , [weekStartState]);

  // Compute stats for each day
  const dailyStats = useMemo(() => {
    return weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = typeof task.deadline === 'string' ? parseISO(task.deadline) : task.deadline;
        return format(taskDate, 'yyyy-MM-dd') === dateStr;
      });
      const completed = dayTasks.filter(t => t.completed).length;
      const categoryCounts: Record<string, number> = {};
      dayTasks.forEach(t => {
        if (t.category) {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        }
      });
      const categoryList = Object.entries(categoryCounts);
      return {
        date: day,
        total: dayTasks.length,
        completed,
        categoryList,
        dayTasks,
      };
    });
  }, [tasks, weekDays]);

  const handlePrevWeek = () => setWeekStartState(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setWeekStartState(prev => addWeeks(prev, 1));

  if (isLoading || pomodoroLoading) {
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
            <LoadingOverlay />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-12">
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
                mode="week"
                weekStart={weekStartState}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {dailyStats.map(({ date, total, completed, categoryList }) => (
              <div key={format(date, 'yyyy-MM-dd')} className="bg-white/5 rounded-3xl shadow-lg p-6 flex flex-col items-center hover:ring-1 hover:ring-purple-400/20 transition">
                <span className="text-xs text-white/60 mb-2">{format(date, 'EEE, MMM d')}</span>
                <DonutCategoryChart data={categoryList} total={total} />
                <div className="mt-4 text-lg font-bold text-mint-400">{completed} / {total}</div>
                <div className="w-full mt-2 h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-400 to-purple-400 transition-all duration-700"
                    style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs mx-auto">
                  {categoryList.map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: donutColors[cat] || '#64748b' }} />
                      <span className="text-xs text-white/80 capitalize flex-1">{cat.replace('-', ' ')}</span>
                      <span className="text-xs text-white/60">{count}</span>
                    </div>
                  ))}
                  {categoryList.length === 0 && (
                    <span className="text-xs text-white/40 col-span-2 text-center mt-2">No tasks</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 