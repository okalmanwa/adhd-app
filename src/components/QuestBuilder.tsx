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
  const [startTime, setStartTime] = useState(() => {
    if (initialTask?.start_time) {
      return toLocalDatetimeInputValue(new Date(initialTask.start_time));
    }
    // Default to current time
    return toLocalDatetimeInputValue(new Date());
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialTask?.end_time) {
      return toLocalDatetimeInputValue(new Date(initialTask.end_time));
    }
    if (initialTask?.deadline) {
      // If we have an old deadline, use it as end time
      return toLocalDatetimeInputValue(new Date(initialTask.deadline));
    }
    // Default to current time + 1 hour
    const defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    return toLocalDatetimeInputValue(defaultEnd);
  });
  const [avatar, setAvatar] = useState(initialTask?.avatar || 'adventurer:default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return title.trim().length > 0;
      case 2:
        return endTime && category && avatar;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      console.log('QuestBuilder: Starting task creation with data:', {
        title,
        startTime,
        endTime,
        category,
        avatar
      });
      
      if (!title.trim()) {
        throw new Error('Quest title is required');
      }
      if (!avatar) {
        throw new Error('Avatar selection is required');
      }
      if (!endTime) {
        throw new Error('End time is required');
      }
      if (!category) {
        throw new Error('Category is required');
      }
      
      // Parse start time if provided
      let isoStartTime: string | undefined;
      if (startTime) {
        const startDate = new Date(startTime);
        if (isNaN(startDate.getTime())) throw new Error('Invalid start time');
        isoStartTime = startDate.toISOString();
      }
      
      // Parse end time (required) - this becomes our deadline
      const endDate = new Date(endTime);
      if (isNaN(endDate.getTime())) throw new Error('Invalid end time');
      const isoEndTime = endDate.toISOString();
      
      const taskData: Partial<Task> = {
        title,
        deadline: isoEndTime, // End time becomes the deadline
        start_time: isoStartTime,
        end_time: isoEndTime,
        avatar,
        category,
        urgency: 'medium', // Default to medium urgency
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">What's your quest?</h3>
              <p className="text-gray-400">Give your task a clear, motivating title and set the timing</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sky-300 mb-3 text-sm font-medium">Quest Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-lg placeholder-gray-500"
                  placeholder="e.g., Finish the presentation, Clean my room, Study for exam"
                  required
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sky-300 mb-3 text-sm font-medium">Start Time (optional)</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sky-300 mb-3 text-sm font-medium">End Time <span className="text-red-400">*</span></label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Categorize & Personalize</h3>
              <p className="text-gray-400">Choose category and pick your avatar</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sky-300 mb-3 text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Task['category'])}
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-mint-400 text-base"
                  required
                >
                  <option value="study">📚 Study</option>
                  <option value="chores">🧹 Chores</option>
                  <option value="self-care">💆 Self Care</option>
                  <option value="work">💼 Work</option>
                  <option value="other">🔧 Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sky-300 mb-3 text-sm font-medium">Choose Your Avatar</label>
                <div className="grid grid-cols-2 gap-3">
                  {AVATAR_STYLES.map((style) => (
                    <motion.button
                      key={style.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setAvatar(`${style.id}:${style.id}`)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center space-y-3 transition-all ${
                        avatar.startsWith(style.id)
                          ? 'border-mint-400 bg-mint-400/10'
                          : 'border-white/10 hover:border-mint-400/50 bg-white/5'
                      }`}
                    >
                      <div className="relative w-16 h-16">
                        <Image
                          src={`${style.baseUrl}${style.id}`}
                          alt={style.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-white text-sm font-medium">{style.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400">
              {initialTask ? 'Edit Quest' : 'Create Quest'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
              aria-label="Close"
            >
              <X size={20} />
            </motion.button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-mint-400' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {renderStepContent()}
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-gray-900/50">
            <div className="flex justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  className="px-6 py-3 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                  }}
                  className="px-6 py-3 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    nextStep();
                  }}
                  disabled={!canProceed()}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    canProceed()
                      ? 'bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 hover:from-mint-300 hover:to-purple-300 shadow-lg'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !canProceed()}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    !isSubmitting && canProceed()
                      ? 'bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 hover:from-mint-300 hover:to-purple-300 shadow-lg'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Creating...' : (initialTask ? 'Save Changes' : 'Create Quest')}
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 