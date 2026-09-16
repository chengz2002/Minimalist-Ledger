import { Category, Account, BudgetConfig, Transaction, ReminderConfig } from '../types/ledger';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories with preset subcategories
  {
    id: 'exp_food',
    name: '餐饮美食',
    type: 'expense',
    icon: 'Utensils',
    color: '#f97316',
    isDefault: true,
    subcategories: [
      { id: 'sub_food_breakfast', name: '早餐', parentId: 'exp_food' },
      { id: 'sub_food_lunch', name: '午餐', parentId: 'exp_food' },
      { id: 'sub_food_dinner', name: '晚餐', parentId: 'exp_food' },
      { id: 'sub_food_delivery', name: '外卖', parentId: 'exp_food' },
      { id: 'sub_food_snack', name: '夜宵小吃', parentId: 'exp_food' },
    ],
  },
  {
    id: 'exp_shopping',
    name: '日用百货',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#ec4899',
    isDefault: true,
    subcategories: [
      { id: 'sub_shop_daily', name: '超市日用', parentId: 'exp_shopping' },
      { id: 'sub_shop_clothes', name: '服饰鞋包', parentId: 'exp_shopping' },
      { id: 'sub_shop_beauty', name: '护肤美妆', parentId: 'exp_shopping' },
    ],
  },
  {
    id: 'exp_commute',
    name: '交通出行',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6',
    isDefault: true,
    subcategories: [
      { id: 'sub_com_subway', name: '公交地铁', parentId: 'exp_commute' },
      { id: 'sub_com_taxi', name: '打车出行', parentId: 'exp_commute' },
      { id: 'sub_com_gas', name: '车辆加油', parentId: 'exp_commute' },
      { id: 'sub_com_park', name: '停车路桥', parentId: 'exp_commute' },
    ],
  },
  {
    id: 'exp_home',
    name: '住房物业',
    type: 'expense',
    icon: 'Home',
    color: '#8b5cf6',
    isDefault: true,
    subcategories: [
      { id: 'sub_home_rent', name: '房租月供', parentId: 'exp_home' },
      { id: 'sub_home_util', name: '水电燃气', parentId: 'exp_home' },
      { id: 'sub_home_prop', name: '物业宽带', parentId: 'exp_home' },
    ],
  },
  {
    id: 'exp_play',
    name: '休闲娱乐',
    type: 'expense',
    icon: 'Gamepad2',
    color: '#06b6d4',
    isDefault: true,
    subcategories: [
      { id: 'sub_play_movie', name: '电影演出', parentId: 'exp_play' },
      { id: 'sub_play_game', name: '游戏充值', parentId: 'exp_play' },
      { id: 'sub_play_sport', name: '运动健身', parentId: 'exp_play' },
    ],
  },
  {
    id: 'exp_coffee',
    name: '咖啡零食',
    type: 'expense',
    icon: 'Coffee',
    color: '#eab308',
    isDefault: true,
    subcategories: [
      { id: 'sub_cof_coffee', name: '咖啡奶茶', parentId: 'exp_coffee' },
      { id: 'sub_cof_snack', name: '水果零食', parentId: 'exp_coffee' },
    ],
  },
  {
    id: 'exp_medical',
    name: '医疗保健',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#ef4444',
    isDefault: true,
    subcategories: [
      { id: 'sub_med_pill', name: '药品购买', parentId: 'exp_medical' },
      { id: 'sub_med_hosp', name: '诊疗体检', parentId: 'exp_medical' },
    ],
  },
  {
    id: 'exp_digital',
    name: '数码电器',
    type: 'expense',
    icon: 'Smartphone',
    color: '#14b8a6',
    isDefault: true,
    subcategories: [
      { id: 'sub_dig_phone', name: '数码配件', parentId: 'exp_digital' },
      { id: 'sub_dig_elec', name: '家用电器', parentId: 'exp_digital' },
    ],
  },
  {
    id: 'exp_social',
    name: '人情往来',
    type: 'expense',
    icon: 'Gift',
    color: '#f43f5e',
    isDefault: true,
    subcategories: [
      { id: 'sub_soc_gift', name: '请客送礼', parentId: 'exp_social' },
      { id: 'sub_soc_red', name: '随礼红包', parentId: 'exp_social' },
    ],
  },
  {
    id: 'exp_study',
    name: '教育提升',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#6366f1',
    isDefault: true,
    subcategories: [
      { id: 'sub_stu_book', name: '图书教材', parentId: 'exp_study' },
      { id: 'sub_stu_course', name: '课程培训', parentId: 'exp_study' },
    ],
  },
  {
    id: 'exp_other',
    name: '其它支出',
    type: 'expense',
    icon: 'CircleEllipsis',
    color: '#64748b',
    isDefault: true,
  },

  // Income categories
  {
    id: 'inc_salary',
    name: '工资薪酬',
    type: 'income',
    icon: 'Banknote',
    color: '#10b981',
    isDefault: true,
    subcategories: [
      { id: 'sub_inc_base', name: '基本工资', parentId: 'inc_salary' },
      { id: 'sub_inc_bonus', name: '奖金提成', parentId: 'inc_salary' },
    ],
  },
  {
    id: 'inc_parttime',
    name: '副业兼职',
    type: 'income',
    icon: 'Briefcase',
    color: '#3b82f6',
    isDefault: true,
  },
  {
    id: 'inc_invest',
    name: '理财收益',
    type: 'income',
    icon: 'TrendingUp',
    color: '#8b5cf6',
    isDefault: true,
  },
  {
    id: 'inc_redpacket',
    name: '人情红包',
    type: 'income',
    icon: 'Coins',
    color: '#f43f5e',
    isDefault: true,
  },
  {
    id: 'inc_other',
    name: '其它收入',
    type: 'income',
    icon: 'PiggyBank',
    color: '#06b6d4',
    isDefault: true,
  },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_wechat', name: '微信钱包', type: 'wechat', balance: 2580.50, icon: 'MessageCircle', color: '#07c160' },
  { id: 'acc_alipay', name: '支付宝', type: 'alipay', balance: 5320.00, icon: 'Zap', color: '#1677ff' },
  { id: 'acc_card', name: '招商银行卡', type: 'bank', balance: 18600.00, icon: 'CreditCard', color: '#f59e0b' },
  { id: 'acc_cash', name: '现金零钱', type: 'cash', balance: 350.00, icon: 'Wallet', color: '#64748b' },
];

