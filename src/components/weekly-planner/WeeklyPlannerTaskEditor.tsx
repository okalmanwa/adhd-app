'use client';

import React from 'react';
import { QuestBuilder } from '@/components/QuestBuilder';
import { Task } from '@/types/rewards';

interface WeeklyPlannerTaskEditorProps {
  editingTask: Task | null;
  viewMode: 'week' | 'month';
  selectedDate: Date;
  onTaskUpdate: (task: Task) => Promise<void>;
  onClose: () => void;
}

export default function WeeklyPlannerTaskEditor({
  editingTask,
  viewMode,
  selectedDate,
  onTaskUpdate,
  onClose,
}: WeeklyPlannerTaskEditorProps) {
  if (!editingTask) return null;

  return (
    <QuestBuilder
      onSubmit={async (task) => {
        await onTaskUpdate({ ...task, id: editingTask.id });
        onClose();
      }}
      onClose={onClose}
      initialTask={editingTask}
      selectedDate={selectedDate}
    />
  );
} 