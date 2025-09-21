'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/rewards';
import { QuestBuilder } from '@/components/QuestBuilder';
import Image from 'next/image';
import { TaskCompletionAnimation } from '@/components/TaskCompletionAnimation';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { format, addDays, subDays, isSameDay, parseISO, parse } from 'date-fns';
import Nav from '@/components/Nav';
import { Pencil, Trash2, CheckCircle, ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import Footer from '@/components/Footer';
import BrainRocket from '@/public/brain-rocket.svg';
import { TaskCard } from '@/components/TaskCard';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Spinner } from '@/components/Spinner';
import { AllTasksCompletedCard } from '@/components/DailyTasks';
import { CalendarSync } from '@/components/CalendarSync';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

// Helper for urgency order
const urgencyOrder = { high: 0, medium: 1, low: 2 };

const Star = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={color}
      stroke={color}
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function DailyClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask, completeTask } = useTasks();
  const [showQuestBuilder, setShowQuestBuilder] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMode, setActiveMode] = useState<'tasks' | 'pomodoro'>('tasks');
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        // Try to parse the date parameter
        const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (error) {
        console.warn('Failed to parse date parameter:', error);
      }
    }
    return new Date();
  });
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    }
  }, []);

  // Update URL when selected day changes
  useEffect(() => {
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('date', dateStr);
    router.replace(`/daily?${newParams.toString()}`);
  }, [selectedDay, router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
        <Nav />
        <main className="flex-1 flex flex-col items-center justify-center w-full px-2">
          <Spinner size={48} message="Loading your daily tasks..." />
        </main>
      </div>
    );
  }

  const handleCreateTask = async (task: Task) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, task);
        setEditingTask(null);
      } else {
        await createTask(task);
      }
      setShowQuestBuilder(false);
    } catch (error) {
      console.error('Failed to create/update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this quest?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      await completeTask(task.id);
      setCompletedTask(task);
      setShowCompletionAnimation(true);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleAnimationComplete = () => {
    setShowCompletionAnimation(false);
  };

  const handlePomodoroComplete = () => {
    // You can add XP or other rewards here
    console.log('Pomodoro session completed!');
  };

  // Sort tasks by end time, then urgency
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.end_time ? new Date(a.end_time).getTime() : Infinity;
    const dateB = b.end_time ? new Date(b.end_time).getTime() : Infinity;
    if (dateA !== dateB) return dateA - dateB;
    return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
  });

  // Filter tasks for the selected day
  const filteredTasks = sortedTasks.filter(task => {
    if (!task.end_time) return false;
    const taskDate = new Date(task.end_time); // Parse as local time
    return isSameDay(taskDate, selectedDay);
  });

  const isToday = isSameDay(selectedDay, new Date());

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 overflow-x-hidden">
      <Nav />
      {/* Centered Content Block */}
      <main className="flex-1 flex flex-col items-center justify-start w-full px-2">
        {/* Guest warning */}
        {!user && (
          <div className="w-full max-w-[600px] mx-auto mt-4 mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30 text-yellow-200 text-center text-sm font-medium shadow">
            <span className="font-bold">Heads up:</span> You're not logged in. Your tasks and progress will <span className="underline">not</span> be saved unless you <Link href="/login" className="text-mint-300 underline hover:text-mint-200">log in</Link> or <Link href="/register" className="text-mint-300 underline hover:text-mint-200">create an account</Link>.
          </div>
        )}
        <div className="w-full max-w-[600px] sm:max-w-[800px] lg:max-w-[900px] mx-auto mt-8">
          {/* Header */}
          <div className="mb-6">
            {/* Desktop Header */}
            <div className="hidden sm:flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setSelectedDay(prev => subDays(prev, 1))}
                  className="group p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-sky-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200 hover:scale-105"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                </button>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400">
                  {format(selectedDay, 'EEEE, MMMM d')}
                </h1>
                <button
                  onClick={() => setSelectedDay(prev => addDays(prev, 1))}
                  className="group p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-sky-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200 hover:scale-105"
                  aria-label="Next day"
                >
                  <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCalendarSync(true)}
                  className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-sky-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200"
                  aria-label="Sync with calendar"
                >
                  <Calendar size={20} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQuestBuilder(true)}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 font-semibold shadow-lg hover:from-mint-300 hover:to-purple-300 transition-all"
                  aria-label="Add new task"
                >
                  <Plus size={20} />
                  <span>New Task</span>
                </motion.button>
              </div>
            </div>
            
            {/* Mobile Header */}
            <div className="sm:hidden">
              {/* Date Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedDay(prev => subDays(prev, 1))}
                  className="group p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-sky-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200 active:scale-95"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                </button>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400 text-center">
                  {format(selectedDay, 'EEEE, MMM d')}
                </h1>
                <button
                  onClick={() => setSelectedDay(prev => addDays(prev, 1))}
                  className="group p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-sky-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200 active:scale-95"
                  aria-label="Next day"
                >
                  <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCalendarSync(true)}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-sky-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
                  aria-label="Sync with calendar"
                >
                  <Calendar size={20} />
                  <span className="text-sm font-medium">Sync</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQuestBuilder(true)}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 font-semibold shadow-lg hover:from-mint-300 hover:to-purple-300 transition-all"
                  aria-label="Add new task"
                >
                  <Plus size={20} />
                  <span className="text-sm font-medium">New Task</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Calendar-Style Task Timeline */}
          <AnimatePresence mode="wait">
            {filteredTasks.length === 0 ? (
              <motion.div
                key="no-tasks-created"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-24 text-center relative"
              >
                {/* Clean empty state */}
                <div className="mb-6 z-10">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Calendar size={32} className="text-white/40" />
                  </div>
                </div>
                <div className="relative mb-4">
                  <p className="text-xl font-medium text-white/80">
                    No tasks scheduled
                  </p>
                </div>
                <div className="relative mb-8">
                  <p className="text-base text-white/50">
                    Add your first task to get started
                  </p>
                </div>
              </motion.div>
            ) : filteredTasks.filter(task => !task.completed).length === 0 ? (
              <AllTasksCompletedCard isToday={isToday} />
            ) : (
              <motion.div
                key="active-tasks"
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Timeline Container */}
                <div className="relative">
                  {/* Current Time Indicator */}
                  {isToday && (
                    <div className="absolute left-12 right-0 z-10" style={{
                      top: `${((new Date().getHours() - 7) * 64 + (new Date().getMinutes() / 60) * 64)}px`
                    }}>
                      <div className="flex items-center">
                        <div className="flex-1 h-px bg-red-500"></div>
                        <div className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          {format(new Date(), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Timeline Grid */}
                  <div className="space-y-1">
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = 7 + i;
                      const timeStr = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                      const isCurrentHour = isToday && new Date().getHours() === hour;
                      
                      return (
                        <div key={hour} className="relative h-16 flex items-center">
                          {/* Hour Label */}
                          <div className="w-12 text-xs text-white/40 font-medium">
                            {timeStr}
                          </div>
                          
                          {/* Timeline Line */}
                          <div className="flex-1 h-px bg-white/10 relative">
                            {/* Current hour line is handled by the current time indicator above */}
                          </div>
                          
                          {/* Tasks for this hour */}
                          <div className="absolute left-12 right-0 top-0 bottom-0">
                            {filteredTasks
                              .filter(task => !task.completed && task.start_time)
                              .filter(task => {
                                const taskHour = new Date(task.start_time!).getHours();
                                return taskHour === hour;
                              })
                              .map((task, taskIdx) => {
                                const isOverdue = task.end_time && new Date(task.end_time) < new Date() && !task.completed;
                                const urgencyColors = {
                                  high: 'bg-red-500/20 border-red-500/50 text-red-200',
                                  medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
                                  low: 'bg-green-500/20 border-green-500/50 text-green-200',
                                };
                                const urgencyColor = urgencyColors[task.urgency] || 'bg-gray-500/20 border-gray-500/50 text-gray-200';
                                
                                // Calculate position based on start time
                                const startTime = new Date(task.start_time!);
                                const startMinutes = startTime.getMinutes();
                                const topPosition = (startMinutes / 60) * 64; // 64px per hour
                                
                                // Calculate height based on duration
                                const endTime = new Date(task.end_time!);
                                const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                                const height = Math.max(32, (durationMinutes / 60) * 64); // Minimum 32px height
                                
                                return (
                                  <motion.div
                                    key={task.id || `${task.title}-${taskIdx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`absolute rounded-lg border p-3 cursor-pointer hover:bg-white/5 transition-all duration-200 ${urgencyColor} ${
                                      isOverdue ? 'ring-2 ring-red-400/50' : ''
                                    }`}
                                    style={{
                                      top: `${topPosition}px`,
                                      height: `${height}px`,
                                      width: 'calc(100% - 8px)',
                                      left: '4px'
                                    }}
                                    onClick={() => {
                                      setEditingTask(task);
                                      setShowQuestBuilder(true);
                                    }}
                                  >
                                    <div className="flex items-center justify-between h-full">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">
                                          {task.title}
                                        </h4>
                                        {task.end_time && (
                                          <p className="text-xs opacity-70 mt-1">
                                            {format(new Date(task.start_time!), 'h:mm a')} - {format(new Date(task.end_time), 'h:mm a')}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 ml-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCompleteTask(task);
                                          }}
                                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                        >
                                          <CheckCircle size={16} className="text-green-400" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(task.id);
                                          }}
                                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                        >
                                          <Trash2 size={16} className="text-red-400" />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Tasks without specific times */}
                  {filteredTasks.filter(task => !task.completed && !task.start_time).length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-sm font-medium text-white/60 mb-4">Unscheduled Tasks</h3>
                      <div className="space-y-2">
                        {filteredTasks
                          .filter(task => !task.completed && !task.start_time)
                          .map((task, idx) => {
                            const isOverdue = task.end_time && new Date(task.end_time) < new Date() && !task.completed;
                            const urgencyColors = {
                              high: 'bg-red-500/10 border-red-500/30 text-red-200',
                              medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
                              low: 'bg-green-500/10 border-green-500/30 text-green-200',
                            };
                            const urgencyColor = urgencyColors[task.urgency] || 'bg-gray-500/10 border-gray-500/30 text-gray-200';
                            
                            return (
                              <motion.div
                                key={task.id || `${task.title}-unscheduled-${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-lg border p-4 cursor-pointer hover:bg-white/5 transition-all duration-200 ${urgencyColor} ${
                                  isOverdue ? 'ring-2 ring-red-400/50' : ''
                                }`}
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowQuestBuilder(true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white">
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="text-sm text-white/60 mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    {task.end_time && (
                                      <p className="text-xs text-white/50 mt-2">
                                        Due: {format(new Date(task.end_time), 'MMM d, h:mm a')}
                                        {isOverdue && <span className="text-red-400 ml-2">Overdue</span>}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-4">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompleteTask(task);
                                      }}
                                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                      <CheckCircle size={18} className="text-green-400" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(task.id);
                                      }}
                                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                      <Trash2 size={18} className="text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      {/* Right-aligned Footer */}
      <div className="w-full flex justify-center pb-2">
        <div className="text-white/60 text-sm"><Footer /></div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showQuestBuilder && (
          <QuestBuilder
            onSubmit={async (task) => {
              if (editingTask) {
                await updateTask(editingTask.id, { ...task, id: editingTask.id });
                setEditingTask(null);
              } else {
                await createTask(task);
              }
              setShowQuestBuilder(false);
            }}
            onClose={() => {
              setShowQuestBuilder(false);
              setEditingTask(null);
            }}
            initialTask={editingTask}
            selectedDate={selectedDay}
          />
        )}
        {showCalendarSync && (
          <CalendarSync
            tasks={filteredTasks}
            onClose={() => setShowCalendarSync(false)}
          />
        )}
        {showCompletionAnimation && completedTask && (
          <TaskCompletionAnimation
            task={completedTask}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 