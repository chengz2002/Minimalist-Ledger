import React, { useState } from 'react';
import { Transaction } from '../types/ledger';
import { CategoryIcon } from './CategoryIcon';
import { Edit3, Trash2, ReceiptText } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onOpenAdd,
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) {
      acc[tx.date] = [];
    }
    acc[tx.date].push(tx);
    return acc;
  }, {});

  // Sort dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const getDateHeaderLabel = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const monthDay = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

    if (dateStr === today) {
      return `今天 ${monthDay} ${dayOfWeek}`;
    }
    if (dateStr === yesterday) {
      return `昨天 ${monthDay} ${dayOfWeek}`;
    }
    return `${monthDay} ${dayOfWeek}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 mb-4">
          <ReceiptText size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
          本期暂无账单数据
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mb-5">
          保持好习惯，笔笔记账掌握开支。点击下方按钮快速记录第一笔！
        </p>
        <button
          type="button"
          onClick={onOpenAdd}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 active:scale-95 transition"
        >
          立即记一笔
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-2 pb-24">
      {sortedDates.map(dateStr => {
        const list = grouped[dateStr];
        const dayExpense = list
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const dayIncome = list
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        return (
          <div
            key={dateStr}
            className="bg-white dark:bg-[#1e2433] rounded-2xl p-3 shadow-xs border border-gray-100/80 dark:border-gray-800/80"
          >
            {/* Daily Header Summary */}
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-400 border-b border-gray-50 dark:border-gray-800/60 pb-2 mb-1 px-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {getDateHeaderLabel(dateStr)}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                {dayExpense > 0 && (
                  <span>
                    支 <span className="font-mono text-gray-700 dark:text-gray-300">¥{dayExpense.toFixed(2)}</span>
                  </span>
                )}
                {dayIncome > 0 && (
                  <span>
                    收 <span className="font-mono text-gray-700 dark:text-gray-300">¥{dayIncome.toFixed(2)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* List of transactions for this date */}
            <div className="divide-y divide-gray-50 dark:divide-gray-800/40">
              {list.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 rounded-xl cursor-pointer transition active:scale-[0.99]"
                >
                  {/* Left: Category Icon */}
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon
                      name={tx.categoryIcon}
                      bgColor={tx.categoryColor}
                      size={18}
                      rounded={true}
                    />

                    {/* Middle info */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {tx.categoryName}
                          {tx.subcategoryName && (
                            <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-1">
                              · {tx.subcategoryName}
                            </span>
                          )}
                        </span>
                        {tx.accountName && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
                            {tx.accountName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 truncate">
                        {tx.remark ? (
                          <span className="truncate text-gray-600 dark:text-gray-300">{tx.remark}</span>
                        ) : (
                          <span>{tx.time || '记录于本地'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span
                      className={`font-mono text-base font-bold tracking-tight ${
                        tx.type === 'expense'
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    >
                      {tx.type === 'expense' ? '-' : '+'}
                      {tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400">{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Transaction Action Modal / Sheet */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <CategoryIcon
                name={selectedTx.categoryIcon}
                bgColor={selectedTx.categoryColor}
                size={22}
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedTx.categoryName}
                  {selectedTx.subcategoryName && (
                    <span className="text-xs font-normal text-blue-500 ml-1.5">
                      · {selectedTx.subcategoryName}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedTx.date} {selectedTx.time}
                  {selectedTx.accountName ? ` · ${selectedTx.accountName}` : ''}
                </div>
              </div>
              <div
                className={`text-lg font-mono font-bold ${
                  selectedTx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'
                }`}
              >
                {selectedTx.type === 'expense' ? '-' : '+'}¥{selectedTx.amount.toFixed(2)}
              </div>
            </div>

            {selectedTx.remark && (
              <div className="bg-gray-50 dark:bg-[#151923] p-3 rounded-xl text-xs text-gray-700 dark:text-gray-300">
                <span className="text-gray-400 mr-1">备注:</span>
                {selectedTx.remark}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const toDelete = selectedTx;
                  setSelectedTx(null);
                  if (window.confirm(`确定要删除这笔「${toDelete.categoryName} ¥${toDelete.amount}」账单吗？`)) {
                    onDelete(toDelete.id);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"
              >
                <Trash2 size={15} />
                <span>删除账单</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedTx;
                  setSelectedTx(null);
                  onEdit(toEdit);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-md shadow-blue-500/20"
              >
                <Edit3 size={15} />
                <span>编辑账单</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
