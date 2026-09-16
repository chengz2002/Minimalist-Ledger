import React, { useState, useEffect } from 'react';
import { CheckCircle2, Copy, Check, FolderOpen, FileText, X } from 'lucide-react';
import { backButtonManager } from '../services/backButtonManager';

interface ExportResultModalProps {
  isOpen: boolean;
  fileName: string;
  filePath: string;
  fileType: 'json' | 'csv';
  onClose: () => void;
}

export const ExportResultModal: React.FC<ExportResultModalProps> = ({
  isOpen,
  fileName,
  filePath,
  fileType,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Register back button handler
  useEffect(() => {
    if (!isOpen) return;
    backButtonManager.register('export-result-modal', () => {
      onClose();
      return true;
    }, 110);

    return () => {
      backButtonManager.unregister('export-result-modal');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyPath = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(filePath);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = filePath;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy file path:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e2433] rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-100 dark:border-gray-800">
        {/* Header with Success Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                账单导出完成
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {fileType === 'csv' ? 'Excel / CSV 明细报表' : '全量 JSON 备份文件'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* File Details Box */}
        <div className="bg-gray-50 dark:bg-[#151923] rounded-2xl p-3.5 space-y-2.5 border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
              {fileName}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span className="flex items-center gap-1">
                <FolderOpen size={12} />
                <span>保存路径</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPath}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline active:scale-95 transition"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span className="text-emerald-500">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>复制路径</span>
                  </>
                )}
              </button>
            </div>

            <div
              onClick={handleCopyPath}
              className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1f2637] p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/60 break-all select-all cursor-pointer hover:border-blue-400 transition"
            >
              {filePath}
            </div>
          </div>
        </div>

        {/* Friendly Location Tips */}
        <div className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-100/50 dark:border-blue-900/30">
          <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
            <span>💡 如何查看文件：</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1">
            <li>打开手机自带的「文件管理」或「我的文件」应用；</li>
            <li>进入「Download」（下载）目录下的「极简记账」文件夹；</li>
            <li>可长按该文件通过微信/QQ发送，或连接电脑直接打开。</li>
          </ol>
        </div>

        {/* Manual Confirm Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-[0.99] transition"
        >
          我知道了
        </button>
      </div>
    </div>
  );
};
