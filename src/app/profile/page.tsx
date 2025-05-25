'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import Nav from '@/components/Nav';
import { motion } from 'framer-motion';
import { BarChart2, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import Footer from '@/components/Footer';
import { Spinner } from '@/components/Spinner';

const AVATAR_STYLES = [
  { id: 'adventurer', name: 'Adventurer', baseUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=' },
  { id: 'bottts', name: 'Robot', baseUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=' },
  { id: 'pixel-art', name: 'Pixel', baseUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' },
  { id: 'avataaars', name: 'Avatar', baseUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' },
  { id: 'micah', name: 'Micah', baseUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=' },
  { id: 'personas', name: 'Persona', baseUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=' },
  { id: 'notionists', name: 'Notionist', baseUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=' },
  { id: 'fun-emoji', name: 'Fun Emoji', baseUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=' },
  { id: 'shapes', name: 'Shapes', baseUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=' },
  { id: 'icons', name: 'Icons', baseUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=' },
  { id: 'lorelei', name: 'Lorelei', baseUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=' },
  { id: 'miniavs', name: 'Miniavs', baseUrl: 'https://api.dicebear.com/7.x/miniavs/svg?seed=' },
];

const ENCOURAGEMENT_MESSAGES = [
  "Done is better than perfect.",
  "You're not lazy. Your brain just works differently.",
  "Slow progress is still progress.",
  "Focus is a skill, not a personality trait.",
  "Every small win counts. Keep going!",
  "It's okay to take breaks. Your brain needs them.",
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { tasks, isLoading } = useTasks();
  const router = useRouter();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar_style || 'adventurer');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [encouragementMessage] = useState(() => 
    ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)]
  );

  const handleAvatarChange = async (avatarId: string) => {
    try {
      setIsSavingAvatar(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      await supabase.auth.updateUser({
        data: { avatar_style: avatarId }
      });
      
      setSelectedAvatar(avatarId);
      setShowAvatarPicker(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weeklyTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });

    const completedTasks = weeklyTasks.filter(task => task.completed);
    const completionRate = weeklyTasks.length > 0 
      ? Math.round((completedTasks.length / weeklyTasks.length) * 100) 
      : 0;

    return {
      total: weeklyTasks.length,
      completed: completedTasks.length,
      completionRate,
      days: weekDays,
    };
  };

  // Calculate monthly stats
  const getMonthlyStats = () => {
    const tasksByCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedTasks = tasks.filter(task => task.completed);
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      categories: tasksByCategory,
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Spinner size={48} message="Loading your profile..." />
      </div>
    );
      }

  const avatarUrl = `https://api.dicebear.com/7.x/${selectedAvatar}/svg?seed=${user?.email || 'default'}`;
  const firstName = user?.email ? user.email.split('@')[0].split(/[._-]/)[0] : 'there';
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Info */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white mb-4 mx-auto shadow-xl">
              <Image
                src={avatarUrl}
                alt="Profile Avatar"
                width={96}
                height={96}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
              <button
                onClick={() => setShowAvatarPicker(v => !v)}
              className="absolute bottom-4 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-mint-100 transition-colors"
              >
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showAvatarPicker ? 'rotate-180' : ''}`} />
              </button>
              {showAvatarPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 z-10">
                <div className="grid grid-cols-3 gap-2 min-w-[300px]">
                  {AVATAR_STYLES.map((style) => (
                      <button
                      key={style.id}
                      onClick={() => handleAvatarChange(style.id)}
                        disabled={isSavingAvatar}
                      className={`p-2 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                        selectedAvatar === style.id
                          ? 'border-mint-400 bg-mint-50'
                          : 'border-transparent hover:border-mint-200'
                      }`}
                    >
                      <div className="relative w-12 h-12">
                        <Image
                          src={`${style.baseUrl}${user?.email || 'default'}`}
                          alt={style.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          <h2 className="text-2xl font-semibold text-white mb-1">👋 Welcome back, {displayName}!</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-1">Logged in with Supabase</p>
          <p className="text-purple-200 italic text-sm mt-2">"{encouragementMessage}"</p>
            </div>

            {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Overview */}
              <Link
                href="/weekly-analytics"
            className="bg-purple-950/80 backdrop-blur-sm rounded-xl border border-purple-900 p-6 hover:bg-purple-950 transition-colors group"
              >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-mint-400" size={24} />
              <h3 className="text-xl font-bold text-white">📅 Weekly Progress</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-900/60 rounded-lg p-4">
                  <div className="text-sm text-gray-300">Total Tasks</div>
                  <div className="text-2xl font-bold text-white">{weeklyStats.total}</div>
                </div>
                <div className="bg-purple-900/60 rounded-lg p-4">
                  <div className="text-sm text-gray-300">Completed</div>
                  <div className="text-2xl font-bold text-white">{weeklyStats.completed}</div>
                </div>
              </div>
              <div className="bg-purple-900/60 rounded-lg p-4">
                <div className="text-sm text-gray-300">Completion Rate</div>
                <div className="text-2xl font-bold text-white">{weeklyStats.completionRate}%</div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
              </Link>

          {/* Monthly Overview */}
          <Link
            href="/stats"
            className="bg-purple-950/80 backdrop-blur-sm rounded-xl border border-purple-900 p-6 hover:bg-purple-950 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="text-lavender-400" size={24} />
              <h3 className="text-xl font-bold text-white">📈 Monthly Overview</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-900/60 rounded-lg p-4">
                  <div className="text-sm text-gray-300">Total Tasks</div>
                  <div className="text-2xl font-bold text-white">{monthlyStats.totalTasks}</div>
                </div>
                <div className="bg-purple-900/60 rounded-lg p-4">
                  <div className="text-sm text-gray-300">Completed</div>
                  <div className="text-2xl font-bold text-white">{monthlyStats.completedTasks}</div>
                </div>
              </div>
              <div className="bg-purple-900/60 rounded-lg p-4">
                <div className="text-sm text-gray-300">Categories</div>
                <div className="space-y-2 mt-2">
                  {Object.entries(monthlyStats.categories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{category}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
            </div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
          </div>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={() => signOut()}
            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20 hover:border-white/30"
          >
            Sign Out
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
} 