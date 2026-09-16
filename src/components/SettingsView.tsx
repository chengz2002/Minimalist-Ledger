import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  Smartphone,
  Trash2,
  CheckCircle,
  Sparkles,
  BellRing,
  Clock,
  Calendar,
  Compass,
  LayoutGrid,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { ReminderConfig } from '../types/ledger';
import { ExportResultModal } from './ExportResultModal';

interface SettingsViewProps {
  onDataChanged: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  totalTransactionsCount: number;
  onStartTour: () => void;
  onOpenWidgetCenter?: () => void;
  onOpenAccountManager?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onDataChanged,
  isDarkMode,
  onToggleDarkMode,
  totalTransactionsCount,
  onStartTour,
  onOpenWidgetCenter,
  onOpenAccountManager,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Reminder state
  const [reminder, setReminder] = useState<ReminderConfig>(() => storageService.getReminder());
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [snapshotInfo, setSnapshotInfo] = useState(() => storageService.getSnapshotInfo());

  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
    setSnapshotInfo(storageService.getSnapshotInfo());
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleRestoreSnapshot = () => {
    if (!snapshotInfo.hasSnapshot) {
      showToast('未检测到有效历史快照');
      return;
    }
    const timeStr = snapshotInfo.time ? new Date(snapshotInfo.time).toLocaleString('zh-CN') : '近期';
    if (window.confirm(`确定要从本地安全自动快照中恢复吗？\n快照包含: ${snapshotInfo.count} 笔记录\n快照时间: ${timeStr}`)) {
      const ok = storageService.restoreFromSnapshot();
      if (ok) {
        showToast(`已成功恢复 ${snapshotInfo.count} 笔快照数据！`);
        onDataChanged();
      } else {
        showToast('恢复快照失败');
      }
    }
  };

  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    fileName: string;
    filePath: string;
    fileType: 'json' | 'csv';
  }>({
    isOpen: false,
    fileName: '',
    filePath: '',
    fileType: 'json',
  });

  const handleExportJSON = () => {
    const result = storageService.exportBackupFile();
    setExportModal({
      isOpen: true,
      fileName: result.fileName,
      filePath: result.filePath,
      fileType: 'json',
    });
  };

  const handleExportCSV = () => {
    const result = storageService.exportCSV();
    setExportModal({
      isOpen: true,
      fileName: result.fileName,
      filePath: result.filePath,
      fileType: 'csv',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        const result = storageService.importBackup(content, 'overwrite');
        if (result.success) {
          showToast(result.message);
          setReminder(storageService.getReminder());
          onDataChanged();
        } else {
          alert(result.message || '备份文件格式不符合要求，解析失败');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetSample = () => {
    if (window.confirm('确定要重置并恢复演示示例数据吗？')) {
      storageService.resetToSample();
      setReminder(storageService.getReminder());
      onDataChanged();
      showToast('已重置为示例账单数据');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('警告：确定要清空全部账单记录吗？建议操作前先导出备份文件。')) {
      storageService.clearAll();
      onDataChanged();
      showToast('已清空所有账单');
    }
  };

  // Reminder settings handlers
  const handleToggleReminder = async () => {
    const nextEnabled = !reminder.enabled;
    if (nextEnabled) {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(notificationService.getPermissionStatus());
      if (!granted && typeof window !== 'undefined' && 'Notification' in window) {
        showToast('请在手机或浏览器设置中允许通知权限');
      }
    }
    const updated = { ...reminder, enabled: nextEnabled };
    setReminder(updated);
    storageService.saveReminder(updated);
    notificationService.syncNativeReminder(updated);
    showToast(nextEnabled ? '记账定时提醒已开启' : '记账定时提醒已关闭');
  };

  const handleTimeChange = (newTime: string) => {
    const updated = { ...reminder, time: newTime };
    setReminder(updated);
    storageService.saveReminder(updated);
    notificationService.syncNativeReminder(updated);
  };

  const handleToggleDay = (day: number) => {
    let updatedDays = [...reminder.repeatDays];
    if (updatedDays.includes(day)) {
      if (updatedDays.length <= 1) {
        showToast('至少保留一天重复提醒');
        return;
      }
      updatedDays = updatedDays.filter(d => d !== day);
    } else {
      updatedDays.push(day);
      updatedDays.sort((a, b) => a - b);
    }
    const updated = { ...reminder, repeatDays: updatedDays };
    setReminder(updated);
    storageService.saveReminder(updated);
    notificationService.syncNativeReminder(updated);
  };

  const handleSetQuickDays = (type: 'all' | 'workday' | 'weekend') => {
    let days = [1, 2, 3, 4, 5, 6, 7];
    if (type === 'workday') days = [1, 2, 3, 4, 5];
    if (type === 'weekend') days = [6, 7];

    const updated = { ...reminder, repeatDays: days };
    setReminder(updated);
    storageService.saveReminder(updated);
    notificationService.syncNativeReminder(updated);
  };

  const handleTestNotification = async () => {
    await notificationService.requestPermission();
    setPermissionStatus(notificationService.getPermissionStatus());
    notificationService.sendNotification(
      '极简记账 · 每日记账提醒',
      '今天有哪些开销与收入呢？花几秒随手记一笔吧～'
    );
    showToast('测试提醒通知已发出！请下拉系统通知栏查看');
  };

  const dayLabels = [
    { label: '一', value: 1 },
    { label: '二', value: 2 },
    { label: '三', value: 3 },
    { label: '四', value: 4 },
    { label: '五', value: 5 },
    { label: '六', value: 6 },
    { label: '日', value: 7 },
  ];

  const getRepeatSummary = () => {
    if (reminder.repeatDays.length === 7) return '每天提醒';
    if (
      reminder.repeatDays.length === 5 &&
      [1, 2, 3, 4, 5].every(d => reminder.repeatDays.includes(d))
    )
      return '工作日提醒 (周一至周五)';
    if (
      reminder.repeatDays.length === 2 &&
      [6, 7].every(d => reminder.repeatDays.includes(d))
    )
      return '周末提醒 (周六、周日)';
    return `每周 ${reminder.repeatDays
      .map(d => dayLabels.find(l => l.value === d)?.label)
      .join('、')}`;
  };

  return (
    <div className="space-y-4 px-4 py-3 pb-28">
      {/* Toast message */}
      {feedbackMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* App Concept Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/15 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded">
              纯粹极简
            </span>
            <span className="text-xs text-blue-100">无广告 · 零干扰</span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1">极简记账 · 免费本地版</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs leading-relaxed">
            无开屏广告、无理财推销、绝不收费。所有账单100%离线存储在您的设备中，私密安全。
          </p>
        </div>
        <div className="absolute right-2 -bottom-4 text-white/10 pointer-events-none">
          <Smartphone size={110} />
        </div>
      </div>

      {/* Requirement 2: Daily Reminder Notifications Card (Alarm Clock style) */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BellRing size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">每日定时记账提醒</h3>
              <p className="text-[10px] text-gray-400">设置定时通知，养成每天记账好习惯</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleReminder}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              reminder.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                reminder.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Detailed reminder controls when enabled */}
        {reminder.enabled && (
          <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
            {/* Time Picker */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#151923] p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  提醒时间
                </span>
              </div>
              <input
                type="time"
                value={reminder.time}
                onChange={e => handleTimeChange(e.target.value)}
                className="font-mono font-bold text-sm bg-white dark:bg-[#1e2433] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Repeat Day Selector (Alarm style) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>重复周期 ({getRepeatSummary()})</span>
                </span>
                {/* Quick presets */}
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleSetQuickDays('workday')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  >
                    工作日
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDays('weekend')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  >
                    周末
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDays('all')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  >
                    每天
                  </button>
                </div>
              </div>

              {/* Day of Week Circle Pills */}
              <div className="grid grid-cols-7 gap-1.5">
                {dayLabels.map(item => {
                  const isChecked = reminder.repeatDays.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleToggleDay(item.value)}
                      className={`h-9 flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition active:scale-95 ${
                        isChecked
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <span>周{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test notification button */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                通知状态: {permissionStatus === 'granted' ? '已授权正常推送' : '需授予系统通知权限'}
              </span>
              <button
                type="button"
                onClick={handleTestNotification}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 active:scale-95 transition"
              >
                测试发送通知
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Backup & Export Section */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-2.5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-500" />
            <span>本地数据备份与导出（完全免费）</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">共 {totalTransactionsCount} 笔</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          许多商业记账软件将「数据导出与云端备份」设为高价付费 VIP，在极简记账中，您可以随时免费导出并自由迁移：
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 active:scale-95 transition"
          >
            <Download size={20} className="mb-1.5" />
            <span className="text-xs font-bold">导出全量备份</span>
            <span className="text-[10px] text-gray-400 mt-0.5">.JSON 完整账本</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 active:scale-95 transition"
          >
            <Upload size={20} className="mb-1.5" />
            <span className="text-xs font-bold">恢复历史备份</span>
            <span className="text-[10px] text-gray-400 mt-0.5">从 JSON 还原数据</span>
          </button>
        </div>

        {/* Export CSV for Excel */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#151923] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600">
              <FileSpreadsheet size={18} />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold">导出 Excel / CSV 格式表格</div>
              <div className="text-[10px] text-gray-400">含一级与二级分类，支持电脑 Office/WPS 打开无乱码</div>
            </div>
          </div>
          <span className="text-xs text-blue-500 font-semibold">一键导出</span>
        </button>

        {/* Restore from Auto Snapshot */}
        {snapshotInfo.hasSnapshot && (
          <button
            type="button"
            onClick={handleRestoreSnapshot}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 text-gray-800 dark:text-gray-200 border border-teal-200/80 dark:border-teal-900/40 hover:bg-teal-100/70 dark:hover:bg-teal-900/50 transition active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                <RotateCcw size={18} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-300">本地自动快照防丢恢复</div>
                <div className="text-[10px] text-gray-400">
                  快照含 {snapshotInfo.count} 笔记录 · 记账时全自动保护备份
                </div>
              </div>
            </div>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">一键还原</span>
          </button>
        )}
      </div>

      {/* App Preferences & Tools */}
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2.5">
          快捷管理与演示
        </h3>

        {/* Dark mode switch row */}
        <div className="flex items-center justify-between py-1">
          <div className="text-xs">
            <div className="font-semibold text-gray-800 dark:text-gray-200">深色夜间模式</div>
            <div className="text-[10px] text-gray-400">在低光环境下获得更柔和舒适的记账视觉</div>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isDarkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Re-enter Feature Tour Button */}
        <button
          type="button"
          onClick={onStartTour}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 text-gray-800 dark:text-gray-200 border border-blue-200/80 dark:border-blue-900/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Compass size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300">功能导览与说明</div>
              <div className="text-[10px] text-gray-400">重新浏览极速记账、二级分类与预算等特色功能</div>
            </div>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">进入导览</span>
        </button>

        {/* Widget Center Button */}
        {onOpenWidgetCenter && (
          <button
            type="button"
            onClick={onOpenWidgetCenter}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 text-gray-800 dark:text-gray-200 border border-indigo-200/80 dark:border-indigo-900/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <LayoutGrid size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">桌面小部件中心</div>
                <div className="text-[10px] text-gray-400">查看4×1通栏、4×2仪表盘、一键快捷记账部件</div>
              </div>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">查看部件</span>
          </button>
        )}

        {/* Account Manager Entry */}
        {onOpenAccountManager && (
          <button
            type="button"
            onClick={onOpenAccountManager}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 text-gray-800 dark:text-gray-200 border border-amber-200/80 dark:border-amber-900/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
                <CreditCard size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300">账户与资产管理</div>
                <div className="text-[10px] text-gray-400">管理微信、支付宝、银行卡等账户，支持新增与删除</div>
              </div>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">管理账户</span>
          </button>
        )}

        {/* Populate Sample Data */}
        <button
          type="button"
          onClick={handleResetSample}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#151923] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold">生成体验示例数据</div>
              <div className="text-[10px] text-gray-400">一键填充餐饮、工资、房租等典型账单</div>
            </div>
          </div>
          <span className="text-xs text-amber-600 font-medium">重置示例</span>
        </button>

        {/* Clear All Data */}
        <button
          type="button"
          onClick={handleClearAll}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#151923] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600">
              <Trash2 size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">清空所有账单</div>
              <div className="text-[10px] text-gray-400">仅保留分类与账户配置，清除流水记录</div>
            </div>
          </div>
          <span className="text-xs text-red-500 font-medium">清空</span>
        </button>
      </div>

      {/* About & Philosophy */}
      <div className="text-center pt-2 pb-4 text-xs text-gray-400 space-y-1">
        <p>极简记账 · 免费本地安卓版 v1.4.3</p>
        <p className="text-[10px]">坚持做一款真正好用、克制、纯粹的记账工具</p>
      </div>

      {/* Export Result Path Modal (Requires manual dismissal) */}
      <ExportResultModal
        isOpen={exportModal.isOpen}
        fileName={exportModal.fileName}
        filePath={exportModal.filePath}
        fileType={exportModal.fileType}
        onClose={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
