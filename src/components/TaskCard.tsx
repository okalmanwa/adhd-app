'use client';

import { motion } from 'framer-motion';
import { Task } from '@/types/rewards';
import { format } from 'date-fns';
import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Check } from 'lucide-react';
import React from 'react';
import { Edit2, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isCompact?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit: (e?: React.MouseEvent) => void;
  onDelete: (e?: React.MouseEvent) => void;
  onComplete: (task: Task) => void;
  isDragging?: boolean;
}

function TaskCard({ task, isCompact = false, onEdit, onDelete, onComplete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: 'none',
  };

  const urgencyColors = {
    high: 'bg-red-500/20 border-red-500/50',
    medium: 'bg-yellow-500/20 border-yellow-500/50',
    low: 'bg-green-500/20 border-green-500/50',
  };

  const urgencyColor = urgencyColors[task.urgency || 'low'];

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(e);
  };

  const cardBg = 'bg-gradient-to-br from-[#412f61] to-[#4a0575] border border-white/10 shadow-md hover:shadow-purple-500/30 transition-all duration-200';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-xl p-4 flex flex-col gap-2 group relative cursor-pointer ${cardBg} ${
        task.completed 
          ? 'opacity-50 bg-gray-700/50 border-gray-600' 
          : ''
      }`}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={0}
      role="button"
      aria-roledescription="draggable"
      aria-disabled={false}
    >
      <div className="flex items-start gap-2">
        {task.avatar && (
          <div className={`relative w-8 h-8 flex-shrink-0 cursor-pointer rounded-full bg-white shadow ring-4 ring-offset-2 ring-offset-[#412f61] ${
            !task.completed && task.deadline && new Date(task.deadline) < new Date() 
              ? 'border-2 border-red-400 animate-bounce shadow-red-400/60 shadow-lg' 
              : task.urgency === 'high'
                ? 'ring-red-400/80'
                : task.urgency === 'medium'
                ? 'ring-yellow-300/80'
                : 'ring-green-400/80'
          }`}>
            <Image
              src={`https://api.dicebear.com/7.x/${task.avatar.split(':')[0]}/svg?seed=${task.avatar.split(':')[1]}`}
              alt="Avatar"
              fill
              className="object-contain"
              unoptimized
            />
            {!task.completed && task.deadline && new Date(task.deadline) < new Date() && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-lg" aria-label="Feeling overwhelmed" title="Feeling overwhelmed" aria-hidden="true">😰</span>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${task.completed ? 'text-gray-400' : 'text-white'}`}>
            {task.title}
          </h4>
          {!isCompact && task.description && (
            <p className={`line-clamp-2 mt-1 ${task.completed ? 'text-gray-500' : 'text-sky-300/70'}`}>
              {task.description}
            </p>
          )}
          {isCompact && task.deadline && (
            <div className={`mt-1 text-xs ${task.completed ? 'text-gray-500' : 'text-sky-300/50'}`}>
              Due: {format(new Date(task.deadline), 'h:mm a')}
            </div>
          )}
          {!isCompact && task.deadline && (
            <div className={`mt-1 text-xs ${task.completed ? 'text-gray-500' : 'text-sky-300/50'}`}>
              Due: {format(new Date(task.deadline), 'MMM d, yyyy, h:mm a')}
            </div>
          )}
        </div>
        {task.estimated_minutes && (
          <div className={`flex-shrink-0 ${task.completed ? 'text-gray-500' : 'text-sky-300/70'}`}>
            {Math.floor(task.estimated_minutes / 60)}h {task.estimated_minutes % 60}m
          </div>
        )}
      </div>
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={handleComplete}
          className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <Check size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export { TaskCard }; 