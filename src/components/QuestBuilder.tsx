'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types/rewards';
import Image from 'next/image';
import { X } from 'lucide-react';
import { format, parse } from 'date-fns';

// Avatar styles from DiceBear
const AVATAR_STYLES = [
  { id: 'adventurer', name: 'Adventurer', baseUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=' },
  { id: 'bottts', name: 'Robot', baseUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=' },
  { id: 'pixel-art', name: 'Pixel', baseUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' },
  { id: 'avataaars', name: 'Avatar', baseUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' },
  { id: 'micah', name: 'Micah', baseUrl: 'https://api.dicebear.com/7.x/micah/svg?seed=' },
  { id: 'personas', name: 'Persona', baseUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=' },
];

// Hero personas with their characteristics
const HEROES = [
  {
    id: 'caffeinated-coder',
    name: 'The Caffeinated Coder',
    description: 'Ready to debug any challenge',
    icon: '☕',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=coder&backgroundColor=ff6b6b',
    color: '#FF6B6B',
  },
  {
    id: 'captain-clarity',
    name: 'Captain Clarity',
    description: 'Master of organization',
    icon: '🧭',
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=clarity&backgroundColor=4ecdc4',
    color: '#4ECDC4',
  },
  {
    id: 'queen-focus',
    name: 'Queen of Focus',
    description: 'Ruler of deep work',
    icon: '👑',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=queen&backgroundColor=ffd93d',
    color: '#FFD93D',
  },
];

// Obstacle options with images
const OBSTACLES = [
  { 
    id: 'distraction', 
    label: 'Distraction', 
    icon: '🎯', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=distraction&backgroundColor=ff6b6b&mood=confused'
  },
  { 
    id: 'anxiety', 
    label: 'Anxiety', 
    icon: '😰', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=anxiety&backgroundColor=ff6b6b&mood=sad'
  },
  { 
    id: 'starting', 
    label: 'Starting Trouble', 
    icon: '🚀', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=starting&backgroundColor=ffd93d&mood=determined'
  },
  { 
    id: 'boredom', 
    label: 'Boredom', 
    icon: '😴', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=boredom&backgroundColor=4ecdc4&mood=sleepy'
  },
];

// Default reward options with images
const DEFAULT_REWARDS = [
  { 
    id: 'youtube', 
    label: '5 min YouTube break', 
    icon: '📺', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=youtube&backgroundColor=ff6b6b&mood=happy'
  },
  { 
    id: 'snack', 
    label: 'Gummy worms', 
    icon: '🍬', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=snack&backgroundColor=ffd93d&mood=happy'
  },
  { 
    id: 'walk', 
    label: 'A walk', 
    icon: '🚶', 
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=walk&backgroundColor=4ecdc4&mood=happy'
  },
  {
    id: 'music',
    label: 'Listen to music',
    icon: '🎵',
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=music&backgroundColor=ff6b6b&mood=happy'
  },
  {
    id: 'coffee',
    label: 'Coffee break',
    icon: '☕',
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=coffee&backgroundColor=ffd93d&mood=happy'
  },
  {
    id: 'meditate',
    label: 'Quick meditation',
    icon: '🧘',
    image: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=meditate&backgroundColor=4ecdc4&mood=happy'
  }
];

interface QuestBuilderProps {
  onSubmit: (task: Task) => void;
  onClose: () => void;
  initialTask?: Task | null;
  selectedDate?: Date;
}

// Helper to format date for datetime-local input in local time
function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes())
  );
}

export function QuestBuilder({ onSubmit, onClose, initialTask, selectedDate }: QuestBuilderProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [category, setCategory] = useState(initialTask?.category || 'study');
  const [urgency, setUrgency] = useState(initialTask?.urgency || 'medium');
  const [deadline, setDeadline] = useState(() => {
    let date: Date;
    if (initialTask?.deadline) {
      date = new Date(initialTask.deadline);
      if (isNaN(date.getTime())) date = new Date();
    } else if (selectedDate) {
      date = new Date(selectedDate);
      if (date.getHours() === 0 && date.getMinutes() === 0) {
        date.setHours(23, 59, 0, 0);
      }
    } else {
      date = new Date();
      date.setHours(23, 59, 0, 0);
    }
    return toLocalDatetimeInputValue(date);
  });
  const [avatar, setAvatar] = useState(initialTask?.avatar || 'adventurer:default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(initialTask?.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (!title.trim()) {
        throw new Error('Quest title is required');
      }
      if (!avatar) {
        throw new Error('Avatar selection is required');
      }
      if (!deadline) {
        throw new Error('Deadline is required');
      }
      if (!category) {
        throw new Error('Category is required');
      }
      if (!urgency) {
        throw new Error('Urgency is required');
      }
      // Parse the deadline input value
      const localDate = new Date(deadline);
      if (isNaN(localDate.getTime())) throw new Error('Invalid date');
      const isoDeadline = localDate.toISOString();
      const taskData: Partial<Task> = {
        title,
        deadline: isoDeadline,
        avatar,
        category,
        urgency,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: undefined
      };
      await onSubmit(taskData as Task);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-xl p-2 sm:p-4 md:p-6 w-[80vw] max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
      >
        <div className="relative mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400 pr-10">
            Create New Quest
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-0 right-0 text-sky-300 hover:text-sky-200 text-2xl sm:text-3xl p-2"
            aria-label="Close"
          >
            ✕
          </motion.button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <label className="block text-sky-300 mb-2">Quest Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base sm:text-lg"
                required
                placeholder="What's your quest?"
              />
            </div>
            <div>
              <label className="block text-sky-300 mb-2">Deadline (Date & Time)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base sm:text-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                required
              />
            </div>
            <div>
              <label className="block text-sky-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Task['category'])}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base sm:text-lg"
                required
              >
                <option value="study">Study</option>
                <option value="chores">Chores</option>
                <option value="self-care">Self Care</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sky-300 mb-2">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Task['urgency'])}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base sm:text-lg"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sky-300 mb-2">Description <span className='text-white/40'>(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base sm:text-lg"
              placeholder="Add more context or details (optional)"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sky-300 mb-2">Choose Your Avatar</label>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {AVATAR_STYLES.map((style) => (
                <motion.button
                  key={style.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setAvatar(`${style.id}:${style.id}`)}
                  className={`min-w-[80px] sm:min-w-[96px] p-2 sm:p-4 rounded-lg border-2 flex flex-col items-center space-y-2 ${
                    avatar.startsWith(style.id)
                      ? 'border-mint-400 bg-mint-400/10'
                      : 'border-white/10 hover:border-mint-400/50'
                  }`}
                >
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                    <Image
                      src={`${style.baseUrl}${style.id}`}
                      alt={style.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="text-white text-xs sm:text-sm">{style.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 font-semibold rounded-xl hover:from-mint-300 hover:to-purple-300 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {initialTask ? 'Save Changes' : 'Create Quest'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 