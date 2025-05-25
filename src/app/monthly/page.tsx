import { format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { useRouter } from 'next/navigation';

const MonthlyPage = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-white">
        {format(startOfMonth(new Date()), 'MMMM')}
      </h1>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const newDate = subMonths(new Date(), 1);
            router.push(`/monthly?date=${format(newDate, 'yyyy-MM-dd')}`);
          }}
          className="px-3 py-1 bg-mint-400/10 hover:bg-mint-400/20 text-mint-400 rounded-lg transition-colors"
        >
          Previous Month
        </button>
        <button
          onClick={() => {
            const newDate = addMonths(new Date(), 1);
            router.push(`/monthly?date=${format(newDate, 'yyyy-MM-dd')}`);
          }}
          className="px-3 py-1 bg-mint-400/10 hover:bg-mint-400/20 text-mint-400 rounded-lg transition-colors"
        >
          Next Month
        </button>
      </div>
    </div>
  );
};

export default MonthlyPage; 