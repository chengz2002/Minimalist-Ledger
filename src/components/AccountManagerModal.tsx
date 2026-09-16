import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Wallet,
  CreditCard,
  Zap,
  MessageCircle,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { Account, AccountType } from '../types/ledger';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
}

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; defaultColor: string; defaultIcon: string }
> = {
  wechat: { label: '微信钱包', defaultColor: '#07c160', defaultIcon: 'MessageCircle' },
  alipay: { label: '支付宝', defaultColor: '#1677ff', defaultIcon: 'Zap' },
  bank: { label: '银行卡/信用卡', defaultColor: '#f59e0b', defaultIcon: 'CreditCard' },
  cash: { label: '现金零钱', defaultColor: '#64748b', defaultIcon: 'Wallet' },
  other: { label: '其它资产', defaultColor: '#8b5cf6', defaultIcon: 'PiggyBank' },
};

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('bank');
  const [newBalance, setNewBalance] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAsset = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage('请输入账户名称');
      return;
    }

    const config = ACCOUNT_TYPE_CONFIG[newType];
    const initialBalance = parseFloat(newBalance) || 0;

    onAddAccount({
      name: trimmed,
      type: newType,
      balance: initialBalance,
      icon: config.defaultIcon,
      color: config.defaultColor,
    });

    setNewName('');
    setNewBalance('');
    setNewType('bank');
    setIsAdding(false);
    setErrorMessage(null);
  };

  const handleDelete = (acc: Account) => {
    if (window.confirm(`确定要删除账户「${acc.name}」吗？\n删除后原有记账流水不受影响。`)) {
      onDeleteAccount(acc.id);
    }
  };

  const renderIcon = (type: AccountType, color: string) => {
    switch (type) {
      case 'wechat':
        return <MessageCircle size={18} style={{ color }} />;
      case 'alipay':
        return <Zap size={18} style={{ color }} />;
      case 'bank':
        return <CreditCard size={18} style={{ color }} />;
      case 'cash':
        return <Wallet size={18} style={{ color }} />;
      default:
        return <PiggyBank size={18} style={{ color }} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1f2c] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <CreditCard size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">账户与资产管理</h3>
              <p className="text-[10px] text-gray-400 font-mono">
                当前共 {accounts.length} 个账户 · 总计额度 ¥{totalAsset.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Account Cards */}
          <div className="space-y-2">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202737] border border-gray-100 dark:border-gray-700/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: `${acc.color}18` }}
                  >
                    {renderIcon(acc.type, acc.color)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {ACCOUNT_TYPE_CONFIG[acc.type]?.label || '其它'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">余额</span>
                    <span className="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                      ¥{acc.balance.toFixed(2)}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(acc)}
                    title="删除账户"
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">
                暂无账户，记账时默认不绑定账户。
              </div>
            )}
          </div>

          {/* Add Account Inline Form */}
          {isAdding ? (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3 animate-in fade-in"
            >
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <span>新增资产账户</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setErrorMessage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-[11px]"
                >
                  取消
                </button>
              </div>

              {errorMessage && (
                <div className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name input */}
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">
                  账户名称
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：招商银行储蓄卡、美团月付、现金"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Account Type Selection */}
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">
                  账户类型
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(ACCOUNT_TYPE_CONFIG) as AccountType[]).map(typeKey => {
                    const cfg = ACCOUNT_TYPE_CONFIG[typeKey];
                    const isSel = newType === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setNewType(typeKey)}
                        className={`p-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1 transition ${
                          isSel
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-[#1a1f2c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {renderIcon(typeKey, isSel ? '#ffffff' : cfg.defaultColor)}
                        <span>{cfg.label.split('/')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">
                  初始余额 (元，可选)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={e => setNewBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-98 transition"
              >
                确认添加
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <Plus size={16} />
              <span>新建账户</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-[#151923]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
