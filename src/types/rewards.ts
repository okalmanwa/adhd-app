export interface Reward {
  id: string;
  user_id: string;
  level: number;
  xp_points: number;
  streak: number;
  last_completed: string;
  last_claimed: string;
  created_at?: string;
  updated_at?: string;
}

export interface RewardUpdate {
  xp_points?: number;
  level?: number;
  streak?: number;
  last_claimed?: string | null;
}

export type Urgency = 'low' | 'medium' | 'high';
export type Category = 'study' | 'chores' | 'self-care' | 'work' | 'other';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  urgency: Urgency;
  category: Category;
  deadline?: string;
  estimated_minutes?: number;
  notes?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  // Quest-specific fields
  hero?: string;
  avatar?: string;
  obstacles: string[];
  win_condition?: string;
  reward?: string;
}

export const XP_PER_LEVEL = 50;
export const XP_FOR_URGENCY = {
  low: 10,
  medium: 20,
  high: 30,
} as const; 