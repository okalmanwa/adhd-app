'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Task } from '@/types/rewards';
import { TaskCard } from '@/components/TaskCard';
import { Plus, ArrowUpRight } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useDroppable } from '@dnd-kit/core';
import { QuestBuilder } from '@/components/QuestBuilder';
import { useRouter } from 'next/navigation';
import React from 'react';

interface DayColumnProps {
  day: Date;
  tasks: Task[];
  isCompact?: boolean;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  isCurrentMonth?: boolean;
}

const DayColumn = ({
  day,
  tasks,
  isCompact = false,
  onTaskEdit,
  onTaskDelete,
  onTaskComplete,
  isCurrentMonth = true
}: DayColumnProps) => {
  const router = useRouter();
  const { createTask } = useTasks();
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const dateStr = format(day, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  const handleCreateTask = async (task: Task) => {
    try {
      await createTask(task);
      setIsCreatingTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const navigateToDaily = () => {
    router.push(`/daily?date=${dateStr}`);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col ${
        isCompact ? 'min-h-[100px]' : 'min-h-[200px]'
      } bg-white/5 rounded-lg p-2 sm:p-3 transition-all duration-200 ${
        isToday ? 'ring-2 ring-mint-400' : ''
      } ${
        isOver ? 'bg-white/10 ring-2 ring-mint-400/50' : ''
      } hover:bg-white/10 ${
        !isCurrentMonth ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={navigateToDaily}
          className="flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1">
            <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-mint-400' : isCurrentMonth ? 'text-gray-400' : 'text-gray-500'}`}>
              {format(day, 'EEE')}
            </span>
            <span className={`text-xs sm:text-sm ${isToday ? 'text-mint-400' : isCurrentMonth ? 'text-gray-400' : 'text-gray-500'}`}>
              {format(day, 'd')}
            </span>
          </div>
          <ArrowUpRight 
            size={14} 
            className="text-sky-300" 
          />
        </motion.button>
        {isCurrentMonth && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCreatingTask(true)}
            className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </motion.button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isCompact={true}
            onEdit={() => onTaskEdit(task)}
            onDelete={() => onTaskDelete(task)}
            onComplete={() => onTaskComplete(task)}
          />
        ))}
      </div>

      {isCreatingTask && (
        <QuestBuilder
          onSubmit={handleCreateTask}
          onClose={() => setIsCreatingTask(false)}
          selectedDate={day}
        />
      )}
    </div>
  );
};

export default React.memo(DayColumn); 