export const DEFAULT_BUDGET: BudgetConfig = {
  monthlyTotal: 3500,
  categoryBudgets: {
    'exp_food': 1500,
    'exp_shopping': 800,
    'exp_commute': 400,
    'exp_play': 500,
  },
  alertThreshold: 0.8,
};

export const DEFAULT_REMINDER: ReminderConfig = {
  enabled: false,
  time: '21:30',
  repeatDays: [1, 2, 3, 4, 5, 6, 7], // Every day by default
};

// Realistic initial transactions with subcategory info
export function generateSampleTransactions(): Transaction[] {
  const today = new Date();
  const getFormatDate = (offsetDays: number) => {
    const d = new Date(today.getTime() - offsetDays * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return [
    {
      id: 'tx_sample_1',
      type: 'expense',
      amount: 38.5,
      categoryId: 'exp_food',
      categoryName: '餐饮美食',
      categoryIcon: 'Utensils',
      categoryColor: '#f97316',
      subcategoryId: 'sub_food_lunch',
      subcategoryName: '午餐',
      accountId: 'acc_wechat',
      accountName: '微信钱包',
      date: getFormatDate(0),
      time: '12:30',
      remark: '午餐煲仔饭',
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'tx_sample_2',
      type: 'expense',
      amount: 15.0,
      categoryId: 'exp_coffee',
      categoryName: '咖啡零食',
      categoryIcon: 'Coffee',
      categoryColor: '#eab308',
      subcategoryId: 'sub_cof_coffee',
      subcategoryName: '咖啡奶茶',
      accountId: 'acc_alipay',
      accountName: '支付宝',
      date: getFormatDate(0),
      time: '14:15',
      remark: '冰美式一杯',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'tx_sample_3',
      type: 'expense',
      amount: 6.0,
      categoryId: 'exp_commute',
      categoryName: '交通出行',
      categoryIcon: 'Car',
      categoryColor: '#3b82f6',
      subcategoryId: 'sub_com_subway',
      subcategoryName: '公交地铁',
      accountId: 'acc_wechat',
      accountName: '微信钱包',
      date: getFormatDate(0),
      time: '08:45',
      remark: '地铁上下班',
      createdAt: Date.now() - 3600000 * 6,
    },
    {
      id: 'tx_sample_4',
      type: 'expense',
      amount: 128.0,
      categoryId: 'exp_shopping',
      categoryName: '日用百货',
      categoryIcon: 'ShoppingBag',
      categoryColor: '#ec4899',
      subcategoryId: 'sub_shop_daily',
      subcategoryName: '超市日用',
      accountId: 'acc_alipay',
      accountName: '支付宝',
      date: getFormatDate(1),
      time: '19:40',
      remark: '超市采购纸巾与洗发水',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'tx_sample_5',
      type: 'expense',
      amount: 68.0,
      categoryId: 'exp_food',
      categoryName: '餐饮美食',
      categoryIcon: 'Utensils',
      categoryColor: '#f97316',
      subcategoryId: 'sub_food_dinner',
      subcategoryName: '晚餐',
      accountId: 'acc_wechat',
      accountName: '微信钱包',
      date: getFormatDate(1),
      time: '18:10',
      remark: '晚餐与朋友吃拉面',
      createdAt: Date.now() - 86400000 - 3600000,
    },
    {
      id: 'tx_sample_6',
      type: 'expense',
      amount: 50.0,
      categoryId: 'exp_play',
      categoryName: '休闲娱乐',
      categoryIcon: 'Gamepad2',
      categoryColor: '#06b6d4',
      subcategoryId: 'sub_play_movie',
      subcategoryName: '电影演出',
      accountId: 'acc_wechat',
      accountName: '微信钱包',
      date: getFormatDate(2),
      time: '20:30',
      remark: '周末看电影爆米花套餐',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'tx_sample_7',
      type: 'income',
      amount: 9500.0,
      categoryId: 'inc_salary',
      categoryName: '工资薪酬',
      categoryIcon: 'Banknote',
      categoryColor: '#10b981',
      subcategoryId: 'sub_inc_base',
      subcategoryName: '基本工资',
      accountId: 'acc_card',
      accountName: '招商银行卡',
      date: getFormatDate(4),
      time: '10:00',
      remark: '本月工资已发',
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'tx_sample_8',
      type: 'income',
      amount: 320.0,
      categoryId: 'inc_parttime',
      categoryName: '副业兼职',
      categoryIcon: 'Briefcase',
      categoryColor: '#3b82f6',
      accountId: 'acc_alipay',
      accountName: '支付宝',
      date: getFormatDate(6),
      time: '15:20',
      remark: '设计兼职项目结款',
      createdAt: Date.now() - 86400000 * 6,
    },
    {
      id: 'tx_sample_9',
      type: 'expense',
      amount: 1500.0,
      categoryId: 'exp_home',
      categoryName: '住房物业',
      categoryIcon: 'Home',
      categoryColor: '#8b5cf6',
      subcategoryId: 'sub_home_rent',
      subcategoryName: '房租月供',
      accountId: 'acc_card',
      accountName: '招商银行卡',
      date: getFormatDate(7),
      time: '09:00',
      remark: '交房租水电费',
      createdAt: Date.now() - 86400000 * 7,
    },
  ];
}

// Global mapping from common category names/aliases to standard category IDs
export const CATEGORY_ALIASES: Record<string, string> = {
  // Food / Dining
  '三餐': 'exp_food', '早饭': 'exp_food', '午饭': 'exp_food', '晚饭': 'exp_food',
  '早餐': 'exp_food', '午餐': 'exp_food', '晚餐': 'exp_food', '夜宵': 'exp_food',
  '零食': 'exp_food', '水果': 'exp_food', '饮品': 'exp_food', '咖啡': 'exp_food',
  '奶茶': 'exp_food', '外卖': 'exp_food', '买菜': 'exp_food', '餐饮': 'exp_food',
  '餐饮美食': 'exp_food', '食堂': 'exp_food', '小吃': 'exp_food', '酒水': 'exp_food',

  // Daily / Shopping
  '日用品': 'exp_shopping', '日用百货': 'exp_shopping', '超市': 'exp_shopping',
  '衣服': 'exp_shopping', '服饰': 'exp_shopping', '美妆': 'exp_shopping',
  '鞋包': 'exp_shopping', '数码': 'exp_shopping', '电器': 'exp_shopping',
  '电器数码': 'exp_shopping', '快递': 'exp_shopping', '购物': 'exp_shopping',
  '百货': 'exp_shopping', '日用': 'exp_shopping', '电子产品': 'exp_shopping',

  // Transportation / Commute
  '公交卡': 'exp_commute', '公交': 'exp_commute', '地铁': 'exp_commute',
  '公交地铁': 'exp_commute', '高铁': 'exp_commute', '火车': 'exp_commute',
  '打车': 'exp_commute', '交通': 'exp_commute', '交通出行': 'exp_commute',
  '加油': 'exp_commute', '汽车': 'exp_commute', '汽车/加油': 'exp_commute',
  '停车': 'exp_commute', '过路费': 'exp_commute', '出行': 'exp_commute', '机票': 'exp_commute',

  // Housing / Utilities
  '房租': 'exp_home', '住房': 'exp_home', '住房物业': 'exp_home',
  '水电煤': 'exp_home', '水电燃气': 'exp_home', '水电': 'exp_home',
  '物业': 'exp_home', '宽带': 'exp_home', '话费网费': 'exp_home', '话费': 'exp_home',
  '燃气': 'exp_home', '电费': 'exp_home', '水费': 'exp_home',

  // Entertainment / Leisure
  '娱乐': 'exp_play', '休闲': 'exp_play', '休闲娱乐': 'exp_play',
  '电影': 'exp_play', '游戏': 'exp_play', '运动': 'exp_play',
  '健身': 'exp_play', '酒店': 'exp_play', '旅游': 'exp_play', '门票': 'exp_play',
  '聚会': 'exp_play', 'KTV': 'exp_play', '网吧': 'exp_play',

  // Study / Education
  '学习': 'exp_study', '教育': 'exp_study', '教育提升': 'exp_study',
  '培训': 'exp_study', '图书': 'exp_study', '书籍': 'exp_study', '课程': 'exp_study',

  // Medical / Health / Other
  '医疗': 'exp_other', '看病': 'exp_other', '药品': 'exp_other', '药店': 'exp_other',
  '其它': 'exp_other', '其它支出': 'exp_other', '其他': 'exp_other', '其他支出': 'exp_other',

  // Income aliases
  '工资': 'inc_salary', '工资薪酬': 'inc_salary', '薪水': 'inc_salary',
  '兼职': 'inc_parttime', '副业兼职': 'inc_parttime', '副业': 'inc_parttime', '劳务费': 'inc_parttime',
  '理财': 'inc_invest', '理财收益': 'inc_invest', '投资': 'inc_invest', '利息': 'inc_invest',
  '生活费': 'inc_redpacket', '红包': 'inc_redpacket', '收红包': 'inc_redpacket', '人情红包': 'inc_redpacket',
  '其它收入': 'inc_other', '其他收入': 'inc_other', '报销': 'inc_other', '退款': 'inc_other',
};
