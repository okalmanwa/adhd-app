import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((sound: 'timer-complete' | 'break-complete') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    if (sound === 'timer-complete') {
      // Bell-like sound for focus end
      oscillator1.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator2.frequency.setValueAtTime(1320, audioContext.currentTime); // E6
    } else {
      // Lower, softer sound for break end
      oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    }
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
    oscillator1.start();
    oscillator2.start();
    oscillator1.stop(audioContext.currentTime + 1.5);
    oscillator2.stop(audioContext.currentTime + 1.5);
    setTimeout(() => {
      audioContext.close();
    }, 2000);
  }, []);
  return { playSound };
} 