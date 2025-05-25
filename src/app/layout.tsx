'use client';

import '@fontsource/lexend';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { useTasks } from '@/hooks/useTasks';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Loading Animation Component
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Spinner size={32} message="Loading your tasks..." />
    </div>
  );
}

// TaskLoader component to handle initial data loading
function TaskLoader({ children }: { children: React.ReactNode }) {
  const { refreshTasks, isLoading, error } = useTasks();
  const { user, loading: authLoading } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    let mounted = true;

    const loadTasks = async () => {
      if (user && !initialLoadDone) {
        try {
          await refreshTasks();
          if (mounted) {
            setInitialLoadDone(true);
          }
        } catch (error) {
          console.error('Failed to load tasks:', error);
          if (mounted) {
            setInitialLoadDone(true); // Still mark as done to prevent infinite loading
          }
        }
      } else if (!user && !authLoading) {
        if (mounted) {
          setInitialLoadDone(true);
        }
      }
    };

    loadTasks();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only depend on user ID changes

  // Don't show loading on auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show loading overlay only during initial load
  if (!initialLoadDone && (isLoading || authLoading)) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
