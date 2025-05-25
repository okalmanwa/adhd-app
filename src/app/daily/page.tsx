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
import { Pencil, Trash2, CheckCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Footer from '@/components/Footer';
import BrainRocket from '@/public/brain-rocket.svg';
import { TaskCard } from '@/components/TaskCard';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Spinner } from '@/components/Spinner';
import { AllTasksCompletedCard } from '@/components/DailyTasks';

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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask, completeTask } = useTasks();
  const [showQuestBuilder, setShowQuestBuilder] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMode, setActiveMode] = useState<'tasks' | 'pomodoro'>('tasks');
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

  // Sort tasks by due date, then urgency
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    if (dateA !== dateB) return dateA - dateB;
    return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
  });

  // Filter tasks for the selected day
  const filteredTasks = sortedTasks.filter(task => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline); // Parse as local time
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
        <div className="w-full max-w-[600px] mx-auto mt-8">
          {/* Sticky Glassy Header */}
          <div className="sticky top-4 z-20 flex items-center justify-between backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 mb-6 shadow-lg border border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDay(prev => subDays(prev, 1))}
                className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg"
                aria-label="Previous day"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sky-100 font-bold text-lg sm:text-xl md:text-2xl px-3 py-1 rounded-lg">
                {format(selectedDay, 'EEEE, MMMM d')}
              </span>
              <button
                onClick={() => setSelectedDay(prev => addDays(prev, 1))}
                className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all text-base sm:text-lg"
                aria-label="Next day"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowQuestBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 font-semibold shadow-md hover:from-mint-300 hover:to-purple-300 transition-all focus:outline-none focus:ring-2 focus:ring-mint-400"
              aria-label="Add new task"
            >
              <Plus size={22} />
              <span className="hidden sm:inline">New Task</span>
            </motion.button>
          </div>

          {/* Task List or Empty State */}
          <AnimatePresence mode="wait">
              {filteredTasks.length === 0 ? (
              <motion.div
                key="no-tasks-created"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-24 text-center relative"
              >
                {/* Static Meditating Figure SVG */}
                <div className="mb-6 z-10">
                  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Head */}
                    <circle cx="45" cy="25" r="10" fill="#f9fafb" stroke="#a5b4fc" strokeWidth="2" />
                    {/* Body */}
                    <ellipse cx="45" cy="50" rx="13" ry="18" fill="#a5b4fc" />
                    {/* Legs (crossed) */}
                    <path d="M32 70 Q45 60 58 70" stroke="#6ee7b7" strokeWidth="4" fill="none" />
                    <path d="M38 68 Q45 65 52 68" stroke="#6ee7b7" strokeWidth="3" fill="none" />
                    {/* Arms (resting on knees) */}
                    <path d="M32 55 Q25 60 35 65" stroke="#f472b6" strokeWidth="3" fill="none" />
                    <path d="M58 55 Q65 60 55 65" stroke="#f472b6" strokeWidth="3" fill="none" />
                    {/* Face (simple smile) */}
                    <path d="M42 28 Q45 31 48 28" stroke="#6ee7b7" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Aura */}
                    <ellipse cx="45" cy="50" rx="20" ry="25" fill="#f0abfc" fillOpacity="0.12" />
                  </svg>
                </div>
                {/* Main Message with Letter Animation */}
                <div className="relative mb-4">
                  <p className="text-xl sm:text-2xl font-medium relative">
                    {"Nothing's planned for today.".split('').map((char, i) => (
                      <motion.span
                        key={i}
                        className="inline-block"
                        animate={{ color: [ '#f9fafb', '#a5b4fc', '#6ee7b7', '#f0abfc', '#f472b6', '#facc15', '#38bdf8', '#f9fafb' ] }}
                        transition={{
                          color: {
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "linear",
                            delay: i * 0.1
                          }
                        }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </p>
                </div>
                <div className="relative mb-8">
                  <p className="text-base relative">
                    {"Take the day as it comes — or set a new intention".split('').map((char, i) => (
                      <motion.span
                        key={i}
                        className="inline-block"
                        animate={{ color: [ '#6ee7b7', '#a5b4fc', '#f0abfc', '#f472b6', '#facc15', '#38bdf8', '#6ee7b7' ] }}
                        transition={{
                          color: {
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "linear",
                            delay: i * 0.1
                          }
                        }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </p>
                  </div>
                {/* Twinkling stars background */}
                <div
                  className="fixed left-0 top-0 w-full h-full pointer-events-none select-none z-0"
                  style={{ pointerEvents: 'none', zIndex: 0 }}
                  aria-hidden="true"
                >
                  {Array.from({ length: 50 }).map((_, i) => {
                    const colors = [
                      '#f9fafb', '#facc15', '#6ee7b7', '#a5b4fc', '#f472b6', '#38bdf8', '#f0abfc', '#fca5a5', '#fcd34d', '#bbf7d0', '#818cf8', '#fda4af', '#67e8f9', '#c4b5fd', '#fef08a', '#fca5a5'
                    ];
                    const x = Math.random() * viewportWidth;
                    const y = Math.random() * viewportHeight;
                    const size = 2 + Math.random() * 4;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const delay = Math.random() * 2;
                    const duration = 1 + Math.random() * 2;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration,
                          delay,
                          repeat: Infinity,
                          repeatType: 'loop',
                          ease: 'easeInOut',
                        }}
                        className="absolute"
                        style={{
                          left: x,
                          top: y,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <Star size={size} color={color} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : filteredTasks.filter(task => !task.completed).length === 0 ? (
              <AllTasksCompletedCard isToday={isToday} />
              ) : (
                <motion.div
                key="active-tasks"
                className="space-y-3 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                    {filteredTasks.filter(task => !task.completed).map((task, idx) => {
                      // Fallback key for guest tasks if id is missing or not unique
                      const key = task.id || `${task.title}-${task.deadline || ''}-${idx}`;
                      const isExpanded = expandedTaskIds.includes(task.id);
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
                      const priorityLabel = task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1);
                      const priorityColors = {
                    high: 'bg-red-500 text-white',
                    medium: 'bg-yellow-400 text-black',
                    low: 'bg-green-600 text-white',
                      };
                      const priorityColor = priorityColors[task.urgency] || 'bg-gray-500 text-white';
                      const avatarUrl = task.avatar ?
                        `https://api.dicebear.com/7.x/${task.avatar.split(':')[0]}/svg?seed=${task.avatar.split(':')[1]}` : undefined;
                      const categoryColors = {
                        'study': 'bg-blue-600',
                        'chores': 'bg-orange-500',
                        'self-care': 'bg-pink-500',
                        'work': 'bg-green-600',
                        'other': 'bg-gray-500',
                      };
                      return (
                        <motion.div
                          key={key}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-[#412f61] to-[#4a0575] text-white shadow-md border border-white/10 hover:shadow-purple-500/30 hover:-translate-y-1 transition-all duration-200 mb-3"
                          tabIndex={0}
                        >
                      {/* Top Row */}
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex items-start gap-4 min-w-0">
                          {/* Avatar with urgency glow */}
                            {avatarUrl && (
                            <img
                                  src={avatarUrl}
                                  alt="Avatar"
                              className={
                                `w-10 h-10 rounded-full shadow ring-4 ring-offset-2 ring-offset-[#412f61] ` +
                                (task.urgency === 'high'
                                  ? 'ring-red-400/80'
                                  : task.urgency === 'medium'
                                  ? 'ring-yellow-300/80'
                                  : 'ring-green-400/80')
                              }
                            />
                          )}
                          <div className="space-y-1 min-w-0">
                            {/* Title row */}
                            <h3 className="font-semibold text-lg leading-tight break-words" title={task.title}>{task.title}</h3>
                            {/* Badges, show/hide, and urgency circle row */}
                            <div className="flex flex-row items-center w-full mt-1">
                              <div className="flex flex-row items-center gap-2 flex-wrap flex-1 min-w-0">
                                {task.deadline && (
                                  <span className="bg-purple-600 px-2 py-0.5 rounded-full text-white/90">
                                    Due: {format(new Date(task.deadline), 'MMM d, h:mm a')}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-white/90 ${categoryColors[task.category] || 'bg-gray-500'}`}>{task.category.charAt(0).toUpperCase() + task.category.slice(1)}</span>
                                {task.description && (
                                  <button
                                    className="flex items-center gap-1 text-xs text-mint-300 hover:text-mint-200 focus:outline-none select-none cursor-pointer group"
                                    onClick={() => setExpandedTaskIds(ids => ids.includes(task.id) ? ids.filter(id => id !== task.id) : [...ids, task.id])}
                                    aria-expanded={isExpanded}
                                    aria-controls={`desc-${task.id}`}
                                  >
                                    <motion.div
                                      animate={{ 
                                        rotate: isExpanded ? 360 : 0,
                                        scale: isExpanded ? 1.1 : 1
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-200"
                                    >
                                      {isExpanded ? (
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                          <path d="M4 8H20C21.1046 8 22 8.89543 22 10V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V10C2 8.89543 2.89543 8 4 8Z" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="text-mint-300 group-hover:text-green-400 transition-colors duration-200"
                                          />
                                          <path d="M2 10L12 14L22 10" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="text-mint-300 group-hover:text-green-400 transition-colors duration-200"
                                          />
                                          <path d="M12 14V20" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="text-mint-300 group-hover:text-green-400 transition-colors duration-200"
                                          />
                                          <path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="text-mint-300 group-hover:text-green-400 transition-colors duration-200"
                                          />
                                        </svg>
                                      ) : (
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                          <path d="M7 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18V6C5 4.89543 5.89543 4 7 4Z" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="text-mint-300 group-hover:text-green-400 transition-colors duration-200"
                                          />
                                          <path d="M9 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:text-green-400 transition-colors duration-200"/>
                                          <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:text-green-400 transition-colors duration-200"/>
                                          <path d="M9 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:text-green-400 transition-colors duration-200"/>
                                          <path d="M12 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:text-green-400 transition-colors duration-200"/>
                                        </svg>
                                      )}
                                    </motion.div>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                              </div>
                      {/* Collapsible Description/Notes */}
                      {isExpanded && task.description && (
                        <div id={`desc-${task.id}`} className="mt-2 whitespace-pre-line text-sm text-white/80">
                          {task.description}
                            </div>
                      )}
                      {/* Bottom Action Row */}
                      <div className="flex justify-end gap-3 mt-1">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowQuestBuilder(true);
                                }}
                          className="hover:text-sky-400 transition-colors cursor-pointer"
                                aria-label="Edit task"
                                title="Edit Task"
                                tabIndex={0}
                                role="button"
                                onKeyDown={e => { if (e.key === 'Enter') { setEditingTask(task); setShowQuestBuilder(true); } }}
                              >
                          <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                          className="hover:text-rose-400 transition-colors cursor-pointer"
                                aria-label="Delete task"
                                title="Delete Task"
                                tabIndex={0}
                                role="button"
                                onKeyDown={e => { if (e.key === 'Enter') handleDeleteTask(task.id); }}
                              >
                          <Trash2 size={18} />
                              </button>
                              <button
                                onClick={() => handleCompleteTask(task)}
                          className="hover:text-green-400 transition-colors cursor-pointer"
                                aria-label="Mark task complete"
                                title="Mark as Done"
                                tabIndex={0}
                                role="button"
                                onKeyDown={e => { if (e.key === 'Enter') handleCompleteTask(task); }}
                              >
                          <CheckCircle size={18} />
                              </button>
                          </div>
                        </motion.div>
                      );
                    })}
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

// Add this to your global CSS or in a style block:
// .animate-float { animation: float 2.5s ease-in-out infinite alternate; }
// @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(-12px); } } 