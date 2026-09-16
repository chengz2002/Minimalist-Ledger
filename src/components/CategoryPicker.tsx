import React, { useState, useRef } from 'react';
import { Category, TransactionType, Subcategory } from '../types/ledger';
import { CategoryIcon } from './CategoryIcon';
import { Plus, X, Trash2, Settings2 } from 'lucide-react';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (category: Category) => void;
  selectedSubcategoryId?: string;
  onSelectSubcategory: (subcat?: Subcategory) => void;
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
  onAddCategory?: (category: Omit<Category, 'id'>) => void;
  onAddSubcategory?: (categoryId: string, name: string) => void;
  onDeleteSubcategory?: (categoryId: string, subcategoryId: string) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedSubcategoryId,
  onSelectSubcategory,
  type,
  onTypeChange,
  onAddCategory,
  onAddSubcategory,
  onDeleteSubcategory,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  const [newSubcatName, setNewSubcatName] = useState('');

  // Add primary category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Long press timer ref
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const filteredCategories = categories.filter(c => c.type === type);
  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  const availableColors = [
    '#f97316', '#ec4899', '#3b82f6', '#8b5cf6',
    '#06b6d4', '#eab308', '#ef4444', '#14b8a6',
    '#10b981', '#6366f1', '#f43f5e', '#64748b',
  ];

  const availableIcons = [
    'Utensils', 'ShoppingBag', 'Car', 'Home', 'Gamepad2',
    'Coffee', 'HeartPulse', 'Smartphone', 'Gift', 'GraduationCap',
    'Banknote', 'Briefcase', 'TrendingUp', 'Coins', 'PiggyBank', 'Tag',
  ];

  // Long press handlers
  const handleTouchStart = (cat: Category, e?: React.TouchEvent) => {
    isLongPressRef.current = false;
    if (e && e.touches && e.touches[0]) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
      setManagingCategory(cat);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !e.touches[0]) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartPosRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClickCategory = (cat: Category) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onSelectCategory(cat);
    onSelectSubcategory(undefined); // Reset subcategory when switching parent
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (onAddCategory) {
      onAddCategory({
        name: newCatName.trim(),
        type,
        icon: newCatIcon,
        color: newCatColor,
      });
    }
    setNewCatName('');
    setShowAddModal(false);
  };

  const handleAddSubcatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcatName.trim() || !managingCategory) return;
    if (onAddSubcategory) {
      onAddSubcategory(managingCategory.id, newSubcatName.trim());
    }
    setNewSubcatName('');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#1a1f2c]">
      {/* Type Switcher Tabs (支出 / 收入) */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <div className="w-16" /> {/* spacer */}
        <div className="flex bg-gray-100 dark:bg-[#121620] p-1 rounded-xl w-44 shadow-inner">
          <button
            type="button"
            onClick={() => onTypeChange('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            收入
          </button>
        </div>
        <div className="w-16 text-right">
          <span className="text-[10px] text-gray-400">长按可管理</span>
        </div>
      </div>

      {/* Primary Categories Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-[130px] max-h-[190px]">
        <div className="grid grid-cols-5 gap-y-3 gap-x-2">
          {filteredCategories.map(cat => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onMouseDown={() => handleTouchStart(cat)}
                onMouseUp={handleTouchEnd}
                onTouchStart={(e) => handleTouchStart(cat, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onClick={() => handleClickCategory(cat)}
                className="flex flex-col items-center group active:scale-95 transition relative select-none"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#1a1f2c] shadow-md scale-105'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={20} color="#ffffff" />
                </div>
                <span
                  className={`text-[11px] mt-1 truncate max-w-[56px] text-center ${
                    isSelected
                      ? 'font-bold text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {cat.name}
                </span>

                {/* Little dot if has subcategories */}
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 ring-1 ring-white dark:ring-[#1a1f2c]" />
                )}
              </button>
            );
          })}

          {/* Add custom primary category */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center active:scale-95 transition group"
          >
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500">
              <Plus size={20} />
            </div>
            <span className="text-[11px] mt-1 text-gray-400">新建分类</span>
          </button>
        </div>
      </div>

      {/* Secondary Subcategories Pill Bar (Shown when active category has or can have subcategories) */}
      {currentCategory && (
        <div className="px-4 py-2 bg-gray-50/90 dark:bg-[#151923]/90 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              【{currentCategory.name}】二级细分
            </span>
            <button
              type="button"
              onClick={() => setManagingCategory(currentCategory)}
              className="text-[10px] text-blue-500 flex items-center gap-0.5 hover:underline"
            >
              <Settings2 size={11} />
              <span>管理二级</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {/* Default / No subcategory option */}
            <button
              type="button"
              onClick={() => onSelectSubcategory(undefined)}
              className={`shrink-0 px-2.5 py-1 text-xs rounded-full transition ${
                !selectedSubcategoryId
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              全部 / 默认
            </button>

            {/* List of subcategories under current category */}
            {currentCategory.subcategories?.map(sub => {
              const isSubSelected = sub.id === selectedSubcategoryId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectSubcategory(sub)}
                  className={`shrink-0 px-2.5 py-1 text-xs rounded-full transition ${
                    isSubSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}

            {/* Quick add subcategory chip button */}
            <button
              type="button"
              onClick={() => setManagingCategory(currentCategory)}
              className="shrink-0 px-2 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center gap-0.5"
            >
              <Plus size={13} />
              <span>添加二级</span>
            </button>
          </div>
        </div>
      )}

      {/* Subcategory Management Modal (Triggered by Long Press or Manage Button) */}
      {managingCategory && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <CategoryIcon
                  name={managingCategory.icon}
                  bgColor={managingCategory.color}
                  size={16}
                />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  管理【{managingCategory.name}】二级菜单
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManagingCategory(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current subcategories list */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">现有二级菜单</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 bg-gray-50 dark:bg-[#151923] rounded-2xl">
                {(managingCategory.subcategories || []).length > 0 ? (
                  managingCategory.subcategories?.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#1e2433] rounded-xl text-xs"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onDeleteSubcategory) {
                            onDeleteSubcategory(managingCategory.id, sub.id);
                            // Update local copy in modal
                            setManagingCategory(prev =>
                              prev
                                ? {
                                    ...prev,
                                    subcategories: (prev.subcategories || []).filter(s => s.id !== sub.id),
                                  }
                                : null
                            );
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-gray-400">
                    暂未添加二级分类，可在下方快速添加（如早餐、午餐、晚餐）
                  </div>
                )}
              </div>
            </div>

            {/* Add new subcategory input */}
            <form onSubmit={handleAddSubcatSubmit} className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={newSubcatName}
                onChange={e => setNewSubcatName(e.target.value)}
                placeholder="新增二级菜单名称（如：早餐）"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newSubcatName.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white disabled:opacity-50 active:scale-95 transition"
              >
                添加
              </button>
            </form>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setManagingCategory(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to add custom primary category */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              新建{type === 'expense' ? '支出' : '收入'}一级分类
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">分类名称</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="例如：健身、宠物..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151923] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">选择颜色</label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-6 h-6 rounded-full transition ${
                        newCatColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">选择图标</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 bg-gray-50 dark:bg-[#151923] rounded-xl">
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCatIcon(icon)}
                      className={`p-2 rounded-lg transition ${
                        newCatIcon === icon
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <CategoryIcon name={icon} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
