'use client';

import { motion, type MotionProps } from 'framer-motion';
import React from 'react';

interface SpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export function Spinner({ size = 64, message, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="border-4 border-mint-400 border-t-transparent rounded-full"
        style={{ width: size, height: size }}
      />
      {message && <span className="text-white text-sm mt-2">{message}</span>}
    </div>
  );
}

export default Spinner; 