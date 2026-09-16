import React, { useState, useEffect } from 'react';
import { Delete, Check, PlusCircle, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { formatLocalDate } from '../services/storageService';

interface QuickKeypadProps {
  initialAmount?: number;
  onSave: (amount: number, continueAdding: boolean) => void;
  date: string;
  onDateClick: () => void;
  remark?: string;
  onRemarkChange?: (remark: string) => void;
  quickTags?: string[];
}

export const QuickKeypad: React.FC<QuickKeypadProps> = ({
  initialAmount = 0,
  onSave,
  date,
  onDateClick,
  remark,
  onRemarkChange,
  quickTags,
}) => {
  // Input string representing the current expression e.g. "25+18" or "35.50"
  const [expression, setExpression] = useState<string>(
    initialAmount > 0 ? initialAmount.toString() : ''
  );

  useEffect(() => {
    if (initialAmount > 0) {
      setExpression(initialAmount.toString());
    }
  }, [initialAmount]);

  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10); // subtle 10ms haptic feedback for Android
    }
  };

  // Helper to safely calculate expression
  const evaluateExpression = (expr: string): number => {
    if (!expr) return 0;
    try {
      // Clean trailing operators
      let cleanExpr = expr;
      if (cleanExpr.endsWith('+') || cleanExpr.endsWith('-')) {
        cleanExpr = cleanExpr.slice(0, -1);
      }
      if (!cleanExpr) return 0;

      // Simple safe parser for + and -
      const tokens = cleanExpr.match(/([+-]?[^+-]+)/g);
      if (!tokens) return 0;

      const sum = tokens.reduce((acc, token) => {
        const val = parseFloat(token);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      return Math.round(sum * 100) / 100;
    } catch {
      return 0;
    }
  };

  const hasOperator = expression.includes('+') || (expression.includes('-') && expression.indexOf('-') > 0);

  const handleKeyPress = (key: string) => {
    vibrate();

    if (key === 'clear') {
      setExpression('');
      return;
    }

    if (key === 'backspace') {
      setExpression(prev => prev.slice(0, -1));
      return;
    }

    if (key === '+' || key === '-') {
      if (!expression) return;
      // If ends with operator, replace it
      if (expression.endsWith('+') || expression.endsWith('-')) {
        setExpression(prev => prev.slice(0, -1) + key);
        return;
      }
      // If already has an operator, evaluate first then append operator
      if (hasOperator) {
        const currentResult = evaluateExpression(expression);
        setExpression(currentResult.toString() + key);
        return;
      }
      setExpression(prev => prev + key);
      return;
    }

    if (key === '.') {
      // Find the last number segment
      const lastOperatorIdx = Math.max(expression.lastIndexOf('+'), expression.lastIndexOf('-'));
      const currentSegment = lastOperatorIdx >= 0 ? expression.slice(lastOperatorIdx + 1) : expression;

      if (currentSegment.includes('.')) return; // prevent multiple dots
      if (!currentSegment) {
        setExpression(prev => prev + '0.');
      } else {
        setExpression(prev => prev + '.');
      }
      return;
    }

    // Number keys (0-9)
    // Check decimal places in current segment
    const lastOperatorIdx = Math.max(expression.lastIndexOf('+'), expression.lastIndexOf('-'));
    const currentSegment = lastOperatorIdx >= 0 ? expression.slice(lastOperatorIdx + 1) : expression;

    if (currentSegment.includes('.')) {
      const decimals = currentSegment.split('.')[1];
      if (decimals && decimals.length >= 2) return; // limit to 2 decimal places
    }

    if (currentSegment === '0' && key === '0') return;
    if (currentSegment === '0' && key !== '.') {
      // Replace leading single 0
      setExpression(prev => prev.slice(0, -1) + key);
      return;
    }

    setExpression(prev => prev + key);
  };

  const handleDone = (continueAdding: boolean) => {
    vibrate();
    const finalAmount = evaluateExpression(expression);
    if (finalAmount <= 0) return;

    onSave(finalAmount, continueAdding);
    if (continueAdding) {
      setExpression('');
    }
  };

  // Date formatted for quick pill
  const getShortDateLabel = (dateStr: string) => {
    const today = formatLocalDate();
    const yesterday = formatLocalDate(new Date(Date.now() - 86400000));
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return dateStr.slice(5); // MM-DD
  };

  const computedAmount = evaluateExpression(expression);

  return (
    <div className="w-full select-none bg-white dark:bg-[#1a1f2c] border-t border-gray-100 dark:border-gray-800 shadow-2xl">
      {/* Upper Formula & Live Preview row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80">
        <button
          type="button"
          onClick={() => { vibrate(); onDateClick(); }}
          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded-full active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
        >
          <CalendarIcon size={14} className="text-blue-500" />
          <span>{getShortDateLabel(date)}</span>
        </button>

        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
            <span className="text-base text-gray-400 mr-1 font-sans">¥</span>
            {expression || '0.00'}
          </div>
          {hasOperator && (
            <div className="text-xs text-gray-400 font-mono">
              = ¥{computedAmount.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Remark and Quick Tags Bar (Directly below Amount Input) */}
      {onRemarkChange && (
        <div className="px-4 py-2 bg-gray-50/70 dark:bg-[#151923]/70 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={remark || ''}
              onChange={e => onRemarkChange(e.target.value)}
              placeholder="添加备注（选填）..."
              className="flex-1 bg-transparent text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Quick Tag Chips */}
          {quickTags && quickTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 pb-0.5 no-scrollbar">
              {quickTags.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onRemarkChange(remark ? `${remark} ${t}` : t)}
                  className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 hover:text-blue-500 hover:border-blue-300 active:scale-95 transition"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid Keypad (4 columns x 4 rows) */}
      <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-gray-50 dark:bg-[#151923]">
        {/* Row 1 */}
        <button
          type="button"
          onClick={() => handleKeyPress('7')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('8')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('9')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('+')}
          className="h-13 py-3 text-xl font-medium bg-gray-100 dark:bg-[#273043] rounded-xl text-blue-600 dark:text-blue-400 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600 transition"
        >
          +
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => handleKeyPress('4')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('5')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('6')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('-')}
          className="h-13 py-3 text-xl font-medium bg-gray-100 dark:bg-[#273043] rounded-xl text-blue-600 dark:text-blue-400 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600 transition"
        >
          -
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => handleKeyPress('1')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('2')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('3')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('backspace')}
          className="h-13 py-3 flex items-center justify-center bg-gray-100 dark:bg-[#273043] rounded-xl text-gray-600 dark:text-gray-300 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600 transition"
        >
          <Delete size={22} />
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => handleKeyPress('.')}
          className="h-13 py-3 text-xl font-bold bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          .
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="h-13 py-3 text-xl font-medium bg-white dark:bg-[#202737] rounded-xl shadow-xs text-gray-800 dark:text-gray-100 active:scale-95 active:bg-gray-100 dark:active:bg-gray-700 transition"
        >
          0
        </button>

        {/* 再记一笔 (Save & Continue) */}
        <button
          type="button"
          disabled={computedAmount <= 0}
          onClick={() => handleDone(true)}
          className={`h-13 py-2 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition active:scale-95 ${
            computedAmount > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
              : 'bg-gray-100 dark:bg-[#202737] text-gray-300 dark:text-gray-600'
          }`}
        >
          <PlusCircle size={17} className="mb-0.5" />
          <span>再记一笔</span>
        </button>

        {/* 完成 / 计算结果 (Done) */}
        <button
          type="button"
          disabled={computedAmount <= 0}
          onClick={() => {
            if (hasOperator && !expression.endsWith('+') && !expression.endsWith('-')) {
              // If expression has operator, evaluate it first
              setExpression(computedAmount.toString());
            } else {
              handleDone(false);
            }
          }}
          className={`h-13 py-2 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition active:scale-95 ${
            computedAmount > 0
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-gray-200 dark:bg-[#273043] text-gray-400 dark:text-gray-600'
          }`}
        >
          {hasOperator && !expression.endsWith('+') && !expression.endsWith('-') ? (
            <span className="text-xl font-bold font-mono">=</span>
          ) : (
            <div className="flex items-center gap-1">
              <Check size={18} strokeWidth={2.5} />
              <span>完成</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
