import React from 'react';
import { X, Paperclip, ArrowUpRight } from 'lucide-react';
import type { WeeklyReportItem } from '@/types/student/ojtProgressTypes';

interface ViewReportModalProps {
  report: WeeklyReportItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onDownloadFile?: (fileName: string) => void;
}

export const ViewReportModal: React.FC<ViewReportModalProps> = ({
  report,
  onClose,
  onDownloadFile,
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Nội dung Báo cáo - {report.weekLabel}
            </h3>
            <p className="text-xs text-slate-500">Thời gian thực tập: {report.dateRange}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl text-xs">
            <span className="text-slate-500">Thời gian nộp:</span>
            <span className="font-bold text-slate-800">{report.submittedAt || 'Chưa cập nhật'}</span>
          </div>

          {report.taskTitle && (
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Tiêu đề nhiệm vụ:</span>
              <p className="p-3 bg-orange-50/60 rounded-2xl text-orange-950 font-semibold border border-orange-100">
                {report.taskTitle}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <span className="font-bold text-slate-800 block">Tóm tắt công việc:</span>
            <p className="p-3 bg-slate-50 rounded-2xl text-slate-700 leading-relaxed">
              {report.summary || 'Không có mô tả.'}
            </p>
          </div>

          {report.challenges && (
            <div className="space-y-1">
              <span className="font-bold text-amber-700 block">Khó khăn vướng mắc:</span>
              <p className="p-3 bg-amber-50/60 rounded-2xl text-slate-700">
                {report.challenges}
              </p>
            </div>
          )}

          {report.fileName && (
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">File đính kèm:</span>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100">
                <span className="font-semibold text-orange-900 flex items-center gap-2">
                  <Paperclip size={16} className="text-orange-500" />
                  {report.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => onDownloadFile?.(report.fileName || 'report.pdf')}
                  className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Tải về <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          )}

          {report.mentorFeedback && (
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-900 block">💬 Nhận xét từ Mentor Doanh nghiệp:</span>
              <p className="text-slate-700 italic">"{report.mentorFeedback}"</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
