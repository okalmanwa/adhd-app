import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { useRouter } from 'next/navigation';

const WeeklyPage = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-white">
        {format(startOfWeek(new Date()), 'MMMM d')} - {format(endOfWeek(new Date()), 'MMMM d')}
      </h1>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const newDate = subWeeks(new Date(), 1);
            router.push(`/weekly?date=${format(newDate, 'yyyy-MM-dd')}`);
          }}
          className="px-3 py-1 bg-mint-400/10 hover:bg-mint-400/20 text-mint-400 rounded-lg transition-colors"
        >
          Previous Week
        </button>
        <button
          onClick={() => {
            const newDate = addWeeks(new Date(), 1);
            router.push(`/weekly?date=${format(newDate, 'yyyy-MM-dd')}`);
          }}
          className="px-3 py-1 bg-mint-400/10 hover:bg-mint-400/20 text-mint-400 rounded-lg transition-colors"
        >
          Next Week
        </button>
      </div>
    </div>
  );
};

export default WeeklyPage; 