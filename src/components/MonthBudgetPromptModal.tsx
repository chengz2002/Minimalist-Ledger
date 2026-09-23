import React, { useEffect } from 'react';
import { BudgetConfig } from '../types/ledger';
import { Target, Copy, PlusCircle, X, Sparkles } from 'lucide-react';
import { backButtonManager } from '../services/backButtonManager';

interface MonthBudgetPromptModalProps {
  isOpen: boolean;
  year: number;
  month: number;
  prevBudget: BudgetConfig | null;
  prevMonthName: string;
  onCopyPrev: () => void;
  onOpenCustom: () => void;
  onDismiss: () => void;
}

export const MonthBudgetPromptModal: React.FC<MonthBudgetPromptModalProps> = ({
  isOpen,
  year,
  month,
  prevBudget,
  prevMonthName,
  onCopyPrev,
  onOpenCustom,
  onDismiss,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    backButtonManager.register('month-budget-prompt-modal', () => {
      onDismiss();
      return true;
    }, 50);

    return () => {
      backButtonManager.unregister('month-budget-prompt-modal');
    };
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const categoryBudgetCount = prevBudget && prevBudget.categoryBudgets
    ? Object.keys(prevBudget.categoryBudgets).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>设置 {year}年{month}月 预算</span>
                <Sparkles size={14} className="text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                初次进入本月，合理规划助您掌控开支
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 -mr-1 -mt-1 rounded-full transition"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Previous Month Card (if available) */}
        {prevBudget && prevBudget.monthlyTotal > 0 ? (
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {prevMonthName}已设预算
              </span>
              <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                ¥{prevBudget.monthlyTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              {categoryBudgetCount > 0
                ? `已包含 ${categoryBudgetCount} 个分类专属限额`
                : '未单独设定细项分类限额'}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            您可以在这里为本月设定总预算及餐饮、购物等各类目的专属限额，支出进度一目了然。
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {prevBudget && prevBudget.monthlyTotal > 0 ? (
            <>
              {/* Primary: Copy Previous Month */}
              <button
                type="button"
                onClick={onCopyPrev}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition"
              >
                <Copy size={15} />
                <span>一键沿用上月预算 (¥{prevBudget.monthlyTotal.toFixed(0)})</span>
              </button>

              {/* Secondary: Set Custom New Budget */}
              <button
                type="button"
                onClick={onOpenCustom}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 active:scale-[0.98] flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle size={15} />
                <span>设定新预算</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenCustom}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition"
            >
              <PlusCircle size={15} />
              <span>立即设置本月预算</span>
            </button>
          )}

          {/* Dismiss / Skip */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-[0.98] transition text-center"
          >
            暂不设定
          </button>
        </div>
      </div>
    </div>
  );
};
