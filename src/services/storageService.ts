import {
  Transaction,
  Category,
  Account,
  BudgetConfig,
  ReminderConfig,
  LedgerBackup,
  Subcategory,
  TransactionType,
} from '../types/ledger';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
  DEFAULT_BUDGET,
  DEFAULT_REMINDER,
  generateSampleTransactions,
  CATEGORY_ALIASES,
} from './defaults';

// Safe local date formatter (avoids UTC timezone date shift)
export function formatLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'simple_ledger_transactions',
  CATEGORIES: 'simple_ledger_categories',
  ACCOUNTS: 'simple_ledger_accounts',
  BUDGET: 'simple_ledger_budget',
  REMINDER: 'simple_ledger_reminder',
  DARK_MODE: 'simple_ledger_dark_mode',
  HAS_INITIALIZED: 'simple_ledger_initialized',
  HAS_INITIALIZED_LEGACY: 'simple_ledger_has_initialized',
  TOUR_COMPLETED: 'simple_ledger_tour_completed',
  LAST_ACCOUNT_ID: 'simple_ledger_last_account_id',
  AUTO_SNAPSHOT: 'simple_ledger_auto_snapshot',
  SNAPSHOT_TIME: 'simple_ledger_snapshot_time',
};

class StorageService {
  // Initialize storage safely without ever wiping existing user data
  public init(): void {
    const hasInitializedFlag = localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED) === 'true' ||
                               localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED_LEGACY) === 'true';
    const existingRawTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

    // Only populate sample transactions if there is strictly NO data and never initialized
    if (!hasInitializedFlag && existingRawTransactions === null) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(DEFAULT_BUDGET));
      localStorage.setItem(STORAGE_KEYS.REMINDER, JSON.stringify(DEFAULT_REMINDER));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(generateSampleTransactions()));
    } else {
      // Ensure essential keys exist without overwriting
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.BUDGET)) {
        localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(DEFAULT_BUDGET));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REMINDER)) {
        localStorage.setItem(STORAGE_KEYS.REMINDER, JSON.stringify(DEFAULT_REMINDER));
      }

      // Check if transactions is empty array but auto snapshot has data -> recover!
      const currentTx = this.getTransactions();
      if (currentTx.length === 0) {
        const snapshot = this.getAutoSnapshot();
        if (snapshot && snapshot.length > 0) {
          console.log(`[StorageService] Recovering ${snapshot.length} transactions from auto snapshot`);
          this.saveTransactions(snapshot);
        }
      }

      // Migrate categories if missing subcategories
      const cats = this.getCategories();
      let hasChange = false;
      const updatedCats = cats.map(c => {
        if (!c.subcategories) {
          const defaultC = DEFAULT_CATEGORIES.find(dc => dc.id === c.id);
          if (defaultC && defaultC.subcategories) {
            hasChange = true;
            return { ...c, subcategories: defaultC.subcategories };
          }
        }
        return c;
      });
      if (hasChange) {
        this.saveCategories(updatedCats);
      }

      // Auto-migrate previously imported transactions with orphaned cat_ IDs
      try {
        const txs = this.getTransactions();
        let txsChanged = false;
        const defaultCats = DEFAULT_CATEGORIES;
        const migratedTxs = txs.map(t => {
          if (t.categoryId && t.categoryId.startsWith('cat_') && CATEGORY_ALIASES[t.categoryName]) {
            const targetId = CATEGORY_ALIASES[t.categoryName];
            const targetCat = defaultCats.find(dc => dc.id === targetId);
            if (targetCat) {
              txsChanged = true;
              return {
                ...t,
                categoryId: targetCat.id,
                categoryName: targetCat.name,
                categoryIcon: targetCat.icon,
                categoryColor: targetCat.color,
                subcategoryName: t.subcategoryName || t.categoryName,
              };
            }
          }
          return t;
        });
        if (txsChanged) {
          this.saveTransactions(migratedTxs);
        }
      } catch (e) {
        console.error('Migration error', e);
      }
    }

    // Ensure both initialization flags are marked to protect future updates
    localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED_LEGACY, 'true');
  }

  // Transactions
  public getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse transactions', e);
      return [];
    }
  }

  public saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    // Auto Snapshot: keep a rolling copy of valid transactions to prevent accidental loss
    if (transactions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTO_SNAPSHOT, JSON.stringify(transactions));
        localStorage.setItem(STORAGE_KEYS.SNAPSHOT_TIME, new Date().toISOString());
      } catch (e) {
        console.warn('Failed to save auto snapshot', e);
      }
    }
  }

  public getAutoSnapshot(): Transaction[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTO_SNAPSHOT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public getSnapshotInfo(): { hasSnapshot: boolean; count: number; time: string | null } {
    const snapshot = this.getAutoSnapshot();
    const time = localStorage.getItem(STORAGE_KEYS.SNAPSHOT_TIME);
    return {
      hasSnapshot: !!(snapshot && snapshot.length > 0),
      count: snapshot ? snapshot.length : 0,
      time: time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : null,
    };
  }

  public restoreFromSnapshot(): { success: boolean; count: number; message: string } {
    const snapshot = this.getAutoSnapshot();
    if (!snapshot || snapshot.length === 0) {
      return { success: false, count: 0, message: '暂无可用本地快照' };
    }
    this.saveTransactions(snapshot);
    return {
      success: true,
      count: snapshot.length,
      message: `成功从本地快照恢复 ${snapshot.length} 笔账单流水！`,
    };
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    // Sync account balance
    this.updateAccountBalance(newTx.accountId, newTx.type === 'expense' ? -newTx.amount : newTx.amount);

    return newTx;
  }

  public updateTransaction(id: string, updated: Partial<Transaction>): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      const oldTx = transactions[index];
      // Revert old account balance
      this.updateAccountBalance(oldTx.accountId, oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount);

      const merged = { ...oldTx, ...updated };
      transactions[index] = merged;
      this.saveTransactions(transactions);

      // Apply new account balance
      this.updateAccountBalance(merged.accountId, merged.type === 'expense' ? -merged.amount : merged.amount);
    }
  }

  public deleteTransaction(id: string): void {
    const transactions = this.getTransactions();
    const target = transactions.find(t => t.id === id);
    if (target) {
      // Revert account balance
      this.updateAccountBalance(target.accountId, target.type === 'expense' ? target.amount : -target.amount);
      const filtered = transactions.filter(t => t.id !== id);
      this.saveTransactions(filtered);
    }
  }

  // Categories & Subcategories
  public getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  public saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  public addCategory(category: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...category,
      id: 'cat_' + Date.now(),
      subcategories: category.subcategories || [],
    };
    categories.push(newCat);
    this.saveCategories(categories);
    return newCat;
  }

  public addSubcategory(categoryId: string, subcategoryName: string): Subcategory | null {
    const categories = this.getCategories();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return null;

    if (!cat.subcategories) {
      cat.subcategories = [];
    }

    const newSub: Subcategory = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      name: subcategoryName.trim(),
      parentId: categoryId,
    };

    cat.subcategories.push(newSub);
    this.saveCategories(categories);
    return newSub;
  }

  public deleteSubcategory(categoryId: string, subcategoryId: string): void {
    const categories = this.getCategories();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat || !cat.subcategories) return;

    cat.subcategories = cat.subcategories.filter(s => s.id !== subcategoryId);
    this.saveCategories(categories);
  }

  // Accounts
  public getAccounts(): Account[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  }

  public saveAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  public addAccount(account: Omit<Account, 'id'>): Account {
    const accounts = this.getAccounts();
    const newAcc: Account = {
      ...account,
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    accounts.push(newAcc);
    this.saveAccounts(accounts);
    return newAcc;
  }

  public deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    this.saveAccounts(filtered);
    if (this.getLastSelectedAccountId() === id) {
      this.setLastSelectedAccountId(null);
    }
    return true;
  }

  public getLastSelectedAccountId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_ACCOUNT_ID);
  }

  public setLastSelectedAccountId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.LAST_ACCOUNT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_ACCOUNT_ID);
    }
  }

  public updateAccountBalance(accountId: string | undefined, delta: number): void {
    if (!accountId) return;
    const accounts = this.getAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (acc) {
      acc.balance = Math.round((acc.balance + delta) * 100) / 100;
      this.saveAccounts(accounts);
    }
  }

  // Budget
  public getBudget(): BudgetConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
      return data ? JSON.parse(data) : DEFAULT_BUDGET;
    } catch {
      return DEFAULT_BUDGET;
    }
  }

  public saveBudget(budget: BudgetConfig): void {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
  }

  // Reminder Configuration
  public getReminder(): ReminderConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDER);
      return data ? JSON.parse(data) : DEFAULT_REMINDER;
    } catch {
      return DEFAULT_REMINDER;
    }
  }

  public saveReminder(reminder: ReminderConfig): void {
    localStorage.setItem(STORAGE_KEYS.REMINDER, JSON.stringify(reminder));
  }

  public isDarkMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
  }

  public setDarkMode(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, enabled ? 'true' : 'false');
  }

  // Feature Tour Lifecycle
  public isTourCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED) === 'true';
  }

  public setTourCompleted(completed: boolean): void {
    localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, completed ? 'true' : 'false');
  }

  public startTourWithDemoData(): void {
    // Non-destructive: simply set flag to show tour, NEVER wipe user data!
    this.setTourCompleted(false);
  }

  public finishTour(_clearDemoData: boolean = false): void {
    this.setTourCompleted(true);
    // Real user transactions must NEVER be wiped by closing or completing a tour!
  }

  // Backup & Restore
  public createBackup(): LedgerBackup {
    return {
      version: 1,
      appName: 'SimpleFreeLedger',
      exportTime: new Date().toISOString(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      accounts: this.getAccounts(),
      budget: this.getBudget(),
      reminder: this.getReminder(),
    };
  }

  private saveFileContent(fileName: string, content: string, mimeType: string): { fileName: string; filePath: string } {
    const bridge = (window as any).AndroidWidgetBridge;
    if (bridge && typeof bridge.saveFileToDownloads === 'function') {
      try {
        const nativePath = bridge.saveFileToDownloads(fileName, content, mimeType);
        if (nativePath && typeof nativePath === 'string' && nativePath.length > 0) {
          return { fileName, filePath: nativePath };
        }
      } catch (err) {
        console.warn('Native saveFileToDownloads failed, using browser fallback', err);
      }
    }

    // Web browser download fallback
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      fileName,
      filePath: '手机系统默认下载目录 (Downloads / 下载)',
    };
  }

  public exportBackupFile(): { fileName: string; filePath: string } {
    const backup = this.createBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const dateStr = formatLocalDate();
    const fileName = `ledger_backup_${dateStr}.json`;
    return this.saveFileContent(fileName, jsonStr, 'application/json');
  }

  public importBackup(backupJson: string, mode: 'overwrite' | 'merge' = 'overwrite'): { success: boolean; count: number; message: string } {
    try {
      const parsed = JSON.parse(backupJson);

      // Extract array if it's direct array or wrapped in data/list
      let rawArray: any[] | null = null;
      if (Array.isArray(parsed)) {
        rawArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.data)) rawArray = parsed.data;
        else if (Array.isArray(parsed.list)) rawArray = parsed.list;
        else if (Array.isArray(parsed.bills)) rawArray = parsed.bills;
      }

      // Case 1: External Qianji JSON format (array of bill objects containing 'money' or 'key')
      if (rawArray && rawArray.length > 0 && ('money' in rawArray[0] || 'key' in rawArray[0] || 'category' in rawArray[0])) {
        const qianjiBills = rawArray;
        const existingCats = this.getCategories();
        const existingAccounts = this.getAccounts();

        const categoryMap = new Map<string, Category>();
        existingCats.forEach(c => categoryMap.set(c.name, c));

        const iconColorMap: Record<string, { icon: string; color: string }> = {
          '三餐': { icon: 'Utensils', color: '#f97316' },
          '餐饮': { icon: 'Utensils', color: '#f97316' },
          '餐饮美食': { icon: 'Utensils', color: '#f97316' },
          '日用品': { icon: 'ShoppingBag', color: '#ec4899' },
          '日用百货': { icon: 'ShoppingBag', color: '#ec4899' },
          '衣服': { icon: 'ShoppingBag', color: '#ec4899' },
          '美妆': { icon: 'ShoppingBag', color: '#ec4899' },
          '公交卡': { icon: 'Car', color: '#3b82f6' },
          '高铁': { icon: 'Car', color: '#3b82f6' },
          '交通': { icon: 'Car', color: '#3b82f6' },
          '交通出行': { icon: 'Car', color: '#3b82f6' },
          '打车': { icon: 'Car', color: '#3b82f6' },
          '火车': { icon: 'Car', color: '#3b82f6' },
          '汽车/加油': { icon: 'Car', color: '#3b82f6' },
          '零食': { icon: 'Coffee', color: '#eab308' },
          '饮品': { icon: 'Coffee', color: '#eab308' },
          '水果': { icon: 'Coffee', color: '#eab308' },
          '咖啡零食': { icon: 'Coffee', color: '#eab308' },
          '酒店': { icon: 'Gamepad2', color: '#06b6d4' },
          '门票': { icon: 'Gamepad2', color: '#06b6d4' },
          '旅行': { icon: 'Gamepad2', color: '#06b6d4' },
          '娱乐': { icon: 'Gamepad2', color: '#06b6d4' },
          '休闲娱乐': { icon: 'Gamepad2', color: '#06b6d4' },
          '学习': { icon: 'GraduationCap', color: '#6366f1' },
          '教育提升': { icon: 'GraduationCap', color: '#6366f1' },
          '医疗': { icon: 'HeartPulse', color: '#ef4444' },
          '医疗保健': { icon: 'HeartPulse', color: '#ef4444' },
          '电器数码': { icon: 'Smartphone', color: '#14b8a6' },
          '数码电器': { icon: 'Smartphone', color: '#14b8a6' },
          '话费网费': { icon: 'Smartphone', color: '#14b8a6' },
          '水电煤': { icon: 'Home', color: '#8b5cf6' },
          '住房物业': { icon: 'Home', color: '#8b5cf6' },
          '工资': { icon: 'Banknote', color: '#10b981' },
          '工资薪酬': { icon: 'Banknote', color: '#10b981' },
          '副业兼职': { icon: 'Briefcase', color: '#3b82f6' },
          '理财收益': { icon: 'TrendingUp', color: '#8b5cf6' },
          '生活费': { icon: 'Coins', color: '#10b981' },
          '收红包': { icon: 'Coins', color: '#f43f5e' },
          '人情红包': { icon: 'Coins', color: '#f43f5e' },
          '快递': { icon: 'ShoppingBag', color: '#ec4899' },
          '其它': { icon: 'CircleEllipsis', color: '#64748b' },
          '其它支出': { icon: 'CircleEllipsis', color: '#64748b' },
        };

        const importedTransactions: Transaction[] = [];

        for (let idx = 0; idx < qianjiBills.length; idx++) {
          const item = qianjiBills[idx];
          if (!item || typeof item !== 'object') continue;

          // Determine transaction type
          let txType: TransactionType = 'expense';
          let appendRemark = '';
          const rawType = String(item.type || '').trim();

          if (rawType === '收入') {
            txType = 'income';
          } else if (rawType === '退款') {
            txType = 'income';
            appendRemark = '(退款)';
          } else if (rawType === '转账') {
            txType = 'expense';
            appendRemark = '(转账)';
          } else if (rawType === '还款') {
            txType = 'expense';
            appendRemark = '(还款)';
          } else {
            txType = (item.money && item.money < 0) ? 'income' : 'expense';
          }

          // Date & Time parsing
          let dateStr = formatLocalDate();
          let timeStr = '12:00';
          if (item.date && typeof item.date === 'string') {
            const parts = item.date.trim().split(' ');
            if (parts[0] && parts[0].includes('-')) {
              dateStr = parts[0];
            }
            if (parts[1]) {
              timeStr = parts[1].slice(0, 5);
            }
          }

          // Amount
          const amount = Math.abs(Number(item.money) || 0);

          // Category mapping & auto creation
          const rawCatName = (item.category && typeof item.category === 'string' && item.category.trim())
            ? item.category.trim()
            : '其它';
          
          let matchedCat: Category | undefined;
          let subcategoryName: string | undefined = undefined;

          // 1. Check alias mapping to primary category
          const aliasPrimaryId = CATEGORY_ALIASES[rawCatName];
          if (aliasPrimaryId) {
            matchedCat = existingCats.find(c => c.id === aliasPrimaryId);
            if (matchedCat && matchedCat.name !== rawCatName) {
              subcategoryName = rawCatName;
            }
          }

          // 2. Direct match by existing category name
          if (!matchedCat) {
            matchedCat = categoryMap.get(rawCatName);
          }

          // 3. Fallback auto create
          if (!matchedCat) {
            const style = iconColorMap[rawCatName] || { icon: 'Tag', color: '#3b82f6' };
            matchedCat = {
              id: 'cat_' + Date.now() + '_' + idx,
              name: rawCatName,
              type: txType,
              icon: style.icon,
              color: style.color,
            };
            existingCats.push(matchedCat);
            categoryMap.set(rawCatName, matchedCat);
          }

          // Remark
          let fullRemark = (item.remark && typeof item.remark === 'string') ? item.remark.trim() : '';
          if (appendRemark && !fullRemark.includes(appendRemark)) {
            fullRemark = fullRemark ? `${fullRemark} ${appendRemark}` : appendRemark;
          }
          // Account matching: only attach if explicitly present and matches an existing account; otherwise leave empty
          let txAccountId = '';
          let txAccountName = '';
          const candidateAcc = item.accountName || item.account || item.account_name;
          if (candidateAcc && typeof candidateAcc === 'string') {
            const cleanAcc = candidateAcc.trim();
            const matchedAcc = existingAccounts.find(a => a.name === cleanAcc || a.id === cleanAcc);
            if (matchedAcc) {
              txAccountId = matchedAcc.id;
              txAccountName = matchedAcc.name;
            }
          }

          const tx: Transaction = {
            id: item.key || `tx_import_${idx}_${Date.now()}`,
            type: txType,
            amount,
            categoryId: matchedCat.id,
            categoryName: matchedCat.name,
            categoryIcon: matchedCat.icon,
            categoryColor: matchedCat.color,
            subcategoryName: subcategoryName,
            accountId: txAccountId,
            accountName: txAccountName,
            date: dateStr,
            time: timeStr,
            remark: fullRemark,
            createdAt: new Date(`${dateStr}T${timeStr}:00`).getTime() || (Date.now() - idx * 1000),
          };

          importedTransactions.push(tx);
        }

        // Save categories and transactions
        this.saveCategories(existingCats);

        if (mode === 'overwrite') {
          this.saveTransactions(importedTransactions);
        } else {
          const existingTx = this.getTransactions();
          const existingIds = new Set(existingTx.map(t => t.id));
          const merged = [...existingTx];
          for (const t of importedTransactions) {
            if (!existingIds.has(t.id)) {
              merged.push(t);
            }
          }
          this.saveTransactions(merged);
        }

        return {
          success: true,
          count: importedTransactions.length,
          message: `成功导入 ${importedTransactions.length} 笔外部账单！已自动匹配分类并生成流水。`,
        };
      }

      // Case 2: Standard Simple Ledger Backup Object
      const data = parsed as LedgerBackup;
      if (data && Array.isArray(data.transactions) && Array.isArray(data.categories)) {
        if (mode === 'overwrite') {
          this.saveTransactions(data.transactions);
          this.saveCategories(data.categories);
          if (data.accounts) this.saveAccounts(data.accounts);
          if (data.budget) this.saveBudget(data.budget);
          if (data.reminder) this.saveReminder(data.reminder);
        } else {
          const existingTx = this.getTransactions();
          const existingIds = new Set(existingTx.map(t => t.id));
          const mergedTx = [...existingTx];
          for (const t of data.transactions) {
            if (!existingIds.has(t.id)) {
              mergedTx.push(t);
            }
          }
          this.saveTransactions(mergedTx);
        }
        return {
          success: true,
          count: data.transactions.length,
          message: `数据恢复成功！已还原 ${data.transactions.length} 笔账单及相关配置。`,
        };
      }

      throw new Error('未识别的文件格式，请确认是导出的 JSON 文件');
    } catch (e: any) {
      console.error('Import failed', e);
      return {
        success: false,
        count: 0,
        message: e?.message || '备份解析失败，请检查文件是否为合法 JSON',
      };
    }
  }

  public exportCSV(): { fileName: string; filePath: string } {
    const transactions = this.getTransactions();
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

    // CSV header including secondary subcategory and amortization
    const headers = ['账单ID', '类型', '金额', '一级分类', '二级分类', '账户', '日期', '时间', '当月每日均摊', '备注'];
    const rows = sorted.map(t => [
      t.id,
      t.type === 'expense' ? '支出' : '收入',
      t.amount.toFixed(2),
      `"${(t.categoryName || '').replace(/"/g, '""')}"`,
      `"${(t.subcategoryName || '').replace(/"/g, '""')}"`,
      `"${(t.accountName || '').replace(/"/g, '""')}"`,
      t.date,
      t.time || '',
      t.isAmortized ? '是' : '否',
      `"${(t.remark || '').replace(/"/g, '""')}"`,
    ]);

    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dateStr = formatLocalDate();
    const fileName = `bills_${dateStr}.csv`;
    return this.saveFileContent(fileName, csvContent, 'text/csv;charset=utf-8;');
  }

  public resetToSample(): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(DEFAULT_BUDGET));
    localStorage.setItem(STORAGE_KEYS.REMINDER, JSON.stringify(DEFAULT_REMINDER));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(generateSampleTransactions()));
  }

  public clearAll(): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  }
}

export const storageService = new StorageService();
