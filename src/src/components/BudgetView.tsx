import React, { useState, useMemo } from 'react';
import { BudgetConfig, Transaction, Category } from '../types/ledger';
import { CategoryIcon } from './CategoryIcon';
import { AlertTriangle, Sliders, ShieldAlert, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { CATEGORY_ALIASES } from '../services/defaults';
import { CategoryTransactionsModal } from './CategoryTransactionsModal';

interface BudgetViewProps {
  budget: BudgetConfig;
  transactions: Transaction[];
  categories: Category[];
  currentYear: number;
  currentMonth: number;
  onSaveBudget: (budget: BudgetConfig) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budget,
  transactions,
  categories,
  currentYear,
  currentMonth,
  onSaveBudget,
  onPrevMonth,
  onNextMonth,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<Category | null>(null);
  const [draftTotal, setDraftTotal] = useState<number>(budget.monthlyTotal);
  const [draftCategoryBudgets, setDraftCategoryBudgets] = useState<Record<string, number>>(
    budget.categoryBudgets || {}
  );

  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Monthly Expense Transactions
  const monthExpenseTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(monthPrefix) && t.type === 'expense');
  }, [transactions, monthPrefix]);

  const totalSpent = useMemo(() => {
    return monthExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthExpenseTransactions]);

  // Days calculations
  const now = new Date();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentDay = now.getFullYear() === currentYear && (now.getMonth() + 1) === currentMonth
    ? now.getDate()
    : daysInMonth;
  const remainingDays = Math.max(daysInMonth - currentDay + 1, 1);

  const remainingTotal = budget.monthlyTotal - totalSpent;
  const isOverBudget = remainingTotal < 0;
  const percentSpent = budget.monthlyTotal > 0 ? (totalSpent / budget.monthlyTotal) * 100 : 0;
  const dailySpendable = Math.max(remainingTotal / remainingDays, 0);

  // Group spent by category (supporting both direct IDs and Qianji alias mappings)
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenseTransactions.forEach(t => {
      // 1. Direct match by categoryId
      if (t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
      // 2. Fallback alias mapping for category name and subcategory name
      const aliasId = (t.categoryName ? CATEGORY_ALIASES[t.categoryName] : undefined) ||
                      (t.subcategoryName ? CATEGORY_ALIASES[t.subcategoryName] : undefined);
      if (aliasId && aliasId !== t.categoryId) {
        map[aliasId] = (map[aliasId] || 0) + t.amount;
      }
    });
    return map;
  }, [monthExpenseTransactions]);

  // Filter transactions for the selected category in this month
  const selectedCatTransactions = useMemo(() => {
    if (!selectedCategoryForDetail) return [];
    const catId = selectedCategoryForDetail.id;
    const catName = selectedCategoryForDetail.name;
    return monthExpenseTransactions.filter(t => {
      if (t.categoryId === catId) return true;
      if (t.categoryName === catName) return true;
      const aliasId = (t.categoryName ? CATEGORY_ALIASES[t.categoryName] : undefined) ||
                      (t.subcategoryName ? CATEGORY_ALIASES[t.subcategoryName] : undefined);
      return aliasId === catId;
    });
  }, [monthExpenseTransactions, selectedCategoryForDetail]);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleOpenEdit = () => {
    setDraftTotal(budget.monthlyTotal);
    setDraftCategoryBudgets({ ...budget.categoryBudgets });
    setShowEditModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudget({
      ...budget,
      monthlyTotal: Math.max(draftTotal, 0),
      categoryBudgets: draftCategoryBudgets,
    });
    setShowEditModal(false);
  };

  return (
    <div className="space-y-4 px-4 py-3 pb-24">
      {/* Top Header Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onPrevMonth && (
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
              aria-label="上个月"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentYear}年{currentMonth}月 预算管理
            </h2>
            <p className="text-xs text-gray-400">
              本月还剩 <span className="font-semibold text-blue-500">{remainingDays}</span> 天
            </p>
          </div>
          {onNextMonth && (
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
              aria-label="下个月"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenEdit}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 active:scale-95 transition"
        >
          <Sliders size={14} />
          <span>设置预算</span>
        </button>
      </div>

      {/* Overspend Alert Warning Banner */}
      {isOverBudget ? (
        <div className="bg-red-500 text-white rounded-2xl p-4 shadow-lg shadow-red-500/20 flex items-start gap-3 animate-pulse">
          <ShieldAlert size={24} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">本月预算已超支！</h4>
            <p className="text-xs text-red-100 mt-0.5">
              当前总支出超出预算 <span className="font-bold font-mono">¥{Math.abs(remainingTotal).toFixed(2)}</span>，请合理规划剩余 {remainingDays} 天的开销。
            </p>
          </div>
        </div>
      ) : percentSpent >= 80 ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle size={20} className="shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">预算预警：</span>本月预算已消耗 <span className="font-bold font-mono">{percentSpent.toFixed(1)}%</span>，即将触及上限。
          </div>
        </div>
      ) : null}

      {/* Main Monthly Budget Overview Card */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            月度总预算
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            设定: ¥{budget.monthlyTotal.toFixed(2)}
          </span>
        </div>

        {/* Big Remaining Display */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">剩余额度</div>
            <div
              className={`text-3xl font-black font-mono tracking-tight ${
                isOverBudget ? 'text-red-500' : 'text-gray-900 dark:text-white'
              }`}
            >
              ¥{remainingTotal.toFixed(2)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">已用</div>
            <div className="text-base font-bold font-mono text-gray-700 dark:text-gray-300">
              ¥{totalSpent.toFixed(2)}
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
            <span>使用进度: {percentSpent.toFixed(1)}%</span>
            <span>日均可用: ¥{dailySpendable.toFixed(1)}/天</span>
          </div>
        </div>
      </div>

      {/* Category-Level Budgets Section */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">分类预算监控</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">
              精准控开支
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            编辑分类额度
          </button>
        </div>

        {/* Category Budget Items */}
        <div className="space-y-3.5">
          {expenseCategories
            .filter(c => budget.categoryBudgets && budget.categoryBudgets[c.id])
            .map(cat => {
              const catBudget = budget.categoryBudgets[cat.id];
              const spent = categorySpentMap[cat.id] || 0;
              const remaining = catBudget - spent;
              const catPercent = (spent / catBudget) * 100;
              const catOver = remaining < 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryForDetail(cat)}
                  className="space-y-1.5 p-2.5 -mx-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.99] transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon name={cat.icon} bgColor={cat.color} size={15} />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors">
                        {cat.name}
                      </span>
                      <ChevronRightIcon size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-gray-400">
                        已用 ¥{spent.toFixed(0)} / ¥{catBudget.toFixed(0)}
                      </span>
                      <span
                        className={`font-semibold ${
                          catOver ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {catOver ? `超 ¥${Math.abs(remaining).toFixed(0)}` : `余 ¥${remaining.toFixed(0)}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        catOver ? 'bg-red-500' : catPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(catPercent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

          {Object.keys(budget.categoryBudgets || {}).length === 0 && (
            <div className="text-center py-6 text-xs text-gray-400">
              您尚未配置分类限额，点击右上角设置餐饮、娱乐等分类预算
            </div>
          )}
        </div>
      </div>

      {/* Edit Budget Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">设置月度与分类预算</h3>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
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

      {/* Category Transactions Detail Modal */}
      {selectedCategoryForDetail && (
        <CategoryTransactionsModal
          isOpen={!!selectedCategoryForDetail}
          onClose={() => setSelectedCategoryForDetail(null)}
          categoryName={selectedCategoryForDetail.name}
          categoryIcon={selectedCategoryForDetail.icon}
          categoryColor={selectedCategoryForDetail.color}
          currentYear={currentYear}
          currentMonth={currentMonth}
          transactions={selectedCatTransactions}
          type="expense"
        />
      )}
    </div>
  );
};
