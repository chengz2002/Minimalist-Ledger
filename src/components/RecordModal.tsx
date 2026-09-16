import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronDown, Check, Divide, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category, Account, Transaction, TransactionType, Subcategory } from '../types/ledger';
import { storageService, formatLocalDate } from '../services/storageService';
import { backButtonManager } from '../services/backButtonManager';
import { CategoryPicker } from './CategoryPicker';
import { QuickKeypad } from './QuickKeypad';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>, continueAdding: boolean) => void;
  initialTransaction?: Transaction | null;
  initialType?: TransactionType;
  onAddCategory?: (category: Omit<Category, 'id'>) => void;
  onAddSubcategory?: (categoryId: string, name: string) => void;
  onDeleteSubcategory?: (categoryId: string, subcategoryId: string) => void;
  onOpenAccountManager?: () => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  onSaveTransaction,
  initialTransaction,
  initialType,
  onAddCategory,
  onAddSubcategory,
  onDeleteSubcategory,
  onOpenAccountManager,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [date, setDate] = useState<string>(() => formatLocalDate());
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [remark, setRemark] = useState<string>('');
  const [isAmortized, setIsAmortized] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Register back button handler
  useEffect(() => {
    if (!isOpen) return;
    backButtonManager.register('record-modal', () => {
      if (showDatePicker) {
        setShowDatePicker(false);
        return true;
      }
      if (showAccountMenu) {
        setShowAccountMenu(false);
        return true;
      }
      onClose();
      return true;
    }, 100);

    return () => {
      backButtonManager.unregister('record-modal');
    };
  }, [isOpen, showDatePicker, showAccountMenu, onClose]);

  // Calculate Monday to Sunday 7 days for the current weekOffset
  const currentWeekDays = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() + weekOffset * 7);

    const dayOfWeek = base.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);

    const list: { dateStr: string; dayNum: number; weekLabel: string; isToday: boolean; isSelected: boolean }[] = [];
    const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const todayStr = formatLocalDate();

    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(dt);
      list.push({
        dateStr,
        dayNum: dt.getDate(),
        weekLabel: weekLabels[i],
        isToday: dateStr === todayStr,
        isSelected: dateStr === date,
      });
    }
    return list;
  }, [date, weekOffset]);

  // Quick tags
  const quickExpenseTags = ['早饭', '午餐', '晚餐', '夜宵', '打车', '超市', '日用', '房租', '零食'];
  const quickIncomeTags = ['工资', '兼职', '奖金', '转账', '理财', '红包'];

  // Ref tracking open state to prevent accounts update from resetting category/date while user is typing or clicking "再记一笔"
  const wasOpenRef = useRef(false);

  // Initialize or reset ONLY when modal transitions from closed to open or editing target changes
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;

      if (initialTransaction) {
        setType(initialTransaction.type);
        const cat = categories.find(c => c.id === initialTransaction.categoryId) || null;
        setSelectedCategory(cat);
        if (cat && initialTransaction.subcategoryId) {
          const sub = cat.subcategories?.find(s => s.id === initialTransaction.subcategoryId);
          setSelectedSubcategory(sub);
        } else {
          setSelectedSubcategory(undefined);
        }
        const acc = accounts.find(a => a.id === initialTransaction.accountId) || null;
        setSelectedAccount(acc);
        setDate(initialTransaction.date);
        setTime(initialTransaction.time || '12:00');
        setRemark(initialTransaction.remark || '');
        setIsAmortized(!!initialTransaction.isAmortized);
      } else {
        const activeType = initialType || 'expense';
        setType(activeType);
        const firstExp = categories.find(c => c.type === activeType) || categories[0] || null;
        setSelectedCategory(firstExp);
        setSelectedSubcategory(undefined);

        // Default to empty unless previously selected
        const lastAccId = storageService.getLastSelectedAccountId();
        const defaultAcc = lastAccId ? accounts.find(a => a.id === lastAccId) || null : null;
        setSelectedAccount(defaultAcc);

        setDate(formatLocalDate());
        const now = new Date();
        setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        setRemark('');
        setIsAmortized(false);
        setWeekOffset(0);
      }
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, initialTransaction]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setIsAmortized(false);
    }
    const firstCat = categories.find(c => c.type === newType);
    if (firstCat) {
      setSelectedCategory(firstCat);
      setSelectedSubcategory(undefined);
    }
  };

  const handleSave = (amount: number, continueAdding: boolean) => {
    if (!selectedCategory) {
      showToast('请选择记账分类');
      return;
    }
    if (amount <= 0) {
      showToast('请输入有效金额');
      return;
    }

    // Remember last chosen account (or null if empty)
    storageService.setLastSelectedAccountId(selectedAccount ? selectedAccount.id : null);

    onSaveTransaction(
      {
        type,
        amount,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        subcategoryId: selectedSubcategory?.id,
        subcategoryName: selectedSubcategory?.name,
        accountId: selectedAccount?.id || '',
        accountName: selectedAccount?.name || '',
        date,
        time,
        remark: remark.trim(),
        isAmortized: type === 'expense' ? isAmortized : false,
      },
      continueAdding
    );

    if (continueAdding) {
      setRemark('');
      showToast('✓ 已入账！可继续记下一笔');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-200">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div className="bg-white dark:bg-[#1a1f2c] rounded-t-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Sheet Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          {/* Account Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedAccount?.color || '#9ca3af' }}
              />
              <span>{selectedAccount ? selectedAccount.name : '不选账户'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {/* Account dropdown */}
            {showAccountMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowAccountMenu(false)} />
                <div className="absolute left-0 top-9 mt-1 w-48 bg-white dark:bg-[#202737] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-30 divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Option 1: Empty Account */}
                  <div className="pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(null);
                        setShowAccountMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        !selectedAccount
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>不选账户 (留空)</span>
                      </div>
                      {!selectedAccount && <span className="text-[10px]">✓</span>}
                    </button>
                  </div>

                  {/* Option 2: Account List */}
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setShowAccountMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                          selectedAccount?.id === acc.id
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                          <span>{acc.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">¥{acc.balance.toFixed(0)}</span>
                      </button>
                    ))}
                  </div>

                  {/* Option 3: Account Manager Entry */}
                  {onOpenAccountManager && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onOpenAccountManager();
                        }}
                        className="w-full px-3 py-1.5 text-xs text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium transition"
                      >
                        + 账户管理
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {initialTransaction ? '编辑账单' : '记一笔'}
            {selectedSubcategory && (
              <span className="text-blue-500 ml-1">· {selectedSubcategory.name}</span>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* In-modal Toast Message */}
        {toastMessage && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-gray-900/90 dark:bg-blue-600 text-white text-xs font-medium shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top duration-200">
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Category Picker Area (With Primary & Subcategory selection) */}
        <CategoryPicker
          categories={categories}
          selectedCategoryId={selectedCategory?.id || ''}
          onSelectCategory={cat => setSelectedCategory(cat)}
          selectedSubcategoryId={selectedSubcategory?.id}
          onSelectSubcategory={sub => setSelectedSubcategory(sub)}
          type={type}
          onTypeChange={handleTypeChange}
          onAddCategory={onAddCategory}
          onAddSubcategory={onAddSubcategory}
          onDeleteSubcategory={onDeleteSubcategory}
        />

        {/* Amortization Switch for Expense */}
        {type === 'expense' && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Divide size={12} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-purple-950 dark:text-purple-200">
                    当月每日均摊
                  </span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-purple-100/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    水电·网费·话费·房租
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAmortized(!isAmortized)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isAmortized ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAmortized ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
          </div>
        )}

        {/* Calculator Keypad with Remark input directly underneath Amount */}
        <QuickKeypad
          initialAmount={initialTransaction?.amount || 0}
          onSave={handleSave}
          date={date}
          onDateClick={() => setShowDatePicker(true)}
          remark={remark}
          onRemarkChange={setRemark}
          quickTags={type === 'expense' ? quickExpenseTags : quickIncomeTags}
          isAmortized={type === 'expense' && isAmortized}
        />
      </div>

      {/* Date & Time Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 w-full max-w-xs shadow-2xl space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                选择账单日期与时间
              </h3>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick 7-Day Week Row (周一 ~ 周日 7个小按键) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-medium text-gray-600 dark:text-gray-300">快速选周内日期：</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
                    title="上一周"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-mono font-medium">
                    {weekOffset === 0 ? '本周' : weekOffset > 0 ? `+${weekOffset}周` : `${weekOffset}周`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
                    title="下一周"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* 7 Buttons Grid: 周一到周日 */}
              <div className="grid grid-cols-7 gap-1">
                {currentWeekDays.map(item => (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => {
                      setDate(item.dateStr);
                    }}
                    className={`flex flex-col items-center py-2 px-0.5 rounded-xl text-center transition active:scale-90 ${
                      item.isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                        : item.isToday
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-semibold'
                        : 'bg-gray-50 dark:bg-[#151923] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-[10px] opacity-80">{item.weekLabel}</span>
                    <span className="text-xs font-bold mt-0.5">{item.dayNum}</span>
                    {item.isToday && !item.isSelected && (
                      <span className="text-[8px] scale-80 text-blue-500 font-medium">今</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date & Time Inputs */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">自定义指定日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">记账时间</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDate(formatLocalDate());
                  setWeekOffset(0);
                }}
                className="px-3 py-2 rounded-xl text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95"
              >
                今天
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date(Date.now() - 86400000);
                  setDate(formatLocalDate(yesterday));
                }}
                className="px-3 py-2 rounded-xl text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95"
              >
                昨天
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition active:scale-95 shadow-md shadow-blue-500/20"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
