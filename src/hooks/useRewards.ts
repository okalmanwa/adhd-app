'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Reward, XP_FOR_URGENCY } from '@/types/rewards';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types/rewards';

export function useRewards() {
  const [reward, setReward] = useState<Reward | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (user) {
      fetchReward();
      fetchTasks();
    }
  }, [user]);

  const fetchReward = async () => {
    if (!user) return;

    try {
      // Try to fetch the reward directly
      const { data, error } = await supabase
        .from('rewards')
        .select('*', { head: false })
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // If no record found, create one
        if (error.code === 'PGRST116') {
          const { data: newReward, error: createError } = await supabase
            .from('rewards')
            .insert([
              {
                user_id: user.id,
                level: 1,
                xp_points: 0,
                streak: 0,
                last_completed: new Date().toISOString(),
                last_claimed: new Date().toISOString().split('T')[0]
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating reward:', {
              message: createError.message,
              code: createError.code,
              details: createError.details
            });
            // Set default state on creation error
            setReward({
              id: crypto.randomUUID(),
              user_id: user.id,
              level: 1,
              xp_points: 0,
              streak: 0,
              last_completed: new Date().toISOString(),
              last_claimed: new Date().toISOString().split('T')[0]
            });
            return;
          }
          setReward(newReward);
          return;
        }

        // For other errors, log and set default state
        console.error('Error fetching reward:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        setReward({
          id: crypto.randomUUID(),
          user_id: user.id,
          level: 1,
          xp_points: 0,
          streak: 0,
          last_completed: new Date().toISOString(),
          last_claimed: new Date().toISOString().split('T')[0]
        });
        return;
      }

      // If we got data, set it
      setReward(data);
    } catch (error: any) {
      // Handle any unexpected errors
      console.error('Unexpected error in fetchReward:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      });
      // Set default state on unexpected error
      setReward({
        id: crypto.randomUUID(),
        user_id: user.id,
        level: 1,
        xp_points: 0,
        streak: 0,
        last_completed: new Date().toISOString(),
        last_claimed: new Date().toISOString().split('T')[0]
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  };

  const grantXP = async (urgency: keyof typeof XP_FOR_URGENCY) => {
    if (!user || !reward) return;

    try {
      const xpGained = XP_FOR_URGENCY[urgency];
      const newXP = reward.xp_points + xpGained;
      const newLevel = Math.floor(newXP / 50) + 1;

      const { error } = await supabase
        .from('rewards')
        .update({
          xp_points: newXP,
          level: newLevel,
          last_completed: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setReward(prev => prev ? { ...prev, xp_points: newXP, level: newLevel } : null);
    } catch (error) {
      console.error('Error granting XP:', error);
    }
  };

  const updateStreak = async () => {
    if (!user || !reward) return;

    try {
      const lastCompleted = new Date(reward.last_completed);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = reward.streak;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }

      const { error } = await supabase
        .from('rewards')
        .update({ streak: newStreak })
        .eq('user_id', user.id);

      if (error) throw error;
      setReward(prev => prev ? { ...prev, streak: newStreak } : null);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const createTask = async (task: Task) => {
    if (!user) return null;

    try {
      // Validate required fields
      if (!task.title?.trim()) {
        throw new Error('Task title is required');
      }

      if (!task.urgency || !['low', 'medium', 'high'].includes(task.urgency)) {
        throw new Error('Valid urgency level is required');
      }

      if (!task.category || !['study', 'chores', 'self-care', 'work', 'other'].includes(task.category)) {
        throw new Error('Valid category is required');
      }

      // Ensure deadline is in UTC format and set to 11:59 PM
      let deadline = task.deadline;
      if (deadline) {
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(23, 59, 59, 999);
        deadline = deadlineDate.toISOString();
      }

      // Prepare task data
      const taskData = {
        ...task,
        user_id: user.id,
        title: task.title.trim(),
        deadline,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        throw new Error('No data returned after task creation');
      }

      // Update local state with the new task
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error in createTask:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(task => task.id === taskId ? data : task));
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    if (!user) return;

    try {
      // Get task to determine XP
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      // Update task as completed
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update the task in the list instead of removing it
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));

      // Grant XP based on urgency
      await grantXP(task.urgency);
      await updateStreak();

      return task;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  return {
    reward,
    tasks,
    loading,
    level: reward?.level ?? 1,
    xp: reward?.xp_points ?? 0,
    xpForNextLevel: 50,
    grantXP,
    updateStreak,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    fetchTasks,
  };
} 