import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types/ledger';
import { CategoryIcon } from './CategoryIcon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryTransactionsModal } from './CategoryTransactionsModal';

interface StatsViewProps {
  transactions: Transaction[];
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  transactions,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
}) => {
  const [statType, setStatType] = useState<TransactionType>('expense');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<{ id: string; name: string; icon: string; color: string } | null>(null);

  // Filter transactions for this month and type
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(monthPrefix) && t.type === statType);
  }, [transactions, monthPrefix, statType]);

  const totalAmount = useMemo(() => {
    return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  // Aggregate by Category
  const categoryStats = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      icon: string;
      color: string;
      amount: number;
      count: number;
    }>();

    monthTransactions.forEach(t => {
      const existing = map.get(t.categoryId);
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        map.set(t.categoryId, {
          id: t.categoryId,
          name: t.categoryName,
          icon: t.categoryIcon,
          color: t.categoryColor,
          amount: t.amount,
          count: 1,
        });
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    return list.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }));
  }, [monthTransactions, totalAmount]);

  // Filter transactions for the selected category modal
  const selectedCatTransactions = useMemo(() => {
    if (!selectedCategoryForModal) return [];
    return monthTransactions.filter(
      t => t.categoryId === selectedCategoryForModal.id || t.categoryName === selectedCategoryForModal.name
    );
  }, [monthTransactions, selectedCategoryForModal]);

  // Generate SVG Donut slices
  const donutSlices = useMemo(() => {
    let accumulatedAngle = 0;
    const radius = 70;
    const cx = 100;
    const cy = 100;

    if (totalAmount === 0) return [];

    return categoryStats.map(cat => {
      const sliceAngle = (cat.amount / totalAmount) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle += sliceAngle;

      let pathData = '';
      if (sliceAngle >= 359.99 || categoryStats.length === 1) {
        // Full circle path using two arcs to avoid start/end point degeneracy
        pathData = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`;
      } else {
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      }

      return {
        ...cat,
        pathData,
      };
    });
  }, [categoryStats, totalAmount]);

  const activeCategory = categoryStats.find(c => c.id === selectedCatId) || categoryStats[0];

  return (
    <div className="space-y-4 px-4 py-3 pb-24">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1e2433] p-3 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-base text-gray-900 dark:text-white">
          {currentYear}年{currentMonth}月 报表统计
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Expense / Income Switcher */}
      <div className="flex bg-gray-100 dark:bg-[#151923] p-1 rounded-xl shadow-inner">
        <button
          type="button"
          onClick={() => { setStatType('expense'); setSelectedCatId(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            statType === 'expense'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          支出统计
        </button>
        <button
          type="button"
          onClick={() => { setStatType('income'); setSelectedCatId(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            statType === 'income'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          收入统计
        </button>
      </div>

      {/* Total Amount & Donut Card */}
      <div className="bg-white dark:bg-[#1e2433] rounded-2xl p-4 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col items-center">
        <div className="text-xs text-gray-400 mb-1">
          本月总{statType === 'expense' ? '支出' : '收入'}
        </div>
        <div
          className={`text-2xl font-black font-mono tracking-tight mb-4 ${
            statType === 'expense' ? 'text-red-500' : 'text-emerald-500'
          }`}
        >
          ¥{totalAmount.toFixed(2)}
        </div>

        {totalAmount > 0 ? (
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
              {donutSlices.map(slice => (
                <path
                  key={slice.id}
                  d={slice.pathData}
                  fill={slice.color}
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onClick={() => {
                    setSelectedCatId(slice.id);
                    setSelectedCategoryForModal(slice);
                  }}
                />
              ))}
              {/* Center cutout circle for Donut effect */}
              <circle cx="100" cy="100" r="48" className="fill-white dark:fill-[#1e2433]" />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeCategory ? (
                <>
                  <span className="text-[11px] text-gray-400 truncate max-w-[80px]">
                    {activeCategory.name}
                  </span>
                  <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                    {activeCategory.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ¥{activeCategory.amount.toFixed(0)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">环形分析</span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-xs text-gray-400 text-center">本月暂无{statType === 'expense' ? '支出' : '收入'}记录</div>
        )}
      </div>



      {/* Category Ranking Breakdown */}
      {categoryStats.length > 0 && (
        <div className="bg-white dark:bg-[#1e2433] rounded-2xl p-4 shadow-xs border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3 border-b border-gray-50 dark:border-gray-800 pb-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {statType === 'expense' ? '支出' : '收入'}排行与明细
            </span>
            <span className="text-[10px] text-gray-400">共 {categoryStats.length} 个分类</span>
          </div>

          <div className="space-y-3">
            {categoryStats.map((cat, idx) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id);
                  setSelectedCategoryForModal(cat);
                }}
                className={`p-2.5 rounded-xl transition cursor-pointer group ${
                  selectedCatId === cat.id
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-4 text-center text-xs font-bold ${
                        idx === 0
                          ? 'text-amber-500'
                          : idx === 1
                          ? 'text-slate-400'
                          : idx === 2
                          ? 'text-amber-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <CategoryIcon name={cat.icon} bgColor={cat.color} size={15} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors">
                          {cat.name}
                        </span>
                        <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className="text-[10px] text-gray-400">{cat.count} 笔账单 · 点击看明细</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                      ¥{cat.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Transactions Detail Modal */}
      {selectedCategoryForModal && (
        <CategoryTransactionsModal
          isOpen={!!selectedCategoryForModal}
          onClose={() => setSelectedCategoryForModal(null)}
          categoryName={selectedCategoryForModal.name}
          categoryIcon={selectedCategoryForModal.icon}
          categoryColor={selectedCategoryForModal.color}
          currentYear={currentYear}
          currentMonth={currentMonth}
          transactions={selectedCatTransactions}
          type={statType}
        />
      )}
    </div>
  );
};
