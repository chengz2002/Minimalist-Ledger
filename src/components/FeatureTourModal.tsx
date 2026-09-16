import React, { useState } from 'react';
import {
  Calculator,
  FolderTree,
  ShieldAlert,
  PieChart,
  BellRing,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  X,
} from 'lucide-react';

interface FeatureTourModalProps {
  isOpen: boolean;
  onFinish: (clearDemoData: boolean) => void;
  onClose: () => void;
}

export const FeatureTourModal: React.FC<FeatureTourModalProps> = ({
  isOpen,
  onFinish,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: '拟真计算器与极速记账',
      subtitle: '3秒完成一笔账单，无需离开记账切计算器',
      icon: Calculator,
      color: '#2563eb',
      bgGradient: 'from-blue-600 to-indigo-600',
      highlights: [
        '键盘集成「+ - =」连续运算，录入如「25+18」实时求和',
        '独创「再记一笔」连击模式，保留分类与日期快速连记',
        '支持微信、支付宝、银行卡、现金等资产账户联动',
      ],
      tip: '点击右下角蓝色「+」号浮动按钮随时唤起记账键盘',
    },
    {
      title: '一级分类与长按二级细分',
      subtitle: '灵活细分子菜单，如餐饮美食 -> 早餐/午餐/晚餐',
      icon: FolderTree,
      color: '#f97316',
      bgGradient: 'from-orange-500 to-amber-600',
      highlights: [
        '长按任意一级分类图标（如餐饮），即可进入二级分类管理',
        '自由新增子项：早餐、午餐、晚餐、夜宵、外卖等',
        '记账时自动展开二级胶囊栏，对账列表清晰显示「分类 · 子项」',
      ],
      tip: '在记账分类面板长按图标 0.5 秒即可体验管理二级菜单',
    },
    {
      title: '预算监控与超支实时预警',
      subtitle: '科学把控开支节奏，超支即刻红线警报',
      icon: ShieldAlert,
      color: '#ef4444',
      bgGradient: 'from-rose-500 to-red-600',
      highlights: [
        '月度总预算与分类专属预算（如餐饮月度限额）双层监控',
        '根据当月剩余天数，实时动态换算「日均可用建议」',
        '支出达 80% 触发黄色预警，超支达 100% 触发鲜明红色警报',
      ],
      tip: '在底部「预算」标签页可随时根据实际需求调整每月额度',
    },
    {
      title: '多维可视化图表与明细检索',
      subtitle: '收支一目了然，支持关键字毫秒级搜索',
      icon: PieChart,
      color: '#10b981',
      bgGradient: 'from-emerald-500 to-teal-600',
      highlights: [
        '高清晰度分类占比环形图，点击扇区联动查看详细排行',
        '月初至月末每日消费柱状图，轻松掌握消费波峰',
        '支持按收支类型、支付账户、日期范围及备注模糊筛选',
      ],
      tip: '主页右上角漏斗图标可唤起复合筛选器',
    },
    {
      title: '闹钟式定时提醒与纯本地安全',
      subtitle: '100% 数据离线本地存储，告别商业广告与强制付费',
      icon: BellRing,
      color: '#8b5cf6',
      bgGradient: 'from-violet-600 to-purple-600',
      highlights: [
        '支持自定义每日提醒时刻（如 21:30）与周一至周日独立重复',
        '所有财务流水只保存在设备本地，无广告、无云端泄露隐患',
        '一键免费导出全量 JSON 备份与 Excel/CSV 对账明细表',
      ],
      tip: '在「我的/设置」页面可自由配置定时提醒与数据导出',
    },
  ];

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      // Finish tour: clear demo data and start clean
      onFinish(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#1e2433] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Visual Banner */}
        <div className={`p-6 bg-gradient-to-br ${step.bgGradient} text-white relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              功能导览 {currentStep + 1} / {tourSteps.length}
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
            <StepIcon size={26} className="text-white" />
          </div>

          <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">{step.subtitle}</p>
        </div>

        {/* Highlights List Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-2.5">
            {step.highlights.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-200">
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>

          {/* Quick Tip Box */}
          <div className="bg-gray-50 dark:bg-[#151923] p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-2">
            <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <span>小贴士：{step.tip}</span>
          </div>
        </div>

        {/* Step Dots & Bottom Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#171c28]">
          {/* Indicator Dots */}
          <div className="flex justify-center gap-1.5 mb-3">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-blue-600'
                    : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <ChevronLeft size={16} />
                <span>上一步</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1 active:scale-95 transition"
            >
              {isLast ? (
                <span>完成导览 · 开始我的记账</span>
              ) : (
                <>
                  <span>下一步</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Alternative choice on the last step */}
          {isLast && (
            <button
              type="button"
              onClick={() => onFinish(false)}
              className="w-full mt-2 text-center text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1"
            >
              暂不清除，保留体验数据
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
