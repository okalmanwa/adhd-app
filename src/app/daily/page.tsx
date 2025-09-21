import { Suspense } from 'react';
import { Spinner } from '@/components/Spinner';
import DailyClient from './DailyClient';

export default function DailyPage() {
    return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
        <main className="flex-1 flex flex-col items-center justify-center w-full px-2">
          <Spinner size={48} message="Loading your daily tasks..." />
        </main>
      </div>
    }>
      <DailyClient />
    </Suspense>
  );
} 