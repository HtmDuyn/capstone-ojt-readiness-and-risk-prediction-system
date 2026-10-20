import React from 'react';
import {
  X,
  Check,
  Building2,
  RefreshCw,
  Hash,
  CheckCircle2,
} from 'lucide-react';

interface ImportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToList: () => void;
  /** Từ API response commit */
  batchId?: number;
  replayed?: boolean;
  created?: number;
  updated?: number;
}

export const ImportSuccessModal: React.FC<ImportSuccessModalProps> = ({
  isOpen,
  onClose,
  onNavigateToList,
  batchId,
  replayed,
  created = 0,
  updated = 0,
}) => {
  if (!isOpen) return null;

  const total = created + updated;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Đóng thông báo thành công"
        >
          <X size={18} />
        </button>

        {/* Success icon & Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <Check size={32} className="stroke-[3]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Import thành công!</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Đã commit {total} doanh nghiệp vào hệ thống
          </p>
        </div>

        {/* Batch info from API */}
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {batchId !== undefined && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
              <Hash size={12} />
              Batch ID: {batchId}
            </span>
          )}
          {replayed !== undefined && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                replayed
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <RefreshCw size={12} />
              {replayed ? 'Replayed (idempotent)' : 'Import mới'}
            </span>
          )}
        </div>

        {/* 2 Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center space-y-1">
            <div className="text-xl font-black text-emerald-700">{created}</div>
            <div className="w-6 h-6 rounded-md bg-emerald-200/60 text-emerald-800 mx-auto flex items-center justify-center">
              <Building2 size={13} />
            </div>
            <p className="text-[10px] text-slate-600 font-medium">Doanh nghiệp tạo mới</p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-center space-y-1">
            <div className="text-xl font-black text-blue-700">{updated}</div>
            <div className="w-6 h-6 rounded-md bg-blue-200/60 text-blue-800 mx-auto flex items-center justify-center">
              <RefreshCw size={13} />
            </div>
            <p className="text-[10px] text-slate-600 font-medium">Doanh nghiệp cập nhật</p>
          </div>
        </div>

        {/* Next Steps Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 block">Hành động tiếp theo</span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              Đã tạo mới {created} doanh nghiệp vào hệ thống
            </li>
            {updated > 0 && (
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                Đã cập nhật thông tin {updated} doanh nghiệp hiện có
              </li>
            )}
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              Bạn có thể xem lại chi tiết trong danh sách doanh nghiệp
            </li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onNavigateToList}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
          >
            Xem danh sách doanh nghiệp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSuccessModal;
