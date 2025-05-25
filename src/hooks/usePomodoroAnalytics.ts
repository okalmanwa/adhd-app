import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface PomodoroAnalytics {
  totalSessions: number;
  totalMinutes: number;
}

export function usePomodoroAnalytics(userId: string | null, weekStart?: Date, monthStart?: Date) {
  const [allTime, setAllTime] = useState<PomodoroAnalytics>({ totalSessions: 0, totalMinutes: 0 });
  const [weekly, setWeekly] = useState<PomodoroAnalytics>({ totalSessions: 0, totalMinutes: 0 });
  const [monthly, setMonthly] = useState<PomodoroAnalytics>({ totalSessions: 0, totalMinutes: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAllTime({ totalSessions: 0, totalMinutes: 0 });
      setWeekly({ totalSessions: 0, totalMinutes: 0 });
      setMonthly({ totalSessions: 0, totalMinutes: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    const fetchAnalytics = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch all-time stats
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes, created_at')
        .eq('user_id', userId);

      if (allTimeError) {
        setError(allTimeError.message);
        setAllTime({ totalSessions: 0, totalMinutes: 0 });
        setWeekly({ totalSessions: 0, totalMinutes: 0 });
        setMonthly({ totalSessions: 0, totalMinutes: 0 });
      } else if (allTimeData) {
        const totalSessions = allTimeData.length;
        const totalMinutes = allTimeData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        setAllTime({ totalSessions, totalMinutes });

        // Calculate weekly stats if weekStart is provided
        if (weekStart) {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weeklyData = allTimeData.filter(session => {
            const sessionDate = new Date(session.created_at);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
          });
          const weeklySessions = weeklyData.length;
          const weeklyMinutes = weeklyData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
          setWeekly({ totalSessions: weeklySessions, totalMinutes: weeklyMinutes });
        }

        // Calculate monthly stats if monthStart is provided
        if (monthStart) {
          const monthEnd = endOfMonth(monthStart);
          const monthlyData = allTimeData.filter(session => {
            const sessionDate = new Date(session.created_at);
            return sessionDate >= monthStart && sessionDate <= monthEnd;
          });
          const monthlySessions = monthlyData.length;
          const monthlyMinutes = monthlyData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
          setMonthly({ totalSessions: monthlySessions, totalMinutes: monthlyMinutes });
        }
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [userId, weekStart, monthStart]);

  return { allTime, weekly, monthly, loading, error };
} 