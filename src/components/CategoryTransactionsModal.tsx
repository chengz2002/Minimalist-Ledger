import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, ArrowDownWideNarrow, Tag, CreditCard, Calendar } from 'lucide-react';
import { Transaction, TransactionType } from '../types/ledger';
import { CategoryIcon } from './CategoryIcon';
import { backButtonManager } from '../services/backButtonManager';

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currentYear: number;
  currentMonth: number;
  transactions: Transaction[];
  type?: TransactionType;
}

type SortType = 'date' | 'amount';

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  categoryIcon,
  categoryColor,
  currentYear,
  currentMonth,
  transactions,
  type = 'expense',
}) => {
  const [sortBy, setSortBy] = useState<SortType>('date');

  // Register back button handler
  useEffect(() => {
    if (!isOpen) return;
    backButtonManager.register('category-transactions-modal', () => {
      onClose();
      return true;
    }, 100);

    return () => {
      backButtonManager.unregister('category-transactions-modal');
    };
  }, [isOpen, onClose]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Sort transactions based on user selection
  const sortedTransactions = useMemo(() => {
    const list = [...transactions];
    if (sortBy === 'date') {
      // Latest first: date desc, then time desc
      return list.sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return (b.time || '').localeCompare(a.time || '');
      });
    } else {
      // Amount desc (largest to smallest)
      return list.sort((a, b) => {
        const amtComp = b.amount - a.amount;
        if (amtComp !== 0) return amtComp;
        return b.date.localeCompare(a.date);
      });
    }
  }, [transactions, sortBy]);

  if (!isOpen) return null;

  const isExpense = type === 'expense';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-200">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div className="bg-white dark:bg-[#1a1f2c] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[86vh] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom duration-300 pb-safe">
        {/* Drag Handle Bar on Mobile */}
        <div className="w-full flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: categoryColor }}
            >
              <CategoryIcon name={categoryIcon} size={20} color="#ffffff" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {categoryName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {currentYear}年{currentMonth}月
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isExpense
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isExpense ? '支出明细' : '收入明细'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                共 <span className="font-semibold text-gray-700 dark:text-gray-300">{transactions.length}</span> 笔 · 总计{' '}
                <span className={`font-bold font-mono ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                  ¥{totalAmount.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sorting Controller Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50/80 dark:bg-[#151923]/80 border-b border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400 text-[11px]">排序方式：</span>
          <div className="flex items-center bg-gray-200/70 dark:bg-gray-800 p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSortBy('date')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium ${
                sortBy === 'date'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Clock size={13} />
              <span>按时间倒序</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('amount')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium ${
                sortBy === 'amount'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <ArrowDownWideNarrow size={13} />
              <span>按金额从大到小</span>
            </button>
          </div>
        </div>

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#202737] border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100/70 dark:hover:bg-gray-700/40 transition"
              >
                {/* Left: Info */}
                <div className="flex flex-col gap-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Subcategory Tag if exists */}
                    {tx.subcategoryName ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                        <Tag size={10} />
                        <span>{tx.subcategoryName}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {tx.categoryName}
                      </span>
                    )}

                    {/* Account Tag if selected */}
                    {tx.accountName && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700/60">
                        <CreditCard size={10} />
                        <span>{tx.accountName}</span>
                      </span>
                    )}

                    {/* Amortized Tag if enabled */}
                    {tx.isAmortized && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-medium">
                        当月均摊
                      </span>
                    )}
                  </div>

                  {/* Remark */}
                  {tx.remark && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[220px]">
                      {tx.remark}
                    </p>
                  )}

                  {/* Date & Time */}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                    <Calendar size={11} />
                    <span>{tx.date}</span>
                    {tx.time && <span>{tx.time}</span>}
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-bold font-mono tracking-tight ${
                      isExpense ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {isExpense ? '-' : '+'}¥{tx.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <Calendar size={36} className="text-gray-300 dark:text-gray-600" />
              <p className="text-xs">该月份暂无此分类的{isExpense ? '支出' : '收入'}记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
