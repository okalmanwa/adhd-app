'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reward } from '@/types/rewards';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward;
  xpGained: number;
}

export function RewardModal({ isOpen, onClose, reward, xpGained }: RewardModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Add confetti animation here */}
              </div>
            )}

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Task Completed! 🎉
              </h2>

              <div className="mb-6">
                <p className="text-lg text-gray-600 mb-2">
                  You gained <span className="font-bold text-green-600">+{xpGained} XP</span>
                </p>
                <p className="text-sm text-gray-500">
                  Total XP: {reward.xp_points}
                </p>
              </div>

              <div className="mb-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                        Level {reward.level}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-indigo-600">
                        {reward.xp_points % 50}/50 XP to next level
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(reward.xp_points % 50) * 2}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {reward.streak > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                  🔥 {reward.streak} day streak!
                </p>
              )}

              <button
                onClick={onClose}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 