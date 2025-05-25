'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Plus, X, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Task, Urgency, Category } from '@/types/rewards';
import { Spinner } from '@/components/Spinner';

const FloralSVG = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
    <ellipse cx="24" cy="24" rx="18" ry="10" fill="#A7F3D0"/>
    <ellipse cx="24" cy="18" rx="6" ry="3" fill="#FDE68A"/>
    <ellipse cx="18" cy="28" rx="3" ry="6" fill="#FDE68A"/>
    <ellipse cx="30" cy="28" rx="3" ry="6" fill="#FDE68A"/>
    <rect x="22.5" y="24" width="3" height="12" rx="1.5" fill="#6EE7B7"/>
  </svg>
);

function AllTasksCompletedCard({ isToday }: { isToday: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[40vh]">
      <span className="text-4xl mb-2">🌿</span>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">All Done!</h2>
      <p className="text-mint-200 text-base font-medium text-center">
        {isToday ? "Time to take a breath and enjoy your free time." : "No tasks scheduled for this day."}
      </p>
    </div>
  );
}

export default function DailyTasks() {
  const { tasks, createTask, completeTask, deleteTask, isLoading } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTask, setNewTask] = useState<Partial<Task>>(() => {
    // Initialize with the selected date at 11:59 PM
    const initialDate = new Date();
    initialDate.setHours(23, 59, 59, 999);
    return {
      title: '',
      description: '',
      deadline: format(initialDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
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
      user_id: ''
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0);

  const handleCreateTask = async () => {
    try {
      setIsSaving(true);
      // Use the selected date at 11:59 PM
      const deadlineDate = new Date(selectedDate);
      deadlineDate.setHours(23, 59, 59, 999);
      
      const taskToCreate = {
        ...newTask,
        deadline: format(deadlineDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Task;
      
      await createTask(taskToCreate);
      
      // Reset form with the current selected date at 11:59 PM
      const resetDate = new Date(selectedDate);
      resetDate.setHours(23, 59, 59, 999);
      setNewTask({
        title: '',
        description: '',
        deadline: format(resetDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
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
        user_id: ''
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      // Force a re-render by updating the selected date
      setSelectedDate(new Date(selectedDate));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    // Update newTask with the new date at 11:59 PM
    const deadlineDate = new Date(newDate);
    deadlineDate.setHours(23, 59, 59, 999);
    setNewTask(prev => ({
      ...prev,
      deadline: format(deadlineDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    }));
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    // Update newTask with the new date at 11:59 PM
    const deadlineDate = new Date(newDate);
    deadlineDate.setHours(23, 59, 59, 999);
    setNewTask(prev => ({
      ...prev,
      deadline: format(deadlineDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    }));
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    // Update newTask with today's date at 11:59 PM
    const deadlineDate = new Date(today);
    deadlineDate.setHours(23, 59, 59, 999);
    setNewTask(prev => ({
      ...prev,
      deadline: format(deadlineDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    }));
  };

  // Filter tasks for selected date
  const selectedDateStart = startOfDay(selectedDate);
  const selectedDateEnd = endOfDay(selectedDate);
  const tasksForDay = tasks.filter(task => {
    if (!task.deadline) return false;
    const taskDate = parseISO(task.deadline);
    return isWithinInterval(taskDate, { start: selectedDateStart, end: selectedDateEnd });
  });
  const activeTasks = tasksForDay.filter(task => !task.completed);

  // Update active task count whenever tasks change
  useEffect(() => {
    setActiveTaskCount(activeTasks.length);
  }, [activeTasks.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4 flex items-center justify-center">
        <Spinner size={64} message="Loading your dashboard..." />
      </div>
    );
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Date Navigation */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400">
            Daily Missions
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleToday}
              className={`px-4 py-2 rounded-lg ${isToday ? 'bg-mint-400 text-gray-900' : 'bg-white/10 text-sky-300'} hover:bg-mint-400 hover:text-gray-900 transition-all font-medium`}
            >
              {isToday ? 'Today' : 'Go to Today'}
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg bg-white/10 text-sky-300 hover:bg-white/20 transition-all"
            >
              <ChevronRight size={20} />
            </button>
            <span className="text-white font-medium px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              {format(selectedDate, 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Task Creation Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">Create New Task</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Description</label>
              <textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white"
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Category</label>
                <select
                  value={newTask.category}
                  onChange={e => setNewTask({ ...newTask, category: e.target.value as Category })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white"
                >
                  <option value="study">Study</option>
                  <option value="work">Work</option>
                  <option value="chores">Chores</option>
                  <option value="self-care">Self Care</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Urgency</label>
                <select
                  value={newTask.urgency}
                  onChange={e => setNewTask({ ...newTask, urgency: e.target.value as Urgency })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Deadline</label>
              <input
                type="datetime-local"
                value={newTask.deadline ? format(parseISO(newTask.deadline), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={e => {
                  const date = new Date(e.target.value);
                  // Ensure we keep seconds and milliseconds at max when user changes the date/time
                  date.setSeconds(59);
                  date.setMilliseconds(999);
                  setNewTask(prev => ({
                    ...prev,
                    deadline: format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Estimated Time (minutes)</label>
              <input
                type="number"
                value={newTask.estimated_minutes}
                onChange={e => setNewTask({ ...newTask, estimated_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white"
                min="1"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreateTask}
                disabled={isSaving || !newTask.title}
                className="px-6 py-2 rounded-lg bg-mint-400 text-gray-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-mint-500 transition-colors"
              >
                <Plus size={18} />
                <span className="font-medium">{isSaving ? 'Creating...' : 'Create Task'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Tasks or Empty State */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Active Tasks</h2>
          <AnimatePresence mode="wait">
              {activeTasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-stretch bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg border border-mint-400/10 p-0 overflow-hidden"
                >
                  {/* Floral accent */}
                  <div className="flex flex-col justify-center items-center px-4 py-6 bg-white/20">
                    <FloralSVG />
                  </div>
                  {/* Divider */}
                  <div className="w-px bg-mint-400/30 my-6" />
                  {/* Task content */}
                  <div className="flex-1 px-6 py-6 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-white mb-2 font-serif tracking-tight">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-gray-200 text-base mb-1 font-mono opacity-80">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 mt-2 text-xs text-mint-200">
                        <span className="uppercase tracking-widest">{task.urgency} priority</span>
                        <span>⏱ {task.estimated_minutes} min</span>
                        <span className="capitalize">{task.category}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="p-2 rounded-lg bg-mint-400/20 text-mint-400 hover:bg-mint-400/30 transition-colors"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export { AllTasksCompletedCard };