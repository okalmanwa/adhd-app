'use client';

import { PomodoroTimer } from '@/components/PomodoroTimer';
import { useAuth } from '@/contexts/AuthContext';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PomodoroPage() {
  const [showNavToast, setShowNavToast] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === '/pomodoro' && pathname !== '/pomodoro') {
      setShowNavToast(true);
      setTimeout(() => setShowNavToast(false), 3000);
    }
    prevPath.current = pathname;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Nav />
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {showNavToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs">
            <div className="p-3 bg-red-100 border-l-4 border-red-400 text-red-800 rounded flex items-center gap-2 text-sm shadow relative animate-fade-in">
              <span role="img" aria-label="warning">⚠️</span>
              <span className="flex-1">Leaving the Pomodoro page resets your timer.</span>
            </div>
          </div>
        )}
        <PomodoroTimer onComplete={() => {}} />
      </div>
      <Footer />
    </div>
  );
} 