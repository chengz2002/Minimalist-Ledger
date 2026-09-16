import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types/ledger';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatLocalDate } from '../services/storageService';

interface DailyTrendChartProps {
  transactions: Transaction[];
  currentYear: number;
  currentMonth: number;
}

type TimeRange = 'month' | 'week';

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  transactions,
  currentYear,
  currentMonth,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [statType, setStatType] = useState<TransactionType>('expense');
  const [activeItem, setActiveItem] = useState<{ label: string; amount: number; isToday: boolean } | null>(null);

  // Month prefix
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Current real today info
  const realTodayStr = useMemo(() => formatLocalDate(), []);

  // Current Week calculation (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const curr = new Date(currentYear, currentMonth - 1, Math.min(today.getDate(), new Date(currentYear, currentMonth, 0).getDate()));
    const dayOfWeek = curr.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);

    const weekList: { dateStr: string; dayNum: number; weekLabel: string; shortDate: string }[] = [];
    const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(d);
      weekList.push({
        dateStr,
        dayNum: d.getDate(),
        weekLabel: weekLabels[i],
        shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
    return weekList;
  }, [currentYear, currentMonth]);

  // Aggregate data based on timeRange and statType
  const chartData = useMemo(() => {
    if (timeRange === 'month') {
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const days: { key: string; label: string; subLabel: string; amount: number; isToday: boolean }[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = String(d).padStart(2, '0');
        const dateStr = `${monthPrefix}-${dayStr}`;
        days.push({
          key: dateStr,
          label: `${currentMonth}月${d}日`,
          subLabel: d % 5 === 0 || d === 1 || d === daysInMonth ? `${d}` : '',
          amount: 0,
          isToday: dateStr === realTodayStr,
        });
      }

      transactions.forEach(t => {
        if (t.type === statType && t.date.startsWith(monthPrefix)) {
          const dayNum = parseInt(t.date.split('-')[2], 10);
          if (dayNum >= 1 && dayNum <= daysInMonth) {
            days[dayNum - 1].amount += t.amount;
          }
        }
      });

      const total = days.reduce((sum, item) => sum + item.amount, 0);
      const maxAmount = Math.max(...days.map(d => d.amount), 1);
      const dailyAvg = total / daysInMonth;

      return { items: days, total, maxAmount, dailyAvg };
    } else {
      // Week Range
      const days: { key: string; label: string; subLabel: string; amount: number; isToday: boolean }[] = [];

      currentWeekDays.forEach(w => {
        days.push({
          key: w.dateStr,
          label: `${w.weekLabel} (${w.shortDate})`,
          subLabel: w.weekLabel,
          amount: 0,
          isToday: w.dateStr === realTodayStr,
        });
      });

      transactions.forEach(t => {
        if (t.type === statType) {
          const idx = currentWeekDays.findIndex(w => w.dateStr === t.date);
          if (idx !== -1) {
            days[idx].amount += t.amount;
          }
        }
      });

      const total = days.reduce((sum, item) => sum + item.amount, 0);
      const maxAmount = Math.max(...days.map(d => d.amount), 1);
      const dailyAvg = total / 7;

      return { items: days, total, maxAmount, dailyAvg };
    }
  }, [timeRange, statType, currentYear, currentMonth, monthPrefix, realTodayStr, currentWeekDays, transactions]);

  const isExpense = statType === 'expense';

  return (
    <div className="mx-4 mt-2 mb-3 bg-white dark:bg-[#1e2433] rounded-3xl p-4 shadow-xs border border-gray-100 dark:border-gray-800 transition-colors">
      {/* Chart Control Header */}
      <div className="flex flex-col gap-2.5 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              {isExpense ? (
                <TrendingDown size={15} className="text-rose-500" />
              ) : (
                <TrendingUp size={15} className="text-emerald-500" />
              )}
              {timeRange === 'month' ? '当月每日' : '当周每日'}
              {isExpense ? '支出趋势' : '收入趋势'}
            </span>
          </div>

          {/* Two Control Buttons Groups (4 combos) */}
          <div className="flex items-center gap-1.5">
            {/* Button 1: Month / Week Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-0.5 rounded-xl text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange('month')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeRange === 'month'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                当月
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('week')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeRange === 'week'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                当周
              </button>
            </div>

            {/* Button 2: Expense / Income Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-0.5 rounded-xl text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setStatType('expense')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  isExpense
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setStatType('income')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  !isExpense
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                收入
              </button>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Summary Bar */}
        <div className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-[#161a24] px-3 py-1.5 rounded-xl text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span>总计:</span>
            <span className={`font-mono font-bold ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
              ¥{chartData.total.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>日均: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">¥{chartData.dailyAvg.toFixed(1)}</span></span>
            <span>单日最高: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">¥{chartData.maxAmount.toFixed(0)}</span></span>
          </div>
        </div>
      </div>

      {/* Active tooltip indicator display */}
      <div className="h-4 flex items-center justify-between px-1 text-[10px] text-gray-400">
        {activeItem ? (
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {activeItem.label} {isExpense ? '支出' : '收入'}: <span className={`font-mono font-bold ${isExpense ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>¥{activeItem.amount.toFixed(2)}</span>
            {activeItem.isToday && <span className="ml-1 text-[9px] text-blue-500 font-normal">(今天)</span>}
          </span>
        ) : (
          <span className="text-[9px] text-gray-400">轻触柱条可查看单日具体金额</span>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="h-28 w-full flex items-end gap-1 pt-3 pb-1 border-b border-gray-100 dark:border-gray-800 relative select-none">
        {chartData.items.map(item => {
          const heightPercent = item.amount > 0 ? Math.max((item.amount / chartData.maxAmount) * 100, 8) : 0;
          const isCurrentActive = activeItem?.label === item.label;

          return (
            <div
              key={item.key}
              onMouseEnter={() => setActiveItem(item)}
              onClick={() => setActiveItem(item)}
              className="h-full flex-1 flex flex-col justify-end items-center group relative cursor-pointer"
            >
              {/* Floating Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap z-20 transition-opacity">
                {item.label}: ¥{item.amount.toFixed(1)}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  item.amount > 0
                    ? isExpense
                      ? isCurrentActive
                        ? 'bg-rose-600 shadow-sm shadow-rose-500/50 scale-105'
                        : 'bg-rose-400 dark:bg-rose-500 hover:bg-rose-500'
                      : isCurrentActive
                      ? 'bg-emerald-600 shadow-sm shadow-emerald-500/50 scale-105'
                      : 'bg-emerald-400 dark:bg-emerald-500 hover:bg-emerald-500'
                    : 'bg-gray-100 dark:bg-gray-800/80 h-1'
                } ${item.isToday ? 'ring-1 ring-blue-400' : ''}`}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis Labels */}
      <div className="flex items-center justify-between pt-1 px-0.5 text-[8px] text-gray-400 font-mono">
        {chartData.items.map(item => (
          <div key={item.key} className="flex-1 text-center">
            <span className={`block ${item.isToday ? 'text-blue-500 font-bold' : ''}`}>
              {item.subLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
