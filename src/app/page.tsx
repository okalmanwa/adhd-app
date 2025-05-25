'use client';

import { motion } from 'framer-motion';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, Home, Calendar, Timer, BarChart2, Settings, LogOut, Brain, Bell, Gift, Palette, Music, LucideIcon, Loader2, ClipboardList, Sparkles, Circle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useTasks } from '@/hooks/useTasks';
import { format } from 'date-fns';
import { usePomodoroAnalytics } from '@/hooks/usePomodoroAnalytics';
import { Spinner } from '@/components/Spinner';

interface NavItemProps {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

// Loading Animation Component
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Spinner size={32} message="Loading your next mission..." />
    </div>
  );
}

// NavItem Component
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
            <Loader2 className="w-8 h-8 text-mint-400 animate-spin" />
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
        
        {/* Hover Effect */}
        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-mint-400 group-hover:w-full transition-all duration-300" />
        
        {/* Active State */}
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-mint-400/20" />
      </Link>
    </>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { tasks, isLoading } = useTasks();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { allTime } = usePomodoroAnalytics(user?.id ?? null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const username = user?.email ? user.email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[0].split('.')[0].slice(1) : 'there';

  const activeTasks = tasks.filter(task => !task.completed);
  const todayTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === new Date().toDateString();
  });
  const completedToday = todayTasks.filter(task => task.completed).length;

  // Calculate streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const dayTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        return taskDate.toDateString() === checkDate.toDateString();
      });

      if (dayTasks.length === 0) break;
      if (dayTasks.every(task => task.completed)) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak;
  }, [tasks]);

  // All-time completed tasks by category
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTasks.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [completedTasks]);
  const categoryList = Object.entries(categoryCounts);
  const totalCompleted = completedTasks.length;
  const donutColors: Record<string, string> = {
    study: '#6366f1', // indigo
    work: '#06b6d4', // cyan
    chores: '#f59e42', // amber
    'self-care': '#ec4899', // pink
    other: '#64748b', // gray
  };

  // Dummy stats for signed-out users
  const dummyCategoryList: [string, number][] = [
    ['study', 12],
    ['work', 8],
    ['chores', 5],
    ['self-care', 4],
    ['other', 2],
  ];
  const dummyTotalCompleted = 31;

  function DonutChart({ data, total }: { data: [string, number][]; total: number }) {
    const radius = 48;
    const stroke = 16;
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
          className="fill-white font-bold text-2xl select-none"
        >
          {total}
        </text>
      </svg>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Spinner size={32} message="Loading your next mission..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Nav />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 px-8 pt-24 pb-16">
        {/* Left: Headline & CTA */}
        <div className="flex-1 min-w-[300px]">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Welcome to Your <span className="text-mint-400">Mission Control</span></h1>
          <p className="text-xl text-gray-300 mb-8 max-w-lg">You don't need to do everything. Just take the next step. Plan, focus, and level up your life with ADHD-friendly tools.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {user ? (
              <Link href="/daily">
                <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-mint-400/80 via-white/10 to-lavender-400/80 text-white font-semibold shadow-lg backdrop-blur-md border border-white/10 transition cursor-pointer hover:bg-mint-500/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-mint-400">
                  Open Daily Planner
                </button>
              </Link>
            ) : (
              <button
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-gray-700/60 via-white/10 to-gray-500/60 text-gray-400 font-semibold shadow-lg backdrop-blur-md border border-white/10 transition cursor-not-allowed relative"
                disabled
                tabIndex={-1}
                aria-disabled="true"
              >
                Open Daily Planner
                <span className="absolute left-1/2 -bottom-9 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  This feature requires an account to use—it's an app requirement, not about your data.
                </span>
              </button>
            )}
            <Link href="/pomodoro">
              <button className="px-8 py-3 rounded-lg bg-white/10 text-white font-semibold shadow transition cursor-pointer hover:bg-mint-400/80 focus:outline-none focus:ring-2 focus:ring-mint-400">
                Start Focus Timer
              </button>
            </Link>
          </div>
        </div>
        {/* Right: Real Data Dashboard or Dummy Data */}
        <div className="flex-1 flex items-center justify-center min-w-[320px]">
          <div className="w-[320px] h-[600px] bg-gradient-to-b from-mint-400/10 to-lavender-400/10 rounded-3xl shadow-2xl border-2 border-mint-400/20 flex flex-col items-center justify-center p-4 gap-y-4">
            <div className="mb-2">
              <DonutChart data={user ? categoryList : dummyCategoryList} total={user ? totalCompleted : dummyTotalCompleted} />
            </div>
            <span className="text-lg text-white font-semibold mb-1 mt-2">All-Time Tasks Completed</span>
            <span className="text-3xl font-bold text-mint-400 mb-2">{user ? totalCompleted : dummyTotalCompleted}</span>
            <div className="mt-2 grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
              {(user ? categoryList : dummyCategoryList).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: donutColors[String(cat)] || '#64748b' }} />
                  <span className="text-xs text-white/80 capitalize flex-1">{String(cat).replace('-', ' ')}</span>
                  <span className="text-xs text-white/60">{count}</span>
                </div>
              ))}
            </div>
            {!user && (
              <span className="text-sm text-white/60 mt-6">Login to see your actual tasks and stats!</span>
            )}
            {user && totalCompleted === 0 && (
              <span className="text-sm text-white/40 mt-6">Complete your first quest to see stats!</span>
            )}
          </div>
        </div>
      </section>

      {/* ADHD-Tailored Visual Prompt */}
      <section className="flex justify-center items-center w-full mt-16 mb-12 px-4">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-stretch justify-center">
          {/* Card 1: Jump back to today's mission */}
          {user ? (
            <Link href="/daily" className="flex-1 group">
              <div className="h-full bg-gradient-to-b from-gray-900/50 via-purple-900/50 to-gray-900/50 rounded-xl shadow-lg flex flex-col items-center px-6 py-8 text-center border border-purple-400/10 transition-all duration-300 hover:shadow-purple-500/10 hover:scale-[1.02] hover:border-purple-400/20 cursor-pointer backdrop-blur-sm">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/5 mb-4 group-hover:bg-white/10 transition-colors">
                  <ClipboardList className="text-white" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Jump back to today's mission</h3>
                <p className="text-white/80 mb-4">Pick up where you left off and see your current tasks for today.</p>
                <span className="text-white font-semibold tracking-wide uppercase text-sm group-hover:underline">Go to Daily Tasks</span>
              </div>
            </Link>
          ) : (
            <div className="flex-1 group select-none">
              <div className="h-full bg-gradient-to-b from-gray-900/50 via-purple-900/50 to-gray-900/50 rounded-xl shadow-lg flex flex-col items-center px-6 py-8 text-center border border-purple-400/10 backdrop-blur-sm opacity-60 cursor-not-allowed relative">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/5 mb-4">
                  <ClipboardList className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-2">Jump back to today's mission</h3>
                <p className="text-gray-400 mb-4">Pick up where you left off and see your current tasks for today.</p>
                <span className="text-gray-400 font-semibold tracking-wide uppercase text-sm">Go to Daily Tasks</span>
                <span className="absolute left-1/2 -bottom-9 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  This feature requires an account to use—it's an app requirement, not about your data.
                </span>
              </div>
            </div>
          )}

          {/* Card 2: Start a focus session */}
          <Link href="/pomodoro" className="flex-1 group">
            <div className="h-full bg-gradient-to-b from-gray-900/50 via-purple-900/50 to-gray-900/50 rounded-xl shadow-lg flex flex-col items-center px-6 py-8 text-center border border-purple-400/10 transition-all duration-300 hover:shadow-purple-500/10 hover:scale-[1.02] hover:border-purple-400/20 cursor-pointer backdrop-blur-sm">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/5 mb-4 group-hover:bg-white/10 transition-colors">
                <Timer className="text-white" size={28} />
                <span role="img" aria-label="brain" className="text-2xl ml-1">🧠</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Start a focus session</h3>
              <p className="text-white/80 mb-4">Use the Pomodoro timer to get in the zone and make progress, one sprint at a time.</p>
              <span className="text-white font-semibold tracking-wide uppercase text-sm group-hover:underline">Start Focus Timer</span>
            </div>
          </Link>

          {/* Card 3: Or just breathe */}
          <div className="flex-1">
            <div className="h-full bg-gradient-to-b from-gray-900/50 via-purple-900/50 to-gray-900/50 rounded-xl shadow-lg flex flex-col items-center px-6 py-8 text-center border border-purple-400/10 backdrop-blur-sm">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/5 mb-4">
                <span className="text-xl text-white/90 mr-1">✨</span>
                <span className="text-2xl text-white">🚀</span>
                <span className="text-xl text-white/90 ml-1">✨</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Or just breathe.</h3>
              <p className="text-white/80 mb-4">You're doing fine. Take a moment for yourself—progress is progress, no matter the pace.</p>
              <span className="text-white font-semibold tracking-wide uppercase text-sm select-none">You've got this</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
