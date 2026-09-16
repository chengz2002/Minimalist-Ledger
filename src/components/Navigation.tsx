import React from 'react';
import { ReceiptText, PieChart, ShieldAlert, Settings, Plus } from 'lucide-react';

export type TabType = 'timeline' | 'stats' | 'budget' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenRecord: () => void;
  isOverBudget?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenRecord,
  isOverBudget = false,
}) => {
  const showFAB = activeTab === 'timeline' || activeTab === 'stats';

  return (
    <>
      {/* Floating Action Button (FAB) - Elevated with generous spacing, shown only on timeline and stats */}
      {showFAB && (
        <button
          type="button"
          onClick={onOpenRecord}
          className="fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/35 flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all group animate-in fade-in duration-200"
          aria-label="记一笔"
        >
          <Plus size={30} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Bottom Bar Container */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#1a1f2c]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe transition-colors">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {/* Tab 1: 明细 */}
          <button
            type="button"
            onClick={() => onTabChange('timeline')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
              activeTab === 'timeline'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            }`}
          >
            <ReceiptText size={22} strokeWidth={activeTab === 'timeline' ? 2.5 : 2} />
            <span className="text-[11px] mt-1">明细</span>
          </button>

          {/* Tab 2: 统计 */}
          <button
            type="button"
            onClick={() => onTabChange('stats')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
              activeTab === 'stats'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            }`}
          >
            <PieChart size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
            <span className="text-[11px] mt-1">统计</span>
          </button>

          {/* Tab 3: 预算 */}
          <button
            type="button"
            onClick={() => onTabChange('budget')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors active:scale-95 relative ${
              activeTab === 'budget'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            }`}
          >
            <ShieldAlert size={22} strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
            <span className="text-[11px] mt-1">预算</span>
            {isOverBudget && (
              <span className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1a1f2c]" />
            )}
          </button>

          {/* Tab 4: 设置 / 我的 */}
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            }`}
          >
            <Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[11px] mt-1">我的</span>
          </button>
        </div>
      </nav>
    </>
  );
};
