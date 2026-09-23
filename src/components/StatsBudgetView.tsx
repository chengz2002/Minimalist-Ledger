import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Category, BudgetConfig } from '../types/ledger';
import { CategoryIcon } from './CategoryIcon';
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  ChevronRight as ChevronRightIcon,
  PlusCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { CATEGORY_ALIASES } from '../services/defaults';
import { CategoryTransactionsModal } from './CategoryTransactionsModal';
import { MonthBudgetPromptModal } from './MonthBudgetPromptModal';
import { backButtonManager } from '../services/backButtonManager';

interface StatsBudgetViewProps {
  transactions: Transaction[];
  categories: Category[];
  budget: BudgetConfig;
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSaveBudget: (budget: BudgetConfig) => void;
  onCopyPrevBudget?: () => void;
  hasConfiguredBudget: boolean;
  prevBudget: BudgetConfig | null;
  isPromptDismissed: boolean;
  onDismissPrompt: () => void;
}

export const StatsBudgetView: React.FC<StatsBudgetViewProps> = ({
  transactions,
  categories,
  budget,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onSaveBudget,
  onCopyPrevBudget,
  hasConfiguredBudget,
  prevBudget,
  isPromptDismissed,
  onDismissPrompt,
}) => {
  // Stat type for chart & rankings: expense vs income
  const [statType, setStatType] = useState<TransactionType>('expense');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Budget edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [draftTotal, setDraftTotal] = useState<number>(budget.monthlyTotal);
  const [draftCategoryBudgets, setDraftCategoryBudgets] = useState<Record<string, number>>(
    budget.categoryBudgets || {}
  );

  // Category Transaction Detail Modal state
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<{
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null>(null);

  // Keep draft budget in sync when budget prop changes
  useEffect(() => {
    setDraftTotal(budget.monthlyTotal);
    setDraftCategoryBudgets(budget.categoryBudgets || {});
  }, [budget]);

  // Back button handler for budget edit modal
  useEffect(() => {
    if (!showEditModal) return;
    backButtonManager.register('budget-edit-modal', () => {
      setShowEditModal(false);
      return true;
    }, 50);

    return () => {
      backButtonManager.unregister('budget-edit-modal');
    };
  }, [showEditModal]);

  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Transactions for the current month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(monthPrefix));
  }, [transactions, monthPrefix]);

  // Month expense transactions
  const monthExpenseTransactions = useMemo(() => {
    return currentMonthTransactions.filter(t => t.type === 'expense');
  }, [currentMonthTransactions]);

  // Month income transactions
  const monthIncomeTransactions = useMemo(() => {
    return currentMonthTransactions.filter(t => t.type === 'income');
  }, [currentMonthTransactions]);

  const totalExpense = useMemo(() => {
    return monthExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthExpenseTransactions]);

  const totalIncome = useMemo(() => {
    return monthIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthIncomeTransactions]);

  // Active chart transactions based on statType
  const activeStatsTransactions = statType === 'expense' ? monthExpenseTransactions : monthIncomeTransactions;
  const activeTotalAmount = statType === 'expense' ? totalExpense : totalIncome;

  // Days in month calculation
  const now = new Date();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentDay = now.getFullYear() === currentYear && (now.getMonth() + 1) === currentMonth
    ? now.getDate()
    : daysInMonth;
  const remainingDays = Math.max(daysInMonth - currentDay + 1, 1);

  // Budget calculations
  const remainingBudget = budget.monthlyTotal - totalExpense;
  const isOverBudget = budget.monthlyTotal > 0 && remainingBudget < 0;
  const percentSpent = budget.monthlyTotal > 0 ? (totalExpense / budget.monthlyTotal) * 100 : 0;
  const dailySpendable = Math.max(remainingBudget / remainingDays, 0);

  // Group spent by category for budget & list display (supporting Qianji aliases)
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenseTransactions.forEach(t => {
      if (t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
      const aliasId = (t.categoryName ? CATEGORY_ALIASES[t.categoryName] : undefined) ||
                      (t.subcategoryName ? CATEGORY_ALIASES[t.subcategoryName] : undefined);
      if (aliasId && aliasId !== t.categoryId) {
        map[aliasId] = (map[aliasId] || 0) + t.amount;
      }
    });
    return map;
  }, [monthExpenseTransactions]);

  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense');
  }, [categories]);

  // Category aggregation for active statType (ranking & donut chart)
  const categoryStats = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      icon: string;
      color: string;
      amount: number;
      count: number;
    }>();

    activeStatsTransactions.forEach(t => {
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

    // In expense mode, also include categories that have an allocated budget even if 0 spent yet
    if (statType === 'expense' && budget.categoryBudgets) {
      Object.keys(budget.categoryBudgets).forEach(catId => {
        if (!map.has(catId) && budget.categoryBudgets[catId] > 0) {
          const cat = expenseCategories.find(c => c.id === catId);
          if (cat) {
            map.set(catId, {
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              amount: categorySpentMap[catId] || 0,
              count: 0,
            });
          }
        }
      });
    }

    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    return list.map(item => ({
      ...item,
      percentage: activeTotalAmount > 0 ? (item.amount / activeTotalAmount) * 100 : 0,
    }));
  }, [activeStatsTransactions, activeTotalAmount, statType, budget.categoryBudgets, expenseCategories, categorySpentMap]);

  // SVG Donut slices
  const donutSlices = useMemo(() => {
    let accumulatedAngle = 0;
    const radius = 70;
    const cx = 100;
    const cy = 100;

    if (activeTotalAmount === 0) return [];

    return categoryStats.map(cat => {
      const sliceAngle = (cat.amount / activeTotalAmount) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle += sliceAngle;

      let pathData = '';
      if (sliceAngle >= 359.99 || categoryStats.length === 1) {
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
  }, [categoryStats, activeTotalAmount]);

  const activeDonutCategory = categoryStats.find(c => c.id === selectedCatId) || categoryStats[0];

  // Filter transactions for the selected category modal
  const selectedCatTransactions = useMemo(() => {
    if (!selectedCategoryForModal) return [];
    const catId = selectedCategoryForModal.id;
    const catName = selectedCategoryForModal.name;

    return activeStatsTransactions.filter(t => {
      if (t.categoryId === catId || t.categoryName === catName) return true;
      const aliasId = (t.categoryName ? CATEGORY_ALIASES[t.categoryName] : undefined) ||
                      (t.subcategoryName ? CATEGORY_ALIASES[t.subcategoryName] : undefined);
      return aliasId === catId;
    });
  }, [activeStatsTransactions, selectedCategoryForModal]);

  const handleOpenEdit = () => {
    setDraftTotal(budget.monthlyTotal);
    setDraftCategoryBudgets({ ...(budget.categoryBudgets || {}) });
    setShowEditModal(true);
  };

  const handleSaveBudgetForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudget({
      ...budget,
      monthlyTotal: Math.max(draftTotal, 0),
      categoryBudgets: draftCategoryBudgets,
    });
    setShowEditModal(false);
  };

  // Should show monthly budget prompt modal
  const shouldShowPrompt = !hasConfiguredBudget && !isPromptDismissed;

  const prevMonthName = useMemo(() => {
    if (currentMonth === 1) {
      return `${currentYear - 1}年12月`;
    }
    return `${currentMonth - 1}月`;
  }, [currentYear, currentMonth]);

  return (
    <div className="space-y-4 px-4 py-3 pb-24 animate-in fade-in duration-150">
      {/* 1. Top Month Navigator & Budget Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1e2433] p-3 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
          aria-label="上个月"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
            {currentYear}年{currentMonth}月 统计与预算
          </span>
          <p className="text-[11px] text-gray-400 mt-0.5">
            本月还剩 <span className="font-semibold text-blue-500">{remainingDays}</span> 天
          </p>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
          aria-label="下个月"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 2. Overspend / Warning Alert Banner */}
      {isOverBudget ? (
        <div className="bg-red-500 text-white rounded-2xl p-4 shadow-lg shadow-red-500/20 flex items-start gap-3 animate-pulse">
          <ShieldAlert size={24} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">本月预算已超支！</h4>
            <p className="text-xs text-red-100 mt-0.5">
              总支出已超出预算 <span className="font-bold font-mono">¥{Math.abs(remainingBudget).toFixed(2)}</span>，请合理规划后续开销。
            </p>
          </div>
        </div>
      ) : percentSpent >= 80 && budget.monthlyTotal > 0 ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">预算预警：</span>本月预算已消耗 <span className="font-bold font-mono">{percentSpent.toFixed(1)}%</span>，即将触及上限。
          </div>
        </div>
      ) : null}

      {/* 3. Monthly Budget & Expenditure Overview Card */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              月度预算监控
            </span>
            {budget.monthlyTotal > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono">
                目标 ¥{budget.monthlyTotal.toFixed(0)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 active:scale-95 transition"
          >
            <Sliders size={13} />
            <span>{budget.monthlyTotal > 0 ? '调整预算' : '设置预算'}</span>
          </button>
        </div>

        {budget.monthlyTotal > 0 ? (
          <>
            {/* Big Numbers */}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">剩余额度</div>
                <div
                  className={`text-3xl font-black font-mono tracking-tight ${
                    isOverBudget ? 'text-red-500' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  ¥{remainingBudget.toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-400 mb-0.5">已用支出</div>
                <div className="text-base font-bold font-mono text-gray-700 dark:text-gray-300">
                  ¥{totalExpense.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isOverBudget
                      ? 'bg-red-500'
                      : percentSpent >= 80
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5 font-mono">
                <span>已用进度: {percentSpent.toFixed(1)}%</span>
                <span>日均可用: ¥{dailySpendable.toFixed(1)}/天</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">本月已支出</div>
                <div className="text-2xl font-black font-mono text-gray-900 dark:text-white">
                  ¥{totalExpense.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-0.5">本月已收入</div>
                <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ¥{totalIncome.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">设定预算可实时监控剩余额度与日均限额</span>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
              >
                <PlusCircle size={14} />
                <span>立即规划预算</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Chart Breakdown Card with Income / Expense Switcher */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-4 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        {/* Switcher */}
        <div className="flex bg-gray-100 dark:bg-[#151923] p-1 rounded-xl shadow-inner gap-1">
          <button
            type="button"
            onClick={() => { setStatType('expense'); setSelectedCatId(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              statType === 'expense'
                ? 'bg-white dark:bg-[#1e2433] text-red-500 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <TrendingDown size={14} />
            <span>支出分析 (¥{totalExpense.toFixed(0)})</span>
          </button>

          <button
            type="button"
            onClick={() => { setStatType('income'); setSelectedCatId(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              statType === 'income'
                ? 'bg-white dark:bg-[#1e2433] text-emerald-500 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <TrendingUp size={14} />
            <span>收入分析 (¥{totalIncome.toFixed(0)})</span>
          </button>
        </div>

        {/* Donut Chart */}
        <div className="flex flex-col items-center pt-2">
          {activeTotalAmount > 0 ? (
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
                {donutSlices.map(slice => (
                  <path
                    key={slice.id}
                    d={slice.pathData}
                    fill={slice.color}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    onClick={() => {
                      setSelectedCatId(slice.id);
                      setSelectedCategoryForModal({
                        id: slice.id,
                        name: slice.name,
                        icon: slice.icon,
                        color: slice.color,
                      });
                    }}
                  />
                ))}
                <circle cx="100" cy="100" r="48" className="fill-white dark:fill-[#1e2433]" />
              </svg>

              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {activeDonutCategory ? (
                  <>
                    <span className="text-[11px] text-gray-400 truncate max-w-[80px]">
                      {activeDonutCategory.name}
                    </span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                      {activeDonutCategory.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ¥{activeDonutCategory.amount.toFixed(0)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">环形分析</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-xs text-gray-400 text-center">
              本月暂无{statType === 'expense' ? '支出' : '收入'}记录
            </div>
          )}
        </div>
      </div>

      {/* 5. Unified Category Breakdown List (支出排行与预算限额合一) */}
      {categoryStats.length > 0 && (
        <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                分项{statType === 'expense' ? '支出与预算' : '收入'}明细
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 font-medium">
                点击分类看流水
              </span>
            </div>

            {statType === 'expense' && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                设置分类限额
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {categoryStats.map((cat, idx) => {
              const catBudget = statType === 'expense' && budget.categoryBudgets
                ? budget.categoryBudgets[cat.id]
                : undefined;
              const hasBudget = typeof catBudget === 'number' && catBudget > 0;
              const spent = cat.amount;
              const remaining = hasBudget ? catBudget - spent : 0;
              const isOver = hasBudget && remaining < 0;
              const budgetPercent = hasBudget ? (spent / catBudget) * 100 : 0;

              return (
                <div
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategoryForModal({
                      id: cat.id,
                      name: cat.name,
                      icon: cat.icon,
                      color: cat.color,
                    })
                  }
                  className={`p-3 -mx-1.5 rounded-2xl transition cursor-pointer group ${
                    selectedCatId === cat.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Rank, Icon, Name, Count */}
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
                      <CategoryIcon name={cat.icon} bgColor={cat.color} size={16} />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors">
                            {cat.name}
                          </span>
                          <ChevronRightIcon size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {cat.count} 笔账单
                          {hasBudget
                            ? ` · 限额 ¥${catBudget.toFixed(0)}`
                            : ` · 占${statType === 'expense' ? '支出' : '收入'} ${cat.percentage.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Amount & Budget / Percentage badge */}
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                        ¥{cat.amount.toFixed(2)}
                      </span>
                      {hasBudget ? (
                        <span
                          className={`text-[10px] font-mono font-semibold ${
                            isOver ? 'text-red-500' : 'text-emerald-500'
                          }`}
                        >
                          {isOver
                            ? `超 ¥${Math.abs(remaining).toFixed(0)}`
                            : `余 ¥${remaining.toFixed(0)}`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual-purpose Progress Bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-2.5 overflow-hidden">
                    {hasBudget ? (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-red-500'
                            : budgetPercent >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                      />
                    ) : (
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. First-time Month Budget Prompt Modal */}
      <MonthBudgetPromptModal
        isOpen={shouldShowPrompt}
        year={currentYear}
        month={currentMonth}
        prevBudget={prevBudget}
        prevMonthName={prevMonthName}
        onCopyPrev={() => {
          if (onCopyPrevBudget) {
            onCopyPrevBudget();
          }
        }}
        onOpenCustom={() => {
          onDismissPrompt();
          handleOpenEdit();
        }}
        onDismiss={onDismissPrompt}
      />

      {/* 7. Edit Budget Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              设置 {currentYear}年{currentMonth}月 预算
            </h3>

            <form onSubmit={handleSaveBudgetForm} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  月度总预算额度 (元)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-mono">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={draftTotal}
                    onChange={e => setDraftTotal(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  常用分类专属限额（选填，设为0则不设限）
                </label>
                <div className="space-y-2.5 max-h-56 overflow-y-auto p-1 bg-gray-50 dark:bg-[#151923] rounded-2xl">
                  {expenseCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between gap-2 p-1.5">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={cat.icon} bgColor={cat.color} size={14} />
                        <span className="text-xs text-gray-800 dark:text-gray-200">{cat.name}</span>
                      </div>
                      <div className="w-28 relative">
                        <span className="absolute left-2 top-1.5 text-gray-400 text-xs font-mono">¥</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder="无限制"
                          value={draftCategoryBudgets[cat.id] || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            const updated = { ...draftCategoryBudgets };
                            if (!val || val <= 0) {
                              delete updated[cat.id];
                            } else {
                              updated[cat.id] = val;
                            }
                            setDraftCategoryBudgets(updated);
                          }}
                          className="w-full pl-6 pr-2 py-1 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e2433] text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-md shadow-blue-500/20"
                >
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Category Transactions Detail Modal */}
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
