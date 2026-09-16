import React from 'react';
import {
  X,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { BudgetConfig } from '../types/ledger';

interface WidgetCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRecord: (initialType?: 'expense' | 'income') => void;
  todayExpense: number;
  monthExpense: number;
  budget: BudgetConfig;
  dailyTrend?: number[];
}

export const WidgetCenterModal: React.FC<WidgetCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenRecord,
  todayExpense,
  monthExpense,
  budget,
  dailyTrend = [0, 0, 0, 0, 0, 0, 0],
}) => {
  if (!isOpen) return null;

  const remainingBudget = budget.monthlyTotal - monthExpense;
  const isOver = remainingBudget < 0;
  const percentSpent = budget.monthlyTotal > 0 ? (monthExpense / budget.monthlyTotal) * 100 : 0;

  const handleWidgetClick = (type?: 'expense' | 'income') => {
    onClose();
    onOpenRecord(type);
  };

  // Max value for mini bar chart
  const maxBarVal = Math.max(...dailyTrend, 10);

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1f2c] rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
              <Smartphone size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">桌面原生小组件</h3>
              <p className="text-[10px] text-gray-400">真实系统小组件已就绪 · 点击可直达记账</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Widget Gallery */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Widget 1: 2x2 数据概览小组件 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                1. 2x2 数据概览微件 (纯数据清晰展示)
              </span>
              <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full font-medium">
                2x2 方块
              </span>
            </div>

            {/* Simulated 2x2 Android Widget Card */}
            <div
              onClick={() => handleWidgetClick('expense')}
              className="bg-[#161A23] text-white p-4 rounded-2xl shadow-lg border border-[#2D3748] cursor-pointer active:scale-98 transition space-y-3"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">极简记账</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                  + 记账
                </span>
              </div>

              {/* Middle Data: Today & Month */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">今日支出</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    ¥{todayExpense.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">当月支出</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    ¥{monthExpense.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Bottom Budget Status */}
              <div className="bg-[#1E2536] p-2 rounded-xl space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">月预算剩余</span>
                  <span className="font-bold text-sky-400 font-mono">
                    已用 {percentSpent.toFixed(1)}%
                  </span>
                </div>
                <div
                  className={`text-sm font-bold font-mono ${
                    isOver ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {isOver ? `已超支 ¥${Math.abs(remainingBudget).toFixed(2)}` : `¥${remainingBudget.toFixed(2)}`}
                </div>
              </div>

              <div className="text-[9px] text-slate-500 text-center pt-0.5">
                轻触任意处一键快速记账 ➔
              </div>
            </div>
          </div>

          {/* Widget 2: 1x4 趋势与预算小组件 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                2. 1x4 趋势与预算微件 (月支出 + 柱状图)
              </span>
              <span className="text-[10px] text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-medium">
                4x1 经典横条
              </span>
            </div>

            {/* Simulated 1x4 Android Widget Card */}
            <div
              onClick={() => handleWidgetClick('expense')}
              className="bg-[#161A23] text-white p-3.5 rounded-2xl shadow-lg border border-[#2D3748] cursor-pointer active:scale-98 transition flex items-center justify-between gap-2.5"
            >
              {/* Left Column Data */}
              <div className="shrink-0 min-w-[75px]">
                <div className="text-[10px] text-slate-400">本月支出</div>
                <div className="text-sm font-bold font-mono text-white">
                  ¥{monthExpense.toFixed(2)}
                </div>
                <div
                  className={`text-[10px] font-medium mt-0.5 ${
                    isOver ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {isOver ? `超支 ¥${Math.abs(remainingBudget).toFixed(1)}` : `预算余 ¥${remainingBudget.toFixed(0)}`}
                </div>
              </div>

              {/* Center Bar Chart Preview (7 Days) */}
              <div className="flex-1 h-9 flex items-end justify-between gap-1 px-1 bg-[#1E2536]/50 rounded-lg p-1">
                {dailyTrend.map((v, i) => {
                  const hPercent = Math.max((v / maxBarVal) * 100, v > 0 ? 15 : 6);
                  const isLast = i === dailyTrend.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className={`w-full rounded-xs transition-all duration-300 ${
                          v === 0
                            ? 'bg-slate-700 h-[2px]'
                            : isLast
                            ? 'bg-blue-400'
                            : 'bg-blue-600'
                        }`}
                        style={{ height: `${hPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Right Action Button */}
              <div className="shrink-0">
                <span className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                  + 记账
                </span>
              </div>
            </div>
          </div>

          {/* Android Desktop Adding Guide Box */}
          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 space-y-2 text-xs text-blue-900 dark:text-blue-200">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              <span>如何添加到手机桌面？</span>
            </div>
            <div className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed space-y-1">
              <div className="flex items-start gap-1">
                <CheckCircle2 size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <span>在手机桌面空白处<strong>长按</strong>，点击<strong>微件 / 小部件 (Widgets)</strong></span>
              </div>
              <div className="flex items-start gap-1">
                <CheckCircle2 size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <span>在列表中找到<strong>极简记账</strong>，选择 <strong>2x2</strong> 或 <strong>1x4</strong> 拖拽至桌面</span>
              </div>
              <div className="flex items-start gap-1">
                <CheckCircle2 size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <span>轻触桌面小部件任何位置，即可一键直达记账界面！</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Close */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-[#151923]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-98 transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
