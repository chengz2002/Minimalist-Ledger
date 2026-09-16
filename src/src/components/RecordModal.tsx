import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Category, Account, Transaction, TransactionType, Subcategory } from '../types/ledger';
import { storageService, formatLocalDate } from '../services/storageService';
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
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

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
      }
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, initialTransaction]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
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
              onClick={() => setShowAccountMenu(prev => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 active:scale-95 transition"
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

        {/* Calculator Keypad with Remark input directly underneath Amount */}
        <QuickKeypad
          initialAmount={initialTransaction?.amount || 0}
          onSave={handleSave}
          date={date}
          onDateClick={() => setShowDatePicker(true)}
          remark={remark}
          onRemarkChange={setRemark}
          quickTags={type === 'expense' ? quickExpenseTags : quickIncomeTags}
        />
      </div>

      {/* Date & Time Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">选择账单日期与时间</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">时间</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDate(formatLocalDate());
                }}
                className="px-3 py-2 rounded-xl text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                设为今天
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
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
