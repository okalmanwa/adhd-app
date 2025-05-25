import { createBrowserClient } from '@supabase/ssr';

export async function logPomodoroSession({
  userId,
  startTime,
  endTime,
  durationMinutes,
}: {
  userId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}) {
  if (!userId) return;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await supabase.from('pomodoro_sessions').insert([
    {
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
    },
  ]);
} 