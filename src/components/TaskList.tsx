'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { Task } from '@/types/task';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <motion.div
          key={task.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {task.avatar && (
                  <div className="relative w-12 h-12">
                    <Image
                      src={`https://api.dicebear.com/7.x/${task.avatar.split(':')[0]}/svg?seed=${task.avatar.split(':')[1]}`}
                      alt="Avatar"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-white">{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.urgency === 'high' ? 'bg-red-400/20 text-red-400' :
                      task.urgency === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-green-400/20 text-green-400'
                    }`}>
                      {task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}
                    </span>
                    {task.deadline && (
                      <span className="text-sky-300 text-xs">
                        Due: {new Date(task.deadline).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {task.notes && (
                <p className="text-gray-400 text-sm mt-2">{task.notes}</p>
              )}
              {task.win_condition && (
                <p className="text-mint-400 text-sm mt-1">Win: {task.win_condition}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sky-300 text-sm">Reward:</span>
                <span className="text-white text-sm">{task.reward}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 