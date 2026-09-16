export type TransactionType = 'expense' | 'income';

export interface Subcategory {
  id: string;
  name: string;
  parentId: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
  subcategories?: Subcategory[];
}

export type AccountType = 'wechat' | 'alipay' | 'bank' | 'cash' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  subcategoryId?: string;
  subcategoryName?: string;
  accountId?: string;
  accountName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  remark: string;
  isAmortized?: boolean; // 当月每日均摊
  createdAt: number;
}

export interface BudgetConfig {
  monthlyTotal: number;
  categoryBudgets: Record<string, number>; // categoryId -> budget amount
  alertThreshold: number; // 0.8 means 80%
}

export interface ReminderConfig {
  enabled: boolean;
  time: string; // e.g. "21:30"
  repeatDays: number[]; // 1=周一, 2=周二, ... 7=周日
  lastTriggeredDate?: string;
}

export interface LedgerBackup {
  version: number;
  appName: string;
  exportTime: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budget: BudgetConfig;
  reminder?: ReminderConfig;
}

export interface FilterOptions {
  type?: 'all' | TransactionType;
  categoryId?: string;
  accountId?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}
