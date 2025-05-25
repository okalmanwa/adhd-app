'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reward } from '@/types/rewards';
import confetti from 'canvas-confetti';

// Procrastination monsters with their characteristics
const MONSTERS = [
  {
    name: 'The Scroll Fiend',
    description: 'A creature that makes you scroll endlessly',
    color: '#FF6B6B',
    icon: '📱',
  },
  {
    name: 'Overthinker Prime',
    description: 'Makes you overthink every decision',
    color: '#4ECDC4',
    icon: '🤔',
  },
  {
    name: 'Snack Goblin',
    description: 'Distracts you with endless snacking',
    color: '#FFD93D',
    icon: '🍪',
  },
  {
    name: 'Notification Demon',
    description: 'Bombards you with notifications',
    color: '#95E1D3',
    icon: '🔔',
  },
  {
    name: 'Snooze Dragon',
    description: 'Makes you hit snooze repeatedly',
    color: '#FF8B94',
    icon: '😴',
  },
];

interface BossBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward;
  xpGained: number;
  taskTitle: string;
}

export function BossBattleModal({ isOpen, onClose, reward, xpGained, taskTitle }: BossBattleModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMonster] = useState(() => MONSTERS[Math.floor(Math.random() * MONSTERS.length)]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset animation sequence
      setCurrentStep(0);
      setShowConfetti(false);

      // Start animation sequence
      const sequence = async () => {
        // Step 1: Screen shake + confetti
        setShowConfetti(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Monster appears
        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Brain avatar attacks
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 4: XP gain
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 5: Reward chest
        setCurrentStep(4);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Close modal after sequence
        setTimeout(onClose, 500);
      };

      sequence();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-lg shadow-xl p-6"
      >
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            <canvas id="confetti-canvas" className="w-full h-full" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="shake"
              initial={{ x: -10 }}
              animate={{ x: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-4">Task Complete! 🎉</h2>
              <p className="text-xl">{taskTitle}</p>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="monster"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">{selectedMonster.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{selectedMonster.name}</h2>
              <p className="text-gray-600">{selectedMonster.description}</p>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="attack"
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🧠</div>
              <motion.div
                animate={{ x: [0, 100, 0] }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-4xl">⚡</div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="xp"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-4">XP Gained!</h2>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-green-500 mb-4"
              >
                +{xpGained} XP
              </motion.div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(reward.xp_points % 50) * 2}%` }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-600">
                Level {reward.level} • {reward.xp_points % 50}/50 XP to next level
              </p>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="reward"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold mb-2">Reward Unlocked!</h2>
              <p className="text-gray-600">
                {reward.streak > 0 ? `🔥 ${reward.streak} day streak!` : 'Keep going to build your streak!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 