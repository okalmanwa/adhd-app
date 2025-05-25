import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/rewards';
import { useRewards } from './useRewards';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/contexts/AuthContext';

// Create a singleton Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Global state and cache management
let globalTasks: Task[] = [];
let lastFetchTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds cache
const subscribers = new Set<() => void>();
let activePromise: Promise<void> | null = null;

// LocalStorage helpers for guest tasks
const GUEST_TASKS_KEY = 'focusquest_guest_tasks';

function getGuestTasks(): Task[] {
  try {
    const data = localStorage.getItem(GUEST_TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setGuestTasks(tasks: Task[]) {
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
}

const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

export const useTasks = () => {
  const { user } = useAuth();
  const { tasks: rewardTasks, createTask: createRewardTask, updateTask: updateRewardTask, deleteTask: deleteRewardTask, completeTask: completeRewardTask, fetchTasks: fetchRewardTasks } = useRewards();
  const [tasks, setTasks] = useState<Task[]>(globalTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Guest logic ---
  const refreshGuestTasks = useCallback(() => {
    const guestTasks = getGuestTasks();
    setTasks(guestTasks);
  }, []);

  const handleCreateGuestTask = async (task: Task) => {
    const guestTasks = getGuestTasks();
    setGuestTasks([...guestTasks, task]);
    setTasks([...guestTasks, task]);
  };

  const handleUpdateGuestTask = async (taskId: string, task: Task) => {
    const guestTasks = getGuestTasks();
    const updated = guestTasks.map(t => t.id === taskId ? { ...t, ...task } : t);
    setGuestTasks(updated);
    setTasks(updated);
  };

  const handleDeleteGuestTask = async (taskId: string) => {
    const guestTasks = getGuestTasks();
    const updated = guestTasks.filter(t => t.id !== taskId);
    setGuestTasks(updated);
    setTasks(updated);
  };

  const handleCompleteGuestTask = async (taskId: string) => {
    const guestTasks = getGuestTasks();
    const updated = guestTasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
    setGuestTasks(updated);
    setTasks(updated);
  };

  // --- End guest logic ---

  const refreshTasks = useCallback(async (force: boolean = false) => {
    if (!user) {
      refreshGuestTasks();
      return;
    }

    // Prevent concurrent fetches
    if (loadingRef.current) {
      return;
    }

    const now = Date.now();
    if (!force && globalTasks.length > 0 && now - lastFetchTimestamp < CACHE_DURATION) {
      setTasks(globalTasks);
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const fetchedTasks = await fetchRewardTasks();
      globalTasks = fetchedTasks;
      lastFetchTimestamp = Date.now();
      if (mountedRef.current) {
        setTasks(fetchedTasks);
        setError(null);
      }
      notifySubscribers();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch tasks');
      if (mountedRef.current) {
        setError(error);
      }
      console.error('Error fetching tasks:', err);
      throw error;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  }, [user, fetchRewardTasks, refreshGuestTasks]);

  // Initial load and user change handler
  useEffect(() => {
    if (user) {
      refreshTasks();
    } else {
      refreshGuestTasks();
    }
  }, [user?.id]); // Only depend on user ID changes

  // Subscribe to global task updates
  useEffect(() => {
    const handleUpdate = () => {
      if (mountedRef.current) {
        setTasks([...globalTasks]);
      }
    };
    
    subscribers.add(handleUpdate);
    return () => {
      subscribers.delete(handleUpdate);
    };
  }, []);

  // Subscribe to Supabase real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          await refreshTasks(true); // Force refresh on real-time updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshTasks]);

  const handleCreateTask = async (task: Task) => {
    if (!user) {
      await handleCreateGuestTask(task);
      return;
    }
    try {
      await createRewardTask(task);
      await refreshTasks(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create task'));
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: string, task: Task) => {
    if (!user) {
      await handleUpdateGuestTask(taskId, task);
      return;
    }
    try {
      await updateRewardTask(taskId, task);
      await refreshTasks(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update task'));
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) {
      await handleDeleteGuestTask(taskId);
      return;
    }
    try {
      await deleteRewardTask(taskId);
      await refreshTasks(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete task'));
      throw err;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) {
      await handleCompleteGuestTask(taskId);
      return;
    }
    try {
      await completeRewardTask(taskId);
      await refreshTasks(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete task'));
      throw err;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    refreshTasks: () => refreshTasks(false),
    forceRefresh: () => refreshTasks(true),
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    completeTask: handleCompleteTask,
  };
}; 