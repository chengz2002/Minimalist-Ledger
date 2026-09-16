import React from 'react';
import { X, RotateCcw, Check, Search } from 'lucide-react';
import { Category, Account, FilterOptions, TransactionType } from '../types/ledger';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  categories: Category[];
  accounts: Account[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  categories,
  accounts,
}) => {
  const [draft, setDraft] = React.useState<FilterOptions>(filters);

  React.useEffect(() => {
    setDraft(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    const emptyFilters: FilterOptions = {
      type: 'all',
      categoryId: undefined,
      accountId: undefined,
      keyword: '',
      startDate: undefined,
      endDate: undefined,
    };
    setDraft(emptyFilters);
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1f2c] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 pt-safe pb-safe">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">账单筛选与搜索</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Keyword Search Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">关键词搜索（备注）</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={draft.keyword || ''}
                onChange={e => setDraft(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="搜索备注，例如：超市、咖啡..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">收支类型</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '全部', value: 'all' },
                { label: '仅支出', value: 'expense' },
                { label: '仅收入', value: 'income' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, type: opt.value as 'all' | TransactionType }))}
                  className={`py-2 text-xs font-medium rounded-xl transition ${
                    draft.type === opt.value
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">支付账户</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, accountId: undefined }))}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${
                  !draft.accountId
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                全部账户
              </button>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, accountId: acc.id }))}
                  className={`px-3 py-1.5 text-xs rounded-lg transition ${
                    draft.accountId === acc.id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">账单类别</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 dark:bg-[#151923] rounded-xl">
              <button
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, categoryId: undefined }))}
                className={`px-3 py-1 text-xs rounded-md transition ${
                  !draft.categoryId
                    ? 'bg-blue-500 text-white font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                全部分类
              </button>
              {categories
                .filter(c => draft.type === 'all' || !draft.type || c.type === draft.type)
                .map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, categoryId: cat.id }))}
                    className={`px-3 py-1 text-xs rounded-md transition ${
                      draft.categoryId === cat.id
                        ? 'bg-blue-500 text-white font-medium'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">指定日期范围</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={draft.startDate || ''}
                onChange={e => setDraft(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                className="px-2 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-800 dark:text-gray-200"
              />
              <input
                type="date"
                value={draft.endDate || ''}
                onChange={e => setDraft(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                className="px-2 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 transition"
          >
            <RotateCcw size={14} />
            <span>重置</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition"
          >
            <Check size={16} />
            <span>应用筛选</span>
          </button>
        </div>
      </div>
    </div>
  );
};
