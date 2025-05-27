'use client';

import React from 'react';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { BarChart2, Timer } from 'lucide-react';

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
  pomodoroStats?: {
    totalFocusTime: number;
    completedPomodoros: number;
  };
}

interface WeeklyPlannerAnalyticsProps {
  weekStart: Date;
  taskStats: DayStats[];
}

export default function WeeklyPlannerAnalytics({ weekStart, taskStats }: WeeklyPlannerAnalyticsProps) {
  // Find the best day (most completed tasks)
  const maxCompleted = Math.max(...taskStats.map(s => s.completed), 0);
  const bestDayIndex = taskStats.findIndex(s => s.completed === maxCompleted && maxCompleted > 0);

  // Calculate Pomodoro stats for the week
  const pomodoroStats = taskStats.reduce((acc, stat) => {
    acc.totalFocusTime += stat.pomodoroStats?.totalFocusTime || 0;
    acc.completedPomodoros += stat.pomodoroStats?.completedPomodoros || 0;
    return acc;
  }, { totalFocusTime: 0, completedPomodoros: 0 });

  // Category color mapping
  const categoryColors: Record<string, string> = {
    study: 'bg-indigo-400',
    work: 'bg-cyan-400',
    chores: 'bg-amber-400',
    'self-care': 'bg-pink-400',
    other: 'bg-gray-400',
  };

  // Aggregate category stats for the week
  const categoryTotals = taskStats.reduce((acc, stat) => {
    (Object.entries(stat.categoryStats) as [keyof typeof stat.categoryStats, number][]).forEach(([category, count]) => {
      if (!acc[category]) {
        acc[category] = { created: 0, completed: 0 };
      }
      acc[category].created += count;
      // For completed tasks, use the category distribution of completed tasks
      if (stat.completed > 0) {
        const completedRatio = stat.completed / stat.total;
        acc[category].completed += Math.round(count * completedRatio);
      }
    });
    return acc;
  }, {} as Record<string, { created: number; completed: number }>);

  const totalCreated = Object.values(categoryTotals).reduce((sum, v) => sum + v.created, 0);
  const totalCompleted = Object.values(categoryTotals).reduce((sum, v) => sum + v.completed, 0);

  // For bar graph: show percent of created and completed per category
  const categoryList = Object.entries(categoryTotals);

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-mint-400" size={22} />
          <h2 className="text-lg font-semibold text-white">Weekly Analytics</h2>
        </div>
        <span className="text-sky-300 text-base font-medium">
          {format(weekStart, 'MMMM d')}–{format(addDays(weekStart, 6), 'd, yyyy')}
        </span>
      </div>

      {/* Pomodoro Stats Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-8 text-white text-base sm:text-lg font-semibold">
        <div className="flex items-center gap-2 mb-1 sm:mb-0">
          <Timer className="text-mint-400" size={22} />
          <span>Focus Time: <span className="text-mint-300 font-bold">{Math.round(pomodoroStats.totalFocusTime / 60)}h {Math.round(pomodoroStats.totalFocusTime % 60)}m</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Completed Pomodoros: <span className="text-mint-300 font-bold">{pomodoroStats.completedPomodoros}</span></span>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {taskStats.map((stat, index) => {
          const isToday = format(stat.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isWeekend = stat.date.getDay() === 0 || stat.date.getDay() === 6;
          const hasTasks = stat.total > 0;
          const isPerfectDay = hasTasks && stat.completed === stat.total && stat.total > 0;
          const completionQuality = hasTasks ? (stat.completed / stat.total) * 100 : 0;
          const isBestDay = index === bestDayIndex && maxCompleted > 0;

          // Badge gradient backgrounds
          const badgeGradients = {
            master: 'bg-gradient-to-r from-purple-500/80 to-purple-400/80',
            pro: 'bg-gradient-to-r from-blue-400/80 to-cyan-400/80',
            rising: 'bg-gradient-to-r from-orange-400/80 to-pink-400/80',
          };

          return (
            <div
              key={index}
              className={[
                'relative flex items-center py-4 px-3 rounded-2xl transition-all min-w-[260px] group',
                isToday ? 'ring-2 ring-white/10 ring-offset-2 ring-offset-purple-700' : '',
                isBestDay ? 'ring-2 ring-pink-500/30' : '',
                'hover:bg-purple-900/50 hover:scale-[1.02] duration-150',
                isWeekend && !hasTasks ? 'opacity-60' : '',
              ].join(' ')}
              style={{ zIndex: isToday ? 2 : 1 }}
            >
              {/* Day label horizontal */}
              <div className="flex items-center gap-2 min-w-[120px]">
                {isToday && <span className="text-mint-400 text-lg">🧠</span>}
                <span className="text-base font-bold text-white">{format(stat.date, 'EEE')}</span>
                <span className="text-white/40 text-lg">•</span>
                <span className="text-base text-white/80">{format(stat.date, 'MMM d')}</span>
                {isBestDay && (
                  <span className="ml-2 flex items-center gap-1 text-amber-300 text-xs font-bold animate-pulse">
                    <span>📈</span> Best Day
                  </span>
                )}
              </div>
              {/* Progress Bar or No Tasks */}
              <div className="flex-1 flex items-center mx-4">
                {hasTasks ? (
                  <div className="w-full flex items-center gap-2">
                    <div className="relative flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-mint-400 via-purple-400 to-mint-400 transition-[width] duration-700 ease-in-out"
                        style={{ width: `${completionQuality}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${completionQuality}%` }}
                        transition={{ duration: 0.7, ease: 'easeInOut' }}
                      />
                    </div>
                    <span className="text-base font-semibold text-white ml-2">
                      {stat.completed}/{stat.total}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="text-lg">👻</span>
                    <span className="text-sm italic text-white/30">No tasks</span>
                  </div>
                )}
              </div>
              {/* Badges */}
              <div className="flex flex-col items-end min-w-[90px]">
                {hasTasks && isPerfectDay && (
                  <div className="flex items-center gap-1">
                    {stat.total >= 5 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white shadow-sm ${badgeGradients.master}`}>👑 Master</span>
                    )}
                    {stat.total >= 3 && stat.total < 5 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white shadow-sm ${badgeGradients.pro}`}>🚀 Pro</span>
                    )}
                    {stat.total >= 1 && stat.total < 3 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white shadow-sm ${badgeGradients.rising}`}>🔥 Rising</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Category bar graph */}
      {categoryList.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-white/80 mb-2">Category Breakdown</h3>
          <div className="space-y-2">
            {categoryList.map(([cat, { created, completed }]) => {
              const createdPct = totalCreated ? Math.round((created / totalCreated) * 100) : 0;
              const completedPct = created ? Math.round((completed / created) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-white/70 capitalize">{cat.replace('-', ' ')}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`h-2 rounded-full ${categoryColors[cat] || 'bg-gray-400'}`} style={{ width: `${createdPct}%` }} />
                    <span className="text-xs text-white/60">{createdPct}%</span>
                    <div className={`h-2 rounded-full ${categoryColors[cat] || 'bg-gray-400'} opacity-60`} style={{ width: `${completedPct}%` }} />
                    <span className="text-xs text-mint-300">{completedPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-white/40">
            <span><span className="inline-block w-3 h-2 rounded-full bg-white/40 mr-1 align-middle" /> Created</span>
            <span><span className="inline-block w-3 h-2 rounded-full bg-white/80 mr-1 align-middle opacity-60" /> Completed</span>
          </div>
        </div>
      )}
    </div>
  );
} 