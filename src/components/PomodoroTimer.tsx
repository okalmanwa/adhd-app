'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useRef, useLayoutEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logPomodoroSession } from '@/hooks/usePomodoroSession';
import { useRouter } from 'next/navigation';

interface PomodoroTimerProps {
  onComplete: () => void;
}

type TimerMode = 'focus' | 'break';

interface TimerSettings {
  focus: number;
  break: number;
}

const DEFAULT_SETTINGS: TimerSettings = { focus: 25, break: 5 };

export function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focus * 60);
  const [isRunning, setIsRunning] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoroIsRunning');
      return saved === 'true';
    }
    return false;
  });
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const { playSound } = useSound();
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('pomodoroMode') as TimerMode;
      const savedTimeLeft = localStorage.getItem('pomodoroTimeLeft');
      const savedSettings = localStorage.getItem('pomodoroSettings');

      if (savedMode) setMode(savedMode);
      if (savedTimeLeft) setTimeLeft(parseInt(savedTimeLeft));
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setTempSettings(parsedSettings);
      }
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoroMode', mode);
      localStorage.setItem('pomodoroTimeLeft', timeLeft.toString());
      localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
      localStorage.setItem('pomodoroIsRunning', isRunning.toString());
    }
  }, [mode, timeLeft, settings, isRunning]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = ((settings[mode] * 60 - timeLeft) / (settings[mode] * 60)) * 100;

  // Handle timer completion
  const handleComplete = useCallback(() => {
    if (isCompleting) return; // Prevent double execution
    setIsCompleting(true);
    
    if (mode === 'focus') {
      playSound('timer-complete');
      // Log session if user is logged in
      if (user && sessionStart) {
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - sessionStart.getTime()) / 60000);
        logPomodoroSession({
          userId: user.id,
          startTime: sessionStart,
          endTime,
          durationMinutes,
        });
      }
    } else {
      playSound('break-complete');
    }
    const nextMode = mode === 'focus' ? 'break' : 'focus';
    setMode(nextMode);
    setTimeLeft(settings[nextMode] * 60);
    setIsRunning(false); // Do not auto-start the next timer
    if (nextMode === 'focus') {
      setSessionStart(new Date()); // Start new session
    } else {
      setSessionStart(null); // Clear sessionStart during break
    }
    onComplete();
    setIsCompleting(false);
  }, [mode, settings, playSound, onComplete, user, sessionStart, isCompleting]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft]);

  // Call handleComplete when timeLeft hits 0
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      setIsRunning(false); // Stop timer before handling completion
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (typeof window !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleSettingChange = (setting: keyof TimerSettings, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setTempSettings(prev => ({ ...prev, [setting]: numValue }));
    }
  };

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      // Clear existing localStorage
      localStorage.removeItem('pomodoroMode');
      localStorage.removeItem('pomodoroTimeLeft');
      localStorage.removeItem('pomodoroSettings');
    }
    
    // Set new settings
    setSettings(tempSettings);
    // Reset timer with new settings
    setTimeLeft(tempSettings[mode] * 60);
    setShowSettings(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center relative overflow-visible">
      <div className="relative z-10 rounded-3xl shadow-2xl bg-white/10 backdrop-blur-xl p-4 sm:p-8 md:p-12 flex flex-col items-center w-[90%] sm:w-[480px] max-w-full border border-white/20 mt-14" style={{ boxShadow: '0 8px 48px 0 rgba(80,80,160,0.18)' }}>
        {/* Timer Display Panel */}
        <div className="w-full bg-white/80 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 flex flex-col items-center border border-white/30 shadow-xl">
          <div className="text-center text-black text-base sm:text-lg md:text-xl font-mono tracking-wider mb-2 opacity-80">
            {mode === 'focus' ? 'SESSION' : 'BREAK'}
          </div>
          <div className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-black mb-4 sm:mb-6 font-mono" style={{ letterSpacing: '0.05em' }}>
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-3 sm:gap-4 md:gap-6">
            <button
              onClick={() => {
                if (!isRunning && mode === 'focus') {
                  setSessionStart(new Date());
                }
                setIsRunning(!isRunning);
              }}
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-xl border border-black/30 bg-white text-black font-mono text-lg sm:text-xl md:text-2xl hover:bg-mint-100/80 transition shadow"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pomodoroMode');
                  localStorage.removeItem('pomodoroTimeLeft');
                  localStorage.removeItem('pomodoroSettings');
                }
                setIsRunning(false);
                setMode('focus');
                setTimeLeft(settings.focus * 60);
                setSessionStart(null);
              }}
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-xl border border-black/30 bg-white text-black font-mono text-lg sm:text-xl md:text-2xl hover:bg-mint-100/80 transition shadow"
            >
              Reset
            </button>
          </div>
        </div>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10 w-full justify-center">
          {/* Break Length */}
          <div className="flex flex-col items-center bg-[#b0c7cc] rounded-2xl p-4 sm:p-5 md:p-6 border-4 border-black/30 shadow-inner min-w-[120px] sm:min-w-[140px]">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2">
              <button
                onClick={() => setSettings(s => ({ ...s, break: Math.max(1, s.break - 1) }))}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded bg-gray-200 text-black text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center border border-black/20 hover:bg-gray-300 transition"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.break}
                onChange={e => {
                  const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
                  setSettings(s => ({ ...s, break: val }));
                  if (mode === 'break') setTimeLeft(val * 60);
                }}
                className="text-xl sm:text-2xl md:text-3xl font-mono text-black w-12 sm:w-14 text-center bg-gray-100 rounded border border-black/20 focus:outline-none focus:ring-2 focus:ring-mint-400"
                style={{ MozAppearance: 'textfield' }}
              />
              <button
                onClick={() => setSettings(s => ({ ...s, break: Math.min(30, s.break + 1) }))}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded bg-gray-200 text-black text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center border border-black/20 hover:bg-gray-300 transition"
              >
                +
              </button>
            </div>
            <div className="text-black font-mono text-sm sm:text-base tracking-wide">Break Length</div>
          </div>
          {/* Session Length */}
          <div className="flex flex-col items-center bg-[#b0c7cc] rounded-2xl p-4 sm:p-5 md:p-6 border-4 border-black/30 shadow-inner min-w-[120px] sm:min-w-[140px]">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2">
              <button
                onClick={() => {
                  setSettings(s => ({ ...s, focus: Math.max(1, s.focus - 1) }));
                  if (mode === 'focus') setTimeLeft(t => Math.max(60, (settings.focus - 1) * 60));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded bg-gray-200 text-black text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center border border-black/20 hover:bg-gray-300 transition"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.focus}
                onChange={e => {
                  const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                  setSettings(s => ({ ...s, focus: val }));
                  if (mode === 'focus') setTimeLeft(val * 60);
                }}
                className="text-xl sm:text-2xl md:text-3xl font-mono text-black w-12 sm:w-14 text-center bg-gray-100 rounded border border-black/20 focus:outline-none focus:ring-2 focus:ring-mint-400"
                style={{ MozAppearance: 'textfield' }}
              />
              <button
                onClick={() => {
                  setSettings(s => ({ ...s, focus: Math.min(60, s.focus + 1) }));
                  if (mode === 'focus') setTimeLeft(t => Math.min(3600, (settings.focus + 1) * 60));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded bg-gray-200 text-black text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center border border-black/20 hover:bg-gray-300 transition"
              >
                +
              </button>
            </div>
            <div className="text-black font-mono text-sm sm:text-base tracking-wide">Session Length</div>
          </div>
        </div>
      </div>
    </div>
  );
} 