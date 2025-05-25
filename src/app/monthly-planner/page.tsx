'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import WeeklyPlanner from '@/components/WeeklyPlanner';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Spinner } from '@/components/Spinner';

export default function MonthlyPlanner() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Spinner size={32} message="Loading your monthly planner..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WeeklyPlanner initialViewMode="month" />
      </main>
      <Footer />
    </div>
  );
} 