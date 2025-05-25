'use client';

import React, { useEffect } from 'react';
import Confetti from 'react-confetti';
import { Task } from '@/types/rewards';

interface TaskCompletionAnimationProps {
  task: Task;
  onComplete: () => void;
}

export function TaskCompletionAnimation({ task, onComplete }: TaskCompletionAnimationProps) {
  useEffect(() => {
    console.log('TaskCompletionAnimation mounted for task:', task.title);
    const timer = setTimeout(() => {
      console.log('TaskCompletionAnimation complete');
    onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete, task.title]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={500}
        recycle={false}
        colors={['#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#7B68EE']}
        gravity={0.3}
        initialVelocityY={10}
      />
    </div>
  );
} 