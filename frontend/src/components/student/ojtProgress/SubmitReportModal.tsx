import React, { useState } from 'react';
import { X, UploadCloud, Paperclip } from 'lucide-react';
import type { WeeklyReportItem } from '@/types/student/ojtProgressTypes';

interface SubmitReportModalProps {
  report: WeeklyReportItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (reportId: string, data: { taskTitle: string; summary: string; challenges: string; fileName: string }) => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  report,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    taskTitle: '',
    summary: '',
    challenges: '',
    fileName: '',
  });

  if (!report) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.taskTitle.trim()) {
      alert('Vui lòng nhập tiêu đề nhiệm vụ!');
      return;
    }
    if (!form.summary.trim()) {
      alert('Vui lòng nhập nội dung tóm tắt công việc!');
      return;
    }
    onSubmit(report.id, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Nộp báo cáo thực tập - {report.weekLabel}
            </h3>
            <p className="text-xs text-slate-500">Thời gian: {report.dateRange}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              1. Tiêu đề nhiệm vụ / Task <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.taskTitle}
              onChange={(e) => setForm({ ...form, taskTitle: e.target.value })}
              placeholder="VD: Nghiên cứu quy trình CI/CD & Fix bug màn hình Login..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              2. Tóm tắt công việc đã thực hiện <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Mô tả ngắn gọn các task đã làm, công nghệ đã sử dụng..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">3. Khó khăn vướng mắc & Đề xuất</label>
            <textarea
              rows={2}
              value={form.challenges}
              onChange={(e) => setForm({ ...form, challenges: e.target.value })}
              placeholder="VD: Cần Mentor hỗ trợ thêm về phần cấp quyền..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              4. Đính kèm file báo cáo (.pdf, .docx, max 10MB)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:border-orange-400 transition-colors cursor-pointer relative">
              <UploadCloud size={24} className="mx-auto text-orange-500 mb-1" />
              <p className="text-xs font-semibold text-slate-700">
                Kéo thả file báo cáo vào đây hoặc <span className="text-orange-600 underline">Chọn file</span>
              </p>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm({ ...form, fileName: file.name });
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {form.fileName && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">
                  <Paperclip size={14} />
                  <span>{form.fileName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20 cursor-pointer"
            >
              Gửi báo cáo ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
