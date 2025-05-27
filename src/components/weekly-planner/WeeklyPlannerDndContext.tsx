'use client';

import React, { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Task } from '@/types/rewards';
import { TaskCard } from '../TaskCard';

interface WeeklyPlannerDndContextProps {
  displayDays: Date[];
  groupedTasks: { [key: string]: Task[] };
  monthStart: Date;
  viewMode: 'week' | 'month';
  activeTask: Task | null;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
}

export default function WeeklyPlannerDndContext({
  displayDays,
  groupedTasks,
  monthStart,
  viewMode,
  activeTask,
  onTaskEdit,
  onTaskDelete,
  onTaskComplete,
  onDragStart,
  onDragEnd,
  children,
}: WeeklyPlannerDndContextProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 10,
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      {children}
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEdit={() => onTaskEdit(activeTask)}
            onDelete={() => onTaskDelete(activeTask)}
            onComplete={() => onTaskComplete(activeTask)}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 