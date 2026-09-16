import React, { useState, useEffect, useMemo } from 'react';
import { storageService, formatLocalDate } from './services/storageService';
import { notificationService } from './services/notificationService';
import {
  Transaction,
  Category,
  Account,
  BudgetConfig,
  FilterOptions,
  TransactionType,
} from './types/ledger';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { TransactionList } from './components/TransactionList';
import { RecordModal } from './components/RecordModal';
import { FilterDrawer } from './components/FilterDrawer';
import { StatsView } from './components/StatsView';
import { BudgetView } from './components/BudgetView';
import { SettingsView } from './components/SettingsView';
import { FeatureTourModal } from './components/FeatureTourModal';
import { WidgetCenterModal } from './components/WidgetCenterModal';
import { DailyTrendChart } from './components/DailyTrendChart';
import { AccountManagerModal } from './components/AccountManagerModal';
import { Bell, X } from 'lucide-react';

export const App: React.FC = () => {
  // Initialize storage once
  useEffect(() => {
    storageService.init();
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  // Month & Year state
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);

  // Core data states
  const [transactions, setTransactions] = useState<Transaction[]>(() => storageService.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [accounts, setAccounts] = useState<Account[]>(() => storageService.getAccounts());
  const [budget, setBudget] = useState<BudgetConfig>(() => storageService.getBudget());

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => storageService.isDarkMode());

  // Filters & Modals
  const [filters, setFilters] = useState<FilterOptions>({ type: 'all' });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordInitialType, setRecordInitialType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Tour state - opens automatically on first launch
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => !storageService.isTourCompleted());

  // Listen for widget launch triggers (e.g. native bridge, ?action=record or #record)
  useEffect(() => {
    // 1. Global trigger callable from Android WebView
    (window as any).triggerQuickRecord = () => {
      setEditingTransaction(null);
      setRecordInitialType('expense');
      setIsRecordModalOpen(true);
    };

    // 2. Check pending action from Android Native Bridge
    const bridge = (window as any).AndroidWidgetBridge;
    if (bridge && typeof bridge.getPendingAction === 'function') {
      const pending = bridge.getPendingAction();
      if (pending === 'record') {
        (window as any).triggerQuickRecord();
      }
    }

    const checkLaunchTrigger = () => {
      const url = new URL(window.location.href);
      const action = url.searchParams.get('action') || window.location.hash.replace('#', '');
      if (action === 'record' || action === 'record-expense') {
        setEditingTransaction(null);
        setRecordInitialType('expense');
        setIsRecordModalOpen(true);
      } else if (action === 'record-income') {
        setEditingTransaction(null);
        setRecordInitialType('income');
        setIsRecordModalOpen(true);
      } else if (action === 'widget-center') {
        setIsWidgetModalOpen(true);
      }
    };
    checkLaunchTrigger();
    window.addEventListener('hashchange', checkLaunchTrigger);
    return () => window.removeEventListener('hashchange', checkLaunchTrigger);
  }, []);

  // In-app Notification Banner State
  const [inAppNotif, setInAppNotif] = useState<{ title: string; body: string } | null>(null);

  // Setup Notification Scheduler & in-app callback
  useEffect(() => {
    notificationService.setInAppCallback((title, body) => {
      setInAppNotif({ title, body });
      setTimeout(() => setInAppNotif(null), 6000);
    });

    notificationService.startScheduler(
      () => storageService.getReminder(),
      updater => {
        const current = storageService.getReminder();
        const next = updater(current);
        storageService.saveReminder(next);
      }
    );

    return () => {
      notificationService.stopScheduler();
    };
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.setDarkMode(isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Reload data from storage
  const reloadData = () => {
    setTransactions(storageService.getTransactions());
    setCategories(storageService.getCategories());
    setAccounts(storageService.getAccounts());
    setBudget(storageService.getBudget());
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(monthPrefix));
  }, [transactions, monthPrefix]);

  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const todayStr = useMemo(() => formatLocalDate(), []);
  const todayExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayStr]);

  // 7-day daily expense trend for Android widgets & widget center
  const recent7DaysExpenses = useMemo(() => {
    const today = new Date();
    const result: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const ds = formatLocalDate(d);
      const daySum = transactions
        .filter(t => t.type === 'expense' && t.date === ds)
        .reduce((sum, t) => sum + t.amount, 0);
      result.push(daySum);
    }
    return result;
  }, [transactions]);

  // Synchronize live financial data to Android native desktop widgets
  useEffect(() => {
    const bridge = (window as any).AndroidWidgetBridge;
    if (bridge && typeof bridge.updateWidgetData === 'function') {
      try {
        bridge.updateWidgetData(JSON.stringify({
          todayExpense,
          monthExpense: totalExpense,
          budgetTotal: budget.monthlyTotal,
          budgetRemaining: budget.monthlyTotal - totalExpense,
          dailyTrend: recent7DaysExpenses,
        }));
      } catch (err) {
        console.warn('Failed to update native widget data', err);
      }
    }
  }, [todayExpense, totalExpense, budget.monthlyTotal, recent7DaysExpenses]);

  const isOverBudget = budget.monthlyTotal > 0 && totalExpense > budget.monthlyTotal;

  // Filtered transactions for timeline view
  const displayedTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filters.startDate || filters.endDate) {
        if (filters.startDate && t.date < filters.startDate) return false;
        if (filters.endDate && t.date > filters.endDate) return false;
      } else {
        if (!t.date.startsWith(monthPrefix)) return false;
      }

      if (filters.type && filters.type !== 'all' && t.type !== filters.type) {
        return false;
      }

      if (filters.categoryId && t.categoryId !== filters.categoryId) {
        return false;
      }

      if (filters.accountId && t.accountId !== filters.accountId) {
        return false;
      }

      if (filters.keyword && filters.keyword.trim()) {
        const kw = filters.keyword.trim().toLowerCase();
        const matchRemark = (t.remark || '').toLowerCase().includes(kw);
        const matchCat = (t.categoryName || '').toLowerCase().includes(kw);
        const matchSub = (t.subcategoryName || '').toLowerCase().includes(kw);
        const matchAcc = (t.accountName || '').toLowerCase().includes(kw);
        const matchAmount = t.amount.toString().includes(kw);
        if (!matchRemark && !matchCat && !matchSub && !matchAcc && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, monthPrefix, filters]);

  const isFilterActive = useMemo(() => {
    return (
      (filters.type && filters.type !== 'all') ||
      !!filters.categoryId ||
      !!filters.accountId ||
      !!filters.keyword ||
      !!filters.startDate ||
      !!filters.endDate
    );
  }, [filters]);

  // Transaction CRUD operations
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    continueAdding: boolean
  ) => {
    if (editingTransaction) {
      storageService.updateTransaction(editingTransaction.id, txData);
      setEditingTransaction(null);
    } else {
      storageService.addTransaction(txData);
    }
    reloadData();

    if (!continueAdding) {
      setIsRecordModalOpen(false);
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsRecordModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    storageService.deleteTransaction(id);
    reloadData();
  };

  const handleAddCategory = (catData: Omit<Category, 'id'>) => {
    storageService.addCategory(catData);
    setCategories(storageService.getCategories());
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    storageService.addSubcategory(categoryId, name);
    setCategories(storageService.getCategories());
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    storageService.deleteSubcategory(categoryId, subcategoryId);
    setCategories(storageService.getCategories());
  };

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc = storageService.addAccount(accData);
    setAccounts(storageService.getAccounts());
    storageService.setLastSelectedAccountId(newAcc.id);
  };

  const handleDeleteAccount = (id: string) => {
    storageService.deleteAccount(id);
    setAccounts(storageService.getAccounts());
  };

  const handleSaveBudget = (newBudget: BudgetConfig) => {
    storageService.saveBudget(newBudget);
    setBudget(newBudget);
  };

  const handleStartTour = () => {
    storageService.startTourWithDemoData();
    reloadData();
    setIsTourOpen(true);
  };

  const handleFinishTour = (clearDemoData: boolean) => {
    storageService.finishTour(clearDemoData);
    reloadData();
    setIsTourOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121620] flex justify-center selection:bg-blue-500 selection:text-white">
      {/* Mobile container */}
      <div className="w-full max-w-md bg-[#f7f8fa] dark:bg-[#121620] min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden">
        {/* In-app Reminder Notification Toast Banner */}
        {inAppNotif && (
          <div className="fixed top-3 left-4 right-4 max-w-sm mx-auto z-[90] bg-blue-600 text-white rounded-2xl p-3.5 shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold">{inAppNotif.title}</h4>
                <p className="text-[11px] text-blue-100 mt-0.5">{inAppNotif.body}</p>
                <button
                  type="button"
                  onClick={() => {
                    setInAppNotif(null);
                    setIsRecordModalOpen(true);
                  }}
                  className="mt-1.5 px-3 py-1 rounded-full bg-white text-blue-600 text-[10px] font-bold shadow-xs active:scale-95 transition"
                >
                  去记一笔
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInAppNotif(null)}
              className="text-blue-200 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header with Monthly overview */}
        {activeTab === 'timeline' && (
          <Header
            currentYear={currentYear}
            currentMonth={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            totalExpense={totalExpense}
            totalIncome={totalIncome}
            onOpenFilter={() => setIsFilterDrawerOpen(true)}
            isFilterActive={!!isFilterActive}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onOpenWidgetCenter={() => setIsWidgetModalOpen(true)}
          />
        )}

        {/* Tab 1: 明细流水 */}
        {activeTab === 'timeline' && (
          <main className="flex-1 overflow-y-auto">
            {/* Daily Trend Chart (4-chart combo: month/week, expense/income) */}
            <DailyTrendChart
              transactions={transactions}
              currentYear={currentYear}
              currentMonth={currentMonth}
            />

            {isFilterActive && (
              <div className="mx-4 mt-2 mb-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                <span>已应用自定义筛选条件</span>
                <button
                  type="button"
                  onClick={() => setFilters({ type: 'all' })}
                  className="font-bold underline ml-2"
                >
                  清除筛选
                </button>
              </div>
            )}
            <TransactionList
              transactions={displayedTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onOpenAdd={() => {
                setEditingTransaction(null);
                setRecordInitialType('expense');
                setIsRecordModalOpen(true);
              }}
            />
          </main>
        )}

        {/* Tab 2: 统计图表 */}
        {activeTab === 'stats' && (
          <main className="flex-1 overflow-y-auto pt-safe">
            <StatsView
              transactions={transactions}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </main>
        )}

        {/* Tab 3: 预算中心 */}
        {activeTab === 'budget' && (
          <main className="flex-1 overflow-y-auto pt-safe">
            <BudgetView
              budget={budget}
              transactions={transactions}
              categories={categories}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSaveBudget={handleSaveBudget}
            />
          </main>
        )}

        {/* Tab 4: 设置与提醒 */}
        {activeTab === 'settings' && (
          <main className="flex-1 overflow-y-auto pt-safe">
            <SettingsView
              onDataChanged={reloadData}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              totalTransactionsCount={transactions.length}
              onStartTour={handleStartTour}
              onOpenWidgetCenter={() => setIsWidgetModalOpen(true)}
              onOpenAccountManager={() => setIsAccountModalOpen(true)}
            />
          </main>
        )}

        {/* Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={tab => setActiveTab(tab)}
          onOpenRecord={() => {
            setEditingTransaction(null);
            setRecordInitialType('expense');
            setIsRecordModalOpen(true);
          }}
          isOverBudget={isOverBudget}
        />

        {/* Record Transaction Modal Sheet */}
        <RecordModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setEditingTransaction(null);
          }}
          categories={categories}
          accounts={accounts}
          onSaveTransaction={handleSaveTransaction}
          initialTransaction={editingTransaction}
          initialType={recordInitialType}
          onAddCategory={handleAddCategory}
          onAddSubcategory={handleAddSubcategory}
          onDeleteSubcategory={handleDeleteSubcategory}
          onOpenAccountManager={() => setIsAccountModalOpen(true)}
        />

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onApplyFilters={newFilters => setFilters(newFilters)}
          categories={categories}
          accounts={accounts}
        />

        {/* Feature Tour Modal (First Launch & Settings re-enter) */}
        <FeatureTourModal
          isOpen={isTourOpen}
          onFinish={handleFinishTour}
          onClose={() => handleFinishTour(false)}
        />

        {/* Desktop Widget Center Modal */}
        <WidgetCenterModal
          isOpen={isWidgetModalOpen}
          onClose={() => setIsWidgetModalOpen(false)}
          onOpenRecord={type => {
            setEditingTransaction(null);
            if (type) setRecordInitialType(type);
            setIsRecordModalOpen(true);
          }}
          todayExpense={todayExpense}
          monthExpense={totalExpense}
          budget={budget}
          dailyTrend={recent7DaysExpenses}
        />

        {/* Account Manager Modal */}
        <AccountManagerModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onDeleteAccount={handleDeleteAccount}
        />
      </div>
    </div>
  );
};

export default App;
