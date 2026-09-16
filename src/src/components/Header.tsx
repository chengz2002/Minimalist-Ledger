import React from 'react';
import { ChevronLeft, ChevronRight, Filter, Moon, Sun, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  currentYear: number;
  currentMonth: number; // 1 - 12
  onPrevMonth: () => void;
  onNextMonth: () => void;
  totalExpense: number;
  totalIncome: number;
  onOpenFilter: () => void;
  isFilterActive: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenWidgetCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  totalExpense,
  totalIncome,
  onOpenFilter,
  isFilterActive,
  isDarkMode,
  onToggleDarkMode,
  onOpenWidgetCenter,
}) => {
  const balance = totalIncome - totalExpense;

  return (
    <div className="bg-white dark:bg-[#1e222d] text-gray-900 dark:text-white pt-safe px-4 pb-3 shadow-xs transition-colors">
      {/* Top Bar: Title & Fast Controls */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
            ¥
          </div>
          <span className="font-bold text-base tracking-tight">极简记账</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium">
            纯本地·无广告
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenWidgetCenter && (
            <button
              type="button"
              onClick={onOpenWidgetCenter}
              title="桌面小部件"
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95"
            >
              <LayoutGrid size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title="切换深色/浅色模式"
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={onOpenFilter}
            title="筛选与搜索"
            className={`p-2 rounded-xl transition active:scale-95 relative ${
              isFilterActive
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={18} />
            {isFilterActive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-[#1e222d]" />
            )}
          </button>
        </div>
      </div>

      {/* Month Navigation & Balance Overview Card */}
      <div className="mt-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-lg shadow-slate-900/10">
        {/* Month Picker Row */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight">
              {currentYear}年{currentMonth}月
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:scale-90 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:scale-90 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 3-Column Summary: 支出 / 收入 / 结余 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-start pl-1">
            <span className="text-[11px] text-gray-400">总支出 (元)</span>
            <span className="text-lg font-bold font-mono tracking-tight text-red-400 mt-0.5">
              {totalExpense.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-gray-400">总收入 (元)</span>
            <span className="text-lg font-bold font-mono tracking-tight text-emerald-400 mt-0.5">
              {totalIncome.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col items-end pr-1">
            <span className="text-[11px] text-gray-400">净结余 (元)</span>
            <span
              className={`text-lg font-bold font-mono tracking-tight mt-0.5 ${
                balance >= 0 ? 'text-white' : 'text-amber-400'
              }`}
            >
              {balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
